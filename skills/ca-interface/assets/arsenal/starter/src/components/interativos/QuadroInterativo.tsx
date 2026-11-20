// QuadroInterativo: Kanban genérico (colunas + cartões) com arrastar por mouse, toque e teclado.
// Modelo de interação: o exemplo Kanban do React Aria (alvo = posição de lista, anúncio de cada passo) e a API
// composta do Dice UI; o motor de ponteiro é o @dnd-kit/core (MouseSensor + TouchSensor), o mesmo da agenda.
// - O cartão pego sobe com sombra (DragOverlay); no lugar onde vai cair abre uma vaga tracejada; os outros cartões
//   abrem espaço com o `layout` do motion (layoutId atravessa colunas). Movimento reduzido: sem layout nem inclinação.
// - O alvo é calculado pela posição do ponteiro contra o gabarito (offsetTop, que ignora as transformações da animação),
//   então a vaga não fica oscilando enquanto os cartões deslizam.
// - Teclado: Espaço pega, ↑/↓ posição, ←/→ coluna, Enter (ou Espaço) solta, Esc cancela. F2 ou duplo clique edita o título.
// - Coluna inválida para o cartão pego fica apagada e hachurada, com o motivo escrito; soltar lá não muda nada.
// - Celular (< 768 px): uma coluna por vez, abas no topo (também são alvo de soltar) e rolagem lateral com encaixe.
// O componente não grava nada: `aoSoltar` decide (acao() com Desfazer, ou abrir uma sheet antes de mover).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { AutoScrollActivator, DndContext, DragOverlay, useDraggable, type DragStartEvent } from "@dnd-kit/core"
import { LayoutGroup, motion } from "motion/react"
import { ChevronsLeftRight, ChevronsRightLeft, Loader2, Plus, TriangleAlert } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { mola, useMenosMovimento, vibrar } from "@/lib/movimento"
import { cn } from "@/lib/utils"
import { SILENCIO, TEXTO_INSTRUCOES_QUADRO, instrucoes, useAnuncio, usePonteiro, useSensoresArrasto } from "./comum"
import "./interativos.css"

export type ColunaQuadro = {
  id: string
  titulo: string
  /** Limite de cartões (WIP). Acima dele a coluna avisa; não bloqueia. */
  limite?: number
  /** Texto da coluna vazia. */
  vazio?: string
  /** Adicionar rápido no fim da coluna. `opcoes` vira um seletor (ex.: cliente) ao lado do título. */
  adicionar?: { rotulo: string; placeholder: string; opcoes?: { id: string; rotulo: string }[]; rotuloOpcoes?: string; aoCriar: (titulo: string, opcao?: string) => void }
}

export type Vizinhos<T> = { antes?: T; depois?: T }

export type PropsQuadro<T> = {
  rotulo: string
  colunas: ColunaQuadro[]
  /** Itens já filtrados e na ordem de exibição. */
  itens: T[]
  idDe: (t: T) => string
  colunaDe: (t: T) => string
  tituloDe: (t: T) => string
  /** Motivo quando o item não pode ir para a coluna (null = pode). Chamado só para coluna diferente da atual. */
  validar: (t: T, coluna: string) => string | null
  /** Soltou numa posição válida e diferente da de origem. Devolve o texto do anúncio (opcional). */
  aoSoltar: (t: T, coluna: string, vizinhos: Vizinhos<T>, indice: number) => string | void
  aoRenomear?: (t: T, titulo: string) => void
  /** Corpo do cartão; `titulo` já vem pronto (texto ou campo de edição). */
  renderCartao: (t: T, partes: { titulo: ReactNode; erguido?: boolean }) => ReactNode
  pendentes?: Set<string>
  /** Chave para lembrar as colunas recolhidas. */
  chave?: string
}

type Alvo = { col: string; idx: number }
type Entrada<T> = { t: T; tipo: "item" | "vaga" | "vaga-origem" | "oculto" }
type Arrasto = { id: string; modo: "ponteiro" | "teclado"; origem: Alvo; alvo: Alvo; altura: number }

export function QuadroInterativo<T>(p: PropsQuadro<T>) {
  const { colunas, itens, idDe, colunaDe, tituloDe, validar } = p
  const celular = useIsMobile(768)
  const reduzido = useMenosMovimento()
  const sensores = useSensoresArrasto()
  const ponteiro = usePonteiro()
  const { anunciar, regiao } = useAnuncio()
  const [arrasto, setArrasto] = useState<Arrasto | null>(null)
  const arrastoRef = useRef<Arrasto | null>(null)
  arrastoRef.current = arrasto
  const [editando, setEditando] = useState<string | null>(null)
  const [recolhidas, setRecolhidas] = useRecolhidas(p.chave ?? p.rotulo)
  const [ativa, setAtiva] = useState(0) // coluna visível no celular
  const trilho = useRef<HTMLDivElement>(null)
  const focoDepois = useRef<string | null>(null)
  const soltouEm = useRef(0)

  const porId = useMemo(() => new Map(itens.map((t) => [idDe(t), t])), [itens, idDe])
  const grupos = useMemo(() => {
    const g = new Map<string, T[]>(colunas.map((c) => [c.id, []]))
    for (const t of itens) g.get(colunaDe(t))?.push(t)
    return g
  }, [itens, colunas, colunaDe])

  const item = arrasto ? porId.get(arrasto.id) : undefined
  const motivoDe = useCallback((col: string) => {
    if (!item || colunaDe(item) === col) return null
    return validar(item, col)
  }, [item, colunaDe, validar])

  // arranjo exibido. Teclado: o próprio cartão (erguido) vai para o alvo. Ponteiro: o cartão fica montado e oculto na
  // origem (o dnd-kit continua medindo o mesmo nó) e uma vaga abre no alvo; alvo inválido = vaga volta à origem.
  const arranjo = useMemo(() => {
    const g = new Map<string, Entrada<T>[]>([...grupos].map(([k, v]) => [k, v.map((t) => ({ t, tipo: "item" as const }))]))
    if (!arrasto || !item) return g
    if (arrasto.modo === "teclado") {
      for (const [k, v] of g) g.set(k, v.filter((e) => idDe(e.t) !== arrasto.id))
      const l = g.get(arrasto.alvo.col)
      l?.splice(Math.min(arrasto.alvo.idx, l.length), 0, { t: item, tipo: "item" })
      return g
    }
    const destino = motivoDe(arrasto.alvo.col) ? arrasto.origem : arrasto.alvo
    // ainda na origem: o próprio cartão vira a vaga (assim o dnd-kit mede o retângulo certo no começo do arrasto)
    const naOrigem = destino.col === arrasto.origem.col && destino.idx === arrasto.origem.idx
    for (const [k, v] of g) g.set(k, v.map((e) => (idDe(e.t) === arrasto.id ? { ...e, tipo: naOrigem ? "vaga-origem" as const : "oculto" as const } : e)))
    if (naOrigem) return g
    const l = g.get(destino.col)
    if (l) {
      let pos = 0, vistos = 0
      while (pos < l.length && (vistos < destino.idx || l[pos].tipo === "oculto")) { if (l[pos].tipo !== "oculto") vistos++; pos++ }
      l.splice(pos, 0, { t: item, tipo: "vaga" })
    }
    return g
  }, [grupos, arrasto, item, idDe, motivoDe])

  const tituloCol = (id: string) => colunas.find((c) => c.id === id)?.titulo ?? id
  const posicao = (a: Alvo, id: string) => {
    const n = (grupos.get(a.col) ?? []).filter((t) => idDe(t) !== id).length
    return `${tituloCol(a.col)}, posição ${a.idx + 1} de ${n + 1}`
  }
  const avisoAlvo = (a: Alvo, id: string) => {
    const m = motivoDe(a.col)
    if (m) return `${tituloCol(a.col)}: não pode soltar aqui. ${m}`
    const c = colunas.find((x) => x.id === a.col)
    const n = (grupos.get(a.col) ?? []).filter((t) => idDe(t) !== id).length + 1
    return posicao(a, id) + (c?.limite && n > c.limite && item && colunaDe(item) !== a.col ? `. Passa do limite de ${c.limite}.` : ".")
  }

  // ---------- fim do arrasto (ponteiro e teclado) ----------
  const terminar = (a: Arrasto | null, cancelado: boolean) => {
    setArrasto(null)
    if (!a) return
    focoDepois.current = a.modo === "teclado" ? a.id : null
    soltouEm.current = Date.now()
    const t = porId.get(a.id)
    if (!t) return
    const nome = tituloDe(t)
    if (cancelado) return anunciar(`Movimento cancelado. ${nome} continua em ${tituloCol(a.origem.col)}.`)
    const motivo = colunaDe(t) === a.alvo.col ? null : validar(t, a.alvo.col)
    if (motivo) { vibrar("erro"); return anunciar(`Nada mudou. ${motivo}`) }
    if (a.alvo.col === a.origem.col && a.alvo.idx === a.origem.idx) return anunciar(`${nome} ficou no mesmo lugar.`)
    const lista = (grupos.get(a.alvo.col) ?? []).filter((x) => idDe(x) !== a.id)
    const viz = { antes: lista[a.alvo.idx - 1], depois: lista[a.alvo.idx] }
    vibrar("confirmar")
    const msg = p.aoSoltar(t, a.alvo.col, viz, a.alvo.idx)
    anunciar(msg || `${nome} movido para ${posicao(a.alvo, a.id)}.`)
  }

  // devolve o foco ao cartão depois que ele remonta em outra coluna (teclado)
  useLayoutEffect(() => {
    const id = arrasto?.modo === "teclado" ? arrasto.id : focoDepois.current
    if (!id) return
    const el = document.querySelector<HTMLElement>(`[data-cartao-id="${CSS.escape(id)}"]`)
    if (el && document.activeElement !== el) el.focus({ preventScroll: true })
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduzido ? "auto" : "smooth" })
    if (!arrasto) focoDepois.current = null
  })

  // ---------- alvo pelo ponteiro ----------
  const alvoDoPonteiro = (id: string): Alvo | null => {
    const { x, y } = ponteiro.current
    const pilha = document.elementsFromPoint(x, y)
    const aba = pilha.map((e) => e.closest<HTMLElement>("[data-aba-coluna]")).find(Boolean)
    if (aba) {
      const col = aba.dataset.abaColuna!
      return { col, idx: (grupos.get(col) ?? []).filter((t) => idDe(t) !== id).length }
    }
    const colEl = pilha.map((e) => e.closest<HTMLElement>("[data-coluna]")).find(Boolean)
    if (!colEl) return null
    const col = colEl.dataset.coluna!
    const outros = (grupos.get(col) ?? []).filter((t) => idDe(t) !== id)
    if (colEl.dataset.recolhida) return { col, idx: outros.length }
    const listaEl = colEl.querySelector<HTMLElement>("[data-lista]")
    if (!listaEl) return { col, idx: outros.length }
    const topo = listaEl.getBoundingClientRect().top
    let vaga = 0, passouVaga = false, idx = 0
    for (const li of Array.from(listaEl.children) as HTMLElement[]) {
      if (li.dataset.vagaLi != null) { vaga = li.offsetHeight + 8; passouVaga = true; continue }
      const lid = li.dataset.itemId
      if (!lid || lid === id) continue
      const meio = topo + li.offsetTop - (passouVaga ? vaga : 0) + li.offsetHeight / 2
      if (y > meio) idx++
    }
    return { col, idx: Math.min(idx, outros.length) }
  }

  const aoComecar = (e: DragStartEvent) => {
    const id = String(e.active.id)
    const t = porId.get(id)
    if (!t) return
    const col = colunaDe(t)
    const origem = { col, idx: (grupos.get(col) ?? []).findIndex((x) => idDe(x) === id) }
    const altura = e.active.rect.current.initial?.height ?? 96
    setEditando(null)
    setArrasto({ id, modo: "ponteiro", origem, alvo: origem, altura })
    trilho.current?.setAttribute("data-arrastando", "")
    vibrar(8)
    anunciar(`${tituloDe(t)} pego. ${posicao(origem, id)}.`)
  }
  const aoMover = () => {
    const a = arrastoRef.current
    if (!a || a.modo !== "ponteiro") return
    const alvo = alvoDoPonteiro(a.id)
    if (!alvo || (alvo.col === a.alvo.col && alvo.idx === a.alvo.idx)) return
    if (alvo.col !== a.alvo.col) {
      anunciar(avisoAlvo(alvo, a.id))
      // no celular, a aba ou a borda trazem a coluna de destino para a tela
      if (celular) rolarPara(colunas.findIndex((c) => c.id === alvo.col))
    }
    setArrasto({ ...a, alvo })
  }
  const aoSoltarPonteiro = () => { trilho.current?.removeAttribute("data-arrastando"); terminar(arrastoRef.current, false) }
  const aoCancelar = () => { trilho.current?.removeAttribute("data-arrastando"); terminar(arrastoRef.current, true) }

  // ---------- teclado ----------
  const teclado = (e: KeyboardEvent<HTMLElement>, t: T) => {
    const id = idDe(t)
    if (editando === id) return
    const a = arrastoRef.current
    if (!a) {
      if (e.key === " ") {
        e.preventDefault()
        const col = colunaDe(t)
        const origem = { col, idx: (grupos.get(col) ?? []).findIndex((x) => idDe(x) === id) }
        setArrasto({ id, modo: "teclado", origem, alvo: origem, altura: (e.currentTarget as HTMLElement).offsetHeight })
        anunciar(`${tituloDe(t)} pego. ${posicao(origem, id)}. Setas movem, Enter solta, Esc cancela.`)
      } else if (e.key === "F2" && p.aoRenomear) { e.preventDefault(); setEditando(id) }
      return
    }
    if (a.id !== id || a.modo !== "teclado") return
    const ordem = colunas.map((c) => c.id)
    const tamanho = (col: string) => (grupos.get(col) ?? []).filter((x) => idDe(x) !== id).length
    let alvo = a.alvo
    switch (e.key) {
      case "ArrowUp": alvo = { ...alvo, idx: Math.max(0, alvo.idx - 1) }; break
      case "ArrowDown": alvo = { ...alvo, idx: Math.min(tamanho(alvo.col), alvo.idx + 1) }; break
      case "ArrowLeft": case "ArrowRight": {
        const i = ordem.indexOf(alvo.col) + (e.key === "ArrowLeft" ? -1 : 1)
        if (i < 0 || i >= ordem.length) { anunciar(e.key === "ArrowLeft" ? "Primeira coluna." : "Última coluna."); e.preventDefault(); return }
        alvo = { col: ordem[i], idx: Math.min(alvo.idx, tamanho(ordem[i])) }
        if (celular) rolarPara(i)
        break
      }
      case "Enter": case " ": e.preventDefault(); return terminar(a, false)
      case "Escape": e.preventDefault(); return terminar(a, true)
      case "Tab": e.preventDefault(); return
      default: return
    }
    e.preventDefault()
    if (alvo.col !== a.alvo.col || alvo.idx !== a.alvo.idx) { setArrasto({ ...a, alvo }); anunciar(avisoAlvo(alvo, id)) }
  }

  // ---------- celular: coluna visível ----------
  const rolarPara = (i: number) => {
    const el = trilho.current
    if (!el || i < 0) return
    setAtiva(i)
    el.scrollTo({ left: i * el.clientWidth, behavior: reduzido ? "auto" : "smooth" })
  }
  const aoRolar = () => {
    const el = trilho.current
    if (!el || !celular) return
    setAtiva(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
  }

  const alternar = (id: string) => setRecolhidas((r) => { const n = new Set(r); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <DndContext sensors={sensores} autoScroll={{ activator: AutoScrollActivator.Pointer, threshold: { x: 0.08, y: 0.12 } }} onDragStart={aoComecar} onDragMove={aoMover} onDragEnd={aoSoltarPonteiro} onDragCancel={aoCancelar}
      accessibility={{ announcements: SILENCIO, screenReaderInstructions: instrucoes(TEXTO_INSTRUCOES_QUADRO) }}>
      {regiao}
      {celular && (
        <div role="tablist" aria-label={`Colunas de ${p.rotulo}`} data-abas-quadro
          className="casca-fixa sticky top-[calc(var(--topo)+var(--ferramentas,0px))] z-10 -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          {colunas.map((c, i) => {
            const n = (grupos.get(c.id) ?? []).length
            const invalida = !!arrasto && !!motivoDe(c.id)
            return (
              <button key={c.id} type="button" role="tab" aria-selected={ativa === i} data-aba-coluna={c.id} onClick={() => rolarPara(i)}
                data-invalida={invalida || undefined}
                className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  "bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] aria-selected:bg-[color-mix(in_oklch,var(--foreground)_14%,transparent)] aria-selected:font-semibold aria-selected:text-foreground",
                  arrasto && !invalida && "shadow-[inset_0_0_0_1.5px_color-mix(in_oklch,var(--primary)_55%,transparent)]",
                  invalida && "opacity-45",
                  arrasto?.alvo.col === c.id && !invalida && "bg-[color-mix(in_oklch,var(--primary)_22%,transparent)] text-foreground")}>
                {c.titulo} <span className="num text-xs">{n}</span>
              </button>
            )
          })}
        </div>
      )}
      <LayoutGroup id={p.rotulo}>
        <div ref={trilho} onScroll={aoRolar} data-quadro aria-label={p.rotulo} role="region"
          className={cn("flex items-start gap-3 overflow-x-auto pb-3",
            celular ? "-mx-4 snap-x snap-mandatory gap-0 [scrollbar-width:none] data-[arrastando]:snap-none" : "")}>
          {colunas.map((c) => {
            const lista = arranjo.get(c.id) ?? []
            const real = (grupos.get(c.id) ?? []).length
            const recolhida = !celular && recolhidas.has(c.id)
            const motivo = arrasto ? motivoDe(c.id) : null
            const alvoAqui = arrasto?.alvo.col === c.id
            const acima = !!c.limite && real > c.limite
            const passaria = !!c.limite && !!arrasto && alvoAqui && !motivo && item && colunaDe(item) !== c.id && real + 1 > c.limite
            if (recolhida) {
              return (
                <section key={c.id} data-coluna={c.id} data-recolhida="" aria-label={`${c.titulo}, recolhida, ${real} cartões`}
                  className={cn("flex w-11 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-xl)] py-2 shadow-[inset_0_0_0_1px_var(--sup-aro)] transition-[opacity,background-color] duration-150",
                    "bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)]",
                    motivo && "hachura opacity-50",
                    alvoAqui && !motivo && "bg-[color-mix(in_oklch,var(--primary)_14%,transparent)]")}>
                  <button type="button" onClick={() => alternar(c.id)} aria-expanded={false} aria-label={`Expandir ${c.titulo}`}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-[color-mix(in_oklch,var(--foreground)_8%,transparent)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronsLeftRight className="size-4" aria-hidden="true" />
                  </button>
                  <span className="num text-xs text-muted-foreground">{real}</span>
                  <span className="text-[13px] font-medium [writing-mode:vertical-rl]">{c.titulo}</span>
                  {acima && <TriangleAlert className="size-3.5 text-alerta-texto" aria-label={`Acima do limite de ${c.limite}`} />}
                  <ul data-lista className="w-full px-1.5">
                    {lista.filter((e) => e.tipo !== "oculto" && idDe(e.t) === arrasto?.id).map(({ t, tipo }) => (
                      tipo === "vaga"
                        ? <li key="__vaga" data-vaga-li="" className="vaga-cartao h-2 rounded-full" data-invalido={motivo ? "" : undefined} />
                        : <li key={idDe(t)} data-item-id={idDe(t)}>
                            <CartaoArrastavel id={idDe(t)} rotulo={tituloDe(t)} vaga altura={8} invalido={!!motivo}
                              onKeyDown={(e) => teclado(e, t)}>{null}</CartaoArrastavel>
                          </li>
                    ))}
                  </ul>
                </section>
              )
            }
            return (
              <section key={c.id} data-coluna={c.id} aria-labelledby={`col-${c.id}`} aria-describedby={motivo ? `motivo-${c.id}` : undefined}
                className={cn("flex shrink-0 flex-col rounded-[var(--radius-xl)] shadow-[inset_0_0_0_1px_var(--sup-aro)] transition-[opacity,background-color,box-shadow] duration-150",
                  celular ? "w-full snap-center px-4 shadow-none" : "w-[17.5rem]",
                  !celular && "bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)]",
                  motivo && "hachura opacity-55",
                  alvoAqui && !motivo && arrasto && !celular && "bg-[color-mix(in_oklch,var(--primary)_7%,transparent)] shadow-[inset_0_0_0_1.5px_color-mix(in_oklch,var(--primary)_40%,transparent)]")}>
                <header className={cn("flex min-h-11 items-center gap-2 py-2", celular ? "px-0" : "pr-1.5 pl-3")}>
                  <h3 id={`col-${c.id}`} className="min-w-0 flex-1 truncate text-[13px] font-semibold">{c.titulo}</h3>
                  <span className={cn("num rounded-full px-1.5 text-xs leading-5", acima ? "bg-alerta/18 font-medium text-alerta-texto" : "text-muted-foreground")}
                    aria-label={c.limite ? `${real} de ${c.limite} cartões${acima ? ", acima do limite" : ""}` : `${real} cartões`}>
                    {real}{c.limite ? <span className="opacity-70">/{c.limite}</span> : null}
                  </span>
                  {!celular && (
                    <button type="button" onClick={() => alternar(c.id)} aria-expanded aria-label={`Recolher ${c.titulo}`}
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-[color-mix(in_oklch,var(--foreground)_8%,transparent)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                      <ChevronsRightLeft className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </header>
                {acima && !arrasto && (
                  <p className={cn("mb-1 flex items-center gap-1.5 text-xs text-alerta-texto", celular ? "" : "px-3")}>
                    <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" /> Acima do limite de {c.limite}. Termine antes de puxar mais.
                  </p>
                )}
                {motivo && <p id={`motivo-${c.id}`} className={cn("mb-1 text-xs font-medium text-foreground", celular ? "" : "px-3")}>{motivo}</p>}
                <div data-rolagem className={cn(!celular && "max-h-[calc(100dvh-17rem)] min-h-24 overflow-y-auto overscroll-contain")}>
                  <ul data-lista className={cn("relative flex min-h-16 flex-col gap-2 pb-2", celular ? "" : "px-2")}>
                    {lista.map(({ t, tipo }) => {
                      const id = idDe(t)
                      if (tipo === "vaga") {
                        return (
                          <motion.li key="__vaga" data-vaga-li="" layout={reduzido ? false : "position"} transition={mola.mover}
                            className="vaga-cartao grid list-none place-items-center rounded-[var(--radius-lg)] px-3 text-center text-xs text-muted-foreground"
                            data-invalido={motivo ? "" : undefined} style={{ height: arrasto?.altura }}>
                            {motivo ? "Não pode soltar aqui" : passaria ? `Esta coluna passa do limite de ${c.limite}.` : ""}
                          </motion.li>
                        )
                      }
                      // o mesmo motion.li para item, vaga na origem e oculto: o nó que o dnd-kit mede nunca remonta
                      const pego = arrasto?.id === id
                      const vaga = tipo === "vaga-origem"
                      const erguido = pego && arrasto.modo === "teclado"
                      const invalido = pego && !!motivo
                      return (
                        <motion.li key={id} data-item-id={id} data-vaga-li={vaga ? "" : undefined} hidden={tipo === "oculto"}
                          layout={reduzido || tipo === "oculto" ? false : "position"} layoutId={reduzido ? undefined : `${p.rotulo}-${id}`}
                          transition={mola.mover} className="list-none">
                          <CartaoArrastavel id={id} rotulo={tituloDe(t)} vaga={vaga} erguido={erguido} invalido={invalido} altura={arrasto?.altura}
                            avisoLimite={pego && passaria ? `Esta coluna passa do limite de ${c.limite}.` : undefined}
                            pendente={p.pendentes?.has(id)} desabilitado={editando === id || (!!arrasto && !pego)}
                            onKeyDown={(e) => teclado(e, t)}
                            onDoubleClick={() => p.aoRenomear && Date.now() - soltouEm.current > 300 && setEditando(id)}>
                            {p.renderCartao(t, {
                              erguido,
                              titulo: editando === id
                                ? <EdicaoTitulo valor={tituloDe(t)} aoSair={(v) => { setEditando(null); if (v != null) p.aoRenomear?.(t, v); focoDepois.current = id }} />
                                : <span className="line-clamp-2 text-[13px] leading-snug font-medium break-words">{tituloDe(t)}</span>,
                            })}
                          </CartaoArrastavel>
                        </motion.li>
                      )
                    })}
                    {lista.every((e) => e.tipo === "oculto") && (
                      <li className="rounded-[var(--radius-lg)] border border-dashed border-[color-mix(in_oklch,var(--foreground)_14%,transparent)] px-3 py-5 text-center text-xs text-muted-foreground">
                        {c.vazio ?? `Nada em ${c.titulo}.`}
                      </li>
                    )}
                  </ul>
                </div>
                {c.adicionar && <AdicionarRapido cfg={c.adicionar} celular={celular} />}
              </section>
            )
          })}
        </div>
      </LayoutGroup>
      <DragOverlay dropAnimation={null} className="pointer-events-none" zIndex={60}>
        {arrasto?.modo === "ponteiro" && item ? (
          <motion.div initial={false} animate={reduzido ? undefined : { rotate: 1.5, scale: 1.03 }} transition={mola.surgir}
            className="sup cartao-erguido cursor-grabbing rounded-[var(--radius-lg)]" data-nivel="card">
            {p.renderCartao(item, { erguido: true, titulo: <span className="line-clamp-2 text-[13px] leading-snug font-medium break-words">{tituloDe(item)}</span> })}
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function CartaoArrastavel({ id, rotulo, vaga, erguido, invalido, altura, pendente, desabilitado, avisoLimite, onKeyDown, onDoubleClick, children }: {
  id: string; rotulo: string; vaga?: boolean; erguido?: boolean; invalido?: boolean; altura?: number; pendente?: boolean; desabilitado?: boolean
  avisoLimite?: string; onKeyDown: (e: KeyboardEvent<HTMLElement>) => void; onDoubleClick?: () => void; children: ReactNode
}) {
  const { setNodeRef, listeners, attributes } = useDraggable({ id, disabled: desabilitado })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} role="button" tabIndex={0} aria-roledescription="cartão arrastável"
      aria-label={rotulo} aria-disabled={undefined} aria-pressed={erguido || vaga ? true : undefined} aria-busy={pendente || undefined}
      data-cartao-id={id} data-vaga={vaga || undefined} data-erguido={erguido || undefined} data-invalido={invalido || undefined}
      onKeyDown={onKeyDown} onDoubleClick={onDoubleClick}
      className={cn("relative touch-manipulation rounded-[var(--radius-lg)] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring",
        // vaga: o conteúdo continua montado e só fica invisível. No toque, os eventos seguem para o nó onde o dedo
        // encostou; se ele sair do DOM, o arrasto para de receber o touchmove.
        vaga ? "vaga-cartao [&>:not([data-vaga-msg])]:invisible" : "sup cursor-grab",
        erguido && "cartao-erguido",
        invalido && "ring-2 ring-[color-mix(in_oklch,var(--negative)_70%,transparent)]",
        pendente && "opacity-70")}
      data-nivel={vaga ? undefined : "card"}
      style={vaga && children == null ? { height: altura } : undefined}>
      {children}
      {avisoLimite && !vaga && <p className="px-3 pb-2.5 text-xs font-medium text-alerta-texto">{avisoLimite}</p>}
      {pendente && <Loader2 className="absolute top-2.5 right-2.5 size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none" aria-label="Salvando" />}
      {vaga && (
        <span data-vaga-msg="" className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-muted-foreground">
          {invalido ? "Não pode soltar aqui" : avisoLimite ?? ""}
        </span>
      )}
    </div>
  )
}

function EdicaoTitulo({ valor, aoSair }: { valor: string; aoSair: (v: string | null) => void }) {
  const [v, setV] = useState(valor)
  const feito = useRef(false)
  const sair = (r: string | null) => { if (feito.current) return; feito.current = true; aoSair(r) }
  return (
    <textarea autoFocus value={v} rows={2} aria-label="Título do cartão" onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sair(v.trim() ? v : null) }
        if (e.key === "Escape") { e.preventDefault(); sair(null) }
      }}
      onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
      onBlur={() => sair(v.trim() ? v : null)}
      className="w-full resize-none rounded-md border border-input bg-transparent px-1.5 py-1 text-[13px] leading-snug font-medium outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />
  )
}

function AdicionarRapido({ cfg, celular }: { cfg: NonNullable<ColunaQuadro["adicionar"]>; celular: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [opcao, setOpcao] = useState(cfg.opcoes?.[0]?.id ?? "")
  const botao = useRef<HTMLButtonElement>(null)
  const fechar = () => { setAberto(false); setTitulo(""); requestAnimationFrame(() => botao.current?.focus()) }
  const criar = () => { if (!titulo.trim()) return; cfg.aoCriar(titulo.trim(), opcao || undefined); setTitulo("") }
  if (!aberto) {
    return (
      <div className={cn("pb-2", celular ? "" : "px-2")}>
        <button ref={botao} type="button" onClick={() => setAberto(true)}
          className="flex h-9 w-full items-center gap-1.5 rounded-[var(--radius-lg)] px-2.5 text-[13px] text-muted-foreground outline-none hover:bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11">
          <Plus className="size-4" aria-hidden="true" /> {cfg.rotulo}
        </button>
      </div>
    )
  }
  return (
    <form className={cn("grid gap-1.5 pb-2", celular ? "" : "px-2")} onSubmit={(e) => { e.preventDefault(); criar() }}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); fechar() } }}>
      <textarea autoFocus value={titulo} rows={2} placeholder={cfg.placeholder} aria-label={cfg.placeholder} onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); criar() } }}
        className="sup w-full resize-none rounded-[var(--radius-lg)] px-3 py-2 text-[13px] leading-snug outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring max-sm:text-base" data-nivel="card" />
      {cfg.opcoes && (
        <label className="grid gap-1 text-xs text-muted-foreground">
          {cfg.rotuloOpcoes}
          <select value={opcao} onChange={(e) => setOpcao(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10 max-sm:text-base">
            {cfg.opcoes.map((o) => <option key={o.id} value={o.id} className="bg-[Canvas] text-[CanvasText]">{o.rotulo}</option>)}
          </select>
        </label>
      )}
      <div className="flex items-center justify-end gap-1.5">
        <span className="mr-auto text-[11px] text-muted-foreground max-sm:hidden">Enter adiciona · Esc fecha</span>
        <button type="button" onClick={fechar}
          className="h-8 rounded-lg px-3 text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10">Cancelar</button>
        <button type="submit" disabled={!titulo.trim()}
          className="h-8 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 pointer-coarse:h-10">Adicionar</button>
      </div>
    </form>
  )
}

function useRecolhidas(chave: string) {
  const k = `quadro-recolhidas:${chave}`
  const [s, set] = useState<Set<string>>(() => new Set())
  useEffect(() => { try { const v = localStorage.getItem(k); if (v) set(new Set(JSON.parse(v))) } catch {} }, [k])
  const definir = (f: (r: Set<string>) => Set<string>) => set((r) => {
    const n = f(r)
    try { localStorage.setItem(k, JSON.stringify([...n])) } catch {}
    return n
  })
  return [s, definir] as const
}
