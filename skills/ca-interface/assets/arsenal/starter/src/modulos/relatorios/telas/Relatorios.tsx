// Módulo Relatórios (5.8) · /relatorios/ (e ?aba=tecnicos, ?aba=servicos): desempenho e tendência da oficina.
// Banner compacto com as três vistas e o "Exportar CSV"; a barra de filtros (período no popover, unidade, comparação)
// avança sobre ele; tudo na URL. Desempenho: o metric-switcher adaptado (GraficoIndicadores) com os 5 indicadores da
// especificação, feriados e campanha no gráfico, comparação com o período anterior ou Pampulha × Contagem; embaixo,
// a operação do período (agenda e estoque, padrões do statistics-card-7 na Superficie) e a tabela equivalente.
// Arsenal: metric-switcher-trend-chart-demo (GraficoIndicadores), market-snapshot (CardServico, aba Serviços),
// statistics-card-7 (padrões dos cards de operação), SegmentadoDeVidro e BotaoLiquido, TabelaDados.
// Papéis: dono e gestora veem tudo; o financeiro, só os indicadores de dinheiro (Faturamento, Ticket médio) e Serviços;
// atendente e técnico: "Esta área é da gestão." (ComDados com a capacidade `relatorios`).
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { Dialog as DialogoAria } from "react-aria-components"
import { CalendarRange, ChartNoAxesCombined, Download, FileSpreadsheet, MapPin, PackageMinus, Table2, TriangleAlert, UserCheck, UserX, X } from "lucide-react"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { ComDados, EstadoSemPermissao, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { Superficie } from "@/components/sistema/Superficie"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAgora, chaveDia } from "@/proto/relogio"
import { pode, usePapel } from "@/proto/permissoes"
import { numero, percentual } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import {
  INDICADORES, MAX_DIAS, MIN_DIA, PERIODOS, baldes, eventos, indicadorPorId, janelaAnterior, janelaDe, lerDia, operacao, porSemana, semanalPara, serie, textoJanela,
  type Comparar, type FiltroUnidade, type IdPeriodo, type Janela,
} from "../calculos"
import { baixar, exportacoes, retomarPendentes } from "../dados"
import { FILTROS_PADRAO, formatosDe, nomeUnidade, useFiltrosAplicados, useFontes, type Filtros } from "./comum"
import { GraficoIndicadores, type SerieIndicador } from "./GraficoIndicadores"
import { Tecnicos } from "./Tecnicos"
import { Servicos } from "./Servicos"
// o diálogo de exportação só baixa quando abre
const DialogoExportar = lazy(() => import("./Exportar"))

const VISTAS_TODAS = [{ id: "desempenho", rotulo: "Desempenho" }, { id: "tecnicos", rotulo: "Técnicos" }, { id: "servicos", rotulo: "Serviços" }]
const COMPARAR: { id: Comparar; rotulo: string }[] = [{ id: "anterior", rotulo: "Período anterior" }, { id: "unidades", rotulo: "Entre unidades" }]
const UNIDADES_OK = ["todas", "pampulha", "contagem"]
function sanear(f: Filtros): Filtros {
  const ok = (v: string, lista: string[], padrao: string) => (lista.includes(v) ? v : padrao)
  return { ...f, unidade: ok(f.unidade, UNIDADES_OK, "todas"), periodo: ok(f.periodo, PERIODOS.map((p) => p.id), "30d"),
    comparar: ok(f.comparar, COMPARAR.map((c) => c.id), "anterior"), indicador: ok(f.indicador, INDICADORES.map((i) => i.id), "faturamento") }
}
/** "Mudar período": amplia (30 dias → trimestre → 12 meses). */
function maisAmplo(f: Filtros, agora: Date): Partial<Filtros> {
  if (f.periodo !== "trimestre" && !(f.periodo === "personalizado" && janelaDe("personalizado", agora, f.de, f.ate).dias >= 90)) return { periodo: "trimestre", de: "", ate: "" }
  const d = new Date(agora.getFullYear() - 1, agora.getMonth(), agora.getDate() + 1)
  return { periodo: "personalizado", de: chaveDia(d), ate: chaveDia(agora) }
}
const dataLonga = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })

export default function Relatorios() {
  const fontes = useFontes()
  const lista = exportacoes.use()
  const agora = useAgora()
  const dia = chaveDia(agora)
  const papel = usePapel()
  const [bruto, setF] = useParametrosDaUrl(FILTROS_PADRAO)
  // valor desconhecido na URL (?unidade=xyz) volta ao padrão em vez de derrubar a tela
  const f = useMemo(() => sanear(bruto), [bruto])
  const [a, atualizando] = useFiltrosAplicados(f)
  const [exportando, setExportando] = useState(false)
  useEffect(() => { retomarPendentes() }, [])

  const podeVer = pode(papel, "relatorios")
  const soFinanceiro = papel === "financeiro"
  const vistas = soFinanceiro ? VISTAS_TODAS.filter((v) => v.id !== "tecnicos") : VISTAS_TODAS
  const aba = vistas.some((v) => v.id === f.aba) ? f.aba : f.aba === "tecnicos" ? "tecnicos" : "desempenho"
  const unidade = a.unidade as FiltroUnidade
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const janela = useMemo(() => janelaDe(a.periodo as IdPeriodo, agora, a.de, a.ate), [a.periodo, a.de, a.ate, dia])
  const filtrado = f.periodo !== "30d" || f.unidade !== "todas" || f.comparar !== "anterior"
  const pronto = f.baixar ? lista.find((e) => e.id === f.baixar) : undefined

  const exporta = podeVer && !(soFinanceiro && aba === "tecnicos")
  return (
    <div className="pb-6">
      <CabecalhoPagina
        titulo="Relatórios"
        descricao={<>{textoJanela(janelaDe(f.periodo as IdPeriodo, agora, f.de, f.ate))} · {nomeUnidade(f.unidade as FiltroUnidade)}</>}
        acoes={podeVer && (
          <>
            {/* as três vistas pedem mais que os 13 rem do segmentado padrão do cabeçalho */}
            <div className="w-[19.5rem] shrink-0 max-sm:w-full max-sm:basis-full"><SegmentadoDeVidro aria-label="Vista" opcoes={vistas} valor={aba} aoMudar={(id) => setF({ aba: id })} /></div>
            {exporta && <BotaoLiquido onClick={() => setExportando(true)}><Download className="size-4" /> Exportar CSV</BotaoLiquido>}
          </>
        )}
      >
        {podeVer && (
          <BarraFerramentas filtrado={filtrado} aoLimpar={() => setF({ periodo: "30d", de: "", ate: "", unidade: "todas", comparar: "anterior" })}>
            <FiltroPeriodo f={f} setF={setF} agora={agora} />
            {!(f.comparar === "unidades" && aba === "desempenho") && <Select aria-label="Unidade" selectedKey={f.unidade}
              onSelectionChange={(k) => setF({ unidade: String(k) })} className="w-full sm:w-52">
              <SelectTrigger className="h-10 rounded-full"><MapPin /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem id="todas">Todas as unidades</SelectItem>
                <SelectItem id="pampulha">Pampulha</SelectItem>
                <SelectItem id="contagem">Contagem</SelectItem>
              </SelectContent>
            </Select>}
            {aba === "desempenho" && (
              <div className="w-full sm:w-80"><SegmentadoDeVidro aria-label="Comparar com" opcoes={COMPARAR} valor={f.comparar} aoMudar={(comparar) => setF({ comparar })} /></div>
            )}
          </BarraFerramentas>
        )}
      </CabecalhoPagina>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-3 pt-4 md:px-6">
        {podeVer && f.baixar && <FaixaPronto id={f.baixar} pronto={pronto} aoFechar={() => setF({ baixar: "" })} />}
        <ComDados
          capacidade="relatorios" area="da gestão" rotulo="os relatórios"
          esqueleto={<EsqueletoRelatorio />}
          vazio={<EstadoVazio icone={ChartNoAxesCombined} titulo="Sem dados neste período." texto="Os relatórios aparecem assim que houver OS, recebimentos e visitas no período escolhido."
            acao={<Button variant="outline" onPress={() => setF(maisAmplo(f, agora))}>Mudar período</Button>} />}
        >
          {() => aba === "tecnicos" && soFinanceiro ? <EstadoSemPermissao area="da gestão" />
            : aba === "tecnicos" ? <Tecnicos fontes={fontes} janela={janela} unidade={unidade} agora={agora} atualizando={atualizando} />
            : aba === "servicos" ? <Servicos fontes={fontes} janela={janela} unidade={unidade} agora={agora} atualizando={atualizando} mudarPeriodo={() => setF(maisAmplo(f, agora))} />
            : <Desempenho fontes={fontes} janela={janela} a={a} setF={setF} agora={agora} soFinanceiro={soFinanceiro} atualizando={atualizando} />}
        </ComDados>
      </div>

      {exportando && exporta && (
        <Suspense fallback={null}>
          <DialogoExportar aberto={exportando} aoFechar={() => setExportando(false)} aba={aba} filtros={a} fontes={fontes} janela={janela} agora={agora} soFinanceiro={soFinanceiro} />
        </Suspense>
      )}
    </div>
  )
}

// ---------- período: popover com as opções e o intervalo personalizado ----------
function FiltroPeriodo({ f, setF, agora }: { f: Filtros; setF: (m: Partial<Filtros>) => void; agora: Date }) {
  const j = janelaDe(f.periodo as IdPeriodo, agora, f.de, f.ate)
  const hoje = chaveDia(agora)
  const [de, setDe] = useState(f.de || chaveDia(j.de))
  const [ate, setAte] = useState(f.ate || hoje)
  const [aberto, setAberto] = useState(false)
  const [escolha, setEscolha] = useState(f.periodo)
  useEffect(() => { if (aberto) { setEscolha(f.periodo); setDe(f.de || chaveDia(j.de)); setAte(f.ate || hoje) } }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps
  const vazio = !lerDia(de) || !lerDia(ate)
  const longo = !vazio && (lerDia(ate)!.getTime() - lerDia(de)!.getTime()) / 864e5 + 1 > MAX_DIAS + 1
  const invalido = escolha === "personalizado" && (vazio || de > ate || ate > hoje || de < MIN_DIA || longo)
  const rotulo = f.periodo === "personalizado" ? textoJanela(j) : PERIODOS.find((p) => p.id === f.periodo)?.rotulo ?? "30 dias"
  function aplicar() {
    if (invalido) return
    setF(escolha === "personalizado" ? { periodo: escolha, de, ate } : { periodo: escolha, de: "", ate: "" })
    setAberto(false)
  }
  return (
    <PopoverTrigger isOpen={aberto} onOpenChange={setAberto}>
      <Button variant="outline" className="h-10 w-full justify-start rounded-full px-3.5 sm:w-auto" aria-label={`Período: ${rotulo}`}>
        <CalendarRange /> <span className="num">{rotulo}</span>
      </Button>
      <Popover placement="bottom start" className="w-80">
        <DialogoAria aria-label="Período" className="grid gap-3 outline-none">
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); aplicar() }}>
            <RadioGroup aria-label="Período" value={escolha} onChange={setEscolha} className="gap-1">
              {PERIODOS.map((p) => <RadioGroupItem key={p.id} value={p.id} className="min-h-10 items-center rounded-lg px-2 hover:bg-muted/60">{p.rotulo}</RadioGroupItem>)}
            </RadioGroup>
            {escolha === "personalizado" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5"><Label htmlFor="rel-de">De</Label><Input id="rel-de" type="date" min={MIN_DIA} max={hoje} value={de} onChange={(e) => setDe(e.target.value)} className="h-10" /></div>
                <div className="grid gap-1.5"><Label htmlFor="rel-ate">Até</Label><Input id="rel-ate" type="date" min={MIN_DIA} max={hoje} value={ate} onChange={(e) => setAte(e.target.value)} className="h-10" aria-invalid={invalido || undefined} aria-describedby="rel-periodo-msg" /></div>
                <p id="rel-periodo-msg" aria-live="polite" className={cn("col-span-2 min-h-4 text-xs text-pretty", invalido ? "text-negativo-texto" : "text-muted-foreground")}>
                  {!invalido ? "Acima de 31 dias, o gráfico mostra um ponto por semana."
                    : vazio ? "Preencha as duas datas." : ate > hoje ? "O fim do período não pode passar de hoje."
                    : de > ate ? "A data inicial precisa vir antes da final." : de < MIN_DIA ? "Os dados começam em 2020." : "O período vai até 12 meses."}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="h-10" onPress={() => setAberto(false)}>Cancelar</Button>
              <Button type="submit" className="h-10" isDisabled={invalido}>Aplicar</Button>
            </div>
          </form>
        </DialogoAria>
      </Popover>
    </PopoverTrigger>
  )
}

// ---------- o arquivo pronto (link do sino) ----------
function FaixaPronto({ id, pronto, aoFechar }: { id: string; pronto?: ReturnType<typeof exportacoes.ler>[number]; aoFechar: () => void }) {
  return (
    <Superficie como="section" aria-label="Exportação" className="flex flex-wrap items-center gap-3 p-3 md:px-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)] text-muted-foreground"><FileSpreadsheet className="size-4" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1 text-sm">
        {pronto ? (
          <>
            <p className="font-medium">{pronto.estado === "gerando" ? "Gerando o arquivo…" : "Relatório pronto"}</p>
            <p className="truncate text-muted-foreground" title={pronto.titulo}>{pronto.titulo} · <span className="num">{numero(pronto.linhas)}</span> {pronto.linhas === 1 ? "linha" : "linhas"}</p>
          </>
        ) : (
          <><p className="font-medium">Arquivo {id} não encontrado</p><p className="text-pretty text-muted-foreground">As exportações ficam neste navegador. Exporte de novo pelo botão "Exportar CSV".</p></>
        )}
      </div>
      <div className="flex items-center gap-2">
        {pronto && pronto.estado !== "gerando" && <Button className="h-10" onPress={() => baixar(pronto.id)}><Download /> Baixar CSV</Button>}
        <Button variant="ghost" size="icon" className="size-10" aria-label="Fechar aviso" onPress={aoFechar}><X /></Button>
      </div>
    </Superficie>
  )
}

// ---------- desempenho ----------
const dm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
const rotuloDe = (bs: { de: Date; ate: Date }[], semanal: boolean) => (i: number) =>
  (semanal ? `Semana de ${dm(bs[i].de)} a ${dm(bs[i].ate)}` : dataLonga(bs[i].de))
function Desempenho({ fontes, janela, a, setF, agora, soFinanceiro, atualizando }: {
  fontes: ReturnType<typeof useFontes>; janela: Janela; a: Filtros; setF: (m: Partial<Filtros>) => void; agora: Date; soFinanceiro: boolean; atualizando: boolean
}) {
  const unidades = a.comparar === "unidades"
  const unidade = a.unidade as FiltroUnidade
  const ant = janelaAnterior(janela)
  const bs = useMemo(() => baldes(janela), [janela])
  const indicadores = soFinanceiro ? INDICADORES.filter((i) => i.financeiro) : INDICADORES
  const dia = chaveDia(agora)

  const series = useMemo<SerieIndicador[]>(() => indicadores.map((ind) => {
    const fatos = ind.fatos(fontes, agora)
    const fm = formatosDe(ind)
    const sem = semanalPara(ind, janela)
    const bsi = baldes(janela, sem)
    const proprio = { datas: bsi.map((b) => b.de), rotuloData: rotuloDe(bsi, sem), eventos: eventos(janela, sem), semanal: sem }
    if (unidades) {
      const p = serie(ind, fatos, janela, "pampulha"), c = serie(ind, fatos, janela, "contagem"), t = serie(ind, fatos, janela, "todas")
      const v = (x: number) => (Number.isFinite(x) ? fm.formatar(x) : "sem dados")
      return { id: ind.id, rotulo: ind.rotulo, curto: ind.curto, cor: ind.cor, ...fm, ...proprio, sobeBom: ind.sobeBom, fatos: t.n, total: t.total, valores: p.valores, comparacao: c.valores,
        detalhe: <span className="text-pretty">Pampulha <span className="num text-foreground">{v(p.total)}</span> · Contagem <span className="num text-foreground">{v(c.total)}</span></span> }
    }
    const atual = serie(ind, fatos, janela, unidade), antes = serie(ind, fatos, ant, unidade)
    return { id: ind.id, rotulo: ind.rotulo, curto: ind.curto, cor: ind.cor, ...fm, ...proprio, sobeBom: ind.sobeBom, pontos: ind.formato === "percentual", fatos: atual.n + antes.n, total: atual.total, totalComparacao: antes.total, valores: atual.valores, comparacao: antes.valores }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [fontes, janela, unidade, unidades, soFinanceiro, dia])

  const ativo = indicadores.some((i) => i.id === a.indicador) ? a.indicador : indicadores[0].id
  const ind = indicadorPorId(ativo)
  const s = series.find((x) => x.id === ativo)!
  const op = useMemo(() => operacao(fontes, janela, unidades ? "todas" : unidade), [fontes, janela, unidade, unidades])
  const rotuloData = rotuloDe(bs, porSemana(janela))
  const semanal = !!s.semanal
  const ondeTexto = unidades ? "nas duas unidades" : unidade === "todas" ? "nas duas unidades" : `em ${nomeUnidade(unidade)}`
  const [tabela, setTabela] = useState(false)

  return (
    <>
      <Superficie como="section" aria-labelledby="rel-titulo" className="grid min-w-0 gap-4 p-4 md:p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="rel-titulo" className="t-card">Indicadores {ondeTexto}</h2>
          <p className="text-xs text-muted-foreground">
            {semanal ? "Um ponto por semana" : "Um ponto por dia"}
            {!unidades && <> · comparado a <span className="num whitespace-nowrap">{textoJanela(ant)}</span></>}
          </p>
        </header>
        <GraficoIndicadores
          series={series} ativo={ativo} aoMudar={(indicador) => setF({ indicador })} maximo={ind.formato === "percentual" ? 1 : undefined}
          datas={bs.map((b) => b.de)} rotuloData={rotuloData}
          rotuloAtual={unidades ? "Pampulha" : textoJanela(janela)} rotuloComparacao={unidades ? "Contagem" : textoJanela(ant)}
          modo={unidades ? "unidades" : "anterior"} eventos={eventos(janela)} atualizando={atualizando}
          vazio={<EstadoVazio variante="filtro" icone={ChartNoAxesCombined} titulo={`Sem dados de ${ind.frase} ${ondeTexto} neste período.`}
            texto="Escolha um período maior ou outra unidade."
            acao={<Button variant="outline" className="h-10" onPress={() => setF(maisAmplo(a, agora))}>Mudar período</Button>} />}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--anel-cartao)] pt-3 text-xs text-muted-foreground">
          <p className="text-pretty">{NOTA[ind.id]}</p>
          <Button variant="ghost" className="h-10" aria-expanded={tabela} aria-controls="rel-tabela" onPress={() => setTabela((t) => !t)}>
            <Table2 /> {tabela ? "Esconder a tabela" : "Ver como tabela"}
          </Button>
        </div>
      </Superficie>

      {tabela && <TabelaDoGrafico id="rel-tabela" s={s} rotuloData={s.rotuloData ?? rotuloData} unidades={unidades} semanal={semanal} />}

      {!soFinanceiro ? (
        <section aria-label="Operação no período" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <CardOperacao icone={UserCheck} titulo="Visitas realizadas" valor={numero(op.realizadas)}
            detalhe={op.realizadas + op.faltas ? <><span className="num font-medium text-foreground">{percentual(op.comparecimento)}</span> de comparecimento</> : "Nenhuma visita no período"}
            link={{ rotulo: "Abrir a agenda", href: "agenda/" }} />
          <CardOperacao icone={UserX} titulo="Clientes ausentes" valor={numero(op.faltas)}
            detalhe={op.faltas ? `${op.faltas === 1 ? "visita marcada" : "visitas marcadas"} como ausente` : "Nenhuma ausência no período"}
            link={{ rotulo: "Abrir a agenda", href: "agenda/" }} />
          <CardOperacao icone={PackageMinus} titulo="Saídas de estoque" valor={numero(op.saidas)}
            detalhe={<>{op.saidas === 1 ? "unidade" : "unidades"} em <span className="num">{numero(op.nMovs)}</span> {op.nMovs === 1 ? "movimentação" : "movimentações"} (vendas e OS)</>}
            link={{ rotulo: "Ver movimentações", href: "estoque/movimentacoes/" }} />
          <CardOperacao icone={TriangleAlert} titulo="Abaixo do mínimo agora" valor={numero(op.repor)}
            detalhe={<>de <span className="num">{numero(op.nProdutos)}</span> produtos ativos{unidades || unidade === "todas" ? "" : ` em ${nomeUnidade(unidade)}`}</>}
            link={{ rotulo: "Repor no estoque", href: "estoque/?situacao=repor" }} />
        </section>
      ) : (
        <p className="px-1 text-sm text-pretty text-muted-foreground">Seu papel (Financeiro) vê os indicadores de dinheiro. Produtividade, agenda e estoque ficam com a gestão.</p>
      )}
    </>
  )
}

/** Como cada indicador é contado (a tela não esconde a regra). */
const NOTA: Record<string, string> = {
  faturamento: "Recebimentos confirmados no período (Pix, cartão, boleto e dinheiro), pela data do pagamento.",
  ticket: "Valor médio de cada recebimento confirmado no período.",
  concluidas: "OS que ficaram prontas ou foram entregues no período.",
  tempo: "Do envio do orçamento até a aprovação do cliente, nas OS aprovadas no período.",
  aprovacao: "Orçamentos aprovados sobre os decididos (aprovados e recusados) no período.",
}

function TabelaDoGrafico({ id, s, rotuloData, unidades, semanal }: { id: string; s: SerieIndicador; rotuloData: (i: number) => string; unidades: boolean; semanal: boolean }) {
  type Linha = { i: number; v: number; c?: number }
  const linhas: Linha[] = s.valores.map((v, i) => ({ i, v, c: s.comparacao?.[i] })).reverse()
  const f = (x?: number) => (x === undefined || !Number.isFinite(x) ? "Sem registro" : s.formatar(x))
  const colunas: ColunaDados<Linha>[] = [
    { id: "data", titulo: semanal ? "Semana" : "Dia", tipo: "texto", valor: (l) => rotuloData(l.i) },
    { id: "v", titulo: unidades ? "Pampulha" : "No período", tipo: "numero", largura: "10rem", valor: (l) => f(l.v) },
    { id: "c", titulo: unidades ? "Contagem" : "Período anterior", tipo: "numero", largura: "10rem", valor: (l) => f(l.c) },
  ]
  return (
    <section id={id} aria-label={`${s.rotulo} por ${semanal ? "semana" : "dia"}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 xl:block">
      <header className="px-1 xl:hidden"><h2 className="t-card">{s.rotulo} por {semanal ? "semana" : "dia"}</h2></header>
      <TabelaDados<Linha> titulo={`${s.rotulo} por ${semanal ? "semana" : "dia"}`} colunas={colunas} linhas={linhas} idDe={(l) => String(l.i)}
        contagem={<><span className="num">{linhas.length}</span> {semanal ? (linhas.length === 1 ? "semana" : "semanas") : (linhas.length === 1 ? "dia" : "dias")}</>} />
    </section>
  )
}

function CardOperacao({ icone: I, titulo, valor, detalhe, link }: { icone: typeof UserCheck; titulo: string; valor: string; detalhe: React.ReactNode; link: { rotulo: string; href: string } }) {
  return (
    <Superficie como="section" aria-label={titulo} className="flex h-full min-w-0 flex-col gap-2 p-3 sm:p-4">
      <header className="flex min-h-8 items-center justify-between gap-2">
        <h3 className="t-rotulo truncate" title={titulo}>{titulo}</h3>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)] text-muted-foreground max-sm:hidden"><I className="size-4" aria-hidden="true" /></span>
      </header>
      <p className="t-kpi num text-[1.5rem]">{valor}</p>
      <p className="text-xs text-pretty text-muted-foreground sm:text-sm">{detalhe}</p>
      <a href={url(link.href)} className="link-sistema mt-auto inline-flex min-h-10 items-center self-start text-sm">{link.rotulo}</a>
    </Superficie>
  )
}

export function EsqueletoRelatorio() {
  return (
    <Superficie className="grid gap-4 p-4 md:p-5">
      <Esqueleto className="h-5 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Esqueleto key={i} className="h-24 rounded-[calc(var(--raio-sup)*0.6)]" />)}</div>
      {/* eixos e linha cinza no lugar do gráfico */}
      <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="h-[240px] w-full" aria-hidden="true">
        {[60, 120, 180].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="var(--border)" vectorEffect="non-scaling-stroke" />)}
        <path d="M0,170 L100,140 L200,150 L300,112 L400,124 L500,92 L600,104" fill="none" stroke="color-mix(in oklch, var(--muted-foreground) 30%, transparent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
    </Superficie>
  )
}
