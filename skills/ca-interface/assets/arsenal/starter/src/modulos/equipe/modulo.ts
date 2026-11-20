// Módulo Equipe e permissões (5.10 e seção 2): pessoas (/equipe/, ?id= abre a pessoa), matriz de permissões
// (/equipe/permissoes/, edição só simulada) e auditoria (/equipe/auditoria/, lê o `historico` das coleções).
// Capacidades usadas (já na MATRIZ, nenhuma nova): equipe_ver, equipe_gerir, auditoria.
//
// Matriz editável: cada ajuste grava o histórico em `ajustes_permissao` e vai para a sessão da base (ajustarMatriz);
//   pode() passa a seguir a regra nova em todas as telas ("tirar Ver custo da gestora" vale no resto do protótipo).
// BASE: pode() não confere o papel-alvo de equipe_gerir ("gestora convida atendente e técnico"); a regra mora em
//   podeGerir() (dados.ts), chamada dentro de cada ação antes da acao().
// Papel e sessão: a base esconde o conteúdo até a sessão guardada valer (nada da lista vaza para atendente, técnico ou
//   financeiro) e `?papel=` fica guardado. Os filtros do módulo usam `?funcao=` e `?ver=`, nunca `?papel=`.
import { History, ShieldCheck, UsersRound } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { agora, DIA } from "@/proto/relogio"
import { convidadoAceita, equipe, podeGerir } from "./dados"

export default {
  id: "equipe", nome: "Equipe", ponta: "operador", ordem: 80,
  nav: [{
    rotulo: "Equipe e permissões", curto: "Equipe", caminho: "equipe/", icone: UsersRound, capacidade: "equipe_ver",
    filhos: [
      { rotulo: "Permissões", caminho: "equipe/permissoes/", icone: ShieldCheck, capacidade: "equipe_ver" },
      { rotulo: "Auditoria", caminho: "equipe/auditoria/", icone: History, capacidade: "auditoria" },
    ],
  }],
  colecoes: ["equipe", "ajustes_permissao"], depende: ["pedidos", "agenda", "clientes"],
  comandos: (q, papel) => {
    if (!q) return []
    const fixos = [
      { rotulo: "Matriz de permissões", detalhe: "Equipe", caminho: "equipe/permissoes/", chave: "permissoes papeis matriz acesso", cap: "equipe_ver" as const },
      { rotulo: "Auditoria: quem fez o quê", detalhe: "Equipe", caminho: "equipe/auditoria/", chave: "auditoria historico log quem fez", cap: "auditoria" as const },
    ].filter((c) => pode(papel, c.cap) && (c.chave.includes(q) || normalizar(c.rotulo).includes(q)))
    const pessoas = !pode(papel, "equipe_ver") ? [] : equipe.ler()
      .filter((m) => normalizar(m.nome).includes(q) || m.email.includes(q))
      .slice(0, 4)
      .map((m) => ({ rotulo: m.nome, detalhe: "Pessoa da equipe", caminho: `equipe/?id=${m.id}` }))
    return [...pessoas, ...fixos.map(({ rotulo, detalhe, caminho }) => ({ rotulo, detalhe, caminho }))].slice(0, 5)
  },
  avisos: (papel) => equipe.ler()
    .filter((m) => m.estado === "convidado" && m.convidadoEm && podeGerir(papel, "convite", m.papel))
    .map((m) => ({ m, dias: Math.floor((agora().getTime() - new Date(m.convidadoEm!).getTime()) / DIA) }))
    .filter((x) => x.dias >= 2)
    .map(({ m, dias }) => ({ titulo: `Convite de ${m.curto} sem resposta há ${dias} dias`, texto: m.email, caminho: `equipe/?id=${m.id}` })),
  simulacoes: [{ rotulo: "Convidado aceita o convite da equipe", executar: convidadoAceita }],
} satisfies Modulo
