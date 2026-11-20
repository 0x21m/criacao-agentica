// /site/loja/(?categoria=) · a vitrine da loja online (5.13): produtos vendáveis com preço e disponibilidade na frase do
// cliente (PRODUTO da projeção, sem saldo por unidade nem custo, CLI-41), filtro por categoria na URL e o carrinho deste
// aparelho. Pôr no carrinho é O e sem toast (o botão vira "No carrinho"). Esgotado leva ao Avise-me do produto.
import { useEffect, useState } from "react"
import { Check, ShoppingBag } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { PRODUTO } from "@/proto/projecao"
import { LOJA, ROTAS } from "@/proto/site"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { produtos } from "@/modulos/estoque/dados"
import { adicionarAoCarrinho, carrinho, naVitrine, vitrine, type ProdutoVitrine } from "../dados"

export function LinkCarrinho({ className }: { className?: string }) {
  const n = carrinho.use().reduce((s, i) => s + i.qtd, 0)
  return (
    <LinkButton variant="outline" className={cn("h-11", className)} href={ROTAS.carrinho()} aria-label={`Carrinho, ${n} ${n === 1 ? "item" : "itens"}`}>
      <ShoppingBag /> Carrinho <span className="num rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{n}</span>
    </LinkButton>
  )
}

export default function Loja() {
  const lista = produtos.use().filter(naVitrine).map(vitrine)
  const categorias = LOJA.categorias.filter((c) => lista.some((p) => p.categoria === c))
  const [cat, setCat] = useState("todas")
  useEffect(() => {
    const c = new URLSearchParams(location.search).get("categoria")
    if (c && categorias.includes(c)) setCat(c)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const trocar = (c: string) => {
    setCat(c)
    const u = new URL(location.href)
    if (c === "todas") u.searchParams.delete("categoria"); else u.searchParams.set("categoria", c)
    history.replaceState(null, "", u)
  }
  const visiveis = cat === "todas" ? lista : lista.filter((p) => p.categoria === cat)
  return (
    <div className="escopo-starter">
      <BannerSobreposto variante="completa" sobrelinha="Loja online" titulo="Loja de peças da Pampulha"
        descricao={`Aparelhos, filtros, limpeza e material elétrico. Retire no balcão ou receba em casa; frete grátis na econômica acima de ${moeda(LOJA.freteGratisAcima)}.`}
        sobreposicao={64}>
        <Superficie nivel="card" className="flex w-full flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <SegmentadoDeVidro aria-label="Categoria" valor={cat} aoMudar={trocar} className="max-w-full overflow-x-auto"
            opcoes={[{ id: "todas", rotulo: "Tudo" }, ...categorias.map((c) => ({ id: c, rotulo: c }))]} />
          <LinkCarrinho className="self-start md:self-auto" />
        </Superficie>
      </BannerSobreposto>
      <h2 className="sr-only">Produtos{cat !== "todas" ? `: ${cat}` : ""}</h2>
      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">{visiveis.length} {visiveis.length === 1 ? "produto" : "produtos"}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((p) => <li key={p.sku} className="min-w-0"><Cartao p={p} /></li>)}
      </ul>
    </div>
  )
}

function Cartao({ p }: { p: ProdutoVitrine }) {
  const noCarrinho = carrinho.use().some((i) => i.id === p.sku)
  const esgotado = p.estado === "esgotado" || p.disponivel === 0
  return (
    <Superficie nivel="card" className="flex h-full flex-col gap-3 p-4">
      <div className="grid gap-1">
        <p className="text-xs text-muted-foreground">{p.categoria}</p>
        <h3 className="text-base leading-snug font-medium text-pretty">
          <a href={ROTAS.produto(p.sku)} className="-my-2 line-clamp-2 min-h-10 rounded-sm py-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring" title={p.nome}>{p.nome}</a>
        </h3>
      </div>
      <FraseDoCliente p={PRODUTO[esgotado ? "esgotado" : p.estado]} acao={<span />} className={cn("text-muted-foreground", esgotado && "text-negativo-texto")} />
      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="num text-lg font-semibold">{moeda(p.preco)}</p>
        {esgotado ? (
          <LinkButton variant="outline" className="h-10" href={ROTAS.produto(p.sku)}>{PRODUTO.esgotado.acaoCliente}</LinkButton>
        ) : noCarrinho ? (
          <LinkButton variant="ghost" className="h-10" href={ROTAS.carrinho()}><Check /> No carrinho</LinkButton>
        ) : (
          <Button variant="secondary" className="h-10" onPress={() => void adicionarAoCarrinho(p.sku)}>Pôr no carrinho</Button>
        )}
      </div>
    </Superficie>
  )
}
