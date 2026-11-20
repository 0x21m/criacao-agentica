import * as React from "react"
import { SelectionIndicator, ToggleButton, ToggleButtonGroup, type Key, type ToggleButtonGroupProps } from "react-aria-components"

import { cn } from "@/lib/utils"
import { VidroLiquido, type MaterialDoVidro } from "@/colecao/vidro-liquido"

// Starter: copiado do MIFT (src/colecao/vidro-segmentado); `refracao` (desligada por padrão: regra 3 do vidro, refração
// só em destaque e flutuante) e `cor` (tinta do vidro, um token) foram acrescentados.
// MIFT: controle segmentado de vidro. O trilho é uma pílula de vidro líquido; o segmento escolhido é uma gota mais clara
// (a cor do cartão do tema, com aro e sombra curta) que desliza até o toque com uma mola de leve passagem e se estica um pouco
// sob o dedo. React Aria ToggleButtonGroup em seleção única, sem seleção vazia: setas do teclado, leitor de tela com
// estado "pressionado". Segmentos de largura igual numa linha só, de 2 a 5 opções (regra do segmentado da MIFT).
// Sem espaço para segmentos iguais (320 px), o segmento de rótulo mais longo cresce antes de cortar (como o
// `apportionsSegmentWidthsByContent` do iOS): cada coluna tem no mínimo a largura do próprio rótulo.

export type OpcaoSegmentada = { id: string; rotulo: string; contagem?: number }

export function SegmentadoDeVidro({
  opcoes,
  valor,
  aoMudar,
  material = "regular",
  altoContraste,
  refracao = false,
  cor,
  className,
  ...props
}: Omit<ToggleButtonGroupProps, "selectionMode" | "selectedKeys" | "onSelectionChange" | "children" | "className"> & {
  opcoes: OpcaoSegmentada[]
  valor: string
  aoMudar: (id: string) => void
  material?: MaterialDoVidro
  altoContraste?: boolean
  refracao?: boolean
  cor?: string
  className?: string
}) {
  return (
    <VidroLiquido raio="pilula" material={material} altoContraste={altoContraste} espessura={0.8} semRefracao={!refracao} cor={cor} className={cn("w-full p-1", className)}>
      <ToggleButtonGroup
        {...props}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[valor]}
        onSelectionChange={(k: Set<Key>) => {
          const id = [...k][0]
          if (id != null) aoMudar(String(id))
        }}
        className="grid auto-cols-[minmax(max-content,1fr)] grid-flow-col gap-0.5"
      >
        {opcoes.map((o) => (
          <ToggleButton
            key={o.id}
            id={o.id}
            className={cn(
              "group/seg relative isolate flex min-h-10 min-w-0 cursor-default flex-col items-center justify-center rounded-full px-1.5 text-sm leading-tight font-semibold text-foreground outline-none select-none",
              "data-focus-visible:ring-3 data-focus-visible:ring-ring/60"
            )}
          >
            <SelectionIndicator
              className={cn(
                "absolute inset-0 -z-10 rounded-full bg-[light-dark(var(--card),color-mix(in_oklch,var(--foreground)_24%,var(--background)))] shadow-[0_1px_3px_color-mix(in_oklch,black_14%,transparent),inset_0_0_0_0.5px_color-mix(in_oklch,var(--foreground)_10%,transparent)]",
                "transition-[translate,scale] duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] group-data-pressed/seg:scale-x-[1.08] group-data-pressed/seg:scale-y-[1.04] motion-reduce:transition-none",
                "contrast-more:shadow-[inset_0_0_0_1.5px_var(--foreground)] group-data-[alto-contraste]/vidro:shadow-[inset_0_0_0_1.5px_var(--foreground)]"
              )}
            />
            <span className="max-w-full truncate">{o.rotulo}</span>
            {o.contagem != null && <span className="text-[11px] font-normal tabular-nums">{o.contagem}</span>}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </VidroLiquido>
  )
}
