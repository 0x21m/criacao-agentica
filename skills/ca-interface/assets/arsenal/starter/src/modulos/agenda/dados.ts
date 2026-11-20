// Módulo Agenda · coleção `agendamentos` (seção 3.2). Os de 16 a 21/11 são fixos (roteiros de QA e o teste de arrasto:
// conflito AG-3315 × AG-3316, o dia lotado do Bruno na ter 17/11, AG-3340 pedido pelo site); os das outras semanas
// (D−14 a D+14) saem da semente da coleção. Gustavo Prado não tem nenhum (pior caso).
// AG-3340 é do Diego (Pampulha): o roteiro da Ana (atendente da Pampulha) confirma o pedido do site; com a Elisa, de
// Contagem, a atendente não podia agir (fase 6, P1-1). Semente v2 para quem já tinha a v1 guardada no navegador.
import { acao, colecao, evento, mudarComoOutraPonta, proximoId, type Aleatorio, type Evento, type Rascunho, type Resultado } from "@/proto/dados"
import { MIN, agora, chaveDia, nov } from "@/proto/relogio"
import { COMPETENCIA, FERIADOS, RECURSOS, expediente, recursoPorId, servicoPorSlug, type Unidade } from "@/proto/negocio"
import { fraseAvisoRemarcar, fraseHorarioOcupado, type EstadoAgendamento } from "@/proto/projecao"
import { papelAtual, pode } from "@/proto/permissoes"
import { clientes, nomeCliente } from "@/modulos/clientes/dados"

export type Agendamento = {
  id: string; clienteId: string; pedidoId?: string; servicoSlug: string
  recursoId: string; inicio: string; fim: string
  local: "domicilio" | "loja"; endereco?: string; bairro: string; cidade: string
  estado: EstadoAgendamento; reservadoAte?: string
  origem: "site" | "portal" | "balcao" | "whatsapp" | "telefone"
  observacao?: string; versao: number; historico: Evento[]
}

type L = [string, string, string, string, number, number, number, number, number, EstadoAgendamento, string?]
// id, recurso, cliente, serviço, dia, h, m, h fim, m fim, estado, OS
const FIXOS: L[] = [
  ["AG-3290", "diego", "C-0026", "eletrica", 15 - 2, 15, 0, 16, 0, "confirmado"], // sex 13/11, ainda "confirmado" (pior caso: atrasado)
  ["AG-3301", "bruno", "C-0023", "limpeza-split", 16, 8, 0, 9, 30, "concluido"],
  ["AG-3302", "bruno", "C-0007", "conserto-ar", 16, 10, 0, 11, 0, "confirmado", "OS-1052"],
  ["AG-3315", "bruno", "C-0024", "limpeza-split", 16, 14, 0, 15, 30, "confirmado", "OS-1059"],
  ["AG-3316", "bruno", "C-0025", "limpeza-split", 16, 14, 30, 16, 0, "solicitado", "OS-1060"],
  ["AG-3303", "diego", "C-0026", "eletrica", 16, 8, 30, 9, 30, "concluido"],
  ["AG-3304", "diego", "C-0001", "limpeza-split", 16, 10, 30, 13, 30, "confirmado", "OS-1047"],
  ["AG-3305", "diego", "C-0027", "eletrica", 16, 15, 0, 16, 0, "confirmado"],
  ["AG-3306", "elisa", "C-0012", "conserto-ar", 16, 9, 0, 10, 0, "em_atendimento"],
  ["AG-3307", "elisa", "C-0028", "instalacao-split", 16, 11, 0, 14, 0, "confirmado", "OS-1056"],
  ["AG-3308", "elisa", "C-0029", "limpeza-split", 16, 15, 0, 16, 30, "confirmado"],
  ["AG-3309", "fabio", "C-0007", "montagem", 16, 8, 30, 12, 30, "em_atendimento", "OS-1063"],
  ["AG-3310", "fabio", "C-0030", "montagem", 16, 14, 0, 16, 0, "confirmado", "OS-1064"],
  ["AG-3311", "bancada-pampulha", "C-0015", "conserto-ar", 16, 8, 0, 9, 0, "concluido"],
  ["AG-3312", "bancada-pampulha", "C-0098", "conserto-ar", 16, 13, 0, 14, 0, "confirmado"],
  ["AG-3313", "bancada-pampulha", "C-0099", "conserto-ar", 16, 16, 0, 17, 0, "confirmado"],
  // ter 17/11: o dia lotado do Bruno (8 visitas de 8:00 a 18:00)
  ["AG-3320", "bruno", "C-0001", "limpeza-split", 17, 8, 0, 9, 0, "confirmado"],
  ["AG-3321", "bruno", "C-0023", "limpeza-split", 17, 9, 15, 10, 15, "confirmado"],
  ["AG-3322", "bruno", "C-0029", "conserto-ar", 17, 10, 30, 11, 30, "confirmado"],
  ["AG-3323", "bruno", "C-0021", "limpeza-split", 17, 11, 45, 12, 45, "confirmado"],
  ["AG-3324", "bruno", "C-0024", "conserto-ar", 17, 13, 30, 14, 30, "confirmado"],
  ["AG-3325", "bruno", "C-0025", "limpeza-split", 17, 14, 45, 15, 45, "confirmado"],
  ["AG-3326", "bruno", "C-0028", "conserto-ar", 17, 16, 0, 17, 0, "confirmado"],
  ["AG-3327", "bruno", "C-0012", "limpeza-split", 17, 17, 0, 18, 0, "confirmado"],
  ["AG-3328", "diego", "C-0018", "eletrica", 17, 9, 0, 10, 0, "confirmado"],
  ["AG-3329", "elisa", "C-0031", "conserto-ar", 17, 14, 0, 15, 0, "confirmado"],
  ["AG-3340", "diego", "C-0021", "conserto-ar", 18, 9, 0, 10, 30, "solicitado"],
  ["AG-3341", "diego", "C-0027", "eletrica", 18, 14, 0, 15, 0, "confirmado"],
  ["AG-3342", "fabio", "C-0030", "montagem", 19, 9, 0, 11, 0, "confirmado"],
  ["AG-3343", "bruno", "C-0015", "limpeza-split", 21, 8, 30, 10, 0, "confirmado"],
]

function semear(r: Aleatorio): Agendamento[] {
  const cli = clientes.semente()
  const montar = ([id, recursoId, clienteId, servicoSlug, d, h, m, hf, mf, estado, pedidoId]: L, origem: Agendamento["origem"] = estado === "solicitado" ? "site" : "telefone"): Agendamento => {
    const c = cli.find((x) => x.id === clienteId)!
    return {
      id, clienteId, pedidoId, servicoSlug, recursoId, inicio: nov(d, h, m).toISOString(), fim: nov(d, hf, mf).toISOString(),
      local: recursoId === "bancada-pampulha" ? "loja" : "domicilio", bairro: c.endereco.bairro, cidade: c.endereco.cidade, estado, origem,
      versao: 1, historico: [{ em: nov(Math.min(d, 16) - 3, 10).toISOString(), quem: { tipo: "pessoa", nome: "Ana Lima" }, texto: "Agendamento criado" }],
    }
  }
  const lista = FIXOS.map((l) => montar(l))
  // D−14 a D+14 fora da semana em foco: 2 a 3 visitas por técnico por dia útil (sem o Gustavo)
  const tecnicos = RECURSOS.filter((x) => x.id !== "gustavo")
  const ativos = cli.filter((c) => c.estado === "ativo")
  let n = 2001 // os sorteados ficam em AG-2001…, longe dos fixos (AG-3290 a AG-3343)
  for (let dia = 2; dia <= 30; dia++) {
    if (dia >= 13 && dia <= 21) continue
    const data = nov(dia)
    const exp = expediente(data)
    if (!exp) continue
    for (const t of tecnicos) {
      let min = exp.abre + r.entre(0, 2) * 30
      for (let k = 0; k < r.entre(1, 3) && min + 60 <= exp.fecha; k++) {
        const servico = r.pega(["limpeza-split", "conserto-ar", "eletrica", "montagem", "instalacao-split"].filter((s) => t.competencias.includes(servicoPorSlug(s)!.competencia)))
        if (!servico) break
        const dur = servicoPorSlug(servico)!.duracao
        if (min + dur > exp.fecha) break
        const estado: EstadoAgendamento = dia < 16 ? (r.chance(0.08) ? "faltou" : "concluido") : "confirmado"
        const id = `AG-${n++}`
        lista.push(montar([id, t.id, r.pega(ativos).id, servico, dia, Math.floor(min / 60), min % 60, Math.floor((min + dur) / 60), (min + dur) % 60, estado]))
        min += dur + r.entre(1, 3) * 30
      }
    }
  }
  return lista.sort((a, b) => a.inicio.localeCompare(b.inicio))
}

export const agendamentos = colecao<Agendamento>("agendamentos", semear, 2, { caminho: (a) => (a.pedidoId ? `pedidos/?id=${a.pedidoId}` : "agenda/") })

/**
 * O bloco ocupa a grade? Cancelado e expirado não; a reserva do site ocupa só até `reservadoAte` (PON-28: vencida, o
 * horário volta a ficar livre mesmo antes de a expiração gravar o estado `expirado`).
 */
export function ocupa(a: Agendamento, ref: Date = agora()) {
  if (a.estado === "cancelado" || a.estado === "expirado") return false
  return a.estado !== "reservado" || !a.reservadoAte || new Date(a.reservadoAte) > ref
}

// ---------- regras (EST-31): validadas durante o arrasto ----------
export type Proposta = { inicio: Date; fim: Date; recursoId: string }
export type Validacao = { motivo?: string; conflitos: Agendamento[] }
const hora = (iso: string | Date) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const diaCurto = (iso: string | Date) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })

/** Expediente, feriado e competência recusam; sobreposição não proíbe: vira conflito destacado. */
export function validarHorario(p: Proposta, servicoSlug: string | undefined, ignorar?: string, lista = agendamentos.ler()): Validacao {
  const feriado = FERIADOS[chaveDia(p.inicio)]
  if (feriado) return { motivo: `${p.inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} é feriado.`, conflitos: [] }
  const exp = expediente(p.inicio)
  if (!exp) return { motivo: "Domingo: loja fechada.", conflitos: [] }
  const ini = p.inicio.getHours() * 60 + p.inicio.getMinutes()
  const fim = ini + (p.fim.getTime() - p.inicio.getTime()) / 6e4
  if (ini < exp.abre || fim > exp.fecha) return { motivo: `Fora do expediente (${exp.abre / 60}:00 às ${exp.fecha / 60}:00).`, conflitos: [] }
  const rec = recursoPorId(p.recursoId)
  const s = servicoPorSlug(servicoSlug)
  if (rec && s && !rec.competencias.includes(s.competencia)) return { motivo: `${rec.curto} não faz ${COMPETENCIA[s.competencia]}.`, conflitos: [] }
  const conflitos = lista.filter((a) => a.id !== ignorar && a.recursoId === p.recursoId && ocupa(a) &&
    new Date(a.inicio) < p.fim && new Date(a.fim) > p.inicio)
  return { conflitos }
}

/** Mover ou esticar: otimista com Desfazer; se já confirmado, o toast diz que o cliente será avisado (3.2). */
export function remarcar(id: string, p: Proposta, tipo: "mover" | "esticar") {
  const a = agendamentos.porId(id)
  if (!a) return
  const antes = { inicio: a.inicio, fim: a.fim, recursoId: a.recursoId }
  const rec = recursoPorId(p.recursoId)
  // "unidade" vale nas duas pontas: a atendente não tira um bloco de outra unidade nem o leva para lá. A acao() confere
  // um contexto só; mandamos o da origem quando é ele que recusa, senão o do destino.
  const origem = recursoPorId(a.recursoId)?.unidade
  const contexto = { unidade: pode(papelAtual(), "mover_agenda", { unidade: origem }) ? rec?.unidade : origem }
  const msg = tipo === "esticar"
    ? `${id} agora vai de ${hora(p.inicio)} a ${hora(p.fim)}.`
    : `${id} movido para ${new Date(antes.inicio).toDateString() === p.inicio.toDateString() ? "" : diaCurto(p.inicio) + ", "}${hora(p.inicio)} com ${rec?.curto}.`
  void acao({
    // 3.2: O com Desfazer enquanto o cliente não foi avisado; confirmado = P (o bloco espera a resposta) com o aviso
    rotulo: `remarcar o ${id}`, ids: [id], capacidade: "mover_agenda", contexto,
    modo: a.estado === "confirmado" ? "pessimista" : "otimista", conferir: { colecao: agendamentos as never, id, versao: a.versao },
    aplicar: (d) => {
      const x = d(agendamentos).find((y) => y.id === id)
      if (!x) return
      x.inicio = p.inicio.toISOString(); x.fim = p.fim.toISOString(); x.recursoId = p.recursoId
      x.historico.push(evento(tipo === "mover" ? `Remarcado para ${diaCurto(p.inicio)} ${hora(p.inicio)} (${rec?.curto})` : `Duração alterada para ${hora(p.inicio)}–${hora(p.fim)}`))
    },
    desfazer: (d) => { const x = d(agendamentos).find((y) => y.id === id); if (x) Object.assign(x, antes) },
    sucesso: a.estado === "confirmado" ? `${msg} ${fraseAvisoRemarcar(nomeCliente(a.clienteId))}` : msg,
  })
}

/** Criar agendamento (pessimista: o bloco só aparece depois da resposta; o erro fica no diálogo). */
export function criarAgendamento(n: { clienteId: string; servicoSlug: string; recursoId: string; inicio: Date; fim: Date; pedidoId?: string }) {
  const id = proximoId(agendamentos.ler(), "AG", 3343)
  const c = clientes.porId(n.clienteId)
  const ag: Agendamento = {
    id, clienteId: n.clienteId, servicoSlug: n.servicoSlug, recursoId: n.recursoId, inicio: n.inicio.toISOString(), fim: n.fim.toISOString(),
    pedidoId: n.pedidoId, local: n.recursoId === "bancada-pampulha" ? "loja" : "domicilio", bairro: c?.endereco.bairro ?? "", cidade: c?.endereco.cidade ?? "",
    estado: "confirmado", origem: "balcao", versao: 1, historico: [evento("Agendamento criado no balcão")],
  }
  return acao({
    rotulo: "criar o agendamento", modo: "pessimista", ids: [id], capacidade: "criar_pedido",
    aplicar: (d) => { d(agendamentos).push(structuredClone(ag)) },
    desfazer: (d) => { d.trocar(agendamentos, d(agendamentos).filter((a) => a.id !== id)) },
    sucesso: `${id} criado: ${diaCurto(n.inicio)}, ${hora(n.inicio)} com ${recursoPorId(n.recursoId)?.curto}.`,
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Horários livres e reserva com prazo (3.2, 5.13, PON-26 a PON-28). Peça reutilizável: o Site (/site/agendar/) e o
// Portal (/portal/agendar/) importam daqui `horariosLivres`, `reservarHorario`, `usarReserva` e a `GradeDeHorarios`.
// ---------------------------------------------------------------------------------------------------------------
/** Prazo da reserva do site (3.2): 10 minutos. */
export const RESERVA_MIN = 10
/** Antecedência mínima para o cliente marcar (o técnico precisa de tempo para chegar). */
export const ANTECEDENCIA_MIN = 120
/** Passo da grade de horários livres. */
export const PASSO_MIN = 30

export type HorarioLivre = { inicio: Date; fim: Date; recursoIds: string[] }

/**
 * Horários em que o serviço cabe inteiro com algum técnico livre, no dia (de PASSO_MIN em PASSO_MIN, dentro do
 * expediente, a partir de agora + ANTECEDENCIA_MIN). Só técnicos que fazem o serviço e, com `unidade`, só os dela; a
 * bancada fica de fora (o cliente agenda visita em casa). Feriado, domingo ou serviço desconhecido: lista vazia.
 * `lista` e `ref` existem para a tela passar o que já leu (`agendamentos.use()`, `useAgora()`).
 */
export function horariosLivres(servico: string, dia: Date, unidade?: Unidade | "todas", lista: Agendamento[] = agendamentos.ler(), ref: Date = agora()): HorarioLivre[] {
  const s = servicoPorSlug(servico)
  const exp = expediente(dia)
  if (!s || !exp) return []
  const recursos = RECURSOS.filter((r) => !r.competencias.includes("bancada") && r.competencias.includes(s.competencia) && (!unidade || unidade === "todas" || r.unidade === unidade))
  const doDia = lista.filter((a) => chaveDia(new Date(a.inicio)) === chaveDia(dia) && ocupa(a, ref))
  const limite = ref.getTime() + ANTECEDENCIA_MIN * MIN
  const livres: HorarioLivre[] = []
  for (let m = exp.abre; m + s.duracao <= exp.fecha; m += PASSO_MIN) {
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), Math.floor(m / 60), m % 60)
    if (inicio.getTime() < limite) continue
    const fim = new Date(inicio.getTime() + s.duracao * MIN)
    const recursoIds = recursos.filter((r) => !doDia.some((a) => a.recursoId === r.id && new Date(a.inicio) < fim && new Date(a.fim) > inicio)).map((r) => r.id)
    if (recursoIds.length) livres.push({ inicio, fim, recursoIds })
  }
  return livres
}

/** Os próximos `n` horários livres depois de `depois` (até 14 dias à frente): as sugestões de quem perdeu a disputa. */
export function proximosLivres(servico: string, depois: Date, n = 3, unidade?: Unidade | "todas", lista: Agendamento[] = agendamentos.ler(), ref: Date = agora()): HorarioLivre[] {
  const achados: HorarioLivre[] = []
  for (let i = 0; i < 14 && achados.length < n; i++) {
    const dia = new Date(depois.getFullYear(), depois.getMonth(), depois.getDate() + i)
    achados.push(...horariosLivres(servico, dia, unidade, lista, ref).filter((x) => x.inicio > depois))
  }
  return achados.slice(0, n)
}

export type PedidoDeReserva = {
  servico: string; inicio: Date; unidade?: Unidade | "todas"
  /** Técnico preferido; sem ele, o primeiro livre que faz o serviço. */ recursoId?: string
  /** Cliente já identificado (Portal). No Site a reserva nasce antes dos dados; o cliente entra em `usarReserva`. */ clienteId?: string
  origem?: "site" | "portal"
  /** Reserva anterior do mesmo visitante, solta na mesma ação (trocar de horário não prende dois). */ substitui?: string
}
export type ResultadoReserva =
  | { ok: true; id: string; inicio: Date; fim: Date; recursoId: string; reservadoAte: Date }
  | (Extract<Resultado, { ok: false }> & { sugestoes: HorarioLivre[] })

// BASE: a acao() confere `capacidade` contra o papel do operador da barra F, e o visitante do site e o cliente do
// portal não são papel da MATRIZ. Como no Portal (portal/dados.ts, "Ações do cliente"), as ações do cliente não pedem
// capacidade: a regra (horário livre, reserva do mesmo cliente) é conferida aqui, antes da acao(), e de novo no `aplicar`.
/**
 * Reservar um horário por RESERVA_MIN minutos (P, atômico). Quem chega primeiro leva: a disponibilidade é conferida de
 * novo sobre a base no instante de gravar; se outra pessoa (outra aba) levou antes, devolve conflito com a frase da
 * projeção e 3 horários sugeridos. Silenciosa: quem chama mostra a mensagem no lugar (a GradeDeHorarios já mostra).
 */
export async function reservarHorario(p: PedidoDeReserva): Promise<ResultadoReserva> {
  const s = servicoPorSlug(p.servico)
  if (!s) return { ok: false, motivo: "falha", mensagem: "Escolha um serviço.", sugestoes: [] }
  const perdeu = (): ResultadoReserva => ({ ok: false, motivo: "conflito", mensagem: fraseHorarioOcupado, sugestoes: proximosLivres(p.servico, p.inicio, 3, p.unidade) })
  const anterior = p.substitui ? agendamentos.porId(p.substitui) : undefined
  const substitui = anterior && anterior.estado === "reservado" && (!anterior.clienteId || anterior.clienteId === p.clienteId) ? anterior.id : undefined
  const livre = (lista: Agendamento[]) => {
    const h = horariosLivres(p.servico, p.inicio, p.unidade, lista.filter((a) => a.id !== substitui)).find((x) => x.inicio.getTime() === p.inicio.getTime())
    return h && (p.recursoId ? (h.recursoIds.includes(p.recursoId) ? p.recursoId : undefined) : h.recursoIds[0])
  }
  if (!livre(agendamentos.ler())) return perdeu()
  const fim = new Date(p.inicio.getTime() + s.duracao * MIN)
  let criado: Agendamento | undefined
  const r = await acao({
    rotulo: "guardar o horário", modo: "pessimista", silenciosa: true, ids: substitui ? [substitui] : [],
    aplicar: (d) => {
      const recursoId = livre(d(agendamentos)) // de novo, sobre a base de agora: a reserva é atômica
      if (!recursoId) return
      const ref = agora()
      const ate = new Date(ref.getTime() + RESERVA_MIN * MIN)
      const c = p.clienteId ? clientes.porId(p.clienteId) : undefined
      criado = {
        id: proximoId(d(agendamentos), "AG", 3343), clienteId: p.clienteId ?? "", servicoSlug: p.servico, recursoId,
        inicio: p.inicio.toISOString(), fim: fim.toISOString(), local: "domicilio", bairro: c?.endereco.bairro ?? "", cidade: c?.endereco.cidade ?? "",
        estado: "reservado", reservadoAte: ate.toISOString(), origem: p.origem ?? "site", versao: 1,
        historico: [{ em: ref.toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto: `Horário reservado no ${p.origem === "portal" ? "portal" : "site"} até ${hora(ate)}` }],
      }
      if (substitui) d.trocar(agendamentos, d(agendamentos).filter((a) => a.id !== substitui))
      d(agendamentos).push(structuredClone(criado))
    },
  })
  if (!r.ok) return { ...r, sugestoes: [] }
  if (!criado) return perdeu()
  const feito: Agendamento = criado
  return { ok: true, id: feito.id, inicio: p.inicio, fim, recursoId: feito.recursoId, reservadoAte: new Date(feito.reservadoAte!) }
}

/** Soltar a reserva (o visitante voltou ou trocou de serviço): O e silenciosa, o bloco só some da grade. */
export function liberarReserva(id: string, clienteId?: string): Promise<Resultado> {
  const a = agendamentos.porId(id)
  if (!a || a.estado !== "reservado" || (a.clienteId && a.clienteId !== clienteId)) return Promise.resolve({ ok: true })
  return acao({ rotulo: "soltar o horário", silenciosa: true, aplicar: (d) => d.trocar(agendamentos, d(agendamentos).filter((x) => x.id !== id)) })
}

/**
 * Para usar DENTRO do `aplicar` da ação que conclui o agendamento (Site: checkout; Portal: agendar de novo): a reserva
 * vira `solicitado` (ou `confirmado`, se pago no site) com o cliente e a OS. Devolve undefined se venceu ou não existe
 * mais: aí a ação não grava nada e a tela volta à etapa Horário com AGENDAMENTO.expirado ("O horário guardado expirou.").
 */
export function usarReserva(d: Rascunho, id: string, dados: { clienteId: string; pedidoId?: string; estado?: "solicitado" | "confirmado"; endereco?: string; bairro: string; cidade: string; observacao?: string }) {
  const a = d(agendamentos).find((x) => x.id === id)
  if (!a || a.estado !== "reservado" || !ocupa(a)) return undefined
  const estado = dados.estado ?? "solicitado"
  Object.assign(a, dados, { estado, reservadoAte: undefined })
  a.historico.push({ em: agora().toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto: estado === "confirmado" ? "Visita confirmada: pago no site" : "Pedido de horário recebido", cliente: true })
  return a
}

/** A reserva venceu (classe A, o sistema): vira `expirado` com evento e sai da grade. Idempotente; as telas chamam. */
export function expirarReservas(ref: Date = agora()) {
  const vencidas = agendamentos.ler().filter((a) => a.estado === "reservado" && a.reservadoAte && new Date(a.reservadoAte) <= ref).map((a) => a.id)
  if (!vencidas.length) return
  mudarComoOutraPonta((d) => {
    for (const a of d(agendamentos)) {
      if (!vencidas.includes(a.id) || a.estado !== "reservado") continue
      a.estado = "expirado"
      a.historico.push({ em: a.reservadoAte!, quem: { tipo: "sistema", nome: "Sistema" }, texto: "Reserva expirou: horário liberado" })
    }
  }, vencidas)
}
