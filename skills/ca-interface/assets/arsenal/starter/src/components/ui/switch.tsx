import { cn } from "@/lib/utils"
import {
  composeRenderProps,
  Switch as SwitchPrimitive,
  type SwitchProps as SwitchPrimitiveProps,
} from "react-aria-components"

// MIFT: no original, o elemento raiz ERA o trilho de 32 px e o rótulo (children)
// era desenhado dentro dele, quebrando palavra por palavra. Aqui a raiz é uma linha
// (trilho + rótulo ao lado), e o trilho é um span próprio que lê o estado da raiz.

function Switch({
  className,
  size = "default",
  children,
  ...props
}: SwitchPrimitiveProps & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive
      data-slot="switch"
      data-size={size}
      className={composeRenderProps(className, (c) =>
        cn(
          "peer group/switch relative inline-flex min-h-6 min-w-0 items-center gap-2.5 text-sm outline-none pointer-coarse:min-h-10 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          c
        )
      )}
      {...props}
    >
      {composeRenderProps(children, (children) => (
        <>
          <span
            data-slot="switch-track"
            aria-hidden
            className="relative inline-flex shrink-0 items-center rounded-full border border-transparent bg-input transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 group-data-[focus-visible]/switch:border-ring group-data-[focus-visible]/switch:ring-3 group-data-[focus-visible]/switch:ring-ring/50 group-data-[invalid]/switch:border-destructive group-data-[selected]/switch:bg-primary group-data-[size=default]/switch:h-[18.4px] group-data-[size=default]/switch:w-[32px] group-data-[size=sm]/switch:h-[14px] group-data-[size=sm]/switch:w-[24px] dark:bg-input/80 dark:group-data-[selected]/switch:bg-primary"
          >
            <span
              data-slot="switch-thumb"
              className="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[selected]/switch:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 dark:bg-foreground dark:group-data-[selected]/switch:bg-primary-foreground"
            />
          </span>
          {children !== undefined && children !== null && children !== false && (
            <span data-slot="switch-label" className="min-w-0 leading-snug">
              {children}
            </span>
          )}
        </>
      ))}
    </SwitchPrimitive>
  )
}

export { Switch }
