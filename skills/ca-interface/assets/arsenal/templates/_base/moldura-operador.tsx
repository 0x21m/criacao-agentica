/**
 * Moldura do painel do operador: barra lateral recolhível, barra superior e cabeçalho da página.
 * Usada pelos templates de painel (visão geral, resumo do dia, relatórios...).
 * Ao adaptar: troque NAV pelos módulos do produto, a marca e o usuário.
 */
import { useEffect, useState, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from "react"
import {
  Bell,
  BarChart3,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NEGOCIO } from "./formato"
import { useTemaEscuro } from "./tema"

export type ItemNav = { id: string; rotulo: string; icone: ComponentType<{ className?: string }> }

export const NAV: ItemNav[] = [
  { id: "visao-geral", rotulo: "Visão geral", icone: LayoutDashboard },
  { id: "pedidos", rotulo: "Pedidos", icone: ShoppingBag },
  { id: "produtos", rotulo: "Produtos", icone: Boxes },
  { id: "clientes", rotulo: "Clientes", icone: Users },
  { id: "unidades", rotulo: "Unidades", icone: Store },
  { id: "relatorios", rotulo: "Relatórios", icone: BarChart3 },
]

function alternarTema() {
  const el = document.documentElement
  const escuro = !el.classList.contains("dark")
  el.classList.toggle("dark", escuro)
  try {
    localStorage.setItem("vitrine-tema", escuro ? "escuro" : "claro")
  } catch {
    /* sem armazenamento: só não lembra */
  }
}

function Lateral({ ativo, recolhida, onFechar }: { ativo: string; recolhida: boolean; onFechar?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center gap-2.5 px-4", recolhida && "justify-center px-0")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">I</span>
        {!recolhida && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{NEGOCIO.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{NEGOCIO.unidade}</p>
          </div>
        )}
        {onFechar && (
          <button type="button" onClick={onFechar} aria-label="Fechar menu" className="ml-auto grid size-8 place-items-center rounded-md hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring">
            <X className="size-4" />
          </button>
        )}
      </div>
      <nav aria-label="Módulos" className="flex-1 px-2 py-2">
        <ul className="space-y-0.5">
          {NAV.map(({ id, rotulo, icone: Icone }) => (
            <li key={id}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-current={id === ativo ? "page" : undefined}
                title={recolhida ? rotulo : undefined}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring",
                  "aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-foreground",
                  recolhida && "justify-center px-0",
                )}
              >
                <Icone className="size-4 shrink-0" />
                {recolhida ? <span className="sr-only">{rotulo}</span> : <span className="truncate">{rotulo}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-2 pb-3">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          title={recolhida ? "Configurações" : undefined}
          className={cn("flex h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring", recolhida && "justify-center px-0")}
        >
          <Settings className="size-4 shrink-0" />
          {recolhida ? <span className="sr-only">Configurações</span> : "Configurações"}
        </a>
      </div>
    </div>
  )
}

export function MolduraOperador({
  ativo,
  titulo,
  descricao,
  acoes,
  children,
}: {
  ativo: string
  titulo: string
  descricao?: ReactNode
  /** Ação principal (e secundárias) do cabeçalho. */
  acoes?: ReactNode
  children: ReactNode
}) {
  const [recolhida, setRecolhida] = useState(false)
  const [gaveta, setGaveta] = useState(false)
  const escuro = useTemaEscuro()

  useEffect(() => {
    if (!gaveta) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setGaveta(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [gaveta])

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      {/* lateral fixa (desktop) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none lg:block",
          recolhida ? "w-16" : "w-60",
        )}
      >
        <Lateral ativo={ativo} recolhida={recolhida} />
      </aside>

      {/* gaveta (celular e tablet) */}
      {gaveta && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/40 animate-in fade-in-0 motion-reduce:animate-none" onClick={() => setGaveta(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl animate-in slide-in-from-left duration-200 motion-reduce:animate-none">
            <Lateral ativo={ativo} recolhida={false} onFechar={() => setGaveta(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={() => setGaveta(true)}
            aria-label="Abrir menu"
            className="grid size-9 place-items-center rounded-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setRecolhida((v) => !v)}
            aria-label={recolhida ? "Expandir barra lateral" : "Recolher barra lateral"}
            aria-pressed={recolhida}
            className="hidden size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring lg:grid"
          >
            {recolhida ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
          <label className="relative ml-1 hidden max-w-sm flex-1 sm:block">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar pedido, cliente ou produto"
              className="h-9 w-full rounded-md border border-input bg-transparent pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
          </label>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={alternarTema}
              aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
              className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button type="button" aria-label="Notificações, 3 novas" className="relative grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <Bell className="size-4" />
              <span aria-hidden="true" className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
            </button>
            <span aria-label="Usuária: Marina Costa" role="img" className="ml-1 grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">
              MC
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{titulo}</h1>
              {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
            </div>
            {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

/** Botões com o visual do shadcn, para as ações do cabeçalho. */
export function Botao({
  children,
  variante = "primario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "fantasma" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        variante === "primario" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variante === "secundario" && "border border-input bg-background hover:bg-accent",
        variante === "fantasma" && "hover:bg-accent",
        className,
      )}
    >
      {children}
    </button>
  )
}
