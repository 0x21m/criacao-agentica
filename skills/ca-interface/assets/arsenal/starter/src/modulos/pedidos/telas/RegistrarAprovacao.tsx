// Módulo Pedidos · "Registrar aprovação" (P): o cliente aprovou por WhatsApp ou no balcão. Exige o canal e o anexo
// (print da conversa ou foto do orçamento assinado). Nada muda antes da resposta; a falha e o conflito ficam aqui.
// Carregado sob demanda pela página da OS.
import { useState } from "react"
import { Paperclip, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { registrarAprovacao, type Pedido } from "../dados"

export default function RegistrarAprovacao({ os, versao, aoFechar }: { os: Pedido; versao: number; aoFechar: () => void }) {
  const [canal, setCanal] = useState<"whatsapp" | "balcao">("whatsapp")
  const [anexo, setAnexo] = useState("")
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  async function ir() {
    setTentou(true)
    if (!anexo || enviando) return
    setEnviando(true); setErro(null)
    const r = await registrarAprovacao(os.id, canal, anexo, versao)
    setEnviando(false)
    if (r.ok) aoFechar(); else setErro(r.mensagem)
  }
  return (
    <Dialog isOpen onOpenChange={(o) => { if (!o && !enviando) aoFechar() }} className="sm:max-w-md" isDismissable={!enviando}>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void ir() }}>
        <DialogHeader>
          <DialogTitle>Registrar aprovação da {os.id}</DialogTitle>
          <DialogDescription className="text-pretty">
            Orçamento v{os.orcamento?.versao ?? 1} de <span className="num">{moeda(os.total)}</span>. A OS vai para Aprovada e o cliente é avisado.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 text-sm font-medium">Por onde o cliente aprovou</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["whatsapp", "balcao"] as const).map((c) => (
              <label key={c} className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", canal === c ? "border-primary bg-primary/8" : "border-input")}>
                <input type="radio" name="canal" value={c} checked={canal === c} onChange={() => setCanal(c)} className="size-4 accent-[var(--primary)]" />
                {c === "whatsapp" ? "WhatsApp" : "Balcão"}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-1.5">
          <label htmlFor="anexo-aprovacao" className="text-sm font-medium">Anexo</label>
          <label className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", tentou && !anexo ? "border-negative" : "border-input")}>
            <Paperclip className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{anexo || (canal === "whatsapp" ? "Escolher o print da conversa" : "Escolher a foto do orçamento assinado")}</span>
            <input id="anexo-aprovacao" type="file" accept="image/*,application/pdf" className="sr-only" aria-invalid={tentou && !anexo ? true : undefined} aria-describedby="anexo-msg"
              onChange={(e) => setAnexo(e.target.files?.[0]?.name ?? "")} />
          </label>
          <p id="anexo-msg" aria-live="polite" className={cn("min-h-4 text-xs", tentou && !anexo ? "text-negativo-texto" : "text-muted-foreground")}>
            {tentou && !anexo ? "Anexe a prova da aprovação para registrar." : "Fica no histórico da OS; o cliente não vê o arquivo."}
          </p>
        </div>
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>Voltar</Button>
          <Button type="submit" isPending={enviando} className="min-w-[11rem]"><ShieldCheck /> {enviando ? "Enviando…" : "Registrar aprovação"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
