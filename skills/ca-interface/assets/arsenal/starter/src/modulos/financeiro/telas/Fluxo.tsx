// Módulo Financeiro (5.7) · /financeiro/: fluxo de caixa. Banner compacto com o saldo de hoje (número deslizante, da
// coleção) e o menor saldo projetado; o gráfico avança sobre o banner (realizado em linha cheia, projetado tracejado até
// o fim do período, marca de alerta no pior dia negativo); embaixo, o bento do mês (padrões do finance-bento: cada card
// um papel, um número e uma régua) e o que vence nos próximos 7 dias.
// Arsenal: NumeroDeslizante (coleção), SegmentadoDeVidro (coleção), BotaoLiquido (kit de movimento), GraficoFluxo
// (GraficoQueDesenha adaptado), finance-bento (padrões, na Superficie), TabelaDados.
import { useMemo } from "react"
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, CalendarRange, Vault } from "lucide-react"
import { Superficie } from "@/components/sistema/Superficie"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { NumeroDeslizante } from "@/colecao/numero-deslizante"
import { BotaoLiquido } from "@/components/movimento"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { Button } from "@/components/ui/button"
import { useConfig } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { pode, usePapel } from "@/proto/permissoes"
import { moeda as moedaBase, percentual } from "@/lib/formato"
/** Dinheiro com o sinal de menos tipográfico (−R$ 3.420,00). */
const moeda = (v: number) => moedaBase(v).replace("-", "−")
import { url } from "@/lib/url"
import { emAberto, lancamentos, nomeDe, resumo, saldoHoje, serieDoFluxo, diasEntre, type Lancamento } from "../dados"
import { GraficoFluxo } from "./GraficoFluxo"
import { Kpi, ReguaVencidos, SeloLancamento, dataVenc } from "./comum"

const PERIODOS = [{ id: "trimestre", rotulo: "3 meses" }, { id: "mes", rotulo: "Este mês" }]
const OPCOES_MOEDA: Intl.NumberFormatOptions = { style: "currency", currency: "BRL" }
const MES = (d: Date) => d.toLocaleDateString("pt-BR", { month: "long" })

export default function Fluxo() {
  const lista = lancamentos.use()
  const agora = useAgora()
  const papel = usePapel()
  const { estado } = useConfig()
  const [f, setF] = useParametrosDaUrl({ periodo: "trimestre" })
  const mes = f.periodo === "mes"
  const de = new Date(agora.getFullYear(), agora.getMonth() - (mes ? 0 : 1), 1)
  const ate = new Date(agora.getFullYear(), agora.getMonth() + (mes ? 1 : 2), 0)
  const chaveDia = agora.toDateString()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pontos = useMemo(() => serieDoFluxo(lista, agora, de, ate), [lista, chaveDia, f.periodo])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const r = useMemo(() => resumo(lista, agora), [lista, chaveDia])
  const saldo = useMemo(() => saldoHoje(lista, agora), [lista, agora])
  const projetados = pontos.filter((p) => p.projetado)
  const pior = projetados.length ? projetados.reduce((a, b) => (b.saldo < a.saldo ? b : a)) : null
  const mostraNumeros = pode(papel, "financeiro_painel") && estado === "dados" && lista.length > 0
  const nomeMes = MES(agora)

  return (
    <div className="pb-6">
      <BannerSobreposto
        variante="compacta"
        titulo="Fluxo de caixa"
        descricao={`Realizado até hoje e projetado até ${ate.toLocaleDateString("pt-BR")}, nas duas unidades`}
        acoes={pode(papel, "fechar_caixa") && <BotaoLiquido href={url("financeiro/caixa/")}><Vault className="size-4" /> Fechar o caixa</BotaoLiquido>}
        conteudoDoBanner={mostraNumeros && (
          <dl className="kpis-banner flex flex-wrap gap-x-8 gap-y-3 @3xl/banner:ml-auto @3xl/banner:mr-4">
            <Kpi rotulo="Saldo hoje" valor={<NumeroDeslizante valor={saldo} opcoes={OPCOES_MOEDA} />} detalhe="em conta, realizado" />
            {pior && <Kpi rotulo="Menor saldo projetado" tom={pior.saldo < 0 ? "perigo" : undefined} valor={moeda(pior.saldo)} detalhe={`em ${pior.dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`} />}
          </dl>
        )}
        sobreposicao={40}
      >
        <ComDados
          capacidade="financeiro_painel" area="do financeiro" rotulo="o fluxo de caixa"
          estaVazio={lista.length === 0}
          esqueleto={<EsqueletoFluxo />}
          vazio={<EstadoVazio icone={CalendarRange} titulo="Nenhum lançamento neste período." texto="Os recebimentos e as contas aparecem aqui assim que forem lançados."
            acao={<Button variant="outline" onPress={() => setF({ periodo: mes ? "trimestre" : "mes" })}>Mudar período</Button>} />}
        >
          {() => (
            <Superficie como="section" aria-labelledby="titulo-saldo" className="grid gap-4 p-4 md:p-5">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="titulo-saldo" className="t-card">Saldo dia a dia</h2>
                  <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda">
                    <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-[var(--chart-1)]" /> Realizado</li>
                    <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0 w-4 border-t-2 border-dashed border-[var(--chart-1)]" /> Projetado (em aberto e previstos)</li>
                  </ul>
                </div>
                <div className="w-52 shrink-0"><SegmentadoDeVidro aria-label="Período" opcoes={PERIODOS} valor={f.periodo} aoMudar={(periodo) => setF({ periodo })} /></div>
              </header>
              <GraficoFluxo key={f.periodo} pontos={pontos} />
              {pior && pior.saldo < 0 && (
                <p className="text-sm text-pretty text-muted-foreground">
                  Para não ficar no vermelho: <a className="link-sistema" href={url("financeiro/receber/")}>cobre os títulos vencidos</a> ou{" "}
                  <a className="link-sistema" href={url("financeiro/pagar/")}>reveja as contas</a> que vencem até {pior.dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}.
                </p>
              )}
            </Superficie>
          )}
        </ComDados>
      </BannerSobreposto>

      {mostraNumeros && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-3 pt-4 md:px-6">
          <section aria-label={`Resumo de ${nomeMes}`} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CardResumo titulo={`Entradas em ${nomeMes}`} icone={ArrowDownToLine} valor={r.entradas}
              detalhe={<Comparacao atual={r.entradas} anterior={r.entradasAnterior} agora={agora} />}
              link={{ rotulo: "Ver recebidos", href: "financeiro/receber/?situacao=encerrados" }} />
            <CardResumo titulo={`Saídas em ${nomeMes}`} icone={ArrowUpFromLine} valor={r.saidas}
              detalhe={<Comparacao atual={r.saidas} anterior={r.saidasAnterior} agora={agora} />}
              link={{ rotulo: "Ver pagos", href: "financeiro/pagar/?situacao=encerrados" }} />
            <CardResumo titulo="A receber" icone={ArrowDownToLine} valor={r.aReceber}
              detalhe={<VencidosDe valor={r.receberVencido} n={r.nReceberVencido} total={r.aReceber} rotulo="Vencido a receber" />}
              link={{ rotulo: "Contas a receber", href: "financeiro/receber/" }} />
            <CardResumo titulo="A pagar" icone={ArrowUpFromLine} valor={r.aPagar}
              detalhe={<VencidosDe valor={r.pagarVencido} n={r.nPagarVencido} total={r.aPagar} rotulo="Vencido a pagar" />}
              link={{ rotulo: "Contas a pagar", href: "financeiro/pagar/" }} />
          </section>
          <ProximosVencimentos lista={lista} agora={agora} />
        </div>
      )}
    </div>
  )
}

function CardResumo({ titulo, icone: I, valor, detalhe, link }: { titulo: string; icone: typeof Vault; valor: number; detalhe: React.ReactNode; link: { rotulo: string; href: string } }) {
  return (
    <Superficie como="section" aria-label={titulo} className="flex h-full flex-col gap-3 p-4 md:p-5">
      <header className="flex min-h-6 items-center justify-between gap-2">
        <h2 className="t-card truncate first-letter:uppercase" title={titulo}>{titulo}</h2>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)] text-muted-foreground"><I className="size-4" aria-hidden="true" /></span>
      </header>
      <p className="t-kpi num text-[1.375rem] whitespace-nowrap lg:text-[1.5rem]">{moeda(valor)}</p>
      <div className="grid gap-2 text-sm text-muted-foreground">{detalhe}</div>
      <a href={url(link.href)} className="link-sistema mt-auto inline-flex min-h-10 items-center gap-1 self-start text-sm">{link.rotulo} <ArrowRight className="size-3.5" aria-hidden="true" /></a>
    </Superficie>
  )
}

/** "R$ 12.400,00 vencidos · 6 títulos": o mesmo formato do total (moeda inteira), nunca a forma curta. */
function VencidosDe({ valor, n, total, rotulo }: { valor: number; n: number; total: number; rotulo: string }) {
  return (
    <>
      <ReguaVencidos total={total} vencido={valor} rotulo={rotulo} />
      <p>{n ? <><span className="num font-medium text-foreground">{moeda(valor)}</span> vencidos · {n} {n === 1 ? "título" : "títulos"}</> : "Nada vencido"}</p>
    </>
  )
}

function Comparacao({ atual, anterior, agora }: { atual: number; anterior: number; agora: Date }) {
  const ant = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
  const quando = `1 a ${agora.getDate()}/${String(ant.getMonth() + 1).padStart(2, "0")}`
  if (!anterior) return <p>Sem movimento no mesmo período do mês passado</p>
  const v = atual / anterior - 1
  return <p className="text-pretty"><span className="num font-medium text-foreground">{v >= 0 ? "+" : "−"}{percentual(Math.abs(v))}</span> sobre <span className="whitespace-nowrap">{quando} ({moeda(anterior)})</span></p>
}

function ProximosVencimentos({ lista, agora }: { lista: Lancamento[]; agora: Date }) {
  const linhas = useMemo(() => lista.filter((l) => emAberto(l) && diasEntre(agora, new Date(l.vencimento)) >= 0 && diasEntre(agora, new Date(l.vencimento)) <= 7)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento) || b.valor - a.valor), [lista, agora])
  const href = (l: Lancamento) => url(`financeiro/${l.natureza}/?id=${l.id}`)
  const colunas: ColunaDados<Lancamento>[] = [
    { id: "id", titulo: "Título", tipo: "id", largura: "6rem", valor: (l) => <a href={href(l)} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{l.id}</a>, texto: (l) => l.id },
    { id: "tipo", titulo: "Tipo", tipo: "texto", largura: "6rem", valor: (l) => (l.natureza === "receber" ? "Receber" : "Pagar") },
    { id: "descricao", titulo: "Descrição", tipo: "texto", valor: (l) => l.descricao },
    { id: "nome", titulo: "Cliente ou fornecedor", tipo: "texto", largura: "20%", valor: (l) => nomeDe(l) },
    { id: "situacao", titulo: "Situação", tipo: "status", largura: "12rem", valor: (l) => <SeloLancamento l={l} semData /> },
    { id: "venc", titulo: "Vence", tipo: "data", largura: "5rem", valor: (l) => dataVenc(l.vencimento, agora) },
    { id: "valor", titulo: "Valor", tipo: "moeda", largura: "8.5rem", valor: (l) => <span className={l.natureza === "pagar" ? "text-muted-foreground" : undefined}>{l.natureza === "pagar" ? "−" : ""}{moeda(l.valor)}</span>, texto: (l) => moeda(l.valor) },
  ]
  if (!linhas.length) return <EstadoVazio variante="concluido" icone={CalendarRange} titulo="Nada vence nos próximos 7 dias." />
  return (
    <section aria-label="Vencem nos próximos 7 dias" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 xl:block">
    <TabelaDados<Lancamento>
      titulo="Vencem nos próximos 7 dias"
      tituloNosCartoes
      colunas={colunas}
      linhas={linhas}
      idDe={(l) => l.id}
      contagem={<><span className="num">{linhas.length}</span> {linhas.length === 1 ? "lançamento" : "lançamentos"}</>}
      aoAbrir={(l) => location.assign(href(l))}
      cartao={(l) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <a href={href(l)} className="num rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{l.id}</a>
            <span className="flex max-w-[60%] min-w-0 justify-end"><SeloLancamento l={l} /></span>
          </div>
          <span className="block truncate text-sm" title={l.descricao}>{l.descricao}</span>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-xs text-muted-foreground" title={nomeDe(l)}>{l.natureza === "receber" ? "Receber de" : "Pagar a"} {nomeDe(l)}</span>
            <span className="num shrink-0 font-semibold">{l.natureza === "pagar" ? "−" : ""}{moeda(l.valor)}</span>
          </div>
        </>
      )}
    />
    </section>
  )
}

function EsqueletoFluxo() {
  return (
    <Superficie className="grid gap-4 p-4 md:p-5">
      <Esqueleto className="h-5 w-40" />
      {/* eixo e linha cinza no lugar do gráfico */}
      <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="h-[220px] w-full" aria-hidden="true">
        {[55, 110, 165].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
        <path d="M0,150 L100,130 L200,138 L300,110 L400,120 L500,150 L600,128" fill="none" stroke="var(--muted)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Esqueleto key={i} className="h-28 rounded-[var(--raio-sup)]" />)}</div>
    </Superficie>
  )
}

