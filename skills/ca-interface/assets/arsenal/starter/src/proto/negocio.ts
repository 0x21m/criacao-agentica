// O negócio fictício (seção 1 da especificação): empresa, unidades, horário, feriados, catálogo de serviços e equipe.
// É fixo (não é coleção: não muda na sessão). Arquivo compartilhado: os módulos leem, ninguém edita para um módulo só.
// Ao adaptar o starter a outro produto, troque este arquivo inteiro.
import { chaveDia } from "./relogio"

export const EMPRESA = {
  nome: "Oficina Norte",
  razao: "Oficina Norte Climatização e Manutenção Ltda.",
  cnpj: "41.238.576/0001-79",
  pix: "pix@oficinanorte.com.br",
  whatsapp: "(31) 3456-7800",
  email: "atendimento@oficinanorte.com.br",
  garantiaDias: 90,
  taxaVisita: 120,
  validadeOrcamentoDias: 10,
  pixMinutos: 30,
  boletoDias: 3,
} as const

export type Unidade = "pampulha" | "contagem"
export const UNIDADES: Record<Unidade, { nome: string; endereco: string }> = {
  pampulha: { nome: "Pampulha", endereco: "Rua das Andorinhas, 410, Bandeirantes, Belo Horizonte/MG, 31340-160" },
  contagem: { nome: "Contagem", endereco: "Av. das Indústrias, 1.200, Eldorado, Contagem/MG, 32315-040" },
}

export const FERIADOS: Record<string, string> = {
  "2026-11-02": "Finados",
  "2026-11-15": "Proclamação da República",
  "2026-11-20": "Dia da Consciência Negra",
  "2026-12-25": "Natal",
}
/** Expediente em minutos do dia: seg a sex 8:00–18:00, sáb 8:00–12:00; domingo e feriado fechado (null). */
export function expediente(d: Date): { abre: number; fecha: number } | null {
  if (FERIADOS[chaveDia(d)]) return null
  const s = d.getDay()
  if (s === 0) return null
  return s === 6 ? { abre: 480, fecha: 720 } : { abre: 480, fecha: 1080 }
}

export type Competencia = "climatizacao" | "eletrica" | "montagem" | "bancada"
export const COMPETENCIA: Record<Competencia, string> = { climatizacao: "climatização", eletrica: "serviço elétrico", montagem: "montagem", bancada: "bancada" }

export type Servico = {
  slug: string; nome: string; preco: number | null; aPartirDe?: boolean; porHora?: boolean
  /** Duração em minutos. */ duracao: number; competencia: Competencia
  /** Preço fechado: agenda direto e pula diagnóstico e orçamento. */ precoFechado: boolean
}
export const SERVICOS: Servico[] = [
  { slug: "limpeza-split", nome: "Limpeza de ar-condicionado split", preco: 220, duracao: 90, competencia: "climatizacao", precoFechado: true },
  { slug: "instalacao-split", nome: "Instalação de split até 12.000 BTU", preco: 650, duracao: 180, competencia: "climatizacao", precoFechado: true },
  { slug: "instalacao-split-grande", nome: "Instalação de split de 18.000 a 30.000 BTU", preco: 890, aPartirDe: true, duracao: 240, competencia: "climatizacao", precoFechado: false },
  { slug: "conserto-ar", nome: "Conserto de ar-condicionado", preco: null, duracao: 60, competencia: "climatizacao", precoFechado: false },
  { slug: "eletrica", nome: "Serviço elétrico", preco: null, duracao: 60, competencia: "eletrica", precoFechado: false },
  { slug: "montagem", nome: "Montagem de móveis e prateleiras", preco: 140, porHora: true, duracao: 120, competencia: "montagem", precoFechado: true },
]
export const servicoPorSlug = (s?: string) => SERVICOS.find((x) => x.slug === s)

export type Papel = "dono" | "gestora" | "atendente" | "tecnico" | "financeiro"
export type Pessoa = { id: string; nome: string; curto: string; papel: Papel; unidade: Unidade | "todas"; competencias?: Competencia[]; nota?: string }
/** A equipe (seção 1). Os técnicos e a bancada são os recursos da agenda. */
export const EQUIPE: Pessoa[] = [
  { id: "rogerio", nome: "Rogério Nunes", curto: "Rogério", papel: "dono", unidade: "todas" },
  { id: "marina", nome: "Marina Duarte", curto: "Marina", papel: "gestora", unidade: "pampulha" },
  { id: "ana", nome: "Ana Lima", curto: "Ana", papel: "atendente", unidade: "pampulha" },
  { id: "carla", nome: "Carla Mota", curto: "Carla", papel: "atendente", unidade: "contagem" },
  { id: "bruno", nome: "Bruno Sá", curto: "Bruno", papel: "tecnico", unidade: "pampulha", competencias: ["climatizacao"], nota: "dia lotado na ter 17/11" },
  { id: "diego", nome: "Diego Reis", curto: "Diego", papel: "tecnico", unidade: "pampulha", competencias: ["eletrica", "climatizacao"] },
  { id: "elisa", nome: "Elisa Rocha", curto: "Elisa", papel: "tecnico", unidade: "contagem", competencias: ["climatizacao"] },
  { id: "fabio", nome: "Fábio Antunes", curto: "Fábio", papel: "tecnico", unidade: "contagem", competencias: ["montagem"] },
  { id: "gustavo", nome: "Gustavo Prado", curto: "Gustavo", papel: "tecnico", unidade: "pampulha", competencias: ["climatizacao", "montagem"], nota: "sem nenhum agendamento (pior caso)" },
  { id: "helena", nome: "Helena Vaz", curto: "Helena", papel: "financeiro", unidade: "todas" },
]
export const pessoaPorId = (id?: string) => EQUIPE.find((p) => p.id === id)

export type Recurso = { id: string; nome: string; curto: string; competencias: Competencia[]; unidade: Unidade }
/** Recursos da agenda: os 5 técnicos + a bancada da Pampulha. */
export const RECURSOS: Recurso[] = [
  ...EQUIPE.filter((p) => p.papel === "tecnico").map((p) => ({ id: p.id, nome: p.nome, curto: p.curto, competencias: p.competencias ?? [], unidade: p.unidade as Unidade })),
  { id: "bancada-pampulha", nome: "Bancada Pampulha", curto: "Bancada", competencias: ["bancada", "climatizacao", "eletrica"], unidade: "pampulha" },
]
export const recursoPorId = (id?: string) => RECURSOS.find((r) => r.id === id)
