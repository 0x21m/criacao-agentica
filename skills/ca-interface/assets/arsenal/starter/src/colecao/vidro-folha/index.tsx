import * as React from "react"
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from "motion/react"
import { Dialog, Heading, Modal, ModalOverlay, type ModalOverlayProps } from "react-aria-components"

import { cn } from "@/lib/utils"
import { VidroLiquido } from "@/colecao/vidro-liquido"

// Starter: copiado do MIFT (src/colecao/vidro-folha), sem mudança de comportamento; a tinta é o véu do preset.
// MIFT: folha (sheet) de vidro no estilo do iOS 26: flutua acima da borda de baixo, com cantos grandes, em vidro
// espesso, e se arrasta pela alça. React Aria (ModalOverlay, Modal, Dialog): foco preso e devolvido, Esc fecha, toque
// fora fecha, título ligado ao diálogo. Gesto (apple-design): o arrasto segue o dedo 1:1 a partir de onde pegou, resiste
// para cima (elástico), e na soltura a posição final é projetada pela velocidade (v/1000 × 0,998/0,002): se a projeção
// passa da metade da folha, ela desce na velocidade do dedo e fecha; senão volta com mola sem quique.
// O véu escurece sem backdrop-filter: um ancestral com backdrop-filter viraria raiz de fundo e o vidro ficaria sem o que
// refratar. Movimento reduzido: entra e sai só com opacidade.

const projetar = (velocidade: number, desaceleracao = 0.998) => ((velocidade / 1000) * desaceleracao) / (1 - desaceleracao)

/** O corpo arrastável: montado a cada abertura, então a posição sempre começa em 0. */
function CorpoDaFolha({ titulo, fechar, altoContraste, children }: { titulo: React.ReactNode; fechar: () => void; altoContraste?: boolean; children: React.ReactNode }) {
  const controles = useDragControls()
  const y = useMotionValue(0)
  const folha = React.useRef<HTMLDivElement>(null)
  const soltar = (_: unknown, info: PanInfo) => {
    const altura = folha.current?.offsetHeight ?? 400
    const destino = y.get() + projetar(info.velocity.y)
    if (destino > altura / 2) {
      animate(y, altura + 24, { type: "spring", bounce: 0, duration: 0.35, velocity: info.velocity.y }).then(fechar)
    } else {
      animate(y, 0, { type: "spring", bounce: 0, duration: 0.4, velocity: info.velocity.y })
    }
  }
  return (
    <motion.div
      ref={folha}
      style={{ y }}
      drag="y"
      dragControls={controles}
      dragListener={false}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0.08, bottom: 1 }}
      dragMomentum={false}
      onDragEnd={soltar}
    >
      <VidroLiquido material="espesso" raio={32} espessura={1.2} altoContraste={altoContraste} cor="var(--sup-veu)" data-nivel="flutuante" className="flex max-h-[85dvh] flex-col">
        {/* Alça: pega o arrasto (40 px de altura); o teclado fecha com Esc. */}
        <div aria-hidden className="flex h-10 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing" onPointerDown={(e) => controles.start(e)}>
          <span className="h-1.5 w-10 rounded-full bg-[color-mix(in_oklch,var(--foreground)_28%,transparent)]" />
        </div>
        <Heading slot="title" className="px-6 text-xl font-semibold tracking-[-0.015em]">
          {titulo}
        </Heading>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pt-3 pb-6">{children}</div>
      </VidroLiquido>
    </motion.div>
  )
}

export function FolhaDeVidro({
  titulo,
  children,
  altoContraste,
  className,
  ...props
}: Omit<ModalOverlayProps, "children" | "className"> & {
  titulo: React.ReactNode
  /** Conteúdo; como função, recebe `fechar`. */
  children: React.ReactNode | ((fechar: () => void) => React.ReactNode)
  altoContraste?: boolean
  className?: string
}) {
  return (
    <ModalOverlay
      isDismissable
      {...props}
      className="fixed inset-0 z-50 bg-[color-mix(in_oklch,black_22%,transparent)] transition-opacity duration-300 data-entering:opacity-0 data-exiting:opacity-0"
    >
      <Modal
        className={cn(
          "fixed inset-x-2 bottom-2 mx-auto max-w-lg outline-none sm:bottom-4",
          "transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-entering:translate-y-[110%] data-exiting:translate-y-[110%] data-exiting:duration-300",
          "motion-reduce:data-entering:translate-y-0 motion-reduce:data-entering:opacity-0 motion-reduce:data-exiting:translate-y-0 motion-reduce:data-exiting:opacity-0",
          className
        )}
      >
        <Dialog className="outline-none">
          {({ close }) => (
            <CorpoDaFolha titulo={titulo} fechar={close} altoContraste={altoContraste}>
              {typeof children === "function" ? children(close) : children}
            </CorpoDaFolha>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
