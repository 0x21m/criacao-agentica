// Módulo Relatórios (5.8) · os números. Tudo derivado das coleções dos outros módulos (pedidos, agenda, financeiro,
// estoque), lidas e nunca editadas: a tela só formata. Nenhum número fixo; "zero" é 0 e 0 %, nunca "—".
// O tempo é o do relógio do protótipo (agora()), passado por quem chama.
import { DIA, chaveDia } from "@/proto/relogio"
import { EMPRESA, FERIADOS, RECURSOS, SERVICOS, type Unidade } from "@/proto/negocio"
import type { Pedido } from "@/modulos/pedidos/dados"
import type { Agendamento } from "@/modulos/agenda/dados"
import type { Lancamento } from "@/modulos/financeiro/dados"
import type { Movimentacao, Produto } from "@/modulos/estoque/dados"

// ---------- filtros (vivem na URL) ----------
export type IdIndicador = "faturamento" | "ticket" | "concluidas" | "tempo" | "aprovacao"
export type IdPeriodo = "7d" | "30d" | "mes" | "trimestre" | "personalizado"
export type FiltroUnidade = "todas" | Unidade
export type Comparar = "anterior" | "unidades"

export const PERIODOS: { id: IdPeriodo; rotulo: string }[] = [
  { id: "7d", rotulo: "7 dias" }, { id: "30d", rotulo: "30 dias" }, { id: "mes", rotulo: "Este mês" },
  { id: "trimestre", rotulo: "Trimestre" }, { id: "personalizado", rotulo: "Personalizado" },
]

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const somaDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
/** "2026-11-03" → Date local (meia-noite). */
export const lerDia = (s: string) => {
  const [a, m, d] = s.split("-").map(Number)
  if (!a || !m || !d) return null
  const x = new Date(a, m - 1, d)
  // 31/02 não vira 03/03: data que não existe é inválida
  return x.getFullYear() === a && x.getMonth() === m - 1 && x.getDate() === d ? x : null
}
/** O personalizado vai até 12 meses e não começa antes de 2020. */
export const MAX_DIAS = 366
export const MIN_DIA = "2020-01-01"

export type Janela = { de: Date; ate: Date; dias: number }
/** O intervalo do período, de um dia (inclusive) até o fim de outro (inclusive). */
export function janelaDe(periodo: IdPeriodo, ref: Date, de?: string, ate?: string): Janela {
  const hoje = inicioDoDia(ref)
  let ini: Date, fim = hoje
  if (periodo === "7d") ini = somaDias(hoje, -6)
  else if (periodo === "mes") ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  else if (periodo === "trimestre") ini = somaDias(hoje, -89)
  else if (periodo === "personalizado" && de && ate && lerDia(de) && lerDia(ate)) {
    const a = lerDia(de)!, b = lerDia(ate)!
    ini = a <= b ? a : b; fim = a <= b ? b : a
    if (fim > hoje) fim = hoje
    if (ini > fim) ini = fim
    const minimo = somaDias(fim, -(MAX_DIAS - 1))
    if (ini < minimo) ini = minimo
  } else ini = somaDias(hoje, -29)
  const dias = Math.round((fim.getTime() - ini.getTime()) / DIA) + 1
  return { de: ini, ate: fim, dias }
}
/** O período anterior, do mesmo tamanho, logo antes. */
export const janelaAnterior = (j: Janela): Janela => ({ de: somaDias(j.de, -j.dias), ate: somaDias(j.de, -1), dias: j.dias })

/** Os pontos do gráfico: um por dia até 31 dias; acima disso, um por semana (os dias ralos não viram um serrote). */
export type Balde = { de: Date; ate: Date }
export function baldes(j: Janela, semanal = porSemana(j)): Balde[] {
  const passo = semanal ? 7 : 1
  const r: Balde[] = []
  for (let d = j.de; d <= j.ate; d = somaDias(d, passo)) {
    const fim = somaDias(d, passo - 1)
    r.push({ de: d, ate: fim > j.ate ? j.ate : fim })
  }
  return r
}
export const porSemana = (j: Janela) => j.dias > 31
/** Média (tempo, taxa) tem poucos fatos por dia: acima de 14 dias, um ponto por semana. */
export const semanalPara = (ind: Indicador, j: Janela) => porSemana(j) || (ind.agrega === "media" && j.dias > 14)

// ---------- fatos: cada indicador lê uma lista de fatos datados ----------
/** Um acontecimento que conta para um indicador: quando, onde e quanto. */
export type Fato = { quando: Date; unidade: Unidade; valor: number }

/** Data em que a OS ficou pronta: o passo do histórico; sem ele, o fim do prazo (a garantia começa na entrega). */
export function concluidaEm(p: Pedido, ref: Date): Date | null {
  if (p.etapa !== "pronta" && p.etapa !== "entregue") return null
  const passo = [...p.historico].reverse().find((e) => e.para === "pronta" || e.para === "entregue")
  if (passo) return new Date(passo.em)
  const d = p.garantiaAte ? new Date(new Date(p.garantiaAte).getTime() - EMPRESA.garantiaDias * DIA) : new Date(p.prazo)
  return d > ref ? ref : d
}

/** Decisões de orçamento: aprovado (1) ou recusado (0), com o tempo desde o envio. */
export function decisoes(lista: Pedido[]) {
  const r: { quando: Date; unidade: Unidade; aprovado: boolean; dias?: number }[] = []
  for (const p of lista) {
    const o = p.orcamento
    if (o?.decisao && (o.estado === "aprovado" || o.estado === "recusado")) {
      const quando = new Date(o.decisao.em)
      const desde = new Date(o.enviadoEm ?? p.criadoEm)
      r.push({ quando, unidade: p.unidade, aprovado: o.estado === "aprovado", dias: Math.max(0, (quando.getTime() - desde.getTime()) / DIA) })
    } else if (p.etapa === "cancelada" && p.canceladoMotivo === "orçamento recusado") {
      const ultimo = p.historico.at(-1)
      r.push({ quando: new Date(ultimo && ultimo.texto !== "Pedido recebido" ? ultimo.em : new Date(p.criadoEm).getTime() + 2 * DIA), unidade: p.unidade, aprovado: false })
    }
  }
  return r
}

export type Fontes = { pedidos: Pedido[]; lancamentos: Lancamento[]; agendamentos: Agendamento[]; movimentacoes: Movimentacao[]; produtos: Produto[] }

export type Indicador = {
  id: IdIndicador; rotulo: string; curto: string
  /** Como entra numa frase ("Sem dados de {OS concluídas}…"). */ frase: string
  /** "soma": total no período; "media": média dos fatos (não a média dos dias). */
  agrega: "soma" | "media"
  formato: "moeda" | "numero" | "dias" | "percentual"
  /** Subir é bom? (pinta a variação) */ sobeBom: boolean
  /** É do financeiro (o papel financeiro vê só estes). */ financeiro: boolean
  cor: string
  fatos: (f: Fontes, ref: Date) => Fato[]
}

export const INDICADORES: Indicador[] = [
  { id: "faturamento", rotulo: "Faturamento", curto: "Faturamento", frase: "faturamento", agrega: "soma", formato: "moeda", sobeBom: true, financeiro: true, cor: "var(--chart-1)",
    fatos: ({ lancamentos }) => lancamentos.filter((l) => l.natureza === "receber" && l.estado === "pago" && l.pagoEm && !l.estornoDe)
      .map((l) => ({ quando: new Date(l.pagoEm!), unidade: l.unidade, valor: l.valor })) },
  { id: "ticket", rotulo: "Ticket médio", curto: "Ticket", frase: "ticket médio", agrega: "media", formato: "moeda", sobeBom: true, financeiro: true, cor: "var(--chart-2)",
    fatos: ({ lancamentos }) => lancamentos.filter((l) => l.natureza === "receber" && l.estado === "pago" && l.pagoEm && !l.estornoDe)
      .map((l) => ({ quando: new Date(l.pagoEm!), unidade: l.unidade, valor: l.valor })) },
  { id: "concluidas", rotulo: "OS concluídas", curto: "Concluídas", frase: "OS concluídas", agrega: "soma", formato: "numero", sobeBom: true, financeiro: false, cor: "var(--chart-3)",
    fatos: ({ pedidos }, ref) => pedidos.filter((p) => p.tipo === "os").flatMap((p) => { const q = concluidaEm(p, ref); return q ? [{ quando: q, unidade: p.unidade, valor: 1 }] : [] }) },
  { id: "tempo", rotulo: "Tempo até aprovação", curto: "Até aprovar", frase: "orçamento aprovado", agrega: "media", formato: "dias", sobeBom: false, financeiro: false, cor: "var(--chart-4)",
    fatos: ({ pedidos }) => decisoes(pedidos).filter((d) => d.aprovado && d.dias !== undefined).map((d) => ({ quando: d.quando, unidade: d.unidade, valor: d.dias! })) },
  { id: "aprovacao", rotulo: "Taxa de aprovação", curto: "Aprovação", frase: "orçamento decidido", agrega: "media", formato: "percentual", sobeBom: true, financeiro: false, cor: "var(--chart-5)",
    fatos: ({ pedidos }) => decisoes(pedidos).map((d) => ({ quando: d.quando, unidade: d.unidade, valor: d.aprovado ? 1 : 0 })) },
]
export const indicadorPorId = (id: string) => INDICADORES.find((i) => i.id === id) ?? INDICADORES[0]

const dentro = (q: Date, de: Date, ate: Date) => q >= de && q < somaDias(ate, 1)
/** O valor de um conjunto de fatos: soma, ou média (NaN quando não há fato: o gráfico deixa o buraco). */
export function agregar(ind: Indicador, fatos: Fato[]) {
  if (ind.agrega === "soma") return fatos.reduce((s, f) => s + f.valor, 0)
  return fatos.length ? fatos.reduce((s, f) => s + f.valor, 0) / fatos.length : NaN
}

export type Serie = { valores: number[]; total: number; n: number }
export function serie(ind: Indicador, fatos: Fato[], j: Janela, unidade: FiltroUnidade, semanal = semanalPara(ind, j)): Serie {
  const daUnidade = unidade === "todas" ? fatos : fatos.filter((f) => f.unidade === unidade)
  const naJanela = daUnidade.filter((f) => dentro(f.quando, j.de, j.ate))
  const valores = baldes(j, semanal).map((b) => agregar(ind, naJanela.filter((f) => dentro(f.quando, b.de, b.ate))))
  return { valores, total: agregar(ind, naJanela), n: naJanela.length }
}

// ---------- eventos no gráfico: feriados e campanhas ----------
// BASE: não há coleção de campanhas (seria do Site ou das Configurações); a campanha fica aqui, como dado do negócio.
export const CAMPANHAS = [{ id: "verao", de: "2026-11-03", ate: "2026-11-14", rotulo: "Limpeza antes do verão" }]
export type EventoGrafico = { id: string; tipo: "marco" | "faixa"; de: number; ate: number; rotulo: string }
/** Eventos dentro da janela, como índices dos baldes. */
export function eventos(j: Janela, semanal = porSemana(j)): EventoGrafico[] {
  const bs = baldes(j, semanal)
  const indice = (d: Date) => bs.findIndex((b) => dentro(d, b.de, b.ate))
  const r: EventoGrafico[] = []
  for (const [dia, nome] of Object.entries(FERIADOS)) {
    const i = indice(lerDia(dia)!)
    if (i >= 0) r.push({ id: `f-${dia}`, tipo: "marco", de: i, ate: i, rotulo: nome === "Dia da Consciência Negra" ? "Consciência Negra" : nome })
  }
  for (const c of CAMPANHAS) {
    const a = lerDia(c.de)!, b = lerDia(c.ate)!
    if (b < j.de || a > j.ate) continue
    r.push({ id: c.id, tipo: "faixa", de: Math.max(0, indice(a < j.de ? j.de : a)), ate: indice(b > j.ate ? j.ate : b), rotulo: c.rotulo })
  }
  return r
}

// ---------- operação no período: agenda e estoque ----------
export function operacao(f: Fontes, j: Janela, unidade: FiltroUnidade) {
  const u = (x: { unidade?: Unidade }) => unidade === "todas" || x.unidade === unidade
  const unidadeDoRecurso = (id: string) => RECURSOS.find((r) => r.id === id)?.unidade
  const ags = f.agendamentos.filter((a) => dentro(new Date(a.inicio), j.de, j.ate) && u({ unidade: unidadeDoRecurso(a.recursoId) }))
  const realizadas = ags.filter((a) => a.estado === "concluido" || a.estado === "em_atendimento").length
  const faltas = ags.filter((a) => a.estado === "faltou").length
  const contam = realizadas + faltas
  const movs = f.movimentacoes.filter((m) => (m.tipo === "saida_venda" || m.tipo === "saida_os") && dentro(new Date(m.em), j.de, j.ate) && u(m))
  const saidas = movs.reduce((s, m) => s + Math.abs(m.qtd), 0)
  const repor = f.produtos.filter((p) => p.ativo && (unidade === "todas" ? p.saldo.pampulha + p.saldo.contagem : p.saldo[unidade]) <= p.minimo)
  return { realizadas, faltas, comparecimento: contam ? realizadas / contam : 0, saidas, nMovs: movs.length, repor: repor.length, nProdutos: f.produtos.filter((p) => p.ativo).length }
}

// ---------- técnicos ----------
export type LinhaTecnico = { id: string; nome: string; unidade: Unidade; concluidas: number; horas: number; visitas: number; retrabalho: number }
export function produtividade(f: Fontes, j: Janela, unidade: FiltroUnidade, ref: Date): LinhaTecnico[] {
  return RECURSOS.filter((r) => r.id !== "bancada-pampulha" && (unidade === "todas" || r.unidade === unidade)).map((r) => {
    const minhas = f.pedidos.filter((p) => p.tipo === "os" && p.responsavelId === r.id)
    const feitas = minhas.filter((p) => { const q = concluidaEm(p, ref); return q && dentro(q, j.de, j.ate) })
    const ags = f.agendamentos.filter((a) => a.recursoId === r.id && (a.estado === "concluido" || a.estado === "em_atendimento") && dentro(new Date(a.inicio), j.de, j.ate))
    const horas = ags.reduce((s, a) => s + (new Date(a.fim).getTime() - new Date(a.inicio).getTime()) / 36e5, 0)
    // retrabalho: OS nova do mesmo cliente e serviço aberta até 90 dias depois de uma que este técnico concluiu
    const retrabalho = feitas.filter((p) => {
      const q = concluidaEm(p, ref)!
      return f.pedidos.some((o) => o.id !== p.id && o.clienteId === p.clienteId && o.servicoSlug === p.servicoSlug
        && new Date(o.criadoEm) > q && new Date(o.criadoEm).getTime() - q.getTime() <= EMPRESA.garantiaDias * DIA)
    }).length
    return { id: r.id, nome: r.nome, unidade: r.unidade, concluidas: feitas.length, horas, visitas: ags.length, retrabalho }
  })
}

// ---------- serviços e categorias ----------
export type LinhaServico = { slug: string; nome: string; qtd: number; valor: number; anterior: number; participacao: number; valores: number[] }
export function porServico(f: Fontes, j: Janela, unidade: FiltroUnidade, ref: Date): LinhaServico[] {
  const ant = janelaAnterior(j)
  const os = f.pedidos.filter((p) => p.tipo === "os" && (unidade === "todas" || p.unidade === unidade))
  const feitas = (de: Date, ate: Date) => os.flatMap((p) => { const q = concluidaEm(p, ref); return q && dentro(q, de, ate) ? [{ p, q }] : [] })
  const atual = feitas(j.de, j.ate), antes = feitas(ant.de, ant.ate)
  const total = atual.reduce((s, x) => s + x.p.total, 0)
  return SERVICOS.map((s) => {
    const meus = atual.filter((x) => x.p.servicoSlug === s.slug)
    const valor = meus.reduce((t, x) => t + x.p.total, 0)
    return {
      slug: s.slug, nome: s.nome, qtd: meus.length, valor,
      anterior: antes.filter((x) => x.p.servicoSlug === s.slug).reduce((t, x) => t + x.p.total, 0),
      participacao: total ? valor / total : 0,
      valores: baldes(j).map((b) => meus.filter((x) => dentro(x.q, b.de, b.ate)).reduce((t, x) => t + x.p.total, 0)),
    }
  }).sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome))
}

export type LinhaCategoria = { categoria: string; qtd: number; valor: number; participacao: number }
export function porCategoria(f: Fontes, j: Janela, unidade: FiltroUnidade, categorias: string[]): LinhaCategoria[] {
  const preco = new Map(f.produtos.map((p) => [p.id, p]))
  const vendas = f.movimentacoes.filter((m) => m.tipo === "saida_venda" && dentro(new Date(m.em), j.de, j.ate) && (unidade === "todas" || m.unidade === unidade))
  const linhas = categorias.map((c) => {
    const daCat = vendas.filter((m) => preco.get(m.sku)?.categoria === c)
    return { categoria: c, qtd: daCat.reduce((s, m) => s + Math.abs(m.qtd), 0), valor: daCat.reduce((s, m) => s + Math.abs(m.qtd) * (preco.get(m.sku)?.preco ?? 0), 0), participacao: 0 }
  })
  const total = linhas.reduce((s, l) => s + l.valor, 0)
  return linhas.map((l) => ({ ...l, participacao: total ? l.valor / total : 0 })).sort((a, b) => b.valor - a.valor)
}

/** Rótulo do período para frases: "16/10 a 14/11". */
export const textoJanela = (j: Janela) => `${dm(j.de)} a ${dm(j.ate)}`
export const dm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
export { chaveDia }
