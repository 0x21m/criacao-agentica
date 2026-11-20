/**
 * TEMPLATE: Home do app do cliente com navegação em pílula de vidro (base: liquid-glass-navbar).
 * Para que serve: tela inicial do app de quem compra: pedido em andamento, pontos, atalhos e ofertas, com a barra
 * de navegação flutuante fixa embaixo (só ícones no celular, com rótulos no desktop).
 * Quando usar: app do cliente final, no celular primeiro; até 5 destinos.
 * Quando não usar: navegação do operador (o efeito cansa com uso intenso); mais de 5 itens; telas com teclado aberto
 * o tempo todo (a barra cobre o conteúdo).
 * Depende de: components/ui/liquid-glass-navbar, lucide-react, templates/_base.
 * Ao adaptar: troque ITENS (rótulo, ícone, efeito) e o conteúdo de cada aba; o tom da barra segue o tema.
 * O componente fixa aria-label="Main"; aqui ele é trocado depois de montar (ver useRotuloNav).
 */
import { useEffect, useRef, useState } from "react"
import { Bike, Bell, ChevronRight, Home, Percent, Search, ShoppingBag, User, Wallet } from "lucide-react"
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { NEGOCIO, brl, numero } from "../_base/formato"
import { useTemaEscuro } from "../_base/tema"

const ITENS: LiquidNavItem[] = [
  { label: "Início", icon: <Home className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />, fx: "glow" },
  { label: "Ofertas", icon: <Percent className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />, fx: "pop" },
  { label: "Pedidos", icon: <ShoppingBag className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />, fx: "pop" },
  { label: "Carteira", icon: <Wallet className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />, fx: "wave" },
  { label: "Perfil", icon: <User className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />, fx: "pop" },
]

const CATEGORIAS = ["Hortifrúti", "Padaria", "Bebidas", "Mercearia", "Limpeza", "Pet"]
const OFERTAS = [
  { nome: "Banana prata", detalhe: "kg", de: 6.99, por: 4.49 },
  { nome: "Café torrado 500 g", detalhe: "Marca da casa", de: 21.9, por: 16.9 },
  { nome: "Pão de queijo", detalhe: "Pacote 1 kg", de: 32.0, por: 24.9 },
  { nome: "Iogurte natural", detalhe: "4 unidades", de: 12.5, por: 9.98 },
]

function useRotuloNav(rotulo: string) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector("nav")?.setAttribute("aria-label", rotulo)
  })
  return ref
}

function Inicio() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando className="space-y-4">
        <Esqueleto className="h-24 rounded-3xl" />
        <Esqueleto className="h-32 rounded-3xl" />
        <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-9 w-24 rounded-full" />)}</div>
        <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-40 rounded-2xl" />)}</div>
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={ShoppingBag}
        titulo="Seu carrinho começa aqui"
        texto="Você ainda não fez pedidos pelo app. Escolha uma loja para ver os produtos e as ofertas da semana."
        acao={<button type="button" className="h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Escolher loja</button>}
      />
    )
  return (
    <div className="space-y-6">
      <a href="#" onClick={(e) => e.preventDefault()} className={cn("flex items-center gap-4 rounded-3xl border border-border bg-card p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring", entrada)}>
        <span className="grid size-12 place-items-center rounded-2xl bg-chart-2/15 text-foreground"><Bike className="size-5" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Pedido #48213 a caminho</span>
          <span className="block text-sm text-muted-foreground">Chega entre 18h40 e 18h55</span>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Etapa 3 de 4: saiu para entrega">
            <span className="block h-full w-3/4 rounded-full bg-chart-2" />
          </span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </a>

      <section aria-label="Seus pontos" className={cn("relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground", entrada)} style={atraso(1)}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(255,255,255,.18),transparent_60%)]" />
        <p className="relative text-sm text-primary-foreground/70">Pontos do {NEGOCIO.app}</p>
        <div className="relative mt-1 flex items-end justify-between gap-4">
          <p className="text-4xl font-light tracking-tight tabular-nums">{numero(2380)}</p>
          <p className="text-right text-sm text-primary-foreground/80">= {brl(23.8)}<br />de desconto</p>
        </div>
      </section>

      <section aria-labelledby="cat-titulo" className={entrada} style={atraso(2)}>
        <h2 id="cat-titulo" className="sr-only">Categorias</h2>
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {CATEGORIAS.map((c) => (
            <li key={c}>
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm whitespace-nowrap hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">{c}</a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ofertas-titulo" className={entrada} style={atraso(3)}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="ofertas-titulo" className="text-base font-semibold">Ofertas da semana</h2>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-muted-foreground hover:text-foreground">Ver todas</a>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {OFERTAS.map((o) => (
            <li key={o.nome} className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-3 grid aspect-[4/3] place-items-center rounded-xl bg-muted text-muted-foreground" aria-hidden="true">
                <ShoppingBag className="size-6" />
              </div>
              <p className="text-sm leading-tight font-medium">{o.nome}</p>
              <p className="text-xs text-muted-foreground">{o.detalhe}</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-base font-semibold tabular-nums">{brl(o.por)}</span>
                <span className="text-xs text-muted-foreground line-through tabular-nums"><span className="sr-only">antes </span>{brl(o.de)}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Tela() {
  const escuro = useTemaEscuro()
  const [ativo, setAtivo] = useState(0)
  const navRef = useRotuloNav("Navegação principal")
  return (
    <div className="relative min-h-dvh w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-5 pt-6 pb-32 sm:max-w-3xl">
        <header className={cn("mb-5 flex items-center justify-between gap-3", entrada)}>
          <div>
            <p className="text-sm text-muted-foreground">Entregar em</p>
            <p className="text-base font-semibold">Rua Pernambuco, 1200</p>
          </div>
          <button type="button" aria-label="Notificações, 2 novas" className="relative grid size-10 place-items-center rounded-full border border-border hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
            <Bell className="size-4" />
            <span aria-hidden="true" className="absolute top-2 right-2.5 size-1.5 rounded-full bg-destructive" />
          </button>
        </header>
        <label className={cn("relative mb-6 block", entrada)}>
          <span className="sr-only">Buscar produtos</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" placeholder="Buscar arroz, café, frutas…" className="h-12 w-full rounded-full border border-input bg-card pr-4 pl-11 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring" />
        </label>

        {ativo === 0 ? (
          <Inicio />
        ) : (
          <EstadoVazio
            icone={ITENS[ativo].label === "Carteira" ? Wallet : ITENS[ativo].label === "Perfil" ? User : ITENS[ativo].label === "Pedidos" ? ShoppingBag : Percent}
            titulo={ITENS[ativo].label}
            texto="Esta aba ainda não foi desenhada no protótipo. A navegação, o foco e o estado ativo já funcionam."
          />
        )}
      </div>

      <div ref={navRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto">
          <LiquidNavbar items={ITENS} active={ativo} onChange={(i) => setAtivo(i)} tone={escuro ? "dark" : "light"} sound={false} />
        </div>
      </div>
    </div>
  )
}

export default function TemplateAppCliente() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
