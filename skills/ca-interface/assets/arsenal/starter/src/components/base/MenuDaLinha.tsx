// MenuDaLinha: o "⋯" de cada linha de tabela ou cartão. Numa lista de 50 linhas, 50 menus do React Aria pesam na
// hidratação; aqui cada linha tem só um botão simples, sempre o mesmo elemento (nada é reconstruído no hover), e o menu
// de verdade (Popover + Menu do React Aria, ancorados no botão) só monta quando ele abre. Teclado: Enter, Espaço ou
// seta para baixo abrem no primeiro item; Esc fecha e devolve o foco ao botão.
import { useRef, useState, type ComponentType, type KeyboardEvent } from "react"
import { MoreHorizontal } from "lucide-react"
import { Menu, Popover } from "react-aria-components"
import { buttonVariants } from "@/components/ui/button"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type ItemMenu = { rotulo: string; icone?: ComponentType<{ className?: string }>; aoEscolher: () => void; perigo?: boolean; separadorAntes?: boolean }

export function MenuDaLinha({ rotulo, itens }: { rotulo: string; itens: ItemMenu[] }) {
  const [aberto, setAberto] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  // o toque no próprio botão fecha o menu (clique fora) antes do onClick: não reabrir logo em seguida
  const fechouEm = useRef(0)
  if (!itens.length) return null
  const fechar = () => { fechouEm.current = performance.now(); setAberto(false); requestAnimationFrame(() => botao.current?.focus()) }
  return (
    <>
      <button ref={botao} type="button" aria-label={rotulo} aria-haspopup="menu" aria-expanded={aberto}
        onClick={() => { if (!aberto && performance.now() - fechouEm.current > 250) setAberto(true) }}
        onKeyDown={(e: KeyboardEvent) => { if (e.key === "ArrowDown") { e.preventDefault(); setAberto(true) } }}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), aberto && "bg-muted")}>
        <MoreHorizontal />
      </button>
      {aberto && (
        <Popover triggerRef={botao} isOpen onOpenChange={(o) => { if (!o) fechar() }} placement="bottom end" offset={4}
          data-slot="dropdown-menu-content" data-nivel="flutuante"
          className="z-50 min-w-40 origin-(--trigger-anchor-point) overflow-x-hidden overflow-y-auto rounded-lg sup p-1 outline-none **:data-[slot$=-item]:data-focused:bg-foreground/10">
          <Menu aria-label={rotulo} autoFocus="first" className="max-h-[inherit] overflow-y-auto outline-hidden"
            onAction={(k) => { const i = itens.find((x) => x.rotulo === k); fechar(); i?.aoEscolher() }}>
            {itens.map((i) => <MenuItem key={i.rotulo} i={i} />)}
          </Menu>
        </Popover>
      )}
    </>
  )
}

function MenuItem({ i }: { i: ItemMenu }) {
  const I = i.icone
  return (
    <>
      {i.separadorAntes && <DropdownMenuSeparator />}
      <DropdownMenuItem id={i.rotulo} variant={i.perigo ? "destructive" : undefined} textValue={i.rotulo}>{I && <I />} {i.rotulo}</DropdownMenuItem>
    </>
  )
}
