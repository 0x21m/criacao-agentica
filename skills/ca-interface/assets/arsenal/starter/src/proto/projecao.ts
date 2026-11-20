// Projeção (D5, D6): os rótulos que o operador vê e as frases que o cliente lê, por estado, de cada objeto da
// especificação (seção 3). Fonte única: nenhuma tela escreve string de status à mão; SeloEixo e FraseDoCliente
// (src/components/base/selos.tsx) leem daqui. Também mora aqui o que o portal pode ver de um registro.
// Arquivo compartilhado. Os estados e as frases já estão decididos pela especificação: os módulos só leem.
import { EMPRESA } from "./negocio"

export type Tom = "info" | "neutro" | "aviso" | "sucesso" | "perigo"
/** Contexto das frases: tudo opcional; cada estado usa o que precisa. Datas em ISO. */
export type Ctx = {
  id?: string; quando?: string; ate?: string; valor?: number; quem?: string; tecnico?: string; canal?: string
  versao?: number; motivo?: string; previsao?: string; unidade?: string; desde?: string; dias?: number
}
export type Projecao = {
  /** Rótulo curto do selo do operador. */ rotulo: string
  tom: Tom
  /** Complemento do selo ("v1 · vence 26/11"). */ detalhe?: (c: Ctx) => string | undefined
  /** O que o cliente lê (portal, e-mail, WhatsApp). Ausente = o cliente não vê este estado. */ cliente?: (c: Ctx) => string
  /** Ação oferecida ao cliente junto da frase. */ acaoCliente?: string
}

// ---------- formatos curtos (as frases não dependem do lib/formato para o servidor e o cliente baterem) ----------
const d = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—")
const dAno = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—")
const ds = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "") : "—")
const h = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—")
const r$ = (v?: number) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const formatosDaProjecao = { d, dAno, ds, h, r$ }

// ---------- 3.1 OS: eixo etapa ----------
export type EtapaOS = "solicitada" | "agendada" | "em_diagnostico" | "aguardando_aprovacao" | "aprovada" | "em_execucao" | "aguardando_peca" | "pronta" | "entregue" | "cancelada"
export const ETAPAS_OS: EtapaOS[] = ["solicitada", "agendada", "em_diagnostico", "aguardando_aprovacao", "aprovada", "em_execucao", "aguardando_peca", "pronta", "entregue", "cancelada"]
export const ETAPAS_TERMINAIS: EtapaOS[] = ["entregue", "cancelada"]
export const ETAPA_OS: Record<EtapaOS, Projecao> = {
  solicitada: { rotulo: "Nova", tom: "info", detalhe: () => "sem horário", cliente: () => "Recebemos seu pedido. Confirmamos o horário até hoje, 17:00.", acaoCliente: "Ver pedido" },
  agendada: { rotulo: "Agendada", tom: "info", detalhe: (c) => [c.quando && `${ds(c.quando)} ${h(c.quando)}`, c.tecnico].filter(Boolean).join(" · ") || undefined,
    cliente: (c) => `Visita marcada: ${ds(c.quando)}, entre ${h(c.quando)} e ${h(c.ate)}.`, acaoCliente: "Remarcar" },
  em_diagnostico: { rotulo: "Em diagnóstico", tom: "neutro", cliente: (c) => `O técnico está avaliando. O orçamento chega até ${ds(c.previsao)}.` },
  aguardando_aprovacao: { rotulo: "Aguardando cliente", tom: "aviso", detalhe: (c) => `v${c.versao ?? 1} · vence ${d(c.ate)}`,
    cliente: (c) => `Orçamento pronto: ${r$(c.valor)}. Válido até ${d(c.ate)}.`, acaoCliente: "Aprovar · Recusar" },
  aprovada: { rotulo: "Aprovada", tom: "sucesso", detalhe: (c) => (c.canal ? `${c.canal}, ${d(c.quando)} ${h(c.quando)}` : undefined),
    cliente: (c) => `Orçamento aprovado. Serviço marcado para ${ds(c.previsao)}.` },
  em_execucao: { rotulo: "Em execução", tom: "info", detalhe: (c) => c.tecnico, cliente: () => "Serviço em andamento." },
  aguardando_peca: { rotulo: "Aguardando peça", tom: "aviso", detalhe: (c) => (c.previsao ? `chega ${d(c.previsao)}` : undefined),
    cliente: (c) => `Aguardando uma peça. Nova previsão: ${ds(c.previsao)}.` },
  pronta: { rotulo: "Pronta", tom: "sucesso", detalhe: (c) => `a cobrar ${r$(c.valor)}`, cliente: (c) => `Serviço concluído. Pague ${r$(c.valor)} para finalizar.`, acaoCliente: "Pagar com Pix" },
  entregue: { rotulo: "Fechada", tom: "neutro", detalhe: (c) => (c.ate ? `garantia até ${dAno(c.ate)}` : undefined),
    cliente: (c) => `Concluído em ${d(c.quando)}. Garantia até ${dAno(c.ate)}.`, acaoCliente: "Comprovante · Avaliar" },
  cancelada: { rotulo: "Cancelada", tom: "neutro", detalhe: (c) => c.motivo,
    cliente: (c) => `Pedido cancelado em ${d(c.quando)}. ${c.valor ? `Reembolso de ${r$(c.valor)} até ${d(c.ate)}.` : "Nada foi cobrado."}` },
}
/** Selo derivado de atraso (prazo vencido numa etapa não terminal). */
export const ATRASADA: Projecao = { rotulo: "Atrasada", tom: "perigo", detalhe: (c) => (c.dias ? `há ${c.dias} ${c.dias === 1 ? "dia" : "dias"}` : undefined) }

// ---------- eixo orçamento ----------
export type EstadoOrcamento = "rascunho" | "enviado" | "aprovado" | "recusado" | "expirado"
export const ORCAMENTO: Record<EstadoOrcamento, Projecao> = {
  rascunho: { rotulo: "Orçamento em rascunho", tom: "neutro" },
  enviado: { rotulo: "Orçamento enviado", tom: "aviso", detalhe: (c) => `v${c.versao ?? 1} · vence ${d(c.ate)}` },
  aprovado: { rotulo: "Orçamento aprovado", tom: "sucesso", detalhe: (c) => (c.canal ? `${c.canal}, ${d(c.quando)}` : undefined) },
  recusado: { rotulo: "Orçamento recusado", tom: "neutro",
    cliente: (c) => `Você recusou o orçamento em ${d(c.quando)}. Só a visita de diagnóstico (${r$(EMPRESA.taxaVisita)}) será cobrada, como combinado.` },
  expirado: { rotulo: "Orçamento expirado", tom: "neutro", cliente: (c) => `Orçamento expirado em ${d(c.ate)}. Peça uma nova versão.`, acaoCliente: "Pedir nova versão" },
}
export const fraseOrcamentoMudou = (diferenca: number) => `O orçamento mudou: ${diferenca >= 0 ? "+" : "−"}${r$(Math.abs(diferenca))}. Aprove a nova versão.`

// ---------- eixo pagamento ----------
export type EstadoPagamento = "pendente" | "aguardando_pix" | "aguardando_boleto" | "sinal_pago" | "pago" | "estornado" | "isento"
export const PAGAMENTO: Record<EstadoPagamento, Projecao> = {
  pendente: { rotulo: "Pendente", tom: "neutro" },
  aguardando_pix: { rotulo: "Aguardando Pix", tom: "aviso", detalhe: (c) => `expira ${h(c.ate)}`, cliente: (c) => `Pague com Pix até ${h(c.ate)} para confirmar.`, acaoCliente: "Pix Copia e Cola" },
  aguardando_boleto: { rotulo: "Aguardando boleto", tom: "aviso", detalhe: (c) => `vence ${d(c.ate)}`, cliente: (c) => `Pague o boleto até ${d(c.ate)}.` },
  sinal_pago: { rotulo: "Sinal pago", tom: "info", detalhe: (c) => r$(c.valor) },
  pago: { rotulo: "Pago", tom: "sucesso", detalhe: (c) => (c.quando ? `${d(c.quando)} ${h(c.quando)}${c.canal ? ` · ${c.canal}` : ""}` : undefined), cliente: (c) => `Pago em ${d(c.quando)}.`, acaoCliente: "Comprovante" },
  estornado: { rotulo: "Estornado", tom: "neutro", cliente: (c) => `Reembolso de ${r$(c.valor)} enviado em ${d(c.quando)}.` },
  isento: { rotulo: "Isento", tom: "neutro" },
}
export const PIX_EXPIRADO: Projecao = { rotulo: "Pix expirado", tom: "perigo", cliente: () => "O código Pix expirou. Gere um novo ou pague com cartão.", acaoCliente: "Gerar novo código" }

// ---------- eixo entrega (venda) ----------
export type EstadoEntrega = "separando" | "pronto_retirada" | "em_rota" | "retirado" | "entregue"
export const ENTREGA: Record<EstadoEntrega, Projecao> = {
  separando: { rotulo: "Separando", tom: "info", cliente: () => "Pagamento confirmado. Separando seu pedido." },
  pronto_retirada: { rotulo: "Pronto para retirada", tom: "sucesso", detalhe: (c) => c.unidade,
    cliente: (c) => `Pronto para retirar na loja ${c.unidade ?? "Pampulha"} até ${ds(c.ate)}, das 8:00 às 18:00. Leve o número ${c.id}.` },
  em_rota: { rotulo: "Em rota", tom: "info", detalhe: (c) => c.quem, cliente: (c) => `A caminho. Chega hoje até ${h(c.ate)}.` },
  retirado: { rotulo: "Concluído", tom: "neutro", cliente: (c) => `Entregue em ${d(c.quando)}.`, acaoCliente: "Comprovante" },
  entregue: { rotulo: "Concluído", tom: "neutro", cliente: (c) => `Entregue em ${d(c.quando)}.`, acaoCliente: "Comprovante" },
}

// ---------- 3.2 agendamento ----------
export type EstadoAgendamento = "reservado" | "solicitado" | "confirmado" | "em_atendimento" | "concluido" | "faltou" | "cancelado" | "expirado"
export const AGENDAMENTO: Record<EstadoAgendamento, Projecao> = {
  reservado: { rotulo: "Reservado no site", tom: "neutro", detalhe: (c) => `até ${h(c.ate)}`, cliente: (c) => `Horário guardado para você até ${h(c.ate)}.` },
  solicitado: { rotulo: "Pedido pelo site", tom: "aviso", detalhe: () => "confirmar", cliente: () => "Pedido de horário recebido. Confirmamos até hoje, 17:00." },
  confirmado: { rotulo: "Confirmado", tom: "info", cliente: (c) => `Visita confirmada: ${ds(c.quando)}, ${h(c.quando)} a ${h(c.ate)}.`, acaoCliente: "Remarcar · Cancelar" },
  em_atendimento: { rotulo: "Em atendimento", tom: "info", cliente: () => "O técnico chegou." },
  concluido: { rotulo: "Concluído", tom: "sucesso", cliente: () => "Visita concluída." },
  faltou: { rotulo: "Cliente ausente", tom: "perigo", cliente: (c) => `Não encontramos ninguém às ${h(c.quando)}. Reagende sem custo.`, acaoCliente: "Reagendar" },
  cancelado: { rotulo: "Cancelado", tom: "neutro", detalhe: (c) => c.quem, cliente: () => "Horário cancelado." },
  expirado: { rotulo: "Expirado", tom: "neutro", cliente: () => "O horário guardado expirou. Escolha outro." },
}
export const fraseHorarioOcupado = "Esse horário acabou de ser reservado. Veja os próximos livres."
export const fraseAvisoRemarcar = (cliente: string) => `${cliente} será avisada da mudança por WhatsApp.`

// ---------- 3.3 cliente ----------
export type EstadoCliente = "lead" | "ativo" | "inativo" | "anonimizado"
export const CLIENTE: Record<EstadoCliente, Projecao> = {
  lead: { rotulo: "Lead", tom: "info", detalhe: (c) => c.canal, cliente: () => "Conta criada. Agende seu primeiro serviço." },
  ativo: { rotulo: "Ativo", tom: "sucesso", detalhe: (c) => (c.dias !== undefined ? `última compra há ${c.dias} ${c.dias === 1 ? "dia" : "dias"}` : undefined) },
  inativo: { rotulo: "Inativo", tom: "neutro", detalhe: (c) => (c.dias !== undefined ? `${Math.max(1, Math.round(c.dias / 30))} meses sem compra` : undefined) },
  anonimizado: { rotulo: "Anonimizado", tom: "neutro", detalhe: (c) => `em ${d(c.quando)}`,
    cliente: (c) => `Seus dados foram excluídos em ${d(c.quando)}. Guardamos só o exigido por lei (notas fiscais).` },
}
export const NOME_ANONIMIZADO = "Cliente removido"

// ---------- 3.4 produto (derivado) ----------
export type EstadoProduto = "disponivel" | "baixo" | "esgotado" | "inativo"
export const PRODUTO: Record<EstadoProduto, Projecao> = {
  disponivel: { rotulo: "Em estoque", tom: "sucesso", detalhe: (c) => String(c.valor ?? ""), cliente: () => "Em estoque. Retire hoje na Pampulha." },
  baixo: { rotulo: "Estoque baixo", tom: "aviso", detalhe: (c) => `${c.valor} de mín. ${c.versao}`, cliente: () => "Últimas unidades na loja." },
  esgotado: { rotulo: "Esgotado", tom: "perigo", detalhe: (c) => (c.id ? `compra ${c.id} chega ${d(c.previsao)}` : undefined), cliente: () => "Esgotado. Avisamos quando chegar.", acaoCliente: "Avise-me" },
  inativo: { rotulo: "Inativo", tom: "neutro", cliente: () => "Fora de linha." },
}

// ---------- 3.5 lançamento ----------
export type EstadoLancamento = "previsto" | "em_aberto" | "aguardando_pix" | "pago" | "cancelado"
export const LANCAMENTO: Record<EstadoLancamento, Projecao> = {
  previsto: { rotulo: "Previsto", tom: "neutro", detalhe: (c) => d(c.ate) },
  em_aberto: { rotulo: "A receber", tom: "info", detalhe: (c) => `vence ${d(c.ate)}`, cliente: (c) => `A pagar: ${r$(c.valor)} até ${d(c.ate)}.`, acaoCliente: "Pagar" },
  aguardando_pix: { rotulo: "Aguardando Pix", tom: "aviso", detalhe: (c) => `expira ${h(c.ate)}`, cliente: (c) => `Pague até ${h(c.ate)}.`, acaoCliente: "Pix Copia e Cola" },
  pago: { rotulo: "Pago", tom: "sucesso", detalhe: (c) => `${d(c.quando)} ${h(c.quando)}${c.canal ? ` · ${c.canal}` : ""}`, cliente: (c) => `Pago em ${d(c.quando)}.`, acaoCliente: "Comprovante" },
  cancelado: { rotulo: "Cancelado", tom: "neutro", detalhe: (c) => c.motivo },
}
export const VENCIDO: Projecao = { rotulo: "Vencido", tom: "perigo", detalhe: (c) => `há ${c.dias} ${c.dias === 1 ? "dia" : "dias"}`,
  cliente: (c) => `Pagamento em atraso desde ${d(c.desde)}. Pague com Pix sem juros até ${d(c.ate)}.`, acaoCliente: "Pagar" }
export const fraseNaoConfirmado = "Enviado, ainda sem confirmação."
/** Lançamento em aberto de natureza "pagar" (conta a pagar): mesmo tom e detalhe do em_aberto, sem frase de cliente. */
export const LANCAMENTO_A_PAGAR: Projecao = { rotulo: "A pagar", tom: "info", detalhe: (c) => `vence ${d(c.ate)}` }

// ---------- 3.4 Compra (estoque) ----------
export type EstadoCompra = "rascunho" | "enviada" | "recebida_parcial" | "recebida" | "cancelada"
export const COMPRA: Record<EstadoCompra, Projecao> = {
  rascunho: { rotulo: "Rascunho", tom: "neutro" },
  enviada: { rotulo: "Enviada", tom: "info", detalhe: (c) => (c.previsao ? `chega ${d(c.previsao)}` : undefined) },
  recebida_parcial: { rotulo: "Recebida em parte", tom: "aviso", detalhe: (c) => (c.valor !== undefined ? `faltam ${c.valor}` : undefined) },
  recebida: { rotulo: "Recebida", tom: "sucesso", detalhe: (c) => (c.quando ? d(c.quando) : undefined) },
  cancelada: { rotulo: "Cancelada", tom: "neutro", detalhe: (c) => c.motivo },
}
/** Compra em atraso: enviada ou recebida em parte com a previsão vencida (derivado, como o ATRASADA da OS). */
export const COMPRA_ATRASADA: Projecao = { rotulo: "Atrasada", tom: "perigo", detalhe: (c) => (c.previsao ? `previsão ${d(c.previsao)}` : undefined) }

// ---------- membro da equipe (5.1 e 5.10) ----------
export type EstadoMembro = "ativo" | "convidado" | "suspenso"
export const MEMBRO: Record<EstadoMembro, Projecao> = {
  ativo: { rotulo: "Ativo", tom: "sucesso" },
  convidado: { rotulo: "Convite pendente", tom: "aviso", detalhe: (c) => (c.quando ? `enviado em ${d(c.quando)}` : undefined) },
  suspenso: { rotulo: "Suspenso", tom: "neutro", detalhe: (c) => (c.quando ? `desde ${d(c.quando)}` : undefined) },
}
/** Convite que passou da validade sem ser aceito (derivado). */
export const CONVITE_VENCIDO: Projecao = { rotulo: "Convite vencido", tom: "perigo", detalhe: (c) => (c.ate ? `venceu ${d(c.ate)}` : undefined) }

// ---------- conversa (5.9) ----------
export type EstadoConversa = "aberta" | "aguardando_cliente" | "resolvida"
export const CONVERSA: Record<EstadoConversa, Projecao> = {
  aberta: { rotulo: "Aberta", tom: "info" },
  aguardando_cliente: { rotulo: "Aguardando cliente", tom: "aviso" },
  resolvida: { rotulo: "Resolvida", tom: "sucesso" },
}

// ---------- 3.6 mensagem ----------
export type EstadoMensagem = "enviando" | "enviada" | "entregue" | "lida" | "falhou" | "recebida"
export const MENSAGEM: Record<EstadoMensagem, Projecao> = {
  enviando: { rotulo: "Enviando", tom: "neutro" },
  enviada: { rotulo: "Enviada", tom: "neutro" },
  entregue: { rotulo: "Entregue", tom: "neutro" },
  lida: { rotulo: "Lida", tom: "info" },
  falhou: { rotulo: "Não enviada", tom: "perigo" },
  recebida: { rotulo: "Recebida", tom: "neutro" },
}

// ---------- conflitos (PON-16) ----------
export const CONFLITO = {
  clienteCancelaComTecnicoIniciado: (c: Ctx) => `O técnico já começou o serviço às ${h(c.quando)}. Fale com a gente para cancelar.`,
  editarOrcamentoAprovado: (c: Ctx) => `${c.quem} aprovou a versão ${c.versao ?? 1} às ${h(c.quando)}. Mudanças agora geram a versão ${(c.versao ?? 1) + 1}.`,
  outraPessoaMoveu: (c: Ctx) => `${c.quem} moveu esta OS para ${c.motivo} às ${h(c.quando)}.`,
}

// ---------- o que o portal pode ver (D5) ----------
/** Campos que nunca saem para o cliente (PON-12, CLI-41). */
export const CAMPOS_INTERNOS = ["custo", "margem", "notaInterna", "score", "responsavelId", "ordem"] as const
/** Cópia sem os campos internos e com o histórico filtrado ao que o cliente pode ver. Use no portal, nunca o registro cru. */
export function paraOCliente<T extends Record<string, unknown>>(r: T): Omit<T, (typeof CAMPOS_INTERNOS)[number]> {
  const c: Record<string, unknown> = { ...r }
  for (const k of CAMPOS_INTERNOS) delete c[k]
  if (Array.isArray(c.historico)) c.historico = (c.historico as { cliente?: boolean }[]).filter((e) => e.cliente)
  return c as Omit<T, (typeof CAMPOS_INTERNOS)[number]>
}
