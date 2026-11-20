import { cva } from "class-variance-authority"

// MIFT: pressionar afunda o botão (escala 0,97) no instante em que o dedo desce (`:active` e o `data-pressed` do React
// Aria), em 75 ms; soltar volta em 150 ms com a saída forte. Transição só das propriedades que mudam (nunca `all`). Com
// movimento reduzido, o botão escurece em vez de encolher. Ver "Sensação de app" em docs/padroes.md.
// MIFT: as variantes do Button num arquivo sem framework (sem React e sem React Aria). Um link de site em `.astro`
// (`@mift/web-acao`) usa as mesmas classes do botão sem levar o React Aria para o projeto: 0 KB de JavaScript na
// página e nenhuma dependência a mais no registro. O `button.tsx` importa daqui (um lugar só para as variantes).
// MIFT: botão desabilitado segura o toque: sem o `pointer-events-none` do original, com `cursor-not-allowed` (o
// navegador não dispara clique em botão desabilitado, então nada acontece). Com o original, o toque num "Verificar"
// desabilitado atravessava o botão e caía no título do cartão, que cobre o cartão inteiro: abria o detalhe e o foco não tinha para onde voltar (achado do Energia OS).
// MIFT: no toque, o alvo do botão de texto é altura MÍNIMA, não fixa. Com a altura fixa do toque, o botão que pedia outra
// altura (`h-auto` de um atalho com ícone e rótulo em coluna, `h-12` de uma ação grande) ficava preso em 40 px só no
// celular: o círculo do ícone virava uma pílula de 16 px e o rótulo sumia (achado do Trocado). O mínimo é o maior entre o
// tamanho do botão e o alvo da densidade (`--alvo-toque`, que o global.css põe nos mesmos tocáveis que ganham o alvo de
// 44/48 px): um utilitário de altura mínima sozinho venceria a regra da densidade, que mora na camada de componentes. O
// botão de ícone segue com tamanho fixo no toque (a casa do calendário encolhe a 320 px); a densidade completa o mínimo.

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,scale] duration-150 ease-(--ease-saida) outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.96] data-[pressed]:not-aria-[haspopup]:scale-[0.96] data-[pressed]:duration-75 motion-reduce:active:scale-100 motion-reduce:data-[pressed]:scale-100 motion-reduce:data-[pressed]:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[invalid=true]:border-destructive data-[invalid=true]:ring-3 data-[invalid=true]:ring-destructive/20 dark:data-[invalid=true]:border-destructive/50 dark:data-[invalid=true]:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // MIFT: cheio com relevo leve (--sombra-botao: brilho de 1 px em cima e sombra curta, que a skin troca) e o mouse
        // em cima escurece a cor (no escuro, clareia) em vez de deixá-la transparente e lavada.
        default:
          "bg-primary text-primary-foreground shadow-(--sombra-botao) hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)]",
        outline:
          "border-border bg-background shadow-(--sombra-controle) hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // MIFT: o texto do vermelho tingido usa --texto-negativo (e o fundo a 15% no escuro): o --destructive ficava em
        // 4,5:1 e caía para 4,4:1 sobre o pé cinza do cartão; agora tem folga de 4,8:1 nos dois temas.
        destructive:
          "bg-destructive/10 text-negativo-texto hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/25 dark:focus-visible:ring-destructive/40",
        // MIFT: decisão positiva (aceitar, aprovar, confirmar recebimento): verde cheio, sempre à direita.
        // Recusar e rejeitar usam `destructive` (vermelho), à esquerda. Avançar uma etapa usa `default`.
        positivo:
          "bg-positive text-positive-foreground shadow-(--sombra-botao) hover:bg-[color-mix(in_oklch,var(--positive),var(--foreground)_12%)] focus-visible:border-positive focus-visible:ring-positive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 pointer-coarse:min-h-[max(--spacing(10),var(--alvo-toque,0px))] pointer-coarse:px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 pointer-coarse:min-h-[max(--spacing(8),var(--alvo-toque,0px))] gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 pointer-coarse:min-h-[max(2.5rem,var(--alvo-toque,0px))] gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 pointer-coarse:min-h-[max(--spacing(11),var(--alvo-toque,0px))] gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8 pointer-coarse:size-10",
        "icon-xs":
          "size-6 pointer-coarse:size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 pointer-coarse:size-9 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9 pointer-coarse:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export { buttonVariants }
