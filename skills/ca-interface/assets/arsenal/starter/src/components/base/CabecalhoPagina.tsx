// CabecalhoPagina: o topo de toda tela de operação. Banner compacto da marca (recolhe ao rolar e vira uma barra fina de
// vidro, NAV-41) com o título .t-pagina, a contagem, as ações (UMA principal) e a troca de vista em vidro segmentado.
// O que vai em `children` (a barra de ferramentas) avança sobre o banner.
// Telas principais e do cliente usam o BannerSobreposto "completa" direto (saudação, números do dia).
import type { ReactNode } from "react"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"

export type Vista = { id: string; rotulo: string }

export function CabecalhoPagina({ titulo, descricao, contagem, acoes, vistas, vista, aoMudarVista, children }: {
  titulo: string
  descricao?: ReactNode
  /** "48 OS" ao lado da descrição. */
  contagem?: ReactNode
  /** A ação principal por último (BotaoLiquido); as secundárias antes, contornadas. */
  acoes?: ReactNode
  /** 2 a 4 vistas (lista, quadro, agenda…). */
  vistas?: Vista[]
  vista?: string
  aoMudarVista?: (id: string) => void
  /** Barra de ferramentas (busca e filtros) que avança sobre o banner. */
  children?: ReactNode
}) {
  return (
    <BannerSobreposto
      variante="compacta"
      titulo={titulo}
      descricao={(descricao || contagem) && (
        <span className="inline-flex flex-wrap items-center gap-x-2">
          {descricao}
          {contagem !== undefined && <span className="num whitespace-nowrap text-muted-foreground" aria-live="polite">{descricao ? "· " : ""}{contagem}</span>}
        </span>
      )}
      sobreposicao={40}
      acoes={(vistas || acoes) && (
        <>
          {vistas && vista && aoMudarVista && (
            // no celular, só a largura dos rótulos: o segmentado divide a faixa com as ações em vez de ocupar uma sozinho
            <div className="w-52 shrink-0 max-sm:w-auto"><SegmentadoDeVidro aria-label="Vista" opcoes={vistas} valor={vista} aoMudar={aoMudarVista} /></div>
          )}
          {acoes}
        </>
      )}
    >
      {children}
    </BannerSobreposto>
  )
}
