// Módulo Estoque (5.6): saldo com mínimo por unidade (/estoque/, detalhe em ?id=SKU), movimentações
// (/estoque/movimentacoes/) e compras com recebimento (/estoque/compras/, detalhe em ?id=CMP-0007).
// Liga a OS em "Aguardando peça" à compra: receber a CMP-0007 tira a OS-1044 da espera (lê pedidos/dados.ts, não edita).
//
// Capacidade nova na MATRIZ (contratos, seção 6): `estoque_movimentar` (ajustar, transferir, gerar, enviar e receber
// compra). A `estoque_ajustar` existente deixa o financeiro "parcial" (aprovar o pagamento da compra), e o pode() sem
// contexto responde sim para parcial: o financeiro mexeria no saldo. A linha nova diz não para ele.
//
// Capacidades novas na MATRIZ (fase 6): `estoque_historico` (movimentações e compras; o técnico fica só com o saldo, as
// duas telas mostram o estado sem permissão e saem da navegação dele) e `estoque_exportar` (técnico e atendente veem o
// saldo sem ações: sem "Exportar CSV").
//
// Totais do recorte: rodapé da TabelaDados (`totais`). Ajuste de saldo na célula: `editar.motivo` (popover com motivo, P).
// Sino: "Peça chegou para a OS-…" vai com prioridade 1 (sobe acima das OS atrasadas).
// Ajuste em lote: cada item vai com `silenciosa` (a sheet mostra "2 de 5 ajustados"; nenhum toast por item).
import { Package, ArrowLeftRight, Truck } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { compraAtrasada, compras, estadoDoProduto, fornecedorAtrasa, clientePedeAviso, liberacoesDeHoje, produtos } from "./dados"

export default {
  id: "estoque", nome: "Estoque", ponta: "operador", ordem: 50,
  nav: [{
    rotulo: "Estoque", caminho: "estoque/", icone: Package, capacidade: "estoque_ver", aba: 5,
    filhos: [
      { rotulo: "Movimentações", caminho: "estoque/movimentacoes/", icone: ArrowLeftRight, capacidade: "estoque_historico" },
      { rotulo: "Compras", caminho: "estoque/compras/", icone: Truck, capacidade: "estoque_historico" },
    ],
  }],
  colecoes: ["produtos", "movimentacoes", "compras"], depende: ["pedidos"],
  comandos: (q, papel) => {
    if (!q || !pode(papel, "estoque_ver")) return []
    const atalhos = [
      { chaves: ["itens baixos", "baixo", "repor", "abaixo do minimo"], c: { rotulo: "Itens baixos", detalhe: "Estoque", caminho: "estoque/?situacao=repor" } },
      { chaves: ["compras", "fornecedor"], c: { rotulo: "Compras", detalhe: "Estoque", caminho: "estoque/compras/" } },
    ].filter((a) => a.c.caminho !== "estoque/compras/" || pode(papel, "estoque_historico")).filter((a) => a.chaves.some((k) => k.startsWith(q) || q.startsWith(k))).map((a) => a.c)
    const sku = q.replace(/^sku\s*/, "")
    const prods = produtos.ler().filter((p) => normalizar(p.id).includes(sku) || normalizar(p.nome).includes(q)).slice(0, 4)
      .map((p) => ({ rotulo: `${p.id} · ${p.nome}`, detalhe: "Produto", caminho: `estoque/?id=${p.id}` }))
    const cmps = !pode(papel, "estoque_historico") ? [] : compras.ler().filter((c) => normalizar(c.id).includes(q)).slice(0, 2)
      .map((c) => ({ rotulo: `${c.id} · ${c.fornecedor}`, detalhe: "Compra", caminho: `estoque/compras/?id=${c.id}` }))
    return [...atalhos, ...prods, ...cmps].slice(0, 5)
  },
  avisos: (papel) => {
    if (!pode(papel, "estoque_ver")) return []
    const ps = produtos.ler()
    const esgotados = ps.filter((p) => estadoDoProduto(p) === "esgotado")
    const baixos = ps.filter((p) => estadoDoProduto(p) === "baixo")
    return [
      ...liberacoesDeHoje().map(({ os }) => ({ titulo: `Peça chegou para a ${os.id}`, texto: `${os.titulo}: voltou para Em execução`, caminho: `pedidos/?id=${os.id}`, prioridade: 1 })),
      ...esgotados.map((p) => ({ titulo: `${p.id} esgotado`, texto: p.nome, caminho: `estoque/?id=${p.id}` })),
      ...(baixos.length ? [{ titulo: `${baixos.length} ${baixos.length === 1 ? "item abaixo" : "itens abaixo"} do mínimo`, texto: "Gere a compra dos baixos no Estoque", caminho: "estoque/?situacao=repor" }] : []),
      ...(!pode(papel, "estoque_historico") ? [] : compras.ler()).filter((c) => compraAtrasada(c)).map((c) => ({ titulo: `${c.id} atrasada`, texto: c.fornecedor, caminho: `estoque/compras/?id=${c.id}` })),
    ]
  },
  simulacoes: [
    { rotulo: "Fornecedor atrasa a compra CMP-0007", executar: () => fornecedorAtrasa("CMP-0007") },
    { rotulo: "Cliente pede \"Avise-me\" do AC-9999", executar: () => clientePedeAviso("AC-9999") },
  ],
} satisfies Modulo

