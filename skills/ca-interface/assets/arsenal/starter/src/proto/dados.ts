// Camada de dados falsos do protótipo (PRO-09: sem back-end). Arquivo compartilhado: os módulos usam, ninguém edita.
//
// - Dados POR COLEÇÃO (D7): cada módulo declara as suas com colecao("pedidos", semear) no próprio src/modulos/<id>/dados.ts.
//   A semente de cada uma sai do nome dela (hash + 7, Park-Miller): apagar um módulo não muda os dados dos outros, e o
//   resultado é igual no servidor e no navegador, então as telas chegam prontas no HTML do build.
// - Toda mudança passa por acao() (D1): "otimista" aplica na hora e desfaz se falhar; "pessimista" não aplica nada antes
//   da resposta (os ids ficam "processando", o botão diz "Enviando…") e, se falhar, devolve a mensagem para a tela
//   mostrar no local, além do toast com "Tentar de novo".
// - Versão (D2): todo registro com `versao` que a ação toca sobe uma versão ao gravar. `conferir` recusa a ação se a
//   versão mudou desde que a tela leu o registro (outra aba, outra pessoa), com a frase de conflito da projeção.
// - Permissão (D4): `capacidade` é conferida aqui dentro, contra o papel ativo, antes de qualquer coisa.
// - Tempo real entre abas (D3): cada coleção fica no localStorage numa chave própria; o evento `storage` atualiza as
//   outras abas na hora. A barra F simula a outra ponta numa aba só (D10).
import { useSyncExternalStore } from "react"
import { toast } from "sonner"
import { definirSessao, fraseSemPermissao, limparAjustesDaMatriz, pode, papelAtual, pessoaAtual, unidadeAtual, type Capacidade, type Contexto, type EscolhaUnidade } from "./permissoes"
import { UNIDADES } from "./negocio"
import { agora, zerarRelogio } from "./relogio"
import { fraseNaoConfirmado } from "./projecao"

// ---------- gerador determinístico ----------
export type Aleatorio = {
  /** 0 ≤ x < 1 */ proximo: () => number
  pega: <T>(lista: readonly T[]) => T
  /** inteiro de min a max, inclusive */ entre: (min: number, max: number) => number
  chance: (p: number) => boolean
}
/** Park-Miller (s = s · 16807 mod 2³¹−1), o mesmo da fase 1. */
export function aleatorio(semente: number): Aleatorio {
  let s = semente % 2147483647 || 7
  const proximo = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  return {
    proximo,
    pega: (l) => l[Math.floor(proximo() * l.length)],
    entre: (min, max) => min + Math.floor(proximo() * (max - min + 1)),
    chance: (p) => proximo() < p,
  }
}
/** Semente de uma coleção: hash do nome + 7 (D7). */
export function sementeDe(nome: string) {
  let h = 0
  for (const c of nome) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return (Math.abs(h) % 2147483600) + 7
}

// ---------- tipos comuns ----------
/** Um passo do histórico de um registro compartilhado (linha do tempo do operador, do cliente e auditoria). */
export type Evento = {
  em: string; quem: { tipo: "pessoa" | "cliente" | "sistema"; nome: string }
  de?: string; para?: string; eixo?: string; texto: string
  /** O cliente vê este evento na linha do tempo dele (a projeção filtra pelo que é false/ausente). */
  cliente?: boolean
}
export type Registro = { id: string; versao?: number; historico?: Evento[] }

/** Evento assinado pela pessoa da sessão (papel ativo), no "agora" do protótipo. */
export function evento(texto: string, extra: Partial<Evento> = {}): Evento {
  return { em: agora().toISOString(), quem: { tipo: "pessoa", nome: pessoaAtual().nome }, texto, ...extra }
}

// ---------- coleções ----------
type Interno = { nome: string; chave: string; semear: () => Registro[]; semente?: Registro[]; base?: Registro[]; visivel?: Registro[]; caminho?: (r: Registro) => string | undefined }
const colecoes = new Map<string, Interno>()
const noNavegador = typeof window !== "undefined"
const PREFIXO = "proto-dados:"

export type Colecao<T extends Registro> = {
  readonly nome: string
  /** Lista visível (com as mudanças otimistas). Igual à semente no servidor e na hidratação. */
  use: () => T[]
  /** Leitura fora do React (ações, Ctrl K, CSV). */
  ler: () => T[]
  porId: (id: string | null | undefined) => T | undefined
  /** Os dados de exemplo, como foram semeados. */
  semente: () => T[]
}

/** Opções da coleção. `caminho`: onde o registro abre ("estoque/?id=SKU"), para a auditoria e outras leituras gerais. */
export type OpcoesColecao<T extends Registro> = { caminho?: (r: T) => string | undefined }

/**
 * Declara uma coleção. Chame UMA vez, no dados.ts do módulo dono dela; os outros módulos importam o objeto devolvido.
 * `semear` recebe o gerador da coleção e NUNCA lê Date.now(), new Date() sem argumento ou Math.random().
 * `versaoDaSemente`: suba quando mudar o formato, para os navegadores descartarem o que guardaram antes.
 */
export function colecao<T extends Registro>(nome: string, semear: (r: Aleatorio) => T[], versaoDaSemente = 1, opcoes: OpcoesColecao<T> = {}): Colecao<T> {
  if (colecoes.has(nome)) throw new Error(`A coleção "${nome}" foi declarada duas vezes.`)
  const i: Interno = { nome, chave: `${PREFIXO}${nome}:v${versaoDaSemente}`, semear: () => semear(aleatorio(sementeDe(nome))), caminho: opcoes.caminho as Interno["caminho"] }
  colecoes.set(nome, i)
  const semente = () => (i.semente ??= i.semear()) as T[]
  const ler = () => visivelDe(i) as T[]
  return {
    nome,
    use: () => useSyncExternalStore(assinar, () => visivelDe(i) as T[], semente),
    ler,
    porId: (id) => (id ? ler().find((x) => x.id === id) : undefined),
    semente,
  }
}

function baseDe(i: Interno): Registro[] {
  if (i.base) return i.base
  if (noNavegador) {
    try { const v = localStorage.getItem(i.chave); if (v) return (i.base = JSON.parse(v)) } catch {}
  }
  return (i.base = (i.semente ??= i.semear()))
}
const visivelDe = (i: Interno) => i.visivel ?? baseDe(i)
const guardar = (i: Interno) => { try { localStorage.setItem(i.chave, JSON.stringify(i.base)) } catch {} }

// ---------- rascunho: o que aplicar() recebe ----------
/** `d(colecao)` devolve a lista mutável daquela coleção; `d.trocar(colecao, lista)` substitui a lista inteira. */
export type Rascunho = (<T extends Registro>(c: Colecao<T>) => T[]) & { trocar: <T extends Registro>(c: Colecao<T>, lista: T[]) => void }
type Mutacao = (d: Rascunho) => void

function rascunhoSobre(fonte: (i: Interno) => Registro[]) {
  const mexidas = new Map<string, Registro[]>()
  const pegar = (nome: string) => {
    let l = mexidas.get(nome)
    if (!l) { const i = colecoes.get(nome)!; l = structuredClone(fonte(i)); mexidas.set(nome, l) }
    return l
  }
  const d = (<T extends Registro>(c: Colecao<T>) => pegar(c.nome) as T[]) as Rascunho
  d.trocar = (c, lista) => { mexidas.set(c.nome, lista) }
  return { d, mexidas }
}

// ---------- store ----------
const pendentes = new Map<number, { aplicar: Mutacao; ids: string[] }>()
// vazio = o mesmo objeto do servidor: a hidratação não vê mudança e não renderiza a tela de novo
const VAZIO: Set<string> = new Set<string>()
let idsPendentes = VAZIO
let idsProcessando = VAZIO
let versaoDoStore = 0
const ouvintes = new Set<() => void>()
const notificar = () => { versaoDoStore++; ouvintes.forEach((f) => f()) }
function assinar(f: () => void) { ouvintes.add(f); return () => { ouvintes.delete(f) } }

function recalcular() {
  for (const i of colecoes.values()) i.visivel = undefined
  if (pendentes.size) {
    const { d, mexidas } = rascunhoSobre(baseDe)
    for (const p of pendentes.values()) p.aplicar(d)
    for (const [nome, lista] of mexidas) colecoes.get(nome)!.visivel = lista
  }
  idsPendentes = pendentes.size ? new Set([...pendentes.values()].flatMap((p) => p.ids)) : VAZIO
  notificar()
}

// ---------- configuração do protótipo (barra F) ----------
export type EstadoTela = "dados" | "carregando" | "vazio" | "erro"
export const ESTADOS: { id: EstadoTela; nome: string }[] = [
  { id: "dados", nome: "Com dados" }, { id: "carregando", nome: "Carregando" }, { id: "vazio", nome: "Vazio" }, { id: "erro", nome: "Erro" },
]
export type Config = { latencia: number; falha: boolean; estado: EstadoTela; /** A próxima ação grava, mas a tela não recebe a confirmação (EST-46). */ perderResposta?: boolean }
const CHAVE_CONFIG = "proto-config"
const CONFIG_PADRAO: Config = { latencia: 600, falha: false, estado: "dados" }
let config: Config = CONFIG_PADRAO
if (noNavegador) {
  let lida: Config = { ...CONFIG_PADRAO }
  try { lida = { ...lida, ...JSON.parse(localStorage.getItem(CHAVE_CONFIG) || "{}"), estado: "dados" } } catch {}
  const e = new URLSearchParams(location.search).get("estado") as EstadoTela | null
  if (ESTADOS.some((x) => x.id === e)) lida.estado = e!
  // igual ao padrão: o mesmo objeto do servidor, e a hidratação não renderiza a tela de novo
  if ((Object.keys(CONFIG_PADRAO) as (keyof Config)[]).some((k) => lida[k] !== CONFIG_PADRAO[k])) config = lida
}
export function definirConfig(m: Partial<Config>) {
  config = { ...config, ...m }
  try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify({ latencia: config.latencia, falha: config.falha, perderResposta: config.perderResposta })) } catch {}
  if ("estado" in m && noNavegador) {
    const u = new URL(location.href)
    if (config.estado === "dados") u.searchParams.delete("estado"); else u.searchParams.set("estado", config.estado)
    history.replaceState(history.state, "", u)
  }
  notificar()
}
export const useConfig = () => useSyncExternalStore(assinar, () => config, () => CONFIG_PADRAO)

/**
 * "Resposta perdida": consome o pedido da barra F (só a próxima ação). A acao() já trata; um módulo que precisa de outro
 * desenho (ex.: guardar o envio pendente no registro) chama isto antes da acao() e decide.
 */
export function consumirRespostaPerdida() {
  if (!config.perderResposta) return false
  definirConfig({ perderResposta: false })
  return true
}

// ---------- ações ----------
export type Conferir = { colecao: Colecao<Registro>; id: string; versao: number }
export type Resultado = { ok: true } | { ok: false; motivo: "falha" | "conflito" | "permissao"; mensagem: string; /** Gravou, mas a resposta se perdeu ("Resposta perdida" da barra F): confira antes de repetir. */ semResposta?: boolean }

export type OpcoesAcao = {
  /** Verbo no infinitivo com o objeto, para as mensagens: "enviar o orçamento da OS-1052". */
  rotulo: string
  aplicar: Mutacao
  /** "otimista" (padrão): aplica na hora, desfaz se falhar. "pessimista": só aplica depois da resposta. */
  modo?: "otimista" | "pessimista"
  /** Mensagem de sucesso (toast). Sem ela, o sucesso é silencioso (EST-17: o que já aparece na tela não leva toast). */
  sucesso?: string
  /** Mutação inversa: liga o "Desfazer" no toast de sucesso (8 s, pausável). */
  desfazer?: Mutacao
  /** Registros afetados: ficam marcados (pendentes ou processando) e sobem uma versão ao gravar. */
  ids?: string[]
  /** Capacidade exigida (permissoes.ts), conferida contra o papel ativo. `contexto` traz o dono, a unidade, a etapa. */
  capacidade?: Capacidade
  contexto?: Contexto
  /** Recusa se a versão do registro mudou desde a leitura (D2). */
  conferir?: Conferir | Conferir[]
  /** Frase de conflito própria. Sem ela, a padrão: "{quem} mudou {id} às {hora}." */
  conflito?: (atual: Registro) => string
  /**
   * Sem toast de erro: a tela já mostra a falha no lugar (balão com "Tentar de novo", "2 de 5 ajustados" na sheet) ou a
   * ação é um item de um lote (resuma com resumirLote). `true` cala os três motivos; uma lista cala só os citados.
   */
  silenciosa?: boolean | ("falha" | "conflito" | "permissao")[]
}
const calada = (o: OpcoesAcao, motivo: "falha" | "conflito" | "permissao") => o.silenciosa === true || (Array.isArray(o.silenciosa) && o.silenciosa.includes(motivo))

let seq = 0
const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms))
const horaCurta = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "")

/** Frase padrão para quem perde um conflito (PON-16), a partir do último evento do registro. */
export function fraseConflito(atual: Registro) {
  const ultimo = atual.historico?.at(-1)
  if (!ultimo) return `${atual.id} mudou enquanto você olhava. Veja como está agora.`
  return `${ultimo.quem.nome} mudou ${atual.id} às ${horaCurta(ultimo.em)}: ${ultimo.texto.replace(/\.$/, "")}. Veja como está agora.`
}

/**
 * Executa uma ação sobre os dados. Devolve { ok } ou { ok: false, motivo, mensagem } (a tela mostra a mensagem no
 * local quando a ação é pessimista; o toast aparece sempre).
 */
export async function acao(o: OpcoesAcao): Promise<Resultado> {
  const modo = o.modo ?? "otimista"
  const ids = o.ids ?? []
  const papel = papelAtual()
  if (o.capacidade && !pode(papel, o.capacidade, o.contexto)) {
    const mensagem = fraseSemPermissao(papel, o.capacidade)
    if (!calada(o, "permissao")) toast.error(mensagem)
    return { ok: false, motivo: "permissao", mensagem }
  }
  const id = ++seq
  if (modo === "otimista") { pendentes.set(id, { aplicar: o.aplicar, ids }); recalcular() }
  else { idsProcessando = new Set([...idsProcessando, ...ids]); notificar() }

  await espera(config.latencia)

  const limpar = () => {
    if (modo === "otimista") pendentes.delete(id)
    else { const resto = [...idsProcessando].filter((x) => !ids.includes(x)); idsProcessando = resto.length ? new Set(resto) : VAZIO }
  }
  if (config.falha) {
    limpar(); recalcular()
    const mensagem = `Não foi possível ${o.rotulo}. Nada foi alterado. Confira a conexão e tente de novo.`
    if (!calada(o, "falha")) toast.error(`Não foi possível ${o.rotulo}.`, {
      description: "Nada foi alterado. Confira a conexão e tente de novo.",
      duration: 8000,
      action: { label: "Tentar de novo", onClick: () => void acao(o) },
    })
    return { ok: false, motivo: "falha", mensagem }
  }
  for (const c of o.conferir ? ([] as Conferir[]).concat(o.conferir) : []) {
    const atual = c.colecao.ler().find((x) => x.id === c.id)
    const naBase = atual && baseDe(colecoes.get(c.colecao.nome)!).find((x) => x.id === c.id)
    if (naBase && naBase.versao !== undefined && naBase.versao !== c.versao) {
      limpar(); recalcular()
      const mensagem = o.conflito?.(naBase) ?? fraseConflito(naBase)
      if (!calada(o, "conflito")) toast.warning(mensagem, { duration: 8000 })
      return { ok: false, motivo: "conflito", mensagem }
    }
  }
  limpar()
  gravar(o.aplicar, ids)
  if (consumirRespostaPerdida()) {
    // "Resposta perdida" (barra F, EST-46): gravou, mas a tela não sabe. Repetir às cegas pode duplicar
    const mensagem = `${fraseNaoConfirmado} Confira o status antes de tentar de novo.`
    if (!calada(o, "falha")) toast.warning(fraseNaoConfirmado, { description: "A ação pode ter sido gravada. Confira o status antes de tentar de novo.", duration: 8000 })
    return { ok: false, motivo: "falha", mensagem, semResposta: true }
  }
  if (o.sucesso) {
    const inversa = o.desfazer
    toast.success(o.sucesso, inversa ? {
      duration: 8000,
      action: { label: "Desfazer", onClick: () => void acao({ rotulo: "desfazer", aplicar: inversa, ids, sucesso: "Mudança desfeita." }) },
    } : undefined)
  }
  return { ok: true }
}

/**
 * Um toast só para um lote de ações silenciosas: "Não foi possível ajustar o saldo em 2 de 5." (nada se tudo deu certo).
 * `tentarDeNovo` liga o botão do toast (refaça só os que falharam). Devolve quantos falharam.
 */
export function resumirLote(resultados: Resultado[], rotulo: string, tentarDeNovo?: () => void) {
  const falhas = resultados.filter((r) => !r.ok)
  if (!falhas.length) return 0
  const todos = falhas.length === resultados.length
  toast.error(`Não foi possível ${rotulo}${todos ? "" : ` em ${falhas.length} de ${resultados.length}`}.`, {
    description: todos ? "Nada foi alterado. Confira a conexão e tente de novo." : "Os outros foram salvos. Confira a conexão e tente de novo.",
    duration: 8000,
    action: tentarDeNovo ? { label: "Tentar de novo", onClick: tentarDeNovo } : undefined,
  })
  return falhas.length
}

/** Aplica na base, sobe a versão dos registros afetados, guarda e avisa as outras abas. */
function gravar(aplicar: Mutacao, ids: string[]) {
  const { d, mexidas } = rascunhoSobre(baseDe)
  aplicar(d)
  for (const [nome, lista] of mexidas) {
    for (const r of lista) if (ids.includes(r.id) && typeof r.versao === "number") r.versao += 1
    const i = colecoes.get(nome)!
    i.base = lista
    guardar(i)
  }
  recalcular()
}

/** Registros marcados: com mudança otimista a caminho. */
export const usePendentes = () => useSyncExternalStore(assinar, () => idsPendentes, () => VAZIO)
/** Registros com ação pessimista esperando resposta (mostre "Enviando…" e não deixe repetir). */
export const useProcessando = () => useSyncExternalStore(assinar, () => idsProcessando, () => VAZIO)

/** Próximo id sequencial ("OS-1068") a partir dos que existem. */
export function proximoId(lista: { id: string }[], prefixo: string, minimo = 0) {
  const n = Math.max(minimo, ...lista.map((x) => Number(x.id.slice(prefixo.length + 1)) || 0)) + 1
  return `${prefixo}-${n}`
}

// ---------- tempo real entre abas (D3) ----------
if (noNavegador) {
  addEventListener("storage", (e) => {
    if (!e.key?.startsWith(PREFIXO)) return
    const i = [...colecoes.values()].find((x) => x.chave === e.key)
    if (!i) return
    try { i.base = e.newValue ? JSON.parse(e.newValue) : (i.semente ??= i.semear()) } catch { return }
    recalcular()
  })
}

// ---------- simular a outra ponta (D10) ----------
let aberto: { colecao: Colecao<Registro>; id: string } | null = null
const ouvintesAberto = new Set<() => void>()
/** A tela de detalhe declara o registro aberto: a barra F oferece "Outra pessoa mexe neste registro". */
export function marcarAberto(c: Colecao<Registro> | null, id?: string | null) {
  aberto = c && id ? { colecao: c, id } : null
  ouvintesAberto.forEach((f) => f())
}
export const useAberto = () => useSyncExternalStore((f) => (ouvintesAberto.add(f), () => { ouvintesAberto.delete(f) }), () => aberto, () => null)

/**
 * Muda os dados como se fosse outra pessoa ou o cliente, sem latência nem toast (a barra F usa; os módulos declaram as
 * simulações deles em `simulacoes` no modulo.ts). Sobe a versão de `ids`.
 */
export function mudarComoOutraPonta(aplicar: Mutacao, ids: string[] = []) { gravar(aplicar, ids) }

/** "Outra pessoa mexe neste registro": sobe a versão do registro aberto e escreve no histórico dele. */
export function outraPessoaMexe() {
  if (!aberto) return false
  const { colecao: c, id } = aberto
  const quem = papelAtual() === "atendente" ? "Carla Mota" : "Ana Lima"
  mudarComoOutraPonta((d) => {
    const r = d(c).find((x) => x.id === id)
    if (r?.historico) r.historico.push({ em: agora().toISOString(), quem: { tipo: "pessoa", nome: quem }, texto: "Editou este registro" })
  }, [id])
  toast.info(`${quem} acabou de mudar ${id}.`, { description: "A tela já mostra a versão nova." })
  return true
}

/** Apaga as mudanças deste navegador e volta todas as coleções (e o relógio) aos dados de exemplo. */
export function resetar() {
  pendentes.clear()
  idsProcessando = VAZIO
  try { for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIXO)) localStorage.removeItem(k) } catch {}
  for (const i of colecoes.values()) { i.base = i.semente ??= i.semear(); i.visivel = undefined }
  zerarRelogio()
  limparAjustesDaMatriz()
  recalcular()
}

// ---------- unidade da sessão ----------
export const nomeDaUnidade = (u: EscolhaUnidade) => (u === "todas" ? "Todas as unidades" : UNIDADES[u].nome)
/**
 * Trocar de unidade (O): a sessão muda na hora e volta se a ação falhar. Só para quem pode (dono, gestora, financeiro).
 * Usada pelo seletor da barra superior e pela tela /entrar/unidade/.
 */
export async function trocarUnidade(u: EscolhaUnidade) {
  const antes = unidadeAtual()
  if (pode(papelAtual(), "trocar_unidade")) definirSessao({ unidade: u })
  const r = await acao({ rotulo: `trocar para ${nomeDaUnidade(u)}`, capacidade: "trocar_unidade", aplicar: () => {} })
  if (!r.ok) definirSessao({ unidade: antes })
  return r
}

// ---------- todas as coleções (auditoria e leituras gerais) ----------
/** Uma coleção declarada, com a lista visível e o caminho do registro (se o dono informou). */
export type ColecaoLida = { nome: string; lista: Registro[]; caminho?: (r: Registro) => string | undefined }
let cacheVisivel: { v: number; n: number; l: ColecaoLida[] } | null = null
let cacheSemente: { n: number; l: ColecaoLida[] } | null = null
/**
 * Todas as coleções já declaradas (as dos módulos importados; importe "@/modulos/registro" para garantir todas), fora do
 * React. Na tela, use useTodasAsColecoes(): ela devolve a semente na hidratação, como colecao.use().
 */
export function todasAsColecoes(): ColecaoLida[] {
  if (!cacheVisivel || cacheVisivel.v !== versaoDoStore || cacheVisivel.n !== colecoes.size)
    cacheVisivel = { v: versaoDoStore, n: colecoes.size, l: [...colecoes.values()].map((i) => ({ nome: i.nome, lista: visivelDe(i), caminho: i.caminho })) }
  return cacheVisivel.l
}
function todasAsSementes(): ColecaoLida[] {
  if (!cacheSemente || cacheSemente.n !== colecoes.size)
    cacheSemente = { n: colecoes.size, l: [...colecoes.values()].map((i) => ({ nome: i.nome, lista: (i.semente ??= i.semear()), caminho: i.caminho })) }
  return cacheSemente.l
}
export const useTodasAsColecoes = () => useSyncExternalStore(assinar, todasAsColecoes, todasAsSementes)

/** Muda a cada alteração de qualquer coleção (para memorizar cálculos que cruzam coleções). */
export const useVersaoDosDados = () => useSyncExternalStore(assinar, () => versaoDoStore, () => 0)
