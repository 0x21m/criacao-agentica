import { aplicarMascara, padroes } from "@/lib/mascara"

// MIFT: documentos brasileiros com algoritmo próprio, público e estável (fase 6, `fluxos-api.md` §3.4). Recebem o
// cru, mas aceitam o texto formatado (tiram pontuação antes). CNPJ alfanumérico (Receita Federal, a partir de julho
// de 2026): os 12 primeiros caracteres são letras maiúsculas ou dígitos, cada um vale o código ASCII − 48 ("0" = 0,
// "A" = 17), pesos de 2 a 9 da direita para a esquerda e módulo 11, como no numérico; os 2 verificadores continuam
// numéricos. `gerarCpf` e `gerarCnpj` dão números FICTÍCIOS (aleatórios, com os verificadores certos) para testes e
// laboratórios: nunca use número de pessoa ou empresa real.

const limpar = (s: string) => s.replace(/[^0-9A-Za-z]/g, "").toUpperCase()
const repetido = (s: string) => /^(.)\1*$/.test(s)

/** Dígito verificador do CPF: pesos decrescentes até 2 (10…2 no primeiro, 11…2 no segundo). */
function digitoCpf(base: string) {
  let soma = 0
  for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

/** Dígito verificador do CNPJ (numérico ou alfanumérico): pesos 2…9 da direita para a esquerda, recomeçando. */
function digitoCnpj(base: string) {
  let soma = 0
  let peso = 2
  for (let i = base.length - 1; i >= 0; i--) {
    soma += (base.charCodeAt(i) - 48) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cpfValido(cru: string): boolean {
  const d = limpar(cru)
  if (!/^\d{11}$/.test(d) || repetido(d)) return false
  return digitoCpf(d.slice(0, 9)) === Number(d[9]) && digitoCpf(d.slice(0, 10)) === Number(d[10])
}

export function cnpjValido(cru: string): boolean {
  const d = limpar(cru)
  if (!/^[0-9A-Z]{12}\d{2}$/.test(d) || repetido(d)) return false
  return digitoCnpj(d.slice(0, 12)) === Number(d[12]) && digitoCnpj(d.slice(0, 13)) === Number(d[13])
}

export function cepValido(cru: string): boolean {
  const d = limpar(cru)
  return /^\d{8}$/.test(d) && d !== "00000000"
}

/**
 * DDD de 11 a 99 (nenhum termina em 0); 10 dígitos é fixo (começa com 2 a 5 depois do DDD); 11 dígitos é celular
 * (começa com 9). `so: "celular"` recusa o fixo.
 */
export function telefoneValido(cru: string, so?: "celular"): boolean {
  const d = limpar(cru)
  if (!/^[1-9][1-9]\d{8,9}$/.test(d)) return false
  if (d.length === 11) return d[2] === "9"
  return so !== "celular" && d[2] >= "2" && d[2] <= "5"
}

export const formatar: Record<"cpf" | "cnpj" | "cpfOuCnpj" | "cep" | "telefone", (cru: string) => string> = {
  cpf: (cru) => aplicarMascara(padroes.cpf, cru).texto,
  cnpj: (cru) => aplicarMascara(padroes.cnpj, cru).texto,
  cpfOuCnpj: (cru) => aplicarMascara(padroes.cpfOuCnpj, cru).texto,
  cep: (cru) => aplicarMascara(padroes.cep, cru).texto,
  telefone: (cru) => aplicarMascara(padroes.telefone, cru).texto,
}

type Sorteio = { sorteio?: () => number }
const ALFANUMERICOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const sortear = (sorteio: () => number, de: string, n: number) =>
  Array.from({ length: n }, () => de[Math.floor(sorteio() * de.length) % de.length]).join("")

/** CPF fictício (cru, 11 dígitos), aleatório e com os verificadores certos. Só para testes e laboratórios. */
export function gerarCpf({ sorteio = Math.random }: Sorteio = {}): string {
  let base: string
  do base = sortear(sorteio, "0123456789", 9)
  while (repetido(base))
  const d1 = digitoCpf(base)
  return base + d1 + digitoCpf(base + d1)
}

/**
 * CNPJ fictício (cru, 14 caracteres) com os verificadores certos. Numérico: raiz aleatória e filial 0001.
 * `alfanumerico`: os 12 primeiros com letras e dígitos (ao menos uma letra). Só para testes e laboratórios.
 */
export function gerarCnpj({ alfanumerico = false, sorteio = Math.random }: Sorteio & { alfanumerico?: boolean } = {}): string {
  let base: string
  do base = alfanumerico ? sortear(sorteio, ALFANUMERICOS, 12) : sortear(sorteio, "0123456789", 8) + "0001"
  while (repetido(base.slice(0, 8)) || (alfanumerico && !/[A-Z]/.test(base)))
  const d1 = digitoCnpj(base)
  return base + d1 + digitoCnpj(base + d1)
}
