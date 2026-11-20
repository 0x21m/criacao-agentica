/**
 * TEMPLATE: Visão geral do operador com faixa de KPIs (base: statistics-card-7).
 * Para que serve: primeira tela do dia de quem opera a loja; 3 números com variação e, abaixo, o que pede ação.
 * Quando usar: painel de alta frequência, operador que abre a tela várias vezes por dia.
 * Quando não usar: app do cliente final ou tela de marca (é sóbrio de propósito); mais de 4 KPIs numa faixa.
 * Depende de: components/ui/card (Card, CardContent), components/ui/badge-2 (Badge), lucide-react, templates/_base.
 * Ao adaptar: troque KPIS e PEDIDOS pelos dados reais, os rótulos de período e as cores de status
 * (aqui por tokens --sucesso, --destructive e --chart-1; não use verde/vermelho fixos).
 */
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Download, PackageOpen, Plus, ShoppingBag, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card-reui"
import { Badge } from "@/components/ui/badge-2"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { HOJE, brl, brlCompacto, dataLonga, hora, numero, pct } from "../_base/formato"

type Tom = "positivo" | "negativo" | "neutro"
const TOM: Record<Tom, { texto: string; selo: string }> = {
  positivo: { texto: "text-sucesso", selo: "bg-sucesso/12 text-sucesso" },
  negativo: { texto: "text-destructive", selo: "bg-destructive/12 text-destructive" },
  neutro: { texto: "text-foreground", selo: "bg-chart-1/12 text-foreground" },
}

const KPIS = [
  { titulo: "Vendas", periodo: "Últimos 30 dias", valor: brlCompacto(956_820), delta: 0.054, icone: ArrowUpRight, tom: "positivo" as Tom, extra: `+${brlCompacto(48_200)}`, contexto: "vs. 30 dias anteriores" },
  { titulo: "Novos clientes", periodo: "Este trimestre", valor: numero(1245), delta: 0.032, icone: UserPlus, tom: "neutro" as Tom, extra: "+39", contexto: "vs. trimestre passado" },
  { titulo: "Cancelamentos", periodo: "Últimos 30 dias", valor: "2,8%", delta: -0.011, icone: ArrowDownRight, tom: "positivo" as Tom, extra: "−0,3 p.p.", contexto: "vs. 30 dias anteriores" },
]

const PEDIDOS = [
  { id: "#48213", cliente: "Ana Ribeiro", itens: 12, total: 386.4, hora: new Date(2026, 10, 16, 9, 32), situacao: "Separando" },
  { id: "#48212", cliente: "Padaria Bom Dia", itens: 48, total: 2140.0, hora: new Date(2026, 10, 16, 9, 18), situacao: "Pago" },
  { id: "#48211", cliente: "Lucas Tavares", itens: 5, total: 94.9, hora: new Date(2026, 10, 16, 9, 2), situacao: "Entregue" },
  { id: "#48210", cliente: "Restaurante Sabiá", itens: 31, total: 1288.75, hora: new Date(2026, 10, 16, 8, 47), situacao: "Atrasado" },
  { id: "#48209", cliente: "Joana Prado", itens: 9, total: 211.3, hora: new Date(2026, 10, 16, 8, 30), situacao: "Entregue" },
]
const SITUACAO: Record<string, string> = {
  Separando: "bg-chart-1/12 text-foreground",
  Pago: "bg-secondary text-secondary-foreground",
  Entregue: "bg-sucesso/12 text-sucesso",
  Atrasado: "bg-destructive/12 text-destructive",
}

const ESTOQUE = [
  { produto: "Café torrado 500 g", resta: 6, minimo: 20 },
  { produto: "Leite integral 1 L", resta: 14, minimo: 40 },
  { produto: "Pão de forma integral", resta: 3, minimo: 12 },
]

function FaixaKpis() {
  const estado = useEstadoTela()
  return (
    <section aria-labelledby="kpis-titulo" className="@container">
      <h2 id="kpis-titulo" className="sr-only">Indicadores</h2>
      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-card @3xl:grid-cols-3">
        {KPIS.map((k, i) => (
          <Card
            key={k.titulo}
            className={cn("rounded-none border-0 border-t border-border shadow-none first:border-t-0 @3xl:border-t-0 @3xl:border-l @3xl:first:border-l-0", entrada)}
            style={atraso(i)}
          >
            <CardContent className="flex h-full flex-col justify-between gap-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">{k.titulo}</h3>
                <p className="text-sm text-muted-foreground">{k.periodo}</p>
              </div>
              {estado === "carregando" ? (
                <div className="space-y-2">
                  <Esqueleto className="h-8 w-36" />
                  <Esqueleto className="h-4 w-48" />
                </div>
              ) : estado === "vazio" ? (
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-muted-foreground">—</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">Sem movimento no período</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">{k.valor}</span>
                    <Badge className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium shadow-none", TOM[k.tom].selo)}>
                      <k.icone className="size-3" aria-hidden="true" />
                      <span className="tabular-nums">{pct(k.delta)}</span>
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <span className={cn("font-medium tabular-nums", TOM[k.tom].texto)}>{k.extra}</span>{" "}
                    <span className="text-muted-foreground">{k.contexto}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function PedidosRecentes() {
  const estado = useEstadoTela()
  return (
    <section aria-labelledby="pedidos-titulo" className={cn("min-w-0 rounded-xl border border-border bg-card lg:col-span-2", entrada)} style={atraso(3)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id="pedidos-titulo" className="text-base font-semibold">Pedidos de hoje</h2>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Ver todos</a>
      </div>
      {estado === "carregando" ? (
        <Carregando className="space-y-3 p-5">
          {Array.from({ length: 5 }, (_, i) => <Esqueleto key={i} className="h-9 w-full" />)}
        </Carregando>
      ) : estado === "vazio" ? (
        <div className="p-5">
          <EstadoVazio icone={ShoppingBag} titulo="Nenhum pedido hoje" texto="Os pedidos aparecem aqui assim que entrarem pelo caixa, pelo app ou pelo WhatsApp." acao={<Botao variante="secundario"><Plus /> Registrar pedido</Botao>} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Pedidos de hoje, do mais recente ao mais antigo</caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="px-5 py-2.5 font-medium">Pedido</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Cliente</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Itens</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Total</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Hora</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {PEDIDOS.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium tabular-nums">{p.id}</td>
                  <td className="px-3 py-3">{p.cliente}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.itens}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{brl(p.total)}</td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">{hora(p.hora)}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", SITUACAO[p.situacao])}>{p.situacao}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function AlertasEstoque() {
  const estado = useEstadoTela()
  return (
    <section aria-labelledby="estoque-titulo" className={cn("min-w-0 rounded-xl border border-border bg-card", entrada)} style={atraso(4)}>
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <AlertTriangle className="size-4 text-aviso" aria-hidden="true" />
        <h2 id="estoque-titulo" className="text-base font-semibold">Estoque baixo</h2>
      </div>
      {estado === "carregando" ? (
        <Carregando className="space-y-4 p-5">
          {Array.from({ length: 3 }, (_, i) => <Esqueleto key={i} className="h-10 w-full" />)}
        </Carregando>
      ) : estado === "vazio" ? (
        <div className="p-5">
          <EstadoVazio icone={PackageOpen} titulo="Estoque em dia" texto="Nenhum produto abaixo do mínimo." />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {ESTOQUE.map((e) => (
            <li key={e.produto} className="px-5 py-3.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium">{e.produto}</span>
                <span className="text-muted-foreground tabular-nums">
                  {e.resta} de {e.minimo}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${e.resta} unidades de um mínimo de ${e.minimo}`}>
                <div className="h-full rounded-full bg-aviso" style={{ width: `${(e.resta / e.minimo) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Tela() {
  return (
    <MolduraOperador
      ativo="visao-geral"
      titulo="Visão geral"
      descricao={`${dataLonga(HOJE)} · atualizado às ${hora(HOJE)}`}
      acoes={
        <>
          <Botao variante="secundario"><Download /> Exportar</Botao>
          <Botao><Plus /> Novo pedido</Botao>
        </>
      }
    >
      <div className="space-y-6">
        <FaixaKpis />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-3">
          <PedidosRecentes />
          <AlertasEstoque />
        </div>
      </div>
    </MolduraOperador>
  )
}

export default function TemplateKpisOperador() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
