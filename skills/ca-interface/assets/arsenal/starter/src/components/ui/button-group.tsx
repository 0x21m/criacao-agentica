import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

import { Separator } from "@/components/ui/separator"
import { classesEquilibradas, useLinhasEquilibradas } from "@/hooks/use-linhas-equilibradas"

// MIFT: `separado` é a fila de botões soltos (com vão, sem as bordas coladas): ações irmãs que não são uma escolha
// ("Copiar", "Baixar", "Compartilhar"; os tamanhos de um exemplo). Quando não cabe numa linha, quebra equilibrada
// (useLinhasEquilibradas): linhas cheias com itens de largura igual, nunca 3 + 2 + 1. O grupo colado (padrão do
// shadcn) é para ações de um mesmo objeto lado a lado e não quebra. Escolha entre grupo, segmentado e menu: ver
// docs/padroes.md ("Skins e grupos de botões").

const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "**:data-slot:rounded-r-none [&_[data-slot]~[data-slot]]:rounded-l-none [&_[data-slot]~[data-slot]]:border-l-0 [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg!",
        vertical:
          "flex-col **:data-slot:rounded-b-none [&_[data-slot]~[data-slot]]:rounded-t-none [&_[data-slot]~[data-slot]]:border-t-0 [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg!",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation,
  separado = false,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof buttonGroupVariants> & {
    /** Botões soltos, com vão, que quebram de linha equilibrados (sem as bordas coladas do grupo). */
    separado?: boolean
  }) {
  const proprio = React.useRef<HTMLDivElement | null>(null)
  const juntarRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      proprio.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )
  useLinhasEquilibradas(proprio, separado)
  return (
    <div
      ref={juntarRef}
      role="group"
      data-slot={separado ? "button-group-separado" : "button-group"}
      data-orientation={orientation}
      className={cn(
        separado
          ? cn("flex w-fit max-w-full flex-wrap items-center gap-2", orientation === "vertical" && "flex-col items-stretch", classesEquilibradas)
          : buttonGroupVariants({ orientation }),
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  render,
  ...props
}: React.ComponentProps<"div"> & {
  render?: (props: React.HTMLAttributes<HTMLElement>) => React.ReactNode
}) {
  if (render) {
    const renderProps = {
      "data-slot": "button-group-text",
      className: cn(
        "flex items-center gap-2 rounded-lg border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
    }

    return render(renderProps)
  }

  return (
    <div
      data-slot="button-group-text"
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}
