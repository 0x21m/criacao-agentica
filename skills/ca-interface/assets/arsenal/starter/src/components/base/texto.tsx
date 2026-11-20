// Texto de uma linha com reticências e o texto inteiro no title (hover) e para o leitor de tela. Para e-mail, domínio,
// código e valor: nunca quebra no meio (".com.br" não vai para a linha de baixo); corta no fim com "…".
import { cn } from "@/lib/utils"

export function Cortado({ texto, className }: { texto: string; className?: string }) {
  return <span className={cn("block min-w-0 truncate", className)} title={texto}>{texto}</span>
}

/** E-mail inteiro numa linha; se não couber, reticências no fim e o endereço completo no title. Link mailto. */
export function Email({ email, className }: { email: string; className?: string }) {
  if (!email.includes("@")) return <span className={className}>{email}</span>
  return <a href={`mailto:${email}`} title={email} className={cn("link-sistema block min-w-0 truncate whitespace-nowrap", className)}>{email}</a>
}
