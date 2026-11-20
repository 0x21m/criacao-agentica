// Detalhe da OS numa FolhaDeDetalhe (?id=OS-1052): eixos separados (etapa, orçamento, pagamento), o que o cliente lê,
// itens, nota interna e custo para quem pode, linha do tempo e as ações. O próximo passo direto (classe O) grava na hora
// com Desfazer dentro da folha; os que pedem confirmação (agendar, orçar, concluir) abrem a sheet da ação (classe P).
// A folha declara o registro aberto: a barra F oferece "Outra pessoa mexe neste registro" (conflito de versão, D2).
import { Suspense, lazy, useEffect, useState } from "react"
import { ArrowRight, ExternalLink, User, X } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { AvisoDesfazer, FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { FraseDoCliente, SeloEixo } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { BotaoLiquido } from "@/components/movimento"
import { marcarAberto, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES, recursoPorId } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { ATRASADA, ETAPA_OS, ORCAMENTO, PAGAMENTO, type EtapaOS } from "@/proto/projecao"
import { clientes } from "@/modulos/clientes/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { compras } from "@/modulos/estoque/dados"
import { moeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { COLUNAS_OS, atrasado, ctxPerm, ctxDaOS, diasDeAtraso, moverOS, pedidos, proximoPasso, type Pedido } from "../dados"
import type { AcaoOS } from "./AcoesOS"

// a sheet das ações (agendar, orçar, concluir) baixa só na primeira vez que alguém a abre
const SheetAcaoOS = lazy(() => import("./AcoesOS").then((m) => ({ default: m.SheetAcaoOS })))
import { DialogoCancelarOS } from "./CancelarOS"

const data = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—")

export function DetalheOS({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const os = pedidos.use().find((p) => p.id === id) ?? null
  const ags = agendamentos.use()
  const cmps = compras.use()
  const agora = useAgora()
  const papel = usePapel()
  const processando = useProcessando()
  const [acao, setAcao] = useState<AcaoOS>(null)
  const [usouAcao, setUsouAcao] = useState(false)
  useEffect(() => { if (acao) setUsouAcao(true) }, [acao])
  const [cancelando, setCancelando] = useState<Pedido | null>(null)
  const [movida, setMovida] = useState<{ id: string; antes: EtapaOS; agora: EtapaOS; n: number } | null>(null)
  useEffect(() => { marcarAberto(os ? (pedidos as unknown as Colecao<Registro>) : null, os?.id); return () => marcarAberto(null) }, [os?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const ctx = os ? ctxDaOS(os, ags, cmps) : {}
  const perm = os ? ctxPerm(os) : undefined
  const passo = os ? proximoPasso(os) : null
  const podeMover = !!os && pode(papel, "mover_os", perm)
  const podeCancelar = !!os && !["entregue", "cancelada"].includes(os.etapa) && pode(papel, "cancelar_os", perm)
  const ocupado = !!os && processando.has(os.id)
  const cliente = os ? clientes.porId(os.clienteId) : undefined

  function avancar() {
    if (!os || !passo) return
    if (passo.mov.tipo === "direto") {
      const etapa = passo.mov.etapa
      setMovida((m) => ({ id: os.id, antes: os.etapa, agora: etapa, n: (m?.n ?? 0) + 1 }))
      void moverOS(os.id, etapa)
    } else if (passo.mov.tipo === "agendar" || passo.mov.tipo === "orcamento" || passo.mov.tipo === "concluir") {
      // a sheet da ação substitui a folha (uma camada modal por vez)
      setAcao({ tipo: passo.mov.tipo, os })
      aoFechar()
    }
  }
  const rotuloPasso = passo && (passo.mov.tipo === "agendar" ? "Agendar visita" : passo.mov.tipo === "orcamento" ? "Enviar orçamento" : passo.mov.tipo === "concluir" ? "Concluir OS"
    : `Mover para ${COLUNAS_OS.find((c) => c.id === passo.coluna)?.titulo.toLowerCase()}`)

  return (
    <>
      <FolhaDeDetalhe
        aberto={!!os}
        aoFechar={aoFechar}
        sobre={os ? `${os.id} · ${UNIDADES[os.unidade].nome}` : undefined}
        titulo={os?.titulo ?? ""}
        selos={os && (
          <>
            <SeloEixo p={ETAPA_OS[os.etapa]} ctx={ctx} detalhe />
            {os.orcamento && <SeloEixo p={ORCAMENTO[os.orcamento.estado]} ctx={{ versao: os.orcamento.versao, ate: os.orcamento.validoAte, canal: os.orcamento.decisao?.canal, quando: os.orcamento.decisao?.em }} />}
            <SeloEixo p={PAGAMENTO[os.pagamento]} ctx={{ valor: os.total }} />
            {atrasado(os, agora) && <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(os, agora) }} detalhe />}
          </>
        )}
        rodape={os && (
          <>
            {podeCancelar && <Button variant="ghost" className="text-negativo-texto sm:mr-auto" onPress={() => { setCancelando(os); aoFechar() }} isDisabled={ocupado}><X /> Cancelar a OS</Button>}
            {passo && podeMover && (
              <BotaoLiquido onClick={avancar} disabled={ocupado}><ArrowRight className="size-4" /> {ocupado ? "Enviando…" : rotuloPasso}</BotaoLiquido>
            )}
          </>
        )}
      >
        {os && (
          <>
            <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="min-w-0 break-words"><a className="link-sistema" href={url(`clientes/?id=${os.clienteId}`)}>{cliente?.nome ?? "Cliente removido"}</a></dd>
              <dt className="text-muted-foreground">Valor</dt><dd className="num min-w-0 break-words">{os.total ? moeda(os.total) : "Sob orçamento"}</dd>
              <dt className="text-muted-foreground">Prazo</dt>
              <dd className="num">{data(os.prazo)}{os.previsaoAnterior && <span className="block text-xs text-muted-foreground">antes {data(os.previsaoAnterior)}: {os.motivoAtraso}</span>}</dd>
              <dt className="text-muted-foreground">Técnico</dt><dd className="flex items-center gap-1.5"><User className="size-3.5" aria-hidden="true" /> {recursoPorId(os.responsavelId)?.nome ?? "Sem técnico"}</dd>
              {pode(papel, "ver_custo") && os.custo !== undefined && <><dt className="text-muted-foreground">Custo</dt><dd className="num">{moeda(os.custo)}{os.total > 0 && <span className="text-xs text-muted-foreground"> · margem {Math.round((1 - os.custo / os.total) * 100)} %</span>}</dd></>}
            </dl>

            {ETAPA_OS[os.etapa].cliente && (
              <div className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5">
                <p className="t-rotulo mb-1">O cliente lê</p>
                <FraseDoCliente p={ETAPA_OS[os.etapa]} ctx={ctx} />
              </div>
            )}

            <section aria-labelledby="itens-os">
              <h3 id="itens-os" className="t-card mb-2">Itens</h3>
              {os.itens.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[color-mix(in_oklch,var(--foreground)_14%,transparent)] p-4 text-center text-sm text-muted-foreground">Adicione o primeiro item do orçamento.</p>
              ) : (
                <ul className="grid gap-1.5 text-sm">
                  {os.itens.map((i, n) => (
                    <li key={n} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <span className="truncate" title={i.descricao}>{i.qtd > 1 ? `${i.qtd} × ` : ""}{i.descricao}</span>
                      <span className="num text-right">{moeda(i.qtd * i.unitario)}</span>
                    </li>
                  ))}
                  <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pt-1.5 font-semibold">
                    <span>Total</span><span className="num text-right">{moeda(os.total)}</span>
                  </li>
                </ul>
              )}
            </section>

            {os.notaInterna && pode(papel, "nota_interna") && (
              <p className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_12%,transparent)] px-3 py-2 text-sm"><span className="t-rotulo block">Nota interna (o cliente não vê)</span>{os.notaInterna}</p>
            )}

            {movida && movida.id === os.id && (
              <AvisoDesfazer chave={movida.n} texto={`Movida para ${ETAPA_OS[movida.agora].rotulo.toLowerCase()}.`} aoDesfazer={() => void moverOS(os.id, movida.antes)} />
            )}

            <LinkButton variant="outline" className="h-10 justify-self-start" href={url(`pedidos/ver/?id=${os.id}`)}><ExternalLink /> Abrir página: orçamento, checklist e via</LinkButton>

            <section aria-labelledby="hist-os">
              <h3 id="hist-os" className="t-card mb-2">Linha do tempo</h3>
              <LinhaDoTempo eventos={os.historico} />
            </section>
          </>
        )}
      </FolhaDeDetalhe>
      {usouAcao && <Suspense fallback={null}><SheetAcaoOS c={acao} onFechar={() => setAcao(null)} /></Suspense>}
      <DialogoCancelarOS os={cancelando} aoFechar={() => setCancelando(null)} />
    </>
  )
}
