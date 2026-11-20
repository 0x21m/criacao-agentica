// Botão principal com pressão em mola, reflexo de vidro e uma gota que refrata a partir do toque
// (inspirado na liquid-glass-navbar). Refração por SVG só no Chromium; nos outros, a gota é um brilho em CSS.
// Uso: <BotaoLiquido onClick={salvar}>Salvar</BotaoLiquido>  ·  <BotaoLiquido href={url("pedidos/novo/")}>Novo pedido</BotaoLiquido>
import { useEffect, useId, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { buttonVariants } from "@/components/ui/button"
import { mola } from "@/proto/movimento"
import { cn } from "@/lib/utils"

type Gota = { id: number; x: number; y: number }
let refracaoSuportada: boolean | null = null
function suportaRefracao() {
  if (refracaoSuportada === null) {
    const ua = navigator.userAgent
    refracaoSuportada = /Chrome\/|Edg\//.test(ua) && !/Firefox\//.test(ua) && CSS.supports("backdrop-filter", "url(#a)")
  }
  return refracaoSuportada
}

type Props = {
  children: ReactNode; href?: string; onClick?: () => void; type?: "button" | "submit"
  variante?: "default" | "secondary" | "outline"; tamanho?: "default" | "sm" | "lg"; disabled?: boolean; className?: string
  "aria-label"?: string; title?: string
}

export function BotaoLiquido({ children, href, onClick, type = "button", variante = "default", tamanho = "default", disabled, className, ...resto }: Props) {
  const reduzido = useReducedMotion()
  const [gotas, setGotas] = useState<Gota[]>([])
  const [refrata, setRefrata] = useState(false)
  const filtro = "lq" + useId().replace(/:/g, "")
  useEffect(() => setRefrata(suportaRefracao()), [])

  function tocar(e: React.PointerEvent<HTMLElement>) {
    if (reduzido || disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    setGotas((a) => [...a.slice(-2), { id: Date.now(), x: e.clientX - r.left, y: e.clientY - r.top }])
  }

  const classe = cn(buttonVariants({ variant: variante, size: tamanho }), "relative isolate overflow-hidden shadow-md", className)
  const miolo = (
    <>
      {/* reflexo de vidro: luz na metade de cima e borda interna */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-1px_0_rgb(0_0_0/0.12)]" />
      {refrata && (
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <filter id={filtro} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="3" result="ruido" />
            <feGaussianBlur in="ruido" stdDeviation="2" result="macio" />
            <feDisplacementMap in="SourceGraphic" in2="macio" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <AnimatePresence>
        {gotas.map((g) => (
          <motion.span
            key={g.id}
            aria-hidden="true"
            className="pointer-events-none absolute size-24 rounded-full"
            style={{
              left: g.x - 48, top: g.y - 48,
              background: "radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0.08) 55%, transparent 70%)",
              backdropFilter: refrata ? `url(#${filtro}) brightness(1.08)` : undefined,
            }}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ ...mola.macia, opacity: { duration: 0.6, ease: "easeOut" } }}
            onAnimationComplete={() => setGotas((a) => a.filter((x) => x.id !== g.id))}
          />
        ))}
      </AnimatePresence>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  )
  const anim = {
    whileTap: reduzido ? undefined : { scale: 0.96 },
    whileHover: reduzido ? undefined : { y: -1 },
    transition: mola.rapida,
    onPointerDown: tocar,
  }
  if (href) return <motion.a href={href} className={classe} {...anim} {...resto}>{miolo}</motion.a>
  return <motion.button type={type} onClick={onClick} disabled={disabled} className={classe} {...anim} {...resto}>{miolo}</motion.button>
}
