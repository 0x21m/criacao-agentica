// Módulo Agenda (5.4): dia por recurso e semana de um recurso, com arrastar, esticar e criar; o "Meu dia" do técnico;
// a grade de horários livres com reserva, exportada para o Site e o Portal.
//
// LACUNAS: (espec. 3.2 e 5.4 × código em 79eddef; em ordem de prioridade)
// 1. [feita] Grade de horários livres exportada para o Site e o Portal: `horariosLivres(servico, dia, unidade?)`,
//    `proximosLivres`, `reservarHorario` (P, atômica, 10 min, perdeu → frase + 3 sugestões), `usarReserva` (dentro da
//    ação de concluir), `liberarReserva`, `expirarReservas` (A) em dados.ts; `GradeDeHorarios` em telas/; bancada
//    em /agenda/livres/ (balcão abre o Novo agendamento preenchido; "Como o cliente vê" reserva como o site).
// 2. [feita] Reserva com prazo na grade do operador: bloco tracejado "Reservado no site até 10:21", some ao vencer.
// 3. [feita] `?id=` abre a folha do agendamento no dia dele (resumo, o que o cliente lê, conflito, Abrir OS, Mensagem,
//    histórico); clicar ou Enter num bloco também abre. "Novo agendamento" por link: `?novo=1&data=&recurso=&inicio=`.
//    `?vista=`, `?data=`, `?recurso=` na URL.
// 4. [feita] /agenda/minha/, o "Meu dia" do técnico: cartões em ordem, próxima visita em destaque, Abrir no mapa,
//    deslizar "Marcar chegada" (O, Desfazer; a OS agendada vai para diagnóstico ou execução); Gustavo: "Nenhuma
//    visita hoje. Veja com a Marina se há encaixe."
// 5. [feita] Confirmar pedido do site (P, "Confirmando…", mensagem de saída na conversa), Cliente ausente (P, depois
//    de 20 min, motivo), Cancelar (P, motivo) em acoes.ts.
// 6. [feita] Remarcar `confirmado` é P (o bloco espera a resposta); não confirmado segue O com Desfazer.
// 7. [feita] Ctrl K ("Agenda de amanhã", "Agenda do Bruno", AG-…) e sino (conflitos, pedidos do site a confirmar).
// 8. [feita] Técnico em /agenda/ vê só a própria coluna e não arrasta (ver_agenda "proprias", mover_agenda não).
// 9. [aberta] PulsoAoVivo nos blocos em atendimento e "Deslocamento" (bairro → tempo) no diálogo: o bloco é da
//    AgendaInterativa (base) e não aceita conteúdo próprio. Diálogo com busca de cliente (hoje é um select).
//
// Capacidade nova na MATRIZ: `registrar_visita` (marcar a chegada ou a ausência; técnico nas próprias visitas).
// BASE: a tela de Permissões da Equipe agrupa as capacidades à mão ("Agenda": ver_agenda, mover_agenda); a nova
//   `registrar_visita` só aparece lá quando a Equipe a acrescentar ao grupo.
// BASE: AgendaInterativa não tem `aoAbrir` no bloco; a agenda abre a folha pelo clique (sem arrasto) e pelo Enter
//   capturados no contêiner, pelo `data-bloco-id`.
import { CalendarDays, Sun } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { agora, chaveDia } from "@/proto/relogio"
import { RECURSOS, recursoPorId } from "@/proto/negocio"
import { pessoaAtual, pode } from "@/proto/permissoes"
import { nomeCliente } from "@/modulos/clientes/dados"
import { agendamentos, ocupa, validarHorario } from "./dados"

const amanha = () => { const d = agora(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) }
/** "do Bruno", "da Elisa", "da Bancada". */
export const deQuem = (id: string) => (id === "elisa" || id.startsWith("bancada") ? "da" : "do")
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")

export default {
  id: "agenda", nome: "Agenda", ponta: "operador", ordem: 30,
  nav: [{
    rotulo: "Agenda", caminho: "agenda/", icone: CalendarDays, capacidade: "ver_agenda", aba: { dono: 3, gestora: 3, atendente: 3 },
    filhos: [{ rotulo: "Meu dia", caminho: "agenda/minha/", icone: Sun, capacidade: "registrar_visita", aba: { tecnico: 0.5 } }],
  }],
  colecoes: ["agendamentos"], depende: ["clientes", "pedidos", "mensagens"],
  comandos: (q, papel) => {
    if (!q || !pode(papel, "ver_agenda")) return []
    const fixos = [
      { rotulo: "Agenda de amanhã", detalhe: "Agenda", caminho: `agenda/?data=${chaveDia(amanha())}` },
      { rotulo: "Horários livres", detalhe: "Agenda", caminho: "agenda/livres/" },
      ...RECURSOS.filter((r) => papel !== "tecnico" || r.id === pessoaAtual().id)
        .map((r) => ({ rotulo: `Agenda ${deQuem(r.id)} ${r.curto}`, detalhe: "Agenda da semana", caminho: `agenda/?vista=semana&recurso=${r.id}` })),
    ].filter((c) => normalizar(c.rotulo).includes(q))
    const ags = q.length < 2 ? [] : agendamentos.ler().filter((a) => (papel !== "tecnico" || a.recursoId === pessoaAtual().id) && a.estado !== "reservado" &&
      (normalizar(a.id).includes(q) || (a.clienteId && normalizar(nomeCliente(a.clienteId)).includes(q))))
      .filter((a) => ocupa(a)).slice(0, 3)
      .map((a) => ({ rotulo: `${a.id} · ${nomeCliente(a.clienteId)}`, detalhe: `Agendamento, ${dia(a.inicio)}`, caminho: `agenda/?id=${a.id}` }))
    return [...fixos.slice(0, 3), ...ags].slice(0, 5)
  },
  avisos: (papel) => {
    if (!pode(papel, "mover_agenda")) return []
    const hoje = agora()
    const vivos = agendamentos.ler().filter((a) => ocupa(a, hoje) && new Date(a.fim) > hoje)
    const conflitos = vivos.flatMap((a) => {
      const c = validarHorario({ inicio: new Date(a.inicio), fim: new Date(a.fim), recursoId: a.recursoId }, a.servicoSlug, a.id, vivos).conflitos.find((b) => b.id > a.id)
      return c ? [{ id: `conflito-${a.id}-${c.id}`, prioridade: 1, titulo: `Conflito ${a.id} × ${c.id}`, texto: `${recursoPorId(a.recursoId)?.curto}, ${dia(a.inicio)}`, caminho: `agenda/?id=${a.id}` }] : []
    })
    const aConfirmar = vivos.filter((a) => a.estado === "solicitado").map((a) => ({
      id: `confirmar-${a.id}`, titulo: `${a.id} a confirmar`, texto: `Pedido pelo site · ${nomeCliente(a.clienteId)}, ${dia(a.inicio)}`, caminho: `agenda/?id=${a.id}`,
    }))
    return [...conflitos, ...aConfirmar]
  },
} satisfies Modulo
