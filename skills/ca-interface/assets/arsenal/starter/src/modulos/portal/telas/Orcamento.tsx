// /portal/orcamento/?id=OS-1052 · aprovar ou recusar (5.12). Coluna central de 640 px: os itens (mão de obra e peças
// com os valores), as condições, o início previsto e "Válido até 26/11", e o total junto dos botões (CLI-11).
// Aprovar (principal) e Recusar (contornado, do mesmo tamanho, ao lado, CLI-13). Aprovar é P e confere a versão lida
// (conflito: "O orçamento mudou enquanto você lia."); Recusar abre a folha com o motivo opcional e o que acontece
// depois. Já decidido (PON-21), expirado, recusado e sem orçamento têm o próprio estado, sem botão morto.
import { useEffect, useState } from "react"
import { Check, CircleAlert, MessageCircle, X } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { marcarAberto, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { EMPRESA } from "@/proto/negocio"
import { ETAPA_OS, ORCAMENTO } from "@/proto/projecao"
import { moeda } from "@/lib/formato"
import { pedidos } from "@/modulos/pedidos/dados"
import { FRASES, aprovarOrcamento, buscarPedido, recusarOrcamento, useDadosDoCliente, type PedidoCliente } from "../dados"
import { BannerCliente, ComDadosCliente, EsqueletoCliente, NaoAchado, OutraConta, diaSemana, ir, useParametro } from "./comum"

const data = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—")

export default function Orcamento() {
  const id = useParametro("id")
  const dados = useDadosDoCliente()
  const achado = id ? buscarPedido(dados, id) : null
  const p = achado && "pedido" in achado ? achado.pedido : undefined
  useEffect(() => { marcarAberto(p?.tipo === "os" ? (pedidos as unknown as Colecao<Registro>) : null, p?.id); return () => marcarAberto(null) }, [p?.id, p?.tipo])
  if (id === undefined) return <EsqueletoCliente titulo="Orçamento" />
  return (
    <ComDadosCliente oQue="o orçamento" titulo="Orçamento">
      {() => !achado ? <NaoAchado oQue="Orçamento" /> : "erro" in achado ? (achado.erro === "outra-conta" ? <OutraConta /> : <NaoAchado oQue="Orçamento" />) : <Tela p={achado.pedido} />}
    </ComDadosCliente>
  )
}

function Tela({ p }: { p: PedidoCliente }) {
  const o = p.orcamento
  // a versão que a pessoa leu: se mudar enquanto ela lê, aprovar recusa com a frase de conflito
  const [lida, setLida] = useState(p.versao)
  const [decidiuAgora, setDecidiuAgora] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [recusar, setRecusar] = useState(false)
  const ocupado = useProcessando().has(p.id)
  const aberto = p.etapa === "aguardando_aprovacao" && o?.estado === "enviado"

  async function aprovar() {
    setErro(null)
    const r = await aprovarOrcamento(p.id, lida)
    if (r.ok) setDecidiuAgora(true)
    else { setErro(r.mensagem); if (r.motivo === "conflito") setLida(pedidos.porId(p.id)?.versao ?? lida) }
  }

  const maoDeObra = p.itens.filter((i) => i.tipo === "mao_de_obra")
  const pecas = p.itens.filter((i) => i.tipo !== "mao_de_obra")
  return (
    <>
      <BannerCliente sobrelinha={<span className="num">{p.id} · Orçamento{o && o.versao > 1 ? ` (${o.versao}ª versão)` : ""}</span>} titulo={p.titulo}
        descricao={aberto ? <FraseDoCliente p={ETAPA_OS.aguardando_aprovacao} ctx={{ valor: p.total, ate: o?.validoAte }} acao={<span />} /> : undefined}>
        <Superficie nivel="card" className="grid w-full max-w-[640px] gap-5 p-5 md:p-6">
          {!o || o.estado === "rascunho" ? (
            <Fim texto="O técnico ainda está preparando o orçamento deste pedido. Avisamos quando ele chegar." p={p} />
          ) : o.estado === "aprovado" ? (
            <Fim icone="ok" texto={decidiuAgora ? p.frase ?? "" : FRASES.jaAprovado({ quando: o.decididoEm })} p={p} />
          ) : o.estado === "recusado" ? (
            <Fim texto={ORCAMENTO.recusado.cliente!({ quando: o.decididoEm })} p={p} />
          ) : o.estado === "expirado" ? (
            <Fim texto={ORCAMENTO.expirado.cliente!({ ate: o.validoAte })} p={p} novaVersao />
          ) : (
            <>
              {o.mudou && (
                <p role="status" className="flex items-start gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_16%,transparent)] px-3 py-2.5 text-sm text-pretty">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{o.mudou}
                </p>
              )}
              <Grupo titulo="Mão de obra" itens={maoDeObra} />
              <Grupo titulo="Peças" itens={pecas} />
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pt-4 text-sm">
                <dt className="text-muted-foreground">Início previsto</dt><dd className="num text-right">{p.prazo ? diaSemana(p.prazo) : "a combinar"}</dd>
                <dt className="text-muted-foreground">Válido até</dt><dd className="num text-right font-medium">{data(o.validoAte)}</dd>
                <dt className="text-muted-foreground">Garantia</dt><dd className="text-right">{EMPRESA.garantiaDias} dias da entrega</dd>
              </dl>
              <p className="text-xs text-pretty text-muted-foreground">A visita de diagnóstico ({moeda(EMPRESA.taxaVisita)}) é abatida se você aprovar. Se recusar, só ela é cobrada.</p>
              <div className="grid gap-3 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-3 md:p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">Total</span>
                  <span className="t-kpi num">{moeda(p.total)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11" isDisabled={ocupado} onPress={() => setRecusar(true)}><X /> Recusar</Button>
                  <Button className="h-11 min-w-0" isPending={ocupado} onPress={() => void aprovar()}><Check /> {ocupado ? "Aprovando…" : "Aprovar"}</Button>
                </div>
                {erro && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erro}</p>}
              </div>
            </>
          )}
        </Superficie>
      </BannerCliente>
      {aberto && <div data-grupo className="grid max-w-[calc(640px+3rem)] gap-2 px-3 pt-6 md:px-6">
        <LinkButton variant="ghost" className="h-10 justify-self-start" href={ir.conversa(p.id, "Tenho uma dúvida sobre o orçamento: ")}><MessageCircle /> Tirar uma dúvida antes de decidir</LinkButton>
      </div>}
      <FolhaRecusar p={p} lida={lida} aberto={recusar} aoFechar={() => setRecusar(false)} />
    </>
  )
}

function Grupo({ titulo, itens }: { titulo: string; itens: PedidoCliente["itens"] }) {
  if (!itens.length) return null
  return (
    <section aria-label={titulo} className="grid gap-1">
      {!(itens.length === 1 && itens[0].descricao.toLowerCase() === titulo.toLowerCase()) && <h2 className="t-rotulo-caixa">{titulo}</h2>}
      {itens.map((i, n) => (
        <div key={n} className="flex items-baseline gap-3 py-1 text-sm">
          <span className="min-w-0 flex-1 text-pretty">{i.qtd > 1 ? `${i.qtd} × ` : ""}{i.descricao}</span>
          <span className="num shrink-0 whitespace-nowrap">{moeda(i.qtd * i.unitario)}</span>
        </div>
      ))}
    </section>
  )
}

/** Orçamento que já não se decide aqui: a frase e o caminho. */
function Fim({ texto, p, icone, novaVersao }: { texto: string; p: PedidoCliente; icone?: "ok"; novaVersao?: boolean }) {
  return (
    <div role="status" className="grid justify-items-start gap-4">
      <p className="flex items-start gap-2 text-base text-pretty">
        {icone === "ok" && <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-positive/15 text-positive"><Check className="size-4" aria-hidden="true" /></span>}
        {texto}
      </p>
      <div className="flex flex-wrap gap-2">
        {novaVersao && <LinkButton className="h-10" href={ir.conversa(p.id, "Podem mandar uma nova versão do orçamento?")}>Pedir nova versão</LinkButton>}
        <LinkButton variant={novaVersao ? "outline" : "default"} className="h-10" href={ir.pedido(p.id)}>Ver pedido</LinkButton>
      </div>
    </div>
  )
}

/** A folha "Recusar orçamento": o motivo (opcional) e o que acontece depois. */
function FolhaRecusar({ p, lida, aberto, aoFechar }: { p: PedidoCliente; lida: number; aberto: boolean; aoFechar: () => void }) {
  const [motivo, setMotivo] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = useProcessando().has(p.id)
  async function confirmar() {
    setErro(null)
    const r = await recusarOrcamento(p.id, lida, motivo.trim())
    if (r.ok) aoFechar(); else setErro(r.mensagem)
  }
  return (
    <FolhaDeDetalhe aberto={aberto} aoFechar={aoFechar} sobre={<span className="num">{p.id}</span>} titulo="Recusar o orçamento"
      rodape={<>
        <Button variant="outline" className="h-10" onPress={aoFechar} isDisabled={ocupado}>Voltar</Button>
        <Button variant="destructive" className="h-10 min-w-[11rem]" isPending={ocupado} onPress={() => void confirmar()}>{ocupado ? "Enviando…" : "Recusar o orçamento"}</Button>
      </>}>
      <div className="grid gap-4">
        <div className="grid gap-1 text-sm text-pretty">
          <p className="font-medium">O que acontece depois</p>
          <p className="text-muted-foreground">O pedido é encerrado e nada do orçamento é feito. Só a visita de diagnóstico ({moeda(EMPRESA.taxaVisita)}) será cobrada, como combinado.</p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`motivo-${p.id}`} className="text-sm font-medium">Quer contar por quê? <span className="font-normal text-muted-foreground">(opcional)</span></label>
          <Textarea id={`motivo-${p.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: achei caro, vou consertar depois" className="min-h-20" />
        </div>
        {erro && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erro}</p>}
      </div>
    </FolhaDeDetalhe>
  )
}
