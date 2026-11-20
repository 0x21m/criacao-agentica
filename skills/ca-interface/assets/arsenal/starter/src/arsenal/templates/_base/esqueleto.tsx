import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Bloco de carregamento. Pulsa só sem movimento reduzido. */
export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
}

/** Região que anuncia o carregamento para leitor de tela. */
export function Carregando({ children, rotulo = "Carregando dados", className }: { children: ReactNode; rotulo?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{rotulo}…</span>
      {children}
    </div>
  )
}

export function EstadoVazio({
  icone: Icone,
  titulo,
  texto,
  acao,
  className,
}: {
  icone: ComponentType<{ className?: string }>
  titulo: string
  texto: string
  acao?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icone className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">{texto}</p>
      </div>
      {acao}
    </div>
  )
}

/** Entrada suave, igual em todos os templates; some com movimento reduzido. */
export const entrada = "animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out fill-mode-both motion-reduce:animate-none"
/** Atraso escalonado para blocos irmãos: style={atraso(i)}. */
export const atraso = (i: number) => ({ animationDelay: `${i * 60}ms` })
