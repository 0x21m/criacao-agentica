// Módulo Financeiro (5.7) · /financeiro/caixa/: abertura e fechamento do caixa do dia, por unidade (segmentado do
// banner, ?unidade=). Fechar em 3 etapas: contar o dinheiro (teclado numérico do arsenal), conferir esperado × contado
// por meio (o esperado rola como odômetro até o contado: número deslizante) e deslizar para fechar (deslizar para
// confirmar; diferença ≠ 0 pede motivo antes). Fechado é terminal: sai o comprovante impresso e não há Editar ("Ajustes
// viram lançamento novo."). No celular as etapas vêm uma por vez; no desktop, lado a lado. Embaixo, o histórico.
import { Suspense, lazy, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Lock, Vault } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { NumeroDeslizante } from "@/colecao/numero-deslizante"
import { DeslizarParaConfirmar } from "@/colecao/deslizar-para-confirmar"
import { TecladoNumerico } from "@/components/mift/fluxos/teclado-numerico"
import { CampoMoeda } from "@/components/mift/fluxos/campos-br"
import { BotaoLiquido } from "@/components/movimento"
import { useProcessando } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { moeda as moedaBase, dataPorExtenso } from "@/lib/formato"
/** Dinheiro com o sinal de menos tipográfico (−R$ 3.420,00). */
const moeda = (v: number) => moedaBase(v).replace("-", "−")
import { cn } from "@/lib/utils"
import { MEIOS, MEIOS_ORDEM, abrirCaixa, caixaDoDia, caixas, esperadoNoCaixa, fecharCaixa, lancamentos, type Caixa as TCaixa } from "../dados"

const ComprovanteImpresso = lazy(() => import("@/colecao/comprovante-impresso").then((m) => ({ default: m.ComprovanteImpresso })))
const UNIDADES_VISTA = (Object.keys(UNIDADES) as Unidade[]).map((u) => ({ id: u, rotulo: UNIDADES[u].nome }))
const OPCOES_MOEDA: Intl.NumberFormatOptions = { style: "currency", currency: "BRL" }
const diaCurto = (data: string) => new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
const hora = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "")
const primeiroNome = (n?: string) => n?.split(" ")[0] ?? ""
const comSinal = (v: number) => (v > 0 ? "+" : "") + moeda(v)

/** "Caixa de 14/11 fechado por Helena às 18:12. Ajustes viram lançamento novo." */
const fraseFechado = (cx: TCaixa) => `Caixa de ${diaCurto(cx.data)} fechado por ${primeiroNome(cx.fechadoPor)} às ${hora(cx.fechadoEm)}. Ajustes viram lançamento novo.`

export default function Caixa() {
  const [f, setF] = useParametrosDaUrl({ unidade: "pampulha", ver: "" })
  const unidade = (f.unidade in UNIDADES ? f.unidade : "pampulha") as Unidade
  const lista = caixas.use()
  const lans = lancamentos.use()
  const agora = useAgora()
  const cx = caixaDoDia(lista, unidade, agora)
  const historico = useMemo(() => lista.filter((c) => c.unidade === unidade && c.estado === "fechado" && c.id !== cx?.id).sort((a, b) => b.data.localeCompare(a.data)), [lista, unidade, cx?.id])
  const aberto = lista.find((c) => c.id === f.ver) ?? null

  return (
    <>
      <CabecalhoPagina
        titulo="Caixa do dia"
        descricao={<span className="first-letter:uppercase">{dataPorExtenso(agora)}</span>}
        vistas={UNIDADES_VISTA}
        vista={unidade}
        aoMudarVista={(u) => setF({ unidade: u })}
      />
      <div className="grid gap-5 px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="financeiro_painel" area="do financeiro" rotulo="o caixa do dia"
          esqueleto={<div className="grid gap-3 lg:grid-cols-2"><Esqueleto className="h-80 rounded-[var(--raio-sup)]" /><Esqueleto className="h-80 rounded-[var(--raio-sup)]" /></div>}
          estaVazio={lista.length === 0}
          vazio={<EstadoVazio icone={Vault} titulo="Nenhum caixa aberto ainda." texto="O caixa de hoje aparece aqui quando alguém abrir a gaveta com o troco do dia." />}
        >
          {() => (
            <>
              {!cx ? <AbrirCaixa key={unidade} unidade={unidade} />
                : cx.estado === "aberto" ? <Fechamento key={cx.id} cx={cx} esperado={esperadoNoCaixa(cx, lans)} />
                : <Fechado cx={cx} />}
              <Historico lista={historico} abrir={(id) => setF({ ver: id })} />
            </>
          )}
        </ComDados>
      </div>
      <FolhaDeDetalhe aberto={!!aberto} aoFechar={() => setF({ ver: "" })} sobre={aberto?.id} titulo={aberto ? `Caixa de ${diaCurto(aberto.data)} · ${UNIDADES[aberto.unidade].nome}` : ""}>
        {aberto && <ResumoFechado cx={aberto} />}
      </FolhaDeDetalhe>
    </>
  )
}

function AbrirCaixa({ unidade }: { unidade: Unidade }) {
  const papel = usePapel()
  const [troco, setTroco] = useState<number | null>(20000)
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = useProcessando().size > 0
  const podeAbrir = pode(papel, "fechar_caixa")
  async function abrir() {
    if (troco === null) return setErro("Digite o troco, mesmo que seja R$ 0,00.")
    setErro(null)
    const r = await abrirCaixa(unidade, troco / 100)
    if (!r.ok) setErro(r.mensagem)
  }
  return (
    <Superficie como="section" aria-labelledby="abrir-titulo" className="grid max-w-xl gap-4 p-4 md:p-5">
      <header className="grid gap-1">
        <h2 id="abrir-titulo" className="t-card">O caixa de {UNIDADES[unidade].nome} ainda não abriu hoje</h2>
        <p className="text-sm text-pretty text-muted-foreground">Abra com o troco que está na gaveta. Os recebimentos do balcão em dinheiro entram nele até o fechamento.</p>
      </header>
      {podeAbrir ? (
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void abrir() }}>
          <div className="grid gap-1.5">
            <Label htmlFor="troco">Troco inicial</Label>
            <CampoMoeda id="troco" valor={troco} aoMudar={setTroco} invalido={!!erro} descritoPor="troco-msg" className="max-w-56" />
            <p id="troco-msg" className={cn("min-h-4 text-xs", erro ? "text-negativo-texto" : "text-muted-foreground")} aria-live="polite">{erro ?? "Conte as notas e moedas antes de abrir."}</p>
          </div>
          <BotaoLiquido type="submit" className="min-w-[11rem] justify-self-start" disabled={ocupado}><Vault className="size-4" /> {ocupado ? "Abrindo…" : "Abrir o caixa"}</BotaoLiquido>
        </form>
      ) : <p className="text-sm text-muted-foreground">Seu papel não abre o caixa. Peça a quem fecha o caixa da unidade.</p>}
    </Superficie>
  )
}

function Fechamento({ cx, esperado }: { cx: TCaixa; esperado: Record<keyof typeof MEIOS, number> }) {
  const papel = usePapel()
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [texto, setTexto] = useState("")
  const [contado, setContado] = useState<number | null>(null)
  const [motivo, setMotivo] = useState("")
  const dinheiro = esperado.dinheiro
  const diferenca = contado === null ? 0 : Math.round((contado - dinheiro) * 100) / 100
  const faltaMotivo = contado !== null && diferenca !== 0 && motivo.trim().length < 3
  // odômetro: o contado começa no esperado e rola até o valor contado quando a conferência aparece
  const [mostrado, setMostrado] = useState(dinheiro)
  useEffect(() => {
    if (contado === null) { setMostrado(dinheiro); return }
    const t = setTimeout(() => setMostrado(contado), 180)
    return () => clearTimeout(t)
  }, [contado, dinheiro, etapa])
  const podeFechar = pode(papel, "fechar_caixa")
  const outros = MEIOS_ORDEM.filter((m) => m !== "dinheiro")
  const passo = etapa === 1 ? 1 : contado !== null && !faltaMotivo ? 3 : 2

  return (
    <section aria-label={`Fechamento do caixa de ${UNIDADES[cx.unidade].nome}`} className="grid gap-3">
      <ol className="flex items-center gap-2 px-1 text-xs text-muted-foreground" aria-label="Etapas do fechamento">
        {["Contar", "Conferir", "Fechar"].map((n, i) => (
          <li key={n} aria-current={passo === i + 1 ? "step" : undefined} className={cn("flex items-center gap-1.5", passo === i + 1 && "font-medium text-foreground")}>
            <span className={cn("grid size-5 place-items-center rounded-full text-[11px]", passo >= i + 1 ? "bg-primary text-primary-foreground" : "bg-muted")}>{i + 1}</span>{n}
            {i < 2 && <span aria-hidden="true" className="mx-1 h-px w-4 bg-border" />}
          </li>
        ))}
      </ol>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-stretch">
        <Superficie como="section" aria-labelledby="contar-titulo" className={cn("grid content-start gap-4 p-4 md:p-5", etapa !== 1 && "max-lg:hidden")}>
          <header className="grid gap-1">
            <h2 id="contar-titulo" className="t-card">1. Contar o dinheiro</h2>
            <p className="text-sm text-pretty text-muted-foreground">Aberto por {primeiroNome(cx.abertoPor)} às {hora(cx.abertoEm)} com <span className="num whitespace-nowrap">{moeda(cx.saldoInicial)}</span> de troco. Conte notas e moedas da gaveta.</p>
          </header>
          <TecladoNumerico rotulo="Dinheiro contado" tipo="dinheiro" valor={texto} max={999999}
            aoMudar={(t, n) => { setTexto(t); setContado(n) }}
            descricao="Inclua o troco do começo do dia."
            aoConfirmar={(n) => { if (n === null) return { ok: false, motivo: "Digite o valor contado, mesmo que seja R$ 0,00." }; setContado(n); setEtapa(2) }}
            rotuloConfirmar="Conferir" />
        </Superficie>

        <Superficie como="section" aria-labelledby="conferir-titulo" className={cn("grid content-start gap-4 p-4 md:p-5", etapa === 1 && "max-lg:hidden")}>
          <header className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <h2 id="conferir-titulo" className="t-card">2. Conferir e fechar</h2>
              <p className="text-sm text-pretty text-muted-foreground">Esperado é o troco mais o que entrou em dinheiro hoje nesta unidade.</p>
            </div>
            <Button variant="ghost" size="sm" className="h-10 lg:hidden" onPress={() => setEtapa(1)}><ArrowLeft /> Recontar</Button>
          </header>
          <dl className="grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Esperado em dinheiro</dt>
              <dd className="t-kpi num mt-1 text-[1.25rem] whitespace-nowrap md:text-[1.5rem]">{moeda(dinheiro)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Contado</dt>
              <dd className="t-kpi mt-1 text-[1.25rem] whitespace-nowrap md:text-[1.5rem]">{contado === null ? <span className="text-muted-foreground">—</span> : <NumeroDeslizante valor={mostrado} opcoes={OPCOES_MOEDA} anunciar />}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Diferença</dt>
              <dd className={cn("t-kpi num mt-1 text-[1.25rem] whitespace-nowrap md:text-[1.5rem]", diferenca < 0 && "text-[var(--negative)]", diferenca > 0 && "text-[var(--positive)]")}>{contado === null ? "—" : comSinal(diferenca)}</dd>
            </div>
          </dl>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] px-3 py-2.5 text-sm sm:grid-cols-4">
            {outros.map((m) => (
              <div key={m} className="min-w-0">
                <dt className="text-xs text-muted-foreground" title={`${MEIOS[m]}: conferido no extrato`}>{MEIOS[m]}</dt>
                <dd className="num">{moeda(esperado[m])}</dd>
              </div>
            ))}
          </dl>
          {contado !== null && diferenca !== 0 && (
            <div className="grid gap-1.5">
              <Label htmlFor="motivo-dif">Motivo da diferença de {comSinal(diferenca)}</Label>
              <Textarea id="motivo-dif" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={faltaMotivo || undefined} aria-describedby="motivo-dif-msg" />
              <p id="motivo-dif-msg" className="text-xs text-muted-foreground" aria-live="polite">{faltaMotivo ? "Diga o motivo antes de deslizar (pelo menos 3 letras)." : "Fica no histórico do caixa."}</p>
            </div>
          )}
          {podeFechar && contado === null ? (
            <p className="text-sm text-muted-foreground"><span className="max-lg:hidden">Digite o valor contado ao lado e toque em Conferir</span><span className="lg:hidden">Conte o dinheiro primeiro</span>: o controle de fechar aparece aqui.</p>
          ) : podeFechar ? (
            <div className="grid gap-2">
              <DeslizarParaConfirmar
                rotulo={contado === null ? "Conte o dinheiro para fechar" : `Deslize para fechar com ${moeda(contado)}`}
                rotuloCurto={contado === null ? "Conte primeiro" : "Fechar o caixa"}
                rotuloAndamento="Fechando" rotuloFeito="Caixa fechado"
                desabilitado={contado === null || faltaMotivo}
                aoConfirmar={async () => {
                  const r = await fecharCaixa(cx, contado ?? 0, motivo)
                  return r.ok ? { ok: true } : { ok: false, motivo: r.mensagem }
                }} />
            </div>
          ) : <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" aria-hidden="true" /> Seu papel não fecha o caixa.</p>}
        </Superficie>
      </div>
    </section>
  )
}

function Fechado({ cx }: { cx: TCaixa }) {
  return (
    <Superficie como="section" aria-labelledby="fechado-titulo" className="grid gap-5 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:p-5">
      <div className="grid content-start gap-4">
        <header className="grid gap-1">
          <h2 id="fechado-titulo" className="t-card flex items-center gap-2"><Lock className="size-4 text-muted-foreground" aria-hidden="true" /> Caixa fechado</h2>
          <p className="text-sm text-pretty">{fraseFechado(cx)}</p>
        </header>
        <ResumoNumeros cx={cx} />
      </div>
      <Suspense fallback={<Esqueleto className="h-[30rem] w-72 rounded-3xl" />}>
        <ComprovanteImpresso
          estabelecimento={`Oficina Norte · ${UNIDADES[cx.unidade].nome}`}
          data={`${diaCurto(cx.data)} às ${hora(cx.fechadoEm)}`}
          codigo={cx.id}
          dados={[
            { rotulo: "Troco inicial", valor: moeda(cx.saldoInicial) },
            { rotulo: "Esperado em dinheiro", valor: moeda(cx.esperado ?? 0) },
            { rotulo: "Diferença", valor: comSinal(cx.diferenca ?? 0) },
            ...MEIOS_ORDEM.filter((m) => m !== "dinheiro" && (cx.porMeio?.[m] ?? 0) !== 0).map((m) => ({ rotulo: MEIOS[m], valor: moeda(cx.porMeio![m]!) })),
            { rotulo: "Fechado por", valor: cx.fechadoPor ?? "" },
          ]}
          total={cx.contado}
          rotuloDoTotal="Contado em dinheiro"
          mensagem={cx.motivo ? `Diferença: ${cx.motivo}` : "Sem diferença. Bom descanso!"}
          className="justify-self-center"
        />
      </Suspense>
    </Superficie>
  )
}

function ResumoNumeros({ cx }: { cx: TCaixa }) {
  return (
    <dl className="grid max-w-md grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Esperado em dinheiro</dt><dd className="num text-right">{moeda(cx.esperado ?? 0)}</dd>
      <dt className="text-muted-foreground">Contado</dt><dd className="num text-right">{moeda(cx.contado ?? 0)}</dd>
      <dt className="text-muted-foreground">Diferença</dt><dd className={cn("num text-right", (cx.diferenca ?? 0) < 0 && "text-negativo-texto")}>{comSinal(cx.diferenca ?? 0)}</dd>
      {cx.motivo && <><dt className="text-muted-foreground">Motivo</dt><dd className="text-right text-pretty">{cx.motivo}</dd></>}
      {MEIOS_ORDEM.filter((m) => m !== "dinheiro").map((m) => (
        <div key={m} className="contents"><dt className="text-muted-foreground">{MEIOS[m]}</dt><dd className="num text-right">{moeda(cx.porMeio?.[m] ?? 0)}</dd></div>
      ))}
    </dl>
  )
}

function ResumoFechado({ cx }: { cx: TCaixa }) {
  return (
    <>
      <p role="status" className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm text-pretty">{fraseFechado(cx)}</p>
      <ResumoNumeros cx={cx} />
      <section aria-labelledby="hist-cx">
        <h3 id="hist-cx" className="t-card mb-2">Linha do tempo</h3>
        <LinhaDoTempo eventos={cx.historico} />
      </section>
    </>
  )
}

function Historico({ lista, abrir }: { lista: TCaixa[]; abrir: (id: string) => void }) {
  const colunas: ColunaDados<TCaixa>[] = [
    { id: "data", titulo: "Dia", tipo: "id", largura: "7rem", texto: (c) => diaCurto(c.data),
      valor: (c) => <button type="button" onClick={() => abrir(c.id)} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")}</button> },
    { id: "esperado", titulo: "Esperado", tipo: "moeda", largura: "8.5rem", valor: (c) => moeda(c.esperado ?? 0) },
    { id: "contado", titulo: "Contado", tipo: "moeda", largura: "8.5rem", valor: (c) => moeda(c.contado ?? 0) },
    { id: "dif", titulo: "Diferença", tipo: "moeda", largura: "7.5rem", valor: (c) => <span className={(c.diferenca ?? 0) < 0 ? "text-negativo-texto" : undefined}>{comSinal(c.diferenca ?? 0)}</span>, texto: (c) => comSinal(c.diferenca ?? 0) },
    { id: "motivo", titulo: "Motivo", tipo: "texto", valor: (c) => <span className="block truncate pl-4" title={c.motivo}>{c.motivo ?? "—"}</span>, texto: (c) => c.motivo ?? "" },
    { id: "quem", titulo: "Fechado por", tipo: "pessoa", largura: "9rem", valor: (c) => `${primeiroNome(c.fechadoPor)} · ${hora(c.fechadoEm)}` },
  ]
  if (!lista.length) return null
  return (
    <section aria-label="Fechamentos anteriores" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 xl:block">
      <TabelaDados<TCaixa> titulo="Fechamentos anteriores" tituloNosCartoes colunas={colunas} linhas={lista} idDe={(c) => c.id}
        contagem={<><span className="num">{lista.length}</span> dias</>} aoAbrir={(c) => abrir(c.id)}
        cartao={(c) => (
          <>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")}</span>
              <span className="text-xs text-muted-foreground">{primeiroNome(c.fechadoPor)} · {hora(c.fechadoEm)}</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="num text-muted-foreground">{moeda(c.esperado ?? 0)} → {moeda(c.contado ?? 0)}</span>
              <span className={cn("num font-medium", (c.diferenca ?? 0) < 0 && "text-negativo-texto")}>{comSinal(c.diferenca ?? 0)}</span>
            </div>
            {c.motivo && <p className="text-xs text-pretty text-muted-foreground">{c.motivo}</p>}
          </>
        )} />
    </section>
  )
}
