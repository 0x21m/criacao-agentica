// Abertura (splash): agora é uma camada estática do layout (#abertura em src/layouts/Base.astro), ligada pelo script do
// <head>: uma vez por aparelho (localStorage "proto-abertura-vista"), só na home, sem movimento reduzido, até 1,2 s, com
// "Pular". Sai sozinha e dispara "proto:abertura-fim". Este módulo só expõe o gancho que a home usa para segurar a
// entrada dela até a abertura sair. Liga e desliga em src/proto/marca.ts.
import { useSyncExternalStore } from "react"

const EVENTO = "proto:abertura-fim"
const pendente = () => document.documentElement.hasAttribute("data-abertura")

/** true quando não há abertura tocando: a home usa para segurar a entrada até a abertura sair. */
export function useAberturaAcabou() {
  return useSyncExternalStore(
    (f) => { window.addEventListener(EVENTO, f); return () => window.removeEventListener(EVENTO, f) },
    () => !pendente(),
    () => false,
  )
}

/** Mantido para as páginas que ainda o importam: a abertura não precisa mais de ilha. */
export default function Abertura() {
  return null
}
