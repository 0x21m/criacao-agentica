// Ações do Clientes que mexem nas coleções de outros módulos (mesclar duplicados). Ficam fora do dados.ts porque
// pedidos, agenda, financeiro e mensagens importam `clientes` de lá: importar os dados deles aqui não cria ciclo.
// Leituras por cliente para as abas do detalhe também moram aqui.
import { toast } from "sonner"
import { acao, evento, type Resultado } from "@/proto/dados"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { lancamentos } from "@/modulos/financeiro/dados"
import { conversas } from "@/modulos/mensagens/dados"
import { clientes, type Cliente } from "./dados"

/** O que vai junto com o cadastro que some (para a frase da confirmação). */
export function vinculosDe(id: string) {
  return {
    pedidos: pedidos.ler().filter((p) => p.clienteId === id).length,
    agendamentos: agendamentos.ler().filter((a) => a.clienteId === id).length,
    cobrancas: lancamentos.ler().filter((l) => l.clienteId === id).length,
    conversas: conversas.ler().filter((c) => c.clienteId === id).length,
  }
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
export function fraseDosVinculos(v: ReturnType<typeof vinculosDe>) {
  const partes = [
    v.pedidos && plural(v.pedidos, "OS", "OS"),
    v.agendamentos && plural(v.agendamentos, "agendamento", "agendamentos"),
    v.cobrancas && plural(v.cobrancas, "cobrança", "cobranças"),
    v.conversas && plural(v.conversas, "conversa", "conversas"),
  ].filter(Boolean) as string[]
  if (!partes.length) return "nada ligado a ele"
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`
}

export const JANELA_DESFAZER_MESCLA = 60_000

/**
 * Mescla `sai` em `fica` (P, confere as duas versões): OS, agendamentos, cobranças e conversas passam para `fica`,
 * as etiquetas se juntam e o que faltava em `fica` (complemento, consentimento) vem de `sai`; `sai` some da lista.
 * Sucesso: toast com Desfazer por 60 s (a acao() padrão dá 8 s), que devolve tudo como estava.
 */
export async function mesclarClientes(fica: Cliente, sai: Cliente): Promise<Resultado> {
  const movidos = {
    pedidos: pedidos.ler().filter((p) => p.clienteId === sai.id).map((p) => p.id),
    agendamentos: agendamentos.ler().filter((a) => a.clienteId === sai.id).map((a) => a.id),
    cobrancas: lancamentos.ler().filter((l) => l.clienteId === sai.id).map((l) => l.id),
    conversas: conversas.ler().filter((c) => c.clienteId === sai.id).map((c) => c.id),
  }
  const resumo = fraseDosVinculos({ pedidos: movidos.pedidos.length, agendamentos: movidos.agendamentos.length, cobrancas: movidos.cobrancas.length, conversas: movidos.conversas.length })
  const antesFica = structuredClone(fica)
  const copiaSai = structuredClone(sai)
  const r = await acao({
    rotulo: `mesclar ${sai.id} em ${fica.id}`, modo: "pessimista", capacidade: "editar_cliente", ids: [fica.id, sai.id],
    conferir: [{ colecao: clientes, id: fica.id, versao: fica.versao }, { colecao: clientes, id: sai.id, versao: sai.versao }],
    aplicar: (d) => {
      const lista = d(clientes)
      const x = lista.find((c) => c.id === fica.id)
      if (!x) return
      x.etiquetas = [...new Set([...x.etiquetas, ...sai.etiquetas])]
      x.whatsappConsentido ||= sai.whatsappConsentido
      x.temConta ||= sai.temConta
      if (!x.endereco.complemento && sai.endereco.complemento) x.endereco = { ...x.endereco, complemento: sai.endereco.complemento }
      x.historico.push(evento(`Mesclado com ${sai.id} (${sai.nome}, ${sai.email}): ${resumo} vieram para este cadastro`, { eixo: "mescla" }))
      d.trocar(clientes, lista.filter((c) => c.id !== sai.id))
      for (const p of d(pedidos)) if (movidos.pedidos.includes(p.id)) p.clienteId = fica.id
      for (const a of d(agendamentos)) if (movidos.agendamentos.includes(a.id)) a.clienteId = fica.id
      for (const l of d(lancamentos)) if (movidos.cobrancas.includes(l.id)) l.clienteId = fica.id
      for (const c of d(conversas)) if (movidos.conversas.includes(c.id)) c.clienteId = fica.id
    },
  })
  if (!r.ok) return r
  const desfazer = () => void acao({
    rotulo: "desfazer a mescla", modo: "pessimista", ids: [fica.id, sai.id], capacidade: "editar_cliente",
    aplicar: (d) => {
      const lista = d(clientes)
      const x = lista.find((c) => c.id === fica.id)
      if (x) Object.assign(x, { etiquetas: antesFica.etiquetas, whatsappConsentido: antesFica.whatsappConsentido, temConta: antesFica.temConta, endereco: antesFica.endereco },
        { historico: [...x.historico, evento(`Mescla com ${sai.id} desfeita`, { eixo: "mescla" })] })
      if (!lista.some((c) => c.id === sai.id)) d.trocar(clientes, [...lista, copiaSai])
      for (const p of d(pedidos)) if (movidos.pedidos.includes(p.id)) p.clienteId = sai.id
      for (const a of d(agendamentos)) if (movidos.agendamentos.includes(a.id)) a.clienteId = sai.id
      for (const l of d(lancamentos)) if (movidos.cobrancas.includes(l.id)) l.clienteId = sai.id
      for (const c of d(conversas)) if (movidos.conversas.includes(c.id)) c.clienteId = sai.id
    },
    sucesso: `Mescla desfeita: ${sai.id} voltou.`,
  })
  toast.success(`${sai.id} mesclado em ${fica.id}.`, {
    description: movidos.pedidos.length + movidos.agendamentos.length + movidos.cobrancas.length + movidos.conversas.length
      ? `${resumo} passaram para ${fica.id}. Dá para desfazer por 1 minuto.` : "Dá para desfazer por 1 minuto.",
    duration: JANELA_DESFAZER_MESCLA,
    action: { label: "Desfazer", onClick: desfazer },
  })
  return r
}
