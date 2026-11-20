// Módulo Relatórios (5.8): /relatorios/ com as vistas Desempenho, Técnicos (?aba=tecnicos) e Serviços (?aba=servicos).
// Lê pedidos, agenda, financeiro e estoque (só leitura, pelos dados.ts deles) e grava só a própria coleção
// `exportacoes` (o job do CSV, EST-29). Capacidade usada: `relatorios`, que já estava na MATRIZ (financeiro "parcial":
// só os indicadores de dinheiro e a aba Serviços). Nenhuma linha nova na MATRIZ.
//
// BASE: não há coleção de campanhas (Site ou Configurações); a campanha do gráfico mora em calculos.ts (CAMPANHAS).
// BASE: não há avaliação do cliente nos dados (o "Avaliar" do portal não grava nota); "Nota média" diz "Sem avaliações".
// BASE: a OS não guarda a data de conclusão; calculos.ts usa o passo "pronta/entregue" do histórico e, sem ele, a
//       garantia menos 90 dias (ou o prazo). Um campo `concluidaEm` na OS tiraria a dedução.
// BASE: o sino não tem prioridade nem "Marcar todas" (lacuna 9): o "Relatório pronto" entra no fim da lista dos avisos.
// BASE: item 1 das lacunas: o HTML do servidor sai como gestora; para atendente e técnico os números aparecem por um
//       instante antes do "Esta área é da gestão." (a tela não contorna: depende da sessão na base).
// BASE: EstadoSemPermissao só aceita a área ("Esta área é da gestão."); a 5.8 pede "Relatórios são da gestão.".
// BASE: a BarraSuperior lê os avisos com .ler() (dados guardados) já na hidratação, e o servidor usa a semente: quando um
//       aviso muda (aqui, um "Relatório pronto"; também um Pix pago), toda página dá o erro de hidratação #418 do React.
// BASE: a lateral passa da altura em 1440 × 900 (a nav rola 956 px em 788; já rolava 916 sem o item Relatórios), e o
//       navegar acusa "rolagem dupla" em toda página longa; a nav da lateral precisa de data-rolagem-permitida.
import { ChartNoAxesCombined } from "lucide-react"
import type { Modulo } from "../registro"
import { pode } from "@/proto/permissoes"
import { exportacoes } from "./dados"

const ATALHOS = [
  { chave: "relatorios desempenho faturamento ticket", rotulo: "Relatórios: desempenho", detalhe: "Faturamento, ticket, OS concluídas", caminho: "relatorios/" },
  { chave: "taxa de aprovacao de orcamento", rotulo: "Taxa de aprovação de orçamento", detalhe: "Relatórios", caminho: "relatorios/?indicador=aprovacao" },
  { chave: "produtividade por tecnico relatorio tecnicos", rotulo: "Produtividade por técnico", detalhe: "Relatórios", caminho: "relatorios/?aba=tecnicos", gestao: true },
  { chave: "servicos que mais vendem categorias relatorio", rotulo: "O que mais vende", detalhe: "Relatórios", caminho: "relatorios/?aba=servicos" },
]

export default {
  id: "relatorios", nome: "Relatórios", ponta: "operador", ordem: 70,
  nav: [{ rotulo: "Relatórios", caminho: "relatorios/", icone: ChartNoAxesCombined, capacidade: "relatorios" }],
  colecoes: ["exportacoes"], depende: ["pedidos", "agenda", "financeiro", "estoque"],
  comandos: (q, papel) => {
    if (!q || !pode(papel, "relatorios")) return []
    return ATALHOS.filter((a) => !(a.gestao && papel === "financeiro") && (a.chave.includes(q) || q.split(" ").every((p) => a.chave.includes(p))))
      .map(({ chave: _, gestao: __, ...c }) => c).slice(0, 4)
  },
  avisos: (papel) => {
    if (!pode(papel, "relatorios")) return []
    return exportacoes.ler().filter((e) => e.estado === "pronto")
      .map((e) => ({ titulo: "Relatório pronto", texto: e.titulo, caminho: `relatorios/?baixar=${e.id}` }))
  },
} satisfies Modulo
