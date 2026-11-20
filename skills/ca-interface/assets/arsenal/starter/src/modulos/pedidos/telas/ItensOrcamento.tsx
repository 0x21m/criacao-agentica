// Módulo Pedidos · os itens do orçamento na página da OS. Em rascunho, cada linha edita descrição, quantidade, tipo e
// preço (CampoMoeda, em centavos); fora do rascunho, a lista só lê. Da versão 2 em diante, o que mudou em relação à
// versão anterior fica marcado ("novo", "mudou") e o total mostra a diferença que o cliente vai ler (CLI-14).
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CampoMoeda } from "@/components/mift/fluxos/campos-br"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { somarItens, type ItemPedido } from "../dados"

const TIPOS: { id: ItemPedido["tipo"]; rotulo: string }[] = [
  { id: "mao_de_obra", rotulo: "Mão de obra" }, { id: "peca", rotulo: "Peça" }, { id: "produto", rotulo: "Produto" },
]
const igual = (a: ItemPedido, b: ItemPedido) => a.descricao === b.descricao && a.qtd === b.qtd && a.unitario === b.unitario
/** "novo" (não existia na versão anterior), "mudou" (mesma descrição, outro valor) ou nada. */
function marca(i: ItemPedido, anterior?: ItemPedido[]) {
  if (!anterior) return null
  const mesmo = anterior.find((a) => a.descricao === i.descricao)
  if (!mesmo) return "novo"
  return igual(mesmo, i) ? null : "mudou"
}
const campo = "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 max-sm:text-base"

export function ItensOrcamento({ itens, anterior, editavel, aoMudar }: {
  itens: ItemPedido[]; anterior?: { versao: number; total: number; itens: ItemPedido[] }; editavel: boolean
  aoMudar: (itens: ItemPedido[]) => void
}) {
  const total = somarItens(itens)
  const diferenca = anterior ? total - anterior.total : 0
  const trocar = (k: number, m: Partial<ItemPedido>) => aoMudar(itens.map((x, j) => (j === k ? { ...x, ...m } : x)))
  const removidos = anterior?.itens.filter((a) => !itens.some((i) => i.descricao === a.descricao)) ?? []

  if (!editavel) {
    return (
      <ul className="grid gap-2 text-sm">
        {itens.length === 0 && <li className="text-muted-foreground">Nenhum item ainda.</li>}
        {itens.map((i, n) => {
          const m = marca(i, anterior?.itens)
          return (
            <li key={n} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <span className="min-w-0 break-words">
                {i.qtd > 1 && <span className="num">{i.qtd} × </span>}{i.descricao}
                {m && <Marca tipo={m} />}
              </span>
              <span className="num text-right">{moeda(i.qtd * i.unitario)}</span>
            </li>
          )
        })}
        <Total total={total} diferenca={anterior ? diferenca : undefined} versao={anterior?.versao} />
      </ul>
    )
  }

  return (
    <div className="grid gap-3">
      {itens.length === 0 && (
        <p className="rounded-lg border border-dashed border-[color-mix(in_oklch,var(--foreground)_14%,transparent)] p-4 text-center text-sm text-muted-foreground">
          Adicione o primeiro item do orçamento.
        </p>
      )}
      <ul className="grid gap-3">
        {itens.map((i, k) => {
          const m = marca(i, anterior?.itens)
          return (
            <li key={k} className={cn("grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-[var(--radius-lg)] p-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_8.5rem_9rem_2.5rem]",
              m ? "bg-[color-mix(in_oklch,var(--primary)_8%,transparent)]" : "bg-[color-mix(in_oklch,var(--foreground)_3%,transparent)]")}>
              <div className="min-w-0 max-sm:col-span-3">
                <Input aria-label={`Descrição do item ${k + 1}`} value={i.descricao} onChange={(e) => trocar(k, { descricao: e.target.value })} placeholder="Ex.: Placa eletrônica" />
              </div>
              <input aria-label={`Quantidade do item ${k + 1}`} inputMode="numeric" className={cn(campo, "num text-right")} value={String(i.qtd)}
                onChange={(e) => trocar(k, { qtd: Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 1)) })} />
              <select aria-label={`Tipo do item ${k + 1}`} className={campo} value={i.tipo} onChange={(e) => trocar(k, { tipo: e.target.value as ItemPedido["tipo"] })}>
                {TIPOS.map((t) => <option key={t.id} value={t.id} className="bg-[Canvas] text-[CanvasText]">{t.rotulo}</option>)}
              </select>
              <CampoMoeda rotulo={`Preço do item ${k + 1}`} valor={Math.round(i.unitario * 100)} aoMudar={(c) => trocar(k, { unitario: (c ?? 0) / 100 })} className="h-10 max-sm:order-last max-sm:col-span-3" />
              <Button variant="ghost" size="icon" className="size-10" aria-label={`Remover o item ${k + 1}`} onPress={() => aoMudar(itens.filter((_, j) => j !== k))}><Trash2 /></Button>
              {m && <span className="text-xs text-muted-foreground max-sm:order-last max-sm:col-span-3 sm:col-span-5"><Marca tipo={m} /> desde a v{anterior!.versao}</span>}
            </li>
          )
        })}
      </ul>
      {removidos.length > 0 && (
        <p className="text-xs text-muted-foreground">Saiu desde a v{anterior!.versao}: {removidos.map((r) => r.descricao).join(", ")}.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" className="h-10" onPress={() => aoMudar([...itens, { descricao: "", qtd: 1, unitario: 0, tipo: "mao_de_obra" }])}><Plus /> Adicionar item</Button>
      </div>
      <ul className="grid text-sm"><Total total={total} diferenca={anterior ? diferenca : undefined} versao={anterior?.versao} /></ul>
    </div>
  )
}

function Marca({ tipo }: { tipo: "novo" | "mudou" }) {
  return <span className="ml-1.5 inline-flex rounded-full bg-[color-mix(in_oklch,var(--primary)_16%,transparent)] px-1.5 text-[11px] leading-[18px] font-medium text-foreground">{tipo}</span>
}

function Total({ total, diferenca, versao }: { total: number; diferenca?: number; versao?: number }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pt-2 font-semibold">
      <span>Total{diferenca !== undefined && diferenca !== 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({diferenca > 0 ? "+" : "−"}{moeda(Math.abs(diferenca))} sobre a v{versao})</span>}</span>
      <span className="num text-right">{moeda(total)}</span>
    </li>
  )
}
