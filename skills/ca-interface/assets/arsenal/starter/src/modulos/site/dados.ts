// Módulo Site e landing (5.13 e 6; persona Juliana) · a camada de dados do visitante: o carrinho, as vendas online,
// os "Avise-me", o CEP e o frete, e as ações que levam do site ao Portal (agendar com Pix, pedir avaliação, fechar
// compra, criar conta). Declara só o que é do site (`carrinho_site`, `vendas_site`, `interessados_site`); grava nas
// coleções dos donos pela acao(): clientes (lead novo ou o achado pelo e-mail), pedidos (a OS), agendamentos (a
// reserva vira o pedido de horário), lancamentos do Financeiro (o título com o Pix, `codigoPix` e `idE2E` de lá) e
// produtos do Estoque (a reserva dos itens vendidos). Toda escrita é P (dinheiro, terceiro), menos o carrinho (O).
// Nunca Date.now(), new Date() sem argumento ou Math.random(): o relógio é o do protótipo (agora()).
import { acao, colecao, mudarComoOutraPonta, proximoId, type Evento, type Rascunho, type Resultado } from "@/proto/dados"
import { agora, DIA, MIN } from "@/proto/relogio"
import { EMPRESA, RECURSOS, recursoPorId, servicoPorSlug, type Unidade } from "@/proto/negocio"
import { SITE, LOJA } from "@/proto/site"
import { clientes, type Cliente, type Endereco } from "@/modulos/clientes/dados"
import { pedidos, type Pedido } from "@/modulos/pedidos/dados"
import { agendamentos, ocupa, RESERVA_MIN, usarReserva, type Agendamento } from "@/modulos/agenda/dados"
import { codigoPix, idE2E, lancamentos, pixExpirado, type Lancamento } from "@/modulos/financeiro/dados"
import { produtos, saldoTotal, estadoDoProduto, type Produto } from "@/modulos/estoque/dados"
import { situacaoDoModulo, useSituacaoDoModulo, type Situacao as SituacaoModulo } from "@/proto/modulos"
import type { ConsultaCep } from "@/lib/cep"

const site = { tipo: "sistema" as const, nome: "Site" }
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const centavos = (v: number) => Math.round(v * 100) / 100
/** U+2011, o hífen que não quebra: "ar-condicionado" nunca quebra em "ar-" / "condicionado" nos títulos. */
const HIFEN_INTEIRO = String.fromCharCode(0x2011)
export const semQuebra = (t: string) => t.replace(/\b(ar)-(condicionado)/gi, `$1${HIFEN_INTEIRO}$2`)

// ---------------------------------------------------------------------------------------------------------------
// Loja ligada ou desligada (Configurações, EST-47)
// ---------------------------------------------------------------------------------------------------------------
// A situação vem do registro (`ativo`/`situacaoDoModulo`); a casca do site (SiteLayout) lê a mesma chave antes da pintura.
export const situacaoDaLoja = (): SituacaoModulo => situacaoDoModulo("loja")
export const useSituacaoDaLoja = (): SituacaoModulo => useSituacaoDoModulo("loja")
const lojaFechada: Resultado = { ok: false, motivo: "falha", mensagem: "A loja online está fechada agora. A venda no balcão da Pampulha continua." }

// ---------------------------------------------------------------------------------------------------------------
// Coleções do site
// ---------------------------------------------------------------------------------------------------------------
/** Uma linha do carrinho deste aparelho (id = SKU). */
export type ItemCarrinho = { id: string; qtd: number; versao: number }
export const carrinho = colecao<ItemCarrinho>("carrinho_site", () => [])

export type Entrega = { tipo: "retirada" | "economica" | "expressa"; preco: number; prazo: string; cep?: string; endereco?: string }
export type ItemVenda = { sku: string; nome: string; qtd: number; unitario: number }
export type EstadoVendaSite = "aguardando_pix" | "pago" | "cancelada"
/** Venda da loja online (PED-). BASE: `pedidos` só tem OS; a venda mora aqui até a base ter o registro de venda. */
export type VendaSite = {
  id: string; clienteId: string; itens: ItemVenda[]; entrega: Entrega; subtotal: number; total: number
  lancamentoId: string; estado: EstadoVendaSite; criadoEm: string; versao: number; historico: Evento[]
}
export const vendasSite = colecao<VendaSite>("vendas_site", () => [], 1, { caminho: (v) => `financeiro/receber/?id=${v.lancamentoId}` })

/** "Avise-me": um produto esgotado ou uma cidade fora da área. */
export type Interessado = { id: string; email: string; sku?: string; cidade?: string; em: string; versao: number }
export const interessados = colecao<Interessado>("interessados_site", () => [])

// ---------------------------------------------------------------------------------------------------------------
// CEP e área de atendimento
// ---------------------------------------------------------------------------------------------------------------
// BASE: o adaptador de CEP da base (lib/cep.ts) responde pelas cidades fictícias do dados-br; o site precisa das faixas
//   de BH e região. Peça local: faixas reais das cidades e logradouros de exemplo fixos (sem Math.random).
const FAIXAS: { de: number; ate: number; cidade: string; bairros: string[] }[] = [
  { de: 30000, ate: 31999, cidade: "Belo Horizonte", bairros: ["Savassi", "Funcionários", "Pampulha", "Santa Efigênia", "Sion", "Cidade Nova"] },
  { de: 32000, ate: 32399, cidade: "Contagem", bairros: ["Eldorado", "Riacho", "Industrial"] },
  { de: 32600, ate: 32689, cidade: "Betim", bairros: ["Centro", "Brasileia", "Ingá"] },
  { de: 34000, ate: 34099, cidade: "Nova Lima", bairros: ["Vila da Serra", "Centro", "Jardim Canadá"] },
  { de: 34500, ate: 34799, cidade: "Sabará", bairros: ["Centro", "General Carneiro"] },
  { de: 35400, ate: 35419, cidade: "Ouro Preto", bairros: ["Centro", "Bauxita"] },
  { de: 32900, ate: 32999, cidade: "Igarapé", bairros: ["Centro"] },
]
const RUAS = ["Rua dos Timbiras", "Rua Pernambuco", "Rua Grão Mogol", "Rua Tupis", "Rua Ceará", "Rua Sergipe", "Rua Alagoas"]
const CEPS_FIXOS: Record<string, { logradouro: string; bairro: string; cidade: string }> = {
  "31340160": { logradouro: "Rua das Andorinhas", bairro: "Bandeirantes", cidade: "Belo Horizonte" }, // a jornada da Juliana (passo 3)
  "35400000": { logradouro: "", bairro: "Centro", cidade: "Ouro Preto" },
}
export const atendemos = (cidade?: string) => !!cidade && (SITE.cidades as readonly string[]).includes(cidade.trim())
export const frasesDaArea = {
  fora: (cidade: string) => `Ainda não atendemos ${cidade}. Atendemos ${SITE.cidades.slice(0, -1).join(", ")} e ${SITE.cidades.at(-1)}.`,
}

/** Consulta de CEP do site (o contrato do CampoCep): 350 ms, cancelável. */
export function consultarCep(cep: string, sinal: AbortSignal): Promise<ConsultaCep> {
  return new Promise((ok, falha) => {
    const t = setTimeout(() => {
      const fixo = CEPS_FIXOS[cep]
      if (fixo) return ok({ tipo: "encontrado", endereco: { ...fixo, uf: "MG" } })
      const n = Number(cep.slice(0, 5))
      const f = FAIXAS.find((x) => n >= x.de && n <= x.ate)
      if (!f) return ok({ tipo: "nao_encontrado" })
      const k = Number(cep.slice(5)) || n
      ok({ tipo: "encontrado", endereco: { logradouro: RUAS[k % RUAS.length], bairro: f.bairros[k % f.bairros.length], cidade: f.cidade, uf: "MG" } })
    }, 350)
    sinal.addEventListener("abort", () => { clearTimeout(t); falha(new DOMException("cancelado", "AbortError")) })
  })
}
export const cidadeDoCepLocal = (cep: string) => {
  if (CEPS_FIXOS[cep]) return CEPS_FIXOS[cep].cidade
  const n = Number(cep.slice(0, 5))
  return FAIXAS.find((x) => n >= x.de && n <= x.ate)?.cidade
}

// ---------------------------------------------------------------------------------------------------------------
// Frete (frete-por-cep): retirada no balcão, econômica e expressa, com data prevista (CLI-05)
// ---------------------------------------------------------------------------------------------------------------
const diaUtil = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  let falta = n
  while (falta > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0) falta-- }
  return x
}
const quando = (d: Date, ref: Date) => {
  const amanha = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1)
  return d.toDateString() === amanha.toDateString() ? "amanhã" : d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")
}
export type OpcaoFrete = { id: Entrega["tipo"]; rotulo: string; prazo: string; preco: number; rapida?: boolean }
/** As opções para um CEP (null: fora da área de entrega). Grátis na econômica acima de R$ 299,00. */
export function opcoesDeFrete(cep: string, subtotal: number, ref = agora()): OpcaoFrete[] | null {
  const cidade = cidadeDoCepLocal(cep)
  if (!atendemos(cidade)) return null
  const longe = cidade !== "Belo Horizonte" && cidade !== "Contagem"
  return [
    { id: "economica", rotulo: "Entrega econômica", prazo: `Chega até ${quando(diaUtil(ref, longe ? 3 : 2), ref)}`, preco: subtotal >= LOJA.freteGratisAcima ? 0 : longe ? 29.9 : 19.9 },
    { id: "expressa", rotulo: "Entrega expressa", prazo: `Chega ${quando(diaUtil(ref, 1), ref)}, até 18:00`, preco: longe ? 49.9 : 34.9, rapida: true },
  ]
}
export function retirada(ref = agora()): OpcaoFrete {
  // pago até 14:00 num dia de loja aberta, sai no mesmo dia (a frase "Retire hoje na Pampulha" da vitrine)
  const hoje = ref.getDay() !== 0 && ref.getHours() < (ref.getDay() === 6 ? 10 : 14)
  return { id: "retirada", rotulo: `Retirar no ${LOJA.retirada}`, prazo: hoje ? `Pronto hoje, a partir das ${ref.getDay() === 6 ? "11:00" : "16:00"}` : `Pronto ${quando(diaUtil(ref, 1), ref)}, a partir das 10:00`, preco: 0 }
}

// ---------------------------------------------------------------------------------------------------------------
// Produto na vitrine (projeção do cliente: sem custo, sem saldo por unidade, sem compra)
// ---------------------------------------------------------------------------------------------------------------
export type ProdutoVitrine = { sku: string; nome: string; categoria: string; preco: number; estado: ReturnType<typeof estadoDoProduto>; disponivel: number }
export const vitrine = (p: Produto): ProdutoVitrine => ({
  sku: p.id, nome: p.nome, categoria: p.categoria, preco: p.preco, estado: estadoDoProduto(p), disponivel: Math.max(0, saldoTotal(p) - p.reservado),
})
export const naVitrine = (p: Produto) => p.vendavelOnline

// ---------------------------------------------------------------------------------------------------------------
// Carrinho (O, sem toast: a tela já mostra)
// ---------------------------------------------------------------------------------------------------------------
export function adicionarAoCarrinho(sku: string, qtd = 1) {
  if (situacaoDaLoja() !== "ligado") return Promise.resolve(lojaFechada)
  return acao({
    rotulo: "pôr no carrinho", ids: [sku],
    aplicar: (d) => { const l = d(carrinho); const x = l.find((i) => i.id === sku); if (x) x.qtd += qtd; else l.push({ id: sku, qtd, versao: 1 }) },
  })
}
export function mudarQuantidade(sku: string, qtd: number) {
  return acao({
    rotulo: "mudar a quantidade", ids: [sku],
    aplicar: (d) => { const x = d(carrinho).find((i) => i.id === sku); if (x) x.qtd = Math.max(1, qtd) },
  })
}
export function tirarDoCarrinho(sku: string) {
  const antes = carrinho.porId(sku)
  const nome = produtos.porId(sku)?.nome ?? sku
  return acao({
    rotulo: "tirar do carrinho", ids: [sku],
    aplicar: (d) => { d.trocar(carrinho, d(carrinho).filter((i) => i.id !== sku)) },
    desfazer: antes ? (d) => { if (!d(carrinho).some((i) => i.id === sku)) d(carrinho).push({ ...antes }) } : undefined,
    sucesso: `${nome} saiu do carrinho.`,
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Quem compra ou agenda: acha pelo e-mail (sem duplicar) ou cria o lead (3.3)
// ---------------------------------------------------------------------------------------------------------------
export type DadosPessoais = { nome: string; email: string; celular: string; cpf: string }
const mesmoEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
export const clientePorEmail = (email: string, lista = clientes.ler()) => lista.find((c) => c.estado !== "anonimizado" && mesmoEmail(c.email, email))

function acharOuCriarCliente(d: Rascunho, p: DadosPessoais, end?: Endereco): Cliente {
  const lista = d(clientes)
  const achado = lista.find((c) => c.estado !== "anonimizado" && mesmoEmail(c.email, p.email))
  const em = agora().toISOString()
  if (achado) {
    achado.historico.push({ em, quem: { tipo: "cliente", nome: achado.nome }, texto: "Voltou pelo site" })
    return achado
  }
  const n = Math.max(0, ...lista.map((c) => Number(c.id.slice(2)) || 0)) + 1
  const novo: Cliente = {
    id: `C-${String(n).padStart(4, "0")}`, tipo: "pf", nome: p.nome.trim(), documento: p.cpf, email: p.email.trim().toLowerCase(), telefone: p.celular,
    whatsappConsentido: false, endereco: end ?? { cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "MG" }, etiquetas: [],
    estado: "lead", temConta: false, origem: "site", criadoEm: em, versao: 1,
    historico: [{ em, quem: { tipo: "cliente", nome: p.nome.trim() }, texto: "Cadastro pelo site" }],
  }
  lista.push(novo)
  return novo
}

// ---------------------------------------------------------------------------------------------------------------
// Agendar pelo site (5.13): a reserva vira OS + pedido de horário + título com Pix (preço fechado) ou só pedido (avaliação)
// ---------------------------------------------------------------------------------------------------------------
/** Paga no agendamento: preço fechado (limpeza, instalação até 12.000 BTU) ou por hora (montagem, o mínimo de 2 h). */
export const pagaNoAgendamento = (slug: string) => !!servicoPorSlug(slug)?.precoFechado
/** O valor cobrado no agendamento (a montagem cobra o mínimo de 2 h). */
export function valorDoAgendamento(slug: string) {
  const s = servicoPorSlug(slug)
  if (!s?.preco) return 0
  return s.porHora ? s.preco * (s.duracao / 60) : s.preco
}
export type PedidoDeAgendamento = { reservaId: string; servico: string; endereco: Endereco; pessoa: DadosPessoais; observacao?: string }
export type ResultadoAgendamento = Resultado & { osId?: string; lancamentoId?: string; expirou?: boolean }

const ultimaOrdem = (lista: Pedido[], etapa: Pedido["etapa"]) => Math.max(0, ...lista.filter((o) => o.etapa === etapa).map((o) => o.ordem)) + 1

export async function concluirAgendamento(p: PedidoDeAgendamento): Promise<ResultadoAgendamento> {
  const reserva = agendamentos.porId(p.reservaId)
  const ref = agora()
  if (!reserva || reserva.estado !== "reservado" || !ocupa(reserva, ref)) {
    return { ok: false, motivo: "falha", mensagem: "O horário guardado expirou. Escolha outro.", expirou: true }
  }
  const s = servicoPorSlug(p.servico)!
  const paga = pagaNoAgendamento(p.servico)
  const valor = valorDoAgendamento(p.servico)
  const osId = proximoId(pedidos.ler(), "OS", 1069)
  const lanId = paga ? proximoId(lancamentos.ler(), "LAN", 5040) : undefined
  const rec = recursoPorId(reserva.recursoId)
  const unidade: Unidade = rec?.unidade ?? "pampulha"
  let venceu = false
  const r = await acao({
    rotulo: paga ? "concluir o agendamento" : "enviar o pedido de avaliação", modo: "pessimista", silenciosa: true,
    ids: [osId, reserva.id, ...(lanId ? [lanId] : [])],
    conferir: { colecao: agendamentos, id: reserva.id, versao: reserva.versao },
    conflito: () => "O horário guardado mudou enquanto você preenchia. Escolha outro.",
    aplicar: (d) => {
      const em = agora().toISOString()
      // a reserva da Agenda vira o pedido de horário (usarReserva); vencida no instante de gravar, nada é gravado
      const viva = d(agendamentos).find((a) => a.id === reserva.id)
      if (!viva || viva.estado !== "reservado" || !ocupa(viva)) { venceu = true; return }
      const cli = acharOuCriarCliente(d, p.pessoa, p.endereco)
      const quem = { tipo: "cliente" as const, nome: cli.nome }
      usarReserva(d, reserva.id, {
        clienteId: cli.id, pedidoId: osId, estado: "solicitado", bairro: p.endereco.bairro, cidade: p.endereco.cidade, observacao: p.observacao?.trim() || undefined,
        endereco: `${p.endereco.logradouro}, ${p.endereco.numero}${p.endereco.complemento ? `, ${p.endereco.complemento}` : ""}`,
      })
      const lista = d(pedidos)
      const etapa: Pedido["etapa"] = paga ? "agendada" : "solicitada"
      lista.unshift({
        id: osId, tipo: "os", clienteId: cli.id, unidade, titulo: s.nome, servicoSlug: s.slug,
        itens: valor ? [{ descricao: s.nome, qtd: 1, unitario: valor, tipo: "mao_de_obra" }] : [], desconto: 0, total: valor,
        etapa, pagamento: paga ? "aguardando_pix" : "pendente", responsavelId: reserva.recursoId, agendamentoIds: [reserva.id],
        prazo: reserva.fim, checklist: ["Teste de funcionamento", "Local limpo e organizado", "Fotos do antes e depois", "Assinatura do cliente"].map((item) => ({ item, feito: false })),
        origem: "site", ordem: ultimaOrdem(lista, etapa), criadoEm: em, versao: 1,
        historico: [{ em, quem, texto: paga ? "Pedido feito pelo site" : "Pedido de avaliação feito pelo site", cliente: true, para: etapa, eixo: "etapa" }],
      })
      if (paga && lanId) d(lancamentos).push(novoTitulo(lanId, `${s.nome} · ${osId}`, "Serviços", valor, unidade, osId, cli.id, quem))
    },
  })
  if (!r.ok) return r
  if (venceu) return { ok: false, motivo: "falha", mensagem: "O horário guardado expirou. Escolha outro.", expirou: true }
  return { ok: true, osId, lancamentoId: lanId }
}

function novoTitulo(id: string, descricao: string, categoria: string, valor: number, unidade: Unidade, ref: string, clienteId: string, quem: Evento["quem"]): Lancamento {
  const em = agora()
  const expira = new Date(em.getTime() + EMPRESA.pixMinutos * MIN).toISOString()
  return {
    id, natureza: "receber", descricao, categoria, valor: centavos(valor), vencimento: em.toISOString(), unidade, meio: "pix",
    estado: "aguardando_pix", pixExpiraEm: expira, pixCodigo: codigoPix(id, valor, expira), ref, clienteId, versao: 1,
    historico: [{ em: em.toISOString(), quem, texto: `Gerou o código Pix no site (expira às ${hora(expira)})`, cliente: true }],
  }
}

// BASE: o gerarPix do Financeiro exige a capacidade "receber" do operador da barra F; o visitante não é papel da MATRIZ.
//   O site usa o codigoPix e o idE2E do Financeiro e grava o título pela acao(), como o Portal faz.
/** Gerar novo código depois de expirar (P). */
export function gerarNovoPix(lanId: string): Promise<Resultado> {
  const l = lancamentos.porId(lanId)
  if (!l) return Promise.resolve({ ok: false, motivo: "falha", mensagem: "Não achamos este pagamento." })
  const expira = new Date(agora().getTime() + EMPRESA.pixMinutos * MIN).toISOString()
  return acao({
    rotulo: "gerar o novo código Pix", modo: "pessimista", ids: [l.id], silenciosa: true,
    conferir: { colecao: lancamentos, id: l.id, versao: l.versao },
    aplicar: (d) => {
      const x = d(lancamentos).find((y) => y.id === l.id)
      if (!x || x.estado === "pago") return
      x.estado = "aguardando_pix"; x.pixExpiraEm = expira; x.pixCodigo = codigoPix(x.id, x.valor, expira)
      x.historico.push({ em: agora().toISOString(), quem: site, texto: `Gerou um novo código Pix no site (expira às ${hora(expira)})`, cliente: true })
    },
  })
}

/** O banco confirma o Pix (classe A: a tela muda sozinha). Sem id: todos os Pix abertos do site. */
export function bancoConfirmaPixDoSite(lanId?: string) {
  const ref = agora()
  const doSite = new Set([...pedidos.ler().filter((o) => o.origem === "site").map((o) => o.id), ...vendasSite.ler().map((v) => v.id)])
  const alvo = lancamentos.ler().filter((l) => l.estado === "aguardando_pix" && !pixExpirado(l, ref) && (lanId ? l.id === lanId : !!l.ref && doSite.has(l.ref)))
  if (!alvo.length) return false
  mudarComoOutraPonta((d) => {
    for (const a of alvo) {
      const x = d(lancamentos).find((y) => y.id === a.id)
      if (!x) continue
      const em = agora().toISOString()
      const quem = { tipo: "cliente" as const, nome: clientes.porId(x.clienteId)?.nome ?? "Cliente" }
      x.estado = "pago"; x.pagoEm = em; x.comprovanteId = idE2E(x.id, em)
      x.historico.push({ em, quem, texto: "Pagou com Pix", cliente: true }, { em, quem: { tipo: "sistema", nome: "Sistema" }, texto: "Pix confirmado pelo banco" })
      const os = d(pedidos).find((o) => o.id === x.ref)
      if (os) {
        os.pagamento = "pago"
        os.historico.push({ em, quem, texto: `Pagamento recebido (${x.id})`, eixo: "pagamento", cliente: true })
        for (const agId of os.agendamentoIds) {
          const ag = d(agendamentos).find((g) => g.id === agId)
          if (ag && ag.estado === "solicitado") { ag.estado = "confirmado"; ag.historico.push({ em, quem: { tipo: "sistema", nome: "Sistema" }, texto: "Confirmado: Pix pago no site" }) }
        }
      }
      const v = d(vendasSite).find((y) => y.id === x.ref)
      if (v) { v.estado = "pago"; v.historico.push({ em, quem, texto: "Pagou com Pix", cliente: true }) }
    }
  }, alvo.flatMap((a) => [a.id, ...(a.ref ? [a.ref] : [])]))
  return true
}

// ---------------------------------------------------------------------------------------------------------------
// Fechar a compra da loja (P): venda aguardando o Pix e os itens reservados no estoque
// ---------------------------------------------------------------------------------------------------------------
export type ResultadoCompra = Resultado & { pedidoId?: string; lancamentoId?: string }
export function proximoPED() {
  const nums = [...lancamentos.ler().map((l) => l.ref ?? ""), ...vendasSite.ler().map((v) => v.id)].filter((r) => r.startsWith("PED-")).map((r) => Number(r.slice(4)) || 0)
  return `PED-${Math.max(2214, ...nums) + 1}`
}
export async function fecharCompra(n: { itens: ItemCarrinho[]; entrega: Entrega; pessoa: DadosPessoais; endereco?: Endereco }): Promise<ResultadoCompra> {
  if (situacaoDaLoja() !== "ligado") return lojaFechada
  const linhas = n.itens.map((i) => ({ i, p: produtos.porId(i.id) })).filter((x): x is { i: ItemCarrinho; p: Produto } => !!x.p)
  const falta = linhas.find(({ i, p }) => !p.ativo || saldoTotal(p) - p.reservado < i.qtd)
  if (falta) return { ok: false, motivo: "conflito", mensagem: `${falta.p.nome}: sobraram ${Math.max(0, saldoTotal(falta.p) - falta.p.reservado)} na loja. Ajuste a quantidade no carrinho.` }
  const pedidoId = proximoPED()
  const lanId = proximoId(lancamentos.ler(), "LAN", 5040)
  const itens: ItemVenda[] = linhas.map(({ i, p }) => ({ sku: p.id, nome: p.nome, qtd: i.qtd, unitario: p.preco }))
  const subtotal = centavos(itens.reduce((s, i) => s + i.qtd * i.unitario, 0))
  const total = centavos(subtotal + n.entrega.preco)
  const r = await acao({
    rotulo: "fechar a compra", modo: "pessimista", silenciosa: true, ids: [pedidoId, lanId, ...itens.map((i) => i.sku)],
    conferir: linhas.map(({ p }) => ({ colecao: produtos, id: p.id, versao: p.versao })),
    conflito: (p) => `${(p as Produto).nome} mudou na loja enquanto você comprava. Confira o carrinho.`,
    aplicar: (d) => {
      const em = agora().toISOString()
      const cli = acharOuCriarCliente(d, n.pessoa, n.endereco)
      const quem = { tipo: "cliente" as const, nome: cli.nome }
      for (const it of itens) {
        const p = d(produtos).find((x) => x.id === it.sku)!
        p.reservado += it.qtd
        p.historico.push({ em, quem: site, texto: `Reservado ${it.qtd} para ${pedidoId} (loja online)` })
      }
      d(lancamentos).push(novoTitulo(lanId, `Venda online · ${pedidoId}`, "Vendas", total, "pampulha", pedidoId, cli.id, quem))
      d(vendasSite).unshift({
        id: pedidoId, clienteId: cli.id, itens, entrega: n.entrega, subtotal, total, lancamentoId: lanId, estado: "aguardando_pix", criadoEm: em, versao: 1,
        historico: [{ em, quem, texto: "Compra feita na loja online", cliente: true }],
      })
      d.trocar(carrinho, [])
    },
  })
  if (!r.ok) return r
  return { ok: true, pedidoId, lancamentoId: lanId }
}

// ---------------------------------------------------------------------------------------------------------------
// Criar conta na confirmação (CLI-21, CLI-30) e "Avise-me"
// ---------------------------------------------------------------------------------------------------------------
export const CODIGO_DEMONSTRACAO = "482913"
export function criarConta(clienteId: string): Promise<Resultado> {
  const c = clientes.porId(clienteId)
  if (!c) return Promise.resolve({ ok: false, motivo: "falha", mensagem: "Não achamos o cadastro deste pedido." })
  return acao({
    rotulo: "criar a conta", modo: "pessimista", ids: [c.id], silenciosa: true,
    aplicar: (d) => {
      const x = d(clientes).find((y) => y.id === c.id)
      if (!x || x.temConta) return
      x.temConta = true
      x.historico.push({ em: agora().toISOString(), quem: { tipo: "cliente", nome: x.nome }, texto: "Criou a conta do portal pelo site" })
    },
  })
}

export function aviseMe(email: string, alvo: { sku?: string; cidade?: string }): Promise<Resultado> {
  const id = `INT-${interessados.ler().length + 1}-${(alvo.sku ?? alvo.cidade ?? "").replace(/\W/g, "")}`
  return acao({
    rotulo: "guardar o aviso", modo: "pessimista", ids: [id], silenciosa: true,
    aplicar: (d) => {
      d(interessados).push({ id, email: email.trim().toLowerCase(), ...alvo, em: agora().toISOString(), versao: 1 })
      if (alvo.sku) { const p = d(produtos).find((x) => x.id === alvo.sku); if (p) p.avisame += 1 }
    },
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Confirmação (CLI-30): o que o visitante vê do pedido que acabou de fazer (projeção: sem custo, sem nota interna)
// ---------------------------------------------------------------------------------------------------------------
export type Confirmacao =
  | { tipo: "os"; id: string; servico: string; etapa: Pedido["etapa"]; total: number; inicio?: string; janelaAte?: string; tecnico?: string
      cliente: { id: string; nome: string; email: string; temConta: boolean }; titulo?: Lancamento; onde?: string }
  | { tipo: "venda"; id: string; venda: VendaSite; cliente: { id: string; nome: string; email: string; temConta: boolean }; titulo?: Lancamento }

/** Lê pelos dados vivos (as listas vêm dos hooks da tela). */
export function confirmacaoDe(id: string, f: { os: Pedido[]; ags: Agendamento[]; lans: Lancamento[]; vendas: VendaSite[]; clis: Cliente[] }): Confirmacao | null {
  const cli = (cid: string) => { const c = f.clis.find((x) => x.id === cid); return c ? { id: c.id, nome: c.nome, email: c.email, temConta: c.temConta } : null }
  if (id.startsWith("PED-")) {
    const v = f.vendas.find((x) => x.id === id)
    const c = v && cli(v.clienteId)
    return v && c ? { tipo: "venda", id, venda: v, cliente: c, titulo: f.lans.find((l) => l.id === v.lancamentoId) } : null
  }
  const o = f.os.find((x) => x.id === id && x.origem === "site")
  const c = o && cli(o.clienteId)
  if (!o || !c) return null
  const ag = f.ags.find((a) => o.agendamentoIds.includes(a.id))
  const ini = ag?.inicio
  // a janela é a que a Agenda guarda (fonte única): o portal e o painel leem o mesmo inicio/fim
  return {
    tipo: "os", id, servico: o.titulo, etapa: o.etapa, total: o.total, inicio: ini, janelaAte: ag?.fim,
    tecnico: recursoPorId(o.responsavelId)?.curto, cliente: c, titulo: f.lans.find((l) => l.ref === o.id), onde: ag ? `${ag.bairro}, ${ag.cidade}` : undefined,
  }
}

/** Avisos para a equipe (sino): o que chegou pelo site hoje e pede ação. */
export function avisosDoSite() {
  const ref = agora()
  const desde = ref.getTime() - DIA
  const os = pedidos.ler().filter((o) => o.origem === "site" && new Date(o.criadoEm).getTime() > desde && o.etapa !== "cancelada")
  const vendas = vendasSite.ler().filter((v) => v.estado === "pago")
  return [
    ...os.map((o) => ({ id: `site-${o.id}`, titulo: o.pagamento === "pago" ? "Novo agendamento pelo site" : o.etapa === "solicitada" ? "Pedido de avaliação pelo site" : "Agendamento pelo site aguardando Pix",
      texto: `${o.id} · ${o.titulo}`, caminho: `pedidos/?id=${o.id}`, prioridade: o.etapa === "solicitada" ? 1 : 2 })),
    ...vendas.map((v) => ({ id: `site-${v.id}`, titulo: "Venda online paga: separar", texto: `${v.id} · ${v.itens.length} ${v.itens.length === 1 ? "item" : "itens"}`, caminho: `financeiro/receber/?id=${v.lancamentoId}` })),
  ]
}

/** Simulação da outra ponta (barra F): outras pessoas guardam ter, 17/11, 10:00 no site com todos os técnicos livres. */
export function outraPessoaReserva(servico = "limpeza-split", inicio = new Date(2026, 10, 17, 10, 0)) {
  const s = servicoPorSlug(servico)!
  const fim = new Date(inicio.getTime() + s.duracao * MIN)
  const ref = agora()
  mudarComoOutraPonta((d) => {
    const lista = d(agendamentos)
    const livres = RECURSOS.filter((t) => !t.competencias.includes("bancada") && t.competencias.includes(s.competencia) &&
      !lista.some((a) => a.recursoId === t.id && ocupa(a, ref) && new Date(a.inicio) < fim && new Date(a.fim) > inicio))
    for (const t of livres) {
      lista.push({
        id: proximoId(lista, "AG", 3343), clienteId: "", servicoSlug: servico, recursoId: t.id, inicio: inicio.toISOString(), fim: fim.toISOString(),
        local: "domicilio", bairro: "Savassi", cidade: "Belo Horizonte", estado: "reservado", reservadoAte: new Date(ref.getTime() + RESERVA_MIN * MIN).toISOString(),
        origem: "site", versao: 1, historico: [{ em: ref.toISOString(), quem: site, texto: "Horário reservado no site" }],
      })
    }
  })
}
