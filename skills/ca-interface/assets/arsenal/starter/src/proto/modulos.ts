// Módulo ligado, desligado ou fora do ar (5.11, EST-47), na sessão do protótipo. Mora na base (e não no registro) para
// não criar ciclo: o registro importa todos os modulo.ts, e quem liga e desliga (Configurações) importa daqui.
// O registro reexporta tudo (`ativo`, `situacaoDoModulo`, `useAtivo`…): os módulos leem por lá.
//
// - Um id sem registro está ligado. Vale para qualquer id, mesmo de módulo que ainda não existe (ex.: "loja" do Site).
// - Desligado: o módulo some da navegação, das abas, do "Mais", do Ctrl K, do sino e da barra F, e as rotas dele mostram
//   o ModuloIndisponivel no lugar da tela (guarda do AppShell). Fora do ar: continua na navegação, e a rota mostra o aviso.
// - É uma coleção como as outras: some com "Resetar dados", acompanha outra aba (D3) e grava pela acao().
// - Sem piscar: o script do Base.astro lê a mesma chave antes da pintura, esconde os links do módulo desligado e marca
//   html[data-modulo-indisponivel] quando a rota é de um módulo que não está ligado.
import { useEffect } from "react"
import { colecao, type Evento } from "./dados"

export type Situacao = "ligado" | "desligado" | "fora_do_ar"
export type SituacaoDoModulo = {
  id: string; versao: number; historico: Evento[]
  situacao: Situacao
  /** ISO: desde quando está assim. */ desde: string
  /** Quem mudou (nome). */ quem: string
  /** Nome para o aviso ("Loja online"); sem ele, o do registro. */ nome?: string
  /** "o" (padrão) ou "a": "desligado" ou "desligada". */ genero?: "o" | "a"
  /** O que acontece com os dados enquanto está desligado (vai no aviso). */ dados?: string
}

/** Chave do localStorage (o Base.astro lê a mesma antes da pintura). */
export const CHAVE_SITUACAO_DOS_MODULOS = "proto-dados:modulos_situacao:v1"
/** Ninguém começa desligado: a coleção guarda só o que alguém mudou. */
export const situacoesDosModulos = colecao<SituacaoDoModulo>("modulos_situacao", () => [])

export type MapaDeSituacoes = ReadonlyMap<string, Situacao>
const VAZIO: MapaDeSituacoes = new Map()
let cache: { lista: SituacaoDoModulo[]; mapa: MapaDeSituacoes } | null = null
const mapaDe = (lista: SituacaoDoModulo[]): MapaDeSituacoes => {
  if (!lista.length) return VAZIO
  if (cache?.lista !== lista) cache = { lista, mapa: new Map(lista.map((r) => [r.id, r.situacao])) }
  return cache.mapa
}

/** A situação de agora, fora do React (Ctrl K, sino, ações). */
export const situacoesAtuais = (): MapaDeSituacoes => mapaDe(situacoesDosModulos.ler())
export const situacaoDoModulo = (id: string, mapa: MapaDeSituacoes = situacoesAtuais()): Situacao => mapa.get(id) ?? "ligado"
/** O módulo está ligado (nem desligado, nem fora do ar)? */
export const ativo = (id: string, mapa?: MapaDeSituacoes) => situacaoDoModulo(id, mapa) === "ligado"
/** O módulo aparece na navegação? (Fora do ar aparece: a rota mostra o aviso.) */
export const visivel = (id: string, mapa?: MapaDeSituacoes) => situacaoDoModulo(id, mapa) !== "desligado"

/**
 * No React: as situações (no servidor e na hidratação, todos ligados, como o HTML do servidor). A casca passa este mapa
 * para navegacao(), abas() e simulacoes(): depois de hidratar, ela renderiza de novo sem o módulo desligado.
 */
export function useSituacoesDosModulos(): MapaDeSituacoes {
  const lista = situacoesDosModulos.use()
  const mapa = mapaDe(lista)
  // a folha de estilo do Base.astro (links escondidos antes da pintura) acompanha a mudança feita nesta sessão; lê
  // sempre o estado de agora (nunca a semente da hidratação), então nunca mostra um link desligado
  useEffect(() => { (window as JanelaProto).__protoModulosCss?.(situacoesAtuais()) }, [mapa])
  return mapa
}
export const useSituacaoDoModulo = (id: string) => situacaoDoModulo(id, useSituacoesDosModulos())
export const useAtivo = (id: string) => useSituacaoDoModulo(id) === "ligado"
/** O registro inteiro do módulo (quem, desde quando), ou undefined se ninguém mexeu. */
export const useRegistroDoModulo = (id: string) => situacoesDosModulos.use().find((r) => r.id === id)

type JanelaProto = Window & { __protoModulosCss?: (mapa?: MapaDeSituacoes) => void }


