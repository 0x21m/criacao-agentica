/**
 * Versão com props de components/ui/stats-bento.tsx, para o template resumo-do-mes.
 * Mudanças em relação ao original: textos e números viram props; "★" virou ícone lucide;
 * #808080 da textura virou a cor do texto do herói (currentColor); sem min-h-screen;
 * rótulo antes do valor na ordem de leitura e texto alternativo nas mini barras.
 * Visual (grade 6 colunas, raios, textura mascarada, pesos) mantido.
 */
import type { ComponentType } from "react"
import { cn } from "@/lib/utils"
import { atraso, entrada } from "../_base/esqueleto"

export type BentoDestaqueProps = {
  heroi: { selo: string; valor: string; texto: string }
  crescimento: { rotulo: string; valor: string; barras: number[]; descricaoBarras: string }
  contagem: { valor: string; rotulo: string }
  nota: { valor: string; rotulo: string; icone: ComponentType<{ className?: string }> }
  className?: string
}

export function BentoDestaque({ heroi, crescimento, contagem, nota, className }: BentoDestaqueProps) {
  const max = Math.max(...crescimento.barras, 1)
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2", className)}>
      <div className={cn("relative flex min-h-56 flex-col justify-between overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:col-span-3 md:row-span-2 md:p-10", entrada)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,currentColor_0px_1px,transparent_1px_10px)] opacity-15 mask-[radial-gradient(ellipse_80%_50%_at_100%_0%,#000_70%,transparent_110%)]"
        />
        <div className="relative">
          <p className="mb-6 inline-block rounded-full bg-primary-foreground/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-primary-foreground/70 uppercase">{heroi.selo}</p>
          <p className="text-6xl tracking-tighter tabular-nums">{heroi.valor}</p>
        </div>
        <p className="relative max-w-xs text-sm text-primary-foreground/70">{heroi.texto}</p>
      </div>

      <div className={cn("flex items-center justify-between gap-4 rounded-3xl border border-border bg-muted p-8 md:col-span-3", entrada)} style={atraso(1)}>
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{crescimento.rotulo}</p>
          <p className="text-3xl text-foreground tabular-nums">{crescimento.valor}</p>
        </div>
        <div className="flex h-8 items-end gap-1" role="img" aria-label={crescimento.descricaoBarras}>
          {crescimento.barras.map((h, i) => (
            <div key={i} className="w-1.5 rounded-full bg-foreground" style={{ height: `${Math.max(8, (h / max) * 100)}%` }} />
          ))}
        </div>
      </div>

      <div className={cn("flex flex-col justify-center rounded-3xl border border-border bg-card p-6 text-center md:col-span-1", entrada)} style={atraso(2)}>
        <p className="order-1 text-2xl text-foreground tabular-nums">{contagem.valor}</p>
        <p className="order-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{contagem.rotulo}</p>
      </div>

      <div className={cn("flex items-center gap-4 rounded-3xl bg-muted p-6 md:col-span-2", entrada)} style={atraso(3)}>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background text-foreground shadow-sm">
          <nota.icone className="size-5" />
        </span>
        <div>
          <p className="text-sm leading-none text-foreground tabular-nums">{nota.valor}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{nota.rotulo}</p>
        </div>
      </div>
    </div>
  )
}
