// Estado de região de módulo indisponível (EST-47) para os módulos opcionais deste módulo. A peça mora na base
// (src/components/app/ModuloIndisponivel.tsx, usada pelo guarda de rota do AppShell); aqui só entram os textos do opcional.
import { ModuloIndisponivel as Base } from "@/components/app/ModuloIndisponivel"
import { OPCIONAL, existeOpcional, type IdOpcional } from "../dados"

export function ModuloIndisponivel({ id, de, className }: { id: IdOpcional; /** Rota que a pessoa tentou abrir. */ de?: string; className?: string }) {
  const info = OPCIONAL[id]
  return <Base id={id} nome={info.nome} genero={info.g} dados={id === "estoque" ? info.dados : undefined} rota={existeOpcional(id) ? info.rota ?? undefined : undefined}
    de={de && info.rota && de.startsWith(info.rota.replace(/\/$/, "")) ? de : undefined} ondeLigar={`configuracoes/modulos/#${id}`} className={className} />
}
