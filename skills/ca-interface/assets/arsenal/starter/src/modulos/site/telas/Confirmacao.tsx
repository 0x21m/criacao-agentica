// /site/confirmacao/?id=OS-1070 (ou PED-2215) · a confirmação (5.13; CLI-30, CLI-21; jornada da Juliana, passo 8).
// Número em destaque, o que acontece e quando, contato, o pedido no Portal, o comprovante e "Criar conta com este
// e-mail" (P: o protótipo mostra o código de 6 dígitos na tela). Sem vitrine. Ainda aguardando o Pix: o Pix aparece aqui.
import { useState } from "react"
import { ArrowRight, Check, KeyRound, MessageCircle, SearchX, Store } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FraseDoCliente } from "@/components/base/selos"
import { useProcessando } from "@/proto/dados"
import { EMPRESA } from "@/proto/negocio"
import { CLIENTE, ENTREGA, ETAPA_OS } from "@/proto/projecao"
import { Email } from "@/components/base/texto"
import { HORARIO, LOJA, PORTAL, ROTAS, SITE } from "@/proto/site"
import { moeda } from "@/lib/formato"
import { clientes } from "@/modulos/clientes/dados"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { lancamentos } from "@/modulos/financeiro/dados"
import { CODIGO_DEMONSTRACAO, confirmacaoDe, criarConta, vendasSite, type Confirmacao as Conf } from "../dados"
import { BannerDaEtapa, PixDoSite, useParametro } from "./comum"

export default function Confirmacao() {
  const id = useParametro("id")
  const os = pedidos.use(), ags = agendamentos.use(), lans = lancamentos.use(), vendas = vendasSite.use(), clis = clientes.use()
  if (id === undefined) {
    return (
      <BannerDaEtapa sobrelinha="Confirmação" titulo="Buscando seu pedido…">
        <div className="grid gap-3" aria-busy="true"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-24" /><Skeleton className="h-11 w-48" /></div>
      </BannerDaEtapa>
    )
  }
  const c = id ? confirmacaoDe(id, { os, ags, lans, vendas, clis }) : null
  if (!c) {
    return (
      <BannerDaEtapa sobrelinha="Confirmação" titulo="Não achamos este pedido">
        <div role="status" className="grid justify-items-start gap-3">
          <p className="flex items-start gap-2 text-sm text-pretty"><SearchX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            O número {id ? <span className="num font-medium">{id}</span> : ""} não é de um pedido feito por este site. Quem já tem conta acompanha tudo no portal.</p>
          <div className="flex flex-wrap gap-2">
            <LinkButton className="h-11" href={PORTAL.pedidos()}>Abrir meus pedidos</LinkButton>
            <LinkButton variant="ghost" className="h-11" href={ROTAS.inicio()}>Voltar ao site</LinkButton>
          </div>
        </div>
      </BannerDaEtapa>
    )
  }
  return c.tipo === "os" ? <DaOS c={c} /> : <DaVenda c={c} />
}

function Numero({ id }: { id: string }) {
  return (
    <div className="grid gap-1">
      <p className="t-rotulo">Número do pedido</p>
      <p className="num font-display text-[2rem] leading-none font-semibold tracking-tight">{id}</p>
    </div>
  )
}

function Passos({ itens }: { itens: string[] }) {
  return (
    <div className="grid gap-2">
      <h2 className="text-sm font-semibold">O que acontece agora</h2>
      <ol className="grid gap-2">
        {itens.map((t, i) => (
          <li key={t} className="flex items-start gap-3 text-sm text-pretty">
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>{t}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Contato() {
  return (
    <p className="flex items-start gap-2 text-sm text-pretty text-muted-foreground">
      <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>Dúvidas: WhatsApp <span className="whitespace-nowrap">{EMPRESA.whatsapp}</span>, {HORARIO[0].dias.toLowerCase()} das {HORARIO[0].horas}, ou pela conversa do pedido no portal.</span>
    </p>
  )
}

/** Criar a conta do portal com o e-mail do pedido (CLI-21: oferecida aqui, nunca antes do pagamento). */
function CriarConta({ cliente }: { cliente: Conf["cliente"] }) {
  const enviando = useProcessando().has(cliente.id)
  const [codigo, setCodigo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const criar = async () => { setErro(null); const r = await criarConta(cliente.id); if (r.ok) setCodigo(true); else setErro(r.mensagem) }
  if (cliente.temConta && !codigo) {
    return (
      <div className="grid gap-2 rounded-[var(--radius-lg)] bg-muted/60 p-4">
        <p className="min-w-0 text-sm text-pretty">O e-mail <Email email={cliente.email} /> já tem conta no portal. O pedido já aparece lá.</p>
        <LinkButton className="h-11 justify-self-start" href={PORTAL.entrada()}>Entrar no portal <ArrowRight /></LinkButton>
      </div>
    )
  }
  if (codigo) {
    return (
      <div role="status" className="grid gap-2 rounded-[var(--radius-lg)] bg-positive/10 p-4">
        <p className="flex items-start gap-2 text-sm font-medium"><Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" /><FraseDoCliente p={CLIENTE.lead} acao={<span />} className="inline" /></p>
        <p className="min-w-0 text-sm text-pretty">Mandamos um código para <Email email={cliente.email} />. Código de demonstração: <span className="num font-semibold tracking-widest">{CODIGO_DEMONSTRACAO}</span></p>
        <LinkButton className="h-11 justify-self-start" href={PORTAL.entrada()}>Entrar no portal <ArrowRight /></LinkButton>
      </div>
    )
  }
  return (
    <div className="grid gap-2 rounded-[var(--radius-lg)] bg-muted/60 p-4">
      <p className="text-sm text-pretty">Com a conta você acompanha os pedidos, aprova orçamentos e guarda os comprovantes. Sem senha: entra com um código no e-mail.</p>
      <Button className="h-11 justify-self-start" isPending={enviando} onPress={() => void criar()}><KeyRound /> {enviando ? "Criando…" : "Criar conta com este e-mail"}</Button>
      {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
    </div>
  )
}

function DaOS({ c }: { c: Extract<Conf, { tipo: "os" }> }) {
  const pago = c.titulo?.estado === "pago"
  const aguardando = c.titulo && c.titulo.estado !== "pago"
  const avaliacao = c.etapa === "solicitada"
  return (
    <BannerDaEtapa sobrelinha={<span className="num">Pedido {c.id}</span>} titulo={avaliacao ? "Pedido de avaliação recebido" : pago ? "Visita agendada e paga" : "Falta pagar o Pix"}
      descricao={c.servico}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Numero id={c.id} />
        {c.total > 0 && <div className="grid gap-1 text-right"><p className="t-rotulo">Total</p><p className="t-kpi num">{moeda(c.total)}</p></div>}
      </div>
      <div className="grid gap-1 rounded-[var(--radius-lg)] bg-muted/60 p-4 text-sm">
        <FraseDoCliente p={ETAPA_OS[c.etapa]} ctx={{ quando: c.inicio, ate: c.janelaAte }} acao={<span />} className="text-base font-medium" />
        {c.onde && <p className="text-muted-foreground">{c.tecnico ? `Técnico: ${c.tecnico} · ` : ""}{c.onde}</p>}
      </div>
      {aguardando && c.titulo && <PixDoSite l={c.titulo} nome={c.cliente.nome} />}
      <Passos itens={avaliacao
        ? ["Confirmamos o horário da visita até hoje, 17:00, por WhatsApp.", `O técnico faz o diagnóstico na visita de ${SITE.taxaVisita}.`, `O orçamento chega no portal em até 2 dias úteis e vale ${SITE.validadeOrcamentoDias} dias.`]
        : ["Na véspera, mandamos uma mensagem no WhatsApp com o nome do técnico.", "No dia, o portal mostra a janela em que ele chega.", `Depois do serviço, a garantia de ${SITE.garantiaDias} dias fica no pedido.`]} />
      {pago && c.titulo && !aguardando && <PixDoSite l={c.titulo} nome={c.cliente.nome} />}
      <CriarConta cliente={c.cliente} />
      <div className="flex flex-wrap gap-2">
        <LinkButton variant="outline" className="h-11" href={PORTAL.pedido(c.id)}>Acompanhar no portal</LinkButton>
        <LinkButton variant="ghost" className="h-11" href={ROTAS.inicio()}>Voltar ao site</LinkButton>
      </div>
      <Contato />
    </BannerDaEtapa>
  )
}

function DaVenda({ c }: { c: Extract<Conf, { tipo: "venda" }> }) {
  const v = c.venda
  const pago = v.estado === "pago"
  const retirar = v.entrega.tipo === "retirada"
  return (
    <BannerDaEtapa sobrelinha={<span className="num">Pedido {v.id}</span>} titulo={pago ? "Compra confirmada" : "Falta pagar o Pix"} descricao={`${v.itens.length} ${v.itens.length === 1 ? "item" : "itens"} · ${retirar ? "retirada na loja" : "entrega no endereço"}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Numero id={v.id} />
        <div className="grid gap-1 text-right"><p className="t-rotulo">Total</p><p className="t-kpi num">{moeda(v.total)}</p></div>
      </div>
      <ul className="grid gap-1 text-sm">
        {v.itens.map((i) => (
          <li key={i.sku} className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
            <span className="min-w-0 text-pretty">{i.qtd} × {i.nome}</span><span className="num shrink-0">{moeda(i.qtd * i.unitario)}</span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 py-1.5 text-muted-foreground"><span>{retirar ? "Retirada no balcão" : "Entrega"}</span><span className="num">{v.entrega.preco ? moeda(v.entrega.preco) : "Grátis"}</span></li>
      </ul>
      {pago && <FraseDoCliente p={ENTREGA.separando} acao={<span />} className="font-medium" />}
      {c.titulo && <PixDoSite l={c.titulo} nome={c.cliente.nome} />}
      <Passos itens={retirar
        ? [`${v.entrega.prazo}, no ${LOJA.retirada}.`, `Retire até 7 dias depois, ${HORARIO[0].dias.toLowerCase()} das ${HORARIO[0].horas} e sábado das ${HORARIO[1].horas}.`, "Leve um documento com foto e o número do pedido; outra pessoa pode retirar com o número."]
        : [`${v.entrega.prazo}.`, "No dia, avisamos por WhatsApp quando sair para entrega.", "Quem estiver no endereço recebe com o número do pedido."]} />
      <CriarConta cliente={c.cliente} />
      <div className="flex flex-wrap gap-2">
        <LinkButton variant="outline" className="h-11" href={PORTAL.pedidos()}>Ver meus pedidos no portal</LinkButton>
        <LinkButton variant="ghost" className="h-11" href={ROTAS.loja()}><Store /> Voltar à loja</LinkButton>
      </div>
      <Contato />
    </BannerDaEtapa>
  )
}
