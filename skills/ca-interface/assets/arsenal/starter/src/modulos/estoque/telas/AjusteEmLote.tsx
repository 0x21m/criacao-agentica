// Sheet "Ajustar saldo" do lote (5.6): os itens selecionados, uma unidade, o saldo contado de cada um e UM motivo
// obrigatório. Cada item é uma ação pessimista própria (EST-21): o que falhar fica na sheet com "2 de 5 ajustados.
// Tentar os 3 restantes." e o resto já gravou. Baixa só quando alguém abre o primeiro lote.
import { useMemo, useState } from "react"
import { RotateCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { useIsMobile } from "@/hooks/use-mobile"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { cn } from "@/lib/utils"
import { MOTIVOS_AJUSTE, UNIDADES_ESTOQUE, ajustarSaldo, produtos } from "../dados"
import { CampoQuantidade, Diferenca } from "./Formularios"

export default function AjusteEmLote({ ids, aoFechar }: { ids: string[]; aoFechar: (ok: boolean) => void }) {
  const celular = useIsMobile(640)
  const todos = produtos.use()
  const itens = useMemo(() => todos.filter((p) => ids.includes(p.id) && p.ativo), [todos, ids])
  const [unidade, setUnidade] = useState<Unidade>("pampulha")
  const [contado, setContado] = useState<Record<string, number>>({})
  const [motivo, setMotivo] = useState("")
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: number; total: number; mensagem: string } | null>(null)
  const valor = (id: string) => contado[`${unidade}:${id}`] ?? itens.find((p) => p.id === id)!.saldo[unidade]
  const mudados = itens.filter((p) => valor(p.id) !== p.saldo[unidade])
  const fechar = () => { if (!enviando) aoFechar(false) }

  async function enviar() {
    setTentou(true)
    if (!motivo || !mudados.length || enviando) return
    setEnviando(true); setResultado(null)
    const rs = await Promise.all(mudados.map((p) => ajustarSaldo(p, unidade, valor(p.id), motivo, true).then((r) => ({ p, r }))))
    setEnviando(false)
    const falhas = rs.filter((x) => !x.r.ok)
    const ok = rs.length - falhas.length
    if (!falhas.length) {
      toast.success(`${ok} ${ok === 1 ? "saldo ajustado" : "saldos ajustados"} em ${UNIDADES[unidade].nome}.`)
      aoFechar(true)
      return
    }
    // o que gravou sai da conta (o "contado" agora é o saldo); o que falhou continua com o valor digitado
    setResultado({ ok, total: rs.length, mensagem: falhas[0].r.ok ? "" : falhas[0].r.mensagem })
  }

  return (
    <Sheet isOpen onOpenChange={(o) => { if (!o) fechar() }} side={celular ? "bottom" : "right"} isDismissable={!enviando}
      className={cn("w-full gap-0", celular ? "max-h-[88dvh] rounded-t-[var(--radius-xl)]" : "sm:max-w-md")}>
      <SheetHeader className="shadow-[0_1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
        <SheetTitle className="pr-8 text-base">Ajustar saldo</SheetTitle>
        <SheetDescription className="text-pretty">{itens.length} {itens.length === 1 ? "produto selecionado" : "produtos selecionados"}. Informe o saldo contado; um motivo vale para todos.</SheetDescription>
      </SheetHeader>
      <form id="ajuste-lote" className="grid content-start gap-4 overflow-y-auto p-4" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
        <SegmentadoDeVidro aria-label="Unidade" valor={unidade} aoMudar={(u) => setUnidade(u as Unidade)} opcoes={UNIDADES_ESTOQUE.map((u) => ({ id: u, rotulo: UNIDADES[u].nome }))} />
        <ul className="grid gap-2" aria-label="Itens do ajuste">
          {itens.map((p) => (
            <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] pb-2 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={p.nome}>{p.nome}</p>
                <p className="text-xs text-muted-foreground"><span className="num">{p.id}</span> · no sistema <span className="num">{p.saldo[unidade]}</span> · diferença <Diferenca valor={valor(p.id) - p.saldo[unidade]} /></p>
              </div>
              <CampoQuantidade rotulo={`Saldo contado de ${p.id}`} valor={valor(p.id)} aoMudar={(n) => setContado((c) => ({ ...c, [`${unidade}:${p.id}`]: n }))} />
            </li>
          ))}
        </ul>
        <label className="grid gap-1 text-xs text-muted-foreground">Motivo (obrigatório, vale para todos)
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={tentou && !motivo ? true : undefined}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 max-sm:text-base">
            <option value="" className="bg-[Canvas] text-[CanvasText]">Escolha o motivo</option>
            {MOTIVOS_AJUSTE.map((m) => <option key={m} value={m} className="bg-[Canvas] text-[CanvasText]">{m}</option>)}
          </select>
        </label>
        {tentou && !motivo && <p role="alert" className="text-xs text-negativo-texto">Escolha o motivo: ele fica em cada movimentação.</p>}
        {tentou && motivo && !mudados.length && !resultado && <p role="alert" className="text-xs text-muted-foreground">Nenhum saldo mudou. Mude a quantidade contada de algum item.</p>}
        {resultado && (
          <div role="alert" className="grid gap-2 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">
            <p className="text-pretty">{resultado.ok} de {resultado.total} ajustados. {resultado.mensagem}</p>
            <Button type="submit" variant="outline" size="sm" className="w-fit" isDisabled={enviando}><RotateCw /> Tentar {mudados.length === 1 ? "o restante" : `os ${mudados.length} restantes`}</Button>
          </div>
        )}
      </form>
      <SheetFooter className="mt-auto shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
        <Button type="button" variant="ghost" onPress={fechar} isDisabled={enviando}>Voltar</Button>
        <Button type="submit" form="ajuste-lote" isPending={enviando} className="min-w-[11rem]">
          {enviando ? "Enviando…" : mudados.length ? `Ajustar ${mudados.length} ${mudados.length === 1 ? "saldo" : "saldos"}` : "Ajustar saldo"}
        </Button>
      </SheetFooter>
    </Sheet>
  )
}
