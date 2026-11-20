// /site/carrinho/ · o carrinho deste aparelho (5.13): itens com quantidade, tirar (O com Desfazer), subtotal, a
// estimativa de frete por CEP e "Fechar a compra". Vazio: convite para a loja.
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { BotaoLiquido } from "@/components/movimento"
import { ROTAS } from "@/proto/site"
import { moeda } from "@/lib/formato"
import { produtos } from "@/modulos/estoque/dados"
import { carrinho, mudarQuantidade, tirarDoCarrinho, vitrine } from "../dados"
import { BannerDaEtapa } from "./comum"
import { Frete, useFrete } from "./frete"

export function useLinhasDoCarrinho() {
  const itens = carrinho.use()
  const todos = produtos.use()
  const linhas = itens.flatMap((i) => { const p = todos.find((x) => x.id === i.id); return p ? [{ i, p: vitrine(p) }] : [] })
  const subtotal = Math.round(linhas.reduce((s, l) => s + l.i.qtd * l.p.preco, 0) * 100) / 100
  return { linhas, subtotal }
}

export default function Carrinho() {
  const { linhas, subtotal } = useLinhasDoCarrinho()
  const f = useFrete(subtotal)
  if (!linhas.length) {
    return (
      <BannerDaEtapa sobrelinha="Loja online" titulo="Carrinho">
        <div role="status" className="grid justify-items-start gap-3">
          <p className="flex items-center gap-2 text-sm"><ShoppingBag className="size-4" aria-hidden="true" /> Seu carrinho está vazio. Os filtros e o material de limpeza estão na loja.</p>
          <LinkButton className="h-11" href={ROTAS.loja()}>Ver a loja</LinkButton>
        </div>
      </BannerDaEtapa>
    )
  }
  const falta = linhas.find((l) => l.i.qtd > l.p.disponivel)
  return (
    <BannerDaEtapa sobrelinha="Loja online" titulo="Carrinho" descricao={`${linhas.length} ${linhas.length === 1 ? "produto" : "produtos"} · subtotal ${moeda(subtotal)}`} largura={880}>
      <ul className="grid">
        {linhas.map(({ i, p }) => (
          <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-border/60 py-3 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto_7rem_auto]">
            <div className="min-w-0">
              <a href={ROTAS.produto(p.sku)} className="-my-2 line-clamp-2 min-h-10 py-2 text-sm font-medium text-pretty hover:underline focus-visible:outline-2 focus-visible:outline-ring">{p.nome}</a>
              <p className="num text-xs text-muted-foreground">{moeda(p.preco)} cada</p>
              {i.qtd > p.disponivel && <p role="alert" className="text-xs text-negativo-texto">Sobraram {p.disponivel} na loja.</p>}
            </div>
            <div role="group" aria-label={`Quantidade de ${p.nome}`} className="col-start-1 row-start-2 flex items-center justify-self-start rounded-[var(--radius-lg)] shadow-[inset_0_0_0_1px_var(--border)] sm:col-start-auto sm:row-start-auto">
              <Button variant="ghost" size="icon" className="size-10" aria-label="Menos um" isDisabled={i.qtd <= 1} onPress={() => void mudarQuantidade(i.id, i.qtd - 1)}><Minus /></Button>
              <output className="num w-8 text-center text-sm font-medium">{i.qtd}</output>
              <Button variant="ghost" size="icon" className="size-10" aria-label="Mais um" isDisabled={i.qtd >= p.disponivel} onPress={() => void mudarQuantidade(i.id, i.qtd + 1)}><Plus /></Button>
            </div>
            <p className="num text-right text-sm font-semibold">{moeda(i.qtd * p.preco)}</p>
            <Button variant="ghost" size="icon" className="size-10 justify-self-end" aria-label={`Tirar ${p.nome} do carrinho`} onPress={() => void tirarDoCarrinho(i.id)}><Trash2 /></Button>
          </li>
        ))}
      </ul>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <Frete f={f} titulo="Calcular a entrega" />
        <div className="grid gap-3">
          <div className="flex items-baseline justify-between gap-3"><span className="text-sm text-muted-foreground">Subtotal</span><span className="t-kpi num">{moeda(subtotal)}</span></div>
          <p className="text-xs text-pretty text-muted-foreground">A entrega e a retirada você escolhe no próximo passo. Retirar no balcão da Pampulha é grátis.</p>
          <BotaoLiquido className="h-11 w-full" disabled={!!falta} onClick={() => location.assign(ROTAS.checkout())}>Fechar a compra <ArrowRight className="size-4" /></BotaoLiquido>
          <LinkButton variant="ghost" className="h-11" href={ROTAS.loja()}>Continuar comprando</LinkButton>
        </div>
      </div>
    </BannerDaEtapa>
  )
}
