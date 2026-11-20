// Módulo Clientes · coleção `clientes` (seção 3.3 da especificação): 60 clientes + 2 de pior caso (C-0098 e C-0099).
// Os registros dos roteiros de QA têm id e nome fixos (C-0001 Padaria Pão de Mel, C-0007 Juliana Castro…); o resto é
// sorteado pela semente da coleção. Ações do módulo no fim do arquivo.
import { acao, colecao, evento, type Aleatorio, type Evento, type Rascunho } from "@/proto/dados"
import { agora, nov, DIA } from "@/proto/relogio"
import { gerarCnpj, gerarCpf, formatar } from "@/lib/documentos"
import { NOME_ANONIMIZADO, type EstadoCliente } from "@/proto/projecao"

export type Endereco = { cep: string; logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; uf: string }
export type Cliente = {
  id: string; tipo: "pf" | "pj"; nome: string; documento: string
  email: string; telefone: string; whatsappConsentido: boolean
  endereco: Endereco
  etiquetas: string[]
  estado: EstadoCliente
  temConta: boolean
  notaInterna?: string
  origem: "site" | "indicacao" | "balcao" | "whatsapp" | "google"
  criadoEm: string; ultimaCompraEm?: string; anonimizadoEm?: string
  versao: number; historico: Evento[]
}

// [id, tipo, nome, bairro, cidade, etiquetas]
const FIXOS: [number, "pf" | "pj", string, string, string, string[]?][] = [
  [1, "pj", "Padaria Pão de Mel", "Santa Efigênia", "Belo Horizonte", ["Contrato trimestral", "Comércio"]],
  [7, "pf", "Juliana Castro", "Bandeirantes", "Belo Horizonte", ["Portal"]],
  [12, "pj", "Clínica Vida Plena", "Funcionários", "Belo Horizonte", ["Saúde"]],
  [15, "pf", "Marcos Teixeira", "Pampulha", "Belo Horizonte"],
  [18, "pj", "Escola Pequeno Saber", "Eldorado", "Contagem", ["Educação"]],
  [21, "pf", "Rafael Moreira", "Castelo", "Belo Horizonte"],
  [23, "pj", "Hotel Recanto Verde", "Vila da Serra", "Nova Lima", ["Contrato trimestral"]],
  [24, "pj", "Ótica Visão Clara", "Centro", "Betim", ["Comércio"]],
  [25, "pj", "Lavanderia Bolha", "Ouro Preto", "Belo Horizonte", ["Comércio"]],
  [26, "pj", "Mercearia São Jorge", "Industrial", "Contagem", ["Comércio"]],
  [27, "pj", "Academia Movimento", "Buritis", "Belo Horizonte", ["Indicou 3"]],
  [28, "pj", "Cafeteria Grão Moído", "Savassi", "Belo Horizonte", ["Comércio"]],
  [29, "pj", "Floricultura Jardim Real", "Prado", "Belo Horizonte", ["Comércio"]],
  [30, "pj", "Livraria Entrelinhas", "Lourdes", "Belo Horizonte", ["Comércio"]],
  [31, "pj", "Estúdio Foco", "Sion", "Belo Horizonte"],
]
const EMPRESAS = ["Ateliê Costura Fina", "Construtora Alicerce", "Farmácia Bem Estar", "Restaurante Sabor da Serra", "Auto Peças Rodovia",
  "Pet Shop Patas", "Gráfica Ponto Final", "Marcenaria Cerne", "Sorveteria Polar"]
const NOMES = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Larissa", "Lucas", "Mariana",
  "Natália", "Otávio", "Paula", "Renato", "Sabrina", "Tiago", "Vanessa", "Wagner", "Yasmin", "Rodrigo", "Patrícia", "Henrique"]
const SOBRENOMES = ["Almeida", "Barbosa", "Carvalho", "Dias", "Esteves", "Ferreira", "Gomes", "Lacerda", "Machado", "Nogueira", "Oliveira",
  "Pereira", "Queiroz", "Ribeiro", "Santana", "Toledo", "Vieira", "Xavier", "Moura", "Cardoso"]
const LUGARES: [string, string][] = [["Belo Horizonte", "Savassi"], ["Belo Horizonte", "Funcionários"], ["Belo Horizonte", "Pampulha"],
  ["Belo Horizonte", "Castelo"], ["Contagem", "Eldorado"], ["Contagem", "Riacho"], ["Betim", "Centro"], ["Nova Lima", "Vila da Serra"],
  ["Sabará", "Centro"], ["Ibirité", "Durval de Barros"], ["Santa Luzia", "São Benedito"]]
const RUAS = ["Rua dos Timbiras", "Rua Pernambuco", "Av. Afonso Pena", "Rua Grão Mogol", "Rua Tupis", "Av. João César de Oliveira", "Rua Ceará", "Rua Sergipe"]
const slug = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "")

function semear(r: Aleatorio): Cliente[] {
  const fixos = new Map(FIXOS.map((f) => [f[0], f]))
  const empresas = [...EMPRESAS]
  const lista: Cliente[] = []
  for (let n = 1; n <= 60; n++) {
    const f = fixos.get(n)
    // 22 PJ no total: os fixos PJ + as 9 empresas da lista, espalhadas
    const tipo: "pf" | "pj" = f ? f[1] : empresas.length && n % 4 === 2 ? "pj" : "pf"
    const nome = f ? f[2] : tipo === "pj" ? empresas.shift()! : `${r.pega(NOMES)} ${r.pega(SOBRENOMES)}`
    const [cidade, bairro] = f ? [f[4], f[3]] : r.pega(LUGARES)
    const criado = nov(1 + r.entre(0, 15), 9).getTime() - r.entre(20, 700) * 864e5
    // estados: os clientes dos roteiros são ativos; entre os outros, leads, inativos e um anonimizado (C-0044)
    const estado: EstadoCliente = f ? "ativo" : n === 44 ? "anonimizado" : n % 6 === 3 ? "lead" : n % 6 === 5 ? "inativo" : "ativo"
    const diasSemCompra = estado === "inativo" ? r.entre(190, 320) : r.entre(2, 90)
    const doc = tipo === "pj" ? formatar.cnpj(gerarCnpj({ sorteio: r.proximo })) : formatar.cpf(gerarCpf({ sorteio: r.proximo }))
    const email = tipo === "pj" ? `contato@${slug(nome)}.com.br` : `${slug(nome.split(" ")[0])}.${slug(nome.split(" ").at(-1)!)}@email.com.br`
    lista.push({
      id: `C-${String(n).padStart(4, "0")}`, tipo, nome, documento: doc, email,
      telefone: `(31) 9${r.entre(8100, 9899)}-${String(r.entre(1000, 9999))}`, whatsappConsentido: r.chance(0.8),
      endereco: { cep: `3${r.entre(1000, 2999)}-${String(r.entre(0, 999)).padStart(3, "0")}`, logradouro: r.pega(RUAS), numero: String(r.entre(12, 2400)), bairro, cidade, uf: "MG" },
      etiquetas: f?.[5] ?? (tipo === "pj" && r.chance(0.5) ? ["Comércio"] : []),
      estado, temConta: n === 7 || r.chance(0.3), origem: n === 7 ? "site" : r.pega(["site", "indicacao", "balcao", "whatsapp", "google"] as const),
      criadoEm: new Date(criado).toISOString(),
      ultimaCompraEm: estado === "lead" ? undefined : new Date(nov(16, 9).getTime() - diasSemCompra * 864e5).toISOString(),
      notaInterna: n === 1 ? "Prefere visita antes das 10:00. Falar com a Sônia (gerente)." : n === 7 ? "Indicada pela Academia Movimento." : undefined,
      versao: 1, historico: [{ em: new Date(criado).toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto: "Cliente cadastrado" }],
    })
  }
  // duplicado de propósito (roteiro do mesclar): C-0060 é a Juliana Castro (C-0007) cadastrada de novo pelo WhatsApp,
  // com o mesmo telefone e outro e-mail. Só troca campos depois do sorteio: a semente dos outros módulos não muda.
  const juliana = lista.find((c) => c.id === "C-0007")!
  Object.assign(lista.find((c) => c.id === "C-0060")!, {
    tipo: "pf", nome: "Juliana C. Castro", email: "ju.castro@gmail.com", telefone: juliana.telefone, origem: "whatsapp", etiquetas: [],
    endereco: { ...juliana.endereco, complemento: "Apto 302" },
  })
  // um pedido de exclusão já recebido pelo portal (o prazo de 15 dias corre)
  const pediu = lista.find((c) => c.id === "C-0050")!
  pediu.historico.push({ em: nov(9, 14, 12).toISOString(), quem: { tipo: "cliente", nome: pediu.nome }, texto: "Pediu a exclusão da conta e dos dados (LGPD)", eixo: "lgpd", cliente: true })
  const anon = lista.find((c) => c.id === "C-0044")!
  Object.assign(anon, { nome: "Cliente removido", email: "—", telefone: "—", documento: "—", etiquetas: [], temConta: false, anonimizadoEm: nov(9, 15).toISOString() })
  // pior caso: nome curtíssimo com apóstrofo; nome, e-mail e endereço enormes (seção 4)
  lista.push({
    id: "C-0098", tipo: "pf", nome: "Ló D'Ávila", documento: formatar.cpf(gerarCpf({ sorteio: r.proximo })), email: "lo@d.co",
    telefone: "(31) 98877-0001", whatsappConsentido: true,
    endereco: { cep: "31270-000", logradouro: "Rua A", numero: "1", bairro: "Jaraguá", cidade: "Belo Horizonte", uf: "MG" },
    etiquetas: [], estado: "ativo", temConta: false, origem: "balcao", criadoEm: nov(2, 10).toISOString(), ultimaCompraEm: nov(12, 10).toISOString(),
    versao: 1, historico: [],
  })
  lista.push({
    id: "C-0099", tipo: "pj", nome: "Companhia Brasileira de Distribuição e Comércio de Peças Automotivas Pesadas do Vale do Paraíba Ltda.",
    documento: formatar.cnpj(gerarCnpj({ sorteio: r.proximo })),
    email: "departamento.financeiro.contasapagar.fornecedores@companhiabrasileiradedistribuicaodepecasautomotivas.com.br",
    telefone: "(12) 99999-0000", whatsappConsentido: false,
    endereco: { cep: "12238-360", logradouro: "Rodovia Presidente Dutra, km 154, Distrito Industrial do Chácaras Reunidas, Galpões 7, 8 e 9", numero: "S/N",
      complemento: "Portaria 3, doca de recebimento refrigerado, aos cuidados do almoxarifado central", bairro: "Distrito Industrial", cidade: "São José dos Campos", uf: "SP" },
    etiquetas: ["Contrato anual", "Indústria", "Frota pesada"], estado: "ativo", temConta: false, origem: "indicacao",
    criadoEm: nov(3, 14).toISOString(), ultimaCompraEm: nov(10, 11).toISOString(), versao: 1, historico: [],
  })
  return lista
}

export const clientes = colecao<Cliente>("clientes", semear, 2, { caminho: (c) => `clientes/?id=${c.id}` })

/** Nome para mostrar ("Cliente removido" se não existe mais). */
export const nomeCliente = (id?: string) => clientes.porId(id)?.nome ?? "Cliente removido"

// ---------------------------------------------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------------------------------------------
export const digitos = (t: string) => t.replace(/\D/g, "")
const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
/** Primeiro e último nome, sem acento nem iniciais ("Juliana C. Castro" → "juliana castro"). */
const chaveDoNome = (nome: string) => {
  const p = semAcento(nome).split(/\s+/).filter((x) => !x.endsWith("."))
  return p.length > 1 ? `${p[0]} ${p.at(-1)}` : ""
}

/** Prazo legal para atender o pedido de exclusão (a frase do portal promete 15 dias). */
export const PRAZO_EXCLUSAO_DIAS = 15

/** O pedido de exclusão que chegou pelo portal e ainda não foi atendido (evento "lgpd" do próprio cliente). */
export function exclusaoPendente(c: Cliente): { em: string; ate: string } | null {
  if (c.estado === "anonimizado") return null
  const e = c.historico.filter((x) => x.eixo === "lgpd").at(-1)
  if (!e || e.quem.tipo !== "cliente") return null
  return { em: e.em, ate: new Date(new Date(e.em).getTime() + PRAZO_EXCLUSAO_DIAS * DIA).toISOString() }
}

/** Cadastros que parecem a mesma pessoa: mesmo documento, telefone ou e-mail, ou mesmo primeiro e último nome. */
export function duplicadosDe(c: Cliente, lista: Cliente[]): Cliente[] {
  if (c.estado === "anonimizado") return []
  const doc = digitos(c.documento), tel = digitos(c.telefone), nome = chaveDoNome(c.nome)
  return lista.filter((x) => x.id !== c.id && x.estado !== "anonimizado" && (
    (doc.length >= 11 && digitos(x.documento) === doc) || (tel.length >= 10 && digitos(x.telefone) === tel) ||
    x.email.toLowerCase() === c.email.toLowerCase() || (!!nome && chaveDoNome(x.nome) === nome)))
}

/** Já existe alguém com este documento ou e-mail? (o cadastro novo recusa com a frase e o link). */
export function jaExiste(lista: Cliente[], { documento, email }: { documento: string; email: string }) {
  const doc = digitos(documento)
  const porDoc = doc ? lista.find((x) => x.estado !== "anonimizado" && digitos(x.documento) === doc) : undefined
  if (porDoc) return { cliente: porDoc, campo: doc.length > 11 ? "CNPJ" : "CPF" }
  const porEmail = email.trim() ? lista.find((x) => x.estado !== "anonimizado" && x.email.toLowerCase() === email.trim().toLowerCase()) : undefined
  if (porEmail) return { cliente: porEmail, campo: "e-mail" }
  return null
}

/** As notas internas, da mais nova à mais antiga (a nota do cadastro antigo entra como a primeira). */
export function notasDe(c: Cliente): { em: string; autor: string; texto: string }[] {
  const doHistorico = c.historico.filter((e) => e.eixo === "nota").map((e) => ({ em: e.em, autor: e.quem.nome, texto: e.texto }))
  const antiga = c.notaInterna ? [{ em: c.criadoEm, autor: "Cadastro", texto: c.notaInterna }] : []
  return [...antiga, ...doHistorico].sort((a, b) => b.em.localeCompare(a.em))
}

// ---------------------------------------------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------------------------------------------
/** Edita contato e endereço (otimista, com Desfazer). Confere a versão lida pela tela. */
export function salvarCliente(c: Cliente, mudancas: Partial<Pick<Cliente, "nome" | "email" | "telefone" | "whatsappConsentido" | "endereco" | "etiquetas">>) {
  const antes = { nome: c.nome, email: c.email, telefone: c.telefone, whatsappConsentido: c.whatsappConsentido, endereco: c.endereco, etiquetas: c.etiquetas }
  return acao({
    rotulo: `salvar ${c.nome}`,
    ids: [c.id],
    capacidade: "editar_cliente",
    conferir: { colecao: clientes, id: c.id, versao: c.versao },
    aplicar: (d) => { const x = d(clientes).find((y) => y.id === c.id); if (x) { Object.assign(x, mudancas); x.historico.push(evento("Contato atualizado")) } },
    desfazer: (d) => { const x = d(clientes).find((y) => y.id === c.id); if (x) Object.assign(x, antes) },
    sucesso: "Cliente salvo.",
  })
}

export type NovoCliente = Pick<Cliente, "tipo" | "nome" | "documento" | "email" | "telefone" | "whatsappConsentido" | "endereco">

/** Cadastra um lead (P): o id só existe depois da resposta. Devolve o id criado junto do resultado. */
export async function criarCliente(n: NovoCliente) {
  const id = `C-${String(Math.max(0, ...clientes.ler().map((x) => Number(x.id.slice(2)) || 0)) + 1).padStart(4, "0")}`
  const r = await acao({
    rotulo: `cadastrar ${n.nome}`, modo: "pessimista", capacidade: "editar_cliente", ids: [id],
    aplicar: (d) => {
      d(clientes).push({ ...n, id, etiquetas: [], estado: "lead", temConta: false, origem: "balcao", criadoEm: agora().toISOString(), versao: 1, historico: [evento("Cliente cadastrado")] })
    },
    sucesso: `${n.nome} cadastrado.`,
  })
  return { ...r, id }
}

/** Nota interna com autor e hora (O). Fica no histórico do cliente com o eixo "nota"; o portal nunca lê. */
export function adicionarNota(c: Cliente, texto: string) {
  return acao({
    rotulo: "salvar a nota", ids: [c.id], capacidade: "editar_cliente",
    aplicar: (d) => { d(clientes).find((x) => x.id === c.id)?.historico.push(evento(texto, { eixo: "nota" })) },
  })
}

/**
 * Anonimiza (LGPD, P, confere a versão): o nome vira "Cliente removido" e o contato, o endereço, as etiquetas e as
 * notas somem. Pedidos e notas fiscais ficam (exigência legal), ligados ao mesmo id.
 */
export function anonimizarCliente(c: Cliente) {
  const pedido = exclusaoPendente(c)
  return acao({
    rotulo: `anonimizar ${c.nome}`, modo: "pessimista", capacidade: "anonimizar", ids: [c.id],
    conferir: { colecao: clientes, id: c.id, versao: c.versao },
    aplicar: (d) => {
      const x = d(clientes).find((y) => y.id === c.id)
      if (!x) return
      Object.assign(x, {
        nome: NOME_ANONIMIZADO, documento: "—", email: "—", telefone: "—", whatsappConsentido: false, etiquetas: [], temConta: false,
        notaInterna: undefined, estado: "anonimizado", anonimizadoEm: agora().toISOString(),
        endereco: { cep: "—", logradouro: "—", numero: "—", bairro: "—", cidade: x.endereco.cidade, uf: x.endereco.uf },
      })
      // o histórico perde o que identifica a pessoa (notas e o nome nas falas dela); fica o registro do que foi feito
      x.historico = x.historico.filter((e) => e.eixo !== "nota").map((e) => (e.quem.tipo === "cliente" ? { ...e, quem: { tipo: "cliente" as const, nome: NOME_ANONIMIZADO } } : e))
      x.historico.push(evento(pedido ? "Dados anonimizados a pedido do titular (LGPD)" : "Dados anonimizados (LGPD)", { eixo: "lgpd", cliente: true }))
    },
    sucesso: "Dados do cliente anonimizados.",
  })
}

/** O cliente pede a exclusão pelo portal (a mesma marca do `pedirExclusao` do Portal), para a simulação da barra F. */
export function pedirExclusaoComoCliente(d: Rascunho, id: string) {
  const c = d(clientes).find((x) => x.id === id)
  if (c && c.estado !== "anonimizado") c.historico.push({ em: agora().toISOString(), quem: { tipo: "cliente", nome: c.nome }, texto: "Pediu a exclusão da conta e dos dados (LGPD)", eixo: "lgpd", cliente: true })
}
