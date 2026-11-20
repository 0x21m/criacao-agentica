// Módulo Equipe e permissões · coleções `equipe` (as pessoas, seção 1 e 5.10) e `ajustes_permissao` (a matriz simulada).
// A equipe sai de EQUIPE (negocio.ts) mais 1 convite pendente (thiago.alves@…), com e-mail, estado e último acesso.
// A matriz padrão é a MATRIZ de permissoes.ts; cada ajuste gravado aqui (o histórico da auditoria) também vai para a
// sessão da base (ajustarMatriz), então pode(), a navegação e a acao() das outras telas passam a seguir a regra nova.
import { toast } from "sonner"
import { acao, colecao, evento, mudarComoOutraPonta, proximoId, type Aleatorio, type Evento, type Resultado } from "@/proto/dados"
import { agora, nov, DIA } from "@/proto/relogio"
import { EQUIPE, UNIDADES, type Papel, type Unidade } from "@/proto/negocio"
import { aQuemPedir, ajustarMatriz, limparAjustesDaMatriz, MATRIZ, nomeDoPapel, papelAtual, pessoaAtual, pode, type Capacidade, type Regra } from "@/proto/permissoes"
import { MEMBRO, type EstadoMembro } from "@/proto/projecao"

// ---------------------------------------------------------------- estado do membro (projeção local)
// Os rótulos do estado do membro estão na projecao.ts da base (MEMBRO).
export type { EstadoMembro }
export const ESTADO_MEMBRO = MEMBRO

export type Membro = {
  id: string; nome: string; curto: string; email: string
  papel: Papel; unidade: Unidade | "todas"
  estado: EstadoMembro
  ultimoAcesso?: string; convidadoEm?: string; suspensoEm?: string
  versao: number; historico: Evento[]
}

const slug = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, ".")
const sistema = (em: Date, texto: string, extra: Partial<Evento> = {}): Evento => ({ em: em.toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto, ...extra })
const rogerio = (em: Date, texto: string, extra: Partial<Evento> = {}): Evento => ({ em: em.toISOString(), quem: { tipo: "pessoa", nome: "Rogério Nunes" }, texto, ...extra })

function semear(r: Aleatorio): Membro[] {
  const lista: Membro[] = EQUIPE.map((p) => {
    const entrou = nov(1 + r.entre(0, 10), 9).getTime() - r.entre(20, 280) * DIA // sempre em 2026: a linha do tempo mostra dd/mm
    // último acesso: hoje cedo para quem abriu o expediente; os técnicos de campo há 1 a 3 dias; Gustavo há 6 (pior caso)
    const acesso = p.id === "marina" ? nov(16, 9, 38)
      : p.id === "gustavo" ? nov(10, 17, 12)
      : p.papel === "tecnico" ? nov(16 - r.entre(1, 3), r.entre(7, 18), r.entre(0, 59))
      : nov(16, r.entre(7, 9), r.entre(0, 40))
    const historico: Evento[] = [p.id === "rogerio"
      ? sistema(new Date(entrou), "Conta criada (dono da empresa)")
      : rogerio(new Date(entrou), `Entrou na equipe como ${nomeDoPapel(p.papel)}`, { eixo: "papel", para: p.papel })]
    if (p.id === "carla") historico.push(rogerio(nov(10, 14, 5), `Unidade: ${UNIDADES.pampulha.nome} → ${UNIDADES.contagem.nome}`, { eixo: "unidade", de: "pampulha", para: "contagem" }))
    if (p.id === "marina") historico.push(rogerio(nov(12, 11, 20), `Papel: ${nomeDoPapel("atendente")} → ${nomeDoPapel("gestora")}`, { eixo: "papel", de: "atendente", para: "gestora" }))
    return {
      id: p.id, nome: p.nome, curto: p.curto, email: `${slug(p.nome)}@oficinanorte.com.br`, papel: p.papel, unidade: p.unidade,
      estado: "ativo", ultimoAcesso: acesso.toISOString(), versao: 1, historico,
    }
  })
  // 1 convite pendente (seção 4): Thiago Alves, técnico de Contagem, convidado pela Marina na sexta
  lista.push({
    id: "PES-11", nome: "Thiago Alves", curto: "Thiago", email: "thiago.alves@oficinanorte.com.br", papel: "tecnico", unidade: "contagem",
    estado: "convidado", convidadoEm: nov(13, 15, 40).toISOString(), versao: 1,
    historico: [{ em: nov(13, 15, 40).toISOString(), quem: { tipo: "pessoa", nome: "Marina Duarte" }, texto: "Convite enviado", eixo: "estado", para: "convidado" }],
  })
  return lista
}

export const equipe = colecao<Membro>("equipe", semear, 1, { caminho: (m) => `equipe/?id=${m.id}` })

// ---------------------------------------------------------------- quem pode gerir quem
/** Papéis que a gestora pode convidar (seção 2: "convidar atendente e técnico"). */
const DA_GESTORA: Papel[] = ["atendente", "tecnico"]
export type Gestao = "convidar" | "convite" | "papel" | "suspender"

/** O papel ativo pode fazer `o quê` com uma pessoa de papel `alvo`? Dono: tudo (menos em si mesmo); gestora: convites de atendente e técnico. */
export function podeGerir(papel: Papel, oQue: Gestao, alvo?: Papel): boolean {
  if (!pode(papel, "equipe_gerir")) return false
  if (MATRIZ.equipe_gerir[papel] === true) return true
  return (oQue === "convidar" || oQue === "convite") && (!alvo || DA_GESTORA.includes(alvo))
}
export const papeisQueConvida = (papel: Papel): Papel[] =>
  (["dono", "gestora", "atendente", "tecnico", "financeiro"] as Papel[]).filter((p) => p !== "dono" && podeGerir(papel, "convidar", p))

/** A recusa feita aqui dentro (a tela não é a única barreira): mesma frase e mesmo toast da acao(). */
function recusar(oQue: string): Resultado {
  const papel = papelAtual()
  const mensagem = `Seu papel não permite ${oQue}. Peça a ${aQuemPedir(papel)}.`
  toast.error(mensagem)
  return { ok: false, motivo: "permissao", mensagem }
}
const souEu = (m: Membro) => pessoaAtual().id === m.id

/** O que a pessoa perde ao trocar de papel ("ver o financeiro", "ver custo…"), pela matriz. */
export function perdasAoTrocar(de: Papel, para: Papel): Capacidade[] {
  return (Object.keys(MATRIZ) as Capacidade[]).filter((c) => pode(de, c) && !pode(para, c))
}

// ---------------------------------------------------------------- ações (seção 5.10)
const curtoEmail = (e: string) => (e.length > 40 ? `${e.slice(0, 39)}…` : e)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function validarConvite(email: string, lista = equipe.ler()): string | undefined {
  const e = email.trim().toLowerCase()
  if (!e) return "Informe o e-mail de quem você quer convidar."
  if (!EMAIL.test(e)) return "Confira o e-mail: falta o @ ou o domínio."
  const ja = lista.find((m) => m.email.toLowerCase() === e)
  if (ja?.estado === "convidado") return "Já existe um convite pendente para este e-mail. Reenvie pelo menu da pessoa."
  if (ja) return "Este e-mail já está na equipe."
}

/** Convidar pessoa (P): entra como "Convite pendente" com e-mail, papel e unidade. */
export function convidar(n: { nome: string; email: string; papel: Papel; unidade: Unidade | "todas" }) {
  if (!podeGerir(papelAtual(), "convidar", n.papel)) return Promise.resolve(recusar(`convidar ${nomeDoPapel(n.papel).toLowerCase()}`))
  const lista = equipe.ler()
  const id = proximoId(lista.filter((m) => m.id.startsWith("PES-")), "PES", 10)
  const email = n.email.trim().toLowerCase()
  // sem nome, o começo do e-mail vira o nome provisório ("maria.souza" → "Maria Souza"), curto o bastante para as frases
  const nome = n.nome.trim() || email.split("@")[0].split(/[._-]+/).filter(Boolean).slice(0, 2).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" ").slice(0, 40)
  return acao({
    rotulo: `enviar o convite para ${email}`,
    capacidade: "equipe_gerir",
    modo: "pessimista",
    ids: [id],
    aplicar: (d) => {
      d(equipe).push({
        id, nome, curto: nome.split(" ")[0], email, papel: n.papel, unidade: n.unidade, estado: "convidado", convidadoEm: agora().toISOString(), versao: 1,
        historico: [evento("Convite enviado", { eixo: "estado", para: "convidado" })],
      })
    },
    sucesso: `Convite enviado para ${n.nome.trim() || curtoEmail(email)}.`,
  })
}

/** Reenviar o convite (P). */
export function reenviarConvite(m: Membro) {
  if (!podeGerir(papelAtual(), "convite", m.papel)) return Promise.resolve(recusar(`reenviar o convite de ${m.nome}`))
  return acao({
    rotulo: `reenviar o convite para ${m.email}`,
    capacidade: "equipe_gerir",
    modo: "pessimista",
    ids: [m.id],
    conferir: { colecao: equipe, id: m.id, versao: m.versao },
    aplicar: (d) => { const x = d(equipe).find((y) => y.id === m.id); if (x) { x.convidadoEm = agora().toISOString(); x.historico.push(evento("Convite reenviado")) } },
    sucesso: `Convite reenviado para ${m.nome}.`,
  })
}

/** Cancelar o convite (O + Desfazer): tira a pessoa da lista. */
export function cancelarConvite(m: Membro) {
  if (!podeGerir(papelAtual(), "convite", m.papel)) return Promise.resolve(recusar(`cancelar o convite de ${m.nome}`))
  const copia = structuredClone(m)
  const eu = pessoaAtual().id
  return acao({
    rotulo: `cancelar o convite de ${m.email}`,
    capacidade: "equipe_gerir",
    ids: [m.id],
    // o convite sai da lista, mas o rastro fica: o evento vai para o histórico de quem cancelou (a auditoria lê dali)
    aplicar: (d) => {
      const lista = d(equipe)
      lista.find((y) => y.id === eu)?.historico.push(evento(`Cancelou o convite de ${m.nome}`, { eixo: "estado", de: "convidado" }))
      d.trocar(equipe, lista.filter((y) => y.id !== m.id))
    },
    desfazer: (d) => {
      const lista = d(equipe)
      if (!lista.some((y) => y.id === m.id)) lista.push(copia)
      lista.find((y) => y.id === eu)?.historico.push(evento(`Desfez o cancelamento do convite de ${m.nome}`))
    },
    sucesso: `Convite de ${m.nome} cancelado.`,
  })
}

/** Mudar o papel (P). A tela confirma antes quando a troca tira acesso (perdasAoTrocar). */
export function mudarPapel(m: Membro, para: Papel) {
  if (souEu(m)) return Promise.resolve(recusar("mudar o próprio papel"))
  if (!podeGerir(papelAtual(), "papel", m.papel) || !podeGerir(papelAtual(), "papel", para)) return Promise.resolve(recusar(`mudar o papel de ${m.nome}`))
  const de = m.papel
  return acao({
    rotulo: `mudar o papel de ${m.nome}`,
    capacidade: "equipe_gerir",
    modo: "pessimista",
    ids: [m.id],
    conferir: { colecao: equipe, id: m.id, versao: m.versao },
    aplicar: (d) => {
      const x = d(equipe).find((y) => y.id === m.id)
      if (x) { x.papel = para; x.historico.push(evento(`Papel: ${nomeDoPapel(de)} → ${nomeDoPapel(para)}`, { eixo: "papel", de, para })) }
    },
    sucesso: `${m.curto} agora é ${nomeDoPapel(para).toLowerCase()}.`,
  })
}

/** Suspender (P, com confirmação na tela) e reativar (P). */
export function definirSuspensao(m: Membro, suspender: boolean, motivo = "") {
  if (souEu(m)) return Promise.resolve(recusar("suspender a própria conta"))
  if (!podeGerir(papelAtual(), "suspender", m.papel)) return Promise.resolve(recusar(`${suspender ? "suspender" : "reativar"} ${m.nome}`))
  const para: EstadoMembro = suspender ? "suspenso" : "ativo"
  return acao({
    rotulo: `${suspender ? "suspender" : "reativar"} ${m.nome}`,
    capacidade: "equipe_gerir",
    modo: "pessimista",
    ids: [m.id],
    conferir: { colecao: equipe, id: m.id, versao: m.versao },
    aplicar: (d) => {
      const x = d(equipe).find((y) => y.id === m.id)
      if (!x) return
      const e = evento(suspender ? `Acesso suspenso${motivo ? `: ${motivo}` : ""}` : "Acesso reativado", { eixo: "estado", de: x.estado, para })
      x.estado = para; x.suspensoEm = suspender ? e.em : undefined; x.historico.push(e)
    },
    sucesso: suspender ? `${m.curto} não entra mais até o acesso ser reativado.` : `${m.curto} pode entrar de novo.`,
  })
}

/** Barra F: o convidado aceita (a outra ponta). */
export function convidadoAceita() {
  const m = equipe.ler().find((x) => x.estado === "convidado")
  if (!m) { toast.info("Não há convite pendente."); return }
  mudarComoOutraPonta((d) => {
    const x = d(equipe).find((y) => y.id === m.id)
    if (!x) return
    const em = agora().toISOString()
    x.estado = "ativo"; x.ultimoAcesso = em
    x.historico.push({ em, quem: { tipo: "pessoa", nome: x.nome }, texto: "Aceitou o convite e criou a senha", eixo: "estado", de: "convidado", para: "ativo" })
  }, [m.id])
  toast.info(`${m.nome} aceitou o convite.`)
}

// ---------------------------------------------------------------- matriz simulada
export type Ajuste = { id: string; capacidade: string; papel: Papel; regra: Regra | null; versao: number; historico: Evento[] }
export const ajustes = colecao<Ajuste>("ajustes_permissao", () => [], 1, { caminho: (a) => `equipe/permissoes/?ver=${a.papel}` })

export const ROTULO_REGRA: Record<string, string> = { true: "Sim", false: "Não", proprias: "Próprias", unidade: "Unid.", parcial: "Parcial" }
export const rotuloRegra = (r: Regra) => ROTULO_REGRA[String(r)] ?? String(r)
export const EXPLICA_REGRA: Record<string, string> = {
  true: "Pode, em qualquer registro.",
  false: "Não pode. A tela some da navegação e a ação recusa.",
  proprias: "Só nos registros atribuídos a ele.",
  unidade: "Só nos registros da unidade dele.",
  parcial: "A tela abre com um recorte.",
}

export const explicaRegra = (r: Regra) => EXPLICA_REGRA[String(r)] ?? "Regra própria deste papel."
/** A regra que a tela mostra: o ajuste simulado, se houver; senão, a da MATRIZ. */
export function regraEfetiva(lista: Ajuste[], cap: Capacidade, papel: Papel): { regra: Regra; padrao: Regra; simulada: boolean } {
  const padrao = MATRIZ[cap][papel] as Regra
  const a = lista.find((x) => x.id === `${cap}:${papel}`)
  return a && a.regra !== null && a.regra !== padrao ? { regra: a.regra, padrao, simulada: true } : { regra: padrao, padrao, simulada: false }
}
const podeEditarMatriz = (papel: Papel) => MATRIZ.equipe_gerir[papel] === true

/** Mudar a permissão de um papel na matriz (P), só simulado. `regra` igual ao padrão volta ao padrão. */
export async function simularRegra(cap: Capacidade, papel: Papel, regra: Regra, atual?: Ajuste): Promise<Resultado> {
  if (!podeEditarMatriz(papelAtual())) return recusar("mudar a matriz de permissões")
  const id = `${cap}:${papel}`
  const padrao = MATRIZ[cap][papel] as Regra
  const de = atual?.regra ?? padrao
  const r = await acao({
    rotulo: `mudar "${MATRIZ[cap].rotulo}" de ${nomeDoPapel(papel).toLowerCase()}`,
    capacidade: "equipe_gerir",
    modo: "pessimista",
    ids: [id],
    conferir: atual ? { colecao: ajustes, id, versao: atual.versao } : undefined,
    aplicar: (d) => {
      const lista = d(ajustes)
      let x = lista.find((y) => y.id === id)
      if (!x) { x = { id, capacidade: cap, papel, regra: null, versao: 1, historico: [] }; lista.push(x) }
      x.regra = regra === padrao ? null : regra
      x.historico.push(evento(`Matriz (simulação): ${nomeDoPapel(papel)} · ${MATRIZ[cap].rotulo}: ${rotuloRegra(de)} → ${rotuloRegra(regra)}`, { eixo: "permissao", de: String(de), para: String(regra) }))
    },
  })
  // vale para o resto do protótipo: pode() lê os ajustes da sessão
  if (r.ok) ajustarMatriz(cap, papel, regra)
  return r
}

/** Restaurar padrão (P, com confirmação na tela): todos os ajustes voltam à MATRIZ; o histórico fica. */
export async function restaurarPadrao(): Promise<Resultado> {
  if (!podeEditarMatriz(papelAtual())) return recusar("restaurar a matriz de permissões")
  const ativos = ajustes.ler().filter((a) => a.regra !== null)
  const r = await acao({
    rotulo: "restaurar a matriz padrão",
    capacidade: "equipe_gerir",
    modo: "pessimista",
    ids: ativos.map((a) => a.id),
    aplicar: (d) => {
      for (const x of d(ajustes)) if (x.regra !== null) {
        x.historico.push(evento(`Matriz (simulação): ${nomeDoPapel(x.papel)} · ${MATRIZ[x.capacidade as Capacidade]?.rotulo ?? x.capacidade}: voltou ao padrão`, { eixo: "permissao", de: String(x.regra), para: String(MATRIZ[x.capacidade as Capacidade]?.[x.papel]) }))
        x.regra = null
      }
    },
    sucesso: "Matriz de volta ao padrão.",
  })
  if (r.ok) limparAjustesDaMatriz()
  return r
}
