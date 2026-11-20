// Relatórios · ?aba=servicos: o que mais vende. Um card por serviço no desenho do market-snapshot do arsenal
// (src/components/ui/market-snapshot, versão com props em templates/tendencias/card-tendencia): rótulo pequeno, valor
// em destaque com a variação ao lado, linha fina que se desenha, grade tracejada leve e a dica que percorre os pontos
// com ponteiro e setas. Adaptado: o card é a Superficie; a série é a do período escolhido na barra (a troca de período
// do card saiu, ela já está nos filtros); cor só de token; vazio escrito ("Sem dados de Montagem em Contagem…").
// Embaixo, a venda da loja por categoria como lista de medidores (nome, barra e número por linha).
import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowDown, ArrowUp, CalendarRange } from "lucide-react"
import { Superficie } from "@/components/sistema/Superficie"
import { Button } from "@/components/ui/button"
import { CATEGORIAS } from "@/modulos/estoque/dados"
import { moeda, numero, percentual } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { baldes, porCategoria, porServico, porSemana, textoJanela, type Fontes, type FiltroUnidade, type Janela, type LinhaServico } from "../calculos"
import { nomeUnidade } from "./comum"

/** Nome curto para a frase de vazio. */
const CURTO: Record<string, string> = {
  "limpeza-split": "Limpeza de split", "instalacao-split": "Instalação até 12.000 BTU", "instalacao-split-grande": "Instalação de 18.000 a 30.000 BTU",
  "conserto-ar": "Conserto de ar", eletrica: "Serviço elétrico", montagem: "Montagem",
}
const W = 320
const H = 96

export function Servicos({ fontes, janela, unidade, agora, atualizando, mudarPeriodo }: {
  fontes: Fontes; janela: Janela; unidade: FiltroUnidade; agora: Date; atualizando: boolean; mudarPeriodo: () => void
}) {
  const servicos = useMemo(() => porServico(fontes, janela, unidade, agora), [fontes, janela, unidade, agora])
  const categorias = useMemo(() => porCategoria(fontes, janela, unidade, CATEGORIAS), [fontes, janela, unidade])
  const datas = useMemo(() => baldes(janela), [janela])
  const totalServicos = servicos.reduce((s, x) => s + x.valor, 0)
  const totalVendas = categorias.reduce((s, x) => s + x.valor, 0)
  const onde = unidade === "todas" ? "nas duas unidades" : `em ${nomeUnidade(unidade)}`
  const zerados = servicos.filter((s) => s.qtd === 0)
  return (
    <div className={cn("grid min-w-0 gap-4 transition-opacity duration-200", atualizando && "opacity-55")} aria-busy={atualizando || undefined}>
      <section aria-labelledby="rel-serv" className="grid gap-3">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
          <h2 id="rel-serv" className="t-card">Serviços concluídos {onde}</h2>
          <p className="text-xs text-muted-foreground"><span className="num font-medium text-foreground">{moeda(totalServicos)}</span> em <span className="num">{textoJanela(janela)}</span></p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {servicos.filter((s) => s.qtd > 0).map((s) => <CardServico key={s.slug} s={s} datas={datas.map((b) => b.de)} semanal={porSemana(janela)} />)}
          {zerados.length > 0 && (
            // os serviços sem nenhuma OS no período juntos num card só: zero é "0", escrito, e não seis cards vazios
            <Superficie como="article" aria-labelledby="rel-zerados" className="flex h-full min-w-0 flex-col gap-3 p-4">
              <h3 id="rel-zerados" className="t-rotulo">Sem OS concluída {onde} neste período</h3>
              <ul className="grid gap-1.5 text-sm">
                {zerados.map((s) => (
                  <li key={s.slug} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-pretty" title={s.nome}>Sem dados de {CURTO[s.slug] ?? s.nome}</span>
                    <span className="num shrink-0 text-muted-foreground">0 OS · 0 %</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-auto h-10 self-start" onPress={mudarPeriodo}><CalendarRange /> Mudar período</Button>
            </Superficie>
          )}
        </div>
      </section>

      <Superficie como="section" aria-labelledby="rel-cat" className="grid gap-3 p-4 md:p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="rel-cat" className="t-card">Loja: vendas por categoria</h2>
          <p className="text-xs text-muted-foreground"><span className="num font-medium text-foreground">{moeda(totalVendas)}</span> {onde}</p>
        </header>
        <ul className="grid gap-3">
          {categorias.map((c) => (
            <li key={c.categoria} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 md:grid-cols-[12rem_minmax(0,1fr)_14rem]">
              <span className="truncate text-sm" title={c.categoria}>{c.categoria}</span>
              <span className="num text-right text-sm md:order-3">
                <span className="font-medium">{moeda(c.valor)}</span> <span className="text-muted-foreground">· {percentual(c.participacao)} · {numero(c.qtd)} un.</span>
              </span>
              <span role="meter" aria-label={`${c.categoria}: ${percentual(c.participacao)} das vendas`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(c.participacao * 100)}
                className="col-span-2 h-2 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--chart-1)_14%,transparent)] md:order-2 md:col-span-1">
                <span className="block h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${c.participacao * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-pretty text-muted-foreground">Saídas por venda no estoque, pelo preço de venda de cada produto.</p>
      </Superficie>
    </div>
  )
}

function CardServico({ s, datas, semanal }: { s: LinhaServico; datas: Date[]; semanal: boolean }) {
  const reduzido = useReducedMotion()
  const uid = useId().replace(/:/g, "")
  const [foco, setFoco] = useState<number | null>(null)
  // acumulado no período: com poucas OS por dia, a série diária vira picos soltos; a soma corrida mostra o ritmo
  const acum = s.valores.reduce<number[]>((a, v) => [...a, (a.at(-1) ?? 0) + v], [])
  const n = acum.length
  const max = Math.max(...acum, 1)
  const x = (i: number) => 6 + (n > 1 ? i / (n - 1) : 0.5) * (W - 12)
  const y = (v: number) => 6 + (1 - v / max) * (H - 14)
  const d = acum.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const ativo = foco ?? n - 1
  const dataDe = (i: number) => "até " + (semanal ? "a semana de " : "") + datas[i]?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  const delta = s.anterior && s.valor !== s.anterior ? (s.valor - s.anterior) / s.anterior : null

  const mover = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setFoco(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))))
  }
  const tecla = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    setFoco((f) => Math.max(0, Math.min(n - 1, (f ?? n - 1) + (e.key === "ArrowRight" ? 1 : -1))))
  }

  return (
    <Superficie como="article" aria-labelledby={`sv-${uid}`} className="flex h-full min-w-0 flex-col gap-2 p-4">
      <header className="flex items-start justify-between gap-3">
        <h3 id={`sv-${uid}`} className="t-rotulo min-w-0 text-pretty">{s.nome}</h3>
        <span className="num shrink-0 text-xs text-muted-foreground">{numero(s.qtd)} OS</span>
      </header>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="t-kpi num text-[1.375rem]">{moeda(s.valor)}</span>
        {delta !== null && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold num", delta >= 0 ? "text-positive" : "text-negativo-texto")}>
            {delta >= 0 ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />}
            {percentual(Math.abs(delta))}<span className="sr-only">{delta >= 0 ? " de alta" : " de queda"} sobre o período anterior</span>
          </span>
        )}
      </div>
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            role="img" tabIndex={0} aria-label={`${s.nome}, acumulado: ${moeda(acum[ativo] ?? 0)} ${dataDe(ativo)}. Use as setas para percorrer o período.`}
            onPointerMove={mover} onPointerLeave={() => setFoco(null)} onKeyDown={tecla} onBlur={() => setFoco(null)}>
            {[0.33, 0.66].map((f) => <line key={f} x1="6" x2={W - 6} y1={6 + f * (H - 14)} y2={6 + f * (H - 14)} stroke="var(--border)" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />)}
            <motion.path d={d} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
              initial={false} animate={{ pathLength: 1 }} transition={{ duration: reduzido ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }} />
            {foco !== null && (
              <>
                <line x1={x(ativo)} x2={x(ativo)} y1="6" y2={H - 6} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
                <circle cx={x(ativo)} cy={y(acum[ativo])} r="3.5" fill="var(--chart-1)" stroke="var(--card)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </>
            )}
          </svg>
          {foco !== null && (
            <div aria-hidden="true" data-nivel="flutuante" className="sup pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap"
              style={{ left: `${(x(ativo) / W) * 100}%` }}>
              <span className="text-muted-foreground">{dataDe(ativo)}</span> · <span className="num font-medium">{moeda(acum[ativo])}</span>
            </div>
          )}
        </div>
      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--anel-cartao)] pt-2 text-xs text-muted-foreground">
        <span><span className="num">{percentual(s.participacao)}</span> dos serviços</span>
        <span className="num">antes: {moeda(s.anterior)}</span>
      </footer>
    </Superficie>
  )
}
