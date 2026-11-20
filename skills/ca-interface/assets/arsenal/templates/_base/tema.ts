import { useEffect, useState } from "react"

/**
 * Resolve uma cor do tema e devolve em hex. Aceita o nome da variável ("--primary", "--chart-2")
 * ou qualquer expressão CSS de cor ("color-mix(in oklch, var(--chart-1) 20%, black)").
 * Serve para componentes de canvas ou WebGL que só aceitam hex.
 */
export function corDoTema(nome: string, escopoEscuro = false): string {
  // escopoEscuro: lê os tokens do tema escuro mesmo com a página no claro (para componentes desenhados para fundo escuro)
  const caixa = document.createElement("div")
  if (escopoEscuro) caixa.className = "dark"
  caixa.style.display = "none"
  const sonda = document.createElement("span")
  sonda.style.color = nome.startsWith("--") ? `var(${nome})` : nome
  caixa.appendChild(sonda)
  document.body.appendChild(caixa)
  const valor = getComputedStyle(sonda).color
  caixa.remove()
  if (!valor) return "#000000"
  const c = document.createElement("canvas")
  c.width = c.height = 1
  const ctx = c.getContext("2d", { willReadFrequently: true })
  if (!ctx) return "#000000"
  ctx.fillStyle = "#000"
  ctx.fillStyle = valor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")
}

function observarTema(cb: () => void) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
  return () => mo.disconnect()
}

/** Mapa nome → variável CSS, devolvido em hex e relido quando o tema troca. */
export function useCoresDoTema<K extends string>(mapa: Record<K, string>, opcoes: { escuro?: boolean } = {}): Record<K, string> {
  const chave = JSON.stringify(mapa) + String(opcoes.escuro)
  const ler = () => Object.fromEntries(Object.entries(mapa).map(([k, v]) => [k, corDoTema(v as string, opcoes.escuro)])) as Record<K, string>
  const [cores, setCores] = useState(ler)
  useEffect(() => {
    setCores(ler())
    return observarTema(() => setCores(ler()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return cores
}

export function useTemaEscuro() {
  const ler = () => document.documentElement.classList.contains("dark")
  const [escuro, setEscuro] = useState(ler)
  useEffect(() => observarTema(() => setEscuro(ler())), [])
  return escuro
}

export function useMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduzido(q.matches)
    q.addEventListener("change", on)
    return () => q.removeEventListener("change", on)
  }, [])
  return reduzido
}
