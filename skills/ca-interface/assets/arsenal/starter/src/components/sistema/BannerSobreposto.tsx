// BannerSobreposto: banner de marca (shader glass-fold nas cores do preset, véu de contraste, movimento lento) com o
// conteúdo principal da tela avançando sobre ele (40 a 72 px). Padrão da reserva da barbearia, agora do sistema.
//   variante "completa": tela inicial e telas principais do cliente (saudação, números do dia, card de atenção).
//   variante "compacta": telas de operação (tabela, quadro, agenda): faixa baixa que recolhe ao rolar; quando ela sai
//   da tela, uma barra de vidro fina com o título e as ações gruda no topo (NAV-41).
// Cores: --banner-1 (corpo das dobras, o acento), --banner-2 (fundo, núcleo escuro), --banner-3 (luz das bordas),
// --banner-veu (véu para o texto passar de 4,5:1). Movimento reduzido: o shader para (velocidade 0).
// O banner é escuro nos dois temas (como o nível "destaque"): o texto dele é claro.
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { Pause, Play } from "lucide-react"
// o shader (WebGL) vem num pedaço à parte, depois da abertura
const GlassFold = lazy(() => import("@/components/ui/glass-fold").then((m) => ({ default: m.GlassFold })))
import { useCoresDoTema } from "@/lib/tema"
import { useAberturaAcabou } from "@/components/app/Abertura"
import { useAparencia } from "@/proto/aparencia/aparencia"
import { presetPorId } from "@/proto/aparencia/presets"
import { cn } from "@/lib/utils"

export function BannerSobreposto({
  variante = "completa",
  sobrelinha,
  titulo,
  descricao,
  acoes,
  conteudoDoBanner,
  sobreposicao = 56,
  children,
  className,
}: {
  variante?: "completa" | "compacta"
  /** Linha pequena acima do título (data, contexto). */
  sobrelinha?: ReactNode
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
  /** Conteúdo extra dentro do banner (números do dia), à direita do título no desktop. */
  conteudoDoBanner?: ReactNode
  /** Quanto o conteúdo sobe sobre o banner, em px (40 a 72). */
  sobreposicao?: number
  /** O que avança sobre o banner (o card principal, o bento). */
  children?: ReactNode
  className?: string
}) {
  const reduzido = useReducedMotion()
  // O modo do banner vem do preset: "shader" (escuro da marca), "plano" (Sóbrio: faixa clara, sem shader e sem
  // sobreposição) ou "aberto" (Vidro: sem caixa, direto no papel de parede). O visual de cada modo é CSS sobre
  // html[data-banner] (sistema.css, "Banner por modo"): o HTML do servidor já sai certo, sem esperar a hidratação.
  // Só o shader depende do JS, e liga depois da abertura (as duas cenas de WebGL juntas travavam o primeiro segundo).
  const shader = presetPorId(useAparencia().preset).banner === "shader"
  const acabou = useAberturaAcabou()
  const cores = useCoresDoTema({ a: "--banner-1", b: "--banner-2", c: "--banner-3" })
  const compacta = variante === "compacta"
  const s = Math.max(40, Math.min(72, sobreposicao))
  const sentinela = useRef<HTMLDivElement>(null)
  // WCAG 2.2.2: movimento que dura mais de 5 s tem pausa. A escolha vale para todos os banners deste aparelho.
  const [pausado, setPausado] = useState(false)
  useEffect(() => { try { setPausado(localStorage.getItem("proto-banner-pausado") === "1") } catch {} }, [])
  const alternarPausa = () => setPausado((p) => { try { localStorage.setItem("proto-banner-pausado", p ? "0" : "1") } catch {} return !p })
  const [recolhido, setRecolhido] = useState(false)

  useEffect(() => {
    if (!compacta || !sentinela.current) return
    const io = new IntersectionObserver(([e]) => setRecolhido(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" })
    io.observe(sentinela.current)
    return () => io.disconnect()
  }, [compacta])

  return (
    <section data-slot="banner-sobreposto" data-variante={variante} data-com-conteudo={children ? "" : undefined}
      style={{ "--banner-s": `${s}px` } as React.CSSProperties} className={cn("relative px-3 pt-3 md:px-6 md:pt-5", className)}>
      <div className="banner-caixa @container/banner relative isolate overflow-hidden rounded-[calc(var(--raio-sup)*1.3)]">
        {cores && shader && acabou && (
          <Suspense fallback={null}><GlassFold color1={cores.a} color2={cores.b} color3={cores.c} speed={reduzido || pausado ? 0 : 0.18} scale={compacta ? 1.4 : 1.1} noise={0.08}
            className="pointer-events-none absolute inset-0 -z-10 size-full" /></Suspense>
        )}
        {cores && shader && acabou && !reduzido && (
          <button type="button" onClick={alternarPausa} aria-pressed={pausado} aria-label={pausado ? "Retomar a animação do banner" : "Pausar a animação do banner"}
            title={pausado ? "Retomar a animação" : "Pausar a animação"}
            className="absolute top-1 right-1 z-10 grid size-10 place-items-center rounded-full text-[var(--destaque-tinta-2)] opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring">
            {pausado ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
          </button>
        )}
        {/* véu: escurece onde está o texto (esquerda e alto); a direita deixa o shader aparecer. Só no modo shader (CSS). */}
        <div aria-hidden className="banner-veu pointer-events-none absolute inset-0 -z-10" />
        <div className={cn("banner-miolo relative flex flex-col gap-5 @3xl/banner:flex-row @3xl/banner:items-end @3xl/banner:justify-between", compacta ? "py-4 md:py-5" : "pt-5 pb-5 md:pt-7 md:pb-7")}>
          <div className="min-w-0 space-y-1.5">
            {sobrelinha && <p className="text-xs font-medium text-muted-foreground">{sobrelinha}</p>}
            <h1 className="t-pagina">{titulo}</h1>
            {descricao && <div className="max-w-prose text-sm text-muted-foreground">{descricao}</div>}
          </div>
          {conteudoDoBanner}
          {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2 @3xl/banner:flex-nowrap">{acoes}</div>}
        </div>
      </div>
      <div ref={sentinela} aria-hidden className="banner-sentinela h-px" />
      {children && <div data-sobreposicao className="banner-sobre relative z-10" style={{ marginTop: -1 }}>{children}</div>}

      {compacta && (
        // barra recolhida: uma faixa da largura da página com o fundo da própria página (véu + desfoque), que cobre o vão
        // até o conteúdo, e dentro dela a barra no material do sistema, alinhada às margens do card (mesma largura de
        // conteúdo, mesmo raio, mesma borda de luz). O cabeçalho fixo da tabela gruda logo abaixo (--faixa-fixa).
        <div
          aria-hidden={!recolhido}
          inert={!recolhido || undefined}
          data-faixa-fixa
          className={cn(
            "fixed inset-x-0 top-[var(--topo)] z-20 h-[var(--faixa-fixa)] px-3 pt-2 transition-[opacity,translate] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none md:px-6 lg:left-[var(--lateral)]",
            "bg-[color-mix(in_oklch,var(--background)_88%,transparent)] [backdrop-filter:blur(20px)_saturate(150%)] [-webkit-backdrop-filter:blur(20px)_saturate(150%)]",
            recolhido ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <div data-nivel="flutuante" className="sup flex h-12 items-center gap-3 rounded-[var(--raio-sup)] px-4">
            <p className="t-card min-w-0 flex-1 truncate">{titulo}</p>
            {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
          </div>
        </div>
      )}
    </section>
  )
}
