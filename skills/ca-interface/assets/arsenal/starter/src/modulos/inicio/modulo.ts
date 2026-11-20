// Módulo Início (5.2): a visão do dia, recortada por papel (seção 2, linha `ver_inicio` da MATRIZ). Não declara
// coleção: lê as de Pedidos, Agenda, Clientes, Financeiro, Estoque, Mensagens e a sessão do Entrada (dia.ts).
// Capacidades usadas (já na MATRIZ, nenhuma nova): ver_inicio (o recorte), financeiro_painel (herói de faturamento e
// a receber), pagar, fechar_caixa, ver_agenda, ver_pedidos, estoque_ver, estoque_movimentar, mensagens, criar_pedido,
// trocar_unidade.
//
// BASE: item 2 das lacunas: usePessoa()/useUnidade() da sessão. Peça local useQuemVe() (sessao.ts) junta o papel ativo
//   com a sessão do Entrada; quando a base tiver os dois, sessao.ts passa a só reexportá-los.
// BASE: item 1 das lacunas: o HTML estático sai como a gestora. O Início não põe nenhum número no HTML do servidor:
//   até o papel ser conhecido (depois da hidratação) mostra a moldura e o esqueleto (PON-20). A tela deixa de chegar
//   pronta no HTML; quando a base decidir o papel antes da pintura, o `conhecido` de sessao.ts vira sempre verdadeiro.
// [x] Abas do técnico (seção 2): Meu dia · Minhas OS · Estoque · Mensagens · Mais. O Início sai da navegação dele
//   (`porPapel: { tecnico: false }`); a rota / continua mostrando o "Meu dia" para quem chega nela (logo, link antigo).
// BASE: o EntradaEscalonada (modo "sempre") montado depois da hidratação ficava parado em opacidade 0; o Início usa a
//   peça local Entrada (pecas.tsx), que anima direto ao montar.
// BASE: a projeção não tem o objeto Caixa (aberto, fechado) nem o conflito de agenda; o bloco do caixa e o item de
//   conflito descrevem o fato em texto, sem selo.
// BASE: o navegar.mjs acusa "rolagem dupla" na <nav> da BarraLateral a 1440 × 900 (a lateral da gestora passou da
//   altura com os módulos da onda A; o mesmo aparece em /estoque/ e /relatorios/ e no main) e "reticências sem title"
//   em "Modelos de mensagem". Os dois são da casca, não do Início.
// BASE: a agenda não abre por ?id= nem com o "Novo agendamento" pela URL; os itens da agenda levam a /agenda/.
import { LayoutDashboard } from "lucide-react"
import type { Modulo } from "../registro"

export default {
  id: "inicio", nome: "Início", ponta: "operador", ordem: 10,
  nav: [{ rotulo: "Visão geral", curto: "Início", caminho: "", icone: LayoutDashboard, capacidade: "ver_inicio", aba: 1,
    // o técnico não tem o Início de gestão: o "Meu dia" (Agenda) é o início dele, nas abas e na lateral
    porPapel: { tecnico: false } }],
  colecoes: [], depende: ["pedidos", "agenda", "clientes", "financeiro", "estoque", "mensagens", "entrada"],
} satisfies Modulo
