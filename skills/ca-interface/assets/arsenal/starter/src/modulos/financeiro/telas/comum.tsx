// Peças pequenas das telas do Financeiro: KPI sobre o banner, selo do lançamento (pela projeção) e a régua de vencidos.
import type { ReactNode } from "react"
import { SeloEixo } from "@/components/base/selos"
import { useAgora } from "@/proto/relogio"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { situacao, type Lancamento } from "../dados"

/** KPI sobre o banner: rótulo de 12 px, número em peso leve com algarismos tabulares, nunca truncado. */
export function Kpi({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: "perigo" }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{rotulo}</dt>
      <dd className={cn("t-kpi mt-1 text-[1.375rem] whitespace-nowrap sm:text-[1.5rem]", tom === "perigo" && "text-[var(--negative)]")}>{valor}</dd>
      {detalhe && <dd className="mt-0.5 text-xs text-muted-foreground">{detalhe}</dd>}
    </div>
  )
}

/** O selo do lançamento (pago, vencido, Pix expirado…), sempre pela projeção. */
export function SeloLancamento({ l, detalhe = true, semData, className }: { l: Lancamento; detalhe?: boolean; className?: string
  /** Numa tabela com a coluna Vence: o selo de "a receber", "a pagar" e "previsto" não repete a data. */ semData?: boolean }) {
  const agora = useAgora()
  const { p, ctx } = situacao(l, agora)
  const repeteData = semData && (l.estado === "previsto" || (l.estado === "em_aberto" && p.rotulo.startsWith("A ")))
  return <SeloEixo p={p} ctx={ctx} detalhe={detalhe && !repeteData} className={className} />
}

/** Régua da parte vencida de um total: a barra mostra a fração, o texto diz o valor (nunca só cor). */
export function ReguaVencidos({ total, vencido, rotulo }: { total: number; vencido: number; rotulo: string }) {
  const f = total > 0 ? Math.min(1, vencido / total) : 0
  return (
    <div role="img" aria-label={`${rotulo}: ${moeda(vencido)} de ${moeda(total)}`} className="h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--foreground)_9%,transparent)]">
      <div className="h-full rounded-full bg-[var(--negative)]" style={{ width: `${Math.max(f > 0 ? 3 : 0, f * 100)}%` }} />
    </div>
  )
}

/** Data de vencimento curta (16/11) ou com ano quando não é deste ano (12/10/2025). */
export function dataVenc(iso: string, ref: Date) {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : d.toLocaleDateString("pt-BR")
}
