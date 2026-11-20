/**
 * TEMPLATE: Resumo do dia com indicador-herói navegável (base: market-card).
 * Para que serve: abrir o dia com um número só (faturamento acumulado), que a pessoa percorre hora a hora
 * arrastando, clicando ou com as setas; abaixo, o que explica o número (canais, horários, pendências).
 * Quando usar: topo da visão geral do gerente, tela de "como foi hoje", app do cliente ("seu saldo no mês").
 * Quando não usar: grade com vários KPIs (o card precisa de ~500px de largura); tema claro sem testar o brilho;
 * telas de uso contínuo onde a animação de entrada se repetiria a cada visita.
 * Depende de: ./marcador-ptbr (market-card traduzido), lucide-react, templates/_base (useCoresDoTema).
 * Ao adaptar: troque HORAS/VALORES e o formato (curto: o número ocupa metade do card; "64 mil" cabe, "R$ 63,8 mil" não).
 * Cores vêm de --card, --foreground, --chart-1, --sucesso e --destructive lidas do tema ESCURO nos dois temas,
 * porque o brilho foi desenhado para card escuro.
 */
import { useState } from "react"
import { Bike, Clock, Download, MessageCircle, Smartphone, Store, Sunrise } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { HOJE, brl, dataLonga } from "../_base/formato"
import { useCoresDoTema } from "../_base/tema"
import { MarketCard } from "./marcador-ptbr"

// Faturamento acumulado (R$ mil) das 7h às 21h; o primeiro e o último são entrada e saída da curva.
const HORAS = ["6h", "7h", "8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h"]
const VALORES = [2.1, 4.8, 9.6, 14.2, 18.9, 22.4, 29.8, 36.1, 39.4, 41.2, 44.0, 49.7, 57.3, 63.8, 66.1, 64.0]

const CANAIS = [
  { nome: "Loja física", icone: Store, valor: 41_820, fracao: 0.63 },
  { nome: "App Ipê Clube", icone: Smartphone, valor: 15_210, fracao: 0.23 },
  { nome: "WhatsApp", icone: MessageCircle, valor: 9_070, fracao: 0.14 },
]
const PENDENCIAS = [
  { icone: Bike, texto: "6 entregas saem às 18h30", detalhe: "Rota Savassi–Funcionários" },
  { icone: Clock, texto: "Fechamento do caixa 2 às 21h", detalhe: "Responsável: Diego" },
  { icone: Sunrise, texto: "Recebimento de hortifrúti amanhã às 6h", detalhe: "Fornecedor Ceasa Minas" },
]

function Heroi() {
  const [i, setI] = useState(13)
  const cores = useCoresDoTema({ card: "--card", texto: "--foreground", destaque: "--chart-1", alta: "--sucesso", queda: "--destructive" }, { escuro: true })
  return (
    <section aria-labelledby="heroi-titulo" className={entrada}>
      <h2 id="heroi-titulo" className="sr-only">Faturamento acumulado de hoje</h2>
      <div className="h-[220px] rounded-[28px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background sm:h-[300px] lg:h-[340px]">
        <MarketCard
          data={VALORES}
          index={i}
          onIndexChange={setI}
          format={(v) => Math.round(v) + " mil"}
          label="Faturamento hoje, em R$"
          deltaLabel={`na hora das ${HORAS[i]}.`}
          accent={cores.destaque}
          cardColor={cores.card}
          textColor={cores.texto}
          lineColor={cores.texto}
          upColor={cores.alta}
          downColor={cores.queda}
          background="transparent"
          grid={false}
          fill={1}
          menu={false}
          font="Geist, ui-sans-serif, system-ui, sans-serif"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Arraste sobre a linha, clique num ponto ou use as setas para ver cada hora.</p>
    </section>
  )
}

function Conteudo() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando rotulo="Carregando o resumo do dia" className="space-y-6">
        <Esqueleto className="h-[220px] rounded-[28px] sm:h-[300px] lg:h-[340px]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Esqueleto className="h-52 rounded-xl" />
          <Esqueleto className="h-52 rounded-xl" />
        </div>
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={Sunrise}
        titulo="O dia ainda não começou"
        texto="A loja abre às 7h. O faturamento aparece aqui a partir da primeira venda."
        className="py-20"
      />
    )
  return (
    <div className="space-y-6">
      <Heroi />
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="canais-titulo" className={cn("rounded-xl border border-border bg-card p-5", entrada)} style={atraso(2)}>
          <h2 id="canais-titulo" className="text-base font-semibold">Por canal</h2>
          <ul className="mt-4 space-y-4">
            {CANAIS.map((c) => (
              <li key={c.nome}>
                <div className="flex items-center gap-3 text-sm">
                  <c.icone className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{c.nome}</span>
                  <span className="font-medium tabular-nums">{brl(c.valor)}</span>
                  <span className="w-10 text-right text-muted-foreground tabular-nums">{Math.round(c.fracao * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-chart-1" style={{ width: `${c.fracao * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="pend-titulo" className={cn("rounded-xl border border-border bg-card p-5", entrada)} style={atraso(3)}>
          <h2 id="pend-titulo" className="text-base font-semibold">Ainda hoje</h2>
          <ul className="mt-3 divide-y divide-border">
            {PENDENCIAS.map((p) => (
              <li key={p.texto} className="flex items-start gap-3 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <p.icone className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">{p.texto}</p>
                  <p className="text-xs text-muted-foreground">{p.detalhe}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default function TemplateResumoDoDia() {
  return (
    <ProvedorEstado>
      <MolduraOperador
        ativo="visao-geral"
        titulo="Resumo do dia"
        descricao={`${dataLonga(HOJE)} · Loja Savassi`}
        acoes={<Botao><Download /> Fechar o dia</Botao>}
      >
        <Conteudo />
      </MolduraOperador>
    </ProvedorEstado>
  )
}
