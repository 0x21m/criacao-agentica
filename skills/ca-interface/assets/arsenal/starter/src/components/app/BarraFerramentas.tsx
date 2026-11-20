// Área de barra de ferramentas da moldura: título da página, descrição curta, ações e (opcional) filtros embaixo.
// Fica grudada abaixo da barra superior ao rolar, no material de vidro da casca (.casca-fixa: desfoque, opacidade
// mínima de 82 %, fallback sólido) e na camada z-20: o conteúdo passa por baixo sem virar texto sobre texto.
// No celular o título nunca vira "…": quebra em até 2 linhas e as ações descem para a linha de baixo.
import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function BarraFerramentas({ titulo, descricao, acoes, children, className }: {
  titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode; children?: ReactNode; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // publica a altura em --ferramentas no <main>, para cabeçalhos de tabela grudarem logo abaixo
  useEffect(() => {
    const el = ref.current, main = el?.closest("main")
    if (!el || !main) return
    const ro = new ResizeObserver(() => main.style.setProperty("--ferramentas", `${el.offsetHeight}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} data-barra-ferramentas className={cn("casca-fixa sticky top-[var(--topo)] z-20 px-4 py-3 md:px-6 md:py-4", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-[min(100%,14rem)] flex-1">
          <h1 className="t-pagina line-clamp-2">{titulo}</h1>
          {descricao && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children && <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
