import * as React from "react"
import type { Transition } from "motion/react"

/**
 * MIFT: o movimento do app, num lugar só. Molas (não curvas de tempo) para o que o dedo move ou
 * que entra e sai da tela; tempos curtos para o retorno de toque. Valores calibrados no laboratório.
 *
 * Molas para o `motion` (transition={mola.camada}).
 */
export const mola = {
  /** Painel e diálogo entrando e saindo; sem quique (é conteúdo, não brinquedo). */
  camada: { type: "spring", duration: 0.42, bounce: 0 },
  /** Indicador da aba ativa na barra inferior; um leve quique dá vida. */
  indicador: { type: "spring", duration: 0.35, bounce: 0.15 },
  /** Elementos pequenos que surgem (contadores, selos, menus). */
  surgir: { type: "spring", duration: 0.3, bounce: 0.15 },
  /** Um item que muda de lugar (cartão para outra coluna, bloco para outro horário): sem quique, chega e para. */
  mover: { type: "spring", duration: 0.4, bounce: 0 },
  /** O que o dedo ou o mouse soltou: assenta com um quique leve (o gesto trouxe impulso). */
  assentar: { type: "spring", duration: 0.35, bounce: 0.25 },
} as const satisfies Record<string, Transition>

/** Tempos em milissegundos. */
export const tempo = {
  /** Retorno de toque (pressionado): imediato, no dedo descendo. */
  toque: 100,
  /** Transições de cor e fundo (hover, seleção). */
  estado: 150,
  /** Fundo escurecido de camada aparecendo/sumindo. */
  fundo: 200,
  /** Dica (tooltip) depois de parar o mouse. */
  dica: 450,
  /** Toque longo que abre o menu de uma linha. */
  toqueLongo: 480,
  /** Distância (px) que o dedo pode andar sem cancelar o toque longo. */
  toleranciaDoDedo: 10,
  /** Vibração curta ao abrir o menu por toque longo. */
  vibracao: 8,
  /** Ação ainda sem resposta depois disto: o aviso "carregando" aparece (e vira o resultado). Antes, só o botão gira. */
  avisoDeAndamento: 1200,
} as const

/** Escala ao pressionar: botões e áreas tocáveis. */
export const pressionar = { botao: 0.97, item: 0.98, aba: 0.95 } as const

/** Menos movimento (sem molas, sem rolagem suave): pedido pelo sistema ou pela pessoa no painel de personalização (`data-movimento="reduzido"`). */
export const menosMovimento = () =>
  (typeof document !== "undefined" && document.documentElement.getAttribute("data-movimento") === "reduzido") ||
  (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)

/**
 * `menosMovimento` como hook (acompanha a troca da preferência). No lugar do `useReducedMotion` do motion, que em
 * desenvolvimento avisa "You have Reduced Motion enabled" só por ser chamado (a camada fechada da casca avisava em toda
 * página, e o aviso contava como erro nas jornadas com movimento reduzido).
 */
export function useMenosMovimento() {
  return React.useSyncExternalStore(
    (avisar) => {
      if (typeof matchMedia === "undefined") return () => {}
      const consulta = matchMedia("(prefers-reduced-motion: reduce)")
      consulta.addEventListener("change", avisar)
      return () => consulta.removeEventListener("change", avisar)
    },
    menosMovimento,
    () => false
  )
}

/**
 * Vibração leve no celular, no mesmo quadro do resultado (nunca antes): `confirmar` é um toque curto (ação que deu
 * certo, item que assentou), `erro` são dois (recusa, falha). Só no toque (no mouse não há o que vibrar), só onde o
 * navegador deixa (o iPhone ignora; o Android vibra) e só depois de um toque na página: sem ele o navegador bloqueia e
 * avisa no console (tela que abre sozinha, resposta que chega antes de a pessoa tocar).
 */
/** Padrão próprio (número ou lista em ms) quando o gesto pede: marcas ao longo de um trilho, impressão que avança. */
export function vibrar(tipo: "confirmar" | "erro" | number | number[] = "confirmar") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  if (typeof matchMedia !== "undefined" && !matchMedia("(pointer: coarse)").matches) return
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  try {
    navigator.vibrate(tipo === "erro" ? [24, 60, 24] : tipo === "confirmar" ? 10 : tipo)
  } catch {
    // Sem vibração (permissão, aparelho): o retorno visual basta.
  }
}

/**
 * As mesmas molas em curva de CSS e WAAPI (`linear()`), para o que anda sem React (o voo): `mover` sem passar do ponto
 * (amortecimento 1), `assentar` com uma passada leve (amortecimento 0,78, 2%). Iguais às de `global.css` (--mola).
 */
export const curva = {
  mover: { duracao: 420, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" },
  assentar: {
    duracao: 500,
    easing:
      "linear(0, 0.028, 0.099, 0.194, 0.3, 0.409, 0.514, 0.61, 0.695, 0.769, 0.83, 0.881, 0.921, 0.953, 0.976, 0.993, 1.005, 1.013, 1.017, 1.019, 1.02, 1.019, 1.018, 1.016, 1.013, 1.011, 1)",
  },
} as const

/** Onde cada elemento estava (por chave), lido ANTES da mudança: é o ponto de partida do voo. */
export type Retrato = Map<string, DOMRect>

/** Lê a posição na tela de cada elemento, com a transformação em curso (o voo seguinte parte de onde ele está agora). */
export function fotografar(elementos: Iterable<[string, Element]>): Retrato {
  const r: Retrato = new Map()
  for (const [chave, el] of elementos) r.set(chave, el.getBoundingClientRect())
  return r
}

/**
 * Voo (FLIP): depois da mudança, cada elemento do retrato que mudou de lugar parte do lugar antigo e anda até o novo
 * com a curva da mola, só com `transform` (WAAPI: roda fora da thread principal e não deixa estilo para trás). Os vizinhos que abriram ou fecharam espaço andam junto.
 * Interrompível: um voo novo parte de onde o elemento está agora (o retrato lê a posição com a transformação).
 * `destaques` levantam um pouco no caminho (o item que o usuário moveu); `assentar` não voa: aparece onde caiu com um
 * quique (o que o mouse soltou já está no destino). Menos movimento: nada anda; o item movido só acende.
 */
export function voar(
  antes: Retrato,
  achar: (chave: string) => HTMLElement | null | undefined,
  { destaques, assentar }: { destaques?: ReadonlySet<string>; assentar?: ReadonlySet<string> } = {}
): Promise<void> {
  const reduzido = menosMovimento()
  const voos: Promise<unknown>[] = []
  const chaves = new Set([...antes.keys(), ...(assentar ?? [])])
  for (const chave of chaves) {
    const el = achar(chave)
    if (!el) continue
    // O voo anterior (se houver) para aqui; a posição de partida já foi lida no retrato.
    for (const a of el.getAnimations()) if (!("animationName" in a) && !("transitionProperty" in a)) a.cancel()
    if (assentar?.has(chave)) {
      if (reduzido) el.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 180, easing: "ease-out" })
      else voos.push(el.animate([{ transform: "scale(1.04)" }, { transform: "none" }], { duration: curva.assentar.duracao, easing: curva.assentar.easing }).finished.catch(() => {}))
      continue
    }
    const r0 = antes.get(chave)
    if (!r0) continue
    const r1 = el.getBoundingClientRect()
    const dx = r0.left - r1.left
    const dy = r0.top - r1.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
    const destaque = destaques?.has(chave)
    if (reduzido) {
      if (destaque) el.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 180, easing: "ease-out" })
      continue
    }
    // Quem voa por cima dos outros fica na frente deles durante o voo.
    const estatico = getComputedStyle(el).position === "static"
    if (estatico) el.style.position = "relative"
    el.style.zIndex = destaque ? "40" : "1"
    const de = `translate(${dx}px, ${dy}px)${destaque ? " scale(1.03)" : ""}`
    voos.push(
      el
        .animate([{ transform: de }, { transform: "none" }], { duration: curva.mover.duracao, easing: curva.mover.easing })
        .finished.catch(() => {})
        .then(() => {
          // Outro voo pode ter começado no meio (interrompido): só limpa se nenhum está rodando.
          if (el.getAnimations().some((a) => a.playState === "running")) return
          el.style.zIndex = ""
          if (estatico) el.style.position = ""
        })
    )
  }
  return Promise.all(voos).then(() => undefined)
}
