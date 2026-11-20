// O frete por CEP do site (frete-por-cep do arsenal, MIFT): o CEP de entrega fica neste aparelho (sessionStorage) entre
// o produto, o carrinho e o checkout; as opções saem de dados.ts (opcoesDeFrete). Fora da área: "Não entrega nesse
// CEP" com as cidades; a retirada no balcão continua valendo para todo mundo.
import { useEffect, useState } from "react"
import { FretePorCep, type SituacaoDoFrete } from "@/components/mift/fluxos/frete-por-cep"
import type { ResultadoAcao } from "@/components/mift/operacao/envio"
import { LOJA, SITE } from "@/proto/site"
import { moeda } from "@/lib/formato"
import { cidadeDoCepLocal, consultarCep, opcoesDeFrete, type OpcaoFrete } from "../dados"

const CHAVE = "site-cep-entrega"
const opcaoParaPeca = (o: OpcaoFrete) => ({ id: o.id, rotulo: o.rotulo, prazo: o.prazo, preco: Math.round(o.preco * 100), rapida: o.rapida })

export function useFrete(subtotal: number) {
  const [cep, setCep] = useState("")
  useEffect(() => { try { setCep(sessionStorage.getItem(CHAVE) ?? "") } catch {} }, [])
  const opcoes = cep ? opcoesDeFrete(cep, subtotal) : null
  const trocar = async (novo: string): Promise<ResultadoAcao> => {
    await new Promise((ok) => setTimeout(ok, 300))
    if (!cidadeDoCepLocal(novo)) return { ok: false, motivo: "Não achamos esse CEP. Confira os números." }
    setCep(novo)
    try { sessionStorage.setItem(CHAVE, novo) } catch {}
    return { ok: true }
  }
  return { cep, opcoes, cidade: cep ? cidadeDoCepLocal(cep) : undefined, trocar }
}

export function Frete({ f, titulo = "Entrega" }: { f: ReturnType<typeof useFrete>; titulo?: string }) {
  const situacao: SituacaoDoFrete = !f.cep
    ? { estado: "carregando" }
    : f.opcoes
      ? { estado: "pronto", opcoes: f.opcoes.map(opcaoParaPeca) }
      : { estado: "indisponivel", motivo: `Entregamos em ${SITE.cidades.slice(0, -1).join(", ")} e ${SITE.cidades.at(-1)}. Retire no balcão da Pampulha.` }
  return (
    <FretePorCep titulo={titulo} cep={f.cep} local={f.cidade ? `${f.cidade}/MG` : undefined} frete={situacao} aoTrocarCep={f.trocar} consultar={consultarCep}
      dica={`Frete grátis na entrega econômica acima de ${moeda(LOJA.freteGratisAcima)}.`} className="bg-transparent" />
  )
}
