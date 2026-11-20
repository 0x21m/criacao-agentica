import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChevronsUpDownIcon } from "lucide-react"
import {
  Button as BotaoPrimitivo,
  ToggleButtonGroup as ToggleGroupPrimitive,
  ToggleButton as TogglePrimitive,
  type Key,
  type Selection,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from "react-aria-components"

import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toggleVariants } from "@/components/ui/toggle"
import { classesEquilibradas, useLinhasEquilibradas } from "@/hooks/use-linhas-equilibradas"

// MIFT: o grupo quebra de linha quando não cabe e nunca passa da largura disponível (nada rola por dentro).
// MIFT: `segmentado` é o controle segmentado (trilho cinza com segmentos de largura igual, numa linha só,
// o escolhido em destaque): para 2 a 5 opções exclusivas de filtro ou visão, igual em toda tela. Rótulo
// num <span> (corta com reticências se faltar espaço) e, se houver, a contagem num segundo <span>, que
// desce para baixo do rótulo: <ToggleGroupItem id="novos"><span>Novos</span><span>4</span></ToggleGroupItem>.
// Respiro lateral de 4 px no segmento: cinco segmentos cabem num celular de 390 px com rótulos de até 8 letras (Inter a
// 13 px, "Entregue").
// MIFT: grupo que quebra de linha não deixa órfão nem linha torta (regra "Skins e grupos de botões" em docs/padroes.md).
// Quando os itens não cabem numa linha, o grupo se equilibra: o número de colunas sai da conta (6 itens que cabem 4 por
// linha viram 3 + 3; 5 viram 3 + 2) e cada linha ocupa a largura toda, com os itens de mesma largura na linha e as
// bordas alinhadas. Vale para o grupo horizontal com espaço entre os itens; o segmentado, o vertical e o colado
// (spacing 0) ficam como estão. Mais de 5 opções exclusivas de filtro ou visão: menu ou camada (o grupo não é lista).
// MIFT: o segmentado que não cabe vira seletor compacto, nunca corta rótulo (docs/padroes.md, "Cabe em 320 px"). Ele
// mede o próprio lugar: se algum rótulo (ou contagem) não cabe no segmento, o trilho mostra só a opção escolhida, com a
// contagem ao lado e a seta de escolher ("Proposta 4 ⇅"), e o toque abre o menu com todas as opções e as contagens (a
// escolhida marcada), como o seletor de filtro dos apps de celular. Mesmo lugar, mesma altura, mesmas opções e a mesma
// seleção (o grupo guarda a escolha também quando não é controlado); voltou o espaço, voltam os segmentos. A conta usa a
// largura natural do texto (Range), não a forma atual, então não oscila. O conteúdo de cada opção no menu é o mesmo do
// segmento (os <span> de rótulo e contagem); o nome do botão é "<nome do grupo>: <opção> <contagem>".

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
    segmentado?: boolean
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  segmentado = false,
  children,
  ref,
  ...props
}: Omit<ToggleButtonGroupProps, "children"> &
  React.RefAttributes<HTMLDivElement> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
    segmentado?: boolean
    children?: React.ReactNode
  }) {
  const proprio = React.useRef<HTMLDivElement | null>(null)
  const juntarRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      proprio.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )
  useLinhasEquilibradas(proprio, !segmentado && orientation === "horizontal" && spacing > 0)

  // Segmentado: a seleção mora aqui também quando o grupo não é controlado (as duas formas mostram a mesma escolha).
  const controlado = props.selectedKeys !== undefined
  const [interna, setInterna] = React.useState<Set<Key>>(() => new Set(props.defaultSelectedKeys ?? []))
  const selecao = controlado ? new Set(props.selectedKeys) : interna
  const mudarSelecao = (k: Set<Key>) => {
    if (!controlado) setInterna(k)
    props.onSelectionChange?.(k)
  }
  const itens = segmentado ? itensDoGrupo(children) : []
  const forma = useFormaDoSegmentado(proprio, segmentado, itens.map((i) => `${String(i.id)}:${i.texto}`).join("|"))

  if (segmentado && forma === "compacto") {
    const escolhidos = itens.filter((i) => selecao.has(i.id))
    const atual = escolhidos[0] ?? itens[0]
    const nome = props["aria-label"]
    return (
      <div
        ref={juntarRef}
        data-slot="toggle-group"
        data-segmentado
        data-forma="compacto"
        className={cn("flex w-full max-w-full rounded-xl bg-muted p-1", typeof className === "string" && className.replace(/(^|\s)w-fit(?=\s|$)/g, "$1w-full"))}
      >
        <DropdownMenuTrigger>
          <BotaoPrimitivo
            data-slot="toggle-group-compacto"
            isDisabled={props.isDisabled}
            aria-labelledby={nome ? undefined : props["aria-labelledby"]}
            className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg bg-background px-3 text-left text-[13px] font-medium text-foreground shadow-sm outline-none transition-[scale] duration-150 select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 data-[pressed]:scale-[0.99] pointer-coarse:min-h-11"
          >
            {nome && <span className="sr-only">{nome}: </span>}
            <span className="flex min-w-0 items-center gap-2 [&>span]:min-w-0 [&>span:first-child]:truncate [&>span+span]:shrink-0 [&>span+span]:text-xs [&>span+span]:font-normal [&>span+span]:text-muted-foreground [&>span+span]:tabular-nums">
              {atual?.conteudo}
            </span>
            {escolhidos.length > 1 && <span className="shrink-0 text-xs font-normal text-muted-foreground">e mais {escolhidos.length - 1}</span>}
            <ChevronsUpDownIcon aria-hidden className="ms-auto size-4 shrink-0 text-muted-foreground" />
          </BotaoPrimitivo>
          <DropdownMenu
            aria-label={nome}
            aria-labelledby={nome ? undefined : props["aria-labelledby"]}
            placement="bottom"
            selectionMode={props.selectionMode ?? "single"}
            selectedKeys={selecao}
            disallowEmptySelection={props.disallowEmptySelection}
            shouldCloseOnSelect
            onSelectionChange={(k: Selection) => {
              if (k !== "all") mudarSelecao(new Set(k))
            }}
            className="min-w-44"
          >
            {itens.map((i) => (
              <DropdownMenuItem key={String(i.id)} id={i.id} textValue={i.texto} aria-label={i.nome} isDisabled={i.desabilitado} className="min-h-10">
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3 [&>span+span]:text-muted-foreground [&>span+span]:tabular-nums">{i.conteudo}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </DropdownMenuTrigger>
      </div>
    )
  }

  const selecaoDoGrupo = segmentado ? { selectedKeys: selecao, defaultSelectedKeys: undefined, onSelectionChange: mudarSelecao } : {}
  return (
    <ToggleGroupPrimitive
      ref={juntarRef}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-segmentado={segmentado || undefined}
      orientation={orientation}
      style={
        { "--gap": `calc(var(--spacing) * ${spacing})` } as React.CSSProperties
      }
      className={cn(
        "group/toggle-group flex w-fit max-w-full flex-row flex-wrap items-center gap-(--gap) rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-vertical:flex-col data-vertical:items-stretch",
        classesEquilibradas,
        segmentado && "grid w-full auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1",
        className
      )}
      {...props}
      {...selecaoDoGrupo}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation, segmentado }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: ToggleButtonProps & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        context.segmentado &&
          "h-auto min-h-10 w-full min-w-0 flex-col gap-0 border-0 px-1 py-1 text-[13px] leading-tight text-muted-foreground hover:bg-background/60 pointer-coarse:min-h-11 data-selected:bg-background data-selected:text-foreground data-selected:shadow-sm [&>span]:max-w-full [&>span]:truncate [&>span+span]:text-[11px] [&>span+span]:font-normal [&>span+span]:tabular-nums",
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

type ItemDoGrupo = { id: Key; conteudo: React.ReactNode; texto: string; nome?: string; desabilitado: boolean }

/** As opções do grupo (os ToggleGroupItem filhos, também dentro de fragmentos e listas): id, conteúdo e texto. */
function itensDoGrupo(filhos: React.ReactNode): ItemDoGrupo[] {
  const lista: ItemDoGrupo[] = []
  const visitar = (no: React.ReactNode) =>
    React.Children.forEach(no, (filho) => {
      if (!React.isValidElement<Record<string, unknown>>(filho)) return
      const p = filho.props
      if (filho.type === React.Fragment) return visitar(p.children as React.ReactNode)
      if (p.id === undefined || p.id === null) return
      const conteudo = typeof p.children === "function" ? null : (p.children as React.ReactNode)
      const nome = typeof p["aria-label"] === "string" ? p["aria-label"] : undefined
      lista.push({ id: p.id as Key, conteudo: conteudo ?? nome ?? String(p.id), texto: textoDe(conteudo).trim() || nome || String(p.id), nome, desabilitado: !!p.isDisabled })
    })
  visitar(filhos)
  return lista
}

function textoDe(no: React.ReactNode): string {
  if (no == null || typeof no === "boolean") return ""
  if (typeof no === "string" || typeof no === "number") return String(no)
  if (Array.isArray(no)) return no.map(textoDe).filter(Boolean).join(" ")
  if (React.isValidElement<{ children?: React.ReactNode }>(no)) return textoDe(no.props.children)
  return ""
}

/** Largura natural de um nó (o texto inteiro, mesmo cortado com reticências). */
function larguraNatural(no: Node) {
  const faixa = document.createRange()
  faixa.selectNodeContents(no)
  return faixa.getBoundingClientRect().width
}

const somaDaCaixa = (s: CSSStyleDeclaration) =>
  ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((t, k) => t + (parseFloat(s[k as "paddingLeft"]) || 0), 0)

/** Nos segmentos: algum rótulo corta? E a largura de que o trilho precisa para nenhum cortar (segmentos iguais). */
function medirSegmentos(raiz: HTMLElement) {
  const segmentos = [...raiz.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c.matches("[data-slot=toggle-group-item]"))
  if (!segmentos.length) return null
  let maior = 0
  let caixa = 0
  let corta = false
  for (const seg of segmentos) {
    const s = getComputedStyle(seg)
    const respiro = (parseFloat(s.paddingLeft) || 0) + (parseFloat(s.paddingRight) || 0)
    caixa = Math.max(caixa, somaDaCaixa(s))
    // O segmento empilha rótulo e contagem: o conteúdo é o mais largo dos dois.
    let conteudo = 0
    for (const filho of seg.childNodes) if (filho.nodeType === Node.ELEMENT_NODE || filho.textContent?.trim()) conteudo = Math.max(conteudo, larguraNatural(filho))
    maior = Math.max(maior, conteudo)
    if (conteudo > seg.clientWidth - respiro + 0.5) corta = true
  }
  const st = getComputedStyle(raiz)
  const vao = parseFloat(st.columnGap) || 0
  return { corta, necessaria: segmentos.length * (maior + caixa) + vao * (segmentos.length - 1) + somaDaCaixa(st) }
}

/** "segmentos" quando tudo cabe; "compacto" quando algum rótulo cortaria. Mede antes de pintar e a cada mudança de largura. */
function useFormaDoSegmentado(ref: React.RefObject<HTMLElement | null>, ativo: boolean, assinatura: string) {
  const [forma, setForma] = React.useState<"segmentos" | "compacto">("segmentos")
  const necessaria = React.useRef(0)
  const medidaDe = React.useRef<string | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!ativo || !el || typeof ResizeObserver === "undefined") return
    const medir = () => {
      if (forma === "segmentos") {
        const m = medirSegmentos(el)
        if (!m) return
        necessaria.current = m.necessaria
        medidaDe.current = assinatura
        if (m.corta) setForma("compacto")
      } else if (medidaDe.current !== assinatura || el.clientWidth + 0.5 >= necessaria.current) {
        // Rótulos novos (mede de novo nos segmentos, antes de pintar) ou voltou o espaço.
        setForma("segmentos")
      }
    }
    medir()
    document.fonts?.ready.then(() => ref.current === el && medir())
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, ativo, assinatura, forma])
  return ativo ? forma : "segmentos"
}

export { ToggleGroup, ToggleGroupItem }
