// Edição de célula com motivo obrigatório (TabelaDados, `editar.motivo`): popover ancorado na célula com o valor novo e
// o motivo. A gravação é a acao() do módulo (P): o botão diz "Salvando…" e a recusa aparece aqui dentro. Baixa só quando
// alguém abre a primeira edição.
import { useId, useState } from "react"
import { Dialog, Heading } from "react-aria-components"
import { Button } from "@/components/ui/button"
import { Popover } from "@/components/ui/popover"
import type { Resultado } from "@/proto/dados"

const campo = "h-10 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

export default function EdicaoComMotivo({ ancora, rotulo, titulo, detalhe, inicial, numerico, motivos, salvar, aoFechar }: {
  ancora: HTMLElement; rotulo: string; titulo: string; detalhe?: string; inicial: string; numerico?: boolean
  motivos: readonly string[]; salvar: (novo: string, motivo: string) => void | Promise<Resultado | void>; aoFechar: () => void
}) {
  const id = useId()
  const [valor, setValor] = useState(inicial)
  const [motivo, setMotivo] = useState("")
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const mudou = valor.trim() !== "" && valor.trim() !== inicial

  async function enviar() {
    setTentou(true)
    if (!motivo || !mudou || enviando) return
    setErro(null); setEnviando(true)
    const r = await salvar(valor.trim(), motivo)
    setEnviando(false)
    if (r && !r.ok) setErro(r.mensagem); else aoFechar()
  }

  return (
    <Popover triggerRef={{ current: ancora }} isOpen onOpenChange={(o) => { if (!o && !enviando) aoFechar() }} placement="bottom end" className="w-80 p-3">
      <Dialog aria-labelledby={`${id}-t`} className="outline-none">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
          <div className="grid gap-0.5">
            <Heading id={`${id}-t`} slot="title" className="t-card">{titulo}</Heading>
            {detalhe && <p className="truncate text-xs text-muted-foreground" title={detalhe}>{detalhe}</p>}
          </div>
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>{rotulo} <span className="num">(agora: {inicial})</span></span>
            <input autoFocus className={`${campo} num text-foreground`} value={valor} inputMode={numerico ? "decimal" : undefined}
              onChange={(e) => setValor(e.target.value)} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">Motivo (obrigatório)
            <select className={`${campo} text-foreground`} value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={tentou && !motivo ? true : undefined}>
              <option value="" className="bg-[Canvas] text-[CanvasText]">Escolha o motivo</option>
              {motivos.map((m) => <option key={m} value={m} className="bg-[Canvas] text-[CanvasText]">{m}</option>)}
            </select>
          </label>
          {tentou && !motivo && <p className="text-xs text-negativo-texto" role="alert">Escolha o motivo: ele fica no histórico.</p>}
          {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">{erro}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>Cancelar</Button>
            <Button type="submit" isPending={enviando} isDisabled={!mudou && !enviando} className="min-w-[8.5rem]">
              {enviando ? "Salvando…" : mudou ? "Salvar" : "Sem mudança"}
            </Button>
          </div>
        </form>
      </Dialog>
    </Popover>
  )
}
