// Busca global (Ctrl K): as telas da navegação do papel ativo e os comandos de cada módulo (registro.ts).
// Carregada sob demanda pela BarraSuperior na primeira vez que abre.
import { useEffect, useMemo, useState } from "react"
import { navigate } from "astro:transitions/client"
import { Search } from "lucide-react"
import { Link } from "react-aria-components"
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { achatar, comandos, navegacao, normalizar } from "@/modulos/registro"
import { papelAtual } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"

type Resultado = { rotulo: string; detalhe: string; href: string }

export default function Busca({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const [q, setQ] = useState("")
  const [i, setI] = useState(0)
  const resultados = useMemo<Resultado[]>(() => {
    if (!aberta) return []
    // telas da navegação do papel + os comandos de cada módulo (registro.ts)
    const t = normalizar(q.trim())
    const papel = papelAtual()
    const telas = achatar(navegacao(papel)).map((x) => ({ rotulo: x.rotulo, detalhe: "Tela", href: url(x.caminho) }))
    if (!t) return telas
    return [
      ...telas.filter((x) => normalizar(x.rotulo).includes(t)),
      ...comandos(t, papel).map((c) => ({ rotulo: c.rotulo, detalhe: c.detalhe, href: url(c.caminho) })),
    ]
  }, [q, aberta])

  useEffect(() => setI(0), [q])
  useEffect(() => { if (!aberta) setQ("") }, [aberta])
  useEffect(() => { document.getElementById(`busca-${i}`)?.scrollIntoView({ block: "nearest" }) }, [i])

  function ir(r?: Resultado) {
    if (!r) return
    onFechar()
    navigate(r.href)
  }

  return (
    <Dialog isOpen={aberta} onOpenChange={(o) => !o && onFechar()} className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
      <DialogTitle className="sr-only">Buscar</DialogTitle>
      <DialogDescription className="sr-only">Digite para buscar telas, clientes e pedidos. Use as setas e Enter.</DialogDescription>
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, resultados.length - 1)) }
            if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)) }
            if (e.key === "Enter") { e.preventDefault(); ir(resultados[i]) }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls="busca-lista"
          aria-activedescendant={resultados[i] ? `busca-${i}` : undefined}
          aria-label="Buscar"
          placeholder="Buscar pedidos, clientes, telas…"
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul id="busca-lista" role="listbox" aria-label="Resultados" className="max-h-80 overflow-y-auto p-1">
        {resultados.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nada encontrado para “{q}”.</li>}
        {resultados.map((r, n) => (
          <li key={r.href + n} id={`busca-${n}`} role="option" aria-selected={n === i}>
            <Link
              onPress={() => ir(r)}
              onHoverStart={() => setI(n)}
              className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm outline-none", n === i && "bg-muted")}
            >
              <span className="min-w-0 flex-1 truncate" title={r.rotulo}>{r.rotulo}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.detalhe}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
