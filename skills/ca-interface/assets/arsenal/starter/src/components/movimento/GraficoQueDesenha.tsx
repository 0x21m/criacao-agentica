// Linha ou área que se desenha quando entra na tela. Passe o mouse (ou o dedo) para ler cada ponto.
// Uso: <GraficoQueDesenha dados={[...]} rotulos={["seg", ...]} tipo="area" formatar={brlInteiro} titulo="Faturamento por dia" />
// Para gráfico rico (troca de métrica, comparação, CSV), use o metric-switcher do arsenal.
import { useEffect, useId, useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useMovimentoReduzido } from "@/lib/movimento-reduzido"
import { useEntrada, type ModoEntrada } from "@/lib/entrada"

const W = 600

function caminho(pts: [number, number][]) {
  // Catmull-Rom → Bézier: curva suave que passa por todos os pontos
  return pts.reduce((d, p, i, a) => {
    if (i === 0) return `M${p[0]},${p[1]}`
    const p0 = a[i - 2] ?? a[i - 1], p1 = a[i - 1], p2 = p, p3 = a[i + 1] ?? p
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    return `${d} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }, "")
}

export function GraficoQueDesenha({ dados, rotulos, tipo = "area", altura = 180, formatar = String, titulo, cor = "var(--chart-1)", entrada = "abertura", className }: {
  dados: number[]; rotulos: string[]; tipo?: "linha" | "area"; altura?: number
  formatar?: (v: number) => string; titulo: string; cor?: string
  /** "abertura" (padrão): já vem desenhado do servidor e só se desenha sob a abertura; "sempre": desenha ao montar. */
  entrada?: ModoEntrada; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // entrada única do carregamento; nada de revelar ao rolar
  const e = useEntrada(entrada)
  const visto = e.mostrar
  const inicial = entrada === "sempre" ? 0 : 1
  const reduzido = useMovimentoReduzido()
  const [foco, setFoco] = useState<number | null>(null)
  // quantos rótulos cabem no eixo: ~72 px por rótulo (texto de 12 px + respiro); nunca colidem
  const [largura, setLargura] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLargura(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const id = useId().replace(/:/g, "")
  const H = altura
  const max = Math.max(...dados) * 1.1 || 1
  const pts = dados.map((v, i) => [(i / Math.max(1, dados.length - 1)) * W, H - (v / max) * (H - 8)] as [number, number])
  const d = caminho(pts)
  const desenhar = visto || !!reduzido
  const t = reduzido ? { duration: 0 } : { duration: 1.1, ease: [0.23, 1, 0.32, 1] as const }
  const pos = (i: number) => `${(i / Math.max(1, dados.length - 1)) * 100}%`

  function mover(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect()
    setFoco(Math.min(dados.length - 1, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * (dados.length - 1)))))
  }
  const resumo = `${titulo}: de ${formatar(dados[0])} a ${formatar(dados[dados.length - 1])}, máximo de ${formatar(Math.max(...dados))}.`

  return (
    <figure ref={ref} className={cn("m-0", className)}>
      <div className="relative" style={{ height: H }} onPointerMove={mover} onPointerLeave={() => setFoco(null)} role="img" aria-label={resumo}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={cor} stopOpacity="0.28" />
              <stop offset="1" stopColor={cor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--border)" vectorEffect="non-scaling-stroke" strokeDasharray="3 4" />
          ))}
          {tipo === "area" && (
            <motion.path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#g${id})`}
              initial={{ opacity: reduzido ? 1 : inicial }} animate={{ opacity: desenhar ? 1 : 0 }} transition={desenhar ? { ...t, delay: reduzido ? 0 : 0.5 } : { duration: 0 }} />
          )}
          <motion.path d={d} fill="none" stroke={cor} strokeWidth="2.25" strokeLinecap="round" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: reduzido ? 1 : inicial }} animate={{ pathLength: desenhar ? 1 : 0 }} transition={desenhar ? t : { duration: 0 }} />
        </svg>
        {foco !== null && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-border" style={{ left: pos(foco) }} />
            <div className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
              style={{ left: pos(foco), top: pts[foco][1], background: cor }} />
            <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-lg"
              style={{ left: `clamp(3rem, ${pos(foco)}, calc(100% - 3rem))` }}>
              <span className="text-muted-foreground">{rotulos[foco]}</span> <span className="num font-medium">{formatar(dados[foco])}</span>
            </div>
          </>
        )}
      </div>
      {/* rótulos do eixo: quantos couberem na largura (~72 px cada, no máximo 7), no ponto; primeiro e último encostam
          nas bordas e o penúltimo some se ficar perto do último. Nunca colidem. */}
      <div data-eixo className="relative mt-2 h-4 text-xs text-muted-foreground" aria-hidden="true">
        {largura > 0 && rotulos.map((r, i) => {
          const cabem = Math.max(2, Math.min(7, Math.floor(largura / 72)))
          const passo = Math.max(1, Math.ceil((rotulos.length - 1) / (cabem - 1)))
          if (i % passo !== 0 && i !== rotulos.length - 1) return null
          if (i !== rotulos.length - 1 && (rotulos.length - 1 - i) * (largura / Math.max(1, rotulos.length - 1)) < 72) return null
          const borda = i === 0 ? "translate-x-0" : i === rotulos.length - 1 ? "-translate-x-full" : "-translate-x-1/2"
          return <span key={i} className={cn("absolute top-0 whitespace-nowrap", borda)} style={{ left: pos(i) }}>{r}</span>
        })}
      </div>
    </figure>
  )
}
