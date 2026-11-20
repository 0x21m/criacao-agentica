// Entrada animada sem esconder o conteúdo do servidor.
// As telas chegam prontas no HTML (os dados de exemplo renderizam no servidor). Esconder o conteúdo até a ilha hidratar
// para depois "entrar" atrasa o que a pessoa vê. Por isso há dois modos:
//   "abertura" (padrão das telas): o HTML já vem visível e nada se mexe; a entrada só toca quando a página abriu coberta
//               pela abertura (primeira visita), e aí o conteúdo some por baixo dela e entra quando ela sai.
//   "sempre"  (demos do /arsenal): começa oculto e entra ao montar, como antes.
import { useEffect, useState } from "react"
import { useAberturaAcabou } from "@/components/app/Abertura"

export type ModoEntrada = "abertura" | "sempre"

/** `mostrar`: o estado final deve estar na tela. `animar`: a mudança para o estado final deve ser animada. */
export function useEntrada(modo: ModoEntrada = "abertura") {
  const acabou = useAberturaAcabou()
  const [montado, setMontado] = useState(false)
  const [segurou, setSegurou] = useState(false)
  useEffect(() => {
    setMontado(true)
    if (modo === "abertura" && document.documentElement.hasAttribute("data-abertura")) setSegurou(true)
  }, [modo])
  if (modo === "sempre") return { animar: true, mostrar: montado }
  return { animar: segurou, mostrar: !segurou || acabou }
}
