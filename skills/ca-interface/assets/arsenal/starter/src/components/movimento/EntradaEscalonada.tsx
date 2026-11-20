// Cards que entram em sequência. O contêiner escalona; cada filho é um <ItemEscalonado> (aceita className, ex.: col-span).
// Uso: <EntradaEscalonada className="grid grid-cols-12 gap-4"><ItemEscalonado className="col-span-4">…</ItemEscalonado></EntradaEscalonada>
// Modo "abertura" (padrão): o conteúdo do servidor já aparece pronto; a sequência só toca sob a abertura (lib/entrada.ts).
import { createContext, useContext, type ReactNode } from "react"
import { motion, type Variants } from "motion/react"
import { mola } from "@/proto/movimento"
import { useMovimentoReduzido } from "@/lib/movimento-reduzido"
import { useEntrada, type ModoEntrada } from "@/lib/entrada"

const Ctx = createContext<{ inicial: false | "oculto" }>({ inicial: false })
const pai = (r: boolean): Variants => ({ oculto: {}, visivel: { transition: { staggerChildren: r ? 0 : 0.06 } } })
// com movimento reduzido, os cards aparecem de uma vez (sem deslocar nem esmaecer); ocultar é sempre instantâneo
const filho = (r: boolean): Variants => ({
  oculto: r ? { opacity: 1, y: 0 } : { opacity: 0, y: 12, transition: { duration: 0 } },
  visivel: { opacity: 1, y: 0, transition: r ? { duration: 0 } : mola.padrao },
})

/** `iniciar={false}` segura a entrada (ex.: até a abertura terminar). `entrada="sempre"` anima a cada montagem (demos). */
export function EntradaEscalonada({ children, className, iniciar = true, entrada = "abertura" }: {
  children: ReactNode; className?: string; iniciar?: boolean; entrada?: ModoEntrada
}) {
  const reduzido = useMovimentoReduzido()
  const e = useEntrada(entrada)
  const visivel = e.mostrar && (!e.animar || iniciar || reduzido)
  const inicial = entrada === "sempre" ? "oculto" : false
  return (
    <Ctx.Provider value={{ inicial }}>
      <motion.div className={className} variants={pai(reduzido)} initial={inicial} animate={visivel ? "visivel" : "oculto"}>
        {children}
      </motion.div>
    </Ctx.Provider>
  )
}

export function ItemEscalonado({ children, className }: { children: ReactNode; className?: string }) {
  const reduzido = useMovimentoReduzido()
  const { inicial } = useContext(Ctx)
  return <motion.div className={className} variants={filho(reduzido)} initial={inicial}>{children}</motion.div>
}
