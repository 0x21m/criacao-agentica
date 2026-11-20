// Palco do /arsenal: carrega só o item da página (import dinâmico) e o mostra funcionando.
// O palco é uma Superficie (card de vidro do preset): a demo aparece sobre o fundo ambiente do preset atual.
// Roda com client:only: os templates e as demos foram feitos para o navegador (window, canvas, WebGL).
import { Suspense, lazy, useMemo, type ComponentType } from "react"
import { Esqueleto } from "@/components/app/estados"
import { Superficie } from "@/components/sistema/Superficie"
import { VIVOS } from "./vivos"
import { BRASIL } from "./brasil"

type Mod = Promise<{ default: ComponentType<any> }>
const demos = import.meta.glob<{ default: ComponentType<any> }>("./demos/*.tsx")
const templates = import.meta.glob<{ default: ComponentType<any> }>("./templates/*/index.tsx")

function carregador(id: string): (() => Mod) | null {
  if (id.startsWith("template-")) return (templates[`./templates/${id.slice(9)}/index.tsx`] as () => Mod) ?? null
  return (demos[`./demos/${id}.tsx`] as () => Mod) ?? null
}

export default function Palco({ id, tipo }: { id: string; tipo: string }) {
  const Comp = useMemo(() => { const c = carregador(id); return c ? lazy(c) : null }, [id])
  if (BRASIL[id]) return <Superficie data-nao-verificar className="p-4 md:p-6">{BRASIL[id]()}</Superficie>
  if (VIVOS[id]) return <Superficie data-nao-verificar className="p-4 md:p-6">{VIVOS[id]()}</Superficie>
  if (!Comp) return <p className="text-sm text-muted-foreground">Nada para mostrar.</p>
  return (
    // contain: os elementos fixos do template (barra de abas, barra F própria) ficam presos dentro do palco
    <div data-nao-verificar className={tipo === "template" ? "sup relative isolate min-h-[40rem] overflow-hidden rounded-[var(--raio-sup)] [contain:layout_paint]" : "sup relative isolate overflow-hidden rounded-[var(--raio-sup)] [contain:paint]"} data-nivel="card">
      <Suspense fallback={<Esqueleto className="h-[32rem] rounded-none" />}>
        <Comp />
      </Suspense>
    </div>
  )
}
