// Ferramentas do protótipo (não são do produto): a folha do sistema, o quadro de fluxos e o arsenal. As páginas ficam
// em src/pages (sistema/, fluxos/, arsenal/, site/); este módulo só as põe na navegação do protótipo.
import { Globe, Shapes, SwatchBook, Workflow } from "lucide-react"
import type { Modulo } from "../registro"

export default {
  id: "prototipo", nome: "Protótipo", ponta: "ferramenta", ordem: 100,
  nav: [
    { rotulo: "Folha do sistema", caminho: "sistema/", icone: SwatchBook },
    { rotulo: "Quadro de fluxos", caminho: "fluxos/", icone: Workflow },
    { rotulo: "Arsenal", caminho: "arsenal/", icone: Shapes }, // arsenal: removido por scripts/limpar-arsenal.mjs
    // o site público (módulo Site e landing, src/pages/site): abre fora da casca do painel
    { rotulo: "Site público", caminho: "site/", icone: Globe },
  ],
  colecoes: [], depende: [],
} satisfies Modulo
