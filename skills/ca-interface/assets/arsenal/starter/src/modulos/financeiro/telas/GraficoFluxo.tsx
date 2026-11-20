// Gráfico do fluxo de caixa: o saldo dia a dia, realizado em linha cheia até hoje e projetado tracejado depois, com a
// linha do zero quando o saldo projetado fica negativo e a marca de alerta no pior dia. Mesmo desenho e mesma entrada
// do GraficoQueDesenha (kit de movimento): já vem pronto do servidor e só se desenha (da esquerda para a direita) sob a
// abertura; com movimento reduzido, parado. Ponteiro e teclado (setas, Home, End) leem cada dia.
// BASE: o GraficoQueDesenha não tem trecho projetado nem eixo com negativos; quando tiver, esta peça volta para ele.
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { motion } from "motion/react"
import { TriangleAlert } from "lucide-react"
import { useEntrada } from "@/lib/entrada"
import { useMovimentoReduzido } from "@/lib/movimento-reduzido"
import { dataCurta, moeda as moedaBase, textoDoEixo } from "@/lib/formato"
/** Dinheiro com o sinal de menos tipográfico (−R$ 3.420,00). */
const moeda = (v: number) => moedaBase(v).replace("-", "−")
import { cn } from "@/lib/utils"
import type { PontoFluxo } from "../dados"

const W = 600

export function GraficoFluxo({ pontos, altura = 220, className }: { pontos: PontoFluxo[]; altura?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const e = useEntrada("abertura")
  const reduzido = useMovimentoReduzido()
  const [foco, setFoco] = useState<number | null>(null)
  const [largura, setLargura] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([x]) => setLargura(x.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const id = useId().replace(/:/g, "")
  const H = altura
  const n = pontos.length
  if (!n) return null

  const saldos = pontos.map((p) => p.saldo)
  const max = Math.max(0, ...saldos)
  const min = Math.min(0, ...saldos)
  const folga = (max - min) * 0.1 || 1
  const topo = max + folga
  const base = min < 0 ? min - folga : 0
  const x = (i: number) => (i / Math.max(1, n - 1)) * W
  const y = (v: number) => ((topo - v) / (topo - base)) * H
  const hoje = Math.max(0, pontos.findIndex((p) => p.projetado) - 1)
  const linha = (de: number, ate: number) => pontos.slice(de, ate + 1).map((p, k) => `${k ? "L" : "M"}${x(de + k).toFixed(2)},${y(p.saldo).toFixed(2)}`).join(" ")
  const realizado = linha(0, pontos.some((p) => p.projetado) ? hoje : n - 1)
  const projetado = pontos.some((p) => p.projetado) ? linha(hoje, n - 1) : ""
  const area = `${realizado} L${x(hoje).toFixed(2)},${H} L0,${H} Z`
  // o pior dia projetado, se ficar negativo (a marca de alerta)
  const projetados = pontos.map((p, i) => ({ p, i })).filter((q) => q.p.projetado)
  const pior = projetados.length ? projetados.reduce((a, b) => (b.p.saldo < a.p.saldo ? b : a)) : null
  const alerta = pior && pior.p.saldo < 0 ? pior : null
  const pos = (i: number) => `${(i / Math.max(1, n - 1)) * 100}%`
  const desenhar = e.mostrar || reduzido
  const t = reduzido || !e.animar ? { duration: 0 } : { duration: 1.2, ease: [0.23, 1, 0.32, 1] as const }

  // grade: o máximo, o zero (ou o meio) e o mínimo negativo, só se ficar a mais de 12 % da altura do zero (os rótulos não encostam)
  const ticks = [topo - folga, min < 0 ? 0 : (topo - folga) / 2, ...(min < 0 && y(min) - y(0) > H * 0.12 ? [min] : [])]
  const resumo = `Saldo de ${moeda(pontos[0].saldo)} em ${dataCurta(pontos[0].dia)} para ${moeda(pontos[hoje].saldo)} hoje; projetado ${moeda(pontos[n - 1].saldo)} em ${dataCurta(pontos[n - 1].dia)}.`
    + (alerta ? ` Fica negativo: ${moeda(alerta.p.saldo)} em ${dataCurta(alerta.p.dia)}.` : "")

  function mover(ev: PointerEvent) {
    const r = ev.currentTarget.getBoundingClientRect()
    setFoco(Math.min(n - 1, Math.max(0, Math.round(((ev.clientX - r.left) / r.width) * (n - 1)))))
  }
  function teclar(ev: KeyboardEvent) {
    const atual = foco ?? hoje
    const prox = ev.key === "ArrowRight" ? atual + 1 : ev.key === "ArrowLeft" ? atual - 1 : ev.key === "Home" ? 0 : ev.key === "End" ? n - 1 : ev.key === "Escape" ? null : undefined
    if (prox === undefined) return
    ev.preventDefault()
    setFoco(prox === null ? null : Math.min(n - 1, Math.max(0, prox)))
  }
  const f = foco !== null ? pontos[foco] : null

  return (
    <figure ref={ref} className={cn("m-0", className)}>
      <div className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ height: H }} tabIndex={0} role="img" aria-label={resumo}
        onPointerMove={mover} onPointerLeave={() => setFoco(null)} onKeyDown={teclar} onBlur={() => setFoco(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--chart-1)" stopOpacity="0.26" />
              <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`c${id}`}>
              <motion.rect x="0" y="-20" height={H + 40} initial={{ width: desenhar ? W : 0 }} animate={{ width: desenhar ? W : 0 }} transition={desenhar ? t : { duration: 0 }} />
            </clipPath>
          </defs>
          {ticks.map((v) => (
            <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke={v === 0 && min < 0 ? "var(--muted-foreground)" : "var(--border)"} strokeOpacity={v === 0 && min < 0 ? 0.55 : 1}
              vectorEffect="non-scaling-stroke" strokeDasharray={v === 0 && min < 0 ? undefined : "3 4"} />
          ))}
          <g clipPath={`url(#c${id})`}>
            <path d={area} fill={`url(#g${id})`} />
            <path d={realizado} fill="none" stroke="var(--chart-1)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {projetado && <path d={projetado} fill="none" stroke="var(--chart-1)" strokeOpacity="0.85" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          </g>
          <line x1={x(hoje)} x2={x(hoje)} y1="0" y2={H} stroke="var(--muted-foreground)" strokeOpacity="0.45" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* rótulos do eixo de valores, encostados à esquerda, acima de cada linha de grade */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {ticks.map((v) => (
            <span key={v} className="num absolute left-0 -translate-y-full pb-0.5 text-[11px] leading-none text-muted-foreground" style={{ top: `${(y(v) / H) * 100}%` }}>
              {v === 0 ? "R$ 0" : `${v < 0 ? "−" : ""}R$ ${textoDoEixo(Math.abs(v))}`}
            </span>
          ))}
          <span className="absolute top-0 -translate-x-1/2 -translate-y-full pb-1 text-[11px] leading-none font-medium text-muted-foreground" style={{ left: pos(hoje) }}>Hoje</span>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-[var(--chart-1)]"
          style={{ left: pos(hoje), top: `${(y(pontos[hoje].saldo) / H) * 100}%` }} />
        {alerta && (
          <>
            <span aria-hidden="true" className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-[var(--negative)] shadow-[0_0_0_4px_color-mix(in_oklch,var(--negative)_22%,transparent)]"
              style={{ left: pos(alerta.i), top: `${(y(alerta.p.saldo) / H) * 100}%` }} />
            <span data-alerta-fluxo className="pointer-events-none absolute z-[1] flex -translate-y-[calc(100%+10px)] items-center gap-1 rounded-full bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
              style={{ left: `clamp(0px, calc(${pos(alerta.i)} - 7rem), calc(100% - 13.5rem))`, top: `${(y(alerta.p.saldo) / H) * 100}%` }}>
              <TriangleAlert className="size-3.5 text-[var(--negative)]" aria-hidden="true" />
              <span className="num font-medium">{moeda(alerta.p.saldo)}</span> em {dataCurta(alerta.p.dia)}
            </span>
          </>
        )}
        {f && foco !== null && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-border" style={{ left: pos(foco) }} />
            <div className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-[var(--chart-1)]"
              style={{ left: pos(foco), top: `${(y(f.saldo) / H) * 100}%` }} />
            <div className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-md bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-lg"
              style={{ left: `clamp(5.5rem, ${pos(foco)}, calc(100% - 5.5rem))` }}>
              <p className="text-muted-foreground">{dataCurta(f.dia)} · {f.projetado ? "projetado" : "realizado"}</p>
              <p className="num font-medium">{moeda(f.saldo)}</p>
              {(f.entradas > 0 || f.saidas > 0) && <p className="num text-muted-foreground">+{moeda(f.entradas)} · −{moeda(f.saidas)}</p>}
            </div>
          </>
        )}
        <span className="sr-only" aria-live="polite">{f ? `${dataCurta(f.dia)}: ${moeda(f.saldo)}${f.projetado ? ", projetado" : ""}` : ""}</span>
      </div>
      <div data-eixo className="relative mt-2 h-4 text-xs text-muted-foreground" aria-hidden="true">
        {largura > 0 && pontos.map((p, i) => {
          const cabem = Math.max(2, Math.min(7, Math.floor(largura / 72)))
          const passo = Math.max(1, Math.ceil((n - 1) / (cabem - 1)))
          if (i % passo !== 0 && i !== n - 1) return null
          if (i !== n - 1 && (n - 1 - i) * (largura / Math.max(1, n - 1)) < 72) return null
          const borda = i === 0 ? "translate-x-0" : i === n - 1 ? "-translate-x-full" : "-translate-x-1/2"
          return <span key={i} className={cn("num absolute top-0 whitespace-nowrap", borda)} style={{ left: pos(i) }}>{dataCurta(p.dia)}</span>
        })}
      </div>
    </figure>
  )
}
