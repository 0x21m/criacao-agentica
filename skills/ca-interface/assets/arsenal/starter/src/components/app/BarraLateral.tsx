// Barra lateral recolhível (desktop). O estado fica no <html data-lateral> e no localStorage, para a página
// abrir já na largura certa. O realce do item ativo desliza entre os itens (layoutId, mola rápida).
// Os itens vêm do registro dos módulos (src/modulos/registro.ts), filtrados pelo papel ativo.
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { achatar, caminhoAtivo, navegacao, useSituacoesDosModulos, type ItemNav } from "@/modulos/registro"
import { useSessaoDaCasca } from "@/proto/permissoes"
import { MARCA } from "@/proto/marca"
import { mola } from "@/proto/movimento"
import { inicioDoPainel, url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { Logo } from "./Logo"
import { useRota } from "./rota"

export default function BarraLateral({ rota: rotaInicial = null }: { rota?: string | null }) {
  const [recolhida, setRecolhida] = useState(false)
  const rota = useRota(rotaInicial)
  const nav = navegacao(useSessaoDaCasca().papel, useSituacoesDosModulos())
  const ativo = rota === null ? undefined : caminhoAtivo(rota, achatar(nav))
  const reduzido = useReducedMotion()

  useEffect(() => setRecolhida(document.documentElement.dataset.lateral === "recolhida"), [])
  function alternar() {
    const nova = !recolhida
    setRecolhida(nova)
    if (nova) document.documentElement.dataset.lateral = "recolhida"
    else delete document.documentElement.dataset.lateral
    try { localStorage.setItem("proto-lateral", nova ? "recolhida" : "aberta") } catch {}
  }

  const renderItem = (item: ItemNav, filho?: boolean) => {
    const eAtivo = ativo === item.caminho
    const link = (
      <a
        href={url(item.caminho)}
        aria-current={eAtivo ? "page" : undefined}
        className={cn(
          "relative flex h-9 items-center gap-3 rounded-full px-3 text-sm text-sidebar-foreground/75 outline-none transition-colors duration-150 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring",
          filho && !recolhida && "ml-5 h-8",
          eAtivo && "font-medium text-sidebar-foreground",
        )}
      >
        {eAtivo && (
          <motion.span layoutId="nav-ativo" transition={reduzido ? { duration: 0 } : mola.rapida}
            className="nav-ativo absolute inset-0 -z-0 rounded-full" />
        )}
        {!eAtivo && <span className="absolute inset-0 rounded-full transition-colors duration-150 hover:bg-sidebar-accent" />}
        <item.icone className={cn("relative size-[1.0625rem] shrink-0", eAtivo ? "text-sidebar-primary" : "opacity-80")} strokeWidth={eAtivo ? 2.1 : 1.8} aria-hidden="true" />
        {!recolhida && <span className="relative truncate" title={item.rotulo}>{item.rotulo}</span>}
        {recolhida && <span className="sr-only">{item.rotulo}</span>}
      </a>
    )
    if (!recolhida) return link
    return (
      <TooltipTrigger delay={200}>
        {link}
        <Tooltip placement="right">{item.rotulo}</Tooltip>
      </TooltipTrigger>
    )
  }

  return (
      <aside
        data-nivel="casca"
        aria-label="Navegação principal"
        className="sup casca-lateral fixed inset-y-0 left-0 z-30 hidden w-[var(--lateral)] flex-col rounded-none transition-[width] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none lg:flex"
      >
        <a href={inicioDoPainel()} className="flex h-[var(--topo)] shrink-0 items-center gap-2.5 overflow-hidden px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo className="shrink-0" />
          {!recolhida && <span className="flex min-w-0 flex-col leading-tight"><span className="truncate font-display text-[0.9375rem] font-semibold tracking-[-0.015em]">{MARCA.nome}</span><span className="truncate text-xs text-muted-foreground">{MARCA.descricao}</span></span>}
          {recolhida && <span className="sr-only">{MARCA.nome}, início</span>}
        </a>
        <nav data-casca-sessao data-rolagem-permitida className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2 pb-3">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.caminho}>
                {renderItem(item)}
                {item.filhos && (
                  <ul className="mt-0.5 space-y-0.5">
                    {item.filhos.map((f) => <li key={f.caminho}>{renderItem(f, true)}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2.5 shadow-[inset_0_1px_0_var(--sidebar-border)]">
          <button
            type="button"
            onClick={alternar}
            aria-expanded={!recolhida}
            aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
            className="flex h-9 w-full items-center gap-3 rounded-full px-3 text-sm text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {recolhida ? <PanelLeftOpen className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
            {!recolhida && <span className="truncate">Recolher menu</span>}
          </button>
        </div>
      </aside>
  )
}
