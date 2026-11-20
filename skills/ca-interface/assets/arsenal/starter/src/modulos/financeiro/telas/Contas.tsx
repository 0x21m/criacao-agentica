// Módulo Financeiro (5.7) · /financeiro/receber/ e /financeiro/pagar/: as contas por vencimento, numa TabelaDados por
// grupo (Vencidos, Vencem hoje, Esta semana, Depois) com o total de cada um; a troca Em aberto · Pagos · Cancelados no
// segmentado do banner; busca e unidade na URL; seleção com Shift e barra de lote ("Receber 3 títulos", P com
// DialogoConfirmar); vencimento e valor editáveis na célula (O + Desfazer); o detalhe abre numa FolhaDeDetalhe (?id=).
// A folha e o diálogo baixam só quando abrem.
import { Suspense, lazy, useMemo, useState } from "react"
import { ArrowDownToLine, Banknote, Download, Eye, MapPin, QrCode, SearchX, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { useConfig, usePendentes, useProcessando } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { lerMoeda, moeda, textoMoeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { normalizar } from "@/modulos/registro"
import {
  GRUPOS, MEIOS, editarTitulo, situacao, emAberto, grupoDe, lancamentos, nomeDe, pagarEmLote, receberEmLote,
  type Lancamento, type Meio, type Natureza,
} from "../dados"
import { SeloLancamento, dataVenc } from "./comum"
import type { Pedido } from "./confirmacoes"

const DetalheLancamento = lazy(() => import("./DetalheLancamento"))
const Confirmacao = lazy(() => import("./confirmacoes"))

const PADRAO = { q: "", unidade: "todas", situacao: "abertos", id: "" }
// "Encerrados" junta pagos e cancelados (o segmentado do banner tem 13 rem: três rótulos não cabiam)
const SITUACOES = [{ id: "abertos", rotulo: "Em aberto" }, { id: "encerrados", rotulo: "Encerrados" }]
type Textos = { titulo: string; quem: string; descricao: string; um: string; varios: string; nenhum: string; vazio: string; exportados: string }
const TEXTO: Record<Natureza, Textos> = {
  receber: { titulo: "Contas a receber", quem: "Cliente", descricao: "Títulos de OS, vendas e contratos por vencimento", um: "título", varios: "títulos",
    nenhum: "Nenhum título", vazio: "Os títulos aparecem aqui assim que forem lançados.", exportados: "exportados" },
  pagar: { titulo: "Contas a pagar", quem: "Fornecedor", descricao: "Fornecedores, folha, aluguel e impostos por vencimento", um: "conta", varios: "contas",
    nenhum: "Nenhuma conta", vazio: "As contas aparecem aqui assim que forem lançadas.", exportados: "exportadas" },
}

/** "16/11/2026", "16/11" ou "16/11/26" viram data (meio-dia local); outra coisa vira null. */
function lerData(texto: string, ref: Date) {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (!m) return null
  const ano = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : ref.getFullYear()
  const d = new Date(ano, Number(m[2]) - 1, Number(m[1]), 12)
  return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? d : null
}

function exportarCsv(lista: Lancamento[], natureza: Natureza) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const linhas = lista.map((l) => [l.id, l.descricao, nomeDe(l), l.categoria, UNIDADES[l.unidade].nome, new Date(l.vencimento).toLocaleDateString("pt-BR"), situacao(l).p.rotulo, l.valor.toFixed(2).replace(".", ",")].map(esc).join(";"))
  const csv = "﻿" + [`Título;Descrição;${TEXTO[natureza].quem};Categoria;Unidade;Vencimento;Situação;Valor (R$)`, ...linhas].join("\r\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  a.download = `contas-a-${natureza}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  toast.success(`${linhas.length} ${linhas.length === 1 ? TEXTO[natureza].um : TEXTO[natureza].varios} ${TEXTO[natureza].exportados} em CSV.`)
}

export default function Contas({ natureza }: { natureza: Natureza }) {
  const t = TEXTO[natureza]
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const todas = lancamentos.use()
  const agora = useAgora()
  const papel = usePapel()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [usouConfirmacao, setUsouConfirmacao] = useState(false)
  const pedir = (p: Pedido) => { setUsouConfirmacao(true); setPedido(p) }

  const daNatureza = useMemo(() => todas.filter((l) => l.natureza === natureza), [todas, natureza])
  const abertos = useMemo(() => daNatureza.filter((l) => emAberto(l) || l.estado === "previsto"), [daNatureza])
  const recorte = useMemo(() => {
    const q = normalizar(f.q.trim())
    const base = f.situacao === "abertos" ? abertos : daNatureza.filter((l) => l.estado === "pago" || l.estado === "cancelado")
    return base.filter((l) => (f.unidade === "todas" || l.unidade === f.unidade)
      && (!q || normalizar(l.id).includes(q) || normalizar(l.descricao).includes(q) || normalizar(nomeDe(l)).includes(q) || normalizar(l.ref ?? "").includes(q)))
  }, [daNatureza, abertos, f.q, f.unidade, f.situacao])
  const filtrado = f.q !== "" || f.unidade !== "todas"
  const limpar = () => setF({ q: "", unidade: "todas" })
  const totalAberto = abertos.filter(emAberto).reduce((s, l) => s + l.valor, 0)
  const { estado } = useConfig()
  const pronto = pode(papel, "financeiro_painel") && estado === "dados"
  const rotuloFiltro = [f.unidade !== "todas" && UNIDADES[f.unidade as Unidade]?.nome, f.q && `“${f.q}”`].filter(Boolean).join(" · ")

  return (
    <>
      <CabecalhoPagina
        titulo={t.titulo}
        descricao={t.descricao}
        contagem={pronto ? `${abertos.filter(emAberto).length} em aberto · ${moeda(totalAberto)}` : undefined}
        vistas={pronto ? SITUACOES : undefined}
        vista={f.situacao === "abertos" ? "abertos" : "encerrados"}
        aoMudarVista={(situacao) => setF({ situacao })}
      >
        {pronto && <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca={`Buscar em ${t.titulo.toLowerCase()}`} placeholder={`Buscar título, ${t.quem.toLowerCase()} ou OS`}
          filtrado={filtrado} aoLimpar={limpar}
          acoes={<Button variant="outline" className="h-10 rounded-full" onPress={() => exportarCsv(recorte, natureza)}><Download /> Exportar CSV</Button>}>
          <Select aria-label="Filtrar por unidade" selectedKey={f.unidade} onSelectionChange={(k) => setF({ unidade: String(k) })} className="w-full sm:w-52">
            <SelectTrigger className="h-10 rounded-full"><MapPin /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem id="todas">Todas as unidades</SelectItem>
              {(Object.keys(UNIDADES) as Unidade[]).map((u) => <SelectItem key={u} id={u}>{UNIDADES[u].nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </BarraFerramentas>}
      </CabecalhoPagina>

      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="financeiro_painel" area="do financeiro" rotulo={`as contas a ${natureza}`}
          esqueleto={<div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>}
          estaVazio={daNatureza.length === 0}
          vazio={<EstadoVazio icone={ArrowDownToLine} titulo="Nenhum lançamento neste período." texto={t.vazio} />}
        >
          {() => recorte.length === 0 ? (
            filtrado ? (
              <EstadoVazio variante="filtro" icone={SearchX} titulo={`${t.nenhum} com ${rotuloFiltro}.`} texto="Tente outro termo ou limpe os filtros."
                acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
            ) : f.situacao === "abertos" ? (
              <EstadoVazio variante="concluido" icone={ArrowDownToLine} titulo={natureza === "receber" ? "Nada a receber. Todos os títulos foram pagos." : "Nada a pagar. Todas as contas estão em dia."} />
            ) : (
              <EstadoVazio icone={SearchX} titulo={`${t.nenhum} ${natureza === "receber" ? "pago ou cancelado" : "paga ou cancelada"} ainda.`} />
            )
          ) : f.situacao === "abertos" ? (
            <Grupos lista={recorte} natureza={natureza} agora={agora} aberto={f.id} abrir={(id) => setF({ id })} pedir={pedir} />
          ) : (
            <Tabela titulo="Pagos e cancelados" lista={[...recorte].sort((a, b) => (b.pagoEm ?? b.vencimento).localeCompare(a.pagoEm ?? a.vencimento))}
              natureza={natureza} agora={agora} aberto={f.id} abrir={(id) => setF({ id })} pedir={pedir} />
          )}
        </ComDados>
      </div>
      {f.id && pronto && (
        <Suspense fallback={null}>
          <DetalheLancamento id={f.id} natureza={natureza} aoFechar={() => setF({ id: "" })} pedir={(p) => { setF({ id: "" }); pedir(p) }} />
        </Suspense>
      )}
      {usouConfirmacao && (
        <Suspense fallback={null}>
          <Confirmacao pedido={pedido} aoFechar={(reabrir) => { const id = pedido && "l" in pedido ? pedido.l.id : ""; setPedido(null); if (reabrir && id) setF({ id }) }} />
        </Suspense>
      )}
    </>
  )
}

type PropsLista = { natureza: Natureza; agora: Date; aberto: string; abrir: (id: string) => void; pedir: (p: Pedido) => void }

function Grupos({ lista, ...p }: PropsLista & { lista: Lancamento[] }) {
  const porGrupo = useMemo(() => {
    const m = new Map(GRUPOS.map((g) => [g.id, [] as Lancamento[]]))
    for (const l of lista) m.get(grupoDe(l, p.agora))!.push(l)
    for (const v of m.values()) v.sort((a, b) => a.vencimento.localeCompare(b.vencimento) || b.valor - a.valor)
    return m
  }, [lista, p.agora])
  // "Depois" vai até o fim do ano: mostra os 8 primeiros e o resto num toque (a lista hidrata mais leve)
  const [todos, setTodos] = useState(false)
  const LIMITE = 8
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {GRUPOS.filter((g) => porGrupo.get(g.id)!.length).map((g) => (
        <section key={g.id} aria-label={g.titulo} data-grupo className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 xl:block">
          {(() => {
            const cheia = porGrupo.get(g.id)!
            const cortada = g.id === "depois" && !todos && cheia.length > LIMITE + 2
            return (
              <>
                <Tabela titulo={g.titulo} lista={cortada ? cheia.slice(0, LIMITE) : cheia} grupo={cheia} total {...p} lote />
                {cortada && (
                  <Button variant="outline" className="mx-auto mt-3 flex" onPress={() => setTodos(true)}>
                    Mostrar mais {cheia.length - LIMITE} {cheia.length - LIMITE === 1 ? TEXTO[p.natureza].um : TEXTO[p.natureza].varios}
                  </Button>
                )}
              </>
            )
          })()}
        </section>
      ))}
    </div>
  )
}

function Tabela({ titulo, lista, grupo, natureza, agora, aberto, abrir, pedir, total, lote }: PropsLista & { titulo: string; lista: Lancamento[]; grupo?: Lancamento[]; total?: boolean; lote?: boolean }) {
  const pendentes = usePendentes()
  const processando = useProcessando()
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  const papel = usePapel()
  const cap = natureza === "receber" ? "receber" : "pagar"
  const podeMexer = pode(papel, cap)
  const t = TEXTO[natureza]
  const todosDoGrupo = grupo ?? lista
  const soma = todosDoGrupo.reduce((s, l) => s + l.valor, 0)
  const pagos = !lista.some((l) => emAberto(l) || l.estado === "previsto")
  const href = (l: Lancamento) => url(`financeiro/${natureza}/?id=${l.id}`)
  const editavel = (l: Lancamento) => podeMexer && (emAberto(l) || l.estado === "previsto")

  const colunas: ColunaDados<Lancamento>[] = [
    { id: "id", titulo: "Título", tipo: "id", largura: "6rem", texto: (l) => l.id,
      valor: (l) => <a href={href(l)} onClick={(e) => { e.preventDefault(); abrir(l.id) }} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{l.id}</a> },
    { id: "descricao", titulo: "Descrição", tipo: "texto", valor: (l) => l.descricao },
    { id: "nome", titulo: t.quem, tipo: "texto", largura: "19%", valor: (l) => nomeDe(l) },
    { id: "situacao", titulo: "Situação", tipo: "status", largura: "12.5rem", valor: (l) => <SeloLancamento l={l} semData /> },
    pagos
      ? { id: "pago", titulo: "Pago em", tipo: "data", largura: "5.5rem", valor: (l) => (l.pagoEm ? dataVenc(l.pagoEm, agora) : "—") }
      : { id: "venc", titulo: "Vence", tipo: "data", largura: "6.75rem", valor: (l) => dataVenc(l.vencimento, agora),
        editar: podeMexer ? { rotulo: "Vencimento", valor: (l) => new Date(l.vencimento).toLocaleDateString("pt-BR"),
          salvar: (l, novo) => {
            if (!editavel(l)) return void toast.error(`${l.id} não está em aberto: só se estorna.`)
            const d = lerData(novo, agora)
            if (!d) return void toast.error("Use a data como 24/11/2026.")
            void editarTitulo(l, { vencimento: d.toISOString() })
          } } : undefined },
    { id: "valor", titulo: "Valor", tipo: "moeda", largura: "9rem", valor: (l) => moeda(l.valor),
      editar: podeMexer && !pagos ? { rotulo: "Valor", valor: (l) => textoMoeda(l.valor),
        salvar: (l, novo) => {
          if (!editavel(l)) return void toast.error(`${l.id} não está em aberto: só se estorna.`)
          const v = lerMoeda(novo)
          if (!Number.isFinite(v) || v <= 0) return void toast.error("Digite um valor maior que zero, como 1.234,56.")
          void editarTitulo(l, { valor: Math.round(v * 100) / 100 })
        } } : undefined },
    { id: "acoes", titulo: "Ações", tipo: "acoes", valor: (l) => <MenuLinha l={l} abrir={abrir} pedir={pedir} /> },
  ]
  const recebiveis = (ids: string[]) => lista.filter((l) => ids.includes(l.id) && emAberto(l) && !l.envio)
  return (
    <TabelaDados<Lancamento>
      titulo={titulo}
      tituloNosCartoes
      colunas={colunas}
      linhas={lista}
      idDe={(l) => l.id}
      contagem={total
        ? <><span className="num">{todosDoGrupo.length}</span> {todosDoGrupo.length === 1 ? t.um : t.varios} · <span className="num font-medium text-foreground">{moeda(soma)}</span></>
        : <><span className="num">{lista.length}</span> {lista.length === 1 ? t.um : t.varios}</>}
      aoAbrir={(l) => abrir(l.id)}
      aberto={aberto}
      pendentes={marcados}
      lote={lote && podeMexer ? (ids, limpar) => {
        const alvo = recebiveis(ids)
        return <LoteBotoes natureza={natureza} n={alvo.length} aoPedir={(meio) => { pedir({ tipo: "lote", natureza, ids: alvo.map((l) => l.id), meio }); limpar() }} />
      } : undefined}
      cartao={(l) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <a href={href(l)} onClick={(e) => { e.preventDefault(); abrir(l.id) }} className="num rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{l.id}</a>
            <span className="flex max-w-[64%] min-w-0 justify-end"><SeloLancamento l={l} /></span>
          </div>
          <span className="block truncate text-sm" title={l.descricao}>{l.descricao}</span>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-xs text-muted-foreground" title={nomeDe(l)}>{nomeDe(l)}</span>
            <span className="num shrink-0 font-semibold">{moeda(l.valor)}</span>
          </div>
        </>
      )}
    />
  )
}

function LoteBotoes({ natureza, n, aoPedir }: { natureza: Natureza; n: number; aoPedir: (meio: Meio) => void }) {
  const [meio, setMeio] = useState<Meio>(natureza === "receber" ? "dinheiro" : "boleto")
  if (natureza === "pagar") {
    return <Button size="sm" variant="outline" className="h-10 rounded-full" isDisabled={!n} onPress={() => aoPedir("boleto")}><Banknote /> {n ? `Pagar ${n} ${n === 1 ? "conta" : "contas"}` : "Nenhuma em aberto"}</Button>
  }
  return (
    <>
      <Select aria-label="Meio do recebimento" selectedKey={meio} onSelectionChange={(k) => setMeio(k as Meio)} className="w-40">
        <SelectTrigger className="h-10 rounded-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto"] as Meio[]).map((m) => <SelectItem key={m} id={m}>{MEIOS[m]}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" className="h-10 rounded-full" isDisabled={!n} onPress={() => aoPedir(meio)}>
        <ArrowDownToLine /> {n ? `Receber ${n} ${n === 1 ? "título" : "títulos"}` : "Nenhum em aberto"}
      </Button>
    </>
  )
}

function MenuLinha({ l, abrir, pedir }: { l: Lancamento; abrir: (id: string) => void; pedir: (p: Pedido) => void }) {
  const papel = usePapel()
  const cap = l.natureza === "receber" ? "receber" : "pagar"
  const itens: ItemMenu[] = [{ rotulo: l.estado === "pago" ? "Ver comprovante" : "Abrir o título", icone: Eye, aoEscolher: () => abrir(l.id) }]
  if (emAberto(l) && !l.envio && pode(papel, cap)) {
    if (l.natureza === "receber") {
      itens.push({ rotulo: "Receber em dinheiro…", icone: Banknote, aoEscolher: () => pedir({ tipo: "receber", l, meio: "dinheiro" }) })
      itens.push({ rotulo: "Cobrar com Pix", icone: QrCode, aoEscolher: () => abrir(l.id) })
    } else itens.push({ rotulo: "Pagar…", icone: Banknote, aoEscolher: () => abrir(l.id) })
    itens.push({ rotulo: "Cancelar o título…", icone: X, perigo: true, separadorAntes: true, aoEscolher: () => pedir({ tipo: "cancelar", l }) })
  }
  if (l.estado === "pago" && !l.estornadoPor && !l.estornoDe && pode(papel, "estornar", { valor: l.valor })) {
    itens.push({ rotulo: "Estornar…", icone: X, perigo: true, separadorAntes: true, aoEscolher: () => pedir({ tipo: "estornar", l }) })
  }
  return <MenuDaLinha rotulo={`Ações de ${l.id}`} itens={itens} />
}

