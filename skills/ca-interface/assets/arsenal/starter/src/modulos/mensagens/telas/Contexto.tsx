// Contexto da conversa (COM-10, PON-09): o pedido ligado com os selos do operador e a frase que o cliente está lendo,
// o cliente e as outras OS em aberto dele. Coluna à direita a partir de 1280 px; folha no celular e no tablet.
// O técnico não vê o contato do cliente fora da visita (seção 2).
import { useId } from "react"
import { CalendarClock, ClipboardList, Mail, Phone, Quote, UserRound } from "lucide-react"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente, SeloEixo } from "@/components/base/selos"
import { Email } from "@/components/base/texto"
import { useAgora } from "@/proto/relogio"
import { recursoPorId } from "@/proto/negocio"
import { usePapel } from "@/proto/permissoes"
import { AGENDAMENTO, ATRASADA, ETAPA_OS, ETAPAS_TERMINAIS, type Projecao, type Ctx } from "@/proto/projecao"
import { clientes } from "@/modulos/clientes/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { atrasado, ctxDaOS, diasDeAtraso, pedidos } from "@/modulos/pedidos/dados"
import { moeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import type { Conversa } from "../dados"

export function Contexto({ cv, naFolha = false }: { cv: Conversa; naFolha?: boolean }) {
  const papel = usePapel()
  const agora = useAgora()
  const ps = pedidos.use()
  const ags = agendamentos.use()
  const c = clientes.use().find((x) => x.id === cv.clienteId)
  const os = ps.find((p) => p.id === cv.ref)
  const ag = !os ? ags.find((a) => a.id === cv.ref) : undefined
  const outras = ps.filter((p) => p.clienteId === cv.clienteId && p.id !== cv.ref && !ETAPAS_TERMINAIS.includes(p.etapa)).slice(0, 3)
  const veContato = papel !== "tecnico"
  const Bloco = naFolha ? "section" : Superficie
  const uid = useId()

  return (
    <div className={cn("grid gap-4", naFolha && "gap-5")}>
      {/* o pedido ligado: primeiro, porque é sobre ele que o cliente pergunta */}
      <Bloco className={cn(!naFolha && "p-4")} aria-labelledby={`${uid}-pedido`}>
        <h3 id={`${uid}-pedido`} className="t-rotulo mb-2">Pedido ligado</h3>
        {os ? (
          <Ligado id={os.id} href={`pedidos/?id=${os.id}`} titulo={os.titulo} icone={ClipboardList}
            selos={<>
              <SeloEixo p={ETAPA_OS[os.etapa]} ctx={ctxDaOS(os, ags)} detalhe />
              {atrasado(os, agora) && <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(os, agora) }} detalhe />}
            </>}
            linhas={[["Valor", os.total ? moeda(os.total) : "Sob orçamento"], ["Técnico", recursoPorId(os.responsavelId)?.nome ?? "Sem técnico"]]}
            frase={{ p: ETAPA_OS[os.etapa], ctx: ctxDaOS(os, ags) }} />
        ) : ag ? (
          <Ligado id={ag.id} href="agenda/" titulo={`Visita ${new Date(ag.inicio).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")}, ${new Date(ag.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
            icone={CalendarClock}
            selos={<SeloEixo p={AGENDAMENTO[ag.estado]} ctx={{ ate: ag.reservadoAte ?? ag.fim, quando: ag.inicio }} detalhe />}
            linhas={[["Técnico", recursoPorId(ag.recursoId)?.nome ?? "—"], ["Local", ag.local === "loja" ? "Na loja" : ag.bairro]]}
            frase={{ p: AGENDAMENTO[ag.estado], ctx: { quando: ag.inicio, ate: ag.reservadoAte ?? ag.fim } }} />
        ) : (
          <p className="text-sm text-pretty text-muted-foreground">Esta conversa não está ligada a um pedido.{outras.length ? " As OS em aberto do cliente estão abaixo." : " O cliente não tem OS em aberto."}</p>
        )}
      </Bloco>

      <Bloco className={cn(!naFolha && "p-4")} aria-labelledby={`${uid}-cliente`}>
        <h3 id={`${uid}-cliente`} className="t-rotulo mb-2">Cliente</h3>
        {c ? (
          <div className="grid gap-2 text-sm">
            <a href={url(`clientes/?id=${c.id}`)} className="flex min-w-0 items-center gap-2 font-medium link-sistema">
              <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="truncate" title={c.nome}>{c.nome}</span>
            </a>
            {veContato ? (
              <>
                <p className="flex min-w-0 items-center gap-2"><Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="num whitespace-nowrap">{c.telefone}</span>
                  <span className="truncate text-xs text-muted-foreground">{c.whatsappConsentido ? "WhatsApp autorizado" : "sem WhatsApp"}</span></p>
                <p className="flex min-w-0 items-center gap-2"><Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><Email email={c.email} /></p>
              </>
            ) : <p className="text-xs text-pretty text-muted-foreground">O contato aparece só durante a visita.</p>}
          </div>
        ) : <p className="text-sm text-muted-foreground">Cliente removido.</p>}
      </Bloco>

      {outras.length > 0 && (
        <Bloco className={cn(!naFolha && "p-4")} aria-labelledby={`${uid}-outras`}>
            <h3 id={`${uid}-outras`} className="t-rotulo mb-2">Outras OS em aberto</h3>
            <ul className="grid gap-1">
              {outras.map((p) => (
                <li key={p.id}>
                  <a href={url(`pedidos/?id=${p.id}`)} className="grid min-h-10 grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-2 rounded-md px-1 text-sm hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)]">
                    <span className="num font-medium">{p.id}</span><span className="truncate" title={p.titulo}>{p.titulo}</span>
                  </a>
                </li>
              ))}
            </ul>
        </Bloco>
      )}
    </div>
  )
}

function Ligado({ id, href, titulo, icone: I, selos, linhas, frase }: {
  id: string; href: string; titulo: string; icone: typeof ClipboardList; selos: React.ReactNode
  linhas: [string, string][]; frase: { p: Projecao; ctx: Ctx }
}) {
  return (
    <div className="grid gap-3">
      <a href={url(href)} className="group grid gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="num flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><I className="size-3.5" aria-hidden="true" />{id}</span>
        <span className="line-clamp-2 text-sm font-medium text-balance break-words group-hover:underline" title={titulo}>{titulo}</span>
      </a>
      <div className="flex min-w-0 flex-wrap gap-1.5">{selos}</div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        {linhas.map(([r, v]) => <div key={r} className="contents"><dt className="text-muted-foreground">{r}</dt><dd className="num text-end text-pretty break-words">{v}</dd></div>)}
      </dl>
      {frase.p.cliente && (
        <div className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Quote className="size-3.5" aria-hidden="true" /> O que o cliente lê agora</p>
          <FraseDoCliente p={frase.p} ctx={frase.ctx} />
        </div>
      )}
    </div>
  )
}
