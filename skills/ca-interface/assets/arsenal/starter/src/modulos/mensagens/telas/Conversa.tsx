// A conversa aberta: cabeçalho com o cliente e o pedido ligado, histórico em balões (role="log", COM-16) e o
// compositor. Três estilos de balão (COM-06): o cliente à esquerda, a equipe à direita em tom do acento e as mensagens
// automáticas à direita com contorno e o rótulo "Automática" (a cópia do que o cliente recebeu, COM-14). Enviar é
// pessimista: o balão mostra o relógio até a resposta, depois 1 tique e 2 tiques; na falha, "Não enviada." com
// Tentar de novo no próprio balão e o texto preservado.
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowLeft, Bot, Check, CheckCheck, CheckCircle2, Clock, FileText, Mail, MailWarning, PanelRight, RotateCcw, Send, Smartphone, UserRound, Globe, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message"
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Superficie } from "@/components/sistema/Superficie"
import { SeloEixo } from "@/components/base/selos"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { marcarAberto, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { pessoaPorId } from "@/proto/negocio"
import { pode, usePapel, usePessoa } from "@/proto/permissoes"
import { useToque } from "@/hooks/use-mobile"
import { MENSAGEM } from "@/proto/projecao"
import { clientes } from "@/modulos/clientes/dados"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import {
  ATENDENTES_POSSIVEIS, CANAL, CONVERSA, atribuir, conversas, automaticasDa, descartarFalha, enviarMensagem, marcarConversaAberta, marcarLida,
  mensagens, modelos, preencher, resolver, tentarDeNovo, useFalhas, variaveisDa, type Canal, type Conversa as TConversa, type Falha, type Linha,
} from "../dados"
import { Contexto } from "./Contexto"
import { hora, iniciais, rotuloDoDia } from "./comum"

const ICONE_CANAL: Record<Canal, typeof Mail> = { whatsapp: Smartphone, email: Mail, portal: Globe }
/** Rascunho por conversa nesta sessão: trocar de conversa não perde o que estava sendo escrito. */
const rascunhos = new Map<string, string>()

export function Conversa({ cv, nome, aoVoltar }: { cv: TConversa; nome: string; aoVoltar: () => void }) {
  const ms = mensagens.use()
  const ps = pedidos.use()
  agendamentos.use() // a mensagem automática de remarcação lê a agenda: re-renderiza quando ela muda
  // o "Tentar de novo" do toast reenvia pela própria acao(): a falha some quando a mensagem gravada aparece
  const falhas = useFalhas().filter((f) => f.conversaId === cv.id && !ms.some((m) => m.conversaId === cv.id && m.direcao === "saida" && m.texto === f.texto && m.em >= f.em))
  const agora = useAgora()
  const papel = usePapel()
  const [contexto, setContexto] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const log = useRef<HTMLDivElement>(null)

  const linhas = useMemo<Linha[]>(() => [...ms.filter((m) => m.conversaId === cv.id), ...automaticasDa(cv, ps)].sort((a, b) => a.em.localeCompare(b.em)), [ms, ps, cv])

  // a barra F sabe qual conversa está aberta ("Outra pessoa mexe", "Cliente responde")
  useEffect(() => {
    marcarAberto(conversasComoRegistro(), cv.id); marcarConversaAberta(cv.id)
    return () => { marcarAberto(null); marcarConversaAberta(null) }
  }, [cv.id])
  // abrir a conversa (ou receber mensagem com ela aberta) zera as não lidas (COM-24)
  useEffect(() => { if (cv.naoLidas > 0) void marcarLida(cv) }, [cv.id, cv.naoLidas]) // eslint-disable-line react-hooks/exhaustive-deps
  // ao abrir, o fim da conversa à vista; depois, só desce sozinho se a pessoa já estava no fim ou se a mensagem é dela
  // (quem está lendo a mensagem longa do CV-0040 não é arrancado do ponto em que está)
  const noFim = useRef(true)
  const [novas, setNovas] = useState(false)
  const descer = () => { const el = log.current; if (el) el.scrollTop = el.scrollHeight; setNovas(false) }
  useEffect(() => { noFim.current = true; descer() }, [cv.id])
  useEffect(() => { if (noFim.current || enviando) descer(); else setNovas(true) }, [linhas.length, falhas.length, enviando]) // eslint-disable-line react-hooks/exhaustive-deps

  const Icone = ICONE_CANAL[cv.canal]
  const responsavel = pessoaPorId(cv.atribuidaA)
  const resolvida = cv.estado === "resolvida"
  const itens: ItemMenu[] = [
    { rotulo: "Marcar como não lida", icone: MailWarning, aoEscolher: () => { void marcarLida(cv, false); aoVoltar() } },
    ...ATENDENTES_POSSIVEIS.filter((p) => papel !== "tecnico" && p.id !== cv.atribuidaA).map((p, i) => ({ rotulo: `Atribuir a ${p.nome}`, icone: UserRound, separadorAntes: i === 0, aoEscolher: () => void atribuir(cv, p.id) })),
    { rotulo: resolvida ? "Reabrir a conversa" : "Resolver a conversa", icone: resolvida ? RotateCcw : CheckCircle2, separadorAntes: true, aoEscolher: () => void resolver(cv, !resolvida) },
  ]
  let diaAnterior = ""

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Superficie como="section" aria-labelledby="titulo-conversa" className="flex min-h-0 flex-col overflow-hidden">
        {/* cabeçalho: quem, por onde, sobre o quê */}
        <header className="flex items-center gap-2 px-2 py-2 shadow-[0_1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)] sm:gap-3 sm:px-3">
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Voltar para as conversas" onPress={aoVoltar}><ArrowLeft /></Button>
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold max-sm:hidden">{iniciais(nome)}</span>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-conversa" className="text-base font-semibold"><span className="block truncate" title={nome}>{nome}</span></h2>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Icone className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{CANAL[cv.canal]}</span>
              {cv.ref && <><span aria-hidden="true">·</span><a href={url(cv.ref.startsWith("AG") ? "agenda/" : `pedidos/?id=${cv.ref}`)} className="num link-sistema whitespace-nowrap">{cv.ref}</a></>}
              {responsavel && <><span aria-hidden="true" className="max-sm:hidden">·</span><span className="truncate max-sm:hidden">com {responsavel.curto}</span></>}
            </p>
          </div>
          <SeloEixo p={CONVERSA[cv.estado]} className="shrink-0 max-md:hidden" />
          <Button variant="outline" size="sm" className="shrink-0 xl:hidden" onPress={() => setContexto(true)} aria-label="Ver o pedido e o cliente"><PanelRight /></Button>
          {!resolvida && <Button variant="outline" size="sm" className="shrink-0 max-md:hidden" onPress={() => void resolver(cv)}><CheckCircle2 /> Resolver</Button>}
          <MenuDaLinha rotulo="Ações da conversa" itens={itens} />
        </header>

        {/* histórico */}
        <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={log} role="log" aria-label={`Mensagens com ${nome}`} data-rolagem-permitida className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
          onScroll={(e) => { const el = e.currentTarget; noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; if (noFim.current) setNovas(false) }}>
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {linhas.map((m) => {
              const dia = rotuloDoDia(m.em, agora)
              const separa = dia !== diaAnterior
              diaAnterior = dia
              return (
                <Fragment key={m.id}>
                  {separa && <SeparadorDia rotulo={dia} />}
                  <Balao m={m} cv={cv} />
                </Fragment>
              )
            })}
            {falhas.map((f) => <BalaoFalha key={f.id} f={f} cv={cv} />)}
            {enviando && <BalaoEnviando texto={enviando} />}
          </div>
        </div>
        {novas && (
          <Button size="sm" className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md" onPress={descer}><ArrowDown /> Nova mensagem</Button>
        )}
        </div>

        <Compositor cv={cv} nome={nome} aoEnviar={setEnviando} podeEnviar={pode(papel, "mensagens")} />
      </Superficie>

      <aside aria-label="Pedido e cliente" className="min-h-0 overflow-y-auto max-xl:hidden" data-rolagem-permitida>
        <Contexto cv={cv} />
      </aside>
      <FolhaDeDetalhe aberto={contexto} aoFechar={() => setContexto(false)} sobre={cv.id} titulo={nome}
        selos={<SeloEixo p={CONVERSA[cv.estado]} />}>
        <Contexto cv={cv} naFolha />
      </FolhaDeDetalhe>
    </div>
  )
}

const conversasComoRegistro = () => conversas as unknown as Colecao<Registro>

function SeparadorDia({ rotulo }: { rotulo: string }) {
  return (
    <div role="separator" aria-label={rotulo} className="flex justify-center py-1">
      <span className="rounded-full bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-1 text-xs font-medium text-muted-foreground first-letter:uppercase">{rotulo}</span>
    </div>
  )
}

/** Estado do envio no rodapé do balão: relógio, 1 tique, 2 tiques, 2 tiques no acento (rótulo da projeção). */
function Tiques({ estado }: { estado: Linha["estado"] }) {
  const p = MENSAGEM[estado]
  const I = estado === "enviando" ? Clock : estado === "enviada" ? Check : CheckCheck
  return <I role="img" aria-label={p.rotulo} className={cn("size-3.5 shrink-0", estado === "lida" ? "text-primary" : "text-muted-foreground")} />
}

function Balao({ m, cv }: { m: Linha; cv: TConversa }) {
  const processando = useProcessando()
  const [erro, setErro] = useState<string | null>(null)
  const sai = m.direcao === "saida"
  const auto = m.automatica
  const falhou = m.estado === "falhou"
  const reenviando = processando.has(m.id)
  return (
    <Message align={sai ? "end" : "start"}>
      <MessageContent>
        {(auto || sai) && (
          <MessageHeader className="gap-1.5 group-data-[align=end]/message:justify-end">
            {auto ? <><Bot className="size-3.5" aria-hidden="true" /> <span className="whitespace-nowrap">Automática</span><span aria-hidden="true">·</span><span className="num">{auto.ref}</span>{auto.modelo && <span className="truncate max-sm:hidden" title={auto.modelo}>· {auto.modelo}</span>}</> : <span className="truncate">{m.autor}</span>}
          </MessageHeader>
        )}
        <Bubble variant={auto ? "outline" : sai ? "tinted" : "muted"} align={sai ? "end" : "start"} className="max-w-[min(85%,36rem)]">
          <BubbleContent className={cn("text-pretty whitespace-pre-line [overflow-wrap:anywhere]", auto && "border-dashed bg-transparent", falhou && "opacity-80")}>{m.texto}</BubbleContent>
        </Bubble>
        <MessageFooter className="gap-1.5">
          <span className="num font-normal">{hora(m.em)}</span>
          {m.canal === "email" && cv.canal !== "email" && <span className="font-normal">· por e-mail</span>}
          {sai && !falhou && <Tiques estado={reenviando ? "enviando" : m.estado} />}
        </MessageFooter>
        {falhou && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-3 text-xs font-medium text-[var(--texto-negativo,var(--destructive))]">
            <span>{MENSAGEM.falhou.rotulo}.</span>
            <Button size="sm" variant="outline" isPending={reenviando} onPress={async () => { setErro(null); const r = await tentarDeNovo(cv, { mensagem: m }); if (!r.ok) setErro(r.mensagem) }}>
              <RotateCcw /> {reenviando ? "Enviando…" : "Tentar de novo"}
            </Button>
            {erro && <span role="alert" className="basis-full text-end font-normal">{erro}</span>}
          </div>
        )}
      </MessageContent>
    </Message>
  )
}

/** Envio desta sessão que falhou: nada foi gravado; o texto fica aqui até reenviar ou descartar. */
function BalaoFalha({ f, cv }: { f: Falha; cv: TConversa }) {
  return (
    <Message align="end">
      <MessageContent>
        <Bubble variant="tinted" align="end" className="max-w-[min(85%,36rem)]">
          <BubbleContent className="text-pretty whitespace-pre-line opacity-80 [overflow-wrap:anywhere]">{f.texto}</BubbleContent>
        </Bubble>
        <div role="alert" className="flex flex-wrap items-center justify-end gap-2 px-3 text-xs font-medium text-[var(--texto-negativo,var(--destructive))]">
          <span>{MENSAGEM.falhou.rotulo}.</span>
          <Button size="sm" variant="outline" onPress={() => void tentarDeNovo(cv, { falha: f })}><RotateCcw /> Tentar de novo</Button>
          <Button size="sm" variant="ghost" aria-label="Descartar a mensagem" onPress={() => descartarFalha(f)}><X /></Button>
        </div>
      </MessageContent>
    </Message>
  )
}

function BalaoEnviando({ texto }: { texto: string }) {
  return (
    <Message align="end">
      <MessageContent>
        <Bubble variant="tinted" align="end" className="max-w-[min(85%,36rem)]">
          <BubbleContent className="text-pretty whitespace-pre-line opacity-70 [overflow-wrap:anywhere]">{texto}</BubbleContent>
        </Bubble>
        <MessageFooter className="gap-1.5"><span className="font-normal">Enviando…</span><Tiques estado="enviando" /></MessageFooter>
      </MessageContent>
    </Message>
  )
}

function Compositor({ cv, nome, aoEnviar, podeEnviar }: { cv: TConversa; nome: string; aoEnviar: (t: string | null) => void; podeEnviar: boolean }) {
  const [texto, setTextoLocal] = useState(() => rascunhos.get(cv.id) ?? "")
  const setTexto = (t: string | ((a: string) => string)) => setTextoLocal((a) => { const n = typeof t === "function" ? t(a) : t; rascunhos.set(cv.id, n); return n })
  const [modeloId, setModeloId] = useState<string | undefined>()
  const toque = useToque()
  const [menu, setMenu] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const processando = useProcessando()
  const ocupado = processando.has(cv.id)
  const campo = useRef<HTMLTextAreaElement>(null)
  const lista = modelos.use()
  const eu = usePessoa()
  const c = clientes.use().find((x) => x.id === cv.clienteId)
  const semWhats = cv.canal === "whatsapp" && c && !c.whatsappConsentido
  const primeiro = c?.tipo === "pf" ? nome.split(" ")[0] : nome
  const faltando = texto.match(/\{\w+\}/g)

  async function enviar() {
    const t = texto.trim()
    if (!t || ocupado) return
    if (faltando) { setErro(`Complete ${faltando.join(", ")} antes de enviar.`); return }
    setErro(null)
    aoEnviar(t); setTexto(""); setModeloId(undefined)
    const r = await enviarMensagem(cv, t, modeloId)
    aoEnviar(null)
    // falha de rede: o texto fica no balão "Não enviada"; recusa de papel ou conflito: o texto volta ao campo
    if (!r.ok && r.motivo !== "falha") { setTexto(t); setErro(r.mensagem) }
    campo.current?.focus()
  }
  function usar(id: string) {
    const m = lista.find((x) => x.id === id)
    if (!m) return
    const pronto = preencher(m.texto, variaveisDa(cv))
    setTexto((t) => (t.trim() === "/" || !t.trim() ? pronto : `${t.replace(/\/$/, "").trimEnd()} ${pronto}`))
    setModeloId(m.id)
    setTimeout(() => campo.current?.focus(), 0)
  }

  if (!podeEnviar) return null
  return (
    <form onSubmit={(e) => { e.preventDefault(); void enviar() }}
      className="grid gap-2 border-t border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] p-2 sm:p-3">
      {semWhats && (
        <p className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_12%,transparent)] px-3 py-1.5 text-xs text-pretty">
          <MailWarning className="size-3.5 shrink-0" aria-hidden="true" /> {primeiro} não autorizou WhatsApp. Esta mensagem vai por e-mail.
        </p>
      )}
      {(erro || faltando) && <p role="alert" className="px-1 text-xs text-[var(--texto-negativo,var(--destructive))]">{erro ?? `Complete ${faltando!.join(", ")} antes de enviar: esta conversa não tem esse dado.`}</p>}
      <div className="flex items-end gap-2">
        <DropdownMenuTrigger isOpen={menu} onOpenChange={setMenu}>
          <Button variant="outline" size="icon" className="shrink-0 rounded-full" aria-label="Usar um modelo (atalho: /)"><FileText /></Button>
          <DropdownMenu placement="top start" className="w-80 max-w-[calc(100vw-1.5rem)]" aria-label="Modelos de mensagem" onAction={(k) => usar(String(k))}>
            {lista.map((m) => (
              <DropdownMenuItem key={m.id} id={m.id} textValue={m.nome}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium" title={m.nome}>{m.nome}</span>
                  <span className="truncate text-xs text-muted-foreground" title={m.texto}>{m.texto}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </DropdownMenuTrigger>
        <Textarea
          ref={campo}
          value={texto}
          aria-label={`Mensagem para ${nome}`}
          placeholder={`Mensagem para ${primeiro}`}
          rows={1}
          className="max-h-40 min-h-10 flex-1 resize-none rounded-[1.25rem] py-2"
          onChange={(e) => { const v = e.target.value; setTexto(v); setErro(null); if (v === "/") setMenu(true); if (!v) setModeloId(undefined) }}
          aria-invalid={!!faltando || undefined}
          // no teclado de toque, Enter quebra a linha (só o botão envia): um parágrafo não vira envio por engano
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !toque && !e.nativeEvent.isComposing) { e.preventDefault(); void enviar() } }}
        />
        {/* mesma largura com e sem "Enviando…" (D1) */}
        <Button type="submit" className="shrink-0 rounded-full max-sm:size-10 max-sm:px-0 sm:min-w-[7.5rem]" isDisabled={!texto.trim() && !ocupado} isPending={ocupado}>
          {ocupado ? <span className="max-sm:sr-only">Enviando…</span> : <><Send /> <span className="max-sm:sr-only">Enviar</span></>}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">{ocupado ? "Enviando a mensagem…" : ""}</p>
      <p className="truncate px-1 text-xs text-muted-foreground max-sm:hidden" title={`Enter envia · Shift+Enter quebra a linha · / abre os modelos · você responde como ${eu.nome}`}>
        Enter envia · Shift+Enter quebra a linha · / abre os modelos<span className="max-xl:hidden"> · você responde como {eu.nome}</span>
      </p>
    </form>
  )
}
