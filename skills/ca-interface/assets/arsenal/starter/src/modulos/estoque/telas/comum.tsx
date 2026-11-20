// Peças comuns às três telas do Estoque: o cabeçalho com a troca entre Saldo, Movimentações e Compras (vidro
// segmentado), os selos (sempre pela projeção) e os totais embaixo da tabela. Os formulários ficam em ./Formularios.
import type { ReactNode } from "react"
import { navigate } from "astro:transitions/client"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { SeloEixo } from "@/components/base/selos"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { COMPRA, COMPRA_ATRASADA, PRODUTO } from "@/proto/projecao"
import { url } from "@/lib/url"
import { pode, usePapel } from "@/proto/permissoes"
import { compraAtrasada, ctxDaCompra, ctxDoProduto, estadoDoProduto, type Compra, type Produto } from "../dados"

// ---------- cabeçalho com a troca de tela ----------
const TELAS = [
  { id: "estoque/", rotulo: "Saldo" },
  { id: "estoque/movimentacoes/", rotulo: "Movimentações" },
  { id: "estoque/compras/", rotulo: "Compras" },
]
export function CabecalhoEstoque({ ativa, titulo, descricao, contagem, acoes, children }: {
  ativa: string; titulo: string; descricao: string; contagem?: ReactNode; acoes?: ReactNode; children?: ReactNode
}) {
  // quem não vê movimentações e compras (técnico) fica só com o Saldo: sem a troca de tela
  const veHistorico = pode(usePapel(), "estoque_historico")
  return (
    <CabecalhoPagina titulo={titulo} descricao={descricao} contagem={contagem}
      acoes={<>
        {/* na barra recolhida do celular só cabe o título: a troca de tela e a ação ficam no banner */}
        {veHistorico && <div className="w-full shrink-0 sm:w-[22rem] @3xl/banner:order-last max-sm:[[data-faixa-fixa]_&]:hidden"><SegmentadoDeVidro aria-label="Telas do estoque" opcoes={TELAS} valor={ativa} aoMudar={(id) => { if (id !== ativa) void navigate(url(id)) }} /></div>}
        {acoes && <span className="flex max-sm:w-full max-sm:[&>*]:w-full max-sm:[[data-faixa-fixa]_&]:hidden">{acoes}</span>}
      </>}>
      {children}
    </CabecalhoPagina>
  )
}

// ---------- selos (projeção) ----------
export function SeloProduto({ p, compras, detalhe = false }: { p: Produto; compras?: Compra[]; detalhe?: boolean }) {
  return <SeloEixo p={PRODUTO[estadoDoProduto(p)]} ctx={ctxDoProduto(p, compras)} detalhe={detalhe} />
}
export function SeloCompra({ c, agora, detalhe = false }: { c: Compra; agora: Date; detalhe?: boolean }) {
  return compraAtrasada(c, agora)
    ? <SeloEixo p={COMPRA_ATRASADA} ctx={ctxDaCompra(c)} detalhe={detalhe} />
    : <SeloEixo p={COMPRA[c.estado]} ctx={ctxDaCompra(c)} detalhe={detalhe} />
}


