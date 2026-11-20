// Módulo Agenda · ações sobre um agendamento que mexem também na OS e na conversa do cliente (5.4, tabela de ações).
// Ficam fora do dados.ts porque pedidos/dados.ts importa `agendamentos` de lá: importar pedidos no dados.ts fecharia
// um ciclo de módulos. Todas pela acao(), com a classe da seção 3.2 e a capacidade conferida dentro dela.
import { acao, evento, proximoId, type Rascunho, type Resultado } from "@/proto/dados"
import { MIN, agora } from "@/proto/relogio"
import { recursoPorId, servicoPorSlug } from "@/proto/negocio"
import { AGENDAMENTO, formatosDaProjecao } from "@/proto/projecao"
import { pessoaAtual } from "@/proto/permissoes"
import { nomeCliente } from "@/modulos/clientes/dados"
import { pedidos } from "@/modulos/pedidos/dados"
import { conversas, mensagens, type Conversa } from "@/modulos/mensagens/dados"
import { agendamentos, type Agendamento } from "./dados"

const { ds, h } = formatosDaProjecao
/** Cliente ausente só depois de 20 min do início (3.2). */
export const ESPERA_AUSENTE_MIN = 20
export const podeMarcarAusente = (a: Agendamento, ref: Date = agora()) =>
  (a.estado === "confirmado" || a.estado === "em_atendimento") && ref.getTime() >= new Date(a.inicio).getTime() + ESPERA_AUSENTE_MIN * MIN
/** Chegada: visita confirmada, de 1 h antes do início até o fim (não se marca chegada numa visita de outro dia). */
export const podeChegar = (a: Agendamento, ref: Date = agora()) =>
  a.estado === "confirmado" && ref.getTime() >= new Date(a.inicio).getTime() - 60 * MIN && ref < new Date(a.fim)
const primeiroNome = (id: string) => nomeCliente(id).split(" ")[0]

/** A mensagem de saída na conversa do cliente (a do agendamento, a da OS ou a mais recente; sem nenhuma, abre uma). */
function avisarCliente(d: Rascunho, a: Agendamento, texto: string) {
  if (!a.clienteId) return
  const cvs = d(conversas)
  let cv: Conversa | undefined = cvs.find((c) => c.clienteId === a.clienteId && (c.ref === a.id || (a.pedidoId && c.ref === a.pedidoId)))
    ?? cvs.filter((c) => c.clienteId === a.clienteId).sort((x, y) => y.criadaEm.localeCompare(x.criadaEm))[0]
  const em = agora().toISOString()
  if (!cv) {
    cv = { id: proximoId(cvs, "CV", 40), clienteId: a.clienteId, canal: "whatsapp", ref: a.id, estado: "aguardando_cliente", naoLidas: 0, criadaEm: em, versao: 1, historico: [evento("Conversa aberta pela agenda")] }
    cvs.push(cv)
  } else cv.estado = "aguardando_cliente"
  d(mensagens).push({ id: proximoId(d(mensagens), "M", 4000), conversaId: cv.id, direcao: "saida", autor: pessoaAtual().nome, texto, em, estado: "enviada" })
}

const ctxUnidade = (a: Agendamento) => ({ unidade: recursoPorId(a.recursoId)?.unidade })
const conferir = (a: Agendamento) => ({ colecao: agendamentos as never, id: a.id, versao: a.versao })

/** Confirmar o pedido do site (P): solicitado → confirmado, com a mensagem ao cliente. */
export function confirmarAgendamento(a: Agendamento): Promise<Resultado> {
  const frase = AGENDAMENTO.confirmado.cliente!({ quando: a.inicio, ate: a.fim })
  return acao({
    rotulo: `confirmar o ${a.id}`, modo: "pessimista", ids: [a.id], capacidade: "mover_agenda", contexto: ctxUnidade(a), conferir: conferir(a),
    aplicar: (d) => {
      const x = d(agendamentos).find((y) => y.id === a.id)
      if (!x || x.estado !== "solicitado") return
      x.estado = "confirmado"
      x.historico.push(evento("Confirmado", { cliente: true }))
      avisarCliente(d, x, `Olá, ${primeiroNome(x.clienteId)}! ${frase}`)
    },
    sucesso: `${a.id} confirmado. ${primeiroNome(a.clienteId)} recebeu a confirmação.`,
  })
}

/** Cancelar (P, motivo obrigatório): avisa o cliente. A OS continua; quem reagenda é o atendimento. */
export function cancelarAgendamento(a: Agendamento, motivo: string): Promise<Resultado> {
  return acao({
    rotulo: `cancelar o ${a.id}`, modo: "pessimista", ids: [a.id], capacidade: "mover_agenda", contexto: ctxUnidade(a), conferir: conferir(a),
    aplicar: (d) => {
      const x = d(agendamentos).find((y) => y.id === a.id)
      if (!x || x.estado === "cancelado" || x.estado === "concluido") return
      x.estado = "cancelado"
      x.historico.push(evento(`Cancelado: ${motivo}`, { cliente: true }))
      avisarCliente(d, x, `Olá, ${primeiroNome(x.clienteId)}. Cancelamos a visita de ${ds(x.inicio)}, ${h(x.inicio)}. ${motivo.replace(/\.?$/, ".")} Responda aqui para marcar outro horário.`)
    },
    sucesso: `${a.id} cancelado. ${primeiroNome(a.clienteId)} foi avisado.`,
  })
}

/** Cliente ausente (P, depois de 20 min do início): o cliente lê "Reagende sem custo". */
export function marcarAusente(a: Agendamento, motivo: string): Promise<Resultado> {
  if (!podeMarcarAusente(a)) return Promise.resolve({ ok: false, motivo: "falha", mensagem: `Espere ${ESPERA_AUSENTE_MIN} min depois do horário marcado para registrar a ausência.` })
  const quando = agora().toISOString()
  return acao({
    rotulo: `registrar a ausência no ${a.id}`, modo: "pessimista", ids: [a.id], capacidade: "registrar_visita",
    contexto: { responsavelId: a.recursoId, ...ctxUnidade(a) }, conferir: conferir(a),
    aplicar: (d) => {
      const x = d(agendamentos).find((y) => y.id === a.id)
      if (!x) return
      x.estado = "faltou"
      x.historico.push(evento(`Cliente ausente: ${motivo}`, { cliente: true }))
      avisarCliente(d, x, `Olá, ${primeiroNome(x.clienteId)}. ${AGENDAMENTO.faltou.cliente!({ quando })}`)
    },
    sucesso: `${a.id}: ausência registrada. ${primeiroNome(a.clienteId)} recebeu o link para reagendar.`,
  })
}

function voltar(d: Rascunho, id: string, estado: Agendamento["estado"], osId?: string, etapa?: string) {
  const x = d(agendamentos).find((y) => y.id === id)
  if (x) x.estado = estado
  const o = osId ? d(pedidos).find((y) => y.id === osId) : undefined
  if (o && etapa) o.etapa = etapa as typeof o.etapa
}
/** O "Desfazer" da chegada dentro da folha (o toast fica atrás da camada modal): volta o agendamento e a OS. */
export function desfazerChegada(a: Agendamento, etapaAntes?: string) {
  return acao({ rotulo: "desfazer a chegada", ids: [a.id, ...(a.pedidoId ? [a.pedidoId] : [])], capacidade: "registrar_visita",
    contexto: { responsavelId: a.recursoId, ...ctxUnidade(a) }, aplicar: (d) => voltar(d, a.id, "confirmado", a.pedidoId, etapaAntes), sucesso: "Chegada desfeita." })
}

/** Marcar chegada (O, Desfazer 8 s): em atendimento; a OS agendada vai para diagnóstico ou execução (preço fechado). */
export function marcarChegada(a: Agendamento): Promise<Resultado> {
  const os = a.pedidoId ? pedidos.porId(a.pedidoId) : undefined
  const etapaOS = os?.etapa === "agendada" ? (servicoPorSlug(a.servicoSlug)?.precoFechado ? "em_execucao" : "em_diagnostico") : undefined
  const antes = { estado: a.estado, etapa: os?.etapa }
  return acao({
    rotulo: `marcar a chegada no ${a.id}`, ids: [a.id, ...(os ? [os.id] : [])], capacidade: "registrar_visita",
    contexto: { responsavelId: a.recursoId, ...ctxUnidade(a) },
    aplicar: (d) => {
      const x = d(agendamentos).find((y) => y.id === a.id)
      if (!x || x.estado !== "confirmado") return
      x.estado = "em_atendimento"
      x.historico.push(evento("Técnico chegou", { cliente: true }))
      const o = os && etapaOS ? d(pedidos).find((y) => y.id === os.id) : undefined
      if (o && etapaOS) { o.historico.push(evento(`Técnico chegou (${a.id})`, { de: o.etapa, para: etapaOS, eixo: "etapa" })); o.etapa = etapaOS }
    },
    desfazer: (d) => voltar(d, a.id, antes.estado, os?.id, antes.etapa),
    sucesso: `Chegada marcada às ${h(agora().toISOString())}.`,
  })
}
