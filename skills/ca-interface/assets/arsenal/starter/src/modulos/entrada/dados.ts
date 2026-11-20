// Módulo Entrada (5.1) · a coleção `convites` (primeiro acesso) e, sobre a sessão da base, as ações
// de entrar, aceitar o convite, trocar de unidade e pedir o link de senha. Protótipo: nenhuma senha é conferida nem
// guardada; o e-mail decide a pessoa e o papel, e qualquer senha com 6 ou mais caracteres entra.
import { useSyncExternalStore } from "react"
import { acao, colecao, nomeDaUnidade, trocarUnidade, type Evento } from "@/proto/dados"
import { agora, nov } from "@/proto/relogio"
import { EQUIPE, type Papel } from "@/proto/negocio"
import { PESSOA_DO_PAPEL, definirSessao, pode, type EscolhaUnidade } from "@/proto/permissoes"

export const DOMINIO = "oficinanorte.com.br"
/** E-mail de trabalho de alguém da equipe: o id da pessoa no domínio da empresa (marina@oficinanorte.com.br). */
export const emailDaPessoa = (id: string) => `${id}@${DOMINIO}`
/** Mínimo que o protótipo aceita para entrar (5.1); a senha nova do primeiro acesso pede 8. */
export const SENHA_MINIMA = 6
export const MAX_TENTATIVAS = 5

// ---------- sessão ----------
// A pessoa, o papel e a unidade moram na sessão da base (permissoes.ts: definirSessao, useSessao, useUnidade; e
// trocarUnidade e nomeDaUnidade em proto/dados.ts). Reexportados aqui para as telas do módulo.
export type { EscolhaUnidade }
export { nomeDaUnidade, trocarUnidade }

// ---------- convites (primeiro acesso) ----------
export type EstadoConvite = "convidado" | "ativo"
export type Convite = {
  id: string; nome: string; email: string; papel: Papel; unidade: EscolhaUnidade
  convidadoPor: string; venceEm: string; estado: EstadoConvite; telefone?: string
  versao: number; historico: Evento[]
}
const marina = { tipo: "pessoa" as const, nome: "Marina Duarte" }
export const convites = colecao<Convite>("convites", () => [
  // o convite da especificação (equipe: "1 convite pendente"): é o que o /entrar/primeiro-acesso/ abre
  { id: "CNV-0003", nome: "Thiago Alves", email: `thiago.alves@${DOMINIO}`, papel: "tecnico", unidade: "contagem", convidadoPor: "Marina Duarte",
    venceEm: nov(23, 18).toISOString(), estado: "convidado", versao: 1, historico: [{ em: nov(16, 8, 10).toISOString(), quem: marina, texto: "Convite enviado" }] },
  // convite vencido em 12/11 (estado "Convite vencido" da 5.1)
  { id: "CNV-0002", nome: "Paula Freitas", email: `paula.freitas@${DOMINIO}`, papel: "atendente", unidade: "pampulha", convidadoPor: "Marina Duarte",
    venceEm: nov(12, 18).toISOString(), estado: "convidado", versao: 1, historico: [{ em: nov(5, 14).toISOString(), quem: marina, texto: "Convite enviado" }] },
  // já aceito: abrir o link de novo leva ao login
  { id: "CNV-0001", nome: "Carla Mota", email: emailDaPessoa("carla"), papel: "atendente", unidade: "contagem", convidadoPor: "Marina Duarte",
    venceEm: nov(9, 18).toISOString(), estado: "ativo", versao: 2, historico: [{ em: nov(2, 9).toISOString(), quem: marina, texto: "Convite enviado" }, { em: nov(3, 8, 40).toISOString(), quem: { tipo: "pessoa", nome: "Carla Mota" }, texto: "Aceitou o convite e criou a senha" }] },
])
export const CONVITE_PADRAO = "CNV-0003"
export const conviteVenceu = (c: Convite, ag: Date) => c.estado === "convidado" && new Date(c.venceEm).getTime() < ag.getTime()

// ---------- quem entra ----------
export type QuemEntra = { pessoaId: string; nome: string; papel: Papel; unidade: EscolhaUnidade }
/** A pessoa pelo e-mail: alguém da equipe ou um convite já aceito. Nada encontrado: undefined (a tela não diz qual errou). */
export function quemEntra(email: string): QuemEntra | undefined {
  const e = email.trim().toLowerCase()
  const p = EQUIPE.find((x) => emailDaPessoa(x.id) === e)
  if (p) return { pessoaId: p.id, nome: p.nome, papel: p.papel, unidade: p.unidade }
  const c = convites.ler().find((x) => x.email === e && x.estado === "ativo")
  // BASE: a sessão só sabe o papel (PESSOA_DO_PAPEL); quem aceitou o convite entra vestindo a pessoa padrão do papel
  if (c) return { pessoaId: PESSOA_DO_PAPEL[c.papel], nome: c.nome, papel: c.papel, unidade: c.unidade }
  return undefined
}
/**
 * As portas da demonstração: uma pessoa por papel (a mesma que a barra F "veste") e, no técnico, também o Gustavo
 * (o técnico sem nenhum agendamento, o pior caso do "Meu dia").
 */
export const DEMONSTRACAO: QuemEntra[] = [...(["dono", "gestora", "atendente", "tecnico"] as Papel[]).map((p) => PESSOA_DO_PAPEL[p]), "gustavo", PESSOA_DO_PAPEL.financeiro].map((id) => {
  const p = EQUIPE.find((x) => x.id === id)!
  return { pessoaId: p.id, nome: p.nome, papel: p.papel, unidade: p.unidade }
})
/** Quem tem mais de uma unidade escolhe antes de ir ao Início; os outros vão direto. */
export const escolheUnidade = (papel: Papel) => pode(papel, "trocar_unidade")

const passo = (nome: string, texto: string): Evento => ({ em: agora().toISOString(), quem: { tipo: "pessoa", nome }, texto })

/** Entrar (5.1): pessimista, "Entrando…". Depois do ok, a sessão da base passa a ser a pessoa, o papel e a unidade dela. */
export async function entrar(q: QuemEntra) {
  const r = await acao({ rotulo: "entrar", modo: "pessimista", aplicar: () => {} })
  if (r.ok) definirSessao({ papel: q.papel, pessoaId: q.pessoaId, unidade: q.unidade })
  return r
}

/** Primeiro acesso: o convite passa de convidado a ativo (P, confere a versão). Nenhuma senha é guardada. */
export function aceitarConvite(c: Convite, dados: { nome: string; telefone: string }) {
  return acao({
    rotulo: "criar o seu acesso",
    modo: "pessimista",
    ids: [c.id],
    conferir: { colecao: convites, id: c.id, versao: c.versao },
    conflito: () => "Este convite mudou enquanto você preenchia. Abra o link de novo ou peça outro a quem convidou.",
    aplicar: (d) => {
      const x = d(convites).find((y) => y.id === c.id)!
      x.estado = "ativo"
      x.nome = dados.nome.trim() || x.nome
      x.telefone = dados.telefone
      x.historico.push(passo(x.nome, "Aceitou o convite e criou a senha"))
    },
  })
}

/** "Esqueci a senha": a resposta é a mesma exista ou não o e-mail (não revela quem tem conta). Nada sai de verdade. */
export function pedirLinkDeSenha() {
  return acao({ rotulo: "enviar o link", modo: "pessimista", aplicar: () => {} })
}

// ---------- conexão ----------
// O navegador diz se está sem rede; a barra F também simula a queda ("Entrada: a conexão cai").
let simulada = false
const ouvintes = new Set<() => void>()
export function alternarSemConexao() { simulada = !simulada; ouvintes.forEach((f) => f()) }
function assinarConexao(f: () => void) {
  ouvintes.add(f)
  addEventListener("online", f); addEventListener("offline", f)
  return () => { ouvintes.delete(f); removeEventListener("online", f); removeEventListener("offline", f) }
}
/** true quando há conexão. No servidor e na hidratação: conectado. */
export const useConectado = () => useSyncExternalStore(assinarConexao, () => !simulada && navigator.onLine, () => true)
