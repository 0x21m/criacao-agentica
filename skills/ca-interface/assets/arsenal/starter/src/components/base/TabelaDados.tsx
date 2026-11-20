// TabelaDados (LIS-28): toda lista tabular do ERP passa por aqui. As colunas são declaradas com tipo e largura e
// formam UM gabarito compartilhado (<colgroup> na tabela, a mesma grade nos cartões): nenhuma linha monta o próprio
// flex. O alinhamento segue o tipo: texto à esquerda; número, moeda e data à direita com algarismos tabulares; status
// e pessoa em coluna própria; ações num canto fixo de 3,5 rem.
// - Cabeçalho fixo em duas linhas (título do card + nomes das colunas) que continuam o contorno do card: o bloco gruda
//   logo abaixo da barra (--topo + --faixa-fixa), no vidro denso, sem emenda nem texto sobre texto.
// - Seleção com clique na caixa, Shift (intervalo) e Ctrl/⌘ (alternar); barra de lote fixa embaixo.
// - Edição na célula: duplo clique ou Enter na célula editável; Enter salva, Esc cancela. Com `editar.motivo`, abre um
//   popover ancorado na célula com o valor e o motivo obrigatório (ação P: "Salvando…" e o erro no lugar).
// - Ordenar por coluna (`ordenar` na coluna): o cabeçalho vira botão (aria-sort); a ordem pode morar na URL (`ordem`).
// - Agrupar (`grupoDe` + `grupos`): uma faixa por seção ("Vencidos · 3 · R$ 1.200,00") dentro da mesma tabela.
// - Totais (`totais`): rodapé do card com os totais do recorte; nos cartões, um bloco no fim.
// - Abaixo da quebra (xl = 1280 px por padrão, por causa da lateral), vira lista de cartões com o mesmo conteúdo.
//   Só a vista visível hidrata: a outra fica com o HTML do servidor, congelada, até a janela mudar de largura.
// - Texto longo: uma linha com reticências e o texto inteiro no title. Nunca quebra no meio de e-mail ou domínio.
import { Fragment, Suspense, lazy, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Resultado } from "@/proto/dados"
import { cn } from "@/lib/utils"

const EdicaoComMotivo = lazy(() => import("./EdicaoComMotivo"))

export type TipoColuna = "id" | "texto" | "numero" | "moeda" | "data" | "status" | "pessoa" | "acoes"
export type EdicaoDaCelula<T> = {
  valor: (t: T) => string
  /** Grava. Com `motivo`, recebe o motivo escolhido; devolvendo a Promise da acao(), o popover mostra "Salvando…" e o erro. */
  salvar: (t: T, novo: string, motivo?: string) => void | Promise<Resultado | void>
  rotulo: string
  /** Só estas linhas editam (as outras mostram o valor). */
  pode?: (t: T) => boolean
  /** Campo numérico (teclado de números no celular). */
  numerico?: boolean
  /** Motivo obrigatório: abre um popover com o valor e a lista de motivos (ajuste de saldo, estorno…). */
  motivo?: { opcoes: readonly string[]; titulo?: (t: T) => string; detalhe?: (t: T) => string }
}
export type ColunaDados<T> = {
  id: string
  titulo: string
  tipo: TipoColuna
  /** Largura CSS ("6rem", "22%"). Sem largura, a coluna leva o resto (só uma por tabela deveria ficar sem). */
  largura?: string
  /** O conteúdo da célula. Para texto, devolva string: a tabela corta com reticências e põe o title. */
  valor: (t: T) => ReactNode
  /** Texto simples da célula (title, cópia, leitor de tela). Padrão: o valor, se for string. */
  texto?: (t: T) => string
  /** Some no cartão do celular (a informação já está em outro lugar do cartão). */
  soNaTabela?: boolean
  /** Célula editável: duplo clique ou Enter abre o campo; Enter salva, Esc cancela. */
  editar?: EdicaoDaCelula<T>
  /** Liga a ordenação por esta coluna: a chave de comparação (texto ou número). */
  ordenar?: (t: T) => string | number
}
export type OrdemDaTabela = { coluna: string; direcao: "asc" | "desc" }
export type GrupoDaTabela = { id: string; titulo: string; /** "3 · R$ 1.200,00" ao lado do título. */ resumo?: ReactNode }
export type TotaisDaTabela = { rotulo: string; itens: { rotulo: string; valor: ReactNode }[] }

const ALINHAR: Record<TipoColuna, string> = {
  id: "num font-medium", texto: "", numero: "num text-right", moeda: "num text-right", data: "num text-right", status: "", pessoa: "", acoes: "text-right",
}
const LARGURA_PADRAO: Partial<Record<TipoColuna, string>> = { id: "6.5rem", moeda: "9.5rem", data: "6.5rem", status: "11rem", pessoa: "8.5rem", acoes: "3.5rem", numero: "6rem" }
const QUEBRA_PX = { lg: 1024, xl: 1280 }

type Props<T> = {
  /** Nome da tabela para leitor de tela e título do card ("Lista de pedidos"). */
  titulo: string
  colunas: ColunaDados<T>[]
  linhas: T[]
  idDe: (t: T) => string
  /** "12 de 48": aparece à direita do título. */
  contagem?: ReactNode
  /** Abrir o registro (clique na linha fora de botões e links). */
  aoAbrir?: (t: T) => void
  /** Registro aberto (a linha fica marcada). */
  aberto?: string | null
  /** Ids com ação a caminho (linha esmaecida e girando). */
  pendentes?: Set<string>
  /** Liga a seleção e a barra de lote; recebe os ids selecionados e uma função para limpar. */
  lote?: (ids: string[], limpar: () => void) => ReactNode
  /** Cartão do celular (abaixo da quebra). Padrão: as colunas em pares rótulo/valor. */
  cartao?: (t: T) => ReactNode
  quebra?: "lg" | "xl"
  /** Mostra o título (e a contagem) também no modo cartões, acima da lista. */
  tituloNosCartoes?: boolean
  /** Seções da lista: a seção de cada linha e a ordem delas. Seção sem linha some. */
  grupoDe?: (t: T) => string
  grupos?: GrupoDaTabela[]
  /** Totais do recorte no rodapé do card (e no fim dos cartões). */
  totais?: TotaisDaTabela
  /** Ordem controlada (ex.: na URL). Sem ela, a tabela guarda a ordem escolhida. */
  ordem?: OrdemDaTabela | null
  aoOrdenar?: (o: OrdemDaTabela | null) => void
  className?: string
}

/**
 * Qual vista vive: no navegador, só a que a largura mostra; a outra fica congelada com o HTML do servidor (hidratar as
 * duas dobrava o trabalho da lista). Mudou a largura da janela: as duas passam a viver.
 */
function useVistasVivas(quebra: "lg" | "xl") {
  const [vivas, setVivas] = useState<"tabela" | "cartoes" | "ambas">(() =>
    typeof window === "undefined" ? "ambas" : matchMedia(`(min-width: ${QUEBRA_PX[quebra]}px)`).matches ? "tabela" : "cartoes")
  useEffect(() => {
    if (vivas === "ambas") return
    const mq = matchMedia(`(min-width: ${QUEBRA_PX[quebra]}px)`)
    const mudou = () => setVivas("ambas")
    mq.addEventListener("change", mudou)
    return () => mq.removeEventListener("change", mudou)
  }, [quebra, vivas])
  return { tabela: vivas !== "cartoes", cartoes: vivas !== "tabela" }
}
/**
 * A vista escondida: o mesmo elemento do servidor, sem hidratar o conteúdo. O HTML de dentro é lido do próprio
 * documento (pelo id estável do useId), então a hidratação vê o mesmo innerHTML e não acusa diferença.
 */
function Congelada({ id, className, secao }: { id: string; className: string; secao?: string }) {
  const [html] = useState(() => (typeof document === "undefined" ? "" : document.getElementById(id)?.innerHTML ?? ""))
  // mesmo elemento e mesmos atributos do servidor (a vista de cartões é uma <section>)
  if (secao !== undefined) return <section id={id} aria-label={secao} data-grupo className={className} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
  return <div id={id} className={className} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
}

export function TabelaDados<T>({ titulo, colunas, linhas, idDe, contagem, aoAbrir, aberto, pendentes, lote, cartao, quebra = "xl", tituloNosCartoes,
  grupoDe, grupos, totais, ordem: ordemControlada, aoOrdenar, className }: Props<T>) {
  const [sel, setSel] = useState<Set<string>>(new Set())
  const ancora = useRef<string | null>(null)
  const [ordemLocal, setOrdemLocal] = useState<OrdemDaTabela | null>(null)
  const ordem = ordemControlada !== undefined ? ordemControlada : ordemLocal
  const vivas = useVistasVivas(quebra)
  const idVista = useId()

  // ordem (estável) e seções
  const ordenadas = useMemo(() => {
    const col = ordem && colunas.find((c) => c.id === ordem.coluna && c.ordenar)
    if (!col) return linhas
    const k = col.ordenar!, s = ordem!.direcao === "asc" ? 1 : -1
    return linhas.map((t, i) => ({ t, i, v: k(t) })).sort((a, b) => {
      const d = typeof a.v === "number" && typeof b.v === "number" ? a.v - b.v : String(a.v).localeCompare(String(b.v), "pt-BR", { numeric: true })
      return d * s || a.i - b.i
    }).map((x) => x.t)
  }, [linhas, colunas, ordem])
  const secoes = useMemo(() => {
    if (!grupoDe || !grupos) return [{ grupo: null as GrupoDaTabela | null, linhas: ordenadas }]
    const por = new Map<string, T[]>()
    for (const t of ordenadas) { const g = grupoDe(t); por.set(g, [...(por.get(g) ?? []), t]) }
    return grupos.filter((g) => por.get(g.id)?.length).map((g) => ({ grupo: g, linhas: por.get(g.id)! }))
  }, [ordenadas, grupoDe, grupos])
  const ids = useMemo(() => secoes.flatMap((s) => s.linhas.map(idDe)), [secoes, idDe])

  // a seleção só guarda o que ainda está na lista (filtro mudou, registro excluído)
  const selecionados = useMemo(() => ids.filter((i) => sel.has(i)), [ids, sel])
  const limpar = () => setSel(new Set())
  function marcar(id: string, e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) {
    setSel((atual) => {
      const n = new Set(atual)
      if (e.shiftKey && ancora.current) {
        const [a, b] = [ids.indexOf(ancora.current), ids.indexOf(id)].sort((x, y) => x - y)
        ids.slice(a, b + 1).forEach((x) => n.add(x))
      } else if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
    ancora.current = id
  }
  function ordenarPor(c: ColunaDados<T>) {
    // asc → desc → sem ordem
    const nova: OrdemDaTabela | null = ordem?.coluna !== c.id ? { coluna: c.id, direcao: "asc" } : ordem.direcao === "asc" ? { coluna: c.id, direcao: "desc" } : null
    if (aoOrdenar) aoOrdenar(nova)
    if (ordemControlada === undefined) setOrdemLocal(nova)
  }
  const todos = selecionados.length === ids.length && ids.length > 0
  const th = "h-9 px-2 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground"
  const total = colunas.length + (lote ? 1 : 0)
  const mostra = quebra === "xl" ? "hidden xl:block" : "hidden lg:block"
  const esconde = quebra === "xl" ? "xl:hidden" : "lg:hidden"

  const linhaDaTabela = (t: T) => {
    const id = idDe(t)
    const pend = pendentes?.has(id)
    return (
      <tr key={id} data-linha={id} aria-selected={lote ? sel.has(id) : undefined}
        className={cn("h-12 border-b border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] transition-colors last:border-0",
          aoAbrir && "cursor-pointer hover:bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)]",
          pend && "opacity-60", (id === aberto || sel.has(id)) && "bg-[color-mix(in_oklch,var(--primary)_10%,transparent)]")}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button, a, input, label, [role=menuitem], [data-celula-editavel]")) return
          if (lote && (e.shiftKey || e.ctrlKey || e.metaKey)) { marcar(id, e); return }
          aoAbrir?.(t)
        }}>
        {lote && (
          <td className="px-2 pl-4">
            {/* onChange (sem preventDefault): a caixa mostra o estado novo no mesmo quadro do clique */}
            <label className="caixa-alvo">
              <input type="checkbox" aria-label={`Selecionar ${id}`} checked={sel.has(id)} className="caixa-selecao"
                onChange={(e) => marcar(id, e.nativeEvent as MouseEvent)} />
            </label>
          </td>
        )}
        {colunas.map((c, i) => (
          <td key={c.id} className={cn("px-2", ALINHAR[c.tipo], i === 0 && !lote && "pl-4", c.tipo === "acoes" && "pr-3")}>
            {c.editar && (c.editar.pode?.(t) ?? true) ? <CelulaEditavel t={t} c={c} /> : <Conteudo c={c} t={t} pendente={!!pend && i === 0} />}
          </td>
        ))}
      </tr>
    )
  }
  const cartaoDaLinha = (t: T) => {
    const id = idDe(t)
    return (
      <li key={id}>
        <Card data-alvo-estendido data-interativa={aoAbrir ? "" : undefined} onClick={(e) => { if (!(e.target as HTMLElement).closest("a, button, input, [data-celula-editavel]")) aoAbrir?.(t) }}
          className={cn("gap-1.5 px-3.5 py-3", aoAbrir && "cursor-pointer", pendentes?.has(id) && "opacity-60", id === aberto && "ring-2 ring-[var(--primary)]")}>
          {cartao ? cartao(t) : (
            <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
              {colunas.filter((c) => !c.soNaTabela && c.tipo !== "acoes").map((c) => (
                <div key={c.id} className="contents">
                  <dt className="text-xs text-muted-foreground">{c.titulo}</dt>
                  <dd className={cn("min-w-0", ALINHAR[c.tipo].replace("text-right", ""))}>
                    {c.editar && (c.editar.pode?.(t) ?? true) ? <CelulaEditavel t={t} c={c} /> : <Conteudo c={c} t={t} />}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </li>
    )
  }
  const blocoDeTotais = totais && (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="t-rotulo mr-auto">{totais.rotulo}</span>
      <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {totais.itens.map((i) => (
          <div key={i.rotulo} className="flex items-baseline gap-2 whitespace-nowrap">
            <dt className="text-xs text-muted-foreground">{i.rotulo}</dt>
            <dd className="num text-sm font-semibold">{i.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )

  return (
    <div className={className} data-tabela-dados>
      {/* tabela. overflow-clip, não hidden: o cabeçalho continua grudando na página */}
      {vivas.tabela ? (
        <div id={`${idVista}t`} className={mostra}>
          <Card className="gap-0 overflow-clip py-0">
            <table data-densa className="w-full table-fixed text-sm" aria-label={titulo}>
              <colgroup>
                {lote && <col style={{ width: "2.75rem" }} />}
                {colunas.map((c) => <col key={c.id} style={{ width: c.largura ?? LARGURA_PADRAO[c.tipo] }} />)}
              </colgroup>
              <thead className="sticky top-[calc(var(--topo)+var(--faixa-fixa))] z-10">
                <tr>
                  <th colSpan={total} className="h-10 px-4 text-left align-middle font-normal">
                    <span className="flex items-center justify-between gap-3">
                      <span className="t-card truncate text-foreground">{titulo}</span>
                      {contagem !== undefined && <span className="shrink-0 text-sm text-muted-foreground" aria-live="polite">{contagem}</span>}
                    </span>
                  </th>
                </tr>
                <tr>
                  {lote && (
                    <th className={cn(th, "pl-4")}>
                      <label className="caixa-alvo">
                        <input type="checkbox" aria-label={todos ? "Desmarcar todos" : "Selecionar todos"} checked={todos}
                          ref={(el) => { if (el) el.indeterminate = selecionados.length > 0 && !todos }}
                          onChange={() => setSel(todos ? new Set() : new Set(ids))} className="caixa-selecao" />
                      </label>
                    </th>
                  )}
                  {colunas.map((c, i) => {
                    const direita = ALINHAR[c.tipo].includes("text-right")
                    const ativa = ordem?.coluna === c.id ? ordem.direcao : null
                    return (
                      <th key={c.id} scope="col" aria-sort={c.ordenar ? (ativa === "asc" ? "ascending" : ativa === "desc" ? "descending" : "none") : undefined}
                        className={cn(th, direita && "text-right", i === 0 && !lote && "pl-4", c.tipo === "acoes" && "pr-3")}>
                        {c.tipo === "acoes" ? <span className="sr-only">{c.titulo}</span> : c.ordenar ? (
                          <button type="button" onClick={() => ordenarPor(c)}
                            className={cn("-mx-1 inline-flex h-8 items-center gap-1 rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", direita && "flex-row-reverse", ativa && "text-foreground")}>
                            {c.titulo}
                            {ativa === "asc" ? <ArrowUp className="size-3.5" aria-hidden="true" /> : ativa === "desc" ? <ArrowDown className="size-3.5" aria-hidden="true" /> : <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />}
                          </button>
                        ) : c.titulo}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              {secoes.map(({ grupo, linhas: ls }) => (
                <tbody key={grupo?.id ?? "linhas"}>
                  {grupo && (
                    <tr data-secao={grupo.id} className="border-b border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] bg-[color-mix(in_oklch,var(--foreground)_3%,transparent)]">
                      <th colSpan={total} scope="colgroup" className="h-9 px-4 text-left align-middle text-xs font-medium">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate">{grupo.titulo}</span>
                          {grupo.resumo !== undefined && <span className="num shrink-0 text-muted-foreground">{grupo.resumo}</span>}
                        </span>
                      </th>
                    </tr>
                  )}
                  {ls.map(linhaDaTabela)}
                </tbody>
              ))}
              {totais && (
                <tfoot>
                  <tr className="border-t border-[color-mix(in_oklch,var(--foreground)_10%,transparent)]">
                    <td colSpan={total} className="px-4 py-3" aria-label={totais.rotulo}>{blocoDeTotais}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </Card>
        </div>
      ) : <Congelada id={`${idVista}t`} className={mostra} />}

      {/* cartões (abaixo da quebra): o mesmo conteúdo, uma coluna por linha do cartão */}
      {vivas.cartoes ? (
        <section id={`${idVista}c`} aria-label={titulo} data-grupo className={esconde}>
          {tituloNosCartoes ? (
            <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
              <h2 className="t-card min-w-0 truncate">{titulo}</h2>
              {contagem !== undefined && <span className="shrink-0 text-sm text-muted-foreground" aria-live="polite">{contagem}</span>}
            </div>
          ) : contagem !== undefined && <p className="mb-2 px-1 text-sm text-muted-foreground" aria-live="polite">{contagem}</p>}
          {secoes.map(({ grupo, linhas: ls }) => (
            <Fragment key={grupo?.id ?? "linhas"}>
              {grupo && (
                <h3 data-secao={grupo.id} className="mt-4 mb-2 flex items-baseline justify-between gap-3 px-1 text-xs font-medium first:mt-0">
                  <span className="truncate">{grupo.titulo}</span>
                  {grupo.resumo !== undefined && <span className="num shrink-0 text-muted-foreground">{grupo.resumo}</span>}
                </h3>
              )}
              <ul className="space-y-2">{ls.map(cartaoDaLinha)}</ul>
            </Fragment>
          ))}
          {totais && <Card className="mt-2 px-3.5 py-3" aria-label={totais.rotulo}>{blocoDeTotais}</Card>}
        </section>
      ) : <Congelada id={`${idVista}c`} className={esconde} secao={titulo} />}

      {lote && selecionados.length > 0 && (
        <div role="region" aria-label="Ações em lote" data-nivel="flutuante"
          className="sup sticky bottom-[calc(var(--abas)+1rem)] z-20 mx-auto mt-3 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4 lg:bottom-4">
          <span className="text-sm"><span className="num font-semibold">{selecionados.length}</span> {selecionados.length === 1 ? "selecionado" : "selecionados"}</span>
          {lote(selecionados, limpar)}
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Limpar seleção" onPress={limpar}><X /></Button>
        </div>
      )}
    </div>
  )
}

function Conteudo<T>({ c, t, pendente }: { c: ColunaDados<T>; t: T; pendente?: boolean }) {
  const v = c.valor(t)
  const texto = c.texto?.(t) ?? (typeof v === "string" ? v : undefined)
  const corpo = typeof v === "string" || typeof v === "number"
    ? <span className="block truncate" title={texto}>{v}</span>
    : v
  if (!pendente) return <>{corpo}</>
  return <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Salvando" />{corpo}</span>
}

function CelulaEditavel<T>({ t, c }: { t: T; c: ColunaDados<T> }) {
  const ed = c.editar!
  const [editando, setEditando] = useState(false)
  const [v, setV] = useState("")
  const celula = useRef<HTMLSpanElement>(null)
  const abrir = () => { setV(ed.valor(t)); setEditando(true) }
  const fechar = (salvar: boolean) => {
    setEditando(false)
    if (salvar && v.trim() && v.trim() !== ed.valor(t)) void ed.salvar(t, v.trim())
  }
  // com motivo: o popover ancorado na célula (baixa só quando alguém abre o primeiro)
  if (editando && !ed.motivo) {
    return (
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)} aria-label={ed.rotulo} inputMode={ed.numerico ? "decimal" : undefined}
        onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); fechar(true) } if (e.key === "Escape") { e.preventDefault(); fechar(false) } }}
        onBlur={() => fechar(true)}
        className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />
    )
  }
  const texto = ed.valor(t)
  return (
    <>
      <span ref={celula} data-celula-editavel data-coluna={c.id} tabIndex={0} role="button" aria-label={`${ed.rotulo}: ${texto}. Enter para editar`}
        onDoubleClick={ed.motivo ? undefined : abrir} onClick={ed.motivo ? abrir : undefined}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); abrir() } }}
        className={cn("block truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          ed.motivo ? "cursor-pointer underline decoration-dotted underline-offset-4 hover:decoration-solid" : "cursor-text")}
        title={`${texto} (${ed.motivo ? "clique" : "duplo clique"} para editar)`}>
        {c.valor(t)}
      </span>
      {editando && ed.motivo && celula.current && (
        <Suspense fallback={null}>
          <EdicaoComMotivo ancora={celula.current} rotulo={ed.rotulo} titulo={ed.motivo.titulo?.(t) ?? ed.rotulo} detalhe={ed.motivo.detalhe?.(t)}
            inicial={ed.valor(t)} numerico={ed.numerico} motivos={ed.motivo.opcoes}
            salvar={(novo, motivo) => ed.salvar(t, novo, motivo)} aoFechar={() => { setEditando(false); celula.current?.focus() }} />
        </Suspense>
      )}
    </>
  )
}
