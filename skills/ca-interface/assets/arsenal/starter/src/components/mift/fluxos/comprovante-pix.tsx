import * as React from "react"
import { CopyIcon, Share2Icon } from "lucide-react"

import { Valor } from "@/components/mift/painel/valor"
import { Button } from "@/components/ui/button"
import { copiar } from "@/lib/copiar"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"

// MIFT: o comprovante de um Pix (camada fluxos), o de verdade (o `comprovante-impresso` da Coleção é o enfeite que
// imprime). Responde de relance as perguntas de quem confere um Pix: quanto, situação, quando, de quem, para quem, por
// qual instituição e o identificador fim a fim (ID E2E, 32 caracteres), que se copia com um toque e é o mesmo do
// extrato. Dado pessoal chega MASCARADO da aplicação (nome com iniciais, CPF do meio). Situação é selo (`selo`),
// nunca só cor; em análise e recusado trazem o motivo numa faixa do tom. "Compartilhar" usa o compartilhar do aparelho
// quando existe e, senão, copia o texto do comprovante (com aviso). Bordas picotadas em cima e embaixo (máscara CSS),
// o papel de um recibo; a marca do app entra em `marca`.

export type PartePix = { nome: string; documento?: string; instituicao: string; chave?: string }

export type PropsDoComprovantePix = {
  /** "Pix enviado", "Pagamento por QR", "Pix recebido". */
  titulo: string
  /** Centavos. */
  valor: number
  selo?: React.ReactNode
  /** Data e hora por extenso ("23/10/2026 às 14h32"). */
  quando: string
  de: PartePix
  para: PartePix
  idE2E?: string
  mensagem?: string
  /** Em análise, recusado: o porquê e o que acontece. */
  aviso?: { tom: "alerta" | "negativo" | "neutro"; texto: React.ReactNode }
  /** Linhas a mais ("Agendado para", "Pedido"). */
  linhas?: { rotulo: string; valor: React.ReactNode }[]
  marca?: React.ReactNode
  /** Rodapé do papel ("Comprovante de exemplo · nenhum dinheiro saiu"). */
  nota?: string
  className?: string
}

// O picote: meias-luas recortadas nas bordas de cima e de baixo (duas camadas de máscara, uma para cada metade).
const DENTE = 7
const picote = `radial-gradient(circle at 50% 0, transparent ${DENTE}px, #000 ${DENTE + 0.5}px) top / ${DENTE * 2.6}px 51% repeat-x, radial-gradient(circle at 50% 100%, transparent ${DENTE}px, #000 ${DENTE + 0.5}px) bottom / ${DENTE * 2.6}px 51% repeat-x`
const recorte: React.CSSProperties = { mask: picote, WebkitMask: picote }

function Parte({ rotulo, parte }: { rotulo: string; parte: PartePix }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</dt>
      <dd className="flex min-w-0 flex-col gap-0.5 text-sm">
        <span className="font-semibold break-words">{parte.nome}</span>
        {parte.documento && <span className="text-muted-foreground tabular-nums">{parte.documento}</span>}
        <span className="text-muted-foreground break-words">{parte.instituicao}</span>
        {parte.chave && <span className="text-muted-foreground break-all tabular-nums">Chave {parte.chave}</span>}
      </dd>
    </div>
  )
}

export function textoDoComprovante(p: Pick<PropsDoComprovantePix, "titulo" | "valor" | "quando" | "de" | "para" | "idE2E" | "mensagem">) {
  return [
    p.titulo,
    `Valor: ${moeda(p.valor / 100)}`,
    `Quando: ${p.quando}`,
    `De: ${p.de.nome} · ${p.de.instituicao}`,
    `Para: ${p.para.nome}${p.para.documento ? ` (${p.para.documento})` : ""} · ${p.para.instituicao}`,
    p.mensagem ? `Mensagem: ${p.mensagem}` : null,
    p.idE2E ? `ID da transação: ${p.idE2E}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

export function ComprovantePix(props: PropsDoComprovantePix) {
  const { titulo, valor, selo, quando, de, para, idE2E, mensagem, aviso, linhas, marca, nota, className } = props
  const compartilhar = async () => {
    const texto = textoDoComprovante(props)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, text: texto })
        return
      } catch (e) {
        if ((e as Error).name === "AbortError") return
      }
    }
    void copiar(texto, "Comprovante copiado")
  }
  return (
    <article aria-label={`Comprovante: ${titulo}`} data-slot="comprovante-pix" className={cn("mx-auto w-full max-w-md drop-shadow-sm", className)}>
      <div style={recorte} className="flex flex-col gap-5 bg-card px-5 pt-7 pb-8 text-card-foreground">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {marca}
            <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
          </div>
          {selo && <div className="shrink-0">{selo}</div>}
        </header>
        {/* O valor nunca quebra nem vira forma curta (comprovante mostra o exato): a fonte encolhe pela largura do
            comprovante e pela quantidade de caracteres (a 320 px, "R$ 9.876.543,21" partia em duas linhas). */}
        <div className="@container flex flex-col gap-1">
          <span className="whitespace-nowrap" style={{ fontSize: `min(2.5rem, calc(100cqi / ${(moeda(valor / 100).length * 0.62).toFixed(2)}))` }}>
            <Valor v={valor / 100} className="text-[1em] leading-none font-bold tracking-[-0.03em]" />
          </span>
          <p className="text-sm text-muted-foreground">{quando}</p>
        </div>
        {aviso && (
          <p className={cn("rounded-xl px-3.5 py-3 text-sm", aviso.tom === "alerta" ? "bg-alerta/16 text-foreground" : aviso.tom === "negativo" ? "bg-negative/10 text-foreground" : "bg-muted")}>{aviso.texto}</p>
        )}
        <dl className="grid grid-cols-1 gap-4 border-y border-dashed py-4 @md/main:grid-cols-2">
          <Parte rotulo="De" parte={de} />
          <Parte rotulo="Para" parte={para} />
        </dl>
        {(mensagem || linhas?.length) && (
          <dl className="flex flex-col gap-3 text-sm">
            {mensagem && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Mensagem</dt>
                <dd className="break-words">{mensagem}</dd>
              </div>
            )}
            {linhas?.map((l) => (
              <div key={l.rotulo} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{l.rotulo}</dt>
                <dd className="min-w-0 text-right font-medium break-words">{l.valor}</dd>
              </div>
            ))}
          </dl>
        )}
        {idE2E && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3.5 py-2.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">ID da transação (E2E)</span>
              <span data-selecionavel className="text-[0.8125rem] font-medium break-all tabular-nums select-text">
                {idE2E}
              </span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Copiar o ID da transação" onPress={() => void copiar(idE2E, "ID da transação copiado")} className="shrink-0 rounded-full">
              <CopyIcon />
            </Button>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onPress={() => void compartilhar()} className="rounded-full">
            <Share2Icon data-icon="inline-start" />
            Compartilhar
          </Button>
        </div>
        {nota && <p className="text-center text-xs text-muted-foreground">{nota}</p>}
      </div>
    </article>
  )
}
