// AgendaInterativa: grade de horários por coluna (cada coluna = um dia de um recurso). Serve ao "dia por recurso"
// (colunas = recursos) e à "semana" (colunas = dias de um recurso).
// Modelo, geometria e funil de validação: Event Calendar do ReUI (encaixe em minutos, canDrop/onEventUpdate, 5 px no
// mouse e 250 ms no toque). Interação: @dnd-kit/core, com três gestos num só DndContext (mover, esticar pelas bordas e
// criar arrastando no vazio) e teclado próprio (Espaço pega, setas andam, Alt+setas mudam a duração, Enter solta, Esc
// cancela). Toda proposta passa por `validar` durante o arrasto: inválida = coluna hachurada com o motivo; sobreposição
// = conflito destacado (não proíbe). O componente não grava: `aoMover` e `aoCriar` decidem.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react"
import { AutoScrollActivator, DndContext, useDraggable, type DragStartEvent } from "@dnd-kit/core"
import { Loader2, TriangleAlert } from "lucide-react"
import { useMenosMovimento, vibrar } from "@/lib/movimento"
import { cn } from "@/lib/utils"
import { SILENCIO, TEXTO_INSTRUCOES_AGENDA, instrucoes, useAnuncio, usePonteiro, useSensoresArrasto } from "./comum"
import "./interativos.css"

export type ColunaAgenda = {
  id: string; dia: Date; recursoId: string; titulo: string; subtitulo?: string
  /** Coluna inteira bloqueada (feriado): o motivo aparece na grade. */
  bloqueio?: string
  /** Expediente em minutos do dia; fora dele a grade fica hachurada. null = fechado. */
  expediente?: { abre: number; fecha: number } | null
  /** Texto quando a coluna não tem nada (ex.: "Livre o dia todo"). */
  vazio?: string
}
export type BlocoAgenda = {
  id: string; inicio: Date; fim: Date; recursoId: string
  titulo: string; detalhe?: string; rotulo: string
  /** Cor do bloco: um token (ex.: "var(--primary)"). */
  cor: string; tracejado?: boolean; travado?: boolean
}
export type PropostaAgenda = { inicio: Date; fim: Date; recursoId: string }
export type ValidacaoAgenda = { motivo?: string; conflitos: { id: string; inicio: Date; fim: Date }[] }

type Props = {
  rotulo: string
  colunas: ColunaAgenda[]
  blocos: BlocoAgenda[]
  horaInicio?: number; horaFim?: number; passo?: number
  agora: Date
  validar: (p: PropostaAgenda, blocoId?: string) => ValidacaoAgenda
  aoMover: (id: string, p: PropostaAgenda, tipo: "mover" | "esticar") => void
  aoCriar: (p: PropostaAgenda) => void
  pendentes?: Set<string>
  nomeRecurso: (id: string) => string
  /** Altura da grade visível (rolagem interna). */
  altura?: string
}

type Tipo = "mover" | "inicio" | "fim" | "criar"
type Gesto = { tipo: Tipo; id?: string; colOrigem: string; agarre: number; ancora: number; modo: "ponteiro" | "teclado"; col: string; ini: number; fim: number }

const PX_MIN = 1 // 60 px por hora
const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const minDoDia = (d: Date) => d.getHours() * 60 + d.getMinutes()
const emData = (dia: Date, min: number) => new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), Math.floor(min / 60), min % 60)
export const hhmm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`
const coordsDe = (e: Event | null) => {
  if (!e) return { x: 0, y: 0 }
  if ("touches" in e) { const t = (e as TouchEvent).touches[0] ?? (e as TouchEvent).changedTouches[0]; return { x: t.clientX, y: t.clientY } }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
}

/** Faixas lado a lado para blocos que se sobrepõem (algoritmo de colunas do ReUI, simplificado). */
function faixas(bs: BlocoAgenda[]) {
  const ord = [...bs].sort((a, b) => +a.inicio - +b.inicio || +b.fim - +a.fim)
  const out = new Map<string, { faixa: number; total: number }>()
  let grupo: BlocoAgenda[] = [], fimGrupo = 0, fins: number[] = []
  const fechar = () => { for (const b of grupo) out.get(b.id)!.total = fins.length; grupo = []; fins = [] }
  for (const b of ord) {
    if (grupo.length && +b.inicio >= fimGrupo) fechar()
    let f = fins.findIndex((x) => x <= +b.inicio)
    if (f < 0) { f = fins.length; fins.push(+b.fim) } else fins[f] = +b.fim
    out.set(b.id, { faixa: f, total: 0 })
    grupo.push(b); fimGrupo = Math.max(fimGrupo, +b.fim)
  }
  fechar()
  return out
}

export function AgendaInterativa(p: Props) {
  const { colunas, blocos, validar, passo = 15 } = p
  const hIni = (p.horaInicio ?? 8) * 60, hFim = (p.horaFim ?? 18) * 60
  const sensores = useSensoresArrasto()
  const ponteiro = usePonteiro()
  const reduzido = useMenosMovimento()
  const { anunciar, regiao } = useAnuncio()
  const [gesto, setGesto] = useState<Gesto | null>(null)
  const gestoRef = useRef<Gesto | null>(null)
  gestoRef.current = gesto
  const grade = useRef<HTMLDivElement>(null)
  const focoDepois = useRef<string | null>(null)

  const colPorId = useMemo(() => new Map(colunas.map((c) => [c.id, c])), [colunas])
  const blocoPorId = useMemo(() => new Map(blocos.map((b) => [b.id, b])), [blocos])
  const blocosDa = (c: ColunaAgenda) => blocos.filter((b) => b.recursoId === c.recursoId && mesmoDia(b.inicio, c.dia))
  const colDoBloco = (b: BlocoAgenda) => colunas.find((c) => c.recursoId === b.recursoId && mesmoDia(b.inicio, c.dia))
  const encaixar = (m: number) => Math.round(m / passo) * passo
  const proposta = (g: Pick<Gesto, "col" | "ini" | "fim">): PropostaAgenda => {
    const c = colPorId.get(g.col)!
    return { inicio: emData(c.dia, g.ini), fim: emData(c.dia, g.fim), recursoId: c.recursoId }
  }
  const validacao = gesto ? validar(proposta(gesto), gesto.tipo === "criar" ? undefined : gesto.id) : null

  // conflitos em repouso (bordas de perigo nos dois blocos)
  const conflitos = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const b of blocos) {
      const v = validar({ inicio: b.inicio, fim: b.fim, recursoId: b.recursoId }, b.id)
      if (v.conflitos.length) m.set(b.id, v.conflitos.map((x) => x.id))
    }
    return m
  }, [blocos, validar])

  const descrever = (g: Gesto) => {
    const c = colPorId.get(g.col)
    const v = validar(proposta(g), g.tipo === "criar" ? undefined : g.id)
    const base = `${hhmm(g.ini)} a ${hhmm(g.fim)}, ${c?.titulo}${c && c.titulo !== p.nomeRecurso(c.recursoId) ? `, ${p.nomeRecurso(c.recursoId)}` : ""}`
    if (v.motivo) return `${base}. Não pode: ${v.motivo}`
    if (v.conflitos.length) return `${base}. Conflito com ${v.conflitos.map((x) => x.id).join(", ")}.`
    return base + "."
  }

  // ---------- ponteiro ----------
  const colunaNoPonto = (x: number): { id: string; el: HTMLElement } | null => {
    const els = Array.from(grade.current?.querySelectorAll<HTMLElement>("[data-col-agenda]") ?? [])
    if (!els.length) return null
    let melhor = els[0], dist = Infinity
    for (const el of els) {
      const r = el.getBoundingClientRect()
      const d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
      if (d < dist) { dist = d; melhor = el }
    }
    return { id: melhor.dataset.colAgenda!, el: melhor }
  }
  const minutoNoPonto = (el: HTMLElement, y: number) => hIni + (y - el.getBoundingClientRect().top) / PX_MIN
  const elDaCol = (id: string) => grade.current?.querySelector<HTMLElement>(`[data-col-agenda="${CSS.escape(id)}"]`) ?? null

  const aoComecar = (e: DragStartEvent) => {
    const d = e.active.data.current as { tipo: Tipo; id?: string; col: string }
    const inicial = coordsDe(e.activatorEvent)
    const el = elDaCol(d.col)
    if (!el) return
    const mIni = minutoNoPonto(el, inicial.y)
    if (d.tipo === "criar") {
      const a = Math.max(hIni, Math.min(hFim - passo, Math.floor(mIni / passo) * passo))
      setGesto({ tipo: "criar", colOrigem: d.col, col: d.col, agarre: 0, ancora: a, modo: "ponteiro", ini: a, fim: a + passo })
      anunciar(`Criando agendamento a partir de ${hhmm(a)}.`)
    } else {
      const b = blocoPorId.get(d.id!)!
      const ini = minDoDia(b.inicio), fim = minDoDia(b.fim)
      setGesto({ tipo: d.tipo, id: d.id, colOrigem: d.col, col: d.col, agarre: mIni - ini, ancora: 0, modo: "ponteiro", ini, fim })
      anunciar(`${b.rotulo} pego. ${hhmm(ini)} a ${hhmm(fim)}.`)
    }
    vibrar(8)
  }

  const aoMoverPonteiro = () => {
    const g = gestoRef.current
    if (!g || g.modo !== "ponteiro") return
    const { x, y } = ponteiro.current
    let n: Gesto = g
    if (g.tipo === "mover") {
      const c = colunaNoPonto(x)
      if (!c) return
      const dur = g.fim - g.ini
      const ini = Math.max(hIni, Math.min(hFim - dur, encaixar(minutoNoPonto(c.el, y) - g.agarre)))
      n = { ...g, col: c.id, ini, fim: ini + dur }
    } else {
      const el = elDaCol(g.col)
      if (!el) return
      const m = encaixar(minutoNoPonto(el, y))
      if (g.tipo === "inicio") n = { ...g, ini: Math.max(hIni, Math.min(g.fim - passo, m)) }
      else if (g.tipo === "fim") n = { ...g, fim: Math.min(hFim, Math.max(g.ini + passo, m)) }
      else {
        const a = g.ancora, c = Math.max(hIni, Math.min(hFim, m))
        n = c > a ? { ...g, ini: a, fim: Math.max(a + passo, c) } : { ...g, ini: Math.min(c, a), fim: a + passo }
      }
    }
    if (n.col !== g.col || n.ini !== g.ini || n.fim !== g.fim) { setGesto(n); anunciar(descrever(n)) }
  }

  const terminar = (g: Gesto | null, cancelado: boolean) => {
    setGesto(null)
    if (!g) return
    focoDepois.current = g.modo === "teclado" && g.id ? g.id : null
    const b = g.id ? blocoPorId.get(g.id) : undefined
    if (cancelado) return anunciar(b ? `Movimento cancelado. ${b.rotulo} continua às ${hhmm(minDoDia(b.inicio))}.` : "Criação cancelada.")
    const pr = proposta(g)
    const v = validar(pr, g.tipo === "criar" ? undefined : g.id)
    if (v.motivo) { vibrar("erro"); return anunciar(`Nada mudou. ${v.motivo}`) }
    if (g.tipo === "criar") { p.aoCriar(pr); return anunciar(`Novo agendamento de ${hhmm(g.ini)} a ${hhmm(g.fim)}. Preencha o diálogo.`) }
    if (!b) return
    if (+pr.inicio === +b.inicio && +pr.fim === +b.fim && pr.recursoId === b.recursoId) return anunciar(`${b.rotulo} ficou no mesmo horário.`)
    vibrar("confirmar")
    p.aoMover(b.id, pr, g.tipo === "mover" ? "mover" : "esticar")
    anunciar(`${b.rotulo} remarcado para ${descrever(g)}`)
  }

  // ---------- teclado ----------
  const teclado = (e: KeyboardEvent<HTMLElement>, b: BlocoAgenda) => {
    const g = gestoRef.current
    if (!g) {
      if (e.key !== " " || b.travado) return
      e.preventDefault()
      const col = colDoBloco(b)
      if (!col) return
      const n: Gesto = { tipo: "mover", id: b.id, colOrigem: col.id, col: col.id, agarre: 0, ancora: 0, modo: "teclado", ini: minDoDia(b.inicio), fim: minDoDia(b.fim) }
      setGesto(n)
      return anunciar(`${b.rotulo} pego, ${hhmm(n.ini)} a ${hhmm(n.fim)}. Setas movem, Alt com setas muda a duração, Enter solta, Esc cancela.`)
    }
    if (g.modo !== "teclado" || g.id !== b.id) return
    const dur = g.fim - g.ini
    let n = g
    const ordem = colunas.map((c) => c.id)
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const s = e.key === "ArrowUp" ? -1 : 1
      if (e.altKey) n = { ...g, tipo: "fim", fim: Math.min(hFim, Math.max(g.ini + passo, g.fim + s * passo)) }
      else { const ini = Math.max(hIni, Math.min(hFim - dur, g.ini + s * (e.shiftKey ? 60 : passo))); n = { ...g, ini, fim: ini + dur } }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const i = ordem.indexOf(g.col) + (e.key === "ArrowLeft" ? -1 : 1)
      if (i >= 0 && i < ordem.length) n = { ...g, col: ordem[i] }
    } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); return terminar(g, false) }
    else if (e.key === "Escape") { e.preventDefault(); return terminar(g, true) }
    else if (e.key === "Tab") { e.preventDefault(); return }
    else return
    e.preventDefault()
    if (n !== g) { setGesto(n); anunciar(descrever(n)) }
  }

  // teclado: o foco fica no bloco original (ele não sai do lugar até soltar); a grade acompanha o fantasma.
  // Depois de soltar, o bloco remonta na coluna nova e o foco volta para ele.
  useLayoutEffect(() => {
    const comportamento: ScrollBehavior = reduzido ? "auto" : "smooth"
    if (gesto?.modo === "teclado") {
      grade.current?.querySelector<HTMLElement>("[data-fantasma]")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: comportamento })
      return
    }
    const id = focoDepois.current
    if (!id || gesto) return
    focoDepois.current = null
    const el = document.querySelector<HTMLElement>(`[data-bloco-id="${CSS.escape(id)}"]`)
    if (el && document.activeElement !== el) el.focus({ preventScroll: true })
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: comportamento })
  })

  // rola até o agora na primeira pintura
  useEffect(() => {
    const el = grade.current
    if (!el) return
    const m = minDoDia(p.agora)
    // uma hora antes do agora, na hora cheia: o rótulo da hora e os blocos dela não ficam cortados sob o cabeçalho
    if (m > hIni && m < hFim) el.scrollTop = Math.max(0, (Math.floor((m - 60) / 60) * 60 - hIni) * PX_MIN)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const horas = Array.from({ length: (hFim - hIni) / 60 + 1 }, (_, i) => hIni + i * 60)
  const alturaGrade = (hFim - hIni) * PX_MIN
  const agoraMin = minDoDia(p.agora)
  const temHoje = colunas.some((c) => mesmoDia(c.dia, p.agora)) && agoraMin >= hIni && agoraMin <= hFim
  const umaColuna = colunas.length === 1

  return (
    <DndContext sensors={sensores} autoScroll={{ activator: AutoScrollActivator.Pointer, threshold: { x: 0.08, y: 0.1 } }} onDragStart={aoComecar} onDragMove={aoMoverPonteiro}
      onDragEnd={() => terminar(gestoRef.current, false)} onDragCancel={() => terminar(gestoRef.current, true)}
      accessibility={{ announcements: SILENCIO, screenReaderInstructions: instrucoes(TEXTO_INSTRUCOES_AGENDA) }}>
      {regiao}
      <div ref={grade} role="region" aria-label={p.rotulo} data-agenda data-grupo data-rolagem-permitida
        className="relative overflow-auto overscroll-contain rounded-[var(--radius-xl)] shadow-[inset_0_0_0_1px_var(--sup-aro)] bg-[color-mix(in_oklch,var(--foreground)_3%,transparent)]"
        style={{ maxHeight: p.altura ?? "calc(100dvh - 15rem)", ["--hora" as string]: `${60 * PX_MIN}px` }}>
        <div className="grid min-w-full" style={{ gridTemplateColumns: `3.25rem repeat(${colunas.length}, minmax(${umaColuna ? "0" : "9.5rem"}, 1fr))` }}>
          {/* cabeçalho fixo */}
          <div className="casca-fixa sticky top-0 left-0 z-30 border-b border-[color-mix(in_oklch,var(--foreground)_9%,transparent)]" />
          {colunas.map((c) => {
            const n = blocosDa(c).length
            return (
              <div key={c.id} className="casca-fixa sticky top-0 z-20 min-w-0 border-b border-l border-[color-mix(in_oklch,var(--foreground)_9%,transparent)] px-2.5 py-2">
                <p className={cn("truncate text-[13px] font-semibold", mesmoDia(c.dia, p.agora) && c.titulo.match(/\d/) && "text-[var(--texto-primario)]")}>{c.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{c.bloqueio ? "Fechado" : c.subtitulo ?? `${n} ${n === 1 ? "visita" : "visitas"}`}</p>
              </div>
            )
          })}
          {/* régua de horas */}
          <div className="sticky left-0 z-10 bg-[var(--background)]" style={{ height: alturaGrade }}>
            {horas.map((h) => (
              <span key={h} className="num absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: (h - hIni) * PX_MIN }}>
                {h === hIni ? "" : hhmm(h)}
              </span>
            ))}
            {temHoje && (
              <span className="num absolute right-1 z-10 -translate-y-1/2 rounded bg-negative px-1 text-[10px] font-semibold text-negative-foreground" style={{ top: (agoraMin - hIni) * PX_MIN }}>
                {hhmm(agoraMin)}
              </span>
            )}
          </div>
          {colunas.map((c) => (
            <ColunaGrade key={c.id} c={c} hIni={hIni} hFim={hFim} altura={alturaGrade} agora={p.agora}
              blocos={blocosDa(c)} conflitos={conflitos} gesto={gesto} validacao={validacao} pendentes={p.pendentes}
              aoTocar={(min) => {
                const ini = Math.max(hIni, Math.min(hFim - 60, Math.floor(min / passo) * passo))
                const pr = { inicio: emData(c.dia, ini), fim: emData(c.dia, ini + 60), recursoId: c.recursoId }
                const v = validar(pr)
                if (v.motivo) { vibrar("erro"); anunciar(v.motivo); return }
                p.aoCriar(pr)
              }}
              teclado={teclado} />
          ))}
        </div>
      </div>
    </DndContext>
  )
}

function ColunaGrade({ c, hIni, hFim, altura, agora, blocos, conflitos, gesto, validacao, pendentes, aoTocar, teclado }: {
  c: ColunaAgenda; hIni: number; hFim: number; altura: number; agora: Date; blocos: BlocoAgenda[]; conflitos: Map<string, string[]>
  gesto: Gesto | null; validacao: ValidacaoAgenda | null; pendentes?: Set<string>
  aoTocar: (min: number) => void; teclado: (e: KeyboardEvent<HTMLElement>, b: BlocoAgenda) => void
}) {
  const { setNodeRef, listeners } = useDraggable({ id: `criar:${c.id}`, data: { tipo: "criar", col: c.id }, disabled: !!c.bloqueio })
  const lanes = faixas(blocos)
  const alvo = gesto?.col === c.id
  const invalido = alvo && !!validacao?.motivo
  const agoraMin = minDoDia(agora)
  const hoje = mesmoDia(c.dia, agora) && agoraMin >= hIni && agoraMin <= hFim
  const fora: [number, number][] = c.bloqueio || c.expediente === null ? [[hIni, hFim]]
    : c.expediente ? [[hIni, Math.max(hIni, c.expediente.abre)], [Math.min(hFim, c.expediente.fecha), hFim]].filter(([a, b]) => b > a) as [number, number][] : []
  const toque = (e: ReactMouseEvent<HTMLDivElement>) => {
    // encaixe por toque: um toque no vazio abre o "Novo agendamento" naquele horário (no mouse, duplo clique)
    if ((e.target as HTMLElement).closest("[data-bloco-id]")) return
    const tipo = (e.nativeEvent as PointerEvent).pointerType
    if (e.type === "click" && tipo !== "touch") return
    aoTocar(hIni + (e.clientY - e.currentTarget.getBoundingClientRect().top) / PX_MIN)
  }
  return (
    <div ref={setNodeRef} {...listeners} data-col-agenda={c.id} aria-label={`${c.titulo}${c.bloqueio ? `, ${c.bloqueio}` : ""}`} role="group"
      onClick={toque} onDoubleClick={toque}
      className={cn("agenda-linhas relative touch-pan-y border-l border-[color-mix(in_oklch,var(--foreground)_9%,transparent)] select-none",
        !c.bloqueio && "cursor-cell", invalido && "hachura")}
      style={{ height: altura, backgroundPositionY: `${-(hIni % 60)}px` }}>
      {fora.map(([a, b]) => (
        <div key={a} className="hachura pointer-events-none absolute inset-x-0 bg-[color-mix(in_oklch,var(--foreground)_3%,transparent)]" style={{ top: (a - hIni) * PX_MIN, height: (b - a) * PX_MIN }} />
      ))}
      {c.bloqueio && (
        <p className="absolute inset-x-2 top-3 rounded-md bg-[color-mix(in_oklch,var(--background)_85%,transparent)] px-2 py-1.5 text-center text-xs font-medium">{c.bloqueio}</p>
      )}
      {!c.bloqueio && blocos.length === 0 && c.vazio && !alvo && (
        <p className="pointer-events-none absolute inset-x-2 top-3 text-center text-xs text-muted-foreground">{c.vazio}</p>
      )}
      {hoje && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-negative" style={{ top: (agoraMin - hIni) * PX_MIN - 1 }} />}
      {blocos.map((b) => {
        const l = lanes.get(b.id) ?? { faixa: 0, total: 1 }
        const pego = gesto?.id === b.id && gesto.tipo !== "criar"
        return <Bloco key={b.id} b={b} col={c.id} hIni={hIni} faixa={l.faixa} total={l.total} conflito={conflitos.get(b.id)}
          pego={pego} pendente={pendentes?.has(b.id)} teclado={teclado} />
      })}
      {alvo && gesto && (
        <Fantasma gesto={gesto} hIni={hIni} validacao={validacao} />
      )}
    </div>
  )
}

function Bloco({ b, col, hIni, faixa, total, conflito, pego, pendente, teclado }: {
  b: BlocoAgenda; col: string; hIni: number; faixa: number; total: number; conflito?: string[]; pego: boolean; pendente?: boolean
  teclado: (e: KeyboardEvent<HTMLElement>, b: BlocoAgenda) => void
}) {
  const desab = !!b.travado
  const corpo = useDraggable({ id: `mover:${b.id}`, data: { tipo: "mover", id: b.id, col }, disabled: desab })
  const topo = useDraggable({ id: `inicio:${b.id}`, data: { tipo: "inicio", id: b.id, col }, disabled: desab })
  const base = useDraggable({ id: `fim:${b.id}`, data: { tipo: "fim", id: b.id, col }, disabled: desab })
  const ini = minDoDia(b.inicio), fim = minDoDia(b.fim)
  const h = (fim - ini) * PX_MIN
  const curto = h < 44
  // lado a lado (conflito): meia coluna não cabe "AG-3315 · Limpeza…" nem "Conflito com AG-3316"; fica o nome e um selo curto,
  // e o texto inteiro segue no title e no nome acessível
  const estreito = total > 1
  return (
    <div ref={corpo.setNodeRef} {...corpo.listeners} data-bloco-id={b.id} tabIndex={0} role="button"
      aria-roledescription="agendamento arrastável" aria-describedby={corpo.attributes["aria-describedby"]}
      aria-label={`${b.rotulo}, ${hhmm(ini)} a ${hhmm(fim)}, ${b.titulo}${conflito ? `, conflito com ${conflito.join(", ")}` : ""}${b.travado ? ", não pode ser movido" : ""}`}
      aria-pressed={pego || undefined} aria-busy={pendente || undefined}
      data-conflito={conflito ? "" : undefined} data-tracejado={b.tracejado || undefined}
      onKeyDown={(e) => teclado(e, b)}
      title={`${hhmm(ini)}–${hhmm(fim)} · ${b.titulo}${b.detalhe ? ` · ${b.detalhe}` : ""}${conflito ? ` · conflito com ${conflito.join(", ")}` : ""}`}
      className={cn("bloco-agenda group absolute overflow-hidden rounded-md px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
        desab ? "cursor-default" : "cursor-grab touch-manipulation", pego && "opacity-35", pendente && "opacity-70")}
      style={{ top: (ini - hIni) * PX_MIN + 1, height: Math.max(14, h - 2), left: `calc(${(faixa / total) * 100}% + 2px)`, width: `calc(${100 / total}% - 4px)`, ["--evento" as string]: b.cor }}>
      {!desab && <div ref={topo.setNodeRef} {...topo.listeners} aria-hidden="true" data-alca="inicio"
        className="absolute inset-x-0 top-0 z-10 h-2 cursor-ns-resize touch-none" />}
      <div className={cn("pointer-events-none flex min-w-0", curto ? "items-center gap-1.5 py-0.5" : "flex-col py-1")}>
        <span className="num shrink-0 text-[11px] font-medium text-muted-foreground">{hhmm(ini)}–{hhmm(fim)}</span>
        <span className="truncate text-xs leading-tight font-semibold" title={b.titulo}>{b.titulo}</span>
        {!curto && !estreito && b.detalhe && <span className="truncate text-[11px] leading-tight text-muted-foreground" title={b.detalhe}>{b.detalhe}</span>}
        {!curto && conflito && (estreito
          ? <span className="flex min-w-0 items-center gap-1 text-[11px] leading-tight font-medium text-negativo-texto"><TriangleAlert className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">Conflito</span></span>
          : <span className="truncate text-[11px] leading-tight font-medium text-negativo-texto" title={`Conflito com ${conflito.join(", ")}`}>Conflito com {conflito.join(", ")}</span>)}
      </div>
      {pendente && <Loader2 className="absolute top-1 right-1 size-3 animate-spin text-muted-foreground motion-reduce:animate-none" aria-label="Salvando" />}
      {!desab && <div ref={base.setNodeRef} {...base.listeners} aria-hidden="true" data-alca="fim"
        className="absolute inset-x-0 bottom-0 z-10 flex h-2.5 cursor-ns-resize touch-none justify-center pointer-coarse:h-3.5">
        <span className="mt-auto mb-0.5 h-1 w-6 rounded-full bg-[color-mix(in_oklch,var(--foreground)_30%,transparent)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-60" />
      </div>}
    </div>
  )
}

function Fantasma({ gesto, hIni, validacao }: { gesto: Gesto; hIni: number; validacao: ValidacaoAgenda | null }) {
  const h = (gesto.fim - gesto.ini) * PX_MIN
  const msg = validacao?.motivo ?? (validacao?.conflitos.length ? `Conflito com ${validacao.conflitos.map((c) => c.id).join(", ")}` : null)
  return (
    <div data-fantasma="" aria-hidden="true"
      data-invalido={validacao?.motivo ? "" : undefined} data-conflito={!validacao?.motivo && validacao?.conflitos.length ? "" : undefined}
      className="bloco-agenda pointer-events-none absolute inset-x-1 z-20 rounded-md px-2 py-1 outline-none"
      style={{ top: (gesto.ini - hIni) * PX_MIN + 1, height: Math.max(14, h - 2) }}>
      <span className="num block text-[11px] font-semibold">{hhmm(gesto.ini)}–{hhmm(gesto.fim)}</span>
      {msg && <span className={cn("block text-[11px] leading-tight font-medium", validacao?.motivo ? "text-negativo-texto" : "text-negativo-texto")}>{msg}</span>}
      {!msg && gesto.tipo === "criar" && <span className="block text-[11px] text-muted-foreground">Novo agendamento</span>}
    </div>
  )
}
