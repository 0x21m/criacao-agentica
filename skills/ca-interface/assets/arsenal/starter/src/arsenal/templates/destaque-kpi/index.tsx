/**
 * TEMPLATE: Visão geral com 2 KPIs de destaque (base: peak-chart).
 * Para que serve: abrir a visão geral com dois números que merecem atenção (pedidos e conversão), cada um com seu pico,
 * numa faixa escura de destaque; abaixo, o detalhe em componentes sóbrios.
 * Quando usar: visão geral do gerente, resumo semanal, tela de conquista; no máximo 2 peak-charts por tela.
 * Quando não usar: grade de muitos KPIs, listas e tabelas.
 * Depende de: components/ui/peak-chart, lucide-react, templates/_base (useCoresDoTema).
 * Ao adaptar: troque SERIES e os rótulos; o destaque de cada card vem de --chart-N. A faixa usa a classe .dark
 * para herdar os tokens do tema escuro nos dois temas (o componente foi desenhado para fundo escuro).
 */
import { useEffect, useRef, useState } from "react"
import { ArrowRight, CalendarDays, Megaphone, PackageCheck, Plus, Star, Truck } from "lucide-react"
import { PeakChart } from "@/components/ui/peak-chart"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { useCoresDoTema } from "../_base/tema"

type Serie = { data: number[]; labels: string[]; value: number }
const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

const PEDIDOS: Record<string, Serie> = {
  Semanal: { data: [212, 236, 228, 301, 384, 352, 240], labels: DIAS_SEMANA, value: 384 },
  Mensal: { data: [180, 196, 205, 188, 230, 262, 251, 270, 310, 298, 342, 384, 356, 331], labels: Array.from({ length: 14 }, (_, i) => `dia ${i * 2 + 1}`), value: 384 },
  Anual: { data: [140, 152, 171, 168, 190, 214, 236, 229, 262, 300, 341, 384], labels: MESES, value: 384 },
}
const CONVERSAO: Record<string, Serie> = {
  Semanal: { data: [24, 27, 26, 31, 38, 35, 29], labels: DIAS_SEMANA, value: 38 },
  Mensal: { data: [18, 19, 21, 22, 22, 25, 27, 26, 29, 31, 33, 38, 36, 34], labels: Array.from({ length: 14 }, (_, i) => `dia ${i * 2 + 1}`), value: 38 },
  Anual: { data: [12, 14, 15, 17, 19, 21, 24, 26, 28, 31, 35, 38], labels: MESES, value: 38 },
}
const PERIODOS = ["Semanal", "Mensal", "Anual"]

const NOVIDADES = [
  { icone: Megaphone, titulo: "Campanha de hortifrúti puxou a sexta", texto: "384 pedidos, o pico da semana. 41% tinham ao menos um item da feira." },
  { icone: Star, titulo: "Avaliação do app subiu para 4,8", texto: "Mais elogios à entrega no mesmo dia; reclamações de troco caíram." },
  { icone: Truck, titulo: "Entregas no prazo: 96%", texto: "Duas rotas atrasaram na quarta por causa da chuva." },
]

function useLargura() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Mede a largura e arredonda em passos de 20px: evita o laço "barra de rolagem aparece → largura muda → some".
    const ro = new ResizeObserver(([e]) => {
      const total = e.contentRect.width
      const lado = total >= 720
      const alvo = Math.max(220, Math.min(380, lado ? (total - 48) / 2 : total - 8))
      setW((atual) => (Math.abs(atual - alvo) < 20 ? atual : Math.floor(alvo / 20) * 20))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function FaixaDestaque() {
  const [ref, largura] = useLargura()
  const [pPedidos, setPPedidos] = useState("Semanal")
  const [pConv, setPConv] = useState("Semanal")
  const cores = useCoresDoTema({ a: "--chart-1", b: "--chart-2" })
  const ped = PEDIDOS[pPedidos]
  const conv = CONVERSAO[pConv]
  return (
    <section aria-labelledby="destaque-titulo" className={cn("dark overflow-hidden rounded-3xl border border-border bg-background p-4 text-foreground sm:p-8", entrada)}>
      <h2 id="destaque-titulo" className="sr-only">Destaques da semana</h2>
      <div ref={ref} className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        <figure className="m-0">
          <PeakChart
            width={largura}
            accent={cores.a}
            data={ped.data}
            labels={ped.labels}
            value={ped.value}
            valueSuffix=""
            decimals={0}
            title="Pedidos no dia de pico"
            caption="Recorde do período"
            updatedText="Atualizado há 5 min"
            trend="up"
            periods={PERIODOS}
            period={pPedidos}
            onPeriodChange={setPPedidos}
            formatValue={(v) => `${Math.round(v)} pedidos`}
            font="Geist, ui-sans-serif, system-ui, sans-serif"
          />
          <figcaption className="sr-only">Pedidos por dia: pico de {ped.value} no período {pPedidos.toLowerCase()}.</figcaption>
        </figure>
        <figure className="m-0">
          <PeakChart
            width={largura}
            accent={cores.b}
            data={conv.data}
            labels={conv.labels}
            value={conv.value}
            valueSuffix="%"
            decimals={0}
            title="Conversão do app"
            caption="Visitas que viraram pedido"
            updatedText="Ao vivo"
            trend="up"
            periods={PERIODOS}
            period={pConv}
            onPeriodChange={setPConv}
            formatValue={(v) => `${Math.round(v)}%`}
            font="Geist, ui-sans-serif, system-ui, sans-serif"
          />
          <figcaption className="sr-only">Conversão do app: pico de {conv.value}% no período {pConv.toLowerCase()}.</figcaption>
        </figure>
      </div>
    </section>
  )
}

function Conteudo() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando className="space-y-6">
        <div className="flex flex-wrap justify-center gap-12 rounded-3xl border border-border p-8">
          <Esqueleto className="h-[440px] w-[340px] rounded-[36px]" />
          <Esqueleto className="h-[440px] w-[340px] rounded-[36px] max-md:hidden" />
        </div>
        <Esqueleto className="h-48 rounded-xl" />
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={PackageCheck}
        titulo="Sem pedidos nesta semana"
        texto="Os destaques aparecem quando houver pelo menos um dia completo de vendas."
        acao={<Botao variante="secundario"><Plus /> Lançar pedido manual</Botao>}
        className="py-20"
      />
    )
  return (
    <div className="space-y-6">
      <FaixaDestaque />
      <section aria-labelledby="novidades-titulo" className={cn("rounded-xl border border-border bg-card", entrada)} style={atraso(2)}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="novidades-titulo" className="text-base font-semibold">O que explica os números</h2>
          <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            Ver relatório <ArrowRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
        <ul className="divide-y divide-border">
          {NOVIDADES.map((n) => (
            <li key={n.titulo} className="flex items-start gap-4 px-5 py-4">
              <n.icone className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{n.titulo}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function TemplateDestaqueKpi() {
  return (
    <ProvedorEstado>
      <MolduraOperador
        ativo="visao-geral"
        titulo="Visão geral da semana"
        descricao="10 a 16 de novembro · todas as lojas"
        acoes={
          <>
            <Botao variante="secundario"><CalendarDays /> Mudar semana</Botao>
            <Botao><Megaphone /> Nova campanha</Botao>
          </>
        }
      >
        <Conteudo />
      </MolduraOperador>
    </ProvedorEstado>
  )
}
