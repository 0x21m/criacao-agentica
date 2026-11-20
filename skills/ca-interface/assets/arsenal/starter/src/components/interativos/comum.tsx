// Peças comuns do Kanban e da agenda: sensores do dnd-kit, posição do ponteiro, região viva de anúncios e textos.
// Mouse: 5 px para começar (um clique continua sendo clique). Toque: segurar 250 ms sem andar mais de 5 px; antes
// disso o dedo rola a página normalmente. Teclado: tratado por cada componente (Espaço pega, setas movem, Enter solta,
// Esc cancela), porque o "para onde" é uma posição de lista ou um horário, não uma coordenada.
import { useCallback, useEffect, useRef, useState } from "react"
import { MouseSensor, TouchSensor, useSensor, useSensors, type Announcements, type ScreenReaderInstructions } from "@dnd-kit/core"

export const ATIVACAO = { distanciaMouse: 5, esperaToque: 250, toleranciaToque: 5 } as const

/** Mouse e toque separados (não PointerSensor): no toque, o PointerSensor começaria a arrastar antes dos 250 ms. */
export function useSensoresArrasto() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: ATIVACAO.distanciaMouse } }),
    useSensor(TouchSensor, { activationConstraint: { delay: ATIVACAO.esperaToque, tolerance: ATIVACAO.toleranciaToque } }),
  )
}

/** Última posição do ponteiro (mouse ou dedo), lida na fase de captura: chega antes do onDragMove do dnd-kit. */
export function usePonteiro() {
  const ref = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const mouse = (e: MouseEvent) => { ref.current = { x: e.clientX, y: e.clientY } }
    const toque = (e: TouchEvent) => { const t = e.touches[0]; if (t) ref.current = { x: t.clientX, y: t.clientY } }
    const op = { capture: true, passive: true }
    window.addEventListener("mousemove", mouse, op); window.addEventListener("mousedown", mouse, op)
    window.addEventListener("touchmove", toque, op); window.addEventListener("touchstart", toque, op)
    return () => {
      window.removeEventListener("mousemove", mouse, op); window.removeEventListener("mousedown", mouse, op)
      window.removeEventListener("touchmove", toque, op); window.removeEventListener("touchstart", toque, op)
    }
  }, [])
  return ref
}

/** Região viva única da tela. O mesmo texto duas vezes seguidas também é lido (alterna um espaço invisível). */
export function useAnuncio() {
  const [texto, setTexto] = useState("")
  const vez = useRef(false)
  const anunciar = useCallback((t: string) => { vez.current = !vez.current; setTexto(t + (vez.current ? "" : " ")) }, [])
  const regiao = <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only" data-anuncio>{texto}</div>
  return { anunciar, regiao, texto }
}

/** O dnd-kit não anuncia nada sozinho aqui: os componentes anunciam pela própria região, em pt-BR. */
export const SILENCIO: Announcements = {
  onDragStart: () => undefined, onDragMove: () => undefined, onDragOver: () => undefined,
  onDragEnd: () => undefined, onDragCancel: () => undefined,
}
export const instrucoes = (texto: string): ScreenReaderInstructions => ({ draggable: texto })

export const TEXTO_INSTRUCOES_QUADRO =
  "Para mover, pressione Espaço. Setas para cima e para baixo mudam a posição, setas para os lados mudam de coluna, " +
  "Enter solta e Esc cancela. F2 edita o título. No toque, segure o cartão e arraste."
export const TEXTO_INSTRUCOES_AGENDA =
  "Para remarcar, pressione Espaço. Setas para cima e para baixo andam 15 minutos, com Shift andam 1 hora; " +
  "setas para os lados trocam de coluna; Alt com seta para cima ou para baixo muda a duração. Enter solta e Esc cancela. " +
  "No toque, segure o bloco e arraste."
