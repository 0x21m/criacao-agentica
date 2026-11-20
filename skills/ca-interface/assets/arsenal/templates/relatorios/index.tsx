/**
 * TEMPLATE: Relatórios e análise do operador (base: metric-switcher-trend-chart-demo).
 * Para que serve: responder "como estamos indo e por quê": troca de indicador, intervalo, comparação com o
 * período anterior, eventos marcados no gráfico, tabela equivalente e exportação.
 * Quando usar: tela de relatórios, desempenho de vendas, acompanhamento de campanha.
 * Quando não usar: app do cliente final (denso e analítico); card pequeno na visão geral (use tendencias ou kpis-operador).
 * Depende de: ./grafico-tendencia-ptbr (metric-switcher traduzido), lucide-react, templates/_base.
 * Ao adaptar: troque gerarSerie() pelos dados da API (mais antigo primeiro), INDICADORES e EVENTOS;
 * as cores vêm de --chart-N; troque "BRL" se a moeda for outra.
 */
import { useState } from "react"
import { CalendarClock, FileSpreadsheet, LineChart, Plus, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { HOJE } from "../_base/formato"
import { MetricTrendChart, type MetricAnnotation, type MetricRange, type MetricSeries } from "./grafico-tendencia-ptbr"

const DIAS = 180

/** Gerador determinístico: a tela renderiza igual em todo carregamento. */
function aleatorio(semente: string) {
  let h = 0
  for (let i = 0; i < semente.length; i++) h = (Math.imul(31, h) + semente.charCodeAt(i)) | 0
  return () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function gerarSerie(semente: string, base: number, amplitude: number, tendencia: number) {
  const r = aleatorio(semente)
  let nivel = base
  return Array.from({ length: DIAS }, (_, i) => {
    nivel += tendencia
    const semana = Math.sin((i / 7) * Math.PI * 2) * amplitude * 0.35
    const fimDeSemana = i % 7 === 5 || i % 7 === 6 ? amplitude * 0.25 : 0
    return Math.max(0, nivel + semana + fimDeSemana + (r() - 0.5) * amplitude * 0.4)
  })
}
function comComparacao(semente: string, base: number, amplitude: number, tendencia: number, razao: number) {
  return { current: gerarSerie(semente, base, amplitude, tendencia), previous: gerarSerie(semente + "-ant", base, amplitude, tendencia).map((v) => v * razao) }
}

const INDICADORES: MetricSeries[] = [
  { id: "faturamento", label: "Faturamento", unit: "currency", currency: "BRL", aggregate: "sum", color: "var(--color-chart-1)", ...comComparacao("fat", 38_000, 9_000, 30, 0.91) },
  { id: "pedidos", label: "Pedidos", unit: "count", aggregate: "sum", color: "var(--color-chart-2)", ...comComparacao("ped", 520, 130, 0.4, 0.93) },
  { id: "ticket", label: "Ticket médio", unit: "currency", currency: "BRL", aggregate: "avg", color: "var(--color-chart-3)", format: (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v), ...comComparacao("tic", 72, 6, 0.03, 0.96) },
  { id: "espera", label: "Espera no caixa", unit: "count", aggregate: "avg", higherIsBetter: false, color: "var(--color-chart-4)", format: (v) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(v)} min`, ...comComparacao("esp", 6.5, 1.6, -0.004, 1.08) },
]

const DATAS = Array.from({ length: DIAS }, (_, i) => {
  const d = new Date(HOJE)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (DIAS - 1 - i))
  return d
})
const diasAtras = (n: number) => DIAS - 1 - n

const EVENTOS: MetricAnnotation[] = [
  { id: "black-friday", type: "band", from: diasAtras(4), to: diasAtras(1), label: "Esquenta Black Friday" },
  { id: "app-v2", type: "marker", at: diasAtras(9), label: "App 2.0" },
  { id: "feira", type: "band", from: diasAtras(18), to: diasAtras(14), label: "Feira de hortifrúti" },
  { id: "caixa", type: "marker", at: diasAtras(27), label: "Novo caixa rápido" },
  { id: "dia-criancas", type: "band", from: diasAtras(40), to: diasAtras(35), label: "Dia das Crianças" },
]

const INTERVALOS: MetricRange[] = [
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
]

const LOJAS = ["Todas as lojas", "Savassi", "Centro", "Pampulha", "Buritis"]

function Conteudo({ loja }: { loja: string }) {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando rotulo="Carregando o relatório" className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex justify-between gap-4">
          <Esqueleto className="h-6 w-56" />
          <Esqueleto className="h-8 w-52" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-24" />)}
        </div>
        <Esqueleto className="h-72 w-full" />
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={LineChart}
        titulo="Ainda não há dados para este relatório"
        texto={`A ${loja === "Todas as lojas" ? "rede" : `loja ${loja}`} ainda não tem vendas registradas no período. Os gráficos aparecem a partir do primeiro dia de caixa fechado.`}
        acao={<Botao variante="secundario"><Plus /> Importar vendas antigas</Botao>}
        className="py-20"
      />
    )
  return (
    <div className={entrada}>
      <MetricTrendChart
        title={`Desempenho · ${loja}`}
        metrics={INDICADORES}
        dates={DATAS}
        ranges={INTERVALOS}
        annotations={EVENTOS}
        defaultMetricId="faturamento"
        defaultRangeId="30d"
        locale="pt-BR"
        height={280}
      />
    </div>
  )
}

function Tela() {
  const [loja, setLoja] = useState(LOJAS[0])
  return (
    <MolduraOperador
      ativo="relatorios"
      titulo="Relatórios"
      descricao="Vendas e operação, com comparação ao período anterior"
      acoes={
        <>
          <Botao variante="secundario"><CalendarClock /> Agendar envio</Botao>
          <Botao><FileSpreadsheet /> Novo relatório</Botao>
        </>
      }
    >
      <div className={cn("mb-4 flex flex-wrap items-center gap-2", entrada)} style={atraso(1)}>
        <label htmlFor="loja" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="size-4" aria-hidden="true" /> Loja
        </label>
        <select
          id="loja"
          value={loja}
          onChange={(e) => setLoja(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        >
          {LOJAS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <Conteudo loja={loja} />
    </MolduraOperador>
  )
}

export default function TemplateRelatorios() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
