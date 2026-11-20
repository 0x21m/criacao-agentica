// Módulo Entrada (5.1): login, primeiro acesso, escolha de unidade e recuperação de senha. Fica fora da navegação do
// painel (é a porta dele); chega-se pelo Ctrl K ("Trocar de unidade", "Entrar com outro papel") e pelos links.
// A abertura (logo em vidro) e o carregamento com a marca são os da base (Base.astro, sistema.css): a tela de Entrar
// usa as mesmas classes (.abertura-miolo, .abertura-logo) no carregamento depois do "Entrar", sem refazer.
//
// Sessão: entrar grava a pessoa, o papel e a unidade na sessão da base (definirSessao, permissoes.ts); o painel inteiro
// lê usePessoa() e useUnidade(). "Trocar de unidade" e "Sair" (→ /entrar/) também estão na conta da barra superior.
// BASE: quem aceitou um convite (Carla pelo CNV-0001, Thiago) não está na EQUIPE fixa: entra vestindo a pessoa padrão
//       do papel até a sessão aceitar pessoas da coleção `equipe` do módulo Equipe.
// Estados do membro: MEMBRO e CONVITE_VENCIDO estão na projecao.ts; as telas daqui dizem o estado em frase (textos
//       da 5.1), sem selo.
// BASE: a coleção da equipe (convidado → ativo) é do módulo Equipe, feito em paralelo. O primeiro acesso grava na
//       coleção `convites` deste módulo; quando a Equipe existir, a ação passa a mudar o membro dela.
// BASE: a 5.1 pede SplitText no título; ele esconde o texto até o GSAP carregar (o HTML do servidor sai sem título).
//       Usei o TextoRevelado do kit, que mantém o título no HTML.
// BASE: a abertura (logo em vidro) só toca na home, uma vez por aparelho (script do Base.astro); o caminho /entrar/ →
//       carregamento → Início não a encadeia. O carregamento daqui usa as classes dela para a passagem ficar igual.
// DEC: "Esqueci a senha" é a rota /entrar/senha/ e não um diálogo (5.1, Camadas): tem link direto e volta pelo navegador.
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { alternarSemConexao } from "./dados"

const COMANDOS = [
  { rotulo: "Trocar de unidade", detalhe: "Entrada", caminho: "entrar/unidade/", chaves: "trocar unidade pampulha contagem filial loja", cap: "trocar_unidade" as const },
  { rotulo: "Entrar com outro papel", detalhe: "Entrada", caminho: "entrar/", chaves: "entrar login sair sessao papel demonstracao" },
  { rotulo: "Primeiro acesso (convite)", detalhe: "Entrada", caminho: "entrar/primeiro-acesso/", chaves: "primeiro acesso convite criar senha" },
  { rotulo: "Esqueci a senha", detalhe: "Entrada", caminho: "entrar/senha/", chaves: "esqueci senha recuperar redefinir" },
]

export default {
  id: "entrada", nome: "Entrada", ponta: "operador", ordem: 5,
  nav: [],
  colecoes: ["convites"], depende: ["agenda"],
  comandos: (q, papel) => q.length < 2 ? [] : COMANDOS
    .filter((c) => (!c.cap || pode(papel, c.cap)) && (normalizar(c.rotulo).includes(q) || c.chaves.includes(q)))
    .map(({ rotulo, detalhe, caminho }) => ({ rotulo, detalhe, caminho })),
  simulacoes: [{ rotulo: "Entrada: a conexão cai (liga e desliga)", executar: alternarSemConexao }],
} satisfies Modulo

