/**
 * TEMPLATE: Visão financeira em bento (reconstrução idiomática dos padrões do finance-bento).
 * Para que serve: visão geral com personalidade para o cliente (carteira, investimentos, metas): cada card tem um papel
 * e um material (gradiente com núcleo escuro, vidro, sólido na cor de destaque) e gráficos-assinatura simples.
 * Quando usar: app ou portal do cliente, tela "minha visão geral", resumo pessoal mensal.
 * Quando não usar: painel denso do operador; telas com muitas tabelas; como cópia do finance-bento original
 * (ele monta HTML por string; aqui é React com tokens).
 * Depende de: lucide-react, templates/_base. Não usa o arquivo finance-bento.tsx: reproduz as decisões dele em React.
 * Ao adaptar: as cores dos cards saem de --chart-1..5 por color-mix (topo claro, base saturada, núcleo escuro
 * desfocado); a cor de destaque única é --chart-4; troque os dados em PATRIMONIO, ALOCACAO, PAGAMENTOS e METAS.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { ArrowUpRight, CalendarClock, Download, Plus, Target, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { brl, brlCompacto, brlInteiro } from "../_base/formato"
import { useMovimentoReduzido } from "../_base/tema"

/* ---------- dados fictícios ---------- */
const MESES = ["dez", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov"]
const PATRIMONIO = MESES.map((m, i) => ({
  mes: m,
  caixa: 17_000 + i * 300 + Math.sin(i * 0.9) * 700,
  acoes: 18_000 + i * 900 + Math.sin(i * 0.55) * 1_400,
  cripto: Math.max(2_500, 7_000 + i * 450 + Math.sin(i * 0.8 + 1) * 2_400),
}))
const total = (p: (typeof PATRIMONIO)[number]) => p.caixa + p.acoes + p.cripto
const ATUAL = total(PATRIMONIO[PATRIMONIO.length - 1])
const INICIO = total(PATRIMONIO[0])
const ALOCACAO = [
  { nome: "Ações", valor: 32_206, cor: "var(--chart-1)" },
  { nome: "Cripto", valor: 14_613, cor: "var(--chart-5)" },
  { nome: "Caixa", valor: 21_076, cor: "var(--foreground)" },
]
const INVESTIDO = (ALOCACAO[0].valor + ALOCACAO[1].valor) / ALOCACAO.reduce((s, a) => s + a.valor, 0)
const PAGAMENTOS = [
  { nome: "Aluguel", data: "1 dez", valor: 2_400 },
  { nome: "Aporte automático", data: "3 dez", valor: 500 },
  { nome: "Plano de saúde", data: "9 dez", valor: 612 },
]
const METAS = [
  { nome: "Entrada do apartamento", progresso: 0.42, alvo: 80_000 },
  { nome: "Viagem para o Nordeste", progresso: 0.76, alvo: 9_000 },
]
const FLUXO = { meses: ["jun", "jul", "ago", "set", "out", "nov"], entra: [7.2, 7.4, 8.1, 7.9, 8.6, 9.4], sai: [5.9, 6.4, 6.1, 6.8, 6.2, 6.5] }

/* ---------- materiais (padrões do finance-bento, em tokens) ---------- */
function gradiente(token: string): CSSProperties {
  return {
    background: `linear-gradient(180deg, color-mix(in oklch, var(${token}) 55%, white) 0%, var(${token}) 36%, var(${token}) 74%, color-mix(in oklch, var(${token}) 75%, white) 100%)`,
  }
}
const borda = "shadow-[inset_0_1px_0_rgba(255,255,255,.22),inset_0_0_0_1px_rgba(255,255,255,.06)]"

function Card({ material, token, className, children, i, rotulo }: { material: "gradiente" | "vidro" | "solido"; token?: string; className?: string; children: ReactNode; i: number; rotulo: string }) {
  return (
    <section
      aria-label={rotulo}
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] p-6",
        material === "gradiente" && cn("text-white", borda),
        material === "vidro" && "border border-border bg-card/70 text-card-foreground backdrop-blur-xl",
        material === "solido" && "bg-chart-4 text-black shadow-[inset_0_1px_0_rgba(255,255,255,.5)]",
        entrada,
        className,
      )}
      style={{ ...(material === "gradiente" && token ? gradiente(token) : {}), ...atraso(i) }}
    >
      {material === "gradiente" && token && (
        <div aria-hidden="true" className="absolute inset-x-[10%] top-[16%] -bottom-[6%] -z-10 rounded-[90px] blur-[60px]" style={{ background: `color-mix(in oklch, var(${token}) 22%, black)` }} />
      )}
      {children}
    </section>
  )
}

function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11.5px] font-semibold tracking-[.06em] uppercase opacity-70", className)}>{children}</p>
}

/** Número que conta até o valor (900 ms, saída cúbica); vai direto ao fim com movimento reduzido. */
function useContagem(alvo: number, duracao = 900) {
  const reduzido = useMovimentoReduzido()
  const [v, setV] = useState(reduzido ? alvo : 0)
  const de = useRef(0)
  useEffect(() => {
    if (reduzido) return setV(alvo)
    const ini = performance.now()
    const origem = de.current
    let raf = 0
    const passo = (t: number) => {
      const k = Math.min(1, (t - ini) / duracao)
      const atual = origem + (alvo - origem) * (1 - Math.pow(1 - k, 3))
      setV(atual)
      if (k < 1) raf = requestAnimationFrame(passo)
      else de.current = alvo
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [alvo, duracao, reduzido])
  return v
}

/* ---------- gráficos-assinatura, simples ---------- */
function Faixas() {
  const W = 600
  const H = 170
  const max = Math.max(...PATRIMONIO.map(total)) * 1.05
  const x = (i: number) => (i / (PATRIMONIO.length - 1)) * W
  const camada = (f: (p: (typeof PATRIMONIO)[number]) => number) =>
    PATRIMONIO.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${(H - (f(p) / max) * H).toFixed(1)}`).join(" ") + ` L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[55%] w-full" role="img" aria-label={`Patrimônio de ${brlInteiro(INICIO)} em dezembro para ${brlInteiro(ATUAL)} em novembro`}>
      <path d={camada((p) => p.caixa + p.acoes + p.cripto)} fill="var(--chart-5)" opacity={0.85} />
      <path d={camada((p) => p.caixa + p.acoes)} fill="color-mix(in oklch, var(--chart-1) 45%, white)" opacity={0.9} />
      <path d={camada((p) => p.caixa)} fill="white" opacity={0.95} />
    </svg>
  )
}

function Medidor({ fracao }: { fracao: number }) {
  const n = 41
  return (
    <svg viewBox="-110 -110 220 120" className="mx-auto w-full max-w-[260px]" role="img" aria-label={`${Math.round(fracao * 100)}% investido`}>
      {Array.from({ length: n }, (_, i) => {
        const a = Math.PI + (i / (n - 1)) * Math.PI
        const on = i / (n - 1) <= fracao
        return (
          <line
            key={i}
            x1={Math.cos(a) * 78}
            y1={Math.sin(a) * 78}
            x2={Math.cos(a) * 100}
            y2={Math.sin(a) * 100}
            stroke={on ? (i / (n - 1) < fracao * 0.68 ? "var(--chart-1)" : "var(--chart-5)") : "rgba(255,255,255,.28)"}
            strokeWidth={3.2}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

function Regua({ fracao, rotulo }: { fracao: number; rotulo: string }) {
  const n = 36
  return (
    <div className="flex h-3.5 items-end gap-[3px]" role="img" aria-label={rotulo}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn("w-[2px] rounded-full", i / n < fracao ? "h-full bg-chart-4" : "h-2/3 bg-foreground/20")} />
      ))}
    </div>
  )
}

function Capsulas() {
  const max = Math.max(...FLUXO.entra)
  return (
    <div className="mt-5 flex h-36 items-end justify-between gap-3" role="img" aria-label={`Entradas e saídas de junho a novembro; em novembro entraram ${brlCompacto(FLUXO.entra[5] * 1000)} e saíram ${brlCompacto(FLUXO.sai[5] * 1000)}`}>
      {FLUXO.meses.map((m, i) => (
        <div key={m} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end justify-center gap-1">
            <span className="w-full max-w-4 rounded-full bg-white/95" style={{ height: `${(FLUXO.entra[i] / max) * 100}%` }} />
            <span className="w-full max-w-4 rounded-full bg-white/35" style={{ height: `${(FLUXO.sai[i] / max) * 100}%` }} />
          </div>
          <span className="font-mono text-[11px] text-white/75">{m}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- tela ---------- */
function Bento() {
  const patrimonio = useContagem(ATUAL)
  const caixa = useContagem(8_852)
  const crescimento = ATUAL / INICIO - 1
  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-6 xl:grid-cols-12">
      <Card material="gradiente" token="--chart-1" i={0} rotulo="Patrimônio" className="min-h-[360px] md:col-span-6 xl:col-span-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-.02em]">Patrimônio</h2>
          <ul className="flex gap-4 text-xs font-medium text-white/80">
            <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-white" />Caixa</li>
            <li className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-1) 45%, white)" }} />Ações</li>
            <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-chart-5" />Cripto</li>
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
          <p className="text-5xl leading-none font-extralight tracking-[-.04em] tabular-nums sm:text-6xl">{brlInteiro(patrimonio)}</p>
          <p className="pb-1 font-mono text-[12.5px] font-semibold">
            <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-chart-4">↑ {(crescimento * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>{" "}
            <span className="text-white/70">+{brlInteiro(ATUAL - INICIO)} em 12 meses</span>
          </p>
        </div>
        <Faixas />
      </Card>

      <Card material="gradiente" token="--chart-3" i={1} rotulo="Alocação" className="md:col-span-6 xl:col-span-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-[-.02em]">Alocação</h2>
          <span className="rounded-full bg-black/80 px-2.5 py-1 font-mono text-[11px] font-semibold">Alvo 60/40</span>
        </div>
        <div className="relative mt-4">
          <Medidor fracao={INVESTIDO} />
          <p className="absolute inset-x-0 bottom-1 text-center">
            <span className="text-5xl font-extralight tracking-[-.04em] tabular-nums">{Math.round(INVESTIDO * 100)}</span>
            <span className="align-top text-lg font-light">%</span>
            <span className="block text-xs text-white/75">investido</span>
          </p>
        </div>
        <ul className="mt-4 divide-y divide-white/15 text-sm">
          {ALOCACAO.map((a) => (
            <li key={a.nome} className="flex items-center gap-2 py-2">
              <i className="size-2 rounded-full" style={{ background: a.cor === "var(--foreground)" ? "white" : a.cor }} />
              <span className="flex-1 font-medium">{a.nome}</span>
              <span className="font-mono text-white/70 tabular-nums">{brlInteiro(a.valor)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card material="solido" i={2} rotulo="Rendimento" className="md:col-span-3">
        <div className="flex items-center justify-between">
          <Rotulo>Rendimento</Rotulo>
          <span className="rounded-full bg-black/85 px-2.5 py-1 font-mono text-[11px] font-semibold text-white">+{brlCompacto(6_100)}</span>
        </div>
        <p className="mt-6 flex items-baseline gap-2 text-5xl font-extralight tracking-[-.04em] tabular-nums">
          <ArrowUpRight className="size-8 stroke-[1.5]" aria-hidden="true" />14,9%
        </p>
        <p className="mt-2 text-xs font-medium text-black/60">Ações + cripto · últimos 12 meses</p>
      </Card>

      <Card material="vidro" i={3} rotulo="Caixa livre" className="md:col-span-3">
        <div className="flex items-center justify-between">
          <Rotulo>Caixa livre</Rotulo>
          <span className="text-xs text-muted-foreground">Fôlego</span>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-4xl font-extralight tracking-[-.04em] tabular-nums">{brlInteiro(caixa)}</p>
          <p className="font-mono text-lg font-semibold">4,2 <span className="text-xs text-muted-foreground">meses</span></p>
        </div>
        <div className="mt-5"><Regua fracao={4.2 / 6} rotulo="4,2 de 6 meses de reserva" /></div>
      </Card>

      <Card material="vidro" i={4} rotulo="Próximos pagamentos" className="md:col-span-3">
        <div className="flex items-center justify-between">
          <Rotulo>Próximos pagamentos</Rotulo>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{brlInteiro(PAGAMENTOS.reduce((s, p) => s + p.valor, 0))}</span>
        </div>
        <ul className="mt-3 space-y-2.5 text-sm">
          {PAGAMENTOS.map((p) => (
            <li key={p.nome} className="flex items-center gap-3">
              <span className="grid size-6 place-items-center rounded-md bg-foreground/10 font-mono text-[11px] font-semibold">{p.nome[0]}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{p.nome}</span>
              <span className="font-mono text-xs text-muted-foreground">{p.data}</span>
              <span className="w-16 text-right font-mono tabular-nums">{brlInteiro(p.valor)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card material="vidro" i={5} rotulo="Metas" className="md:col-span-3">
        <div className="flex items-center justify-between">
          <Rotulo>Metas</Rotulo>
          <span className="text-xs text-muted-foreground">{METAS.length} ativas</span>
        </div>
        <ul className="mt-3 space-y-4">
          {METAS.map((m) => (
            <li key={m.nome}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{m.nome}</span>
                <span className="shrink-0 font-mono text-xs"><b className="font-semibold">{Math.round(m.progresso * 100)}%</b> <span className="text-muted-foreground">de {brlCompacto(m.alvo)}</span></span>
              </div>
              <Regua fracao={m.progresso} rotulo={`${Math.round(m.progresso * 100)}% de ${brlInteiro(m.alvo)}`} />
            </li>
          ))}
        </ul>
      </Card>

      <Card material="gradiente" token="--chart-5" i={6} rotulo="Fluxo de caixa" className="md:col-span-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-[-.02em]">Fluxo de caixa</h2>
            <p className="text-xs text-white/75">Sobra média de <b className="rounded-md bg-black/75 px-1 font-mono text-chart-4">{brlInteiro(1_780)}</b> por mês</p>
          </div>
          <ul className="space-y-1 text-xs text-white/80">
            <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-white" />Entradas</li>
            <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-white/35" />Saídas</li>
          </ul>
        </div>
        <Capsulas />
      </Card>

      <Card material="gradiente" token="--chart-2" i={7} rotulo="Ações" className="md:col-span-6">
        <h2 className="text-lg font-semibold tracking-[-.02em]">Ações</h2>
        <p className="mt-3 text-4xl font-extralight tracking-[-.04em] tabular-nums">{brl(32_206)}</p>
        <p className="mt-1 font-mono text-[12.5px] font-semibold"><span className="rounded-md bg-black/75 px-1.5 py-0.5 text-chart-4">↑ 1,8%</span> <span className="text-white/75">nesta semana</span></p>
        <div className="mt-5 flex h-24 items-end gap-3" role="img" aria-label="Variação diária de segunda a sexta, maior na sexta">
          {[2.1, 1.2, 3.4, 1.9, 4.6].map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="w-full max-w-10 rounded-full bg-white/85" style={{ height: `${(v / 4.6) * 80}px` }} />
              <span className="font-mono text-[11px] text-white/75">{["seg", "ter", "qua", "qui", "sex"][i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Conteudo() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando rotulo="Carregando sua visão geral" className="grid grid-cols-1 gap-3.5 md:grid-cols-6 xl:grid-cols-12">
        <Esqueleto className="h-[360px] rounded-[28px] md:col-span-6 xl:col-span-8" />
        <Esqueleto className="h-[360px] rounded-[28px] md:col-span-6 xl:col-span-4" />
        {[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-[170px] rounded-[28px] md:col-span-3" />)}
        <Esqueleto className="h-[260px] rounded-[28px] md:col-span-6" />
        <Esqueleto className="h-[260px] rounded-[28px] md:col-span-6" />
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={Wallet}
        titulo="Conecte sua primeira conta"
        texto="Sua visão geral aparece quando houver pelo menos uma conta ou investimento ligado. Nada é movimentado sem sua autorização."
        acao={<button type="button" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Plus className="size-4" /> Conectar conta</button>}
        className="py-24"
      />
    )
  return <Bento />
}

function Tela() {
  const [periodo, setPeriodo] = useState("1A")
  return (
    <div className="min-h-dvh w-full bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1320px]">
        <header className={cn("mb-5 flex flex-wrap items-center gap-3", entrada)}>
          <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
            <h1 className="text-[28px] font-bold tracking-[-.03em]">Visão geral</h1>
            <p className="text-sm text-muted-foreground">Atualizado hoje, 09:41</p>
          </div>
          <div role="group" aria-label="Período" className="flex gap-0.5 rounded-[14px] border border-border bg-muted/60 p-[3px]">
            {["1M", "3M", "1A", "Tudo"].map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={periodo === p}
                onClick={() => setPeriodo(p)}
                className="h-7 min-w-11 rounded-[11px] px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chart-4 aria-pressed:bg-foreground aria-pressed:text-background"
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
            <Download className="size-4" aria-hidden="true" /> Extrato
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Target className="size-4" aria-hidden="true" /> Nova meta
          </button>
          <span role="img" aria-label="Perfil de Camila Duarte" className="grid size-10 place-items-center rounded-full bg-muted text-sm font-semibold ring-2 ring-border">CD</span>
        </header>
        <Conteudo />
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden="true" /> Valores fictícios para protótipo.</p>
      </div>
    </div>
  )
}

export default function TemplateVisaoFinanceira() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
