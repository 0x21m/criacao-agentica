// Módulo Estoque (5.6) · /estoque/: saldo e alertas. Banner compacto com a troca Saldo · Movimentos · Compras; faixa de
// 3 cartões (abaixo do mínimo, esgotados e o valor em estoque com a participação por categoria, no padrão do
// stats-card-2 do arsenal, dentro da Superficie); a TabelaDados com os totais do recorte embaixo; cartões com o saldo
// grande abaixo de 1280 px. Filtros na URL (?q=&categoria=&situacao=repor), produto aberto em ?id=FLT-0912.
// Ajuste: célula de saldo → popover com motivo (P); seleção → "Ajustar saldo" em lote numa sheet (P, falha por item).
// Quem não pode ver custo não vê a coluna nem o valor; quem não pode mexer no saldo não vê nenhuma ação (técnico, atendente).
import { Suspense, lazy, useMemo, useState } from "react"
import { Download, Filter, Package, PackageSearch, PackageCheck, ShoppingCart, SlidersHorizontal, TriangleAlert, CircleSlash } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados, type TotaisDaTabela as TotaisDaTabelaBase } from "@/components/base/TabelaDados"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { Superficie } from "@/components/sistema/Superficie"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { useConfig, usePendentes, useProcessando } from "@/proto/dados"
import { agora as agoraDoRelogio } from "@/proto/relogio"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { PRODUTO } from "@/proto/projecao"
import { moeda, moedaCompacta, numero, percentual, textoMoeda, lerMoeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import {
  CATEGORIAS, MOTIVOS_AJUSTE, ajustarSaldo, compras as colCompras, estadoDoProduto, gerarCompraDosBaixos, mudarCusto, precisaRepor, produtos, saldoTotal, valorEmEstoque,
  type Categoria, type Compra, type Produto,
} from "../dados"
import { CabecalhoEstoque, SeloProduto } from "./comum"
import { DetalheProduto } from "./DetalheProduto"

const AjusteEmLote = lazy(() => import("./AjusteEmLote"))

const PADRAO = { q: "", categoria: "todas", situacao: "ativos", id: "" }
type Filtros = typeof PADRAO
const COR_CATEGORIA: Record<Categoria, string> = {
  Aparelhos: "var(--chart-1)", Peças: "var(--chart-2)", "Filtros e limpeza": "var(--chart-3)", Elétrica: "var(--chart-4)", Ferragens: "var(--chart-5)",
}

function filtrar(lista: Produto[], f: Filtros) {
  const t = f.q.trim().toLowerCase()
  return lista.filter((p) =>
    (f.situacao === "inativos" ? !p.ativo : f.situacao === "repor" ? precisaRepor(p) : p.ativo) &&
    (f.categoria === "todas" || p.categoria === f.categoria) &&
    (!t || p.id.toLowerCase().includes(t) || p.nome.toLowerCase().includes(t)))
}

function exportarCsv(lista: Produto[], comCusto: boolean) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const n = (v: number) => v.toFixed(2).replace(".", ",")
  const cab = ["SKU", "Produto", "Categoria", "Pampulha", "Contagem", "Reservado", "Mínimo", "Situação", "Preço (R$)", ...(comCusto ? ["Custo (R$)"] : [])]
  const linhas = lista.map((p) => [p.id, p.nome, p.categoria, String(p.saldo.pampulha), String(p.saldo.contagem), String(p.reservado), String(p.minimo),
    PRODUTO[estadoDoProduto(p)].rotulo, n(p.preco), ...(comCusto ? [n(p.custo)] : [])].map(esc).join(";"))
  const csv = "﻿" + [cab.join(";"), ...linhas].join("\r\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  a.download = `estoque-${agoraDoRelogio().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  toast.success(`${linhas.length} ${linhas.length === 1 ? "produto exportado" : "produtos exportados"} em CSV.`)
}

export default function Estoque() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const todos = produtos.use()
  const cmps = colCompras.use()
  const papel = usePapel()
  const veCusto = pode(papel, "ver_custo")
  const mexe = pode(papel, "estoque_movimentar")
  const lista = useMemo(() => filtrar(todos, f), [todos, f])
  const ativos = useMemo(() => todos.filter((p) => p.ativo), [todos])
  const filtrado = f.q !== "" || f.categoria !== "todas" || f.situacao !== "ativos"
  const limpar = () => setF({ q: "", categoria: "todas", situacao: "ativos" })
  const [lote, setLote] = useState<{ ids: string[]; limpar: () => void } | null>(null)
  const nRepor = todos.filter(precisaRepor).length
  const nInativos = todos.length - ativos.length
  // fora do estado "dados" (barra F: carregando, vazio, erro) o banner não mostra contagem nem ação sobre dados que não chegaram
  const comDados = useConfig().estado === "dados"

  function gerar() {
    const ids = gerarCompraDosBaixos()
    if (!ids.length) toast.info("Todos os itens abaixo do mínimo já estão numa compra aberta.", { description: "Veja em Compras." })
  }

  const vazioDoFiltro = () => {
    if (f.situacao === "repor" && !f.q && f.categoria === "todas")
      return <EstadoVazio variante="concluido" icone={PackageCheck} titulo="Nenhum item abaixo do mínimo." texto="Todo o estoque ativo está acima do mínimo nas duas unidades." />
    const onde = f.categoria !== "todas" ? `em ${f.categoria}` : ""
    const termo = f.q ? ` com “${f.q}”` : ""
    const titulo = f.situacao === "inativos" ? `Nenhum produto inativo${onde ? ` ${onde}` : ""}${termo}.`
      : f.situacao === "repor" ? `Nenhum produto para repor${onde ? ` ${onde}` : ""}${termo}.`
      : `Nenhum produto ativo${onde ? ` ${onde}` : ""}${termo}.`
    // categoria só com inativos (Ferragens): o caminho para eles fica junto
    const inativosAqui = f.situacao === "ativos" ? filtrar(todos, { ...f, situacao: "inativos" }).length : 0
    return <EstadoVazio variante="filtro" icone={PackageSearch} titulo={titulo}
      texto={inativosAqui ? `${inativosAqui} ${inativosAqui === 1 ? "produto saiu" : "produtos saíram"} de linha nesta categoria.` : "Tente outro termo ou limpe os filtros para ver todo o estoque."}
      acao={<div className="flex flex-wrap justify-center gap-2">
        {inativosAqui > 0 && <Button variant="outline" onPress={() => setF({ situacao: "inativos" })}>Ver {inativosAqui === 1 ? "o inativo" : `os ${inativosAqui} inativos`}</Button>}
        <Button variant="outline" onPress={limpar}>Limpar filtros</Button>
      </div>} />
  }

  return (
    <>
      <CabecalhoEstoque ativa="estoque/" titulo="Estoque" descricao="Saldo e o que repor"
        contagem={!comDados ? undefined : filtrado ? `${lista.length} de ${todos.length}` : `${ativos.length} produtos`}
        acoes={mexe && comDados && <BotaoLiquido onClick={gerar}><ShoppingCart className="size-4" /> Gerar compra dos baixos</BotaoLiquido>}>
        <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar produto" placeholder="Buscar SKU ou produto"
          filtrado={filtrado} aoLimpar={limpar}
          acoes={pode(papel, "estoque_exportar") && <Button variant="outline" className="h-10 rounded-full max-sm:w-full" isDisabled={!comDados} onPress={() => exportarCsv(lista, veCusto)}><Download /> Exportar CSV</Button>}>
          <div className="w-full sm:w-80">
            <SegmentadoDeVidro aria-label="Situação" valor={f.situacao} aoMudar={(situacao) => setF({ situacao })}
              opcoes={[{ id: "ativos", rotulo: "Ativos" }, { id: "repor", rotulo: `Repor · ${nRepor}` }, { id: "inativos", rotulo: `Inativos · ${nInativos}` }]} />
          </div>
          <Select aria-label="Filtrar por categoria" selectedKey={f.categoria} onSelectionChange={(k) => setF({ categoria: String(k) })} className="w-full sm:w-52">
            <SelectTrigger className="h-10 rounded-full"><Filter /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem id="todas">Todas as categorias</SelectItem>
              {CATEGORIAS.map((c) => <SelectItem key={c} id={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </BarraFerramentas>
      </CabecalhoEstoque>

      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="estoque_ver" area="do estoque" rotulo="o estoque" estaVazio={todos.length === 0}
          esqueleto={<div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Esqueleto className="h-32 rounded-xl" /><Esqueleto className="h-32 rounded-xl" /><Esqueleto className="col-span-2 h-32 rounded-xl" /></div>
            <div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>
          </div>}
          vazio={<EstadoVazio icone={Package} titulo="Nenhum produto cadastrado." texto="Cadastre ou importe uma planilha para acompanhar saldo e mínimo por unidade. O cadastro chega com a importação de planilha." />}>
          {() => (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
              <Resumo produtos={todos} compras={cmps} veCusto={veCusto} aoFiltrar={(situacao) => setF({ situacao, categoria: "todas", q: "" })} />
              {lista.length === 0 ? vazioDoFiltro() : (
                <div>
                  <Lista lista={lista} total={f.situacao === "inativos" ? nInativos : f.situacao === "repor" ? nRepor : ativos.length} compras={cmps} veCusto={veCusto} mexe={mexe}
                    aberto={f.id} abrir={(id) => setF({ id })}
                    aoLote={f.situacao === "inativos" ? undefined : (ids, limparSel) => setLote({ ids, limpar: limparSel })}
                    totais={{ rotulo: "Totais do recorte", itens: [
                    { rotulo: "Pampulha", valor: numero(lista.reduce((s, p) => s + p.saldo.pampulha, 0)) },
                    { rotulo: "Contagem", valor: numero(lista.reduce((s, p) => s + p.saldo.contagem, 0)) },
                    { rotulo: "Reservado", valor: numero(lista.reduce((s, p) => s + p.reservado, 0)) },
                    { rotulo: "A preço de venda", valor: moeda(lista.reduce((s, p) => s + saldoTotal(p) * p.preco, 0)) },
                    ...(veCusto ? [{ rotulo: "A custo", valor: moeda(lista.reduce((s, p) => s + saldoTotal(p) * p.custo, 0)) }] : []),
                  ] }} />
                </div>
              )}
            </div>
          )}
        </ComDados>
      </div>
      <DetalheProduto id={f.id || null} aoFechar={() => setF({ id: "" })} />
      {lote && <Suspense fallback={null}><AjusteEmLote ids={lote.ids} aoFechar={(ok) => { if (ok) lote.limpar(); setLote(null) }} /></Suspense>}
    </>
  )
}

// ---------- faixa de 3 cartões ----------
function Resumo({ produtos: ps, compras, veCusto, aoFiltrar }: { produtos: Produto[]; compras: Compra[]; veCusto: boolean; aoFiltrar: (s: string) => void }) {
  const baixos = ps.filter((p) => estadoDoProduto(p) === "baixo")
  const esgotados = ps.filter((p) => estadoDoProduto(p) === "esgotado")
  const aCaminho = esgotados.filter((p) => compras.some((c) => (c.estado === "enviada" || c.estado === "recebida_parcial") && c.itens.some((i) => i.sku === p.id && i.recebido < i.qtd))).length
  const ativos = ps.filter((p) => p.ativo)
  const medida = (p: Produto) => (veCusto ? saldoTotal(p) * p.custo : saldoTotal(p))
  const total = veCusto ? valorEmEstoque(ps) : ativos.reduce((s, p) => s + saldoTotal(p), 0)
  const partes = CATEGORIAS.map((c) => ({ nome: c, v: ativos.filter((p) => p.categoria === c).reduce((s, p) => s + medida(p), 0), cor: COR_CATEGORIA[c] })).filter((x) => x.v > 0)
  const maior = [...ativos].sort((a, b) => medida(b) - medida(a))[0]
  return (
    <section aria-label="Resumo do estoque" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CartaoContagem titulo="Estoque baixo" valor={baixos.length} detalhe={baixos.length ? "repor antes de esgotar" : "nenhum para repor"} icone={TriangleAlert}
        tom={baixos.length ? "aviso" : undefined} aoAbrir={() => aoFiltrar("repor")} />
      <CartaoContagem titulo="Esgotados" valor={esgotados.length} detalhe={esgotados.length ? `${aCaminho} com compra a caminho` : "nada esgotado"} icone={CircleSlash}
        tom={esgotados.length ? "perigo" : undefined} aoAbrir={() => aoFiltrar("repor")} />
      {/* padrão do stats-card-2 (arsenal: templates/categorias): valor, barra empilhada de participação com legenda e o destaque */}
      <Superficie como="section" aria-labelledby="valor-estoque" className="col-span-2 flex h-full flex-col gap-3 p-4">
        <h2 id="valor-estoque" className="t-card truncate">{veCusto ? "Valor em estoque" : "Unidades em estoque"}</h2>
        <span className="t-kpi -mt-1" title={veCusto ? moeda(total) : undefined}>{veCusto ? moedaCompacta(total) : numero(total)}</span>
        <div className="grid gap-2">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" role="img"
            aria-label={`Participação por categoria: ${partes.map((p) => `${p.nome} ${percentual(p.v / (total || 1))}`).join(", ")}`}>
            {partes.map((p) => <div key={p.nome} className="h-full" style={{ width: `${(p.v / (total || 1)) * 100}%`, background: p.cor }} />)}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-hidden="true">
            {partes.map((p) => (
              <li key={p.nome} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="size-2 rounded-full" style={{ background: p.cor }} />
                <span className="text-muted-foreground">{p.nome}</span>
                <span className="num font-semibold">{percentual(p.v / (total || 1))}</span>
              </li>
            ))}
          </ul>
        </div>
        {maior && (
          <p className="mt-auto flex min-w-0 gap-1 text-xs text-muted-foreground">
            <span className="shrink-0">Maior peso:</span>
            <span className="min-w-0 truncate text-foreground" title={maior.nome}>{maior.nome}</span>
            <span className="num shrink-0 whitespace-nowrap">· {veCusto ? moeda(medida(maior)) : `${numero(medida(maior))} un.`}</span>
          </p>
        )}
      </Superficie>
    </section>
  )
}

function CartaoContagem({ titulo, valor, detalhe, icone: I, tom, aoAbrir }: {
  titulo: string; valor: number; detalhe: string; icone: typeof TriangleAlert; tom?: "aviso" | "perigo"; aoAbrir: () => void
}) {
  return (
    <Superficie como="a" href={url("estoque/?situacao=repor")} interativa tom={tom} aria-label={`${titulo}: ${valor}. Ver os itens para repor`}
      onClick={(e) => { e.preventDefault(); aoAbrir() }}
      className="flex h-full min-w-0 flex-col gap-2 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex items-center justify-between gap-2">
        <span className="t-card min-w-0 truncate">{titulo}</span>
        <I className={cn("size-4 shrink-0", tom === "perigo" ? "text-negativo-texto" : tom === "aviso" ? "text-alerta-texto" : "text-muted-foreground")} aria-hidden="true" />
      </span>
      <span className="t-kpi -mt-1">{valor}</span>
      <span className="mt-auto truncate text-xs text-muted-foreground" title={detalhe}>{detalhe}</span>
    </Superficie>
  )
}

// ---------- tabela ----------
function Lista({ lista, total, compras, veCusto, mexe, aberto, abrir, aoLote, totais }: {
  lista: Produto[]; total: number; compras: Compra[]; veCusto: boolean; mexe: boolean; aberto: string
  abrir: (id: string) => void; aoLote?: (ids: string[], limpar: () => void) => void; totais: TotaisDaTabelaBase
}) {
  const pendentes = usePendentes()
  const processando = useProcessando()
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  // ajuste na célula (5.6): popover da base com o saldo contado e o motivo obrigatório (P)
  const ajusteNa = (u: Unidade): ColunaDados<Produto>["editar"] => ({
    rotulo: "Saldo contado", numerico: true, pode: (p) => mexe && p.ativo, valor: (p) => String(p.saldo[u]),
    salvar: (p, novo, motivo) => {
      const n = Number(novo.replace(",", "."))
      if (!Number.isInteger(n) || n < 0) return Promise.resolve({ ok: false as const, motivo: "falha" as const, mensagem: "Informe o saldo contado: um número inteiro, de 0 para cima." })
      return ajustarSaldo(p, u, n, motivo ?? "")
    },
    motivo: { opcoes: MOTIVOS_AJUSTE, titulo: () => `Ajustar saldo em ${UNIDADES[u].nome}`, detalhe: (p) => `${p.id} · ${p.nome}` },
  })
  const colunas: ColunaDados<Produto>[] = [
    { id: "sku", titulo: "SKU", tipo: "id", largura: "6rem", texto: (p) => p.id,
      valor: (p) => <a href={url(`estoque/?id=${p.id}`)} onClick={(e) => { e.preventDefault(); abrir(p.id) }} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{p.id}</a> },
    // a categoria vai na segunda linha do produto: o nome (que distingue 9.000 de 12.000 BTU) fica com a largura
    { id: "nome", titulo: "Produto · categoria", tipo: "texto", texto: (p) => `${p.nome} · ${p.categoria}`, valor: (p) => (
      <span className="grid min-w-0 leading-tight">
        <span className="truncate" title={p.nome}>{p.nome}</span>
        <span className="truncate text-xs text-muted-foreground">{p.categoria}</span>
      </span>
    ) },
    { id: "pampulha", titulo: "Pampulha", tipo: "numero", largura: "5.25rem", valor: (p) => numero(p.saldo.pampulha), editar: ajusteNa("pampulha") },
    { id: "contagem", titulo: "Contagem", tipo: "numero", largura: "5.5rem", valor: (p) => numero(p.saldo.contagem), editar: ajusteNa("contagem") },
    { id: "reservado", titulo: "Reservado", tipo: "numero", largura: "5.75rem", valor: (p) => numero(p.reservado) },
    { id: "minimo", titulo: "Mín. total", tipo: "numero", largura: "5.25rem", valor: (p) => numero(p.minimo) },
    { id: "situacao", titulo: "Situação", tipo: "status", largura: "9.5rem", valor: (p) => <SeloProduto p={p} compras={compras} detalhe={estadoDoProduto(p) === "esgotado"} /> },
    { id: "preco", titulo: "Preço", tipo: "moeda", largura: "6.75rem", valor: (p) => moeda(p.preco) },
    ...(veCusto ? [{ id: "custo", titulo: "Custo", tipo: "moeda", largura: "6.75rem", valor: (p: Produto) => moeda(p.custo),
      editar: { rotulo: "Custo de compra", valor: (p: Produto) => textoMoeda(p.custo), salvar: (p: Produto, v: string) => { void mudarCusto(p, lerMoeda(v)) } } } satisfies ColunaDados<Produto>] : []),
    ...(mexe ? [{ id: "acoes", titulo: "Ações", tipo: "acoes", valor: (p: Produto) => <MenuLinha p={p} abrir={abrir} /> } satisfies ColunaDados<Produto>] : []),
  ]
  return (
    <TabelaDados<Produto>
      titulo="Saldo por unidade"
      colunas={colunas}
      linhas={lista}
      idDe={(p) => p.id}
      contagem={<><span className="num">{lista.length}</span> de <span className="num">{total}</span></>}
      aoAbrir={(p) => abrir(p.id)}
      aberto={aberto}
      pendentes={marcados}
      totais={totais}
      lote={mexe && aoLote ? (ids, limpar) => (
        <Button size="sm" variant="outline" className="rounded-full" onPress={() => aoLote(ids, limpar)}><SlidersHorizontal /> Ajustar saldo</Button>
      ) : undefined}
      cartao={(p) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <a href={url(`estoque/?id=${p.id}`)} onClick={(e) => { e.preventDefault(); abrir(p.id) }}
              className="num inline-flex min-h-10 items-center rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{p.id}</a>
            <span className="flex min-w-0 max-w-[62%] justify-end"><SeloProduto p={p} compras={compras} /></span>
          </div>
          <span className="line-clamp-2 text-sm font-medium text-pretty" title={p.nome}>{p.nome}</span>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xs text-muted-foreground">Saldo total</span>
              <span className="t-kpi block">{numero(saldoTotal(p))}</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                Pampulha <span className="num text-foreground">{p.saldo.pampulha}</span> · Contagem <span className="num text-foreground">{p.saldo.contagem}</span> · mín. <span className="num">{p.minimo}</span>
              </span>
            </div>
            <span className="num shrink-0 text-sm font-semibold">{moeda(p.preco)}</span>
          </div>
        </>
      )}
    />
  )
}

/** Abre o ajuste da célula de saldo da unidade (o mesmo popover do clique na célula). */
const ajustarNaCelula = (p: Produto, u: Unidade) =>
  document.querySelector<HTMLElement>(`[data-linha="${p.id}"] [data-celula-editavel][data-coluna="${u}"]`)?.click()

function MenuLinha({ p, abrir }: { p: Produto; abrir: (id: string) => void }) {
  const itens: ItemMenu[] = [{ rotulo: "Abrir o produto", icone: Package, aoEscolher: () => abrir(p.id) }]
  if (p.ativo) {
    itens.push({ rotulo: "Ajustar saldo na Pampulha", icone: SlidersHorizontal, aoEscolher: () => ajustarNaCelula(p, "pampulha") })
    itens.push({ rotulo: "Ajustar saldo em Contagem", icone: SlidersHorizontal, aoEscolher: () => ajustarNaCelula(p, "contagem") })
  }
  return <MenuDaLinha rotulo={`Ações de ${p.id}`} itens={itens} />
}
