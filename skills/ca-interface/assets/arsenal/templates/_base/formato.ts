// Formatação pt-BR usada por todos os templates. Troque aqui moeda e locale ao adaptar.
const LOCALE = "pt-BR"

const brlFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL" })
const brlInteiroFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const brlCompactoFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 })
const numFmt = new Intl.NumberFormat(LOCALE)
const pctFmt = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" })
const dataCurtaFmt = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short" })
const dataLongaFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long" })
const horaFmt = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" })

export const brl = (v: number) => brlFmt.format(v)
export const brlInteiro = (v: number) => brlInteiroFmt.format(v)
export const brlCompacto = (v: number) => brlCompactoFmt.format(v)
export const numero = (v: number) => numFmt.format(v)
/** Recebe fração: 0.054 vira "+5,4%". */
export const pct = (v: number) => pctFmt.format(v)
export const dataCurta = (d: Date) => dataCurtaFmt.format(d).replace(".", "")
export const dataLonga = (d: Date) => dataLongaFmt.format(d)
export const hora = (d: Date) => horaFmt.format(d)

/** "Hoje" fixo dos dados fictícios, para as telas renderizarem sempre iguais. */
export const HOJE = new Date(2026, 10, 16, 9, 41)

/** Nome fictício do negócio usado nos templates. Troque ao adaptar. */
export const NEGOCIO = { nome: "Ipê Mercados", app: "Ipê Clube", unidade: "Loja Savassi" }
