/**
 * Versão adaptada de components/ui/stats-card-2.tsx para o template categorias.
 * Mudanças em relação ao original:
 * - gradiente com var(--primary) em vez de hsl(var(--primary)) (inválido com tema em oklch);
 * - id do gradiente por useId (dois cards na mesma tela não colidem);
 * - respeita movimento reduzido (useReducedMotion);
 * - textos por props, formatação pt-BR, ícones lucide em vez de imagens do CDN;
 * - cores da participação por token (--chart-N), variação por --sucesso / --destructive;
 * - sparkline com descrição em texto e largura fluida.
 * Visual mantido: card shadcn, valor + unidade na mesma linha de base, sparkline de borda a borda,
 * barra empilhada de 8px com legenda, lista com divisória.
 */
import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { brl, pct } from "../_base/formato"

export type Participacao = { nome: string; fracao: number; cor: string }
export type ItemLista = { icone: LucideIcon; nome: string; detalhe: string; valor: number; variacao: number }

export interface CardParticipacaoProps extends React.HTMLAttributes<HTMLDivElement> {
  titulo: string
  valor: string
  unidade?: string
  variacao: number
  serie: number[]
  descricaoSerie: string
  tituloParticipacao: string
  participacao: Participacao[]
  itens: ItemLista[]
}

function Sparkline({ data, descricao }: { data: number[]; descricao: string }) {
  const id = React.useId()
  const reduzido = useReducedMotion()
  const W = 320
  const H = 80
  const sw = 2
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const faixa = max - min || 1
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * W},${H - ((d - min) / faixa) * (H - sw * 2) + sw}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-20 w-full text-primary" role="img" aria-label={descricao}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`M${pts}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={reduzido ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d={`M${pts} L${W},${H} L0,${H} Z`}
        fill={`url(#${id})`}
        initial={reduzido ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.2 }}
      />
    </svg>
  )
}

export const CardParticipacao = React.forwardRef<HTMLDivElement, CardParticipacaoProps>(
  ({ titulo, valor, unidade, variacao, serie, descricaoSerie, tituloParticipacao, participacao, itens, className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm", className)} {...props}>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{titulo}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight tabular-nums">{valor}</span>
          {unidade && <span className="text-lg font-medium text-muted-foreground">{unidade}</span>}
        </div>
        <p className={cn("text-sm font-semibold tabular-nums", variacao >= 0 ? "text-sucesso" : "text-destructive")}>
          {pct(variacao)} <span className="font-normal text-muted-foreground">vs. mês anterior</span>
        </p>
      </div>

      <div className="-mx-6 my-4">
        <Sparkline data={serie} descricao={descricaoSerie} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">{tituloParticipacao}</h3>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {participacao.map((p) => (
            <li key={p.nome} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: p.cor }} />
              <span className="text-muted-foreground">{p.nome}</span>
              <span className="font-semibold tabular-nums">{pct(p.fracao).replace("+", "")}</span>
            </li>
          ))}
        </ul>
        <div className="flex h-2 w-full overflow-hidden rounded-full" aria-hidden="true">
          {participacao.map((p) => (
            <div key={p.nome} className="h-full" style={{ width: `${p.fracao * 100}%`, background: p.cor }} />
          ))}
        </div>
      </div>

      <ul className="space-y-4 border-t pt-4">
        {itens.map((it) => (
          <li key={it.nome} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <it.icone className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{it.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{it.detalhe}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{brl(it.valor)}</p>
              <p className={cn("text-xs font-medium tabular-nums", it.variacao >= 0 ? "text-sucesso" : "text-destructive")}>{pct(it.variacao)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  ),
)
CardParticipacao.displayName = "CardParticipacao"
