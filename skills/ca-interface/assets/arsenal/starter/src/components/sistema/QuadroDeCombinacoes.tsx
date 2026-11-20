// /sistema: a folha do preset nas 4 combinações (claro e escuro × com e sem vidro), lado a lado. Cada combinação é um
// iframe de /sistema/folha/ com ?embutida=1 (não grava a escolha da pessoa). A troca de preset aqui não muda o app.
import { useEffect, useState } from "react"
import { PRESETS } from "@/proto/aparencia/presets"
import { useAparencia } from "@/proto/aparencia/aparencia"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"

const COMBOS = [
  { tema: "claro", vidro: 0, nome: "Claro" },
  { tema: "claro", vidro: 1, nome: "Claro com vidro" },
  { tema: "escuro", vidro: 0, nome: "Escuro" },
  { tema: "escuro", vidro: 1, nome: "Escuro com vidro" },
]

export default function QuadroDeCombinacoes() {
  const ap = useAparencia()
  const [preset, setPreset] = useState(ap.preset)
  const [alturas, setAlturas] = useState<Record<string, number>>({})
  useEffect(() => {
    const ouvir = (e: MessageEvent) => {
      if (e.origin !== location.origin || typeof e.data?.folha !== "string") return
      setAlturas((a) => ({ ...a, [e.data.folha]: Math.ceil(e.data.altura) }))
    }
    addEventListener("message", ouvir)
    return () => removeEventListener("message", ouvir)
  }, [])
  return (
    <div className="grid gap-4 px-4 pb-8 md:px-6">
      <div role="radiogroup" aria-label="Preset da folha" data-grupo className="sup flex flex-wrap gap-1 rounded-full p-1" data-nivel="casca">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={preset === p.id} onClick={() => setPreset(p.id)}
            className={cn("min-h-10 rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground", preset === p.id && "nav-ativo font-semibold text-foreground")}>
            {p.nome}<span className="sr-only">, {p.arquetipo}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {COMBOS.map((c) => {
          const q = `?preset=${preset}&tema=${c.tema}&vidro=${c.vidro}&embutida=1`
          return (
            <figure key={c.nome} className="m-0 grid gap-2">
              <figcaption className="t-rotulo">{c.nome}</figcaption>
              <iframe title={`Folha do sistema, ${c.nome.toLowerCase()}`} src={url(`sistema/folha/${q}`)} loading="lazy"
                className="w-full rounded-[var(--raio-sup)] shadow-[0_0_0_1px_var(--sup-aro),0_18px_40px_-24px_var(--sombra-cor)]"
                style={{ height: alturas[q] ?? 2400 }} />
            </figure>
          )
        })}
      </div>
    </div>
  )
}
