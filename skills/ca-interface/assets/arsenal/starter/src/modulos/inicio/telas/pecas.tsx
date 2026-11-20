// Módulo Início · peças pequenas do bento: o card (Bloco, sempre da Superficie), o número do dia (conta na entrada e,
// quando muda em outra aba, ganha o realce curto de MOV-31 sem contar de novo: EST-45), o KPI do banner e o link.
import { useEffect, useRef, type ComponentType, type ReactNode } from "react"
import { animate, motion, type Variants } from "motion/react"
import { mola } from "@/proto/movimento"
import { ArrowRight } from "lucide-react"
import { Superficie, type TomSuperficie } from "@/components/sistema/Superficie"
import { CloudOff, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { definirConfig } from "@/proto/dados"
import { useAberturaAcabou } from "@/components/app/Abertura"
import { useMovimentoReduzido } from "@/lib/movimento-reduzido"
import { moeda, moedaCompacta, numero } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"

/** Card do bento: cabeçalho de uma linha (título + ação) e o conteúdo distribuído até a base. */
export function Bloco({ titulo, icone: Icone, acao, tom, children, className, erro }: {
  titulo: string; icone?: ComponentType<{ className?: string }>; acao?: ReactNode; tom?: TomSuperficie
  children: ReactNode; className?: string
  /** Erro por bloco (EST-47): "Não foi possível carregar {o estoque}"; o resto da tela segue funcionando. */
  erro?: string
}) {
  return (
    <Superficie como="section" tom={erro ? undefined : tom} aria-label={titulo} className={cn("flex h-full min-w-0 flex-col gap-3 p-4 md:p-5", className)}>
      <header className="flex min-h-10 items-center justify-between gap-3">
        <h2 className="t-card flex min-w-0 items-center gap-2">
          {Icone && <Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          <span className="truncate">{titulo}</span>
        </h2>
        {!erro && acao}
      </header>
      {erro ? <ErroDoBloco oQue={erro} /> : children}
    </Superficie>
  )
}

/** Link "Ver todas →" no cabeçalho ou no pé do card: alvo de 40 px, sublinhado que se desenha (link-sistema). */
export function LinkVer({ caminho, children, className }: { caminho: string; children: ReactNode; className?: string }) {
  return (
    <a href={url(caminho)} className={cn("link-sistema -my-1 inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-medium whitespace-nowrap", className)}>
      {children} <ArrowRight className="size-3.5" aria-hidden="true" />
    </a>
  )
}

/** Dinheiro do dia: inteiro até R$ 9.999,99 (R$ 409,90); acima, compacto (R$ 12,1 mil), para caber no KPI. */
const moedaDoDia = (v: number) => (Math.abs(v) < 10000 ? moeda(v) : moedaCompacta(v))
const FMT = { numero, moeda, moedaCompacta, moedaDoDia }
export type FormatoDia = keyof typeof FMT

/**
 * Número do dia. Conta do zero uma vez, quando a tela entra; depois, se o valor muda (outra aba, barra F), troca na hora
 * e acende um realce curto por trás (MOV-31), sem contar de novo (EST-45). Parado com movimento reduzido.
 */
export function Numero({ valor, formato = "numero", className }: { valor: number; formato?: FormatoDia; className?: string }) {
  const fmt = FMT[formato]
  const texto = useRef<HTMLSpanElement>(null)
  const luz = useRef<HTMLSpanElement>(null)
  const reduzido = useMovimentoReduzido()
  const anterior = useRef<number | null>(null)
  const acabou = useAberturaAcabou()
  useEffect(() => {
    const el = texto.current
    if (!el) return
    // sob a abertura (primeira visita), espera ela sair para contar
    if (!acabou) { el.textContent = fmt(valor); return }
    const primeiro = anterior.current === null
    const mudou = !primeiro && anterior.current !== valor
    anterior.current = valor
    el.textContent = fmt(valor)
    if (reduzido) return
    if (primeiro && valor !== 0) {
      const c = animate(0, valor, { duration: 0.9, ease: [0.23, 1, 0.32, 1], onUpdate: (v) => { el.textContent = fmt(formato === "numero" ? Math.round(v) : v) } })
      return () => c.stop()
    }
    if (mudou && luz.current) {
      const c = animate(luz.current, { opacity: [1, 0] }, { duration: 1.2, ease: [0.23, 1, 0.32, 1] })
      return () => c.stop()
    }
  }, [valor, fmt, formato, reduzido, acabou])
  return (
    <span className={cn("num relative inline-block whitespace-nowrap", className)}>
      <span ref={luz} aria-hidden="true" className="pointer-events-none absolute -inset-x-1.5 -inset-y-0.5 rounded-md bg-[color-mix(in_oklch,var(--primary)_22%,transparent)] opacity-0" />
      <span className="sr-only">{fmt(valor)}</span>
      <span ref={texto} aria-hidden="true" className="relative">{fmt(valor)}</span>
    </span>
  )
}

/** KPI do banner: rótulo de 12 px, número em peso leve com algarismos tabulares (nunca truncado) e o detalhe. */
export function KpiBanner({ rotulo, children, detalhe }: { rotulo: string; children: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="min-w-0 @3xl/banner:shrink-0">
      <dt className="text-xs font-medium whitespace-nowrap text-muted-foreground">{rotulo}</dt>
      <dd className="t-kpi mt-1 text-[1.5rem] lg:text-[1.75rem]">{children}</dd>
      {detalhe && <dd className="mt-0.5 text-xs whitespace-nowrap text-muted-foreground">{detalhe}</dd>}
    </div>
  )
}

/** Linha de lista dentro de um card (atenção, conversas, OS): link inteiro, hover tênue, alvo de 40 px ou mais. */
export function LinhaLink({ caminho, children, className, rotulo }: { caminho: string; children: ReactNode; className?: string; rotulo?: string }) {
  return (
    <a href={url(caminho)} aria-label={rotulo}
      className={cn("grid min-h-11 items-center gap-x-3 rounded-[calc(var(--radius)*0.9)] px-2 py-2 outline-none transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-ring", className)}>
      {children}
    </a>
  )
}

/** Frase de vazio dentro de um bloco (dia sem nada): calma, centrada, com a próxima ação. */
export function VazioDoBloco({ icone: Icone, titulo, texto, acao }: { icone: ComponentType<{ className?: string }>; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div data-vazio="concluido" className="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-positive/14 text-positive"><Icone className="size-5" /></span>
      <p className="text-sm font-medium text-balance">{titulo}</p>
      {texto && <p className="max-w-xs text-sm text-pretty text-muted-foreground">{texto}</p>}
      {acao}
    </div>
  )
}

// ---------- entrada única do bento ----------
// O bento só monta no navegador (depois de saber quem vê), então a entrada anima direto ao montar: sem o vaivém
// oculto → visível do EntradaEscalonada (que, montado assim depois da hidratação, ficava parado em opacidade 0).
// Sob a abertura, espera ela sair. Com movimento reduzido, aparece de uma vez.
const PAI: Variants = { oculto: {}, visivel: { transition: { staggerChildren: 0.05 } } }
const FILHO: Variants = {
  oculto: { opacity: 0, y: 12 },
  visivel: (reduzido: boolean) => ({ opacity: 1, y: 0, transition: reduzido ? { duration: 0 } : mola.padrao }),
}

export function Entrada({ iniciar, className, children }: { iniciar: boolean; className?: string; children: ReactNode }) {
  const reduzido = useMovimentoReduzido()
  if (reduzido) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={PAI} initial={reduzido ? false : "oculto"} animate={iniciar || reduzido ? "visivel" : "oculto"}>
      {children}
    </motion.div>
  )
}
export function ItemDaEntrada({ className, children }: { className?: string; children: ReactNode }) {
  const reduzido = useMovimentoReduzido()
  if (reduzido) return <div className={className}>{children}</div>
  return <motion.div className={className} variants={FILHO} custom={false}>{children}</motion.div>
}

/** Erro de um bloco só (EST-47), sem card dentro do card: os textos do EstadoErro (5.0) e o "Tentar de novo". */
function ErroDoBloco({ oQue }: { oQue: string }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-6 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive"><CloudOff className="size-5" aria-hidden="true" /></span>
      <p className="text-sm font-medium text-balance">Não foi possível carregar {oQue}.</p>
      <p className="max-w-xs text-sm text-pretty text-muted-foreground">A conexão falhou. Seus dados estão seguros; tente de novo.</p>
      <Button variant="outline" className="mt-1 h-10 rounded-full px-4" onPress={() => definirConfig({ estado: "dados" })}><RotateCw /> Tentar de novo</Button>
    </div>
  )
}
