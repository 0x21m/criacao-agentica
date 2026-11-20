import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

/**
 * Estado de protótipo: "pronto" (com dados), "carregando" (esqueleto) e "vazio".
 * A barra de controle fica oculta e aparece com a tecla F (fora de campos de texto).
 * Ela é marcada com data-prototipo-controle: remova ao virar produto.
 */
export type EstadoTela = "pronto" | "carregando" | "vazio"

const Ctx = createContext<EstadoTela>("pronto")
export const useEstadoTela = () => useContext(Ctx)

const ROTULO: Record<EstadoTela, string> = { pronto: "Com dados", carregando: "Carregando", vazio: "Vazio" }

export function ProvedorEstado({ children, inicial = "pronto" }: { children: ReactNode; inicial?: EstadoTela }) {
  const [estado, setEstado] = useState<EstadoTela>(() => {
    const p = new URLSearchParams(window.location.search).get("estado")
    return p === "carregando" || p === "vazio" ? p : inicial
  })
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return
      if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) setVisivel((v) => !v)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <Ctx.Provider value={estado}>
      {children}
      {visivel && (
        <div
          data-prototipo-controle
          role="toolbar"
          aria-label="Controle do protótipo"
          className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-popover/95 p-1 text-popover-foreground shadow-lg backdrop-blur animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
        >
          <span className="px-2 text-xs text-muted-foreground">Estado</span>
          {(["pronto", "carregando", "vazio"] as const).map((op) => (
            <button
              key={op}
              type="button"
              aria-pressed={estado === op}
              onClick={() => setEstado(op)}
              className="rounded-full px-3 py-1 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {ROTULO[op]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setVisivel(false)}
            className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Esconder controle (tecla F)"
          >
            F
          </button>
        </div>
      )}
    </Ctx.Provider>
  )
}
