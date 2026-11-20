// Estados de tela (5.0): carregando, vazio (primeiro uso, filtro sem resultado, fila concluída), erro e sem permissão,
// todos no mesmo material e com os textos padrão da especificação. <ComDados> escolhe entre eles.
// Os dados de exemplo chegam prontos do servidor; "carregando", "vazio" e "erro" vêm da barra F (?estado=) e da tela.
import type { ComponentType, ReactNode } from "react"
import { CloudOff, Lock, RotateCw } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { inicioDoPainel, url } from "@/lib/url"
import { definirConfig, useConfig } from "@/proto/dados"
import { aQuemPedir, nomeDoPapel, usePapel, pode, type Capacidade } from "@/proto/permissoes"

/** Bloco de carregamento com a forma da tela (nunca spinner solto). Pulsa só sem movimento reduzido. */
export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
}

/** Envolve o esqueleto: o leitor de tela ouve "Carregando {o quê}…". */
export function Carregando({ children, rotulo = "dados", className }: { children: ReactNode; rotulo?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">Carregando {rotulo}…</span>
      {children}
    </div>
  )
}

/**
 * Vazio. As variantes são distintas (EST-37): "primeiro-uso" (nada cadastrado: convida a criar), "filtro" (o recorte
 * não achou nada: "Nenhum {pedido} com {Atrasados · Pampulha}." + Limpar filtros) e "concluido" (a fila acabou: calma).
 */
export function EstadoVazio({ icone: Icone, titulo, texto, acao, variante = "primeiro-uso", className }: {
  icone: ComponentType<{ className?: string }>; titulo: string; texto?: string; acao?: ReactNode
  variante?: "primeiro-uso" | "filtro" | "concluido"; className?: string
}) {
  return (
    <div data-vazio={variante} className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-[var(--raio-sup)] px-6 py-12 text-center",
      variante === "filtro" ? "border border-dashed border-[color-mix(in_oklch,var(--foreground)_14%,transparent)]" : "sup",
      className,
    )} data-nivel={variante === "filtro" ? undefined : "card"}>
      <span className={cn("grid size-11 place-items-center rounded-full", variante === "concluido" ? "bg-positive/14 text-positive" : "bg-muted text-muted-foreground")}><Icone className="size-5" /></span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-balance">{titulo}</p>
        {texto && <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">{texto}</p>}
      </div>
      {acao}
    </div>
  )
}

/** "Não foi possível carregar {os pedidos}. A conexão falhou. Seus dados estão seguros; tente de novo." */
export function EstadoErro({ oQue = "os dados", className }: { oQue?: string; className?: string }) {
  return (
    <div role="alert" data-nivel="card" data-tom="perigo" className={cn("sup flex flex-col items-center justify-center gap-3 rounded-[var(--raio-sup)] px-6 py-12 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive"><CloudOff className="size-5" /></span>
      <div className="space-y-1">
        <p className="text-sm font-medium">Não foi possível carregar {oQue}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">A conexão falhou. Seus dados estão seguros; tente de novo.</p>
      </div>
      <Button variant="outline" onPress={() => definirConfig({ estado: "dados" })}><RotateCw /> Tentar de novo</Button>
    </div>
  )
}

/**
 * Sem permissão (PON-20): cadeado, de quem é a área e a quem pedir. Nunca mostra dado do registro.
 * `area`: "do financeiro", "da gestão"…
 */
export function EstadoSemPermissao({ area, className }: { area: string; className?: string }) {
  const papel = usePapel()
  return (
    <div data-estado-tela="sem-permissao" data-nivel="card" className={cn("sup mx-auto flex max-w-lg flex-col items-center justify-center gap-3 rounded-[var(--raio-sup)] px-6 py-12 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Lock className="size-5" /></span>
      <div className="space-y-1">
        <p className="text-sm font-medium">Esta área é {area}.</p>
        <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">Seu papel ({nomeDoPapel(papel)}) não abre esta tela. Peça acesso a {aQuemPedir(papel)}.</p>
      </div>
      <LinkButton variant="outline" href={inicioDoPainel()}>Voltar ao início</LinkButton>
    </div>
  )
}

/**
 * Escolhe o que mostrar: sem permissão, esqueleto ("carregando" da barra F), erro, vazio ou o conteúdo.
 * O conteúdo já existe no servidor (dados de exemplo): passe-o direto; `estaVazio` decide o vazio de primeiro uso.
 */
export function ComDados({ esqueleto, vazio, erro, estaVazio = false, capacidade, area = "de outra equipe", rotulo, children }: {
  esqueleto: ReactNode
  vazio: ReactNode
  /** Como o erro aparece nesta tela (com o cabeçalho e o gutter dela); sem ele, o EstadoErro padrão. */
  erro?: ReactNode
  estaVazio?: boolean
  /** A tela só abre para quem pode (sem contexto). */
  capacidade?: Capacidade
  area?: string
  /** "os pedidos": vai no "Carregando…" do leitor de tela. */
  rotulo?: string
  children: ReactNode | (() => ReactNode)
}) {
  const { estado } = useConfig()
  const papel = usePapel()
  // data-estado-tela: o navegar.mjs confere que ?estado=<nome> aparece de verdade em cada tela
  const marca = (e: string, el: ReactNode) => <div data-estado-tela={e} className="contents">{el}</div>
  if (capacidade && !pode(papel, capacidade)) return marca("sem-permissao", <EstadoSemPermissao area={area} />)
  if (estado === "carregando") return marca("carregando", <Carregando rotulo={rotulo}>{esqueleto}</Carregando>)
  if (estado === "erro") return marca("erro", erro ?? <EstadoErro oQue={rotulo} />)
  if (estado === "vazio" || estaVazio) return marca("vazio", vazio)
  return marca("dados", typeof children === "function" ? children() : children)
}
