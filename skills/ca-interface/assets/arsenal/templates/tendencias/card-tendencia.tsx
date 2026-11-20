/**
 * Versão com props de components/ui/market-snapshot.tsx, para o template tendencias.
 * Mudanças em relação ao original: dados, nome, código, períodos e cor viram props; formatação pt-BR (R$);
 * aria-pressed nos períodos; layoutId único por card (useId); o gráfico também responde a setas
 * do teclado (foco no SVG); queda pinta a variação com --destructive.
 * Visual mantido: hairline por color-mix, grade tracejada 2/5, preço 22px/600, aba que desliza com mola.
 */
import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

const EASE = [0.16, 1, 0.3, 1] as const
const HAIRLINE = "color-mix(in srgb, var(--foreground) 5.5%, transparent)"
const W = 320
const H = 150

export type Periodo = { id: string; rotulo: string; pontos: number; dias: number }

export const PERIODOS_PADRAO: Periodo[] = [
  { id: "7d", rotulo: "7D", pontos: 7, dias: 7 },
  { id: "30d", rotulo: "30D", pontos: 12, dias: 30 },
  { id: "90d", rotulo: "90D", pontos: 16, dias: 90 },
  { id: "ano", rotulo: "Ano", pontos: 22, dias: 320 },
]

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CardTendencia({
  nome,
  codigo,
  valores,
  cor = "var(--chart-2)",
  periodos = PERIODOS_PADRAO,
  fim,
  rodape,
  formatar = (v) => brl.format(v),
}: {
  nome: string
  codigo: string
  /** Série completa, mais antiga primeiro. Cada período usa as últimas N posições. */
  valores: number[]
  cor?: string
  periodos?: Periodo[]
  /** Data do último ponto. */
  fim: Date
  rodape: [string, string]
  formatar?: (v: number) => string
}) {
  const reduced = useReducedMotion()
  const uid = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [periodo, setPeriodo] = useState(periodos[periodos.length - 1].id)
  const [hover, setHover] = useState<number | null>(null)
  const p = periodos.find((x) => x.id === periodo) ?? periodos[0]

  const data = useMemo(() => valores.slice(-Math.min(p.pontos, valores.length)), [valores, p.pontos])
  const min = Math.min(...data) * 0.97
  const max = Math.max(...data) * 1.02
  const x = (i: number) => 8 + (i / (data.length - 1)) * (W - 16)
  const y = (v: number) => 8 + (1 - (v - min) / (max - min || 1)) * (H - 18)
  const path = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const ativo = hover == null ? data.length - 1 : hover
  const valor = data[ativo]
  const delta = valor - data[0]
  const pctv = (delta / data[0]) * 100
  const corDelta = delta >= 0 ? "var(--sucesso)" : "var(--destructive)"

  const dataDoPonto = (i: number) => {
    const atras = ((data.length - 1 - i) / (data.length - 1)) * p.dias
    const d = new Date(fim.getTime() - atras * 86400000)
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: p.dias > 200 ? "2-digit" : undefined })
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const b = svgRef.current?.getBoundingClientRect()
    if (!b) return
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - b.left) / b.width) * (data.length - 1)))))
  }
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    setHover((h) => Math.max(0, Math.min(data.length - 1, (h ?? data.length - 1) + (e.key === "ArrowRight" ? 1 : -1))))
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border" style={{ background: "var(--card)", borderColor: HAIRLINE }}>
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">{nome}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={valor.toFixed(2)}
                className="text-[22px] font-semibold tracking-[-0.035em] text-foreground"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {formatar(valor)}
              </motion.span>
            </AnimatePresence>
            <span className="text-[11px] font-semibold" style={{ color: corDelta }}>
              {delta >= 0 ? "+" : "−"}
              {num.format(Math.abs(delta))} ({delta >= 0 ? "+" : "−"}
              {num.format(Math.abs(pctv))}%)
            </span>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-foreground">{codigo}</span>
      </div>

      <div className="relative px-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none rounded-md focus-visible:outline-2 focus-visible:outline-ring"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          tabIndex={0}
          role="img"
          aria-label={`${nome}: ${formatar(valor)} em ${dataDoPonto(ativo)}. Use as setas para percorrer o período.`}
        >
          {[0.33, 0.66].map((f) => (
            <line key={f} x1="8" x2={W - 8} y1={8 + f * (H - 18)} y2={8 + f * (H - 18)} stroke={HAIRLINE} strokeDasharray="2 5" />
          ))}
          <motion.path
            key={periodo}
            d={path}
            fill="none"
            stroke={cor}
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.65, ease: EASE }}
          />
          {hover != null && (
            <>
              <line x1={x(ativo)} x2={x(ativo)} y1="8" y2={H - 10} stroke="color-mix(in srgb, var(--foreground) 16%, transparent)" />
              <circle cx={x(ativo)} cy={y(valor)} r="3" fill={cor} stroke="var(--card)" strokeWidth="1.5" />
            </>
          )}
        </svg>
        {hover != null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border px-1.5 py-0.5 text-[10px] whitespace-nowrap text-muted-foreground tabular-nums"
            style={{ left: `${((x(ativo) / W) * 100).toFixed(1)}%`, background: "var(--card)", borderColor: HAIRLINE, boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
          >
            {dataDoPonto(ativo)}
          </div>
        )}
      </div>

      <div className="border-t px-4 pt-3 pb-4" style={{ borderColor: HAIRLINE }}>
        <div className="flex items-center justify-between gap-1" role="group" aria-label={`Período de ${nome}`}>
          {periodos.map((item) => {
            const sel = item.id === periodo
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={sel}
                onClick={() => {
                  setPeriodo(item.id)
                  setHover(null)
                }}
                className="relative rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                style={{ color: sel ? "var(--foreground)" : "var(--muted-foreground)", background: sel ? HAIRLINE : "transparent" }}
              >
                {item.rotulo}
                {sel && (
                  <motion.span
                    layoutId={`aba-${uid}`}
                    className="absolute inset-x-1.5 -bottom-[5px] h-[3px] rounded-t-full"
                    style={{ background: cor }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{rodape[0]}</span>
          <span>{rodape[1]}</span>
        </div>
      </div>
    </div>
  )
}
