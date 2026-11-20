// Sessão do cliente (Portal, 5.12): qual cliente está "logada" no portal. Escolhida na barra F ("Ver como cliente…")
// ou por ?cliente=C-0012 na URL (que fica guardado); padrão: a Juliana Castro (C-0007), a persona dos roteiros.
// Fica em "proto-cliente" neste aparelho. É só o id: o registro da cliente é do módulo Clientes (o Portal monta o
// `useCliente()` dele em cima deste).
//
// Igual à sessão do operador (permissoes.ts): no servidor e na hidratação vale a padrão, o HTML é o mesmo para todos.
// Quando a guardada é outra, o Base.astro marca html[data-cliente-pendente] (e data-cliente-casca-pendente) antes da
// pintura, o CSS esconde o conteúdo do portal e a conta no topo, e os hooks abaixo tiram a marca depois de a ilha
// renderizar com a cliente de verdade: ninguém vê, nem por um quadro, o dado de outra cliente.
import { useEffect, useSyncExternalStore } from "react"

export const CLIENTE_PADRAO = "C-0007"
const CHAVE = "proto-cliente"
const noNavegador = typeof window !== "undefined"
const valido = (x: unknown): x is string => typeof x === "string" && /^C-\d{4}$/.test(x)

function lerGuardado(): string {
  let g: string | null = null
  try { g = localStorage.getItem(CHAVE) } catch {}
  const daUrl = new URLSearchParams(location.search).get("cliente")
  return valido(daUrl) ? daUrl : valido(g) ? g : CLIENTE_PADRAO
}

let atual = CLIENTE_PADRAO
const ouvintes = new Set<() => void>()
if (noNavegador) {
  atual = lerGuardado()
  if (new URLSearchParams(location.search).has("cliente")) guardar()
  addEventListener("storage", (e) => {
    if (e.key !== CHAVE) return
    atual = lerGuardado()
    ouvintes.forEach((f) => f())
  })
}
function guardar() {
  try { if (atual === CLIENTE_PADRAO) localStorage.removeItem(CHAVE); else localStorage.setItem(CHAVE, atual) } catch {}
}

/** O id da cliente da sessão, fora do React (ações do portal, simulações). */
export const clienteDaSessao = () => atual
/** Troca a cliente da sessão (barra F, "Ver como cliente…"). */
export function definirClienteDaSessao(id: string) {
  if (!valido(id) || id === atual) return
  atual = id
  guardar()
  ouvintes.forEach((f) => f())
}

const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }
const liberar = (marca: string) => { if (noNavegador) document.documentElement.removeAttribute(marca) }

/**
 * O id da cliente da sessão. No servidor e na hidratação, a padrão; depois, a guardada. `marca`: a casca do portal
 * (a conta no topo) usa "data-cliente-casca-pendente", para não liberar o conteúdo antes da hora; `null` não libera nada
 * (a barra F).
 */
export function useClienteDaSessao(marca: "data-cliente-pendente" | "data-cliente-casca-pendente" | null = "data-cliente-pendente"): string {
  const id = useSyncExternalStore(assinar, () => atual, () => CLIENTE_PADRAO)
  useEffect(() => { if (marca && id === atual) liberar(marca) }, [id, marca])
  return id
}
