// /portal/ · "o que está acontecendo comigo" (5.12). Banner completo "Olá, Juliana" (TextoRevelado) com o card do
// pedido ativo sobreposto em vidro líquido (Superficie destaque com refração): a frase dele e a ação primeiro (CLI-10).
// No dia da visita, o rastreio "Bruno está a caminho" com o ponto ao vivo (momento-assinatura). Abaixo, em 8 + 4
// colunas: os outros pedidos em andamento; a pagar, as próximas visitas, as conversas e a ajuda.
// ?acao=agendar|avaliacao|loja&servico= (os botões do site chegam aqui): o card do que a pessoa pediu vem primeiro.
import { CalendarClock, CalendarPlus, ChevronRight, CircleHelp, MessageCircle, QrCode, Store } from "lucide-react"
import { LinkButton } from "@/components/ui/button"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { BotaoLiquido, PulsoAoVivo, TextoRevelado } from "@/components/movimento"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { EMPRESA } from "@/proto/negocio"
import { mesmoDia, useAgora } from "@/proto/relogio"
import { HORARIO, servicoPorId } from "@/proto/site"
import { moeda } from "@/lib/formato"
import { FRASES, useDadosDoCliente, type DadosDoCliente, type PedidoCliente } from "../dados"
import { BannerCliente, CartaoPedido, ComDadosCliente, Secao, WHATSAPP, dataExtensa, diaSemana, hora, ir } from "./comum"

export default function Inicio() {
  const dados = useDadosDoCliente()
  const agora = useAgora()
  const [q] = useParametrosDaUrl({ acao: "", servico: "" })
  const andamento = dados.pedidos.filter((p) => p.fase !== "concluido" && p.id !== dados.ativo?.id && !p.cobrancas.some((c) => c.aberta))
  return (
    <ComDadosCliente estaVazio={!dados.pedidos.length} titulo={`Olá, ${dados.cliente.primeiroNome}`}>
      <BannerCliente
        sobrelinha={<span className="first-letter:uppercase">{dataExtensa(agora)}</span>}
        titulo={<TextoRevelado como="span" texto={`Olá, ${dados.cliente.primeiroNome}`} />}
        descricao="Acompanhe seus pedidos, aprove orçamentos e pague por aqui."
      >
        {dados.ativo ? <CartaoAtivo p={dados.ativo} dados={dados} /> : <SemPedidoAtivo />}
      </BannerCliente>

      <div className="grid gap-6 px-3 pt-6 md:px-6 lg:grid-cols-12 lg:gap-8">
        <div className="grid content-start gap-6 self-start lg:col-span-8">
          {q.acao && <PedidoDoSite acao={q.acao} servico={q.servico} />}
          <Secao titulo="Em andamento" acao={<LinkButton variant="ghost" className="h-10" href={ir.pedidos()}>Todos os pedidos <ChevronRight /></LinkButton>}>
            {andamento.length ? (
              <div className="grid gap-3 md:grid-cols-2">{andamento.slice(0, 4).map((p) => <CartaoPedido key={p.id} p={p} />)}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Nada mais em andamento além do pedido acima.</p>
            )}
          </Secao>
          <Secao titulo="Próximas visitas">
            {dados.visitas.length ? (
              <Superficie como="div" className="divide-y divide-[color-mix(in_oklch,var(--foreground)_8%,transparent)] px-4 md:px-5">
                {dados.visitas.slice(0, 3).map((v) => (
                  <a key={v.id} href={v.pedidoId ? ir.pedido(v.pedidoId) : ir.conversa()} className="group flex min-h-14 items-center gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium"><span className="num">{mesmoDia(new Date(v.inicio), agora) ? "Hoje" : diaSemana(v.inicio)}, {hora(v.inicio)} a {hora(v.fim)}</span>{v.tecnico ? ` · ${v.tecnico}` : ""}{v.pedidoId ? <span className="num text-muted-foreground"> · <span className="whitespace-nowrap">{v.pedidoId}</span></span> : null}</span>
                      <FraseDoCliente p={v.p} ctx={v.ctx} acao={<span />} className="text-muted-foreground" />
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </a>
                ))}
              </Superficie>
            ) : <p className="text-sm text-muted-foreground">Nenhuma visita marcada.</p>}
          </Secao>
        </div>

        <aside className="grid content-start gap-6 self-start lg:col-span-4" aria-label="A pagar, conversas e ajuda">
          <Secao titulo="A pagar">
            {dados.cobrancas.filter((c) => c.aberta).length ? dados.cobrancas.filter((c) => c.aberta).map((c) => (
              <Superficie key={c.id} className="grid gap-3 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm" title={`${c.ref ?? c.id} · ${c.descricao}`}>{c.ref ?? c.id} · {c.descricao}</p>
                  <span className="num shrink-0 text-sm font-semibold whitespace-nowrap">{moeda(c.valor)}</span>
                </div>
                <FraseDoCliente p={c.p} ctx={c.ctx} acao={<span />} className="text-muted-foreground" />
                <LinkButton variant="outline" className="h-10 justify-self-start" href={ir.pagar(c.id)}><QrCode /> {c.expirado ? "Gerar novo código" : "Pagar"}</LinkButton>
              </Superficie>
            )) : <p className="text-sm text-muted-foreground">Nada a pagar agora.</p>}
          </Secao>
          <Secao titulo="Conversas">
            <Superficie className="grid gap-1 p-2">
              {dados.conversas.slice(0, 3).map((c) => (
                <a key={c.id} href={ir.conversa(c.ref)} className="flex min-h-12 items-start gap-3 rounded-[var(--radius-lg)] px-2 py-2 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <MessageCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">{c.ref ?? "Geral"}{c.novas > 0 && <span className="rounded-full bg-primary px-1.5 text-2xs font-semibold text-primary-foreground num">{c.novas}</span>}</span>
                    {c.ultima && <span className="line-clamp-1 text-xs text-muted-foreground" title={c.ultima.texto}>{c.ultima.daOficina ? "" : "Você: "}{c.ultima.texto}</span>}
                  </span>
                </a>
              ))}
              <LinkButton variant="ghost" className="h-10 justify-start" href={ir.conversa()}><MessageCircle /> Nova conversa</LinkButton>
            </Superficie>
          </Secao>
          <Secao titulo="Ajuda">
            <Superficie className="grid gap-2 p-4 text-sm">
              <p className="flex items-start gap-2 text-pretty"><CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                WhatsApp <span className="num whitespace-nowrap">{EMPRESA.whatsapp}</span></p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
                {HORARIO.map((hh) => <div key={hh.dias} className="contents"><dt>{hh.dias}</dt><dd className="text-right num">{hh.horas}</dd></div>)}
              </dl>
              <LinkButton variant="outline" className="mt-1 h-10 justify-self-start" href={WHATSAPP} target="_blank" rel="noopener">Falar no WhatsApp</LinkButton>
            </Superficie>
          </Secao>
        </aside>
      </div>
    </ComDadosCliente>
  )
}

/** O card sobreposto: o pedido que pede ação primeiro, a frase, o valor e a ação. */
function CartaoAtivo({ p, dados }: { p: PedidoCliente; dados: DadosDoCliente }) {
  const cobranca = p.cobrancas.find((c) => c.aberta)
  const acao = p.etapa === "aguardando_aprovacao" && p.orcamento?.estado === "enviado" ? { rotulo: "Ver e aprovar o orçamento", href: ir.orcamento(p.id) }
    : cobranca ? { rotulo: cobranca.expirado ? "Gerar novo código Pix" : "Pagar com Pix", href: ir.pagar(cobranca.id) }
    : p.etapa === "aguardando_aprovacao" ? { rotulo: "Pedir nova versão", href: ir.conversa(p.id, "Podem mandar uma nova versão do orçamento?") }
    : { rotulo: "Acompanhar o pedido", href: ir.pedido(p.id) }
  const valor = p.etapa === "aguardando_aprovacao" || p.etapa === "pronta" ? p.total : cobranca?.valor
  // o herói é de UM pedido: o "a caminho" só entra quando a visita é deste pedido (a de outro fica em Próximas visitas)
  const caminho = dados.aCaminho?.pedidoId === p.id ? dados.aCaminho : undefined
  return (
    <Superficie nivel="destaque" material="vidro" refracao raio={28} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6 md:p-6">
      <div className="grid min-w-0 gap-2">
        <p className="t-rotulo num">{p.id} · {p.tipo === "venda" ? "Loja" : "Serviço"}</p>
        <p className="t-card">{p.titulo}</p>
        <FraseDoCliente p={p.p} ctx={p.ctx} acao={<span />} className="text-base" />
        {caminho && (
          <p className="flex items-center gap-2 text-sm" aria-live="polite">
            <PulsoAoVivo tom="sucesso" chave={caminho.id} />
            <span className="num">{FRASES.aCaminho({ tecnico: caminho.tecnico, quando: caminho.inicio, ate: new Date(new Date(caminho.inicio).getTime() + 20 * 60000).toISOString() })}</span>
          </p>
        )}
      </div>
      <div className="grid gap-3 md:justify-items-end">
        {valor ? <p className="t-kpi num">{moeda(valor)}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <LinkButton variant="ghost" className="h-10" href={ir.pedido(p.id)}>Ver pedido</LinkButton>
          <BotaoLiquido href={acao.href} className="h-10 w-full sm:w-auto">{acao.rotulo}</BotaoLiquido>
        </div>
      </div>
    </Superficie>
  )
}

function SemPedidoAtivo() {
  return (
    <Superficie nivel="destaque" material="vidro" refracao raio={28} className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
      <p className="text-base text-pretty">Nada pedindo a sua atenção agora.</p>
      <BotaoLiquido href={ir.agendar("limpeza-split")} className="h-10"><CalendarPlus className="size-4" /> Agendar uma limpeza</BotaoLiquido>
    </Superficie>
  )
}

/** O que a pessoa pediu no site (?acao=): o próximo passo dele, no portal. */
function PedidoDoSite({ acao, servico }: { acao: string; servico: string }) {
  const s = servicoPorId(servico)
  if (acao === "loja") {
    return (
      <Superficie tom="info" className="flex flex-wrap items-center gap-3 p-4 md:p-5">
        <Store className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-pretty">Peças e aparelhos da loja: diga o que procura e a Oficina separa para você retirar ou receber.</p>
        <LinkButton className="h-10" href={ir.conversa(undefined, "Procuro uma peça da loja: ")}>Pedir pela conversa</LinkButton>
      </Superficie>
    )
  }
  return (
    <Superficie tom="info" className="flex flex-wrap items-center gap-3 p-4 md:p-5">
      <CalendarPlus className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-pretty">
        {acao === "avaliacao" ? "Você pediu uma avaliação" : "Você escolheu"}{s ? <>: <strong className="font-medium">{s.nome}</strong> ({s.valor})</> : "."}
      </p>
      <LinkButton className="h-10" href={ir.agendar(servico || undefined)}>{acao === "avaliacao" ? "Pedir a avaliação" : "Escolher o horário"}</LinkButton>
    </Superficie>
  )
}
