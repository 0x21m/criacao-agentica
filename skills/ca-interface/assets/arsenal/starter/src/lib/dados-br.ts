import { gerarLinhaDigitavel } from "@/lib/boleto"
import { formatar, gerarCnpj, gerarCpf } from "@/lib/documentos"

// MIFT: `dados-br`, o gerador de dados FICTÍCIOS brasileiros para os `exemplo.ts`, a vitrine e os testes (onda A).
// Com a mesma semente, os mesmos dados em toda rodada (a captura e a jornada não mudam de um dia para o outro); as
// datas são relativas ao `agora` que se passa. Coerência: o CEP cai na faixa da UF, o DDD é o da cidade, o telefone usa
// esse DDD, o e-mail sai do nome. As cidades são inventadas (com UF, DDD e faixa de CEP de verdade) e os bairros
// também; CPF e CNPJ saem com os verificadores certos pelo `lib/documentos`; placas e boletos, com a forma certa.
// Nada aqui é de pessoa, empresa ou veículo real: o número é sorteado e pode coincidir com um que exista, então nunca
// use estes dados fora de exemplo e teste.
// Modo `pior-caso`: nomes de 60 caracteres e de uma letra, sem sobrenome, com acento e apóstrofo; logradouro longo,
// complemento comprido; valores extremos (centavos e milhões); datas muito antigas e muito à frente.
//   const br = criarDadosBr({ semente: 27 })
//   const cliente = br.pessoa()            // { nome, cpf, telefone, email, endereco: { cep, cidade, uf, … } }
//   const pedidos = br.lista(12, () => ({ id: br.codigo("P-", 4), valor: br.valor(20, 900), quando: br.data(-30, 0) }))

export type ModoDosDados = "normal" | "pior-caso"

export type CidadeFicticia = {
  nome: string
  uf: string
  ddd: string
  /** Faixa de CEP (5 primeiros dígitos, inclusive) dentro da faixa real da UF. */
  cep: [number, number]
  bairros: readonly string[]
}

/** Cidades inventadas, uma por região, com UF, DDD e faixa de CEP coerentes. */
export const CIDADES: readonly CidadeFicticia[] = [
  { nome: "Vale do Jatobá", uf: "SP", ddd: "15", cep: [18200, 18299], bairros: ["Jardim das Paineiras", "Vila Esperança", "Centro", "Parque do Ribeirão"] },
  { nome: "Pedra Lisa", uf: "RJ", ddd: "22", cep: [28700, 28799], bairros: ["Praia do Sossego", "Morro Azul", "Centro"] },
  { nome: "Serra Clara", uf: "MG", ddd: "35", cep: [37600, 37699], bairros: ["Alto da Boa Vista", "Bela Aurora", "Centro", "Recanto dos Ipês"] },
  { nome: "Porto Anil", uf: "BA", ddd: "73", cep: [45900, 45999], bairros: ["Coqueiral", "Ponta do Farol", "Centro"] },
  { nome: "Baía Turquesa", uf: "PE", ddd: "81", cep: [55500, 55599], bairros: ["Boa Maré", "Várzea Nova", "Centro"] },
  { nome: "Juremal", uf: "CE", ddd: "88", cep: [63500, 63599], bairros: ["Cajueiro", "Alto do Sol", "Centro"] },
  { nome: "Igarapé Novo", uf: "PA", ddd: "93", cep: [68200, 68299], bairros: ["Beira-Rio", "Açaizal", "Centro"] },
  { nome: "Buriti Alto", uf: "GO", ddd: "64", cep: [75900, 75999], bairros: ["Setor das Araras", "Vila Cerrado", "Centro"] },
  { nome: "Tuiuiú do Pantanal", uf: "MS", ddd: "67", cep: [79400, 79499], bairros: ["Jardim Aguapé", "Vila Baía", "Centro"] },
  { nome: "Campo Alecrim", uf: "PR", ddd: "44", cep: [87700, 87799], bairros: ["Jardim Araucária", "Vila Primavera", "Centro"] },
  { nome: "Lagoa Serena", uf: "SC", ddd: "47", cep: [89100, 89199], bairros: ["Itoupava do Norte", "Rio Claro", "Centro"] },
  { nome: "Santa Aurora do Sul", uf: "RS", ddd: "54", cep: [95700, 95799], bairros: ["São Cristóvão das Videiras", "Vila Nova", "Centro"] },
]

/** Prenomes de várias origens (indígena, japonesa, árabe, nordestina, compostos e curtos), sem pessoa real. */
const PRENOMES = [
  "Iara", "Raoni", "Kauê", "Potira", "Jaci", "Moacir", "Ubiratã",
  "Hiroshi", "Akemi", "Yuki", "Kenji", "Sayuri", "Takeshi",
  "Samir", "Layla", "Nadia", "Omar", "Jamile", "Rafiq",
  "Cícero", "Raimunda", "Josenildo", "Edilene", "Francisca", "Damião",
  "Ana Clara", "João Pedro", "Maria Eduarda", "José Carlos", "Ana Beatriz",
  "Zé", "Bia", "Lu", "Téo", "Rui",
  "Thiago", "Camila", "Débora", "Wellington", "Priscila", "Gabriel", "Letícia",
]
const SOBRENOMES = [
  "Potiguara", "Guajajara", "Terena",
  "Tanaka", "Nakamura", "Watanabe", "Sato", "Kobayashi",
  "Haddad", "Nassar", "Khoury", "Salomão", "Abdalla",
  "Bezerra", "Cavalcanti", "Araújo", "Nóbrega", "Sampaio", "Feitosa",
  "Silva", "Souza", "Oliveira", "Costa", "Rocha", "Lima", "Duarte", "Prado", "Moreira",
]
/** Os de pior caso: 60 caracteres, uma letra, sem sobrenome, apóstrofo, hífen. */
const NOMES_PIOR_CASO = [
  "Maria Aparecida dos Anjos Albuquerque Cavalcanti de Oliveira",
  "Francisco das Chagas Nóbrega Bezerra de Araújo Cavalcanti",
  "Ô",
  "Zé",
  "Joana D'Ávila",
  "Ana-Lívia Nakamura-Haddad",
  "Ubiratã",
]
const RUAS = ["Rua das Acácias", "Avenida Beira-Rio", "Rua Sete de Setembro", "Travessa do Sabiá", "Rua Pau-Brasil", "Avenida das Palmeiras", "Rua do Ipê-Amarelo", "Alameda dos Guarás"]
const RUAS_PIOR_CASO = ["Avenida Governador Doutor Professor Antônio Carlos de Albuquerque Magalhães", "Rua A"]
const EMPRESAS = ["Ateliê Bem-te-vi", "Padaria Grão Dourado", "Transportes Rio Manso", "Clínica Sol Nascente", "Mercearia Dois Irmãos", "Oficina Ponto Certo", "Estúdio Maré Alta"]
const NATUREZAS = ["Ltda.", "ME", "S.A.", "Eireli"]

/** Sorteio com semente (mulberry32): a mesma sequência para a mesma semente. */
export function criarSorteio(semente: number) {
  let s = semente | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")

export type EnderecoFicticio = {
  /** Cru, 8 dígitos. */
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  ddd: string
}

export type PessoaFicticia = {
  nome: string
  /** Para "Olá, Iara" (o primeiro nome; no composto, os dois). */
  primeiroNome: string
  /** Cru, 11 dígitos. */
  cpf: string
  /** Cru, DDD + número. */
  telefone: string
  email: string
  endereco: EnderecoFicticio
  nascimento: Date
}

export function criarDadosBr({ semente = 1, modo = "normal", agora = Date.now() }: { semente?: number; modo?: ModoDosDados; agora?: number } = {}) {
  const sorteio = criarSorteio(semente)
  const pior = modo === "pior-caso"
  const inteiro = (de: number, ate: number) => de + Math.floor(sorteio() * (ate - de + 1))
  const escolher = <T>(lista: readonly T[]): T => lista[Math.floor(sorteio() * lista.length) % lista.length]!
  /** Verdadeiro com a chance dada (0 a 1). */
  const chance = (p: number) => sorteio() < p

  function nome() {
    if (pior && chance(0.6)) return escolher(NOMES_PIOR_CASO)
    const prenome = escolher(PRENOMES)
    if (prenome.length <= 3 && chance(0.4)) return prenome // "Zé", sem sobrenome
    const a = escolher(SOBRENOMES)
    const b = escolher(SOBRENOMES)
    return chance(0.35) && a !== b ? `${prenome} ${a} ${b}` : `${prenome} ${a}`
  }
  const primeiroNome = (n: string) => (PRENOMES.find((p) => p.includes(" ") && n.startsWith(p + " ")) ?? n.split(" ")[0]!)

  function cidade(uf?: string) {
    const lista = uf ? CIDADES.filter((c) => c.uf === uf) : CIDADES
    return escolher(lista.length ? lista : CIDADES)
  }

  function endereco(de?: CidadeFicticia): EnderecoFicticio {
    const c = de ?? cidade()
    const cep = String(inteiro(c.cep[0], c.cep[1])).padStart(5, "0") + String(inteiro(0, 999)).padStart(3, "0")
    const longo = pior && chance(0.5)
    return {
      cep,
      logradouro: longo ? escolher(RUAS_PIOR_CASO) : escolher(RUAS),
      numero: pior && chance(0.3) ? "s/n" : String(inteiro(1, pior ? 99999 : 2400)),
      complemento: longo ? "Bloco 14, apartamento 1203, fundos, entrada pela rua de trás" : chance(0.3) ? `Apto ${inteiro(11, 304)}` : undefined,
      bairro: escolher(c.bairros),
      cidade: c.nome,
      uf: c.uf,
      ddd: c.ddd,
    }
  }

  function telefone({ ddd, celular = true }: { ddd?: string; celular?: boolean } = {}) {
    const d = ddd ?? cidade().ddd
    return celular ? `${d}9${inteiro(6000, 9999)}${String(inteiro(0, 9999)).padStart(4, "0")}` : `${d}${inteiro(2, 5)}${String(inteiro(0, 9999999)).padStart(7, "0")}`
  }

  function email(de: string) {
    const partes = sem(de).toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter(Boolean)
    const base = partes.length > 1 ? `${partes[0]}.${partes[partes.length - 1]}` : (partes[0] ?? "pessoa")
    return `${base}${chance(0.3) ? inteiro(1, 99) : ""}@correio.test`
  }

  /** Valor em reais com centavos, entre `min` e `max`. No pior caso, às vezes um centavo ou milhões. */
  function valor(min = 10, max = 1000) {
    if (pior && chance(0.25)) return escolher([0.01, 9_999_999.99, 1_234_567.89])
    return Math.round((min + sorteio() * (max - min)) * 100) / 100
  }

  /** Uma data entre `deDias` e `ateDias` do agora (negativo é passado), na hora cheia ou quebrada. */
  function data(deDias = -30, ateDias = 0) {
    if (pior && chance(0.15)) return new Date(agora + escolher([-3650, 3650]) * 86_400_000)
    return new Date(agora + (deDias + sorteio() * (ateDias - deDias)) * 86_400_000)
  }

  function pessoa({ uf }: { uf?: string } = {}): PessoaFicticia {
    const n = nome()
    const e = endereco(cidade(uf))
    return {
      nome: n,
      primeiroNome: primeiroNome(n),
      cpf: gerarCpf({ sorteio }),
      telefone: telefone({ ddd: e.ddd }),
      email: email(n),
      endereco: e,
      nascimento: new Date(agora - inteiro(18 * 365, 85 * 365) * 86_400_000),
    }
  }

  function empresa({ uf }: { uf?: string } = {}) {
    const fantasia = pior && chance(0.5) ? "Cooperativa Agroindustrial dos Produtores Rurais do Vale do Jatobá" : escolher(EMPRESAS)
    const e = endereco(cidade(uf))
    return {
      nome: fantasia,
      razaoSocial: `${fantasia} ${escolher(NATUREZAS)}`,
      cnpj: gerarCnpj({ sorteio, alfanumerico: chance(0.2) }),
      telefone: telefone({ ddd: e.ddd, celular: chance(0.5) }),
      email: `contato@${sem(fantasia).toLowerCase().replace(/[^a-z]/g, "").slice(0, 20)}.test`,
      endereco: e,
    }
  }

  /** Placa fictícia: Mercosul ("ABC1D23") ou antiga ("ABC1234", cru). */
  function placa(forma: "mercosul" | "antiga" = chance(0.7) ? "mercosul" : "antiga") {
    const letra = () => String.fromCharCode(65 + inteiro(0, 25))
    const tres = letra() + letra() + letra()
    return forma === "mercosul" ? `${tres}${inteiro(0, 9)}${letra()}${inteiro(0, 9)}${inteiro(0, 9)}` : `${tres}${String(inteiro(0, 9999)).padStart(4, "0")}`
  }

  return {
    sorteio,
    inteiro,
    escolher,
    chance,
    nome,
    cidade,
    endereco,
    telefone,
    email,
    valor,
    data,
    pessoa,
    empresa,
    placa,
    cpf: () => gerarCpf({ sorteio }),
    cnpj: (o: { alfanumerico?: boolean } = {}) => gerarCnpj({ sorteio, ...o }),
    /** Boleto fictício (banco "999", não existe): a linha digitável crua. */
    boleto: (o: { valor?: number; vencimento?: Date; tipo?: "bancario" | "arrecadacao" } = {}) => gerarLinhaDigitavel({ sorteio, valor: o.valor ?? valor(30, 900), vencimento: o.vencimento ?? data(1, 20), tipo: o.tipo }),
    /** Código com prefixo e dígitos ("P-0412"). */
    codigo: (prefixo = "", digitos = 4) => prefixo + String(inteiro(0, 10 ** digitos - 1)).padStart(digitos, "0"),
    lista: <T>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i)),
  }
}

export type DadosBr = ReturnType<typeof criarDadosBr>

/** Formatação dos campos de uma pessoa fictícia, para mostrar (o cru continua no dado). */
export const mostrar = {
  cpf: formatar.cpf,
  cnpj: formatar.cnpj,
  cep: formatar.cep,
  telefone: formatar.telefone,
}
