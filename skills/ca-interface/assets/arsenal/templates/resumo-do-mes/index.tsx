/**
 * TEMPLATE: Resumo do mês, topo de relatório com bento de destaque (base: stats-bento).
 * Para que serve: fechar o mês numa olhada; um número-herói na cor da marca e três de apoio, depois os destaques.
 * Quando usar: topo de relatório mensal, página de fechamento, tela de conquistas (também serve para o cliente).
 * Quando não usar: acompanhamento diário com comparação fina (use kpis-operador ou relatorios); dados que mudam a cada minuto.
 * Depende de: ./bento-destaque (stats-bento com props), lucide-react, templates/_base.
 * Ao adaptar: troque os números do bento e DESTAQUES; o herói usa --primary, então segue a marca sozinho.
 */
import { CalendarRange, Download, FileBarChart, Medal, Share2, Star, TrendingUp, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { brlCompacto } from "../_base/formato"
import { BentoDestaque } from "./bento-destaque"

const DESTAQUES = [
  { icone: Trophy, titulo: "Melhor semana do ano", texto: "De 3 a 9 de outubro: R$ 268 mil, puxada pela campanha de hortifrúti." },
  { icone: TrendingUp, titulo: "Ticket médio subiu", texto: "De R$ 71,40 para R$ 78,90 depois do novo combo de café da manhã." },
  { icone: Medal, titulo: "Unidade destaque", texto: "Loja Savassi bateu a meta pelo terceiro mês seguido (112%)." },
]

const METAS = [
  { rotulo: "Faturamento", atual: 1.12 },
  { rotulo: "Novos clientes do clube", atual: 0.94 },
  { rotulo: "Avaliação média ≥ 4,7", atual: 1 },
  { rotulo: "Ruptura de estoque < 2%", atual: 0.76 },
]

function Conteudo() {
  const estado = useEstadoTela()

  if (estado === "carregando")
    return (
      <Carregando rotulo="Carregando o resumo do mês" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-6 md:grid-rows-2">
          <Esqueleto className="h-64 rounded-3xl md:col-span-3 md:row-span-2 md:h-auto" />
          <Esqueleto className="h-28 rounded-3xl md:col-span-3" />
          <Esqueleto className="h-28 rounded-3xl md:col-span-1" />
          <Esqueleto className="h-28 rounded-3xl md:col-span-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <Esqueleto key={i} className="h-32 rounded-2xl" />)}
        </div>
      </Carregando>
    )

  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={CalendarRange}
        titulo="O mês ainda não fechou"
        texto="O resumo de novembro fica pronto no dia 1º, depois do fechamento do caixa. Enquanto isso, veja o resumo de outubro."
        acao={<Botao variante="secundario"><FileBarChart /> Abrir outubro</Botao>}
        className="py-20"
      />
    )

  return (
    <div className="space-y-8">
      <BentoDestaque
        heroi={{ selo: "Meta do mês", valor: "112%", texto: `Faturamento de ${brlCompacto(1_184_000)} contra a meta de ${brlCompacto(1_057_000)}.` }}
        crescimento={{ rotulo: "Crescimento no ano", valor: "+38%", barras: [10, 20, 40, 30, 60, 50, 80, 70, 90, 100, 110], descricaoBarras: "Faturamento mensal de janeiro a novembro, em alta quase todo mês" }}
        contagem={{ valor: "4", rotulo: "Lojas" }}
        nota={{ valor: "4,8 de 5", rotulo: "Avaliação média dos clientes", icone: Star }}
      />

      <section aria-labelledby="destaques-titulo">
        <h2 id="destaques-titulo" className="mb-3 text-base font-semibold">Destaques</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {DESTAQUES.map((d, i) => (
            <li key={d.titulo} className={cn("rounded-2xl border border-border bg-card p-5", entrada)} style={atraso(4 + i)}>
              <d.icone className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">{d.titulo}</p>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">{d.texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="metas-titulo" className={cn("rounded-2xl border border-border bg-card p-5", entrada)} style={atraso(7)}>
        <h2 id="metas-titulo" className="text-base font-semibold">Metas de novembro</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {METAS.map((m) => {
            const batida = m.atual >= 1
            return (
              <li key={m.rotulo}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{m.rotulo}</span>
                  <span className={cn("font-medium tabular-nums", batida ? "text-sucesso" : "text-muted-foreground")}>
                    {Math.round(m.atual * 100)}%{batida ? " · batida" : ""}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${Math.round(m.atual * 100)}% da meta`}>
                  <div className={cn("h-full rounded-full", batida ? "bg-sucesso" : "bg-foreground/60")} style={{ width: `${Math.min(100, m.atual * 100)}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export default function TemplateResumoDoMes() {
  return (
    <ProvedorEstado>
      <MolduraOperador
        ativo="relatorios"
        titulo="Resumo de novembro"
        descricao="Todas as lojas · 1º a 30 de novembro de 2026"
        acoes={
          <>
            <Botao variante="secundario"><Share2 /> Compartilhar</Botao>
            <Botao><Download /> Baixar PDF</Botao>
          </>
        }
      >
        <Conteudo />
      </MolduraOperador>
    </ProvedorEstado>
  )
}
