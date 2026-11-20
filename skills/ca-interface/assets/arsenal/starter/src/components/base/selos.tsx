// SeloEixo e FraseDoCliente (D6): o rótulo do operador e a frase do cliente saem de src/proto/projecao.ts, nunca de
// string escrita na tela. Selo = ícone + texto + cor do tom (nunca só cor), uma linha, sem quebrar.
import type { ReactNode } from "react"
import { CircleCheck, CircleDashed, CircleDot, Clock, TriangleAlert, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Ctx, Projecao, Tom } from "@/proto/projecao"

const TOM: Record<Tom, { variante: "azul" | "alerta" | "positivo" | "neutro" | "negativo"; icone: LucideIcon }> = {
  info: { variante: "azul", icone: CircleDot },
  neutro: { variante: "neutro", icone: CircleDashed },
  aviso: { variante: "alerta", icone: Clock },
  sucesso: { variante: "positivo", icone: CircleCheck },
  perigo: { variante: "negativo", icone: TriangleAlert },
}
export const varianteDoTom = (t: Tom) => TOM[t].variante

/**
 * Selo de um eixo: `<SeloEixo p={ETAPA_OS[os.etapa]} ctx={ctxDaOS(os)} detalhe />`.
 * `detalhe` acrescenta o complemento da projeção ("v1 · vence 26/11"), cortado com reticências se faltar espaço.
 */
export function SeloEixo({ p, ctx = {}, detalhe = false, className }: { p: Projecao; ctx?: Ctx; detalhe?: boolean; className?: string }) {
  const { variante, icone: I } = TOM[p.tom]
  const extra = detalhe ? p.detalhe?.(ctx) : undefined
  const texto = extra ? `${p.rotulo} · ${extra}` : p.rotulo
  return (
    <Badge variant={variante} className={cn("max-w-full min-w-0", className)} title={texto}>
      <I aria-hidden="true" /><span className="truncate">{texto}</span>
    </Badge>
  )
}

/** O que o cliente lê neste estado (portal, e-mail, WhatsApp), com a ação dele. Nada se o cliente não vê o estado. */
export function FraseDoCliente({ p, ctx = {}, className, acao }: { p: Projecao; ctx?: Ctx; className?: string; acao?: ReactNode }) {
  if (!p.cliente) return null
  return (
    <p className={cn("text-sm text-pretty", className)}>
      {p.cliente(ctx)}{" "}
      {acao ?? (p.acaoCliente && <span className="text-muted-foreground">({p.acaoCliente})</span>)}
    </p>
  )
}
