// As confirmações de dinheiro do Financeiro, todas pelo DialogoConfirmar (P: "Enviando…" com a mesma largura, erro
// dentro do diálogo): receber, pagar, estornar (valor, meio e prazo), cancelar (com motivo) e o lote. Baixa só quando
// alguém pede a primeira confirmação.
import { useEffect, useState } from "react"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { UNIDADES } from "@/proto/negocio"
import { moeda } from "@/lib/formato"
import {
  MEIOS, cancelarTitulo, estornar, lancamentos, nomeDe, novaChave, pagarConta, pagarEmLote, prazoDoEstorno, receber, receberEmLote,
  type Lancamento, type Meio, type Natureza,
} from "../dados"

export type Pedido =
  | { tipo: "receber"; l: Lancamento; meio: Meio; chave?: string }
  | { tipo: "pagar"; l: Lancamento; meio: Meio; chave?: string }
  | { tipo: "estornar"; l: Lancamento }
  | { tipo: "cancelar"; l: Lancamento }
  | { tipo: "lote"; natureza: Natureza; ids: string[]; meio: Meio }

const lista = (ids: string[]) => (ids.length <= 3 ? ids.join(", ").replace(/, ([^,]*)$/, " e $1") : `${ids.slice(0, 3).join(", ")} e mais ${ids.length - 3}`)

export default function Confirmacao({ pedido, aoFechar }: { pedido: Pedido | null; aoFechar: (reabrir: boolean) => void }) {
  // guarda o último pedido para o diálogo sair com o mesmo texto
  const [ultimo, setUltimo] = useState(pedido)
  useEffect(() => { if (pedido) setUltimo(pedido) }, [pedido])
  const p = pedido ?? ultimo
  if (!p) return null
  const aberto = !!pedido
  const fechar = () => aoFechar(p.tipo !== "lote")

  if (p.tipo === "lote") {
    const alvo = lancamentos.ler().filter((l) => p.ids.includes(l.id))
    const total = alvo.reduce((s, l) => s + l.valor, 0)
    const receberLote = p.natureza === "receber"
    return (
      <DialogoConfirmar aberto={aberto} aoFechar={fechar}
        titulo={receberLote ? `Receber ${alvo.length} ${alvo.length === 1 ? "título" : "títulos"} em ${MEIOS[p.meio].toLowerCase()}?` : `Pagar ${alvo.length} ${alvo.length === 1 ? "conta" : "contas"}?`}
        descricao={<>{lista(p.ids)}: <span className="num font-medium text-foreground">{moeda(total)}</span> no total. {receberLote
          ? "Cada título fica pago e entra no caixa de hoje da unidade dele. O resultado aparece título a título."
          : "Cada conta sai pelo meio dela (boleto ou Pix) e não pode ser desfeita; se precisar, estorne depois."}</>}
        confirmar={receberLote ? `Receber ${moeda(total)}` : `Pagar ${moeda(total)}`}
        aoConfirmar={() => (receberLote ? receberEmLote(p.ids, p.meio) : pagarEmLote(p.ids))} />
    )
  }

  const l = lancamentos.porId(p.l.id) ?? p.l
  const quem = nomeDe(l)
  const ref = l.ref ? `${l.ref} · ` : ""
  if (p.tipo === "receber") {
    return (
      <DialogoConfirmar aberto={aberto} aoFechar={fechar}
        titulo={`Receber ${moeda(l.valor)} em ${MEIOS[p.meio].toLowerCase()}?`}
        descricao={<>{ref}{quem}. Confirme só depois de {p.meio === "dinheiro" ? "contar o dinheiro" : p.meio === "boleto" ? "ver o boleto compensado" : "a maquininha aprovar"}: o título fica pago e entra no caixa de hoje da {UNIDADES[l.unidade].nome}.</>}
        confirmar={`Receber ${moeda(l.valor)}`}
        aoConfirmar={() => receber(l, p.meio, p.chave ?? novaChave(l.id))} />
    )
  }
  if (p.tipo === "pagar") {
    return (
      <DialogoConfirmar aberto={aberto} aoFechar={fechar}
        titulo={`Pagar ${moeda(l.valor)} com ${MEIOS[p.meio].toLowerCase()}?`}
        descricao={<>{quem} · {l.descricao}. O dinheiro sai da conta hoje e o pagamento não pode ser desfeito; se precisar, estorne depois.</>}
        confirmar={`Pagar ${moeda(l.valor)}`}
        aoConfirmar={() => pagarConta(l, p.meio, p.chave ?? novaChave(l.id))} />
    )
  }
  if (p.tipo === "estornar") {
    return (
      <DialogoConfirmar aberto={aberto} aoFechar={fechar} perigo
        titulo={`Estornar ${moeda(l.valor)}?`}
        descricao={<>{l.natureza === "receber" ? `Reembolso de ${moeda(l.valor)} ${prazoDoEstorno(l.meio)} para ${quem}.` : `Devolução de ${moeda(l.valor)} de ${quem} ${prazoDoEstorno(l.meio)}.`}{" "}
          Um lançamento novo fica ligado ao {l.id}, que passa a mostrar “Estornado por…” e não pode mais ser editado.</>}
        confirmar={`Estornar ${moeda(l.valor)}`} voltar="Manter o pagamento"
        aoConfirmar={() => estornar(l)} />
    )
  }
  return (
    <DialogoConfirmar aberto={aberto} aoFechar={fechar} perigo
      titulo={`Cancelar ${l.id}?`}
      descricao={<>{ref}{quem} · <span className="num">{moeda(l.valor)}</span>. O título sai das contas em aberto e do fluxo projetado; o cancelamento fica no histórico.</>}
      confirmar="Cancelar o título" voltar="Manter o título" motivo="Por que cancelar?"
      aoConfirmar={(motivo) => cancelarTitulo(l, motivo)} />
  )
}
