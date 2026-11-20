// Módulo Site e landing (espec. 5.13 e 6; persona Juliana; CLI-42). Ponta "publico": não entra na navegação do painel
// nem no Ctrl K (o link "Site público" está no módulo do protótipo). Casca própria (casca/SiteLayout.astro: o kit da
// design-taste-frontend com os tokens do preset), sem a casca do app.
// Rotas: /site/ (landing), /site/servicos/<id>/ (6), /site/precos/, /site/sobre/, /site/contato/, /site/creditos/,
// /site/agendar/?servico=&horario=, /site/confirmacao/?id=, /site/loja/ (?categoria=), /site/loja/<sku>/ (estáticas pelo
// catálogo da semente, D8), /site/carrinho/, /site/checkout/. Os botões de conta e acompanhamento levam ao Portal
// (/portal/, /portal/pedido/?id=, /portal/pedidos/), nunca a uma tela morta.
//
// LACUNAS (espec. 5.13 × código na partida da onda C, em ordem de prioridade):
//  1. /site/agendar/ não existia: o "Agendar" caía no início do Portal (?acao=agendar). Faltavam as etapas Serviço →
//     Endereço (CEP) → Horário → Seus dados → Pagamento, a reserva de 10 min e a grade de horários livres.  [feito]
//  2. Pix no agendamento e no checkout (QR, Pix Copia e Cola, "Pague até", confirmação sozinha + comprovante).  [feito]
//  3. /site/confirmacao/ (número em destaque, o que acontece e quando, contato, portal, comprovante, criar conta).  [feito]
//  4. Loja online: /site/loja/, /site/loja/<sku>/, /site/carrinho/, /site/checkout/ com frete por CEP e retirada;
//     "Fora de linha" e "Esgotado + Avise-me" na página do produto (CLI-37).  [feito]
//  5. A loja some quando Configurações desliga o módulo "loja" (EST-47), sem piscar.  [feito]
//  6. Estados: horários carregando e vazio, CEP não achado, fora da área + Avise-me, reserva expirada, erro geral
//     com o horário guardado, horário perdido para outra pessoa (3 sugestões).  [feito]
//  7. Rotas em src/pages/site → src/modulos/site/paginas/site; peças só do site → src/modulos/site/casca.  [feito]
//  8. "Prova (avaliações)" e "cobertura (cidades)" na landing: avaliações ficam de fora (a taste proíbe depoimento
//     inventado); as cidades já estão no hero e nas perguntas.  [de fora, decisão]
//  9. liquid-glass-logo-reveal na primeira visita e glass-fold/SplitText no hero: a landing é "service" (site-kind
//     other) na taste, que proíbe shader e cena fora de tech; o banner das etapas usa o glass-fold do preset.  [de fora]
//
// Grade e reserva: da Agenda (cherry-pick de 119bb48): `GradeDeHorarios` (agenda/telas), `reservarHorario`,
//   `usarReserva` e `ocupa` (agenda/dados). A cópia local `// BASE: grade da Agenda` saiu antes do commit.
// Loja: `situacaoDoModulo("loja")` do registro; a casca lê proto-dados:modulos_situacao antes da pintura e o próprio
//   site mostra "Loja fechada" em /site/loja/.
// BASE: integracoes/modulos.mjs só injeta páginas .astro de paginas/; o endpoint que serve o kit da taste
//   (src/pages/site/assets/[...arquivo].ts) fica em src/pages até a base aceitar endpoints .ts de módulo.
// BASE: scripts/_comum.mjs (rotasDasPaginas) não tira as rotas dinâmicas dos módulos: o navegar visita /site/servicos/[id]/
//   e /site/loja/[sku]/ literais e acusa 404 (44 achados, todos esses). Pedido: filtrar `rota.includes("[")` como já faz
//   em src/pages. As páginas reais (6 serviços, 30 produtos) são visitadas pelos links e passam.
// BASE: scripts/medir.mjs mede a troca de toda rota de módulo que a lateral mostra; "Site público" (site/, do módulo
//   prototipo) agora é rota de módulo e abre por carga completa (o site não tem ClientRouter): o medir quebra com
//   "Execution context was destroyed". Pedido: pular os módulos de ponta "publico". Medido aqui com --rotas sem site/.
// BASE: `pedidos` só tem OS; as vendas da loja moram em `vendas_site` (este módulo) com o título no Financeiro.
// BASE: o gerarPix do Financeiro exige a capacidade "receber" do operador; o site usa codigoPix/idE2E de lá.
// BASE: lib/cep.ts responde pelas cidades fictícias do dados-br; o site tem a própria consulta com as faixas de BH e região.
// BASE: fotos.ts e fotos/ ficam em src/components/site/ porque a Entrada também usa as fotografias.
import type { Modulo } from "../registro"
import { avisosDoSite, bancoConfirmaPixDoSite, outraPessoaReserva } from "./dados"

export default {
  id: "site", nome: "Site e landing", ponta: "publico", ordem: 130,
  nav: [], colecoes: ["carrinho_site", "vendas_site", "interessados_site"], depende: ["agenda", "pedidos", "clientes", "financeiro", "estoque", "configuracoes", "portal"],
  avisos: () => avisosDoSite(),
  simulacoes: [
    { rotulo: "Site: o banco confirma o Pix do site", executar: () => void bancoConfirmaPixDoSite() },
    { rotulo: "Site: outra pessoa guarda ter, 17/11, 10:00", executar: () => outraPessoaReserva() },
  ],
} satisfies Modulo
