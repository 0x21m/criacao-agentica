// As abas do detalhe que leem as coleções dos outros módulos (importadas dos dados.ts deles, nunca editadas):
// Pedidos (TabelaDados com as colunas de /pedidos/), Agenda, Financeiro (TabelaDados), Mensagens (conversas),
// Notas (só a equipe) e Histórico (cliente + OS + agendamentos numa linha do tempo).
import { useMemo, useState } from "react"
import { CalendarClock, CalendarDays, ClipboardList, Lock, MessageSquare, NotebookPen, Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EstadoVazio } from "@/components/app/estados"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { SeloEixo } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { BotaoLiquido } from "@/components/movimento"
import type { Evento } from "@/proto/dados"
import { recursoPorId, servicoPorSlug } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { AGENDAMENTO, ATRASADA, CONVERSA, ETAPA_OS } from "@/proto/projecao"
import { atrasado, diasDeAtraso, type Pedido } from "@/modulos/pedidos/dados"
import type { Agendamento } from "@/modulos/agenda/dados"
import { emAberto, situacao, type Lancamento } from "@/modulos/financeiro/dados"
import { CANAL, type Conversa, type Mensagem } from "@/modulos/mensagens/dados"
import { dataCurta, dataHora, moeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { adicionarNota, notasDe, type Cliente } from "../dados"

const ir = (caminho: string) => { location.assign(url(caminho)) }
const primeiroNome = (c: Cliente) => (c.tipo === "pj" ? c.nome : c.nome.split(" ")[0])
const link = "rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"

// ---------- Pedidos: as mesmas colunas de /pedidos/ (BASE: lá não são exportadas), sem "Cliente" ----------
function SeloOS({ p, agora }: { p: Pedido; agora: Date }) {
  return atrasado(p, agora) ? <SeloEixo p={ATRASADA} ctx={{ dias: diasDeAtraso(p, agora) }} detalhe /> : <SeloEixo p={ETAPA_OS[p.etapa]} />
}

export function AbaPedidos({ c, lista, agora }: { c: Cliente; lista: Pedido[]; agora: Date }) {
  const papel = usePapel()
  const colunas: ColunaDados<Pedido>[] = useMemo(() => [
    { id: "id", titulo: "OS", tipo: "id", largura: "5.5rem", valor: (p) => <a href={url(`pedidos/?id=${p.id}`)} className={link}>{p.id}</a>, texto: (p) => p.id, ordenar: (p) => p.id },
    { id: "titulo", titulo: "Serviço", tipo: "texto", valor: (p) => p.titulo },
    { id: "etapa", titulo: "Etapa", tipo: "status", largura: "11rem", valor: (p) => <SeloOS p={p} agora={agora} /> },
    { id: "tecnico", titulo: "Técnico", tipo: "pessoa", largura: "5.5rem", valor: (p) => recursoPorId(p.responsavelId)?.curto ?? "—" },
    { id: "prazo", titulo: "Prazo", tipo: "data", largura: "4.5rem", valor: (p) => dataCurta(p.prazo), ordenar: (p) => p.prazo },
    { id: "valor", titulo: "Valor", tipo: "moeda", largura: "7.5rem", valor: (p) => (p.total ? moeda(p.total) : "Sob orçamento"), ordenar: (p) => p.total },
  ], [agora])
  if (!lista.length) return (
    <EstadoVazio icone={ClipboardList} titulo={`${primeiroNome(c)} ainda não tem pedidos.`} texto="As OS deste cliente aparecem aqui assim que forem abertas."
      acao={c.estado !== "anonimizado" && pode(papel, "criar_pedido") ? <BotaoLiquido href={url(`pedidos/novo/?cliente=${c.id}`)}><Plus className="size-4" /> Nova OS</BotaoLiquido> : undefined} />
  )
  const ordenada = [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  return (
    <TabelaDados<Pedido>
      titulo={`OS de ${c.nome}`} colunas={colunas} linhas={ordenada} idDe={(p) => p.id} quebra="xl"
      contagem={<><span className="num">{lista.length}</span> OS</>}
      aoAbrir={(p) => ir(`pedidos/?id=${p.id}`)}
      cartao={(p) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <a href={url(`pedidos/?id=${p.id}`)} className={`num text-sm font-medium ${link}`}>{p.id}</a>
            <span className="flex min-w-0 max-w-[60%] justify-end"><SeloOS p={p} agora={agora} /></span>
          </div>
          <span className="block truncate text-sm" title={p.titulo}>{p.titulo}</span>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3" aria-hidden="true" /> {dataCurta(p.prazo)}</span>
            <span className="num min-w-0 truncate font-semibold">{p.total ? moeda(p.total) : "Sob orçamento"}</span>
          </div>
        </>
      )}
    />
  )
}

// ---------- Agenda ----------
export function AbaAgenda({ c, lista }: { c: Cliente; lista: Agendamento[] }) {
  const colunas: ColunaDados<Agendamento>[] = useMemo(() => [
    { id: "id", titulo: "Horário", tipo: "id", largura: "5.5rem", valor: (a) => a.id },
    { id: "quando", titulo: "Quando", tipo: "texto", largura: "11rem", valor: (a) => <span className="num whitespace-nowrap">{dataHora(a.inicio, { ano: false })}</span>, texto: (a) => dataHora(a.inicio, { ano: false }), ordenar: (a) => a.inicio },
    { id: "servico", titulo: "Serviço", tipo: "texto", valor: (a) => servicoPorSlug(a.servicoSlug)?.nome ?? a.servicoSlug },
    { id: "tecnico", titulo: "Técnico", tipo: "pessoa", largura: "5.5rem", valor: (a) => recursoPorId(a.recursoId)?.curto ?? "—" },
    { id: "estado", titulo: "Situação", tipo: "status", largura: "10rem", valor: (a) => <SeloEixo p={AGENDAMENTO[a.estado]} ctx={{ ate: a.reservadoAte, quando: a.inicio }} /> },
  ], [])
  if (!lista.length) return <EstadoVazio icone={CalendarDays} titulo={`Nenhum horário marcado com ${primeiroNome(c)}.`} texto="Visitas e horários na loja aparecem aqui." />
  const ordenada = [...lista].sort((a, b) => b.inicio.localeCompare(a.inicio))
  return (
    <TabelaDados<Agendamento>
      titulo={`Agenda de ${c.nome}`} colunas={colunas} linhas={ordenada} idDe={(a) => a.id}
      contagem={<><span className="num">{lista.length}</span> {lista.length === 1 ? "horário" : "horários"}</>}
      aoAbrir={(a) => ir(a.pedidoId ? `pedidos/?id=${a.pedidoId}` : "agenda/")}
      cartao={(a) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="num text-sm font-medium">{a.id}</span>
            <SeloEixo p={AGENDAMENTO[a.estado]} ctx={{ ate: a.reservadoAte, quando: a.inicio }} />
          </div>
          <span className="block truncate text-sm">{servicoPorSlug(a.servicoSlug)?.nome ?? a.servicoSlug}</span>
          <span className="num text-xs text-muted-foreground">{dataHora(a.inicio, { ano: false })} · {recursoPorId(a.recursoId)?.curto ?? "—"}</span>
        </>
      )}
    />
  )
}

// ---------- Financeiro ----------
export function AbaFinanceiro({ c, lista, agora }: { c: Cliente; lista: Lancamento[]; agora: Date }) {
  const papel = usePapel()
  const abrePainel = pode(papel, "financeiro_painel")
  const colunas: ColunaDados<Lancamento>[] = useMemo(() => [
    { id: "id", titulo: "Lançamento", tipo: "id", largura: "6.5rem", valor: (l) => l.id },
    { id: "descricao", titulo: "Descrição", tipo: "texto", valor: (l) => l.descricao },
    { id: "ref", titulo: "Ref.", tipo: "texto", largura: "6rem", valor: (l) => <span className="num">{l.ref ?? "—"}</span>, texto: (l) => l.ref ?? "" },
    { id: "situacao", titulo: "Situação", tipo: "status", largura: "12rem", valor: (l) => { const s = situacao(l, agora); return <SeloEixo p={s.p} ctx={s.ctx} detalhe /> } },
    { id: "valor", titulo: "Valor", tipo: "moeda", largura: "7.5rem", valor: (l) => moeda(l.valor), ordenar: (l) => l.valor },
  ], [agora])
  if (!lista.length) return <EstadoVazio icone={Wallet} titulo={`${primeiroNome(c)} não tem cobranças.`} texto="Cobranças de OS e vendas aparecem aqui." />
  const aberto = lista.filter(emAberto).reduce((s, l) => s + l.valor, 0)
  const pago = lista.filter((l) => l.estado === "pago" && !l.estornadoPor).reduce((s, l) => s + l.valor, 0)
  const ordenada = [...lista].sort((a, b) => Number(emAberto(b)) - Number(emAberto(a)) || b.vencimento.localeCompare(a.vencimento))
  return (
    <TabelaDados<Lancamento>
      titulo={`Cobranças de ${c.nome}`} colunas={colunas} linhas={ordenada} idDe={(l) => l.id}
      contagem={<><span className="num">{lista.length}</span> {lista.length === 1 ? "cobrança" : "cobranças"}</>}
      aoAbrir={abrePainel ? (l) => ir(`financeiro/receber/?id=${l.id}`) : undefined}
      totais={{ rotulo: "Totais", itens: [{ rotulo: "Em aberto", valor: moeda(aberto) }, { rotulo: "Pago", valor: moeda(pago) }] }}
      cartao={(l) => { const s = situacao(l, agora); return (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="num text-sm font-medium">{l.id}</span>
            <span className="flex min-w-0 max-w-[65%] justify-end"><SeloEixo p={s.p} ctx={s.ctx} detalhe /></span>
          </div>
          <span className="block truncate text-sm" title={l.descricao}>{l.descricao}</span>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="num text-xs text-muted-foreground">{l.ref ?? "—"}</span>
            <span className="num font-semibold">{moeda(l.valor)}</span>
          </div>
        </>
      ) }}
    />
  )
}

// ---------- Mensagens ----------
export function AbaMensagens({ c, lista, ultima }: { c: Cliente; lista: Conversa[]; ultima: Map<string, Mensagem> }) {
  if (!lista.length) return <EstadoVazio icone={MessageSquare} titulo="Nenhuma mensagem com este cliente." texto="As conversas por WhatsApp, e-mail e portal aparecem aqui." />
  const ordenada = [...lista].sort((a, b) => (ultima.get(b.id)?.em ?? b.criadaEm).localeCompare(ultima.get(a.id)?.em ?? a.criadaEm))
  return (
    <ul aria-label={`Conversas com ${c.nome}`} className="divide-y divide-[color-mix(in_oklch,var(--foreground)_7%,transparent)] overflow-hidden rounded-[var(--radius-lg)] shadow-[inset_0_0_0_1px_var(--sup-aro)]">
      {ordenada.map((cv) => {
        const m = ultima.get(cv.id)
        return (
          <li key={cv.id}>
            <a href={url(`mensagens/?conversa=${cv.id}`)} className="grid gap-1 px-3 py-3 outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="num font-medium">{cv.id}</span>
                <span className="text-muted-foreground">{CANAL[cv.canal]}{cv.ref ? <> · <span className="num">{cv.ref}</span></> : null}</span>
                <SeloEixo p={CONVERSA[cv.estado]} className="ml-auto" />
              </span>
              <span className="flex items-baseline gap-2 text-sm text-muted-foreground">
                <span className="min-w-0 flex-1 truncate" title={m?.texto}>{m ? `${m.direcao === "saida" ? "Você: " : ""}${m.texto}` : "Sem mensagens ainda"}</span>
                {m && <span className="num shrink-0 text-xs">{dataHora(m.em, { ano: false })}</span>}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

// ---------- Notas internas ----------
export function AbaNotas({ c }: { c: Cliente }) {
  const papel = usePapel()
  const [texto, setTexto] = useState("")
  const [tentou, setTentou] = useState(false)
  const notas = notasDe(c)
  const podeEscrever = pode(papel, "editar_cliente") && c.estado !== "anonimizado"
  const curta = texto.trim().length < 3
  function salvar(e: React.FormEvent) {
    e.preventDefault()
    setTentou(true)
    if (curta) return
    void adicionarNota(c, texto.trim())
    setTexto(""); setTentou(false)
  }
  return (
    <div className="grid gap-4">
      <p className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_12%,transparent)] px-3 py-2 text-sm">
        <Lock className="size-4 shrink-0 text-alerta-texto" aria-hidden="true" /> Só a equipe vê. O cliente nunca lê estas notas.
      </p>
      {podeEscrever && (
        <form onSubmit={salvar} className="grid gap-2">
          <Label htmlFor="nota-nova">Nova nota</Label>
          <Textarea id="nota-nova" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Ex.: prefere visita antes das 10:00"
            aria-invalid={tentou && curta ? true : undefined} aria-describedby="nota-nova-msg" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id="nota-nova-msg" aria-live="polite" className={tentou && curta ? "text-xs text-negativo-texto" : "text-xs text-muted-foreground"}>
              {tentou && curta ? "Escreva a nota em pelo menos 3 letras." : "Fica com seu nome e a hora."}
            </p>
            <Button type="submit" variant="outline"><NotebookPen /> Salvar nota</Button>
          </div>
        </form>
      )}
      {notas.length === 0 ? <EstadoVazio icone={NotebookPen} titulo="Nenhuma nota ainda." texto="Combinados, preferências e avisos da equipe ficam aqui." /> : (
        <ol className="grid gap-2" aria-label="Notas internas">
          {notas.map((n, i) => (
            <li key={`${n.em}-${i}`} className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-3 shadow-[inset_0_0_0_1px_var(--sup-aro)]">
              <p className="text-sm text-pretty break-words">{n.texto}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.autor} · <span className="num">{dataHora(n.em, { ano: false })}</span></p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ---------- Histórico ----------
export function AbaHistorico({ c, pedidos, agendamentos }: { c: Cliente; pedidos: Pedido[]; agendamentos: Agendamento[] }) {
  const [limite, setLimite] = useState(12)
  const eventos = useMemo(() => {
    const doCliente: Evento[] = c.historico.filter((e) => e.eixo !== "nota")
    const dasOS = pedidos.flatMap((p) => p.historico.map((e) => ({ ...e, texto: `${p.id} · ${e.texto}` })))
    const dosHorarios = agendamentos.flatMap((a) => a.historico.map((e) => ({ ...e, texto: `${a.id} · ${e.texto}` })))
    return [...doCliente, ...dasOS, ...dosHorarios].sort((a, b) => a.em.localeCompare(b.em))
  }, [c.historico, pedidos, agendamentos])
  return (
    <div className="grid gap-3">
      <LinhaDoTempo eventos={eventos} limite={limite} className="ml-2.5" />
      {eventos.length > limite && <Button variant="ghost" size="sm" className="w-fit" onPress={() => setLimite((n) => n + 20)}>Mostrar mais {Math.min(20, eventos.length - limite)}</Button>}
    </div>
  )
}
