import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import {
  composeRenderProps,
  Button as ButtonPrimitive,
  Link as LinkPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components"

import { buttonVariants } from "./button-variants"
import { Tooltip } from "./tooltip"

// MIFT: `buttonVariants` mora em `button-variants.ts` (sem React Aria), para sites `.astro` usarem as mesmas classes;
// este arquivo o reexporta, então quem importava daqui continua igual.

// MIFT: altura que a tela pede (h-11, size-11, h-14) vale em todo aparelho. Sem isto, o
// pointer-coarse:h-10 do tamanho venceria no toque (variante diferente: o tailwind-merge não junta).
// Pedidos menores (size-6, h-auto) continuam crescendo no toque.

function classesDoBotao(props: Parameters<typeof buttonVariants>[0] & { className?: string }) {
  const classes = cn(buttonVariants(props))
  const pedida = /(?:^|\s)(?:h|size)-(\d+(?:\.5)?)(?=\s|$)/.exec(props.className ?? "")
  if (!pedida || Number(pedida[1]) < 10) return classes
  return classes.replace(/(^|\s)pointer-coarse:(h|size)-\S+/g, "")
}

// MIFT: todo botão só de ícone mostra o próprio nome (aria-label) numa dica ao
// passar o mouse ou focar pelo teclado. `dica` troca o texto; `dica={false}` desliga.
// MIFT: `isPending` (ação em andamento) troca o ícone do botão por um indicador girando e mantém o
// foco e o tamanho; o React Aria anuncia o andamento e ignora novos toques (sem envio duplicado).

// MIFT: aceita `disabled` (como no shadcn com Radix e em blocos de terceiros) além do `isDisabled` do React Aria:
// sem isso, um botão "desabilitado" vindo do ecossistema continuava clicável.
// MIFT: `aria-keyshortcuts` também chega ao DOM (pela ref), como o atalho que o `useAtalhos` declara.
// MIFT: `aria-invalid` num botão que abre um campo (data, arquivo) virava nada: o React Aria não repassa o atributo
// (e a ARIA 1.2 nem o aceita em button). Ele vira `data-invalid`, que leva o estilo de erro; o erro é anunciado pelo
// aria-describedby da mensagem, que o campo já liga.

function Button({
  className,
  variant = "default",
  size = "default",
  dica,
  children,
  disabled,
  isDisabled,
  "aria-invalid": invalido,
  "aria-keyshortcuts": atalhos,
  ref,
  ...props
}: Omit<ButtonPrimitiveProps, "className"> &
  React.RefAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    className?: string
    dica?: React.ReactNode | false
    disabled?: boolean
    "aria-invalid"?: boolean | "true" | "false"
    /** O atalho do botão ("Shift+R"): o React Aria não repassa o atributo; vai ao DOM pela ref. */
    "aria-keyshortcuts"?: string
  }) {
  const refDoBotao = React.useCallback(
    (el: HTMLButtonElement | null) => {
      if (el) {
        if (atalhos) el.setAttribute("aria-keyshortcuts", atalhos)
        else el.removeAttribute("aria-keyshortcuts")
      }
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [atalhos, ref]
  )
  // MIFT: botão só de ícone (um componente de ícone como único filho, com aria-label) num tamanho de texto vira o
  // tamanho de ícone equivalente: quadrado, nunca 36 × 32 com o vão de um rótulo que não existe.
  const soIcone =
    !!props["aria-label"] && !String(size).startsWith("icon") && React.isValidElement(children) && typeof children.type !== "string" && !(children.type === React.Fragment)
  if (soIcone) size = ({ xs: "icon-xs", sm: "icon-sm", lg: "icon-lg" } as const)[size as "xs" | "sm" | "lg"] ?? "icon"
  const botao = (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(classesDoBotao({ variant, size, className }), "data-[pending]:[&_svg:not([data-pendente])]:hidden")}
      isDisabled={isDisabled ?? disabled}
      data-invalid={invalido === true || invalido === "true" ? "true" : undefined}
      ref={refDoBotao}
      {...props}
    >
      {composeRenderProps(children, (filhos, { isPending }) =>
        isPending ? (
          <>
            <Loader2Icon data-pendente aria-hidden className="animate-spin" />
            {filhos}
          </>
        ) : (
          filhos
        )
      )}
    </ButtonPrimitive>
  )
  const texto = dica === false ? null : (dica ?? (String(size).startsWith("icon") ? props["aria-label"] : null))
  if (!texto) return botao
  return (
    <TooltipTriggerPrimitive delay={450} closeDelay={0}>
      {botao}
      <Tooltip>{texto}</Tooltip>
    </TooltipTriggerPrimitive>
  )
}

function LinkButton({
  className,
  variant = "default",
  size = "default",
  ...props
}: Omit<LinkPrimitiveProps, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string
  }) {
  return (
    <LinkPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classesDoBotao({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, LinkButton, buttonVariants }
