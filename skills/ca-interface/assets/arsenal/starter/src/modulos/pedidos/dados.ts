// Módulo Pedidos · coleção `pedidos` (seção 3.1): ordens de serviço (tipo "os"). Os registros dos roteiros têm id fixo
// (OS-1052 da Juliana aguardando aprovação, OS-1044 aguardando peça, OS-1099 de valor gigante…); o resto sai da semente.
// As regras do quadro (que coluna aceita que OS, e se o movimento é O ou P) e as ações do módulo estão aqui.
import { acao, colecao, evento, fraseConflito, mudarComoOutraPonta, proximoId, type Aleatorio, type Evento, type Rascunho, type Registro } from "@/proto/dados"
import { agora, nov, DIA } from "@/proto/relogio"
import { EMPRESA, recursoPorId, servicoPorSlug, type Unidade } from "@/proto/negocio"
import { CONFLITO, ETAPA_OS, ETAPAS_TERMINAIS, fraseOrcamentoMudou, type EstadoOrcamento, type EstadoPagamento, type EtapaOS } from "@/proto/projecao"
import { clientes } from "@/modulos/clientes/dados"
import { agendamentos, type Agendamento } from "@/modulos/agenda/dados"
import { lancamentos, type Lancamento } from "@/modulos/financeiro/dados"
// ciclo de import com estoque/dados.ts (que lê `pedidos`): só usado dentro de funções, nunca no topo do módulo
import { compras, type Compra } from "@/modulos/estoque/dados"

export type ItemPedido = { sku?: string; descricao: string; qtd: number; unitario: number; tipo: "peca" | "mao_de_obra" | "produto" }
export type Orcamento = {
  versao: number; estado: EstadoOrcamento; validoAte?: string; enviadoEm?: string
  /** A versão anterior (itens e total), para mostrar o que mudou (CLI-14). */
  anterior?: { versao: number; total: number; itens: ItemPedido[] }
  decisao?: { em: string; canal: "portal" | "whatsapp" | "balcao"; por: string; anexo?: string; motivo?: string }
}
export type Pedido = {
  id: string; tipo: "os" | "venda"
  clienteId: string; unidade: Unidade
  titulo: string; servicoSlug?: string
  itens: ItemPedido[]; desconto: number; total: number
  etapa: EtapaOS
  orcamento?: Orcamento
  pagamento: EstadoPagamento
  responsavelId?: string
  agendamentoIds: string[]
  prazo: string; previsaoAnterior?: string; motivoAtraso?: string
  checklist?: { item: string; feito: boolean }[]
  garantiaAte?: string
  notaInterna?: string; custo?: number
  origem: "site" | "portal" | "balcao" | "whatsapp" | "telefone"
  /** Posição no quadro, dentro da coluna (o movimento grava o meio do intervalo entre os vizinhos). */
  ordem: number
  canceladoMotivo?: string
  criadoEm: string; versao: number; historico: Evento[]
}

const CHECKLIST = ["Teste de funcionamento", "Local limpo e organizado", "Fotos do antes e depois", "Assinatura do cliente"]
const mao = (descricao: string, v: number): ItemPedido => ({ descricao, qtd: 1, unitario: v, tipo: "mao_de_obra" })
const sis = (em: Date, texto: string, cliente = false): Evento => ({ em: em.toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto, cliente })
const pes = (em: Date, nome: string, texto: string, cliente = false, de?: string, para?: string): Evento => ({ em: em.toISOString(), quem: { tipo: "pessoa", nome }, texto, cliente, de, para, eixo: de ? "etapa" : undefined })

type F = [string, EtapaOS, string, string, string, number, string | undefined, number, Partial<Pedido>?]
// id, etapa, cliente, título, serviço, total, técnico, prazo (dia de nov.), extras
const FIXOS: F[] = [
  ["OS-1058", "solicitada", "C-0018", "Instalação elétrica de 6 tomadas na sala de aula", "eletrica", 0, undefined, 23, { origem: "site", criadoEm: nov(16, 7, 41).toISOString() }],
  ["OS-1066", "solicitada", "C-0021", "Limpeza de split 9.000 BTU – quarto", "limpeza-split", 220, undefined, 24],
  ["OS-1067", "solicitada", "C-0023", "Conserto de split que pinga água na recepção", "conserto-ar", 0, undefined, 25],
  ["OS-1059", "agendada", "C-0024", "Limpeza de 2 splits da loja", "limpeza-split", 440, "bruno", 16, { agendamentoIds: ["AG-3315"] }],
  ["OS-1060", "agendada", "C-0025", "Limpeza de split 12.000 BTU – balcão", "limpeza-split", 220, "bruno", 16, { agendamentoIds: ["AG-3316"] }],
  ["OS-1064", "agendada", "C-0030", "Montagem de 4 estantes no salão", "montagem", 560, "fabio", 16, { agendamentoIds: ["AG-3310"] }],
  ["OS-1055", "em_diagnostico", "C-0026", "Quadro de disjuntores desarmando", "eletrica", 0, "diego", 18],
  ["OS-1098", "em_diagnostico", "C-0098", "Conserto de split", "conserto-ar", 0, "diego", 19, { orcamento: { versao: 1, estado: "rascunho" }, itens: [] }],
  ["OS-1052", "aguardando_aprovacao", "C-0007", "Conserto de split 12.000 BTU (não gela)", "conserto-ar", 1480, "bruno", 19, {
    agendamentoIds: ["AG-3302"],
    itens: [{ descricao: "Placa eletrônica", qtd: 1, unitario: 890, tipo: "peca", sku: "PEC-0412" }, mao("Mão de obra", 470), { descricao: "Gás R410A", qtd: 1, unitario: 120, tipo: "peca", sku: "PEC-0108" }],
    orcamento: { versao: 1, estado: "enviado", validoAte: nov(26, 18).toISOString(), enviadoEm: nov(16, 8, 50).toISOString() }, custo: 760 }],
  ["OS-1050", "aguardando_aprovacao", "C-0027", "Troca do quadro elétrico da sala de musculação", "eletrica", 2340, "diego", 21,
    { orcamento: { versao: 1, estado: "enviado", validoAte: nov(20, 18).toISOString(), enviadoEm: nov(10, 15).toISOString() } }],
  ["OS-1047", "em_execucao", "C-0001", "Limpeza trimestral de 4 splits", "limpeza-split", 880, "diego", 16, { agendamentoIds: ["AG-3304"], notaInterna: "Contrato trimestral: emitir nota no fim do mês." }],
  ["OS-1063", "em_execucao", "C-0007", "Montagem de prateleiras", "montagem", 280, "fabio", 16, { agendamentoIds: ["AG-3309"] }],
  ["OS-1099", "em_execucao", "C-0099", "Substituição completa do sistema de climatização central dos três galpões de armazenagem refrigerada com laudo técnico", "instalacao-split-grande", 98765432.1, "elisa", 14, { custo: 71200000 }],
  ["OS-1056", "aprovada", "C-0028", "Instalação de split 12.000 BTU no salão", "instalacao-split", 650, "elisa", 18, { agendamentoIds: ["AG-3307"],
    orcamento: { versao: 1, estado: "aprovado", decisao: { em: nov(13, 16, 20).toISOString(), canal: "portal", por: "Cafeteria Grão Moído" } } }],
  ["OS-1057", "em_execucao", "C-0029", "Limpeza de split da câmara de flores", "limpeza-split", 220, "bruno", 17],
  ["OS-1044", "aguardando_peca", "C-0012", "Troca de compressor do split da recepção", "conserto-ar", 2980, "elisa", 19,
    { previsaoAnterior: nov(16).toISOString(), motivoAtraso: "fornecedor atrasou a entrega", pagamento: "sinal_pago" }],
  ["OS-1061", "pronta", "C-0015", "Limpeza de split", "limpeza-split", 220, "bruno", 16, { pagamento: "aguardando_pix" }],
  ["OS-1048", "pronta", "C-0031", "Troca de tomadas do estúdio", "eletrica", 390, "diego", 15],
]

const TITULOS: [string, string][] = [
  ["Limpeza de split 12.000 BTU", "limpeza-split"], ["Limpeza de 3 splits do escritório", "limpeza-split"], ["Instalação de split na sala", "instalacao-split"],
  ["Split não liga", "conserto-ar"], ["Split com barulho no motor", "conserto-ar"], ["Troca de disjuntor do chuveiro", "eletrica"],
  ["Tomadas da cozinha sem energia", "eletrica"], ["Montagem de guarda-roupa", "montagem"], ["Prateleiras da despensa", "montagem"],
  ["Instalação de split 24.000 BTU", "instalacao-split-grande"],
]
const ETAPAS_SORTEADAS: EtapaOS[] = ["agendada", "em_diagnostico", "aguardando_aprovacao", "em_execucao", "pronta", "entregue", "entregue", "entregue", "cancelada", "solicitada"]

function semear(r: Aleatorio): Pedido[] {
  const cli = clientes.semente().filter((c) => c.estado === "ativo" && !["C-0060", "C-0098", "C-0099"].includes(c.id))
  const tecnicos = ["bruno", "diego", "elisa", "fabio"]
  const lista: Pedido[] = FIXOS.map(([id, etapa, clienteId, titulo, servicoSlug, total, tecnico, prazo, extra]) => {
    const criado = extra?.criadoEm ? new Date(extra.criadoEm) : nov(10, 9)
    return {
      id, tipo: "os", clienteId, unidade: recursoPorId(tecnico)?.unidade ?? "pampulha", titulo, servicoSlug,
      itens: total ? [mao(servicoPorSlug(servicoSlug)?.nome ?? titulo, total)] : [], desconto: 0, total, etapa,
      pagamento: "pendente", responsavelId: tecnico, agendamentoIds: [], prazo: nov(prazo, 18).toISOString(),
      checklist: CHECKLIST.map((item) => ({ item, feito: etapa === "pronta" })), origem: "telefone", ordem: 0,
      criadoEm: criado.toISOString(), versao: 1,
      historico: [sis(criado, "Pedido recebido", true), ...(etapa !== "solicitada" ? [pes(new Date(criado.getTime() + 3600e3), "Ana Lima", `Etapa: ${ETAPA_OS.solicitada.rotulo} → ${ETAPA_OS[etapa].rotulo}`, false, "solicitada", etapa)] : [])],
      ...extra,
    }
  })
  // ~30 OS sorteadas, de D−40 a D+10, para as etapas e as listas terem volume (OS-1010 a OS-1043)
  for (let n = 1010; n <= 1043; n++) {
    const [titulo, servicoSlug] = r.pega(TITULOS)
    const etapa = ETAPAS_SORTEADAS[n % ETAPAS_SORTEADAS.length]
    const criado = new Date(nov(16, 9).getTime() - r.entre(3, 40) * DIA)
    const terminal = ETAPAS_TERMINAIS.includes(etapa)
    // prazos: os terminais no passado; os abertos quase todos no futuro (poucos atrasados: a lista de atrasadas fica legível)
    const prazo = terminal ? new Date(criado.getTime() + r.entre(3, 12) * DIA) : new Date(nov(16, 18).getTime() + r.entre(1, 10) * DIA)
    const s = servicoPorSlug(servicoSlug)!
    const total = s.preco ? s.preco * (s.porHora ? r.entre(2, 4) : r.entre(1, 3)) : r.entre(18, 140) * 10
    const tecnico = etapa === "solicitada" ? undefined : r.pega(tecnicos.filter((t) => recursoPorId(t)!.competencias.includes(s.competencia)))
    const pessoa = recursoPorId(tecnico)
    lista.push({
      id: `OS-${n}`, tipo: "os", clienteId: r.pega(cli).id, unidade: pessoa?.unidade ?? "pampulha", titulo, servicoSlug,
      itens: [mao(s.nome, total)], desconto: 0, total, etapa,
      // orçamento só existe a partir do diagnóstico; o enviado ainda vale (vence nos próximos dias)
      orcamento: s.precoFechado || etapa === "solicitada" || etapa === "agendada" || etapa === "cancelada" ? undefined
        : etapa === "em_diagnostico" ? { versao: 1, estado: "rascunho" }
        : etapa === "aguardando_aprovacao" ? { versao: 1, estado: "enviado", enviadoEm: new Date(nov(16, 9).getTime() - r.entre(1, 6) * DIA).toISOString(), validoAte: new Date(nov(16, 18).getTime() + r.entre(2, 9) * DIA).toISOString() }
        : { versao: 1, estado: "aprovado", decisao: { em: new Date(criado.getTime() + 2 * DIA).toISOString(), canal: r.pega(["portal", "whatsapp", "balcao"] as const), por: "Cliente" } },
      pagamento: etapa === "entregue" ? "pago" : "pendente", responsavelId: tecnico, agendamentoIds: [], prazo: prazo.toISOString(),
      checklist: CHECKLIST.map((item) => ({ item, feito: etapa === "pronta" || etapa === "entregue" })),
      garantiaAte: etapa === "entregue" ? new Date(prazo.getTime() + EMPRESA.garantiaDias * DIA).toISOString() : undefined,
      canceladoMotivo: etapa === "cancelada" ? r.pega(["orçamento recusado", "cliente desistiu", "duplicado"]) : undefined,
      origem: r.pega(["site", "balcao", "whatsapp", "telefone"] as const), ordem: 0, criadoEm: criado.toISOString(), versao: 1,
      historico: [sis(criado, "Pedido recebido", true)],
    })
  }
  // pior caso (seção 4): 6 OS atrasadas. A OS-1099 (desde 14/11) e as 5 primeiras sorteadas ainda em andamento
  // (só as sorteadas, OS-1010 a OS-1043: as fixas, como a OS-1044 e a OS-1047, guardam o prazo que o roteiro conta)
  lista.filter((p) => /^OS-10([1-3]\d|4[0-3])$/.test(p.id) && !ETAPAS_TERMINAIS.includes(p.etapa) && p.etapa !== "pronta" && p.etapa !== "solicitada")
    .slice(0, 5).forEach((p, i) => { p.prazo = nov(15 - i, 18).toISOString() })
  // posição no quadro: a ordem de criação dentro de cada etapa
  const porEtapa = new Map<string, number>()
  for (const p of lista.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))) {
    const k = colunaDaEtapa(p.etapa) ?? p.etapa
    p.ordem = (porEtapa.get(k) ?? 0) + 1
    porEtapa.set(k, p.ordem)
  }
  return lista.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

export const pedidos = colecao<Pedido>("pedidos", semear, 1, { caminho: (p) => `pedidos/?id=${p.id}` })

// ---------- leituras derivadas ----------
/** Prazo vencido numa etapa que ainda não terminou (e que não é "pronta": a promessa ao cliente já foi cumprida). */
export const atrasado = (p: Pedido, ref: Date = agora()) => new Date(p.prazo) < ref && !ETAPAS_TERMINAIS.includes(p.etapa) && p.etapa !== "pronta"
/** Dias de calendário desde o prazo (prazo 14/11, hoje 16/11: 2 dias). */
export const diasDeAtraso = (p: Pedido, ref: Date = agora()) => {
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.max(1, Math.round((dia(ref) - dia(new Date(p.prazo))) / DIA))
}
export const emAberto = (p: Pedido) => !ETAPAS_TERMINAIS.includes(p.etapa)
/** A cobrar: OS prontas com pagamento ainda não feito. */
export const aCobrar = (p: Pedido) => p.etapa === "pronta" && p.pagamento !== "pago"
/**
 * Quando chega a peça que a OS espera: a previsão da compra a caminho que reservou peça para ela (CMP-0007 para a
 * OS-1044). Um fato, um valor: a OS não guarda cópia da data; se o fornecedor atrasa, a OS acompanha. Sem compra
 * ligada (espera registrada à mão), vale o prazo da OS.
 */
export function previsaoDaPeca(p: Pedido, cmps: Compra[] = compras.ler()) {
  const c = cmps.filter((x) => (x.estado === "enviada" || x.estado === "recebida_parcial") && x.reservas.some((r) => r.osId === p.id))
    .sort((a, b) => a.previsao.localeCompare(b.previsao))[0]
  return { previsao: c?.previsao ?? p.prazo, compraId: c?.id }
}
/** Contexto das frases da projeção para esta OS. */
export function ctxDaOS(p: Pedido, ags: Agendamento[] = agendamentos.ler(), cmps?: Compra[]) {
  const ag = ags.find((a) => p.agendamentoIds.includes(a.id))
  const ate = p.etapa === "aguardando_aprovacao" ? p.orcamento?.validoAte : p.etapa === "entregue" ? p.garantiaAte : ag?.fim
  return {
    id: p.id, quando: p.etapa === "aprovada" ? p.orcamento?.decisao?.em : ag?.inicio, ate, valor: p.total,
    tecnico: recursoPorId(p.responsavelId)?.curto, versao: p.orcamento?.versao,
    previsao: p.etapa === "aguardando_peca" ? previsaoDaPeca(p, cmps).previsao : p.prazo, motivo: p.canceladoMotivo,
    canal: p.orcamento?.decisao?.canal,
  }
}

// ---------- quadro (5.3) ----------
export type ColunaOS = "novas" | "agendadas" | "diagnostico" | "aguardando_cliente" | "execucao" | "aguardando_peca" | "prontas"
/** As 7 colunas do quadro. "Em execução" também mostra as aprovadas, que esperam o início. */
export const COLUNAS_OS: { id: ColunaOS; titulo: string; etapas: EtapaOS[]; limite?: number }[] = [
  { id: "novas", titulo: "Novas", etapas: ["solicitada"] },
  { id: "agendadas", titulo: "Agendadas", etapas: ["agendada"] },
  { id: "diagnostico", titulo: "Diagnóstico", etapas: ["em_diagnostico"], limite: 4 },
  { id: "aguardando_cliente", titulo: "Aguardando cliente", etapas: ["aguardando_aprovacao"] },
  { id: "execucao", titulo: "Em execução", etapas: ["aprovada", "em_execucao"], limite: 6 },
  { id: "aguardando_peca", titulo: "Aguardando peça", etapas: ["aguardando_peca"] },
  { id: "prontas", titulo: "Prontas", etapas: ["pronta"] },
]
export const colunaDaEtapa = (e: EtapaOS) => COLUNAS_OS.find((c) => c.etapas.includes(e))?.id

export type Movimento =
  | { tipo: "direto"; etapa: EtapaOS }   // classe O: grava com Desfazer
  | { tipo: "agendar" }                   // abre "Agendar visita"; só move ao confirmar (P)
  | { tipo: "orcamento" }                 // abre "Enviar orçamento" (P)
  | { tipo: "concluir" }                  // abre "Concluir OS" (P)
  | { tipo: "peca" }                      // pede qual peça e a observação; só move ao confirmar (P)
  | { tipo: "invalido"; motivo: string }

/** Regra de transição (3.1 e 5.3). Mesma coluna = só reordenar. */
export function movimentoOS(os: Pedido, para: ColunaOS): Movimento {
  const de = colunaDaEtapa(os.etapa)
  if (de === para) return { tipo: "direto", etapa: os.etapa }
  const fechado = !!servicoPorSlug(os.servicoSlug)?.precoFechado
  switch (para) {
    case "novas": return { tipo: "invalido", motivo: "Uma OS não volta para Novas." }
    case "agendadas":
      return os.etapa === "solicitada" ? { tipo: "agendar" } : { tipo: "invalido", motivo: "Só OS novas são agendadas por aqui. Para remarcar, use a agenda." }
    case "diagnostico":
      return os.etapa === "agendada" ? { tipo: "direto", etapa: "em_diagnostico" } : { tipo: "invalido", motivo: "O diagnóstico começa a partir de uma OS agendada." }
    case "aguardando_cliente":
      return os.etapa === "em_diagnostico" ? { tipo: "orcamento" } : { tipo: "invalido", motivo: "O orçamento é enviado depois do diagnóstico." }
    case "execucao":
      if (os.etapa === "aguardando_peca" || os.etapa === "aprovada") return { tipo: "direto", etapa: "em_execucao" }
      if (os.etapa === "aguardando_aprovacao") return { tipo: "invalido", motivo: "Aguardando a aprovação do cliente." }
      if ((os.etapa === "agendada" || os.etapa === "em_diagnostico") && fechado) return { tipo: "direto", etapa: "em_execucao" }
      if (os.etapa === "agendada" || os.etapa === "em_diagnostico") return { tipo: "invalido", motivo: "Serviço sob orçamento: precisa de orçamento aprovado." }
      return { tipo: "invalido", motivo: "A execução começa a partir de uma OS agendada ou aprovada." }
    case "aguardando_peca":
      return os.etapa === "em_execucao" ? { tipo: "peca" } : { tipo: "invalido", motivo: "Só uma OS em execução pode esperar peça." }
    case "prontas":
      return os.etapa === "em_execucao" ? { tipo: "concluir" } : { tipo: "invalido", motivo: "Para concluir, a OS precisa estar em execução." }
  }
}
/** O próximo passo natural da OS, para o menu da linha e a folha de detalhe. */
export function proximoPasso(os: Pedido): { coluna: ColunaOS; mov: Movimento } | null {
  const ordem: ColunaOS[] = ["agendadas", "diagnostico", "execucao", "aguardando_cliente", "prontas"]
  for (const c of ordem) { const m = movimentoOS(os, c); if (m.tipo !== "invalido" && colunaDaEtapa(os.etapa) !== c) return { coluna: c, mov: m } }
  return null
}

/** Ordem entre os vizinhos (meio do intervalo). */
export function ordemEntre(antes?: number, depois?: number) {
  if (antes != null && depois != null) return (antes + depois) / 2
  if (antes != null) return antes + 1
  if (depois != null) return depois - 1
  return 1
}
const fimDaColuna = (etapa: EtapaOS) => {
  const col = colunaDaEtapa(etapa)
  return Math.max(0, ...pedidos.ler().filter((o) => colunaDaEtapa(o.etapa) === col).map((o) => o.ordem)) + 1
}
/** Contexto de permissão: OS sem responsável não é "própria" de nenhum técnico. */
export const ctxPerm = (os: Pedido) => ({ responsavelId: os.responsavelId ?? "", unidade: os.unidade, etapa: os.etapa })
const hora = (iso: string | Date) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const diaCurto = (iso: string | Date) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
const tituloColuna = (etapa: EtapaOS) => COLUNAS_OS.find((c) => c.etapas.includes(etapa))?.titulo

// ---------- ações ----------
/** Move (classe O) ou reordena e liga o Desfazer. */
/** `lote`: sem toast por OS (a tela resume o lote num toast só). */
export function moverOS(id: string, etapa: EtapaOS, ordem = fimDaColuna(etapa), lote = false) {
  const os = pedidos.porId(id)
  if (!os) return
  const antes = { etapa: os.etapa, ordem: os.ordem }
  const mudouEtapa = antes.etapa !== etapa
  return acao({
    rotulo: `mover a ${id}`, ids: [id], capacidade: "mover_os", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: os.versao },
    aplicar: (d) => {
      const o = d(pedidos).find((x) => x.id === id)
      if (!o) return
      if (o.etapa !== etapa) o.historico.push(evento(`Etapa: ${ETAPA_OS[o.etapa].rotulo} → ${ETAPA_OS[etapa].rotulo}`, { de: o.etapa, para: etapa, eixo: "etapa" }))
      o.etapa = etapa; o.ordem = ordem
    },
    desfazer: (d) => { const o = d(pedidos).find((x) => x.id === id); if (o) Object.assign(o, antes) },
    silenciosa: lote || undefined,
    sucesso: lote ? undefined : mudouEtapa ? `${id}: ${ETAPA_OS[etapa].rotulo.toLowerCase()}.` : `${id}: nova posição em ${tituloColuna(etapa)}.`,
  })
}

/** Soltar em "Aguardando peça" (P, com motivo: qual peça e a observação). O motivo fica no histórico da OS. */
export function aguardarPeca(id: string, motivo: string, ordem = fimDaColuna("aguardando_peca")) {
  const os = pedidos.porId(id)
  if (!os) return
  const antes = { etapa: os.etapa, ordem: os.ordem }
  return acao({
    rotulo: `pôr a ${id} em aguardando peça`, modo: "pessimista", ids: [id], capacidade: "mover_os", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: os.versao },
    aplicar: (d) => {
      const o = d(pedidos).find((x) => x.id === id)
      if (!o) return
      o.historico.push(evento(`Etapa: ${ETAPA_OS[o.etapa].rotulo} → ${ETAPA_OS.aguardando_peca.rotulo}. ${motivo.trim()}`, { de: o.etapa, para: "aguardando_peca", eixo: "etapa", cliente: true }))
      o.etapa = "aguardando_peca"; o.ordem = ordem
    },
    desfazer: (d) => { const o = d(pedidos).find((x) => x.id === id); if (o) Object.assign(o, antes) },
    sucesso: `${id}: aguardando peça.`,
  })
}

export function renomearOS(id: string, titulo: string) {
  const os = pedidos.porId(id)
  if (!os || !titulo.trim() || titulo.trim() === os.titulo) return
  const anterior = os.titulo
  return acao({
    rotulo: `renomear a ${id}`, ids: [id], capacidade: "mover_os", contexto: ctxPerm(os),
    aplicar: (d) => { const o = d(pedidos).find((x) => x.id === id); if (o) { o.titulo = titulo.trim(); o.historico.push(evento(`Título: ${titulo.trim()}`)) } },
    desfazer: (d) => { const o = d(pedidos).find((x) => x.id === id); if (o) o.titulo = anterior },
    sucesso: `Título da ${id} alterado.`,
  })
}

function novaOS(n: { titulo: string; clienteId: string; servicoSlug?: string; total?: number; itens?: ItemPedido[]; prazo?: string; responsavelId?: string; origem?: Pedido["origem"]; notaInterna?: string }): Pedido {
  const id = proximoId(pedidos.ler(), "OS", 1067)
  const total = n.itens?.length ? somarItens(n.itens) : n.total ?? 0
  return {
    id, tipo: "os", clienteId: n.clienteId, unidade: recursoPorId(n.responsavelId)?.unidade ?? "pampulha", titulo: n.titulo.trim(),
    servicoSlug: n.servicoSlug ?? "conserto-ar", itens: n.itens?.length ? structuredClone(n.itens) : total ? [mao(servicoPorSlug(n.servicoSlug)?.nome ?? n.titulo, total)] : [], desconto: 0, total,
    notaInterna: n.notaInterna || undefined, etapa: "solicitada", pagamento: "pendente", responsavelId: n.responsavelId, agendamentoIds: [],
    prazo: n.prazo ?? new Date(agora().getTime() + 7 * DIA).toISOString(), checklist: CHECKLIST.map((item) => ({ item, feito: false })),
    origem: n.origem ?? "balcao", ordem: fimDaColuna("solicitada"), criadoEm: agora().toISOString(), versao: 1,
    historico: [evento("Pedido criado", { cliente: true })],
  }
}

/** Adicionar rápido no fim de Novas (O, com Desfazer). */
export function criarOSRapida(titulo: string, clienteId: string) {
  const nova = novaOS({ titulo, clienteId })
  void acao({
    rotulo: "criar a OS", ids: [nova.id], capacidade: "criar_pedido",
    aplicar: (d) => { d(pedidos).push(structuredClone(nova)) },
    desfazer: (d) => { d.trocar(pedidos, d(pedidos).filter((o) => o.id !== nova.id)) },
    sucesso: `${nova.id} criada em Novas.`,
  })
  return nova.id
}

/** Formulário "Nova OS" (P: a OS só existe depois da resposta; o erro fica no formulário). Devolve o id e o resultado. */
export async function criarOS(n: Parameters<typeof novaOS>[0] & { visita?: { recursoId: string; inicio: Date; fim: Date } }) {
  const nova = novaOS(n)
  // com a visita escolhida na etapa Agenda, a OS já nasce agendada e o agendamento confirmado sai na mesma ação
  const ag = n.visita && montarAgendamento(nova, n.visita.recursoId, n.visita.inicio, n.visita.fim, "Agendado na abertura da OS")
  if (ag) {
    nova.etapa = "agendada"; nova.responsavelId = ag.recursoId; nova.agendamentoIds = [ag.id]; nova.ordem = fimDaColuna("agendada")
    nova.unidade = recursoPorId(ag.recursoId)?.unidade ?? nova.unidade
    nova.historico.push(evento(`Visita marcada: ${diaCurto(n.visita!.inicio)}, ${hora(n.visita!.inicio)}`, { de: "solicitada", para: "agendada", eixo: "etapa", cliente: true }))
  }
  const r = await acao({
    rotulo: "criar a OS", modo: "pessimista", ids: ag ? [nova.id, ag.id] : [nova.id], capacidade: "criar_pedido",
    aplicar: (d) => { d(pedidos).unshift(structuredClone(nova)); if (ag) d(agendamentos).push(structuredClone(ag)) },
    sucesso: ag ? `${nova.id} criada e agendada: ${diaCurto(ag.inicio)}, ${hora(ag.inicio)}.` : `${nova.id} criada. Falta marcar o horário.`,
  })
  return { id: nova.id, ...r }
}

function montarAgendamento(os: Pedido, recursoId: string, inicio: Date, fim: Date, texto: string): Agendamento {
  const c = clientes.porId(os.clienteId)
  return {
    id: proximoId(agendamentos.ler(), "AG", 3343), clienteId: os.clienteId, pedidoId: os.id, servicoSlug: os.servicoSlug ?? "conserto-ar", recursoId,
    inicio: inicio.toISOString(), fim: fim.toISOString(),
    local: recursoId === "bancada-pampulha" ? "loja" : "domicilio", bairro: c?.endereco.bairro ?? "", cidade: c?.endereco.cidade ?? "Belo Horizonte",
    estado: "confirmado", origem: "balcao", versao: 1, historico: [evento(texto)],
  }
}

/** Soltar em "Agendadas": cria o agendamento confirmado e move a OS (P). */
export function agendarOS(id: string, recursoId: string, inicio: Date, fim: Date) {
  const os = pedidos.porId(id)!
  const ag = montarAgendamento(os, recursoId, inicio, fim, "Agendado pelo quadro")
  const agId = ag.id
  const ordem = fimDaColuna("agendada")
  return acao({
    rotulo: `agendar a ${id}`, modo: "pessimista", ids: [id, agId], capacidade: "criar_pedido",
    conferir: { colecao: pedidos, id, versao: os.versao },
    aplicar: (d) => {
      d(agendamentos).push(structuredClone(ag))
      const o = d(pedidos).find((y) => y.id === id)
      if (o) {
        o.historico.push(evento(`Visita marcada: ${diaCurto(inicio)}, ${hora(inicio)}`, { de: o.etapa, para: "agendada", eixo: "etapa", cliente: true }))
        o.etapa = "agendada"; o.responsavelId = recursoId; o.agendamentoIds.push(agId); o.ordem = ordem
      }
    },
    sucesso: `${id} agendada: ${diaCurto(inicio)}, ${hora(inicio)}, com ${recursoPorId(recursoId)?.curto}.`,
  })
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const somarItens = (itens: ItemPedido[]) => Math.round(itens.reduce((t, i) => t + i.qtd * i.unitario, 0) * 100) / 100
/** O orçamento pode ser editado (itens) sem nova versão: só em rascunho (ou antes de existir). */
export const orcamentoEditavel = (os: Pedido) => !ETAPAS_TERMINAIS.includes(os.etapa) && (!os.orcamento || os.orcamento.estado === "rascunho")
/** Frase de conflito do orçamento: se o cliente aprovou enquanto a equipe editava, diz qual versão e oferece a próxima. */
const conflitoDoOrcamento = (atual: Registro) => {
  const o = atual as Pedido
  const dec = o.orcamento?.decisao
  return o.orcamento?.estado === "aprovado" && dec
    ? CONFLITO.editarOrcamentoAprovado({ quem: dec.por.split(" ")[0], versao: o.orcamento.versao, quando: dec.em })
    : fraseConflito(atual)
}

/**
 * Enviar orçamento (P): aguardando aprovação, validade de 10 dias. Com `itens`, grava a lista (o total sai dela); sem,
 * só o total (a sheet rápida do quadro). `versao` é a versão que a pessoa leu: mudou no caminho, recusa (D2).
 */
export function enviarOrcamento(id: string, total: number, opcoes: { itens?: ItemPedido[]; versao?: number } = {}) {
  const os = pedidos.porId(id)!
  const ordem = fimDaColuna("aguardando_aprovacao")
  const validoAte = new Date(agora().getTime() + EMPRESA.validadeOrcamentoDias * DIA).toISOString()
  const valor = opcoes.itens ? somarItens(opcoes.itens) : total
  return acao({
    rotulo: `enviar o orçamento da ${id}`, modo: "pessimista", ids: [id], capacidade: "enviar_orcamento", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: opcoes.versao ?? os.versao }, conflito: conflitoDoOrcamento,
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (!o) return
      const versao = o.orcamento?.versao ?? 1
      const anterior = o.orcamento?.anterior
      // versão 2 em diante: o cliente lê a diferença (CLI-14), no eixo do orçamento (o portal destaca)
      if (versao > 1 && anterior) o.historico.push(evento(fraseOrcamentoMudou(valor - anterior.total), { eixo: "orcamento", cliente: true }))
      o.historico.push(evento(`Orçamento v${versao} enviado: ${brl(valor)}`, { de: o.etapa, para: "aguardando_aprovacao", eixo: "etapa", cliente: true }))
      o.total = valor
      o.itens = opcoes.itens ? structuredClone(opcoes.itens) : o.itens.length && somarItens(o.itens) === valor ? o.itens : [mao("Serviço orçado", valor)]
      o.etapa = "aguardando_aprovacao"; o.ordem = ordem
      o.orcamento = { versao, estado: "enviado", validoAte, enviadoEm: agora().toISOString(), anterior }
    },
    sucesso: `Orçamento da ${id} enviado. Vale até ${new Date(validoAte).toLocaleDateString("pt-BR")}.`,
  })
}

/** Guardar os itens do orçamento em rascunho (O, com Desfazer). */
export function salvarItens(id: string, itens: ItemPedido[], versao?: number) {
  const os = pedidos.porId(id)
  if (!os) return
  const antes = { itens: structuredClone(os.itens), total: os.total, orcamento: os.orcamento && structuredClone(os.orcamento) }
  return acao({
    rotulo: `salvar os itens da ${id}`, ids: [id], capacidade: "enviar_orcamento", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: versao ?? os.versao }, conflito: conflitoDoOrcamento,
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (!o) return
      o.historico.push(evento(`Itens do orçamento v${o.orcamento?.versao ?? 1} alterados: ${brl(somarItens(itens))}`))
      o.itens = structuredClone(itens); o.total = somarItens(itens)
      o.orcamento = { ...(o.orcamento ?? { versao: 1 }), estado: "rascunho" }
    },
    desfazer: (d) => { const o = d(pedidos).find((y) => y.id === id); if (o) Object.assign(o, structuredClone(antes)) },
    sucesso: `Rascunho do orçamento da ${id} salvo.`,
  })
}

/** Criar a versão v{n+1} em rascunho, copiando os itens (O; o Desfazer apaga a versão). */
export function novaVersaoOrcamento(id: string) {
  const os = pedidos.porId(id)
  if (!os?.orcamento) return
  const antes = { orcamento: structuredClone(os.orcamento) }
  const versao = os.orcamento.versao + 1
  return acao({
    rotulo: `criar a versão ${versao} do orçamento da ${id}`, ids: [id], capacidade: "enviar_orcamento", contexto: ctxPerm(os),
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (!o?.orcamento) return
      o.historico.push(evento(`Versão ${versao} do orçamento criada (rascunho)`))
      o.orcamento = { versao, estado: "rascunho", anterior: { versao: o.orcamento.versao, total: o.total, itens: structuredClone(o.itens) } }
    },
    desfazer: (d) => { const o = d(pedidos).find((y) => y.id === id); if (o) Object.assign(o, structuredClone(antes)) },
    sucesso: `Versão ${versao} criada em rascunho. Mude os itens e envie de novo.`,
  })
}

/** Registrar a aprovação recebida por outro canal (P): exige o canal e o anexo (print da conversa). */
export function registrarAprovacao(id: string, canal: "whatsapp" | "balcao", anexo: string, versao?: number) {
  const os = pedidos.porId(id)!
  return acao({
    rotulo: `registrar a aprovação da ${id}`, modo: "pessimista", ids: [id], capacidade: "registrar_aprovacao", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: versao ?? os.versao }, conflito: conflitoDoOrcamento,
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (!o?.orcamento) return
      const em = agora().toISOString()
      const por = clientes.porId(o.clienteId)?.nome ?? "Cliente"
      o.historico.push(evento(`Aprovação registrada (${canal === "whatsapp" ? "WhatsApp" : "balcão"}, anexo ${anexo})`, { de: o.etapa, para: "aprovada", eixo: "etapa" }))
      o.historico.push(evento("Orçamento aprovado", { eixo: "orcamento", cliente: true }))
      o.orcamento = { ...o.orcamento, estado: "aprovado", decisao: { em, canal, por, anexo } }
      o.etapa = "aprovada"; o.ordem = fimDaColuna("aprovada")
    },
    sucesso: `Aprovação da ${id} registrada.`,
  })
}

/** Marcar um item do checklist (O, sem toast: o próprio item mostra a marca). */
export function marcarChecklist(id: string, item: string, feito: boolean) {
  const os = pedidos.porId(id)
  if (!os) return
  return acao({
    rotulo: `marcar o checklist da ${id}`, ids: [id], capacidade: "concluir_os", contexto: ctxPerm(os),
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      const i = o?.checklist?.find((x) => x.item === item)
      if (o && i) { i.feito = feito; o.historico.push(evento(`Checklist: ${item} ${feito ? "feito" : "desmarcado"}`)) }
    },
  })
}

/** Atribuir o técnico a uma ou mais OS (O, com Desfazer). */
export function atribuirTecnico(ids: string[], tecnicoId: string) {
  const alvo = pedidos.ler().filter((p) => ids.includes(p.id) && !ETAPAS_TERMINAIS.includes(p.etapa))
  if (!alvo.length) return
  const antes = new Map(alvo.map((p) => [p.id, { responsavelId: p.responsavelId, unidade: p.unidade }]))
  const quem = recursoPorId(tecnicoId)
  return acao({
    rotulo: alvo.length === 1 ? `atribuir a ${alvo[0].id}` : `atribuir ${alvo.length} OS`, ids: alvo.map((p) => p.id), capacidade: "mover_os",
    aplicar: (d) => {
      for (const o of d(pedidos).filter((x) => antes.has(x.id))) {
        if (o.responsavelId !== tecnicoId) o.historico.push(evento(`Técnico: ${quem?.nome ?? "a definir"}`))
        o.responsavelId = tecnicoId; o.unidade = quem?.unidade ?? o.unidade
      }
    },
    desfazer: (d) => { for (const o of d(pedidos).filter((x) => antes.has(x.id))) Object.assign(o, antes.get(o.id)) },
    sucesso: alvo.length === 1 ? `${alvo[0].id} com ${quem?.curto}.` : `${alvo.length} OS com ${quem?.curto}.`,
  })
}

/** Mudar o prazo prometido (P, com motivo): guarda a previsão anterior e avisa o cliente (CLI-08). `novo` em AAAA-MM-DD. */
export function mudarPrazo(id: string, novo: string, motivo: string, versao?: number) {
  const os = pedidos.porId(id)!
  const quando = new Date(`${novo}T18:00:00`)
  return acao({
    rotulo: `mudar o prazo da ${id}`, modo: "pessimista", ids: [id], capacidade: "mover_os", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: versao ?? os.versao },
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (!o) return
      o.historico.push(evento(`Nova previsão: ${quando.toLocaleDateString("pt-BR")} (${motivo})`, { eixo: "prazo", cliente: true }))
      o.previsaoAnterior = o.prazo; o.motivoAtraso = motivo; o.prazo = quando.toISOString()
    },
    sucesso: `Prazo da ${id}: ${quando.toLocaleDateString("pt-BR")}. O cliente é avisado.`,
  })
}

// BASE: o Financeiro não exporta "abrir a cobrança da OS"; esta peça grava o título no formato dos dele, dentro da
// mesma ação que conclui a OS (nada fica pela metade). Não abre outro se já houver um em aberto para a OS.
function abrirCobrancaDaOS(d: Rascunho, o: Pedido) {
  const lista = d(lancamentos)
  if (o.total <= 0 || o.pagamento === "pago" || lista.some((l) => l.ref === o.id && (l.estado === "em_aberto" || l.estado === "aguardando_pix"))) return
  const novo: Lancamento = {
    id: proximoId(lista, "LAN", 5140), natureza: "receber", descricao: `${o.id} · ${o.titulo.toLowerCase()}`, categoria: "Serviços",
    valor: o.total, vencimento: new Date(agora().getTime() + EMPRESA.boletoDias * DIA).toISOString(), unidade: o.unidade,
    estado: "em_aberto", ref: o.id, clienteId: o.clienteId, versao: 1,
    historico: [{ em: agora().toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto: `Título criado quando a ${o.id} ficou pronta` }],
  }
  lista.push(novo)
}
/** O título da OS no Financeiro (o link da página da OS). */
export const cobrancaDaOS = (id: string, lista: Lancamento[] = lancamentos.ler()) => lista.find((l) => l.ref === id && l.natureza === "receber" && l.estado !== "cancelado")

/** Concluir OS (P): checklist completo, etapa pronta e a cobrança aberta no Financeiro, na mesma ação. */
export function concluirOS(id: string, checklist: { item: string; feito: boolean }[], versao?: number) {
  const os = pedidos.porId(id)!
  const ordem = fimDaColuna("pronta")
  return acao({
    rotulo: `concluir a ${id}`, modo: "pessimista", ids: [id], capacidade: "concluir_os", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: versao ?? os.versao },
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (!o) return
      o.historico.push(evento("Serviço concluído", { de: o.etapa, para: "pronta", eixo: "etapa", cliente: true }))
      o.checklist = checklist; o.etapa = "pronta"; o.ordem = ordem
      abrirCobrancaDaOS(d, o)
    },
    sucesso: `${id} concluída. Cobrança aberta no Financeiro.`,
  })
}

/** Cancelar (P, com motivo). A permissão depende da etapa (seção 2). */
export function cancelarOS(id: string, motivo: string, versao?: number) {
  const os = pedidos.porId(id)!
  return acao({
    rotulo: `cancelar a ${id}`, modo: "pessimista", ids: [id], capacidade: "cancelar_os", contexto: ctxPerm(os),
    conferir: { colecao: pedidos, id, versao: versao ?? os.versao },
    aplicar: (d) => {
      const o = d(pedidos).find((y) => y.id === id)
      if (o) { o.historico.push(evento(`Cancelada: ${motivo}`, { de: o.etapa, para: "cancelada", eixo: "etapa", cliente: true })); o.etapa = "cancelada"; o.canceladoMotivo = motivo }
    },
    sucesso: `${id} cancelada.`,
  })
}

// ---------- simular a outra ponta (D10) ----------
export function clienteAprovaOrcamento(id = "OS-1052") {
  mudarComoOutraPonta((d) => {
    const o = d(pedidos).find((x) => x.id === id)
    if (!o || o.etapa !== "aguardando_aprovacao") return
    const em = agora().toISOString()
    const nome = clientes.porId(o.clienteId)?.nome ?? "Cliente"
    o.historico.push({ em, quem: { tipo: "cliente", nome }, texto: "Aprovou o orçamento pelo portal", de: o.etapa, para: "aprovada", eixo: "etapa", cliente: true })
    o.etapa = "aprovada"; o.ordem = fimDaColuna("aprovada")
    o.orcamento = { ...(o.orcamento ?? { versao: 1 }), estado: "aprovado", decisao: { em, canal: "portal", por: nome } }
  }, [id])
}
export function clientePagaPix(id = "OS-1061") {
  mudarComoOutraPonta((d) => {
    const o = d(pedidos).find((x) => x.id === id)
    if (!o || o.pagamento === "pago") return
    const em = agora()
    o.historico.push({ em: em.toISOString(), quem: { tipo: "cliente", nome: clientes.porId(o.clienteId)?.nome ?? "Cliente" }, texto: "Pagou com Pix", eixo: "pagamento", cliente: true })
    o.pagamento = "pago"
    // o título aberto no Financeiro é o mesmo pagamento (as duas pontas juntas)
    const l = d(lancamentos).find((x) => x.ref === id && (x.estado === "em_aberto" || x.estado === "aguardando_pix"))
    if (l) { l.estado = "pago"; l.meio = "pix"; l.pagoEm = em.toISOString(); l.historico.push({ em: em.toISOString(), quem: { tipo: "cliente", nome: clientes.porId(o.clienteId)?.nome ?? "Cliente" }, texto: "Pagou com Pix", cliente: true }) }
    if (o.etapa === "pronta") { o.etapa = "entregue"; o.garantiaAte = new Date(em.getTime() + EMPRESA.garantiaDias * DIA).toISOString() }
  }, [id, ...lancamentos.ler().filter((x) => x.ref === id).map((x) => x.id)])
}
