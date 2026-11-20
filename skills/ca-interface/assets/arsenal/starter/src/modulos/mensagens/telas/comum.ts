// Formatos curtos das telas de mensagens, sempre contra o "agora" do protótipo (nunca new Date() sem argumento).
import { DIA, chaveDia } from "@/proto/relogio"

export const iniciais = (nome: string) => nome.split(" ").filter((x) => /^\p{L}/u.test(x)).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?"
export const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const semana = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
const dm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

/** Na lista: "09:18" hoje, "ontem", "sex" na semana, "02/11" antes. */
export function quandoCurto(iso: string, agora: Date) {
  const d = new Date(iso)
  if (chaveDia(d) === chaveDia(agora)) return hora(iso)
  const dias = Math.round((new Date(chaveDia(agora) + "T12:00").getTime() - new Date(chaveDia(d) + "T12:00").getTime()) / DIA)
  if (dias === 1) return "ontem"
  if (dias > 1 && dias < 7) return semana(d)
  return dm(d)
}

/** Separador de dia na conversa: "Hoje", "Ontem", "sexta, 13/11". */
export function rotuloDoDia(iso: string, agora: Date) {
  const d = new Date(iso)
  if (chaveDia(d) === chaveDia(agora)) return "Hoje"
  const dias = Math.round((new Date(chaveDia(agora) + "T12:00").getTime() - new Date(chaveDia(d) + "T12:00").getTime()) / DIA)
  if (dias === 1) return "Ontem"
  return `${d.toLocaleDateString("pt-BR", { weekday: "long" })}, ${dm(d)}`
}
