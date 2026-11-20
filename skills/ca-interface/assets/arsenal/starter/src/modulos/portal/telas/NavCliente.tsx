// A navegação do portal (CascaCliente, 5.12): a pílula de água da liquid-glass-navbar (arsenal), fixa embaixo, com
// Início · Pedidos · Agendar · Conta. Links de verdade (funcionam antes de hidratar); o item ativo sai da rota já no
// servidor. O tom da água segue o tema; a fonte é a de texto do preset (a do autor era a do sistema).
import { useEffect, useState } from "react"
import { CalendarPlus, Home, ReceiptText, UserRound } from "lucide-react"
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar"
import { ehEscuro, useAparencia } from "@/proto/aparencia/aparencia"
import { rotaAtual, url } from "@/lib/url"

const ico = "size-[18px]"
export const DESTINOS = [
  { rotulo: "Início", caminho: "portal/", icone: <Home className={ico} strokeWidth={1.8} aria-hidden="true" />, fx: "glow" as const },
  { rotulo: "Pedidos", caminho: "portal/pedidos/", icone: <ReceiptText className={ico} strokeWidth={1.8} aria-hidden="true" />, fx: "pop" as const },
  { rotulo: "Agendar", caminho: "portal/agendar/", icone: <CalendarPlus className={ico} strokeWidth={1.8} aria-hidden="true" />, fx: "pop" as const },
  { rotulo: "Conta", caminho: "portal/dados/", icone: <UserRound className={ico} strokeWidth={1.8} aria-hidden="true" />, fx: "wave" as const },
]

/** Índice do destino da rota ("portal/pedido/" fica em Pedidos; conversa e pagar, no Início). */
export function destinoDaRota(rota: string) {
  const r = rota.replace(/^\/+|\/+$/g, "") + "/"
  if (r.startsWith("portal/pedido") || r.startsWith("portal/orcamento")) return 1
  if (r.startsWith("portal/agendar")) return 2
  if (r.startsWith("portal/dados")) return 3
  return 0
}

export default function NavCliente({ rota }: { rota: string }) {
  const a = useAparencia()
  // a casca persiste entre as páginas (transition:persist): o ativo acompanha a rota a cada troca
  const [ativo, setAtivo] = useState(() => destinoDaRota(rota))
  useEffect(() => {
    const ler = () => setAtivo(destinoDaRota(rotaAtual(location.pathname)))
    document.addEventListener("astro:page-load", ler)
    return () => document.removeEventListener("astro:page-load", ler)
  }, [])
  const itens: LiquidNavItem[] = DESTINOS.map((d) => ({ label: d.rotulo, href: url(d.caminho), icon: d.icone, fx: d.fx }))
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto">
        <LiquidNavbar items={itens} active={ativo} tone={ehEscuro(a) ? "dark" : "light"} sound={false}
          style={{ fontFamily: "var(--fonte-texto, var(--font-sans))" }} />
      </div>
    </div>
  )
}
