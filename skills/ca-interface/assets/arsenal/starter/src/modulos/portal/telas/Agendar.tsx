// /portal/agendar/?servico=limpeza-split · agendar de novo (5.12). A grade de horários livres com reserva de 10 min é
// do fluxo de agendar do Site (5.13), que ainda não existe neste protótipo; até lá, o portal pede o horário pela
// conversa: a pessoa escolhe o serviço e o turno, e o pedido entra na caixa de Mensagens da equipe na hora (P).
// Nenhum botão morto: o caminho é real e a resposta volta na conversa.
import { useEffect, useState } from "react"
import { Check, MessageCircle } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Superficie } from "@/components/sistema/Superficie"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { SERVICOS, SITE, agendaDireto } from "@/proto/site"
import { cn } from "@/lib/utils"
import { FRASES, enviarMensagemDoCliente } from "../dados"
import { BannerCliente, ComDadosCliente, ir, useParametro } from "./comum"

const TURNOS = [{ id: "manha", rotulo: "Manhã" }, { id: "tarde", rotulo: "Tarde" }, { id: "sabado", rotulo: "Sábado" }]
const TURNO: Record<string, string> = { manha: "de manhã (8:00 às 12:00)", tarde: "à tarde (13:00 às 18:00)", sabado: "no sábado de manhã" }

export default function Agendar() {
  const doSite = useParametro("servico")
  const [servico, setServico] = useState("limpeza-split")
  useEffect(() => { if (doSite && SERVICOS.some((s) => s.id === doSite)) setServico(doSite) }, [doSite])
  const [turno, setTurno] = useState("manha")
  const [obs, setObs] = useState("")
  const [estado, setEstado] = useState<"editando" | "enviando" | "enviado">("editando")
  const [erro, setErro] = useState<string | null>(null)
  const s = SERVICOS.find((x) => x.id === servico)!
  const avaliacao = !agendaDireto(s)

  async function pedir() {
    setErro(null); setEstado("enviando")
    const texto = `${avaliacao ? "Quero pedir uma avaliação" : "Quero agendar"}: ${s.nome} (${s.valor}). Prefiro ${TURNO[turno]}.${obs.trim() ? ` ${obs.trim()}` : ""}`
    const r = await enviarMensagemDoCliente(texto)
    if (r.ok) setEstado("enviado"); else { setEstado("editando"); setErro(r.mensagem) }
  }

  return (
    <ComDadosCliente oQue="os serviços" titulo="Agendar">
      <BannerCliente titulo="Agendar um serviço" descricao="Escolha o serviço e o melhor turno. A equipe confirma o horário com você pela conversa.">
        <Superficie nivel="card" className="grid w-full max-w-[720px] gap-5 p-5 md:p-6">
          {estado === "enviado" ? (
            <div role="status" className="grid justify-items-start gap-4">
              <p className="flex items-start gap-2 text-base text-pretty">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-positive/15 text-positive"><Check className="size-4" aria-hidden="true" /></span>
                {FRASES.pedidoDeHorario}
              </p>
              <div className="flex flex-wrap gap-2">
                <LinkButton className="h-10" href={ir.conversa()}><MessageCircle /> Ver a conversa</LinkButton>
                <Button variant="ghost" className="h-10" onPress={() => { setEstado("editando"); setObs("") }}>Pedir outro serviço</Button>
              </div>
            </div>
          ) : (
            <>
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium">Serviço</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SERVICOS.map((x) => (
                    <label key={x.id} className={cn("flex min-h-14 cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm shadow-[inset_0_0_0_1px_var(--border)] transition-shadow has-[:checked]:shadow-[inset_0_0_0_2px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring motion-reduce:transition-none")}>
                      <input type="radio" name="servico" value={x.id} checked={servico === x.id} onChange={() => setServico(x.id)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
                      <span className="grid min-w-0 gap-0.5">
                        <span className="font-medium text-pretty">{x.nome}</span>
                        <span className="text-xs text-muted-foreground">{x.valor} · {x.duracao}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {avaliacao && <p className="text-sm text-pretty text-muted-foreground">Serviço sob orçamento: a visita de diagnóstico custa {SITE.taxaVisita} e é abatida se você aprovar.</p>}
              <div className="grid gap-2">
                <p id="turno-rotulo" className="text-sm font-medium">Melhor turno</p>
                <SegmentadoDeVidro aria-labelledby="turno-rotulo" valor={turno} aoMudar={setTurno} opcoes={TURNOS} className="max-w-sm" />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="obs-agendar" className="text-sm font-medium">Algo que o técnico deva saber? <span className="font-normal text-muted-foreground">(opcional)</span></label>
                <Textarea id="obs-agendar" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: o split fica no segundo andar" className="min-h-16" />
              </div>
              {erro && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erro}</p>}
              <BotaoLiquido className="h-11 min-w-[14rem] justify-self-start" onClick={() => void pedir()} disabled={estado === "enviando"}>
                {estado === "enviando" ? "Enviando…" : avaliacao ? "Pedir a avaliação" : "Pedir o horário"}
              </BotaoLiquido>
            </>
          )}
        </Superficie>
      </BannerCliente>
    </ComDadosCliente>
  )
}
