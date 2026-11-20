// Número que conta até o valor (ou rola como odômetro) quando entra na tela e quando muda. Formato pt-BR.
// Uso: <NumeroAnimado valor={48210.5} formato="moeda" />  ·  <NumeroAnimado valor={128} modo="odometro" />
import { useEffect, useRef } from "react"
import { animate, motion, useInView } from "motion/react"
import { moeda, moedaCompacta, moedaInteira, numero, percentual } from "@/lib/formato"
import { mola } from "@/proto/movimento"
import { cn } from "@/lib/utils"
import { useMovimentoReduzido } from "@/lib/movimento-reduzido"
import { useEntrada, type ModoEntrada } from "@/lib/entrada"

const FORMATOS = { moeda: moeda, moedaInteira: moedaInteira, moedaCompacta: moedaCompacta, numero: (v: number) => numero(Math.round(v)), percentual }
export type FormatoNumero = keyof typeof FORMATOS

export function NumeroAnimado({ valor, formato = "numero", modo = "contar", entrada = "abertura", className }: {
  valor: number; formato?: FormatoNumero; modo?: "contar" | "odometro"
  /** "abertura" (padrão): o valor do servidor fica parado e só anima quando muda (ou sob a abertura); "sempre": conta ao entrar. */
  entrada?: ModoEntrada; className?: string
}) {
  const fmt = FORMATOS[formato]
  const final = fmt(valor)
  return (
    <span className={cn("num whitespace-nowrap", className)}>
      <span className="sr-only">{final}</span>
      {modo === "odometro" ? <Odometro texto={final} entrada={entrada} /> : <Contador valor={valor} fmt={fmt} entrada={entrada} />}
    </span>
  )
}

function Contador({ valor, fmt, entrada }: { valor: number; fmt: (v: number) => string; entrada: ModoEntrada }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visto = useInView(ref, { once: true })
  const reduzido = useMovimentoReduzido()
  const e = useEntrada(entrada)
  // modo "abertura": parte do próprio valor (o número do servidor não volta a zero); sob a abertura, conta do zero
  const anterior = useRef(entrada === "sempre" ? 0 : valor)
  if (e.animar && !e.mostrar) anterior.current = 0
  useEffect(() => {
    const el = ref.current
    if (!el || !visto || !e.mostrar) return
    if (anterior.current === valor) { el.textContent = fmt(valor); return }
    if (reduzido) { el.textContent = fmt(valor); anterior.current = valor; return }
    const c = animate(anterior.current, valor, {
      duration: 0.9, ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => { el.textContent = fmt(v) },
    })
    anterior.current = valor
    return () => c.stop()
  }, [valor, visto, reduzido, fmt, e.mostrar])
  // começa no valor final: sem JS ou antes de entrar na tela, o número certo já está ali
  return <span ref={ref} aria-hidden="true">{fmt(valor)}</span>
}

function Odometro({ texto, entrada }: { texto: string; entrada: ModoEntrada }) {
  const reduzido = useMovimentoReduzido()
  // "sempre": rola do zero ao montar; "abertura": já vem no valor do servidor e rola só quando ele muda
  const montado = useEntrada(entrada).mostrar
  const chars = texto.split("")
  return (
    <span aria-hidden="true" className="inline-flex">
      {chars.map((ch, i) => {
        const chave = chars.length - i // estável pela direita: unidade continua unidade
        if (!/\d/.test(ch)) return <span key={`s${chave}`}>{ch}</span>
        const d = Number(ch)
        return (
          <span key={`d${chave}`} className="relative inline-block h-[1lh] overflow-hidden">
            <span className="invisible">0</span>
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col items-center"
              initial={false}
              animate={{ y: `${-(montado ? d : 0) * 10}%` }}
              transition={reduzido ? { duration: 0 } : { ...mola.padrao, delay: i * 0.03 }}
            >
              {Array.from({ length: 10 }, (_, n) => <span key={n} className="h-[1lh]">{n}</span>)}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}
