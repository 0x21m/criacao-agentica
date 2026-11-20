/**
 * TEMPLATE: Painel do cliente em vidro sobre foto (base: adjustable-glass-dashboard).
 * Para que serve: "minha conta" do cliente com personalidade: saldo, fluxo de caixa, movimentação e metas em camadas
 * de vidro sobre uma foto quente, com dock no celular e ajuste do vidro ao vivo.
 * Quando usar: app ou portal do cliente (carteira, conta do clube, assinatura); telas pessoais de consulta.
 * Quando não usar: painel do operador de uso intenso (o vidro cansa e o contraste muda com a foto); telas com tabela
 * longa; sem uma foto de fundo de qualidade (o vidro vira cinza sujo).
 * Depende de: ./glass-workspace-ptbr (adjustable-glass-dashboard traduzido), gsap, @gsap/react, lucide-react, templates/_base.
 * Ao adaptar: troque FOTO (Unsplash, licença livre; prefira imagem própria em produção), os dados e a moeda.
 * As cores vêm do tema (useHostTheme). Os estados vazios internos do componente aparecem com dados vazios.
 */
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Carregando, Esqueleto } from "../_base/esqueleto"
import GlassWorkspace, { type WorkspaceCashFlowPeriod, type WorkspaceGoal, type WorkspaceTransaction } from "./glass-workspace-ptbr"

/** Sala de estar em luz quente. Foto de Unsplash (licença Unsplash). */
const FOTO = "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1920&q=70"

const MOVIMENTACAO: WorkspaceTransaction[] = [
  { id: "1", name: "Cashback do clube", category: "Entrada", date: "Hoje", amount: 48.6, status: "Completed" },
  { id: "2", name: "Padaria da Loja Savassi", category: "Alimentação", date: "Hoje", amount: -23.4, status: "Completed" },
  { id: "3", name: "Compra do mês", category: "Compras", date: "Ontem", amount: -612.8, status: "Completed" },
  { id: "4", name: "Passagem para Ouro Preto", category: "Viagem", date: "3 nov", amount: -184.0, status: "Pending" },
  { id: "5", name: "Salário", category: "Entrada", date: "1 nov", amount: 6200, status: "Completed" },
]

const METAS: WorkspaceGoal[] = [
  { id: "m1", name: "Reserva de emergência", saved: 8400, target: 12000 },
  { id: "m2", name: "Viagem de fim de ano", saved: 2350, target: 5000 },
]

function pontos(rotulos: string[], base: number, ritmo: number): WorkspaceCashFlowPeriod["points"] {
  return rotulos.map((label, i) => ({
    label,
    income: Math.round(base * (0.55 + 0.05 * i + Math.sin(i * 1.3) * 0.12)),
    expenses: Math.round(base * ritmo * (0.4 + Math.cos(i * 0.9) * 0.1)),
  }))
}

const FLUXO: WorkspaceCashFlowPeriod[] = [
  { id: "semana", label: "Semana", points: pontos(["seg", "ter", "qua", "qui", "sex", "sáb", "dom"], 420, 0.8) },
  { id: "mes", label: "Mês", points: pontos(["1 nov", "6 nov", "11 nov", "16 nov", "21 nov", "26 nov", "30 nov"], 1600, 0.7) },
  { id: "ano", label: "Ano", points: pontos(["jan", "mar", "mai", "jul", "set", "nov"], 6200, 0.75) },
]

function EsqueletoPainel() {
  return (
    <Carregando rotulo="Carregando sua conta" className="relative min-h-dvh w-full overflow-hidden bg-muted">
      <div className="mx-auto max-w-[1280px] space-y-5 p-4 sm:p-8">
        <Esqueleto className="h-[62px] rounded-[20px] bg-background/60" />
        <div className="grid gap-5 rounded-[30px] bg-background/40 p-5 sm:p-8 lg:grid-cols-[1fr_2fr]">
          <Esqueleto className="col-span-full h-10 w-48 bg-background/70" />
          <Esqueleto className="h-[300px] rounded-[22px] bg-background/70" />
          <Esqueleto className="h-[300px] rounded-[22px] bg-background/70" />
          <Esqueleto className="h-[260px] rounded-[22px] bg-background/70" />
          <Esqueleto className="h-[260px] rounded-[22px] bg-background/70" />
        </div>
      </div>
    </Carregando>
  )
}

function Tela() {
  const estado = useEstadoTela()
  if (estado === "carregando") return <EsqueletoPainel />
  const vazio = estado === "vazio"
  return (
    <div className={cn("min-h-dvh w-full")}>
      <GlassWorkspace
        brand="Ipê Clube"
        userName="Camila"
        backgroundImage={FOTO}
        balance={vazio ? 0 : 12_480.35}
        balanceChange={vazio ? undefined : { percent: 6.4, label: "em relação ao mês passado" }}
        account={{ name: "Conta do clube", lastFour: "4829" }}
        periodLabel="Novembro de 2026"
        cashFlowPeriods={vazio ? [] : FLUXO}
        initialPeriodId="mes"
        footerNote="Valores fictícios para protótipo"
        savingsNote="O progresso considera só as metas que você criou no app."
        transactions={vazio ? [] : MOVIMENTACAO}
        goals={vazio ? [] : METAS}
        currency="BRL"
        useHostTheme
        glass={{ blur: 22, opacity: 0.3, saturation: 1.2, edge: 0.6, tint: "#eadbc7" }}
      />
    </div>
  )
}

export default function TemplatePainelClienteVidro() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
