import * as React from "react"

import { cn } from "@/lib/utils"
import { mapaDeRefracao, suportaRefracao } from "@/colecao/vidro-liquido/mapa"

// MIFT: vidro líquido, o material inspirado no Liquid Glass da Apple. Camadas, de baixo para cima:
// 1. lente (na raiz): `backdrop-filter: url(#filtro)` com um filtro SVG por forma (desfoque leve → feDisplacementMap com
//    o mapa gerado para a forma em mapa.ts → os canais R, G e B deslocados em escalas um pouco diferentes, o que dá a
//    leve aberração cromática só na borda, porque o miolo não se desloca → saturação). Onde o navegador não aplica filtro
//    SVG no backdrop-filter (Safari, Firefox), a lente vira `blur() saturate()`, sem refração.
// 2. tinta (o fundo da própria raiz): o fundo do tema misturado com transparência (material claro, regular, espesso).
//    Garante o contraste; como é o fundo do elemento, o backdrop-filter não a refrata, e quem mede contraste pelos
//    ancestrais (o auditor da MIFT) encontra a cor real atrás do texto.
// 3. brilho: luz difusa que segue o ponteiro (ou a inclinação do aparelho), com transição suave. Sem mix-blend-mode:
//    um filho com mistura transforma o vidro numa "raiz de fundo" e o backdrop-filter fica sem nada para refratar.
// 4. volume e aro especular: sombras internas que dão espessura e a borda de 1 px em gradiente, clara do lado da luz.
// Acessibilidade: `prefers-reduced-transparency` e `prefers-contrast: more` (ou `altoContraste`) deixam o vidro quase
// opaco, com borda definida; `prefers-reduced-motion` fixa o brilho. Desempenho: o mapa sai de cache por forma e só é
// refeito quando o tamanho muda (ResizeObserver, arredondado a 1 px); o brilho anda por variáveis CSS, sem re-render.
// Para outra raiz (Button do React Aria, link, motion.div), use o gancho useVidroLiquido.

export type MaterialDoVidro = "claro" | "regular" | "espesso"
export type BrilhoDoVidro = "ponteiro" | "inclinacao" | "fixo"

/** Valores de cada material: tinta (% do fundo do tema), desfoque (px) e saturação. */
export const materiais: Record<MaterialDoVidro, { tinta: number; desfoque: number; saturacao: number }> = {
  /** Quase transparente, refração em evidência: para ícones e controles pequenos sobre fundos calmos. */
  claro: { tinta: 12, desfoque: 0.5, saturacao: 1.5 },
  /** O padrão: refração visível e texto com contraste garantido. */
  regular: { tinta: 52, desfoque: 3, saturacao: 1.7 },
  /** Mais fosco: superfícies grandes com muito texto (folhas, cartões densos). */
  espesso: { tinta: 74, desfoque: 10, saturacao: 1.8 },
}

export type OpcoesDoVidro = {
  material?: MaterialDoVidro
  /** Raio dos cantos em px, ou "pilula" (metade da altura). */
  raio?: number | "pilula"
  /** Espessura do vidro (0 a 2): quanto a borda desvia o fundo e o peso da sombra e do aro. */
  espessura?: number
  /** Largura da borda curva em px; por padrão, 30% do lado menor (de 8 a 40 px). */
  bisel?: number
  /** Aberração cromática na borda (0 a 2). */
  aberracao?: number
  /** Desfoque (px) e saturação; por padrão, os do material. */
  desfoque?: number
  saturacao?: number
  /** De onde vem a luz do aro e do brilho. Com movimento reduzido, sempre "fixo". */
  brilho?: BrilhoDoVidro
  /** Sombra de contato sob o vidro. */
  sombra?: boolean
  /** Vidro quase opaco com borda definida (também automático com `prefers-contrast: more`). */
  altoContraste?: boolean
  /** Desliga a refração (fica o vidro com desfoque), por exemplo em listas longas. */
  semRefracao?: boolean
  /** Cor da tinta (token): o vidro tingido das ações em destaque. Padrão: o fundo do tema. */
  cor?: string
}

export type PropsDoVidro = React.ComponentPropsWithRef<"div"> &
  OpcoesDoVidro & {
    /** Elemento raiz: "span" para usar dentro de um botão ou link (conteúdo de frase). */
    como?: "div" | "span"
  }

let propriedadesRegistradas = false
function registrarPropriedades() {
  if (propriedadesRegistradas || typeof CSS === "undefined" || !("registerProperty" in CSS)) return
  propriedadesRegistradas = true
  const registrar = (name: string, syntax: string, initialValue: string) => {
    try {
      CSS.registerProperty({ name, syntax, inherits: true, initialValue })
    } catch {
      // Já registrada (outra cópia do módulo): segue com a existente.
    }
  }
  registrar("--vidro-x", "<percentage>", "30%")
  registrar("--vidro-y", "<percentage>", "0%")
  registrar("--vidro-angulo", "<angle>", "135deg")
}

function useMidia(consulta: string) {
  return React.useSyncExternalStore(
    (avisar) => {
      if (typeof matchMedia === "undefined") return () => {}
      const m = matchMedia(consulta)
      m.addEventListener("change", avisar)
      return () => m.removeEventListener("change", avisar)
    },
    () => typeof matchMedia !== "undefined" && matchMedia(consulta).matches,
    () => false
  )
}

// A pessoa ajusta a espessura e a aberração de todo vidro líquido no painel de personalização (lib/skins): as variáveis
// --p-vidro-espessura e --p-vidro-aberracao na raiz multiplicam o que a peça pede (1 = como pedido).
const lerMultiplicador = (nome: string) => {
  if (typeof document === "undefined") return 1
  const v = parseFloat(document.documentElement.style.getPropertyValue(nome))
  return Number.isFinite(v) ? Math.max(0, Math.min(2, v)) : 1
}
const lerAjuste = () => `${lerMultiplicador("--p-vidro-espessura")}|${lerMultiplicador("--p-vidro-aberracao")}`
function useAjusteDaPessoa() {
  const chave = React.useSyncExternalStore(
    (avisar) => {
      window.addEventListener("mift:aparencia", avisar)
      return () => window.removeEventListener("mift:aparencia", avisar)
    },
    lerAjuste,
    () => "1|1"
  )
  const [espessura, aberracao] = chave.split("|").map(Number)
  return { espessura, aberracao }
}

/** O vidro deste navegador refrata? (false no servidor.) */
export function useRefracao() {
  return React.useSyncExternalStore(
    () => () => {},
    suportaRefracao,
    () => false
  )
}

function useTamanho(ref: React.RefObject<HTMLElement | null>) {
  const [tamanho, setTamanho] = React.useState<{ largura: number; altura: number } | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = (largura: number, altura: number) => {
      const l = Math.round(largura)
      const a = Math.round(altura)
      setTamanho((t) => (t && t.largura === l && t.altura === a ? t : { largura: l, altura: a }))
    }
    medir(el.offsetWidth, el.offsetHeight)
    const ro = new ResizeObserver(([e]) => {
      const caixa = e.borderBoxSize?.[0]
      if (caixa) medir(caixa.inlineSize, caixa.blockSize)
      else medir(el.offsetWidth, el.offsetHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return tamanho
}

// Intensidades da luz (branco físico, não cor de tema) no claro e no escuro, por light-dark(): o tema escuro da MIFT
// declara color-scheme: dark. Sem `dark:` nas classes.
const luz = (claro: number, escuro: number) => `light-dark(color-mix(in oklch, white ${claro}%, transparent), color-mix(in oklch, white ${escuro}%, transparent))`
const LUZES = {
  "--vidro-aro-1": luz(90, 50),
  "--vidro-aro-2": luz(20, 10),
  "--vidro-aro-3": luz(6, 4),
  "--vidro-aro-4": luz(22, 10),
  "--vidro-aro-5": luz(70, 32),
  "--vidro-vol-1": luz(55, 22),
  "--vidro-vol-2": luz(18, 8),
  "--vidro-vol-3": luz(14, 6),
  "--vidro-brilho": luz(30, 10),
} as React.CSSProperties

const MASCARA_DO_ARO = "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)"

/**
 * O vidro como gancho, para quando a raiz precisa ser outro elemento (o Button do React Aria, um link, um motion.div):
 * devolve as props da raiz (ref, data-*, classes, estilo, eventos do brilho) e as camadas, que vão como primeiros filhos.
 */
export function useVidroLiquido({
  material = "regular",
  raio = 28,
  espessura = 1,
  bisel,
  aberracao = 1,
  desfoque,
  saturacao,
  brilho = "ponteiro",
  sombra = true,
  altoContraste = false,
  semRefracao = false,
  cor,
  className,
  style,
  ref: refExterno,
  onPointerMove,
  onPointerLeave,
}: OpcoesDoVidro & {
  className?: string
  style?: React.CSSProperties
  ref?: React.Ref<HTMLElement>
  onPointerMove?: React.PointerEventHandler<HTMLElement>
  onPointerLeave?: React.PointerEventHandler<HTMLElement>
}) {
  const ref = React.useRef<HTMLElement | null>(null)
  const juntarRef = React.useCallback(
    (el: HTMLElement | null) => {
      ref.current = el
      if (typeof refExterno === "function") refExterno(el)
      else if (refExterno) (refExterno as React.RefObject<HTMLElement | null>).current = el
    },
    [refExterno]
  )
  const idBruto = React.useId()
  const id = `vidro-${idBruto.replace(/[^a-zA-Z0-9_-]/g, "")}`
  const refrata = useRefracao() && !semRefracao
  const tamanho = useTamanho(ref)
  const menosMovimento = useMidia("(prefers-reduced-motion: reduce)")
  const m = materiais[material]
  const sat = saturacao ?? m.saturacao
  const blur = desfoque ?? m.desfoque
  const ajuste = useAjusteDaPessoa()
  const esp = Math.max(0, Math.min(2, espessura * ajuste.espessura))

  React.useEffect(registrarPropriedades, [])

  const raioPx = tamanho ? (raio === "pilula" ? tamanho.altura / 2 : Math.min(raio, tamanho.altura / 2, tamanho.largura / 2)) : typeof raio === "number" ? raio : 999
  const biselPx = tamanho ? Math.round(bisel ?? Math.max(8, Math.min(40, Math.min(tamanho.largura, tamanho.altura) * 0.3))) : 0
  const mapa = React.useMemo(
    () => (refrata && tamanho && esp > 0 ? mapaDeRefracao({ largura: tamanho.largura, altura: tamanho.altura, raio: raioPx, bisel: biselPx }) : null),
    [refrata, tamanho, raioPx, biselPx, esp]
  )
  const escala = mapa ? 2 * mapa.maximo * 0.55 * esp : 0
  const ab = Math.max(0, Math.min(2, aberracao * ajuste.aberracao)) * 0.035

  // Luz que segue o ponteiro (ou a inclinação): só variáveis CSS, num quadro de animação, sem re-render.
  const luzFixa = menosMovimento || brilho === "fixo"
  const quadro = React.useRef(0)
  const moverLuz = React.useCallback((fx: number, fy: number) => {
    cancelAnimationFrame(quadro.current)
    quadro.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.style.setProperty("--vidro-x", `${Math.round(fx * 100)}%`)
      el.style.setProperty("--vidro-y", `${Math.round(fy * 100)}%`)
      const angulo = (Math.atan2(fy - 0.5, fx - 0.5) * 180) / Math.PI + 90
      el.style.setProperty("--vidro-angulo", `${Math.round(angulo)}deg`)
    })
  }, [])
  const soltarLuz = React.useCallback(() => {
    cancelAnimationFrame(quadro.current)
    const el = ref.current
    if (!el) return
    el.style.removeProperty("--vidro-x")
    el.style.removeProperty("--vidro-y")
    el.style.removeProperty("--vidro-angulo")
  }, [])

  React.useEffect(() => {
    if (luzFixa || brilho !== "inclinacao" || typeof window === "undefined") return
    const aoInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      moverLuz(0.5 + Math.max(-1, Math.min(1, e.gamma / 45)) * 0.5, 0.5 + Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * 0.5)
    }
    window.addEventListener("deviceorientation", aoInclinar)
    return () => {
      window.removeEventListener("deviceorientation", aoInclinar)
      soltarLuz()
    }
  }, [luzFixa, brilho, moverLuz, soltarLuz])

  React.useEffect(() => () => cancelAnimationFrame(quadro.current), [])

  const lente = mapa ? `url(#${id})` : `blur(${Math.max(blur, 8) + 4}px) saturate(${sat})`

  const raiz = {
    ref: juntarRef,
    "data-slot": "vidro-liquido",
    "data-material": material,
    "data-refracao": mapa ? "" : undefined,
    "data-alto-contraste": altoContraste || undefined,
    className: cn(
      "group/vidro relative isolate text-foreground",
      "[backdrop-filter:var(--vidro-lente)] [-webkit-backdrop-filter:var(--vidro-lente)]",
      "bg-[color-mix(in_oklch,var(--vidro-cor,var(--background))_var(--vidro-tinta),transparent)]",
      "data-alto-contraste:bg-[var(--vidro-cor,var(--background))] data-alto-contraste:[backdrop-filter:none] data-alto-contraste:[-webkit-backdrop-filter:none]",
      "contrast-more:bg-[var(--vidro-cor,var(--background))] contrast-more:[backdrop-filter:none] contrast-more:[-webkit-backdrop-filter:none]",
      "[@media(prefers-reduced-transparency:reduce)]:bg-[var(--vidro-cor,color-mix(in_oklch,var(--background)_96%,var(--foreground)))] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none] [@media(prefers-reduced-transparency:reduce)]:[-webkit-backdrop-filter:none]",
      sombra &&
        "shadow-[0_1px_2px_color-mix(in_oklch,black_8%,transparent),0_calc(var(--vidro-esp)*8px)_calc(var(--vidro-esp)*24px)_calc(var(--vidro-esp)*-8px)_color-mix(in_oklch,black_28%,transparent)]",
      className
    ),
    style: {
      borderRadius: raio === "pilula" ? 9999 : raio,
      "--vidro-esp": String(0.6 + esp * 0.4),
      "--vidro-tinta": `${m.tinta}%`,
      "--vidro-lente": lente,
      ...(cor && { "--vidro-cor": cor }),
      ...LUZES,
      ...style,
    } as React.CSSProperties,
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      onPointerMove?.(e)
      if (luzFixa || brilho !== "ponteiro" || e.pointerType === "touch") return
      const r = e.currentTarget.getBoundingClientRect()
      moverLuz((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      onPointerLeave?.(e)
      if (brilho === "ponteiro") soltarLuz()
    },
  }

  const camadas = (
    <>
      {mapa && tamanho && (
        <svg aria-hidden width="0" height="0" className="pointer-events-none absolute" focusable="false">
          <filter id={id} x="0" y="0" width={tamanho.largura} height={tamanho.altura} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="desfocado" />
            <feImage href={mapa.url} x="0" y="0" width={tamanho.largura} height={tamanho.altura} preserveAspectRatio="none" result="mapa" />
            <feDisplacementMap in="desfocado" in2="mapa" scale={escala * (1 + ab)} xChannelSelector="R" yChannelSelector="G" result="dr" />
            <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feDisplacementMap in="desfocado" in2="mapa" scale={escala} xChannelSelector="R" yChannelSelector="G" result="dg" />
            <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feDisplacementMap in="desfocado" in2="mapa" scale={escala * (1 - ab)} xChannelSelector="R" yChannelSelector="G" result="db" />
            <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feBlend in="r" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b" mode="screen" result="rgb" />
            <feColorMatrix in="rgb" type="saturate" values={String(sat)} />
          </filter>
        </svg>
      )}
      {/* Brilho difuso, do lado da luz. */}
      <span
        aria-hidden
        data-vidro-brilho
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-[--vidro-x,--vidro-y,--vidro-angulo] duration-500 ease-out motion-reduce:transition-none",
          "bg-[radial-gradient(120%_100%_at_var(--vidro-x,30%)_var(--vidro-y,0%),var(--vidro-brilho),transparent_60%)]",
          "group-data-alto-contraste/vidro:hidden contrast-more:hidden [@media(prefers-reduced-transparency:reduce)]:hidden"
        )}
      />
      {/* Volume: sombras internas que dão espessura. */}
      <span
        aria-hidden
        data-vidro-volume
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] shadow-[inset_0_calc(var(--vidro-esp)*1px)_calc(var(--vidro-esp)*1px)_var(--vidro-vol-1),inset_0_calc(var(--vidro-esp)*-1px)_calc(var(--vidro-esp)*2px)_var(--vidro-vol-2),inset_0_0_calc(var(--vidro-esp)*14px)_var(--vidro-vol-3)] group-data-alto-contraste/vidro:shadow-none contrast-more:shadow-none"
      />
      {/* Aro especular: a borda de luz, clara do lado de onde a luz vem. */}
      <span
        aria-hidden
        data-vidro-aro
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] p-px transition-[--vidro-angulo] duration-500 ease-out motion-reduce:transition-none",
          "bg-[linear-gradient(var(--vidro-angulo,135deg),var(--vidro-aro-1),var(--vidro-aro-2)_28%,var(--vidro-aro-3)_50%,var(--vidro-aro-4)_74%,var(--vidro-aro-5))]",
          "group-data-alto-contraste/vidro:bg-foreground contrast-more:bg-foreground [@media(prefers-reduced-transparency:reduce)]:bg-border"
        )}
        style={{ mask: MASCARA_DO_ARO, maskComposite: "exclude", WebkitMask: MASCARA_DO_ARO, WebkitMaskComposite: "xor" }}
      />
    </>
  )

  return { raiz, camadas, refrata: !!mapa }
}

export function VidroLiquido({
  material,
  raio,
  espessura,
  bisel,
  aberracao,
  desfoque,
  saturacao,
  brilho,
  sombra,
  altoContraste,
  semRefracao,
  cor,
  como = "div",
  className,
  style,
  ref,
  onPointerMove,
  onPointerLeave,
  children,
  ...props
}: PropsDoVidro) {
  const { raiz, camadas } = useVidroLiquido({
    material,
    raio,
    espessura,
    bisel,
    aberracao,
    desfoque,
    saturacao,
    brilho,
    sombra,
    altoContraste,
    semRefracao,
    cor,
    className,
    style,
    ref: ref as React.Ref<HTMLElement>,
    onPointerMove,
    onPointerLeave,
  })
  const Raiz = como as "div"
  return (
    <Raiz {...props} {...(raiz as React.ComponentProps<"div">)}>
      {camadas}
      {children}
    </Raiz>
  )
}
