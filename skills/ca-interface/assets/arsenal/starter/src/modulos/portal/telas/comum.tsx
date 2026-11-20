// Peças comuns das telas do portal: estados no texto do cliente (5.12, "Estados"), o banner padrão das telas
// principais (BannerSobreposto completo com o card sobreposto de 64 px), o "outra conta" sem nenhum dado (PON-20),
// o cartão de um pedido na lista (itens visíveis sem abrir, CLI-16) e os formatos.
import { useEffect, useState, type ReactNode } from "react"
import { ChevronRight, CloudOff, Lock, MessageCircle, RotateCw, SearchX } from "lucide-react"
import { LinkButton, Button } from "@/components/ui/button"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { ComDados, Carregando, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { definirConfig } from "@/proto/dados"
import { EMPRESA } from "@/proto/negocio"
import { moeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { FRASES, type PedidoCliente } from "../dados"

// ---------- URL ----------
/** Um parâmetro da URL; `undefined` até a página hidratar (no servidor não há query string): a tela mostra o esqueleto. */
export function useParametro(nome: string): string | null | undefined {
  const [v, setV] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    const ler = () => setV(new URLSearchParams(location.search).get(nome))
    ler()
    document.addEventListener("astro:page-load", ler)
    return () => document.removeEventListener("astro:page-load", ler)
  }, [nome])
  return v
}

// ---------- formatos ----------
export const diaHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " às")
export const diaSemana = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")
export const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
export const dataExtensa = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
export const WHATSAPP = `https://wa.me/55${EMPRESA.whatsapp.replace(/\D/g, "")}`

/** O caminho de cada tela do portal. */
export const ir = {
  inicio: () => url("portal/"),
  pedidos: () => url("portal/pedidos/"),
  pedido: (id: string) => url(`portal/pedido/?id=${id}`),
  orcamento: (id: string) => url(`portal/orcamento/?id=${id}`),
  pagar: (lan: string) => url(`portal/pagar/?id=${lan}`),
  conversa: (ref?: string, texto?: string) => url(`portal/conversa/${ref || texto ? "?" : ""}${[ref && `pedido=${ref}`, texto && `texto=${encodeURIComponent(texto)}`].filter(Boolean).join("&")}`),
  agendar: (servico?: string) => url(`portal/agendar/${servico ? `?servico=${servico}` : ""}`),
  dados: () => url("portal/dados/"),
}

// ---------- banner ----------
/** O banner completo das telas principais do portal, com o card sobreposto (64 px). */
export function BannerCliente({ sobrelinha, titulo, descricao, children }: { sobrelinha?: ReactNode; titulo: ReactNode; descricao?: ReactNode; children?: ReactNode }) {
  return (
    <BannerSobreposto variante="completa" sobrelinha={sobrelinha} titulo={titulo} descricao={descricao} sobreposicao={64}>
      {children}
    </BannerSobreposto>
  )
}

// ---------- estados ----------
/** Erro no texto do cliente: tentar de novo e o WhatsApp como saída. */
export function ErroCliente({ oQue = "seus pedidos" }: { oQue?: string }) {
  return (
    <div className="px-3 md:px-6">
      <Superficie role="alert" tom="perigo" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive"><CloudOff className="size-5" aria-hidden="true" /></span>
        <div className="space-y-1">
          <p className="text-sm font-medium">Não foi possível carregar {oQue}.</p>
          <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">Tente de novo em instantes.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" className="h-10" onPress={() => definirConfig({ estado: "dados" })}><RotateCw /> Tentar de novo</Button>
          <LinkButton variant="ghost" className="h-10" href={WHATSAPP} target="_blank" rel="noopener">Falar no WhatsApp</LinkButton>
        </div>
      </Superficie>
    </div>
  )
}

/** Vazio do portal: convida a começar por uma limpeza. */
export function VazioCliente() {
  return (
    <div className="px-3 md:px-6">
      <EstadoVazio icone={SearchX} titulo="Você ainda não tem pedidos." texto="Que tal começar por uma limpeza do ar?"
        acao={<LinkButton className="h-10" href={ir.agendar("limpeza-split")}>Agendar limpeza</LinkButton>} />
    </div>
  )
}

/** Carregando: o banner com o título e o card sobreposto em esqueleto (para com movimento reduzido). */
export function EsqueletoCliente({ titulo = "Carregando" }: { titulo?: string }) {
  return (
    <Carregando rotulo="seus pedidos">
      <BannerCliente titulo={titulo} descricao={<Esqueleto className="h-4 w-56 max-w-full bg-white/15" />}>
        <Superficie nivel="card" className="grid gap-3 p-5 md:p-6">
          <Esqueleto className="h-4 w-40" />
          <Esqueleto className="h-6 w-3/4" />
          <Esqueleto className="h-10 w-48" />
        </Superficie>
      </BannerCliente>
      <div className="grid gap-4 px-3 pt-6 md:px-6 lg:grid-cols-12">
        <Esqueleto className="h-40 rounded-[var(--raio-sup)] lg:col-span-8" />
        <Esqueleto className="h-40 rounded-[var(--raio-sup)] lg:col-span-4" />
      </div>
    </Carregando>
  )
}

/** Os estados da barra F (?estado=) em volta de uma tela do portal. */
export function ComDadosCliente({ estaVazio, oQue, titulo, children }: { estaVazio?: boolean; oQue?: string; titulo?: string; children: ReactNode | (() => ReactNode) }) {
  return (
    <ComDados rotulo={oQue ?? "seus pedidos"} estaVazio={estaVazio} esqueleto={<EsqueletoCliente titulo={titulo} />} vazio={<VazioCliente />} erro={<ErroCliente oQue={oQue} />}>
      {children}
    </ComDados>
  )
}

/** Link de outra conta (PON-20): nenhum dado do pedido, nem o título. */
export function OutraConta() {
  return (
    <>
      <BannerCliente titulo="Pedido de outra conta">
        <Superficie data-estado-tela="sem-permissao" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Lock className="size-5" aria-hidden="true" /></span>
          <p className="max-w-sm text-sm font-medium text-pretty">{FRASES.outraConta}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton className="h-10" href={ir.pedidos()}>Ver os meus pedidos</LinkButton>
            <LinkButton variant="ghost" className="h-10" href={ir.conversa()}><MessageCircle /> Falar com a Oficina</LinkButton>
          </div>
        </Superficie>
      </BannerCliente>
    </>
  )
}

/** Sem id na URL ou id que não existe. */
export function NaoAchado({ oQue = "Pedido" }: { oQue?: string }) {
  return (
    <BannerCliente titulo={`${oQue} não encontrado`}>
      <Superficie className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><SearchX className="size-5" aria-hidden="true" /></span>
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">O link pode estar incompleto. Seus pedidos estão todos na lista.</p>
        <LinkButton className="h-10" href={ir.pedidos()}>Ver os meus pedidos</LinkButton>
      </Superficie>
    </BannerCliente>
  )
}

/** Título de seção com uma ação à direita. */
export function Secao({ titulo, acao, children, className, id }: { titulo: string; acao?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  const h = id ?? `s-${titulo.toLowerCase().replace(/\W+/g, "-")}`
  return (
    <section aria-labelledby={h} className={cn("grid content-start gap-3", className)}>
      <header className="flex min-h-10 items-center justify-between gap-3">
        <h2 id={h} className="t-secao">{titulo}</h2>
        {acao}
      </header>
      {children}
    </section>
  )
}

/** Um pedido na lista: id, título, a frase de agora e os itens visíveis sem abrir (CLI-16). */
export function CartaoPedido({ p, className }: { p: PedidoCliente; className?: string }) {
  const itens = p.itens.length ? p.itens.map((i) => (i.qtd > 1 ? `${i.qtd} × ${i.descricao}` : i.descricao)).join(" · ") : "Itens no orçamento"
  return (
    <Superficie como="a" href={ir.pedido(p.id)} interativa className="group grid gap-2 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="t-rotulo num">{p.id}{p.tipo === "venda" ? " · Loja" : ""}</p>
          <p className="t-card">{p.titulo}</p>
        </div>
        <span className="num shrink-0 text-sm font-medium whitespace-nowrap">{p.total ? moeda(p.total) : "sob orçamento"}</span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
      </div>
      <FraseDoCliente p={p.p} ctx={p.ctx} acao={<span />} className="text-muted-foreground" />
      {itens.toLowerCase() !== p.titulo.toLowerCase() && <p className="truncate text-xs text-muted-foreground" title={itens}>{itens}</p>}
    </Superficie>
  )
}
