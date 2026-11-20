import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { moeda } from "@/lib/formato"
import { menosMovimento, vibrar } from "@/lib/movimento"
import { Button } from "@/components/ui/button"

// Adaptado de Kokonut UI Receipt Printer (MIT, kokonutUI / Dorian Baffier): https://21st.dev/@kokonutd/components/kokonut-receipt-printer
/*
MIT License

Copyright (c) 2025 kokonutUI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// MIFT: o comprovante sai da impressora linha por linha (motor em pulsos, a caixa vibra), fica pendurado e se destaca
// puxando para baixo (ou com um puxão rápido), caindo com física (Verlet, passo fixo). Serve para o fim de um pagamento
// (Pix enviado, pedido pago): é o "recibo" com personalidade. Conteúdo em pt-BR e em reais (`moeda` da MIFT): itens com
// acréscimos (entrega, gorjeta) ou só dados (de, para, chave, ID). Tokens no lugar de zinc; o papel acompanha o tema.
// Teclado: "Destacar comprovante" aparece ao focar. Movimento reduzido: sai inteiro, sem cair.

const SLOT_Y = 64 // onde o papel sai, a partir do topo do cartão
const LINE = 15 // a impressora avança uma linha por vez, com uma pausa curta entre linhas
const FEED_RATE = 34
const LINE_PAUSE = 0.055
const LINE_JITTER = 0.05
const STEP = 1 / 120 // simulação em px e segundos, passo fixo
const GRAVITY = 2600
const DAMPING = 0.996
const MAX_PULL = 18 // pendurado, o puxão estica só até aqui, com resistência crescente…
const TEAR_DRAG = 72 // …e rasga depois disto
const TEAR_SPEED = 900 // um puxão rápido para baixo também rasga (px/s)
const GLIDE = 0.35 // a folha inclinada desliza de lado ao cair
const REST_EPSILON = 0.02

type Fase = "parado" | "imprimindo" | "pendurado" | "na-mao" | "caindo"

export type ItemDoComprovante = { nome: string; quantidade?: number; preco: number }
export type LinhaDoComprovante = { rotulo: string; valor: string }

export type PropsComprovante = {
  /** Quem emite (loja, banco). */
  estabelecimento: string
  data: string
  /** Número do pedido ou ID da transação. */
  codigo: string
  /** Itens com preço unitário em reais. */
  itens?: ItemDoComprovante[]
  /** Acréscimos depois do subtotal (entrega, gorjeta, desconto negativo). */
  acrescimos?: { rotulo: string; valor: number }[]
  /** Linhas de dados (Pix: de, para, chave, instituição). */
  dados?: LinhaDoComprovante[]
  /** Total em reais; se faltar, soma itens e acréscimos. */
  total?: number
  /** Rótulo do total ("Total", "Valor enviado"). */
  rotuloDoTotal?: string
  /** Frase no pé do papel. */
  mensagem?: string
  /** Imprime quando aparece na tela. */
  imprimirAoVer?: boolean
  aoImprimir?: () => void
  aoDestacar?: () => void
  className?: string
}

// Larguras das barras do código, fixas para servidor e navegador concordarem.
const BARS = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2]

function damp(distance: number, max: number) {
  return max * (1 - Math.exp(-distance / max))
}

function haptic(ms = 8) {
  vibrar(ms)
}

/** Ponto local p numa folha girada por `angle`, relativo ao canto. */
function turn(px: number, py: number, angle: number) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [px * cos - py * sin, px * sin + py * cos]
}

const Tracejado = () => (
  <p aria-hidden className="my-[7px] overflow-hidden whitespace-nowrap text-muted-foreground/70">
    {"- ".repeat(40)}
  </p>
)

function Papel({ estabelecimento, data, codigo, itens = [], acrescimos = [], dados = [], total, rotuloDoTotal = "Total", mensagem }: PropsComprovante) {
  const subtotal = itens.reduce((soma, i) => soma + (i.quantidade ?? 1) * i.preco, 0)
  const somaFinal = total ?? subtotal + acrescimos.reduce((soma, a) => soma + a.valor, 0)
  return (
    <div className="px-5 pt-6 pb-8 text-[11px] leading-[15px] tracking-wide text-foreground tabular-nums">
      <p className="text-center text-xs font-semibold tracking-[0.2em]">{estabelecimento.toUpperCase()}</p>
      <p className="text-center text-muted-foreground">{data}</p>
      <p className="text-center text-muted-foreground">{codigo}</p>
      {itens.length > 0 && (
        <>
          <Tracejado />
          {itens.map((item) => (
            <p className="flex justify-between gap-3" key={item.nome}>
              <span className="min-w-0">
                {item.quantidade ?? 1} × {item.nome}
              </span>
              <span className="tabular-nums">{moeda((item.quantidade ?? 1) * item.preco)}</span>
            </p>
          ))}
        </>
      )}
      {dados.length > 0 && (
        <>
          <Tracejado />
          {dados.map((l) => (
            <p className="flex justify-between gap-3" key={l.rotulo}>
              <span className="shrink-0 text-muted-foreground">{l.rotulo}</span>
              <span className="min-w-0 text-right break-all">{l.valor}</span>
            </p>
          ))}
        </>
      )}
      <Tracejado />
      {itens.length > 0 && (
        <p className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{moeda(subtotal)}</span>
        </p>
      )}
      {acrescimos.map((a) => (
        <p className="flex justify-between text-muted-foreground" key={a.rotulo}>
          <span>{a.rotulo}</span>
          <span className="tabular-nums">{moeda(a.valor)}</span>
        </p>
      ))}
      <p className="mt-1 flex justify-between text-[13px] font-semibold">
        <span>{rotuloDoTotal}</span>
        <span className="tabular-nums">{moeda(somaFinal)}</span>
      </p>
      <div aria-hidden className="mt-4 flex h-9 justify-center gap-px">
        {BARS.map((largura, i) => (
          <span className={i % 2 ? "bg-transparent" : "bg-foreground"} key={`barra-${i.toString()}`} style={{ width: largura }} />
        ))}
      </div>
      {mensagem && <p className="mt-3 text-center text-muted-foreground">{mensagem}</p>}
    </div>
  )
}

// Bordas serrilhadas: a de baixo foi rasgada do comprovante anterior; a de cima ganha o mesmo corte quando este rasga.
const TOOTH = 8
const edge = (side: "top" | "bottom") =>
  `conic-gradient(from ${side === "bottom" ? "-45deg at 50% 100%" : "135deg at 50% 0"}, #0000, #000 1deg 89deg, #0000 90deg) 50% ${side === "bottom" ? "100%" : "0"} / ${TOOTH}px ${TOOTH / 2}px repeat-x`
const FILL = `linear-gradient(#000 0 0) 0 ${TOOTH / 2}px / 100% calc(100% - ${TOOTH}px) no-repeat`
const MASK_RESTING = `${edge("bottom")}, linear-gradient(#000 0 0) 0 0 / 100% calc(100% - ${TOOTH / 2}px) no-repeat`
const MASK_TORN = `${edge("top")}, ${edge("bottom")}, ${FILL}`

export function ComprovanteImpresso(props: PropsComprovante) {
  const { estabelecimento, codigo, imprimirAoVer = true, aoImprimir, aoDestacar, className } = props
  const [fase, setFase] = useState<Fase>("parado")
  const [rasgado, setRasgado] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const printerRef = useRef<HTMLDivElement>(null)

  const sim = useRef({
    fase: "parado" as Fase,
    width: 0,
    height: 0,
    slotX: 0,
    // Centro de massa agora e um passo antes (Verlet), e o ângulo da folha.
    cx: 0,
    cy: 0,
    pcx: 0,
    pcy: 0,
    angle: 0,
    spin: 0,
    // A dobradiça: um ponto do mundo de onde a folha pende, e onde ele fica na folha.
    hx: 0,
    hy: 0,
    hingeX: 0,
    hingeY: 0,
    // Impressão: quanto papel ainda está dentro da impressora.
    hidden: 0,
    feedTarget: 0,
    pause: 0,
    // Arrasto.
    pointerId: -1,
    grabX: 0,
    grabY: 0,
    startX: 0,
    startY: 0,
    samples: [] as { t: number; x: number; y: number }[],
    raf: 0,
    last: 0,
    carry: 0,
    visible: false,
    reduceMotion: false,
  })

  const callbacks = useRef({ aoImprimir, aoDestacar })
  useEffect(() => {
    callbacks.current = { aoImprimir, aoDestacar }
  })
  // O laço do rAF chama sempre a versão atual do `tick` (que se agenda de novo).
  const laco = useRef<(agora: number) => void>(() => {})

  const setFaseBoth = useCallback((next: Fase) => {
    sim.current.fase = next
    setFase(next)
  }, [])

  const draw = useCallback(() => {
    const s = sim.current
    const paper = paperRef.current
    if (!paper) return
    // Põe a folha com o centro de massa em (cx, cy), girada por `angle` em volta do canto de cima à esquerda.
    const [ox, oy] = turn(s.width / 2, s.height / 2, s.angle)
    const left = s.slotX - s.width / 2
    const tx = s.cx - ox - left
    const ty = s.cy - oy - SLOT_Y
    paper.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${s.angle.toFixed(4)}rad)`
  }, [])

  // O centro de massa de uma folha pendurada na dobradiça no ângulo `angle`.
  const hangAt = useCallback((angle: number) => {
    const s = sim.current
    const [dx, dy] = turn(s.width / 2 - s.hingeX, s.height / 2 - s.hingeY, angle)
    return [s.hx + dx, s.hy + dy]
  }, [])

  const placeAtSlot = useCallback(
    (pull: number) => {
      const s = sim.current
      s.hingeX = s.width / 2
      s.hingeY = 0
      s.hx = s.slotX
      s.hy = SLOT_Y + pull
      const [cx, cy] = hangAt(0)
      s.cx = cx
      s.cy = cy
      s.pcx = cx
      s.pcy = cy
      s.angle = 0
    },
    [hangAt]
  )

  // A impressora térmica anda em pulsos: avança uma linha, para, avança.
  const stepPrinting = useCallback(
    (dt: number) => {
      const s = sim.current
      if (s.pause > 0) {
        s.pause -= dt
      } else if (s.feedTarget > 0) {
        s.feedTarget = Math.max(0, s.feedTarget - LINE)
        s.pause = LINE_PAUSE + Math.random() * LINE_JITTER
      }
      s.hidden += (s.feedTarget - s.hidden) * Math.min(1, FEED_RATE * dt)
      if (Math.abs(s.hidden - s.feedTarget) < 0.05) s.hidden = s.feedTarget
      placeAtSlot(-s.hidden)
      const printer = printerRef.current
      if (printer) {
        // A caixa vibra enquanto o motor anda.
        const buzz = s.pause > 0 ? 0 : Math.sin(performance.now() / 9) * 0.4
        printer.style.transform = `translate3d(${buzz.toFixed(2)}px,0,0)`
      }
      if (s.hidden === 0 && s.feedTarget === 0) {
        if (printer) printer.style.transform = ""
        setFaseBoth("pendurado")
        return 0
      }
      return 1
    },
    [placeAtSlot, setFaseBoth]
  )

  // Pendurado: o centro de massa balança numa haste de comprimento fixo, e a folha gira junto.
  const stepPendulum = useCallback(() => {
    const s = sim.current
    const vx = (s.cx - s.pcx) * DAMPING
    const vy = (s.cy - s.pcy) * DAMPING
    s.pcx = s.cx
    s.pcy = s.cy
    s.cx += vx
    s.cy += vy + GRAVITY * STEP * STEP
    const rod = Math.hypot(s.width / 2 - s.hingeX, s.height / 2 - s.hingeY)
    const dx = s.cx - s.hx
    const dy = s.cy - s.hy
    const dist = Math.hypot(dx, dy) || 1
    s.cx = s.hx + (dx / dist) * rod
    s.cy = s.hy + (dy / dist) * rod
    const rest = Math.atan2(s.height / 2 - s.hingeY, s.width / 2 - s.hingeX)
    s.angle = Math.atan2(s.cy - s.hy, s.cx - s.hx) - rest
    return Math.abs(vx) + Math.abs(vy)
  }, [])

  // Queda livre: gravidade, um pouco de ar, e a folha inclinada deriva de lado.
  const stepFalling = useCallback(() => {
    const s = sim.current
    let vx = (s.cx - s.pcx) * DAMPING
    const vy = (s.cy - s.pcy) * DAMPING
    vx += Math.sin(s.angle) * Math.max(vy, 0) * GLIDE * STEP * 10
    s.pcx = s.cx
    s.pcy = s.cy
    s.cx += vx
    s.cy += vy + GRAVITY * STEP * STEP
    s.angle += s.spin * STEP
    s.spin *= 0.995
    const card = cardRef.current
    const floor = (card?.clientHeight ?? 400) + Math.hypot(s.width, s.height) / 2
    return s.cy > floor ? 0 : 1
  }, [])

  const stepPhysics = useCallback(
    (elapsed: number) => {
      const s = sim.current
      let busy = 0
      s.carry += elapsed
      while (s.carry >= STEP) {
        s.carry -= STEP
        if (s.fase === "caindo") busy = stepFalling()
        else if (s.fase === "pendurado" || s.fase === "na-mao") busy = stepPendulum()
      }
      return busy
    },
    [stepFalling, stepPendulum]
  )

  const tick = useCallback(
    (now: number) => {
      const s = sim.current
      s.raf = 0
      const elapsed = s.last ? Math.min((now - s.last) / 1000, 0.05) : STEP
      s.last = now
      const busy = s.fase === "imprimindo" ? stepPrinting(elapsed) : stepPhysics(elapsed)
      draw()
      if (s.fase === "caindo" && busy === 0) {
        setFaseBoth("parado")
        s.last = 0
        return
      }
      const keepGoing = s.fase === "imprimindo" || s.fase === "caindo" || s.pointerId >= 0 || busy > REST_EPSILON
      if (keepGoing && s.visible) s.raf = requestAnimationFrame((t) => laco.current(t))
      else s.last = 0
    },
    [draw, setFaseBoth, stepPhysics, stepPrinting]
  )
  useEffect(() => {
    laco.current = tick
  }, [tick])

  const wake = useCallback(() => {
    const s = sim.current
    if (!s.raf && s.visible) s.raf = requestAnimationFrame(tick)
  }, [tick])

  const measure = useCallback(() => {
    const s = sim.current
    const card = cardRef.current
    const paper = paperRef.current
    if (!(card && paper)) return
    s.width = paper.offsetWidth
    s.height = paper.offsetHeight
    s.slotX = card.clientWidth / 2
  }, [])

  const imprimir = useCallback(() => {
    const s = sim.current
    measure()
    setRasgado(false)
    callbacks.current.aoImprimir?.()
    if (s.reduceMotion) {
      placeAtSlot(0)
      draw()
      setFaseBoth("pendurado")
      return
    }
    s.hidden = s.height
    s.feedTarget = s.height
    s.pause = 0.25
    placeAtSlot(-s.hidden)
    draw()
    setFaseBoth("imprimindo")
    wake()
  }, [draw, measure, placeAtSlot, setFaseBoth, wake])

  const tear = useCallback(
    (held: boolean) => {
      const s = sim.current
      setRasgado(true)
      haptic(14)
      callbacks.current.aoDestacar?.()
      printerRef.current?.animate([{ transform: "translate3d(0,1.5px,0)" }, { transform: "translate3d(0,0,0)" }], {
        duration: 220,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      })
      if (s.reduceMotion) {
        setFaseBoth("parado")
        return
      }
      setFaseBoth(held ? "na-mao" : "caindo")
      wake()
    },
    [setFaseBoth, wake]
  )

  // Imprime ao aparecer na tela; pausa a simulação quando sai dela.
  useEffect(() => {
    const s = sim.current
    const card = cardRef.current
    if (!card) return
    s.reduceMotion = menosMovimento()
    measure()
    placeAtSlot(-s.height)
    draw()
    let printed = false
    let onScreen = false
    const update = () => {
      s.visible = onScreen && !document.hidden
      if (!s.visible) {
        cancelAnimationFrame(s.raf)
        s.raf = 0
        s.last = 0
        return
      }
      if (imprimirAoVer && !printed) {
        printed = true
        imprimir()
      }
      wake()
    }
    const intersection = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        update()
      },
      { threshold: 0.4 }
    )
    intersection.observe(card)
    document.addEventListener("visibilitychange", update)
    return () => {
      intersection.disconnect()
      document.removeEventListener("visibilitychange", update)
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [imprimirAoVer, draw, measure, placeAtSlot, imprimir, wake])

  const localPoint = (event: PointerEvent) => {
    const rect = cardRef.current?.getBoundingClientRect()
    return rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : { x: 0, y: 0 }
  }

  // Um ponto do mundo para onde ele fica na folha.
  const toSheet = (x: number, y: number) => {
    const s = sim.current
    const [ox, oy] = turn(s.width / 2, s.height / 2, s.angle)
    return turn(x - (s.cx - ox), y - (s.cy - oy), -s.angle)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current
    if (s.fase !== "pendurado" || (event.pointerType === "mouse" && event.button !== 0)) return
    const { x, y } = localPoint(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    s.pointerId = event.pointerId
    s.startX = x
    s.startY = y
    const [gx, gy] = toSheet(x, y)
    s.grabX = gx
    s.grabY = gy
    s.samples = [{ t: event.timeStamp, x, y }]
    wake()
  }

  // Ainda presa: a folha gira em volta da saída para o ponto pego seguir a mão de lado, e estica um pouco para baixo.
  const dragAttached = (x: number, y: number) => {
    const s = sim.current
    const pull = damp(Math.max(0, y - s.startY), MAX_PULL)
    s.hingeX = s.width / 2
    s.hingeY = 0
    s.hx = s.slotX
    s.hy = SLOT_Y + pull
    const reach = Math.max(s.grabY, 24)
    const angle = -Math.atan2(x - s.slotX - (s.grabX - s.width / 2), reach)
    const [cx, cy] = hangAt(angle * 0.7)
    s.pcx = s.cx
    s.pcy = s.cy
    s.cx = cx
    s.cy = cy
    s.angle = angle * 0.7
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current
    if (s.pointerId !== event.pointerId) return
    const { x, y } = localPoint(event)
    s.samples.push({ t: event.timeStamp, x, y })
    if (s.samples.length > 5) s.samples.shift()
    if (s.fase === "pendurado") {
      if (y - s.startY > TEAR_DRAG) {
        // Rasga na saída e fica na mão, balançando de onde foi pega.
        s.hingeX = s.grabX
        s.hingeY = s.grabY
        s.hx = x
        s.hy = y
        tear(true)
      } else {
        dragAttached(x, y)
      }
    } else if (s.fase === "na-mao") {
      s.hx = x
      s.hy = y
    }
    wake()
  }

  const releaseVelocity = () => {
    const s = sim.current
    const first = s.samples[0]
    const last = s.samples.at(-1) ?? first
    const dt = Math.max((last.t - first.t) / 1000, 0.016)
    return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current
    if (s.pointerId !== event.pointerId) return
    s.pointerId = -1
    const { vx, vy } = releaseVelocity()
    if (s.fase === "na-mao") {
      // Arremessada: mantém a velocidade da mão e gira pelo balanço.
      const prevAngle = s.angle
      stepPendulum()
      s.spin = (s.angle - prevAngle) / STEP + vx * 0.002
      s.pcx = s.cx - vx * STEP * 0.6
      s.pcy = s.cy - vy * STEP * 0.6
      setFaseBoth("caindo")
    } else if (s.fase === "pendurado" && vy > TEAR_SPEED) {
      // Um puxão seco destaca de uma vez.
      s.pcx = s.cx - vx * STEP * 0.5
      s.pcy = s.cy - vy * STEP * 0.5
      s.spin = vx * 0.004
      tear(false)
    } else if (s.fase === "pendurado") {
      // Soltou: volta para a saída e o balanço termina sozinho.
      s.hy = SLOT_Y
      s.pcx = s.cx
      s.pcy = s.cy
    }
    wake()
  }

  const destacarPeloTeclado = () => {
    const s = sim.current
    if (s.fase === "pendurado") {
      s.spin = 1.2
      s.pcy = s.cy - 3
      tear(false)
    }
  }

  const situacao = fase === "imprimindo" ? "Imprimindo…" : fase === "pendurado" ? "Puxe para destacar" : "Pronto"

  return (
    <div
      className={cn("relative h-[30rem] w-72 overflow-hidden rounded-3xl border border-border bg-muted/40 text-foreground select-none", className)}
      ref={cardRef}
    >
      {/* A folha, cortada na saída até ser destacada. */}
      <div className={cn("absolute inset-x-0 bottom-0", rasgado ? "overflow-visible" : "overflow-hidden")} style={{ top: SLOT_Y }}>
        <div
          aria-label={`Comprovante de ${estabelecimento}, ${codigo}`}
          className={cn(
            "absolute top-0 w-56 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_24px_-12px_rgb(0_0_0/0.25)] outline-none",
            fase === "pendurado" && "cursor-grab active:cursor-grabbing",
            fase === "na-mao" && "cursor-grabbing",
            fase === "parado" && rasgado && "invisible"
          )}
          onLostPointerCapture={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={paperRef}
          role="document"
          style={{
            left: "50%",
            marginLeft: "-7rem",
            transformOrigin: "0 0",
            mask: rasgado ? MASK_TORN : MASK_RESTING,
            WebkitMask: rasgado ? MASK_TORN : MASK_RESTING,
            touchAction: "none",
          }}
        >
          {/* Picote na saída, por onde a folha rasga. */}
          {!rasgado && <span aria-hidden className="absolute inset-x-1 top-1 border-t-2 border-dotted border-border" />}
          <Papel {...props} />
        </div>
      </div>

      {/* A caixa da impressora, na frente da borda de cima do papel. */}
      <div className="absolute inset-x-0 top-0 h-16 border-b border-border bg-card" ref={printerRef}>
        <div className="flex items-center justify-between gap-3 px-5 pt-4 text-xs">
          <span className="truncate font-medium">{estabelecimento}</span>
          <span aria-live="polite" className="shrink-0 text-muted-foreground">
            {situacao}
          </span>
        </div>
        <div className="absolute inset-x-8 bottom-2 h-1 rounded-full bg-foreground" />
      </div>

      {fase === "pendurado" && (
        <button
          className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:bottom-4 focus:min-h-10 focus:rounded-full focus:bg-foreground focus:px-4 focus:text-xs focus:text-background"
          onClick={destacarPeloTeclado}
          type="button"
        >
          Destacar comprovante
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex justify-center p-5 transition-opacity duration-200 ease-out",
          fase === "parado" ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Button className="rounded-full px-4" isDisabled={fase !== "parado"} onPress={imprimir}>
          {rasgado ? "Imprimir outro" : "Imprimir comprovante"}
        </Button>
      </div>
    </div>
  )
}
