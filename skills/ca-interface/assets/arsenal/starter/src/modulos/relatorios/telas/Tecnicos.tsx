// Relatórios · ?aba=tecnicos: produtividade por técnico no período (TabelaDados no desktop, lista de cartões no
// celular). Zero aparece como 0 (Gustavo, o aprendiz sem visitas, fica na lista com zeros, não some).
// BASE: não há avaliação do cliente nos dados (o "Avaliar" do portal ainda não grava nota); a coluna diz "Sem avaliações".
import { useMemo } from "react"
import { Users } from "lucide-react"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { EstadoVazio } from "@/components/app/estados"
import { UNIDADES } from "@/proto/negocio"
import { numero } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { produtividade, textoJanela, type Fontes, type FiltroUnidade, type Janela, type LinhaTecnico } from "../calculos"
import { nomeUnidade } from "./comum"

const horas = (h: number) => `${h.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`

export function Tecnicos({ fontes, janela, unidade, agora, atualizando }: { fontes: Fontes; janela: Janela; unidade: FiltroUnidade; agora: Date; atualizando: boolean }) {
  const linhas = useMemo(() => produtividade(fontes, janela, unidade, agora).sort((a, b) => b.concluidas - a.concluidas || b.horas - a.horas || a.nome.localeCompare(b.nome)),
    [fontes, janela, unidade, agora])
  const total = linhas.reduce((s, l) => s + l.concluidas, 0)
  const colunas: ColunaDados<LinhaTecnico>[] = [
    { id: "nome", titulo: "Técnico", tipo: "texto", valor: (l) => l.nome },
    { id: "unidade", titulo: "Unidade", tipo: "texto", largura: "8rem", valor: (l) => UNIDADES[l.unidade].nome },
    { id: "concluidas", titulo: "OS concluídas", tipo: "numero", largura: "8rem", valor: (l) => numero(l.concluidas) },
    { id: "horas", titulo: "Horas em visita", tipo: "numero", largura: "8.5rem", valor: (l) => horas(l.horas) },
    { id: "visitas", titulo: "Visitas", tipo: "numero", largura: "6rem", valor: (l) => numero(l.visitas) },
    { id: "retrabalho", titulo: "Retrabalho", tipo: "numero", largura: "7rem", valor: (l) => <span className={l.retrabalho ? "text-negativo-texto" : undefined}>{numero(l.retrabalho)}</span>, texto: (l) => numero(l.retrabalho) },
    { id: "nota", titulo: "Nota média", tipo: "texto", largura: "9rem", valor: () => <span className="text-muted-foreground">Sem avaliações</span>, texto: () => "Sem avaliações" },
  ]
  if (!linhas.length) return <EstadoVazio variante="filtro" icone={Users} titulo={`Nenhum técnico em ${nomeUnidade(unidade)}.`} />
  return (
    <section aria-label="Produtividade por técnico" className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 transition-opacity duration-200 xl:block", atualizando && "opacity-55")} aria-busy={atualizando || undefined}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 px-1 xl:hidden">
        <h2 className="t-card">Produtividade por técnico</h2>
        <p className="num text-xs text-muted-foreground">{textoJanela(janela)}</p>
      </header>
      <TabelaDados<LinhaTecnico>
        titulo="Produtividade por técnico"
        colunas={colunas} linhas={linhas} idDe={(l) => l.id}
        contagem={<><span className="num">{numero(total)}</span> {total === 1 ? "OS concluída" : "OS concluídas"} </>}
        cartao={(l) => (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium" title={l.nome}>{l.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{UNIDADES[l.unidade].nome}</span>
            </div>
            <dl className="grid grid-cols-4 gap-2 text-sm">
              {([["Concluídas", numero(l.concluidas)], ["Horas", horas(l.horas)], ["Visitas", numero(l.visitas)], ["Retrabalho", numero(l.retrabalho)]] as const).map(([r, v]) => (
                <div key={r} className="min-w-0"><dt className="t-rotulo truncate">{r}</dt><dd className="num font-medium">{v}</dd></div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">Nota média: sem avaliações</p>
          </>
        )}
      />
      <p className="px-1 pt-2 text-xs text-pretty text-muted-foreground">Retrabalho: OS nova do mesmo cliente e serviço aberta até 90 dias depois de uma que o técnico concluiu. Horas: visitas concluídas ou em andamento na agenda.</p>
    </section>
  )
}
