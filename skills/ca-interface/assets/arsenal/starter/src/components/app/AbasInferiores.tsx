// Barra de abas do celular (no lugar da lateral): ilha de vidro flutuando a 12 px das bordas, como no iOS 26, com o
// item ativo numa pílula do acento que desliza. Os itens vêm do registro dos módulos (os de menor `aba` para o papel
// ativo, no máximo 4) e, se sobrar navegação, "Mais" (a página /mais/ com tudo).
import { motion, useReducedMotion } from "motion/react"
import { Ellipsis } from "lucide-react"
import { abas, achatar, caminhoAtivo, navegacao, useSituacoesDosModulos, type ItemNav } from "@/modulos/registro"
import { useSessaoDaCasca } from "@/proto/permissoes"
import { mola } from "@/proto/movimento"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { useRota } from "./rota"

const MAIS: ItemNav = { rotulo: "Mais", caminho: "mais/", icone: Ellipsis }

export default function AbasInferiores({ rota: rotaInicial = null }: { rota?: string | null }) {
  const rota = useRota(rotaInicial)
  const { papel } = useSessaoDaCasca()
  const sit = useSituacoesDosModulos()
  const { itens, mais } = abas(papel, sit)
  const lista = mais ? [...itens, MAIS] : itens
  const todos = [...achatar(navegacao(papel, sit)), MAIS]
  const ativo = rota === null ? undefined : caminhoAtivo(rota, todos)
  // item fora das abas (ex.: Configurações) acende o "Mais"
  const ativoNaAba = (i: ItemNav) => ativo === i.caminho || (i.filhos?.some((f) => f.caminho === ativo) ?? false) ||
    (i === MAIS && !!ativo && !itens.some((x) => x.caminho === ativo || x.filhos?.some((f) => f.caminho === ativo)))
  const reduzido = useReducedMotion()
  return (
    <nav
      data-nivel="flutuante"
      aria-label="Navegação principal"
      className="sup fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 rounded-full p-1 max-[359px]:inset-x-2 lg:hidden"
    >
      {/* cada aba cresce a partir da largura do próprio rótulo (flex 1 1 auto): "Mensagens" e "Minhas OS" levam mais que
          "Mais", e o rótulo nunca corta (VER-33); abaixo de 360 px a fonte desce a 10 px para caber em 320 */}
      <ul data-casca-sessao className="flex h-[3.75rem]">
        {lista.map((item) => {
          const eAtivo = ativoNaAba(item)
          return (
            <li key={item.caminho} className="flex-[1_1_auto]">
              <a
                href={url(item.caminho)}
                aria-current={eAtivo ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-medium max-[359px]:text-[10px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  eAtivo && "font-medium text-foreground",
                )}
              >
                {eAtivo && (
                  <motion.span layoutId="aba-ativa" transition={reduzido ? { duration: 0 } : mola.rapida}
                    className="nav-ativo absolute inset-0.5 rounded-full" />
                )}
                <item.icone className={cn("relative size-5", eAtivo && "text-sidebar-primary")} strokeWidth={eAtivo ? 2.1 : 1.8} aria-hidden="true" />
                <span className="relative whitespace-nowrap">{item.curto ?? item.rotulo}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
