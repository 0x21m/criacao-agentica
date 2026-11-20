import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

// MIFT: nome acessível em português ("Carregando"). Dentro de um botão em andamento, o Button já
// desenha o próprio indicador (isPending); não ponha um Spinner à mão lá dentro.

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Carregando" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
