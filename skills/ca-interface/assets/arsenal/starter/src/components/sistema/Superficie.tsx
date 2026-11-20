// Superficie: o material único do starter. Toda superfície (casca, card, destaque, camada flutuante) nasce daqui;
// nenhuma tela monta o próprio card. O desenho mora em src/styles/sistema.css (.sup + data-nivel): preenchimento
// sólido ou de vidro tingido, brilho do acento, borda com gradiente, luz de 1 px em cima e sombra em 2 camadas, com
// forças por nível. As peças aria-nova (Card, popover, select, dialog, sheet) usam as mesmas classes.
//
// Níveis: "fundo" (não pinta), "casca" (lateral, barras), "card" (o padrão), "destaque" (KPI-herói e card sobre
// banner: gradiente com núcleo escuro, ou vidro com `material="vidro"`), "flutuante" (popover, menu, sheet, diálogo).
// Refração (vidro líquido do MIFT) só em destaque de vidro e flutuante, com o vidro ligado e onde o navegador suporta.
import * as React from "react"
import { cn } from "@/lib/utils"
import { VidroLiquido } from "@/colecao/vidro-liquido"
import { useAparencia } from "@/proto/aparencia/aparencia"

export type NivelSuperficie = "fundo" | "casca" | "card" | "destaque" | "flutuante"
export type TomSuperficie = "sucesso" | "aviso" | "perigo" | "info" | "acento"

type Elemento = "div" | "section" | "article" | "aside" | "header" | "footer" | "nav" | "li" | "a" | "figure"

export type PropsSuperficie = Omit<React.HTMLAttributes<HTMLElement>, "color"> & {
  nivel?: NivelSuperficie
  /** Tinge o card pela cor do conteúdo (status, categoria). */
  tom?: TomSuperficie
  /** Card clicável: sobe 2 px e a borda acende no hover. */
  interativa?: boolean
  /** Só no destaque: "nucleo" (gradiente com núcleo escuro, o padrão) ou "vidro" (card de vidro sobre banner). */
  material?: "nucleo" | "vidro"
  /** Vidro líquido com refração (só destaque de vidro e flutuante; cai para o vidro com desfoque sem suporte). */
  refracao?: boolean
  /** Raio em px para o vidro líquido (o .sup usa o raio do preset pelas classes rounded-*). */
  raio?: number
  como?: Elemento
  href?: string
  ref?: React.Ref<HTMLElement>
}

/** Classes do material para quem não pode usar o componente (peças de terceiros, raiz de outro componente). */
export function classeSuperficie(nivel: NivelSuperficie = "card") {
  return { className: "sup", "data-nivel": nivel } as const
}

export function Superficie({ nivel = "card", tom, interativa, material, refracao, raio = 24, como = "div", className, children, ref, ...props }: PropsSuperficie) {
  const { vidro } = useAparencia()
  const refrata = !!refracao && vidro && (nivel === "flutuante" || (nivel === "destaque" && material === "vidro"))
  if (refrata) {
    return (
      <VidroLiquido
        material="espesso"
        raio={raio}
        cor="var(--sup-veu)"
        brilho="fixo"
        data-nivel={nivel}
        data-material={material}
        className={cn("shadow-[0_2px_6px_var(--sombra-cor),0_28px_60px_-20px_var(--sombra-cor)]", className)}
        {...(props as React.ComponentProps<"div">)}
      >
        {children}
      </VidroLiquido>
    )
  }
  const El = como as "div"
  return (
    <El
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="superficie"
      data-nivel={nivel}
      data-tom={tom}
      data-material={material}
      data-interativa={interativa || undefined}
      className={cn("sup rounded-[var(--raio-sup,var(--radius-xl))]", className)}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </El>
  )
}
