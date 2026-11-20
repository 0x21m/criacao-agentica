/**
 * TEMPLATE: Tendências por unidade, grade de cards compactos (base: market-snapshot).
 * Para que serve: comparar de relance a evolução de várias lojas (ou produtos, ou canais) com troca de período por card.
 * Quando usar: painel do operador com 3 a 8 séries independentes; lateral de detalhe; app do cliente (preço de um item).
 * Quando não usar: análise aprofundada com comparação e eventos (use relatorios); quando a pessoa precisa do valor exato
 * de cada dia (dê uma tabela).
 * Depende de: ./card-tendencia (market-snapshot com props), framer-motion, lucide-react, templates/_base.
 * Ao adaptar: troque UNIDADES (série diária, mais antiga primeiro) e o que cada card mede; cor por --chart-N.
 */
import { MapPin, Plus, RefreshCw, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Botao, MolduraOperador } from "../_base/moldura-operador"
import { Carregando, EstadoVazio, Esqueleto, atraso, entrada } from "../_base/esqueleto"
import { HOJE, brl, hora } from "../_base/formato"
import { CardTendencia } from "./card-tendencia"

function serie(base: number, alta: number, semente: number) {
  return Array.from({ length: 22 }, (_, i) => {
    const onda = Math.sin(i * 0.9 + semente) * base * 0.03 + Math.cos(i * 0.37 + semente * 2) * base * 0.02
    return +(base + (alta * base * i) / 21 + onda).toFixed(2)
  })
}

const UNIDADES = [
  { nome: "Loja Savassi · ticket médio", codigo: "SAV", valores: serie(71, 0.12, 1), cor: "var(--chart-1)" },
  { nome: "Loja Centro · ticket médio", codigo: "CEN", valores: serie(64, 0.04, 2), cor: "var(--chart-2)" },
  { nome: "Loja Pampulha · ticket médio", codigo: "PAM", valores: serie(83, -0.05, 3), cor: "var(--chart-3)" },
  { nome: "Loja Buritis · ticket médio", codigo: "BUR", valores: serie(58, 0.18, 4), cor: "var(--chart-4)" },
]

const RANKING = UNIDADES.map((u) => ({ codigo: u.codigo, nome: u.nome.split(" · ")[0], ultimo: u.valores[u.valores.length - 1], var: u.valores[u.valores.length - 1] / u.valores[0] - 1 })).sort((a, b) => b.var - a.var)

function Conteudo() {
  const estado = useEstadoTela()
  if (estado === "carregando")
    return (
      <Carregando className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {UNIDADES.map((u) => <Esqueleto key={u.codigo} className="h-[300px] rounded-lg" />)}
      </Carregando>
    )
  if (estado === "vazio")
    return (
      <EstadoVazio
        icone={Store}
        titulo="Nenhuma unidade acompanhada"
        texto="Escolha as lojas que você quer acompanhar. Cada uma ganha um card com a tendência do ticket médio."
        acao={<Botao><Plus /> Acompanhar unidade</Botao>}
        className="py-20"
      />
    )
  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {UNIDADES.map((u, i) => (
          <li key={u.codigo} className={entrada} style={atraso(i)}>
            <CardTendencia nome={u.nome} codigo={u.codigo} valores={u.valores} cor={u.cor} fim={HOJE} rodape={[`Atualizado às ${hora(HOJE)}`, "Com impostos · BRL"]} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="ranking-titulo" className={cn("rounded-xl border border-border bg-card", entrada)} style={atraso(4)}>
        <h2 id="ranking-titulo" className="border-b border-border px-5 py-4 text-base font-semibold">Quem mais cresceu no ano</h2>
        <ol className="divide-y divide-border">
          {RANKING.map((r, i) => (
            <li key={r.codigo} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className="w-5 text-muted-foreground tabular-nums">{i + 1}º</span>
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1 font-medium">{r.nome}</span>
              <span className="text-muted-foreground tabular-nums">{brl(r.ultimo)}</span>
              <span className={cn("w-16 text-right font-medium tabular-nums", r.var >= 0 ? "text-sucesso" : "text-destructive")}>
                {r.var >= 0 ? "+" : "−"}
                {Math.abs(r.var * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default function TemplateTendencias() {
  return (
    <ProvedorEstado>
      <MolduraOperador
        ativo="unidades"
        titulo="Tendências por unidade"
        descricao="Ticket médio por loja. Passe o mouse ou use as setas no gráfico para ver cada data."
        acoes={
          <>
            <Botao variante="secundario"><RefreshCw /> Atualizar</Botao>
            <Botao><Plus /> Acompanhar unidade</Botao>
          </>
        }
      >
        <Conteudo />
      </MolduraOperador>
    </ProvedorEstado>
  )
}
