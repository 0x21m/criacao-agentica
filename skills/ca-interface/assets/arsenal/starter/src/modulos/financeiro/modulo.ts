// Módulo Financeiro (5.7): fluxo de caixa (/financeiro/), contas a receber e a pagar (/financeiro/receber/ e
// /financeiro/pagar/, detalhe em ?id=LAN-5012) e o caixa do dia (/financeiro/caixa/).
// Capacidade nova na MATRIZ: `financeiro_painel` (dono, gestora e financeiro abrem as telas; a atendente, que tem
// "financeiro_ver" parcial, só recebe a partir da OS e vê "Esta área é do financeiro." aqui).
//
// "Resposta perdida" (EST-46): o da barra F da base; a baixa manual guarda o envio pendente no título.
// Abas do celular do papel financeiro (5.7): Início · Receber · Pagar · Caixa · Mais (`aba` por papel nos filhos).
// Grupos: a TabelaDados da base já agrupa (`grupoDe` + `grupos`); receber e pagar seguem com uma tabela por grupo
//       porque o lote e o "Mostrar mais" do Depois são por grupo. Migrar quando o lote aceitar seção.
// BASE: GraficoQueDesenha não desenha trecho projetado tracejado nem valores negativos com a linha do zero, e o
//       metric-switcher também não tem trecho projetado; o fluxo usa GraficoFluxo (telas/GraficoFluxo.tsx), no mesmo
//       desenho e com a mesma entrada.
// Modo cartão: as tabelas usam `tituloNosCartoes` da base.
// BASE: a simulação "Cliente paga o Pix da OS-1061" de Pedidos muda só a OS; a deste módulo paga o título e a OS juntos.
import { ArrowDownToLine, ArrowUpFromLine, Landmark, Vault } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { agora } from "@/proto/relogio"
import { clientePagaPix, emAberto, lancamentos, nomeDe, pixExpirado, vencido } from "./dados"

export default {
  id: "financeiro", nome: "Financeiro", ponta: "operador", ordem: 60,
  nav: [
    { rotulo: "Financeiro", caminho: "financeiro/", icone: Landmark, capacidade: "financeiro_painel",
      filhos: [
        { rotulo: "Contas a receber", curto: "Receber", caminho: "financeiro/receber/", icone: ArrowDownToLine, capacidade: "financeiro_painel", aba: { financeiro: 1.2 } },
        { rotulo: "Contas a pagar", curto: "Pagar", caminho: "financeiro/pagar/", icone: ArrowUpFromLine, capacidade: "financeiro_painel", aba: { financeiro: 1.4 } },
        { rotulo: "Caixa do dia", curto: "Caixa", caminho: "financeiro/caixa/", icone: Vault, capacidade: "financeiro_painel", aba: { financeiro: 1.6 } },
      ] },
  ],
  colecoes: ["lancamentos", "caixas"], depende: ["clientes", "pedidos"],
  comandos: (q, papel) => {
    if (!q || !pode(papel, "financeiro_painel")) return []
    const ref = agora()
    const fixos = [
      { chave: "contas vencidas", rotulo: "Contas vencidas", detalhe: "A receber", caminho: "financeiro/receber/" },
      { chave: "fluxo de caixa", rotulo: "Fluxo de caixa", detalhe: "Financeiro", caminho: "financeiro/" },
      { chave: "fechar o caixa", rotulo: "Fechar o caixa", detalhe: "Caixa do dia", caminho: "financeiro/caixa/" },
    ].filter((c) => c.chave.includes(q) || q.split(" ").every((p) => c.chave.includes(p)))
    const titulos = lancamentos.ler()
      .filter((l) => emAberto(l) && (normalizar(l.id).includes(q) || normalizar(l.ref ?? "").includes(q) || normalizar(nomeDe(l)).includes(q)
        || ("receber " + normalizar(l.ref ?? l.id)).includes(q)))
      .slice(0, 4)
      .map((l) => ({
        rotulo: `${l.natureza === "receber" ? "Receber" : "Pagar"} ${l.ref ?? l.id}${vencido(l, ref) ? " (vencido)" : ""}`,
        detalhe: nomeDe(l), caminho: `financeiro/${l.natureza}/?id=${l.id}`,
      }))
    return [...fixos.map(({ chave: _, ...c }) => c), ...titulos].slice(0, 5)
  },
  avisos: (papel) => {
    if (!pode(papel, "financeiro_painel")) return []
    const ref = agora()
    const lista = lancamentos.ler()
    const venc = lista.filter((l) => l.natureza === "receber" && vencido(l, ref))
    const pix = lista.filter((l) => pixExpirado(l, ref))
    return [
      ...(venc.length ? [{ titulo: `${venc.length} ${venc.length === 1 ? "título vencido" : "títulos vencidos"} a receber`, texto: "Cobre ou renegocie", caminho: "financeiro/receber/" }] : []),
      ...pix.map((l) => ({ titulo: `Pix expirado: ${l.ref ?? l.id}`, texto: nomeDe(l), caminho: `financeiro/receber/?id=${l.id}` })),
    ]
  },
  simulacoes: [
    { rotulo: "Cliente paga o Pix aberto", executar: () => clientePagaPix() },
  ],
} satisfies Modulo

