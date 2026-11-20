// Módulo Configurações (5.11): a empresa, a marca, as unidades, as integrações (simuladas) e os módulos opcionais.
// Cada coleção tem um registro por assunto (a empresa é um só, as unidades são duas…) com `versao` e `historico`:
// salvar uma seção é otimista com Desfazer; a chave Pix, o gateway, testar, reconectar e ligar ou desligar são
// pessimistas (afetam a equipe toda ou o dinheiro). A aparência continua no localStorage do usuário (proto/aparencia).
// Integrações: nenhuma chave, token ou senha real; a "conta" de cada uma é um texto de exemplo.
import { acao, colecao, evento, mudarComoOutraPonta, type Colecao, type Evento, type Registro } from "@/proto/dados"
import { agora, nov } from "@/proto/relogio"
import { EMPRESA, UNIDADES, type Unidade } from "@/proto/negocio"
import { formatosDaProjecao, type Projecao } from "@/proto/projecao"
import type { Capacidade } from "@/proto/permissoes"
import { situacaoDoModulo, situacoesDosModulos, type Situacao, type SituacaoDoModulo } from "@/proto/modulos"

const { d, h } = formatosDaProjecao
const SISTEMA = { tipo: "sistema" as const, nome: "Sistema" }
const inicio = (texto: string, quando = nov(2, 9)): Evento => ({ em: quando.toISOString(), quem: SISTEMA, texto })

// ---------------------------------------------------------------- empresa
export type Faixa = { abre: string; fecha: string }
export type Horario = { semana: Faixa; sabado: Faixa | null }
export type Feriado = { data: string; nome: string }
export type Empresa = {
  id: "empresa"; versao: number; historico: Evento[]
  nome: string; razao: string
  /** Só os 14 caracteres (sem pontuação). */ cnpj: string
  /** Só os dígitos, com DDD. */ whatsapp: string
  email: string
  horario: Horario; feriados: Feriado[]
  garantiaDias: number; validadeDias: number
  /** Em centavos. */ taxaVisita: number
  pixMinutos: number; boletoDias: number
  pix: string
}
export const HORARIO_PADRAO: Horario = { semana: { abre: "08:00", fecha: "18:00" }, sabado: { abre: "08:00", fecha: "12:00" } }

export const empresa = colecao<Empresa>("config_empresa", () => [{
  id: "empresa", versao: 1, historico: [inicio("Dados da empresa cadastrados")],
  nome: EMPRESA.nome, razao: EMPRESA.razao,
  // a especificação pede DV válido; o 41.238.576/0001-09 do negocio.ts não fecha a conta (ver BASE no modulo.ts)
  cnpj: "41238576000179",
  whatsapp: EMPRESA.whatsapp.replace(/\D/g, ""), email: EMPRESA.email,
  horario: HORARIO_PADRAO,
  feriados: [
    { data: "2026-11-02", nome: "Finados" }, { data: "2026-11-15", nome: "Proclamação da República" },
    { data: "2026-11-20", nome: "Dia da Consciência Negra" }, { data: "2026-12-25", nome: "Natal" },
  ],
  garantiaDias: EMPRESA.garantiaDias, validadeDias: EMPRESA.validadeOrcamentoDias, taxaVisita: EMPRESA.taxaVisita * 100,
  pixMinutos: EMPRESA.pixMinutos, boletoDias: EMPRESA.boletoDias, pix: EMPRESA.pix,
}])

// ---------------------------------------------------------------- marca
export type Logo = "hexagono" | "monograma" | "gota"
export type CorDaMarca = "preset" | "oceano" | "brasa" | "mata" | "ametista"
export type Marca = { id: "marca"; versao: number; historico: Evento[]; nome: string; assinatura: string; logo: Logo; cor: CorDaMarca }

export const LOGOS: { id: Logo; nome: string }[] = [
  { id: "hexagono", nome: "Hexágono" }, { id: "monograma", nome: "Monograma" }, { id: "gota", nome: "Gota" },
]
/** Cores do banner da marca: corpo das dobras, fundo e luz das bordas (as do shader glass-fold). "preset" segue a aparência. */
export const CORES_DA_MARCA: { id: CorDaMarca; nome: string; cores: [string, string, string] | null }[] = [
  { id: "preset", nome: "Do preset", cores: null },
  { id: "oceano", nome: "Oceano", cores: ["#1e5bc8", "#050d24", "#8fd3ff"] },
  { id: "brasa", nome: "Brasa", cores: ["#c8501e", "#1c0905", "#ffc796"] },
  { id: "mata", nome: "Mata", cores: ["#1e8c5a", "#04140c", "#9ff0c8"] },
  { id: "ametista", nome: "Ametista", cores: ["#6a3cc8", "#0e0620", "#d2b4ff"] },
]

export const marca = colecao<Marca>("config_marca", () => [{
  id: "marca", versao: 1, historico: [inicio("Marca cadastrada")],
  nome: EMPRESA.nome, assinatura: "Climatização e manutenção em BH", logo: "hexagono", cor: "preset",
}])

// ---------------------------------------------------------------- unidades
export type UnidadeCfg = {
  id: Unidade; versao: number; historico: Evento[]
  nome: string; funcao: string
  cep: string; logradouro: string; numero: string; bairro: string; cidade: string; uf: string
  telefone: string; horario: Horario
}
export const unidades = colecao<UnidadeCfg>("config_unidades", () => [
  { id: "pampulha", versao: 1, historico: [inicio("Unidade cadastrada")], nome: UNIDADES.pampulha.nome, funcao: "Matriz, loja e bancada",
    cep: "31340160", logradouro: "Rua das Andorinhas", numero: "410", bairro: "Bandeirantes", cidade: "Belo Horizonte", uf: "MG",
    telefone: "3134567800", horario: HORARIO_PADRAO },
  { id: "contagem", versao: 1, historico: [inicio("Unidade cadastrada")], nome: UNIDADES.contagem.nome, funcao: "Base de campo e depósito",
    cep: "32315040", logradouro: "Av. das Indústrias", numero: "1.200", bairro: "Eldorado", cidade: "Contagem", uf: "MG",
    telefone: "3134567810", horario: HORARIO_PADRAO },
])
export const enderecoDe = (u: UnidadeCfg) => `${u.logradouro}, ${u.numero}, ${u.bairro}, ${u.cidade}/${u.uf}`

// ---------------------------------------------------------------- integrações (simuladas)
export type IdIntegracao = "whatsapp" | "pix" | "email" | "nfe"
export type EstadoIntegracao = "conectado" | "desligado" | "erro"
export type Teste = { em: string; ok: boolean; texto: string }
export type Integracao = { id: IdIntegracao; versao: number; historico: Evento[]; estado: EstadoIntegracao; desde: string; conta: string; teste?: Teste }

export const INTEGRACAO: Record<IdIntegracao, { nome: string; g: "o" | "a"; papel: string; pagamento?: boolean; queda: string; falhaNoTeste: string }> = {
  whatsapp: { nome: "WhatsApp", g: "o", papel: "Confirmações, orçamentos e conversas com o cliente.", queda: "Mensagens vão por e-mail até reconectar.",
    falhaNoTeste: "o número saiu da conta do WhatsApp Business. Reconecte para voltar a enviar." },
  pix: { nome: "Gateway Pix", g: "o", papel: "Gera o QR e confirma o pagamento sozinho.", pagamento: true, queda: "Os Pix ficam sem confirmação automática: dê baixa à mão.",
    falhaNoTeste: "o gateway não respondeu. Confira a conta de exemplo e tente de novo." },
  email: { nome: "E-mail", g: "o", papel: "Envia comprovantes, orçamentos e o resumo diário.", queda: "Os e-mails ficam na fila até voltar.",
    falhaNoTeste: "o servidor de envio recusou a conexão." },
  nfe: { nome: "Nota fiscal", g: "a", papel: "Emite a nota de serviço quando a OS é paga.", queda: "As notas ficam para emitir à mão.",
    falhaNoTeste: "o emissor não respondeu." },
}
/** Rótulos do estado da integração (BASE: deveriam morar na projecao.ts). */
export const ESTADO_INTEGRACAO: Record<EstadoIntegracao, Projecao> = {
  conectado: { rotulo: "Conectado", tom: "sucesso" },
  desligado: { rotulo: "Desligado", tom: "neutro" },
  erro: { rotulo: "Erro", tom: "perigo", detalhe: (c) => (c.desde ? `desde ${d(c.desde)}` : undefined) },
}
/** "o WhatsApp", "a Nota fiscal"; "do WhatsApp", "da Nota fiscal". */
export const oNome = (id: IdIntegracao) => `${INTEGRACAO[id].g} ${INTEGRACAO[id].nome}`
export const doNome = (id: IdIntegracao) => `d${oNome(id)}`
export const capacidadeDa = (i: { id: IdIntegracao }): Capacidade => (INTEGRACAO[i.id].pagamento ? "configuracoes_pagamento" : "configuracoes_empresa")
/** "WhatsApp desconectado desde 14/11 às 18:02. Mensagens vão por e-mail até reconectar." */
export const fraseDoErro = (i: Integracao) => `${INTEGRACAO[i.id].nome} desconectad${INTEGRACAO[i.id].g} desde ${d(i.desde)} às ${h(i.desde)}. ${INTEGRACAO[i.id].queda}`

export const integracoes = colecao<Integracao>("integracoes", () => [
  { id: "whatsapp", versao: 1, estado: "erro", desde: nov(14, 18, 2).toISOString(), conta: "(31) 3456-7800 · conta de exemplo",
    historico: [inicio("Conectado", nov(3, 10)), { em: nov(14, 18, 2).toISOString(), quem: SISTEMA, texto: "Desconectado: o número saiu da conta" }] },
  { id: "pix", versao: 1, estado: "conectado", desde: nov(3, 10, 4).toISOString(), conta: "Gateway de exemplo · ambiente de testes", historico: [inicio("Conectado", nov(3, 10, 4))] },
  { id: "email", versao: 1, estado: "conectado", desde: nov(3, 10, 6).toISOString(), conta: "atendimento@oficinanorte.com.br", historico: [inicio("Conectado", nov(3, 10, 6))] },
  { id: "nfe", versao: 1, estado: "desligado", desde: nov(3, 10, 8).toISOString(), conta: "Emissor de exemplo · série 1", historico: [inicio("Cadastrado, desligado", nov(3, 10, 8))] },
])

// ---------------------------------------------------------------- módulos opcionais (EST-47)
// A situação mora na base (src/proto/modulos.ts, lida pelo registro: `ativo(id)`); aqui ficam os textos dos opcionais, a
// tela de ligar e desligar e as ações. A coleção da base guarda só quem alguém mexeu: sem registro, está ligado desde a
// implantação (PADRAO_OPCIONAL).
export type IdOpcional = "estoque" | "loja"
export type SituacaoModulo = Situacao
export type ModuloOpcional = SituacaoDoModulo & { id: IdOpcional }

export const OPCIONAL: Record<IdOpcional, { nome: string; g: "o" | "a"; rota: string | null; some: string; dados: string; depende: string }> = {
  estoque: { nome: "Estoque", g: "o", rota: "estoque/", some: "Saldo, movimentações e compras saem da navegação, do Ctrl K e do sino.",
    dados: "Os produtos e as compras ficam guardados, só para leitura, até alguém religar.", depende: "A OS em Aguardando peça continua; só o atalho para a compra some." },
  loja: { nome: "Loja online", g: "a", rota: null, some: "O catálogo e o carrinho saem do site. A venda no balcão continua.",
    dados: "As vendas já feitas continuam em Pedidos.", depende: "O Pix das vendas online deixa de ser gerado no site." },
}
export const ESTADO_MODULO: Record<SituacaoModulo, Projecao> = {
  ligado: { rotulo: "Ligado", tom: "sucesso" },
  desligado: { rotulo: "Desligado", tom: "neutro", detalhe: (c) => (c.desde ? `desde ${d(c.desde)}` : undefined) },
  fora_do_ar: { rotulo: "Fora do ar", tom: "perigo", detalhe: (c) => (c.desde ? `desde ${d(c.desde)} ${h(c.desde)}` : undefined) },
}

/** A coleção da base (src/proto/modulos.ts), com o nome antigo: quem já importava continua funcionando. */
export const modulosOpcionais = situacoesDosModulos
// os módulos que existem neste starter (o scripts/modulos.mjs pode ter tirado o Estoque); a Loja é do Site: sempre
const PASTAS = new Set(Object.keys(import.meta.glob("../*/modulo.ts")).map((k) => k.split("/")[1]))
/** O módulo opcional existe neste starter? (Sem a pasta, não há o que ligar.) */
export const existeOpcional = (id: IdOpcional) => id === "loja" || PASTAS.has(id)
/** Os opcionais que a tela mostra. */
export const IDS_OPCIONAIS = (Object.keys(OPCIONAL) as IdOpcional[]).filter(existeOpcional)
/** Sem registro na base: ligado desde a implantação. */
const PADRAO_OPCIONAL = (id: IdOpcional): ModuloOpcional => ({
  id, versao: 0, situacao: "ligado", desde: nov(2, 9).toISOString(), quem: "Rogério Nunes", historico: [inicio(OPCIONAL[id].g === "a" ? "Ligada" : "Ligado")],
})
const comPadrao = (lista: SituacaoDoModulo[]) => IDS_OPCIONAIS.map((id) => (lista.find((m) => m.id === id) as ModuloOpcional | undefined) ?? PADRAO_OPCIONAL(id))
/** Os módulos opcionais, na tela (sempre os dois, com o padrão para quem ninguém mexeu). */
export const useModulosOpcionais = () => comPadrao(situacoesDosModulos.use())
/** Situação do módulo (fora do React). Atalho para `situacaoDoModulo` do registro; vale para qualquer id. */
export const situacaoDe = (id: string): SituacaoModulo => situacaoDoModulo(id)
/** O registro que a base guarda para o aviso (nome, gênero e o que acontece com os dados). */
const textosDoAviso = (id: IdOpcional) => ({ nome: OPCIONAL[id].nome, genero: OPCIONAL[id].g, dados: id === "estoque" ? OPCIONAL[id].dados : undefined })
/** Acha o registro no rascunho ou cria o do padrão (a base só guarda quem alguém mexeu). */
function registroNoRascunho(lista: SituacaoDoModulo[], id: IdOpcional) {
  let x = lista.find((y) => y.id === id)
  if (!x) { x = { ...PADRAO_OPCIONAL(id), versao: 1 }; lista.push(x) }
  return Object.assign(x, textosDoAviso(id))
}

// ---------------------------------------------------------------- ações
type ComHistorico = { id: string; versao: number; historico: Evento[] }
const clonar = <T,>(v: T): T => structuredClone(v)

/**
 * Salvar uma seção (O com Desfazer). `oQue` vai nas mensagens ("salvar o horário"); `sucesso`, no toast.
 * Confere a versão: se outra pessoa salvou antes, recusa com a frase de conflito e o rascunho fica na tela.
 */
export function salvarSecao<T extends ComHistorico>(c: Colecao<T>, r: T, novos: Partial<T>, oQue: string, sucesso: string, capacidade: Capacidade = "configuracoes_empresa") {
  const chaves = Object.keys(novos) as (keyof T)[]
  const antes = Object.fromEntries(chaves.map((k) => [k, clonar(r[k])])) as Partial<T>
  const achar = (lista: T[]) => lista.find((x) => x.id === r.id)!
  return acao({
    rotulo: oQue, capacidade, ids: [r.id],
    conferir: { colecao: c as unknown as Colecao<Registro>, id: r.id, versao: r.versao },
    aplicar: (dr) => { const x = achar(dr(c)); Object.assign(x, clonar(novos)); x.historico.push(evento(sucesso.replace(/\.$/, ""))) },
    desfazer: (dr) => { const x = achar(dr(c)); Object.assign(x, clonar(antes)); x.historico.push(evento("Desfez a última mudança")) },
    sucesso,
  })
}

/** Trocar a chave Pix (P): os próximos Pix vão para ela. Só o dono (integração de pagamento). */
export function trocarChavePix(e: Empresa, chave: string) {
  return acao({
    rotulo: "trocar a chave Pix", capacidade: "configuracoes_pagamento", modo: "pessimista", ids: [e.id],
    conferir: { colecao: empresa, id: e.id, versao: e.versao },
    aplicar: (dr) => { const x = dr(empresa)[0]; x.pix = chave; x.historico.push(evento(`Trocou a chave Pix para ${chave}`)) },
    sucesso: "Chave Pix trocada. Os próximos Pix vão para ela.",
  })
}

const agoraIso = () => agora().toISOString()
const horaAgora = () => h(agoraIso())

/** "Testar conexão" (P): o resultado fica no cartão (ok ou a falha com o motivo), sem toast. */
export function testarConexao(i: Integracao) {
  return acao({
    rotulo: `testar a conexão ${doNome(i.id)}`, capacidade: capacidadeDa(i), modo: "pessimista", ids: [i.id],
    aplicar: (dr) => {
      const x = dr(integracoes).find((y) => y.id === i.id)!
      const ok = x.estado === "conectado"
      x.teste = { em: agoraIso(), ok, texto: ok ? `Conexão OK às ${horaAgora()}.` : `Falhou às ${horaAgora()}: ${INTEGRACAO[i.id].falhaNoTeste}` }
      x.historico.push(evento(ok ? "Testou a conexão: OK" : "Testou a conexão: falhou"))
    },
  })
}

/** Reconectar (P) a integração com erro. */
export function reconectar(i: Integracao) {
  const nome = INTEGRACAO[i.id].nome
  return acao({
    rotulo: `reconectar ${oNome(i.id)}`, capacidade: capacidadeDa(i), modo: "pessimista", ids: [i.id],
    conferir: { colecao: integracoes, id: i.id, versao: i.versao },
    aplicar: (dr) => {
      const x = dr(integracoes).find((y) => y.id === i.id)!
      Object.assign(x, { estado: "conectado", desde: agoraIso(), teste: { em: agoraIso(), ok: true, texto: `Reconectado às ${horaAgora()}.` } })
      x.historico.push(evento("Reconectou"))
    },
    sucesso: `${nome} reconectad${INTEGRACAO[i.id].g}.`,
  })
}

/** Ligar ou desligar a integração (P, com confirmação). */
export function ligarIntegracao(i: Integracao, ligar: boolean) {
  const nome = INTEGRACAO[i.id].nome
  return acao({
    rotulo: `${ligar ? "ligar" : "desligar"} ${oNome(i.id)}`, capacidade: capacidadeDa(i), modo: "pessimista", ids: [i.id],
    conferir: { colecao: integracoes, id: i.id, versao: i.versao },
    aplicar: (dr) => {
      const x = dr(integracoes).find((y) => y.id === i.id)!
      Object.assign(x, { estado: ligar ? "conectado" : "desligado", desde: agoraIso(), teste: undefined })
      x.historico.push(evento(ligar ? "Ligou" : "Desligou"))
    },
    sucesso: ligar ? `${nome} ligad${INTEGRACAO[i.id].g}.` : `${nome} desligad${INTEGRACAO[i.id].g}. ${INTEGRACAO[i.id].queda}`,
  })
}

/** Ligar ou desligar um módulo opcional (P, com confirmação): vale para a equipe toda. */
export function ligarModulo(m: ModuloOpcional, ligar: boolean) {
  const nome = OPCIONAL[m.id].nome
  return acao({
    rotulo: `${ligar ? "ligar" : "desligar"} ${m.id === "loja" ? "a" : "o"} ${nome}`, capacidade: "configuracoes_empresa", modo: "pessimista", ids: [m.id],
    // versão 0 = ninguém mexeu ainda (não há registro guardado para conferir)
    conferir: m.versao ? { colecao: situacoesDosModulos, id: m.id, versao: m.versao } : undefined,
    aplicar: (dr) => {
      const x = registroNoRascunho(dr(situacoesDosModulos), m.id)
      const ev = evento(ligar ? "Ligou o módulo" : "Desligou o módulo")
      Object.assign(x, { situacao: ligar ? "ligado" : "desligado", desde: ev.em, quem: ev.quem.nome })
      x.historico.push(ev)
    },
    sucesso: `${nome} ${ligar ? "ligad" : "desligad"}${m.id === "loja" ? "a" : "o"} para a equipe.`,
  })
}

// ---------------------------------------------------------------- simulações da barra F (D10)
/** "O WhatsApp desconecta": a integração cai agora (o sino e o cartão mostram). */
export function whatsappCai() {
  mudarComoOutraPonta((dr) => {
    const x = dr(integracoes).find((y) => y.id === "whatsapp")!
    Object.assign(x, { estado: "erro", desde: agoraIso(), teste: undefined })
    x.historico.push({ em: agoraIso(), quem: SISTEMA, texto: "Desconectado: o número saiu da conta" })
  }, ["whatsapp"])
}
/** "O Estoque fica fora do ar" (ou volta): o terceiro caso do EST-47. Desligado não muda. */
export function estoqueForaDoAr() {
  mudarComoOutraPonta((dr) => {
    const x = registroNoRascunho(dr(situacoesDosModulos), "estoque")
    if (x.situacao === "desligado") return
    const cai = x.situacao === "ligado"
    Object.assign(x, { situacao: cai ? "fora_do_ar" : "ligado", desde: agoraIso(), quem: "Sistema" })
    x.historico.push({ em: agoraIso(), quem: SISTEMA, texto: cai ? "Fora do ar" : "Voltou ao ar" })
  }, ["estoque"])
}
