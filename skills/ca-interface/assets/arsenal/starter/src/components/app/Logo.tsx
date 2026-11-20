import { MARCA } from "@/proto/marca"
import { cn } from "@/lib/utils"

/** Logo da marca (SVG de src/proto/marca.ts) num ladrilho do acento, com a luz de 1 px do sistema. */
export function Logo({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_4px_12px_-6px_var(--primary)] [&>svg]:size-[62%]", className)}
      dangerouslySetInnerHTML={{ __html: MARCA.logo }} />
  )
}
