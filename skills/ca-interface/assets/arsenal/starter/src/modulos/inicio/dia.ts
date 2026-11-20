// Módulo Início · os números do dia, todos derivados das coleções dos outros módulos (nenhum número fixo).
// Funções puras: recebem as listas já lidas pela tela (colecao.use()), a unidade em foco e o "agora" do relógio.
import { chaveDia, DIA, HORA } from "@/proto/relogio"
import { recursoPorId, RECURSOS, type Recurso } from "@/proto/negocio"
import type { EscolhaUnidade } from "@/modulos/entrada/dados"
import { atrasado, COLUNAS_OS, emAberto as osEmAberto, type Pedido } from "@/modulos/pedidos/dados"
import type { Agendamento } from "@/modulos/agenda/dados"
import { caixaDoDia, emAberto as lanEmAberto, esperadoNoCaixa, grupoDe, pixExpirado, resumo, vencido, type Caixa, type Lancamento } from "@/modulos/financeiro/dados"
import { compraAtrasada, estadoDoProduto, precisaRepor, saldoTotal, CATEGORIAS, type Compra, type Produto } from "@/modulos/estoque/dados"
import type { Conversa, Mensagem } from "@/modulos/mensagens/dados"
import { daUnidade } from "./sessao"

export type Fontes = {
  pedidos: Pedido[]; agendamentos: Agendamento[]; lancamentos: Lancamento[]; caixas: Caixa[]
  produtos: Produto[]; compras: Compra[]; conversas: Conversa[]; mensagens: Mensagem[]
}
export const FONTES_VAZIAS: Fontes = { pedidos: [], agendamentos: [], lancamentos: [], caixas: [], produtos: [], compras: [], conversas: [], mensagens: [] }

const hojeDe = (iso: string, agora: Date) => chaveDia(new Date(iso)) === chaveDia(agora)
const VIVOS = new Set(["solicitado", "confirmado", "em_atendimento", "concluido", "faltou"])

/** Recorte da unidade em foco. Conversa sem OS ligada aparece em todas as unidades (o cliente não é de uma só). */
export function recortar(f: Fontes, u: EscolhaUnidade): Fontes {
  if (u === "todas") return f
  const osDaUnidade = new Map(f.pedidos.map((p) => [p.id, p.unidade]))
  return {
    ...f,
    pedidos: f.pedidos.filter((p) => daUnidade(u, p.unidade)),
    agendamentos: f.agendamentos.filter((a) => daUnidade(u, recursoPorId(a.recursoId)?.unidade)),
    lancamentos: f.lancamentos.filter((l) => daUnidade(u, l.unidade)),
    caixas: f.caixas.filter((c) => daUnidade(u, c.unidade)),
    compras: f.compras.filter((c) => daUnidade(u, c.unidade)),
    conversas: f.conversas.filter((c) => !c.ref || daUnidade(u, osDaUnidade.get(c.ref))),
  }
}

// ---------- agenda de hoje ----------
export function agendaDeHoje(ags: Agendamento[], agora: Date) {
  return ags.filter((a) => hojeDe(a.inicio, agora) && VIVOS.has(a.estado)).sort((a, b) => a.inicio.localeCompare(b.inicio))
}
/** Pares que se sobrepõem no mesmo recurso, entre os que ainda vão acontecer ou estão acontecendo. */
export function conflitos(hoje: Agendamento[]) {
  const ativos = hoje.filter((a) => a.estado === "solicitado" || a.estado === "confirmado" || a.estado === "em_atendimento")
  const pares: [Agendamento, Agendamento][] = []
  ativos.forEach((a, i) => ativos.slice(i + 1).forEach((b) => {
    if (a.recursoId === b.recursoId && a.inicio < b.fim && b.inicio < a.fim) pares.push([a, b])
  }))
  return pares
}
/** Os recursos da agenda na unidade em foco (a mini grade mostra todos, mesmo quem não tem visita hoje). */
export const recursosDa = (u: EscolhaUnidade): Recurso[] => RECURSOS.filter((r) => daUnidade(u, r.unidade))

// ---------- números do banner ----------
export function numerosDoDia(f: Fontes, agora: Date) {
  const hoje = agendaDeHoje(f.agendamentos, agora)
  const r = resumo(f.lancamentos, agora)
  const receberHoje = f.lancamentos.filter((l) => l.natureza === "receber" && lanEmAberto(l) && grupoDe(l, agora) === "hoje")
  return {
    visitasHoje: hoje.length,
    emAtendimento: hoje.filter((a) => a.estado === "em_atendimento").length,
    concluidasHoje: hoje.filter((a) => a.estado === "concluido").length,
    // a mesma conta da coluna "Em execução" do quadro (aprovadas esperando o início entram nela)
    emExecucao: f.pedidos.filter((p) => COLUNAS_OS.find((c) => c.id === "execucao")!.etapas.includes(p.etapa)).length,
    aguardandoCliente: f.pedidos.filter((p) => p.etapa === "aguardando_aprovacao").length,
    abertas: f.pedidos.filter(osEmAberto).length,
    atrasadas: f.pedidos.filter((p) => atrasado(p, agora)).length,
    pedidosHoje: f.pedidos.filter((p) => hojeDe(p.criadoEm, agora)).length,
    recebidoHoje: f.lancamentos.filter((l) => l.natureza === "receber" && l.estado === "pago" && !l.estornadoPor && !!l.pagoEm && hojeDe(l.pagoEm, agora)).reduce((s, l) => s + l.valor, 0),
    receberHoje: receberHoje.reduce((s, l) => s + l.valor, 0),
    nReceberHoje: receberHoje.length,
    receberHojeLista: receberHoje.sort((a, b) => b.valor - a.valor),
    ...r,
  }
}

// ---------- séries do KPI-herói ----------
export type Periodo = "semana" | "mes"
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
/** Dias do período até hoje: os últimos 7 ou do dia 1 do mês até hoje. */
function diasDo(periodo: Periodo, agora: Date) {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const n = periodo === "semana" ? 7 : agora.getDate()
  return Array.from({ length: n }, (_, i) => new Date(hoje.getTime() - (n - 1 - i) * DIA + 12 * HORA))
}
const rotuloDia = (d: Date, periodo: Periodo) => (periodo === "semana" ? DIAS_SEMANA[d.getDay()] : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`)

/** Recebido por dia (títulos a receber pagos). */
export function serieRecebido(lans: Lancamento[], periodo: Periodo, agora: Date) {
  const dias = diasDo(periodo, agora)
  const pagos = lans.filter((l) => l.natureza === "receber" && l.estado === "pago" && l.pagoEm && !l.estornadoPor)
  const porDia = new Map<string, number>()
  for (const l of pagos) { const k = chaveDia(new Date(l.pagoEm!)); porDia.set(k, (porDia.get(k) ?? 0) + l.valor) }
  return { dados: dias.map((d) => Math.round((porDia.get(chaveDia(d)) ?? 0) * 100) / 100), rotulos: dias.map((d) => rotuloDia(d, periodo)) }
}
/** OS abertas por dia (balcão: sem valor do caixa). */
export function seriePedidos(ps: Pedido[], periodo: Periodo, agora: Date) {
  const dias = diasDo(periodo, agora)
  const porDia = new Map<string, number>()
  for (const p of ps) { const k = chaveDia(new Date(p.criadoEm)); porDia.set(k, (porDia.get(k) ?? 0) + 1) }
  return { dados: dias.map((d) => porDia.get(chaveDia(d)) ?? 0), rotulos: dias.map((d) => rotuloDia(d, periodo)) }
}

// ---------- estoque ----------
export function resumoEstoque(produtos: Produto[], compras: Compra[], agora: Date) {
  const repor = produtos.filter(precisaRepor)
  return {
    baixos: repor.filter((p) => estadoDoProduto(p) === "baixo").length,
    esgotados: repor.filter((p) => estadoDoProduto(p) === "esgotado").length,
    porCategoria: CATEGORIAS.map((c) => ({ nome: c, n: repor.filter((p) => p.categoria === c).length })).filter((x) => x.n > 0),
    comprasAtrasadas: compras.filter((c) => compraAtrasada(c, agora)),
    total: repor.length,
    /** Os dois primeiros para repor: esgotados antes, depois os de menor saldo. */
    primeiros: [...repor].sort((a, b) => saldoTotal(a) - saldoTotal(b)).slice(0, 2).map((p) => ({ id: p.id, nome: p.nome, saldo: saldoTotal(p), minimo: p.minimo })),
  }
}

// ---------- mensagens ----------
export function resumoMensagens(cvs: Conversa[], ms: Mensagem[]) {
  const abertas = cvs.filter((c) => c.estado !== "resolvida")
  const comNaoLidas = abertas.filter((c) => c.naoLidas > 0)
  const ultima = new Map<string, Mensagem>()
  for (const m of ms) { const a = ultima.get(m.conversaId); if (!a || m.em > a.em) ultima.set(m.conversaId, m) }
  const ids = new Set(cvs.map((c) => c.id))
  return {
    naoLidas: comNaoLidas.reduce((s, c) => s + c.naoLidas, 0),
    abertas: abertas.length,
    falhas: ms.filter((m) => m.estado === "falhou" && ids.has(m.conversaId)).length,
    recentes: comNaoLidas.map((c) => ({ c, m: ultima.get(c.id) })).sort((a, b) => (b.m?.em ?? "").localeCompare(a.m?.em ?? "")),
  }
}

// ---------- financeiro ----------
export function caixasDoDia(caixas: Caixa[], lans: Lancamento[], u: EscolhaUnidade, agora: Date) {
  const unidades = (u === "todas" ? ["pampulha", "contagem"] : [u]) as ("pampulha" | "contagem")[]
  return unidades.map((un) => {
    const cx = caixaDoDia(caixas, un, agora)
    return { unidade: un, cx, esperado: cx ? esperadoNoCaixa(cx, lans).dinheiro : 0 }
  })
}
/** O último caixa fechado com diferença (o de sáb 14/11 na semente). */
export function ultimoComDiferenca(caixas: Caixa[]) {
  return [...caixas].filter((c) => c.estado === "fechado" && !!c.diferenca).sort((a, b) => b.data.localeCompare(a.data))[0]
}
export const pagarDeHoje = (lans: Lancamento[], agora: Date) => lans.filter((l) => l.natureza === "pagar" && lanEmAberto(l) && grupoDe(l, agora) === "hoje")
export const pixVencidos = (lans: Lancamento[], agora: Date) => lans.filter((l) => l.natureza === "receber" && pixExpirado(l, agora))
export const receberVencidos = (lans: Lancamento[], agora: Date) => lans.filter((l) => l.natureza === "receber" && vencido(l, agora))

// ---------- OS por etapa (as colunas do quadro) ----------
export function porColuna(ps: Pedido[]) {
  return COLUNAS_OS.map((c) => ({ ...c, n: ps.filter((p) => c.etapas.includes(p.etapa)).length }))
}
