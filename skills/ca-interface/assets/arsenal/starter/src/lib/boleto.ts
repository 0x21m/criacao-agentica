import { aplicarMascara, padroes } from "@/lib/mascara"

// MIFT: linha digitável de boleto (contas pelo celular, onda A). Duas famílias, pelas regras públicas da FEBRABAN:
//   bancario     47 dígitos em 5 campos: os 3 primeiros com dígito de módulo 10, o 4º é o verificador geral do código de
//                barras (módulo 11) e o 5º traz o fator de vencimento (4) e o valor (10, em centavos)
//   arrecadacao  48 dígitos, começa por 8 (conta de consumo, tributo): 4 blocos de 11 com um dígito cada; o 3º dígito
//                diz o módulo (6 ou 7: 10; 8 ou 9: 11) e, em 6 e 8, o valor está nas posições 5 a 15 do código
// O fator de vencimento chegou a 9999 em 21/02/2025 e recomeçou em 1000 no dia seguinte: a data é a do ciclo mais
// perto de `agora`. Nada aqui consulta banco: a conferência é só dos dígitos (um boleto pago ou cancelado passa).
// `gerarLinhaDigitavel` dá linhas FICTÍCIAS, com os dígitos certos, para testes e laboratórios.

export type TipoDeBoleto = "bancario" | "arrecadacao"

export type LeituraDoBoleto = {
  tipo: TipoDeBoleto
  /** Todos os dígitos digitados (47 ou 48). */
  completo: boolean
  /** Completo e com todos os dígitos verificadores certos. */
  valido: boolean
  /** O primeiro campo que não confere ("Campo 2", "Bloco 3", "Dígito geral"), para a mensagem dizer onde olhar. */
  campoComErro?: string
  /** Valor em reais (0 quando o boleto não traz valor). */
  valor?: number
  /** Vencimento (meia-noite local); ausente quando o fator é zero. */
  vencimento?: Date
}

const so = (s: string) => s.replace(/\D/g, "")

/** Módulo 10 dos campos: pesos 2 e 1 da direita para a esquerda, somando os algarismos de cada produto. */
export function modulo10(numero: string) {
  let soma = 0
  let peso = 2
  for (let i = numero.length - 1; i >= 0; i--) {
    const p = Number(numero[i]) * peso
    soma += p > 9 ? p - 9 : p
    peso = peso === 2 ? 1 : 2
  }
  return (10 - (soma % 10)) % 10
}

function soma11(numero: string) {
  let soma = 0
  let peso = 2
  for (let i = numero.length - 1; i >= 0; i--) {
    soma += Number(numero[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  return soma % 11
}

/** Verificador geral do boleto bancário (módulo 11, pesos 2 a 9): resto que daria 0, 10 ou 11 vira 1. */
export function modulo11Bancario(numero: string) {
  const dv = 11 - soma11(numero)
  return dv === 0 || dv === 10 || dv === 11 ? 1 : dv
}

/** Módulo 11 da arrecadação: resto 0 ou 1 dá 0. */
export function modulo11Arrecadacao(numero: string) {
  const r = soma11(numero)
  return r <= 1 ? 0 : 11 - r
}

const DIA = 86_400_000
const BASE_ANTIGA = Date.UTC(1997, 9, 7) // fator 0 do primeiro ciclo (1000 = 03/07/2000)
const BASE_NOVA = Date.UTC(2025, 1, 22) - 1000 * DIA // o fator 1000 voltou em 22/02/2025

/** A data do fator de vencimento, no ciclo mais perto de `agora`. Fator 0: sem vencimento. */
export function dataDoFator(fator: number, agora = Date.now()): Date | undefined {
  if (!fator) return undefined
  const candidatas = [BASE_ANTIGA + fator * DIA, BASE_NOVA + fator * DIA]
  const utc = candidatas.reduce((a, b) => (Math.abs(b - agora) < Math.abs(a - agora) ? b : a))
  const d = new Date(utc)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** O fator de uma data (do ciclo atual, a partir de 22/02/2025). */
export function fatorDaData(data: Date) {
  const utc = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
  const fator = Math.round((utc - BASE_NOVA) / DIA)
  return fator >= 1000 && fator <= 9999 ? fator : Math.round((utc - BASE_ANTIGA) / DIA)
}

/** Lê a linha digitável (crua ou formatada): tipo, se está completa, se confere, valor e vencimento. */
export function lerLinhaDigitavel(entrada: string, agora = Date.now()): LeituraDoBoleto {
  const d = so(entrada)
  if (d[0] === "8") {
    const completo = d.length === 48
    const leitura: LeituraDoBoleto = { tipo: "arrecadacao", completo, valido: false }
    if (!completo) return leitura
    const modulo = d[2] === "6" || d[2] === "7" ? modulo10 : d[2] === "8" || d[2] === "9" ? modulo11Arrecadacao : null
    if (!modulo) return { ...leitura, campoComErro: "Bloco 1" }
    for (let b = 0; b < 4; b++) {
      const bloco = d.slice(b * 12, b * 12 + 11)
      if (modulo(bloco) !== Number(d[b * 12 + 11])) return { ...leitura, campoComErro: `Bloco ${b + 1}` }
    }
    const barras = [0, 1, 2, 3].map((b) => d.slice(b * 12, b * 12 + 11)).join("")
    if (modulo(barras.slice(0, 3) + barras.slice(4)) !== Number(barras[3])) return { ...leitura, campoComErro: "Dígito geral" }
    const temValor = d[2] === "6" || d[2] === "8"
    return { ...leitura, valido: true, valor: temValor ? Number(barras.slice(4, 15)) / 100 : 0 }
  }
  const completo = d.length === 47
  const leitura: LeituraDoBoleto = { tipo: "bancario", completo, valido: false }
  if (!completo) return leitura
  const campos: [string, number][] = [
    [d.slice(0, 9), Number(d[9])],
    [d.slice(10, 20), Number(d[20])],
    [d.slice(21, 31), Number(d[31])],
  ]
  for (const [i, [numero, dv]] of campos.entries()) if (modulo10(numero) !== dv) return { ...leitura, campoComErro: `Campo ${i + 1}` }
  // O código de barras sem o verificador geral: banco e moeda, fator e valor, campo livre.
  const barras = d.slice(0, 4) + d.slice(33, 47) + d.slice(4, 9) + d.slice(10, 20) + d.slice(21, 31)
  if (modulo11Bancario(barras) !== Number(d[32])) return { ...leitura, campoComErro: "Dígito geral" }
  const fator = Number(d.slice(33, 37))
  return { ...leitura, valido: true, valor: Number(d.slice(37, 47)) / 100, vencimento: dataDoFator(fator, agora) }
}

/** Texto formatado da linha (como o banco imprime). */
export const formatarLinhaDigitavel = (cru: string) => aplicarMascara(padroes.linhaDigitavel, cru).texto

/**
 * Linha digitável FICTÍCIA com os dígitos certos. Bancária: banco "999" (não existe), o valor e o vencimento pedidos e
 * campo livre ao acaso. Arrecadação: segmento 9 ("uso exclusivo"), com valor. Só para testes e laboratórios.
 */
export function gerarLinhaDigitavel({
  tipo = "bancario",
  valor = 0,
  vencimento,
  sorteio = Math.random,
}: { tipo?: TipoDeBoleto; valor?: number; vencimento?: Date; sorteio?: () => number } = {}): string {
  const digitos = (n: number) => Array.from({ length: n }, () => Math.floor(sorteio() * 10) % 10).join("")
  const centavos = Math.round(valor * 100)
  if (tipo === "arrecadacao") {
    // 8 · segmento 9 · id 6 (valor em reais, módulo 10) · DV · valor (11) · empresa e livre (29)
    const semDv = "896" + String(centavos).padStart(11, "0") + digitos(29)
    const barras = semDv.slice(0, 3) + modulo10(semDv) + semDv.slice(3)
    return [0, 1, 2, 3].map((b) => barras.slice(b * 11, b * 11 + 11)).map((bloco) => bloco + modulo10(bloco)).join("")
  }
  const fator = vencimento ? String(fatorDaData(vencimento)).padStart(4, "0") : "0000"
  const livre = digitos(25)
  const fatorEValor = fator + String(centavos).padStart(10, "0")
  const inicio = "9999"
  const dv = modulo11Bancario(inicio + fatorEValor + livre)
  const c1 = inicio + livre.slice(0, 5)
  const c2 = livre.slice(5, 15)
  const c3 = livre.slice(15, 25)
  return c1 + modulo10(c1) + c2 + modulo10(c2) + c3 + modulo10(c3) + dv + fatorEValor
}
