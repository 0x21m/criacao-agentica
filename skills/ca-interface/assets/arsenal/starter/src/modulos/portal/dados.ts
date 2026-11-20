// Portal do cliente (5.12) · a camada de dados do cliente: a sessão (a cliente da barra F; padrão Juliana, C-0007), a
// projeção que as telas leem
// (D5: nenhuma tela do portal lê o registro cru de pedidos, agenda, lançamentos ou conversas) e as ações do cliente.
// O portal não declara coleção: lê e grava as dos donos (pedidos, agendamentos, clientes, lançamentos do Financeiro,
// conversas e mensagens de Mensagens) e importa deles o que existe (codigoPix, idE2E, situacao, automaticasDa…).
// Os eventos que o cliente gera são assinados por ele ({ tipo: "cliente" }): as notificações da equipe e as mensagens
// automáticas de Mensagens nascem desses eventos (um lugar só de verdade, PON-18).
import { useMemo, useSyncExternalStore } from "react"
import { acao, mudarComoOutraPonta, proximoId, type Evento, type Rascunho, type Resultado } from "@/proto/dados"
import { agora, useAgora, DIA, MIN } from "@/proto/relogio"
import { EMPRESA, recursoPorId, servicoPorSlug } from "@/proto/negocio"
import {
  AGENDAMENTO, CONFLITO, ENTREGA, ETAPA_OS, LANCAMENTO, ETAPAS_TERMINAIS, ORCAMENTO, fraseOrcamentoMudou, paraOCliente,
  type Ctx, type EstadoAgendamento, type EtapaOS, type Projecao,
} from "@/proto/projecao"
import { clientes, type Cliente } from "@/modulos/clientes/dados"
import { pedidos, ctxDaOS, type Pedido } from "@/modulos/pedidos/dados"
import { agendamentos, type Agendamento } from "@/modulos/agenda/dados"
import { codigoPix, idE2E, lancamentos, pixExpirado, situacao, type Lancamento, type Meio } from "@/modulos/financeiro/dados"
import { automaticasDa, conversas, mensagens, notificacoes, type Conversa, type Mensagem } from "@/modulos/mensagens/dados"
import { gerarLinhaDigitavel } from "@/lib/boleto"
import { CLIENTE_PADRAO, clienteDaSessao, useClienteDaSessao } from "@/proto/cliente"

// ---------------------------------------------------------------------------------------------------------------
// Sessão do cliente
// ---------------------------------------------------------------------------------------------------------------
// A cliente da sessão vem da base (src/proto/cliente.ts): a barra F escolhe ("Ver como cliente…") ou ?cliente=C-0012;
// padrão, a Juliana Castro (C-0007), a persona dos roteiros. Nas telas, useCliente() (o registro) e useDadosDoCliente();
// fora do React (ações, simulações), clienteDaSessao(). O login do cliente (/conta/entrar/) fica para quando houver.
/** @deprecated A cliente padrão. Use clienteDaSessao() (fora do React) ou useCliente() (nas telas). */
export const CLIENTE_DA_SESSAO = CLIENTE_PADRAO
/** Como o portal chama a cliente: o primeiro nome (pessoa) ou o nome inteiro (empresa). */
export const comoChamar = (c: Pick<Cliente, "nome" | "tipo">) => (c.tipo === "pj" ? c.nome : c.nome.split(" ")[0])
/** O registro da cliente da sessão (no servidor e na hidratação, a padrão). */
export function useCliente(): Cliente {
  const id = useClienteDaSessao()
  const cls = clientes.use()
  return cls.find((c) => c.id === id) ?? cls.find((c) => c.id === CLIENTE_PADRAO) ?? cls[0]
}

// ---------------------------------------------------------------------------------------------------------------
// Frases do cliente que a projecao.ts ainda não tem
// ---------------------------------------------------------------------------------------------------------------
// BASE: item 11 da lista (projecao.ts): estados derivados do portal sem linha na projeção. Peça local até a base
// absorver; as telas leem só daqui, nunca escrevem a frase à mão.
const h = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—")
const d = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—")
export const FRASES = {
  /** PON-21: o objeto mudou desde a notificação. */
  jaAprovado: (c: Ctx) => `Este orçamento já foi aprovado em ${d(c.quando)} às ${h(c.quando)}.`,
  /** Conflito de versão na aprovação (5.12, ações). */
  orcamentoMudouAoLer: (versao: number) => `O orçamento mudou enquanto você lia. Veja a versão ${versao}.`,
  /** Link de outra conta (PON-20): nenhum dado do pedido. */
  outraConta: "Este pedido pertence a outra conta. Entre com a conta certa.",
  /** Rastreio da visita (momento-assinatura). */
  aCaminho: (c: Ctx) => `${c.tecnico} está a caminho · chega entre ${h(c.quando)} e ${h(c.ate)}`,
  /** Cancelar depois de iniciado (CLI-03). */
  servicoComecou: "O serviço já começou. Fale com a gente.",
  /** Excluir conta: estado intermediário honesto. */
  exclusaoPedida: "Pedido recebido. Excluímos em até 15 dias e avisamos por e-mail.",
  /** Pedido de horário enviado pela conversa. */
  pedidoDeHorario: "Pedido enviado. A Oficina responde por aqui em até 1 hora útil.",
  /** Avaliação registrada. */
  avaliado: (nota: number) => `Você avaliou com ${nota} de 5.`,
  /** Cartão aprovado (sem Pix). */
  pagoNoCartao: (c: Ctx) => `Pago no cartão em ${d(c.quando)}.`,
  /** Boleto gerado. */
  boletoGerado: (c: Ctx) => `Boleto gerado. Pague até ${d(c.ate)}; a confirmação leva até 3 dias úteis.`,
}
/** "O que significa cada etapa": a frase de cada etapa, como o cliente lê (da projeção). */
export const ETAPAS_DO_CLIENTE: { etapa: EtapaOS; titulo: string; texto: string }[] = [
  { etapa: "solicitada", titulo: "Pedido recebido", texto: "A Oficina confirma o horário da visita." },
  { etapa: "agendada", titulo: "Visita marcada", texto: "O técnico vai até você na janela combinada." },
  { etapa: "em_diagnostico", titulo: "Diagnóstico", texto: "O técnico avalia e prepara o orçamento." },
  { etapa: "aguardando_aprovacao", titulo: "Orçamento pronto", texto: "Você aprova ou recusa. Nada é feito antes disso." },
  { etapa: "aprovada", titulo: "Aprovado", texto: "O serviço fica marcado." },
  { etapa: "em_execucao", titulo: "Em andamento", texto: "O técnico está fazendo o serviço." },
  { etapa: "pronta", titulo: "Concluído", texto: "Você paga e o pedido fecha com a garantia." },
  { etapa: "entregue", titulo: "Fechado", texto: `Garantia de ${EMPRESA.garantiaDias} dias a partir da entrega.` },
]

// ---------------------------------------------------------------------------------------------------------------
// Projeção do cliente (D5)
// ---------------------------------------------------------------------------------------------------------------
export type Fase = "acao" | "andamento" | "concluido"
export type ItemCliente = { descricao: string; qtd: number; unitario: number; tipo: "peca" | "mao_de_obra" | "produto" }
export type VisitaCliente = { id: string; inicio: string; fim: string; local: "domicilio" | "loja"; onde: string; tecnico?: string; estado: EstadoAgendamento; p: Projecao; ctx: Ctx }
export type CobrancaCliente = {
  id: string; valor: number; descricao: string; ref?: string; vencimento: string
  p: Projecao; ctx: Ctx
  estado: Lancamento["estado"]; meio?: Meio; aberta: boolean; expirado: boolean
  pix?: { codigo: string; expira: string }; pagoEm?: string; comprovanteId?: string; linhaDigitavel?: string
  versao: number
}
export type PedidoCliente = {
  id: string; tipo: "os" | "venda"; titulo: string
  /** A frase que o cliente lê agora e a ação dela (da projeção). */
  p: Projecao; ctx: Ctx; frase?: string
  etapa?: EtapaOS; fase: Fase
  itens: ItemCliente[]; total: number
  orcamento?: { versao: number; estado: NonNullable<Pedido["orcamento"]>["estado"]; validoAte?: string; enviadoEm?: string; decididoEm?: string; canal?: string; mudou?: string }
  tecnico?: string; visitas: VisitaCliente[]; cobrancas: CobrancaCliente[]
  prazo?: string; garantiaAte?: string; criadoEm: string
  historico: Evento[]
  avaliacao?: number; podeCancelar: boolean; motivoSemCancelar?: string
  conversaId?: string; versao: number
}

/** Nome que o cliente vê de quem fez um passo: a equipe aparece como a Oficina, nunca pelo nome interno (CLI-41). */
const quemParaCliente = (e: Evento): Evento => (e.quem.tipo === "pessoa" ? { ...e, quem: { tipo: "pessoa", nome: EMPRESA.nome } } : e)
const ETAPAS_ATE_APROVADA: EtapaOS[] = ["solicitada", "agendada", "em_diagnostico", "aguardando_aprovacao", "aprovada"]
const primeiroNome = (id?: string) => recursoPorId(id)?.curto

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
/** U+2011, o hífen que não quebra a linha. */
const HIFEN_INTEIRO = String.fromCharCode(0x2011)
/**
 * Como o texto de um pedido aparece para o cliente: "12.000 BTUs" (a descrição do título vem em caixa baixa) e
 * "ar-condicionado" com o hífen que não quebra (U+2011): o título nunca quebra em "ar-" / "condicionado".
 */
export const textoCliente = (t: string) => t.replace(/(\d)\s*btus?\b/gi, "$1 BTUs").replace(/\b(ar)-(condicionado)/gi, `$1${HIFEN_INTEIRO}$2`)
function projetarCobranca(l: Lancamento, ref: Date): CobrancaCliente {
  const s = situacao(l, ref)
  const boleto = l.estado === "em_aberto" && l.meio === "boleto" && l.linhaDigitavel
  return {
    id: l.id, valor: l.valor, descricao: textoCliente(maiuscula(l.descricao.replace(/^[A-Z]+-\d+ · /, ""))), ref: l.ref, vencimento: l.vencimento,
    p: boleto ? { ...s.p, cliente: FRASES.boletoGerado } : l.estado === "pago" && l.meio !== "pix" ? { ...s.p, cliente: FRASES.pagoNoCartao } : s.p,
    ctx: boleto ? { ate: l.vencimento } : s.ctx,
    estado: l.estado, meio: l.meio, aberta: l.estado === "em_aberto" || l.estado === "aguardando_pix", expirado: pixExpirado(l, ref),
    pix: l.estado === "aguardando_pix" && l.pixCodigo && l.pixExpiraEm ? { codigo: l.pixCodigo, expira: l.pixExpiraEm } : undefined,
    pagoEm: l.pagoEm, comprovanteId: l.comprovanteId, linhaDigitavel: l.linhaDigitavel ?? undefined, versao: l.versao,
  }
}

/** Etapas em que a visita já passou: o serviço acabou (pronta, entregue) ou o pedido foi cancelado. */
const ETAPAS_SEM_VISITA: EtapaOS[] = ["pronta", "entregue", "cancelada"]
/** O estado da visita como o cliente lê: com o pedido concluído ou cancelado, a visita marcada não é mais futura. */
function estadoDaVisita(a: Agendamento, etapa?: EtapaOS): EstadoAgendamento {
  if (!etapa || !ETAPAS_SEM_VISITA.includes(etapa)) return a.estado
  if (a.estado !== "confirmado" && a.estado !== "em_atendimento" && a.estado !== "solicitado") return a.estado
  return etapa === "cancelada" ? "cancelado" : "concluido"
}

function projetarVisita(a: Agendamento, c?: Cliente, etapa?: EtapaOS): VisitaCliente {
  const estado = estadoDaVisita(a, etapa)
  const onde = a.local === "loja" ? "Loja Pampulha, Rua das Andorinhas, 410" : c ? `${c.endereco.logradouro}, ${c.endereco.numero}${c.endereco.complemento ? `, ${c.endereco.complemento}` : ""} · ${c.endereco.bairro}` : a.bairro
  return { id: a.id, inicio: a.inicio, fim: a.fim, local: a.local, onde, tecnico: a.recursoId === "bancada-pampulha" ? undefined : primeiroNome(a.recursoId), estado,
    p: AGENDAMENTO[estado], ctx: { quando: a.inicio, ate: a.fim } }
}

function projetarOS(raw: Pedido, ags: Agendamento[], lans: Lancamento[], cvs: Conversa[], cli: Cliente, ref: Date): PedidoCliente {
  const os = paraOCliente(raw) // sem custo, nota interna, responsável e histórico interno
  const ctx = ctxDaOS(raw, ags)
  const etapa = os.etapa
  // aguardando aprovação com orçamento vencido: a frase é a do orçamento expirado (classe A, dia seguinte ao validoAte)
  const expirou = etapa === "aguardando_aprovacao" && os.orcamento?.validoAte && new Date(os.orcamento.validoAte).getTime() + DIA < ref.getTime()
  const recusado = etapa === "cancelada" && os.orcamento?.estado === "recusado"
  const p = expirou ? ORCAMENTO.expirado : recusado ? ORCAMENTO.recusado : ETAPA_OS[etapa]
  const ctxCliente: Ctx = recusado ? { quando: os.orcamento?.decisao?.em } : expirou ? { ate: os.orcamento?.validoAte } : etapa === "entregue" ? { ...ctx, quando: os.historico.at(-1)?.em ?? os.prazo } : etapa === "cancelada" ? { ...ctx, quando: os.historico.at(-1)?.em } : ctx
  const visitas = ags.filter((a) => os.agendamentoIds.includes(a.id) || a.pedidoId === os.id).map((a) => projetarVisita(a, cli, etapa)).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const cobrancas = lans.filter((l) => l.ref === os.id && l.natureza === "receber" && l.estado !== "cancelado" && l.estado !== "previsto").map((l) => projetarCobranca(l, ref))
  if (etapa === "pronta" && raw.pagamento !== "pago" && !cobrancas.some((c) => c.aberta)) {
    // OS pronta sem título no Financeiro: a cobrança existe para o cliente (o título nasce quando ele escolhe o meio)
    const cx: Ctx = { valor: os.total, ate: os.prazo }
    cobrancas.push({ id: os.id, valor: os.total, descricao: textoCliente(os.titulo), ref: os.id, vencimento: os.prazo, p: LANCAMENTO.em_aberto, ctx: cx,
      estado: "em_aberto", aberta: true, expirado: false, versao: os.versao })
  }
  const fase: Fase = etapa === "entregue" || etapa === "cancelada" ? "concluido" : etapa === "aguardando_aprovacao" || etapa === "pronta" || cobrancas.some((c) => c.aberta) ? "acao" : "andamento"
  const avaliacao = os.historico.filter((e) => e.eixo === "avaliacao").at(-1)
  const iniciou = raw.historico.filter((e) => e.para === "em_execucao").at(-1)?.em ?? visitas.find((v) => v.estado === "em_atendimento")?.inicio
  const podeCancelar = ETAPAS_ATE_APROVADA.includes(etapa)
  const mudou = os.historico.filter((e) => e.eixo === "orcamento" && e.quem.tipo !== "cliente").at(-1)
  return {
    id: os.id, tipo: "os", titulo: textoCliente(os.titulo), p, ctx: ctxCliente, frase: p.cliente?.(ctxCliente), etapa, fase,
    itens: os.itens.map(({ descricao, qtd, unitario, tipo }) => ({ descricao: textoCliente(descricao), qtd, unitario, tipo })), total: os.total,
    orcamento: os.orcamento && {
      versao: os.orcamento.versao, estado: expirou ? "expirado" : os.orcamento.estado, validoAte: os.orcamento.validoAte, enviadoEm: os.orcamento.enviadoEm,
      decididoEm: os.orcamento.decisao?.em, canal: os.orcamento.decisao?.canal,
      mudou: mudou && os.orcamento.versao > 1 && os.orcamento.estado === "enviado" ? mudou.texto : undefined,
    },
    tecnico: primeiroNome(raw.responsavelId), visitas, cobrancas,
    prazo: os.prazo, garantiaAte: os.garantiaAte, criadoEm: os.criadoEm,
    historico: (os.historico as Evento[]).map(quemParaCliente),
    avaliacao: avaliacao ? Number(avaliacao.para) || undefined : undefined,
    podeCancelar, motivoSemCancelar: podeCancelar || ETAPAS_TERMINAIS.includes(etapa) ? undefined : CONFLITO.clienteCancelaComTecnicoIniciado({ quando: iniciou }),
    conversaId: cvs.find((c) => c.ref === os.id)?.id, versao: os.versao,
  }
}

// BASE: a coleção `pedidos` só tem OS; as vendas da loja (PED-) existem só como título no Financeiro. O portal mostra
// cada venda a partir da cobrança dela (descrição, valor e a frase do pagamento), até a venda virar registro.
function projetarVenda(l: Lancamento, ref: Date): PedidoCliente {
  const c = projetarCobranca(l, ref)
  const pago = l.estado === "pago"
  const p = pago ? ENTREGA.retirado : c.p
  const ctx = pago ? { quando: l.pagoEm } : c.ctx
  return {
    id: l.ref!, tipo: "venda", titulo: c.descricao.charAt(0).toUpperCase() + c.descricao.slice(1), p, ctx, frase: p.cliente?.(ctx),
    fase: pago ? "concluido" : "acao", itens: [{ descricao: c.descricao, qtd: 1, unitario: l.valor, tipo: "produto" }], total: l.valor,
    visitas: [], cobrancas: [c], criadoEm: l.historico[0]?.em ?? l.vencimento,
    historico: (paraOCliente(l).historico as Evento[]).map(quemParaCliente), podeCancelar: false, versao: l.versao,
  }
}

export type DadosDoCliente = {
  cliente: { id: string; nome: string; primeiroNome: string; email: string; telefone: string; whatsappConsentido: boolean; endereco: string; exclusaoPedidaEm?: string; versao: number }
  pedidos: PedidoCliente[]
  /** O que pede ação primeiro (CLI-10): orçamento, pagamento, depois o que está em andamento. */
  ativo?: PedidoCliente
  visitas: (VisitaCliente & { pedidoId?: string })[]
  /** Visita de hoje que começa na próxima hora: "Bruno está a caminho" (rastreio). */
  aCaminho?: VisitaCliente & { pedidoId?: string }
  cobrancas: CobrancaCliente[]
  conversas: { id: string; ref?: string; ultima?: { texto: string; em: string; daOficina: boolean }; novas: number }[]
}

/**
 * false no servidor e na hidratação, true depois de montar. O automaticasDa de Mensagens lê `agendamentos.ler()` (o
 * guardado no aparelho, não a semente): as mensagens automáticas da agenda só entram depois de montar, e a primeira
 * pintura bate com o HTML do servidor mesmo com os dados mudados (React #418).
 */
const semAssinatura = () => () => {}
export const useMontado = () => useSyncExternalStore(semAssinatura, () => true, () => false)
/** As automáticas de uma conversa; antes de montar, sem as da agenda (ver useMontado). */
const automaticasVisiveis = (cv: Conversa, ps: Pedido[], montado: boolean) =>
  automaticasDa(cv, ps).filter((m) => montado || !m.automatica?.ref?.startsWith("AG-"))

type Fontes = { ps: Pedido[]; ags: Agendamento[]; lans: Lancamento[]; cvs: Conversa[]; ms: Mensagem[]; cls: Cliente[] }
function montar(ref: Date, f: Fontes, idDaSessao: string, montado: boolean): DadosDoCliente {
  const c = f.cls.find((x) => x.id === idDaSessao) ?? f.cls.find((x) => x.id === CLIENTE_PADRAO)!
  const id = c.id
  const ags = f.ags.filter((a) => a.clienteId === id)
  const lans = f.lans.filter((l) => l.clienteId === id && l.natureza === "receber")
  const cvs = f.cvs.filter((cv) => cv.clienteId === id)
  const oss = f.ps.filter((p) => p.clienteId === id).map((p) => projetarOS(p, ags, lans, cvs, c, ref))
  const vendas = lans.filter((l) => l.ref?.startsWith("PED-") && l.estado !== "cancelado").map((l) => projetarVenda(l, ref))
  const ordem = (p: PedidoCliente) => (p.fase === "acao" ? 0 : p.fase === "andamento" ? 1 : 2)
  const lista = [...oss, ...vendas].sort((a, b) => ordem(a) - ordem(b) || b.criadoEm.localeCompare(a.criadoEm))
  const prioridade = (p: PedidoCliente) => (p.etapa === "aguardando_aprovacao" ? 0 : p.etapa === "pronta" ? 1 : p.cobrancas.some((x) => x.aberta) ? 2 : 3)
  const ativo = lista.filter((p) => p.fase !== "concluido").sort((a, b) => prioridade(a) - prioridade(b))[0]
  // a visita de um pedido concluído ou cancelado não é "próxima" (nem dispara o "a caminho"), mesmo que a agenda
  // ainda não a tenha fechado
  const semVisita = new Set(f.ps.filter((p) => p.clienteId === id && ETAPAS_SEM_VISITA.includes(p.etapa)).flatMap((p) => [p.id, ...p.agendamentoIds]))
  const visitas = ags.filter((a) => !semVisita.has(a.id) && !(a.pedidoId && semVisita.has(a.pedidoId)) && (a.estado === "confirmado" || a.estado === "solicitado" || a.estado === "em_atendimento") && new Date(a.fim) >= ref)
    .sort((a, b) => a.inicio.localeCompare(b.inicio)).map((a) => ({ ...projetarVisita(a, c), pedidoId: a.pedidoId }))
  const aCaminho = visitas.find((v) => v.estado === "confirmado" && v.tecnico && new Date(v.inicio).getTime() - ref.getTime() <= 60 * MIN && new Date(v.inicio) > ref)
  const conversasCliente = cvs.map((cv) => {
    const doCv = [...f.ms.filter((m) => m.conversaId === cv.id && m.estado !== "falhou" && m.estado !== "enviando"), ...automaticasVisiveis(cv, f.ps, montado)].sort((a, b) => a.em.localeCompare(b.em))
    const ultima = doCv.at(-1)
    return { id: cv.id, ref: cv.ref, ultima: ultima && { texto: ultima.texto, em: ultima.em, daOficina: ultima.direcao === "saida" },
      novas: f.ms.filter((m) => m.conversaId === cv.id && m.direcao === "saida" && (m.estado === "enviada" || m.estado === "entregue")).length }
  }).sort((a, b) => (b.ultima?.em ?? "").localeCompare(a.ultima?.em ?? ""))
  const exclusao = c.historico.filter((e) => e.eixo === "lgpd").at(-1)
  return {
    cliente: { id: c.id, nome: c.nome, primeiroNome: comoChamar(c), email: c.email, telefone: c.telefone, whatsappConsentido: c.whatsappConsentido,
      endereco: `${c.endereco.logradouro}, ${c.endereco.numero}${c.endereco.complemento ? `, ${c.endereco.complemento}` : ""}, ${c.endereco.bairro}, ${c.endereco.cidade}/${c.endereco.uf}, ${c.endereco.cep}`,
      exclusaoPedidaEm: exclusao?.em, versao: c.versao },
    pedidos: lista, ativo, visitas, aCaminho,
    cobrancas: [...lans.filter((l) => l.estado !== "cancelado" && l.estado !== "previsto").map((l) => projetarCobranca(l, ref)), ...oss.flatMap((o) => o.cobrancas.filter((x) => x.id.startsWith("OS-")))].sort((a, b) => Number(b.aberta) - Number(a.aberta) || b.vencimento.localeCompare(a.vencimento)),
    conversas: conversasCliente,
  }
}

/**
 * D5: o que o cliente da sessão pode ver, já projetado (sem custo, nota interna, responsável nem nome de quem fez
 * ajuste interno). No servidor e na hidratação, a semente; depois, ao vivo (outras abas, barra F).
 */
export function useDadosDoCliente(): DadosDoCliente {
  // as listas do use(): no servidor e na hidratação, a semente (o HTML bate); depois, as do navegador
  const ps = pedidos.use(), ags = agendamentos.use(), lans = lancamentos.use(), cvs = conversas.use(), ms = mensagens.use(), cls = clientes.use()
  const ref = useAgora()
  const minuto = Math.floor(ref.getTime() / MIN)
  const id = useClienteDaSessao()
  const montado = useMontado()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => montar(ref, { ps, ags, lans, cvs, ms, cls }, id, montado), [ps, ags, lans, cvs, ms, cls, minuto, id, montado])
}

/** Um pedido do cliente pelo id. "outra-conta" quando o id existe mas é de outro cliente: nenhum dado sai (PON-20). */
export function buscarPedido(dados: DadosDoCliente, id: string): { pedido: PedidoCliente } | { erro: "outra-conta" | "nao-existe" } {
  const p = dados.pedidos.find((x) => x.id === id)
  if (p) return { pedido: p }
  const existe = !!pedidos.porId(id) || lancamentos.ler().some((l) => l.ref === id)
  return { erro: existe ? "outra-conta" : "nao-existe" }
}
export function buscarCobranca(dados: DadosDoCliente, id: string): { cobranca: CobrancaCliente; pedido?: PedidoCliente } | { erro: "outra-conta" | "nao-existe" } {
  if (id.startsWith("OS-")) {
    // a OS pronta paga pelo próprio id: o título real nasce no primeiro meio escolhido e a tela continua nele
    const p = dados.pedidos.find((x) => x.id === id)
    const cc = p && (p.cobrancas.find((x) => x.aberta) ?? p.cobrancas.at(-1))
    if (cc) return { cobranca: cc, pedido: p }
  }
  const c = dados.cobrancas.find((x) => x.id === id)
  if (c) return { cobranca: c, pedido: dados.pedidos.find((p) => p.cobrancas.some((x) => x.id === id)) }
  return { erro: lancamentos.porId(id) || pedidos.porId(id) ? "outra-conta" : "nao-existe" }
}

// ---------------------------------------------------------------------------------------------------------------
// Ações do cliente (todas pela acao(); P = pessimista e confere a versão, O = otimista)
// ---------------------------------------------------------------------------------------------------------------
// BASE: a acao() confere `capacidade` contra o papel do operador da barra F; o cliente não é papel da MATRIZ (a coluna
// do cliente "vive no portal"). As ações do portal conferem a posse (clienteId da sessão) aqui dentro, antes da acao(),
// e por isso não usam o gerarPix do Financeiro (que exige "receber" do operador): usam o codigoPix dele.
const souEu = () => ({ tipo: "cliente" as const, nome: clientes.porId(clienteDaSessao())?.nome ?? "Cliente" })
const doCliente = (texto: string, extra: Partial<Evento> = {}): Evento => ({ em: agora().toISOString(), quem: souEu(), texto, cliente: true, ...extra })
const recusaPosse: Resultado = { ok: false, motivo: "permissao", mensagem: FRASES.outraConta }
const ordemNoFim = (lista: Pedido[], etapas: EtapaOS[]) => Math.max(0, ...lista.filter((o) => etapas.includes(o.etapa)).map((o) => o.ordem)) + 1

function minhaOS(id: string) {
  const os = pedidos.porId(id)
  return os && os.clienteId === clienteDaSessao() ? os : undefined
}
function meuTitulo(id: string) {
  const l = lancamentos.porId(id)
  return l && l.clienteId === clienteDaSessao() ? l : undefined
}
/**
 * O que se paga: um título do cliente (LAN-…) ou uma OS pronta ainda sem título (OS-…): o título nasce dentro da
 * mesma ação que gera o Pix, o boleto ou paga no cartão ("cliente gera o código", 3.5).
 */
// BASE: o Financeiro não abre título quando a OS fica pronta; a cobrança virtual da OS pronta sai da projeção aqui.
function alvo(id: string) {
  if (id.startsWith("OS-")) {
    const os = minhaOS(id)
    if (!os || os.etapa !== "pronta" || os.pagamento === "pago") return undefined
    return {
      id, nome: id, valor: os.total, ids: [id],
      conferir: (v: number) => ({ colecao: pedidos as never, id, versao: v }),
      titulo: (d: Rascunho) => {
        const o = d(pedidos).find((x) => x.id === id)!
        return d(lancamentos).find((l) => l.ref === id && (l.estado === "em_aberto" || l.estado === "aguardando_pix"))
          ?? novoTitulo(d, o, o.total, "em_aberto", new Date(agora().getTime() + EMPRESA.boletoDias * DIA).toISOString(), o.titulo.toLowerCase(), `Título aberto pelo cliente no portal (${id} pronta)`)
      },
    }
  }
  const l = meuTitulo(id)
  if (!l) return undefined
  return { id: l.id, nome: l.ref ?? l.id, valor: l.valor, ids: [l.id],
    conferir: (v: number) => ({ colecao: lancamentos as never, id: l.id, versao: v }),
    titulo: (d: Rascunho) => d(lancamentos).find((y) => y.id === l.id) }
}
/** Lançamento novo no Financeiro (o mesmo formato dos dele). */
function novoTitulo(d: Rascunho, os: Pedido, valor: number, estado: Lancamento["estado"], vencimento: string, descricao: string, texto: string): Lancamento {
  const lista = d(lancamentos)
  const novo: Lancamento = {
    id: proximoId(lista, "LAN", 5140), natureza: "receber", descricao: `${os.id} · ${descricao}`, categoria: "Serviços", valor, vencimento, unidade: os.unidade,
    estado, ref: os.id, clienteId: os.clienteId, versao: 1, historico: [{ em: agora().toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto }],
  }
  lista.push(novo)
  return novo
}

/** Aprovar o orçamento (P, confere a versão): OS aprovada, lançamento previsto; a equipe recebe pela notificação. */
export function aprovarOrcamento(id: string, versaoLida: number): Promise<Resultado> {
  const os = minhaOS(id)
  if (!os) return Promise.resolve(recusaPosse)
  return acao({
    rotulo: `aprovar o orçamento da ${id}`, modo: "pessimista", ids: [id],
    conferir: { colecao: pedidos as never, id, versao: versaoLida },
    conflito: (atual) => FRASES.orcamentoMudouAoLer((atual as Pedido).orcamento?.versao ?? 1),
    aplicar: (d) => {
      const lista = d(pedidos)
      const o = lista.find((x) => x.id === id)
      if (!o || o.etapa !== "aguardando_aprovacao") return
      const em = agora().toISOString()
      o.historico.push(doCliente("Aprovou o orçamento pelo portal", { de: o.etapa, para: "aprovada", eixo: "etapa" }))
      o.etapa = "aprovada"; o.ordem = ordemNoFim(lista, ["aprovada", "em_execucao"])
      o.orcamento = { ...(o.orcamento ?? { versao: 1 }), estado: "aprovado", decisao: { em, canal: "portal", por: souEu().nome } }
      novoTitulo(d, o, o.total, "previsto", o.prazo, o.titulo.toLowerCase(), `Previsto pela aprovação do orçamento da ${o.id}`)
    },
  })
}

/** Recusar o orçamento (P): OS cancelada com "orçamento recusado"; só a visita de diagnóstico é cobrada. */
export function recusarOrcamento(id: string, versaoLida: number, motivo: string): Promise<Resultado> {
  const os = minhaOS(id)
  if (!os) return Promise.resolve(recusaPosse)
  return acao({
    rotulo: `recusar o orçamento da ${id}`, modo: "pessimista", ids: [id],
    conferir: { colecao: pedidos as never, id, versao: versaoLida },
    conflito: (atual) => FRASES.orcamentoMudouAoLer((atual as Pedido).orcamento?.versao ?? 1),
    aplicar: (d) => {
      const o = d(pedidos).find((x) => x.id === id)
      if (!o || o.etapa !== "aguardando_aprovacao") return
      const em = agora().toISOString()
      o.historico.push(doCliente(motivo ? `Recusou o orçamento: ${motivo}` : "Recusou o orçamento", { de: o.etapa, para: "cancelada", eixo: "etapa" }))
      o.etapa = "cancelada"; o.canceladoMotivo = "orçamento recusado"
      o.orcamento = { ...(o.orcamento ?? { versao: 1 }), estado: "recusado", decisao: { em, canal: "portal", por: souEu().nome, motivo: motivo || undefined } }
      novoTitulo(d, o, EMPRESA.taxaVisita, "em_aberto", new Date(agora().getTime() + EMPRESA.boletoDias * DIA).toISOString(), "visita de diagnóstico", `Taxa de visita: orçamento da ${o.id} recusado`)
    },
  })
}

/** Cancelar o pedido (P): só até "aprovada" (CLI-03); a visita marcada é cancelada junto. Nada é cobrado. */
export function cancelarPedido(id: string, versaoLida: number): Promise<Resultado> {
  const os = minhaOS(id)
  if (!os) return Promise.resolve(recusaPosse)
  return acao({
    rotulo: `cancelar a ${id}`, modo: "pessimista", ids: [id, ...os.agendamentoIds],
    conferir: { colecao: pedidos as never, id, versao: versaoLida },
    conflito: (atual) => {
      const a = atual as Pedido
      return ETAPAS_ATE_APROVADA.includes(a.etapa) ? FRASES.orcamentoMudouAoLer(a.orcamento?.versao ?? 1) : CONFLITO.clienteCancelaComTecnicoIniciado({ quando: a.historico.at(-1)?.em })
    },
    aplicar: (d) => {
      const o = d(pedidos).find((x) => x.id === id)
      if (!o || !ETAPAS_ATE_APROVADA.includes(o.etapa)) return
      o.historico.push(doCliente("Cancelou o pedido pelo portal", { de: o.etapa, para: "cancelada", eixo: "etapa" }))
      o.etapa = "cancelada"; o.canceladoMotivo = "cancelado pelo cliente"
      for (const a of d(agendamentos)) {
        if (!o.agendamentoIds.includes(a.id) || a.estado === "concluido" || a.estado === "cancelado") continue
        a.estado = "cancelado"; a.historico.push(doCliente("Horário cancelado pelo cliente"))
      }
    },
  })
}

/** Gerar o código Pix (P): vale 30 min. Serve também para "Gerar novo código" depois de expirar. */
export function gerarPixDoCliente(lanId: string, versaoLida: number): Promise<Resultado> {
  const l = alvo(lanId)
  if (!l) return Promise.resolve(recusaPosse)
  const expira = new Date(agora().getTime() + EMPRESA.pixMinutos * MIN).toISOString()
  return acao({
    rotulo: `gerar o Pix de ${l.nome}`, modo: "pessimista", ids: l.ids,
    conferir: l.conferir(versaoLida),
    aplicar: (d) => {
      const x = l.titulo(d)
      if (!x || x.estado === "pago") return
      const novo = x.estado === "aguardando_pix"
      x.estado = "aguardando_pix"; x.meio = "pix"; x.pixExpiraEm = expira; x.pixCodigo = codigoPix(x.id, x.valor, expira)
      x.historico.push(doCliente(`${novo ? "Gerou um novo código Pix" : "Gerou o código Pix"} no portal (expira às ${h(expira)})`))
    },
  })
}

/** Pagar no cartão (P): o provedor de pagamento aprova (simulado); parcelas sem juros. */
export function pagarNoCartao(lanId: string, versaoLida: number, parcelas: number): Promise<Resultado> {
  const l = alvo(lanId)
  if (!l) return Promise.resolve(recusaPosse)
  return acao({
    rotulo: `pagar ${l.nome} no cartão`, modo: "pessimista", ids: l.ids,
    conferir: l.conferir(versaoLida),
    aplicar: (d) => {
      const x = l.titulo(d)
      if (!x || x.estado === "pago") return
      const quando = agora().toISOString()
      x.estado = "pago"; x.meio = "cartao_credito"; x.pagoEm = quando; x.pixCodigo = undefined; x.pixExpiraEm = undefined
      x.historico.push(doCliente(`Pagou no cartão de crédito${parcelas > 1 ? ` em ${parcelas}x` : ""}`))
      pagarOrigem(d, x, quando)
    },
  })
}

/** Gerar boleto (P): vence em 3 dias; a linha digitável sai do número do título (determinística). */
export function gerarBoleto(lanId: string, versaoLida: number): Promise<Resultado> {
  const l = alvo(lanId)
  if (!l) return Promise.resolve(recusaPosse)
  const vence = new Date(agora().getTime() + EMPRESA.boletoDias * DIA)
  let s = Number(l.id.replace(/\D/g, "")) || 7
  const sorteio = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const linha = gerarLinhaDigitavel({ valor: l.valor, vencimento: vence, sorteio })
  return acao({
    rotulo: `gerar o boleto de ${l.nome}`, modo: "pessimista", ids: l.ids,
    conferir: l.conferir(versaoLida),
    aplicar: (d) => {
      const x = l.titulo(d)
      if (!x || x.estado === "pago") return
      x.estado = "em_aberto"; x.meio = "boleto"; x.linhaDigitavel = linha; x.vencimento = vence.toISOString(); x.pixCodigo = undefined; x.pixExpiraEm = undefined
      x.historico.push(doCliente("Gerou o boleto no portal"))
    },
  })
}

/** O pagamento vale para a OS de origem; OS pronta e paga fecha sozinha (classe A) com a garantia. */
function pagarOrigem(d: Rascunho, l: Lancamento, quando: string) {
  if (!l.ref?.startsWith("OS-")) return
  const o = d(pedidos).find((p) => p.id === l.ref)
  if (!o || o.pagamento === "pago") return
  o.pagamento = "pago"
  o.historico.push({ em: quando, quem: souEu(), texto: `Pagamento recebido (${l.id})`, eixo: "pagamento", cliente: true })
  if (o.etapa === "pronta") {
    o.historico.push({ em: quando, quem: { tipo: "sistema", nome: "Sistema" }, texto: "Pedido concluído: pago e entregue", de: "pronta", para: "entregue", eixo: "etapa", cliente: true })
    o.etapa = "entregue"; o.garantiaAte = new Date(new Date(quando).getTime() + EMPRESA.garantiaDias * DIA).toISOString()
  }
}

/** O banco confirma o Pix aberto do cliente (simulação da outra ponta, D10): a tela muda sozinha. */
export function bancoConfirmaPix(lanId?: string) {
  const ref = agora()
  const alvo = lancamentos.ler().filter((l) => l.clienteId === clienteDaSessao() && l.estado === "aguardando_pix" && !pixExpirado(l, ref) && (!lanId || l.id === lanId))
  if (!alvo.length) return false
  mudarComoOutraPonta((d) => {
    for (const a of alvo) {
      const x = d(lancamentos).find((y) => y.id === a.id)
      if (!x) continue
      const quando = agora().toISOString()
      x.estado = "pago"; x.pagoEm = quando; x.comprovanteId = idE2E(x.id, quando)
      x.historico.push({ em: quando, quem: souEu(), texto: "Pagou com Pix", cliente: true }, { em: quando, quem: { tipo: "sistema", nome: "Sistema" }, texto: "Pix confirmado pelo banco" })
      pagarOrigem(d, x, quando)
    }
  }, alvo.flatMap((a) => [a.id, ...(a.ref?.startsWith("OS-") ? [a.ref] : [])]))
  return true
}

/** A conversa do pedido (ou a geral, sem pedido); cria uma no canal do portal se ainda não houver. */
function conversaPara(d: Rascunho, ref?: string): Conversa {
  const lista = d(conversas)
  const achada = lista.filter((c) => c.clienteId === clienteDaSessao() && (ref ? c.ref === ref : !c.ref)).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0]
  if (achada) return achada
  const nova: Conversa = { id: proximoId(lista, "CV", 40), clienteId: clienteDaSessao(), canal: "portal", ref, estado: "aberta", naoLidas: 0,
    criadaEm: agora().toISOString(), versao: 1, historico: [doCliente("Conversa aberta pelo portal")] }
  lista.push(nova)
  return nova
}

/** Mandar mensagem à Oficina (P): entra na conversa do pedido como mensagem recebida, e a equipe é notificada. */
export function enviarMensagemDoCliente(texto: string, ref?: string): Promise<Resultado> {
  if (ref && !minhaOS(ref) && !lancamentos.ler().some((l) => l.ref === ref && l.clienteId === clienteDaSessao())) return Promise.resolve(recusaPosse)
  const existente = conversas.ler().find((c) => c.clienteId === clienteDaSessao() && (ref ? c.ref === ref : !c.ref))
  return acao({
    rotulo: "enviar a mensagem", modo: "pessimista", ids: existente ? [existente.id] : [],
    aplicar: (d) => {
      const cv = conversaPara(d, ref)
      const em = agora().toISOString()
      const ms = d(mensagens)
      // o cliente leu o que a Oficina mandou antes de responder
      for (const m of ms) if (m.conversaId === cv.id && m.direcao === "saida" && (m.estado === "enviada" || m.estado === "entregue")) m.estado = "lida"
      ms.push({ id: proximoId(ms, "M", 4000), conversaId: cv.id, direcao: "entrada", autor: souEu().nome, texto: texto.trim(), em, estado: "recebida", canal: "portal" })
      cv.naoLidas += 1; cv.estado = "aberta"
      const ns = d(notificacoes)
      const n = Math.max(25, ...ns.map((y) => Number(y.id.slice(3)) || 0)) + 1
      ns.push({ id: `NT-${String(n).padStart(3, "0")}`, para: cv.atribuidaA ?? "gestora", tipo: "mensagem", titulo: `${souEu().nome} escreveu pelo portal`,
        texto: `“${texto.trim().slice(0, 80)}” · ${cv.id}`, ref: cv.id, link: `mensagens/?conversa=${cv.id}`, em, lida: false })
    },
  })
}

/** Abrir a conversa marca como lidas as mensagens da Oficina (O, silenciosa: já aparece na tela). */
export function lerConversa(conversaId: string) {
  const pendentes = mensagens.ler().filter((m) => m.conversaId === conversaId && m.direcao === "saida" && (m.estado === "enviada" || m.estado === "entregue"))
  const cv = conversas.porId(conversaId)
  if (!pendentes.length || cv?.clienteId !== clienteDaSessao()) return
  void acao({
    rotulo: "marcar a conversa como lida",
    aplicar: (d) => { for (const m of d(mensagens)) if (m.conversaId === conversaId && m.direcao === "saida" && (m.estado === "enviada" || m.estado === "entregue")) m.estado = "lida" },
  })
}

/** As mensagens que o cliente vê numa conversa: as trocadas (sem as que falharam do lado da Oficina) e as automáticas. */
export function useConversaDoCliente(conversaId?: string) {
  const ms = mensagens.use()
  const ps = pedidos.use()
  const cvs = conversas.use()
  const id = useClienteDaSessao()
  const montado = useMontado()
  return useMemo(() => {
    const cv = cvs.find((c) => c.id === conversaId && c.clienteId === id)
    if (!cv) return undefined
    const linhas: (Pick<Mensagem, "id" | "direcao" | "texto" | "em" | "estado"> & { autor: string; automatica?: boolean })[] = [
      ...ms.filter((m) => m.conversaId === cv.id && m.estado !== "falhou" && m.estado !== "enviando")
        .map((m) => ({ id: m.id, direcao: m.direcao, texto: m.texto, em: m.em, estado: m.estado, autor: m.direcao === "entrada" ? "Você" : `${m.autor.split(" ")[0]} · ${EMPRESA.nome}` })),
      ...automaticasVisiveis(cv, ps, montado).map((m) => ({ id: m.id, direcao: m.direcao, texto: m.texto, em: m.em, estado: m.estado, autor: EMPRESA.nome, automatica: true })),
    ].sort((a, b) => a.em.localeCompare(b.em))
    return { id: cv.id, ref: cv.ref, linhas }
  }, [ms, ps, cvs, conversaId, id, montado])
}

/** Avaliar depois de entregue (O): nota de 1 a 5 e comentário, no histórico do pedido. */
export function avaliar(id: string, nota: number, comentario: string) {
  const os = minhaOS(id)
  if (!os || os.etapa !== "entregue") return Promise.resolve(recusaPosse)
  return acao({
    rotulo: `avaliar a ${id}`, ids: [id],
    aplicar: (d) => {
      const o = d(pedidos).find((x) => x.id === id)
      o?.historico.push(doCliente(`Avaliou com ${nota} de 5${comentario.trim() ? `: “${comentario.trim()}”` : ""}`, { eixo: "avaliacao", para: String(nota) }))
    },
  })
}

/** WhatsApp sim ou não (P: muda como a Oficina fala com a pessoa). */
export function mudarConsentimentoWhatsapp(sim: boolean, versaoLida: number) {
  return acao({
    rotulo: "mudar o consentimento de WhatsApp", modo: "pessimista", ids: [clienteDaSessao()],
    conferir: { colecao: clientes as never, id: clienteDaSessao(), versao: versaoLida },
    aplicar: (d) => {
      const c = d(clientes).find((x) => x.id === clienteDaSessao())
      if (!c) return
      c.whatsappConsentido = sim
      c.historico.push(doCliente(sim ? "Aceitou receber avisos por WhatsApp" : "Deixou de receber avisos por WhatsApp", { eixo: "consentimento" }))
    },
  })
}

/** Excluir a conta (P, com confirmação): cria o pedido de anonimização; a equipe conclui em até 15 dias. */
export function pedirExclusao(versaoLida: number) {
  return acao({
    rotulo: "pedir a exclusão da conta", modo: "pessimista", ids: [clienteDaSessao()],
    conferir: { colecao: clientes as never, id: clienteDaSessao(), versao: versaoLida },
    aplicar: (d) => {
      const c = d(clientes).find((x) => x.id === clienteDaSessao())
      c?.historico.push(doCliente("Pediu a exclusão da conta e dos dados (LGPD)", { eixo: "lgpd" }))
    },
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Simulações da outra ponta (barra F, D10)
// ---------------------------------------------------------------------------------------------------------------
/** O técnico conclui a OS-1052 (passo 13 da jornada): pronta, com a cobrança em aberto para o portal pagar. */
export function tecnicoConclui(id = "OS-1052") {
  const os = pedidos.porId(id)
  if (!os || ETAPAS_TERMINAIS.includes(os.etapa) || os.etapa === "pronta") return false
  mudarComoOutraPonta((d) => {
    const lista = d(pedidos)
    const o = lista.find((x) => x.id === id)!
    const tecnico = recursoPorId(o.responsavelId)?.nome ?? "Técnico"
    const em = agora().toISOString()
    if (o.etapa === "aguardando_aprovacao") {
      o.orcamento = { ...(o.orcamento ?? { versao: 1 }), estado: "aprovado", decisao: { em, canal: "whatsapp", por: souEu().nome } }
    }
    o.historico.push({ em, quem: { tipo: "pessoa", nome: tecnico }, texto: "Serviço concluído", de: o.etapa, para: "pronta", eixo: "etapa", cliente: true })
    o.etapa = "pronta"; o.ordem = ordemNoFim(lista, ["pronta"])
    o.checklist = o.checklist?.map((c) => ({ ...c, feito: true }))
    const lans = d(lancamentos)
    const previsto = lans.find((l) => l.ref === id && l.estado === "previsto")
    if (previsto) { previsto.estado = "em_aberto"; previsto.vencimento = new Date(agora().getTime() + EMPRESA.boletoDias * DIA).toISOString(); previsto.historico.push({ em, quem: { tipo: "sistema", nome: "Sistema" }, texto: `Título aberto: ${o.id} pronta` }) }
    else if (!lans.some((l) => l.ref === id && (l.estado === "em_aberto" || l.estado === "aguardando_pix"))) novoTitulo(d, o, o.total, "em_aberto", new Date(agora().getTime() + EMPRESA.boletoDias * DIA).toISOString(), o.titulo.toLowerCase(), `Título criado quando a ${o.id} ficou pronta`)
  }, [id])
  return true
}

/** A Oficina responde na conversa mais recente do cliente (Ana, pelo painel). */
const RESPOSTAS = ["Oi, {nome}! Inclui sim: o suporte entra na mão de obra.", "Combinado. Deixamos marcado e avisamos na véspera.", "Recebemos seu pedido. Já vou ver o horário com o técnico."]
let respostas = 0
export function oficinaResponde() {
  const cv = conversas.ler().filter((c) => c.clienteId === clienteDaSessao()).sort((a, b) => {
    const ultima = (id: string) => mensagens.ler().filter((m) => m.conversaId === id).reduce((x, m) => (m.em > x ? m.em : x), "")
    return ultima(b.id).localeCompare(ultima(a.id))
  })[0]
  if (!cv) return
  mudarComoOutraPonta((d) => {
    const ms = d(mensagens)
    ms.push({ id: proximoId(ms, "M", 4000), conversaId: cv.id, direcao: "saida", autor: "Ana Lima", texto: RESPOSTAS[respostas++ % RESPOSTAS.length].replace("{nome}", (() => { const c = clientes.porId(clienteDaSessao()); return c ? comoChamar(c) : "tudo bem" })()), em: agora().toISOString(), estado: "entregue" })
    const x = d(conversas).find((y) => y.id === cv.id)
    if (x) { x.naoLidas = 0; x.estado = "aguardando_cliente" }
  }, [cv.id])
}

/** A Oficina manda a versão 2 do orçamento da OS-1052 (+R$ 210,00): o portal mostra o que mudou (CLI-14). */
export function oficinaMudaOrcamento(id = "OS-1052") {
  const os = pedidos.porId(id)
  if (!os || os.etapa !== "aguardando_aprovacao") return false
  mudarComoOutraPonta((d) => {
    const o = d(pedidos).find((x) => x.id === id)!
    const extra = 210
    const versao = (o.orcamento?.versao ?? 1) + 1
    o.itens.push({ descricao: "Suporte de parede para a condensadora", qtd: 1, unitario: extra, tipo: "peca" })
    o.total += extra
    o.orcamento = { ...(o.orcamento ?? { estado: "enviado" }), versao, estado: "enviado", enviadoEm: agora().toISOString(),
      validoAte: new Date(agora().getTime() + EMPRESA.validadeOrcamentoDias * DIA).toISOString() }
    o.historico.push({ em: agora().toISOString(), quem: { tipo: "pessoa", nome: "Ana Lima" }, texto: fraseOrcamentoMudou(extra), eixo: "orcamento", de: `v${versao - 1}`, para: `v${versao}`, cliente: true })
  }, [id])
  return true
}

/** Serviço do catálogo pelo slug (o pedido de horário pela conversa). */
export const servicoDoSite = (slug?: string | null) => servicoPorSlug(slug ?? undefined)
