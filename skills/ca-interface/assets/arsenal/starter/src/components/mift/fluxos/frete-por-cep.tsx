import * as React from "react"
import {
  MapPinIcon,
  PackageIcon,
  TriangleAlertIcon,
  TruckIcon,
  ZapIcon,
} from "lucide-react"

import { CampoCep, type ConsultaCep } from "@/components/mift/fluxos/campos-br"
import { Falha } from "@/components/mift/estados"
import { useEnvio, type ResultadoAcao } from "@/components/mift/operacao/envio"
import { Valor } from "@/components/mift/painel/valor"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// MIFT: o frete de um produto para o CEP de quem compra (camada fluxos), na página do produto e onde mais a pergunta
// "quanto custa e quando chega aqui?" aparecer. Fechado, diz para onde ("Serra Clara/MG" e "CEP 37640-120", que desce
// de linha) com "Alterar"; aberto, o `CampoCep` (busca a cidade enquanto digita) e "Calcular". Embaixo, as opções
// que a aplicação calculou (econômica, expressa), cada uma com a frase do prazo ("Chega até qui, 30 out") e o preço
// ("Grátis" em destaque quando é zero), ou o motivo de não entregar no CEP no lugar (planta viva longe, região fora
// da loja), ou o erro com "Tentar de novo". Trocar o CEP é um pedido (`aoTrocarCep` devolve `ResultadoAcao`): o motivo
// da recusa fica no campo. A peça não calcula frete nem prazo. Referências (Mobbin): Mercado Livre ("Chegará grátis
// amanhã", "Enviar para …"), Amazon ("Entregar em …" com o CEP), Shopee (opções de envio com prazo). Sem código
// copiado.

export type OpcaoDoFrete = {
  id: string
  rotulo: string
  /** A frase do prazo, da aplicação: "Chega até qui, 30 out", "Chega amanhã". */
  prazo: string
  /** Centavos; 0 é "Grátis". */
  preco: number
  /** Rápida (ícone de raio) ou padrão (caminhão). */
  rapida?: boolean
}

export type SituacaoDoFrete =
  | { estado: "carregando" }
  | { estado: "pronto"; opcoes: OpcaoDoFrete[] }
  | { estado: "indisponivel"; motivo: string }
  | { estado: "erro"; motivo?: string; tentar: () => void }

export type PropsDoFretePorCep = {
  /** O CEP de entrega (8 dígitos) ou vazio quando ainda não há. */
  cep: string
  /** "Serra Clara/MG": de onde a aplicação já sabe. */
  local?: string
  frete: SituacaoDoFrete
  aoTrocarCep: (cep: string) => Promise<ResultadoAcao>
  /** A consulta do CEP (mostra a cidade enquanto digita). */
  consultar?: (cep: string, sinal: AbortSignal) => Promise<ConsultaCep>
  /** Uma linha sob as opções ("Frete grátis na econômica acima de R$ 99,00 nesta loja"). */
  dica?: React.ReactNode
  titulo?: string
  className?: string
}

const formatarCep = (cep: string) =>
  cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep

export function FretePorCep({
  cep,
  local,
  frete,
  aoTrocarCep,
  consultar,
  dica,
  titulo = "Entrega",
  className,
}: PropsDoFretePorCep) {
  // Sem CEP ainda (a aplicação está buscando ou a pessoa nunca deu um), o campo aparece aberto.
  const [trocando, setEditando] = React.useState(false)
  const editando = trocando || !cep
  const [novo, setNovo] = React.useState(cep)
  const idTitulo = React.useId()
  const idErro = React.useId()
  const campo = React.useRef<HTMLDivElement>(null)
  const envio = useEnvio(() => aoTrocarCep(novo))
  const calcular = async () => {
    if (novo.length !== 8) return
    const r = await envio.enviar()
    if (r?.ok) setEditando(false)
  }
  React.useEffect(() => {
    if (trocando) campo.current?.querySelector("input")?.focus()
  }, [trocando])

  return (
    <section
      aria-labelledby={idTitulo}
      data-slot="frete-por-cep"
      className={cn(
        "flex flex-col gap-3 rounded-[calc(var(--radius)*1.6)] border bg-card p-4 text-card-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <MapPinIcon
            aria-hidden
            className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
          />
          <div className="flex min-w-0 flex-col">
            <h3 id={idTitulo} className="text-sm font-semibold">
              {titulo}
            </h3>
            {!editando && cep && (
              <p
                data-conteudo
                className="flex flex-wrap gap-x-2 text-sm text-muted-foreground"
              >
                {local && <span>{local}</span>}
                <span className="tabular-nums">CEP {formatarCep(cep)}</span>
              </p>
            )}
          </div>
        </div>
        {!editando && (
          <Button
            variant="ghost"
            size="sm"
            className="-my-1 -mr-2 shrink-0"
            onPress={() => {
              setNovo(cep)
              setEditando(true)
            }}
          >
            Alterar
          </Button>
        )}
      </div>

      {editando && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void calcular()
          }}
        >
          <div ref={campo} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <CampoCep
                valor={novo}
                aoMudar={setNovo}
                consultar={consultar}
                rotulo="CEP de entrega"
                invalido={!!envio.falha}
                descritoPor={envio.falha ? idErro : undefined}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="h-11 shrink-0"
              isPending={envio.enviando}
              isDisabled={novo.length !== 8}
            >
              Calcular
            </Button>
          </div>
          {envio.falha && (
            <p id={idErro} className="text-sm font-medium text-destructive">
              {envio.falha.motivo}
            </p>
          )}
          {cep && (
            <Button
              variant="link"
              size="sm"
              className="self-start px-0"
              onPress={() => setEditando(false)}
            >
              Manter {formatarCep(cep)}
            </Button>
          )}
        </form>
      )}

      {!editando && cep && (
        <div aria-live="polite" className="flex flex-col">
          {frete.estado === "carregando" && (
            <div aria-busy="true" className="flex flex-col gap-2">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
          )}
          {frete.estado === "indisponivel" && (
            <p className="flex items-start gap-2 rounded-xl bg-alerta/15 p-3 text-sm">
              <TriangleAlertIcon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-alerta-texto"
              />
              <span>
                <span className="font-semibold">Não entrega nesse CEP.</span>{" "}
                {frete.motivo}
              </span>
            </p>
          )}
          {frete.estado === "erro" && (
            <Falha
              motivo={frete.motivo ?? "Não deu para calcular o frete agora."}
              aoTentarDeNovo={frete.tentar}
              sobre="frete"
            />
          )}
          {frete.estado === "pronto" && (
            <ul className="flex flex-col divide-y">
              {frete.opcoes.map((o) => {
                const Icone = o.rapida
                  ? ZapIcon
                  : o.preco === 0
                    ? PackageIcon
                    : TruckIcon
                return (
                  <li
                    key={o.id}
                    className="flex min-h-12 items-center gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <Icone
                      aria-hidden
                      className={cn(
                        "size-4.5 shrink-0",
                        o.preco === 0
                          ? "text-positive"
                          : "text-muted-foreground"
                      )}
                    />
                    {/* O prazo ocupa a largura toda; o tipo e o preço dividem a linha de baixo (a 320 px, o prazo
                        ao lado do preço quebrava em duas linhas). */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{o.prazo}</span>
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {o.rotulo}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {o.preco === 0 ? (
                            <span className="rounded-full bg-positive/12 px-2 py-0.5 text-xs font-semibold text-positive">
                              Grátis
                            </span>
                          ) : (
                            <Valor v={o.preco / 100} />
                          )}
                        </span>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {dica && frete.estado === "pronto" && (
            <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              {dica}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
