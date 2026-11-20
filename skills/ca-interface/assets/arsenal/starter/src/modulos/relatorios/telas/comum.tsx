// Peças comuns das três abas de Relatórios: a leitura das coleções, os filtros da URL, o atraso que mantém os dados
// anteriores enquanto os novos chegam (EST-12) e os formatos de cada indicador.
import { useEffect, useMemo, useRef, useState } from "react"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { lancamentos } from "@/modulos/financeiro/dados"
import { movimentacoes, produtos } from "@/modulos/estoque/dados"
import { useConfig } from "@/proto/dados"
import { UNIDADES } from "@/proto/negocio"
import { moeda, moedaCompacta, numero, percentual } from "@/lib/formato"
import type { Fontes, FiltroUnidade, Indicador } from "../calculos"

/** As cinco coleções que os relatórios leem (só leitura). */
export function useFontes(): Fontes {
  const p = pedidos.use(), l = lancamentos.use(), a = agendamentos.use(), m = movimentacoes.use(), pr = produtos.use()
  return useMemo(() => ({ pedidos: p, lancamentos: l, agendamentos: a, movimentacoes: m, produtos: pr }), [p, l, a, m, pr])
}

export const FILTROS_PADRAO = { aba: "desempenho", indicador: "faturamento", periodo: "30d", de: "", ate: "", unidade: "todas", comparar: "anterior", baixar: "" }
export type Filtros = typeof FILTROS_PADRAO

/**
 * Período, unidade e comparação passam a valer depois da "resposta" (a latência da barra F): até lá a tela mostra os
 * números anteriores, apagados, com "Atualizando…" (EST-12). A primeira leitura da URL, logo depois de hidratar, vale na hora.
 */
export function useFiltrosAplicados(f: Filtros): [Filtros, boolean] {
  const { latencia } = useConfig()
  const [aplicado, setAplicado] = useState(f)
  const montado = useRef(0)
  useEffect(() => { montado.current = performance.now() }, [])
  const chave = `${f.periodo}|${f.de}|${f.ate}|${f.unidade}|${f.comparar}`
  const chaveAplicada = `${aplicado.periodo}|${aplicado.de}|${aplicado.ate}|${aplicado.unidade}|${aplicado.comparar}`
  useEffect(() => {
    if (chave === chaveAplicada) { if (aplicado !== f) setAplicado(f); return }
    if (performance.now() - montado.current < 400 || latencia <= 0) { setAplicado(f); return }
    const t = setTimeout(() => setAplicado(f), Math.min(latencia, 700))
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, f.indicador, f.aba, f.baixar])
  // o indicador e a aba trocam na hora (já estão calculados)
  return [{ ...aplicado, indicador: f.indicador, aba: f.aba, baixar: f.baixar }, chave !== chaveAplicada]
}

export const nomeUnidade = (u: FiltroUnidade) => (u === "todas" ? "Todas as unidades" : UNIDADES[u].nome)

const dias = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${Math.abs(v - 1) < 0.05 ? "dia" : "dias"}`
/** Valor completo (card, dica, tabela) e forma curta (eixo). */
export function formatosDe(ind: Indicador): { formatar: (v: number) => string; eixo: (v: number) => string } {
  switch (ind.formato) {
    case "moeda": return { formatar: moeda, eixo: moedaCompacta }
    case "dias": return { formatar: dias, eixo: (v) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} d` }
    case "percentual": return { formatar: percentual, eixo: (v) => percentual(v) }
    default: return { formatar: numero, eixo: numero }
  }
}
