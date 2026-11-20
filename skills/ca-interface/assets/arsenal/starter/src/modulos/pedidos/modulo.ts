// Módulo Pedidos e ordens de serviço (5.3): lista, quadro (?vista=quadro), folha de detalhe (?id=), página da OS
// (/pedidos/ver/?id=) e nova OS em etapas (/pedidos/novo/).
//
// LACUNAS (espec. 3.1 e 5.3 × código em 79eddef), em ordem de prioridade; [x] fechada nesta onda, [ ] aberta:
// [x] L1 Concluir a OS não abria a cobrança no Financeiro (o Portal contornava): concluirOS abre o título em aberto.
// [x] L2 Detalhe sem os eixos de status: a folha só mostrava a etapa; faltava /pedidos/ver/ (banner curto com os 3 selos
//        de eixo, resumo sobreposto, 8 + 4 colunas, "O que o cliente está vendo", ação principal fixa no celular).
// [x] L3 Estados do detalhe: OS inexistente ("Não achamos a OS-9999…"), técnico abrindo OS de outro ("Esta OS é de
//        outro técnico." + Ver minhas OS) e dado vencido (faixa "Esta OS foi atualizada por … às …" + Ver mudanças).
// [x] L4 Orçamento com versões: itens editáveis (CampoMoeda), nova versão v{n+1} em rascunho (O, Desfazer apaga), envio
//        com a diferença para o cliente (CLI-14), registrar autorização por outro canal com anexo (P) e a frase de
//        conflito "A Juliana aprovou a versão 1 às 10:02…". O envio confere a versão lida (rascunho mantido no conflito).
// [x] L5 Nova OS em etapas (Cliente → Serviço → Agenda → Revisão) com resumo lateral e rascunho restaurado (EST-39).
// [x] L6 Lista: TabelaDados com ordenar, totais, grupos (Atrasadas · Em andamento · Prontas · Encerradas),
//        editar.motivo no prazo (previsão anterior + motivo, CLI-08), colunas Pagamento e Técnico, filtro de técnico.
// [x] L7 Técnico vê só as próprias OS ("Minhas OS"); atribuir técnico em lote ou na linha (O, Desfazer).
// [x] L8 Concluir: checklist marcado na página, "Falta 1 item do checklist." no próprio checklist, deslizar para
//        concluir no celular (deslizar-para-confirmar); via impressa (comprovante-impresso).
// [x] L9 Semente: o Gustavo fica sem OS (OS-1098 passa ao Diego), para o "nada para hoje" do Meu dia.
// [x] L10 "Cliente paga o Pix da OS-1061" baixava só a OS; agora baixa também o título aberto do Financeiro.
// [ ] L11 Vendas (tipo "venda", eixo entrega): a coleção segue só com OS; fica para quando a Loja existir.
// [x] L12 "Aguardando peça" pede motivo ao soltar (roteiro da Marina, passo 3): DialogoConfirmar com "Qual peça e
//        observação", pessimista (aguardarPeca); cancelar deixa o cartão em Em execução. A previsão da peça vem da
//        compra que reservou para a OS (previsaoDaPeca: CMP-0007 → OS-1044), não de um campo copiado.
// [ ] L13 Fotos no checklist e mensagens da conversa dentro do detalhe (há link para a conversa): sem coleção de fotos.
// [ ] L14 Momento-assinatura do cartão que atravessa sozinho quando o cliente aprova (depende do QuadroInterativo da base).
// [ ] L15 Excluir rascunho de OS solicitada: não pedido por nenhum roteiro; ficou de fora.
//
// BASE: scripts/lab-interativos.mjs (passos "mouse/toque: OS-1047 … Aguardando peça" e os "Desfazer" seguintes) espera
//       o movimento sem diálogo; agora há o motivo. O lab precisa preencher "Qual peça e observação" e clicar em
//       "Mover para Aguardando peça" antes de conferir a coluna (o toast "OS-1047: aguardando peça." com Desfazer segue).
// BASE: alvos da lista abaixo de 24 px que moram na base: as caixas de seleção da TabelaDados (16 px; a de grupo,
//       13 px) e o <label> do HiddenSelect do react-aria em ui/select (148×18, visualmente oculto; o gatilho tem 40 px).
// BASE: o Financeiro não exporta uma ação "abrir a cobrança da OS"; abrirCobrancaDaOS (dados.ts) grava o título na
//       coleção `lancamentos` dentro da mesma acao() de concluir, no formato dos títulos dele.
import { ClipboardList, Plus } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { atrasado, diasDeAtraso, pedidos, clienteAprovaOrcamento, clientePagaPix } from "./dados"
import { pode } from "@/proto/permissoes"
import { clientes } from "../clientes/dados"

export default {
  id: "pedidos", nome: "Pedidos", ponta: "operador", ordem: 20,
  nav: [
    { rotulo: "Pedidos e OS", curto: "Pedidos", caminho: "pedidos/", icone: ClipboardList, capacidade: "ver_pedidos", aba: 2, porPapel: { tecnico: { rotulo: "Minhas OS", curto: "Minhas OS" } },
      filhos: [{ rotulo: "Nova OS", caminho: "pedidos/novo/", icone: Plus, capacidade: "criar_pedido" }] },
  ],
  colecoes: ["pedidos"], depende: ["clientes", "agenda"],
  comandos: (q, papel) => {
    if (!q) return []
    const nome = (id: string) => normalizar(clientes.porId(id)?.nome ?? "")
    const atalhos = [
      ...(pode(papel, "criar_pedido") && "nova os".includes(q) ? [{ rotulo: "Nova OS", detalhe: "Pedidos", caminho: "pedidos/novo/" }] : []),
      ...("pedidos atrasados".includes(q) || "atrasadas".includes(q) ? [{ rotulo: "Pedidos atrasados", detalhe: "Pedidos", caminho: "pedidos/?atrasados=1" }] : []),
    ]
    // só as OS que o papel vê (técnico: as próprias; atendente: as da unidade)
    return [...atalhos, ...pedidos.ler()
      .filter((p) => pode(papel, "ver_pedidos", { responsavelId: p.responsavelId ?? "", unidade: p.unidade }))
      .filter((p) => normalizar(p.id).includes(q) || normalizar(p.titulo).includes(q) || nome(p.clienteId).includes(q))
      .slice(0, 5)
      .map((p) => ({ rotulo: `${p.id} · ${p.titulo}`, detalhe: "OS", caminho: `pedidos/?id=${p.id}` }))]
  },
  avisos: (papel) => !pode(papel, "ver_pedidos") ? [] : pedidos.ler().filter((p) => atrasado(p))
    .sort((a, b) => a.prazo.localeCompare(b.prazo))
    .map((p) => ({ titulo: `${p.id} atrasada há ${diasDeAtraso(p)} ${diasDeAtraso(p) === 1 ? "dia" : "dias"}`, texto: p.titulo, caminho: `pedidos/?id=${p.id}` })),
  simulacoes: [
    { rotulo: "Cliente aprova o orçamento OS-1052", executar: () => clienteAprovaOrcamento("OS-1052") },
    { rotulo: "Cliente paga o Pix da OS-1061", executar: () => clientePagaPix("OS-1061") },
  ],
} satisfies Modulo
