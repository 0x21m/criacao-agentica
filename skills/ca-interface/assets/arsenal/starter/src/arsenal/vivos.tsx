// Demos do kit de movimento, da abertura, do carregamento e do componente do React Bits, para o /arsenal.
import { useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GlassIconReveal } from "@/components/ui/liquid-glass-logo-reveal"
import SplitText from "@/components/SplitText"
import { BotaoLiquido, EntradaEscalonada, GraficoQueDesenha, ItemEscalonado, NumeroAnimado, PulsoAoVivo, TextoRevelado } from "@/components/movimento"
import { Logo } from "@/components/app/Logo"
import { MARCA } from "@/proto/marca"
import { moedaInteira } from "@/lib/formato"
import { useCoresDoTema } from "@/lib/tema"

/** Remonta o filho para tocar a animação de novo. */
function DeNovo({ children }: { children: (chave: number) => ReactNode }) {
  const [n, setN] = useState(0)
  return (
    <div className="grid gap-4">
      <div key={n}>{children(n)}</div>
      <Button variant="outline" size="sm" className="w-fit" onPress={() => setN(n + 1)}><RotateCcw /> Tocar de novo</Button>
    </div>
  )
}

function NumeroDemo() {
  const [v, setV] = useState(48210.5)
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-8">
        <div><p className="text-sm text-muted-foreground">Contar (moeda)</p><p className="font-display text-3xl font-semibold"><NumeroAnimado valor={v} formato="moeda" entrada="sempre" /></p></div>
        <div><p className="text-sm text-muted-foreground">Odômetro</p><p className="font-display text-3xl font-semibold"><NumeroAnimado valor={Math.round(v / 100)} modo="odometro" entrada="sempre" /></p></div>
      </div>
      <Button variant="outline" size="sm" className="w-fit" onPress={() => setV(Math.round(Math.random() * 90000 * 100) / 100)}>Sortear outro valor</Button>
    </div>
  )
}

function AberturaDemo() {
  const [tocando, setTocando] = useState(false)
  const cores = useCoresDoTema({ fundo: "--background", logo: "--chart-1" })
  const escuro = typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  return (
    <div className="relative h-[28rem] overflow-hidden rounded-xl border bg-background">
      <AnimatePresence>
        {tocando && cores ? (
          <motion.div key="a" className="absolute inset-0" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.45 }}>
            <GlassIconReveal logo={MARCA.logo.replace(/currentColor/g, "#000")} label={`${MARCA.nome}, abrindo`} look={escuro ? "dark" : "light"}
              background={cores.fundo} logoColor={cores.logo} logoScale={0.6} finalScale={0.8} loop={false} hold={1} className="h-full w-full" tuning={{ startZoom: 2.3 }} />
            <button type="button" onClick={() => setTocando(false)} className="absolute top-3 right-3 h-9 rounded-full border bg-background/70 px-4 text-sm backdrop-blur hover:bg-muted">Pular</button>
          </motion.div>
        ) : (
          <div className="grid h-full place-items-center">
            <Button onPress={() => setTocando(true)}>Tocar a abertura</Button>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CarregamentoDemo() {
  return (
    <div className="grid h-72 place-items-center rounded-xl border bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo className="size-12" />
        <span className="font-display text-lg font-semibold tracking-tight">{MARCA.nome}</span>
        <span className="relative h-1 w-32 overflow-hidden rounded-full bg-muted"><span className="carregamento-barra absolute inset-y-0 w-1/3 rounded-full bg-primary" /></span>
      </div>
    </div>
  )
}

export const VIVOS: Record<string, () => ReactNode> = {
  abertura: () => <AberturaDemo />,
  carregamento: () => <CarregamentoDemo />,
  "numero-animado": () => <NumeroDemo />,
  "texto-revelado": () => (
    <DeNovo>{() => (
      <div className="grid gap-3">
        <TextoRevelado entrada="sempre" como="h2" texto="Bom dia, Marina" className="text-3xl font-semibold tracking-tight" />
        <TextoRevelado entrada="sempre" como="p" por="linha" texto={"Três pedidos pedem atenção hoje.\nO resto está em dia."} className="text-muted-foreground" atraso={0.3} />
      </div>
    )}</DeNovo>
  ),
  "grafico-que-desenha": () => (
    <DeNovo>{() => (
      <GraficoQueDesenha entrada="sempre" titulo="Faturamento por dia" dados={[12, 18, 15, 22, 27, 24, 31, 29, 35]} rotulos={["08/11", "09/11", "10/11", "11/11", "12/11", "13/11", "14/11", "15/11", "16/11"]}
        formatar={(v) => moedaInteira(v * 1000)} altura={200} />
    )}</DeNovo>
  ),
  "botao-liquido": () => (
    <div className="flex flex-wrap items-center gap-3">
      <BotaoLiquido><Plus className="size-4" /> Novo pedido</BotaoLiquido>
      <BotaoLiquido tamanho="lg">Concluir pedido</BotaoLiquido>
      <BotaoLiquido variante="secondary">Secundário com o mesmo efeito</BotaoLiquido>
    </div>
  ),
  "entrada-escalonada": () => (
    <DeNovo>{() => (
      <EntradaEscalonada entrada="sempre" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["Em aberto", "A receber", "Concluídos", "Atrasados"].map((t) => (
          <ItemEscalonado key={t}><Card className="h-24 gap-1 px-4 py-3"><span className="text-sm text-muted-foreground">{t}</span><span className="text-2xl font-semibold">12</span></Card></ItemEscalonado>
        ))}
      </EntradaEscalonada>
    )}</DeNovo>
  ),
  "pulso-ao-vivo": () => (
    <DeNovo>{(n) => (
      <div className="flex flex-wrap gap-6"><PulsoAoVivo rotulo="Ao vivo" chave={n} /><PulsoAoVivo rotulo="Dado novo" tom="destaque" chave={n} /><PulsoAoVivo rotulo="Atenção" tom="aviso" chave={n} /></div>
    )}</DeNovo>
  ),
  "split-text": () => (
    <DeNovo>{() => <SplitText text="Pedido concluído" tag="h2" className="text-4xl font-semibold tracking-tight" splitType="chars" trigger="load" />}</DeNovo>
  ),
}
