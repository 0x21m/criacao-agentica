"use client"

import * as React from "react"
import { PeakChart } from "@/components/ui/peak-chart"

// Um segundo cartão com a própria série via props. Trocar o período troca os dados e a linha se transforma.
const USERS: Record<string, { data: number[]; labels: string[]; value: number }> = {
  Semanal: {
    data: [8.1, 8.6, 9.4, 9.1, 10.8, 12.4, 11.9],
    labels: ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
    value: 12.4,
  },
  Mensal: {
    data: [5.2, 5.6, 5.4, 6.1, 6.9, 6.6, 7.4, 8.2, 7.9, 8.8, 9.6, 9.2, 10.4, 11.8, 12.8, 12.1],
    labels: Array.from({ length: 16 }, (_, i) => `Dia ${i * 2 + 1}`),
    value: 12.8,
  },
  Anual: {
    data: [2.1, 2.4, 3.2, 3.0, 4.1, 4.8, 5.6, 6.3, 7.9, 9.4, 11.2, 12.8],
    labels: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    value: 12.8,
  },
}

// Os cartões são medidos antes da primeira pintura: lado a lado na tela larga, empilhados na alta,
// nunca mais largos que o quadro, para o brilho ficar dentro do painel.
function measure() {
  if (typeof window === "undefined") return { width: 280, tall: false }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tall = vh > vw * 1.2
  const width = tall
    ? Math.min(vw - 96, (vh - 110) / 2 / 1.289)
    : Math.min((vw - 150) / 2, (vh - 70) / 1.289, 400)
  return { width: Math.max(160, Math.round(width)), tall }
}

function useFit() {
  const [fit, setFit] = React.useState(measure)
  React.useEffect(() => {
    const update = () => setFit(measure())
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return fit
}

/**
 * Dois cartões, um componente: o de conversão no azul padrão e o de clientes ativos com cor, série,
 * rótulos, número e período próprios. Toda diferença é uma prop.
 */
export default function PeakChartDemo() {
  const { width, tall } = useFit()
  const [period, setPeriod] = React.useState("Mensal")
  const users = USERS[period]

  return (
    <main className="relative min-h-screen w-full bg-background">
      <section
        className="absolute flex items-center justify-center overflow-hidden shadow-xl"
        style={{
          inset: "clamp(10px, 2.6vmin, 26px)",
          borderRadius: "clamp(18px, 4.5vmin, 34px)",
          border: "1px solid rgba(140, 170, 230, 0.1)",
          backgroundColor: "#08101a",
          flexDirection: tall ? "column" : "row",
          gap: tall ? Math.round(width * 0.1) : Math.round(width * 0.16),
        }}
      >
        <PeakChart width={width} />
        <PeakChart
          width={width}
          accent="#2ec99a"
          data={users.data}
          labels={users.labels}
          value={users.value}
          valueSuffix=" mil"
          decimals={1}
          title="Clientes ativos no app"
          caption="Novo pico no período"
          updatedText="Ao vivo"
          period={period}
          onPeriodChange={setPeriod}
          formatValue={(v) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`}
        />
      </section>
    </main>
  )
}
