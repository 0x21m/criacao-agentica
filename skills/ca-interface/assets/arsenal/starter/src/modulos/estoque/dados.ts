// Módulo Estoque · coleções `produtos`, `movimentacoes` e `compras` (especificação 3.4 e 5.6).
// Os registros dos roteiros têm id fixo: FLT-0912 (o técnico busca), AC-9999 (pior caso: nome longo, zero nas duas
// unidades), PEC-0730 (compressor esgotado que a OS-1044 espera pela CMP-0007). O resto sai da semente da coleção.
// Estoque é pessimista (EST-21): ajuste, transferência, envio e recebimento só valem depois da resposta; gerar a compra
// dos baixos é otimista com Desfazer. Receber uma compra tira de "Aguardando peça" a OS que esperava a peça.
import { acao, colecao, evento, mudarComoOutraPonta, type Aleatorio, type Evento, type Resultado } from "@/proto/dados"
import { agora, nov, DIA } from "@/proto/relogio"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { pessoaAtual } from "@/proto/permissoes"
import { ETAPA_OS, type EstadoCompra } from "@/proto/projecao"
import { pedidos } from "@/modulos/pedidos/dados"

// ---------- tipos (3.4) ----------
export type Categoria = "Aparelhos" | "Peças" | "Filtros e limpeza" | "Elétrica" | "Ferragens"
export const CATEGORIAS: Categoria[] = ["Aparelhos", "Peças", "Filtros e limpeza", "Elétrica", "Ferragens"]
export const UNIDADES_ESTOQUE: Unidade[] = ["pampulha", "contagem"]

export type Produto = {
  id: string; nome: string; categoria: Categoria
  preco: number; custo: number
  saldo: Record<Unidade, number>; reservado: number; minimo: number
  vendavelOnline: boolean; ativo: boolean
  /** Clientes que pediram "Avise-me" no site. */ avisame: number
  versao: number; historico: Evento[]
}
export type TipoMov = "entrada" | "saida_venda" | "saida_os" | "ajuste" | "transferencia"
/** Imutável: correção é outro ajuste. */
export type Movimentacao = { id: string; sku: string; unidade: Unidade; tipo: TipoMov; qtd: number; motivo?: string; ref?: string; por: string; em: string }
export type { EstadoCompra }
export type ItemCompra = { sku: string; qtd: number; custo: number; recebido: number }
export type Compra = {
  id: string; fornecedor: string; unidade: Unidade; itens: ItemCompra[]; estado: EstadoCompra; previsao: string
  /** Peças reservadas para OS em "Aguardando peça": ao receber, a OS volta para Em execução. */
  reservas: { osId: string; sku: string; qtd: number }[]
  criadoEm: string; motivoCancelamento?: string; versao: number; historico: Evento[]
}

// Os selos da compra (COMPRA, COMPRA_ATRASADA) estão na projecao.ts da base.
export const TIPO_MOV: Record<TipoMov, string> = {
  entrada: "Entrada", saida_venda: "Saída por venda", saida_os: "Saída para OS", ajuste: "Ajuste", transferencia: "Transferência",
}
export const MOTIVOS_AJUSTE = ["Contagem do inventário", "Avaria", "Perda ou extravio", "Devolução de cliente", "Uso interno", "Correção de lançamento"] as const

const dm = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

// ---------- semente: produtos ----------
type Situacao = "ok" | "baixo" | "esgotado" | "inativo"
// sku, nome, categoria, preço, custo, mínimo, situação na semente
type F = [string, string, Categoria, number, number, number, Situacao]
const CATALOGO: F[] = [
  ["AC-9999", "Ar-condicionado Split Inverter Hi-Wall 30.000 BTU Quente e Frio 220 V Classe A com Wi-Fi", "Aparelhos", 6490, 4870, 1, "esgotado"],
  ["AC-1209", "Split Inverter 9.000 BTU Frio 220 V", "Aparelhos", 2199, 1650, 2, "ok"],
  ["AC-1212", "Split Inverter 12.000 BTU Frio 220 V", "Aparelhos", 2599, 1950, 2, "ok"],
  ["AC-1218", "Split Inverter 18.000 BTU Frio 220 V", "Aparelhos", 3699, 2780, 1, "ok"],
  ["AC-1224", "Split Inverter 24.000 BTU Quente e Frio 220 V", "Aparelhos", 4599, 3460, 1, "ok"],
  ["VEN-0410", "Ventilador de parede 50 cm", "Aparelhos", 289, 178, 3, "ok"],
  ["CTN-0210", "Cortina de ar 90 cm", "Aparelhos", 899, 612, 1, "ok"],
  ["PEC-0412", "Placa eletrônica universal para split", "Peças", 890, 520, 3, "baixo"],
  ["PEC-0108", "Gás refrigerante R410A (carga de 1 kg)", "Peças", 120, 68, 6, "ok"],
  ["PEC-0730", "Compressor rotativo 18.000 BTU 220 V", "Peças", 1890, 1320, 1, "esgotado"],
  ["PEC-0215", "Capacitor 35 + 5 µF", "Peças", 45, 18, 8, "ok"],
  ["PEC-0220", "Capacitor 25 µF", "Peças", 38, 15, 8, "ok"],
  ["PEC-0301", "Sensor de temperatura NTC 10k", "Peças", 35, 12, 6, "ok"],
  ["PEC-0505", "Motor do ventilador da condensadora", "Peças", 420, 260, 2, "baixo"],
  ["PEC-0610", "Válvula de serviço 1/4\"", "Peças", 48, 20, 6, "ok"],
  ["PEC-0820", "Tubo de cobre 1/4\" (rolo de 15 m)", "Peças", 389, 268, 2, "ok"],
  ["PEC-0821", "Tubo de cobre 3/8\" (rolo de 15 m)", "Peças", 489, 338, 3, "baixo"],
  ["PEC-0901", "Controle remoto universal para split", "Peças", 79, 32, 5, "ok"],
  ["PEC-0950", "Suporte de condensadora 400 mm (par)", "Peças", 119, 58, 4, "ok"],
  ["FLT-0912", "Filtro de ar lavável para split 12.000 BTU", "Filtros e limpeza", 59, 22, 6, "ok"],
  ["FLT-0909", "Filtro de ar lavável para split 9.000 BTU", "Filtros e limpeza", 49, 18, 6, "ok"],
  ["FLT-0918", "Filtro de ar lavável para split 18.000 BTU", "Filtros e limpeza", 69, 27, 6, "baixo"],
  ["FLT-0930", "Filtro HEPA para purificador", "Filtros e limpeza", 129, 60, 4, "ok"],
  ["LMP-0101", "Limpador de serpentina (galão de 5 L)", "Filtros e limpeza", 149, 78, 4, "ok"],
  ["LMP-0102", "Bactericida para ar-condicionado 500 ml", "Filtros e limpeza", 39, 14, 10, "baixo"],
  ["LMP-0110", "Bolsa coletora para limpeza de split", "Filtros e limpeza", 189, 104, 3, "ok"],
  ["LMP-0120", "Escova para serpentina", "Filtros e limpeza", 29, 10, 6, "ok"],
  ["LMP-0130", "Lavadora de alta pressão 1.800 W", "Filtros e limpeza", 899, 640, 1, "esgotado"],
  ["ELE-0110", "Disjuntor bipolar 25 A", "Elétrica", 49, 21, 8, "ok"],
  ["ELE-0120", "Disjuntor DR 40 A 30 mA", "Elétrica", 189, 115, 4, "baixo"],
  ["ELE-0201", "Tomada 20 A 2P+T (caixa com 10)", "Elétrica", 129, 62, 3, "ok"],
  ["ELE-0310", "Cabo flexível 2,5 mm² (rolo de 100 m)", "Elétrica", 289, 198, 2, "ok"],
  ["ELE-0311", "Cabo flexível 4 mm² (rolo de 100 m)", "Elétrica", 459, 320, 2, "ok"],
  ["ELE-0400", "Quadro de distribuição para 12 disjuntores", "Elétrica", 159, 88, 2, "ok"],
  ["ELE-0510", "Interruptor bipolar", "Elétrica", 19, 7, 10, "ok"],
  ["ELE-0610", "Fita isolante 20 m", "Elétrica", 9, 3, 12, "ok"],
  ["ELE-0700", "Protetor contra surtos DPS 275 V", "Elétrica", 89, 42, 4, "ok"],
  ["FER-0101", "Bucha de nylon 8 mm (cento)", "Ferragens", 18, 7, 5, "inativo"],
  ["FER-0102", "Parafuso 4,5 × 45 mm (cento)", "Ferragens", 24, 9, 5, "inativo"],
  ["PEC-0960", "Mangueira de dreno 1/2\" (rolo de 10 m)", "Peças", 39, 15, 4, "ok"],
  ["ELE-0800", "Tomada de embutir para ar-condicionado 20 A", "Elétrica", 32, 13, 6, "ok"],
]
/** Saldo fixo dos registros dos roteiros: [pampulha, contagem, reservado]. */
const SALDO_FIXO: Record<string, [number, number, number]> = {
  "FLT-0912": [9, 5, 0], "PEC-0412": [1, 1, 1], "PEC-0108": [7, 4, 1], "PEC-0730": [0, 0, 0], "AC-9999": [0, 0, 0],
}
const sis = (em: Date, texto: string): Evento => ({ em: em.toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto })

function semearProdutos(r: Aleatorio): Produto[] {
  return CATALOGO.map(([id, nome, categoria, preco, custo, minimo, sit]) => {
    let [pampulha, contagem, reservado] = SALDO_FIXO[id] ?? [0, 0, 0]
    if (!SALDO_FIXO[id]) {
      if (sit === "baixo") { const t = r.entre(1, minimo); pampulha = Math.ceil(t / 2); contagem = t - pampulha }
      else if (sit === "ok") {
        // aparelho é caro e sai pouco: poucas unidades; o resto, de 1,5 a 4 vezes o mínimo
        const t = categoria === "Aparelhos" ? r.entre(minimo + 1, minimo + 3) : r.entre(minimo + 2, minimo * 4)
        pampulha = Math.round(t * (0.5 + r.proximo() * 0.3)); contagem = t - pampulha
        reservado = r.chance(0.25) ? r.entre(1, Math.min(3, t - 1)) : 0
      }
    }
    return {
      id, nome, categoria, preco, custo, saldo: { pampulha, contagem }, reservado, minimo,
      vendavelOnline: categoria !== "Peças" && sit !== "inativo", ativo: sit !== "inativo",
      avisame: id === "AC-9999" ? 4 : id === "LMP-0130" ? 1 : 0, versao: 1,
      historico: [sis(nov(2, 9), "Produto cadastrado"), ...(sit === "inativo" ? [sis(nov(9, 14), "Saiu de linha")] : [])],
    }
  })
}
export const produtos = colecao<Produto>("produtos", semearProdutos, 1, { caminho: (p) => `estoque/?id=${p.id}` })

// ---------- semente: movimentações (120, últimos 30 dias) ----------
const PESSOAS_MOV = ["Ana Lima", "Carla Mota", "Marina Duarte", "Bruno Sá", "Diego Reis", "Elisa Rocha", "Sistema"]
function semearMovimentacoes(r: Aleatorio): Movimentacao[] {
  const ativos = CATALOGO.filter((c) => c[6] !== "inativo").map((c) => c[0])
  const tipos: TipoMov[] = ["saida_venda", "saida_venda", "saida_venda", "saida_venda", "saida_os", "saida_os", "saida_os", "entrada", "entrada", "ajuste"]
  const lista: Movimentacao[] = []
  for (let n = 0; n < 118; n++) {
    const tipo = n % 23 === 7 ? "transferencia" : r.pega(tipos)
    const sku = r.pega(ativos)
    const unidade: Unidade = r.chance(0.62) ? "pampulha" : "contagem"
    const em = new Date(nov(16, 9).getTime() - r.entre(1, 30 * 24 * 60) * 6e4)
    const qtd = tipo === "entrada" ? r.entre(4, 24) : tipo === "ajuste" ? (r.chance(0.6) ? -1 : 1) * r.entre(1, 3) : -r.entre(1, 3)
    const ref = tipo === "saida_venda" ? `PED-${r.entre(2150, 2209)}` : tipo === "saida_os" ? `OS-${r.entre(1010, 1048)}` : tipo === "entrada" ? `CMP-000${r.entre(3, 5)}` : undefined
    if (tipo === "transferencia") {
      const para: Unidade = unidade === "pampulha" ? "contagem" : "pampulha"
      const q = r.entre(1, 4)
      const por = r.pega(PESSOAS_MOV.slice(0, 3))
      lista.push({ id: "", sku, unidade, tipo, qtd: -q, ref: `para ${UNIDADES[para].nome}`, por, em: em.toISOString() })
      lista.push({ id: "", sku, unidade: para, tipo, qtd: q, ref: `de ${UNIDADES[unidade].nome}`, por, em: em.toISOString() })
      continue
    }
    lista.push({
      id: "", sku, unidade, tipo, qtd, ref, em: em.toISOString(),
      motivo: tipo === "ajuste" ? r.pega(MOTIVOS_AJUSTE) : undefined,
      por: tipo === "entrada" ? r.pega(["Marina Duarte", "Carla Mota"]) : tipo === "saida_os" ? r.pega(["Bruno Sá", "Diego Reis", "Elisa Rocha"]) : r.pega(PESSOAS_MOV),
    })
  }
  return lista.slice(0, 120).sort((a, b) => b.em.localeCompare(a.em)).map((m, i, l) => ({ ...m, id: `MOV-${1000 + l.length - i}` }))
}
export const movimentacoes = colecao<Movimentacao>("movimentacoes", semearMovimentacoes)

// ---------- semente: compras (6) ----------
export const FORNECEDOR: Record<Categoria, string> = {
  Aparelhos: "Refrigeração Minas Distribuidora", Peças: "Refrigeração Minas Distribuidora", "Filtros e limpeza": "Frio Center Peças",
  Elétrica: "Elétrica Contorno Materiais", Ferragens: "Casa do Parafuso BH",
}
function semearCompras(): Compra[] {
  const c = (id: string, fornecedor: string, unidade: Unidade, estado: EstadoCompra, criado: Date, previsao: Date, itens: [string, number, number, number][], extra: Partial<Compra> = {}): Compra => {
    const historico = [sis(criado, "Compra criada em rascunho")]
    if (estado !== "rascunho") historico.push({ em: new Date(criado.getTime() + 2 * 36e5).toISOString(), quem: { tipo: "pessoa", nome: "Marina Duarte" }, texto: `Enviada ao fornecedor. Previsão ${dm(previsao.toISOString())}` })
    if (estado === "recebida" || estado === "recebida_parcial") historico.push({ em: previsao.toISOString(), quem: { tipo: "pessoa", nome: "Carla Mota" }, texto: estado === "recebida" ? "Recebida inteira" : "Recebida em parte" })
    return {
      id, fornecedor, unidade, estado, criadoEm: criado.toISOString(), previsao: previsao.toISOString(), reservas: [], versao: 1, historico,
      itens: itens.map(([sku, qtd, custo, recebido]) => ({ sku, qtd, custo, recebido })), ...extra,
    }
  }
  return [
    c("CMP-0008", FORNECEDOR["Filtros e limpeza"], "pampulha", "rascunho", nov(16, 8, 10), nov(20, 12), [["FLT-0918", 20, 27, 0], ["LMP-0102", 24, 14, 0]]),
    c("CMP-0007", FORNECEDOR.Peças, "contagem", "enviada", nov(12, 10), nov(19, 12), [["PEC-0730", 1, 1320, 0], ["PEC-0412", 3, 520, 0]], {
      reservas: [{ osId: "OS-1044", sku: "PEC-0730", qtd: 1 }],
      // o fornecedor atrasou: a previsão era 16/11 (a OS-1044 mostra a mesma história)
    }),
    c("CMP-0006", FORNECEDOR.Elétrica, "pampulha", "enviada", nov(13, 15), nov(18, 12), [["ELE-0120", 6, 115, 0], ["ELE-0110", 10, 21, 0]]),
    c("CMP-0005", FORNECEDOR.Peças, "pampulha", "recebida_parcial", nov(5, 9), nov(12, 12), [["PEC-0821", 4, 338, 2], ["PEC-0505", 2, 260, 0]]),
    c("CMP-0004", FORNECEDOR.Elétrica, "pampulha", "recebida", nov(3, 11), nov(6, 15), [["ELE-0310", 3, 198, 3], ["ELE-0201", 4, 62, 4], ["ELE-0610", 20, 3, 20]]),
    c("CMP-0003", FORNECEDOR["Filtros e limpeza"], "contagem", "recebida", nov(2, 9), nov(4, 10), [["FLT-0912", 12, 22, 12], ["FLT-0909", 12, 18, 12], ["LMP-0101", 4, 78, 4]]),
  ]
}
export const compras = colecao<Compra>("compras", () => semearCompras(), 1, { caminho: (c) => `estoque/compras/?id=${c.id}` })

// ---------- leituras derivadas ----------
export type EstadoProduto = "disponivel" | "baixo" | "esgotado" | "inativo"
export const saldoTotal = (p: Produto) => p.saldo.pampulha + p.saldo.contagem
/** Estado derivado (3.4): inativo; esgotado = 0; baixo ≤ mínimo; disponível acima do mínimo. */
export function estadoDoProduto(p: Produto): EstadoProduto {
  if (!p.ativo) return "inativo"
  const t = saldoTotal(p)
  return t === 0 ? "esgotado" : t <= p.minimo ? "baixo" : "disponivel"
}
export const precisaRepor = (p: Produto) => { const e = estadoDoProduto(p); return e === "baixo" || e === "esgotado" }
export const compraAberta = (c: Compra) => c.estado === "rascunho" || c.estado === "enviada" || c.estado === "recebida_parcial"
/** A compra a caminho (enviada ou parcial) que traz este SKU, a de previsão mais próxima. */
export function compraDoProduto(sku: string, lista: Compra[] = compras.ler()) {
  return lista.filter((c) => (c.estado === "enviada" || c.estado === "recebida_parcial") && c.itens.some((i) => i.sku === sku && i.recebido < i.qtd))
    .sort((a, b) => a.previsao.localeCompare(b.previsao))[0]
}
/** Contexto do selo do produto: saldo e mínimo; no esgotado, a compra e a previsão. */
export function ctxDoProduto(p: Produto, lista?: Compra[]) {
  const c = estadoDoProduto(p) === "esgotado" ? compraDoProduto(p.id, lista) : undefined
  return { valor: saldoTotal(p), versao: p.minimo, id: c?.id, previsao: c?.previsao }
}
export const faltaReceber = (c: Compra) => c.itens.reduce((s, i) => s + Math.max(0, i.qtd - i.recebido), 0)
export const totalDaCompra = (c: Compra) => c.itens.reduce((s, i) => s + i.qtd * i.custo, 0)
export const compraAtrasada = (c: Compra, ref = agora()) => (c.estado === "enviada" || c.estado === "recebida_parcial") && new Date(c.previsao).getTime() < ref.getTime() - 12 * 36e5
export function ctxDaCompra(c: Compra) {
  const recebida = [...c.historico].reverse().find((e) => e.texto.startsWith("Recebida"))
  return { previsao: c.previsao, valor: faltaReceber(c), quando: recebida?.em, motivo: c.motivoCancelamento }
}
/** Valor do estoque a preço de custo (só para quem pode ver custo). */
export const valorEmEstoque = (lista: Produto[]) => lista.filter((p) => p.ativo).reduce((s, p) => s + saldoTotal(p) * p.custo, 0)

// ---------- ações ----------
const quem = () => pessoaAtual().nome
let seqMov = 0
/** Id de movimentação novo (único mesmo com várias ações em paralelo no ajuste em lote). */
function novoIdMov(lista: Movimentacao[]) {
  const maior = Math.max(1000, ...lista.map((m) => Number(m.id.slice(4)) || 0))
  seqMov = Math.max(seqMov, maior) + 1
  return `MOV-${seqMov}`
}
const sinal = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0")

/** Ajusta o saldo de uma unidade para a quantidade contada (P). Cria a movimentação "ajuste" com o motivo. */
/** `silenciosa`: no lote, a sheet mostra "2 de 5 ajustados" no lugar (sem um toast por item). */
export function ajustarSaldo(p: Produto, unidade: Unidade, novoSaldo: number, motivo: string, silenciosa = false): Promise<Resultado> {
  const delta = novoSaldo - p.saldo[unidade]
  return acao({
    rotulo: `ajustar o saldo de ${p.id}`, modo: "pessimista", capacidade: "estoque_movimentar", ids: [p.id], silenciosa,
    conferir: { colecao: produtos, id: p.id, versao: p.versao },
    aplicar: (d) => {
      const x = d(produtos).find((y) => y.id === p.id)
      if (!x) return
      x.saldo[unidade] = novoSaldo
      x.historico.push(evento(`Ajuste em ${UNIDADES[unidade].nome}: ${sinal(delta)} (${motivo})`))
      const movs = d(movimentacoes)
      movs.unshift({ id: novoIdMov(movs), sku: p.id, unidade, tipo: "ajuste", qtd: delta, motivo, por: quem(), em: agora().toISOString() })
    },
  })
}

/** Transfere entre unidades (P): duas movimentações, saída numa e entrada na outra. */
export function transferir(p: Produto, de: Unidade, para: Unidade, qtd: number): Promise<Resultado> {
  return acao({
    rotulo: `transferir ${p.id} para ${UNIDADES[para].nome}`, modo: "pessimista", capacidade: "estoque_movimentar", ids: [p.id],
    conferir: { colecao: produtos, id: p.id, versao: p.versao },
    aplicar: (d) => {
      const x = d(produtos).find((y) => y.id === p.id)
      if (!x) return
      x.saldo[de] -= qtd; x.saldo[para] += qtd
      x.historico.push(evento(`Transferência: ${qtd} de ${UNIDADES[de].nome} para ${UNIDADES[para].nome}`))
      const movs = d(movimentacoes), em = agora().toISOString(), por = quem()
      movs.unshift({ id: novoIdMov(movs), sku: p.id, unidade: de, tipo: "transferencia", qtd: -qtd, ref: `para ${UNIDADES[para].nome}`, por, em })
      movs.unshift({ id: novoIdMov(movs), sku: p.id, unidade: para, tipo: "transferencia", qtd, ref: `de ${UNIDADES[de].nome}`, por, em })
    },
    sucesso: `${qtd} ${qtd === 1 ? "unidade transferida" : "unidades transferidas"} para ${UNIDADES[para].nome}.`,
  })
}

/** Muda o custo de compra (O com Desfazer). Pede "ver custo": quem não vê o custo não muda o custo. */
export function mudarCusto(p: Produto, custo: number) {
  const anterior = p.custo
  if (!Number.isFinite(custo) || custo < 0 || custo === anterior) return
  return acao({
    rotulo: `mudar o custo de ${p.id}`, capacidade: "ver_custo", ids: [p.id],
    aplicar: (d) => { const x = d(produtos).find((y) => y.id === p.id); if (x) { x.custo = custo; x.historico.push(evento(`Custo: ${moedaCurta(anterior)} → ${moedaCurta(custo)}`)) } },
    desfazer: (d) => { const x = d(produtos).find((y) => y.id === p.id); if (x) x.custo = anterior },
    sucesso: `Custo de ${p.id} alterado.`,
  })
}
const moedaCurta = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

/** Quanto comprar para voltar a 2 vezes o mínimo (pelo menos 1). */
export const sugestaoDeCompra = (p: Produto) => Math.max(1, p.minimo * 2 - saldoTotal(p))
const proximoIdCompra = (lista: Compra[]) => `CMP-${String(Math.max(8, ...lista.map((c) => Number(c.id.slice(4)) || 0)) + 1).padStart(4, "0")}`

/**
 * Gera compras em rascunho com os itens abaixo do mínimo que ainda não têm compra aberta, uma por fornecedor (O com
 * Desfazer). Devolve os ids criados (vazio: nada a comprar).
 */
export function gerarCompraDosBaixos(): string[] {
  const abertas = compras.ler().filter(compraAberta)
  const jaPedidos = new Set(abertas.flatMap((c) => c.itens.map((i) => i.sku)))
  const faltam = produtos.ler().filter((p) => precisaRepor(p) && !jaPedidos.has(p.id))
  if (!faltam.length) return []
  const porFornecedor = new Map<string, Produto[]>()
  // uma compra por fornecedor e unidade: o item vai para a unidade onde está mais perto de faltar
  const unidadeQueFalta = (p: Produto): Unidade => (p.saldo.contagem < p.saldo.pampulha ? "contagem" : "pampulha")
  for (const p of faltam) { const k = `${FORNECEDOR[p.categoria]}|${unidadeQueFalta(p)}`; porFornecedor.set(k, [...(porFornecedor.get(k) ?? []), p]) }
  const novas: Compra[] = []
  let base = compras.ler()
  for (const [chave, itens] of porFornecedor) {
    const [fornecedor, unidade] = chave.split("|") as [string, Unidade]
    const id = proximoIdCompra(base)
    const c: Compra = {
      id, fornecedor, unidade, estado: "rascunho", criadoEm: agora().toISOString(),
      previsao: new Date(agora().getTime() + 4 * DIA).toISOString(), reservas: [], versao: 1,
      itens: itens.map((p) => ({ sku: p.id, qtd: sugestaoDeCompra(p), custo: p.custo, recebido: 0 })),
      historico: [evento(`Gerada com ${itens.length} ${itens.length === 1 ? "item abaixo" : "itens abaixo"} do mínimo`)],
    }
    novas.push(c); base = [c, ...base]
  }
  const ids = novas.map((c) => c.id)
  void acao({
    rotulo: "gerar a compra dos itens baixos", capacidade: "estoque_movimentar", ids,
    aplicar: (d) => { d(compras).unshift(...structuredClone(novas)) },
    desfazer: (d) => { d.trocar(compras, d(compras).filter((c) => !ids.includes(c.id))) },
    sucesso: novas.length === 1 ? `${ids[0]} criada em rascunho com ${novas[0].itens.length} ${novas[0].itens.length === 1 ? "item" : "itens"}.` : `${novas.length} compras criadas em rascunho: ${ids.join(", ")}.`,
  })
  return ids
}

/** Envia ao fornecedor (P): rascunho → enviada, com a previsão de entrega. */
export function enviarCompra(c: Compra, previsao: Date): Promise<Resultado> {
  return acao({
    rotulo: `enviar a ${c.id}`, modo: "pessimista", capacidade: "estoque_movimentar", ids: [c.id],
    conferir: { colecao: compras, id: c.id, versao: c.versao },
    aplicar: (d) => {
      const x = d(compras).find((y) => y.id === c.id)
      if (!x) return
      x.estado = "enviada"; x.previsao = previsao.toISOString()
      x.historico.push(evento(`Enviada ao fornecedor. Previsão ${dm(previsao.toISOString())}`, { de: "rascunho", para: "enviada", eixo: "estado" }))
    },
    sucesso: `${c.id} enviada a ${c.fornecedor}.`,
  })
}

/** Cancela (P, com motivo): vale até enviada. */
export function cancelarCompra(c: Compra, motivo: string): Promise<Resultado> {
  return acao({
    rotulo: `cancelar a ${c.id}`, modo: "pessimista", capacidade: "estoque_movimentar", ids: [c.id],
    conferir: { colecao: compras, id: c.id, versao: c.versao },
    aplicar: (d) => {
      const x = d(compras).find((y) => y.id === c.id)
      if (!x) return
      x.historico.push(evento(`Cancelada: ${motivo}`, { de: x.estado, para: "cancelada", eixo: "estado" }))
      x.estado = "cancelada"; x.motivoCancelamento = motivo
    },
    sucesso: `${c.id} cancelada.`,
  })
}

/** OS que voltam a andar quando esta compra chega (as reservas cujo item fica completo e que ainda esperam peça). */
export function osLiberadas(c: Compra, recebendo: Record<string, number>, lista = pedidos.ler()) {
  return c.reservas.filter((r) => {
    const item = c.itens.find((i) => i.sku === r.sku)
    const os = lista.find((o) => o.id === r.osId)
    return item && os?.etapa === "aguardando_peca" && item.recebido + (recebendo[r.sku] ?? 0) >= item.qtd
  }).map((r) => r.osId)
}

/**
 * Recebe a compra, inteira ou em parte (P). Cada item recebido vira uma movimentação de entrada na unidade da compra;
 * a peça reservada fica reservada para a OS, e a OS que esperava a peça sai de "Aguardando peça" (volta para Em
 * execução), com aviso à gestora no sino e no histórico da OS.
 */
export function receberCompra(c: Compra, recebendo: Record<string, number>): Promise<Resultado> {
  const liberadas = osLiberadas(c, recebendo)
  const total = Object.values(recebendo).reduce((s, n) => s + n, 0)
  return acao({
    rotulo: `receber a ${c.id}`, modo: "pessimista", capacidade: "estoque_movimentar", ids: [c.id, ...liberadas],
    conferir: { colecao: compras, id: c.id, versao: c.versao },
    aplicar: (d) => {
      const x = d(compras).find((y) => y.id === c.id)
      if (!x) return
      const movs = d(movimentacoes), ps = d(produtos), em = agora().toISOString(), por = quem()
      for (const item of x.itens) {
        const q = Math.min(recebendo[item.sku] ?? 0, item.qtd - item.recebido)
        if (q <= 0) continue
        item.recebido += q
        const p = ps.find((y) => y.id === item.sku)
        if (p) {
          p.saldo[x.unidade] += q
          const reservada = x.reservas.filter((r) => r.sku === item.sku && liberadas.includes(r.osId)).reduce((s, r) => s + r.qtd, 0)
          p.reservado += reservada
          p.historico.push(evento(`Entrada: +${q} em ${UNIDADES[x.unidade].nome} (${x.id})${reservada ? `, ${reservada} reservada para ${x.reservas.find((r) => r.sku === item.sku)?.osId}` : ""}`))
          p.versao += 1
        }
        movs.unshift({ id: novoIdMov(movs), sku: item.sku, unidade: x.unidade, tipo: "entrada", qtd: q, ref: x.id, por, em })
      }
      const completa = x.itens.every((i) => i.recebido >= i.qtd)
      const de = x.estado
      x.estado = completa ? "recebida" : "recebida_parcial"
      x.historico.push(evento(completa ? "Recebida inteira" : `Recebida em parte: ${total} ${total === 1 ? "unidade" : "unidades"}`, { de, para: x.estado, eixo: "estado" }))
      // a OS que esperava a peça volta a andar (aguardando_peca → em_execucao)
      const lista = d(pedidos)
      const fim = Math.max(0, ...lista.filter((o) => o.etapa === "em_execucao" || o.etapa === "aprovada").map((o) => o.ordem)) + 1
      for (const osId of liberadas) {
        const o = lista.find((y) => y.id === osId)
        if (!o || o.etapa !== "aguardando_peca") continue
        o.historico.push(evento(`Peça chegou (${x.id}). Etapa: ${ETAPA_OS.aguardando_peca.rotulo} → ${ETAPA_OS.em_execucao.rotulo}`, { de: "aguardando_peca", para: "em_execucao", eixo: "etapa", cliente: true }))
        o.etapa = "em_execucao"; o.ordem = fim
      }
    },
    sucesso: liberadas.length
      ? `${c.id} recebida. ${liberadas.join(", ")} saiu de Aguardando peça; o aviso está no sino.`
      : `${c.id} ${Object.keys(recebendo).length && faltaReceber(c) - total > 0 ? "recebida em parte" : "recebida"}.`,
  })
}

// ---------- simular a outra ponta (D10) ----------
/** O fornecedor avisa que a CMP-0007 atrasa: nova previsão 23/11 (a OS-1044 continua esperando). */
export function fornecedorAtrasa(id = "CMP-0007") {
  mudarComoOutraPonta((d) => {
    const x = d(compras).find((y) => y.id === id)
    if (!x || (x.estado !== "enviada" && x.estado !== "recebida_parcial")) return
    const nova = new Date(new Date(x.previsao).getTime() + 4 * DIA)
    x.historico.push({ em: agora().toISOString(), quem: { tipo: "pessoa", nome: x.fornecedor }, texto: `Fornecedor mudou a previsão: ${dm(x.previsao)} → ${dm(nova.toISOString())}` })
    x.previsao = nova.toISOString()
  }, [id])
}
/** Um cliente pede "Avise-me" no site para um produto esgotado. */
export function clientePedeAviso(sku = "AC-9999") {
  mudarComoOutraPonta((d) => {
    const x = d(produtos).find((y) => y.id === sku)
    if (x) { x.avisame += 1; x.historico.push({ em: agora().toISOString(), quem: { tipo: "cliente", nome: "Cliente do site" }, texto: "Pediu \"Avise-me\" quando chegar" }) }
  }, [sku])
}
/** Quem recebeu a OS de volta, para o sino: compras recebidas hoje que liberaram OS. */
export function liberacoesDeHoje(ref = agora()) {
  const dia = ref.toDateString()
  return pedidos.ler().flatMap((o) => o.historico.filter((e) => e.texto.startsWith("Peça chegou") && new Date(e.em).toDateString() === dia).map((e) => ({ os: o, e })))
}
