// Diálogo "Novo agendamento" (5.4): cliente, serviço, recurso, início e duração, com o conflito ao vivo. Usado pela
// agenda (arrastar no vazio, tocar num horário livre) e pelos horários livres do balcão (/agenda/livres/).
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RECURSOS, SERVICOS, recursoPorId } from "@/proto/negocio"
import { clientes } from "@/modulos/clientes/dados"
import type { PropostaAgenda } from "@/components/interativos/AgendaInterativa"
import { criarAgendamento, validarHorario } from "../dados"

const hhmm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`

const campo = "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:h-11 max-sm:text-base"
const opc = "bg-[Canvas] text-[CanvasText]"

export function NovoAgendamento({ proposta, servico, onFechar }: { proposta: PropostaAgenda | null; servico?: string; onFechar: () => void }) {
  return (
    <Dialog isOpen={!!proposta} onOpenChange={(o) => !o && onFechar()} className="sm:max-w-md">
      {proposta && <FormNovo key={+proposta.inicio + proposta.recursoId} p={proposta} servico0={servico} onFechar={onFechar} />}
    </Dialog>
  )
}

function FormNovo({ p, servico0, onFechar }: { p: PropostaAgenda; servico0?: string; onFechar: () => void }) {
  const r0 = recursoPorId(p.recursoId)
  const lista = clientes.use().filter((c) => c.estado !== "anonimizado")
  const [cliente, setCliente] = useState("C-0007")
  const [servico, setServico] = useState(servico0 ?? SERVICOS.find((s) => r0?.competencias.includes(s.competencia))?.slug ?? SERVICOS[0].slug)
  const [rec, setRec] = useState(p.recursoId)
  const [ini, setIni] = useState(p.inicio.getHours() * 60 + p.inicio.getMinutes())
  const [dur, setDur] = useState(Math.round((+p.fim - +p.inicio) / 6e4))
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const dia = p.inicio
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), Math.floor(ini / 60), ini % 60)
  const fim = new Date(+inicio + dur * 6e4)
  const v = validarHorario({ inicio, fim, recursoId: rec }, servico)
  const horarios = Array.from({ length: 40 }, (_, i) => 480 + i * 15)
  const duracoes = [...new Set([30, 60, 90, 120, 180, 240, dur])].sort((a, b) => a - b)
  const enviar = async () => {
    if (v.motivo) return
    setEnviando(true); setErro(null)
    // pessimista: o bloco só aparece depois da resposta; a falha fica escrita aqui (e no toast)
    const r = await criarAgendamento({ clienteId: cliente, servicoSlug: servico, recursoId: rec, inicio, fim })
    setEnviando(false)
    if (r.ok) onFechar(); else setErro(r.mensagem)
  }
  return (
    <form className="contents" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
      <DialogHeader>
        <DialogTitle>Novo agendamento</DialogTitle>
        <DialogDescription className="first-letter:uppercase">{dia.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs text-muted-foreground">Cliente
          <select className={campo} value={cliente} onChange={(e) => setCliente(e.target.value)}>
            {lista.map((c) => <option key={c.id} value={c.id} className={opc}>{c.nome}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Serviço
          <select className={campo} value={servico} onChange={(e) => setServico(e.target.value)}>
            {SERVICOS.map((s) => <option key={s.slug} value={s.slug} className={opc}>{s.nome}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Recurso
          <select className={campo} value={rec} onChange={(e) => setRec(e.target.value)}>
            {RECURSOS.map((r) => <option key={r.id} value={r.id} className={opc}>{r.nome}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">Início
            <select className={campo} value={ini} onChange={(e) => setIni(Number(e.target.value))}>
              {horarios.map((h) => <option key={h} value={h} className={opc}>{hhmm(h)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">Duração
            <select className={campo} value={dur} onChange={(e) => setDur(Number(e.target.value))}>
              {duracoes.map((m) => <option key={m} value={m} className={opc}>{m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}`}</option>)}
            </select>
          </label>
        </div>
        <div aria-live="polite" className="text-sm">
          {v.motivo ? <p className="rounded-lg bg-negative/12 px-3 py-2 text-negativo-texto">{v.motivo}</p>
            : v.conflitos.length ? <p className="rounded-lg bg-alerta/16 px-3 py-2 text-alerta-texto">Conflita com {v.conflitos.map((a) => `${a.id} (${new Date(a.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}–${new Date(a.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})`).join(", ")}.</p>
            : <p className="text-muted-foreground">{hhmm(ini)} a {hhmm(ini + dur)} livre para {recursoPorId(rec)?.curto}.</p>}
        </div>
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}
      </div>
      <DialogFooter>
        <Button slot="close" variant="ghost" isDisabled={enviando}>Cancelar</Button>
        <Button type="submit" isDisabled={!!v.motivo} isPending={enviando}>{enviando ? "Enviando…" : "Criar agendamento"}</Button>
      </DialogFooter>
    </form>
  )
}
