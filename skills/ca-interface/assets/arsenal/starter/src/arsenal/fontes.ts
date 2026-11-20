// Código-fonte dos templates (só no build), para ler o comentário do topo de cada um.
import { todos } from "./catalogo"
const brutos = import.meta.glob<string>("./templates/*/index.tsx", { query: "?raw", import: "default", eager: true })
const fontes = Object.fromEntries(Object.entries(brutos).map(([k, v]) => [k.split("/")[2], v]))
export const CATALOGO = todos(fontes)
