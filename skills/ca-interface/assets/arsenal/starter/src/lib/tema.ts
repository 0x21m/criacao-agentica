import { useEffect, useState } from "react"

// Resolver cor sem sonda no <body>: pôr um elemento na página e ler o estilo calculado força o recálculo de estilo da
// página inteira, uma vez por cor (numa tabela de 50 linhas, centenas de ms com a CPU lenta). Aqui a variável sai do
// estilo calculado da raiz (o navegador já substitui os var() de dentro) e o canvas converte a cor em hex. A sonda
// fica só de reserva, para o valor que o canvas não entende.
let tela: CanvasRenderingContext2D | null | undefined

function paraHex(cor: string): string | null {
  if (!cor || cor.includes("var(") || /currentcolor/i.test(cor) || !CSS.supports("color", cor)) return null
  if (tela === undefined) {
    const c = document.createElement("canvas")
    c.width = c.height = 1
    tela = c.getContext("2d", { willReadFrequently: true })
  }
  if (!tela) return null
  tela.clearRect(0, 0, 1, 1)
  tela.fillStyle = "#000000"
  tela.fillStyle = cor
  tela.fillRect(0, 0, 1, 1)
  const [r, g, b] = tela.getImageData(0, 0, 1, 1).data
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")
}

function porSonda(nome: string): string {
  const sonda = document.createElement("span")
  sonda.style.cssText = "position:absolute;visibility:hidden"
  sonda.style.color = nome.startsWith("--") ? `var(${nome})` : nome
  document.body.appendChild(sonda)
  const valor = getComputedStyle(sonda).color
  sonda.remove()
  return paraHex(valor) ?? "#000000"
}

/**
 * Resolve uma cor do tema em hex. Aceita o nome da variável ("--primary", "--chart-2") ou uma expressão CSS de cor.
 * Serve para componentes de canvas ou WebGL que só aceitam hex (peak-chart, GlassIconReveal).
 */
export function corDoTema(nome: string): string {
  const bruto = nome.startsWith("--") ? getComputedStyle(document.documentElement).getPropertyValue(nome).trim() : nome
  return paraHex(bruto) ?? porSonda(nome)
}

/** Mapa nome → variável CSS, em hex, relido quando o tema ou a aparência mudam. null antes de montar. */
export function useCoresDoTema<K extends string>(mapa: Record<K, string>): Record<K, string> | null {
  const chave = JSON.stringify(mapa)
  const [cores, setCores] = useState<Record<K, string> | null>(null)
  useEffect(() => {
    const ler = () => {
      const novas = Object.fromEntries(Object.entries(mapa).map(([k, v]) => [k, corDoTema(v as string)])) as Record<K, string>
      // mesma cor, mesmo objeto: a troca de página mexe nos atributos da raiz sem mudar o tema
      setCores((antes) => (antes && Object.keys(novas).every((k) => antes[k as K] === novas[k as K]) ? antes : novas))
    }
    // lido depois da pintura: ler o estilo no meio da hidratação ou da troca de página força o recálculo de estilo
    // antes da hora e atrasa a tela; quem usa estas cores (shader, canvas) entra depois de qualquer jeito
    let quadro = 0, tarefa: ReturnType<typeof setTimeout> | undefined
    const agendar = () => {
      if (quadro || tarefa) return
      quadro = requestAnimationFrame(() => { quadro = 0; tarefa = setTimeout(() => { tarefa = undefined; ler() }) })
    }
    agendar()
    const mo = new MutationObserver(agendar)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-vidro", "data-preset", "data-destaque", "data-skin"] })
    return () => { mo.disconnect(); cancelAnimationFrame(quadro); clearTimeout(tarefa) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return cores
}
