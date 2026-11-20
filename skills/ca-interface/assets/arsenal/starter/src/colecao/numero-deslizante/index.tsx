import * as React from "react"
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react"

import { idiomaDoFormato } from "@/lib/formato"
import { cn } from "@/lib/utils"

// Adaptado de Motion Primitives (MIT, Julien Thibeaut/ibelick): https://motion-primitives.com/docs/sliding-number
// MIFT: número em que cada algarismo desliza na vertical até o novo valor, com mola curta (a mesma do original). O
// texto vem do Intl no idioma da MIFT (pt-BR: "R$ 12.480,50", "98,6%"): cada algarismo vira uma coluna de 0 a 9 que
// desliza; o resto (separadores, "R$", "%", sinal) fica parado. As colunas são chaveadas pela casa contada da direita,
// então a unidade continua sendo a unidade quando o número cresce. Sem medir altura (o original usava
// react-use-measure): o deslocamento é em % da própria altura. O leitor de tela lê o número inteiro, uma vez.
// Movimento reduzido: o número troca sem deslizar.

const MOLA = { stiffness: 280, damping: 18, mass: 0.3 }
const DIGITOS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function Faixa({ mv, n }: { mv: MotionValue<number>; n: number }) {
  // Distância (em alturas) entre o algarismo n e o valor atual da mola, pelo caminho mais curto da roda de 0 a 9.
  const y = useTransform(mv, (atual) => {
    const lugar = ((atual % 10) + 10) % 10
    let d = (10 + n - lugar) % 10
    if (d > 5) d -= 10
    return `${d * 100}%`
  })
  return (
    <motion.span style={{ y }} className="absolute inset-0 flex items-center justify-center">
      {n}
    </motion.span>
  )
}

function Algarismo({ digito }: { digito: number }) {
  const mv = useSpring(digito, MOLA)
  React.useEffect(() => {
    mv.set(digito)
  }, [mv, digito])
  return (
    <span className="relative inline-block w-[1ch] overflow-y-clip leading-none tabular-nums">
      <span className="invisible">0</span>
      {DIGITOS.map((n) => (
        <Faixa key={n} mv={mv} n={n} />
      ))}
    </span>
  )
}

export type NumeroDeslizanteProps = {
  valor: number
  /** Opções do Intl.NumberFormat (moeda, percentual, casas decimais). Padrão: número inteiro com milhar. */
  opcoes?: Intl.NumberFormatOptions
  /** Anuncia a mudança ao leitor de tela (contador ao vivo). Padrão: não anuncia. */
  anunciar?: boolean
  className?: string
}

export function NumeroDeslizante({ valor, opcoes, anunciar = false, className }: NumeroDeslizanteProps) {
  const reduzido = useReducedMotion()
  const formato = React.useMemo(() => new Intl.NumberFormat(idiomaDoFormato(), opcoes), [opcoes])
  // Sinal de menos tipográfico (−), como no resto da MIFT.
  const texto = formato.format(valor).replace("-", "−")
  const partes = [...texto]
  return (
    <span data-slot="numero-deslizante" className={cn("inline-flex items-baseline tabular-nums", className)}>
      <span className="sr-only" aria-live={anunciar ? "polite" : undefined}>
        {texto}
      </span>
      {reduzido ? (
        <span aria-hidden className="leading-none">{texto}</span>
      ) : (
        <span aria-hidden className="inline-flex items-center">
          {partes.map((c, i) => {
            const casa = partes.length - i
            return /\d/.test(c) ? <Algarismo key={`d${casa}`} digito={Number(c)} /> : <span key={`s${casa}-${c}`} className="whitespace-pre leading-none">{c}</span>
          })}
        </span>
      )}
    </span>
  )
}
