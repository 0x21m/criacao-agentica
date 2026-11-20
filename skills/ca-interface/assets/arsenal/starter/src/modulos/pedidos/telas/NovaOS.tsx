// Módulo Pedidos · /pedidos/novo/: nova OS em 4 etapas num card (Cliente → Serviço → Agenda → Revisão) e o resumo
// lateral fixo (no celular, recolhível acima das etapas). Cada etapa valida ao avançar; o erro fica ao lado do campo
// (aria-invalid + aria-describedby) e o foco vai ao primeiro erro.
// Rascunho guardado neste aparelho a cada campo; ao voltar, "Rascunho restaurado de 9:32" com Descartar (EST-39).
// Criar é classe P (seção 3.1): nada aparece na lista antes da resposta; o botão diz "Enviando…" com a mesma largura e
// a falha fica no formulário. Com a visita escolhida, a OS nasce agendada e o agendamento sai na mesma ação.
import { useEffect, useRef, useState, type ReactNode } from "react"
import { navigate } from "astro:transitions/client"
import { ArrowLeft, ArrowRight, Check, ChevronDown, History } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { CampoMoeda } from "@/components/mift/fluxos/campos-br"
import { agora } from "@/proto/relogio"
import { RECURSOS, SERVICOS, recursoPorId, servicoPorSlug } from "@/proto/negocio"
import { clientes } from "@/modulos/clientes/dados"
import { agendamentos, validarHorario } from "@/modulos/agenda/dados"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { url } from "@/lib/url"
import { criarOS } from "../dados"

const CHAVE = "pedidos-nova-os:rascunho"
const PASSOS = ["Cliente", "Serviço", "Agenda", "Revisão"] as const
type Valores = {
  clienteId: string; origem: "balcao" | "telefone" | "whatsapp"
  titulo: string; servico: string; centavos: number | null; nota: string
  tecnico: string; marcar: boolean; dia: string; minuto: number; prazo: string
}
type Erros = Partial<Record<keyof Valores, string>>

const isoDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const emDias = (n: number) => isoDia(new Date(agora().getTime() + n * 864e5))
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`
const dataLocal = (iso: string, min = 12 * 60) => { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d, Math.floor(min / 60), min % 60) }
const inicial = (): Valores => ({
  clienteId: "", origem: "balcao", titulo: "", servico: "conserto-ar", centavos: null, nota: "",
  tecnico: "", marcar: false, dia: emDias(1), minuto: 9 * 60, prazo: emDias(7),
})

function Campo({ id, rotulo, erro, dica, children }: { id: string; rotulo: string; erro?: string; dica?: string; children: ReactNode }) {
  return (
    // a linha de mensagem tem altura reservada: campos lado a lado ficam alinhados com e sem dica ou erro
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      <p id={erro ? `${id}-erro` : `${id}-dica`} className={cn("min-h-4 text-xs text-pretty", erro ? "text-negativo-texto" : "text-muted-foreground")} aria-live="polite">{erro ?? dica ?? ""}</p>
    </div>
  )
}

export default function NovaOS() {
  const lista = clientes.use()
  return (
    <>
      <BannerSobreposto titulo="Nova OS" descricao="Quatro passos curtos; o rascunho fica guardado se você sair no meio" sobreposicao={48}>
        <ComDados
          capacidade="criar_pedido" area="do atendimento" rotulo="o formulário"
          esqueleto={<Esqueleto className="h-[28rem] rounded-[var(--radius-xl)]" />}
          estaVazio={lista.length === 0}
          vazio={<EstadoVazio icone={Check} titulo="Cadastre um cliente antes" texto="Toda OS pertence a um cliente." acao={<LinkButton variant="outline" href={url("clientes/")}>Ver clientes</LinkButton>} />}
        >
          <Formulario />
        </ComDados>
      </BannerSobreposto>
      <div className="h-6" />
    </>
  )
}

function Formulario() {
  const todos = clientes.use().filter((c) => c.estado !== "anonimizado")
  const ags = agendamentos.use()
  const [v, setV] = useState<Valores>(inicial)
  const [passo, setPasso] = useState(0)
  const [visto, setVisto] = useState(0)
  const [erros, setErros] = useState<Erros>({})
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // "Resposta perdida" (EST-46): a OS pode ter sido criada; repetir às cegas duplicaria
  const [semResposta, setSemResposta] = useState(false)
  const [restaurado, setRestaurado] = useState<string | null>(null)
  const [resumoAberto, setResumoAberto] = useState(false)
  const pronto = useRef(false)
  const form = useRef<HTMLFormElement>(null)

  // rascunho: lê uma vez (depois de hidratar), grava a cada mudança
  useEffect(() => {
    try {
      const cru = localStorage.getItem(CHAVE)
      const c = new URLSearchParams(location.search).get("cliente")
      if (cru) {
        const r = JSON.parse(cru) as { v: Valores; passo: number; em: string }
        if (r.v && (r.v.titulo || r.v.clienteId)) {
          setV({ ...inicial(), ...r.v, ...(c && clientes.porId(c) ? { clienteId: c } : {}) }); setPasso(r.passo ?? 0); setVisto(r.passo ?? 0)
          setRestaurado(new Date(r.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
        }
      } else if (c && clientes.porId(c)) setV((a) => ({ ...a, clienteId: c }))
    } catch { /* sem armazenamento: segue sem rascunho */ }
    pronto.current = true
  }, [])
  useEffect(() => {
    if (!pronto.current) return
    try { localStorage.setItem(CHAVE, JSON.stringify({ v, passo, em: agora().toISOString() })) } catch { /* sem armazenamento */ }
  }, [v, passo])
  const descartar = () => { try { localStorage.removeItem(CHAVE) } catch { /* nada */ } setV(inicial()); setPasso(0); setVisto(0); setErros({}); setRestaurado(null) }

  const servico = servicoPorSlug(v.servico)
  const sobOrcamento = servico?.preco === null
  const aptos = RECURSOS.filter((r) => r.id !== "bancada-pampulha" && (!servico || r.competencias.includes(servico.competencia)))
  const inicio = dataLocal(v.dia, v.minuto)
  const fim = new Date(inicio.getTime() + (servico?.duracao ?? 60) * 6e4)
  const validacao = v.marcar && v.tecnico ? validarHorario({ inicio, fim, recursoId: v.tecnico }, v.servico, undefined, ags) : null
  const dias = Array.from({ length: 8 }, (_, i) => emDias(i)).filter((d) => dataLocal(d).getDay() !== 0)
  const cliente = todos.find((c) => c.id === v.clienteId)
  const valor = (v.centavos ?? 0) / 100

  function validar(p: number, x: Valores = v): Erros {
    const er: Erros = {}
    if (p === 0 && !x.clienteId) er.clienteId = "Escolha o cliente."
    if (p === 1) {
      if (x.titulo.trim().length < 3) er.titulo = "Descreva o serviço em pelo menos 3 letras."
      const s = servicoPorSlug(x.servico)
      if (s?.preco !== null && !(x.centavos && x.centavos > 0)) er.centavos = "Informe um valor maior que zero, como 1.250,00."
    }
    if (p === 2) {
      if (!x.prazo) er.prazo = "Informe o prazo."
      else if (x.prazo < emDias(0)) er.prazo = "O prazo não pode ser antes de hoje."
      if (x.marcar && !x.tecnico) er.tecnico = "Escolha o técnico da visita."
      if (x.marcar && x.tecnico) {
        const s = servicoPorSlug(x.servico)
        const i = dataLocal(x.dia, x.minuto)
        const val = validarHorario({ inicio: i, fim: new Date(i.getTime() + (s?.duracao ?? 60) * 6e4), recursoId: x.tecnico }, x.servico, undefined, ags)
        if (val.motivo) er.dia = val.motivo
        else if (i < agora()) er.dia = "Esse horário já passou. Escolha outro."
      }
    }
    return er
  }
  const set = <K extends keyof Valores>(k: K) => (x: Valores[K]) => {
    const n = { ...v, [k]: x }
    // trocar o serviço sugere o preço dele e limpa o técnico que não faz aquele serviço
    if (k === "servico") {
      const s = servicoPorSlug(x as string)
      if (s?.preco && !v.centavos) n.centavos = Math.round(s.preco * 100)
      if (n.tecnico && s && !recursoPorId(n.tecnico)?.competencias.includes(s.competencia)) n.tecnico = ""
    }
    setV(n)
    if (Object.keys(erros).length) setErros(validar(passo, n))
  }
  const aria = (k: keyof Valores) => ({ "aria-invalid": !!erros[k] || undefined, "aria-describedby": erros[k] ? `${k}-erro` : undefined })
  const focarErro = () => requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true], [data-invalid] button")?.focus())

  function irPara(p: number) {
    if (p > passo) {
      for (let i = passo; i < p; i++) {
        const er = validar(i)
        if (Object.keys(er).length) { setPasso(i); setErros(er); focarErro(); return }
      }
    }
    setErros({}); setPasso(p); setVisto((x) => Math.max(x, p))
    requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[data-passo-titulo]")?.focus())
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (passo < 3) { irPara(passo + 1); return }
    if (enviando || semResposta) return
    for (let i = 0; i < 3; i++) { const er = validar(i); if (Object.keys(er).length) { setPasso(i); setErros(er); focarErro(); return } }
    setEnviando(true); setErroEnvio(null)
    const r = await criarOS({
      titulo: v.titulo, clienteId: v.clienteId, servicoSlug: v.servico, total: valor, origem: v.origem, notaInterna: v.nota.trim(),
      prazo: dataLocal(v.prazo, 18 * 60).toISOString(), responsavelId: v.tecnico || undefined,
      visita: v.marcar && v.tecnico ? { recursoId: v.tecnico, inicio, fim } : undefined,
    })
    setEnviando(false)
    if (r.ok) { try { localStorage.removeItem(CHAVE) } catch { /* nada */ } navigate(url(`pedidos/?id=${r.id}`)) }
    else { setErroEnvio(r.mensagem); if (r.motivo === "falha" && r.semResposta) setSemResposta(true) }
  }

  const cabecaResumo = (
    <span className="block min-w-0">
      <span className="t-card block break-words">{v.titulo.trim() || "Sem descrição ainda"}</span>
      <span className="num t-kpi mt-1 block text-[1.375rem] break-words">{valor > 0 ? moeda(valor) : sobOrcamento ? "Sob orçamento" : "R$ 0,00"}</span>
    </span>
  )
  const resumo = (
    <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-2 text-sm">
      <dt className="text-muted-foreground">Cliente</dt><dd className="truncate" title={cliente?.nome}>{cliente?.nome ?? "A escolher"}</dd>
      <dt className="text-muted-foreground">Serviço</dt><dd className="truncate" title={servico?.nome}>{servico?.nome}</dd>
      <dt className="text-muted-foreground">Visita</dt><dd className="num truncate">{v.marcar && v.tecnico ? `${inicio.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}, ${hm(v.minuto)}` : "Marcar depois"}</dd>
      <dt className="text-muted-foreground">Técnico</dt><dd className="truncate">{recursoPorId(v.tecnico)?.nome ?? "A definir"}</dd>
      <dt className="text-muted-foreground">Prazo</dt><dd className="num">{v.prazo ? dataLocal(v.prazo).toLocaleDateString("pt-BR") : "—"}</dd>
    </dl>
  )

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* resumo: no celular vem antes e recolhe; no desktop fica fixo ao lado */}
      <Superficie nivel="destaque" como="aside" aria-label="Resumo da OS" className="grid gap-3 p-4 md:p-5 lg:sticky lg:top-[calc(var(--topo)+1.5rem)] lg:order-2">
        <button type="button" className="flex min-h-10 items-start justify-between gap-3 text-left lg:hidden" aria-expanded={resumoAberto} aria-controls="resumo-nova-os" onClick={() => setResumoAberto((a) => !a)}>
          {cabecaResumo}
          <ChevronDown className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", resumoAberto && "rotate-180")} aria-hidden="true" />
        </button>
        <div className="max-lg:hidden">{cabecaResumo}</div>
        <div id="resumo-nova-os" className={cn(!resumoAberto && "max-lg:hidden")}>{resumo}</div>
      </Superficie>

      <Card className="min-w-0 px-4 md:px-6 lg:order-1">
        <form ref={form} onSubmit={enviar} noValidate className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          {restaurado && (
            <p role="status" className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--primary)_10%,transparent)] px-3 py-2 text-sm">
              <History className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">Rascunho restaurado de <span className="num">{restaurado}</span>.</span>
              <Button type="button" variant="ghost" className="h-10" onPress={descartar}>Descartar</Button>
            </p>
          )}
          <ol className="grid grid-cols-4 gap-1.5" aria-label="Etapas da nova OS">
            {PASSOS.map((p, i) => (
              <li key={p} className="min-w-0">
                <button type="button" onClick={() => irPara(i)} disabled={i > visto + 1 || enviando} aria-current={i === passo ? "step" : undefined}
                  className="grid min-h-10 w-full gap-1 rounded-md text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed">
                  <span className={cn("h-1 rounded-full transition-colors duration-300", i <= passo ? "bg-primary" : "bg-muted")} aria-hidden="true" />
                  <span className={cn("truncate", i === passo ? "font-semibold text-foreground" : "text-muted-foreground")}><span className="num">{i + 1}</span> {p}</span>
                </button>
              </li>
            ))}
          </ol>
          <h2 data-passo-titulo tabIndex={-1} className="t-card outline-none">{["Para quem é a OS", "O que será feito", "Quando e com quem", "Confira antes de criar"][passo]}</h2>

          {passo === 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <Campo id="clienteId" rotulo="Cliente" erro={erros.clienteId}>
                <Select aria-label="Cliente" placeholder="Escolha o cliente" selectedKey={v.clienteId || null} onSelectionChange={(k) => set("clienteId")(String(k))} isInvalid={!!erros.clienteId} className="w-full">
                  <SelectTrigger id="clienteId" className="w-full min-w-0 max-w-full" {...aria("clienteId")}><SelectValue className="min-w-0 truncate" /></SelectTrigger>
                  <SelectContent className="max-w-[min(32rem,calc(100vw-2rem))]">
                    {todos.map((c) => <SelectItem key={c.id} id={c.id} textValue={c.nome}><span className="truncate" title={c.nome}>{c.nome}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo id="origem" rotulo="Pedido chegou por">
                <Select aria-label="Pedido chegou por" selectedKey={v.origem} onSelectionChange={(k) => set("origem")(k as Valores["origem"])} className="w-full">
                  <SelectTrigger id="origem" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem id="balcao">Balcão</SelectItem><SelectItem id="telefone">Telefone</SelectItem><SelectItem id="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </Campo>
            </div>
          )}

          {passo === 1 && (
            <>
              <Campo id="titulo" rotulo="O que será feito" erro={erros.titulo}>
                <Input id="titulo" value={v.titulo} onChange={(e) => set("titulo")(e.target.value)} placeholder="Ex.: Split da sala não gela" autoComplete="off" {...aria("titulo")} />
              </Campo>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
                <Campo id="servico" rotulo="Serviço" dica={servico?.precoFechado ? "Preço fechado: pula diagnóstico e orçamento." : "Sob orçamento depois do diagnóstico."}>
                  <Select aria-label="Serviço" selectedKey={v.servico} onSelectionChange={(k) => set("servico")(String(k))} className="w-full">
                    <SelectTrigger id="servico" className="w-full min-w-0"><SelectValue className="min-w-0 truncate" /></SelectTrigger>
                    <SelectContent>{SERVICOS.map((s) => <SelectItem key={s.slug} id={s.slug} textValue={s.nome}>{s.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
                <Campo id="centavos" rotulo="Valor (R$)" erro={erros.centavos} dica={sobOrcamento ? "Sob orçamento: pode ficar em branco." : "O valor combinado com o cliente."}>
                  <CampoMoeda id="centavos" valor={v.centavos} aoMudar={(c) => set("centavos")(c)} invalido={!!erros.centavos} descritoPor={erros.centavos ? "centavos-erro" : "centavos-dica"} className="h-10" />
                </Campo>
              </div>
              <Campo id="nota" rotulo="Nota interna (opcional)" dica="Fica só com a equipe; o cliente não vê.">
                <Textarea id="nota" value={v.nota} onChange={(e) => set("nota")(e.target.value)} rows={2} placeholder="Ex.: portão azul, interfone 12" />
              </Campo>
            </>
          )}

          {passo === 2 && (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
                <Campo id="tecnico" rotulo="Técnico" erro={erros.tecnico} dica="Só quem faz este serviço aparece.">
                  <Select aria-label="Técnico" placeholder="A definir" selectedKey={v.tecnico || "nenhum"} onSelectionChange={(k) => set("tecnico")(k === "nenhum" ? "" : String(k))} isInvalid={!!erros.tecnico} className="w-full">
                    <SelectTrigger id="tecnico" className="w-full" {...aria("tecnico")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem id="nenhum">A definir</SelectItem>
                      {aptos.map((r) => <SelectItem key={r.id} id={r.id}>{r.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo id="prazo" rotulo="Prazo prometido" erro={erros.prazo}>
                  <Input id="prazo" type="date" min={emDias(0)} value={v.prazo} onChange={(e) => set("prazo")(e.target.value)} {...aria("prazo")} />
                </Campo>
              </div>
              <fieldset className="grid gap-3">
                <legend className="mb-2 text-sm font-medium">Visita</legend>
                <div className="grid grid-cols-2 gap-2">
                  {[false, true].map((m) => (
                    <label key={String(m)} className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm", v.marcar === m ? "border-primary bg-primary/8" : "border-input")}>
                      <input type="radio" name="marcar" checked={v.marcar === m} onChange={() => set("marcar")(m)} className="size-4 accent-[var(--primary)]" />
                      {m ? "Marcar agora" : "Marcar depois"}
                    </label>
                  ))}
                </div>
                {v.marcar && (
                  <div className="grid grid-cols-2 gap-3">
                    <Campo id="dia" rotulo="Dia" erro={erros.dia}>
                      <select id="dia" className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 max-sm:text-base" value={v.dia} onChange={(e) => set("dia")(e.target.value)} {...aria("dia")}>
                        {dias.map((d) => <option key={d} value={d} className="bg-[Canvas] text-[CanvasText]">{dataLocal(d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</option>)}
                      </select>
                    </Campo>
                    <Campo id="minuto" rotulo="Início">
                      <select id="minuto" className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 max-sm:text-base" value={v.minuto} onChange={(e) => set("minuto")(Number(e.target.value))}>
                        {Array.from({ length: 20 }, (_, i) => 8 * 60 + i * 30).map((h) => <option key={h} value={h} className="bg-[Canvas] text-[CanvasText]">{hm(h)}</option>)}
                      </select>
                    </Campo>
                    <p className="col-span-2 text-sm text-pretty" aria-live="polite">
                      {!v.tecnico ? <span className="text-muted-foreground">Escolha o técnico para ver se o horário está livre.</span>
                        : validacao?.motivo ? <span className="text-negativo-texto">{validacao.motivo}</span>
                        : validacao?.conflitos.length ? <span className="text-alerta-texto">Conflita com {validacao.conflitos.map((a) => a.id).join(", ")}. Dá para marcar, mas avise o técnico.</span>
                        : <span className="text-muted-foreground">Horário livre: {hm(v.minuto)} a {hm(v.minuto + (servico?.duracao ?? 60))}.</span>}
                    </p>
                  </div>
                )}
              </fieldset>
            </>
          )}

          {passo === 3 && (
            <div className="grid gap-3 text-sm">
              <p className="t-card break-words">{v.titulo.trim()}</p>
              {resumo}
              <p className="text-muted-foreground text-pretty">
                {v.marcar && v.tecnico ? "A OS nasce agendada e o cliente recebe a confirmação da visita." : "A OS entra em Novas; o cliente recebe “Recebemos seu pedido”."}
              </p>
            </div>
          )}

          {erroEnvio && (
            <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">
              {erroEnvio}{semResposta && <> <a className="link-sistema font-medium" href={url("pedidos/?vista=quadro")}>Conferir em Novas</a></>}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-4 shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)]">
            {passo === 0
              ? <LinkButton variant="ghost" href={url("pedidos/")}>Cancelar</LinkButton>
              : <Button type="button" variant="ghost" onPress={() => irPara(passo - 1)} isDisabled={enviando}><ArrowLeft /> Voltar</Button>}
            <Button type="submit" isPending={enviando} isDisabled={semResposta} className="min-w-[9.5rem]">
              {passo < 3 ? <>Continuar <ArrowRight /></> : <>{!enviando && <Check />} {enviando ? "Enviando…" : "Criar OS"}</>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
