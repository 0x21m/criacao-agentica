import * as React from "react"
import { Button, composeRenderProps, type ButtonProps } from "react-aria-components"

import { cn } from "@/lib/utils"
import { useVidroLiquido, type MaterialDoVidro } from "@/colecao/vidro-liquido"

// MIFT: botão de vidro em pílula (ou círculo, só com ícone), sobre o vidro líquido. React Aria (Button): toque, teclado e
// leitor de tela. Ao pressionar, o vidro cresce de leve e clareia, como o Liquid Glass "se acende" sob o dedo (resposta
// no toque, não na soltura); a volta é uma mola curta. Tons: "neutro" (o vidro do tema, texto do tema) e "principal"
// (vidro tingido com a cor principal, texto na cor de contraste dela), para a ação em destaque; "positivo" (aceitar,
// concluir) e "negativo" (recusar) seguem as cores de sentido da MIFT. Toque mínimo de 40 px.

export type TomDoBotaoDeVidro = "neutro" | "principal" | "positivo" | "negativo"

const TINTAS: Record<Exclude<TomDoBotaoDeVidro, "neutro">, { cor: string; texto: string }> = {
  principal: { cor: "var(--primary)", texto: "text-primary-foreground" },
  positivo: { cor: "var(--positive)", texto: "text-positive-foreground" },
  negativo: { cor: "var(--negative)", texto: "text-negative-foreground" },
}
export type TamanhoDoBotaoDeVidro = "md" | "sm" | "icone" | "icone-sm"

const tamanhos: Record<TamanhoDoBotaoDeVidro, string> = {
  md: "h-11 gap-2 px-5 text-[15px] [&_svg]:size-[18px]",
  sm: "h-10 gap-1.5 px-4 text-sm [&_svg]:size-4",
  icone: "size-11 [&_svg]:size-5",
  "icone-sm": "size-10 [&_svg]:size-[18px]",
}


export function BotaoDeVidro({
  tom = "neutro",
  tamanho = "md",
  material = "regular",
  altoContraste,
  className,
  style,
  children,
  ref,
  ...props
}: ButtonProps & {
  tom?: TomDoBotaoDeVidro
  tamanho?: TamanhoDoBotaoDeVidro
  material?: MaterialDoVidro
  altoContraste?: boolean
  ref?: React.Ref<HTMLButtonElement>
}) {
  const tinta = tom === "neutro" ? null : TINTAS[tom]
  // O próprio botão é o vidro (a tinta é o fundo dele): o texto fica sobre a cor que o envolve.
  const { raiz, camadas } = useVidroLiquido({
    raio: "pilula",
    material,
    cor: tinta?.cor,
    espessura: tinta ? 0.8 : 1,
    altoContraste,
    brilho: "fixo",
    ref: ref as React.Ref<HTMLElement>,
    // Tingido: mais tinta, brilho e volume mais fracos, para o texto claro manter 4,5:1 sobre a cor.
    style: {
      ...(tinta && { "--vidro-tinta": "92%", "--vidro-brilho": "color-mix(in oklch, white 10%, transparent)", "--vidro-vol-3": "color-mix(in oklch, white 6%, transparent)" }),
      ...(typeof style === "object" ? style : undefined),
    } as React.CSSProperties,
  })
  return (
    <Button
      {...props}
      ref={raiz.ref}
      data-slot="botao-de-vidro"
      data-tom={tom}
      data-material={raiz["data-material"]}
      data-refracao={raiz["data-refracao"]}
      data-alto-contraste={raiz["data-alto-contraste"]}
      style={raiz.style}
      className={composeRenderProps(className, (c) =>
        cn(
          raiz.className,
          "group/botao inline-flex max-w-full min-w-0 shrink-0 cursor-default items-center justify-center rounded-full font-semibold tracking-[-0.01em] whitespace-nowrap outline-none select-none [&>span:not([aria-hidden])]:truncate",
          "transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] data-pressed:scale-[1.06] data-pressed:duration-100 motion-reduce:transition-none motion-reduce:data-pressed:scale-100",
          "data-focus-visible:ring-3 data-focus-visible:ring-ring/60 data-focus-visible:ring-offset-2 data-focus-visible:ring-offset-transparent",
          // Desabilitado só no texto: opacidade no botão suspenderia a lente.
          "data-disabled:cursor-not-allowed data-disabled:text-muted-foreground",
          tinta ? tinta.texto : "text-foreground",
          tamanhos[tamanho],
          c
        )
      )}
    >
      {composeRenderProps(children, (filhos) => (
        <>
          {camadas}
          {/* Clarão do toque: some ao soltar. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-[5] rounded-full bg-[color-mix(in_oklch,white_22%,transparent)] opacity-0 transition-opacity duration-300 group-data-hovered/botao:opacity-40 group-data-pressed/botao:opacity-100 group-data-pressed/botao:duration-75"
          />
          {filhos}
        </>
      ))}
    </Button>
  )
}
