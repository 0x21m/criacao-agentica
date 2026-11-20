// Módulo Início · quem está vendo a tela: papel, pessoa, unidade e o recorte do Início (seção 2: "Ver Início").
// Pessoa e unidade vêm da sessão da base (usePessoa/useUnidade, permissoes.ts).
// BASE: item 1 das lacunas (o HTML estático sai no papel padrão). `conhecido` é falso no servidor e na hidratação: até
// lá a tela mostra só a moldura e o esqueleto, sem nenhum dado de área restrita no HTML (PON-20).
import { useSyncExternalStore } from "react"
import type { Pessoa, Unidade } from "@/proto/negocio"
import { MATRIZ, usePapel, usePessoa, useUnidade, type Papel, type Regra } from "@/proto/permissoes"
import type { EscolhaUnidade } from "@/modulos/entrada/dados"

/** O recorte do Início, lido da linha `ver_inicio` da MATRIZ: true = completo; "unidade" = balcão (sem valores do
 *  caixa); "proprias" = "Meu dia" do técnico; "parcial" = só o bloco financeiro, ampliado. */
export type Visao = "completa" | "balcao" | "meu_dia" | "financeira"
export function visaoDo(papel: Papel): Visao {
  const r = (MATRIZ.ver_inicio as Record<Papel, Regra>)[papel]
  return r === true ? "completa" : r === "unidade" ? "balcao" : r === "proprias" ? "meu_dia" : "financeira"
}

const nada = () => () => {}
/** Falso no servidor e no quadro da hidratação; verdadeiro depois (o papel escolhido só existe no navegador). */
export const usePapelConhecido = () => useSyncExternalStore(nada, () => true, () => false)

export type QuemVe = { conhecido: boolean; papel: Papel; pessoa: Pessoa; unidade: EscolhaUnidade; visao: Visao }

export function useQuemVe(): QuemVe {
  // A base esconde o conteúdo (html[data-sessao-pendente]) quando a sessão guardada não é a padrão, até a ilha
  // renderizar com ela: o HTML do servidor (papel padrão) pode trazer a tela pronta sem vazar dado.
  const conhecido = true
  const papel = usePapel()
  const pessoa = usePessoa()
  const unidade = useUnidade()
  return { conhecido, papel, pessoa, unidade, visao: visaoDo(papel) }
}

/** O registro é da unidade em foco? ("todas" passa tudo.) */
export const daUnidade = (foco: EscolhaUnidade, u?: Unidade) => foco === "todas" || !u || u === foco
