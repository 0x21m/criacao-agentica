import * as React from "react"

import { moeda, moedaCompacta, percentual, simboloDaMoeda, textoDoValor, type ComoMostrar } from "@/lib/formato"
import { usePreferencias } from "@/lib/preferencias"
import { cn } from "@/lib/utils"

// MIFT: todo valor em dinheiro passa por aqui. Respeita "ocultar valores", alinha os algarismos e
// nunca aparece cortado: com `ajustar`, se o valor inteiro não cabe, mostra a forma compacta
// (R$ 3,4 mi) e guarda o inteiro na dica. Em descrição de linha, use `compacto`. Valor que pode não ser dinheiro
// (percentual, número com unidade): `ValorFormatado` com `ComoMostrar` (`lib/formato`).

// Mede o texto com a mesma fonte do valor (inclusive algarismos tabulares, que o canvas ignora).
function larguraDoTexto(texto: string, el: HTMLElement) {
  const st = getComputedStyle(el)
  const copia = document.createElement("span")
  copia.textContent = texto
  Object.assign(copia.style, {
    position: "absolute",
    visibility: "hidden",
    whiteSpace: "nowrap",
    left: "-9999px",
    fontFamily: st.fontFamily,
    fontSize: st.fontSize,
    fontWeight: st.fontWeight,
    letterSpacing: st.letterSpacing,
    fontVariantNumeric: st.fontVariantNumeric,
    fontFeatureSettings: st.fontFeatureSettings,
  })
  document.body.appendChild(copia)
  const largura = copia.getBoundingClientRect().width
  copia.remove()
  return largura
}

function useCabe(ajustar: boolean, inteiro: string) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [cabe, setCabe] = React.useState(true)
  React.useLayoutEffect(() => {
    const el = ref.current
    const caixa = el?.parentElement
    if (!ajustar || !el || !caixa) return
    const medir = () => setCabe(larguraDoTexto(inteiro, el) + 2 <= caixa.clientWidth)
    medir()
    // A fonte da web chega depois do primeiro desenho e muda a largura dos algarismos.
    document.fonts?.ready.then(medir)
    const obs = new ResizeObserver(medir)
    obs.observe(caixa)
    return () => obs.disconnect()
  }, [ajustar, inteiro])
  return { ref, cabe }
}

export function Valor({
  v,
  compacto,
  ajustar = false,
  sinal,
  tom,
  className,
}: {
  v: number
  /** Sempre na forma compacta (R$ 1,2 mi): descrições, eixos, espaços pequenos. */
  compacto?: boolean
  /** Troca para a forma compacta só quando o inteiro não cabe (indicadores). */
  ajustar?: boolean
  /** Escreve + ou − à frente do valor absoluto. */
  sinal?: boolean
  /** Verde se positivo, vermelho se negativo. */
  tom?: boolean
  className?: string
}) {
  const { ocultarValores } = usePreferencias()
  const prefixo = sinal ? (v > 0 ? "+" : v < 0 ? "−" : "") : ""
  const inteiro = prefixo + moeda(sinal ? Math.abs(v) : v)
  const { ref, cabe } = useCabe(ajustar && !compacto && !ocultarValores, inteiro)
  const curto = compacto || !cabe
  const texto = ocultarValores ? "R$ ••••••" : curto ? prefixo + moedaCompacta(sinal ? Math.abs(v) : v) : inteiro
  return (
    <span
      ref={ref}
      title={!ocultarValores && curto && !compacto ? inteiro : undefined}
      className={cn("tabular-nums", tom && !ocultarValores && (v >= 0 ? "text-positive" : "text-negative"), ocultarValores && "tracking-widest text-muted-foreground", className)}
    >
      {texto}
    </span>
  )
}

/**
 * Um valor em qualquer formato (`ComoMostrar`): dinheiro passa pelo Valor (ocultar valores; `ajustar` nunca corta;
 * `compacto` em espaço pequeno, como o rodapé de um indicador); percentual e número, como texto.
 */
export function ValorFormatado({
  v,
  sinal,
  ajustar,
  compacto,
  className,
  ...como
}: ComoMostrar & { v: number; sinal?: boolean; ajustar?: boolean; compacto?: boolean; className?: string }) {
  if (como.formato === "moeda") return <Valor v={v} sinal={sinal} ajustar={ajustar} compacto={compacto} className={className} />
  return <span className={cn("tabular-nums", className)}>{textoDoValor(v, { ...como, sinal })}</span>
}

/**
 * O valor em texto que respeita "ocultar valores" (dicas de gráfico, nomes acessíveis): dinheiro oculto vira "R$ ••••"
 * à vista e "valor oculto" para o leitor de tela; percentual e número não são segredo.
 */
export function useTextoDoValor() {
  const { ocultarValores } = usePreferencias()
  return React.useCallback(
    (v: number, como: ComoMostrar & { sinal?: boolean }, para: "tela" | "leitor" = "tela") =>
      como.formato === "moeda" && ocultarValores ? (para === "leitor" ? "valor oculto" : `${simboloDaMoeda()} ••••`) : textoDoValor(v, como),
    [ocultarValores]
  )
}

/** Fração como percentual (0,426 → 42,6%). */
export function Percentual({ v, className }: { v: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{percentual(v)}</span>
}
