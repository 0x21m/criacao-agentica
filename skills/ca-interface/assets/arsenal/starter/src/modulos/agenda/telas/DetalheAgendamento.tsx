// Detalhe do agendamento numa FolhaDeDetalhe (?id=AG-3340): o resumo, o que o cliente lê, os conflitos, a linha do
// tempo e as ações da 5.4 (Confirmar pedido do site, Marcar chegada, Cliente ausente, Cancelar), mais Abrir OS e
// Mensagem. Remarcar é arrastar o bloco na grade (a folha diz isso).
import { useEffect, useState } from "react"
import { CalendarCheck, MapPin, MessageSquare, UserX, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { FraseDoCliente, SeloEixo } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { marcarAberto, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES, recursoPorId, servicoPorSlug } from "@/proto/negocio"
import { AGENDAMENTO, formatosDaProjecao } from "@/proto/projecao"
import { fraseSemPermissao, pode, regraDe, usePapel, usePessoa } from "@/proto/permissoes"
import { nomeCliente } from "@/modulos/clientes/dados"
import { conversas } from "@/modulos/mensagens/dados"
import { agendamentos, validarHorario } from "../dados"
import { cancelarAgendamento, confirmarAgendamento, desfazerChegada, marcarAusente, marcarChegada, podeChegar, podeMarcarAusente } from "../acoes"
import { AvisoDesfazer } from "@/components/base/FolhaDeDetalhe"
import { pedidos } from "@/modulos/pedidos/dados"

const { ds, h } = formatosDaProjecao
const ORIGEM = { site: "Site", portal: "Portal do cliente", balcao: "Balcão", whatsapp: "WhatsApp", telefone: "Telefone" } as const

export function DetalheAgendamento({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const ags = agendamentos.use()
  const a = ags.find((x) => x.id === id) ?? null
  const cvs = conversas.use()
  const processando = useProcessando()
  const agora = useAgora()
  const papel = usePapel()
  const eu = usePessoa()
  const [dialogo, setDialogo] = useState<"cancelar" | "ausente" | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [chegou, setChegou] = useState<{ etapa?: string; vez: number } | null>(null)
  useEffect(() => { setErro(null); setDialogo(null); setChegou(null) }, [id])
  useEffect(() => { marcarAberto(a ? (agendamentos as unknown as Colecao<Registro>) : null, a?.id); return () => marcarAberto(null) }, [a?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const rec = a && recursoPorId(a.recursoId)
  const ctx = { unidade: rec?.unidade }
  const ctxVisita = { responsavelId: a?.recursoId, unidade: rec?.unidade }
  const mexe = !!a && pode(papel, "mover_agenda", ctx)
  const visita = !!a && pode(papel, "registrar_visita", ctxVisita)
  // Quem não pode agir neste registro lê por quê (nunca some em silêncio): outra unidade ou o papel não mexe na agenda
  // (o técnico, que nunca remarca, só lê o aviso no pedido do site: nas visitas confirmadas seria ruído)
  const outraUnidade = regraDe(papel, "mover_agenda") === "unidade" && rec && eu.unidade !== "todas" && rec.unidade !== eu.unidade
  const parado = !!a && !mexe && (a.estado === "solicitado" || (a.estado === "confirmado" && outraUnidade))
  const porQue = !parado || !a ? null
    : outraUnidade ? `Só a unidade ${UNIDADES[rec.unidade].nome} ${a.estado === "solicitado" ? "confirma" : "remarca ou cancela"} este horário. Você vê, mas não mexe: fale com a equipe de lá.`
    : fraseSemPermissao(papel, "mover_agenda")
  const enviando = !!a && processando.has(a.id)
  const conflitos = a && a.estado !== "cancelado" ? validarHorario({ inicio: new Date(a.inicio), fim: new Date(a.fim), recursoId: a.recursoId }, a.servicoSlug, a.id, ags).conflitos : []
  const conversa = a && cvs.find((c) => c.clienteId === a.clienteId && (c.ref === a.id || (a.pedidoId && c.ref === a.pedidoId)))
  const ctxProj = a ? { quando: a.inicio, ate: a.estado === "reservado" ? a.reservadoAte : a.fim, quem: a.historico.at(-1)?.quem.nome } : {}

  const executar = async (f: () => Promise<{ ok: boolean; mensagem?: string }>) => {
    setErro(null)
    const r = await f()
    if (!r.ok && r.mensagem) setErro(r.mensagem)
    return r.ok
  }

  const principal = a && (
    a.estado === "solicitado" && mexe ? (
      <Button onPress={() => void executar(() => confirmarAgendamento(a))} isPending={enviando}><CalendarCheck />{enviando ? "Confirmando…" : "Confirmar"}</Button>
    ) : podeChegar(a, agora) && visita ? (
      <Button onPress={() => { const etapa = a.pedidoId ? pedidos.porId(a.pedidoId)?.etapa : undefined; void executar(() => marcarChegada(a)).then((ok) => ok && setChegou({ etapa, vez: (chegou?.vez ?? 0) + 1 })) }}><MapPin />Marcar chegada</Button>
    ) : null
  )

  return (
    <>
      <FolhaDeDetalhe
        aberto={!!a}
        aoFechar={aoFechar}
        sobre={a ? `${a.id}${a.pedidoId ? ` · ${a.pedidoId}` : ""}` : undefined}
        titulo={a ? (a.estado === "reservado" ? "Horário reservado no site" : nomeCliente(a.clienteId)) : ""}
        selos={a && <SeloEixo p={AGENDAMENTO[a.estado]} ctx={ctxProj} detalhe />}
        rodape={a && (mexe || visita) && (
          <>
            {mexe && !["cancelado", "concluido", "faltou", "expirado", "reservado"].includes(a.estado) && (
              <Button variant="ghost" className="text-negativo-texto" onPress={() => setDialogo("cancelar")} isDisabled={enviando}>{a.local === "loja" ? "Cancelar agendamento" : "Cancelar visita"}</Button>
            )}
            {visita && podeMarcarAusente(a, agora) && <Button variant="outline" onPress={() => setDialogo("ausente")} isDisabled={enviando}><UserX />Cliente ausente</Button>}
            {principal}
          </>
        )}
      >
        {a && (
          <>
            <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
              <dt className="text-muted-foreground">Quando</dt>
              <dd className="num first-letter:uppercase">{ds(a.inicio)}, {h(a.inicio)} a {h(a.fim)}</dd>
              <dt className="text-muted-foreground">Com</dt><dd>{rec?.nome ?? a.recursoId}</dd>
              <dt className="text-muted-foreground">Serviço</dt><dd className="text-pretty">{servicoPorSlug(a.servicoSlug)?.nome ?? a.servicoSlug}</dd>
              <dt className="text-muted-foreground">Local</dt>
              <dd className="text-pretty">{a.local === "loja" ? "Na loja (bancada)" : [a.endereco, a.bairro, a.cidade].filter(Boolean).join(", ") || "Endereço a confirmar"}</dd>
              <dt className="text-muted-foreground">Origem</dt><dd>{ORIGEM[a.origem]}</dd>
            </dl>

            {conflitos.length > 0 && (
              <p role="status" className="rounded-[var(--radius-lg)] bg-negative/12 px-3 py-2 text-sm text-pretty text-negativo-texto">
                Conflito com {conflitos.map((c) => `${c.id} (${h(c.inicio)}–${h(c.fim)})`).join(", ")}. Arraste um dos blocos na grade para resolver.
              </p>
            )}

            {AGENDAMENTO[a.estado].cliente && (
              <section aria-labelledby="ag-cliente" className="grid gap-1.5">
                <h3 id="ag-cliente" className="t-card">O que o cliente lê</h3>
                <FraseDoCliente p={AGENDAMENTO[a.estado]} ctx={ctxProj} className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] px-3 py-2" />
              </section>
            )}

            {chegou && a.estado === "em_atendimento" && <AvisoDesfazer chave={chegou.vez} texto="Chegada marcada." aoDesfazer={() => { void desfazerChegada(a, chegou.etapa); setChegou(null) }} />}
            {porQue && <p role="note" data-motivo-sem-acao="" className="rounded-[var(--radius-lg)] bg-muted/60 px-3 py-2 text-sm text-pretty">{porQue}</p>}
            {erro && <p role="alert" className="rounded-[var(--radius-lg)] bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}

            <div className="flex flex-wrap gap-2">
              {a.pedidoId && <a className={cn(buttonVariants({ variant: "outline" }), "h-10")} href={url(`pedidos/?id=${a.pedidoId}`)}><Wrench className="size-4" aria-hidden />Abrir {a.pedidoId}</a>}
              {a.clienteId && <a className={cn(buttonVariants({ variant: "outline" }), "h-10")} href={url(conversa ? `mensagens/?conversa=${conversa.id}` : "mensagens/")}><MessageSquare className="size-4" aria-hidden />Mensagem</a>}
            </div>
            {mexe && ["confirmado", "solicitado"].includes(a.estado) && (
              <p className="text-xs text-muted-foreground text-pretty">Para remarcar, arraste o bloco na grade (ou selecione e use Espaço e as setas).</p>
            )}

            <section aria-labelledby="ag-historico" className="grid gap-2">
              <h3 id="ag-historico" className="t-card">Histórico</h3>
              <LinhaDoTempo eventos={a.historico} />
            </section>
          </>
        )}
      </FolhaDeDetalhe>
      {a && (
        <DialogoConfirmar aberto={dialogo === "cancelar"} aoFechar={() => setDialogo(null)} perigo
          titulo={`Cancelar o ${a.id}?`} descricao={<>{nomeCliente(a.clienteId)} será avisado pela conversa. O horário volta a ficar livre.</>}
          confirmar="Cancelar a visita" voltar="Manter" motivo="Motivo (o cliente lê)"
          aoConfirmar={(m) => cancelarAgendamento(a, m)} />
      )}
      {a && (
        <DialogoConfirmar aberto={dialogo === "ausente"} aoFechar={() => setDialogo(null)}
          titulo="Registrar cliente ausente?" descricao={<>O cliente recebe: “{AGENDAMENTO.faltou.cliente!({ quando: agora.toISOString() })}”</>}
          confirmar="Registrar ausência" motivo="O que aconteceu"
          aoConfirmar={(m) => marcarAusente(a, m)} />
      )}
    </>
  )
}
