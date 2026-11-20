// Módulo Financeiro · coleções `lancamentos` e `caixas` (seção 3.5 da especificação), as contas derivadas (saldo,
// fluxo projetado, grupos por vencimento, caixa do dia) e as ações. Dinheiro é sempre P (pessimista, confere a versão);
// só editar vencimento ou valor de um título em aberto é O com Desfazer.
// Registros fixos dos roteiros: LAN-5012 (OS-1061 do Marcos, a receber hoje), LAN-5021 (PED-2210 da Juliana, Pix
// expirado às 9:20), LAN-5003 (aluguel vencido há 400 dias), LAN-5008 (pago, para estornar), LAN-5030 (folha de 30/11,
// que leva o saldo projetado a −R$ 3.420,00) e o caixa de hoje da Pampulha (R$ 425,00 esperados em dinheiro).
// O Portal (onda B) importa daqui: `gerarPix`, `clientePagaPix`, `cobrancasDoCliente`, `situacao`, `codigoPix`.
import { toast } from "sonner"
import { acao, colecao, consumirRespostaPerdida, evento, mudarComoOutraPonta, proximoId, type Aleatorio, type Evento, type Rascunho, type Resultado } from "@/proto/dados"
import { AGORA_FIXO, agora, chaveDia, DIA, MIN } from "@/proto/relogio"
import { EMPRESA, FERIADOS, UNIDADES, type Unidade } from "@/proto/negocio"
import { LANCAMENTO, LANCAMENTO_A_PAGAR, PAGAMENTO, PIX_EXPIRADO, VENCIDO, type Ctx, type EstadoLancamento, type Projecao } from "@/proto/projecao"
import { pessoaAtual, type Capacidade } from "@/proto/permissoes"
import { gerarLinhaDigitavel } from "@/lib/boleto"
import { clientes } from "@/modulos/clientes/dados"
import { pedidos } from "@/modulos/pedidos/dados"

// ---------- tipos ----------
export type Meio = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "dinheiro"
export const MEIOS: Record<Meio, string> = { pix: "Pix", boleto: "Boleto", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", dinheiro: "Dinheiro" }
export const MEIOS_ORDEM: Meio[] = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto"]
export type Natureza = "receber" | "pagar"

export type Lancamento = {
  id: string
  natureza: Natureza; descricao: string; categoria: string
  valor: number; vencimento: string; unidade: Unidade
  meio?: Meio
  estado: EstadoLancamento
  pixExpiraEm?: string; pixCodigo?: string
  pagoEm?: string; comprovanteId?: string
  /** "OS-1052", "PED-2214", "CMP-0007". */ ref?: string
  clienteId?: string; fornecedor?: string
  linhaDigitavel?: string
  estornoDe?: string; estornadoPor?: string
  motivo?: string
  /** Baixa enviada sem resposta (EST-46): não deixa receber de novo até "Verificar status". */
  envio?: { chave: string; meio: Meio; em: string }
  /** Chaves de idempotência já aceitas (EST-40): o mesmo clique repetido não recebe duas vezes. */
  chaves?: string[]
  versao: number; historico: Evento[]
}

export type Caixa = {
  /** "CX-pampulha-2026-11-16" */ id: string
  data: string; unidade: Unidade
  estado: "aberto" | "fechado"
  saldoInicial: number; abertoPor: string; abertoEm: string
  /** No fechamento: o esperado em dinheiro, o contado, a diferença e os totais dos outros meios. */
  esperado?: number; contado?: number; diferenca?: number; motivo?: string
  porMeio?: Partial<Record<Meio, number>>
  fechadoPor?: string; fechadoEm?: string
  versao: number; historico: Evento[]
}

// ---------- semente ----------
/** Data local (meio-dia) de 2026; mês de 1 a 12. */
const em = (m: number, d: number, h = 12, mi = 0) => new Date(2026, m - 1, d, h, mi)
const sis = (quando: Date, texto: string): Evento => ({ em: quando.toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto })
const pes = (quando: Date, nome: string, texto: string, cliente = false): Evento => ({ em: quando.toISOString(), quem: { tipo: "pessoa", nome }, texto, cliente })
const centavos = (v: number) => Math.round(v * 100) / 100
/** Dia útil para vencimento: domingo e feriado passam para o dia seguinte. */
function diaUtil(d: Date) {
  const x = new Date(d)
  while (x.getDay() === 0 || FERIADOS[chaveDia(x)]) x.setDate(x.getDate() + 1)
  return x
}
/** Identificador fim a fim do Pix (32 caracteres), fixo para o mesmo título e instante. */
export function idE2E(id: string, quando: string) {
  let h = 2166136261
  for (const c of id + quando) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  let s = ""
  for (let i = 0; s.length < 23; i++) { h = Math.imul(h ^ i, 16777619) >>> 0; s += h.toString(36).toUpperCase() }
  return ("E41238576" + s).slice(0, 32)
}
/** O "Pix Copia e Cola" (BR Code de exemplo, no formato EMV do Bacen, sem valor de verdade). */
export function codigoPix(id: string, valor: number, expira: string) {
  const v = valor.toFixed(2)
  const txid = (id.replace(/\W/g, "") + expira.replace(/\D/g, "").slice(8, 12)).slice(0, 25)
  const campo = (tag: string, s: string) => tag + String(s.length).padStart(2, "0") + s
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", EMPRESA.pix)
  const corpo = "000201" + campo("26", conta) + "52040000" + "5303986" + campo("54", v) + "5802BR" + campo("59", "OFICINA NORTE") + campo("60", "BELO HORIZONTE") + campo("62", campo("05", txid)) + "6304"
  let crc = 0xffff
  for (const c of corpo) { crc ^= c.charCodeAt(0) << 8; for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff }
  return corpo + crc.toString(16).toUpperCase().padStart(4, "0")
}

const FORNECEDORES = ["Refrigeração Minas Peças", "Distribuidora Frio Total", "Elétrica Contorno", "Posto Pampulha (combustível)", "Ferragens Vale do Aço", "Papelaria Central"]
const CATEGORIA_FORN: Record<string, string> = { "Posto Pampulha (combustível)": "Combustível", "Papelaria Central": "Escritório" }
const DESCR_RECEBER: [string, string][] = [
  ["limpeza de split", "Serviços"], ["instalação de split", "Serviços"], ["conserto de ar-condicionado", "Serviços"], ["serviço elétrico", "Serviços"],
  ["montagem de móveis", "Serviços"], ["venda de peças no balcão", "Vendas"], ["contrato de manutenção", "Contratos"], ["venda de controle e filtro", "Vendas"],
]

type Base = Omit<Lancamento, "versao" | "historico" | "estado"> & { estado?: EstadoLancamento; historico?: Evento[] }

function semear(r: Aleatorio): Lancamento[] {
  const cli = clientes.semente().filter((c) => c.estado === "ativo" && !["C-0007", "C-0098", "C-0099"].includes(c.id))
  const hoje = AGORA_FIXO
  const fixos: Base[] = []
  const fixo = (b: Base) => fixos.push(b)
  const boleto = (valor: number, venc: Date, tipo: "bancario" | "arrecadacao" = "bancario") => gerarLinhaDigitavel({ tipo, valor, vencimento: venc, sorteio: r.proximo })

  // --- fixos dos roteiros ---
  fixo({ id: "LAN-5003", natureza: "pagar", descricao: "Aluguel da Pampulha · outubro de 2025 (importado)", categoria: "Aluguel", valor: 6800, vencimento: new Date(2025, 9, 12, 12).toISOString(), unidade: "pampulha",
    fornecedor: "Imobiliária Andorinhas", historico: [sis(em(11, 1, 7, 30), "Importado da planilha antiga, sem baixa")] })
  fixo({ id: "LAN-5008", natureza: "receber", descricao: "PED-2198 · kit de limpeza do split", categoria: "Vendas", valor: 189.9, vencimento: em(11, 13).toISOString(), unidade: "pampulha",
    clienteId: "C-0007", ref: "PED-2198", estado: "pago", meio: "pix", pagoEm: em(11, 13, 15, 22).toISOString(), comprovanteId: idE2E("LAN-5008", "1322") })
  fixo({ id: "LAN-5009", natureza: "receber", descricao: "PED-2207 · controle universal", categoria: "Vendas", valor: 160, vencimento: em(11, 16).toISOString(), unidade: "pampulha",
    clienteId: cli[3].id, ref: "PED-2207", estado: "pago", meio: "cartao_debito", pagoEm: em(11, 16, 8, 40).toISOString() })
  fixo({ id: "LAN-5010", natureza: "receber", descricao: "OS-1049 · troca de disjuntor do chuveiro", categoria: "Serviços", valor: 225, vencimento: em(11, 16).toISOString(), unidade: "pampulha",
    clienteId: cli[5].id, ref: "OS-1049", estado: "pago", meio: "dinheiro", pagoEm: em(11, 16, 9, 12).toISOString() })
  fixo({ id: "LAN-5011", natureza: "receber", descricao: "OS-1045 · instalação de tomadas", categoria: "Serviços", valor: 480, vencimento: em(11, 16).toISOString(), unidade: "pampulha",
    clienteId: cli[7].id, ref: "OS-1045", estado: "pago", meio: "pix", pagoEm: em(11, 16, 9, 30).toISOString(), comprovanteId: idE2E("LAN-5011", "0930") })
  fixo({ id: "LAN-5012", natureza: "receber", descricao: "OS-1061 · limpeza de split", categoria: "Serviços", valor: 220, vencimento: em(11, 16).toISOString(), unidade: "pampulha",
    clienteId: "C-0015", ref: "OS-1061", historico: [sis(em(11, 16, 8, 15), "Título criado quando a OS-1061 ficou pronta")] })
  fixo({ id: "LAN-5014", natureza: "receber", descricao: "OS-1048 · troca de tomadas do estúdio", categoria: "Serviços", valor: 390, vencimento: em(11, 18).toISOString(), unidade: "pampulha",
    clienteId: "C-0031", ref: "OS-1048" })
  fixo({ id: "LAN-5016", natureza: "receber", descricao: "Contrato trimestral · novembro", categoria: "Contratos", valor: 1760, vencimento: em(11, 16).toISOString(), unidade: "contagem",
    clienteId: "C-0023", meio: "boleto" })
  const expirou = em(11, 16, 9, 20).toISOString()
  fixo({ id: "LAN-5021", natureza: "receber", descricao: "PED-2210 · filtro e controle universal", categoria: "Vendas", valor: 189.9, vencimento: em(11, 16).toISOString(), unidade: "pampulha",
    clienteId: "C-0007", ref: "PED-2210", estado: "aguardando_pix", meio: "pix", pixExpiraEm: expirou, pixCodigo: codigoPix("LAN-5021", 189.9, expirou),
    historico: [pes(em(11, 16, 8, 50), "Juliana Castro", "Gerou o código Pix na loja on-line (expira às 09:20)", true)] })
  fixo({ id: "LAN-5022", natureza: "receber", descricao: "OS-1047 · limpeza trimestral de 4 splits", categoria: "Contratos", valor: 880, vencimento: em(11, 23).toISOString(), unidade: "pampulha",
    clienteId: "C-0001", ref: "OS-1047", estado: "previsto" })
  fixo({ id: "LAN-5023", natureza: "receber", descricao: "OS-1056 · instalação de split no salão", categoria: "Serviços", valor: 650, vencimento: em(11, 25).toISOString(), unidade: "pampulha",
    clienteId: "C-0028", ref: "OS-1056", estado: "previsto" })
  fixo({ id: "LAN-5024", natureza: "receber", descricao: "OS-1044 · sinal da troca de compressor", categoria: "Serviços", valor: 1490, vencimento: em(11, 5).toISOString(), unidade: "pampulha",
    clienteId: "C-0012", ref: "OS-1044", estado: "pago", meio: "pix", pagoEm: em(11, 5, 10, 4).toISOString(), comprovanteId: idE2E("LAN-5024", "1004") })
  fixo({ id: "LAN-5025", natureza: "receber", descricao: "OS-1044 · saldo da troca de compressor", categoria: "Serviços", valor: 1490, vencimento: em(11, 26).toISOString(), unidade: "pampulha",
    clienteId: "C-0012", ref: "OS-1044", estado: "previsto" })
  fixo({ id: "LAN-5027", natureza: "receber", descricao: "OS-1099 · sinal da substituição completa do sistema de climatização central dos três galpões", categoria: "Serviços", valor: 9876.54,
    vencimento: em(11, 14).toISOString(), unidade: "contagem", clienteId: "C-0099", ref: "OS-1099", meio: "boleto" })
  fixo({ id: "LAN-5028", natureza: "receber", descricao: "OS-1098 · visita de diagnóstico", categoria: "Serviços", valor: EMPRESA.taxaVisita, vencimento: em(11, 19).toISOString(), unidade: "pampulha",
    clienteId: "C-0098", ref: "OS-1098" })
  fixo({ id: "LAN-5034", natureza: "pagar", descricao: "CMP-0007 · compressor rotativo 12.000 BTU", categoria: "Fornecedores", valor: 1980, vencimento: em(11, 19).toISOString(), unidade: "pampulha",
    fornecedor: "Refrigeração Minas Peças", ref: "CMP-0007", estado: "previsto" })
  fixo({ id: "LAN-5035", natureza: "pagar", descricao: "Gás R410A e tubos de cobre", categoria: "Fornecedores", valor: 3460, vencimento: em(11, 24).toISOString(), unidade: "contagem",
    fornecedor: "Distribuidora Frio Total", meio: "boleto", linhaDigitavel: boleto(3460, em(11, 24)) })

  // --- contas fixas de cada mês (setembro a dezembro) ---
  const recorrentes: [string, string, string, number, number, Unidade, string?][] = [
    // descrição, categoria, fornecedor, valor, dia, unidade, id fixo em novembro
    ["Aluguel da Pampulha", "Aluguel", "Imobiliária Andorinhas", 6800, 10, "pampulha", "LAN-5032"],
    ["Aluguel de Contagem", "Aluguel", "Eldorado Imóveis", 4200, 10, "contagem", "LAN-5033"],
    ["Simples Nacional", "Impostos", "Receita Federal (DAS)", 6930, 20, "pampulha", "LAN-5031"],
    ["Folha de pagamento", "Folha", "Equipe Oficina Norte", 24600, 30, "pampulha", "LAN-5030"],
    ["Energia elétrica · Pampulha", "Energia", "Cemig", 1284.37, 16, "pampulha", "LAN-5015"],
    ["Honorários do contador", "Serviços de terceiros", "Contabilidade Horizonte", 1450, 7, "pampulha"],
    ["Internet e telefone", "Serviços de terceiros", "Conecta Fibra", 389.9, 5, "pampulha"],
  ]
  const MES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
  const recorr: Base[] = []
  for (const m of [9, 10, 11, 12]) {
    for (const [descricao, categoria, fornecedor, valor, d, unidade, idNov] of recorrentes) {
      const v = categoria === "Energia" ? centavos(valor * (0.86 + r.proximo() * 0.24)) : valor
      // a folha do mês vence no último dia útil (30/11 é segunda); as demais seguem o dia útil
      const venc = diaUtil(em(m, Math.min(d, m === 9 || m === 11 ? 30 : 31)))
      const imposto = categoria === "Impostos"
      const b: Base = { id: m === 11 && idNov ? idNov : "", natureza: "pagar", descricao: `${descricao} · ${MES[m]}`, categoria, fornecedor, valor: v,
        vencimento: (imposto && m === 11 ? em(11, 19) : venc).toISOString(), unidade }
      if (["Energia", "Impostos"].includes(categoria) || fornecedor === "Contabilidade Horizonte") {
        b.meio = "boleto"; b.linhaDigitavel = boleto(v, new Date(b.vencimento), categoria === "Energia" || imposto ? "arrecadacao" : "bancario")
      }
      recorr.push(b)
    }
  }

  // --- sorteados: compras de fornecedores e entradas por mês (serviços, vendas e contratos) ---
  // As entradas de cada mês somam as saídas do mês mais um saldo combinado (setembro e outubro empatam, novembro fecha
  // no vermelho com a folha de 30/11 e dezembro recupera com os contratos do começo do mês): o realizado fica positivo e
  // o pior dia projetado é 30/11, como pede o pior caso da seção 4.
  const sorteados: Base[] = []
  const metas: [number, number, number, number][] = [[9, 21, 0, 3], [10, 21, 0, 3], [11, 21, -14000, 3], [12, 20, 26000, 3]] // mês, entradas, saldo do mês, compras
  const mesDe = (iso: string) => new Date(iso).getMonth() + 1
  for (const [m, , , compras] of metas) {
    const ultimo = m === 9 || m === 11 ? 30 : 31
    for (let i = 0; i < compras; i++) {
      const f = r.pega(FORNECEDORES)
      const cat = CATEGORIA_FORN[f] ?? "Fornecedores"
      const v = centavos(cat === "Combustível" ? r.entre(380, 920) + r.entre(0, 99) / 100 : cat === "Escritório" ? r.entre(90, 340) : r.entre(900, 4200) + r.entre(0, 99) / 100)
      const d = m === 11 ? (i < compras - 1 ? r.entre(2, 13) : 27) : r.entre(1, ultimo)
      const venc = diaUtil(em(m, d))
      sorteados.push({ id: "", natureza: "pagar", descricao: cat === "Combustível" ? "Combustível da frota" : cat === "Escritório" ? "Material de escritório" : r.pega(["Peças de reposição", "Compressor e capacitores", "Cabos e disjuntores", "Suportes e parafusos"]),
        categoria: cat, fornecedor: f, valor: v, vencimento: venc.toISOString(), unidade: r.chance(0.6) ? "pampulha" : "contagem", meio: "boleto", linhaDigitavel: boleto(v, venc) })
    }
  }
  for (const [m, n, saldoDoMes] of metas) {
    const doMes = (b: Base) => mesDe(b.vencimento) === m && new Date(b.vencimento).getFullYear() === 2026
    const saidas = [...fixos, ...recorr, ...sorteados].filter((b) => b.natureza === "pagar" && doMes(b)).reduce((s, b) => s + b.valor, 0)
    const fixasEntrada = fixos.filter((b) => b.natureza === "receber" && doMes(b)).reduce((s, b) => s + b.valor, 0)
    const total = Math.max(n * 400, saidas + saldoDoMes - fixasEntrada)
    const pesos = Array.from({ length: n }, () => 0.45 + r.proximo() * 1.2)
    const soma = pesos.reduce((s, x) => s + x, 0)
    const ultimo = m === 9 || m === 11 ? 30 : 31
    pesos.forEach((p, i) => {
      // novembro: quase tudo já venceu (2 títulos na segunda quinzena); dezembro: os contratos chegam nos primeiros dias
      const d = m === 11 ? (i < n - 2 ? r.entre(2, 14) : r.entre(23, 27)) : m === 12 && i < 6 ? r.entre(1, 4) : r.entre(1, ultimo)
      const [descr, categoria] = m === 12 && i < 6 ? ["contrato de manutenção", "Contratos"] : r.pega(DESCR_RECEBER)
      const c = r.pega(cli)
      sorteados.push({ id: "", natureza: "receber", descricao: descr[0].toUpperCase() + descr.slice(1), categoria, valor: centavos((total * p) / soma),
        vencimento: diaUtil(em(m, d)).toISOString(), unidade: r.chance(0.65) ? "pampulha" : "contagem", clienteId: c.id })
    })
  }

  // --- estados: o passado está pago (com poucas exceções vencidas e canceladas); o futuro, em aberto ou previsto ---
  const passado = (b: Base) => new Date(b.vencimento) < new Date(chaveDia(hoje) + "T00:00:00")
  const candidatos = sorteados.filter((b) => passado(b) && new Date(b.vencimento) >= em(10, 1))
  const vencidosR = candidatos.filter((b) => b.natureza === "receber" && new Date(b.vencimento) >= em(10, 20))
  const vencidosP = candidatos.filter((b) => b.natureza === "pagar")
  const vencidos = new Set([...vencidosR.slice(-5), ...vencidosP.slice(-2)])
  const cancelados = new Set(candidatos.filter((b) => b.natureza === "receber" && !vencidos.has(b)).slice(0, 2))
  const meioReceber = (): Meio => { const x = r.proximo(); return x < 0.45 ? "pix" : x < 0.65 ? "cartao_credito" : x < 0.8 ? "cartao_debito" : x < 0.9 ? "dinheiro" : "boleto" }

  for (const b of [...recorr, ...sorteados]) {
    if (passado(b)) {
      if (vencidos.has(b)) { b.estado = "em_aberto"; continue }
      if (cancelados.has(b)) { b.estado = "cancelado"; b.motivo = "Lançado em duplicidade"; continue }
      const venc = new Date(b.vencimento)
      const pago = new Date(venc.getTime() - r.entre(0, 1) * DIA)
      pago.setHours(r.entre(9, 17), r.entre(0, 59))
      b.estado = "pago"
      b.meio = b.natureza === "receber" ? meioReceber() : b.meio ?? "pix"
      b.pagoEm = pago.toISOString()
    } else if (!b.estado) {
      const dez = new Date(b.vencimento) >= em(12, 1)
      b.estado = dez && (b.natureza === "pagar" ? r.chance(0.5) : r.chance(0.35)) && !["Aluguel", "Folha", "Impostos"].includes(b.categoria) ? "previsto" : "em_aberto"
    }
  }

  // ids: os fixos guardam os deles; o resto recebe os números livres de LAN-5001 a LAN-5140, em ordem de vencimento
  const todos = [...fixos, ...recorr, ...sorteados]
  const usados = new Set(todos.map((b) => b.id).filter(Boolean))
  const livres = Array.from({ length: 140 }, (_, i) => `LAN-${5001 + i}`).filter((x) => !usados.has(x))
  todos.filter((b) => !b.id).sort((a, b) => a.vencimento.localeCompare(b.vencimento)).forEach((b, i) => { b.id = livres[i] ?? `LAN-${5141 + i}` })
  todos.push(...contratosCorporativos(todos, cli))

  return todos.map((b): Lancamento => {
    const estado = b.estado ?? "em_aberto"
    const criado = new Date(Math.min(new Date(b.vencimento).getTime() - 12 * DIA, hoje.getTime() - DIA))
    const historico = b.historico ?? [sis(criado, b.natureza === "receber" ? (b.ref ? `Título criado a partir da ${b.ref}` : "Título a receber lançado") : "Conta a pagar lançada")]
    if (estado === "pago" && b.pagoEm) historico.push(b.natureza === "receber" && b.meio === "pix" ? sis(new Date(b.pagoEm), "Pix confirmado pelo banco")
      : pes(new Date(b.pagoEm), "Helena Vaz", `${b.natureza === "receber" ? "Recebeu" : "Pagou"} ${b.meio ? "com " + MEIOS[b.meio].toLowerCase() : ""}`.trim()))
    if (estado === "cancelado") historico.push(pes(new Date(new Date(b.vencimento).getTime() + DIA), "Helena Vaz", `Cancelou: ${b.motivo}`))
    if (estado === "pago" && b.meio === "pix" && b.pagoEm && !b.comprovanteId) b.comprovanteId = idE2E(b.id, b.pagoEm)
    return { ...b, estado, versao: 1, historico } as Lancamento
  }).sort((a, b) => a.id.localeCompare(b.id))
}

// --- contratos corporativos: o faturamento do mês da especificação (5.2: "Faturamento do mês R$ 186.420,00") ---
// As empresas pagam por instalação (equipamento incluído) às terças e quintas; cada recebimento vem com a compra do
// equipamento no mesmo dia, de mesmo valor. Assim o saldo de cada dia, o saldo de abertura e o −R$ 3.420,00 de 30/11 não
// mudam, e nenhum id, valor ou sorteio dos outros lançamentos muda (ids LAN-4901 em diante, abaixo do LAN-5001; nada
// aqui usa o sorteio). O valor de novembro fecha a conta: o recebido de 1º a 16/11, nas duas unidades, dá exatamente
// FATURAMENTO_DO_MES; outubro, no mesmo período, fica 7,2 % abaixo (a comparação do herói).
export const FATURAMENTO_DO_MES = 186420
function contratosCorporativos(base: Base[], cli: { id: string; tipo: string }[]): Base[] {
  const hoje = AGORA_FIXO
  const recebido = (m: number, ateDia: number) => centavos(base.filter((b) => b.natureza === "receber" && b.estado === "pago" && !b.estornadoPor && b.pagoEm
    && new Date(b.pagoEm).getMonth() === m - 1 && new Date(b.pagoEm).getDate() <= ateDia).reduce((s, b) => s + b.valor, 0))
  const dia = hoje.getDate()
  // [mês, dias (terças e quintas úteis), alvo dos dias até `dia` ou null (valores fixos)]
  const meses: [number, number[], number | null][] = [
    [9, [1, 3, 8, 10, 15, 17, 22, 24, 29], null],
    [10, [1, 6, 8, 13, 15, 20, 22, 27, 29], centavos(FATURAMENTO_DO_MES / 1.072)],
    [11, [3, 5, 10, 12], FATURAMENTO_DO_MES],
  ]
  const PESOS = [0.27, 0.22, 0.29, 0.22, 0.25]
  const FIXOS = [16480, 13920, 18750, 12360, 17240, 15890, 14310, 19630, 13470]
  const pj = cli.filter((c) => c.tipo === "pj")
  const obras = ["instalação de splits na rede de lojas", "climatização do galpão", "troca de condensadoras do prédio", "instalação de cassetes no escritório", "manutenção anual dos equipamentos"]
  const out: Base[] = []
  let n = 4901
  for (const [m, dias, alvo] of meses) {
    const ate = alvo === null ? [] : dias.filter((d) => d <= dia && em(m, d) < hoje)
    const falta = alvo === null ? 0 : centavos(alvo - recebido(m, dia))
    const pesos = ate.map((_, i) => PESOS[i % PESOS.length]), soma = pesos.reduce((s, x) => s + x, 0)
    let resto = falta
    dias.forEach((d, i) => {
      const k = ate.indexOf(d)
      const valor = k < 0 ? FIXOS[i % FIXOS.length] : k === ate.length - 1 ? centavos(resto) : centavos((falta * pesos[k]) / soma)
      if (k >= 0) resto = centavos(resto - valor)
      if (valor <= 0) return
      const c = pj[(m * 7 + i) % pj.length]
      const unidade: Unidade = i % 3 === 2 ? "contagem" : "pampulha"
      const quando = em(m, d)
      const r = `LAN-${n++}`, p = `LAN-${n++}`
      out.push({ id: r, natureza: "receber", descricao: `Contrato corporativo · ${obras[i % obras.length]}`, categoria: "Contratos", valor, vencimento: quando.toISOString(),
        unidade, clienteId: c?.id, estado: "pago", meio: "pix", pagoEm: em(m, d, 11, 5).toISOString(), comprovanteId: idE2E(r, `${d}1105`) })
      out.push({ id: p, natureza: "pagar", descricao: `Equipamentos do contrato ${r}`, categoria: "Fornecedores", valor, vencimento: quando.toISOString(),
        unidade, fornecedor: "Distribuidora Frio Total", estado: "pago", meio: "pix", pagoEm: em(m, d, 15, 20).toISOString() })
    })
  }
  return out
}

export const lancamentos = colecao<Lancamento>("lancamentos", semear, 1, { caminho: (l) => `financeiro/${l.natureza}/?id=${l.id}` })

function semearCaixas(r: Aleatorio): Caixa[] {
  const lista: Caixa[] = []
  for (let d = new Date(2026, 9, 17, 12); d < em(11, 15); d = new Date(d.getTime() + DIA)) {
    const dia = chaveDia(d)
    if (d.getDay() === 0 || FERIADOS[dia]) continue
    const sabado = d.getDay() === 6
    for (const unidade of ["pampulha", "contagem"] as Unidade[]) {
      const catorze = dia === "2026-11-14" && unidade === "pampulha"
      const esperado = catorze ? 637.5 : 200 + r.entre(6, 90) * 10 + (r.chance(0.5) ? 0.5 : 0)
      const dif = catorze ? -12.5 : r.chance(0.12) ? r.pega([-5, 2.5, -20]) : 0
      const quem = catorze ? "Helena Vaz" : r.pega(["Helena Vaz", "Marina Duarte", unidade === "contagem" ? "Carla Mota" : "Ana Lima"])
      const fecha = catorze ? new Date(2026, 10, 14, 18, 12) : new Date(d.getFullYear(), d.getMonth(), d.getDate(), sabado ? 12 : 18, r.entre(2, 25))
      const abre = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 7, r.entre(48, 59))
      const motivo = dif ? (catorze ? "Troco dado a mais numa venda do balcão" : r.pega(["Troco dado a mais", "Moeda sem registro no fechamento anterior", "Diferença de centavos acumulada"])) : undefined
      lista.push({
        id: `CX-${unidade}-${dia}`, data: dia, unidade, estado: "fechado", saldoInicial: 200, abertoPor: quem, abertoEm: abre.toISOString(),
        esperado, contado: centavos(esperado + dif), diferenca: dif, motivo,
        porMeio: { dinheiro: centavos(esperado - 200), pix: r.entre(4, 30) * 60 + 0.9, cartao_debito: r.entre(1, 12) * 55, cartao_credito: r.entre(2, 20) * 80 },
        fechadoPor: quem, fechadoEm: fecha.toISOString(), versao: 1,
        historico: [pes(abre, quem, "Abriu o caixa com R$ 200,00 de troco"), pes(fecha, quem, dif ? `Fechou o caixa com diferença: ${motivo}` : "Fechou o caixa sem diferença")],
      })
    }
  }
  const abriu = em(11, 16, 8, 2)
  lista.push({ id: "CX-pampulha-2026-11-16", data: "2026-11-16", unidade: "pampulha", estado: "aberto", saldoInicial: 200, abertoPor: "Ana Lima", abertoEm: abriu.toISOString(),
    versao: 1, historico: [pes(abriu, "Ana Lima", "Abriu o caixa com R$ 200,00 de troco")] })
  return lista
}
export const caixas = colecao<Caixa>("caixas", semearCaixas)

// ---------- leituras derivadas ----------
const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const diasEntre = (a: Date, b: Date) => Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / DIA)
export const emAberto = (l: Lancamento) => l.estado === "em_aberto" || l.estado === "aguardando_pix"
export const pixExpirado = (l: Lancamento, ref: Date = agora()) => l.estado === "aguardando_pix" && !!l.pixExpiraEm && new Date(l.pixExpiraEm) <= ref
export const vencido = (l: Lancamento, ref: Date = agora()) => emAberto(l) && inicioDoDia(new Date(l.vencimento)) < inicioDoDia(ref)
export const diasVencido = (l: Lancamento, ref: Date = agora()) => Math.max(1, diasEntre(new Date(l.vencimento), ref))
export const nomeDe = (l: Lancamento) => (l.clienteId ? clientes.porId(l.clienteId)?.nome ?? "Cliente removido" : l.fornecedor ?? "—")


/** O selo do operador para um lançamento, sempre pela projeção (D6). */
export function situacao(l: Lancamento, ref: Date = agora()): { p: Projecao; ctx: Ctx } {
  if (l.estornadoPor) return { p: PAGAMENTO.estornado, ctx: { valor: l.valor, quando: l.historico.at(-1)?.em } }
  if (l.estado === "pago") return { p: LANCAMENTO.pago, ctx: { quando: l.pagoEm, canal: l.meio ? MEIOS[l.meio] : undefined, valor: l.valor } }
  if (l.estado === "cancelado") return { p: LANCAMENTO.cancelado, ctx: { motivo: l.motivo } }
  if (l.estado === "previsto") return { p: LANCAMENTO.previsto, ctx: { ate: l.vencimento } }
  if (pixExpirado(l, ref)) return { p: PIX_EXPIRADO, ctx: { ate: l.pixExpiraEm } }
  if (vencido(l, ref)) return { p: VENCIDO, ctx: { dias: diasVencido(l, ref), desde: l.vencimento, valor: l.valor, ate: new Date(ref.getTime() + 4 * DIA).toISOString() } }
  if (l.estado === "aguardando_pix") return { p: LANCAMENTO.aguardando_pix, ctx: { ate: l.pixExpiraEm, valor: l.valor } }
  return { p: l.natureza === "pagar" ? LANCAMENTO_A_PAGAR : LANCAMENTO.em_aberto, ctx: { ate: l.vencimento, valor: l.valor } }
}

export type Grupo = "vencidos" | "hoje" | "semana" | "depois"
export const GRUPOS: { id: Grupo; titulo: string }[] = [
  { id: "vencidos", titulo: "Vencidos" }, { id: "hoje", titulo: "Vencem hoje" }, { id: "semana", titulo: "Esta semana" }, { id: "depois", titulo: "Depois" },
]
/** Grupo por vencimento: vencidos, hoje, até o domingo desta semana, depois. */
export function grupoDe(l: Lancamento, ref: Date = agora()): Grupo {
  const dias = diasEntre(ref, new Date(l.vencimento))
  if (dias < 0) return "vencidos"
  if (dias === 0) return "hoje"
  const ateDomingo = (7 - ref.getDay()) % 7
  return dias <= ateDomingo ? "semana" : "depois"
}

/** Efeito no saldo: data em que o dinheiro entra ou sai (pago: quando foi; em aberto: o vencimento, nunca antes de amanhã). */
function efeito(l: Lancamento, ref: Date): { quando: Date; valor: number; realizado: boolean } | null {
  if (l.estado === "cancelado") return null
  const sinal = l.natureza === "receber" ? 1 : -1
  if (l.estado === "pago") return { quando: new Date(l.pagoEm!), valor: sinal * l.valor, realizado: true }
  const amanha = new Date(inicioDoDia(ref).getTime() + DIA + 12 * 3600_000)
  const venc = new Date(l.vencimento)
  return { quando: venc < amanha ? amanha : venc, valor: sinal * l.valor, realizado: false }
}

/** O saldo projetado de 30/11 nos dados de exemplo (seção 4: o pior caso de saldo negativo). */
export const SALDO_NEGATIVO_30_11 = -3420
let abertura: number | undefined
/** Saldo em conta antes do primeiro lançamento, calculado para o projetado de 30/11 bater −R$ 3.420,00 na semente. */
function saldoDeAbertura() {
  if (abertura !== undefined) return abertura
  const fim = em(11, 30, 23, 59)
  let soma = 0
  for (const l of lancamentos.semente()) { const e = efeito(l, AGORA_FIXO); if (e && e.quando <= fim) soma += e.valor }
  return (abertura = centavos(SALDO_NEGATIVO_30_11 - soma))
}

/** Saldo em conta agora (só o realizado). */
export function saldoHoje(lista: Lancamento[], ref: Date = agora()) {
  return centavos(lista.reduce((s, l) => { const e = efeito(l, ref); return e?.realizado && e.quando <= ref ? s + e.valor : s }, saldoDeAbertura()))
}

export type PontoFluxo = { dia: Date; saldo: number; entradas: number; saidas: number; projetado: boolean }
/** Saldo dia a dia, de `de` a `ate`: realizado até hoje, projetado depois (títulos em aberto e previstos). */
export function serieDoFluxo(lista: Lancamento[], ref: Date, de: Date, ate: Date): PontoFluxo[] {
  const efeitos = lista.map((l) => efeito(l, ref)).filter((e): e is NonNullable<typeof e> => !!e)
  const hoje = inicioDoDia(ref)
  let saldo = saldoDeAbertura()
  for (const e of efeitos) if (e.quando < de) saldo += e.valor
  const pontos: PontoFluxo[] = []
  for (let d = inicioDoDia(de); d <= ate; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const fim = new Date(d.getTime() + DIA)
    let entradas = 0, saidas = 0
    for (const e of efeitos) if (e.quando >= d && e.quando < fim) { if (e.valor > 0) entradas += e.valor; else saidas -= e.valor }
    saldo += entradas - saidas
    pontos.push({ dia: d, saldo: centavos(saldo), entradas: centavos(entradas), saidas: centavos(saidas), projetado: d > hoje })
  }
  return pontos
}

/** Totais do mês corrente e das contas em aberto (o bento do fluxo). */
export function resumo(lista: Lancamento[], ref: Date = agora()) {
  const mes = (iso?: string) => !!iso && new Date(iso).getMonth() === ref.getMonth() && new Date(iso).getFullYear() === ref.getFullYear()
  const soma = (f: (l: Lancamento) => boolean) => centavos(lista.filter(f).reduce((s, l) => s + l.valor, 0))
  const conta = (f: (l: Lancamento) => boolean) => lista.filter(f).length
  const anterior = new Date(ref.getFullYear(), ref.getMonth() - 1, 15)
  const mesAnt = (iso?: string) => !!iso && new Date(iso).getMonth() === anterior.getMonth()
  return {
    entradas: soma((l) => l.natureza === "receber" && l.estado === "pago" && mes(l.pagoEm)),
    entradasAnterior: soma((l) => l.natureza === "receber" && l.estado === "pago" && mesAnt(l.pagoEm) && new Date(l.pagoEm!).getDate() <= ref.getDate()),
    saidas: soma((l) => l.natureza === "pagar" && l.estado === "pago" && mes(l.pagoEm)),
    saidasAnterior: soma((l) => l.natureza === "pagar" && l.estado === "pago" && mesAnt(l.pagoEm) && new Date(l.pagoEm!).getDate() <= ref.getDate()),
    aReceber: soma((l) => l.natureza === "receber" && emAberto(l)),
    nAReceber: conta((l) => l.natureza === "receber" && emAberto(l)),
    receberVencido: soma((l) => l.natureza === "receber" && vencido(l, ref)),
    nReceberVencido: conta((l) => l.natureza === "receber" && vencido(l, ref)),
    aPagar: soma((l) => l.natureza === "pagar" && emAberto(l)),
    nAPagar: conta((l) => l.natureza === "pagar" && emAberto(l)),
    pagarVencido: soma((l) => l.natureza === "pagar" && vencido(l, ref)),
    nPagarVencido: conta((l) => l.natureza === "pagar" && vencido(l, ref)),
    previstoReceber: soma((l) => l.natureza === "receber" && l.estado === "previsto"),
  }
}

/** O caixa do dia numa unidade (ou nada, se ainda não foi aberto) e o que se espera nele, por meio. */
export function caixaDoDia(lista: Caixa[], unidade: Unidade, ref: Date = agora()) {
  return lista.find((c) => c.unidade === unidade && c.data === chaveDia(ref))
}
export function esperadoNoCaixa(cx: Pick<Caixa, "data" | "unidade" | "saldoInicial">, lans: Lancamento[]) {
  const porMeio: Record<Meio, number> = { dinheiro: cx.saldoInicial, pix: 0, cartao_debito: 0, cartao_credito: 0, boleto: 0 }
  for (const l of lans) {
    if (l.estado !== "pago" || !l.pagoEm || !l.meio || l.unidade !== cx.unidade || chaveDia(new Date(l.pagoEm)) !== cx.data) continue
    porMeio[l.meio] += l.natureza === "receber" ? l.valor : -l.valor
  }
  for (const m of MEIOS_ORDEM) porMeio[m] = centavos(porMeio[m])
  return porMeio
}

/** As cobranças de um cliente (o Portal mostra pela projeção, nunca o registro cru). */
export const cobrancasDoCliente = (clienteId: string) => lancamentos.ler().filter((l) => l.clienteId === clienteId && l.natureza === "receber" && l.estado !== "cancelado")

// ---------- ações ----------
const capDe = (l: Lancamento): Capacidade => (l.natureza === "receber" ? "receber" : "pagar")
const conferir = (l: Lancamento) => ({ colecao: lancamentos as never, id: l.id, versao: l.versao })
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
/** Chave de idempotência gerada quando a folha abre, antes do clique (EST-40). */
export const novaChave = (id: string) => `${id}:${agora().getTime().toString(36)}:${(++contadorChaves).toString(36)}`
let contadorChaves = 0

// "Resposta perdida" (EST-46) vem da barra F da base: a baixa manual consome o pedido (consumirRespostaPerdida) e guarda
// o envio pendente no título ("Enviado, ainda sem confirmação") até alguém verificar o status.

/** Marca a OS ou a venda de origem como paga (o mesmo pagamento, nas duas pontas). */
function pagarOrigem(d: Rascunho, l: Lancamento, quem: Evento["quem"], quando: string) {
  if (!l.ref?.startsWith("OS-")) return
  const o = d(pedidos).find((p) => p.id === l.ref)
  if (!o || o.pagamento === "pago") return
  o.pagamento = "pago"
  o.historico.push({ em: quando, quem, texto: `Pagamento recebido (${l.id})`, eixo: "pagamento", cliente: true })
}

/** Gerar o Pix (P): código novo com validade de 30 min. Serve também para "Gerar novo código" depois de expirar. */
export function gerarPix(l: Lancamento): Promise<Resultado> {
  const expira = new Date(agora().getTime() + EMPRESA.pixMinutos * MIN).toISOString()
  return acao({
    rotulo: `gerar o Pix de ${l.ref ?? l.id}`, modo: "pessimista", capacidade: "receber", contexto: { unidade: l.unidade },
    conferir: conferir(l), ids: [l.id],
    aplicar: (d) => {
      const x = d(lancamentos).find((y) => y.id === l.id)!
      const novo = x.estado === "aguardando_pix"
      x.estado = "aguardando_pix"; x.meio = "pix"; x.pixExpiraEm = expira; x.pixCodigo = codigoPix(x.id, x.valor, expira)
      x.historico.push(evento(`${novo ? "Gerou um novo código Pix" : "Gerou o código Pix"} (expira às ${hora(expira)})`, { cliente: true }))
    },
  })
}

/** O cliente paga o Pix (simulação da outra ponta, D10; o Portal chama na onda B). Confirmação A: a tela muda sozinha. */
export function clientePagaPix(id?: string) {
  const ref = agora()
  const alvo = lancamentos.ler().filter((l) => l.estado === "aguardando_pix" && !pixExpirado(l, ref) && (!id || l.id === id))
  if (!alvo.length) {
    toast.info("Nenhum Pix aberto agora.", { description: "Gere um código na folha de um título a receber e simule de novo." })
    return
  }
  mudarComoOutraPonta((d) => {
    for (const a of alvo) {
      const x = d(lancamentos).find((y) => y.id === a.id)!
      const quando = agora().toISOString()
      const quem = { tipo: "cliente" as const, nome: clientes.porId(x.clienteId)?.nome ?? "Cliente" }
      x.estado = "pago"; x.meio = "pix"; x.pagoEm = quando; x.comprovanteId = idE2E(x.id, quando)
      x.historico.push({ em: quando, quem, texto: "Pagou com Pix", cliente: true }, { em: quando, quem: { tipo: "sistema", nome: "Sistema" }, texto: "Pix confirmado pelo banco" })
      pagarOrigem(d, x, quem, quando)
    }
  }, alvo.map((a) => a.id))
}

/** Baixa manual (P): dinheiro ou cartão na maquininha. A chave repetida não recebe de novo. */
export function receber(l: Lancamento, meio: Meio, chave: string): Promise<Resultado> {
  const perder = consumirRespostaPerdida()
  return acao({
    rotulo: `receber ${l.ref ?? l.id}`, modo: "pessimista", capacidade: "receber", contexto: { unidade: l.unidade },
    conferir: conferir(l), ids: [l.id],
    aplicar: (d) => {
      const x = d(lancamentos).find((y) => y.id === l.id)!
      if (x.estado === "pago" || x.chaves?.includes(chave) || x.envio) return
      const quando = agora().toISOString()
      if (perder) {
        x.envio = { chave, meio, em: quando }
        x.historico.push(evento(`Enviou a baixa em ${MEIOS[meio].toLowerCase()}; a confirmação não chegou`))
        return
      }
      x.estado = "pago"; x.meio = meio; x.pagoEm = quando; x.chaves = [...(x.chaves ?? []), chave]
      x.historico.push(evento(`Recebeu ${brl(x.valor)} em ${MEIOS[meio].toLowerCase()}`, { cliente: true }))
      pagarOrigem(d, x, { tipo: "pessoa", nome: pessoaAtual().nome }, quando)
    },
  })
}

/** "Verificar status" de uma baixa sem confirmação: o banco responde que entrou. */
export function verificarStatus(l: Lancamento): Promise<Resultado> {
  return acao({
    rotulo: `verificar o status de ${l.ref ?? l.id}`, modo: "pessimista", capacidade: capDe(l), contexto: { unidade: l.unidade }, ids: [l.id],
    aplicar: (d) => {
      const x = d(lancamentos).find((y) => y.id === l.id)!
      if (!x.envio) return
      const quando = agora().toISOString()
      x.estado = "pago"; x.meio = x.envio.meio; x.pagoEm = x.envio.em; x.chaves = [...(x.chaves ?? []), x.envio.chave]
      x.historico.push(evento(`Status verificado: recebido em ${MEIOS[x.envio.meio].toLowerCase()}`, { cliente: true }))
      x.envio = undefined
      pagarOrigem(d, x, { tipo: "pessoa", nome: pessoaAtual().nome }, quando)
    },
  })
}

/** Receber em lote (P): o mesmo meio para todos, resultado por item. */
export async function receberEmLote(ids: string[], meio: Meio): Promise<Resultado> {
  const alvo = lancamentos.ler().filter((l) => ids.includes(l.id) && emAberto(l) && !l.envio)
  const rs = await Promise.all(alvo.map((l) => receber(l, meio, novaChave(l.id))))
  const falhas = alvo.filter((_, i) => !rs[i].ok)
  const ok = alvo.length - falhas.length
  if (!falhas.length) {
    toast.success(`${ok} ${ok === 1 ? "título recebido" : "títulos recebidos"} em ${MEIOS[meio].toLowerCase()}.`)
    return { ok: true }
  }
  const primeira = rs.find((x) => !x.ok) as Extract<Resultado, { ok: false }>
  return { ok: false, motivo: primeira.motivo, mensagem: `${ok ? `${ok} recebidos. ` : ""}Não recebidos: ${falhas.map((f) => f.id).join(", ")}. ${primeira.mensagem}` }
}

/** Pagar uma conta (P): boleto lido pela linha digitável, ou Pix para o fornecedor. */
export function pagarConta(l: Lancamento, meio: Meio, chave: string): Promise<Resultado> {
  return acao({
    rotulo: `pagar ${l.id}`, modo: "pessimista", capacidade: "pagar", conferir: conferir(l), ids: [l.id],
    aplicar: (d) => {
      const x = d(lancamentos).find((y) => y.id === l.id)!
      if (x.estado === "pago" || x.chaves?.includes(chave)) return
      const quando = agora().toISOString()
      x.estado = "pago"; x.meio = meio; x.pagoEm = quando; x.chaves = [...(x.chaves ?? []), chave]
      if (meio === "pix") x.comprovanteId = idE2E(x.id, quando)
      x.historico.push(evento(`Pagou ${brl(x.valor)} com ${MEIOS[meio].toLowerCase()}`))
    },
  })
}

export async function pagarEmLote(ids: string[]): Promise<Resultado> {
  const alvo = lancamentos.ler().filter((l) => ids.includes(l.id) && emAberto(l))
  const rs = await Promise.all(alvo.map((l) => pagarConta(l, l.meio ?? "boleto", novaChave(l.id))))
  const falhas = alvo.filter((_, i) => !rs[i].ok)
  if (!falhas.length) { toast.success(`${alvo.length} ${alvo.length === 1 ? "conta paga" : "contas pagas"}.`); return { ok: true } }
  const primeira = rs.find((x) => !x.ok) as Extract<Resultado, { ok: false }>
  return { ok: false, motivo: primeira.motivo, mensagem: `Não pagas: ${falhas.map((f) => f.id).join(", ")}. ${primeira.mensagem}` }
}

/** Prazo do reembolso, como o cliente lê: "no Pix em até 3 dias úteis". */
export const prazoDoEstorno = (meio?: Meio) => (meio === "dinheiro" ? "em dinheiro, no balcão, hoje" : meio === "cartao_credito" ? "no cartão em até 2 faturas" : meio === "boleto" ? "por transferência em até 3 dias úteis" : `${meio === "cartao_debito" ? "no cartão de débito" : "no Pix"} em até 3 dias úteis`)

/** Estornar (P, com confirmação): lançamento novo ligado ao original, nos dois sentidos (EST-48). */
export function estornar(l: Lancamento): Promise<Resultado> {
  const novo = proximoId(lancamentos.ler(), "LAN", 5000)
  return acao({
    rotulo: `estornar ${l.id}`, modo: "pessimista", capacidade: "estornar", contexto: { valor: l.valor, unidade: l.unidade },
    conferir: conferir(l), ids: [l.id],
    sucesso: `Estorno ${novo} criado. ${l.id} mostra "Estornado por ${novo}".`,
    aplicar: (d) => {
      const lista = d(lancamentos)
      const x = lista.find((y) => y.id === l.id)!
      const quando = agora().toISOString()
      x.estornadoPor = novo
      x.historico.push(evento(`Estornado por ${novo}: reembolso de ${brl(x.valor)} ${prazoDoEstorno(x.meio)}`, { cliente: true }))
      lista.push({
        id: novo, natureza: x.natureza === "receber" ? "pagar" : "receber", descricao: `Estorno de ${x.id} · ${x.descricao}`, categoria: "Estornos",
        valor: x.valor, vencimento: quando, unidade: x.unidade, meio: x.meio, estado: "pago", pagoEm: quando, ref: x.ref, clienteId: x.clienteId, fornecedor: x.fornecedor,
        estornoDe: x.id, comprovanteId: x.meio === "pix" ? idE2E(novo, quando) : undefined, versao: 1, historico: [evento(`Estorno de ${x.id} (${prazoDoEstorno(x.meio)})`)],
      })
    },
  })
}

/** Cancelar um título em aberto (P, com motivo). */
export function cancelarTitulo(l: Lancamento, motivo: string): Promise<Resultado> {
  return acao({
    rotulo: `cancelar ${l.id}`, modo: "pessimista", capacidade: capDe(l), contexto: { unidade: l.unidade }, conferir: conferir(l), ids: [l.id],
    aplicar: (d) => {
      const x = d(lancamentos).find((y) => y.id === l.id)!
      x.estado = "cancelado"; x.motivo = motivo; x.pixCodigo = undefined
      x.historico.push(evento(`Cancelou: ${motivo}`))
    },
  })
}

/** Editar vencimento ou valor de um título em aberto (O + Desfazer); fica na auditoria. */
export function editarTitulo(l: Lancamento, mudanca: { valor?: number; vencimento?: string }): Promise<Resultado> | undefined {
  if (!emAberto(l) && l.estado !== "previsto") { toast.error(`${l.id} não está em aberto: só se estorna.`); return }
  const antes = { valor: l.valor, vencimento: l.vencimento }
  const texto = mudanca.valor !== undefined ? `Valor de ${brl(antes.valor)} para ${brl(mudanca.valor)}` : `Vencimento de ${new Date(antes.vencimento).toLocaleDateString("pt-BR")} para ${new Date(mudanca.vencimento!).toLocaleDateString("pt-BR")}`
  return acao({
    rotulo: `editar ${l.id}`, capacidade: capDe(l), contexto: { unidade: l.unidade }, ids: [l.id],
    sucesso: `${l.id}: ${texto.charAt(0).toLowerCase()}${texto.slice(1)}.`,
    aplicar: (d) => { const x = d(lancamentos).find((y) => y.id === l.id)!; Object.assign(x, mudanca); x.historico.push(evento(texto)) },
    desfazer: (d) => { const x = d(lancamentos).find((y) => y.id === l.id)!; Object.assign(x, antes); x.historico.push(evento("Desfez a edição")) },
  })
}

/** Abrir o caixa do dia (P). */
export function abrirCaixa(unidade: Unidade, saldoInicial: number): Promise<Resultado> {
  const hoje = chaveDia(agora())
  const id = `CX-${unidade}-${hoje}`
  return acao({
    rotulo: `abrir o caixa de ${UNIDADES[unidade].nome}`, modo: "pessimista", capacidade: "fechar_caixa", ids: [id],
    aplicar: (d) => {
      const lista = d(caixas)
      if (lista.some((c) => c.id === id)) return
      const quem = pessoaAtual().nome
      lista.push({ id, data: hoje, unidade, estado: "aberto", saldoInicial, abertoPor: quem, abertoEm: agora().toISOString(), versao: 1,
        historico: [evento(`Abriu o caixa com ${brl(saldoInicial)} de troco`)] })
    },
  })
}

/** Fechar o caixa (P, deslizar para confirmar): terminal; diferença diferente de zero exige motivo. */
export function fecharCaixa(cx: Caixa, contado: number, motivo: string): Promise<Resultado> {
  const porMeio = esperadoNoCaixa(cx, lancamentos.ler())
  const esperado = porMeio.dinheiro
  const diferenca = centavos(contado - esperado)
  if (diferenca !== 0 && motivo.trim().length < 3) return Promise.resolve({ ok: false, motivo: "falha", mensagem: "Diga o motivo da diferença antes de fechar." })
  return acao({
    rotulo: `fechar o caixa de ${UNIDADES[cx.unidade].nome}`, modo: "pessimista", capacidade: "fechar_caixa",
    conferir: { colecao: caixas as never, id: cx.id, versao: cx.versao }, ids: [cx.id],
    aplicar: (d) => {
      const x = d(caixas).find((y) => y.id === cx.id)!
      if (x.estado === "fechado") return
      const quem = pessoaAtual().nome
      Object.assign(x, { estado: "fechado", esperado, contado, diferenca, motivo: diferenca ? motivo.trim() : undefined, porMeio, fechadoPor: quem, fechadoEm: agora().toISOString() })
      x.historico.push(evento(diferenca ? `Fechou o caixa com diferença de ${brl(diferenca)}: ${motivo.trim()}` : "Fechou o caixa sem diferença"))
    },
  })
}
