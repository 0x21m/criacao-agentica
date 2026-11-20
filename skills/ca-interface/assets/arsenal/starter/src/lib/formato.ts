let idioma = "pt-BR"

// MIFT: formatação de números, dinheiro e datas, igual em todo o app. pt-BR e real por padrão;
// outro idioma ou moeda com `definirFormato({ idioma: "en-US", moeda: "USD" })` antes de montar.
// Telas nunca formatam à mão: usam estas funções (ou o Valor, que também respeita "ocultar valores").
// Um valor que não é dinheiro diz como se mostra com `ComoMostrar` (formato, unidade, casas): a mesma regra vale no
// simulador, nas faixas, nos totais e nos gráficos (eixo, dica e nome acessível).
// (A nota fica depois da primeira declaração: o shadcn apaga o comentário da primeira linha ao instalar.)

let moedaAtual = "BRL"
let fmt = criar()

function criar() {
  return {
    moeda: new Intl.NumberFormat(idioma, { style: "currency", currency: moedaAtual }),
    moedaCompacta: new Intl.NumberFormat(idioma, { style: "currency", currency: moedaAtual, notation: "compact", maximumFractionDigits: 1 }),
    moedaInteira: new Intl.NumberFormat(idioma, { style: "currency", currency: moedaAtual, maximumFractionDigits: 0 }),
    variacao: new Intl.NumberFormat(idioma, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }),
    percentual: new Intl.NumberFormat(idioma, { style: "percent", maximumFractionDigits: 1 }),
    compacto: new Intl.NumberFormat(idioma, { notation: "compact", maximumFractionDigits: 1 }),
    decimal: new Intl.NumberFormat(idioma, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }
}

/** O idioma em uso (para peças do React Aria que formatam números, como o campo de quantidade). */
export const idiomaDoFormato = () => idioma

export function definirFormato(novo: { idioma?: string; moeda?: string }) {
  idioma = novo.idioma ?? idioma
  moedaAtual = novo.moeda ?? moedaAtual
  fmt = criar()
}

/** R$ 1.234,56 */
export const moeda = (v: number) => fmt.moeda.format(v)

/** Tamanho de arquivo em unidades decimais (5_000_000 → "5 MB"), como os limites que a pessoa lê. */
export function tamanhoDeArquivo(bytes: number) {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`
  return `${(bytes / 1_000_000).toLocaleString(idioma, { maximumFractionDigits: 1 })} MB`
}

/** R$ 1,2 mi · abaixo de mil, sem centavos (R$ 408): "R$ 407,8" não é forma de dinheiro. */
export const moedaCompacta = (v: number) => (Math.abs(v) < 1000 ? fmt.moedaInteira.format(v) : fmt.moedaCompacta.format(v))
/** +10,0% (variação entre dois valores, sempre com sinal) */
export const variacao = (atual: number, anterior: number) => fmt.variacao.format(atual / anterior - 1)
/** 42,6% (fração 0,426) */
// Abaixo de 1%, duas casas: uma taxa de 0,02% não pode virar "0%".
export const percentual = (v: number) => (v !== 0 && Math.abs(v) < 0.01 ? new Intl.NumberFormat(idioma, { style: "percent", maximumFractionDigits: 2 }).format(v) : fmt.percentual.format(v))
/** 1,2 mil · 3,4 mi (eixos de gráfico) */
export const numeroCompacto = (v: number) => fmt.compacto.format(v)
/** 1.234,56 (campo de valor) */
export const textoMoeda = (v: number) => fmt.decimal.format(v)

/* ───────────── Como mostrar um valor (uma regra para simulador, faixas, gráficos e totais) ───────────── */

export type FormatoDoValor = "moeda" | "percentual" | "numero"
/** Quando a métrica melhora: "sobe" (margem, saldo), "desce" (custo, prazo) ou "nenhum" (só informa). */
export type BomQuando = "sobe" | "desce" | "nenhum"
export type ComoMostrar = {
  /** "moeda" (R$), "percentual" (fração: 0,05 = 5%; diferença em p.p.) ou "numero" (com `unidade`). */
  formato?: FormatoDoValor
  /** Sufixo de número ("kWh", "°C") ou [singular, plural] (["aluno", "alunos"]: "1 aluno", "3 alunos"). */
  unidade?: string | readonly [string, string]
  /** Casas decimais de número e de pontos percentuais (de percentual também, fixas: 4,0% ao lado de 5,1%). */
  casas?: number
}

const numeroCom = (v: number, casas = 2) => new Intl.NumberFormat(idioma, { maximumFractionDigits: casas }).format(v)

/** A unidade que vai com o valor: singular só para 1 (e −1); "0 alunos", "1,5 kg". */
export function unidadeDe(v: number, unidade: ComoMostrar["unidade"]) {
  if (unidade === undefined) return undefined
  return typeof unidade === "string" ? unidade : unidade[Math.abs(v) === 1 ? 0 : 1]
}

// Sinais que vão colados ao número ("15%", "2,9x", "30°"); unidade de medida leva espaço, como no SI ("12 L", "21,5 °C").
const COLADOS = new Set(["%", "x", "×", "°", "º"])

/** Número e unidade: "%", "x" e "°" colados ("2,9x"); as outras com espaço ("12 L", "21,5 °C", "3 alunos"). */
export const comUnidade = (numero: string, sufixo?: string) => (sufixo ? `${numero}${COLADOS.has(sufixo) ? "" : " "}${sufixo}` : numero)

/**
 * O valor em texto (leitores de tela, dicas, frases), sempre o mesmo em todo lugar. Com `sinal`, é uma diferença: + ou −
 * à frente, e percentual sai em pontos percentuais (62% → 58% = "−4 p.p.", nunca "−6,5%").
 */
export function textoDoValor(v: number, { formato = "numero", unidade, casas, sinal }: ComoMostrar & { sinal?: boolean } = {}) {
  const prefixo = sinal ? (v > 0 ? "+" : v < 0 ? "−" : "") : ""
  const a = sinal ? Math.abs(v) : v
  if (formato === "moeda") return prefixo + moeda(a)
  if (formato === "percentual") {
    if (sinal) return `${prefixo}${numeroCom(a * 100, casas ?? 1)} p.p.`
    return casas === undefined ? percentual(a) : new Intl.NumberFormat(idioma, { style: "percent", minimumFractionDigits: casas, maximumFractionDigits: casas }).format(a)
  }
  return prefixo + comUnidade(numeroCom(a, casas), unidadeDe(a, unidade))
}

/**
 * O número de um rótulo de eixo (cabe em 54 px): dinheiro e número na forma compacta ("1,2 mi", "350"), percentual
 * com o "%" ("42%"). A unidade não se repete em cada rótulo: vai uma vez, acima do eixo (`unidadeDoEixo`).
 */
export function textoDoEixo(v: number, { formato = "numero", casas }: ComoMostrar = {}) {
  if (formato === "percentual") return new Intl.NumberFormat(idioma, { style: "percent", maximumFractionDigits: casas ?? 0 }).format(v)
  if (Math.abs(v) < 1000 && casas !== undefined) return numeroCom(v, casas)
  return fmt.compacto.format(v)
}

/** O símbolo da moeda em uso ("R$"). */
export function simboloDaMoeda() {
  return fmt.moeda.formatToParts(0).find((p) => p.type === "currency")?.value ?? moedaAtual
}

/** O que vai acima do eixo de valores: "R$", a unidade no plural ("alunos", "MW") ou nada (percentual já diz "%"). */
export function unidadeDoEixo({ formato = "numero", unidade }: ComoMostrar = {}) {
  if (formato === "moeda") return simboloDaMoeda()
  if (formato === "percentual") return undefined
  return unidadeDe(2, unidade)
}

/** "1.234,56", "1234.5" ou "R$ 10" viram número; vazio ou inválido vira NaN. */
export function lerMoeda(texto: string) {
  let t = texto.replace(/[^\d.,-]/g, "")
  if (!t) return NaN
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".")
  else if ((t.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, "")
  return Number(t)
}

// Datas: "aaaa-mm-dd" é lido ao meio-dia, para o fuso não trocar o dia.
const data = (iso: string | Date) => (typeof iso === "string" ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso) : iso)
// Um Intl.DateTimeFormat por formato e idioma: toLocaleDateString com opções cria um a cada chamada (caro numa lista).
const formatadores = new Map<string, Intl.DateTimeFormat>()
function fd(d: Date, opcoes?: Intl.DateTimeFormatOptions) {
  const chave = idioma + JSON.stringify(opcoes ?? {})
  let f = formatadores.get(chave)
  if (!f) formatadores.set(chave, (f = new Intl.DateTimeFormat(idioma, opcoes)))
  return f.format(d)
}
/** 05/10 (serve de formatador de eixo: só lê o primeiro argumento) */
export const dataCurta = (iso: string | Date) => fd(data(iso), { day: "2-digit", month: "2-digit" })
/** 05/10/26 (tabelas estreitas no celular) */
export const dataCompacta = (iso: string | Date) => fd(data(iso), { day: "2-digit", month: "2-digit", year: "2-digit" })
/** 05/10/2026 */
export const dataLonga = (iso: string | Date) => fd(data(iso))
/** 05/10/2026 às 14:30 · com { ano: false }: 05/10 às 14:30 */
export function dataHora(iso: string | Date, { ano = true }: { ano?: boolean } = {}) {
  const d = data(iso)
  const dia = ano ? fd(d) : fd(d, { day: "2-digit", month: "2-digit" })
  return `${dia} às ${fd(d, { hour: "2-digit", minute: "2-digit" })}`
}
/** "2026-10-05" a partir de um CalendarDate do React Aria (ou {year, month, day}). */
// Ano com 4 algarismos sempre: enquanto o ano é digitado ("1", "19"…), o campo já tem uma data completa (ano 1), e
// "1-03-15" não volta pelo parseDate (o campo zerava dia e mês no meio da digitação).
export const isoDe = (d: { year: number; month: number; day: number }) => `${String(d.year).padStart(4, "0")}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`

// ---------- Acréscimos do starter ----------
/** R$ 1.235 (sem centavos) */
export const moedaInteira = (v: number) => fmt.moedaInteira.format(v)
/** 1.235 (inteiro com separador de milhar) */
export const numero = (v: number) => new Intl.NumberFormat(idioma).format(Math.round(v))
/** segunda-feira, 16 de novembro */
export const dataPorExtenso = (iso: string | Date) => fd(data(iso), { weekday: "long", day: "numeric", month: "long" })
