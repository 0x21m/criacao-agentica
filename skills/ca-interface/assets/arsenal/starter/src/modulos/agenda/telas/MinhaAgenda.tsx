// /agenda/minha/ · "Meu dia" do técnico (5.4): cartões do dia em ordem, a próxima visita em destaque (janela, endereço,
// o que levar, Abrir no mapa, deslizar "Marcar chegada"). Só os agendamentos dele (ver_agenda "proprias").
// Quem não é técnico (gestora, dono) escolhe de quem é o dia pelos chips. Gustavo sem visitas: "Nenhuma visita hoje.
// Veja com a Marina se há encaixe."
import { useState } from "react"
import { CalendarCheck, MapPin, Navigation, PackageCheck, UserX, Wrench } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Superficie } from "@/components/sistema/Superficie"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { SeloEixo } from "@/components/base/selos"
import { Cortado } from "@/components/base/texto"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { PulsoAoVivo } from "@/components/movimento"
import { DeslizarParaConfirmar } from "@/colecao/deslizar-para-confirmar"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { chaveDia, useAgora } from "@/proto/relogio"
import { RECURSOS, servicoPorSlug } from "@/proto/negocio"
import { AGENDAMENTO, formatosDaProjecao as fp } from "@/proto/projecao"
import { pessoaDoPapel, usePessoa } from "@/proto/permissoes"
import { nomeCliente } from "@/modulos/clientes/dados"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos, ocupa, type Agendamento } from "../dados"
import { marcarAusente, marcarChegada, podeChegar, podeMarcarAusente } from "../acoes"

const TECNICOS = RECURSOS.filter((r) => !r.competencias.includes("bancada"))

export default function MinhaAgenda() {
  const ags = agendamentos.use()
  const agora = useAgora()
  const eu = usePessoa()
  const [escolhido, setEscolhido] = useState("bruno")
  const tecnico = eu.papel === "tecnico" ? eu.id : escolhido
  const hoje = ags.filter((a) => a.recursoId === tecnico && chaveDia(new Date(a.inicio)) === chaveDia(agora) && (ocupa(a, agora) || a.estado === "faltou") && a.estado !== "reservado")
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
  const proxima = hoje.find((a) => a.estado === "em_atendimento") ?? hoje.find((a) => a.estado === "confirmado" && new Date(a.fim) > agora)
  const feitas = hoje.filter((a) => a.estado === "concluido").length
  const nome = TECNICOS.find((t) => t.id === tecnico)?.curto ?? ""
  return (
    <>
      <CabecalhoPagina titulo={eu.papel === "tecnico" ? "Meu dia" : `Dia ${tecnico === "elisa" ? "da" : "do"} ${nome}`}
        descricao={<span className="first-letter:uppercase">{agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>}
        contagem={hoje.length ? `${feitas} de ${hoje.length} ${hoje.length === 1 ? "visita feita" : "visitas feitas"}` : undefined}>
        {eu.papel !== "tecnico" && (
          <div role="group" aria-label="Técnico" data-nivel="flutuante" className="sup flex max-w-full min-w-0 gap-1.5 overflow-x-auto rounded-full p-1.5 [scrollbar-width:none]">
            {TECNICOS.map((r) => (
              <button key={r.id} type="button" aria-pressed={tecnico === r.id} onClick={() => setEscolhido(r.id)}
                className="h-8 shrink-0 rounded-full bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] px-3 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10 aria-pressed:bg-[color-mix(in_oklch,var(--foreground)_15%,transparent)] aria-pressed:font-semibold aria-pressed:text-foreground">
                {r.curto}
              </button>
            ))}
          </div>
        )}
      </CabecalhoPagina>
      <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="ver_agenda" area="do atendimento" rotulo="a sua agenda" estaVazio={hoje.length === 0}
          esqueleto={<div className="grid gap-3"><Esqueleto className="h-72 rounded-[var(--radius-xl)]" /><Esqueleto className="h-20 rounded-[var(--radius-xl)]" /></div>}
          vazio={<EstadoVazio variante="concluido" icone={CalendarCheck} titulo="Nenhuma visita hoje." texto={eu.papel === "tecnico" ? `Veja com a ${pessoaDoPapel("gestora").curto} se há encaixe.` : `${nome} está livre o dia todo.`} />}>
          {() => (
            <>
            {!proxima && <p role="status" className="mb-3 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--positive)_12%,transparent)] px-3 py-2 text-sm">{hoje.every((a) => a.estado === "concluido" || a.estado === "faltou") ? "Visitas de hoje concluídas." : "Nenhuma visita a fazer agora."}</p>}
            <ol className="grid gap-3" aria-label="Visitas de hoje">
              {hoje.map((a) => (
                <li key={a.id}>{a.id === proxima?.id ? <Proxima a={a} agora={agora} /> : <Visita a={a} />}</li>
              ))}
            </ol>
            </>
          )}
        </ComDados>
      </div>
    </>
  )
}

const enderecoDe = (a: Agendamento) => (a.local === "loja" ? "Na loja (bancada)" : a.endereco ?? `${a.bairro}, ${a.cidade}`)

function Visita({ a }: { a: Agendamento }) {
  return (
    <Card size="sm" className="px-4">
      <a href={url(`agenda/?id=${a.id}&data=${chaveDia(new Date(a.inicio))}`)} className="grid min-h-10 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="num pt-0.5 text-sm font-semibold">{fp.h(a.inicio)}</span>
        <span className="grid min-w-0 gap-0.5">
          <Cortado texto={nomeCliente(a.clienteId)} className="text-sm font-medium" />
          <Cortado texto={`${a.bairro} · ${servicoPorSlug(a.servicoSlug)?.nome ?? ""}`} className="text-xs text-muted-foreground" />
        </span>
        <SeloEixo p={AGENDAMENTO[a.estado]} />
      </a>
    </Card>
  )
}

function Proxima({ a, agora }: { a: Agendamento; agora: Date }) {
  const os = a.pedidoId ? pedidos.porId(a.pedidoId) : undefined
  const servico = servicoPorSlug(a.servicoSlug)
  const endereco = enderecoDe(a)
  const pecas = (os?.itens ?? []).filter((i) => i.tipo === "peca" || i.tipo === "produto")
  const emCurso = a.estado === "em_atendimento"
  const faltam = Math.round((new Date(a.inicio).getTime() - agora.getTime()) / 60000)
  const [ausente, setAusente] = useState(false)
  return (
    <Superficie nivel="destaque" como="section" aria-label="Próxima visita" className="grid min-w-0 gap-4 p-4 md:p-5">
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2">
        <h2 className="t-card">{emCurso ? "Visita em andamento" : "Próxima visita"}</h2>
        {emCurso ? <PulsoAoVivo rotulo={AGENDAMENTO.em_atendimento.rotulo} tom="destaque" className="text-sm text-foreground" />
          : faltam > 0 ? <span className="num text-sm text-muted-foreground">em {faltam < 60 ? `${faltam} min` : `${Math.floor(faltam / 60)} h ${String(faltam % 60).padStart(2, "0")}`}</span>
          : <SeloEixo p={AGENDAMENTO[a.estado]} />}
      </header>
      <div className="grid gap-1">
        <p className="t-kpi num">{fp.h(a.inicio)}<span className="text-muted-foreground"> – {fp.h(a.fim)}</span></p>
        <p className="min-w-0 text-base font-semibold"><Cortado texto={nomeCliente(a.clienteId)} /></p>
        <p className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /><span className="line-clamp-2 text-pretty">{endereco}</span></p>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"><Wrench className="size-4 shrink-0" aria-hidden /><Cortado texto={`${servico?.nome ?? "Serviço"}${os ? ` · ${os.id}` : ""}`} /></p>
      </div>
      <div className="grid gap-2 rounded-[var(--radius)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><PackageCheck className="size-3.5" aria-hidden /> O que levar</p>
        {pecas.length ? (
          <ul className="grid gap-1 text-sm">{pecas.map((i) => <li key={`${i.sku}-${i.descricao}`}><Cortado texto={`${i.qtd} × ${i.descricao}`} /></li>)}</ul>
        ) : <p className="text-sm text-pretty">Sem peças reservadas: leve o kit de {servico?.nome.toLowerCase() ?? "serviço"}.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {a.local !== "loja" && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`} target="_blank" rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full px-4")}><Navigation className="size-4" aria-hidden /> Abrir no mapa<span className="sr-only"> (abre em outra aba)</span></a>
        )}
        {os && <a href={url(`pedidos/?id=${os.id}`)} className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-3")}>Abrir a {os.id}</a>}
        {!podeChegar(a, agora) && a.estado === "confirmado" && <p className="w-full text-[13px] text-muted-foreground">Marcar chegada libera às {fp.h(new Date(new Date(a.inicio).getTime() - 3600e3).toISOString())}.</p>}
        {podeMarcarAusente(a, agora) && <Button variant="ghost" className="h-10" onPress={() => setAusente(true)}><UserX />Cliente ausente</Button>}
      </div>
      {podeChegar(a, agora) && (
        <DeslizarParaConfirmar rotulo="Deslize para marcar chegada" rotuloCurto="Marcar chegada" rotuloAndamento="Marcando chegada" rotuloFeito="Chegada marcada"
          aoConfirmar={async () => { const r = await marcarChegada(a); return r.ok ? { ok: true } : { ok: false, motivo: r.mensagem } }} />
      )}
      <DialogoConfirmar aberto={ausente} aoFechar={() => setAusente(false)}
        titulo="Registrar cliente ausente?" descricao={<>O cliente recebe: “{AGENDAMENTO.faltou.cliente!({ quando: agora.toISOString() })}”</>}
        confirmar="Registrar ausência" motivo="O que aconteceu" aoConfirmar={(m) => marcarAusente(a, m)} />
    </Superficie>
  )
}
