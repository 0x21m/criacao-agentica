// Módulo Agenda (5.4): AgendaInterativa ligada aos agendamentos e aos técnicos. Transplantada do laboratório da fase 3
// (sb-interativos); cabeçalho no CabecalhoPagina da base.
// Dia por recurso (5 técnicos + Bancada) e semana de um recurso (seg a sáb, sexta 20/11 feriado). No celular, um
// recurso por vez (chips) e, na semana, lista por dia. Mover e esticar gravam com Desfazer (8 s); arrastar no vazio,
// tocar num horário livre (celular) ou "Novo agendamento" abrem o diálogo já preenchido, com conflito ao vivo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { usePendentes, useProcessando } from "@/proto/dados"
import { AGORA_FIXO, chaveDia, useAgora } from "@/proto/relogio"
import { FERIADOS, RECURSOS, UNIDADES, expediente, recursoPorId, servicoPorSlug } from "@/proto/negocio"
import { AGENDAMENTO, type EstadoAgendamento } from "@/proto/projecao"
import { nomeCliente } from "@/modulos/clientes/dados"
import { agendamentos, expirarReservas, ocupa, remarcar, validarHorario, type Agendamento } from "../dados"
import { AgendaInterativa, hhmm, type BlocoAgenda, type ColunaAgenda, type PropostaAgenda } from "@/components/interativos/AgendaInterativa"
import { CalendarX } from "lucide-react"
import { NovoAgendamento } from "./NovoAgendamento"
import { DetalheAgendamento } from "./DetalheAgendamento"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { pode, regraDe, usePapel, usePessoa } from "@/proto/permissoes"

type Vista = "dia" | "semana"

const COR: Record<EstadoAgendamento, string> = {
  confirmado: "var(--primary)", solicitado: "var(--alerta)", reservado: "var(--muted-foreground)", em_atendimento: "var(--positive)",
  concluido: "var(--muted-foreground)", faltou: "var(--negative)", cancelado: "var(--muted-foreground)", expirado: "var(--muted-foreground)",
}
const diaSemana = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
const somaDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const segunda = (d: Date) => somaDias(d, -((d.getDay() + 6) % 7))

export default function AgendaOficina() {
  const ags = agendamentos.use()
  const pendentes = usePendentes()
  const processando = useProcessando()
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  // celular só depois de montar: o servidor não sabe a largura, e a barra de chips não pode mudar a hidratação
  const celularReal = useIsMobile(768)
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  const celular = montado && celularReal
  // vista, dia, recurso e o registro aberto vivem na URL: ?vista=semana&data=2026-11-18&recurso=elisa, ?id=AG-3340
  // (abre a folha no dia dele) e ?novo=1&data=…&recurso=…&inicio=10:00 (o "Novo agendamento" por link, do Início)
  const [f, setF] = useParametrosDaUrl({ vista: "dia", data: "", recurso: "", id: "", novo: "", inicio: "", unidades: "" })
  const papel = usePapel()
  const eu = usePessoa()
  const tecnico = papel === "tecnico" // ver_agenda "proprias": o técnico vê só a coluna dele
  // ver_agenda "unidade" (atendente): a grade abre só com a unidade dela; "Ver todas as unidades" (?unidades=todas) mostra
  // as outras para consulta, e os blocos de lá ficam travados (mover_agenda também é "unidade")
  const daUnidade = regraDe(papel, "ver_agenda") === "unidade" && eu.unidade !== "todas" ? eu.unidade : undefined
  const filtraUnidade = !!daUnidade && f.unidades !== "todas"
  const recursosVisiveis = useMemo(() => (filtraUnidade ? RECURSOS.filter((r) => r.unidade === daUnidade) : RECURSOS), [filtraUnidade, daUnidade])
  const vista: Vista = f.vista === "semana" ? "semana" : "dia"
  // o técnico só abre as visitas dele (ver_agenda "proprias"): a de outro técnico cai em "não está mais na agenda"
  const aberto = f.id ? ags.find((a) => a.id === f.id && (!tecnico || a.recursoId === eu.id)) : undefined
  const data = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f.data)
    if (m) return new Date(+m[1], +m[2] - 1, +m[3])
    const base = aberto ? new Date(aberto.inicio) : AGORA_FIXO
    return new Date(base.getFullYear(), base.getMonth(), base.getDate())
  }, [f.data, aberto?.inicio]) // eslint-disable-line react-hooks/exhaustive-deps
  const recurso = tecnico ? eu.id : recursoPorId(f.recurso) ? f.recurso : aberto?.recursoId ?? recursosVisiveis[0]?.id ?? "bruno"
  const setVista = (v: Vista) => setF({ vista: v === "dia" ? "" : v })
  const setData = (d: Date) => setF({ data: chaveDia(d) })
  const setRecurso = (r: string) => setF({ recurso: r })
  const [dialogo, setDialogo] = useState<PropostaAgenda | null>(null)
  useEffect(() => {
    if (f.novo !== "1") return
    const [hh, mm] = (/^\d{1,2}:\d{2}$/.test(f.inicio) ? f.inicio : "10:00").split(":").map(Number)
    const ini = new Date(data.getFullYear(), data.getMonth(), data.getDate(), hh, mm)
    setDialogo({ inicio: ini, fim: new Date(+ini + 60 * 6e4), recursoId: recurso })
  }, [f.novo]) // eslint-disable-line react-hooks/exhaustive-deps
  const fecharDialogo = () => { setDialogo(null); if (f.novo) setF({ novo: "", inicio: "" }) }
  const agora = useAgora()
  // clicar (sem arrastar) ou Enter num bloco abre a folha; o arrasto do @dnd-kit também termina em click, então um
  // ponteiro que andou mais de 5 px não conta
  const toque = useRef<{ x: number; y: number } | null>(null)
  const abrirBloco = (alvo: EventTarget, e?: { clientX: number; clientY: number }) => {
    const el = (alvo as HTMLElement).closest<HTMLElement>("[data-bloco-id]")
    if (!el) return
    if (e && toque.current && Math.hypot(e.clientX - toque.current.x, e.clientY - toque.current.y) > 5) return
    setF({ id: el.dataset.blocoId! })
  }

  const colunas: ColunaAgenda[] = useMemo(() => {
    const feriado = (x: Date) => FERIADOS[chaveDia(x)]
    if (vista === "dia") {
      const lista = celular || tecnico ? RECURSOS.filter((r) => r.id === recurso) : recursosVisiveis
      return lista.map((r) => ({
        id: r.id, dia: data, recursoId: r.id, titulo: r.nome, bloqueio: feriado(data) ? `Feriado: ${feriado(data)}. Loja fechada.` : undefined,
        expediente: expediente(data), vazio: "Livre o dia todo",
      }))
    }
    const seg = segunda(data)
    return Array.from({ length: 6 }, (_, i) => somaDias(seg, i)).map((x) => ({
      id: chaveDia(x), dia: x, recursoId: recurso, titulo: diaSemana(x),
      bloqueio: feriado(x) ? "Feriado · loja fechada" : undefined, expediente: expediente(x), vazio: "Livre",
    }))
  }, [vista, data, recurso, celular, tecnico, recursosVisiveis])

  // a reserva do site vencida sai da grade (PON-28); o sistema grava o "expirado" com evento
  useEffect(() => expirarReservas(agora), [agora])
  const podeMover = pode(papel, "mover_agenda")
  const moveAqui = (recursoId: string) => podeMover && pode(papel, "mover_agenda", { unidade: recursoPorId(recursoId)?.unidade })
  const podeCriar = pode(papel, "criar_pedido")
  const blocos: BlocoAgenda[] = useMemo(() => ags
    .filter((a) => ocupa(a, agora) && (!tecnico || a.recursoId === eu.id))
    .map((a) => ({
      id: a.id, inicio: new Date(a.inicio), fim: new Date(a.fim), recursoId: a.recursoId, rotulo: a.id,
      titulo: a.estado === "reservado" ? `${AGENDAMENTO.reservado.rotulo} ${AGENDAMENTO.reservado.detalhe?.({ ate: a.reservadoAte })}` : nomeCliente(a.clienteId),
      detalhe: `${a.id} · ${servicoPorSlug(a.servicoSlug)?.nome ?? ""}`,
      cor: COR[a.estado], tracejado: a.estado === "solicitado" || a.estado === "reservado",
      travado: !moveAqui(a.recursoId) || a.estado === "concluido" || a.estado === "em_atendimento" || a.estado === "reservado",
    })), [ags, agora, tecnico, eu.id, podeMover, papel])

  const validar = useCallback((p: PropostaAgenda, id?: string) => {
    const ag = id ? ags.find((a) => a.id === id) : undefined
    const v = validarHorario(p, ag?.servicoSlug, id, ags)
    return { motivo: v.motivo, conflitos: v.conflitos.map((a) => ({ id: a.id, inicio: new Date(a.inicio), fim: new Date(a.fim) })) }
  }, [ags])

  const titulo = vista === "dia"
    ? data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : `Semana de ${segunda(data).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} · ${recursoPorId(recurso)?.nome}`
  const passo = vista === "dia" ? 1 : 7
  const ehHoje = chaveDia(data) === chaveDia(agora)

  const novoEm = (base: Date) => {
    const ini = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 10, 0)
    setDialogo({ inicio: ini, fim: new Date(+ini + 60 * 6e4), recursoId: recurso })
  }
  const vazioDoDia = vista === "dia" && !FERIADOS[chaveDia(data)] && !!expediente(data) &&
    !blocos.some((b) => chaveDia(b.inicio) === chaveDia(data) && (!celular || b.recursoId === recurso))
  const novo = (className?: string) => (
    <Button size="sm" onPress={() => novoEm(vista === "dia" ? data : somaDias(segunda(data), 1))} aria-label="Novo agendamento" className={cn("pointer-coarse:min-w-10", className)}><CalendarPlus /><span className="max-sm:hidden">Novo agendamento</span></Button>
  )

  // No celular o cabeçalho tem duas faixas: vista e dia no banner; recursos e "Novo agendamento" na faixa de vidro
  // (o botão vai para o fim dela, fora da rolagem dos chips).
  return (
    <>
      <CabecalhoPagina titulo="Agenda" descricao={<span className="first-letter:uppercase">{titulo}</span>}
        vistas={[{ id: "dia", rotulo: "Dia" }, { id: "semana", rotulo: "Semana" }]} vista={vista} aoMudarVista={(v) => setVista(v as Vista)}
        acoes={
          <>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" className="pointer-coarse:size-10" aria-label={vista === "dia" ? "Dia anterior" : "Semana anterior"} onPress={() => setData(somaDias(data, -passo))}><ChevronLeft /></Button>
              <Button variant="outline" size="sm" className="max-sm:px-2 aria-[current=date]:border-transparent aria-[current=date]:bg-transparent aria-[current=date]:shadow-none dark:aria-[current=date]:bg-transparent" aria-current={ehHoje ? "date" : undefined} onPress={() => setData(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()))}>Hoje</Button>
              <Button variant="ghost" size="icon-sm" className="pointer-coarse:size-10" aria-label={vista === "dia" ? "Próximo dia" : "Próxima semana"} onPress={() => setData(somaDias(data, passo))}><ChevronRight /></Button>
            </div>
            {!celular && podeCriar && novo()}
          </>
        }>
        {!tecnico && (celular || vista === "semana") && (
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Recurso" data-nivel="flutuante" className="sup flex max-w-full min-w-0 flex-1 gap-1.5 overflow-x-auto rounded-full p-1.5 [scrollbar-width:none]">
              {recursosVisiveis.map((r) => (
                <button key={r.id} type="button" aria-pressed={recurso === r.id} onClick={() => setRecurso(r.id)}
                  className="h-8 shrink-0 rounded-full bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] px-3 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10 aria-pressed:bg-[color-mix(in_oklch,var(--foreground)_15%,transparent)] aria-pressed:font-semibold aria-pressed:text-foreground">
                  {r.curto}
                </button>
              ))}
            </div>
            {celular && podeCriar && novo("size-11 shrink-0 rounded-full")}
          </div>
        )}
      </CabecalhoPagina>
      <div className="px-4 pt-4 pb-6 md:px-6">
        <Legenda />
        <ComDados capacidade="ver_agenda" area="do atendimento" rotulo="a agenda"
          esqueleto={<div className="grid gap-2"><Esqueleto className="h-10 rounded-lg" /><Esqueleto className="h-[28rem] rounded-[var(--radius-xl)]" /></div>}
          estaVazio={ags.length === 0}
          vazio={<EstadoVazio icone={CalendarX} titulo="Nenhum agendamento ainda" texto="Arraste num horário livre ou use Novo agendamento para marcar a primeira visita." />}>
          {() => (
            <>
            {daUnidade && (
              <p className="mb-2.5 flex flex-wrap items-center gap-x-2 rounded-lg bg-muted/50 px-3 py-1 text-sm">
                <span>{filtraUnidade ? `Só a unidade ${UNIDADES[daUnidade].nome}.` : `Todas as unidades. Você mexe só na ${UNIDADES[daUnidade].nome}; as outras são para consulta.`}</span>
                <button type="button" className="link-sistema inline-flex min-h-10 items-center" onClick={() => setF({ unidades: filtraUnidade ? "todas" : "" })}>
                  {filtraUnidade ? "Ver todas as unidades" : `Só ${UNIDADES[daUnidade].nome}`}
                </button>
              </p>
            )}
            {f.id && !aberto && <p role="status" className="mb-2.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">{f.id} não está mais na agenda. <button type="button" className="link-sistema inline-flex min-h-10 items-center" onClick={() => setF({ id: "" })}>Fechar</button></p>}
            {vazioDoDia && (
              <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                <span>Nenhuma visita em {diaSemana(data).replace(".", "")}.</span>
                {podeCriar && <Button size="sm" variant="ghost" onPress={() => novoEm(data)}><CalendarPlus />Novo agendamento</Button>}
              </div>
            )}
            {celular && vista === "semana" ? (
            <ListaSemana ags={ags.filter((a) => a.recursoId === recurso && ocupa(a, agora))} inicio={segunda(data)} aoAbrir={(id) => setF({ id })} />
          ) : (
            <div onPointerDownCapture={(e) => { toque.current = { x: e.clientX, y: e.clientY } }}
              onClick={(e) => abrirBloco(e.target, e)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.defaultPrevented) abrirBloco(e.target) }}>
            <AgendaInterativa rotulo={vista === "dia" ? "Agenda do dia por recurso" : "Agenda da semana"} colunas={colunas} blocos={blocos}
              horaInicio={8} horaFim={18} agora={agora} validar={validar} pendentes={marcados}
              nomeRecurso={(id) => recursoPorId(id)?.nome ?? id}
              aoMover={(id, p, tipo) => remarcar(id, p, tipo)}
              aoCriar={(p) => { if (podeCriar) setDialogo(p) }} />
            </div>
            )}
            </>
          )}
        </ComDados>
      </div>
      <NovoAgendamento proposta={dialogo} onFechar={fecharDialogo} />
      <DetalheAgendamento id={aberto ? aberto.id : null} aoFechar={() => setF({ id: "" })} />
    </>
  )
}

function Legenda() {
  const itens: [string, string, boolean?][] = [
    ["Confirmado", COR.confirmado], ["Pedido pelo site", COR.solicitado, true], ["Reservado no site", COR.reservado, true], ["Em atendimento", COR.em_atendimento], ["Concluído", COR.concluido],
  ]
  return (
    <ul aria-label="Legenda" className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {itens.map(([t, c, tr]) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className={cn("bloco-agenda size-3 rounded-[3px]")} data-tracejado={tr || undefined} style={{ ["--evento" as string]: c }} />{t}
        </li>
      ))}
      <li className="flex items-center gap-1.5"><span className="bloco-agenda size-3 rounded-[3px]" data-conflito="" style={{ ["--evento" as string]: "var(--primary)" }} />Conflito</li>
      <li className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-negative" />Agora</li>
    </ul>
  )
}

function ListaSemana({ ags, inicio, aoAbrir }: { ags: Agendamento[]; inicio: Date; aoAbrir: (id: string) => void }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 6 }, (_, i) => somaDias(inicio, i)).map((x) => {
        const doDia = ags.filter((a) => chaveDia(new Date(a.inicio)) === chaveDia(x)).sort((a, b) => a.inicio.localeCompare(b.inicio))
        const fer = FERIADOS[chaveDia(x)]
        return (
          <section key={chaveDia(x)} aria-label={diaSemana(x)}>
            <h3 className="mb-1.5 text-[13px] font-semibold first-letter:uppercase">{x.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}</h3>
            {fer ? <p className="hachura rounded-lg px-3 py-2 text-xs">Feriado: {fer}. Loja fechada.</p>
              : doDia.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma visita.</p>
              : <ul className="grid gap-1.5">{doDia.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => aoAbrir(a.id)} className="bloco-agenda block min-h-10 w-full rounded-md px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-tracejado={a.estado === "solicitado" || a.estado === "reservado" || undefined} style={{ ["--evento" as string]: COR[a.estado] }}>
                      <span className="num text-xs text-muted-foreground">{hhmm(new Date(a.inicio).getHours() * 60 + new Date(a.inicio).getMinutes())}–{hhmm(new Date(a.fim).getHours() * 60 + new Date(a.fim).getMinutes())} · {a.id}</span>
                      <span className="block truncate text-sm font-medium">{a.estado === "reservado" ? `${AGENDAMENTO.reservado.rotulo} ${AGENDAMENTO.reservado.detalhe?.({ ate: a.reservadoAte })}` : nomeCliente(a.clienteId)}</span>
                      <span className="block text-xs text-muted-foreground">{AGENDAMENTO[a.estado].rotulo}</span>
                    </button>
                  </li>
                ))}</ul>}
          </section>
        )
      })}
    </div>
  )
}

