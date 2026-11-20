export type Formas = readonly [um: string, varios: string]

// MIFT: catálogo das mensagens que se repetem em toda a biblioteca (guia em docs/microcopia.md). Uma frase, um lugar:
// a peça importa daqui em vez de escrever "Não houve resposta…" à mão. Erro segue "o que houve · por quê · o que fazer";
// confirmação destrutiva nomeia o que se perde e quantos; zero é "Nenhum", nunca "0 pedidos". Sem dependências.

/* ───────────── Falha de rede e de servidor ───────────── */

/** Exceção não é motivo de negócio: rede caída ou servidor fora do ar (ação, envio, formulário). */
export const SEM_RESPOSTA = "Não houve resposta. Confira a conexão e tente de novo."

/** A mesma falha numa consulta (a tela que busca dados). */
export const SEM_RESPOSTA_DO_SERVIDOR = "Não houve resposta do servidor. Confira a conexão e tente de novo."

/** Título da `Falha` e do aviso de erro; o motivo vai embaixo (nunca "Erro" ou "Algo deu errado" sozinhos). */
export const TITULO_DA_FALHA = "Não deu certo"

/** O verbo de repetir, igual em toda falha. */
export const TENTAR_DE_NOVO = "Tentar de novo"

/** Ação demorada sem motivo próprio (o aviso de `comAviso`). */
export const FALHA_SEM_MOTIVO = "Não deu certo. Tente de novo."

export const COPIAR = {
  feito: "Copiado",
  semSuporte: "Não deu para copiar neste navegador",
  falhou: "Não deu para copiar",
} as const

export type TipoDeFalha = "rede" | "servidor" | "permissao" | "conflito" | "nao-encontrado" | "dados"

export type MensagemDeFalha = { titulo: string; motivo: string; tipo: TipoDeFalha }

const HTTP: Record<number, MensagemDeFalha> = {
  400: { titulo: "Pedido não aceito", motivo: "Algum dado não está no formato esperado. Confira os campos e tente de novo.", tipo: "dados" },
  401: { titulo: "Sessão encerrada", motivo: "Entre de novo para continuar. O que você preencheu fica guardado.", tipo: "permissao" },
  403: { titulo: "Sem permissão", motivo: "Seu perfil não pode fazer isso. Peça acesso a quem administra a conta.", tipo: "permissao" },
  404: { titulo: "Não encontrado", motivo: "O item não existe mais ou mudou de endereço. Volte à lista e abra de novo.", tipo: "nao-encontrado" },
  408: { titulo: "Demorou demais", motivo: "O servidor não respondeu a tempo. Tente de novo em instantes.", tipo: "rede" },
  409: { titulo: "Alguém mudou antes", motivo: "Outra pessoa alterou este item enquanto você editava. Confira a versão atual.", tipo: "conflito" },
  410: { titulo: "Não está mais disponível", motivo: "O item foi retirado. Volte à lista para ver o que existe hoje.", tipo: "nao-encontrado" },
  413: { titulo: "Arquivo grande demais", motivo: "O envio passa do tamanho aceito. Reduza o arquivo ou envie em partes.", tipo: "dados" },
  422: { titulo: "Dados não aceitos", motivo: "Algum campo não passou na conferência. Confira os destaques e tente de novo.", tipo: "dados" },
  429: { titulo: "Muitas tentativas", motivo: "Espere um minuto antes de tentar de novo.", tipo: "servidor" },
  500: { titulo: "Falha do nosso lado", motivo: "O servidor teve um problema. Nada foi alterado; tente de novo em instantes.", tipo: "servidor" },
  502: { titulo: "Serviço fora do ar", motivo: "Um serviço de que dependemos não respondeu. Tente de novo em instantes.", tipo: "servidor" },
  503: { titulo: "Serviço em manutenção", motivo: "O serviço volta em instantes. Tente de novo daqui a pouco.", tipo: "servidor" },
  504: { titulo: "Demorou demais", motivo: "Um serviço de que dependemos não respondeu a tempo. Tente de novo em instantes.", tipo: "servidor" },
}

/**
 * A mensagem de uma resposta HTTP de erro, escrita para a pessoa (nunca o código cru). `0` (sem resposta) e qualquer
 * código desconhecido caem no grupo: 4xx é "não aceito", 5xx é "do nosso lado".
 */
export function mensagemHttp(status: number): MensagemDeFalha {
  const certa = HTTP[status]
  if (certa) return certa
  if (!status) return { titulo: TITULO_DA_FALHA, motivo: SEM_RESPOSTA, tipo: "rede" }
  if (status >= 500) return HTTP[500]!
  return HTTP[400]!
}

/* ───────────── Campos ───────────── */

/** Erros de campo: dizem o que fazer, no tom do campo (uma frase, com ponto final; o rótulo já diz qual campo). */
export const ERROS_DE_CAMPO = {
  obrigatorio: "Preencha este campo.",
  escolhaUma: "Escolha uma opção.",
  escolhaAoMenosUma: "Escolha ao menos uma opção.",
  data: "Escolha a data.",
  horario: "Escolha um horário.",
  arquivo: "Anexe o arquivo.",
  aceite: "Marque para continuar.",
  email: "Escreva um e-mail completo, como nome@empresa.com.",
  cpf: "Confira o CPF: os dígitos não batem.",
  cnpj: "Confira o CNPJ: os dígitos não batem.",
  documentoIncompleto: "Faltam números no documento.",
  cep: "Escreva os 8 números do CEP.",
  telefone: "Escreva o telefone com DDD.",
  celular: "Escreva o celular com DDD e 9 dígitos.",
  valorMinimo: "Escreva um valor maior que zero.",
  valorMaximo: "O valor passa do máximo.",
  dataMinima: "Escolha uma data mais adiante.",
  dataMaxima: "Escolha uma data anterior.",
  minimo: "Escolha mais opções.",
  maximo: "Escolha menos opções.",
  tamanho: "O texto passa do limite.",
  arquivoTipo: "Envie um arquivo de tipo aceito.",
  arquivoTamanho: "O arquivo passa do tamanho máximo.",
  arquivoEnviando: "Espere o envio terminar.",
  opcaoInvalida: "A opção escolhida deixou de valer. Escolha outra.",
} as const

/* ───────────── Contagem, vazio e confirmação ───────────── */

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/**
 * Quantidade em texto, com zero por extenso: `contagem(0, ["pedido", "pedidos"])` → "nenhum pedido";
 * `(1, …)` → "1 pedido"; `(1200, …)` → "1.200 pedidos". `feminino` para "nenhuma"; `inicio` para a maiúscula de
 * começo de frase ("Nenhum pedido").
 */
export function contagem(n: number, [um, varios]: Formas, { feminino = false, inicio = false }: { feminino?: boolean; inicio?: boolean } = {}) {
  const texto = n === 0 ? `${feminino ? "nenhuma" : "nenhum"} ${um}` : `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`
  return inicio ? maiuscula(texto) : texto
}

/**
 * O vazio de uma lista: o que é a tela e a primeira ação. Sem filtro: "Nenhum pedido ainda" + o que fazer; com filtro
 * ou busca: "Nenhum pedido com esse filtro" + "Limpe o filtro para ver todos".
 */
export function vazio(formas: Formas, { feminino = false, filtro = false, primeiraAcao }: { feminino?: boolean; filtro?: boolean; primeiraAcao?: string } = {}) {
  const nenhum = contagem(0, formas, { feminino, inicio: true })
  if (filtro) return { titulo: `${nenhum} com esse filtro`, descricao: `Limpe o filtro para ver ${feminino ? "todas" : "todos"}.` }
  return { titulo: `${nenhum} ainda`, descricao: primeiraAcao }
}

/**
 * Confirmação do que não volta atrás: o título nomeia a ação e o alvo, a descrição diz o que se perde, e o botão
 * repete o verbo com a quantidade. `nome` para um item só ("PED-1042"); sem ele, a quantidade.
 */
export function confirmarExclusao({
  formas,
  quantos = 1,
  nome,
  feminino = false,
  perde,
  verbo = "Excluir",
}: {
  formas: Formas
  quantos?: number
  nome?: string
  feminino?: boolean
  /** O que vai junto ("o histórico e os anexos"). */
  perde?: string
  verbo?: string
}) {
  const artigo = feminino ? "a" : "o"
  const alvo = quantos === 1 ? `${artigo} ${formas[0]}${nome ? ` ${nome}` : ""}` : `${quantos.toLocaleString("pt-BR")} ${formas[1]}`
  const sujeito = quantos === 1 ? maiuscula(alvo) : `${feminino ? "As" : "Os"} ${alvo}`
  return {
    titulo: `${verbo} ${alvo}?`,
    descricao: `${sujeito}${perde ? ` e ${perde}` : ""} ${quantos === 1 && !perde ? "sai" : "saem"} para sempre. Não dá para desfazer.`,
    confirmar: quantos === 1 ? verbo : `${verbo} ${quantos.toLocaleString("pt-BR")}`,
    destrutiva: true as const,
  }
}
