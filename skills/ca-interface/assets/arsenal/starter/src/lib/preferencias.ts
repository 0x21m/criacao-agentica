import * as React from "react"

// MIFT: preferências do app inteiro, guardadas neste aparelho (localStorage) e lidas por qualquer peça
// sem passar props. A biblioteca usa `ocultarValores` (botão do olho no cabeçalho; o Valor respeita).
// Cada app acrescenta as suas com `definirPadroes` (ex.: empresa, período) antes de montar.

export type Preferencias = { ocultarValores: boolean } & Record<string, unknown>

let padrao: Preferencias = { ocultarValores: false }
let chave = "mift-preferencias"
let atual: Preferencias = padrao
let lido = false
const ouvintes = new Set<() => void>()

function carregar() {
  if (lido || typeof window === "undefined") return
  lido = true
  try {
    atual = { ...padrao, ...JSON.parse(localStorage.getItem(chave) ?? "{}") }
  } catch {
    atual = padrao
  }
}

/** Padrões do app e nome da chave no aparelho. Chame uma vez, antes de montar o app. */
export function definirPadroes(novos: Partial<Preferencias>, nomeDaChave?: string) {
  padrao = { ...padrao, ...novos }
  if (nomeDaChave) chave = nomeDaChave
  lido = false
  carregar()
}

export function definirPreferencia(nome: string, valor: unknown) {
  carregar()
  atual = { ...atual, [nome]: valor }
  try {
    localStorage.setItem(chave, JSON.stringify(atual))
  } catch {
    // Armazenamento bloqueado (janela privada, cota): segue sem guardar.
  }
  ouvintes.forEach((f) => f())
}

export function usePreferencias<T extends Preferencias = Preferencias>() {
  carregar()
  return React.useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => atual as T,
    () => padrao as T
  )
}
