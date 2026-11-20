// Ponto de "ao vivo" que pulsa cerca de 3 vezes e para. Troque `chave` para pulsar de novo (ex.: dado novo chegou).
// Uso: <PulsoAoVivo rotulo="Ao vivo" />  ·  <PulsoAoVivo tom="aviso" chave={contador} />
import { cn } from "@/lib/utils"

const TOM = { sucesso: "bg-sucesso", aviso: "bg-aviso", perigo: "bg-destructive", destaque: "bg-primary" }

export function PulsoAoVivo({ rotulo, tom = "sucesso", chave, className }: {
  rotulo?: string; tom?: keyof typeof TOM; chave?: string | number; className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="relative inline-flex size-2">
        <span
          key={chave}
          aria-hidden="true"
          className={cn("absolute inset-0 rounded-full motion-reduce:hidden", TOM[tom])}
          style={{ animation: "pulso-anel 1.4s cubic-bezier(0.23, 1, 0.32, 1) 3 both" }}
        />
        <span className={cn("relative inline-flex size-2 rounded-full", TOM[tom])} />
      </span>
      {rotulo}
    </span>
  )
}
