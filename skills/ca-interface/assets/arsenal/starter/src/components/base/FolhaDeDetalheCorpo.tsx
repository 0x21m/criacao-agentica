// Parte pesada da FolhaDeDetalhe (carregada sob demanda): o Sheet do aria-nova no desktop e a FolhaDeVidro no celular.
import { FolhaDeVidro } from "@/colecao/vidro-folha"
import { Sheet, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { PropsFolha } from "./FolhaDeDetalhe"

export default function FolhaDeDetalheCorpo({ aberto, aoFechar, sobre, titulo, selos, children, rodape, celular }: PropsFolha & { celular: boolean }) {
  if (celular) {
    return (
      <FolhaDeVidro isOpen={aberto} onOpenChange={(o) => !o && aoFechar()} titulo={<span className="break-words">{titulo}</span>}>
        <div className="grid gap-4">
          {(sobre || selos) && <p className="-mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{sobre && <span className="num">{sobre}</span>} {selos}</p>}
          {children}
          {/* mesma ordem dos formulários: secundária antes da principal no código; empilhado, a principal fica em cima.
              Grudado no pé da folha (como no desktop): a ação principal não some atrás da linha do tempo. O -bottom-6
              compensa o respiro de baixo da área que rola. */}
          {rodape && (
            <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex flex-col-reverse gap-2 px-6 pt-3 pb-6 [backdrop-filter:blur(16px)_saturate(140%)] [-webkit-backdrop-filter:blur(16px)_saturate(140%)] bg-[color-mix(in_oklch,var(--popover)_82%,transparent)] shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
              {rodape}
            </div>
          )}
        </div>
      </FolhaDeVidro>
    )
  }
  return (
    <Sheet isOpen={aberto} onOpenChange={(o) => !o && aoFechar()} className="w-full gap-0 sm:max-w-md">
      <SheetHeader className="shadow-[0_1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">
        {sobre && <p className="num text-sm text-muted-foreground">{sobre}</p>}
        <SheetTitle className="pr-8 text-lg leading-snug break-words">{titulo}</SheetTitle>
        {selos && <SheetDescription className="flex flex-wrap items-center gap-2">{selos}</SheetDescription>}
      </SheetHeader>
      <div className="grid content-start gap-4 overflow-y-auto p-4">{children}</div>
      {rodape && <SheetFooter className="mt-auto shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_8%,transparent)]">{rodape}</SheetFooter>}
    </Sheet>
  )
}
