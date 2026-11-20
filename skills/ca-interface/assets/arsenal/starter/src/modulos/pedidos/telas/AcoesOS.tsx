// Módulo Pedidos · as ações da OS que passam por uma sheet antes de valer (classe P): agendar a visita, enviar o
// orçamento e concluir. Usadas pelo quadro (ao soltar na coluna) e pela folha de detalhe (botão do próximo passo).
// Modo pessimista (D1): o botão diz "Enviando…" com a mesma largura, nada muda antes da resposta e o erro aparece aqui.
import { useState } from "react"
import { CalendarPlus, CircleCheck, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { moeda, dataCurta } from "@/lib/formato"
import { cn } from "@/lib/utils"
import type { Resultado } from "@/proto/dados"
import { agora } from "@/proto/relogio"
import { EMPRESA, RECURSOS, expediente, servicoPorSlug } from "@/proto/negocio"
import { ETAPA_OS } from "@/proto/projecao"
import { nomeCliente } from "@/modulos/clientes/dados"
import { agendamentos, validarHorario } from "@/modulos/agenda/dados"
import { agendarOS, concluirOS, enviarOrcamento, type Pedido as OS } from "../dados"

export type AcaoOS = { tipo: "agendar" | "orcamento" | "concluir"; os: OS } | null

// ---------- sheets das ações que só valem depois da confirmação ----------
export function SheetAcaoOS({ c, onFechar }: { c: AcaoOS; onFechar: () => void }) {
  const celular = useIsMobile(640)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fechar = () => { if (!enviando) { setErro(null); onFechar() } }
  // ação pessimista: nada muda até a resposta; a falha (conexão, conflito de versão, permissão) fica escrita aqui
  const executar = async (f: () => Promise<Resultado> | undefined) => {
    setEnviando(true); setErro(null)
    const r = await f()
    setEnviando(false)
    if (!r || r.ok) onFechar()
    else setErro(r.mensagem)
  }
  return (
    <Sheet isOpen={!!c} onOpenChange={(o) => !o && fechar()} side={celular ? "bottom" : "right"}
      className={cn("w-full gap-0", celular ? "max-h-[88dvh] rounded-t-[var(--radius-xl)]" : "sm:max-w-md")}>
      {c && (
        <>
          <SheetHeader className="shadow-[0_1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
            <p className="num text-xs text-muted-foreground">{c.os.id} · {ETAPA_OS[c.os.etapa].rotulo}</p>
            <SheetTitle className="pr-8 text-base leading-snug break-words">
              {c.tipo === "agendar" ? "Agendar visita" : c.tipo === "orcamento" ? "Enviar orçamento" : "Concluir OS"}
            </SheetTitle>
            <SheetDescription className="break-words">{c.os.titulo} · {nomeCliente(c.os.clienteId)}</SheetDescription>
          </SheetHeader>
          {c.tipo === "agendar" && <FormAgendar os={c.os} enviando={enviando} erro={erro} executar={executar} />}
          {c.tipo === "orcamento" && <FormOrcamento os={c.os} enviando={enviando} erro={erro} executar={executar} />}
          {c.tipo === "concluir" && <FormConcluir os={c.os} enviando={enviando} erro={erro} executar={executar} />}
        </>
      )}
    </Sheet>
  )
}

type PropsForm = { os: OS; enviando: boolean; erro: string | null; executar: (f: () => Promise<Resultado> | undefined) => void }
const campo = "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:h-11 max-sm:text-base"

function Erro({ texto }: { texto: string | null }) {
  return texto ? <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{texto}</p> : null
}

function FormAgendar({ os, enviando, erro, executar }: PropsForm) {
  const s = servicoPorSlug(os.servicoSlug)
  const aptos = RECURSOS.filter((r) => !s || r.competencias.includes(s.competencia))
  const dias = [16, 17, 18, 19, 20, 21].map((n) => new Date(2026, 10, n))
  const [rec, setRec] = useState(aptos[0]?.id ?? "")
  const [diaN, setDia] = useState(17)
  const [min, setMin] = useState(9 * 60)
  const inicio = new Date(2026, 10, diaN, Math.floor(min / 60), min % 60)
  const fim = new Date(inicio.getTime() + (s?.duracao ?? 60) * 6e4)
  const v = validarHorario({ inicio, fim, recursoId: rec }, os.servicoSlug, undefined, agendamentos.ler())
  const exp = expediente(inicio)
  const horas = Array.from({ length: 20 }, (_, i) => 8 * 60 + i * 30)
  return (
    <form className="contents" onSubmit={(e) => { e.preventDefault(); if (!v.motivo) executar(() => agendarOS(os.id, rec, inicio, fim)) }}>
      <div className="grid gap-3 overflow-y-auto p-4">
        <label className="grid gap-1 text-xs text-muted-foreground">Técnico
          <select className={campo} value={rec} onChange={(e) => setRec(e.target.value)}>
            {aptos.map((r) => <option key={r.id} value={r.id} className="bg-[Canvas] text-[CanvasText]">{r.nome}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">Dia
            <select className={campo} value={diaN} onChange={(e) => setDia(Number(e.target.value))}>
              {dias.map((d) => <option key={d.getDate()} value={d.getDate()} className="bg-[Canvas] text-[CanvasText]">{d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">Início
            <select className={campo} value={min} onChange={(e) => setMin(Number(e.target.value))}>
              {horas.map((h) => <option key={h} value={h} className="bg-[Canvas] text-[CanvasText]">{`${Math.floor(h / 60)}:${String(h % 60).padStart(2, "0")}`}</option>)}
            </select>
          </label>
        </div>
        <p className="text-sm text-muted-foreground">Duração prevista: <span className="num text-foreground">{(s?.duracao ?? 60) / 60} h</span> ({s?.nome}).</p>
        <div aria-live="polite">
          {v.motivo ? <p className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{v.motivo}{!exp ? "" : ""}</p>
            : v.conflitos.length ? <p className="rounded-lg bg-alerta/16 px-3 py-2 text-sm text-alerta-texto">Conflita com {v.conflitos.map((a) => `${a.id} (${hm(a.inicio)}–${hm(a.fim)})`).join(", ")}.</p>
            : <p className="text-sm text-muted-foreground">Horário livre.</p>}
        </div>
        <Erro texto={erro} />
      </div>
      <SheetFooter className="shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
        <Button slot="close" variant="ghost" isDisabled={enviando}>Cancelar</Button>
        <Button type="submit" isDisabled={!!v.motivo} isPending={enviando}><CalendarPlus /> {enviando ? "Enviando…" : "Agendar visita"}</Button>
      </SheetFooter>
    </form>
  )
}

const hm = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

function FormOrcamento({ os, enviando, erro, executar }: PropsForm) {
  const [valor, setValor] = useState(os.total ? os.total.toFixed(2).replace(".", ",") : "")
  const n = Number(valor.replace(/\./g, "").replace(",", "."))
  const ok = Number.isFinite(n) && n > 0
  const validade = new Date(agora().getTime() + EMPRESA.validadeOrcamentoDias * 864e5)
  return (
    <form className="contents" onSubmit={(e) => { e.preventDefault(); if (ok) executar(() => enviarOrcamento(os.id, n)) }}>
      <div className="grid gap-3 overflow-y-auto p-4">
        <label className="grid gap-1 text-xs text-muted-foreground">Total do orçamento (R$)
          <input className={cn(campo, "num")} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" aria-invalid={!ok && valor !== "" ? true : undefined} />
        </label>
        <p className="text-sm text-muted-foreground">Vale por 10 dias, até <span className="num text-foreground">{validade.toLocaleDateString("pt-BR")}</span>.</p>
        <div className="rounded-lg bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm">
          <p className="t-rotulo mb-1">O cliente vai ler</p>
          “Orçamento pronto: {ok ? moeda(n) : "R$ —"}. Válido até {dataCurta(validade)}.” + Aprovar · Recusar
        </div>
        <Erro texto={erro} />
      </div>
      <SheetFooter className="shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
        <Button slot="close" variant="ghost" isDisabled={enviando}>Cancelar</Button>
        <Button type="submit" isDisabled={!ok} isPending={enviando}><Send /> {enviando ? "Enviando…" : "Enviar orçamento"}</Button>
      </SheetFooter>
    </form>
  )
}

function FormConcluir({ os, enviando, erro, executar }: PropsForm) {
  const [lista, setLista] = useState(os.checklist ?? [])
  const faltam = lista.filter((i) => !i.feito).length
  return (
    <form className="contents" onSubmit={(e) => { e.preventDefault(); if (!faltam) executar(() => concluirOS(os.id, lista)) }}>
      <div className="grid gap-3 overflow-y-auto p-4">
        <fieldset className="grid gap-1">
          <legend className="t-rotulo mb-1">Checklist</legend>
          {lista.map((i, k) => (
            <Checkbox key={i.item} className="min-h-10 items-center rounded-lg px-1" isSelected={i.feito}
              onChange={(v) => setLista(lista.map((x, j) => (j === k ? { ...x, feito: v } : x)))}>
              {i.item}
            </Checkbox>
          ))}
        </fieldset>
        <p aria-live="polite" className={cn("text-sm", faltam ? "text-alerta-texto" : "text-muted-foreground")}>
          {faltam ? `${faltam === 1 ? "Falta" : "Faltam"} ${faltam} ${faltam === 1 ? "item" : "itens"} do checklist.` : "Checklist completo. O cliente recebe a cobrança ao concluir."}
        </p>
        <Erro texto={erro} />
      </div>
      <SheetFooter className="shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
        <Button slot="close" variant="ghost" isDisabled={enviando}>Cancelar</Button>
        <Button type="submit" isDisabled={!!faltam} isPending={enviando}><CircleCheck /> {enviando ? "Enviando…" : "Concluir OS"}</Button>
      </SheetFooter>
    </form>
  )
}
