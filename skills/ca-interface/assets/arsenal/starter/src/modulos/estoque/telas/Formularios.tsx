// Formulários do Estoque (pesados: teclado numérico, número deslizante, React Aria): o campo de quantidade, a diferença
// que desliza, o ajuste de saldo (P) e a transferência entre unidades (P). Baixam só quando alguém abre um ajuste, um
// lote, um recebimento ou a folha do produto.
import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { NumeroDeslizante } from "@/colecao/numero-deslizante"
import { TecladoNumerico } from "@/components/mift/fluxos/teclado-numerico"
import { useIsMobile } from "@/hooks/use-mobile"
import { useProcessando } from "@/proto/dados"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { cn } from "@/lib/utils"
import { MOTIVOS_AJUSTE, UNIDADES_ESTOQUE, ajustarSaldo, transferir, type Produto } from "../dados"
// ---------- quantidade ----------
/** − [número] +, com alvos de 40 px; o número desliza ao mudar (numero-deslizante do arsenal). */
export function CampoQuantidade({ rotulo, valor, aoMudar, min = 0, max = 9999, id }: { rotulo: string; valor: number; aoMudar: (n: number) => void; min?: number; max?: number; id?: string }) {
  const limitar = (n: number) => Math.min(max, Math.max(min, Math.round(n || 0)))
  return (
    <div role="group" aria-label={rotulo} className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" className="size-10 rounded-full" aria-label={`Diminuir ${rotulo.toLowerCase()}`} isDisabled={valor <= min} onPress={() => aoMudar(limitar(valor - 1))}><Minus /></Button>
      <input id={id} type="number" inputMode="numeric" min={min} max={max} value={valor} aria-label={rotulo}
        onChange={(e) => aoMudar(limitar(Number(e.target.value)))}
        className="num h-10 w-16 rounded-lg border border-input bg-transparent text-center text-base font-semibold outline-none [appearance:textfield] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-inner-spin-button]:appearance-none" />
      <Button type="button" variant="outline" size="icon" className="size-10 rounded-full" aria-label={`Aumentar ${rotulo.toLowerCase()}`} isDisabled={valor >= max} onPress={() => aoMudar(limitar(valor + 1))}><Plus /></Button>
    </div>
  )
}

/** Diferença com sinal, deslizando: "+3", "−2", "0". */
export function Diferenca({ valor, className }: { valor: number; className?: string }) {
  return (
    <span className={cn("num inline-flex items-baseline font-semibold", valor > 0 ? "text-positive" : valor < 0 ? "text-negativo-texto" : "text-muted-foreground", className)}>
      <span aria-hidden="true">{valor > 0 ? "+" : valor < 0 ? "−" : ""}</span>
      <NumeroDeslizante valor={Math.abs(valor)} />
    </span>
  )
}

const campo = "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 max-sm:text-base"

/**
 * Ajuste de saldo (P, EST-21): a unidade, o saldo contado e o motivo obrigatório. Nada muda antes da resposta; o
 * botão diz "Enviando…" com a mesma largura e a falha (conexão, conflito, papel) aparece aqui.
 * No celular, o saldo contado entra pelo teclado numérico de teclas grandes (contagem no depósito).
 */
export function FormAjuste({ p, unidadeInicial = "pampulha", aoTerminar, compacto = false }: {
  p: Produto; unidadeInicial?: Unidade; aoTerminar: () => void; compacto?: boolean
}) {
  const celular = useIsMobile(640)
  const processando = useProcessando()
  const [unidade, setUnidade] = useState<Unidade>(unidadeInicial)
  const [contado, setContado] = useState(p.saldo[unidadeInicial])
  const [texto, setTexto] = useState(String(p.saldo[unidadeInicial]))
  const [motivo, setMotivo] = useState("")
  const [tentou, setTentou] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const enviando = processando.has(p.id)
  const delta = contado - p.saldo[unidade]
  const falta = !motivo
  const trocarUnidade = (u: Unidade) => { setUnidade(u); setContado(p.saldo[u]); setTexto(String(p.saldo[u])) }
  async function enviar() {
    setTentou(true)
    if (falta || enviando || delta === 0) return
    setErro(null)
    const r = await ajustarSaldo(p, unidade, contado, motivo)
    if (r.ok) aoTerminar(); else setErro(r.mensagem)
  }
  const idMotivo = `motivo-${p.id}${compacto ? "-r" : ""}`
  return (
    <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
      {/* no popover a unidade já veio da célula; na folha, escolhe aqui */}
      {!compacto && <SegmentadoDeVidro aria-label="Unidade" valor={unidade} aoMudar={(u) => trocarUnidade(u as Unidade)}
        opcoes={UNIDADES_ESTOQUE.map((u) => ({ id: u, rotulo: UNIDADES[u].nome }))} />}
      {celular && !compacto ? (
        <TecladoNumerico rotulo={`Saldo contado em ${UNIDADES[unidade].nome}`} valor={texto} max={9999}
          aoMudar={(t, n) => { setTexto(t); setContado(n ?? 0) }} descricao={`No sistema: ${p.saldo[unidade]}`} className="max-w-none" />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Saldo contado</span>
            <CampoQuantidade rotulo="Saldo contado" valor={contado} aoMudar={(n) => { setContado(n); setTexto(String(n)) }} />
          </div>
          <div className="grid gap-1 text-right">
            <span className="text-xs text-muted-foreground">No sistema <span className="num">{p.saldo[unidade]}</span></span>
            <span className="text-sm">Diferença <Diferenca valor={delta} /></span>
          </div>
        </div>
      )}
      <label htmlFor={idMotivo} className="grid gap-1 text-xs text-muted-foreground">Motivo (obrigatório)
        <select id={idMotivo} className={campo} value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={tentou && falta ? true : undefined}>
          <option value="" className="bg-[Canvas] text-[CanvasText]">Escolha o motivo</option>
          {MOTIVOS_AJUSTE.map((m) => <option key={m} value={m} className="bg-[Canvas] text-[CanvasText]">{m}</option>)}
        </select>
      </label>
      {tentou && falta && <p className="text-xs text-negativo-texto" role="alert">Escolha o motivo: ele fica na movimentação.</p>}
      {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">{erro}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onPress={aoTerminar} isDisabled={enviando}>Voltar</Button>
        <Button type="submit" isPending={enviando} isDisabled={delta === 0 && !enviando} className="min-w-[9.5rem]">
          {enviando ? "Enviando…" : delta === 0 ? "Sem diferença" : "Ajustar saldo"}
        </Button>
      </div>
    </form>
  )
}


/** Transferir entre unidades (P): duas movimentações. A quantidade não passa do saldo da origem. */
export function FormTransferir({ p, aoTerminar }: { p: Produto; aoTerminar: () => void }) {
  const processando = useProcessando()
  const [de, setDe] = useState<Unidade>(p.saldo.pampulha >= p.saldo.contagem ? "pampulha" : "contagem")
  const para: Unidade = de === "pampulha" ? "contagem" : "pampulha"
  const [qtd, setQtd] = useState(Math.min(1, p.saldo[de]))
  const [erro, setErro] = useState<string | null>(null)
  const enviando = processando.has(p.id)
  async function enviar() {
    if (enviando || qtd < 1) return
    setErro(null)
    const r = await transferir(p, de, para, qtd)
    if (r.ok) aoTerminar(); else setErro(r.mensagem)
  }
  return (
    <form aria-label="Transferir entre unidades" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
      <h3 className="t-card">Transferir entre unidades</h3>
      <SegmentadoDeVidro aria-label="Sai de" valor={de} aoMudar={(u) => { setDe(u as Unidade); setQtd(Math.min(qtd, p.saldo[u as Unidade])) }}
        opcoes={UNIDADES_ESTOQUE.map((u) => ({ id: u, rotulo: `De ${UNIDADES[u].nome}` }))} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CampoQuantidade rotulo="Quantidade" valor={qtd} aoMudar={setQtd} min={0} max={p.saldo[de]} />
        <span className="text-xs text-muted-foreground">Fica <span className="num text-foreground">{p.saldo[de] - qtd}</span> em {UNIDADES[de].nome} e <span className="num text-foreground">{p.saldo[para] + qtd}</span> em {UNIDADES[para].nome}</span>
      </div>
      {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">{erro}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onPress={aoTerminar} isDisabled={enviando}>Voltar</Button>
        <Button type="submit" isPending={enviando} isDisabled={qtd < 1 && !enviando} className="min-w-[9.5rem]">{enviando ? "Enviando…" : `Transferir ${qtd}`}</Button>
      </div>
    </form>
  )
}
