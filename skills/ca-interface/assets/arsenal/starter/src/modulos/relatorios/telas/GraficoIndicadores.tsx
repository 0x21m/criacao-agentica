// GraficoIndicadores: o metric-switcher-trend-chart-demo do arsenal (src/components/ui/metric-switcher-trend-chart-demo,
// cópia pt-BR em src/arsenal/templates/relatorios), adaptado ao sistema. Mantido do autor: troca de indicador em abas
// com roving tabindex, escala "bonita" (0 / 200 / 400), curva Catmull-Rom, rótulos de evento sem colisão, mira com
// ponteiro e teclado (setas, PageUp/PageDown, Home/End, Esc) e a região ao vivo para leitor de tela.
// Mudado: o card é a Superficie de quem chama (sem bg-card/borda própria); cores só de token (--chart-N, --positive,
// --texto-negativo); KPI na escala compacta (.t-kpi); 5 indicadores (3 colunas no tablet, 5 no desktop) e, no
// celular, chips com um indicador por vez; a janela vem pronta de fora (período, unidade e comparação na URL); a
// comparação pode ser o período anterior (mesma cor, tracejada) ou Pampulha × Contagem (duas cores, as duas cheias);
// buracos (NaN) quebram a linha em vez de virar zero; a linha se desenha quando o indicador ou o período muda
// (parada com movimento reduzido); a tabela equivalente e o CSV saíram daqui (TabelaDados e exportação da tela).
import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export type SerieIndicador = {
  id: string
  rotulo: string
  /** Rótulo do chip no celular. */ curto: string
  cor: string
  formatar: (v: number) => string
  /** Forma curta para o eixo (R$ 12 mil). */ eixo: (v: number) => string
  sobeBom: boolean
  /** Taxa: a variação sai em pontos percentuais. */ pontos?: boolean
  /** Valor do período inteiro e o da comparação (NaN quando não há fato). */
  total: number
  totalComparacao?: number
  valores: number[]
  comparacao?: number[]
  /** Quantos fatos há (nas duas séries): 0 = vazio; um zero de verdade (0 %) continua gráfico. */ fatos: number
  /** Pontos próprios (um por semana na média de 30 dias); sem eles, os do gráfico. */
  datas?: Date[]; rotuloData?: (i: number) => string; eventos?: EventoNoGrafico[]; semanal?: boolean
  /** Linha de baixo do card (ex.: "Pampulha R$ 9 mil · Contagem R$ 4 mil"). */ detalhe?: React.ReactNode
}
export type EventoNoGrafico = { id: string; tipo: "marco" | "faixa"; de: number; ate: number; rotulo: string }

const FONTE_EIXO = 12
const FONTE_ROTULO = 12
const LINHA_ROTULO = 16
const PAD_DIR = 16
const PAD_BAIXO = 28

function passoBonito(bruto: number) {
  const mag = 10 ** Math.floor(Math.log10(bruto))
  const n = bruto / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}
function escala(max: number, divisoes = 3) {
  if (!Number.isFinite(max) || max <= 0) return { max: 1, ticks: [0, 1] }
  const passo = passoBonito(max / divisoes)
  const topo = Math.ceil(max / passo) * passo
  const ticks: number[] = []
  for (let v = 0, i = 0; v <= topo + passo * 1e-9 && i < 12; v += passo, i++) ticks.push(Number(v.toFixed(10)))
  return { max: topo, ticks }
}
/** Linha por trechos: cada NaN fecha um trecho (sem inventar zero no dia sem fato). */
function trechos(pts: ([number, number] | null)[]) {
  const grupos: [number, number][][] = []
  let atual: [number, number][] = []
  for (const p of pts) { if (p) atual.push(p); else if (atual.length) { grupos.push(atual); atual = [] } }
  if (atual.length) grupos.push(atual)
  return grupos.map((g) => {
    if (g.length === 1) return ""
    // segmentos retos: com dias ralos (0, 0, 4.000, 0) a curva do autor passava abaixo do zero e inventava valor
    return g.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
  }).join(" ")
}
function rotulosSemColisao(itens: { id: string; x: number; texto: string }[], esq: number, dir: number, linhas = 2) {
  const fim: number[] = []
  const r: { id: string; x: number; texto: string; linha: number }[] = []
  for (const it of [...itens].sort((a, b) => a.x - b.x)) {
    const w = it.texto.length * FONTE_ROTULO * 0.56
    if (w > dir - esq) continue
    const c = Math.min(Math.max(it.x, esq + w / 2), dir - w / 2)
    const linha = Array.from({ length: linhas }, (_, i) => i).find((i) => fim[i] === undefined || c - w / 2 >= fim[i] + 8)
    if (linha === undefined) continue
    fim[linha] = c + w / 2
    r.push({ ...it, x: c, linha })
  }
  return { r, linhas: fim.length }
}
function useLargura(ref: React.RefObject<HTMLElement | null>, padrao = 720) {
  const [w, setW] = React.useState(padrao)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => { const n = e.contentRect.width; if (n > 0) setW(n) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}
function teclasDeRoda(e: React.KeyboardEvent<HTMLElement>, ids: string[], ativo: string, escolher: (id: string) => void) {
  const i = Math.max(0, ids.indexOf(ativo)), u = ids.length - 1
  const prox = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === u ? 0 : i + 1) : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? u : i - 1)
    : e.key === "Home" ? 0 : e.key === "End" ? u : null
  if (prox === null) return
  e.preventDefault()
  escolher(ids[prox])
  e.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-item-id="${ids[prox]}"]`)?.focus()
}

/** O número do card: inteiro até 13 caracteres; acima (R$ 98.765.432,10), a forma curta do eixo, com o inteiro no title. */
const kpi = (m: SerieIndicador) => (!Number.isFinite(m.total) ? "Sem dados" : m.formatar(m.total).length > 13 ? m.eixo(m.total) : m.formatar(m.total))

function Variacao({ atual, anterior, sobeBom, pontos, formatar, className }: { atual: number; anterior?: number; sobeBom: boolean; pontos?: boolean; formatar?: (v: number) => string; className?: string }) {
  if (anterior === undefined || !Number.isFinite(atual) || !Number.isFinite(anterior) || (anterior === 0 && !pontos)) return null
  // taxa: a diferença em pontos percentuais (de 50 % para 100 % são +50 p.p., não +100 %)
  const d = pontos ? (atual - anterior) * 100 : (atual - anterior) / anterior * 100
  const bom = sobeBom ? d >= 0 : d <= 0
  // base pequena (13 contra 1 = +1.200 %): a diferença absoluta diz mais que o percentual
  const absoluto = !pontos && !!formatar && Math.abs(d) > 300
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold num", bom ? "text-positive" : "text-negativo-texto", className)}>
      {d >= 0 ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />}
      {absoluto ? formatar!(Math.abs(atual - anterior)) : <>{Math.abs(d).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{pontos ? " p.p." : " %"}</>}
      <span className="sr-only">{d >= 0 ? " de alta" : " de queda"} sobre o período anterior</span>
    </span>
  )
}

export function GraficoIndicadores({
  series, ativo, aoMudar, maximo, datas: datasGrafico, rotuloData: rotuloGrafico, rotuloAtual, rotuloComparacao, modo, eventos: eventosGrafico = [], altura = 240, atualizando, vazio,
}: {
  series: SerieIndicador[]
  ativo: string
  aoMudar: (id: string) => void
  /** Teto do eixo (1 para taxa: nunca 150 %). */ maximo?: number
  /** Data de cada ponto (o início do balde). */ datas: Date[]
  /** Texto do ponto na dica ("16/11" ou "semana de 09/11"). */ rotuloData: (i: number) => string
  rotuloAtual: string
  rotuloComparacao?: string
  /** "anterior": mesma cor, tracejada; "unidades": duas entidades, duas cores cheias. */
  modo: "anterior" | "unidades"
  eventos?: EventoNoGrafico[]
  altura?: number
  /** Os dados novos estão a caminho: o gráfico mantém os anteriores, apagado (EST-12). */
  atualizando?: boolean
  /** No lugar do gráfico quando o indicador não tem nenhum fato no período. */
  vazio?: React.ReactNode
}) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const ref = React.useRef<HTMLDivElement>(null)
  const largura = useLargura(ref)
  const reduzido = useReducedMotion()
  const [foco, setFoco] = React.useState<number | null>(null)
  const hidratado = React.useRef(false)
  React.useEffect(() => { hidratado.current = true }, [])

  const s = series.find((x) => x.id === ativo) ?? series[0]
  const datas = s.datas ?? datasGrafico
  const rotuloData = s.rotuloData ?? rotuloGrafico
  const eventos = s.eventos ?? eventosGrafico
  const n = s.valores.length
  const temComp = !!s.comparacao?.length
  const corComp = modo === "unidades" ? "var(--chart-2)" : s.cor
  const corAtual = modo === "unidades" ? "var(--chart-1)" : s.cor

  const g = React.useMemo(() => {
    const todos = [...s.valores, ...(s.comparacao ?? [])].filter(Number.isFinite)
    const { max, ticks } = escala(Math.min(maximo ?? Infinity, todos.length ? Math.max(...todos) * 1.04 : 0))
    const rotulosY = ticks.map((t) => s.eixo(t))
    const maisLargo = rotulosY.reduce((m, l) => Math.max(m, l.length), 1)
    const padEsq = Math.min(Math.round(16 + maisLargo * FONTE_EIXO * 0.6), Math.max(48, largura * 0.3))
    const util = Math.max(largura - padEsq - PAD_DIR, 1)
    const passo = n > 1 ? util / (n - 1) : 0
    const xAt = (i: number) => (n > 1 ? padEsq + i * passo : padEsq + util / 2)
    const pend: { id: string; x: number; texto: string }[] = []
    const marcos: { id: string; x: number }[] = []
    const faixas: { id: string; x: number; w: number }[] = []
    for (const e of eventos) {
      if (e.tipo === "marco") { marcos.push({ id: e.id, x: xAt(e.de) }); pend.push({ id: e.id, x: xAt(e.de), texto: e.rotulo }) }
      else {
        const x1 = xAt(e.de) - (passo / 2 || 0), x2 = xAt(e.ate) + (passo / 2 || 0)
        const a = Math.max(padEsq, x1), b = Math.min(largura - PAD_DIR, x2)
        faixas.push({ id: e.id, x: a, w: Math.max(b - a, 2) })
        if (b - a >= 6) pend.push({ id: e.id, x: (a + b) / 2, texto: e.rotulo })
      }
    }
    const { r: rotulos, linhas } = rotulosSemColisao(pend, padEsq, largura - PAD_DIR)
    const padTopo = 10 + linhas * LINHA_ROTULO
    const base = padTopo + altura
    const yAt = (v: number) => padTopo + altura - (v / max) * altura
    const pts = (vs: number[]) => vs.map((v, i) => (Number.isFinite(v) ? [xAt(i), yAt(v)] as [number, number] : null))
    const linha = trechos(pts(s.valores))
    // dia com fato entre dois dias sem fato: um ponto (a linha não tem com quem ligar)
    const soltos = (vs: number[]) => vs.flatMap((v, i) => (Number.isFinite(v) && !Number.isFinite(vs[i - 1] ?? NaN) && !Number.isFinite(vs[i + 1] ?? NaN) ? [[xAt(i), yAt(v)] as [number, number]] : []))
    const continua = s.valores.every(Number.isFinite) && n > 1
    const area = continua ? `${linha} L${xAt(n - 1)},${base} L${xAt(0)},${base} Z` : ""
    const qtdTicks = Math.max(2, Math.min(n, Math.floor(util / 96) + 1))
    const ticksX = n <= 1 ? [0] : Array.from({ length: qtdTicks }, (_, i) => Math.round((i * (n - 1)) / (qtdTicks - 1)))
    return { soltos: soltos(s.valores), soltosComp: temComp ? soltos(s.comparacao!) : [], padEsq, padTopo, base, total: base + PAD_BAIXO, passo, xAt, yAt, linha, area, fantasma: temComp ? trechos(pts(s.comparacao!)) : "",
      marcos, faixas, rotulos, linhas, ticks, rotulosY, ticksX }
  }, [s, n, largura, altura, eventos, temComp, maximo])

  const limitar = (i: number) => Math.max(0, Math.min(n - 1, i))
  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setFoco(limitar(Math.round(((e.clientX - r.left) / r.width * largura - g.padEsq) / (g.passo || 1))))
  }
  const tecla = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const b = foco ?? n - 1
    const m: Record<string, number> = { ArrowRight: b + 1, ArrowLeft: b - 1, PageUp: b + 7, PageDown: b - 7, Home: 0, End: n - 1 }
    if (e.key === "Escape") { e.preventDefault(); setFoco(null); return }
    if (!(e.key in m)) return
    e.preventDefault()
    setFoco(limitar(m[e.key]))
  }

  const at = foco !== null && foco < n ? { i: foco, x: g.xAt(foco), v: s.valores[foco], c: s.comparacao?.[foco] } : null
  const resumo = `${s.rotulo}, ${rotuloData(0)} a ${rotuloData(n - 1)}: ${Number.isFinite(s.total) ? s.formatar(s.total) : "sem dados"}${temComp ? `, comparado a ${rotuloComparacao}` : ""}. Use as setas para ler cada ponto.`
  const chave = `${s.id}-${n}-${datas[0]?.getTime()}-${modo}`
  const desenha = hidratado.current && !reduzido
  const transicao = { duration: reduzido ? 0 : 0.9, ease: [0.23, 1, 0.32, 1] as const }
  const vazioAgora = s.fatos === 0

  return (
    <div data-slot="grafico-indicadores" className="grid min-w-0 gap-4">
      {/* indicadores: chips no celular (um por vez), cards do tablet para cima */}
      <div role="tablist" aria-label="Indicador" className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-5">
        {series.map((m) => {
          const sel = m.id === s.id
          return (
            <button key={m.id} type="button" role="tab" id={`gi-tab-${uid}-${m.id}`} aria-selected={sel} aria-controls={`gi-painel-${uid}`}
              data-item-id={m.id} tabIndex={sel ? 0 : -1} onClick={() => aoMudar(m.id)} onKeyDown={(e) => teclasDeRoda(e, series.map((x) => x.id), s.id, aoMudar)}
              className={cn(
                "shrink-0 transition-[color,background-color,border-color,transform] active:scale-[0.96] rounded-full border px-3.5 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-10",
                "sm:flex sm:min-w-0 sm:flex-col sm:gap-1.5 sm:rounded-[calc(var(--raio-sup)*0.6)] sm:p-3",
                sel ? "border-transparent font-semibold text-foreground" : "border-[var(--anel-cartao)] text-muted-foreground hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)]",
              )}
              style={sel ? { borderColor: `color-mix(in oklab, ${m.cor} 70%, transparent)`, backgroundColor: `color-mix(in oklab, ${m.cor} 10%, transparent)` } : undefined}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full max-sm:hidden" style={{ backgroundColor: m.cor }} />
                <span className="sm:hidden">{m.curto}</span>
                <span className="t-rotulo truncate max-sm:hidden" title={m.rotulo}>{m.rotulo}</span>
              </span>
              <span className="t-kpi num text-[1.375rem] text-foreground max-sm:hidden lg:text-[1.5rem]" title={Number.isFinite(m.total) ? m.formatar(m.total) : undefined}>{kpi(m)}</span>
              <span className="flex min-h-4 flex-wrap items-center gap-x-2 text-xs text-muted-foreground max-sm:hidden">
                {modo === "anterior" ? <Variacao atual={m.total} anterior={m.totalComparacao} sobeBom={m.sobeBom} pontos={m.pontos} formatar={m.formatar} /> : m.detalhe}
              </span>
            </button>
          )
        })}
      </div>

      {/* celular: o número do indicador escolhido */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:hidden" aria-hidden="true">
        <span className="t-kpi num text-[1.5rem]">{kpi(s)}</span>
        {modo === "anterior" ? <Variacao atual={s.total} anterior={s.totalComparacao} sobeBom={s.sobeBom} pontos={s.pontos} formatar={s.formatar} /> : <span className="text-xs text-muted-foreground">{s.detalhe}</span>}
      </div>

      {/* legenda: sempre que há duas séries; a cor nunca vai sozinha */}
      <ul aria-label="Legenda" className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <li className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ backgroundColor: corAtual }} />{rotuloAtual}</li>
        {temComp && rotuloComparacao && (
          <li className="inline-flex items-center gap-1.5">
            <svg width={16} height={4} aria-hidden="true" className="shrink-0"><line x1={0} y1={2} x2={16} y2={2} stroke={corComp} strokeWidth={2} strokeDasharray={modo === "anterior" ? "3 2" : undefined} opacity={modo === "anterior" ? 0.6 : 1} /></svg>
            {rotuloComparacao}
          </li>
        )}
        {g.marcos.length > 0 && <li className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-px bg-[var(--muted-foreground)]" />Feriado</li>}
        {g.faixas.length > 0 && <li className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-3.5 rounded-sm bg-[color-mix(in_oklch,var(--muted-foreground)_22%,transparent)]" />Campanha</li>}
        {atualizando && <li className="ml-auto inline-flex items-center gap-1.5" aria-live="polite">Atualizando…</li>}
      </ul>

      <div id={`gi-painel-${uid}`} role="tabpanel" aria-labelledby={`gi-tab-${uid}-${s.id}`} ref={ref}
        className={cn("relative min-w-0 transition-opacity duration-200", atualizando && "opacity-55")} aria-busy={atualizando || undefined}>
        {vazioAgora && vazio ? vazio : (
          <svg width={largura} height={g.total} viewBox={`0 0 ${largura} ${g.total}`} role="img" tabIndex={0} aria-label={resumo} aria-describedby={`gi-vivo-${uid}`}
            className="w-full touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onPointerMove={mover} onPointerLeave={() => setFoco(null)} onKeyDown={tecla} onFocus={() => setFoco((i) => (i === null ? n - 1 : i))} onBlur={() => setFoco(null)}>
            <defs>
              <linearGradient id={`gi-area-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={corAtual} stopOpacity={0.2} />
                <stop offset="100%" stopColor={corAtual} stopOpacity={0} />
              </linearGradient>
            </defs>
            {g.ticks.map((t, i) => (
              <g key={t}>
                <line x1={g.padEsq} x2={largura - PAD_DIR} y1={g.yAt(t)} y2={g.yAt(t)} stroke="var(--border)" strokeWidth={1} />
                <text x={g.padEsq - 8} y={g.yAt(t) + 4} textAnchor="end" fontSize={FONTE_EIXO} className="num fill-muted-foreground">{g.rotulosY[i]}</text>
              </g>
            ))}
            {g.faixas.map((f) => <rect key={f.id} x={f.x} y={g.padTopo} width={f.w} height={altura} fill="color-mix(in oklch, var(--muted-foreground) 8%, transparent)" />)}
            {g.marcos.map((m) => <line key={m.id} x1={m.x} x2={m.x} y1={g.padTopo} y2={g.base} stroke="var(--muted-foreground)" strokeOpacity={0.6} strokeWidth={1} />)}
            {g.rotulos.map((l) => (
              <text key={`r-${l.id}`} x={l.x} y={g.padTopo - 4 - (g.linhas - 1 - l.linha) * LINHA_ROTULO} textAnchor="middle" fontSize={FONTE_ROTULO} fontWeight={600} className="fill-muted-foreground">{l.texto}</text>
            ))}
            {g.area && (
              <motion.path key={`a-${chave}`} d={g.area} fill={`url(#gi-area-${uid})`} stroke="none"
                initial={{ opacity: desenha ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ ...transicao, delay: desenha ? 0.35 : 0 }} />
            )}
            {temComp && g.fantasma && (
              <motion.path key={`c-${chave}`} d={g.fantasma} fill="none" stroke={corComp} strokeWidth={modo === "anterior" ? 1.5 : 2} strokeLinecap="round"
                strokeDasharray={modo === "anterior" ? "4 3" : undefined} opacity={modo === "anterior" ? 0.6 : 1}
                initial={{ pathLength: modo === "unidades" && desenha ? 0 : 1 }} animate={{ pathLength: 1 }} transition={transicao} />
            )}
            <motion.path key={`l-${chave}`} d={g.linha} fill="none" stroke={corAtual} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: desenha ? 0 : 1 }} animate={{ pathLength: 1 }} transition={transicao} />
            {g.soltosComp.map(([x, y], i) => <circle key={`sc${i}`} cx={x} cy={y} r={3} fill={corComp} fillOpacity={modo === "anterior" ? 0.6 : 1} />)}
            {g.soltos.map(([x, y], i) => <circle key={`s${i}`} cx={x} cy={y} r={3.5} fill={corAtual} stroke="var(--card)" strokeWidth={1.5} />)}
            {g.ticksX.map((i) => (
              <text key={i} x={g.xAt(i)} y={g.total - 8} textAnchor={i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"} fontSize={FONTE_EIXO} className="num fill-muted-foreground">
                {datas[i]?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </text>
            ))}
            {at && (
              <g>
                <line x1={at.x} x2={at.x} y1={g.padTopo} y2={g.base} stroke="var(--border)" strokeWidth={1} />
                {at.c !== undefined && Number.isFinite(at.c) && <circle cx={at.x} cy={g.yAt(at.c)} r={4} fill={corComp} fillOpacity={modo === "anterior" ? 0.55 : 1} stroke="var(--card)" strokeWidth={2} />}
                {Number.isFinite(at.v) && <circle cx={at.x} cy={g.yAt(at.v)} r={4.5} fill={corAtual} stroke="var(--card)" strokeWidth={2} />}
              </g>
            )}
          </svg>
        )}

        {at && !vazioAgora && (
          <div aria-hidden="true" data-nivel="flutuante"
            className="sup pointer-events-none absolute z-10 w-52 rounded-lg p-3 text-sm"
            style={{
              left: `${(at.x / largura) * 100}%`, top: g.padTopo + 4,
              transform: `translate(${at.x / largura > 0.75 ? "-92%" : at.x / largura < 0.25 ? "-8%" : "-50%"}, 0)`,
            }}>
            <div className="mb-1.5 font-semibold">{rotuloData(at.i)}</div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-0.5 w-2.5 rounded-full" style={{ backgroundColor: corAtual }} />{modo === "unidades" ? rotuloAtual : "Período"}</span>
              <span className="num font-semibold">{Number.isFinite(at.v) ? s.formatar(at.v) : "Sem registro"}</span>
            </div>
            {temComp && at.c !== undefined && (
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-0.5 w-2.5 rounded-full" style={{ backgroundColor: corComp, opacity: modo === "anterior" ? 0.6 : 1 }} />{modo === "unidades" ? rotuloComparacao : "Anterior"}</span>
                <span className="num text-muted-foreground">{Number.isFinite(at.c) ? s.formatar(at.c) : "Sem registro"}</span>
              </div>
            )}
          </div>
        )}
        <div id={`gi-vivo-${uid}`} aria-live="polite" className="sr-only">
          {at ? `${rotuloData(at.i)}: ${Number.isFinite(at.v) ? s.formatar(at.v) : "sem registro"}${temComp && at.c !== undefined ? `; ${modo === "unidades" ? rotuloComparacao : "período anterior"}: ${Number.isFinite(at.c) ? s.formatar(at.c) : "sem registro"}` : ""}` : ""}
        </div>
      </div>
    </div>
  )
}
