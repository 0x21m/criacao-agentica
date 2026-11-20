// Rota atual para ilhas persistidas (que não remontam ao navegar): relê a cada troca de página.
import { useEffect, useState } from "react"
import { rotaAtual } from "@/lib/url"

/** `inicial`: a rota que o servidor renderizou (o item ativo já vem certo no HTML). */
export function useRota(inicial: string | null = null) {
  const [rota, setRota] = useState<string | null>(inicial)
  useEffect(() => {
    const ler = () => setRota(rotaAtual(location.pathname))
    ler()
    document.addEventListener("astro:page-load", ler)
    return () => document.removeEventListener("astro:page-load", ler)
  }, [])
  return rota
}
