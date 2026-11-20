// DialogoConfirmar: confirmação de ação irreversível ou que afeta terceiro (cancelar OS, restaurar dados, anonimizar).
// Liga com uma ação pessimista: enquanto a resposta não chega, o botão diz "Enviando…" com a mesma largura e nada fecha;
// se falhar, a mensagem aparece aqui dentro (além do toast) e o diálogo continua aberto. `motivo` pede um texto
// obrigatório (cancelar exige motivo). O Dialog do React Aria vem em pedaço à parte, só quando abre.
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react"
import type { Resultado } from "@/proto/dados"

const Corpo = lazy(() => import("./DialogoConfirmarCorpo"))

export type PropsConfirmar = {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao: ReactNode
  /** Rótulo do botão de confirmar ("Cancelar a OS"). */
  confirmar: string
  /** Rótulo de quem desiste ("Manter a OS"). Padrão: "Voltar". */
  voltar?: string
  perigo?: boolean
  /** Pede um motivo antes de confirmar (rótulo do campo). */
  motivo?: string
  /** A ação. Devolva o Resultado da acao(): o diálogo fecha no ok e mostra a mensagem no erro. */
  aoConfirmar: (motivo: string) => Promise<Resultado> | Resultado | void
}

export function DialogoConfirmar(p: PropsConfirmar) {
  const [usado, setUsado] = useState(p.aberto)
  useEffect(() => { if (p.aberto) setUsado(true) }, [p.aberto])
  if (!usado) return null
  return <Suspense fallback={null}><Corpo {...p} /></Suspense>
}
