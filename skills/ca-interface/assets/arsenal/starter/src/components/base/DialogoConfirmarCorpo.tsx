// Parte pesada do DialogoConfirmar (carregada sob demanda).
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PropsConfirmar } from "./DialogoConfirmar"

export default function DialogoConfirmarCorpo({ aberto, aoFechar, titulo, descricao, confirmar, voltar = "Voltar", perigo, motivo, aoConfirmar }: PropsConfirmar) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [texto, setTexto] = useState("")
  const [tentou, setTentou] = useState(false)
  useEffect(() => { if (aberto) { setErro(null); setTexto(""); setTentou(false) } }, [aberto])
  const falta = !!motivo && texto.trim().length < 3
  async function ir() {
    setTentou(true)
    if (falta || enviando) return
    setEnviando(true); setErro(null)
    const r = await aoConfirmar(texto.trim())
    setEnviando(false)
    if (r && !r.ok) setErro(r.mensagem)
    else aoFechar()
  }
  return (
    <Dialog isOpen={aberto} onOpenChange={(o) => { if (!o && !enviando) aoFechar() }} className="sm:max-w-md" isDismissable={!enviando}>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void ir() }}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription className="text-pretty">{descricao}</DialogDescription>
        </DialogHeader>
        {motivo && (
          <div className="grid gap-1.5">
            <Label htmlFor="confirmar-motivo">{motivo}</Label>
            <Textarea id="confirmar-motivo" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} autoFocus
              aria-invalid={tentou && falta ? true : undefined} aria-describedby="confirmar-motivo-msg" />
            <p id="confirmar-motivo-msg" className={tentou && falta ? "min-h-4 text-xs text-negativo-texto" : "min-h-4 text-xs text-muted-foreground"} aria-live="polite">
              {tentou && falta ? "Escreva o motivo em pelo menos 3 letras." : "O motivo fica no histórico e vai para o cliente."}
            </p>
          </div>
        )}
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>{voltar}</Button>
          {/* largura mínima do rótulo: "Enviando…" não muda o tamanho do botão */}
          <Button type="submit" variant={perigo ? "destructive" : "default"} isPending={enviando} className="min-w-[10rem]">
            {enviando ? "Enviando…" : confirmar}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
