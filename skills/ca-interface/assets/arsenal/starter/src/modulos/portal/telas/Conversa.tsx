// /portal/conversa/?pedido=OS-1052 · "Falar com a Oficina" (5.12). A conversa do pedido (ou a geral, sem ?pedido),
// a mesma que a equipe vê em Mensagens: as mensagens trocadas e as automáticas (as frases da projeção que o cliente
// recebeu), em balões (role="log"). Mandar mensagem é P: "Enviando…" e, na falha, o texto fica no campo com o erro.
// ?texto= preenche o campo (pedir nova versão, tirar dúvida, pedir peça). Abrir marca como lidas as da Oficina (O).
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Send } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Superficie } from "@/components/sistema/Superficie"
import { useProcessando } from "@/proto/dados"
import { cn } from "@/lib/utils"
import { buscarPedido, enviarMensagemDoCliente, lerConversa, useConversaDoCliente, useDadosDoCliente } from "../dados"
import { useClienteDaSessao } from "@/proto/cliente"
import { conversas } from "@/modulos/mensagens/dados"
import { BannerCliente, ComDadosCliente, EsqueletoCliente, OutraConta, diaHora, ir, useParametro } from "./comum"

export default function Conversa() {
  const pedido = useParametro("pedido")
  const texto = useParametro("texto")
  const dados = useDadosDoCliente()
  if (pedido === undefined) return <EsqueletoCliente titulo="Conversa" />
  if (pedido) {
    const achado = buscarPedido(dados, pedido)
    if ("erro" in achado) return <OutraConta />
  }
  const p = pedido ? dados.pedidos.find((x) => x.id === pedido) : undefined
  return (
    <ComDadosCliente oQue="a conversa" titulo="Conversa">
      <Tela refPedido={pedido || undefined} titulo={p ? `${p.id} · ${p.titulo}` : "Fale com a Oficina"} textoInicial={texto ?? ""} />
    </ComDadosCliente>
  )
}

function Tela({ refPedido, titulo, textoInicial }: { refPedido?: string; titulo: string; textoInicial: string }) {
  const lista = conversas.use()
  const idCliente = useClienteDaSessao()
  const cvId = lista.filter((c) => c.clienteId === idCliente && (refPedido ? c.ref === refPedido : !c.ref)).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0]?.id
  const cv = useConversaDoCliente(cvId)
  const [texto, setTexto] = useState(textoInicial)
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = useProcessando().has(cvId ?? "")
  const [enviando, setEnviando] = useState(false)
  const log = useRef<HTMLOListElement>(null)
  useEffect(() => { if (cvId) lerConversa(cvId) }, [cvId, cv?.linhas.length])
  // o fim da conversa à vista ao abrir e a cada mensagem nova
  useEffect(() => { const el = log.current; if (el) el.scrollTop = el.scrollHeight }, [cv?.linhas.length])

  async function enviar() {
    const t = texto.trim()
    if (!t) return
    setErro(null); setEnviando(true)
    const r = await enviarMensagemDoCliente(t, refPedido)
    setEnviando(false)
    if (r.ok) setTexto(""); else setErro(r.mensagem)
  }
  const pendente = enviando || ocupado
  return (
    <>
      <BannerCliente sobrelinha={refPedido ? <a className="inline-flex min-h-10 items-center gap-1 underline-offset-4 hover:underline" href={ir.pedido(refPedido)}><ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar ao pedido</a> : "Conversa"}
        titulo={titulo} descricao="A equipe responde por aqui de segunda a sexta, das 8:00 às 18:00, e no sábado até 12:00.">
        <Superficie nivel="card" className="grid w-full max-w-[720px] gap-4 p-3 md:p-5">
          {cv && cv.linhas.length ? (
            <ol ref={log} role="log" aria-label="Mensagens" aria-live="polite" className="grid max-h-[min(60dvh,560px)] gap-3 overflow-y-auto overscroll-contain px-1 py-1">
              {cv.linhas.map((m) => {
                const minha = m.direcao === "entrada"
                return (
                  <li key={m.id} className={cn("flex flex-col gap-1", minha ? "items-end" : "items-start")}>
                    <span className="px-1 text-xs text-muted-foreground">{m.automatica ? `${m.autor} · automática` : m.autor} · <span className="num">{diaHora(m.em)}</span></span>
                    <Bubble variant={minha ? "default" : m.automatica ? "outline" : "muted"} align={minha ? "end" : "start"} className="max-w-[85%]">
                      <BubbleContent className="text-sm break-words whitespace-pre-wrap [overflow-wrap:anywhere]">{m.texto}</BubbleContent>
                    </Bubble>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="px-2 py-6 text-center text-sm text-pretty text-muted-foreground">Nenhuma mensagem ainda. Escreva abaixo: a equipe recebe na hora.</p>
          )}
          <form className="grid gap-2 border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pt-3" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
            <label htmlFor="msg-cliente" className="sr-only">Sua mensagem</label>
            <Textarea id="msg-cliente" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua mensagem" className="min-h-20"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void enviar() } }} aria-invalid={!!erro || undefined} />
            {erro && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erro}</p>}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground pointer-coarse:invisible">Ctrl + Enter envia</p>
              <Button type="submit" className="h-10 min-w-[8.5rem]" isPending={pendente} isDisabled={!texto.trim()}><Send /> {pendente ? "Enviando…" : "Enviar"}</Button>
            </div>
          </form>
        </Superficie>
      </BannerCliente>
      {!refPedido && (
        <div data-grupo className="max-w-[calc(720px+3rem)] px-3 pt-6 md:px-6">
          <LinkButton variant="ghost" className="h-10" href={ir.pedidos()}>Escrever sobre um pedido específico</LinkButton>
        </div>
      )}
    </>
  )
}
