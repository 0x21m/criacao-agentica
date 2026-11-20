// Módulo Configurações · /configuracoes/indisponivel/?modulo=estoque&de=estoque/compras: o que a equipe vê ao entrar
// num módulo desligado ou fora do ar (EST-47). Abre para qualquer papel; nenhum dado do módulo aparece aqui.
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { IDS_OPCIONAIS, OPCIONAL, type IdOpcional } from "../dados"
import { ModuloIndisponivel } from "./ModuloIndisponivel"

export default function Indisponivel() {
  const [f] = useParametrosDaUrl({ modulo: "estoque", de: "" })
  const id: IdOpcional = IDS_OPCIONAIS.includes(f.modulo as IdOpcional) ? (f.modulo as IdOpcional) : IDS_OPCIONAIS[0]
  return (
    <>
      <CabecalhoPagina titulo={OPCIONAL[id].nome} descricao="Situação do módulo para a equipe">
        <ModuloIndisponivel id={id} de={f.de} />
      </CabecalhoPagina>
      <div className="h-6" />
    </>
  )
}
