// Módulo Início · "Meu dia" (o Início do técnico, seção 2: só o que é dele). Próxima visita com o que levar, a agenda
// de hoje dele e as OS dele em aberto. Nada de valores, de outros técnicos ou de contato fora da visita.
// BASE: a 5.2 manda o técnico para /agenda/minha/, que não existe; o "Meu dia" mora no próprio Início (rota /).
import { CalendarCheck, CalendarClock, ClipboardList, MapPin, Navigation, PackageCheck, Wrench } from "lucide-react"
import { Superficie } from "@/components/sistema/Superficie"
import { SeloEixo } from "@/components/base/selos"
import { Cortado } from "@/components/base/texto"
import { EstadoVazio } from "@/components/app/estados"
import { PulsoAoVivo } from "@/components/movimento"
import { pessoaDoPapel, pode, type Papel } from "@/proto/permissoes"
import { servicoPorSlug, type Pessoa } from "@/proto/negocio"
import { AGENDAMENTO, ATRASADA, ETAPA_OS, formatosDaProjecao as fp } from "@/proto/projecao"
import { atrasado, ctxDaOS, diasDeAtraso, emAberto, type Pedido } from "@/modulos/pedidos/dados"
import type { Agendamento } from "@/modulos/agenda/dados"
import { saldoTotal } from "@/modulos/estoque/dados"
import { url } from "@/lib/url"
import { buttonVariants } from "@/components/ui/button-variants"
import { numero } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { agendaDeHoje, type Fontes } from "../dia"
import { Bloco, Entrada, ItemDaEntrada, LinhaLink, LinkVer } from "./pecas"
import type { Nome } from "./blocos"

/** O recorte do técnico: os agendamentos e as OS atribuídos a ele. */
export function doTecnico(f: Fontes, eu: Pessoa, agora: Date) {
  const minhasOS = f.pedidos.filter((p) => p.responsavelId === eu.id)
  const hoje = agendaDeHoje(f.agendamentos.filter((a) => a.recursoId === eu.id), agora)
  const abertas = minhasOS.filter(emAberto).sort((a, b) => Number(atrasado(b, agora)) - Number(atrasado(a, agora)) || a.prazo.localeCompare(b.prazo))
  const proxima = hoje.find((a) => a.estado === "em_atendimento") ?? hoje.find((a) => (a.estado === "confirmado" || a.estado === "solicitado") && new Date(a.fim) > agora)
  const minhasIds = new Set(minhasOS.map((p) => p.id))
  const naoLidas = f.conversas.filter((c) => c.ref && minhasIds.has(c.ref)).reduce((s, c) => s + c.naoLidas, 0)
  return { hoje, abertas, proxima, naoLidas, concluidas: hoje.filter((a) => a.estado === "concluido").length, atrasadas: abertas.filter((p) => atrasado(p, agora)).length }
}

export function MeuDia({ f, eu, papel, agora, nome, iniciar, erro }: { f: Fontes; eu: Pessoa; papel: Papel; agora: Date; nome: Nome; iniciar: boolean; erro?: boolean }) {
  const d = doTecnico(f, eu, agora)
  const os = d.proxima?.pedidoId ? f.pedidos.find((p) => p.id === d.proxima!.pedidoId) : undefined
  return (
    <Entrada iniciar={iniciar} className="grid grid-cols-[minmax(0,1fr)] gap-3 md:gap-4 lg:grid-cols-12">
      <ItemDaEntrada className="lg:col-span-7">
        {d.proxima ? <ProximaVisita a={d.proxima} os={os} f={f} nome={nome} agora={agora} /> : (
          <Superficie nivel="destaque" como="section" aria-label="Próxima visita" className="flex h-full flex-col p-4 md:p-5">
            <EstadoVazio variante="concluido" icone={CalendarCheck} className="flex-1 bg-transparent shadow-none"
              titulo={!d.hoje.length ? "Nenhuma visita hoje." : d.hoje.every((a) => a.estado === "concluido") ? "Visitas de hoje concluídas." : "Nenhuma visita a fazer agora."}
              texto={d.hoje.length ? "Confira as suas OS abertas abaixo." : `Veja com a ${pessoaDoPapel("gestora").curto} se há encaixe.`} />
          </Superficie>
        )}
      </ItemDaEntrada>
      <ItemDaEntrada className="lg:col-span-5">
        <Bloco titulo="Minha agenda de hoje" icone={CalendarClock} erro={erro ? "a sua agenda" : undefined} acao={pode(papel, "ver_agenda") ? <LinkVer caminho="agenda/">Semana</LinkVer> : undefined}>
          {d.hoje.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma visita na sua agenda hoje.</p> : (
            <ol className="relative -mx-2 grid">
              {d.hoje.map((a) => {
                const agoraAqui = a.id === d.proxima?.id
                return (
                  <li key={a.id} className={cn("grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-3 rounded-[calc(var(--radius)*0.9)] px-2 py-2.5", agoraAqui && "bg-[color-mix(in_oklch,var(--primary)_9%,transparent)]")}>
                    <span className="num pt-0.5 text-sm font-semibold">{fp.h(a.inicio)}</span>
                    <span className="grid min-w-0 gap-1">
                      <Cortado texto={nome(a.clienteId)} className={cn("text-sm font-medium", a.estado === "concluido" && "text-muted-foreground")} />
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted-foreground">
                        <span className="truncate">{a.bairro}</span>
                        <SeloEixo p={AGENDAMENTO[a.estado]} />
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </Bloco>
      </ItemDaEntrada>
      <ItemDaEntrada className="lg:col-span-12">
        <Bloco titulo="Minhas OS em aberto" icone={ClipboardList} acao={<LinkVer caminho="pedidos/">Minhas OS</LinkVer>}>
          {d.abertas.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma OS aberta com você.</p> : (
            <ul className="-mx-2">
              {d.abertas.slice(0, 6).map((p) => (
                <li key={p.id} className="border-t border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] first:border-t-0">
                  <LinhaLink caminho={`pedidos/?id=${p.id}`} className="grid-cols-[minmax(0,1fr)_auto] gap-y-1 py-2.5 text-sm md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,19rem)_minmax(0,11rem)]">
                    <span className="col-span-2 flex min-w-0 items-baseline gap-2 md:col-span-1 md:contents">
                      <span className="num shrink-0 font-semibold">{p.id}</span>
                      <span className="line-clamp-2 min-w-0 font-medium text-pretty md:line-clamp-1" title={p.titulo}>{p.titulo}</span>
                    </span>
                    <span className="flex min-w-0 flex-wrap gap-x-1 text-[0.8125rem] text-muted-foreground md:order-3"><span className="min-w-0 text-pretty">{nome(p.clienteId)}</span><span className="num whitespace-nowrap">· prazo {fp.d(p.prazo)}</span></span>
                    <span className="justify-self-end md:order-4"><SeloOS p={p} agora={agora} /></span>
                  </LinhaLink>
                </li>
              ))}
            </ul>
          )}
          {d.abertas.length > 6 && <LinkVer caminho="pedidos/" className="mt-auto self-start">Ver as {numero(d.abertas.length)}</LinkVer>}
        </Bloco>
      </ItemDaEntrada>
    </Entrada>
  )
}

function SeloOS({ p, agora }: { p: Pedido; agora: Date }) {
  return atrasado(p, agora) ? <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(p, agora) }} detalhe /> : <SeloEixo p={ETAPA_OS[p.etapa]} ctx={ctxDaOS(p)} />
}

/** A próxima visita (nível destaque: é o "herói" do técnico): quando, quem, onde, o serviço e o que levar. */
function ProximaVisita({ a, os, f, nome, agora }: { a: Agendamento; os?: Pedido; f: Fontes; nome: Nome; agora: Date }) {
  const servico = servicoPorSlug(a.servicoSlug)
  const endereco = a.endereco ?? `${a.bairro}, ${a.cidade}`
  const pecas = (os?.itens ?? []).filter((i) => i.tipo === "peca" || i.tipo === "produto")
  const emCurso = a.estado === "em_atendimento"
  const faltam = Math.round((new Date(a.inicio).getTime() - agora.getTime()) / 60000)
  return (
    <Superficie nivel="destaque" como="section" aria-label="Próxima visita" className="flex h-full min-w-0 flex-col gap-4 p-4 md:p-5">
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2">
        <h2 className="t-card">{emCurso ? "Visita em andamento" : "Próxima visita"}</h2>
        {emCurso ? <PulsoAoVivo rotulo={AGENDAMENTO.em_atendimento.rotulo} tom="destaque" className="text-sm text-foreground" />
          : faltam > 0 && <span className="num text-sm text-muted-foreground">em {faltam < 60 ? `${faltam} min` : `${Math.floor(faltam / 60)} h ${String(faltam % 60).padStart(2, "0")}`}</span>}
      </header>
      <div className="grid gap-1">
        <p className="t-kpi num">{fp.h(a.inicio)}<span className="text-muted-foreground"> – {fp.h(a.fim)}</span></p>
        <p className="min-w-0 text-base font-semibold"><Cortado texto={nome(a.clienteId)} /></p>
        <p className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="line-clamp-2 text-pretty">{endereco}</span></p>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"><Wrench className="size-4 shrink-0" aria-hidden="true" /><Cortado texto={servico?.nome ?? "Serviço"} />{os && <span className="num shrink-0 whitespace-nowrap">· {os.id}</span>}</p>
      </div>
      <div className="grid gap-2 rounded-[var(--radius)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><PackageCheck className="size-3.5" aria-hidden="true" /> O que levar</p>
        {pecas.length ? (
          <ul className="grid gap-1.5 text-sm">
            {pecas.map((i) => {
              const prod = i.sku ? f.produtos.find((x) => x.id === i.sku) : undefined
              return (
                <li key={`${i.sku}-${i.descricao}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                  <Cortado texto={`${numero(i.qtd)} × ${i.descricao}`} />
                  {prod && <span className={cn("num text-xs whitespace-nowrap", saldoTotal(prod) < i.qtd ? "font-semibold text-negativo-texto" : "text-muted-foreground")}>{saldoTotal(prod) < i.qtd ? "sem saldo" : `${numero(saldoTotal(prod))} em estoque`}</span>}
                </li>
              )
            })}
          </ul>
        ) : <p className="text-sm text-pretty">Sem peças reservadas: leve o kit de {servico?.nome.toLowerCase() ?? "serviço"}.</p>}
      </div>
      <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {os && <a href={url(`pedidos/?id=${os.id}`)} className="link-sistema inline-flex min-h-10 items-center justify-center gap-1.5 text-sm font-medium sm:mr-auto">Abrir a {os.id}</a>}
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`} target="_blank" rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "default" }), "h-10 rounded-full px-4")}><Navigation className="size-4" aria-hidden="true" /> Abrir no mapa<span className="sr-only"> (abre em outra aba)</span></a>
      </div>
    </Superficie>
  )
}
