// Barra superior global: marca (celular), busca com Ctrl K, notificações e conta. Peças aria-nova (React Aria).
import { Suspense, lazy, useEffect, useState } from "react"
import { Check, ChevronDown, LogOut, MapPin, Monitor, Moon, Palette, Search, Settings, Sparkles, Sun } from "lucide-react"
import { Button as Pressionavel } from "react-aria-components"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { nomeDaUnidade, trocarUnidade } from "@/proto/dados"
import { nomeDoPapel, pode, useSessaoDaCasca, type EscolhaUnidade } from "@/proto/permissoes"
import { EMPRESA, UNIDADES, type Unidade } from "@/proto/negocio"
import { MARCA } from "@/proto/marca"
import { TEMAS, trocarTema, trocarVidro, useAparencia } from "@/proto/aparencia/aparencia"
import { inicioDoPainel, url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { Logo } from "./Logo"
import { Sino } from "./Sino"

const ESCOLHAS: EscolhaUnidade[] = [...(Object.keys(UNIDADES) as Unidade[]), "todas"]

const Busca = lazy(() => import("./Busca"))

const iconeTema = { claro: Sun, escuro: Moon, sistema: Monitor }

export default function BarraSuperior() {
  const [busca, setBusca] = useState(false)
  const [usouBusca, setUsouBusca] = useState(false)
  useEffect(() => { if (busca) setUsouBusca(true) }, [busca])
  const { tema, vidro } = useAparencia()
  // a casca fica fora do <main>: lê a sessão pelo hook dela (libera só a casca)
  const { papel, pessoa: eu, unidade } = useSessaoDaCasca()
  const trocaUnidade = pode(papel, "trocar_unidade")

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setBusca(true) }
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [])

  const iniciais = eu.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")

  return (
    <header
      className="casca-fixa fixed inset-x-0 top-0 z-30 flex h-[var(--topo)] items-center gap-1.5 px-3 transition-[left] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none lg:left-[var(--lateral)] lg:px-6"
    >
      <a href={inicioDoPainel()} className="flex min-h-[2.5rem] min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
        <Logo className="size-7 shrink-0" />
        <span className="truncate font-display font-semibold tracking-[-0.015em]">{MARCA.nome}</span>
      </a>

      <Pressionavel
        onPress={() => setBusca(true)}
        data-slot="combobox-trigger"
        className="ml-auto hidden h-9 w-full max-w-sm cursor-default items-center gap-2 rounded-full border px-3.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring lg:mr-auto lg:ml-0 lg:flex"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="flex-1 text-left">Buscar pedidos, clientes, telas…</span>
        <kbd className="rounded-md bg-muted px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">Ctrl K</kbd>
      </Pressionavel>
      <Button variant="ghost" size="icon" onPress={() => setBusca(true)} className="ml-auto rounded-full lg:hidden" aria-label="Buscar">
        <Search />
      </Button>

      {/* unidade da sessão: quem trabalha nas duas troca aqui (o Início e as listas leem useUnidade()) */}
      {trocaUnidade && (
        <span data-casca-sessao className="contents">
          <DropdownMenuTrigger>
            <Button variant="ghost" className="h-9 gap-1.5 rounded-full px-3 max-sm:size-10 max-sm:px-0" aria-label={`Unidade: ${nomeDaUnidade(unidade)}. Trocar de unidade`}>
              <MapPin aria-hidden="true" />
              <span className="max-sm:sr-only">{unidade === "todas" ? "Todas" : UNIDADES[unidade].nome}</span>
              <ChevronDown aria-hidden="true" className="opacity-60 max-sm:hidden" />
            </Button>
            <DropdownMenu placement="bottom end" className="w-60" aria-label="Trocar de unidade">
              {ESCOLHAS.map((u) => (
                <DropdownMenuItem key={u} onAction={() => { if (u !== unidade) void trocarUnidade(u) }} textValue={nomeDaUnidade(u)}>
                  {nomeDaUnidade(u)} {unidade === u && <Check className="ml-auto" aria-label="(atual)" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
          </DropdownMenuTrigger>
        </span>
      )}

      <span data-casca-sessao className="contents"><Sino papel={papel} /></span>

      <DropdownMenuTrigger>
        <Button data-casca-sessao size="icon" className="rounded-full text-xs font-semibold" aria-label="Conta">{iniciais}</Button>
        <DropdownMenu placement="bottom end" className="w-64" aria-label="Conta">
          <DropdownMenuItem href={url("configuracoes/")} textValue={eu.nome}>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{eu.nome}</span>
              <span className="truncate text-xs text-muted-foreground">{nomeDoPapel(papel)} · {unidade === "todas" ? EMPRESA.nome : `${EMPRESA.nome} ${UNIDADES[unidade].nome}`}</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem href={url("configuracoes/aparencia/")}><Palette /> Aparência</DropdownMenuItem>
          <DropdownMenuItem href={url("configuracoes/")}><Settings /> Configurações</DropdownMenuItem>
          <DropdownMenuSeparator />
          {TEMAS.map((t) => {
            const I = iconeTema[t.id]
            return (
              <DropdownMenuItem key={t.id} onAction={() => trocarTema(t.id)} textValue={t.nome}>
                <I /> {t.nome} {tema === t.id && <Check className="ml-auto" aria-label="(atual)" />}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuItem onAction={() => trocarVidro(!vidro)} textValue="Vidro">
            <Sparkles /> Vidro {vidro && <Check className="ml-auto" aria-label="(ligado)" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem href={url("entrar/")} textValue="Sair"><LogOut /> Sair</DropdownMenuItem>
        </DropdownMenu>
      </DropdownMenuTrigger>

      {/* a busca (diálogo do React Aria) baixa só na primeira vez que abre */}
      {usouBusca && <Suspense fallback={null}><Busca aberta={busca} onFechar={() => setBusca(false)} /></Suspense>}
    </header>
  )
}

