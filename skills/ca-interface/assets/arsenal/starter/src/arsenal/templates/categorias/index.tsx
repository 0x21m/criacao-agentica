/**
 * TEMPLATE: Vendas por categoria, com resumo lateral (base: stats-card-2).
 * Para que serve: tabela de trabalho no centro e, ao lado, o resumo que dá contexto (total, tendência, participação, destaques).
 * Quando usar: telas de lista do operador que precisam de um "quanto isso pesa" sempre à vista.
 * Quando não usar: como destaque principal da visão geral (o card é discreto); celular como tela principal (o resumo desce para baixo da tabela).
 * Depende de: ./card-participacao (stats-card-2 adaptado), framer-motion, lucide-react, templates/_base.
 * Ao adaptar: troque CATEGORIAS e os itens em destaque; cores da participação vêm de --chart-1..5.
 */
import { useState } from "react"
import { Apple, Croissant, CupSoda, Plus, SprayCan, Tags, Wheat } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { brl, brlCompacto, pct } from "../_base/formato"
import { CardParticipacao } from "./card-participacao"

const CATEGORIAS = [
  { nome: "Hortifrúti", icone: Apple, vendas: 312_480, margem: 0.31, variacao: 0.124, cor: "var(--chart-1)" },
  { nome: "Padaria", icone: Croissant, vendas: 204_910, margem: 0.42, variacao: 0.058, cor: "var(--chart-2)" },
  { nome: "Bebidas", icone: CupSoda, vendas: 188_300, margem: 0.24, variacao: -0.021, cor: "var(--chart-3)" },
  { nome: "Mercearia", icone: Wheat, vendas: 162_750, margem: 0.19, variacao: 0.012, cor: "var(--chart-4)" },
  { nome: "Limpeza", icone: SprayCan, vendas: 88_040, margem: 0.27, variacao: -0.047, cor: "var(--chart-5)" },
]
const TOTAL = CATEGORIAS.reduce((s, c) => s + c.vendas, 0)
const PERIODOS = ["7 dias", "30 dias", "90 dias"] as const

function Tabela() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando className="space-y-3 rounded-xl border border-border bg-card p-5">
        {Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-10 w-full" />)}
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={Tags}
        titulo="Nenhuma venda no período"
        texto="Quando houver vendas, cada categoria aparece aqui com faturamento, margem e variação."
        acao={<Botao variante="secundario"><Plus /> Cadastrar categoria</Botao>}
      />
    )
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", entrada)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Vendas por categoria nos últimos 30 dias</caption>
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium">Categoria</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Vendas</th>
              <th scope="col" className="px-3 py-3 font-medium">Participação</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Margem</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Variação</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map((c, i) => (
              <tr key={c.nome} className={cn("border-t border-border hover:bg-muted/50", entrada)} style={atraso(i)}>
                <th scope="row" className="px-5 py-3.5 text-left font-medium">
                  <span className="flex items-center gap-2.5">
                    <c.icone className="size-4 text-muted-foreground" aria-hidden="true" />
                    {c.nome}
                  </span>
                </th>
                <td className="px-3 py-3.5 text-right tabular-nums">{brl(c.vendas)}</td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full" style={{ width: `${(c.vendas / TOTAL) * 100}%`, background: c.cor }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct(c.vendas / TOTAL).replace("+", "")}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums">{pct(c.margem).replace("+", "")}</td>
                <td className={cn("px-5 py-3.5 text-right font-medium tabular-nums", c.variacao >= 0 ? "text-sucesso" : "text-destructive")}>{pct(c.variacao)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/40 font-medium">
              <th scope="row" className="px-5 py-3 text-left">Total</th>
              <td className="px-3 py-3 text-right tabular-nums">{brl(TOTAL)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function Resumo() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando className="space-y-4 rounded-xl border border-border bg-card p-6">
        <Esqueleto className="h-4 w-32" />
        <Esqueleto className="h-9 w-44" />
        <Esqueleto className="h-20 w-full" />
        <Esqueleto className="h-2 w-full" />
        <Esqueleto className="h-12 w-full" />
      </Carregando>
    )
  if (estado === "vazio") return null
  return (
    <CardParticipacao
      className={entrada}
      style={atraso(2)}
      titulo="Vendas em 30 dias"
      valor={brlCompacto(TOTAL)}
      variacao={0.046}
      serie={[50, 52, 48, 55, 60, 58, 62, 70, 68, 75, 72, 80, 78, 85, 82, 70, 65, 72, 78, 88, 92, 90]}
      descricaoSerie="Vendas diárias dos últimos 30 dias, com alta no fim do mês"
      tituloParticipacao="Participação por categoria"
      participacao={CATEGORIAS.map((c) => ({ nome: c.nome, fracao: c.vendas / TOTAL, cor: c.cor }))}
      itens={[
        { icone: Apple, nome: "Banana prata (kg)", detalhe: "Mais vendido · Hortifrúti", valor: 18_420.5, variacao: 0.082 },
        { icone: Croissant, nome: "Pão francês (kg)", detalhe: "Maior margem · Padaria", valor: 15_310.0, variacao: 0.031 },
      ]}
    />
  )
}

function Tela() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("30 dias")
  return (
    <MolduraOperador
      ativo="produtos"
      titulo="Vendas por categoria"
      descricao="Todas as lojas · valores com impostos"
      acoes={<Botao><Plus /> Nova promoção</Botao>}
    >
      <div role="group" aria-label="Período" className="mb-4 inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={periodo === p}
            onClick={() => setPeriodo(p)}
            className="rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:font-medium aria-pressed:text-foreground aria-pressed:shadow-sm"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Tabela />
        <aside aria-label="Resumo do período" className="lg:sticky lg:top-20">
          <Resumo />
        </aside>
      </div>
    </MolduraOperador>
  )
}

export default function TemplateCategorias() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
