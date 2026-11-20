// Guarda de rota (EST-47): na rota de um módulo que não está ligado, mostra o ModuloIndisponivel no lugar da tela.
// Sem piscar: o script do Base.astro já marca html[data-modulo-indisponivel] antes da pintura (lendo a mesma chave do
// localStorage), e o CSS esconde a tela do módulo; esta ilha só desenha o aviso e acompanha a mudança ao vivo (alguém
// religou, o módulo voltou ao ar, outra aba mudou). Leve de propósito: não importa o registro (que traz todos os módulos)
// e baixa o aviso só quando precisa.
import { Suspense, lazy, useEffect } from "react"
import { situacaoDoModulo, useSituacaoDoModulo } from "@/proto/modulos"
import type { PropsModuloIndisponivel } from "./ModuloIndisponivel"

const Aviso = lazy(() => import("./ModuloIndisponivel").then((m) => ({ default: m.ModuloIndisponivel })))
const MARCA = "data-modulo-indisponivel"

export default function GuardaDeModulo(props: PropsModuloIndisponivel) {
  const { id } = props
  const fora = useSituacaoDoModulo(id) !== "ligado"
  useEffect(() => {
    // lê a situação de agora (nunca a semente da hidratação): o efeito da hidratação não tira a marca do Base.astro
    const r = document.documentElement
    if (situacaoDoModulo(id) !== "ligado") r.setAttribute(MARCA, id)
    else if (r.getAttribute(MARCA) === id) r.removeAttribute(MARCA)
  }, [fora, id])
  if (!fora) return null
  return (
    <div className="px-4 pt-8 pb-6 md:px-6 md:pt-12">
      <Suspense fallback={null}><Aviso {...props} /></Suspense>
    </div>
  )
}
