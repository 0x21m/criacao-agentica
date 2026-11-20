// Módulo Portal do cliente (5.12 e 6; persona Juliana). Ponta "cliente": não entra na navegação do painel nem no
// Ctrl K. Casca própria (telas/CascaCliente.astro: logo no topo e a pílula liquid-glass-navbar embaixo).
// Rotas: /portal/ (início; ?acao=agendar|avaliacao|loja&servico= vem do site), /portal/pedidos/ (?ver=concluidos),
// /portal/pedido/?id=, /portal/orcamento/?id=, /portal/pagar/?id=LAN-…, /portal/conversa/?pedido=&texto=,
// /portal/agendar/?servico=, /portal/dados/. A especificação diz /conta/…; o site já aponta para /portal/ (proto/site.ts).
// Não declara coleção: lê e grava as dos donos (pedidos, agendamentos, clientes, lançamentos, conversas, mensagens,
// notificações) pela projeção de dados.ts (D5) e pela acao(). Nenhuma capacidade nova na MATRIZ: o cliente não é papel.
//
// Sessão do cliente: da base (src/proto/cliente.ts). A barra F escolhe a cliente em "Ver como cliente…" (a lista sai de
//   `clientes` abaixo) ou ?cliente=C-0012 na URL; padrão, a Juliana (C-0007). Telas: useCliente() e useDadosDoCliente().
// BASE: item 11 (projecao.ts): frases do cliente que faltam na projeção (já aprovado em, conflito de versão na
//   aprovação, outra conta, "Bruno está a caminho", serviço já começou, exclusão pedida, pedido de horário enviado,
//   avaliação, pago no cartão, boleto gerado) e "O que significa cada etapa": peça local FRASES em dados.ts.
// BASE: a acao() confere `capacidade` contra o papel do operador; o cliente não está na MATRIZ. As ações do portal
//   conferem a posse (clienteId da sessão) e não usam o gerarPix do Financeiro (exige "receber"): usam o codigoPix dele.
// BASE: `pedidos` só tem OS; as vendas da loja (PED-) vêm das cobranças do Financeiro até virarem registro.
// BASE: o QrPix do Financeiro não é exportado; Pagar.tsx tem uma cópia local da mesma regra de desenho.
// BASE: a grade de horários com reserva é do fluxo de agendar do Site (5.13, onda C); /portal/agendar/ pede o horário
//   pela conversa até lá. Remarcar a visita também vai pela conversa.
// BASE: o Financeiro não abre título quando a OS fica pronta; a simulação "Técnico conclui a OS-1052" abre o dela, e
//   o pagamento pelo portal fecha a OS (pronta e paga → entregue, classe A) aqui, porque o clientePagaPix do
//   Financeiro só marca o pagamento.
import type { Modulo } from "../registro"
import { clientes } from "@/modulos/clientes/dados"
import { CLIENTE_PADRAO } from "@/proto/cliente"
import { bancoConfirmaPix, oficinaMudaOrcamento, oficinaResponde, tecnicoConclui } from "./dados"

export default {
  id: "portal", nome: "Portal do cliente", ponta: "cliente", ordem: 120,
  nav: [], colecoes: [], depende: ["pedidos", "agenda", "clientes", "financeiro", "mensagens"],
  simulacoes: [
    { rotulo: "Portal: o banco confirma o Pix da cliente", executar: () => void bancoConfirmaPix() },
    { rotulo: "Portal: técnico conclui a OS-1052", executar: () => void tecnicoConclui("OS-1052") },
    { rotulo: "Portal: Oficina manda a versão 2 do orçamento da OS-1052", executar: () => void oficinaMudaOrcamento("OS-1052") },
    { rotulo: "Portal: Oficina responde a cliente", executar: oficinaResponde },
  ],
  // "Ver como cliente…": a padrão primeiro, depois as ativas com conta no portal, por nome
  clientes: () => clientes.ler().filter((c) => c.id === CLIENTE_PADRAO || (c.estado === "ativo" && c.temConta))
    .sort((a, b) => Number(b.id === CLIENTE_PADRAO) - Number(a.id === CLIENTE_PADRAO) || a.nome.localeCompare(b.nome, "pt-BR"))
    .map((c) => ({ id: c.id, nome: c.nome })),
} satisfies Modulo
