// Módulo Pedidos · "Imprimir a via" da OS: o comprovante-impresso (arsenal) num diálogo. O papel sai da impressora
// pelo botão do próprio comprovante. Carregado sob demanda pela página da OS.
import { Button } from "@/components/ui/button"
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ComprovanteImpresso } from "@/colecao/comprovante-impresso"
import { UNIDADES, recursoPorId } from "@/proto/negocio"
import { ETAPA_OS } from "@/proto/projecao"
import { nomeCliente } from "@/modulos/clientes/dados"
import { dataCurta, dataHora } from "@/lib/formato"
import type { Pedido } from "../dados"

export default function ViaImpressa({ os, aoFechar }: { os: Pedido; aoFechar: () => void }) {
  return (
    <Dialog isOpen onOpenChange={(o) => { if (!o) aoFechar() }} className="sm:max-w-md">
      <DialogHeader><DialogTitle>Via da {os.id}</DialogTitle></DialogHeader>
      <div className="max-h-[65dvh] overflow-y-auto py-2">
        <ComprovanteImpresso
          estabelecimento={`Oficina Norte · ${UNIDADES[os.unidade].nome}`}
          data={dataHora(os.criadoEm)}
          codigo={os.id}
          itens={os.itens.map((i) => ({ nome: i.descricao, quantidade: i.qtd, preco: i.unitario }))}
          dados={[
            { rotulo: "Cliente", valor: nomeCliente(os.clienteId) },
            { rotulo: "Etapa", valor: ETAPA_OS[os.etapa].rotulo },
            { rotulo: "Técnico", valor: recursoPorId(os.responsavelId)?.nome ?? "A definir" },
            { rotulo: "Prazo", valor: dataCurta(os.prazo) },
          ]}
          total={os.total}
          imprimirAoVer={false}
          mensagem={os.orcamento ? `Orçamento v${os.orcamento.versao}. Garantia de 90 dias após a conclusão.` : "Garantia de 90 dias após a conclusão."}
          className="mx-auto"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onPress={aoFechar}>Fechar</Button>
      </DialogFooter>
    </Dialog>
  )
}
