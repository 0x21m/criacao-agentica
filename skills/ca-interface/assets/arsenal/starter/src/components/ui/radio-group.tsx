import { cn } from "@/lib/utils"
import {
  composeRenderProps,
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
  type RadioGroupProps,
  type RadioProps,
} from "react-aria-components"

import { opcaoEmCartao } from "@/components/ui/checkbox"

// MIFT: a mesma falha do Checkbox e do Switch: no original a raiz ERA o círculo de 16 px e o rótulo
// (children) era desenhado dentro dele. Aqui a raiz é uma linha (círculo + rótulo ao lado) e o círculo
// é um span que lê o estado da raiz; sem rótulo filho, fica só o círculo (o uso com FieldLabel ao lado
// continua igual). Círculo de 20 px no toque.
// MIFT: marcado no escuro, o círculo usa a cor principal (o `dark:bg-input/30` vencia).
// MIFT: `variante="cartao"`: a opção inteira é um cartão de 44 px (a mesma classe da caixa em cartão).

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={composeRenderProps(className, (c) => cn("grid w-full gap-2", c))}
      {...props}
    />
  )
}

function RadioGroupItem({ className, children, variante = "padrao", ...props }: RadioProps & { variante?: "padrao" | "cartao" }) {
  return (
    <RadioPrimitive
      data-slot="radio-group-item"
      data-variante={variante}
      className={composeRenderProps(className, (c) =>
        cn(
          "group/radio-group-item peer relative inline-flex min-w-0 items-start gap-2.5 text-sm leading-snug outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          variante === "cartao" && opcaoEmCartao,
          c
        )
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected }) => (
        <>
          <span
            data-slot="radio-group-indicator"
            aria-hidden
            className="relative mt-px flex size-4 shrink-0 items-center justify-center rounded-full border border-input after:absolute after:-inset-x-3 after:-inset-y-2 pointer-coarse:mt-0 pointer-coarse:size-5 dark:bg-input/30 group-data-[focus-visible]/radio-group-item:border-ring group-data-[focus-visible]/radio-group-item:ring-3 group-data-[focus-visible]/radio-group-item:ring-ring/50 group-data-[invalid]/radio-group-item:border-destructive group-data-[invalid]/radio-group-item:ring-3 group-data-[invalid]/radio-group-item:ring-destructive/20 group-data-[selected]/radio-group-item:border-primary group-data-[selected]/radio-group-item:bg-primary dark:group-data-[selected]/radio-group-item:bg-primary group-has-[:focus-visible]/field-label:ring-0"
          >
            {isSelected && <span className="size-2 rounded-full bg-primary-foreground" />}
          </span>
          {children !== undefined && children !== null && children !== false && (
            <span data-slot="radio-group-label" className="min-w-0 pointer-coarse:pt-0.5">
              {children}
            </span>
          )}
        </>
      ))}
    </RadioPrimitive>
  )
}

export { RadioGroup, RadioGroupItem }
