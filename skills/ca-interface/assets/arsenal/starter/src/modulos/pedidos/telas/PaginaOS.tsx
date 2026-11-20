// Módulo Pedidos · /pedidos/ver/?id=OS-1052: tudo sobre uma OS (5.3). Banner curto (id, unidade, título, cliente) e o
// resumo sobreposto com os 3 selos de eixo (etapa, orçamento, pagamento); depois 8 + 4 colunas: orçamento (itens com
// versões) e checklist à esquerda; o que o cliente está vendo, a nota interna e a linha do tempo à direita. No
// celular, uma coluna e a ação principal fixa embaixo.
// Estados: OS inexistente, OS de outro técnico (ou de outra unidade) e dado vencido (PON-17): quando outra pessoa ou o
// cliente muda a OS aberta, a faixa avisa e as ações P conferem a versão que a pessoa leu (o rascunho dos itens fica).
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, CalendarClock, CircleCheck, ClipboardList, FileSearch, Landmark, MessageSquare, Printer, RefreshCw, Save, Send, ShieldCheck, User, X } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { FraseDoCliente, SeloEixo } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { BotaoLiquido } from "@/components/movimento"
import { DeslizarParaConfirmar } from "@/colecao/deslizar-para-confirmar"
import { marcarAberto, useProcessando, type Colecao, type Registro, type Resultado } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES, recursoPorId, servicoPorSlug } from "@/proto/negocio"
import { pode, usePapel, usePessoa } from "@/proto/permissoes"
import { ATRASADA, ETAPA_OS, ETAPAS_TERMINAIS, ORCAMENTO, PAGAMENTO, fraseOrcamentoMudou } from "@/proto/projecao"
import { clientes } from "@/modulos/clientes/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { compras } from "@/modulos/estoque/dados"
import { lancamentos } from "@/modulos/financeiro/dados"
import { conversas } from "@/modulos/mensagens/dados"
import { moeda, dataCurta, dataHora } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { url } from "@/lib/url"
import {
  atrasado, cobrancaDaOS, concluirOS, ctxDaOS, diasDeAtraso, enviarOrcamento, marcarChecklist, moverOS, novaVersaoOrcamento,
  ctxPerm, orcamentoEditavel, pedidos, proximoPasso, salvarItens, somarItens, COLUNAS_OS, type ItemPedido, type Pedido,
} from "../dados"
import { ItensOrcamento } from "./ItensOrcamento"
import type { AcaoOS } from "./AcoesOS"
import { DialogoCancelarOS } from "./CancelarOS"

const SheetAcaoOS = lazy(() => import("./AcoesOS").then((m) => ({ default: m.SheetAcaoOS })))
const RegistrarAprovacao = lazy(() => import("./RegistrarAprovacao"))
const ViaImpressa = lazy(() => import("./ViaImpressa"))

/** O id da URL, lido depois de hidratar (o HTML do servidor não conhece a query): null enquanto não leu. */
function useIdDaUrl() {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    const ler = () => setId(new URLSearchParams(location.search).get("id") ?? "")
    ler()
    document.addEventListener("astro:page-load", ler)
    return () => document.removeEventListener("astro:page-load", ler)
  }, [])
  return id
}

export default function PaginaOS() {
  const id = useIdDaUrl()
  const lista = pedidos.use()
  const papel = usePapel()
  const os = id ? lista.find((p) => p.id === id) : undefined
  const meu = !os || pode(papel, "ver_pedidos", ctxPerm(os))

  const corpo = (() => {
    if (id === null) return <Esqueleto className="h-[28rem] rounded-[var(--radius-xl)]" />
    if (!os) return (
      <EstadoVazio variante="filtro" icone={FileSearch} titulo={id ? `Não achamos a ${id}. Ela pode ter sido excluída.` : "Nenhuma OS escolhida."}
        texto="Confira o número ou procure na lista." acao={<LinkButton variant="outline" href={url("pedidos/")}><ArrowLeft /> Voltar aos pedidos</LinkButton>} />
    )
    if (!meu) return (
      <EstadoVazio variante="filtro" icone={ShieldCheck} titulo={papel === "tecnico" ? "Esta OS é de outro técnico." : "Esta OS é de outra unidade."}
        texto="Nenhum dado dela aparece aqui." acao={<LinkButton variant="outline" href={url("pedidos/")}>{papel === "tecnico" ? "Ver minhas OS" : "Ver as OS da unidade"}</LinkButton>} />
    )
    return <Detalhe os={os} />
  })()

  return (
    <>
      <BannerSobreposto
        sobrelinha={os && meu ? <span className="num">{os.id} · {UNIDADES[os.unidade].nome}</span> : "Ordem de serviço"}
        titulo={<span className="line-clamp-2 break-words" title={os && meu ? os.titulo : undefined}>{os && meu ? os.titulo : id ? id : "Ordem de serviço"}</span>}
        descricao={os && meu ? clientes.porId(os.clienteId)?.nome ?? "Cliente removido" : undefined}
        acoes={<LinkButton variant="outline" className="h-10 rounded-full" href={url("pedidos/")}><ArrowLeft /> Pedidos</LinkButton>}
        sobreposicao={48}
      >
        <ComDados capacidade="ver_pedidos" area="do atendimento" rotulo="a OS" esqueleto={<Esqueleto className="h-[28rem] rounded-[var(--radius-xl)]" />}
          vazio={<EstadoVazio icone={ClipboardList} titulo="Nenhuma OS ainda" texto="As ordens de serviço e as vendas aparecem aqui." />}>
          {corpo}
        </ComDados>
      </BannerSobreposto>
      <div className="h-6" />
    </>
  )
}

type Passo = { rotulo: string; icone: ReactNode; fazer: () => void; /** No celular, o que a barra fixa faz (concluir leva ao deslizar). */ celular?: () => void } | null

function Detalhe({ os }: { os: Pedido }) {
  const papel = usePapel()
  const eu = usePessoa()
  const agora = useAgora()
  const ags = agendamentos.use()
  const cmps = compras.use()
  const lans = lancamentos.use()
  const cvs = conversas.use()
  const processando = useProcessando()
  const ocupado = processando.has(os.id)
  const perm = ctxPerm(os)
  const ctx = ctxDaOS(os, ags, cmps)
  const terminal = ETAPAS_TERMINAIS.includes(os.etapa)
  const cliente = clientes.porId(os.clienteId)

  // ---- dado vencido (PON-17): a versão subiu e o último passo do histórico não é desta pessoa (toda ação do
  // módulo deixa um evento). Sem mudança de fora, a versão lida acompanha as próprias ações. ----
  useEffect(() => { marcarAberto(pedidos as unknown as Colecao<Registro>, os.id); return () => marcarAberto(null) }, [os.id])
  const ultimo = os.historico.at(-1)
  const [versaoLida, setVersaoLida] = useState(os.versao)
  const externo = os.versao > versaoLida && !!ultimo && ultimo.quem.nome !== eu.nome
  useEffect(() => { if (!externo) setVersaoLida(os.versao) }, [os.versao, externo])
  const linhaDoTempo = useRef<HTMLElement>(null)
  const verMudancas = () => {
    setVersaoLida(os.versao)
    linhaDoTempo.current?.scrollIntoView({ behavior: "smooth", block: "start" }); linhaDoTempo.current?.focus({ preventScroll: true })
  }

  // ---- orçamento: rascunho local dos itens (fica na tela se o envio falhar ou der conflito) ----
  // edita em rascunho (v1 no diagnóstico ou a versão nova depois de enviada ou aprovada); antes do diagnóstico, só lê
  const editavel = orcamentoEditavel(os) && pode(papel, "enviar_orcamento", perm) && (os.orcamento?.estado === "rascunho" || os.etapa === "em_diagnostico")
  const [itens, setItens] = useState<ItemPedido[]>(os.itens)
  const [mexeu, setMexeu] = useState(false)
  useEffect(() => { if (!mexeu) setItens(os.itens) }, [os.itens, mexeu])
  const [erroOrc, setErroOrc] = useState<string | null>(null)
  const [enviandoOrc, setEnviandoOrc] = useState(false)
  const validos = itens.length > 0 && itens.every((i) => i.descricao.trim().length >= 2 && i.unitario > 0)
  async function enviar() {
    if (!validos) { setErroOrc("Cada item precisa de descrição e preço maior que zero."); return }
    setEnviandoOrc(true); setErroOrc(null)
    const r = await enviarOrcamento(os.id, somarItens(itens), { itens, versao: versaoLida })
    setEnviandoOrc(false)
    if (r.ok) setMexeu(false); else setErroOrc(r.mensagem)
  }
  async function salvar() {
    if (!validos) { setErroOrc("Cada item precisa de descrição e preço maior que zero."); return }
    setErroOrc(null)
    const r = await salvarItens(os.id, itens, versaoLida)
    if (r && !r.ok) setErroOrc(r.mensagem); else setMexeu(false)
  }

  // ---- checklist e concluir ----
  const podeConcluir = pode(papel, "concluir_os", perm)
  const marcando = podeConcluir && (os.etapa === "em_execucao" || os.etapa === "aguardando_peca")
  const faltam = (os.checklist ?? []).filter((i) => !i.feito).length
  const [avisoChecklist, setAvisoChecklist] = useState<string | null>(null)
  useEffect(() => { if (!faltam) setAvisoChecklist(null) }, [faltam])
  const checklistRef = useRef<HTMLFieldSetElement>(null)
  const deslizarRef = useRef<HTMLDivElement>(null)
  const irAoDeslizar = () => {
    deslizarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    deslizarRef.current?.querySelector<HTMLElement>("[role=slider], button, [tabindex]")?.focus({ preventScroll: true })
  }
  const fraseFalta = (n: number) => `${n === 1 ? "Falta" : "Faltam"} ${n} ${n === 1 ? "item" : "itens"} do checklist.`
  async function concluir(): Promise<Resultado> {
    if (faltam) {
      const m = fraseFalta(faltam)
      setAvisoChecklist(m)
      checklistRef.current?.querySelector<HTMLElement>("[data-pendente] input, [data-pendente] label")?.focus()
      return { ok: false, motivo: "falha", mensagem: m }
    }
    return concluirOS(os.id, os.checklist ?? [], versaoLida)
  }

  // ---- próximo passo (a ação principal) ----
  const [acao, setAcao] = useState<AcaoOS>(null)
  const [usouAcao, setUsouAcao] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const [cancelando, setCancelando] = useState<Pedido | null>(null)
  const passo = proximoPasso(os)
  const podeMover = pode(papel, "mover_os", perm)
  const principal: Passo = (() => {
    if (os.etapa === "aguardando_aprovacao" && pode(papel, "registrar_aprovacao", perm)) return { rotulo: "Registrar aprovação", icone: <ShieldCheck className="size-4" />, fazer: () => setAprovando(true) }
    if (os.etapa === "em_execucao" && podeConcluir) return { rotulo: "Concluir OS", icone: <CircleCheck className="size-4" />, fazer: () => void concluir(), celular: irAoDeslizar }
    if (!passo || !podeMover) return null
    const m = passo.mov
    if (m.tipo === "direto") {
      const destino = COLUNAS_OS.find((c) => c.id === passo.coluna)?.titulo.toLowerCase()
      const rotulo = m.etapa === "em_diagnostico" ? "Iniciar diagnóstico" : m.etapa === "em_execucao" ? (os.etapa === "aguardando_peca" ? "Retomar execução" : "Iniciar execução") : `Mover para ${destino}`
      return { rotulo, icone: <ArrowRight className="size-4" />, fazer: () => void moverOS(os.id, m.etapa) }
    }
    if (m.tipo === "orcamento") return editavel ? { rotulo: "Enviar orçamento", icone: <Send className="size-4" />, fazer: () => void enviar() } : null
    if (m.tipo === "agendar") return { rotulo: "Agendar visita", icone: <CalendarClock className="size-4" />, fazer: () => { setAcao({ tipo: "agendar", os }); setUsouAcao(true) } }
    return null
  })()
  const podeCancelar = !terminal && pode(papel, "cancelar_os", perm)
  const menu: ItemMenu[] = [
    { rotulo: "Imprimir a via", icone: Printer, aoEscolher: () => setImprimindo(true) },
    ...(podeCancelar ? [{ rotulo: "Cancelar a OS…", icone: X, perigo: true, separadorAntes: true, aoEscolher: () => setCancelando(os) }] : []),
  ]

  const cobranca = cobrancaDaOS(os.id, lans)
  const conversa = cvs.find((c) => c.ref === os.id)
  const verCusto = pode(papel, "ver_custo") && os.custo !== undefined
  const orc = os.orcamento
  const mudou = orc && orc.versao > 1 && orc.estado === "enviado" && orc.anterior ? fraseOrcamentoMudou(os.total - orc.anterior.total) : null
  const tituloPrincipal = ocupado || enviandoOrc ? "Enviando…" : principal?.rotulo

  return (
    <div className="grid gap-4">
      {/* resumo sobreposto: os 3 eixos e os números que decidem */}
      <Superficie nivel="card" className="grid gap-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SeloEixo p={ETAPA_OS[os.etapa]} ctx={ctx} detalhe />
          {orc && <SeloEixo p={ORCAMENTO[orc.estado]} ctx={{ versao: orc.versao, ate: orc.validoAte, canal: orc.decisao?.canal, quando: orc.decisao?.em }} detalhe />}
          <SeloEixo p={PAGAMENTO[os.pagamento]} ctx={{ valor: os.total }} />
          {atrasado(os, agora) && <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(os, agora) }} detalhe />}
          <span className="ml-auto flex items-center gap-2">
            {principal && <BotaoLiquido onClick={principal.fazer} disabled={ocupado || enviandoOrc} className="max-sm:hidden">{principal.icone} {tituloPrincipal}</BotaoLiquido>}
            <MenuDaLinha rotulo={`Mais ações da ${os.id}`} itens={menu} />
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <Dado rotulo="Valor" className="max-sm:col-span-2"><span className="num t-kpi block text-[1.5rem] leading-tight break-words">{os.total ? moeda(os.total) : "Sob orçamento"}</span></Dado>
          <Dado rotulo="Prazo">
            <span className={cn("num", atrasado(os, agora) && "text-negativo-texto")}>{dataCurta(os.prazo)}</span>
            {os.previsaoAnterior && <span className="block text-xs text-muted-foreground">antes {dataCurta(os.previsaoAnterior)}{os.motivoAtraso ? `: ${os.motivoAtraso}` : ""}</span>}
          </Dado>
          <Dado rotulo="Técnico"><span className="flex min-w-0 items-center gap-1.5"><User className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{recursoPorId(os.responsavelId)?.nome ?? "Sem técnico"}</span></span></Dado>
          <Dado rotulo="Serviço"><span className="block truncate" title={servicoPorSlug(os.servicoSlug)?.nome}>{servicoPorSlug(os.servicoSlug)?.nome ?? "—"}</span></Dado>
          {verCusto && <Dado rotulo="Custo"><span className="num">{moeda(os.custo!)}</span>{os.total > 0 && <span className="block text-xs text-muted-foreground">margem {Math.round((1 - os.custo! / os.total) * 100)} %</span>}</Dado>}
          <Dado rotulo="Cliente"><a className="link-sistema block truncate" href={url(`clientes/?id=${os.clienteId}`)} title={cliente?.nome}>{cliente?.nome ?? "Cliente removido"}</a></Dado>
          <Dado rotulo="Aberta em"><span className="num">{dataHora(os.criadoEm, { ano: false })}</span></Dado>
        </dl>
      </Superficie>

      {externo && ultimo && (
        <Superficie nivel="card" tom="aviso" role="status" className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-pretty">Esta OS foi atualizada por {ultimo.quem.nome.split(" ")[0]} às <span className="num">{new Date(ultimo.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>.{mexeu ? " Seu rascunho dos itens continua aqui." : ""}</span>
          <Button variant="outline" className="h-10" onPress={verMudancas}>Ver mudanças</Button>
        </Superficie>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-12">
        <div className="grid min-w-0 gap-4 lg:col-span-8">
          <Card className="min-w-0">
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="t-card">Orçamento{orc ? <span className="num ml-1.5 text-sm font-normal text-muted-foreground">v{orc.versao}</span> : null}</CardTitle>
              {orc && ["aprovado", "expirado", "recusado"].includes(orc.estado) && !terminal && pode(papel, "enviar_orcamento", perm) && (
                <Button variant="outline" className="h-10" onPress={() => { setErroOrc(null); void novaVersaoOrcamento(os.id) }} isDisabled={ocupado}>Criar versão {orc.versao + 1}</Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-3">
              {orc?.decisao && (
                <p className="text-sm text-muted-foreground">
                  {orc.estado === "aprovado" ? "Aprovado" : "Decidido"} por {orc.decisao.por} pelo {orc.decisao.canal === "portal" ? "portal" : orc.decisao.canal === "whatsapp" ? "WhatsApp" : "balcão"} em <span className="num">{dataHora(orc.decisao.em, { ano: false })}</span>{orc.decisao.anexo ? <>, anexo <span className="break-all">{orc.decisao.anexo}</span></> : null}.
                </p>
              )}
              <ItensOrcamento itens={editavel ? itens : os.itens} anterior={orc?.anterior} editavel={editavel}
                aoMudar={(n) => { setItens(n); setMexeu(true); setErroOrc(null) }} />
              {erroOrc && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">{erroOrc}</p>}
              {!editavel && mexeu && <p className="text-sm text-muted-foreground">Seu rascunho dos itens ficou guardado nesta tela; crie a próxima versão para enviá-lo.</p>}
              {editavel && (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" className="h-10" onPress={() => void salvar()} isDisabled={!mexeu || enviandoOrc}><Save /> Salvar rascunho</Button>
                  <Button className="h-10 min-w-[11rem]" onPress={() => void enviar()} isPending={enviandoOrc} isDisabled={ocupado}><Send /> {enviandoOrc ? "Enviando…" : `Enviar v${orc?.versao ?? 1} ao cliente`}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader><CardTitle className="t-card">Checklist</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <fieldset ref={checklistRef} className="grid gap-0.5" aria-describedby="checklist-msg">
                <legend className="sr-only">Checklist da {os.id}</legend>
                {(os.checklist ?? []).map((i) => (
                  <div key={i.item} data-pendente={!i.feito || undefined} className="flex min-h-10 items-center">
                    <Checkbox isSelected={i.feito} isDisabled={!marcando} onChange={(v) => void marcarChecklist(os.id, i.item, v)}>{i.item}</Checkbox>
                  </div>
                ))}
              </fieldset>
              <p id="checklist-msg" aria-live="polite" className={cn("min-h-5 text-sm", avisoChecklist ? "font-medium text-negativo-texto" : "text-muted-foreground")}>
                {avisoChecklist ?? (marcando ? (faltam ? fraseFalta(faltam) : "Checklist completo. Ao concluir, o cliente recebe a cobrança.") : terminal || os.etapa === "pronta" ? "Serviço concluído." : "O checklist abre quando a execução começa.")}
              </p>
              {os.etapa === "em_execucao" && podeConcluir && (
                <div ref={deslizarRef} className="sm:hidden">
                  <DeslizarParaConfirmar rotulo="Deslize para concluir a OS" rotuloCurto="Concluir a OS" rotuloAndamento="Concluindo" rotuloFeito="Concluída"
                    aoConfirmar={async () => { const r = await concluir(); return r.ok ? { ok: true } : { ok: false, motivo: r.mensagem } }} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 gap-4 lg:col-span-4">
          <Card className="min-w-0">
            <CardHeader><CardTitle className="t-card">O que o cliente está vendo</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {mudou && <p className="text-sm font-medium text-pretty">{mudou}</p>}
              {ETAPA_OS[os.etapa].cliente ? <FraseDoCliente p={ETAPA_OS[os.etapa]} ctx={ctx} /> : <p className="text-sm text-muted-foreground">Nada novo para o cliente nesta etapa.</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                {conversa && <a className="link-sistema inline-flex min-h-10 items-center gap-1.5" href={url(`mensagens/?conversa=${conversa.id}`)}><MessageSquare className="size-4" aria-hidden="true" /> Conversa {conversa.id}</a>}
                {cobranca && pode(papel, "financeiro_painel") && <a className="link-sistema inline-flex min-h-10 items-center gap-1.5" href={url(`financeiro/receber/?id=${cobranca.id}`)}><Landmark className="size-4" aria-hidden="true" /> Cobrança {cobranca.id}</a>}
              </div>
            </CardContent>
          </Card>
          {os.notaInterna && pode(papel, "nota_interna") && (
            <Superficie nivel="card" tom="aviso" className="px-4 py-3 text-sm"><span className="t-rotulo block">Nota interna (o cliente não vê)</span>{os.notaInterna}</Superficie>
          )}
          <section ref={linhaDoTempo} tabIndex={-1} aria-labelledby="hist-pagina-os" className="min-w-0 scroll-mt-[calc(var(--topo)+1rem)] rounded-[var(--raio-sup,var(--radius-xl))] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="min-w-0">
              <CardHeader><CardTitle id="hist-pagina-os" className="t-card">Linha do tempo</CardTitle></CardHeader>
              <CardContent><LinhaDoTempo eventos={os.historico} limite={10} /></CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* celular: a ação principal fixa embaixo, acima das abas */}
      {principal && (
        <div className="sup sticky bottom-[calc(var(--abas)+0.75rem)] z-20 flex justify-center rounded-full p-1.5 sm:hidden">
          <BotaoLiquido onClick={principal.celular ?? principal.fazer} disabled={ocupado || enviandoOrc} className="w-full justify-center">{principal.icone} {tituloPrincipal}</BotaoLiquido>
        </div>
      )}

      {usouAcao && <Suspense fallback={null}><SheetAcaoOS c={acao} onFechar={() => setAcao(null)} /></Suspense>}
      {aprovando && <Suspense fallback={null}><RegistrarAprovacao os={os} versao={versaoLida} aoFechar={() => setAprovando(false)} /></Suspense>}
      {imprimindo && <Suspense fallback={null}><ViaImpressa os={os} aoFechar={() => setImprimindo(false)} /></Suspense>}
      <DialogoCancelarOS os={cancelando} aoFechar={() => setCancelando(null)} />
    </div>
  )
}

function Dado({ rotulo, children, className }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 content-start gap-0.5", className)}>
      <dt className="t-rotulo">{rotulo}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}
