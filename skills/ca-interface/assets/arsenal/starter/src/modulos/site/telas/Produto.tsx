// /site/loja/<sku>/ · a página do produto (5.13; CLI-37, CLI-38, CLI-39). Preço, disponibilidade na frase do cliente,
// quantidade, "Pôr no carrinho" (O), frete por CEP com a retirada no mesmo seletor e as regras da retirada. Esgotado:
// "Avise-me" (P). Fora de linha: a página continua no ar com "Fora de linha" e três semelhantes, nunca 404.
import { useState } from "react"
import { BellRing, Check, Minus, Plus, Store } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Superficie } from "@/components/sistema/Superficie"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { FraseDoCliente } from "@/components/base/selos"
import { BotaoLiquido } from "@/components/movimento"
import { PRODUTO } from "@/proto/projecao"
import { HORARIO, ROTAS } from "@/proto/site"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { produtos } from "@/modulos/estoque/dados"
import { adicionarAoCarrinho, aviseMe, carrinho, naVitrine, retirada, vitrine, type ProdutoVitrine } from "../dados"
import { Campo, Texto } from "./comum"
import { Frete, useFrete } from "./frete"
import { LinkCarrinho } from "./Loja"

export default function Produto({ sku }: { sku: string }) {
  const todos = produtos.use()
  const cru = todos.find((p) => p.id === sku)
  if (!cru) return null
  const p = vitrine(cru)
  const foraDeLinha = p.estado === "inativo" || !cru.vendavelOnline
  const esgotado = !foraDeLinha && (p.estado === "esgotado" || p.disponivel === 0)
  const semelhantes = todos.filter((x) => x.id !== sku && x.categoria === cru.categoria && naVitrine(x)).map(vitrine).filter((x) => x.disponivel > 0).slice(0, 3)
  return (
    <div className="escopo-starter">
      <BannerSobreposto variante="completa" sobrelinha={<a href={ROTAS.loja(cru.categoria)} className="-my-3 inline-flex min-h-10 items-center hover:underline">{cru.categoria}</a>} titulo={p.nome}
        sobreposicao={64}>
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Superficie nivel="card" className="grid content-start gap-4 p-5 md:p-6">
            {foraDeLinha ? <ForaDeLinha /> : esgotado ? <Esgotado sku={sku} /> : <Comprar sku={sku} preco={p.preco} max={p.disponivel} estado={p.estado} />}
          </Superficie>
          {!foraDeLinha && <Entrega preco={p.preco} />}
        </div>
      </BannerSobreposto>
      {(foraDeLinha || esgotado) && semelhantes.length > 0 && (
        <section aria-labelledby="semelhantes-h" className="mt-8 grid gap-3">
          <h2 id="semelhantes-h" className="text-lg font-semibold">Semelhantes em estoque</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {semelhantes.map((s) => (
              <li key={s.sku}>
                <Superficie nivel="card" interativa className="grid h-full gap-1 p-4">
                  <a href={ROTAS.produto(s.sku)} className="-my-2 line-clamp-2 min-h-10 py-2 font-medium text-pretty hover:underline focus-visible:outline-2 focus-visible:outline-ring">{s.nome}</a>
                  <span className="num text-sm text-muted-foreground">{moeda(s.preco)}</span>
                </Superficie>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Comprar({ sku, preco, max, estado }: { sku: string; preco: number; max: number; estado: ProdutoVitrine["estado"] }) {
  const [qtd, setQtd] = useState(1)
  const noCarrinho = carrinho.use().find((i) => i.id === sku)
  const [erro, setErro] = useState<string | null>(null)
  const por = async () => { setErro(null); const r = await adicionarAoCarrinho(sku, qtd); if (!r.ok) setErro(r.mensagem) }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="t-kpi num">{moeda(preco * qtd)}</p>
        {qtd > 1 && <p className="num text-sm text-muted-foreground">{qtd} × {moeda(preco)}</p>}
      </div>
      <FraseDoCliente p={PRODUTO[estado]} acao={<span />} className="font-medium" />
      <div className="flex items-center gap-3">
        <span id="qtd-rotulo" className="text-sm font-medium">Quantidade</span>
        <div role="group" aria-labelledby="qtd-rotulo" className="flex items-center rounded-[var(--radius-lg)] shadow-[inset_0_0_0_1px_var(--border)]">
          <Button variant="ghost" size="icon" className="size-10" aria-label="Menos um" isDisabled={qtd <= 1} onPress={() => setQtd((q) => Math.max(1, q - 1))}><Minus /></Button>
          <output aria-live="polite" className="num w-8 text-center text-sm font-medium">{qtd}</output>
          <Button variant="ghost" size="icon" className="size-10" aria-label="Mais um" isDisabled={qtd >= max} onPress={() => setQtd((q) => Math.min(max, q + 1))}><Plus /></Button>
        </div>
        {max <= 3 && <span className="text-xs text-muted-foreground">{max} na loja</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <BotaoLiquido className="h-11 min-w-[12rem]" onClick={() => void por()}>{noCarrinho ? `Pôr mais ${qtd}` : "Pôr no carrinho"}</BotaoLiquido>
        {noCarrinho && <LinkButton variant="outline" className="h-11" href={ROTAS.checkout()}><Check /> Fechar a compra</LinkButton>}
      </div>
      {noCarrinho && <p role="status" className="text-sm text-muted-foreground"><span className="num">{noCarrinho.qtd}</span> no carrinho.</p>}
      {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
      <LinkCarrinho className="justify-self-start" />
    </>
  )
}

function Esgotado({ sku }: { sku: string }) {
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState<"editando" | "enviando" | "feito">("editando")
  const [erro, setErro] = useState<string | null>(null)
  const enviar = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setErro("Confira o e-mail: falta o @ ou o domínio."); return }
    setErro(null); setEstado("enviando")
    const r = await aviseMe(email, { sku })
    if (r.ok) setEstado("feito"); else { setEstado("editando"); setErro(r.mensagem) }
  }
  return (
    <>
      <FraseDoCliente p={PRODUTO.esgotado} acao={<span />} className="font-medium text-negativo-texto" />
      {estado === "feito" ? (
        <p role="status" className="flex items-start gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" /> Combinado. Avisamos em {email} quando chegar.</p>
      ) : (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
          <Campo id="email-aviso" rotulo="Seu e-mail" erro={erro}><Texto id="email-aviso" type="email" valor={email} aoMudar={setEmail} autoComplete="email" invalido={!!erro} /></Campo>
          <Button type="submit" className="h-11 justify-self-start" isPending={estado === "enviando"}><BellRing /> Avise-me quando chegar</Button>
        </form>
      )}
    </>
  )
}

function ForaDeLinha() {
  return (
    <div role="status" className="grid gap-3">
      <FraseDoCliente p={PRODUTO.inativo} acao={<span />} className="text-base font-medium" />
      <p className="text-sm text-pretty text-muted-foreground">Este produto não é mais vendido. Veja os semelhantes abaixo ou fale com o balcão.</p>
      <LinkButton variant="outline" className="h-11 justify-self-start" href={ROTAS.loja()}><Store /> Ver a loja</LinkButton>
    </div>
  )
}

/** Entrega e retirada num seletor só (CLI-38), com as regras da retirada (CLI-39). */
function Entrega({ preco }: { preco: number }) {
  const f = useFrete(preco)
  const r = retirada()
  return (
    <Superficie nivel="card" className="grid content-start gap-4 p-5 md:p-6">
      <div className="grid gap-1 text-sm">
        <h2 className="text-sm font-semibold">Retirada na loja</h2>
        <p><span className="font-medium">{r.prazo}</span> · grátis</p>
        <p className="text-pretty text-muted-foreground">Balcão da Pampulha, Bandeirantes. {HORARIO[0].dias} das {HORARIO[0].horas}, sábado das {HORARIO[1].horas}. Leve o número do pedido e um documento com foto.</p>
      </div>
      <div className={cn("border-t border-border/70 pt-4")}><Frete f={f} titulo="Entrega no endereço" /></div>
    </Superficie>
  )
}
