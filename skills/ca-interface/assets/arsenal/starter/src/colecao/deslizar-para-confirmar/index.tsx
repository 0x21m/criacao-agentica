import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react"
import { ArrowRightIcon, CheckIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMenosMovimento, vibrar } from "@/lib/movimento"
import { SEM_RESPOSTA, type ResultadoAcao } from "@/components/mift/operacao/envio"

// Adaptado de Kokonut UI (MIT, kokonutUI / @dorianbaffier): https://github.com/kokonut-labs/kokonutui/blob/0f2922790424a68ea00153295a3a8836f916ab87/components/kokonutui/slide-to-confirm.tsx
// MIFT: ficou o gesto inteiro do original (a tinta que o polegar deixa e vira o texto em branco, o elástico além das
// pontas, o peteleco rápido que confirma a partir de 45%, o toque que mostra o caminho, o Enter que confirma de uma
// vez, a espera mínima para não piscar o indicador). Mudou: tokens no lugar do zinc e do esmeralda, pt-BR, menos
// movimento da MIFT, ref atualizada fora do desenho, e o contrato: `aoConfirmar` devolve ResultadoAcao; a recusa
// (pagamento recusado) devolve o polegar ao começo e fica escrita embaixo do trilho, com vibração de erro; o polegar
// aceita o próximo arrasto já na volta, de onde estiver. `rotuloCurto` entra quando o rótulo longo não cabe no trilho
// (medido pela largura natural do texto longo, não pela do que está na tela); o nome do polegar acompanha.

const SAIDA = [0.23, 1, 0.32, 1] as const
const VAI_E_VOLTA = [0.65, 0, 0.35, 1] as const
const ALTURA = 56
const FOLGA = 4
const POLEGAR = ALTURA - FOLGA * 2
/** Parte do trilho que o polegar precisa cruzar para soltar e confirmar. */
const CONFIRMA_EM = 0.9
/** Um peteleco mais rápido que isto (px/s) confirma a partir de PETELECO_DE do caminho. */
const PETELECO = 900
const PETELECO_DE = 0.45
/** Quanto o polegar estica além das pontas, no máximo. */
const ELASTICO = 8
/** Um aperto que anda menos que isto é um toque. */
const FOLGA_DO_TOQUE = 4
/** Pego já perto do fim, o dedo precisa andar mais que isto para confirmar (um toque trêmulo não paga). */
const DEDO_PARADO = 10

/** O que o texto do trilho não pode cobrir: o polegar (48 px, mais a folga de 4) e 12 px de respiro de cada lado. */
const OCUPADO_NO_TRILHO = POLEGAR + FOLGA + 24

type Fase = "parado" | "arrastando" | "confirmando" | "feito"

export type PropsDeDeslizarParaConfirmar = {
  /** O que deslizar faz: "Deslize para pagar R$ 289,90". */
  rotulo: string
  /** O mesmo pedido mais curto, usado quando o rótulo não cabe no trilho ("Pagar R$ 289,90"). Verbo e valor ficam. */
  rotuloCurto?: string
  /** Lido enquanto a aplicação trabalha: "Pagando". */
  rotuloAndamento?: string
  /** Mostrado quando deu certo: "Pago". */
  rotuloFeito?: string
  /** A aplicação decide; a recusa volta o polegar e mostra o motivo embaixo. */
  aoConfirmar: () => ResultadoAcao | Promise<ResultadoAcao>
  /** Volta ao começo tantos ms depois de feito; `null` (padrão) fica feito (a aplicação segue para a próxima tela). */
  voltarDepois?: number | null
  desabilitado?: boolean
  className?: string
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * O rótulo que cabe no trilho: o longo, se a largura natural dele (medida com a fonte do texto do trilho, nunca a do
 * texto que está na tela) cabe ao lado do polegar; senão, o curto. Decide antes de pintar e a cada mudança de largura.
 */
function useRotuloQueCabe(trilho: React.RefObject<HTMLElement | null>, texto: React.RefObject<HTMLElement | null>, longo: string, curto?: string) {
  const [cabe, setCabe] = React.useState(true)
  React.useLayoutEffect(() => {
    const el = trilho.current
    if (!curto || !el || typeof ResizeObserver === "undefined") return
    const tela = document.createElement("canvas").getContext("2d")
    if (!tela) return
    let vivo = true
    const medir = () => {
      if (!vivo || !el.clientWidth) return
      const s = getComputedStyle(texto.current ?? el)
      tela.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
      if ("letterSpacing" in tela && s.letterSpacing !== "normal") tela.letterSpacing = s.letterSpacing
      const nova = tela.measureText(longo).width <= el.clientWidth - OCUPADO_NO_TRILHO
      setCabe((c) => (c === nova ? c : nova))
    }
    medir()
    void document.fonts?.ready.then(medir)
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => {
      vivo = false
      observador.disconnect()
    }
  }, [trilho, texto, longo, curto])
  return cabe || !curto ? longo : curto
}

// Além das pontas o polegar acompanha cada vez menos: estica em vez de parar seco na borda.
function elastico(bruto: number, maximo: number) {
  if (bruto > maximo) return maximo + ELASTICO * (1 - Math.exp(-(bruto - maximo) / 40))
  if (bruto < 0) return -ELASTICO * (1 - Math.exp(bruto / 40))
  return bruto
}

export function DeslizarParaConfirmar({
  rotulo: rotuloLongo,
  rotuloCurto,
  rotuloAndamento = "Confirmando",
  rotuloFeito = "Feito",
  aoConfirmar,
  voltarDepois = null,
  desabilitado = false,
  className,
}: PropsDeDeslizarParaConfirmar) {
  const [fase, setFase] = React.useState<Fase>("parado")
  const [armado, setArmado] = React.useState(false)
  const [recusa, setRecusa] = React.useState<string | null>(null)
  const reduzido = useMenosMovimento()

  const trilho = React.useRef<HTMLDivElement>(null)
  const refTexto = React.useRef<HTMLSpanElement>(null)
  const rotulo = useRotuloQueCabe(trilho, refTexto, rotuloLongo, rotuloCurto)
  const arrasto = React.useRef({ ponteiro: 0, de: 0, andou: false, maior: 0 })
  const rodada = React.useRef(0)
  const confirmar = React.useRef(aoConfirmar)
  React.useLayoutEffect(() => {
    confirmar.current = aoConfirmar
  })

  const x = useMotionValue(0)
  const largura = useMotionValue(0)
  // 0: a tinta acaba no polegar. 1: cobre o trilho inteiro, polegar incluído.
  const cobertura = useMotionValue(0)

  const maximo = () => Math.max(0, largura.get() - POLEGAR - FOLGA * 2)

  // A tinta vai da borda esquerda até logo depois do polegar: o texto fica claro conforme o polegar passa por ele.
  const recorte = useTransform([x, largura, cobertura], ([valor, total, coberto]: number[]) => `inset(0px ${(1 - coberto) * Math.max(0, total - valor - FOLGA - POLEGAR / 2)}px 0px 0px round ${ALTURA}px)`)
  const opacidadeDaTinta = useTransform(x, (v) => Math.min(1, v / 20))
  const opacidadeDoRotulo = useTransform([x, largura], ([valor, total]: number[]) => Math.max(0, 1 - (valor / Math.max(1, total - POLEGAR - FOLGA * 2)) * 0.55))

  React.useLayoutEffect(() => {
    const el = trilho.current
    if (!el) return
    const observador = new ResizeObserver(() => {
      const antes = largura.get()
      largura.set(el.offsetWidth)
      // O polegar que estava no fim continua no fim quando o trilho muda de tamanho.
      if (antes > 0 && x.get() >= antes - POLEGAR - FOLGA * 2) x.set(el.offsetWidth - POLEGAR - FOLGA * 2)
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [largura, x])

  React.useEffect(
    () => () => {
      rodada.current += 1
    },
    []
  )

  const mola = (velocidade = 0) => (reduzido ? { duration: 0.15, ease: SAIDA } : { type: "spring" as const, stiffness: 520, damping: 42, velocity: velocidade })

  // A tinta escorre de volta atrás do polegar enquanto ele volta.
  const voltar = (velocidade = 0) => {
    setArmado(false)
    setFase("parado")
    animate(cobertura, 0, { duration: reduzido ? 0 : 0.3, ease: SAIDA })
    animate(x, 0, mola(velocidade))
  }

  // A volta que ninguém pediu é mais lenta: lê-se como rebobinar.
  const rebobinar = () => {
    setArmado(false)
    setFase("parado")
    const d = reduzido ? 0 : 0.6
    animate(cobertura, 0, { duration: d * 0.6, ease: SAIDA })
    animate(x, 0, { duration: d, ease: VAI_E_VOLTA })
  }

  // Um movimento só da soltura ao resultado: o polegar segue até o fim enquanto a tinta cobre o trilho, e o trabalho
  // começa na hora, sem esperar o polegar chegar.
  const confirmarAgora = async (velocidade: number, deslizar = false) => {
    const minha = ++rodada.current
    const viva = () => rodada.current === minha
    setFase("confirmando")
    setArmado(true)
    setRecusa(null)
    const chegada = animate(x, maximo(), deslizar && !reduzido ? { duration: 0.42, ease: VAI_E_VOLTA } : mola(velocidade))
    const tinta = animate(cobertura, 1, { duration: reduzido ? 0 : 0.36, ease: SAIDA })
    let r: ResultadoAcao
    try {
      // Um piso na espera: resposta rápida não pisca o indicador.
      const [resposta] = await Promise.all([Promise.resolve(confirmar.current()), esperar(800), chegada, tinta])
      r = resposta
    } catch {
      r = { ok: false, motivo: SEM_RESPOSTA }
    }
    if (!viva()) return
    vibrar(r.ok ? "confirmar" : "erro")
    if (!r.ok) {
      setRecusa(r.motivo)
      voltar()
      return
    }
    setFase("feito")
    if (voltarDepois === null) return
    await esperar(voltarDepois)
    if (viva()) rebobinar()
  }

  const aoApertar = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (desabilitado || fase !== "parado" || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    x.stop()
    arrasto.current = { ponteiro: e.clientX, de: x.get(), andou: false, maior: 0 }
    setFase("arrastando")
  }

  const aoMover = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (fase !== "arrastando") return
    const a = arrasto.current
    const delta = e.clientX - a.ponteiro
    if (Math.abs(delta) > FOLGA_DO_TOQUE) a.andou = true
    a.maior = Math.max(a.maior, Math.abs(delta))
    const bruto = a.de + delta
    x.set(elastico(bruto, maximo()))
    const agora = bruto >= maximo() * CONFIRMA_EM
    if (agora !== armado) setArmado(agora)
  }

  const aoSoltar = () => {
    if (fase !== "arrastando") return
    const a = arrasto.current
    // Pego no meio da volta (depois de uma recusa), o polegar ainda pode estar perto do fim: só confirma se o dedo andou
    // de verdade; um toque ali devolve o polegar ao começo.
    const partiuArmado = a.de >= maximo() * CONFIRMA_EM
    if (!a.andou || (partiuArmado && a.maior <= DEDO_PARADO)) {
      if (x.get() > FOLGA_DO_TOQUE) voltar()
      else setFase("parado")
      return
    }
    const velocidade = x.getVelocity()
    const progresso = x.get() / Math.max(1, maximo())
    if (progresso >= CONFIRMA_EM || (velocidade > PETELECO && progresso > PETELECO_DE)) void confirmarAgora(velocidade)
    else voltar(velocidade)
  }

  const aoClicar = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (desabilitado || fase !== "parado") return
    // Enter e Espaço clicam sem ponteiro: confirmam de uma vez.
    if (e.detail === 0) {
      void confirmarAgora(0, true)
      return
    }
    // Um toque no começo mostra para onde ir: um empurrão curto que volta (no meio da volta, o polegar só segue voltando).
    if (arrasto.current.andou || reduzido || x.get() > FOLGA_DO_TOQUE) return
    await animate(x, 28, { duration: 0.18, ease: SAIDA })
    animate(x, 0, mola())
  }

  const feito = fase === "feito"
  const ocupado = fase === "confirmando"
  let etapa = "deslizar"
  let texto = rotulo
  if (ocupado) {
    etapa = "ocupado"
    texto = `${rotuloAndamento}…`
  } else if (feito) {
    etapa = "feito"
    texto = rotuloFeito
  }

  return (
    <div data-slot="deslizar-para-confirmar" data-fase={fase} className={cn("relative w-full max-w-sm select-none", className)}>
      <div ref={trilho} className={cn("relative overflow-hidden rounded-full border bg-muted", desabilitado && "opacity-50")} style={{ height: ALTURA }}>
        {/* O rótulo como se lê no trilho vazio. */}
        <motion.span ref={refTexto} aria-hidden className="absolute inset-0 flex items-center justify-center pl-12 text-sm font-medium whitespace-nowrap text-muted-foreground" style={{ opacity: opacidadeDoRotulo }}>
          {rotulo}
        </motion.span>

        {/* A tinta que o polegar deixa, com o rótulo claro por cima. Fica verde no lugar quando dá certo. */}
        <motion.div
          aria-hidden
          className={cn("absolute inset-0 transition-colors duration-300 ease-out motion-reduce:transition-none", feito ? "bg-positive" : "bg-foreground")}
          style={{ clipPath: recorte, opacity: opacidadeDaTinta }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              className={cn(
                "absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap",
                feito ? "text-positive-foreground" : "text-background",
                fase === "parado" || fase === "arrastando" ? "pl-12" : "pr-12"
              )}
              exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
              initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
              key={etapa}
              transition={reduzido ? { duration: 0 } : { duration: 0.26, ease: SAIDA }}
            >
              {texto}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.button
          aria-disabled={desabilitado || fase !== "parado"}
          aria-label={`${rotulo}. Enter confirma.`}
          className={cn(
            "absolute flex touch-none items-center justify-center rounded-full bg-card text-foreground shadow-(--sombra-controle) ring-1 ring-border outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
            fase === "parado" && !desabilitado && "cursor-grab",
            fase === "arrastando" && "cursor-grabbing"
          )}
          onClick={aoClicar}
          onPointerCancel={aoSoltar}
          onPointerDown={aoApertar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          // Medidas a partir de dentro da borda de 1 px.
          style={{ x, left: FOLGA - 1, top: FOLGA - 1, width: POLEGAR, height: POLEGAR }}
          type="button"
        >
          <span className="relative size-5">
            <ArrowRightIcon
              aria-hidden
              className={cn(
                "absolute inset-0 size-5 transition-[opacity,translate,filter] duration-200 ease-out motion-reduce:transition-none",
                armado && !ocupado && !feito && "translate-x-0.5",
                (ocupado || feito) && "translate-x-1.5 opacity-0 blur-[2px]"
              )}
            />
            <CheckIcon
              aria-hidden
              className={cn("absolute inset-0 size-5 text-positive transition-[opacity,scale,filter] duration-200 ease-out motion-reduce:transition-none", feito ? "scale-100 opacity-100" : "scale-50 opacity-0 blur-[2px]")}
              strokeWidth={2.5}
            />
            <svg
              aria-hidden
              className={cn(
                "absolute -inset-0.5 size-6 animate-spin transition-opacity duration-200 [animation-duration:700ms]",
                // Pausado, não removido: some sem voltar para o começo.
                ocupado ? "opacity-100 delay-100" : "opacity-0 [animation-play-state:paused]"
              )}
              viewBox="0 0 24 24"
            >
              <circle className="stroke-border" cx="12" cy="12" fill="none" r="9" strokeWidth="2.5" />
              <circle className="stroke-current" cx="12" cy="12" fill="none" r="9" strokeDasharray="14 43" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
          </span>
        </motion.button>
      </div>

      <span aria-live="polite" className="sr-only">
        {ocupado && `${rotuloAndamento}…`}
        {feito && rotuloFeito}
      </span>

      <AnimatePresence initial={false}>
        {recusa && (
          <motion.p
            role="alert"
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-start gap-2 rounded-xl bg-negative/10 p-3 text-sm text-negativo-texto"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: -4 }}
            transition={{ duration: reduzido ? 0 : 0.2, ease: SAIDA }}
          >
            <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{recusa}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
