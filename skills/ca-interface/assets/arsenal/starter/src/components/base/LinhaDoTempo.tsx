// LinhaDoTempo: lê o `historico` de um registro compartilhado. Versão "operador" (tudo) e "cliente" (só os eventos
// marcados para o cliente, como a projeção filtra). Mais novo em cima; quem fez, quando e o quê.
import { Bot, User, UserRound } from "lucide-react"
import type { Evento } from "@/proto/dados"
import { cn } from "@/lib/utils"

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " às")

export function LinhaDoTempo({ eventos, versao = "operador", limite = 6, className }: { eventos: Evento[]; versao?: "operador" | "cliente"; limite?: number; className?: string }) {
  const lista = (versao === "cliente" ? eventos.filter((e) => e.cliente) : eventos).slice().reverse()
  if (!lista.length) return <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
  const mostrar = lista.slice(0, limite)
  return (
    <ol className={cn("relative grid gap-3 border-l border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pl-4", className)}>
      {mostrar.map((e, i) => {
        const I = e.quem.tipo === "sistema" ? Bot : e.quem.tipo === "cliente" ? UserRound : User
        return (
          <li key={i} className="relative">
            <span aria-hidden className="absolute top-0.5 -left-[1.6rem] grid size-5 place-items-center rounded-full bg-[var(--card)] text-muted-foreground shadow-[0_0_0_1px_var(--sup-aro)]"><I className="size-3" /></span>
            <p className="text-sm text-pretty">{e.texto}</p>
            <p className="text-xs text-muted-foreground"><span className="num">{quando(e.em)}</span> · {e.quem.nome}</p>
          </li>
        )
      })}
      {lista.length > limite && <li className="text-xs text-muted-foreground">e mais {lista.length - limite} {lista.length - limite === 1 ? "evento" : "eventos"}</li>}
    </ol>
  )
}
