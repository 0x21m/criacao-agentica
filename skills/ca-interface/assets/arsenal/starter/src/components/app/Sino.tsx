// Sino da barra superior: os avisos de todos os módulos (registro.ts), por prioridade, com "Não lidas · Todas",
// "Marcar todas como lidas" e "Ver todas" (a central em /notificacoes/). O "lido" é o mesmo da central de Mensagens
// (o módulo informa `lida` e grava em `aoLer`); o dos outros avisos fica neste aparelho.
import { useEffect, useMemo, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Dialog } from "react-aria-components"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { avisosDoSino, lerAviso, lerTodosOsAvisos, useAvisosLidos } from "@/modulos/registro"
import { useVersaoDosDados } from "@/proto/dados"
import type { Papel } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"

const MAXIMO = 8

export function Sino({ papel }: { papel: Papel }) {
  const versao = useVersaoDosDados()
  const lidos = useAvisosLidos()
  // os avisos leem as coleções com ler() (o que está salvo neste navegador), que não é a semente do servidor: no servidor
  // e na hidratação o sino sai sem contagem, e os avisos entram logo depois de montar (sem erro de hidratação, #418)
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  const todos = useMemo(() => (montado ? avisosDoSino(papel, lidos) : []), [montado, versao, papel, lidos]) // eslint-disable-line react-hooks/exhaustive-deps
  const naoLidas = todos.filter((a) => !a.lida)
  const [aba, setAba] = useState<"nao-lidas" | "todas">("nao-lidas")
  const lista = (aba === "nao-lidas" ? naoLidas : todos).slice(0, MAXIMO)
  const resto = (aba === "nao-lidas" ? naoLidas : todos).length - lista.length

  return (
    <PopoverTrigger>
      <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Notificações${naoLidas.length ? `, ${naoLidas.length} não lidas` : ""}`}>
        <Bell />
        {naoLidas.length > 0 && (
          <span className="absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--negative)] px-1 text-[12px] leading-none font-semibold text-[var(--negative-foreground)] shadow-[0_0_0_2px_var(--background)]">
            {naoLidas.length}
          </span>
        )}
      </Button>
      <Popover placement="bottom end" className="w-[380px] max-w-[calc(100vw-1.5rem)] gap-2 p-2">
        <Dialog aria-label="Notificações" className="flex flex-col gap-2 outline-none">
          {({ close }) => (
            <>
              <div className="flex items-center gap-2 px-1.5 pt-0.5">
                <h2 className="flex-1 font-medium">Notificações</h2>
                <Button variant="ghost" size="sm" className="rounded-full" isDisabled={!naoLidas.length} onPress={() => lerTodosOsAvisos(todos)}>
                  <CheckCheck /> Marcar todas como lidas
                </Button>
              </div>
              <div role="group" aria-label="Filtro" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
                {([["nao-lidas", `Não lidas${naoLidas.length ? ` (${naoLidas.length})` : ""}`], ["todas", "Todas"]] as const).map(([id, rotulo]) => (
                  <button key={id} type="button" aria-pressed={aba === id} onClick={() => setAba(id)}
                    className={cn("h-10 rounded-full text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      aba === id ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {rotulo}
                  </button>
                ))}
              </div>
              {lista.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">{aba === "nao-lidas" ? "Tudo lido. Nada pedindo atenção agora." : "Nenhuma notificação."}</p>
              ) : (
                <ul className="flex flex-col">
                  {lista.map((a) => (
                    <li key={a.chave}>
                      <a href={url(a.caminho)} onClick={() => { lerAviso(a); close() }}
                        className="flex min-h-12 items-start gap-2.5 rounded-[calc(var(--radius)*0.9)] px-2 py-2 outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
                        <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.lida ? "bg-transparent" : a.prioridade === 1 ? "bg-[var(--negative)]" : "bg-primary")} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={cn("truncate", !a.lida && "font-medium")} title={a.titulo}>{a.titulo}</span>
                          <span className="truncate text-xs text-muted-foreground" title={a.texto}>{a.texto}</span>
                        </span>
                        {!a.lida && <span className="sr-only">(não lida)</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <a href={url("notificacoes/")} onClick={() => close()}
                className="flex h-10 items-center justify-center rounded-full text-sm font-medium text-primary outline-none hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
                Ver todas{resto > 0 ? ` (mais ${resto})` : ""}
              </a>
            </>
          )}
        </Dialog>
      </Popover>
    </PopoverTrigger>
  )
}
