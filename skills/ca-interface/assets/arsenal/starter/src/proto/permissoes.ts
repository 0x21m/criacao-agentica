// Papéis e permissões (D4, seção 2 da especificação). Fonte única: a navegação filtra por pode(), as telas escondem o
// que o papel não vê e a acao() recusa o que o papel não pode (a tela não é a única barreira).
// O papel ativo troca na barra F ("Ver como") e por ?papel= na URL; a pessoa e a unidade, na Entrada; tudo fica no
// localStorage do aparelho (sessão, no fim do arquivo). A matriz aceita ajustes em tempo de execução (ajustarMatriz).
// Arquivo compartilhado: um módulo novo que precise de capacidade nova acrescenta a linha na matriz e avisa no
// docs/contratos.md (é a única edição permitida aqui, e vai no mesmo commit do módulo).
import { useEffect, useSyncExternalStore } from "react"
import { EQUIPE, UNIDADES, type Papel, type Pessoa, type Unidade } from "./negocio"

export type { Papel }
export const PAPEIS: { id: Papel; nome: string }[] = [
  { id: "dono", nome: "Dono" }, { id: "gestora", nome: "Gestora" }, { id: "atendente", nome: "Atendente" },
  { id: "tecnico", nome: "Técnico" }, { id: "financeiro", nome: "Financeiro" },
]
export const nomeDoPapel = (p: Papel) => PAPEIS.find((x) => x.id === p)!.nome
/** Quem a barra F "veste" em cada papel (o usuário fictício da sessão). */
export const PESSOA_DO_PAPEL: Record<Papel, string> = { dono: "rogerio", gestora: "marina", atendente: "ana", tecnico: "bruno", financeiro: "helena" }
export const PAPEL_PADRAO: Papel = "gestora"

/**
 * Regra de uma capacidade num papel. true / false; "proprias" = só os registros atribuídos à pessoa;
 * "unidade" = só os da unidade dela; "parcial" = vê a tela com um recorte (a tela filtra; o texto diz qual).
 */
export type Regra = boolean | "proprias" | "unidade" | "parcial"
type Linha = { rotulo: string; dono: Regra; gestora: Regra; atendente: Regra; tecnico: Regra; financeiro: Regra; nota?: string }

/** A matriz da seção 2 (a coluna do cliente vive no portal, pela projeção). */
export const MATRIZ = {
  ver_inicio: { rotulo: "ver o início", dono: true, gestora: true, atendente: "unidade", tecnico: "proprias", financeiro: "parcial", nota: "atendente sem valores do caixa; técnico vê \"Meu dia\"; financeiro só o bloco financeiro" },
  ver_pedidos: { rotulo: "ver OS e vendas", dono: true, gestora: true, atendente: "unidade", tecnico: "proprias", financeiro: "parcial", nota: "financeiro só leitura" },
  criar_pedido: { rotulo: "criar OS, venda ou agendamento", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: false },
  mover_os: { rotulo: "mover a OS no quadro", dono: true, gestora: true, atendente: true, tecnico: "proprias", financeiro: false },
  enviar_orcamento: { rotulo: "enviar o orçamento", dono: true, gestora: true, atendente: true, tecnico: "proprias", financeiro: false },
  registrar_aprovacao: { rotulo: "registrar a aprovação do orçamento", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: false },
  concluir_os: { rotulo: "concluir a OS", dono: true, gestora: true, atendente: false, tecnico: "proprias", financeiro: false },
  cancelar_os: { rotulo: "cancelar a OS", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: false, nota: "gestora até em execução; atendente até aprovada (conferido por etapa)" },
  ver_custo: { rotulo: "ver custo, margem e preço de compra", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: true },
  ver_totais: { rotulo: "ver os totais em dinheiro das listas", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: true, nota: "rodapés e resumos (Em aberto, A cobrar): o técnico vê as próprias OS sem dinheiro agregado" },
  desconto_alto: { rotulo: "dar desconto acima de 10 %", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: false },
  ver_agenda: { rotulo: "ver a agenda", dono: true, gestora: true, atendente: "unidade", tecnico: "proprias", financeiro: false },
  mover_agenda: { rotulo: "mover agendamentos", dono: true, gestora: true, atendente: "unidade", tecnico: false, financeiro: false },
  registrar_visita: { rotulo: "marcar a chegada ou a ausência na visita", dono: true, gestora: true, atendente: "unidade", tecnico: "proprias", financeiro: false, nota: "técnico nas próprias visitas (Meu dia)" },
  ver_clientes: { rotulo: "ver clientes", dono: true, gestora: true, atendente: true, tecnico: "proprias", financeiro: true, nota: "técnico vê o contato só durante a visita" },
  editar_cliente: { rotulo: "editar o cliente", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: false },
  nota_interna: { rotulo: "ver a nota interna", dono: true, gestora: true, atendente: true, tecnico: true, financeiro: false },
  anonimizar: { rotulo: "anonimizar o cliente (LGPD)", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: false },
  estoque_ver: { rotulo: "ver o estoque", dono: true, gestora: true, atendente: true, tecnico: "parcial", financeiro: true, nota: "técnico vê o saldo, sem custo" },
  estoque_ajustar: { rotulo: "ajustar o estoque e comprar", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: "parcial" },
  estoque_historico: { rotulo: "ver as movimentações e as compras do estoque", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: true, nota: "módulo Estoque (5.6): o técnico só consulta o saldo" },
  estoque_exportar: { rotulo: "exportar o estoque em CSV", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: true, nota: "módulo Estoque (5.6): técnico e atendente veem o saldo sem ações" },
  estoque_movimentar: { rotulo: "mexer no saldo do estoque e nas compras", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: false, nota: "ajustar, transferir, gerar, enviar e receber compra; o financeiro só aprova o pagamento da compra" },
  financeiro_ver: { rotulo: "ver o financeiro", dono: true, gestora: true, atendente: "parcial", tecnico: false, financeiro: true, nota: "atendente só o \"receber\" de OS e vendas" },
  financeiro_painel: { rotulo: "abrir as telas do financeiro", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: true, nota: "fluxo, receber, pagar e caixa; a atendente recebe a partir da OS" },
  receber: { rotulo: "receber um pagamento", dono: true, gestora: true, atendente: "parcial", tecnico: false, financeiro: true, nota: "atendente só no balcão" },
  pagar: { rotulo: "pagar uma conta", dono: true, gestora: false, atendente: false, tecnico: false, financeiro: true },
  estornar: { rotulo: "estornar um pagamento", dono: true, gestora: "parcial", atendente: false, tecnico: false, financeiro: true, nota: "gestora até R$ 500,00" },
  fechar_caixa: { rotulo: "fechar o caixa do dia", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: true },
  relatorios: { rotulo: "ver relatórios", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: "parcial" },
  mensagens: { rotulo: "conversar com o cliente", dono: true, gestora: true, atendente: true, tecnico: "proprias", financeiro: false },
  mensagens_modelos: { rotulo: "editar os modelos de mensagem", dono: true, gestora: true, atendente: true, tecnico: false, financeiro: false, nota: "módulo Mensagens (5.9): técnico e financeiro só leem" },
  equipe_ver: { rotulo: "ver a equipe e as permissões", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: false },
  equipe_gerir: { rotulo: "convidar e mudar papéis", dono: true, gestora: "parcial", atendente: false, tecnico: false, financeiro: false, nota: "gestora convida atendente e técnico" },
  auditoria: { rotulo: "ver a auditoria", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: "parcial" },
  configuracoes_empresa: { rotulo: "mudar as configurações da empresa", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: false },
  configuracoes_pagamento: { rotulo: "mudar a chave Pix e o gateway de pagamento", dono: true, gestora: false, atendente: false, tecnico: false, financeiro: false, nota: "Configurações (5.11): a gestora muda o resto da empresa, menos as integrações de pagamento" },
  aparencia: { rotulo: "mudar a aparência pessoal", dono: true, gestora: true, atendente: true, tecnico: true, financeiro: true },
  trocar_unidade: { rotulo: "trocar de unidade", dono: true, gestora: true, atendente: false, tecnico: false, financeiro: true },
} satisfies Record<string, Linha>

export type Capacidade = keyof typeof MATRIZ

/** Contexto do registro, para as regras "proprias", "unidade" e as que dependem da etapa ou do valor. */
export type Contexto = { responsavelId?: string; unidade?: Unidade; etapa?: string; valor?: number }

const ETAPAS_ATE_APROVADA = ["solicitada", "agendada", "em_diagnostico", "aguardando_aprovacao", "aprovada"]
const ETAPAS_ATE_EXECUCAO = [...ETAPAS_ATE_APROVADA, "em_execucao", "aguardando_peca"]

/**
 * O papel pode? Sem contexto, responde "a tela abre para ele" (proprias, unidade e parcial valem sim).
 * Com contexto, confere o registro: dono do registro, unidade, etapa (cancelar) e valor (estornar).
 */
export function pode(papel: Papel, cap: Capacidade, ctx?: Contexto): boolean {
  const r = regraDe(papel, cap)
  if (r === false) return false
  if (ctx) {
    const eu = !emHidratacao && papel === estado.papel ? pessoaAtual() : pessoaDoPapel(papel)
    if (r === "proprias" && ctx.responsavelId !== undefined && ctx.responsavelId !== eu.id) return false
    if (r === "unidade" && ctx.unidade && eu.unidade !== "todas" && ctx.unidade !== eu.unidade) return false
    if (cap === "cancelar_os" && ctx.etapa) {
      if (papel === "gestora" && !ETAPAS_ATE_EXECUCAO.includes(ctx.etapa)) return false
      if (papel === "atendente" && !ETAPAS_ATE_APROVADA.includes(ctx.etapa)) return false
    }
    if (cap === "estornar" && papel === "gestora" && (ctx.valor ?? 0) > 500) return false
  }
  return true
}

export const pessoaDoPapel = (p: Papel): Pessoa => EQUIPE.find((x) => x.id === PESSOA_DO_PAPEL[p])!

/** Quem libera: a gestora para os outros papéis; o dono para a gestora. */
export function aQuemPedir(papel: Papel) {
  const quem = pessoaDoPapel(papel === "gestora" ? "dono" : "gestora")
  return `${quem.nome} (${nomeDoPapel(quem.papel).toLowerCase()})`
}
/** "Seu papel não permite enviar o orçamento. Peça a Marina Duarte (gestora)." */
export const fraseSemPermissao = (papel: Papel, cap: Capacidade) => `Seu papel não permite ${MATRIZ[cap].rotulo}. Peça a ${aQuemPedir(papel)}.`

// ---------- sessão: papel, pessoa, unidade e ajustes da matriz ----------
// O papel fica em "proto-papel" (barra F e ?papel=, que agora também fica guardado), a pessoa e a unidade em
// "proto-sessao" (a Entrada grava por definirSessao) e os ajustes da matriz em "proto-matriz-ajustes" (a Equipe grava
// por ajustarMatriz). No servidor e na hidratação vale a sessão padrão (Marina, gestora, Pampulha, matriz sem ajuste):
// o HTML é o mesmo para todos. Para ninguém ver o dado de outro papel nesse intervalo, o script do Base.astro marca
// html[data-sessao-pendente] (e data-casca-pendente) quando a sessão guardada não é a padrão, o CSS esconde o conteúdo e
// a casca, e os hooks abaixo tiram a marca depois de a ilha renderizar com a sessão de verdade.
export type EscolhaUnidade = Unidade | "todas"
export type Sessao = { papel: Papel; pessoaId: string; unidade: EscolhaUnidade }
/** Ajustes da matriz em tempo de execução: capacidade → papel → regra (só o que difere da MATRIZ). */
export type AjustesDaMatriz = Partial<Record<Capacidade, Partial<Record<Papel, Regra>>>>
type Estado = Sessao & { ajustes: AjustesDaMatriz }

const CHAVE = "proto-papel", CHAVE_SESSAO = "proto-sessao", CHAVE_AJUSTES = "proto-matriz-ajustes"
const noNavegador = typeof window !== "undefined"
const valido = (x: unknown): x is Papel => PAPEIS.some((p) => p.id === x)
const REGRAS: Regra[] = [true, false, "proprias", "unidade", "parcial"]
const pessoaPorId = (id?: string) => EQUIPE.find((x) => x.id === id)

/** Sessão coerente: a pessoa é do papel (senão, a padrão dele); quem não troca de unidade fica na sua. */
function coerente(papel: Papel, pessoaId?: string, unidade?: string): Sessao {
  const achada = pessoaPorId(pessoaId)
  const pessoa = achada && achada.papel === papel ? achada : pessoaDoPapel(papel)
  const escolhida = unidade === "todas" || (unidade && unidade in UNIDADES) ? (unidade as EscolhaUnidade) : pessoa.unidade
  return { papel, pessoaId: pessoa.id, unidade: MATRIZ.trocar_unidade[papel] === false ? pessoa.unidade : escolhida }
}
const PADRAO: Estado = { ...coerente(PAPEL_PADRAO), ajustes: {} }
const ePadrao = (e: Estado) => e.papel === PADRAO.papel && e.pessoaId === PADRAO.pessoaId && e.unidade === PADRAO.unidade && !Object.keys(e.ajustes).length

function lerAjustes(texto: string | null): AjustesDaMatriz {
  const out: AjustesDaMatriz = {}
  try {
    const bruto = JSON.parse(texto || "{}") as Record<string, Record<string, unknown>>
    for (const [cap, linha] of Object.entries(bruto)) {
      if (!(cap in MATRIZ) || !linha) continue
      for (const [p, r] of Object.entries(linha)) {
        if (valido(p) && REGRAS.includes(r as Regra) && r !== (MATRIZ[cap as Capacidade] as Linha)[p]) (out[cap as Capacidade] ??= {})[p] = r as Regra
      }
    }
  } catch {}
  return out
}
function lerGuardado(): Estado {
  let papelG: string | null = null, ajustesG: string | null = null
  let sessaoG: Partial<Sessao> = {}
  try {
    papelG = localStorage.getItem(CHAVE)
    ajustesG = localStorage.getItem(CHAVE_AJUSTES)
    sessaoG = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "{}") ?? {}
  } catch {}
  const daUrl = new URLSearchParams(location.search).get("papel")
  const papel = valido(daUrl) ? daUrl : valido(papelG) ? papelG : PAPEL_PADRAO
  const e = { ...coerente(papel, sessaoG.pessoaId, sessaoG.unidade), ajustes: lerAjustes(ajustesG) }
  return ePadrao(e) ? PADRAO : e
}
function guardar() {
  try {
    localStorage.setItem(CHAVE, estado.papel)
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ pessoaId: estado.pessoaId, unidade: estado.unidade }))
    if (Object.keys(estado.ajustes).length) localStorage.setItem(CHAVE_AJUSTES, JSON.stringify(estado.ajustes))
    else localStorage.removeItem(CHAVE_AJUSTES)
  } catch {}
}

const ouvintes = new Set<() => void>()
let estado: Estado = PADRAO
if (noNavegador) {
  estado = lerGuardado()
  // ?papel= na URL vale para as próximas páginas também (navegação completa, link novo)
  if (new URLSearchParams(location.search).has("papel")) guardar()
  // outra aba trocou o papel, a pessoa ou a matriz: esta acompanha
  addEventListener("storage", (ev) => {
    if (ev.key !== CHAVE && ev.key !== CHAVE_SESSAO && ev.key !== CHAVE_AJUSTES) return
    estado = lerGuardado()
    ouvintes.forEach((f) => f())
  })
}
function mudar(novo: Estado) {
  estado = ePadrao(novo) ? PADRAO : novo
  guardar()
  ouvintes.forEach((f) => f())
}

/** Regra efetiva (MATRIZ + ajustes). Durante a hidratação, a MATRIZ pura, como no servidor. */
export function regraDe(papel: Papel, cap: Capacidade): Regra {
  const ajuste = emHidratacao ? undefined : estado.ajustes[cap]?.[papel]
  return ajuste ?? (MATRIZ[cap] as Linha)[papel]
}

export const papelAtual = () => estado.papel
export const pessoaAtual = (): Pessoa => pessoaPorId(estado.pessoaId) ?? pessoaDoPapel(estado.papel)
export const unidadeAtual = (): EscolhaUnidade => estado.unidade
export const sessaoAtual = (): Sessao => ({ papel: estado.papel, pessoaId: estado.pessoaId, unidade: estado.unidade })
export const ajustesDaMatriz = (): AjustesDaMatriz => estado.ajustes

/** Troca o papel (barra F, "Ver como"): veste a pessoa padrão dele, na unidade dela. */
export function trocarPapel(p: Papel) {
  mudar({ ...coerente(p), ajustes: estado.ajustes })
}
/**
 * Muda a sessão (Entrada: entrar como alguém, trocar de unidade). Sem `papel`, vale o da pessoa; sem `pessoaId`, a
 * pessoa atual se for do papel; sem `unidade`, a atual se a pessoa não mudou. Pessoa de outro papel vira a padrão dele.
 */
export function definirSessao(m: Partial<Sessao>) {
  const papel = m.papel ?? pessoaPorId(m.pessoaId)?.papel ?? estado.papel
  const pessoaId = m.pessoaId ?? (papel === estado.papel ? estado.pessoaId : undefined)
  const unidade = m.unidade ?? (pessoaId === estado.pessoaId ? estado.unidade : undefined)
  mudar({ ...coerente(papel, pessoaId, unidade), ajustes: estado.ajustes })
}
/** Ajusta a regra de um papel numa capacidade (a Equipe edita a matriz); `null` ou a regra da MATRIZ volta ao padrão. */
export function ajustarMatriz(cap: Capacidade, papel: Papel, regra: Regra | null) {
  const linha = { ...estado.ajustes[cap] }
  if (regra === null || regra === (MATRIZ[cap] as Linha)[papel]) delete linha[papel]
  else linha[papel] = regra
  const ajustes: AjustesDaMatriz = { ...estado.ajustes, [cap]: linha }
  if (!Object.keys(linha).length) delete ajustes[cap]
  mudar({ ...estado, ajustes })
}
/** Todas as regras voltam à MATRIZ (também no "Resetar dados" da barra F). */
export function limparAjustesDaMatriz() { if (Object.keys(estado.ajustes).length) mudar({ ...estado, ajustes: {} }) }

// getServerSnapshot só roda no servidor e na hidratação: marca o intervalo em que pode() usa a MATRIZ pura e a pessoa
// padrão, para o HTML do servidor e a hidratação baterem mesmo com ajustes guardados
let emHidratacao = false
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }
const doCliente = () => { emHidratacao = false; return estado }
const doServidor = () => { emHidratacao = true; return PADRAO }
// A casca tem várias ilhas (lateral, topo, abas), cada uma hidratando no seu tempo (client:idle): a marca da casca só sai
// quando nenhuma delas ainda mostra o HTML do servidor (astro-island[ssr]); a última a renderizar solta.
const liberar = (marca: string) => {
  if (!noNavegador) return
  if (marca === "data-casca-pendente" && document.querySelector("astro-island[ssr] [data-casca-sessao]")) return
  document.documentElement.removeAttribute(marca)
}

function useEstado(marca = "data-sessao-pendente"): Estado {
  const e = useSyncExternalStore(assinar, doCliente, doServidor)
  // a ilha já renderizou com a sessão de verdade: a região dela (conteúdo ou casca) pode aparecer
  useEffect(() => { if (e === estado) liberar(marca) }, [e])
  return e
}
/** Papel ativo. No servidor e na hidratação: a gestora (o usuário padrão); depois, o da sessão. */
export const usePapel = () => useEstado().papel
/** A pessoa da sessão (nome, iniciais, unidade de lotação): a que entrou pela Entrada ou a padrão do papel. */
export const usePessoa = (): Pessoa => { const e = useEstado(); return pessoaPorId(e.pessoaId) ?? pessoaDoPapel(e.papel) }
/** Unidade escolhida na sessão ("todas" para quem vê as duas): filtre listas e o Início por ela. */
export const useUnidade = (): EscolhaUnidade => useEstado().unidade
/** A sessão inteira (papel, pessoaId, unidade). */
export const useSessao = (): Sessao => { const e = useEstado(); return { papel: e.papel, pessoaId: e.pessoaId, unidade: e.unidade } }
/** Os ajustes da matriz em vigor (a tela da matriz marca o que difere da MATRIZ). */
export const useAjustesDaMatriz = (): AjustesDaMatriz => useEstado().ajustes
/**
 * A sessão para a casca (lateral, barra superior, abas, barra F), que fica fora do <main>: libera só
 * html[data-casca-pendente]. Ilha da casca usa este e nunca usePapel(), que liberaria o conteúdo antes da hora.
 */
export function useSessaoDaCasca(): Sessao & { pessoa: Pessoa } {
  const e = useEstado("data-casca-pendente")
  return { papel: e.papel, pessoaId: e.pessoaId, unidade: e.unidade, pessoa: pessoaPorId(e.pessoaId) ?? pessoaDoPapel(e.papel) }
}
/** Atalho das telas: o papel ativo pode? */
export function usePode(cap: Capacidade, ctx?: Contexto) { return pode(usePapel(), cap, ctx) }
