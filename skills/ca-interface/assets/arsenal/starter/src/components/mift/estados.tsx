import * as React from "react"
import { CircleXIcon, HammerIcon, RotateCcwIcon, SearchXIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { TENTAR_DE_NOVO, TITULO_DA_FALHA } from "@/lib/mensagens"
import { cn } from "@/lib/utils"

// MIFT: os estados de uma tela além do "com dados": carregando, vazio, sem resultado, em construção
// e erro. O auditor espera o carregamento acabar pelos sinais aria-busy/esqueleto.

/** Simula ou acompanha um carregamento curto (substitua pela consulta real do app). */
export function useCarregando(ms = 550) {
  const [carregando, setCarregando] = React.useState(true)
  React.useEffect(() => {
    const t = setTimeout(() => setCarregando(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return carregando
}

/** Esqueleto de uma lista de linhas (mídia, título, descrição, valor). */
export function EsqueletoLinhas({ n = 5 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Esqueleto de uma faixa de indicadores. */
export function EsqueletoCards({ n = 4 }: { n?: number }) {
  return (
    <div className="grade-indicadores" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  )
}

/**
 * Vazio com uma ação. Diferencie "nada aqui ainda" (`tipo="vazio"`) de "a busca não achou"
 * (`tipo="busca"`): o texto e o ícone mudam, e a ação também (criar × limpar a busca).
 */
export function Vazio({
  titulo,
  descricao,
  icone: Icone,
  tipo = "vazio",
  acao,
  className,
}: {
  titulo: string
  descricao?: string
  icone?: React.ComponentType<{ className?: string }>
  tipo?: "vazio" | "busca"
  acao?: React.ReactNode
  className?: string
}) {
  const I = Icone ?? (tipo === "busca" ? SearchXIcon : HammerIcon)
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <I />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        {descricao && <EmptyDescription>{descricao}</EmptyDescription>}
      </EmptyHeader>
      {acao && <EmptyContent>{acao}</EmptyContent>}
    </Empty>
  )
}

/**
 * Erro recuperável, no lugar onde aconteceu (não num aviso que some): o que não deu certo, o motivo
 * que a aplicação devolveu e o caminho de volta (tentar de novo, dispensar). Erro que exige decisão
 * nunca vira só um toast. Para tela inteira que quebrou, a ProtecaoDeTela.
 */
export function Falha({
  titulo = TITULO_DA_FALHA,
  motivo,
  aoTentarDeNovo,
  aoDispensar,
  rotuloTentar = TENTAR_DE_NOVO,
  iconeTentar = true,
  alternativa,
  sobre,
  className,
}: {
  titulo?: string
  motivo?: React.ReactNode
  aoTentarDeNovo?: () => void
  aoDispensar?: () => void
  rotuloTentar?: string
  /** O ícone de girar só faz sentido quando a primeira saída é repetir; desligue quando ela é uma escolha ("Manter a minha"). */
  iconeTentar?: boolean
  /** A segunda saída ("Alterar turma", "Ver pedido"): quando tentar de novo não resolve. */
  alternativa?: { rotulo: string; aoTocar: () => void }
  /** Do que se trata, para o nome dos botões quando há várias falhas na tela ("rg.pdf": "Tentar de novo: rg.pdf"). */
  sobre?: string
  className?: string
}) {
  return (
    <div role="alert" data-slot="falha" className={cn("relative z-10 flex items-start gap-2.5 rounded-xl border border-negative/30 bg-negative/8 p-3 text-sm", className)}>
      <CircleXIcon className="mt-0.5 size-4 shrink-0 text-negative" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-medium text-negative">{titulo}</p>
          {motivo && <p className="text-foreground/80">{motivo}</p>}
        </div>
        {(aoTentarDeNovo || alternativa) && (
          <div className="flex flex-wrap gap-2">
            {aoTentarDeNovo && (
              <Button variant="outline" size="sm" className="w-fit pointer-coarse:h-10" aria-label={sobre ? `${rotuloTentar}: ${sobre}` : undefined} onPress={aoTentarDeNovo}>
                {iconeTentar && <RotateCcwIcon data-icon="inline-start" />}
                {rotuloTentar}
              </Button>
            )}
            {alternativa && (
              <Button variant="outline" size="sm" className="w-fit pointer-coarse:h-10" aria-label={sobre ? `${alternativa.rotulo}: ${sobre}` : undefined} onPress={alternativa.aoTocar}>
                {alternativa.rotulo}
              </Button>
            )}
          </div>
        )}
      </div>
      {aoDispensar && (
        <Button variant="ghost" size="icon-xs" aria-label="Dispensar" onPress={aoDispensar} className="-mt-1 -mr-1 rounded-full pointer-coarse:size-10">
          <XIcon />
        </Button>
      )}
    </div>
  )
}

export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return <Vazio className="min-h-[50dvh] rounded-2xl border border-dashed" titulo={titulo} descricao={`${descricao}. Esta tela ainda vai ser construída.`} />
}

/** Uma tela que quebra mostra o erro no lugar dela; a casca e as outras telas continuam funcionando. */
export class ProtecaoDeTela extends React.Component<{ titulo: string; children: React.ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  componentDidCatch(erro: Error) {
    console.error(`[tela ${this.props.titulo}]`, erro)
  }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <Vazio
        className="min-h-[50dvh] rounded-2xl border border-dashed border-negative/40"
        icone={TriangleAlertIcon}
        titulo="Esta tela encontrou um erro"
        descricao={this.state.erro.message}
      />
    )
  }
}
