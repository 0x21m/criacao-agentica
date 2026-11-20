// Grade de horários livres (3.2, 5.13): o cliente escolhe o dia e o horário. Peça exportada do módulo Agenda para o
// Site (/site/agendar/, etapa Horário) e o Portal (/portal/agendar/); a tela /agenda/livres/ usa no balcão.
//
//   <GradeDeHorarios servico="limpeza-split" unidade="pampulha" aoEscolher={(h) => …} />          escolher (sem gravar)
//   <GradeDeHorarios servico="limpeza-split" reservar={{ origem: "site", aoReservar: (r) => … }} />  guarda 10 min (P)
//
// Mouse, toque (alvos de 44 px) e teclado: os dias e os horários são dois grupos de rádio com foco itinerante (setas,
// Home e End; Tab passa de um grupo ao outro). Estados: carregando ("Buscando horários livres…"), dia fechado (feriado),
// dia lotado (com o próximo dia livre), semana sem horário ("Sem horários livres até sáb, 21/11." + Próxima semana e
// "Prefere que a gente ligue?"), reserva guardada ("Horário guardado para você até 10:21.", sem contagem regressiva,
// PON-28), reserva perdida (frase da projeção + 3 próximos livres) e reserva expirada.
// Lê `agendamentos.use()` e `useAgora()`: chega pronta no HTML e muda sozinha quando outra aba reserva.
// BASE: não há leitura de "ocupações" separada do registro (D5): a grade lê a coleção inteira, mas só mostra horários;
//   cliente, histórico e técnico nunca vão para a tela. Quando a base tiver a projeção de disponibilidade, troque aqui.
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Esqueleto } from "@/components/app/estados"
import { FraseDoCliente } from "@/components/base/selos"
import { cn } from "@/lib/utils"
import { chaveDia, useAgora } from "@/proto/relogio"
import { FERIADOS, type Unidade } from "@/proto/negocio"
import { AGENDAMENTO } from "@/proto/projecao"
import { ANTECEDENCIA_MIN, agendamentos, expirarReservas, horariosLivres, ocupa, reservarHorario, type HorarioLivre, type ResultadoReserva } from "../dados"

export type ReservaFeita = Extract<ResultadoReserva, { ok: true }>

export type GradeDeHorariosProps = {
  /** Slug do serviço (SERVICOS de proto/negocio, o mesmo id do proto/site). */
  servico: string
  /** Só os técnicos desta unidade; sem ela, todos. */
  unidade?: Unidade | "todas"
  /** Horário escolhido, quando a tela controla (modo escolher). */
  valor?: Date | null
  /** Escolheu um horário livre (nos dois modos; no de reserva, só depois de guardado). */
  aoEscolher?: (h: HorarioLivre) => void
  /** Liga a reserva com prazo: ao escolher, guarda o horário por 10 min (P, atômico). */
  reservar?: {
    origem?: "site" | "portal"
    clienteId?: string
    /** Reserva que já existe (voltou para a etapa Horário): a grade mostra o horário guardado. */
    reservaId?: string
    aoReservar: (r: ReservaFeita) => void
    /** O prazo venceu: a tela que segura a reserva solta o resto (ex.: volta à etapa Horário). */
    aoExpirar?: () => void
  }
  /** Mostra "Prefere que a gente ligue?" quando a semana não tem horário. */
  aoPedirLigacao?: () => void
  /** A tela ainda está buscando (ex.: o CEP ainda não fechou a unidade). */
  carregando?: boolean
  rotulo?: string
  className?: string
}

const diaDe = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const somaDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const hm = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const semana = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
const ddmm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
const diaCurto = (d: Date) => `${semana(d)}, ${ddmm(d)}`
const nomeDia = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })

/** Setas, Home e End movem o foco e a escolha num grupo de rádio (foco itinerante, um só Tab por grupo). */
function teclas(e: KeyboardEvent, i: number, n: number, ir: (j: number) => void) {
  const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key]
  if (j === undefined) return
  e.preventDefault()
  ir((j + n) % n)
}

type Erro = { mensagem: string; sugestoes: HorarioLivre[]; conflito: boolean; tentar?: HorarioLivre }

export function GradeDeHorarios({ servico, unidade, valor, aoEscolher, reservar, aoPedirLigacao, carregando, rotulo = "Escolha o dia e o horário", className }: GradeDeHorariosProps) {
  const ags = agendamentos.use()
  const agora = useAgora()
  const hoje = diaDe(agora)
  const [pagina, setPagina] = useState(0)
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null)
  const [reservaId, setReservaId] = useState(reservar?.reservaId)
  const [enviando, setEnviando] = useState<number | null>(null)
  const [erro, setErro] = useState<Erro | null>(null)
  const [expirou, setExpirou] = useState(false)
  const refDias = useRef<(HTMLButtonElement | null)[]>([])
  const refHoras = useRef<(HTMLButtonElement | null)[]>([])
  const refStatus = useRef<HTMLDivElement>(null)
  const dicaId = useId()
  // no celular a resposta (guardado, perdeu) cai abaixo da dobra: traz para a vista sem pular a página
  const mostrarStatus = () => requestAnimationFrame(() => refStatus.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }))

  const reserva = reservaId ? ags.find((a) => a.id === reservaId) : undefined
  const reservaValida = reserva && reserva.estado === "reservado" && ocupa(reserva, agora) ? reserva : undefined

  // a semana da página: 7 dias corridos sem o domingo (a loja fecha); a primeira começa hoje. A reserva de quem está
  // na tela não ocupa a grade dele: o horário guardado continua lá, marcado.
  const dias = useMemo(() => {
    const ini = somaDias(hoje, pagina * 7)
    const outras = reservaValida ? ags.filter((a) => a.id !== reservaValida.id) : ags
    return Array.from({ length: 7 }, (_, i) => somaDias(ini, i)).filter((d) => d.getDay() !== 0).map((d) => {
      const livres = horariosLivres(servico, d, unidade, outras, agora)
      // lotado = a agenda encheu; "sem horário" = hoje já passou da antecedência (ANTECEDENCIA_MIN)
      const lotado = !livres.length && !horariosLivres(servico, d, unidade, outras, new Date(d.getFullYear(), d.getMonth(), d.getDate())).length
      return { d, chave: chaveDia(d), livres, lotado, feriado: FERIADOS[chaveDia(d)] }
    })
  }, [servico, unidade, ags, agora, pagina, hoje.getTime(), reservaValida?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const escolhido = reservar ? (reservaValida ? new Date(reservaValida.inicio) : null) : valor ?? null

  // a reserva venceu (PON-28): o sistema grava `expirado` e a grade avisa; qualquer reserva vencida também expira
  useEffect(() => {
    expirarReservas(agora)
    if (reservaId && reserva && !reservaValida && reserva.estado !== "solicitado" && reserva.estado !== "confirmado") {
      setReservaId(undefined); setExpirou(true); reservar?.aoExpirar?.()
    }
  }, [agora, reservaId, reserva?.estado]) // eslint-disable-line react-hooks/exhaustive-deps

  const selecionado = dias.find((x) => x.chave === diaEscolhido)
    ?? (escolhido && dias.find((x) => x.chave === chaveDia(escolhido)))
    ?? dias.find((x) => x.livres.length)
    ?? dias[0]
  const semanaVazia = dias.every((x) => !x.livres.length)
  const proximoDiaLivre = dias.find((x) => x.d > selecionado.d && x.livres.length)
  const manha = selecionado.livres.filter((h) => h.inicio.getHours() < 12)
  const tarde = selecionado.livres.filter((h) => h.inicio.getHours() >= 12)
  const indiceEscolhido = escolhido ? selecionado.livres.findIndex((h) => h.inicio.getTime() === escolhido.getTime()) : -1
  const focoHora = indiceEscolhido >= 0 ? indiceEscolhido : 0

  const irDia = (chave: string) => { setDiaEscolhido(chave); setErro(null) }
  const mudarPagina = (n: number) => { setPagina(n); setDiaEscolhido(null); setErro(null) }

  async function escolher(h: HorarioLivre) {
    setErro(null); setExpirou(false)
    if (!reservar) { aoEscolher?.(h); return }
    if (enviando !== null || (reservaValida && new Date(reservaValida.inicio).getTime() === h.inicio.getTime())) return
    setEnviando(h.inicio.getTime())
    const r = await reservarHorario({ servico, inicio: h.inicio, unidade, clienteId: reservar.clienteId, origem: reservar.origem, substitui: reservaValida?.id })
    setEnviando(null)
    if (r.ok) {
      setReservaId(r.id); setDiaEscolhido(chaveDia(r.inicio))
      reservar.aoReservar(r); aoEscolher?.(h)
    } else if (r.semResposta) {
      // "Resposta perdida": pode ter gravado. Se a reserva existe neste horário, é a dele; tentar de novo a recusaria
      const minha = agendamentos.ler().find((a) => a.estado === "reservado" && a.origem === (reservar.origem ?? "site") && a.servicoSlug === servico &&
        new Date(a.inicio).getTime() === h.inicio.getTime() && (a.clienteId || "") === (reservar.clienteId ?? "") && a.id !== reservaValida?.id)
      if (minha) setReservaId(minha.id)
      else setErro({ mensagem: r.mensagem, sugestoes: [], conflito: false, tentar: h })
    } else setErro({ mensagem: r.mensagem, sugestoes: r.sugestoes, conflito: r.motivo === "conflito", tentar: r.motivo === "falha" ? h : undefined })
    mostrarStatus()
  }

  if (carregando) {
    return (
      <div className={cn("grid gap-3", className)} aria-busy="true">
        <p className="text-sm text-muted-foreground" role="status">Buscando horários livres…</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-[4.25rem] rounded-xl" />)}</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{Array.from({ length: 9 }, (_, i) => <Esqueleto key={i} className="h-11 rounded-lg" />)}</div>
      </div>
    )
  }

  const ultimo = dias.at(-1)!.d
  const botaoHora = (h: HorarioLivre) => {
    const i = selecionado.livres.indexOf(h)
    const marcado = i === indiceEscolhido
    const ocupado = enviando === h.inicio.getTime()
    return (
      <button key={h.inicio.getTime()} ref={(el) => { refHoras.current[i] = el }} type="button" aria-pressed={marcado}
        tabIndex={i === focoHora ? 0 : -1} aria-busy={ocupado || undefined} disabled={enviando !== null && !ocupado}
        aria-label={`${diaCurto(h.inicio)}, ${hm(h.inicio)} a ${hm(h.fim)}`}
        onClick={() => void escolher(h)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") return
          teclas(e, i, selecionado.livres.length, (j) => refHoras.current[j]?.focus())
        }}
        className={cn(
          "num h-11 rounded-lg border border-border bg-[color-mix(in_oklch,var(--foreground)_3%,transparent)] text-sm font-medium tabular-nums outline-none transition-[background-color,border-color,color,scale] duration-150",
          "hover:border-primary/60 hover:bg-primary/8 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100 disabled:opacity-50",
          marcado && "border-primary bg-primary text-primary-foreground hover:bg-primary",
          ocupado && "animate-pulse motion-reduce:animate-none",
        )}>
        {ocupado ? "Guardando…" : hm(h.inicio)}
      </button>
    )
  }

  return (
    <div role="group" aria-label={rotulo} className={cn("grid min-w-0 gap-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-pretty">
          {pagina === 0 ? "Esta semana" : pagina === 1 ? "Próxima semana" : `Semana de ${ddmm(dias[0].d)}`}
          <span className="num font-normal text-muted-foreground"> · {ddmm(dias[0].d)} a {ddmm(ultimo)}</span>
        </p>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-lg" aria-label="Semana anterior" isDisabled={pagina === 0} onPress={() => mudarPagina(pagina - 1)}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon-lg" aria-label="Próxima semana" isDisabled={pagina >= 3} onPress={() => mudarPagina(pagina + 1)}><ChevronRight /></Button>
        </div>
      </div>

      <div role="radiogroup" aria-label="Dia" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {dias.map((x, i) => {
          const marcado = x.chave === selecionado.chave
          const sub = x.feriado ? "Feriado" : x.livres.length ? `${x.livres.length} ${x.livres.length === 1 ? "horário" : "horários"}` : x.lotado ? "Lotado" : "Sem horário"
          return (
            <button key={x.chave} ref={(el) => { refDias.current[i] = el }} type="button" role="radio" aria-checked={marcado} tabIndex={marcado ? 0 : -1}
              aria-label={`${x.chave === chaveDia(hoje) ? "hoje, " : ""}${semana(x.d)}, ${ddmm(x.d)}: ${x.feriado ? `feriado, ${x.feriado}` : x.livres.length ? `${sub} ${x.livres.length === 1 ? "livre" : "livres"}` : "sem horário livre"}`}
              onClick={() => irDia(x.chave)}
              onKeyDown={(e) => teclas(e, i, dias.length, (j) => { irDia(dias[j].chave); refDias.current[j]?.focus() })}
              className={cn(
                "grid min-h-[4.25rem] min-w-0 content-center justify-items-center gap-0.5 rounded-xl border border-border px-1 py-2 text-center outline-none transition-[background-color,border-color,color] duration-150",
                "hover:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/50",
                marcado ? "border-primary bg-primary/10 text-foreground" : "bg-[color-mix(in_oklch,var(--foreground)_3%,transparent)]",
                !x.livres.length && !marcado && "text-muted-foreground",
              )}>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{x.chave === chaveDia(hoje) ? "hoje" : semana(x.d)}</span>
              <span className="num text-[15px] font-semibold tabular-nums">{ddmm(x.d)}</span>
              <span className={cn("text-[13px]", x.livres.length ? "text-muted-foreground" : "text-alerta-texto", x.feriado && "text-muted-foreground")}>{sub}</span>
            </button>
          )
        })}
      </div>

      <div className="min-h-24">
        {semanaVazia ? (
          <div className="grid justify-items-start gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-sm text-pretty">Sem horários livres até {diaCurto(ultimo)}. Veja a próxima semana.</p>
            <div className="flex flex-wrap gap-2">
              {pagina < 3 && <Button size="sm" variant="outline" onPress={() => mudarPagina(pagina + 1)}>Próxima semana<ChevronRight /></Button>}
              {aoPedirLigacao && <Button size="sm" variant="ghost" onPress={aoPedirLigacao}><Phone />Prefere que a gente ligue?</Button>}
            </div>
          </div>
        ) : selecionado.feriado ? (
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-pretty">Feriado: {selecionado.feriado}. Loja fechada.</p>
        ) : !selecionado.livres.length ? (
          <div className="grid justify-items-start gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-sm text-pretty">{selecionado.chave === chaveDia(hoje) && !selecionado.lotado ? `Hoje não dá mais: marcamos com ${ANTECEDENCIA_MIN / 60} h de antecedência.` : `Sem horários livres em ${diaCurto(selecionado.d)}.`}</p>
            {proximoDiaLivre && <Button size="sm" variant="outline" onPress={() => irDia(proximoDiaLivre.chave)}>Ver {diaCurto(proximoDiaLivre.d)}<ChevronRight /></Button>}
          </div>
        ) : (
          <div role="group" aria-label={`Horários livres em ${nomeDia(selecionado.d)}`} aria-describedby={dicaId} className="grid gap-3">
            <p id={dicaId} className="sr-only">Setas andam entre os horários; Enter ou Espaço escolhe.</p>
            {[["Manhã", manha], ["Tarde", tarde]].map(([titulo, lista]) => (lista as HorarioLivre[]).length > 0 && (
              <div key={titulo as string} role="presentation" className="grid gap-1.5">
                <p aria-hidden className="text-[13px] text-muted-foreground">{titulo as string}</p>
                <div role="presentation" className="grid grid-cols-3 gap-2 sm:grid-cols-6">{(lista as HorarioLivre[]).map(botaoHora)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div ref={refStatus} className="scroll-mb-24">
        {erro ? (
          <div className="grid gap-2 rounded-xl bg-alerta/14 px-4 py-3">
            <p role="alert" className="text-sm text-pretty text-alerta-texto">{erro.mensagem}</p>
            {erro.sugestoes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {erro.sugestoes.map((h) => (
                  <Button key={h.inicio.getTime()} size="sm" variant="outline" className="num" onPress={() => { setDiaEscolhido(chaveDia(h.inicio)); void escolher(h) }}>
                    {diaCurto(h.inicio)} · {hm(h.inicio)}
                  </Button>
                ))}
              </div>
            )}
            {erro.tentar && <Button size="sm" variant="outline" className="justify-self-start" onPress={() => void escolher(erro.tentar!)}>Tentar de novo</Button>}
          </div>
        ) : reservaValida ? (
          <div role="status" className="flex items-start gap-2.5 rounded-xl bg-positive/12 px-4 py-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
            <div className="grid gap-0.5">
              <FraseDoCliente p={AGENDAMENTO.reservado} ctx={{ ate: reservaValida.reservadoAte }} className="font-medium" />
              <p className="num text-[13px] text-muted-foreground first-letter:uppercase">{nomeDia(new Date(reservaValida.inicio))}, {hm(new Date(reservaValida.inicio))} a {hm(new Date(reservaValida.fim))}</p>
            </div>
          </div>
        ) : expirou ? (
          <div role="status" className="flex items-start gap-2.5 rounded-xl bg-muted/60 px-4 py-3">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <FraseDoCliente p={AGENDAMENTO.expirado} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default GradeDeHorarios
