// Módulo Pedidos (5.3) · /pedidos/: as ordens de serviço em lista (TabelaDados) ou em quadro (?vista=quadro), com
// filtros na URL (?q=&etapa=&tecnico=&atrasados=1&ordem=prazo:asc), CSV do recorte, ações em lote (avançar, atribuir)
// e o detalhe numa folha (?id=OS-1052), com "Abrir página" para /pedidos/ver/.
// A lista vem em seções (Atrasadas · Em andamento · Prontas · Encerradas), ordena por coluna, soma o recorte no rodapé
// e muda o prazo na própria célula com motivo obrigatório (P: a previsão anterior fica, CLI-08).
// O técnico vê só as próprias ("Minhas OS"); a atendente, as da unidade dela (MATRIZ: proprias, unidade).
// Tela de operação: banner compacto que recolhe ao rolar, filtros em pílula de vidro sobre ele.
// A lista e o detalhe chegam prontos do servidor; o quadro (@dnd-kit) e a folha baixam só quando abrem.
import { Suspense, lazy, memo, useCallback, useMemo, useState } from "react"
import { ArrowRight, CalendarClock, ClipboardList, Download, ExternalLink, Filter, Plus, SearchX, UserRound, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados, type GrupoDaTabela, type OrdemDaTabela } from "@/components/base/TabelaDados"
import { SeloEixo } from "@/components/base/selos"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { BotaoLiquido } from "@/components/movimento"
import { resumirLote, usePendentes, useProcessando, type Resultado } from "@/proto/dados"
import { agora as agoraJa, useAgora } from "@/proto/relogio"
import { RECURSOS, recursoPorId } from "@/proto/negocio"
import { usePapel, pode } from "@/proto/permissoes"
import { ATRASADA, ETAPA_OS, ETAPAS_OS, ETAPAS_TERMINAIS, PAGAMENTO, type EtapaOS } from "@/proto/projecao"
import { clientes } from "@/modulos/clientes/dados"
import { moeda, dataCurta } from "@/lib/formato"
import { url } from "@/lib/url"
import { aCobrar, atrasado, atribuirTecnico, diasDeAtraso, moverOS, mudarPrazo, pedidos, proximoPasso, COLUNAS_OS, type Pedido } from "../dados"
import { DetalheOS } from "./DetalheOS"
import { DialogoCancelarOS } from "./CancelarOS"

const QuadroOS = lazy(() => import("./QuadroOS"))

const PADRAO = { q: "", etapa: "todas", tecnico: "todos", atrasados: "", vista: "lista", id: "", ordem: "" }
type Filtros = typeof PADRAO
const TECNICOS = RECURSOS.filter((r) => r.id !== "bancada-pampulha")
const MOTIVOS_PRAZO = ["Fornecedor atrasou a peça", "Cliente pediu outra data", "Agenda do técnico", "Serviço maior que o previsto", "Aguardando aprovação do cliente"] as const

/** O recorte atual (o mesmo da tabela, do quadro e do CSV). */
function filtrar(lista: Pedido[], f: Filtros, nome: (id: string) => string, agora: Date) {
  const t = f.q.trim().toLowerCase()
  return lista.filter((p) =>
    (f.etapa === "todas" || p.etapa === f.etapa) && (!f.atrasados || atrasado(p, agora)) &&
    (f.tecnico === "todos" || (f.tecnico === "nenhum" ? !p.responsavelId : p.responsavelId === f.tecnico)) &&
    (!t || p.id.toLowerCase().includes(t) || p.titulo.toLowerCase().includes(t) || nome(p.clienteId).toLowerCase().includes(t)))
}

/** CSV do recorte, separado por ponto e vírgula (abre certo no Excel em pt-BR). */
function exportarCsv(lista: Pedido[], nome: (id: string) => string) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const linhas = lista.map((p) => [p.id, nome(p.clienteId), p.titulo, ETAPA_OS[p.etapa].rotulo, PAGAMENTO[p.pagamento].rotulo, recursoPorId(p.responsavelId)?.nome ?? "", new Date(p.prazo).toLocaleDateString("pt-BR"), p.total.toFixed(2).replace(".", ",")].map(esc).join(";"))
  const csv = "﻿" + ["OS;Cliente;Título;Etapa;Pagamento;Técnico;Prazo;Total (R$)", ...linhas].join("\r\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  a.download = `ordens-de-servico-${agoraJa().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  toast.success(`${linhas.length} OS exportadas em CSV.`)
}

export default function Pedidos() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const papel = usePapel()
  const tecnico = papel === "tecnico"
  // o recorte do papel: técnico só as próprias, atendente só as da unidade (a MATRIZ decide; o servidor usa a padrão)
  const brutas = pedidos.use()
  const todas = useMemo(() => brutas.filter((p) => pode(papel, "ver_pedidos", { responsavelId: p.responsavelId ?? "", unidade: p.unidade })), [brutas, papel])
  const cli = clientes.use()
  const agora = useAgora()
  const nome = useMemo(() => { const m = new Map(cli.map((c) => [c.id, c.nome])); return (id: string) => m.get(id) ?? "Cliente removido" }, [cli])
  const lista = useMemo(() => filtrar(todas, f, nome, agora), [todas, f, nome, agora])
  const filtrado = f.q !== "" || f.etapa !== "todas" || f.tecnico !== "todos" || !!f.atrasados
  const limpar = () => setF({ q: "", etapa: "todas", tecnico: "todos", atrasados: "" })
  const quadro = f.vista === "quadro"
  const [cancelando, setCancelando] = useState<Pedido | null>(null)
  const abrir = useCallback((id: string) => setF({ id }), [setF])
  const ordem = useMemo<OrdemDaTabela | null>(() => { const [coluna, d] = f.ordem.split(":"); return coluna ? { coluna, direcao: d === "desc" ? "desc" : "asc" } : null }, [f.ordem])
  const aoOrdenar = useCallback((o: OrdemDaTabela | null) => setF({ ordem: o ? `${o.coluna}:${o.direcao}` : "" }), [setF])
  const rotuloFiltro = [f.etapa !== "todas" && ETAPA_OS[f.etapa as EtapaOS]?.rotulo, f.tecnico !== "todos" && (recursoPorId(f.tecnico)?.curto ?? "Sem técnico"), f.atrasados && "Atrasadas", f.q && `“${f.q}”`].filter(Boolean).join(" · ")

  return (
    <>
      <CabecalhoPagina
        titulo={tecnico ? "Minhas OS" : "Pedidos e OS"}
        descricao={tecnico ? "As ordens de serviço com você" : "Acompanhe, filtre e avance as ordens de serviço"}
        contagem={filtrado ? `${lista.length} de ${todas.length}` : `${todas.length} OS`}
        vistas={[{ id: "lista", rotulo: "Lista" }, { id: "quadro", rotulo: "Quadro" }]}
        vista={f.vista}
        aoMudarVista={(v) => setF({ vista: v })}
        acoes={pode(papel, "criar_pedido") && <BotaoLiquido href={url("pedidos/novo/")}><Plus className="size-4" /> Nova OS</BotaoLiquido>}
      >
        <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar OS" placeholder="Buscar OS, título ou cliente"
          filtrado={filtrado} aoLimpar={limpar}
          acoes={<Button variant="outline" className="h-10 rounded-full" onPress={() => exportarCsv(lista, nome)}><Download /> Exportar CSV</Button>}>
          {!quadro && (
            <Select aria-label="Filtrar por etapa" selectedKey={f.etapa} onSelectionChange={(k) => setF({ etapa: String(k) })} className="w-52">
              <SelectTrigger className="h-10 rounded-full"><Filter /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem id="todas">Todas as etapas</SelectItem>
                {ETAPAS_OS.map((e) => <SelectItem key={e} id={e}>{ETAPA_OS[e].rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {!quadro && !tecnico && (
            <Select aria-label="Filtrar por técnico" selectedKey={f.tecnico} onSelectionChange={(k) => setF({ tecnico: String(k) })} className="w-52">
              <SelectTrigger className="h-10 rounded-full"><UserRound /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem id="todos">Todos os técnicos</SelectItem>
                {TECNICOS.map((r) => <SelectItem key={r.id} id={r.id}>{r.nome}</SelectItem>)}
                <SelectItem id="nenhum">Sem técnico</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Switch isSelected={!!f.atrasados} onChange={(v) => setF({ atrasados: v ? "1" : "" })} className="min-h-10 px-2">Só atrasadas</Switch>
        </BarraFerramentas>
      </CabecalhoPagina>

      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="ver_pedidos" area="do atendimento" rotulo="as ordens de serviço"
          esqueleto={<div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>}
          estaVazio={todas.length === 0}
          vazio={tecnico
            ? <EstadoVazio icone={ClipboardList} titulo="Nenhuma OS com você agora." texto="Quando a Marina atribuir uma OS, ela aparece aqui." />
            : <EstadoVazio icone={ClipboardList} titulo="Nenhuma OS ainda." texto="As ordens de serviço e as vendas aparecem aqui."
              acao={pode(papel, "criar_pedido") ? <BotaoLiquido href={url("pedidos/novo/")}><Plus className="size-4" /> Nova OS</BotaoLiquido> : undefined} />}
        >
          {() => lista.length === 0 ? (
            <EstadoVazio variante="filtro" icone={SearchX} titulo={`Nenhum pedido com ${rotuloFiltro}.`} texto="Tente outro termo ou limpe os filtros para ver todos."
              acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
          ) : quadro ? (
            <Suspense fallback={<div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="Carregando o quadro">{COLUNAS_OS.slice(0, 5).map((c) => <Esqueleto key={c.id} className="h-96 w-[17.5rem] shrink-0 rounded-[var(--radius-xl)]" />)}</div>}>
              <QuadroOS lista={lista} />
            </Suspense>
          ) : (
            <Lista lista={lista} total={todas.length} nome={nome} agora={agora} aberto={f.id} abrir={abrir} aoCancelar={setCancelando} ordem={ordem} aoOrdenar={aoOrdenar} />
          )}
        </ComDados>
      </div>
      <DetalheOS id={f.id || null} aoFechar={() => setF({ id: "" })} />
      <DialogoCancelarOS os={cancelando} aoFechar={() => setCancelando(null)} />
    </>
  )
}

function SeloOS({ p, agora }: { p: Pedido; agora: Date }) {
  return atrasado(p, agora) ? <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(p, agora) }} detalhe /> : <SeloEixo p={ETAPA_OS[p.etapa]} />
}

type Secao = "atrasadas" | "andamento" | "prontas" | "encerradas"
const secaoDe = (p: Pedido, agora: Date): Secao =>
  atrasado(p, agora) ? "atrasadas" : p.etapa === "pronta" ? "prontas" : ETAPAS_TERMINAIS.includes(p.etapa) ? "encerradas" : "andamento"
const SECOES: { id: Secao; titulo: string }[] = [
  { id: "atrasadas", titulo: "Atrasadas" }, { id: "andamento", titulo: "Em andamento" }, { id: "prontas", titulo: "Prontas, a cobrar" }, { id: "encerradas", titulo: "Encerradas" },
]
const ORDEM_ETAPA = new Map(ETAPAS_OS.map((e, i) => [e, i]))
/** "dd/mm/aaaa" (ou "dd/mm") → "aaaa-mm-dd"; nada se não for data. */
function lerData(t: string, ano: number) {
  const m = t.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (!m) return null
  const a = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : ano
  const d = new Date(a, Number(m[2]) - 1, Number(m[1]))
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null
  return `${a}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// em memo: abrir a folha, o diálogo de cancelar ou o tique do relógio sem mudar a lista não renderizam as 50 linhas de novo
const Lista = memo(function Lista({ lista, total, nome, agora, aberto, abrir, aoCancelar, ordem, aoOrdenar }: {
  lista: Pedido[]; total: number; nome: (id: string) => string; agora: Date; aberto: string; abrir: (id: string) => void; aoCancelar: (p: Pedido) => void
  ordem: OrdemDaTabela | null; aoOrdenar: (o: OrdemDaTabela | null) => void
}) {
  const pendentes = usePendentes()
  const processando = useProcessando()
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  const papel = usePapel()
  const colunas: ColunaDados<Pedido>[] = useMemo(() => [
    { id: "id", titulo: "Nº", tipo: "id", largura: "6rem", ordenar: (p) => p.id,
      valor: (p) => <a href={url(`pedidos/?id=${p.id}`)} onClick={(e) => { e.preventDefault(); abrir(p.id) }} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{p.id}</a>, texto: (p) => p.id },
    { id: "cliente", titulo: "Cliente", tipo: "texto", largura: "18%", ordenar: (p) => nome(p.clienteId), valor: (p) => nome(p.clienteId) },
    { id: "titulo", titulo: "Título", tipo: "texto", ordenar: (p) => p.titulo, valor: (p) => p.titulo },
    { id: "etapa", titulo: "Etapa", tipo: "status", largura: "10.5rem", ordenar: (p) => ORDEM_ETAPA.get(p.etapa) ?? 0, valor: (p) => <SeloOS p={p} agora={agora} />, texto: (p) => ETAPA_OS[p.etapa].rotulo },
    { id: "pagamento", titulo: "Pagamento", tipo: "status", largura: "8.25rem", soNaTabela: true, valor: (p) => <SeloEixo p={PAGAMENTO[p.pagamento]} />, texto: (p) => PAGAMENTO[p.pagamento].rotulo },
    { id: "tecnico", titulo: "Técnico", tipo: "pessoa", largura: "6.5rem", ordenar: (p) => recursoPorId(p.responsavelId)?.curto ?? "~", valor: (p) => recursoPorId(p.responsavelId)?.curto ?? "—" },
    { id: "prazo", titulo: "Prazo", tipo: "data", largura: "6rem", ordenar: (p) => p.prazo,
      valor: (p) => <span className={atrasado(p, agora) ? "text-negativo-texto" : undefined}>{dataCurta(p.prazo)}</span>, texto: (p) => dataCurta(p.prazo),
      editar: {
        rotulo: "Novo prazo (dd/mm/aaaa)", valor: (p) => new Date(p.prazo).toLocaleDateString("pt-BR"),
        pode: (p) => !ETAPAS_TERMINAIS.includes(p.etapa) && pode(papel, "mover_os", { responsavelId: p.responsavelId, unidade: p.unidade, etapa: p.etapa }),
        motivo: { opcoes: MOTIVOS_PRAZO, titulo: (p) => `Mudar o prazo da ${p.id}`, detalhe: (p) => `${nome(p.clienteId)} · o cliente é avisado` },
        salvar: (p, novo, motivo): Promise<Resultado> => {
          const iso = lerData(novo, agoraJa().getFullYear())
          if (!iso) return Promise.resolve({ ok: false, motivo: "falha", mensagem: "Use o formato dd/mm/aaaa, como 20/11/2026." })
          const hoje = agoraJa(); const h = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`
          if (iso < h) return Promise.resolve({ ok: false, motivo: "falha", mensagem: "O prazo não pode ser antes de hoje." })
          return mudarPrazo(p.id, iso, motivo ?? "", p.versao)
        },
      } },
    { id: "total", titulo: "Total", tipo: "moeda", largura: "9.5rem", ordenar: (p) => p.total, valor: (p) => (p.total ? moeda(p.total) : "Sob orçamento") },
    { id: "acoes", titulo: "Ações", tipo: "acoes", largura: "3rem", valor: (p) => <MenuLinha p={p} abrir={abrir} aoCancelar={aoCancelar} /> },
  ], [abrir, aoCancelar, nome, agora, papel])

  // seções com a contagem e a soma de cada uma; rodapé com o recorte inteiro
  const verTotais = pode(papel, "ver_totais") // técnico não vê dinheiro agregado
  const grupos: GrupoDaTabela[] = useMemo(() => SECOES.map((s) => {
    const daSecao = lista.filter((p) => secaoDe(p, agora) === s.id)
    return { ...s, resumo: verTotais ? <><span className="num">{daSecao.length}</span> · <span className="num">{moeda(daSecao.reduce((t, p) => t + p.total, 0))}</span></> : <span className="num">{daSecao.length}</span> }
  }), [lista, agora, verTotais])
  const abertas = lista.filter((p) => !ETAPAS_TERMINAIS.includes(p.etapa))
  const totais = {
    rotulo: `${lista.length} OS no recorte`,
    itens: verTotais ? [
      { rotulo: "Em aberto", valor: <span className="num">{moeda(abertas.reduce((t, p) => t + p.total, 0))}</span> },
      { rotulo: "A cobrar", valor: <span className="num">{moeda(lista.filter(aCobrar).reduce((t, p) => t + p.total, 0))}</span> },
    ] : [],
  }
  return (
    <TabelaDados<Pedido>
      titulo="Lista de OS"
      colunas={colunas}
      linhas={lista}
      idDe={(p) => p.id}
      contagem={<><span className="num">{lista.length}</span> de <span className="num">{total}</span></>}
      aoAbrir={(p) => abrir(p.id)}
      aberto={aberto}
      pendentes={marcados}
      grupoDe={(p) => secaoDe(p, agora)}
      grupos={grupos}
      totais={totais}
      ordem={ordem}
      aoOrdenar={aoOrdenar}
      lote={pode(papel, "mover_os") ? (ids, limpar) => <AcoesEmLote ids={ids} limpar={limpar} lista={lista} tecnico={papel === "tecnico"} /> : undefined}
      cartao={(p) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <a href={url(`pedidos/?id=${p.id}`)} onClick={(e) => { e.preventDefault(); abrir(p.id) }} className="num inline-flex min-h-10 items-center rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{p.id}</a>
            <span className="flex min-w-0 max-w-[60%] justify-end"><SeloOS p={p} agora={agora} /></span>
          </div>
          <span className="block truncate text-sm" title={p.titulo}>{p.titulo}</span>
          <span className="block truncate text-xs text-muted-foreground" title={nome(p.clienteId)}>{nome(p.clienteId)}</span>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3" aria-hidden="true" /> <span className="num">{dataCurta(p.prazo)}</span>{p.responsavelId ? ` · ${recursoPorId(p.responsavelId)?.curto}` : ""}</span>
            <span className="num min-w-0 truncate font-semibold" title={p.total ? moeda(p.total) : undefined}>{p.total ? moeda(p.total) : "Sob orçamento"}</span>
          </div>
        </>
      )}
    />
  )
})

/** Lote: avançar as que têm passo direto (classe O) e atribuir o técnico. As que pedem sheet (agendar, orçar, concluir) ficam de fora do avançar. */
function AcoesEmLote({ ids, limpar, lista, tecnico }: { ids: string[]; limpar: () => void; lista: Pedido[]; tecnico: boolean }) {
  const diretas = lista.filter((p) => ids.includes(p.id)).map((p) => ({ p, passo: proximoPasso(p) })).filter((x) => x.passo?.mov.tipo === "direto")
  async function avancar() {
    const r = (await Promise.all(diretas.map(({ p, passo }) => moverOS(p.id, (passo!.mov as { etapa: EtapaOS }).etapa, undefined, true)))).filter((x): x is Resultado => !!x)
    if (!resumirLote(r, "avançar as OS")) toast.success(`${r.length} ${r.length === 1 ? "OS avançada" : "OS avançadas"}.`)
    limpar()
  }
  return (
    <>
      <Button size="sm" variant="outline" className="rounded-full" isDisabled={!diretas.length} onPress={() => void avancar()}>
        <ArrowRight /> {diretas.length ? `Avançar ${diretas.length} OS` : "Nenhuma avança direto"}
      </Button>
      {!tecnico && (
        <Select aria-label="Atribuir as OS selecionadas a um técnico" placeholder="Atribuir a…" selectedKey={null}
          onSelectionChange={(k) => { if (k) { void atribuirTecnico(ids, String(k)); limpar() } }} className="w-40">
          <SelectTrigger className="h-7 rounded-full text-[0.8rem] pointer-coarse:h-10"><UserRound /><SelectValue /></SelectTrigger>
          <SelectContent>{TECNICOS.map((r) => <SelectItem key={r.id} id={r.id}>{r.nome}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </>
  )
}

function MenuLinha({ p, abrir, aoCancelar }: { p: Pedido; abrir: (id: string) => void; aoCancelar: (p: Pedido) => void }) {
  const passo = proximoPasso(p)
  const papel = usePapel()
  const ctx = { responsavelId: p.responsavelId, unidade: p.unidade, etapa: p.etapa }
  const itens: ItemMenu[] = [
    { rotulo: "Abrir a OS", icone: ClipboardList, aoEscolher: () => abrir(p.id) },
    { rotulo: "Abrir a página", icone: ExternalLink, aoEscolher: () => { location.href = url(`pedidos/ver/?id=${p.id}`) } },
  ]
  if (passo?.mov.tipo === "direto" && pode(papel, "mover_os", ctx)) {
    const etapa = passo.mov.etapa
    itens.push({ rotulo: `Mover para ${COLUNAS_OS.find((c) => c.id === passo.coluna)?.titulo.toLowerCase()}`, icone: ArrowRight, aoEscolher: () => void moverOS(p.id, etapa) })
  }
  if (p.etapa !== "cancelada" && p.etapa !== "entregue" && pode(papel, "cancelar_os", ctx)) {
    itens.push({ rotulo: "Cancelar a OS…", icone: X, perigo: true, separadorAntes: true, aoEscolher: () => aoCancelar(p) })
  }
  return <MenuDaLinha rotulo={`Ações da ${p.id}`} itens={itens} />
}
