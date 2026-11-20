import { CIDADES, criarDadosBr } from "@/lib/dados-br"

// MIFT: o CEP pelo adaptador (onda A). O contrato é o que o `CampoCep` chama (`ConsultarCep`); a aplicação liga o
// serviço real (o do próprio servidor, que fala com o fornecedor) ou o adaptador de exemplo daqui, que responde pelas
// cidades fictícias do `dados-br` com latência curta: CEP na faixa de uma cidade é encontrado (rua e bairro saem do
// próprio número, sempre os mesmos), fora delas é "não encontrado", e `indisponivel` simula o serviço fora.
// `preencherEndereco` é a regra única de quem recebe: preenche só o que está vazio ou que veio de uma consulta anterior,
// e o que veio de uma consulta e o CEP novo não traz volta a vazio (nunca apaga o que a pessoa digitou).
//   const cep = criarCepDeExemplo()
//   <CampoCep consultar={cep} aoEncontrar={(c) => setEnd((e) => preencherEndereco(e, c.endereco))} … />

export type CampoDoEndereco = "logradouro" | "bairro" | "cidade" | "uf"

/** Resultado da consulta de CEP (o mesmo contrato do checkout e do formulário). */
export type ConsultaCep =
  | { tipo: "encontrado"; endereco: Partial<Record<CampoDoEndereco, string>> }
  | { tipo: "nao_encontrado" } // libera o preenchimento à mão
  | { tipo: "indisponivel" } // rede ou serviço fora: à mão, sem bloquear

/** O contrato do serviço: recebe o CEP cru (8 dígitos) e um sinal de cancelamento. */
export type ConsultarCep = (cep: string, sinal: AbortSignal) => Promise<ConsultaCep>

/** O endereço do formulário e de onde veio cada campo (para a consulta seguinte saber o que pode trocar). */
export type EnderecoPreenchivel = Partial<Record<CampoDoEndereco, string>> & { _daConsulta?: CampoDoEndereco[] }

const CAMPOS: CampoDoEndereco[] = ["logradouro", "bairro", "cidade", "uf"]

/**
 * Junta o que a consulta trouxe ao endereço atual: troca o campo vazio ou que veio de consulta anterior; o que a
 * pessoa digitou fica. O que veio de consulta e a nova não traz volta a vazio.
 */
export function preencherEndereco<E extends EnderecoPreenchivel>(atual: E, trouxe: Partial<Record<CampoDoEndereco, string>>): E {
  const daConsulta = new Set(atual._daConsulta ?? [])
  const novo: EnderecoPreenchivel = { ...atual }
  const vieram: CampoDoEndereco[] = []
  for (const c of CAMPOS) {
    const pode = !atual[c]?.trim() || daConsulta.has(c)
    if (!pode) continue
    if (trouxe[c]) {
      novo[c] = trouxe[c]
      vieram.push(c)
    } else if (daConsulta.has(c)) novo[c] = ""
  }
  novo._daConsulta = vieram
  return novo as E
}

/** Diz ao endereço que a pessoa editou um campo à mão (a próxima consulta não o troca). */
export function editarCampo<E extends EnderecoPreenchivel>(atual: E, campo: CampoDoEndereco, valor: string): E {
  return { ...atual, [campo]: valor, _daConsulta: (atual._daConsulta ?? []).filter((c) => c !== campo) }
}

/** A cidade fictícia de um CEP (pela faixa), ou undefined. */
export function cidadeDoCep(cep: string) {
  const prefixo = Number(cep.replace(/\D/g, "").slice(0, 5))
  return CIDADES.find((c) => prefixo >= c.cep[0] && prefixo <= c.cep[1])
}

/**
 * Adaptador de exemplo: responde pelas cidades fictícias, com 250 a 550 ms. `indisponivel` (função ou valor) simula o
 * serviço fora. Respeita o cancelamento (o `CampoCep` cancela a consulta anterior).
 */
export function criarCepDeExemplo({ indisponivel = false, latencia = () => 250 + Math.random() * 300 }: { indisponivel?: boolean | (() => boolean); latencia?: () => number } = {}): ConsultarCep {
  return (cep, sinal) =>
    new Promise((ok, erro) => {
      const t = setTimeout(() => {
        if (typeof indisponivel === "function" ? indisponivel() : indisponivel) return ok({ tipo: "indisponivel" })
        const cidade = cidadeDoCep(cep)
        if (!cidade) return ok({ tipo: "nao_encontrado" })
        // O mesmo CEP dá sempre a mesma rua e o mesmo bairro (a semente é o próprio número).
        const br = criarDadosBr({ semente: Number(cep) })
        const e = br.endereco(cidade)
        ok({ tipo: "encontrado", endereco: { logradouro: e.logradouro, bairro: e.bairro, cidade: cidade.nome, uf: cidade.uf } })
      }, latencia())
      sinal.addEventListener("abort", () => {
        clearTimeout(t)
        erro(new DOMException("Consulta cancelada", "AbortError"))
      })
    })
}
