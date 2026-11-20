import { cn } from "@/lib/utils"
import {
  Checkbox as CheckboxPrimitive,
  CheckboxGroup as CheckboxGroupPrimitive,
  composeRenderProps,
  type CheckboxGroupProps,
  type CheckboxProps,
} from "react-aria-components"
import { CheckIcon, MinusIcon } from "lucide-react"

// MIFT: no original, o elemento raiz ERA a caixa de 16 px e o rótulo (children) era desenhado
// dentro dela, quebrando palavra por palavra (mesma falha do Switch). Aqui a raiz é uma linha
// (caixa + rótulo ao lado) e a caixa é um span que lê o estado da raiz. Caixa de 20 px no toque.
// MIFT: marcada no escuro, a caixa usa a cor principal (o `dark:bg-input/30` vencia e uma marca clara sumia).
// MIFT: `variante="cartao"` (escolhas de formulário: serviços, turmas): a opção inteira é um cartão de 44 px com
// borda, fundo quando marcada e anel de foco no cartão todo. `CheckboxGroup` agrupa com nome e erro (React Aria).

/** Escolha múltipla: o grupo tem o nome (rótulo) e o erro; as caixas ficam empilhadas. */
function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={composeRenderProps(className, (c) => cn("grid w-full gap-2", c))}
      {...props}
    />
  )
}

/** As classes da opção em cartão (caixa e rádio usam a mesma). */
export const opcaoEmCartao =
  "w-full rounded-xl border border-input px-3.5 py-3 min-h-11 transition-colors hover:bg-muted/50 data-[selected]:border-primary/60 data-[selected]:bg-primary/6 data-[focus-visible]:border-ring data-[focus-visible]:ring-3 data-[focus-visible]:ring-ring/50 data-[invalid]:border-destructive/60 *:data-[slot=checkbox-label]:flex-1 *:data-[slot=radio-group-label]:flex-1"

function Checkbox({ className, children, variante = "padrao", ...props }: CheckboxProps & { variante?: "padrao" | "cartao" }) {
  return (
    <CheckboxPrimitive
      data-slot="checkbox"
      data-variante={variante}
      className={composeRenderProps(className, (c) =>
        cn(
          "peer group/checkbox relative inline-flex min-h-6 min-w-0 items-start gap-2.5 text-sm leading-snug outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 group-has-disabled/field:opacity-50",
          variante === "cartao" && opcaoEmCartao,
          c
        )
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected, isIndeterminate }) => (
        <>
          <span
            data-slot="checkbox-box"
            aria-hidden
            className="relative mt-px flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input text-primary-foreground transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 pointer-coarse:mt-0 pointer-coarse:size-5 pointer-coarse:after:-inset-y-2.5 dark:bg-input/30 group-data-[focus-visible]/checkbox:border-ring group-data-[focus-visible]/checkbox:ring-3 group-data-[focus-visible]/checkbox:ring-ring/50 group-data-[invalid]/checkbox:border-destructive group-data-[invalid]/checkbox:ring-3 group-data-[invalid]/checkbox:ring-destructive/20 group-data-[selected]/checkbox:border-primary group-data-[selected]/checkbox:bg-primary group-data-[indeterminate]/checkbox:border-primary group-data-[indeterminate]/checkbox:bg-primary dark:group-data-[selected]/checkbox:bg-primary dark:group-data-[indeterminate]/checkbox:bg-primary group-has-[:focus-visible]/field-label:ring-0 dark:group-data-[invalid]/checkbox:border-destructive/50 dark:group-data-[invalid]/checkbox:ring-destructive/40 [&>svg]:size-3.5"
          >
            {isIndeterminate ? <MinusIcon /> : isSelected ? <CheckIcon /> : null}
          </span>
          {children !== undefined && children !== null && children !== false && (
            <span data-slot="checkbox-label" className="min-w-0 pointer-coarse:pt-0.5">
              {children}
            </span>
          )}
        </>
      ))}
    </CheckboxPrimitive>
  )
}

export { Checkbox, CheckboxGroup }
