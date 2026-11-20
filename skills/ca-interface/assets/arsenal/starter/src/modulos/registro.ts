// Registro dos módulos: junta o `modulo.ts` de cada pasta src/modulos/<id>/ (import.meta.glob). Daqui saem a barra
// lateral, as abas do celular, o "Mais", o Ctrl K, as simulações da barra F e os grupos do quadro de fluxos.
// As ROTAS saem das pastas src/modulos/<id>/paginas/ (integração em integracoes/modulos.mjs).
// Arquivo compartilhado: um módulo novo NÃO edita este arquivo; ele cria a própria pasta com modulo.ts.
import { useSyncExternalStore } from "react"
import type { LucideIcon } from "lucide-react"
import { pode, type Capacidade, type Papel } from "@/proto/permissoes"
import { situacoesAtuais, visivel, type MapaDeSituacoes } from "@/proto/modulos"

// Ligado e desligado (5.11, EST-47): a situação de cada módulo vem de src/proto/modulos.ts e vale para qualquer id, mesmo
// de módulo que ainda não existe ("loja"). As leituras abaixo tiram o módulo desligado; a casca passa o mapa do hook
// (useSituacoesDosModulos), que no servidor e na hidratação diz "todos ligados", igual ao HTML.
export {
  ativo, visivel, situacaoDoModulo, situacoesAtuais, situacoesDosModulos, useAtivo, useSituacaoDoModulo,
  useSituacoesDosModulos, useRegistroDoModulo, type Situacao, type SituacaoDoModulo, type MapaDeSituacoes,
} from "@/proto/modulos"

export type ItemNav = {
  rotulo: string
  /** Rótulo da aba do celular (curto). */ curto?: string
  /** Relativo ao base, sem barra no começo ("pedidos/"). */ caminho: string
  icone: LucideIcon
  /** Some da navegação para quem não pode (pode(papel, capacidade) sem contexto). */ capacidade?: Capacidade
  /**
   * Prioridade na barra de abas do celular (menor primeiro). Sem número, o item fica no "Mais". Um número vale para
   * todos os papéis; `{ atendente: 3, tecnico: 4 }` vale só para os papéis citados (os outros: no "Mais").
   */
  aba?: number | Partial<Record<Papel, number>>
  /**
   * Variação por papel: outro rótulo (e rótulo curto) para o papel, ou `false` para tirar o item da navegação dele.
   * Ex.: `{ tecnico: { rotulo: "Minhas OS", curto: "Minhas OS" } }`. `navegacao(papel)` já devolve o item resolvido.
   */
  porPapel?: Partial<Record<Papel, { rotulo?: string; curto?: string } | false>>
  filhos?: ItemNav[]
}
export type Comando = { rotulo: string; detalhe: string; caminho: string }
export type Simulacao = { rotulo: string; executar: () => void }
/** Notificação do sino: o que pede atenção agora neste módulo. */
export type Aviso = {
  titulo: string; texto: string; caminho: string
  /** Chave estável do "lido" (sem ela, o caminho). */ id?: string
  /** 1 = pede ação já (sobe no sino), 2 = padrão, 3 = informativo. Empate: a ordem dos módulos. */ prioridade?: number
  /** O módulo guarda o próprio "lido" (ex.: a central de Mensagens): diga aqui se já foi lido. */ lida?: boolean
  /** Grava o "lido" no módulo (abrir o aviso ou "Marcar todas"). Sem ela, a base guarda o lido neste aparelho. */ aoLer?: () => void
}

export type Modulo = {
  id: string
  nome: string
  /** De que ponta é: operador (painel), cliente (portal), publico (site) ou ferramenta (do protótipo). */
  ponta: "operador" | "cliente" | "publico" | "ferramenta"
  /** Posição na navegação. */ ordem: number
  nav: ItemNav[]
  /** Coleções que este módulo declara (o modulos.mjs apaga só estas). */ colecoes: string[]
  /** Módulos de que este precisa (os dados ou as telas deles). */ depende: string[]
  /** Resultados do Ctrl K para o texto digitado (já normalizado: sem acento, minúsculo). Máx. ~5 por módulo. */
  comandos?: (q: string, papel: Papel) => Comando[]
  /** Botões de "Simular a outra ponta" na barra F (D10). */
  simulacoes?: Simulacao[]
  /** O que vai para o sino da barra superior (lido a cada mudança dos dados). */
  avisos?: (papel: Papel) => Aviso[]
  /**
   * Quem a barra F oferece em "Ver como cliente…" (sessão do cliente, src/proto/cliente.ts). Declare no módulo que tem a
   * ponta do cliente (o Portal); sem nenhum, a barra F não mostra a escolha.
   */
  clientes?: () => { id: string; nome: string }[]
}

const arquivos = import.meta.glob<{ default: Modulo }>("./*/modulo.ts", { eager: true })
export const MODULOS: Modulo[] = Object.values(arquivos).map((m) => m.default).sort((a, b) => a.ordem - b.ordem)

/** Os módulos que aparecem (sem os desligados). `sit`: o mapa do hook na casca; sem ele, a situação de agora. */
export const modulosVisiveis = (sit: MapaDeSituacoes = situacoesAtuais()) => MODULOS.filter((m) => visivel(m.id, sit))

/** Navegação do papel: só os itens (e filhos) que ele pode ver, dos módulos que não estão desligados. */
export function navegacao(papel: Papel, sit?: MapaDeSituacoes): ItemNav[] {
  return modulosVisiveis(sit).flatMap((m) => navDoModulo(m, papel))
}
/** A navegação de um módulo para o papel: sem o que ele não pode ver, com o rótulo do papel (`porPapel`). */
export function navDoModulo(m: Modulo, papel: Papel): ItemNav[] {
  const ve = (i: ItemNav) => (!i.capacidade || pode(papel, i.capacidade)) && i.porPapel?.[papel] !== false
  const doPapel = (i: ItemNav): ItemNav => { const v = i.porPapel?.[papel]; return v ? { ...i, ...v } : i }
  return m.nav.filter(ve).map((i) => doPapel(i.filhos ? { ...i, filhos: i.filhos.filter(ve).map(doPapel) } : i))
}
/** Lista achatada (com filhos), para a busca. */
export const achatar = (itens: ItemNav[]) => itens.flatMap((i) => [i, ...(i.filhos ?? [])])

/** Itens da barra de abas do celular: os 4 de menor `aba` + "Mais" se sobrar algo (máx. 5). */
/** A prioridade do item nas abas do celular para o papel (undefined: fica no "Mais"). */
export const abaDe = (i: ItemNav, papel: Papel) => (typeof i.aba === "object" ? i.aba[papel] : i.aba)

export function abas(papel: Papel, sit?: MapaDeSituacoes): { itens: ItemNav[]; mais: boolean } {
  const nav = navegacao(papel, sit)
  // filhos também entram quando têm aba para o papel (ex.: Receber, Pagar e Caixa nas abas do financeiro)
  const comAba = achatar(nav).filter((i) => abaDe(i, papel) !== undefined).sort((a, b) => abaDe(a, papel)! - abaDe(b, papel)!)
  if (comAba.length <= 5 && achatar(nav).length === comAba.length) return { itens: comAba, mais: false }
  return { itens: comAba.slice(0, 4), mais: true }
}

/** Caminho do item ativo na rota atual: o mais longo que casa por prefixo (a raiz só casa com ela mesma). */
export function caminhoAtivo(rota: string, itens = achatar(MODULOS.flatMap((m) => m.nav))): string | undefined {
  const casa = (c: string) => (c === "" ? rota === "" : rota === c.replace(/\/+$/, "") || rota.startsWith(c))
  return itens.map((i) => i.caminho).filter(casa).sort((a, b) => b.length - a.length)[0]
}

/** Ctrl K: os comandos de todos os módulos para o texto digitado. */
export function comandos(q: string, papel: Papel): (Comando & { modulo: string })[] {
  return modulosVisiveis().flatMap((m) => (m.comandos?.(q, papel) ?? []).map((c) => ({ ...c, modulo: m.nome })))
}

/** Barra F: as simulações dos módulos que não estão desligados (`sit` do hook na casca). */
export const simulacoes = (sit?: MapaDeSituacoes) => modulosVisiveis(sit).flatMap((m) => m.simulacoes ?? [])
export const avisos = (papel: Papel) => modulosVisiveis().flatMap((m) => m.avisos?.(papel) ?? [])
/** Barra F, "Ver como cliente…": as clientes que os módulos oferecem (sem repetir id). */
export const clientesParaVerComo = (sit?: MapaDeSituacoes) => {
  const vistos = new Set<string>()
  return modulosVisiveis(sit).flatMap((m) => m.clientes?.() ?? []).filter((c) => !vistos.has(c.id) && vistos.add(c.id))
}

// ---------- sino: prioridade e "lido" ----------
// O lido de quem não guarda o próprio (sem `aoLer`) fica neste aparelho, em "proto-avisos-lidos". Quem guarda (a central
// de Mensagens) informa `lida` e grava em `aoLer`: o sino e a central mostram o mesmo estado.
const CHAVE_LIDOS = "proto-avisos-lidos"
const SEM_LIDOS: ReadonlySet<string> = new Set()
let lidos: ReadonlySet<string> = SEM_LIDOS
if (typeof window !== "undefined") {
  try { const l = JSON.parse(localStorage.getItem(CHAVE_LIDOS) || "[]"); if (Array.isArray(l) && l.length) lidos = new Set(l.map(String)) } catch {}
}
const ouvintesLidos = new Set<() => void>()
function guardarLidos(novos: ReadonlySet<string>) {
  lidos = novos
  try { localStorage.setItem(CHAVE_LIDOS, JSON.stringify([...novos].slice(-300))) } catch {}
  ouvintesLidos.forEach((f) => f())
}
/** Os ids lidos guardados pela base (vazio no servidor e na hidratação). */
export const useAvisosLidos = () => useSyncExternalStore((f) => (ouvintesLidos.add(f), () => { ouvintesLidos.delete(f) }), () => lidos, () => SEM_LIDOS)

export type AvisoDoSino = Aviso & { chave: string; lida: boolean }
/** Os avisos do papel para o sino: por prioridade (1 primeiro), com o "lido" resolvido. */
export function avisosDoSino(papel: Papel, lidosDaBase: ReadonlySet<string> = lidos): AvisoDoSino[] {
  return avisos(papel)
    .map((a, ordem) => ({ a, ordem }))
    .sort((x, y) => (x.a.prioridade ?? 2) - (y.a.prioridade ?? 2) || x.ordem - y.ordem)
    .map(({ a }) => { const chave = a.id ?? a.caminho; return { ...a, chave, lida: a.lida ?? lidosDaBase.has(chave) } })
}
/** Marca um aviso como lido (no módulo, se ele guarda; senão, na base). */
export function lerAviso(a: AvisoDoSino) {
  if (a.lida) return
  if (a.aoLer) a.aoLer()
  else guardarLidos(new Set([...lidos, a.chave]))
}
/** "Marcar todas como lidas". */
export function lerTodosOsAvisos(lista: AvisoDoSino[]) {
  const daBase = lista.filter((a) => !a.lida && !a.aoLer).map((a) => a.chave)
  for (const a of lista) if (!a.lida && a.aoLer) a.aoLer()
  if (daBase.length) guardarLidos(new Set([...lidos, ...daBase]))
}
export const moduloPorId = (id: string) => MODULOS.find((m) => m.id === id)

/** Normaliza para busca: sem acento, minúsculo. */
export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
