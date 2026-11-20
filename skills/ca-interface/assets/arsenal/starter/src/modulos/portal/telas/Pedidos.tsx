// /portal/pedidos/ · o histórico (5.12): os pedidos com os itens visíveis sem abrir (CLI-16), no segmentado de vidro
// Em andamento · Concluídos (o filtro vive na URL, ?ver=concluidos). Os comprovantes ficam no próprio pedido.
import { SearchX } from "lucide-react"
import { LinkButton } from "@/components/ui/button"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { EstadoVazio } from "@/components/app/estados"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { useDadosDoCliente } from "../dados"
import { BannerCliente, CartaoPedido, ComDadosCliente, ir } from "./comum"

export default function Pedidos() {
  const dados = useDadosDoCliente()
  const [f, setF] = useParametrosDaUrl({ ver: "andamento" })
  const abertos = dados.pedidos.filter((p) => p.fase !== "concluido")
  const concluidos = dados.pedidos.filter((p) => p.fase === "concluido")
  const lista = f.ver === "concluidos" ? concluidos : abertos
  return (
    <ComDadosCliente estaVazio={!dados.pedidos.length} titulo="Meus pedidos">
      <BannerCliente titulo="Meus pedidos" descricao={`${dados.pedidos.length} ${dados.pedidos.length === 1 ? "pedido" : "pedidos"} desde que você chegou à Oficina Norte.`}>
        <div className="max-w-md">
          <SegmentadoDeVidro aria-label="Mostrar" valor={f.ver === "concluidos" ? "concluidos" : "andamento"} aoMudar={(v) => setF({ ver: v === "andamento" ? "" : v })}
            opcoes={[{ id: "andamento", rotulo: "Em andamento", contagem: abertos.length }, { id: "concluidos", rotulo: "Concluídos", contagem: concluidos.length }]} />
        </div>
      </BannerCliente>
      <div className="px-3 pt-6 md:px-6">
        {lista.length ? (
          <ul className="grid gap-3 md:grid-cols-2" aria-label={f.ver === "concluidos" ? "Pedidos concluídos" : "Pedidos em andamento"}>
            {lista.map((p) => <li key={p.id} className="grid"><CartaoPedido p={p} /></li>)}
          </ul>
        ) : (
          <EstadoVazio variante="filtro" icone={SearchX} titulo={f.ver === "concluidos" ? "Nenhum pedido concluído ainda." : "Nada em andamento agora."}
            acao={f.ver === "concluidos" ? undefined : <LinkButton className="h-10" href={ir.agendar()}>Agendar um serviço</LinkButton>} />
        )}
      </div>
    </ComDadosCliente>
  )
}
