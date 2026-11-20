/**
 * TEMPLATE: Abertura do app que passa para a home (base: liquid-glass-logo-reveal, GlassIconReveal).
 * Para que serve: momento-assinatura de marca na primeira abertura: o logo surge numa gota de vidro, toca uma vez
 * (sem loop) e a tela cede lugar à home. Sempre com "Pular" e com saída imediata em movimento reduzido.
 * Quando usar: primeira abertura do app do cliente, tela de sucesso de marca (cadastro concluído, primeiro pedido).
 * Quando não usar: como carregamento real (ele não sabe quanto falta); em fluxos repetidos várias vezes ao dia;
 * no painel do operador.
 * Depende de: components/ui/liquid-glass-logo-reveal (GlassIconReveal, exportado na cópia da vitrine), lucide-react,
 * templates/_base (useCoresDoTema, useMovimentoReduzido).
 * Ao adaptar: troque LOGO pelo SVG da marca (só a forma é usada; a cor vem de --chart-1), a duração em DURACAO_MS
 * e a home que vem depois. Guarde em armazenamento se a abertura já foi vista, para não repetir.
 */
import { useEffect, useRef, useState } from "react"
import { ChevronRight, Gift, Percent, RotateCcw, ShoppingBasket, Sparkles } from "lucide-react"
import { GlassIconReveal } from "@/components/ui/liquid-glass-logo-reveal"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { NEGOCIO, brl, numero } from "../_base/formato"
import { useCoresDoTema, useMovimentoReduzido, useTemaEscuro } from "../_base/tema"

/** Logo fictício do produto: flor de ipê com cinco pétalas. Só a forma importa. */
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#000">${[0, 72, 144, 216, 288]
  .map((a) => `<ellipse cx="50" cy="27" rx="13" ry="21" transform="rotate(${a} 50 50)"/>`)
  .join("")}<circle cx="50" cy="50" r="12"/></g></svg>`

const DURACAO_MS = 3400

function Home({ onRever }: { onRever: () => void }) {
  const estado = useEstadoTela()
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-background px-5 pt-8 pb-10 text-foreground sm:max-w-2xl">
      <header className={cn("flex items-center justify-between", entrada)}>
        <div>
          <p className="text-sm text-muted-foreground">Boa tarde,</p>
          <h1 className="text-2xl font-semibold tracking-tight">Camila</h1>
        </div>
        <button type="button" onClick={onRever} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <RotateCcw className="size-4" aria-hidden="true" /> Rever abertura
        </button>
      </header>

      {estado === "carregando" ? (
        <Carregando className="mt-6 space-y-4">
          <Esqueleto className="h-36 rounded-3xl" />
          <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-24 rounded-2xl" />)}</div>
          <Esqueleto className="h-20 rounded-2xl" />
        </Carregando>
      ) : estado === "vazio" ? (
        <EstadoVazio
          icone={Sparkles}
          titulo="Bem-vinda ao Ipê Clube"
          texto="Você ainda não tem pontos. Cada R$ 1 em compras vira 1 ponto, e os pontos viram desconto no caixa."
          acao={<button type="button" className="h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Fazer a primeira compra</button>}
          className="mt-6"
        />
      ) : (
        <>
          <section aria-label="Seus pontos" className={cn("relative mt-6 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground", entrada)} style={atraso(1)}>
            <p className="text-sm text-primary-foreground/70">Pontos do {NEGOCIO.app}</p>
            <p className="mt-1 text-5xl font-light tracking-tight tabular-nums">{numero(2380)}</p>
            <p className="mt-3 text-sm text-primary-foreground/80">Valem {brl(23.8)} de desconto na próxima compra.</p>
          </section>
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icone: ShoppingBasket, rotulo: "Comprar" },
              { icone: Percent, rotulo: "Ofertas" },
              { icone: Gift, rotulo: "Trocar pontos" },
            ].map((a, i) => (
              <li key={a.rotulo} className={entrada} style={atraso(2 + i)}>
                <a href="#" onClick={(e) => e.preventDefault()} className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                  <a.icone className="size-5 text-muted-foreground" aria-hidden="true" />
                  {a.rotulo}
                </a>
              </li>
            ))}
          </ul>
          <a href="#" onClick={(e) => e.preventDefault()} className={cn("mt-4 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring", entrada)} style={atraso(5)}>
            <span className="grid size-11 place-items-center rounded-xl bg-muted"><Percent className="size-5" aria-hidden="true" /></span>
            <span className="flex-1">
              <span className="block text-sm font-medium">Feira de hortifrúti</span>
              <span className="block text-sm text-muted-foreground">Até 30% de desconto, só nesta quarta.</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </a>
        </>
      )}
    </div>
  )
}

function Tela() {
  const reduzido = useMovimentoReduzido()
  const escuro = useTemaEscuro()
  const cores = useCoresDoTema({ fundo: "--background", logo: "--chart-1" })
  const [fase, setFase] = useState<"abertura" | "saindo" | "home">("abertura")
  const pularRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (fase !== "abertura") return
    const t1 = window.setTimeout(() => setFase("saindo"), reduzido ? 600 : DURACAO_MS)
    return () => window.clearTimeout(t1)
  }, [fase, reduzido])
  useEffect(() => {
    if (fase !== "saindo") return
    const t = window.setTimeout(() => setFase("home"), reduzido ? 0 : 450)
    return () => window.clearTimeout(t)
  }, [fase, reduzido])

  if (fase === "home") return <Home onRever={() => setFase("abertura")} />

  return (
    <div
      className={cn("relative h-dvh w-full transition-opacity duration-500 ease-out motion-reduce:transition-none", fase === "saindo" && "opacity-0")}
      style={{ backgroundColor: cores.fundo }}
    >
      <GlassIconReveal
        logo={LOGO}
        label={`${NEGOCIO.app}, abrindo`}
        look={escuro ? "dark" : "light"}
        background={cores.fundo}
        logoColor={cores.logo}
        logoScale={0.6}
        finalScale={0.8}
        loop={false}
        hold={1}
        className="h-full w-full"
        tuning={{ startZoom: 2.3 }}
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-[18%] text-center text-sm font-medium tracking-tight text-muted-foreground animate-in fade-in-0 duration-700 fill-mode-both [animation-delay:1.2s] motion-reduce:animate-none">
        {NEGOCIO.app}
      </p>
      <button
        ref={pularRef}
        type="button"
        onClick={() => setFase("home")}
        className="absolute top-4 right-4 h-9 rounded-full border border-border bg-background/70 px-4 text-sm text-foreground backdrop-blur hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
      >
        Pular
      </button>
    </div>
  )
}

export default function TemplateAbertura() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
