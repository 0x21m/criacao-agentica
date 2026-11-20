import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// MIFT: além das variantes de tom, a `forma` do selo: "pilula" (fundo do tom, o padrão), "bandeira" (faixa cheia do
// tom à esquerda, cantos retos: fila, triagem, linha de tabela) e "ponto" (ponto colorido e texto na cor do texto:
// listas densas, legendas). Status é sempre selo (docs/padroes.md, "Composição"); a cor sólida de cada tom vem de
// --selo, que cada variante define. O `destructive` usa o mesmo texto do botão de recusar (--texto-negativo), com folga
// de contraste também sobre fundo cinza.

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-negativo-texto focus-visible:ring-destructive/20 dark:bg-destructive/15 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // MIFT: estados (positivo, negativo, alerta, neutro) e quatro matizes de série. Cada projeto diz
        // o que cada matiz significa no seu domínio (ex.: azul = receita) e mantém esse sentido em toda tela.
        azul: "bg-azul/12 text-azul-texto [--selo:var(--color-azul)]",
        ambar: "bg-ambar/14 text-ambar-texto [--selo:var(--color-ambar)]",
        turquesa: "bg-turquesa/14 text-turquesa-texto [--selo:var(--color-turquesa)]",
        violeta: "bg-violeta/12 text-violeta-texto [--selo:var(--color-violeta)]",
        positivo: "bg-positive/14 text-positive [--selo:var(--color-positive)]",
        // texto pelo --texto-negativo (mais escuro no claro, mais claro no escuro): o "Atrasada" media 4,6:1 com vidro claro
        negativo: "bg-negative/12 text-negativo-texto [--selo:var(--color-negative)]",
        alerta: "bg-alerta/18 text-alerta-texto [--selo:var(--color-alerta)]",
        neutro: "bg-muted text-muted-foreground [--selo:var(--color-muted-foreground)]",
      },
      forma: {
        pilula: "",
        // Faixa cheia à esquerda e cantos quase retos: lê como etiqueta presa à linha.
        bandeira: "rounded-[0.3rem] rounded-l-[0.15rem] border-0 border-l-[3px] border-l-[color:var(--selo,currentColor)]! pl-1.5 has-data-[icon=inline-start]:pl-1.5",
        // Ponto do tom e texto na cor do texto (o contraste fica com o texto; a cor, com o ponto).
        ponto:
          "bg-transparent! px-0 text-foreground! before:size-2 before:shrink-0 before:rounded-full before:bg-[color:var(--selo,currentColor)] before:content-[''] has-data-[icon=inline-start]:pl-0 [&>svg]:hidden",
      },
    },
    defaultVariants: {
      variant: "default",
      forma: "pilula",
    },
  }
)

function Badge({
  className,
  variant = "default",
  forma = "pilula",
  render,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    render?: (props: React.HTMLAttributes<HTMLElement>) => React.ReactNode
  }) {
  if (render) {
    const renderProps = {
      "data-slot": "badge",
      "data-variant": variant,
      "data-forma": forma,
      className: cn(badgeVariants({ variant, forma }), className),
      ...props,
    }

    return render(renderProps)
  }

  return (
    <span
      data-slot="badge"
      data-variant={variant}
      data-forma={forma}
      className={cn(badgeVariants({ variant, forma }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
