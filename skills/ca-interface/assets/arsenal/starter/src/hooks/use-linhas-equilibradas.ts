import * as React from "react"

// MIFT: fila de botões, segmentos ou chips que quebra de linha nunca fica torta (3 + 2 + 1) nem deixa órfão. Quando os
// itens não cabem numa linha, o contêiner se equilibra pela conta: colunas = itens ÷ linhas (6 que cabem 4 por linha
// viram 3 + 3; 5 viram 3 + 2). Até duas linhas, cada linha ocupa a largura toda ("cheio": os itens crescem por igual,
// bordas alinhadas). Lista longa (três linhas ou mais, como os códigos de um mapa) vira grade de colunas iguais
// ("grade": a última linha pode ter menos itens, alinhados às colunas). Tudo pelo CSS de `classesEquilibradas`; o
// detector `grupo-assimetrico` do auditor confere. Regra em docs/padroes.md ("Skins e grupos de botões").

/** O tocável de um item da fila (o próprio item ou o único filho dele, quando o item é um <li>). */
const ehTocavel = (c: Element) =>
  c.matches("button, a[href], [role=button], [role=radio], [role=checkbox]") ||
  (c.children.length === 1 && c.firstElementChild!.matches("button, a[href], [role=button], [role=radio], [role=checkbox]"))

/**
 * Equilibra as linhas de um contêiner flex que quebra (flex-wrap). Marca `data-equilibrado` ("cheio" ou "grade") e
 * `--colunas`; o CSS vem de `classesEquilibradas`. Só age quando a fila é de tocáveis (botões, links, opções) e quebra.
 */
export function useLinhasEquilibradas(ref: React.RefObject<HTMLElement | null>, ativo = true) {
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !ativo || typeof ResizeObserver === "undefined") return
    let quadro = 0
    const soltar = () => {
      if (!el.hasAttribute("data-equilibrado")) return
      el.removeAttribute("data-equilibrado")
      el.style.removeProperty("--colunas")
    }
    // Largura natural de um item, sem depender do estado atual (esticado ou não): o conteúdo medido por um Range, mais
    // o preenchimento e a borda do tocável, e nunca menos que a largura mínima dele.
    const natural = (item: Element) => {
      const alvo = (item.matches("button, a[href], [role=button], [role=radio], [role=checkbox]") ? item : item.firstElementChild!) as HTMLElement
      const st = getComputedStyle(alvo)
      const faixa = document.createRange()
      faixa.selectNodeContents(alvo)
      const conteudo = faixa.getBoundingClientRect().width
      const caixa = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((s, k) => s + (parseFloat(st[k as "paddingLeft"]) || 0), 0)
      // Botão só de ícone é quadrado (size-10 dá largura, não largura mínima): a largura natural é a altura dele. Sem
      // isso, o ícone contava 18 px, a conta achava que a fila cabia numa linha e soltava o equilíbrio (2 + 1 a 320 px).
      const quadrado = alvo.matches("[data-size^=icon]") ? alvo.getBoundingClientRect().height : 0
      return Math.max(Math.ceil(conteudo + caixa), parseFloat(st.minWidth) || 0, quadrado)
    }
    const medir = () => {
      const st = getComputedStyle(el)
      if (!st.display.endsWith("flex") || st.flexWrap !== "wrap") return soltar()
      const itens = [...el.children].filter((c) => getComputedStyle(c).display !== "none")
      if (itens.length < 3 || !itens.every(ehTocavel)) return soltar()
      const vao = parseFloat(st.columnGap) || 0
      const larguras = itens.map(natural)
      const disponivel = el.clientWidth - (parseFloat(st.paddingLeft) || 0) - (parseFloat(st.paddingRight) || 0)
      if (!el.hasAttribute("data-equilibrado")) {
        // Solta, a fila só se equilibra se de fato quebrou (um item começa abaixo do fim do primeiro).
        const primeiro = itens[0].getBoundingClientRect()
        if (!itens.some((i) => i.getBoundingClientRect().top >= primeiro.bottom - 1)) return
      } else if (larguras.reduce((s, w) => s + w, 0) + vao * (itens.length - 1) <= disponivel - itens.length) return soltar()
      const maior = Math.max(...larguras)
      const porLinha = Math.max(1, Math.floor((disponivel + vao) / (maior + vao)))
      const linhas = Math.ceil(itens.length / porLinha)
      const forma = linhas > 2 ? "grade" : "cheio"
      const colunas = String(linhas > 2 ? porLinha : Math.ceil(itens.length / linhas))
      if (el.getAttribute("data-equilibrado") === forma && el.style.getPropertyValue("--colunas") === colunas) return
      el.style.setProperty("--colunas", colunas)
      el.style.setProperty("--vao", `${vao}px`)
      el.setAttribute("data-equilibrado", forma)
    }
    const agendar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(medir)
    }
    const ro = new ResizeObserver(agendar)
    ro.observe(el)
    if (el.parentElement) ro.observe(el.parentElement)
    const mo = new MutationObserver(agendar)
    mo.observe(el, { childList: true })
    medir()
    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(quadro)
    }
  }, [ref, ativo])
}

/**
 * As classes do contêiner equilibrado: largura toda, itens de largura igual (e o tocável de dentro do <li> também). Os
 * itens não animam largura (o `transition-all` do botão animava a troca de colunas e a medida pegava o meio do caminho).
 */
export const classesEquilibradas =
  "[&>*]:transition-[color,background-color,border-color,outline-color,box-shadow,opacity,translate,scale,transform] data-equilibrado:w-full data-equilibrado:[&>*]:shrink-0 data-equilibrado:[&>*]:basis-[calc((100%_-_(var(--colunas)_-_1)_*_var(--vao))/var(--colunas)_-_0.5px)] data-[equilibrado=cheio]:[&>*]:grow data-equilibrado:[&>li>*]:w-full"

/** Atalho para uma fila de botões qualquer: devolve a ref e as classes. */
export function useFilaEquilibrada<T extends HTMLElement>(ativo = true) {
  const ref = React.useRef<T | null>(null)
  useLinhasEquilibradas(ref, ativo)
  return { ref, className: classesEquilibradas }
}
