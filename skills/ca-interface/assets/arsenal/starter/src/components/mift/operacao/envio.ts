import * as React from "react"

import { SEM_RESPOSTA } from "@/lib/mensagens"
import { vibrar } from "@/lib/movimento"

// MIFT: o contrato de toda ação de negócio (`ResultadoAcao`) e o `useEnvio`, num módulo sem interface. A casca do
// formulário, o seletor de estadia e qualquer ilha que só envia importam daqui; `operacao/acoes` reexporta tudo.

export type ResultadoAcao =
  | { ok: true; mensagem?: string; desfazer?: () => void }
  /** `alternativa`: a segunda saída quando tentar de novo não resolve ("Alterar turma", "Ver pedido"). */
  | { ok: false; motivo: string; alternativa?: { rotulo: string; aoTocar: () => void } }

/** Exceção não é motivo de negócio: é rede ou servidor fora do ar (a frase mora em lib/mensagens). */
export { SEM_RESPOSTA }

/**
 * Um envio com ResultadoAcao (formulário, diálogo de ação, cobrança): ignora o segundo toque ou Enter enquanto há um
 * pedido (devolve null), transforma exceção em "Não houve resposta" e guarda a falha para mostrar no lugar. O próprio
 * botão do verbo tenta de novo (o foco não sai dele).
 */
export function useEnvio<R extends ResultadoAcao>(aoEnviar: () => R | Promise<R>) {
  const [enviando, setEnviando] = React.useState(false)
  const [falha, setFalha] = React.useState<{ motivo: string; alternativa?: { rotulo: string; aoTocar: () => void } }>()
  const emAndamento = React.useRef(false)
  // O último `aoEnviar` sem escrever em ref durante o desenho (React Compiler): atualizado depois de cada commit,
  // antes de qualquer toque que chame `enviar`.
  const ultimo = React.useRef(aoEnviar)
  React.useLayoutEffect(() => {
    ultimo.current = aoEnviar
  })
  const enviar = React.useCallback(async (): Promise<R | null> => {
    if (emAndamento.current) return null
    emAndamento.current = true
    setEnviando(true)
    setFalha(undefined)
    let r: R
    try {
      r = await ultimo.current()
    } catch {
      r = { ok: false, motivo: SEM_RESPOSTA } as R
    }
    emAndamento.current = false
    setEnviando(false)
    vibrar(r.ok ? "confirmar" : "erro")
    if (!r.ok) setFalha({ motivo: r.motivo, alternativa: r.alternativa })
    return r
  }, [])
  const limpar = React.useCallback(() => setFalha(undefined), [])
  return { enviar, enviando, falha, limpar }
}

