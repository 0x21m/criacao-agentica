// Peças comuns das telas de Configurações: a casca (banner compacto + navegação secundária à esquerda no desktop),
// a lista de seções (o índice no celular), a seção de formulário com o rodapé de salvar e o campo com rótulo e erro.
import { useId, useState, type FormEvent, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { SeloEixo } from "@/components/base/selos"
import { Superficie } from "@/components/sistema/Superficie"
import { pode, usePapel } from "@/proto/permissoes"
import type { Resultado } from "@/proto/dados"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { ESTADO_INTEGRACAO, ESTADO_MODULO, integracoes, useModulosOpcionais } from "../dados"
import { SECOES, type IdSecao } from "../secoes"

/** As seções que o papel abre (atendente, técnico e financeiro: Geral e Aparência). */
export function useSecoes() {
  const papel = usePapel()
  return SECOES.filter((s) => pode(papel, s.capacidade))
}

/** O selo ao lado da seção quando ela pede atenção: integração com erro, módulo desligado ou fora do ar. */
function SeloDaSecao({ id }: { id: IdSecao }) {
  const ints = integracoes.use()
  const mods = useModulosOpcionais()
  if (id === "integracoes") {
    const erros = ints.filter((i) => i.estado === "erro").length
    return erros ? <SeloEixo p={ESTADO_INTEGRACAO.erro} className="shrink-0" /> : null
  }
  if (id === "modulos") {
    const fora = mods.find((m) => m.situacao === "fora_do_ar") ?? mods.find((m) => m.situacao === "desligado")
    return fora ? <SeloEixo p={ESTADO_MODULO[fora.situacao]} className="shrink-0" /> : null
  }
  return null
}

/** Lista de seções: navegação secundária (desktop, compacta) ou o índice do celular (com o resumo de cada uma). */
export function ListaDeSecoes({ atual, completa, className }: { atual?: IdSecao; completa?: boolean; className?: string }) {
  const secoes = useSecoes()
  return (
    <Superficie como="nav" aria-label="Seções de configurações" className={cn("p-1.5", className)}>
      <ul className="grid gap-0.5">
        {secoes.map((s) => {
          const ativa = s.id === atual
          return (
            <li key={s.id}>
              <a href={url(s.caminho)} aria-current={ativa ? "page" : undefined}
                className={cn("relative flex items-center gap-3 rounded-[calc(var(--radius)*0.9)] px-3 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                  completa ? "min-h-14 py-2" : "min-h-10",
                  ativa ? "nav-ativo font-medium text-foreground" : "text-foreground/80 hover:bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] hover:text-foreground")}>
                <s.icone className={cn("size-[1.0625rem] shrink-0", ativa ? "text-sidebar-primary" : "text-muted-foreground")} strokeWidth={ativa ? 2.1 : 1.8} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{s.rotulo}</span>
                  {completa && <span className="block truncate text-xs text-muted-foreground">{s.resumo}</span>}
                </span>
                <SeloDaSecao id={s.id} />
                {completa && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
              </a>
            </li>
          )
        })}
      </ul>
    </Superficie>
  )
}

/** A casca de toda tela de Configurações (menos a Aparência, que é o painel da base). */
export function CascaConfig({ secao, titulo, descricao, acoes, children }: {
  secao: IdSecao; titulo: string; descricao: ReactNode; acoes?: ReactNode; children: ReactNode
}) {
  return (
    <>
      <CabecalhoPagina titulo={titulo} descricao={descricao} acoes={(acoes || secao !== "geral") && (
        <>
          {secao !== "geral" && (
            // no celular a lista de seções é o índice: a volta mora no banner (texto claro sobre ele)
            <a href={url("configuracoes/")} className="inline-flex min-h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-sm font-medium outline-none hover:bg-[color-mix(in_oklch,currentColor_10%,transparent)] focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
              <ChevronLeft className="size-4" aria-hidden="true" /> Configurações
            </a>
          )}
          {acoes}
        </>
      )}>
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
          <ListaDeSecoes atual={secao} className="max-lg:hidden lg:sticky lg:top-[calc(var(--topo)+var(--faixa-fixa)+0.5rem)]" />
          <div className="grid min-w-0 gap-4">
            {children}
          </div>
        </div>
      </CabecalhoPagina>
      <div className="h-6" />
    </>
  )
}

/** Cabeçalho de um bloco (título do card + uma linha do que ele faz). */
export function TituloDoBloco({ id, titulo, descricao, acao }: { id?: string; titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0 space-y-0.5">
        <h2 id={id} className="t-card text-balance">{titulo}</h2>
        {descricao && <p className="text-sm text-pretty text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </header>
  )
}

/**
 * Seção de formulário: um card com título, os campos e o rodapé de salvar. "Salvar" só acende com mudança; a falha
 * aparece aqui (o que foi digitado continua nos campos). `aoSalvar` devolve o Resultado da acao().
 */
export function SecaoForm({ titulo, descricao, sujo, aoSalvar, aoDescartar, validar, bloqueio, rotuloSalvar = "Salvar", children, className }: {
  titulo: string; descricao?: ReactNode; sujo: boolean
  aoSalvar: () => Promise<Resultado> | void
  aoDescartar: () => void
  /** Devolve false quando um campo tem erro (o campo mostra o erro dele). */ validar?: () => boolean
  /** Texto no lugar do rodapé quando o papel não pode salvar esta seção. */ bloqueio?: ReactNode
  rotuloSalvar?: string; children: ReactNode; className?: string
}) {
  const id = useId()
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!sujo || enviando) return
    if (validar && !validar()) { setErro("Confira o campo marcado."); return }
    setErro(null)
    setEnviando(true)
    const r = await aoSalvar()
    setEnviando(false)
    if (r && !r.ok) setErro(r.mensagem)
  }
  return (
    <Superficie como="section" aria-labelledby={`${id}-t`} className={cn("p-4 md:p-6", className)}>
      <form noValidate onSubmit={enviar} className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <TituloDoBloco id={`${id}-t`} titulo={titulo} descricao={descricao} />
        <fieldset disabled={!!bloqueio} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">{children}</fieldset>
        {bloqueio ? (
          <p className="text-sm text-pretty text-muted-foreground">{bloqueio}</p>
        ) : !sujo && !erro ? null : (
          <div className="flex flex-col-reverse gap-3 border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pt-4 sm:flex-row sm:items-center">
            <p role={erro ? "alert" : "status"} className={cn("min-w-0 flex-1 text-sm text-pretty", erro ? "text-destructive" : "text-muted-foreground")}>
              {erro ?? (sujo ? "Alterações não salvas." : "Tudo salvo.")}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" isDisabled={!sujo || enviando} onPress={() => { setErro(null); aoDescartar() }} className="pointer-coarse:min-h-10">Descartar</Button>
              <Button type="submit" isDisabled={!sujo || enviando} className="min-w-28 pointer-coarse:min-h-10">{enviando ? "Salvando…" : rotuloSalvar}</Button>
            </div>
          </div>
        )}
      </form>
    </Superficie>
  )
}

/** Campo com rótulo, ajuda e erro ligados por aria-describedby. */
export function Campo({ rotulo, ajuda, erro, className, children }: {
  rotulo: string; ajuda?: ReactNode; erro?: string | null; className?: string
  children: (a: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode
}) {
  const id = useId()
  const desc = erro ? `${id}-e` : ajuda ? `${id}-a` : undefined
  return (
    <div className={cn("grid min-w-0 content-start gap-1.5", className)}>
      <Label htmlFor={id} className="truncate">{rotulo}</Label>
      {children({ id, "aria-describedby": desc, "aria-invalid": erro ? true : undefined })}
      {erro ? <p id={`${id}-e`} className="text-sm text-destructive">{erro}</p> : ajuda ? <p id={`${id}-a`} className="text-xs text-pretty text-muted-foreground">{ajuda}</p> : null}
    </div>
  )
}

/**
 * Rascunho de uma seção. Volta ao salvo quando a versão do registro muda E os campos desta seção mudaram (salvou,
 * desfez ou outra aba gravou esta seção). Salvar outra seção do mesmo registro não apaga o que está digitado aqui, e a
 * falha de uma ação otimista (que não muda a versão) deixa o digitado nos campos.
 */
export function useRascunho<T>(original: T, versao: number) {
  const json = JSON.stringify(original)
  const [rascunho, setRascunho] = useState(original)
  const [visto, setVisto] = useState({ versao, json })
  if (visto.versao !== versao) { setVisto({ versao, json }); if (visto.json !== json) setRascunho(original) }
  const sujo = JSON.stringify(rascunho) !== json
  return { rascunho, setRascunho, sujo, descartar: () => setRascunho(original) }
}
