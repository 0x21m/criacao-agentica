import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"

/**
 * Movimento reduzido sem erro de hidratação: no servidor e no primeiro quadro do cliente vale "não reduzido" (o HTML é o
 * mesmo dos dois lados); depois de montar, a preferência real do aparelho. Use no lugar de useReducedMotion sempre que
 * a preferência muda o que é renderizado (texto, atributos), não só a animação.
 */
export function useMovimentoReduzido() {
  const real = useReducedMotion()
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  return montado ? !!real : false
}
