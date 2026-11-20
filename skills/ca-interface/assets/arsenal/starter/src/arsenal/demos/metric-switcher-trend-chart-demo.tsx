"use client"

import {
  MetricTrendChart,
  type MetricAnnotation,
  type MetricSeries,
} from "@/components/ui/metric-switcher-trend-chart-demo"

/* -------------------------------------------------------------------------- */
/*  Dados da demo                                                             */
/*                                                                            */
/*  Todo o conteúdo fica aqui, não no componente. Num app real, estes vetores  */
/*  vêm da API de análise; o componente só precisa dos números, do mais antigo */
/*  ao mais recente.                                                          */
/* -------------------------------------------------------------------------- */

const TIMELINE_DAYS = 180

/** Gerador pseudoaleatório determinístico: a demo sai igual a cada carga. */
function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return function next() {
    h |= 0
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tendência + sazonalidade semanal + ruído, para dados de exemplo críveis. */
function makeSeries(options: {
  seed: string
  base: number
  amplitude: number
  trendPerDay: number
  days?: number
}) {
  const { seed, base, amplitude, trendPerDay, days = TIMELINE_DAYS } = options
  const random = seededRandom(seed)
  const values: number[] = []
  let level = base
  for (let i = 0; i < days; i++) {
    level += trendPerDay
    const weekly = Math.sin((i / 7) * Math.PI * 2) * amplitude * 0.35
    const weekend = i % 7 === 5 || i % 7 === 6 ? amplitude * 0.22 : 0
    const noise = (random() - 0.5) * amplitude * 0.4
    values.push(Math.max(0, level + weekly + weekend + noise))
  }
  return values
}

/**
 * `previous[i]` é como o ponto `i` estava no período anterior, para o gráfico
 * comparar o equivalente qualquer que seja o intervalo.
 */
function withComparison(options: Parameters<typeof makeSeries>[0] & { ratio: number }) {
  const current = makeSeries(options)
  const previous = makeSeries({ ...options, seed: `${options.seed}-prev` }).map(
    (v) => v * options.ratio
  )
  return { current, previous }
}

const orders = withComparison({
  seed: "orders",
  base: 420,
  amplitude: 110,
  trendPerDay: 0.4,
  ratio: 0.92,
})
const revenue = withComparison({
  seed: "revenue",
  base: 18_000,
  amplitude: 4_800,
  trendPerDay: 35,
  ratio: 0.9,
})
const users = withComparison({
  seed: "users",
  base: 2_600,
  amplitude: 550,
  trendPerDay: 3,
  ratio: 0.95,
})
const latency = withComparison({
  seed: "latency",
  base: 240,
  amplitude: 55,
  trendPerDay: -0.15,
  ratio: 1.06,
})

const metrics: MetricSeries[] = [
  {
    id: "orders",
    label: "Pedidos",
    unit: "count",
    aggregate: "sum",
    color: "var(--color-chart-1)",
    ...orders,
  },
  {
    id: "revenue",
    label: "Faturamento",
    unit: "currency",
    currency: "BRL",
    aggregate: "sum",
    color: "var(--color-chart-2)",
    ...revenue,
  },
  {
    id: "users",
    label: "Clientes ativos",
    unit: "count",
    aggregate: "avg",
    color: "var(--color-chart-3)",
    ...users,
  },
  {
    id: "latency",
    label: "Tempo de resposta do site",
    unit: "ms",
    aggregate: "avg",
    higherIsBetter: false,
    color: "var(--color-chart-4)",
    ...latency,
  },
]

/** A linha do tempo das séries: `TIMELINE_DAYS` dias terminando hoje. */
const dates = Array.from({ length: TIMELINE_DAYS }, (_, i) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (TIMELINE_DAYS - 1 - i))
  return d
})

/** As anotações apontam para índices dessa mesma linha do tempo. */
const daysAgo = (n: number) => TIMELINE_DAYS - 1 - n

const annotations: MetricAnnotation[] = [
  { id: "flash-sale", type: "band", from: daysAgo(4), to: daysAgo(1), label: "Promoção relâmpago" },
  { id: "checkout-v2", type: "marker", at: daysAgo(8), label: "Novo checkout" },
  { id: "weekend-promo", type: "band", from: daysAgo(17), to: daysAgo(13), label: "Promoção de fim de semana" },
  { id: "search-revamp", type: "marker", at: daysAgo(28), label: "Busca reformulada" },
  { id: "spring-sale", type: "band", from: daysAgo(56), to: daysAgo(50), label: "Liquidação de setembro" },
  { id: "mobile-v3", type: "marker", at: daysAgo(75), label: "Versão 3 do app" },
]

/**
 * Controles da prévia do 21st.dev: cada chave vira um ajuste, e "Copy code"
 * grava os valores escolhidos de volta neste objeto.
 */
const settings = {
  title: "Desempenho da loja virtual",
  chartHeight: 260,
  showComparison: true,
  showAnnotations: true,
  showTable: true,
  showExport: true,
  zeroBaseline: true,
}

export default function MetricTrendChartDemo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }

  return (
    <div className="flex w-full items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <MetricTrendChart
          title={s.title}
          metrics={metrics}
          dates={dates}
          annotations={s.showAnnotations ? annotations : []}
          defaultMetricId="orders"
          defaultRangeId="30d"
          height={Math.max(140, Math.round(s.chartHeight))}
          showComparison={s.showComparison}
          showTable={s.showTable}
          showExport={s.showExport}
          yAxis={s.zeroBaseline ? "zero" : "auto"}
        />
      </div>
    </div>
  )
}
