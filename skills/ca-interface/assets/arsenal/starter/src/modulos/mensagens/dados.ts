// Módulo Mensagens e notificações · coleções `conversas`, `mensagens`, `notificacoes` e `modelos` (seção 3.6).
// Este módulo é o dono das quatro coleções (nenhum outro as declara). As mensagens AUTOMÁTICAS não são gravadas aqui:
// elas são lidas do `historico` das OS (eventos com `cliente: true`, os mesmos que o portal mostra) e do orçamento
// enviado, com o texto da projeção (PON-18, COM-14). Assim a conversa nunca contradiz a OS: um lugar só de verdade.
// Mesma ideia nas notificações do que o cliente faz (aprovar, pagar): derivadas do evento; aqui só fica a marca de lida.
import { useSyncExternalStore } from "react"
import { acao, aleatorio, colecao, mudarComoOutraPonta, proximoId, sementeDe, type Evento } from "@/proto/dados"
import { agora, nov, MIN, HORA, DIA } from "@/proto/relogio"
import { EQUIPE, pessoaPorId, type Pessoa } from "@/proto/negocio"
import { pode, papelAtual, pessoaAtual, pessoaDoPapel, type Papel } from "@/proto/permissoes"
import { CONVERSA, ETAPA_OS, PAGAMENTO, type EstadoConversa, type EtapaOS } from "@/proto/projecao"
import { clientes, nomeCliente } from "@/modulos/clientes/dados"
import { ctxDaOS, pedidos, type Pedido } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"

// ---------- tipos (3.6) ----------
export type Canal = "whatsapp" | "email" | "portal"
export type { EstadoConversa }
export { CONVERSA }
export type Conversa = {
  id: string; clienteId: string; canal: Canal
  /** OS, venda ou agendamento ligado (PON-05: o id aparece igual em todas as pontas). */ ref?: string
  estado: EstadoConversa; atribuidaA?: string; naoLidas: number
  criadaEm: string; versao: number; historico: Evento[]
}
export type EstadoMensagem = "enviando" | "enviada" | "entregue" | "lida" | "falhou" | "recebida"
export type Mensagem = {
  id: string; conversaId: string; direcao: "entrada" | "saida"; autor: string; texto: string
  anexos?: string[]; modeloId?: string; em: string; estado: EstadoMensagem
  /** Canal efetivo quando difere do da conversa (cliente sem consentimento de WhatsApp vai por e-mail). */ canal?: Canal
}
export type TipoNotificacao = "mensagem" | "os" | "agenda" | "pagamento"
export type Notificacao = {
  id: string; para: string /* id da pessoa ou papel */; titulo: string; texto: string; ref: string
  link: string /* caminho canônico do objeto, relativo ao base */; em: string; lida: boolean; tipo: TipoNotificacao
  /** Marca de leitura de uma notificação derivada de evento (o texto vem do evento, não daqui). */ derivada?: boolean
}
export type Modelo = { id: string; nome: string; texto: string; gatilho?: EtapaOS; canal: Canal; atualizadoEm: string; versao: number; historico: Evento[] }

export const CANAL: Record<Canal, string> = { whatsapp: "WhatsApp", email: "E-mail", portal: "Portal" }


// ---------- semente ----------
const iso = (d: Date) => d.toISOString()
type Fala = [quando: Date, direcao: "entrada" | "saida", autor: string, texto: string, estado?: EstadoMensagem]
type Fixa = { id: string; clienteId: string; canal: Canal; ref?: string; estado: EstadoConversa; atribuidaA?: string; naoLidas: number; falas: Fala[] }

const LONGA = ("Bom dia. Escrevo em nome do departamento de manutenção predial da Companhia para registrar, de forma detalhada e formal, "
  + "todas as ocorrências observadas nos três galpões de armazenagem refrigerada desde a última visita técnica, conforme solicitado no contrato anual. "
  + "No galpão 7, a evaporadora da câmara fria número dois apresentou formação de gelo nas aletas por volta das seis da manhã de sexta-feira, "
  + "e o termômetro da doca de recebimento marcou oito graus acima do setpoint durante cerca de quarenta minutos, o que obrigou a equipe a remanejar "
  + "as paletes de produtos sensíveis para o galpão 9. No galpão 8, o ruído do compressor da unidade condensadora externa voltou a aparecer, "
  + "principalmente no início do turno da tarde, e o operador de empilhadeira relatou cheiro de queimado próximo ao quadro de comando. "
  + "No galpão 9, não houve falha, mas o consumo de energia registrado pelo medidor setorial subiu dezoito por cento em relação ao mês anterior. "
  + "Pedimos que o laudo técnico da OS-1099 contemple os três galpões, com fotos, medições de corrente, pressão de sucção e descarga, e a lista "
  + "de peças substituídas, porque o setor de seguros precisa anexar o documento ao processo interno até o fim do mês. Também precisamos que a "
  + "nota fiscal seja emitida com o código de centro de custo CC-4471-REFRIG e enviada para o e-mail do contas a pagar, com cópia para a gerência "
  + "de facilities, sem o que o pagamento não entra no lote quinzenal. Por fim, solicitamos que a próxima visita seja agendada fora do horário "
  + "de pico de recebimento, de preferência entre as treze e as quinze horas, e que os técnicos tragam os equipamentos de proteção exigidos pela "
  + "nossa norma interna de segurança, incluindo luvas térmicas e óculos, além do crachá provisório que deve ser retirado na portaria três com "
  + "antecedência mínima de um dia útil. Agradecemos a atenção e ficamos no aguardo do cronograma atualizado e do orçamento complementar.")

const FIXAS: Fixa[] = [
  { id: "CV-0031", clienteId: "C-0007", canal: "whatsapp", ref: "OS-1052", estado: "aberta", atribuidaA: "ana", naoLidas: 1, falas: [
    [nov(16, 8, 52), "saida", "Ana Lima", "Oi, Juliana! O orçamento do conserto do seu split já está no portal. Qualquer dúvida, é só responder por aqui.", "lida"],
    [nov(16, 9, 18), "entrada", "Juliana Castro", "O orçamento inclui a instalação do suporte?"],
  ] },
  { id: "CV-0032", clienteId: "C-0021", canal: "whatsapp", ref: "AG-3340", estado: "aberta", naoLidas: 1, falas: [
    [nov(16, 7, 58), "entrada", "Rafael Moreira", "Bom dia! Pedi pelo site uma visita na quarta às 9h. Está confirmado?"],
  ] },
  { id: "CV-0033", clienteId: "C-0015", canal: "whatsapp", ref: "OS-1061", estado: "aguardando_cliente", atribuidaA: "ana", naoLidas: 0, falas: [
    [nov(16, 8, 40), "entrada", "Marcos Teixeira", "O técnico terminou a limpeza. Como faço para pagar?"],
    [nov(16, 9, 2), "saida", "Ana Lima", "Oi, Marcos! Ficou R$ 220,00. Vou te mandar o Pix agora.", "lida"],
    [nov(16, 9, 30), "saida", "Ana Lima", "Segue o Pix Copia e Cola da OS-1061. O código vale por 30 minutos.", "falhou"],
  ] },
  { id: "CV-0034", clienteId: "C-0001", canal: "email", ref: "OS-1047", estado: "aberta", atribuidaA: "marina", naoLidas: 0, falas: [
    [nov(13, 16, 5), "entrada", "Sônia (Padaria Pão de Mel)", "Podem vir na segunda às 10h30 para a limpeza trimestral? Antes disso o forno está ligado."],
    [nov(13, 16, 40), "saida", "Marina Duarte", "Combinado, Sônia. O Diego chega às 10h30 e a limpeza dos 4 splits leva umas três horas.", "lida"],
    [nov(16, 9, 5), "entrada", "Sônia (Padaria Pão de Mel)", "Perfeito. A nota precisa sair no CNPJ da matriz, por favor."],
    [nov(16, 9, 12), "saida", "Marina Duarte", "Anotado. A nota sai no fim do mês, junto com o contrato.", "entregue"],
  ] },
  { id: "CV-0035", clienteId: "C-0012", canal: "whatsapp", ref: "OS-1044", estado: "aguardando_cliente", atribuidaA: "marina", naoLidas: 0, falas: [
    [nov(14, 10, 20), "entrada", "Clínica Vida Plena", "Alguma previsão do compressor? A recepção está muito quente."],
    [nov(14, 11, 0), "saida", "Marina Duarte", "O fornecedor atrasou a entrega. A nova previsão é quinta, 19/11. Assim que chegar, a Elisa agenda a troca.", "lida"],
    [nov(16, 8, 15), "saida", "Marina Duarte", "Bom dia! Confirmamos com o fornecedor: a peça sai hoje do centro de distribuição.", "entregue"],
  ] },
  { id: "CV-0036", clienteId: "C-0018", canal: "portal", ref: "OS-1058", estado: "aberta", naoLidas: 2, falas: [
    [nov(16, 7, 40), "entrada", "Escola Pequeno Saber", "Pedimos pelo site a revisão elétrica das salas do térreo."],
    [nov(16, 7, 42), "entrada", "Escola Pequeno Saber", "As aulas começam às 13h; o ideal é que a visita seja de manhã."],
  ] },
  { id: "CV-0040", clienteId: "C-0099", canal: "email", ref: "OS-1099", estado: "aberta", atribuidaA: "marina", naoLidas: 0, falas: [
    [nov(13, 14, 2), "entrada", "Companhia Brasileira de Distribuição", LONGA],
    [nov(13, 15, 30), "saida", "Marina Duarte", "Recebido. Vamos incluir os três galpões no laudo e enviar o cronograma até sexta.", "lida"],
  ] },
  { id: "CV-0041", clienteId: "C-0098", canal: "whatsapp", estado: "resolvida", atribuidaA: "ana", naoLidas: 0, falas: [
    [nov(12, 10, 0), "entrada", "Ló D'Ávila", "Vcs abrem sábado?"],
    [nov(12, 10, 4), "saida", "Ana Lima", "Abrimos, Ló! Sábado das 8:00 às 12:00.", "lida"],
    [nov(12, 10, 5), "entrada", "Ló D'Ávila", "Ok"],
  ] },
]

const PERGUNTAS = ["Bom dia! Vocês fazem limpeza de split no sábado?", "Qual o valor da instalação de um split de 9.000 BTU?", "O ar voltou a pingar depois da limpeza.",
  "Consigo remarcar a visita para a semana que vem?", "Vocês emitem nota fiscal no CNPJ?", "O técnico pode chegar mais cedo?", "Recebi o orçamento, vou ver com meu marido.",
  "Tem garantia esse conserto?", "Aceitam cartão em 3 vezes?", "Obrigado pelo atendimento!", "O controle remoto parou de funcionar depois da visita.", "Pode mandar o comprovante?"]
const RESPOSTAS = ["Fazemos, sim! Sábado das 8:00 às 12:00.", "A instalação até 12.000 BTU sai por R$ 650,00, com suporte incluso.", "Que pena! Vamos mandar o técnico sem custo, está na garantia.",
  "Claro. Tenho terça às 14:00 ou quinta às 9:00. Qual fica melhor?", "Emitimos, sim. Me passa o CNPJ e o e-mail para envio.", "Vou ver com ele e já te aviso.",
  "Sem pressa. O orçamento vale 10 dias.", "Sim: 90 dias a partir da entrega do serviço.", "Aceitamos, em até 3 vezes sem juros no cartão.", "Nós que agradecemos!",
  "Pode ser a pilha. Se não resolver, o técnico passa aí.", "Enviado no seu e-mail agora há pouco."]
const ATENDENTES = ["Ana Lima", "Carla Mota", "Marina Duarte"]
const ID_DE_ATENDENTE: Record<string, string> = { "Ana Lima": "ana", "Carla Mota": "carla", "Marina Duarte": "marina" }

type Semente = { conversas: Conversa[]; mensagens: Mensagem[] }
let cache: Semente | undefined
/** Conversas e mensagens nascem juntas (a mesma sequência de sorteio); cada coleção pega a sua parte. */
function semearTudo(): Semente {
  if (cache) return cache
  const conversas: Conversa[] = []
  const mensagens: Mensagem[] = []
  let n = 4000
  const falar = (cv: string, [quando, direcao, autor, texto, estado]: Fala) => mensagens.push({
    id: `M-${++n}`, conversaId: cv, direcao, autor, texto, em: iso(quando), estado: estado ?? (direcao === "entrada" ? "recebida" : "lida"),
  })
  const sis = (em: Date, texto: string): Evento => ({ em: iso(em), quem: { tipo: "sistema", nome: "Sistema" }, texto })
  // 10 conversas sorteadas (CV-0021 a CV-0030) com clientes ativos que não estão nas fixas
  const r = aleatorio(sementeDe("conversas")) // o mesmo gerador que a coleção "conversas" receberia (D7)
  const fixos = new Set(FIXAS.map((f) => f.clienteId))
  const candidatos = clientes.semente().filter((c) => c.estado === "ativo" && !fixos.has(c.id) && c.id !== "C-0099")
  const osDe = (id: string) => pedidos.semente().filter((p) => p.clienteId === id)
  for (let i = 0; i < 10; i++) {
    const c = candidatos[(i * 3 + r.entre(0, 2)) % candidatos.length]
    if (conversas.some((x) => x.clienteId === c.id)) continue
    const id = `CV-${String(21 + i).padStart(4, "0")}`
    const inicio = new Date(nov(16, 9).getTime() - r.entre(2, 20) * DIA - r.entre(0, 8) * HORA)
    const atendente = r.pega(ATENDENTES)
    const os = osDe(c.id)[0]
    const resolvida = i % 3 !== 0
    conversas.push({ id, clienteId: c.id, canal: r.pega(["whatsapp", "whatsapp", "email", "portal"] as const), ref: os && r.chance(0.6) ? os.id : undefined,
      estado: resolvida ? "resolvida" : "aguardando_cliente", atribuidaA: ID_DE_ATENDENTE[atendente], naoLidas: 0, criadaEm: iso(inicio), versao: 1,
      historico: [sis(inicio, "Conversa iniciada pelo cliente")] })
    let t = inicio.getTime()
    const trocas = r.entre(5, 7)
    for (let k = 0; k < trocas; k++) {
      const q = r.entre(0, PERGUNTAS.length - 1)
      falar(id, [new Date(t), "entrada", c.nome, PERGUNTAS[q]])
      t += r.entre(4, 50) * MIN
      falar(id, [new Date(t), "saida", atendente, RESPOSTAS[q], "lida"])
      t += r.entre(2, 30) * HORA
    }
  }
  for (const f of FIXAS) {
    const criada = new Date(f.falas[0][0].getTime() - 5 * MIN)
    conversas.push({ id: f.id, clienteId: f.clienteId, canal: f.canal, ref: f.ref, estado: f.estado, atribuidaA: f.atribuidaA, naoLidas: f.naoLidas,
      criadaEm: iso(criada), versao: 1, historico: [sis(criada, "Conversa iniciada")] })
    f.falas.forEach((x) => falar(f.id, x))
  }
  return (cache = { conversas, mensagens })
}

export const conversas = colecao<Conversa>("conversas", () => semearTudo().conversas, 1, { caminho: (c) => `mensagens/?conversa=${c.id}` })
export const mensagens = colecao<Mensagem>("mensagens", () => semearTudo().mensagens)

// ---------- modelos ----------
const MODELOS: [string, string, Canal, string, EtapaOS?][] = [
  ["MOD-01", "Dúvida de orçamento", "whatsapp", "Oi, {cliente}! Sobre o orçamento da {os}: o total é {valor}, válido até {data}. Ele inclui peças, mão de obra e a garantia de 90 dias. Para ver os itens e aprovar: {link}"],
  ["MOD-02", "Visita marcada", "whatsapp", "Oi, {cliente}! Sua visita da {os} está marcada para {data}. O técnico avisa quando estiver a caminho.", "agendada"],
  ["MOD-03", "Orçamento pronto", "whatsapp", "{cliente}, o orçamento da {os} está pronto: {valor}, válido até {data}. Veja e aprove por aqui: {link}", "aguardando_aprovacao"],
  ["MOD-04", "Orçamento aprovado", "whatsapp", "Recebemos a aprovação da {os}, {cliente}. O serviço fica marcado para {data}.", "aprovada"],
  ["MOD-05", "Aguardando peça", "whatsapp", "{cliente}, a peça da {os} atrasou no fornecedor. A nova previsão é {data}. Avisamos assim que chegar.", "aguardando_peca"],
  ["MOD-06", "Serviço concluído", "whatsapp", "Serviço da {os} concluído, {cliente}! O valor é {valor}. Pague com Pix pelo link: {link}", "pronta"],
  ["MOD-07", "Pix para pagamento", "whatsapp", "Segue o Pix da {os}: {valor}. O código vale por 30 minutos. Pagar: {link}"],
  ["MOD-08", "Pesquisa de satisfação", "email", "Olá, {cliente}. Como foi o serviço da {os}? Sua nota nos ajuda a melhorar: {link}", "entregue"],
]
export const modelos = colecao<Modelo>("modelos", () => MODELOS.map(([id, nome, canal, texto, gatilho]) => ({
  id, nome, canal, texto, gatilho, atualizadoEm: iso(nov(2, 10)), versao: 1,
  historico: [{ em: iso(nov(2, 10)), quem: { tipo: "pessoa", nome: "Marina Duarte" }, texto: "Modelo criado" }],
})))
export const VARIAVEIS = ["{cliente}", "{os}", "{data}", "{valor}", "{link}"] as const
const r$ = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const dm = (s?: string) => (s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "")

/** Valores das variáveis para uma conversa (OS ligada ou a última OS do cliente). */
export function variaveisDa(cv: Pick<Conversa, "clienteId" | "ref"> | null) {
  const c = cv ? clientes.porId(cv.clienteId) : undefined
  const os = cv ? (pedidos.porId(cv.ref) ?? pedidos.ler().filter((p) => p.clienteId === cv.clienteId).at(-1)) : undefined
  const data = os ? (os.etapa === "aguardando_aprovacao" ? os.orcamento?.validoAte : os.prazo) : undefined
  return {
    // pessoa física pelo primeiro nome; empresa pelo nome inteiro ("Oi, Padaria!" não serve)
    cliente: c ? (c.tipo === "pf" ? c.nome.split(" ")[0] : c.nome) : "",
    os: os?.id ?? "",
    data: dm(data),
    valor: os?.total ? r$(os.total) : "",
    link: os ? `oficinanorte.com.br/conta/pedido/?id=${os.id}` : "oficinanorte.com.br/conta/",
  }
}
/** Exemplo da prévia ao vivo dos modelos: a OS-1052 da Juliana. */
export const variaveisDeExemplo = () => variaveisDa({ clienteId: "C-0007", ref: "OS-1052" })
/** Troca {cliente}, {os}… pelos valores; variável sem valor fica visível para a pessoa completar. */
export const preencher = (texto: string, v: Record<string, string>) => texto.replace(/\{(\w+)\}/g, (m, k) => v[k] || m)

// ---------- mensagens automáticas (derivadas, nunca gravadas) ----------
export type Linha = Mensagem & { automatica?: { ref: string; modelo?: string } }
const modeloDoGatilho = (para?: string) => modelos.ler().find((m) => m.gatilho === para)?.nome

function fraseDoEvento(os: Pedido, e: Evento): string | undefined {
  const ctx = ctxDaOS(os)
  if (e.eixo === "pagamento") return PAGAMENTO.pago.cliente?.({ quando: e.em })
  if (e.eixo === "etapa" && e.para && e.para in ETAPA_OS) return ETAPA_OS[e.para as EtapaOS].cliente?.(ctx)
  if (/pedido (recebido|criado)/i.test(e.texto)) return ETAPA_OS.solicitada.cliente?.(ctx)
  return undefined
}

/** O que o sistema mandou ao cliente nesta conversa: eventos da OS ligada (e das outras OS dele desde que a conversa
 *  começou) que o cliente vê, mais o orçamento enviado. Texto da projeção; lido a cada render. */
export function automaticasDa(cv: Conversa, lista: Pedido[]): Linha[] {
  const desde = cv.criadaEm
  const out: Linha[] = []
  for (const os of lista) {
    if (os.clienteId !== cv.clienteId) continue
    const ligada = os.id === cv.ref
    const vale = (em: string) => ligada || em >= desde
    os.historico.forEach((e, i) => {
      if (!e.cliente || !vale(e.em)) return
      const texto = fraseDoEvento(os, e)
      if (!texto) return
      out.push({ id: `auto-${os.id}-${i}`, conversaId: cv.id, direcao: "saida", autor: "Mensagem automática", texto, em: e.em, estado: "entregue",
        automatica: { ref: os.id, modelo: modeloDoGatilho(e.para) } })
    })
    const env = os.orcamento?.enviadoEm
    if (env && vale(env) && !os.historico.some((e) => e.para === "aguardando_aprovacao" && e.cliente)) {
      const texto = ETAPA_OS.aguardando_aprovacao.cliente?.({ valor: os.total, ate: os.orcamento?.validoAte })
      if (texto) out.push({ id: `auto-${os.id}-orc`, conversaId: cv.id, direcao: "saida", autor: "Mensagem automática", texto, em: env, estado: "entregue",
        automatica: { ref: os.id, modelo: modeloDoGatilho("aguardando_aprovacao") } })
    }
  }
  // BASE: a Agenda ainda não marca `cliente: true` ao remarcar ou confirmar; o aviso de remarcação ("será avisada por
  // WhatsApp") é lido aqui pelo texto do evento até a Agenda gravar o evento do cliente.
  for (const a of agendamentos.ler()) {
    if (a.clienteId !== cv.clienteId) continue
    a.historico.forEach((e, i) => {
      if (e.em < desde || !(e.cliente || /^Remarcado/.test(e.texto))) return
      const ini = new Date(a.inicio)
      const quando = `${ini.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")}, ${ini.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      out.push({ id: `auto-${a.id}-${i}`, conversaId: cv.id, direcao: "saida", autor: "Mensagem automática",
        texto: e.cliente ? e.texto : `Sua visita ${a.id} mudou para ${quando}.`, em: e.em, estado: "entregue", automatica: { ref: a.id } })
    })
  }
  return out
}

// ---------- notificações ----------
const NOTIF: [para: string, tipo: TipoNotificacao, titulo: string, texto: string, ref: string, link: string, em: Date, lida: boolean][] = [
  ["marina", "mensagem", "Juliana Castro perguntou sobre o orçamento", "“O orçamento inclui a instalação do suporte?” · CV-0031", "CV-0031", "mensagens/?conversa=CV-0031", nov(16, 9, 18), false],
  ["marina", "mensagem", "Mensagem não enviada para Marcos Teixeira", "O Pix da OS-1061 não saiu. Tente de novo na conversa.", "CV-0033", "mensagens/?conversa=CV-0033", nov(16, 9, 31), false],
  ["marina", "os", "OS-1058 pedida pelo site há 2 h", "Escola Pequeno Saber, sem horário. Agende a visita.", "OS-1058", "pedidos/?id=OS-1058", nov(16, 7, 40), false],
  ["marina", "agenda", "Conflito na agenda do Bruno hoje", "AG-3315 e AG-3316 se sobrepõem às 14:30. Mova um deles.", "AG-3316", "agenda/", nov(16, 7, 0), false],
  ["marina", "os", "OS-1050 sem resposta do cliente", "Academia Movimento: o orçamento de R$ 2.340,00 vence em 20/11.", "OS-1050", "pedidos/?id=OS-1050", nov(16, 8, 0), false],
  ["marina", "mensagem", "Escola Pequeno Saber mandou 2 mensagens", "Pelo portal · CV-0036", "CV-0036", "mensagens/?conversa=CV-0036", nov(16, 7, 42), false],
  ["marina", "pagamento", "OS-1061 aguardando Pix", "Marcos Teixeira, R$ 220,00. O envio do código falhou na conversa.", "OS-1061", "pedidos/?id=OS-1061", nov(16, 9, 32), false],
  ["marina", "os", "OS-1044 com nova previsão: 19/11", "O fornecedor atrasou a peça. Clínica Vida Plena já foi avisada.", "OS-1044", "pedidos/?id=OS-1044", nov(14, 11, 0), true],
  ["marina", "os", "OS-1056 aprovada pelo portal", "Cafeteria Grão Moído aprovou R$ 650,00.", "OS-1056", "pedidos/?id=OS-1056", nov(13, 16, 20), true],
  ["marina", "mensagem", "Sônia (Padaria Pão de Mel) respondeu", "Por e-mail · CV-0034", "CV-0034", "mensagens/?conversa=CV-0034", nov(16, 9, 5), true],
  ["marina", "agenda", "AG-3340 pedido pelo site", "Rafael Moreira, qua 18/11 9:00. Confirme até hoje, 17:00.", "AG-3340", "agenda/", nov(15, 20, 10), true],
  ["marina", "os", "OS-1048 pronta para cobrar", "Troca de tomadas do estúdio: R$ 390,00.", "OS-1048", "pedidos/?id=OS-1048", nov(15, 17, 0), true],
  ["marina", "pagamento", "OS-1044 com sinal pago", "Clínica Vida Plena pagou o sinal.", "OS-1044", "pedidos/?id=OS-1044", nov(12, 15, 0), true],
  ["marina", "mensagem", "Ló D'Ávila perguntou do sábado", "Respondida por Ana Lima · CV-0041", "CV-0041", "mensagens/?conversa=CV-0041", nov(12, 10, 0), true],
  ["marina", "os", "OS-1050 enviada para aprovação", "Academia Movimento · vence 20/11.", "OS-1050", "pedidos/?id=OS-1050", nov(10, 15, 0), true],
  ["marina", "mensagem", "Companhia Brasileira enviou um e-mail longo", "Pedido de laudo dos três galpões · CV-0040", "CV-0040", "mensagens/?conversa=CV-0040", nov(13, 14, 2), true],
  ["ana", "mensagem", "Juliana Castro perguntou sobre o orçamento", "CV-0031 está atribuída a você.", "CV-0031", "mensagens/?conversa=CV-0031", nov(16, 9, 18), false],
  ["ana", "mensagem", "Rafael Moreira quer saber da visita", "AG-3340 · CV-0032", "CV-0032", "mensagens/?conversa=CV-0032", nov(16, 7, 58), false],
  ["ana", "agenda", "AG-3340 pedido pelo site", "Rafael Moreira, qua 18/11 9:00. Confirme até hoje, 17:00.", "AG-3340", "agenda/", nov(15, 20, 10), true],
  ["bruno", "os", "OS-1052: orçamento enviado", "Juliana Castro tem até 26/11 para aprovar.", "OS-1052", "pedidos/?id=OS-1052", nov(16, 8, 50), false],
  ["bruno", "agenda", "Dia cheio amanhã", "8 visitas na ter 17/11, das 8:00 às 18:00.", "AG-3320", "agenda/", nov(16, 7, 0), true],
  ["rogerio", "os", "OS-1099 atrasada desde 14/11", "O maior contrato do mês está parado. Fale com a Marina.", "OS-1099", "pedidos/?id=OS-1099", nov(16, 7, 0), false],
  ["rogerio", "pagamento", "Fechamento de sábado com diferença", "Caixa da Pampulha fechou com −R$ 12,50.", "OS-1061", "pedidos/?id=OS-1061", nov(14, 12, 30), true],
  ["helena", "pagamento", "OS-1061 aguardando Pix", "Marcos Teixeira, R$ 220,00.", "OS-1061", "pedidos/?id=OS-1061", nov(16, 9, 2), false],
  ["helena", "pagamento", "9 lançamentos vencidos", "O mais antigo vence há 400 dias.", "OS-1061", "pedidos/?id=OS-1061", nov(16, 7, 0), true],
]
export const notificacoes = colecao<Notificacao>("notificacoes", () => NOTIF.map(([para, tipo, titulo, texto, ref, link, em, lida], i) => ({
  id: `NT-${String(i + 1).padStart(3, "0")}`, para, tipo, titulo, texto, ref, link, em: iso(em), lida,
})))

/** Notificações derivadas do que o cliente fez numa OS (aprovou, pagou): vão para o responsável e para a gestora. */
function derivadas(lista: Pedido[], marcas: Map<string, Notificacao>): Notificacao[] {
  const out: Notificacao[] = []
  for (const os of lista) {
    os.historico.forEach((e, i) => {
      if (e.quem.tipo !== "cliente" || e.em < iso(nov(9))) return
      const id = `EV-${os.id}-${i}`
      const base = { ref: os.id, link: `pedidos/?id=${os.id}`, em: e.em, tipo: (e.eixo === "pagamento" ? "pagamento" : "os") as TipoNotificacao, derivada: true }
      for (const para of [os.responsavelId, "gestora"].filter(Boolean) as string[]) {
        const chave = `${id}-${para}`
        out.push({ ...base, id: chave, para, titulo: `${os.id}: ${e.texto.charAt(0).toLowerCase()}${e.texto.slice(1)}`, texto: `${e.quem.nome} · ${os.titulo}`, lida: marcas.get(chave)?.lida ?? false })
      }
    })
  }
  return out
}

/** As notificações de uma pessoa (pelo id e pelo papel), da mais nova para a mais antiga. */
export function notificacoesDe(papel: Papel, lista = notificacoes.ler(), ps = pedidos.ler()): Notificacao[] {
  const eu = papel === papelAtual() ? pessoaAtual() : pessoaDoPapel(papel)
  const marcas = new Map(lista.filter((n) => n.derivada).map((n) => [n.id, n]))
  const minhas = (n: Notificacao) => n.para === eu.id || n.para === papel
  return [...lista.filter((n) => !n.derivada), ...derivadas(ps, marcas)].filter(minhas).sort((a, b) => b.em.localeCompare(a.em))
}

// ---------- quem pode ver qual conversa ----------
/** Contexto de permissão: o técnico só vê a conversa da OS dele ("proprias"); conversa sem OS não é de técnico. */
export function ctxDaConversa(cv: Conversa) {
  const os = pedidos.porId(cv.ref)
  const ag = !os ? agendamentos.porId(cv.ref) : undefined
  return { responsavelId: os?.responsavelId ?? ag?.recursoId ?? "", unidade: os?.unidade }
}
export const podeVer = (papel: Papel, cv: Conversa) => pode(papel, "mensagens", ctxDaConversa(cv))
/** Quem pode receber uma conversa: quem conversa com cliente, menos os técnicos (a conversa deles vem da OS). */
export const ATENDENTES_POSSIVEIS: Pessoa[] = EQUIPE.filter((p) => p.papel !== "tecnico" && pode(p.papel, "mensagens"))

// ---------- falhas de envio desta sessão (o texto fica no balão, D1) ----------
export type Falha = { id: string; conversaId: string; texto: string; em: string; modeloId?: string }
let falhas: Falha[] = []
const ouvintesFalha = new Set<() => void>()
const VAZIA: Falha[] = []
const avisarFalhas = () => ouvintesFalha.forEach((f) => f())
export const useFalhas = () => useSyncExternalStore((f) => (ouvintesFalha.add(f), () => { ouvintesFalha.delete(f) }), () => falhas, () => VAZIA)
const tirarFalha = (id: string) => { falhas = falhas.filter((f) => f.id !== id); avisarFalhas() }

// ---------- ações ----------
/** Os tiques andam sozinhos depois do envio: enviada → entregue (o "outro lado" confirma). */
function entregarDepois(id: string, ms = 1400) {
  if (typeof window === "undefined") return
  setTimeout(() => mudarComoOutraPonta((d) => {
    const m = d(mensagens).find((x) => x.id === id)
    if (m && m.estado === "enviada") m.estado = "entregue"
  }), ms)
}

let seqFalha = 0
/** Enviar mensagem ao cliente (P: afeta terceiro). Na falha, nada é gravado e o texto fica num balão com Tentar de novo. */
export async function enviarMensagem(cv: Conversa, texto: string, modeloId?: string) {
  const c = clientes.porId(cv.clienteId)
  const porEmail = cv.canal === "whatsapp" && c && !c.whatsappConsentido
  const id = proximoId(mensagens.ler(), "M", 4000)
  const eu = pessoaAtual()
  const em = agora().toISOString()
  const r = await acao({
    // a falha aparece no balão com "Tentar de novo": sem toast repetindo
    rotulo: `enviar a mensagem para ${nomeCliente(cv.clienteId)}`, modo: "pessimista", ids: [cv.id], silenciosa: ["falha"],
    capacidade: "mensagens", contexto: ctxDaConversa(cv),
    aplicar: (d) => {
      d(mensagens).push({ id, conversaId: cv.id, direcao: "saida", autor: eu.nome, texto, em: agora().toISOString(), estado: "enviada", modeloId, canal: porEmail ? "email" : undefined })
      const x = d(conversas).find((y) => y.id === cv.id)
      // responder reabre a conversa resolvida: ela volta para as abertas, esperando o cliente
      if (x) { x.naoLidas = 0; x.estado = "aguardando_cliente"; x.atribuidaA ??= eu.id }
    },
  })
  if (r.ok) entregarDepois(id)
  else if (r.motivo === "falha") { falhas = [...falhas, { id: `F-${++seqFalha}`, conversaId: cv.id, texto, em, modeloId }]; avisarFalhas() }
  return r
}

/** Tentar de novo: uma falha desta sessão (reenvia o mesmo texto) ou a mensagem gravada como "falhou" (semente). */
export async function tentarDeNovo(cv: Conversa, alvo: { falha: Falha } | { mensagem: Mensagem }) {
  if ("falha" in alvo) { tirarFalha(alvo.falha.id); return enviarMensagem(cv, alvo.falha.texto, alvo.falha.modeloId) }
  const m = alvo.mensagem
  const r = await acao({
    rotulo: `reenviar a mensagem para ${nomeCliente(cv.clienteId)}`, modo: "pessimista", ids: [cv.id, m.id],
    capacidade: "mensagens", contexto: ctxDaConversa(cv),
    aplicar: (d) => { const x = d(mensagens).find((y) => y.id === m.id); if (x) { x.estado = "enviada"; x.em = agora().toISOString() } },
  })
  if (r.ok) entregarDepois(m.id)
  return r
}
export const descartarFalha = (f: Falha) => tirarFalha(f.id)

/** Marcar como lida ao abrir (O, silenciosa: já aparece na tela). */
export function marcarLida(cv: Conversa, lida = true) {
  const antes = cv.naoLidas
  return acao({
    rotulo: lida ? `marcar ${cv.id} como lida` : `marcar ${cv.id} como não lida`, ids: [cv.id], capacidade: "mensagens", contexto: ctxDaConversa(cv),
    aplicar: (d) => { const x = d(conversas).find((y) => y.id === cv.id); if (x) x.naoLidas = lida ? 0 : Math.max(1, antes) },
    sucesso: lida ? undefined : `${cv.id} marcada como não lida.`,
  })
}

/** Atribuir (O + Desfazer). */
export function atribuir(cv: Conversa, pessoaId: string) {
  const antes = cv.atribuidaA
  const p = pessoaPorId(pessoaId)
  return acao({
    rotulo: `atribuir ${cv.id}`, ids: [cv.id], capacidade: "mensagens", contexto: ctxDaConversa(cv),
    aplicar: (d) => { const x = d(conversas).find((y) => y.id === cv.id); if (x) { x.atribuidaA = pessoaId; x.historico.push(eventoDaSessao(`Atribuída a ${p?.nome}`)) } },
    desfazer: (d) => { const x = d(conversas).find((y) => y.id === cv.id); if (x) x.atribuidaA = antes },
    sucesso: `${cv.id} atribuída a ${p?.curto ?? "alguém"}.`,
  })
}

/** Resolver ou reabrir (O + Desfazer). */
export function resolver(cv: Conversa, resolvida = true) {
  const antes = cv.estado
  return acao({
    rotulo: resolvida ? `resolver ${cv.id}` : `reabrir ${cv.id}`, ids: [cv.id], capacidade: "mensagens", contexto: ctxDaConversa(cv),
    aplicar: (d) => { const x = d(conversas).find((y) => y.id === cv.id); if (x) { x.estado = resolvida ? "resolvida" : "aberta"; x.naoLidas = 0; x.historico.push(eventoDaSessao(resolvida ? "Resolvida" : "Reaberta")) } },
    desfazer: (d) => { const x = d(conversas).find((y) => y.id === cv.id); if (x) x.estado = antes },
    sucesso: resolvida ? `${cv.id} resolvida.` : `${cv.id} reaberta.`,
  })
}

/** Marcar uma notificação como lida ao abri-la (O, silenciosa). Derivada: grava só a marca. */
export function lerNotificacao(n: Notificacao) {
  if (n.lida) return
  return acao({
    rotulo: "marcar a notificação como lida",
    aplicar: (d) => {
      const l = d(notificacoes)
      const x = l.find((y) => y.id === n.id)
      if (x) x.lida = true
      else l.push({ ...n, lida: true, derivada: true })
    },
  })
}

/** Marcar todas como lidas (O + Desfazer). */
export function lerTodas(lista: Notificacao[]) {
  const alvo = lista.filter((n) => !n.lida)
  if (!alvo.length) return
  const ids = new Set(alvo.map((n) => n.id))
  return acao({
    rotulo: "marcar todas as notificações como lidas",
    aplicar: (d) => {
      const l = d(notificacoes)
      for (const n of alvo) { const x = l.find((y) => y.id === n.id); if (x) x.lida = true; else l.push({ ...n, lida: true, derivada: true }) }
    },
    desfazer: (d) => { for (const x of d(notificacoes)) if (ids.has(x.id)) x.lida = false },
    sucesso: `${alvo.length} ${alvo.length === 1 ? "notificação marcada" : "notificações marcadas"} como ${alvo.length === 1 ? "lida" : "lidas"}.`,
  })
}

/** Salvar modelo (O). */
export function salvarModelo(m: Modelo, mudancas: Pick<Modelo, "nome" | "texto" | "canal" | "gatilho">) {
  const antes = { nome: m.nome, texto: m.texto, canal: m.canal, gatilho: m.gatilho }
  return acao({
    rotulo: `salvar o modelo ${m.nome}`, ids: [m.id], capacidade: "mensagens_modelos",
    conferir: { colecao: modelos, id: m.id, versao: m.versao },
    aplicar: (d) => { const x = d(modelos).find((y) => y.id === m.id); if (x) { Object.assign(x, mudancas); x.atualizadoEm = agora().toISOString(); x.historico.push(eventoDaSessao("Modelo editado")) } },
    desfazer: (d) => { const x = d(modelos).find((y) => y.id === m.id); if (x) Object.assign(x, antes) },
    sucesso: "Modelo salvo.",
  })
}

/** Novo modelo (O): nasce com um texto de partida e abre no editor. */
export function criarModelo() {
  const n = Math.max(8, ...modelos.ler().map((m) => Number(m.id.slice(4)) || 0)) + 1
  const novoId = `MOD-${String(n).padStart(2, "0")}`
  const em = agora().toISOString()
  void acao({
    rotulo: "criar o modelo", ids: [novoId], capacidade: "mensagens_modelos",
    aplicar: (d) => { d(modelos).push({ id: novoId, nome: "Modelo sem nome", texto: "Oi, {cliente}! ", canal: "whatsapp", atualizadoEm: em, versao: 1, historico: [eventoDaSessao("Modelo criado")] }) },
  })
  return novoId
}

function eventoDaSessao(texto: string): Evento {
  return { em: agora().toISOString(), quem: { tipo: "pessoa", nome: pessoaAtual().nome }, texto }
}

// ---------- simular a outra ponta (D10) ----------
let aberta: string | null = null
/** A tela de conversa diz qual está aberta: "Cliente responde no WhatsApp" responde nela. */
export const marcarConversaAberta = (id: string | null) => { aberta = id }
const RESPOSTAS_CLIENTE = ["Entendi, obrigada! Pode seguir então.", "Consegue vir na quinta de manhã?", "Perfeito, vou aprovar pelo portal agora.", "Ah, e o técnico precisa de escada?"]
let respostas = 0
export function clienteResponde() {
  const cv = conversas.porId(aberta) ?? conversas.porId("CV-0031")
  if (!cv) return
  const c = clientes.porId(cv.clienteId)
  const texto = RESPOSTAS_CLIENTE[respostas++ % RESPOSTAS_CLIENTE.length]
  const em = agora().toISOString()
  mudarComoOutraPonta((d) => {
    const ms = d(mensagens)
    // o cliente leu o que recebeu antes de responder
    for (const m of ms) if (m.conversaId === cv.id && m.direcao === "saida" && (m.estado === "enviada" || m.estado === "entregue")) m.estado = "lida"
    ms.push({ id: proximoId(ms, "M", 4000), conversaId: cv.id, direcao: "entrada", autor: c?.nome ?? "Cliente", texto, em, estado: "recebida" })
    const x = d(conversas).find((y) => y.id === cv.id)
    if (x) { x.naoLidas += 1; x.estado = "aberta" }
    const ns = d(notificacoes)
    const n = Math.max(25, ...ns.map((y) => Number(y.id.slice(3)) || 0)) + 1
    ns.push({ id: `NT-${String(n).padStart(3, "0")}`,
      para: x?.atribuidaA ?? "gestora", tipo: "mensagem", titulo: `${c?.nome ?? "Cliente"} respondeu no ${CANAL[cv.canal]}`,
      texto: `“${texto}” · ${cv.id}`, ref: cv.id, link: `mensagens/?conversa=${cv.id}`, em, lida: false })
  }, [cv.id])
}

/** Ordem da caixa: a conversa com a mensagem mais recente primeiro. */
export function ultimaPorConversa(ms: Mensagem[]) {
  const m = new Map<string, Mensagem>()
  for (const x of ms) { const a = m.get(x.conversaId); if (!a || x.em > a.em) m.set(x.conversaId, x) }
  return m
}
