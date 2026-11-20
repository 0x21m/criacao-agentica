// BarraFerramentas: busca e filtros de uma lista, numa pílula de vidro (nível flutuante) que avança sobre o banner do
// CabecalhoPagina. Os filtros vivem na URL (useParametrosDaUrl): dá para voltar ao mesmo recorte, recarregar e
// compartilhar. "Limpar filtros" aparece só quando há filtro. Ações da lista (Exportar CSV) vão à direita.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Superficie } from "@/components/sistema/Superficie"

export function BarraFerramentas({ busca, aoBuscar, rotuloBusca, placeholder, filtrado, aoLimpar, children, acoes }: {
  busca?: string
  aoBuscar?: (q: string) => void
  /** Rótulo para leitor de tela ("Buscar pedidos"). */
  rotuloBusca?: string
  placeholder?: string
  /** Há algum filtro ativo (liga o "Limpar filtros"). */
  filtrado?: boolean
  aoLimpar?: () => void
  /** Filtros (Select, Switch, pílulas). */
  children?: ReactNode
  /** Ações da lista, à direita (Exportar CSV). */
  acoes?: ReactNode
}) {
  return (
    <Superficie nivel="flutuante" role="search" className="flex flex-wrap items-center gap-2 rounded-[calc(var(--raio-sup)*1.1)] p-2 xl:rounded-full">
      {aoBuscar && (
        <Input type="search" value={busca ?? ""} onChange={(e) => aoBuscar(e.target.value)} placeholder={placeholder} aria-label={rotuloBusca ?? placeholder}
          className="h-10 w-full rounded-full sm:w-72" />
      )}
      {children}
      {filtrado && aoLimpar && <Button variant="ghost" className="h-10 rounded-full" onPress={aoLimpar}><X /> Limpar filtros</Button>}
      {acoes && <div className="ml-auto flex items-center gap-2">{acoes}</div>}
    </Superficie>
  )
}

/**
 * Parâmetros da URL como estado (filtros, vista, registro aberto). `padrao` define as chaves e os valores que NÃO vão
 * para a URL. No servidor (build estático) valem os padrões; depois de hidratar, o que estiver na URL. Relê a cada
 * navegação do ClientRouter (Ctrl K para /pedidos/?id=… estando em /pedidos/).
 */
export function useParametrosDaUrl<K extends string>(padrao: Record<K, string>): [Record<K, string>, (m: Partial<Record<K, string>>) => void] {
  const [v, setV] = useState(padrao)
  useEffect(() => {
    const ler = () => {
      const q = new URLSearchParams(location.search)
      const novo = Object.fromEntries(Object.entries(padrao).map(([k, p]) => [k, q.get(k) ?? p])) as Record<K, string>
      // URL igual ao estado: nada muda (sem isso, a tela inteira renderiza de novo logo depois de hidratar)
      setV((atual) => ((Object.keys(novo) as K[]).every((k) => atual[k] === novo[k]) ? atual : novo))
    }
    ler()
    document.addEventListener("astro:page-load", ler)
    return () => document.removeEventListener("astro:page-load", ler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // estável entre renders: a tela pode passar setF adiante para uma tabela em memo
  const padraoRef = useRef(padrao)
  const definir = useCallback((m: Partial<Record<K, string>>) => {
    const padrao = padraoRef.current
    setV((atual) => {
      const novo = { ...atual, ...m }
      const u = new URL(location.href)
      for (const [k, val] of Object.entries(novo) as [K, string][]) {
        if (!val || val === padrao[k]) u.searchParams.delete(k); else u.searchParams.set(k, val)
      }
      history.replaceState(history.state, "", u)
      return novo
    })
  }, [])
  return [v, definir]
}
