// /portal/pedido/?id=OS-1052 · acompanhar (5.12). Banner com o id e a frase de agora; o card sobreposto traz o próximo
// passo (aprovar, pagar, avaliar ou falar com a Oficina). Em 8 + 4: a linha do tempo do cliente (mais recente em cima,
// CLI-06) e os itens; o técnico, a visita, os comprovantes, a conversa, o cancelar (desabilitado com o motivo depois
// que o serviço começou, CLI-03) e "O que significa cada etapa". Link de outra conta: nenhum dado (PON-20).
import { useEffect, useState } from "react"
import { CalendarClock, ChevronRight, CircleHelp, MapPin, MessageCircle, ReceiptText, Star, X } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { BotaoLiquido } from "@/components/movimento"
import { marcarAberto, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { pedidos } from "@/modulos/pedidos/dados"
import { ETAPAS_DO_CLIENTE, FRASES, avaliar, buscarPedido, cancelarPedido, useDadosDoCliente, type PedidoCliente } from "../dados"
import { BannerCliente, ComDadosCliente, EsqueletoCliente, NaoAchado, OutraConta, Secao, diaHora, diaSemana, hora, ir, useParametro } from "./comum"

export default function Pedido() {
  const id = useParametro("id")
  const dados = useDadosDoCliente()
  const achado = id ? buscarPedido(dados, id) : null
  const pedido = achado && "pedido" in achado ? achado.pedido : undefined
  // a barra F oferece "Outra pessoa mexe neste registro" (sobe a versão: o cancelar confere)
  useEffect(() => { marcarAberto(pedido?.tipo === "os" ? (pedidos as unknown as Colecao<Registro>) : null, pedido?.id); return () => marcarAberto(null) }, [pedido?.id, pedido?.tipo])
  if (id === undefined) return <EsqueletoCliente titulo="Pedido" />
  return (
    <ComDadosCliente oQue="o pedido" titulo="Pedido">
      {() => !achado ? <NaoAchado /> : "erro" in achado ? (achado.erro === "outra-conta" ? <OutraConta /> : <NaoAchado />) : <Detalhe p={achado.pedido} />}
    </ComDadosCliente>
  )
}

function Detalhe({ p }: { p: PedidoCliente }) {
  const [cancelar, setCancelar] = useState(false)
  const visita = p.visitas.at(-1)
  const pagos = p.cobrancas.filter((c) => c.estado === "pago")
  return (
    <>
      <BannerCliente sobrelinha={<span className="num">{p.id} · {p.tipo === "venda" ? "Compra na loja" : "Serviço"}</span>} titulo={p.titulo}
        descricao={<FraseDoCliente p={p.p} ctx={p.ctx} acao={<span />} className="text-sm" />}>
        <ProximoPasso p={p} />
      </BannerCliente>

      <div className="grid gap-6 px-3 pt-6 md:px-6 lg:grid-cols-12 lg:gap-8">
        <div className="grid content-start gap-6 self-start lg:col-span-8">
          <Secao titulo="Linha do tempo">
            <Superficie className="p-4 md:p-5"><LinhaDoTempo eventos={p.historico} versao="cliente" limite={8} /></Superficie>
          </Secao>
          {p.itens.length > 0 && (
            <Secao titulo={p.tipo === "venda" ? "Itens" : "O que está no pedido"}>
              <Superficie className="grid gap-0 px-4 py-2 md:px-5">
                {p.itens.map((i, n) => (
                  <div key={n} className="flex items-baseline gap-3 border-b border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] py-2.5 text-sm last:border-0">
                    <span className="min-w-0 flex-1 text-pretty">{i.qtd > 1 ? `${i.qtd} × ` : ""}{i.descricao}</span>
                    <span className="num shrink-0 whitespace-nowrap">{moeda(i.qtd * i.unitario)}</span>
                  </div>
                ))}
                <div className="flex items-baseline gap-3 py-2.5 text-sm font-semibold"><span className="flex-1">Total</span><span className="num whitespace-nowrap">{moeda(p.total)}</span></div>
              </Superficie>
            </Secao>
          )}
        </div>

        <aside className="grid content-start gap-6 self-start lg:col-span-4" aria-label="Visita, comprovantes e ajuda">
          {(p.tecnico || visita) && (
            <Secao titulo="Visita">
              <Superficie className="grid gap-3 p-4">
                {p.tecnico && (
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden="true">{p.tecnico[0]}</span>
                    <div><p className="text-sm font-medium">{p.tecnico}</p><p className="text-xs text-muted-foreground">Técnico da Oficina Norte</p></div>
                  </div>
                )}
                {visita && (
                  <>
                    <p className="flex items-start gap-2 text-sm"><CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span><span className="num">{diaSemana(visita.inicio)}, {hora(visita.inicio)} a {hora(visita.fim)}</span><FraseDoCliente p={visita.p} ctx={visita.ctx} acao={<span />} className="text-muted-foreground" /></span></p>
                    <p className="flex items-start gap-2 text-sm text-pretty"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{visita.onde}</p>
                  </>
                )}
              </Superficie>
            </Secao>
          )}
          {pagos.length > 0 && (
            <Secao titulo="Comprovantes">
              <Superficie className="grid gap-1 p-2">
                {pagos.map((c) => (
                  <a key={c.id} href={ir.pagar(c.id)} className="flex min-h-12 items-center gap-3 rounded-[var(--radius-lg)] px-2 py-2 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ReceiptText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm"><span className="num">{moeda(c.valor)}</span> · {c.pagoEm ? diaHora(c.pagoEm) : ""}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </a>
                ))}
              </Superficie>
            </Secao>
          )}
          <Secao titulo="Precisa de algo?">
            <Superficie className="grid gap-3 p-4">
              <LinkButton variant="outline" className="h-10 justify-start" href={ir.conversa(p.id)}><MessageCircle /> Falar com a Oficina</LinkButton>
              {p.tipo === "os" && p.etapa !== "pronta" && p.etapa !== "entregue" && p.etapa !== "cancelada" && (
                p.podeCancelar ? (
                  <Button variant="ghost" className="h-10 justify-start text-negativo-texto" onPress={() => setCancelar(true)}><X /> Cancelar o pedido</Button>
                ) : (
                  <div className="grid gap-1.5">
                    <Button variant="ghost" className="h-10 justify-start" isDisabled aria-describedby={`motivo-${p.id}`}><X /> Cancelar o pedido</Button>
                    <p id={`motivo-${p.id}`} className="text-xs text-pretty text-muted-foreground" title={p.motivoSemCancelar}>{FRASES.servicoComecou}</p>
                  </div>
                )
              )}
            </Superficie>
          </Secao>
          {p.tipo === "os" && <Etapas atual={p.etapa} />}
        </aside>
      </div>

      {p.tipo === "os" && (
        <DialogoConfirmar aberto={cancelar} aoFechar={() => setCancelar(false)} titulo="Cancelar o pedido?" perigo
          descricao={<>{visita ? <>A visita de <span className="num">{diaSemana(visita.inicio)}, {hora(visita.inicio)}</span> é cancelada junto. </> : null}Nada é cobrado e a Oficina recebe o aviso na hora.</>}
          confirmar="Cancelar o pedido" voltar="Manter o pedido" aoConfirmar={() => cancelarPedido(p.id, p.versao)} />
      )}
    </>
  )
}

/** O card sobreposto: o próximo passo deste pedido. */
function ProximoPasso({ p }: { p: PedidoCliente }) {
  const cobranca = p.cobrancas.find((c) => c.aberta)
  if (p.etapa === "aguardando_aprovacao" && p.orcamento?.estado === "enviado") {
    return (
      <Passo valor={p.total} texto={p.orcamento.mudou ?? `Orçamento v${p.orcamento.versao} pronto para você decidir.`}>
        <BotaoLiquido href={ir.orcamento(p.id)} className="h-10">Ver e aprovar o orçamento</BotaoLiquido>
      </Passo>
    )
  }
  if (cobranca) {
    return (
      <Passo valor={cobranca.valor} texto={<FraseDoCliente p={cobranca.p} ctx={cobranca.ctx} acao={<span />} />}>
        <BotaoLiquido href={ir.pagar(cobranca.id)} className="h-10">{cobranca.expirado ? "Gerar novo código Pix" : "Pagar"}</BotaoLiquido>
      </Passo>
    )
  }
  if (p.etapa === "entregue") return <Avaliar p={p} />
  if (p.orcamento?.estado === "expirado") {
    return (
      <Passo texto={<FraseDoCliente p={p.p} ctx={p.ctx} acao={<span />} />}>
        <BotaoLiquido href={ir.conversa(p.id, "Podem mandar uma nova versão do orçamento?")} className="h-10">Pedir nova versão</BotaoLiquido>
      </Passo>
    )
  }
  return (
    <Passo texto={p.tecnico ? `${p.tecnico} cuida do seu pedido. Qualquer dúvida, fale com a gente por aqui.` : "Qualquer dúvida sobre o pedido, fale com a gente por aqui."}>
      <LinkButton variant="outline" className="h-10" href={ir.conversa(p.id)}><MessageCircle /> Falar com a Oficina</LinkButton>
    </Passo>
  )
}

function Passo({ valor, texto, children }: { valor?: number; texto: React.ReactNode; children: React.ReactNode }) {
  return (
    <Superficie nivel="destaque" material="vidro" refracao raio={28} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 md:p-6">
      <div className="grid min-w-0 gap-1 text-sm text-pretty">{valor ? <p className="t-kpi num">{moeda(valor)}</p> : null}<div>{texto}</div></div>
      <div className="flex flex-wrap gap-2 md:justify-end">{children}</div>
    </Superficie>
  )
}

/** Avaliar depois de entregue: nota de 1 a 5 e comentário (O). */
function Avaliar({ p }: { p: PedidoCliente }) {
  const [nota, setNota] = useState(0)
  const [texto, setTexto] = useState("")
  const ocupado = useProcessando().has(p.id)
  if (p.avaliacao) {
    return <Passo texto={<><FraseDoCliente p={p.p} ctx={p.ctx} acao={<span />} /><p className="text-muted-foreground">{FRASES.avaliado(p.avaliacao)}</p></>}><span /></Passo>
  }
  return (
    <Superficie nivel="destaque" material="vidro" refracao raio={28} className="grid gap-3 p-5 md:p-6">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Como foi o serviço?</legend>
        <div className="flex gap-1" role="group" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button key={n} variant="ghost" size="icon-lg" className="size-10" aria-label={`${n} de 5`} aria-pressed={nota === n} onPress={() => setNota(n)}>
              <Star className={cn("size-5", n <= nota ? "fill-current text-primary" : "text-muted-foreground")} />
            </Button>
          ))}
        </div>
      </fieldset>
      <Textarea aria-label="Comentário (opcional)" placeholder="Conte o que achou (opcional)" value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-16" />
      <Button className="h-10 justify-self-start" isDisabled={!nota} isPending={ocupado} onPress={() => void avaliar(p.id, nota, texto)}>Enviar avaliação</Button>
    </Superficie>
  )
}

/** "O que significa cada etapa": a lista das etapas como o cliente lê, com a de agora marcada. */
function Etapas({ atual }: { atual?: string }) {
  return (
    <details className="group sup rounded-[var(--raio-sup)] p-1" data-nivel="card">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-[var(--radius-lg)] px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <CircleHelp className="size-4 text-muted-foreground" aria-hidden="true" /> O que significa cada etapa
        <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <ol className="grid gap-2 px-3 pt-1 pb-3">
        {ETAPAS_DO_CLIENTE.map((e) => (
          <li key={e.etapa} className={cn("grid gap-0.5 rounded-[var(--radius-lg)] px-2 py-1.5 text-sm", e.etapa === atual && "bg-[color-mix(in_oklch,var(--primary)_12%,transparent)]")} aria-current={e.etapa === atual ? "step" : undefined}>
            <span className="font-medium">{e.titulo}</span>
            <span className="text-xs text-pretty text-muted-foreground">{e.texto}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}
