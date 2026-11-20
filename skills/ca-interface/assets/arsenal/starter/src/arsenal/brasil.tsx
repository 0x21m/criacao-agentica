// Demos das peças brasileiras e da coleção vindas do MIFT UI (0x21m/mift-ui, 4387a95), para o /arsenal.
import { useState, type ReactNode } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComprovantePix } from "@/components/mift/fluxos/comprovante-pix"
import { FretePorCep, type SituacaoDoFrete } from "@/components/mift/fluxos/frete-por-cep"
import { TecladoNumerico } from "@/components/mift/fluxos/teclado-numerico"
import { ComprovanteImpresso } from "@/colecao/comprovante-impresso"
import { DeslizarParaConfirmar } from "@/colecao/deslizar-para-confirmar"
import { NumeroDeslizante } from "@/colecao/numero-deslizante"
import { BotaoDeVidro } from "@/colecao/vidro-botao"

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

function FreteDemo() {
  const [cep, setCep] = useState("30130-010")
  const [frete, setFrete] = useState<SituacaoDoFrete>({
    estado: "pronto",
    opcoes: [
      { id: "eco", rotulo: "Econômica", prazo: "Chega até qui, 20 nov", preco: 0 },
      { id: "exp", rotulo: "Expressa", prazo: "Chega amanhã", preco: 24.9, rapida: true },
    ],
  })
  return (
    <FretePorCep
      cep={cep}
      local="Belo Horizonte/MG"
      frete={frete}
      dica="Frete grátis na econômica acima de R$ 99,00."
      aoTrocarCep={async (novo) => {
        setFrete({ estado: "carregando" })
        await espera(700)
        setCep(novo)
        setFrete({ estado: "pronto", opcoes: [{ id: "eco", rotulo: "Econômica", prazo: "Chega até sex, 21 nov", preco: 18.5 }] })
        return { ok: true }
      }}
    />
  )
}

function TecladoDemo() {
  const [peso, setPeso] = useState("")
  return <TecladoNumerico rotulo="Peso do volume" tipo="peso" max={20} descricao="Até 20 kg" valor={peso} aoMudar={setPeso} rotuloConfirmar="Lançar peso" aoConfirmar={async () => { await espera(500); return { ok: true, mensagem: "Peso lançado." } }} />
}

function NumeroDemo() {
  const [n, setN] = useState(128)
  return (
    <div className="grid gap-4">
      <NumeroDeslizante valor={n} anunciar className="text-4xl font-semibold tracking-tight" />
      <div className="flex gap-2">
        <Button variant="outline" onPress={() => setN((v) => Math.max(0, v - 1))}><Minus /> Tirar 1</Button>
        <Button onPress={() => setN((v) => v + 25)}><Plus /> Somar 25</Button>
      </div>
    </div>
  )
}

function DeslizarDemo() {
  const [chave, setChave] = useState(0)
  return (
    <div className="grid max-w-sm gap-3">
      <DeslizarParaConfirmar key={chave} rotulo="Deslize para pagar R$ 1.284,00" rotuloCurto="Pagar R$ 1.284,00" rotuloAndamento="Pagando" rotuloFeito="Pago"
        aoConfirmar={async () => { await espera(900); return { ok: true } }} voltarDepois={2600} />
      <Button variant="ghost" size="sm" className="w-fit" onPress={() => setChave((c) => c + 1)}>Recomeçar</Button>
    </div>
  )
}

const caixa = (filho: ReactNode) => <div className="grid gap-4">{filho}</div>

export const BRASIL: Record<string, () => ReactNode> = {
  "comprovante-pix": () => caixa(
    <ComprovantePix titulo="Pix enviado" valor={4200} quando="16/11/2026 às 09h41"
      de={{ nome: "Marina Duarte", documento: "***.512.338-**", instituicao: "Banco Exemplo" }}
      para={{ nome: "Oficina Norte Ltda.", documento: "21.670.493/0001-12", instituicao: "Cooperativa Exemplo", chave: "CNPJ" }}
      mensagem="Sinal do pedido #1042" />,
  ),
  "frete-por-cep": () => <FreteDemo />,
  "teclado-numerico": () => <TecladoDemo />,
  "comprovante-impresso": () => caixa(
    <ComprovanteImpresso estabelecimento="Oficina Norte" data="16 nov 2026 · 09:41" codigo="Pedido #1042"
      itens={[{ nome: "Troca de vitrine", quantidade: 1, preco: 3890 }, { nome: "Película de proteção", quantidade: 2, preco: 180 }]} />,
  ),
  "deslizar-para-confirmar": () => <DeslizarDemo />,
  "numero-deslizante": () => <NumeroDemo />,
  "vidro-botao": () => (
    <div className="flex flex-wrap gap-3 rounded-xl bg-[linear-gradient(135deg,var(--chart-1),var(--chart-3))] p-8">
      <BotaoDeVidro>Botão de vidro</BotaoDeVidro>
      <BotaoDeVidro tom="principal">Ação principal</BotaoDeVidro>
    </div>
  ),
}
