// Módulo Mensagens e notificações (5.9): caixa de conversas (/mensagens/, ?conversa=CV-0031), modelos
// (/mensagens/modelos/, ?id=MOD-01) e a central de notificações (/notificacoes/), que é o que o sino da barra lê.
// Capacidades: `mensagens` (já na matriz) e `mensagens_modelos` (acrescentada em permissoes.ts: editar modelos).
//
// Sino (base): abas "Não lidas · Todas", "Marcar todas" e "Ver todas" → /notificacoes/; o lido é o desta central.
// Abas do celular: Mensagens entra nas da atendente e do técnico (`aba` por papel); para os outros, fica no "Mais".
// BASE: a Agenda não grava `cliente: true` ao remarcar nem ao confirmar; a mensagem automática de remarcação é lida pelo
//   texto do evento (automaticasDa em dados.ts).
import { Bell, FileText, MessageSquare } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { clientes } from "../clientes/dados"
import { clienteResponde, conversas, lerNotificacao, notificacoesDe, podeVer } from "./dados"

export default {
  id: "mensagens", nome: "Mensagens", ponta: "operador", ordem: 60,
  nav: [
    { rotulo: "Mensagens", caminho: "mensagens/", icone: MessageSquare, capacidade: "mensagens", aba: { atendente: 3.5, tecnico: 6 },
      filhos: [{ rotulo: "Modelos de mensagem", caminho: "mensagens/modelos/", icone: FileText, capacidade: "mensagens" }] },
    { rotulo: "Notificações", caminho: "notificacoes/", icone: Bell },
  ],
  colecoes: ["conversas", "mensagens", "notificacoes", "modelos"], depende: ["clientes", "pedidos", "agenda"],
  comandos: (q, papel) => {
    if (!q || !pode(papel, "mensagens")) return []
    return conversas.ler()
      .filter((cv) => podeVer(papel, cv))
      .filter((cv) => normalizar(clientes.porId(cv.clienteId)?.nome ?? "").includes(q) || normalizar(cv.id).includes(q) || (!!cv.ref && normalizar(cv.ref).includes(q)))
      .slice(0, 5)
      .map((cv) => ({ rotulo: `Conversa com ${clientes.porId(cv.clienteId)?.nome ?? "cliente"}`, detalhe: cv.ref ? `${cv.id} · ${cv.ref}` : cv.id, caminho: `mensagens/?conversa=${cv.id}` }))
  },
  // o sino: as notificações da pessoa da sessão (pelo id e pelo papel), cada uma abre o objeto exato; o "lido" é o desta
  // central (lida + aoLer), então o sino e /notificacoes/ mostram o mesmo estado
  avisos: (papel) => notificacoesDe(papel)
    // `aviso=` deixa o caminho único no sino (outro módulo pode avisar do mesmo objeto); a tela ignora o parâmetro
    .map((n) => ({ id: `notificacao:${n.id}`, titulo: n.titulo, texto: n.texto, caminho: `${n.link}${n.link.includes("?") ? "&" : "?"}aviso=${n.id}`,
      lida: n.lida, prioridade: n.tipo === "mensagem" ? 1 : 2, aoLer: () => void lerNotificacao(n) })),
  simulacoes: [{ rotulo: "Cliente responde no WhatsApp", executar: clienteResponde }],
} satisfies Modulo
