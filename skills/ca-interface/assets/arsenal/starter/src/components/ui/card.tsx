import * as React from "react"
import { cn } from "@/lib/utils"

// Starter (fase 1): o Card nasce da Superficie (.sup, nível "card", src/styles/sistema.css): o material do preset.
// MIFT: contorno e sombra por token (--anel-cartao, --sombra-cartao), para a skin e o eixo de borda trocarem a cara de
// todo cartão sem reescrever a peça (styles/global.css, seção Skins). No tema padrão, o contorno é o mesmo de antes
// (texto a 9 a 10%) com uma sombra de 1 px.
// MIFT: cabeçalho, corpo e pé separados (docs/padroes.md, "Composição"). O cabeçalho seguido de conteúdo ganha uma
// linha fina embaixo; o pé já vinha com linha e faixa de cinza sutil. Cartão só com cabeçalho, ou com a classe
// `sem-divisoria` no cabeçalho, fica como antes.

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-nivel="card"
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden sup rounded-[var(--raio-sup,var(--radius-xl))] py-(--card-spacing) text-sm [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing) [&:not(.sem-divisoria):has(+[data-slot=card-content])]:border-b [&:not(.sem-divisoria):has(+[data-slot=card-content])]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
