// Módulo Relatórios · coleção `exportacoes`: os arquivos CSV pedidos na sessão (EST-29). Exportar é um job: a ação
// grava "gerando" (O, sem toast, porque a tela já mostra "Exportação iniciada"); pouco depois o "servidor" termina
// e o registro vira "pronto", o sino avisa "Relatório pronto" com o link, e o arquivo baixa dali.
// Os números vêm de calculos.ts, que lê as coleções dos outros módulos sem editá-las.
import { toast } from "sonner"
import { acao, colecao, evento, mudarComoOutraPonta, type Evento } from "@/proto/dados"
import { agora } from "@/proto/relogio"

export type Exportacao = {
  id: string                    // "EXP-0001"
  titulo: string                // "Faturamento · 30 dias · Todas as unidades"
  arquivo: string               // "faturamento-30-dias.csv"
  conteudo: string              // o CSV pronto
  linhas: number
  estado: "gerando" | "pronto" | "baixado"
  criadoEm: string; prontoEm?: string
  versao: number; historico: Evento[]
}

export const exportacoes = colecao<Exportacao>("exportacoes", () => [])

/** Quanto o "servidor" leva para gerar o arquivo. */
const DEMORA = 2200

function terminar(id: string) {
  const e = exportacoes.porId(id)
  if (!e || e.estado !== "gerando") return
  mudarComoOutraPonta((d) => {
    const x = d(exportacoes).find((y) => y.id === id)
    if (x) { x.estado = "pronto"; x.prontoEm = agora().toISOString(); x.historico.push(evento("Arquivo pronto")) }
  }, [id])
  toast.success("Relatório pronto", {
    description: e.titulo,
    duration: 8000,
    action: { label: "Baixar", onClick: () => baixar(id) },
  })
}

/** Começa a exportação. Devolve o id do job (ou nada, se a ação foi recusada). */
export async function exportar(n: { titulo: string; arquivo: string; conteudo: string; linhas: number }) {
  const id = `EXP-${String(exportacoes.ler().reduce((m, e) => Math.max(m, Number(e.id.slice(4)) || 0), 0) + 1).padStart(4, "0")}`
  const r = await acao({
    rotulo: "exportar o relatório",
    capacidade: "relatorios",
    ids: [id],
    aplicar: (d) => {
      d(exportacoes).unshift({ id, ...n, estado: "gerando", criadoEm: agora().toISOString(), versao: 1, historico: [evento("Exportação iniciada")] })
    },
  })
  if (!r.ok) return null
  setTimeout(() => terminar(id), DEMORA)
  return id
}

/** Um job que ficou "gerando" (a aba foi fechada no meio) termina quando a tela abre de novo. */
export function retomarPendentes() {
  for (const e of exportacoes.ler()) if (e.estado === "gerando") setTimeout(() => terminar(e.id), DEMORA)
}

/** Baixa o arquivo e marca como baixado (sai do sino). */
export function baixar(id: string) {
  const e = exportacoes.porId(id)
  if (!e) return
  // BOM: o Excel em pt-BR abre os acentos certos
  const blob = new Blob(["﻿" + e.conteudo], { type: "text/csv;charset=utf-8" })
  const href = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = href; a.download = e.arquivo; a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { a.remove(); URL.revokeObjectURL(href) }, 0)
  if (e.estado !== "baixado") mudarComoOutraPonta((d) => { const x = d(exportacoes).find((y) => y.id === id); if (x) x.estado = "baixado" }, [id])
}

// ---------- CSV ----------
/** Célula de CSV com o separador escolhido. */
const celula = (t: string, sep: string) => {
  // texto que começa com = + - @ vira fórmula no Excel: um apóstrofo na frente (números negativos passam)
  const v = /^[=+@]/.test(t) || (/^-/.test(t) && !/^-[\d.,]+$/.test(t)) ? `'${t}` : t
  return v.includes(sep) || /["\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}
export function montarCSV(cabecalho: string[], linhas: string[][], sep: ";" | ",") {
  return [cabecalho, ...linhas].map((l) => l.map((c) => celula(c, sep)).join(sep)).join("\r\n")
}
/** Número no CSV: com ";" (Excel pt-BR) a vírgula decimal; com "," o ponto. */
export const numeroCSV = (v: number, sep: ";" | ",", casas = 2) =>
  Number.isNaN(v) ? "" : sep === ";" ? v.toFixed(casas).replace(".", ",") : v.toFixed(casas)
