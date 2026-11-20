export type Padrao = string
export type PadraoVariavel = (cru: string) => Padrao

// MIFT: motor de máscara próprio, só controlado (fase 6, `laboratorio/relatorios/fluxos-api.md` §3.4). No `Padrao`,
// "0" é dígito, "a" é letra, "A" é letra ou dígito (as letras viram maiúsculas) e qualquer outro caractere é literal
// (nunca letra nem dígito).
// `PadraoVariavel` escolhe o padrão pelo que já foi digitado (telefone fixo ou celular, CPF ou CNPJ). O valor
// guardado é o cru (dígitos; no CNPJ, letras maiúsculas e dígitos); o texto da tela sai daqui. Um literal só aparece
// quando há caractere depois dele ("123.4", nunca "123."), então o Backspace no fim nunca esbarra num ponto. O cursor
// é refeito pela contagem de caracteres significativos (`cursorPara`), não pela posição no texto. O gancho que liga
// isto a um campo é o `useMascara` (`fluxos/campos-br.tsx`).

const letraOuDigito = /^[0-9A-Za-z]$/

/** Caractere que conta (letra ou dígito); o resto é literal da máscara. */
export const significativo = (c: string | undefined) => !!c && letraOuDigito.test(c)

const ehToken = (t: string) => t === "0" || t === "a" || t === "A"
const aceita = (token: string, c: string) => (token === "0" ? c >= "0" && c <= "9" : token === "a" ? /^[A-Za-z]$/.test(c) : letraOuDigito.test(c))

const celular = "(00) 00000-0000"
const cpf = "000.000.000-00"
const cnpj = "AA.AAA.AAA/AAAA-00"

export const padroes: {
  cpf: Padrao
  cnpj: Padrao
  cep: Padrao
  celular: Padrao
  /** 10 dígitos "(00) 0000-0000"; 11, ou o 9 depois do DDD, "(00) 00000-0000" (o desenho não pula ao digitar). */
  telefone: PadraoVariavel
  /** Até 11 números, CPF; com letra ou mais de 11, CNPJ. */
  cpfOuCnpj: PadraoVariavel
  /** Placa: Mercosul "ABC1D23"; com número na 5ª posição, a antiga "ABC-1234". */
  placa: PadraoVariavel
  /** Linha digitável: boleto bancário (47 dígitos) ou, começando por 8, conta de consumo e tributo (48). */
  linhaDigitavel: PadraoVariavel
} = {
  cpf,
  cnpj,
  cep: "00000-000",
  celular,
  telefone: (cru) => (cru.length > 10 || cru[2] === "9" ? celular : "(00) 0000-0000"),
  cpfOuCnpj: (cru) => (/[A-Za-z]/.test(cru) || cru.length > 11 ? cnpj : cpf),
  placa: (cru) => (cru.length >= 5 && /\d/.test(cru[4]!) ? "aaa-0000" : "aaa0a00"),
  linhaDigitavel: (cru) => (cru[0] === "8" ? "00000000000-0 00000000000-0 00000000000-0 00000000000-0" : "00000.00000 00000.000000 00000.000000 0 00000000000000"),
}

function preencher(padrao: Padrao, entrada: string) {
  let texto = ""
  let cru = ""
  let literais = ""
  let j = 0
  for (const token of padrao) {
    if (!ehToken(token)) {
      literais += token
      continue
    }
    let achado: string | null = null
    while (j < entrada.length) {
      const c = entrada[j++]
      if (aceita(token, c)) {
        achado = c.toUpperCase()
        break
      }
    }
    if (achado === null) break
    texto += literais + achado
    cru += achado
    literais = ""
  }
  return { texto, cru }
}

/**
 * Formata qualquer entrada (digitada, colada formatada, com lixo) pelo padrão. Caractere que não cabe no token
 * (letra no CPF) é ignorado; o que passa do fim do padrão, descartado.
 */
export function aplicarMascara(padrao: Padrao | PadraoVariavel, entrada: string): { texto: string; cru: string } {
  if (typeof padrao === "string") return preencher(padrao, entrada)
  const previo = padrao(entrada.replace(/[^0-9A-Za-z]/g, "").toUpperCase())
  const primeiro = preencher(previo, entrada)
  const final = padrao(primeiro.cru)
  return final === previo ? primeiro : preencher(final, primeiro.cru)
}

/** Padrão fixo que vale para este cru. */
export const padraoPara = (padrao: Padrao | PadraoVariavel, cru: string): Padrao => (typeof padrao === "string" ? padrao : padrao(cru))

/** Posição no texto formatado logo depois do n-ésimo caractere significativo (0 = início). */
export function cursorPara(texto: string, significativosAntes: number): number {
  if (significativosAntes <= 0) return 0
  let vistos = 0
  for (let i = 0; i < texto.length; i++) if (significativo(texto[i]) && ++vistos === significativosAntes) return i + 1
  return texto.length
}

/** Quantos caracteres significativos há antes de uma posição do texto formatado. */
export function significativosAntes(texto: string, posicao: number): number {
  let n = 0
  for (let i = 0; i < Math.min(posicao, texto.length); i++) if (significativo(texto[i])) n++
  return n
}

export type Edicao = { texto: string; cru: string; cursor: number }

/**
 * Depois de uma edição feita pelo navegador (digitar, colar, apagar, ditar): o texto formatado e onde o cursor fica.
 * `selecao` é a posição do cursor no texto editado. Com `anterior` (o cru de antes) e `tipo` (o `inputType`), pega o
 * Backspace do teclado virtual, que não avisa a tecla (Android manda 229): se só um literal sumiu, apaga o caractere
 * significativo do outro lado dele.
 */
export function reformatar(padrao: Padrao | PadraoVariavel, editado: string, selecao: number, anterior?: string, tipo?: string): Edicao {
  const r = aplicarMascara(padrao, editado)
  let n = Math.min(aplicarMascara(padraoPara(padrao, r.cru), editado.slice(0, selecao)).cru.length, r.cru.length)
  let cru = r.cru
  if (anterior !== undefined && cru === anterior && editado.length < aplicarMascara(padrao, anterior).texto.length) {
    if (tipo === "deleteContentBackward" && n > 0) {
      cru = cru.slice(0, n - 1) + cru.slice(n)
      n--
    } else if (tipo === "deleteContentForward" && n < cru.length) cru = cru.slice(0, n) + cru.slice(n + 1)
  }
  const final = cru === r.cru ? r : aplicarMascara(padrao, cru)
  return { texto: final.texto, cru: final.cru, cursor: cursorPara(final.texto, n) }
}

/**
 * Backspace (`tras`) ou Delete (`frente`) com o cursor encostado num literal ("123.|456"): apaga o caractere
 * significativo do outro lado dele ("12|4.56"). Devolve null quando a tecla pode seguir normal (o vizinho é
 * significativo ou não há vizinho).
 */
export function apagarAoLado(padrao: Padrao | PadraoVariavel, texto: string, posicao: number, direcao: "tras" | "frente"): Edicao | null {
  const vizinho = direcao === "tras" ? texto[posicao - 1] : texto[posicao]
  if (vizinho === undefined || significativo(vizinho)) return null
  const atual = aplicarMascara(padrao, texto)
  const i = significativosAntes(texto, posicao) - (direcao === "tras" ? 1 : 0)
  if (i < 0 || i >= atual.cru.length) return { ...atual, cursor: posicao }
  const r = aplicarMascara(padrao, atual.cru.slice(0, i) + atual.cru.slice(i + 1))
  return { texto: r.texto, cru: r.cru, cursor: cursorPara(r.texto, i) }
}
