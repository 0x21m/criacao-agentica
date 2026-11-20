// Título que entra por palavra ou por linha (separe as linhas com \n).
// Uso: <TextoRevelado texto="Bom dia, Marina" como="h1" className="text-2xl" />
import { motion } from "motion/react"
import { mola } from "@/proto/movimento"
import { useMovimentoReduzido } from "@/lib/movimento-reduzido"
import { useEntrada, type ModoEntrada } from "@/lib/entrada"

type Tag = "h1" | "h2" | "h3" | "p" | "span"

/** `iniciar={false}` segura a entrada (ex.: até a abertura terminar). `entrada="sempre"` revela a cada montagem (demos). */
export function TextoRevelado({ texto, como = "h2", por = "palavra", atraso = 0, iniciar = true, entrada = "abertura", className }: {
  texto: string; como?: Tag; por?: "palavra" | "linha"; atraso?: number; iniciar?: boolean; entrada?: ModoEntrada; className?: string
}) {
  const reduzido = useMovimentoReduzido()
  const e = useEntrada(entrada)
  const Tag = como
  // modo "abertura" sem abertura na tela: o título do servidor fica como está (nada de esconder para revelar)
  if (reduzido || !e.animar) return <Tag className={className}>{texto.replace(/\n/g, " ")}</Tag>
  const partes = por === "linha" ? texto.split("\n") : texto.split(/(\s+)/)
  let n = 0
  return (
    <Tag className={className}>
      <span className="sr-only">{texto.replace(/\n/g, " ")}</span>
      <span aria-hidden="true">
        {partes.map((p, i) =>
          /^\s+$/.test(p) ? p : (
            <span key={i} className={por === "linha" ? "block overflow-hidden" : "inline-block overflow-hidden align-bottom"}>
              <motion.span
                className="inline-block"
                initial={{ y: "0.6em", opacity: 0 }}
                animate={iniciar && e.mostrar ?{ y: 0, opacity: 1 } : { y: "0.6em", opacity: 0 }}
                transition={{ ...mola.padrao, delay: atraso + n++ * (por === "linha" ? 0.08 : 0.045) }}
              >{p}</motion.span>
            </span>
          ),
        )}
      </span>
    </Tag>
  )
}
