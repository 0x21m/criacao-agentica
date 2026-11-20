// FolhaDeDetalhe: o detalhe de um registro sem sair da lista. Sheet lateral de vidro no desktop; folha inferior de vidro
// com alça (fecha ao puxar) no celular. A URL leva o registro (?id=), então dá para voltar, recarregar e compartilhar.
// As peças pesadas (Sheet, FolhaDeVidro, React Aria do modal) vêm em pedaço à parte, só quando a folha abre pela
// primeira vez: a lista hidrata mais leve.
// Desfazer dentro da folha: o aviso do sonner fica atrás da camada modal enquanto ela está aberta, então a folha mostra
// o próprio "Desfazer" (use <AvisoDesfazer>).
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react"
import { Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

const Corpo = lazy(() => import("./FolhaDeDetalheCorpo"))

export type PropsFolha = {
  aberto: boolean
  aoFechar: () => void
  /** Linha pequena acima do título: o identificador ("OS-1052"). */
  sobre?: ReactNode
  titulo: ReactNode
  /** Selos (etapa, atraso) logo abaixo do título. */
  selos?: ReactNode
  children: ReactNode
  /** Ações: a secundária (ou a destrutiva discreta) antes, a principal por último. No celular viram uma coluna, com a principal em cima. */
  rodape?: ReactNode
}

/** Ilhas da página ainda hidratando (a casca entra em client:idle). */
const hidratando = () => typeof document !== "undefined" && !!document.querySelector("astro-island[ssr]:not([client=visible])")

export function FolhaDeDetalhe(p: PropsFolha) {
  // só carrega o pedaço da folha quando ela abre pela primeira vez (e mantém depois, para a animação de saída)
  const [usada, setUsada] = useState(p.aberto)
  useEffect(() => { if (p.aberto) setUsada(true) }, [p.aberto])
  // link direto (?id=): a folha nasce aberta. O modal do desktop aberto antes de a casca hidratar era fechado por ela
  // (a hidratação conta como interação fora); então a folha espera a página terminar de hidratar e só aí abre
  const [pronta, setPronta] = useState(false)
  useEffect(() => {
    let q = 0
    const ver = () => { if (hidratando()) q = requestAnimationFrame(ver); else setPronta(true) }
    ver()
    return () => cancelAnimationFrame(q)
  }, [])
  const celular = useIsMobile(640)
  if (!usada) return null
  return <Suspense fallback={null}><Corpo {...p} aberto={p.aberto && pronta} celular={celular} /></Suspense>
}

/** Faixa de "Desfazer" dentro da folha, por 8 s depois de uma ação otimista. */
export function AvisoDesfazer({ texto, aoDesfazer, chave }: { texto: string; aoDesfazer: () => void; chave: unknown }) {
  const [visivel, setVisivel] = useState(true)
  useEffect(() => { setVisivel(true); const t = setTimeout(() => setVisivel(false), 8000); return () => clearTimeout(t) }, [chave])
  if (!visivel) return null
  return (
    <div role="status" className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--positive)_12%,transparent)] px-3 py-2 text-sm">
      <span>{texto}</span>
      <Button variant="ghost" size="sm" onPress={() => { aoDesfazer(); setVisivel(false) }}><Undo2 /> Desfazer</Button>
    </div>
  )
}
