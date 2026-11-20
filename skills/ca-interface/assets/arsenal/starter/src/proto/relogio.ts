// Relógio do protótipo (D9). O "agora" é fixo no servidor e na primeira pintura (segunda, 16/11/2026, 09:41): as telas
// renderizam iguais no build e no navegador. Depois da hidratação ele anda com o relógio real a partir desse ponto, e a
// barra F avança 30 min ou 1 dia (para ver Pix expirando, orçamento vencendo e atrasos).
// Arquivo compartilhado: os módulos só leem (agora(), useAgora(), AGORA_FIXO). Ninguém usa Date.now() nem new Date()
// sem argumento numa tela ou numa semente.
import { useMemo, useSyncExternalStore } from "react"

/** Segunda-feira, 16/11/2026, 09:41 (horário local). */
export const AGORA_FIXO = new Date(2026, 10, 16, 9, 41)
/** Mantido para o código da fase 1: é o mesmo instante fixo. Prefira agora() / useAgora(). */
export const HOJE = AGORA_FIXO

const CHAVE = "proto-relogio"
const noNavegador = typeof window !== "undefined"
/** Avanço manual (barra F), em ms, guardado entre as páginas. */
let avanco = 0
/** Momento real em que o relógio começou a andar (null = parado no fixo). */
let partida: number | null = null
if (noNavegador) { try { avanco = Number(localStorage.getItem(CHAVE)) || 0 } catch {} }

const ouvintes = new Set<() => void>()
let atual = AGORA_FIXO.getTime() + avanco
function recalcular() {
  atual = AGORA_FIXO.getTime() + avanco + (partida === null ? 0 : Date.now() - partida)
  ouvintes.forEach((f) => f())
}

let tique: ReturnType<typeof setInterval> | undefined
/** Liga o relógio (uma vez, no primeiro componente que o assina depois de hidratar). Tique de 30 s. */
function ligar() {
  if (partida !== null || !noNavegador) return
  // sem recalcular aqui: no instante da partida o "agora" é o mesmo, e notificar faria a tela renderizar de novo
  partida = Date.now()
  tique = setInterval(recalcular, 30_000)
}

/** O "agora" do protótipo como Date. No servidor e antes de hidratar: o fixo (com o avanço da barra F, no navegador). */
export function agora(): Date {
  return new Date(noNavegador ? AGORA_FIXO.getTime() + avanco + (partida === null ? 0 : Date.now() - partida) : AGORA_FIXO.getTime())
}

/** O "agora" que re-renderiza a cada 30 s e a cada avanço da barra F. Igual ao fixo na hidratação. */
export function useAgora(): Date {
  const ms = useSyncExternalStore(
    (f) => { ouvintes.add(f); queueMicrotask(ligar); return () => { ouvintes.delete(f) } },
    () => atual,
    () => AGORA_FIXO.getTime(),
  )
  return useMemo(() => new Date(ms), [ms])
}

/** Avança o relógio (barra F). `ms` negativo não volta para antes do fixo. */
export function avancarRelogio(ms: number) {
  avanco = Math.max(0, avanco + ms)
  try { localStorage.setItem(CHAVE, String(avanco)) } catch {}
  recalcular()
}

/** Volta ao "agora" fixo (o Resetar dados da barra F chama). */
export function zerarRelogio() {
  avanco = 0
  try { localStorage.removeItem(CHAVE) } catch {}
  if (partida !== null) partida = Date.now()
  recalcular()
}

export const avancoDoRelogio = () => avanco
export const pararRelogio = () => { if (tique) clearInterval(tique) }

// ---------- datas do calendário da empresa (seção 1 e 4 da especificação) ----------
export const MIN = 60_000
export const HORA = 60 * MIN
export const DIA = 24 * HORA
/** Data local do dia d de novembro de 2026 (atalho das sementes). */
export const nov = (d: number, h = 0, m = 0) => new Date(2026, 10, d, h, m)
/** "2026-11-16" (data local). */
export const chaveDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const mesmoDia = (a: Date, b: Date) => chaveDia(a) === chaveDia(b)
