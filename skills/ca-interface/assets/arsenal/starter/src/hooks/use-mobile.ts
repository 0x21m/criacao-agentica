import * as React from "react"

const MOBILE_BREAKPOINT = 768
// Casca compacta (barra inferior, menu em gaveta) até o tablet em pé; as camadas seguem os 768 px.
export const CASCA_COMPACTA = 1024

export function useIsMobile(limite = MOBILE_BREAKPOINT) {
  // Começa pelo tamanho real da janela: no celular, o primeiro quadro não desenha a versão larga (busca, cabeçalho).
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => (typeof window === "undefined" ? undefined : window.innerWidth < limite))

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${limite - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < limite)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < limite)
    return () => mql.removeEventListener("change", onChange)
  }, [limite])

  return !!isMobile
}

/** Tela de toque (ponteiro grosso): decide gestos, não tamanhos (tamanhos de toque ficam no CSS, `pointer-coarse:`). */
export function useToque() {
  // Começa pelo que a tela já é (no celular, o primeiro quadro não desenha a versão de mouse).
  const [toque, setToque] = React.useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches)
  React.useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)")
    const ver = () => setToque(m.matches)
    ver()
    m.addEventListener("change", ver)
    return () => m.removeEventListener("change", ver)
  }, [])
  return toque
}
