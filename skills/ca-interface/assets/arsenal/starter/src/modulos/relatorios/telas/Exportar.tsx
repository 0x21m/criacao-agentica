// Relatórios · diálogo de exportação (colunas e formato). Exportar é um job (EST-29): fecha o diálogo, avisa
// "Exportação iniciada" e, quando o arquivo fica pronto, o sino traz "Relatório pronto" com o link para baixar.
// Carregado só quando o diálogo abre (React.lazy na tela).
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxGroup } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BotaoLiquido } from "@/components/movimento"
import { UNIDADES } from "@/proto/negocio"
import { chaveDia } from "@/proto/relogio"
import { cn } from "@/lib/utils"
import { CATEGORIAS } from "@/modulos/estoque/dados"
import {
  INDICADORES, PERIODOS, baldes, janelaAnterior, porCategoria, porServico, porSemana, produtividade, serie, textoJanela,
  type Fontes, type FiltroUnidade, type Janela,
} from "../calculos"
import { exportar, montarCSV, numeroCSV } from "../dados"
import { nomeUnidade, type Filtros } from "./comum"

type Coluna = { id: string; rotulo: string }
const dia = (d: Date) => d.toLocaleDateString("pt-BR")

export default function DialogoExportar({ aberto, aoFechar, aba, filtros, fontes, janela, agora, soFinanceiro }: {
  aberto: boolean; aoFechar: () => void; aba: string; filtros: Filtros; fontes: Fontes; janela: Janela; agora: Date; soFinanceiro: boolean
}) {
  const unidade = filtros.unidade as FiltroUnidade
  const inds = soFinanceiro ? INDICADORES.filter((i) => i.financeiro) : INDICADORES
  const colunas: Coluna[] = useMemo(() => aba === "tecnicos"
    ? [{ id: "unidade", rotulo: "Unidade" }, { id: "concluidas", rotulo: "OS concluídas" }, { id: "horas", rotulo: "Horas em visita" }, { id: "visitas", rotulo: "Visitas" }, { id: "retrabalho", rotulo: "Retrabalho" }]
    : aba === "servicos"
      ? [{ id: "qtd", rotulo: "Quantidade (OS ou unidades)" }, { id: "valor", rotulo: "Faturamento (R$)" }, { id: "participacao", rotulo: "Participação (%)" }, { id: "anterior", rotulo: "Período anterior (R$)" }]
      : [...inds.map((i) => ({ id: i.id, rotulo: i.rotulo })), { id: "anterior", rotulo: "Período anterior de cada indicador" }],
  [aba, inds])
  const [marcadas, setMarcadas] = useState<string[]>(colunas.map((c) => c.id))
  const [sep, setSep] = useState<";" | ",">(";")
  const [enviando, setEnviando] = useState(false)
  const nenhuma = !marcadas.some((m) => m !== "anterior")
  const periodo = filtros.periodo === "personalizado" ? textoJanela(janela) : PERIODOS.find((p) => p.id === filtros.periodo)?.rotulo ?? textoJanela(janela)
  const nomeAba = aba === "tecnicos" ? "Produtividade por técnico" : aba === "servicos" ? "Serviços" : "Desempenho"

  function montar() {
    const tem = (id: string) => marcadas.includes(id)
    if (aba === "tecnicos") {
      const ls = produtividade(fontes, janela, unidade, agora)
      const cab = ["Técnico", ...colunas.filter((c) => tem(c.id)).map((c) => c.rotulo)]
      return { cab, linhas: ls.map((l) => ["" + l.nome, ...colunas.filter((c) => tem(c.id)).map((c) => c.id === "unidade" ? UNIDADES[l.unidade].nome : c.id === "horas" ? numeroCSV(l.horas, sep, 1) : String(l[c.id as "concluidas"]))]) }
    }
    if (aba === "servicos") {
      const ls = porServico(fontes, janela, unidade, agora)
      const cats = porCategoria(fontes, janela, unidade, CATEGORIAS)
      const sel = colunas.filter((c) => tem(c.id))
      const cab = ["Tipo", "Nome", ...sel.map((c) => c.rotulo)]
      const val = (id: string, x: { qtd: number; valor: number; participacao: number; anterior?: number }) =>
        id === "qtd" ? String(x.qtd) : id === "valor" ? numeroCSV(x.valor, sep) : id === "participacao" ? numeroCSV(x.participacao * 100, sep, 1) : x.anterior === undefined ? "" : numeroCSV(x.anterior, sep)
      return { cab, linhas: [...ls.map((l) => ["Serviço", l.nome, ...sel.map((c) => val(c.id, l))]), ...cats.map((l) => ["Categoria da loja", l.categoria, ...sel.map((c) => val(c.id, l))])] }
    }
    const bs = baldes(janela)
    const ant = janelaAnterior(janela)
    const sel = inds.filter((i) => tem(i.id))
    const comAnterior = tem("anterior")
    const series = sel.map((i) => { const f = i.fatos(fontes, agora); return { i, a: serie(i, f, janela, unidade, porSemana(janela)), b: comAnterior ? serie(i, f, ant, unidade, porSemana(janela)) : null } })
    const casas = (id: string) => (id === "concluidas" ? 0 : id === "aprovacao" ? 1 : 2)
    const v = (id: string, x: number) => numeroCSV(id === "aprovacao" ? x * 100 : x, sep, casas(id))
    const cab = [bs.length && bs[0].de.getTime() !== bs[0].ate.getTime() ? "Semana (início)" : "Dia",
      ...series.flatMap(({ i }) => [rotuloCSV(i.id, i.rotulo), ...(comAnterior ? [`${rotuloCSV(i.id, i.rotulo)} (anterior)`] : [])])]
    return { cab, linhas: bs.map((b, k) => [dia(b.de), ...series.flatMap(({ i, a, b: p }) => [v(i.id, a.valores[k]), ...(p ? [v(i.id, p.valores[k])] : [])])]) }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (nenhuma || enviando) return
    setEnviando(true)
    const { cab, linhas } = montar()
    const titulo = `${nomeAba} · ${periodo} · ${nomeUnidade(unidade)}`
    const arquivo = `relatorio-${aba}-${chaveDia(janela.de)}-a-${chaveDia(janela.ate)}.csv`
    const id = await exportar({ titulo, arquivo, conteudo: montarCSV(cab, linhas, sep), linhas: linhas.length })
    setEnviando(false)
    if (!id) return
    toast("Exportação iniciada", { description: "Avisamos no sino quando o arquivo ficar pronto." })
    aoFechar()
  }

  return (
    <Dialog isOpen={aberto} onOpenChange={(o) => !o && aoFechar()} className="sm:max-w-md" isDismissable={!enviando}>
      <form onSubmit={enviar} className="grid gap-4" noValidate>
        <DialogHeader>
          <DialogTitle>Exportar {nomeAba.toLowerCase()}</DialogTitle>
          <DialogDescription className="text-pretty"><span className="num">{textoJanela(janela)}</span> · {nomeUnidade(unidade)}. O arquivo sai com os filtros da tela.</DialogDescription>
        </DialogHeader>
        <CheckboxGroup value={marcadas} onChange={setMarcadas} aria-describedby="exp-col-msg" isInvalid={nenhuma}>
          <Label>Colunas</Label>
          {colunas.map((c) => <Checkbox key={c.id} value={c.id} className="min-h-10 items-center">{c.rotulo}</Checkbox>)}
          <p id="exp-col-msg" aria-live="polite" className={cn("min-h-4 text-xs", nenhuma ? "text-negativo-texto" : "text-muted-foreground")}>
            {nenhuma ? "Escolha pelo menos uma coluna." : aba === "desempenho" ? "Uma linha por dia (ou por semana, acima de 31 dias)." : "Uma linha por item."}
          </p>
        </CheckboxGroup>
        <RadioGroup value={sep} onChange={(v) => setSep(v as ";" | ",")}>
          <Label>Formato</Label>
          <RadioGroupItem value=";" className="min-h-10 items-center">CSV para Excel em português (ponto e vírgula, vírgula decimal)</RadioGroupItem>
          <RadioGroupItem value="," className="min-h-10 items-center">CSV padrão (vírgula, ponto decimal)</RadioGroupItem>
        </RadioGroup>
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>Cancelar</Button>
          <BotaoLiquido type="submit" disabled={enviando || nenhuma}>
            <Download className="size-4" />
            <span className="inline-grid"><span className={cn("col-start-1 row-start-1", enviando && "invisible")}>Exportar CSV</span><span className={cn("col-start-1 row-start-1", !enviando && "invisible")}>Iniciando…</span></span>
          </BotaoLiquido>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

const rotuloCSV = (id: string, rotulo: string) => (id === "faturamento" || id === "ticket" ? `${rotulo} (R$)` : id === "tempo" ? `${rotulo} (dias)` : id === "aprovacao" ? `${rotulo} (%)` : rotulo)
