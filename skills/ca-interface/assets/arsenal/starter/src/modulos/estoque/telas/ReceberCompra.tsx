// Diálogo "Receber compra" (5.6, P): a quantidade que chegou de cada item, já preenchida com o que falta. Receber gera
// a entrada no estoque da unidade da compra; a OS que espera a peça sai de "Aguardando peça" quando o item fica completo.
// Nada muda antes da resposta: "Enviando…" com a mesma largura e o erro aqui dentro. Baixa só quando alguém recebe.
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UNIDADES } from "@/proto/negocio"
import { osLiberadas, produtos, receberCompra, type Compra } from "../dados"
import { CampoQuantidade } from "./Formularios"

export default function ReceberCompra({ c, aoFechar }: { c: Compra; aoFechar: () => void }) {
  const ps = produtos.use()
  const abertos = c.itens.filter((i) => i.recebido < i.qtd)
  const [qtd, setQtd] = useState<Record<string, number>>(() => Object.fromEntries(abertos.map((i) => [i.sku, i.qtd - i.recebido])))
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const total = Object.values(qtd).reduce((s, n) => s + n, 0)
  const liberadas = useMemo(() => osLiberadas(c, qtd), [c, qtd])
  const completa = abertos.every((i) => (qtd[i.sku] ?? 0) >= i.qtd - i.recebido)
  async function ir() {
    if (enviando || total === 0) return
    setEnviando(true); setErro(null)
    const r = await receberCompra(c, qtd)
    setEnviando(false)
    if (r.ok) aoFechar(); else setErro(r.mensagem)
  }
  return (
    <Dialog isOpen onOpenChange={(o) => { if (!o && !enviando) aoFechar() }} isDismissable={!enviando} className="sm:max-w-lg">
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void ir() }}>
        <DialogHeader>
          <DialogTitle>Receber a {c.id}</DialogTitle>
          <DialogDescription className="text-pretty">Confira o que chegou de {c.fornecedor}. A entrada vai para o estoque de {UNIDADES[c.unidade].nome}.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3" aria-label="Itens a receber">
          {abertos.map((i) => {
            const nome = ps.find((p) => p.id === i.sku)?.nome ?? i.sku
            return (
              <li key={i.sku} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={nome}>{nome}</p>
                  <p className="text-xs text-muted-foreground"><span className="num">{i.sku}</span> · faltam <span className="num">{i.qtd - i.recebido}</span> de <span className="num">{i.qtd}</span></p>
                </div>
                <CampoQuantidade rotulo={`Chegou de ${i.sku}`} valor={qtd[i.sku] ?? 0} min={0} max={i.qtd - i.recebido} aoMudar={(n) => setQtd((q) => ({ ...q, [i.sku]: n }))} />
              </li>
            )
          })}
        </ul>
        <p className="rounded-lg bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2 text-sm text-pretty" aria-live="polite">
          {total === 0 ? "Nada a receber: informe a quantidade que chegou." : completa ? "A compra fica recebida inteira." : `Recebimento em parte: ${total} ${total === 1 ? "unidade" : "unidades"}; o resto continua a caminho.`}
          {liberadas.length > 0 && ` ${liberadas.join(", ")} sai de Aguardando peça e volta para Em execução.`}
        </p>
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">{erro}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>Voltar</Button>
          <Button type="submit" isPending={enviando} isDisabled={total === 0 && !enviando} className="min-w-[10rem]">{enviando ? "Enviando…" : completa ? "Receber tudo" : "Receber em parte"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
