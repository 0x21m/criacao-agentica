// Módulo Início · os blocos do bento. Cada um nasce do Bloco (Superficie) e lê só o que recebe: a tela decide quem vê
// cada bloco pela capacidade (usePode) antes de montá-lo; nada aqui decide permissão de bloco inteiro.
// Arsenal (ARS-01): KPI-herói com GraficoQueDesenha (o SVG da fase 1, no lugar do peak-chart de canvas), barra de
// participação do stats-card-2 (Estoque), número-herói do market-card (A receber hoje), contagens do stats-bento
// (OS por etapa) e a faixa "o que pede ação" do kpis-operador (Atenção do dia). Status só pela projeção (SeloEixo).
import { useState, type ComponentType, type ReactNode } from "react"
import {
  ArrowDownRight, ArrowUpRight, CalendarCheck, CalendarClock, CalendarX2, CircleCheck, Clock3, Inbox, MessageCircle, MessageSquareWarning,
  PackageSearch, QrCode, Receipt, ShoppingCart, Sparkles, TriangleAlert, Vault, Wallet,
} from "lucide-react"
import { Superficie } from "@/components/sistema/Superficie"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { SeloEixo } from "@/components/base/selos"
import { Cortado } from "@/components/base/texto"
import { GraficoQueDesenha, PulsoAoVivo } from "@/components/movimento"
import { useCoresDoTema } from "@/lib/tema"
import { ehEscuro, useAparencia } from "@/proto/aparencia/aparencia"
import { moeda, moedaCompacta, numero, percentual } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { url } from "@/lib/url"
import { AGENDAMENTO, ATRASADA, formatosDaProjecao as fp, type Tom } from "@/proto/projecao"
import { pode, type Capacidade, type Papel } from "@/proto/permissoes"
import { chaveDia } from "@/proto/relogio"
import { expediente, recursoPorId, UNIDADES, type Recurso } from "@/proto/negocio"
import { atrasado, diasDeAtraso } from "@/modulos/pedidos/dados"
import type { Agendamento } from "@/modulos/agenda/dados"
import { nomeDe, situacao, type Lancamento } from "@/modulos/financeiro/dados"
import type { EscolhaUnidade } from "@/modulos/entrada/dados"
import {
  agendaDeHoje, caixasDoDia, conflitos, pagarDeHoje, pixVencidos, porColuna, receberVencidos, recursosDa, resumoEstoque, resumoMensagens,
  ultimoComDiferenca, type Fontes, type Periodo,
} from "../dia"
import { Bloco, LinhaLink, LinkVer, Numero, VazioDoBloco } from "./pecas"

export type Nome = (id: string) => string

// ===================================================== KPI-herói =====================================================
const PERIODOS = [{ id: "semana", rotulo: "Semana" }, { id: "mes", rotulo: "Mês" }]

/** Saturação (HSL, 0 a 1) de uma cor em hex: preset de acento cinza usa a cor do herói. */
function saturacao(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
}

/**
 * O KPI-herói: a versão mais intensa do mesmo material (Superficie nível destaque; vidro líquido no preset Vidro claro).
 * Uma moldura só: o gráfico é SVG (GraficoQueDesenha). O número grande é o do período; o detalhe compara.
 */
export function Heroi({ titulo, icone: Icone, rotuloNumero, serie, formatoPonto, numero: numeroDe, formato, detalhe }: {
  titulo: string; icone: ComponentType<{ className?: string }>
  serie: (p: Periodo) => { dados: number[]; rotulos: string[] }
  formatoPonto: (v: number) => string
  /** O número grande do período; sem ele, a soma da série (o número sempre bate com o gráfico). */
  numero?: (p: Periodo) => number
  rotuloNumero: (p: Periodo) => string
  formato: "moeda" | "numero"; detalhe: (p: Periodo) => ReactNode
}) {
  const ap = useAparencia()
  const liquido = ap.preset === "vidro" && ap.vidro && !ehEscuro(ap)
  const [periodo, setPeriodo] = useState<Periodo>("mes")
  const cores = useCoresDoTema({ a: "--chart-1", h: "--chart-heroi" })
  const cor = cores && saturacao(cores.a) < 0.25 ? "var(--chart-heroi)" : "var(--chart-1)"
  const s = serie(periodo)
  const vazio = s.dados.every((v) => v === 0)
  const n = numeroDe ? numeroDe(periodo) : s.dados.reduce((a, v) => a + v, 0)
  return (
    <Superficie nivel="destaque" material={liquido ? "vidro" : undefined} refracao={liquido} raio={28} como="figure" aria-label={titulo}
      className="m-0 flex h-full min-w-0 flex-col gap-4 p-4 md:p-5">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="t-card flex items-center gap-2"><Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{titulo}</h2>
        <div className="flex min-h-10 w-40 items-center"><SegmentadoDeVidro aria-label="Período do gráfico" valor={periodo} aoMudar={(v) => setPeriodo(v as Periodo)} material="regular" opcoes={PERIODOS}
          cor={ehEscuro(ap) ? "var(--destaque-para)" : undefined} className={ehEscuro(ap) ? "tinta-destaque" : undefined} /></div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{rotuloNumero(periodo)}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="t-assinatura"><Numero valor={n} formato={formato} /></p>
          <div className="text-xs text-muted-foreground">{detalhe(periodo)}</div>
        </div>
      </div>
      {vazio ? (
        <p className="mt-auto grid h-[190px] place-items-center rounded-[var(--radius)] border border-dashed border-[color-mix(in_oklch,var(--foreground)_14%,transparent)] text-sm text-muted-foreground">Nada no período ainda.</p>
      ) : (
        <GraficoQueDesenha key={periodo} entrada="sempre" dados={s.dados} rotulos={s.rotulos} formatar={formatoPonto} titulo={`${titulo} por dia`} altura={190} cor={cor} className="mt-auto" />
      )}
    </Superficie>
  )
}

/** "−14,3 % que outubro, no mesmo período": seta e tom pelo sentido (subir é bom). */
export function Comparacao({ atual, anterior, mes }: { atual: number; anterior: number; mes: string }) {
  if (!anterior) return <span>Sem base em {mes} para comparar.</span>
  const v = atual / anterior - 1
  const sobe = v >= 0
  const I = sobe ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className={cn("num inline-flex items-center gap-0.5 font-semibold whitespace-nowrap", sobe ? "text-positive" : "text-negativo-texto")}>
        <I className="size-3.5" aria-hidden="true" />{sobe ? "+" : "−"}{percentual(Math.abs(v))}
      </span>
      <span>que {mes}, no mesmo período</span>
    </span>
  )
}

// ===================================================== Atenção do dia =====================================================
type Item = { id: string; icone: ComponentType<{ className?: string }>; tom: Tom; titulo: string; detalhe?: ReactNode; selo?: ReactNode; caminho: string }

const TOM_ICONE: Record<Tom, string> = {
  perigo: "bg-destructive/12 text-negativo-texto", aviso: "bg-[color-mix(in_oklch,var(--alerta)_20%,transparent)] text-alerta-texto",
  info: "bg-[color-mix(in_oklch,var(--chart-1)_16%,transparent)] text-foreground", neutro: "bg-muted text-muted-foreground", sucesso: "bg-positive/14 text-positive",
}
const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`

/** O que pede ação hoje, na ordem de gravidade. Cada item é gated pela capacidade e leva ao objeto exato (PON-19). */
export function itensDeAtencao(f: Fontes, agora: Date, papel: Papel, nome: Nome, financeira: boolean): Item[] {
  const pd = (c: Capacidade) => pode(papel, c)
  const itens: Item[] = []
  if (!financeira && pd("ver_pedidos")) {
    const atr = f.pedidos.filter((p) => atrasado(p, agora)).sort((a, b) => a.prazo.localeCompare(b.prazo))
    if (atr.length) itens.push({
      id: "atrasadas", icone: TriangleAlert, tom: "perigo", titulo: plural(atr.length, "OS atrasada", "OS atrasadas"), caminho: "pedidos/?atrasados=1",
      detalhe: `A mais antiga: ${atr[0].id} · ${nome(atr[0].clienteId)}`, selo: <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(atr[0], agora) }} detalhe />,
    })
  }
  if (!financeira && pd("ver_agenda")) {
    for (const [a, b] of conflitos(agendaDeHoje(f.agendamentos, agora))) itens.push({
      id: `conflito-${a.id}`, icone: CalendarX2, tom: "perigo", titulo: `Conflito ${a.id} × ${b.id}`, caminho: "agenda/",
      detalhe: `${recursoPorId(a.recursoId)?.curto ?? "Recurso"}: ${fp.h(a.inicio)}–${fp.h(a.fim)} e ${fp.h(b.inicio)}–${fp.h(b.fim)}`,
    })
  }
  if (!financeira && pd("ver_pedidos")) {
    const hoje = chaveDia(agora), amanha = chaveDia(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1))
    for (const p of f.pedidos.filter((x) => x.etapa === "aguardando_aprovacao" && x.orcamento?.validoAte)) {
      const v = new Date(p.orcamento!.validoAte!), dia = chaveDia(v)
      const venceu = v < agora
      if (!venceu && dia !== hoje && dia !== amanha) continue
      itens.push({
        id: `orc-${p.id}`, icone: Clock3, tom: venceu ? "perigo" : "aviso", caminho: `pedidos/?id=${p.id}`,
        titulo: venceu ? `Orçamento da ${p.id} venceu` : `Orçamento da ${p.id} vence ${dia === hoje ? "hoje" : "amanhã"}`, detalhe: nome(p.clienteId),
      })
    }
  }
  if (!financeira && pd("ver_agenda")) {
    const pedidosSite = f.agendamentos.filter((a) => a.estado === "solicitado" && new Date(a.fim) > agora).sort((a, b) => a.inicio.localeCompare(b.inicio))
    for (const a of pedidosSite) itens.push({
      id: `ag-${a.id}`, icone: CalendarClock, tom: "aviso", titulo: `${a.id} a confirmar`, caminho: "agenda/",
      detalhe: `${nome(a.clienteId)} · ${fp.ds(a.inicio)}, ${fp.h(a.inicio)}`, selo: <SeloEixo p={AGENDAMENTO.solicitado} />,
    })
  }
  if (!financeira && pd("ver_pedidos")) {
    const novas = f.pedidos.filter((p) => p.etapa === "solicitada").sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    if (novas.length) itens.push({
      id: "novas", icone: Sparkles, tom: "info", titulo: plural(novas.length, "OS nova sem horário", "OS novas sem horário"), caminho: "pedidos/?etapa=solicitada",
      detalhe: `A mais recente: ${novas[0].id} · ${nome(novas[0].clienteId)}`,
    })
  }
  if (!financeira && pd("mensagens")) {
    const m = resumoMensagens(f.conversas, f.mensagens)
    if (m.naoLidas) itens.push({
      id: "mensagens", icone: MessageCircle, tom: "info", titulo: plural(m.naoLidas, "mensagem não lida", "mensagens não lidas"), caminho: m.recentes.length === 1 ? `mensagens/?conversa=${m.recentes[0].c.id}` : "mensagens/",
      detalhe: m.recentes.length === 1 ? nome(m.recentes[0].c.clienteId) : `Em ${numero(m.recentes.length)} conversas`,
    })
    if (m.falhas) itens.push({ id: "falhas", icone: MessageSquareWarning, tom: "perigo", titulo: plural(m.falhas, "mensagem não enviada", "mensagens não enviadas"), caminho: "mensagens/", detalhe: "Abra a conversa e tente de novo" })
  }
  if (!financeira && pd("estoque_movimentar")) {
    for (const c of resumoEstoque(f.produtos, f.compras, agora).comprasAtrasadas) itens.push({
      id: `cmp-${c.id}`, icone: ShoppingCart, tom: "aviso", titulo: `Compra ${c.id} atrasada`, caminho: `estoque/compras/?id=${c.id}`, detalhe: `${c.fornecedor} · previsão ${fp.d(c.previsao)}`,
    })
  }
  if (pd("financeiro_painel")) {
    const venc = receberVencidos(f.lancamentos, agora)
    if (venc.length) itens.push({
      id: "receber-vencidos", icone: Receipt, tom: "perigo", titulo: plural(venc.length, "título vencido a receber", "títulos vencidos a receber"), caminho: "financeiro/receber/",
      detalhe: <span className="num whitespace-nowrap">{moeda(venc.reduce((s, l) => s + l.valor, 0))}</span>,
    })
    for (const l of pixVencidos(f.lancamentos, agora)) itens.push({
      id: `pix-${l.id}`, icone: QrCode, tom: "perigo", titulo: `Pix da ${l.ref ?? l.id} expirou`, caminho: `financeiro/receber/?id=${l.id}`,
      detalhe: nomeDe(l), selo: <SeloEixo {...situacao(l, agora)} />,
    })
  }
  if (financeira && pd("pagar")) {
    const pv = f.lancamentos.filter((l) => l.natureza === "pagar" && situacao(l, agora).p.tom === "perigo")
    if (pv.length) itens.push({
      id: "pagar-vencidos", icone: Wallet, tom: "perigo", titulo: plural(pv.length, "conta vencida a pagar", "contas vencidas a pagar"), caminho: "financeiro/pagar/",
      detalhe: <span className="num whitespace-nowrap">{moeda(pv.reduce((s, l) => s + l.valor, 0))}</span>,
    })
    const hoje = pagarDeHoje(f.lancamentos, agora)
    if (hoje.length) itens.push({ id: "pagar-hoje", icone: Wallet, tom: "aviso", titulo: plural(hoje.length, "conta vence hoje", "contas vencem hoje"), caminho: "financeiro/pagar/", detalhe: <span className="num whitespace-nowrap">{moeda(hoje.reduce((s, l) => s + l.valor, 0))}</span> })
  }
  if (financeira && pd("fechar_caixa")) {
    const cx = ultimoComDiferenca(f.caixas)
    if (cx) itens.push({
      id: `cx-${cx.id}`, icone: Vault, tom: "aviso", caminho: `financeiro/caixa/?unidade=${cx.unidade}`,
      titulo: `Caixa de ${fp.ds(`${cx.data}T12:00:00`)} fechou com diferença`, detalhe: <span><span className="num whitespace-nowrap">{cx.diferenca! < 0 ? "−" : "+"}{moeda(Math.abs(cx.diferenca!))}</span> · {UNIDADES[cx.unidade].nome}</span>,
    })
  }
  const peso: Record<Tom, number> = { perigo: 0, aviso: 1, info: 2, neutro: 3, sucesso: 4 }
  return itens.map((it, i) => ({ it, i })).sort((a, b) => peso[a.it.tom] - peso[b.it.tom] || a.i - b.i).map((x) => x.it)
}

const MAX_ATENCAO = 6
export function Atencao({ itens, erro }: { itens: Item[]; erro?: boolean }) {
  const [todas, setTodas] = useState(false)
  const vistos = todas ? itens : itens.slice(0, MAX_ATENCAO)
  const contagem = numero(itens.length)
  return (
    <Bloco titulo="Atenção do dia" icone={TriangleAlert} erro={erro ? "a atenção do dia" : undefined}
      acao={itens.length > 0 && <span className="num rounded-full bg-[color-mix(in_oklch,var(--alerta)_22%,transparent)] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-alerta-texto" aria-label={plural(itens.length, "pendência", "pendências")}>{contagem}</span>}>
      {itens.length === 0 ? (
        <VazioDoBloco icone={CircleCheck} titulo="Tudo em dia. Nenhuma pendência para hoje." acao={<LinkVer caminho="agenda/">Ver a agenda da semana</LinkVer>} />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {vistos.map((it) => (
            <li key={it.id} className="border-t border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] first:border-t-0">
              <LinhaLink caminho={it.caminho} className="grid-cols-[2rem_minmax(0,1fr)]">
                <span className={cn("grid size-8 place-items-center rounded-full", TOM_ICONE[it.tom])}><it.icone className="size-4" aria-hidden="true" /></span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium" title={it.titulo}>{it.titulo}</span>
                    {it.selo && <span className="hidden max-w-[55%] shrink-0 sm:flex">{it.selo}</span>}
                  </span>
                  {it.detalhe && (typeof it.detalhe === "string"
                    ? <Cortado texto={it.detalhe} className="text-[0.8125rem] text-muted-foreground" />
                    : <span className="truncate text-[0.8125rem] text-muted-foreground">{it.detalhe}</span>)}
                </span>
              </LinhaLink>
            </li>
          ))}
        </ul>
      )}
      {itens.length > MAX_ATENCAO && (
        <button type="button" onClick={() => setTodas((t) => !t)} aria-expanded={todas}
          className="link-sistema mt-auto inline-flex min-h-10 items-center self-start text-sm font-medium">
          {todas ? "Mostrar só as principais" : `Ver as ${numero(itens.length)} pendências`}
        </button>
      )}
    </Bloco>
  )
}

// ===================================================== Agenda de hoje =====================================================
const COR_AG: Partial<Record<Agendamento["estado"], string>> = {
  concluido: "bg-[color-mix(in_oklch,var(--foreground)_16%,transparent)]",
  em_atendimento: "bg-primary",
  confirmado: "bg-[color-mix(in_oklch,var(--chart-1)_55%,transparent)]",
  solicitado: "border border-dashed border-[var(--alerta)] bg-[color-mix(in_oklch,var(--alerta)_22%,transparent)]",
  faltou: "bg-[color-mix(in_oklch,var(--destructive)_35%,transparent)]",
}
const LEGENDA: Agendamento["estado"][] = ["concluido", "em_atendimento", "confirmado", "solicitado"]
const minutos = (d: Date) => d.getHours() * 60 + d.getMinutes()

/** Mini grade do dia: uma linha por técnico (e a bancada), blocos no horário, a linha do agora e quem está em atendimento. */
export function AgendaDeHoje({ f, unidade, agora, nome, podeCriar, erro }: { f: Fontes; unidade: EscolhaUnidade; agora: Date; nome: Nome; podeCriar: boolean; erro?: boolean }) {
  const hoje = agendaDeHoje(f.agendamentos, agora)
  const recursos: Recurso[] = recursosDa(unidade)
  const exp = expediente(agora) ?? { abre: 480, fecha: 1080 }
  const ini = Math.min(exp.abre, ...hoje.map((a) => minutos(new Date(a.inicio))))
  const fim = Math.max(exp.fecha, ...hoje.map((a) => minutos(new Date(a.fim))))
  const pos = (m: number) => `${((m - ini) / (fim - ini)) * 100}%`
  const agoraMin = minutos(agora)
  const emConflito = new Set(conflitos(hoje).flat().map((a) => a.id))
  const emAtendimento = hoje.filter((a) => a.estado === "em_atendimento").length
  const horas = Array.from({ length: Math.floor((fim - ini) / 120) + 1 }, (_, i) => ini + i * 120).filter((m) => m <= fim)
  return (
    <Bloco titulo="Agenda de hoje" icone={CalendarCheck} erro={erro ? "a agenda de hoje" : undefined} acao={<LinkVer caminho="agenda/">Abrir a agenda</LinkVer>}>
      {hoje.length === 0 ? (
        <VazioDoBloco icone={CalendarCheck} titulo="Nenhuma visita hoje." acao={podeCriar ? <LinkVer caminho="agenda/">Novo agendamento</LinkVer> : undefined} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="num font-semibold whitespace-nowrap">{plural(hoje.length, "visita", "visitas")}</span>
            {emAtendimento > 0 && <PulsoAoVivo rotulo={`Em atendimento: ${emAtendimento}`} tom="destaque" chave={emAtendimento} className="text-sm text-foreground" />}
          </div>
          <div className="relative">
            <ul className="grid gap-1.5" aria-label="Visitas de hoje por técnico">
              {recursos.map((r) => {
                const meus = hoje.filter((a) => a.recursoId === r.id)
                return (
                  <li key={r.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-2" aria-label={`${r.curto}: ${meus.length ? plural(meus.length, "visita", "visitas") : "sem visitas"}`}>
                    <span className="truncate text-xs text-muted-foreground" aria-hidden="true" title={r.nome}>{r.curto}</span>
                    <span className="relative h-7 rounded-[calc(var(--radius)*0.6)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)]">
                      {meus.map((a) => {
                        const i = minutos(new Date(a.inicio)), e = minutos(new Date(a.fim))
                        const texto = `${fp.h(a.inicio)}–${fp.h(a.fim)}, ${nome(a.clienteId)}, ${AGENDAMENTO[a.estado].rotulo}${emConflito.has(a.id) ? ", em conflito" : ""}`
                        return (
                          <span key={a.id} title={`${a.id} · ${texto}`}
                            className={cn("absolute inset-y-1 rounded-[calc(var(--radius)*0.45)]", COR_AG[a.estado], emConflito.has(a.id) && "ring-2 ring-destructive ring-inset")}
                            style={{ left: pos(i), width: `calc(${pos(e)} - ${pos(i)} - 2px)` }}>
                            <span className="sr-only">{texto}</span>
                          </span>
                        )
                      })}
                    </span>
                  </li>
                )
              })}
            </ul>
            {agoraMin > ini && agoraMin < fim && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 left-[4.75rem]">
                <span className="absolute inset-y-[-4px] w-px bg-destructive" style={{ left: pos(agoraMin) }}>
                  <span className="absolute -top-1 -left-[3px] size-[7px] rounded-full bg-destructive" />
                </span>
              </span>
            )}
            <div aria-hidden="true" className="relative mt-1 ml-[4.75rem] h-4 text-xs text-muted-foreground">
              {horas.map((m) => <span key={m} className="num absolute -translate-x-1/2 first:translate-x-0" style={{ left: pos(m) }}>{Math.floor(m / 60)}h</span>)}
            </div>
          </div>
          <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda">
            {LEGENDA.map((e) => (
              <li key={e} className="flex items-center gap-1.5 whitespace-nowrap"><span className={cn("size-2.5 rounded-[3px]", COR_AG[e])} aria-hidden="true" />{AGENDAMENTO[e].rotulo}</li>
            ))}
            <li className="flex items-center gap-1.5 whitespace-nowrap"><span className="h-2.5 w-px bg-destructive" aria-hidden="true" />Agora, {fp.h(agora.toISOString())}</li>
          </ul>
        </>
      )}
    </Bloco>
  )
}

// ===================================================== Dinheiro =====================================================
/** A receber hoje (padrão do market-card: um número-herói e o que o compõe). Só para quem abre o financeiro. */
export function AReceberHoje({ n, f, agora, erro }: { n: { receberHoje: number; nReceberHoje: number; receberHojeLista: Lancamento[]; receberVencido: number; nReceberVencido: number }; f: Fontes; agora: Date; erro?: boolean }) {
  return (
    <Bloco titulo="A receber hoje" icone={Receipt} erro={erro ? "o a receber" : undefined} acao={<LinkVer caminho="financeiro/receber/">Receber</LinkVer>}>
      <div>
        <p className="t-kpi"><Numero valor={n.receberHoje} formato="moedaDoDia" /></p>
        <p className="mt-1 text-xs text-muted-foreground">{n.nReceberHoje ? `em ${plural(n.nReceberHoje, "título que vence", "títulos que vencem")} hoje` : "Nenhum título vence hoje"}</p>
      </div>
      {n.receberHojeLista.length > 0 && (
        <ul className="-mx-2 grid">
          {n.receberHojeLista.slice(0, 3).map((l) => (
            <li key={l.id}>
              <LinhaLink caminho={`financeiro/receber/?id=${l.id}`} className="min-h-10 grid-cols-[minmax(0,1fr)_auto] py-1.5 text-sm">
                <Cortado texto={nomeDe(l)} className="text-muted-foreground" />
                <span className="num font-medium whitespace-nowrap">{moeda(l.valor)}</span>
              </LinhaLink>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto flex flex-wrap items-center gap-x-1.5 border-t border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] pt-3 text-xs">
        {n.nReceberVencido
          ? <><a href={url("financeiro/receber/")} className="link-sistema -my-3 inline-flex min-h-10 items-center font-semibold">{plural(n.nReceberVencido, "vencido", "vencidos")}</a><span className="text-muted-foreground">·</span><span className="num whitespace-nowrap text-muted-foreground">{moedaCompacta(n.receberVencido)}</span></>
          : <span className="text-muted-foreground">Nada vencido.</span>}
        {pixVencidos(f.lancamentos, agora).length > 0 && <span className="text-muted-foreground">· {plural(pixVencidos(f.lancamentos, agora).length, "Pix expirado", "Pix expirados")}</span>}
      </p>
    </Bloco>
  )
}

export function APagar({ n, f, agora }: { n: { aPagar: number; nAPagar: number; pagarVencido: number; nPagarVencido: number }; f: Fontes; agora: Date }) {
  const hoje = pagarDeHoje(f.lancamentos, agora)
  // as próximas a vencer (as vencidas já estão na Atenção do dia)
  const proximas = f.lancamentos.filter((l) => l.natureza === "pagar" && (l.estado === "em_aberto" || l.estado === "aguardando_pix") && new Date(l.vencimento) >= new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()))
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 2)
  return (
    <Bloco titulo="A pagar" icone={Wallet} acao={<LinkVer caminho="financeiro/pagar/">Pagar</LinkVer>}>
      <div>
        <p className="t-kpi"><Numero valor={n.aPagar} formato="moedaDoDia" /></p>
        <p className="mt-1 text-xs text-muted-foreground">em {plural(n.nAPagar, "conta em aberto", "contas em aberto")}</p>
      </div>
      {proximas.length > 0 && (
        <ul className="-mx-2 grid">
          {proximas.map((l) => (
            <li key={l.id}>
              <LinhaLink caminho={`financeiro/pagar/?id=${l.id}`} className="min-h-10 grid-cols-[minmax(0,1fr)_auto] py-1.5 text-sm">
                <span className="grid min-w-0"><Cortado texto={nomeDe(l)} className="text-muted-foreground" /><span className="num text-xs text-muted-foreground">vence {fp.d(l.vencimento)}</span></span>
                <span className="num font-medium whitespace-nowrap">{moeda(l.valor)}</span>
              </LinhaLink>
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] pt-3 text-sm">
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Vencem hoje</dt><dd className="num mt-0.5 font-semibold whitespace-nowrap">{moeda(hoje.reduce((s, l) => s + l.valor, 0))}</dd></div>
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Vencidas</dt><dd className={cn("num mt-0.5 font-semibold whitespace-nowrap", n.nPagarVencido && "text-negativo-texto")}>{moeda(n.pagarVencido)}</dd></div>
      </dl>
    </Bloco>
  )
}

export function CaixaDoDia({ f, unidade, agora, erro }: { f: Fontes; unidade: EscolhaUnidade; agora: Date; erro?: boolean }) {
  const linhas = caixasDoDia(f.caixas, f.lancamentos, unidade, agora)
  return (
    <Bloco titulo="Caixa do dia" icone={Vault} erro={erro ? "o caixa do dia" : undefined} acao={<LinkVer caminho="financeiro/caixa/">Abrir o caixa</LinkVer>}>
      <ul className="-mx-2 grid">
        {linhas.map(({ unidade: u, cx, esperado }) => (
          <li key={u} className="border-t border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] first:border-t-0">
            <LinhaLink caminho={`financeiro/caixa/?unidade=${u}`} className="grid-cols-[minmax(0,1fr)_auto]">
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate text-sm font-medium">{UNIDADES[u].nome}</span>
                {/* BASE: a projeção não tem o objeto Caixa (aberto, fechado); a linha descreve o fato, sem selo */}
                <span className="truncate text-[0.8125rem] text-muted-foreground">
                  {cx ? (cx.estado === "aberto" ? `Aberto às ${fp.h(cx.abertoEm)} por ${cx.abertoPor.split(" ")[0]}` : `Fechado às ${fp.h(cx.fechadoEm)}`) : "Ainda não foi aberto hoje"}
                </span>
              </span>
              {cx && <span className="grid justify-items-end gap-0.5 text-right"><span className="text-xs text-muted-foreground">Em dinheiro</span><span className="num text-sm font-semibold whitespace-nowrap">{moeda(cx.estado === "fechado" ? cx.contado ?? esperado : esperado)}</span></span>}
            </LinhaLink>
          </li>
        ))}
      </ul>
    </Bloco>
  )
}

// ===================================================== Estoque e mensagens =====================================================
const COR_CAT = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

/** Estoque para repor (padrão do stats-card-2: números, barra de participação por categoria e a legenda). */
export function Estoque({ f, agora, erro }: { f: Fontes; agora: Date; erro?: boolean }) {
  const e = resumoEstoque(f.produtos, f.compras, agora)
  return (
    <Bloco titulo="Estoque" icone={PackageSearch} erro={erro ? "o estoque" : undefined} acao={<LinkVer caminho="estoque/?situacao=repor">Repor</LinkVer>}>
      {e.total === 0 ? (
        <VazioDoBloco icone={CircleCheck} titulo="Nada para repor." />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div><dt className="text-xs text-muted-foreground">Baixos</dt><dd className="t-kpi mt-1"><Numero valor={e.baixos} /></dd></div>
            <div><dt className="text-xs text-muted-foreground">Esgotados</dt><dd className={cn("t-kpi mt-1", e.esgotados && "text-negativo-texto")}><Numero valor={e.esgotados} /></dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{plural(e.total, "produto para repor", "produtos para repor")}</span>
            {e.comprasAtrasadas.length > 0 && <span className="block whitespace-nowrap"><span className="font-medium text-alerta-texto">{plural(e.comprasAtrasadas.length, "compra atrasada", "compras atrasadas")}</span></span>}
          </p>
          <ul className="-mx-2 grid">
            {e.primeiros.map((p) => (
              <li key={p.id}>
                <LinhaLink caminho={`estoque/?id=${p.id}`} className="min-h-10 grid-cols-[minmax(0,1fr)_auto] items-start py-1.5 text-sm">
                  <span className="line-clamp-2 min-w-0 text-pretty text-muted-foreground" title={p.nome}>{p.nome}</span>
                  <span className={cn("num text-xs font-medium whitespace-nowrap", p.saldo === 0 ? "text-negativo-texto" : "text-muted-foreground")}>{p.saldo === 0 ? "esgotado" : `${numero(p.saldo)} de ${numero(p.minimo)}`}</span>
                </LinhaLink>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-2">
            <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" role="img"
              aria-label={`Para repor por categoria: ${e.porCategoria.map((c) => `${c.nome} ${c.n}`).join(", ")}`}>
              {e.porCategoria.map((c, i) => <span key={c.nome} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(c.n / e.total) * 100}%`, background: COR_CAT[i % 5] }} />)}
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-hidden="true">
              {e.porCategoria.map((c, i) => (
                <li key={c.nome} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="size-2 rounded-full" style={{ background: COR_CAT[i % 5] }} />
                  <span className="text-muted-foreground">{c.nome}</span><span className="num font-semibold">{c.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Bloco>
  )
}

/** Conversas com mensagem nova (bloco do balcão, no lugar do dinheiro). */
export function Mensagens({ f, nome }: { f: Fontes; nome: Nome }) {
  const m = resumoMensagens(f.conversas, f.mensagens)
  return (
    <Bloco titulo="Mensagens" icone={MessageCircle} acao={<LinkVer caminho="mensagens/">Abrir</LinkVer>}>
      <div>
        <p className="t-kpi"><Numero valor={m.naoLidas} /></p>
        <p className="mt-1 text-xs text-muted-foreground">{m.naoLidas ? `não lidas em ${plural(m.recentes.length, "conversa", "conversas")}` : "Nenhuma mensagem nova."}</p>
      </div>
      {m.recentes.length > 0 && (
        <ul className="-mx-2 grid">
          {m.recentes.slice(0, 3).map(({ c, m: msg }) => (
            <li key={c.id}>
              <LinhaLink caminho={`mensagens/?conversa=${c.id}`} className="min-h-10 grid-cols-[minmax(0,1fr)_auto] py-1.5">
                <span className="grid min-w-0">
                  <Cortado texto={nome(c.clienteId)} className="text-sm font-medium" />
                  {msg && <Cortado texto={msg.texto} className="text-[0.8125rem] text-muted-foreground" />}
                </span>
                <span className="num rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground" aria-label={plural(c.naoLidas, "não lida", "não lidas")}>{c.naoLidas}</span>
              </LinhaLink>
            </li>
          ))}
        </ul>
      )}
      {m.falhas > 0 && <a href={url("mensagens/")} className="link-sistema mt-auto inline-flex min-h-10 items-center self-start text-xs font-medium">{plural(m.falhas, "mensagem não enviada", "mensagens não enviadas")}</a>}
    </Bloco>
  )
}

// ===================================================== OS por etapa =====================================================
/** As colunas do quadro com a contagem (padrão do stats-bento); cada número leva à lista filtrada naquela etapa. */
export function OSPorEtapa({ f, agora, erro }: { f: Fontes; agora: Date; erro?: boolean }) {
  const cols = porColuna(f.pedidos)
  const max = Math.max(1, ...cols.map((c) => c.n))
  const total = cols.reduce((s, c) => s + c.n, 0)
  return (
    <Bloco titulo="OS por etapa" icone={Inbox} erro={erro ? "as OS por etapa" : undefined} acao={<LinkVer caminho="pedidos/?vista=quadro">Abrir o quadro</LinkVer>}>
      {total === 0 ? (
        <VazioDoBloco icone={CircleCheck} titulo="Nenhuma OS em andamento." />
      ) : (
        <ul className="-mx-2 grid grid-cols-2 gap-1 sm:grid-cols-4 xl:grid-cols-7">
          {cols.map((c) => {
            const atr = f.pedidos.filter((p) => c.etapas.includes(p.etapa) && atrasado(p, agora)).length
            return (
              <li key={c.id} className="min-w-0 last:col-span-2 sm:last:col-span-1">
                <a href={url(`pedidos/?etapa=${c.etapas[c.etapas.length - 1]}`)} aria-label={`${c.titulo}: ${c.n} OS${atr ? `, ${plural(atr, "atrasada", "atrasadas")}` : ""}. Ver na lista`}
                  className="flex h-full min-h-[5.5rem] flex-col gap-2 rounded-[calc(var(--radius)*0.9)] px-2 py-2.5 outline-none transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="truncate text-xs font-medium text-muted-foreground" title={c.titulo}>{c.titulo}</span>
                  <span className="t-kpi text-[1.5rem]"><Numero valor={c.n} /></span>
                  <span className="mt-auto grid gap-1">
                    <span className="h-1 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)]" aria-hidden="true">
                      <span className={cn("block h-full rounded-full", c.n === max ? "bg-[var(--chart-1)]" : "bg-[color-mix(in_oklch,var(--chart-1)_45%,transparent)]")} style={{ width: `${(c.n / max) * 100}%` }} />
                    </span>
                    <span className={cn("h-4 truncate text-xs", atr ? "font-medium text-negativo-texto" : "text-transparent")} aria-hidden="true">{atr ? plural(atr, "atrasada", "atrasadas") : "—"}</span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Bloco>
  )
}

