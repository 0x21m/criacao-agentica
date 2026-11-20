// A coluna do mestre (360 px): busca, segmentos em chips com contagem e a lista de clientes. Busca por nome, e-mail,
// código, cidade, CPF/CNPJ e telefone (pelos dígitos). Busca sem resultado: "Limpar a busca" e "Cadastrar “{texto}”".
import { useMemo } from "react"
import { SearchX, ShieldAlert, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { EstadoVazio } from "@/components/app/estados"
import { normalizar } from "@/modulos/registro"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { digitos, exclusaoPendente, type Cliente } from "../dados"

export const SEGMENTOS = [
  { id: "todos", rotulo: "Todos" },
  { id: "ativo", rotulo: "Ativos" },
  { id: "lead", rotulo: "Leads" },
  { id: "inativo", rotulo: "Inativos" },
  { id: "exclusao", rotulo: "Exclusão pedida" },
  { id: "anonimizado", rotulo: "Anonimizados" },
] as const
const VAZIO_DO_SEGMENTO: Record<string, string> = {
  todos: "Nenhum cliente ainda.", ativo: "Nenhum cliente ativo.", lead: "Nenhum lead agora.", inativo: "Nenhum cliente inativo.",
  exclusao: "Nenhum pedido de exclusão aberto.", anonimizado: "Nenhum cliente anonimizado.",
}
export type Segmento = (typeof SEGMENTOS)[number]["id"]

const doSegmento = (c: Cliente, s: string) => s === "todos" ? c.estado !== "anonimizado" : s === "exclusao" ? !!exclusaoPendente(c) : c.estado === s

export function filtrarClientes(todos: Cliente[], q: string, seg: string) {
  const t = normalizar(q.trim())
  const d = digitos(q)
  return todos.filter((c) => doSegmento(c, seg) && (!t
    || normalizar(c.nome).includes(t) || normalizar(c.email).includes(t) || normalizar(c.id).includes(t) || normalizar(c.endereco.cidade).includes(t)
    || (d.length >= 3 && (digitos(c.documento).includes(d) || digitos(c.telefone).includes(d)))))
}

export const iniciais = (nome: string) => nome.split(" ").filter((x) => /^\p{L}/u.test(x)).map((x) => x[0]).slice(0, 2).join("").toUpperCase()

export function ListaClientes({ todos, q, setQ, seg, setSeg, id, abrir, contagemOS, podeCriar, className }: {
  todos: Cliente[]; q: string; setQ: (s: string) => void; seg: string; setSeg: (s: string) => void
  id: string | null; abrir: (id: string) => void; contagemOS: Map<string, number>; podeCriar: boolean; className?: string
}) {
  const lista = useMemo(() => filtrarClientes(todos, q, seg), [todos, q, seg])
  const contagens = useMemo(() => Object.fromEntries(SEGMENTOS.map((s) => [s.id, todos.filter((c) => doSegmento(c, s.id)).length])), [todos])
  const segAtual = SEGMENTOS.find((s) => s.id === seg) ?? SEGMENTOS[0]
  return (
    <Card className={cn("gap-0 py-0 lg:sticky lg:top-[calc(var(--topo)+var(--faixa-fixa))] lg:max-h-[calc(100dvh-var(--topo)-var(--faixa-fixa)-1.5rem)]", className)}>
      <div className="grid gap-2.5 p-3 shadow-[0_1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)]">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, CPF, telefone ou cidade" aria-label="Buscar cliente" />
        <div role="group" aria-label="Segmentos" className="flex flex-wrap gap-1.5">
          {SEGMENTOS.map((s) => {
            const ativo = s.id === segAtual.id
            const n = contagens[s.id]
            if ((s.id === "exclusao" || s.id === "anonimizado") && !n && !ativo) return null
            return (
              <button key={s.id} type="button" aria-pressed={ativo} onClick={() => setSeg(s.id)}
                className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
                  ativo ? "bg-primary text-primary-foreground" : "bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] text-muted-foreground hover:text-foreground",
                  !ativo && s.id === "exclusao" && "text-alerta-texto")}>
                {s.id === "exclusao" && <ShieldAlert className="size-3.5" aria-hidden="true" />}
                {s.rotulo}<span className={cn("num", ativo ? "opacity-80" : "opacity-70")}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>
      {lista.length === 0 ? (
        <EstadoVazio variante="filtro" icone={SearchX} className="m-3"
          titulo={q ? `Nenhum cliente com “${q}”.` : VAZIO_DO_SEGMENTO[segAtual.id]}
          texto={q ? "Confira a grafia ou busque pelo telefone." : undefined}
          acao={<div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onPress={() => { setQ(""); setSeg("todos") }}>{q ? "Limpar a busca" : "Ver todos"}</Button>
            {q && podeCriar && <a href={url(`clientes/novo/?nome=${encodeURIComponent(q)}`)} className={cn(buttonVariants({ size: "sm" }), "max-w-56")}><UserPlus /><span className="truncate">Cadastrar “{q}”</span></a>}
          </div>} />
      ) : (
        <ul data-rolagem-permitida className="overflow-y-auto p-1.5" aria-label={`Clientes (${lista.length})`}>
          {lista.map((c) => {
            const exclusao = !!exclusaoPendente(c)
            return (
              <li key={c.id}>
                <a
                  href={url(`clientes/?id=${c.id}`)}
                  onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); abrir(c.id) }}
                  aria-current={c.id === id ? "true" : undefined}
                  className={cn("flex h-14 items-center gap-3 rounded-[calc(var(--radius)*0.9)] px-2.5 outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring", c.id === id && "nav-ativo")}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", c.id === id ? "bg-primary text-primary-foreground" : "bg-muted")}>{iniciais(c.nome) || "?"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" title={c.nome}>{c.nome}</span>
                    <span className="block truncate text-xs text-muted-foreground" title={c.email}>{c.estado === "anonimizado" ? "Dados excluídos (LGPD)" : c.email}</span>
                  </span>
                  {exclusao
                    ? <span className="shrink-0 text-alerta-texto" title="Pediu a exclusão dos dados"><ShieldAlert className="size-4" aria-hidden="true" /><span className="sr-only">Pediu a exclusão dos dados</span></span>
                    : <span className="num shrink-0 text-xs text-muted-foreground">{contagemOS.get(c.id) ?? 0} OS</span>}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
