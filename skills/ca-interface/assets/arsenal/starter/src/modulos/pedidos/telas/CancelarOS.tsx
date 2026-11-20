// Cancelar a OS: confirmação com motivo obrigatório, em modo pessimista (a OS só muda depois da resposta; a falha,
// o conflito de versão e a falta de permissão aparecem dentro do diálogo). Quem pode cancelar depende da etapa (seção 2).
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { cancelarOS, type Pedido } from "../dados"

export function DialogoCancelarOS({ os, aoFechar }: { os: Pedido | null; aoFechar: () => void }) {
  return (
    <DialogoConfirmar
      aberto={!!os}
      aoFechar={aoFechar}
      titulo={os ? `Cancelar a ${os.id}?` : ""}
      descricao={os ? <>O cliente é avisado e a OS sai do quadro. Depois de cancelada, a OS não volta: um novo serviço vira outra OS.</> : null}
      confirmar="Cancelar a OS"
      voltar="Manter a OS"
      perigo
      motivo="Motivo do cancelamento"
      aoConfirmar={(motivo) => (os ? cancelarOS(os.id, motivo, os.versao) : undefined)}
    />
  )
}
