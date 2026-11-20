// Módulo Mensagens · /notificacoes/: a central de notificações (no celular é o sino em tela cheia, 5.9). Não lidas ·
// Todas, agrupadas por dia; cada item diz o que aconteceu, o que fazer e abre o objeto exato (COM-18, PON-19).
// "Marcar todas como lidas" é otimista com Desfazer. Lê `notificacoesDe(papel)`: as gravadas para a pessoa ou o papel e
// as derivadas do que o cliente fez numa OS (aprovar, pagar).
// Arsenal: CabecalhoPagina, BarraFerramentas, SegmentadoDeVidro, Superficie, EstadoVazio (concluído).
import { Fragment, useMemo } from "react"
import { BellOff, CalendarClock, Check, CheckCheck, ClipboardList, MessageSquare, Wallet, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { useAgora } from "@/proto/relogio"
import { usePapel, usePessoa } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { lerNotificacao, lerTodas, notificacoes, notificacoesDe, type Notificacao, type TipoNotificacao } from "../dados"
import { pedidos } from "@/modulos/pedidos/dados"
import { hora, rotuloDoDia } from "./comum"

const ICONE: Record<TipoNotificacao, LucideIcon> = { mensagem: MessageSquare, os: ClipboardList, agenda: CalendarClock, pagamento: Wallet }

export default function Notificacoes() {
  const [f, setF] = useParametrosDaUrl({ ver: "nao_lidas" })
  const papel = usePapel()
  const eu = usePessoa()
  const ns = notificacoes.use()
  const ps = pedidos.use()
  const todas = useMemo(() => notificacoesDe(papel, ns, ps), [papel, ns, ps])
  const naoLidas = todas.filter((n) => !n.lida)
  const ver = f.ver === "todas" ? "todas" : "nao_lidas"
  const lista = ver === "todas" ? todas : naoLidas

  return (
    <>
      <CabecalhoPagina
        titulo="Notificações"
        descricao={`O que pede a atenção de ${eu.curto}`}
        contagem={naoLidas.length ? `${naoLidas.length} ${naoLidas.length === 1 ? "não lida" : "não lidas"}` : "tudo lido"}
        acoes={<Button variant="outline" className="rounded-full" isDisabled={!naoLidas.length} onPress={() => void lerTodas(naoLidas)}><CheckCheck /> Marcar todas como lidas</Button>}
      />
      <div className="max-w-3xl px-4 pt-4 pb-6 md:px-6">
        <ComDados
          rotulo="as notificações"
          esqueleto={<div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-16 rounded-xl" />)}</div>}
          estaVazio={todas.length === 0}
          vazio={<EstadoVazio icone={BellOff} titulo="Nenhuma notificação ainda." texto="Avisos de pedidos, agenda e mensagens chegam aqui." />}
        >
          {() => (
            // o filtro e a lista são um grupo só, na mesma superfície
            <Superficie como="section" aria-label="Notificações" className="overflow-hidden p-1.5">
              <div className="p-1.5 sm:w-72">
                <SegmentadoDeVidro aria-label="Mostrar" valor={ver} aoMudar={(v) => setF({ ver: v })}
                  opcoes={[{ id: "nao_lidas", rotulo: "Não lidas", contagem: naoLidas.length }, { id: "todas", rotulo: "Todas", contagem: todas.length }]} />
              </div>
              {lista.length === 0 ? (
                <EstadoVazio variante="concluido" icone={Check} titulo="Nada novo. Você está em dia." className="bg-transparent shadow-none"
                  acao={<Button variant="outline" onPress={() => setF({ ver: "todas" })}>Ver todas</Button>} />
              ) : <Lista lista={lista} />}
            </Superficie>
          )}
        </ComDados>
      </div>
    </>
  )
}

function Lista({ lista }: { lista: Notificacao[] }) {
  const agora = useAgora()
  let dia = ""
  return (
    <ul className="grid gap-0.5">
        {lista.map((n) => {
          const d = rotuloDoDia(n.em, agora)
          const separa = d !== dia
          dia = d
          return (
            <Fragment key={n.id}>
              {separa && <li aria-hidden="true" className="t-rotulo px-3 pt-3 pb-1 first-letter:uppercase">{d}</li>}
              <Item n={n} dia={d} />
            </Fragment>
          )
        })}
    </ul>
  )
}

function Item({ n, dia }: { n: Notificacao; dia: string }) {
  const I = ICONE[n.tipo]
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
      <a href={url(n.link)} onClick={() => void lerNotificacao(n)}
        className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 rounded-[calc(var(--radius)*0.9)] px-2.5 py-2.5 outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
        <span aria-hidden="true" className={cn("grid size-9 place-items-center rounded-full", n.lida ? "bg-muted text-muted-foreground" : "bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] text-primary")}><I className="size-4" /></span>
        <span className="grid min-w-0 gap-0.5">
          <span className={cn("line-clamp-2 text-sm text-balance", n.lida ? "font-normal" : "font-semibold")} title={n.titulo}>{!n.lida && <span className="sr-only">Não lida: </span>}{n.titulo}</span>
          <span className="line-clamp-2 text-xs text-pretty text-muted-foreground" title={n.texto}>{n.texto}</span>
          <span className="num text-xs text-muted-foreground"><span className="sr-only">{dia}, </span>{hora(n.em)}</span>
        </span>
      </a>
      {!n.lida
        ? <Button variant="ghost" size="icon" className="me-1" aria-label={`Marcar como lida: ${n.titulo}`} onPress={() => void lerNotificacao(n)}><Check /></Button>
        : <span aria-hidden="true" className="size-10" />}
    </li>
  )
}
