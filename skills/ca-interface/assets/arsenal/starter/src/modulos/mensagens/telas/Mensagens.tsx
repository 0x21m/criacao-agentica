// Módulo Mensagens (5.9) · /mensagens/ (?conversa=CV-0031): a caixa de conversas em mestre-detalhe, sem banner (área de
// trabalho cheia). Desktop: conversas (320) · conversa estilo WhatsApp · contexto (OS ligada com selos e a frase que o
// cliente lê, PON-09) a partir de 1280 px; entre 1024 e 1280 o contexto abre numa folha. Celular: lista → conversa em
// tela cheia; contexto na folha inferior. A caixa, a busca e a conversa aberta vivem na URL.
// Arsenal: bubble.tsx e message.tsx (balões), textarea, dropdown-menu (modelos e ações), SegmentadoDeVidro (caixas),
// PulsoAoVivo (conversa nova), FolhaDeDetalhe (contexto no celular), FraseDoCliente e SeloEixo (contexto).
import { useMemo } from "react"
import { FileText, Inbox, Lock, MessageSquare, SearchX } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { PulsoAoVivo } from "@/components/movimento"
import { usePendentes, useProcessando } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { usePapel } from "@/proto/permissoes"
import { clientes } from "@/modulos/clientes/dados"
import { normalizar } from "@/modulos/registro"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { conversas, mensagens, podeVer, ultimaPorConversa, type Conversa, type Mensagem } from "../dados"
import { Conversa as PainelConversa } from "./Conversa"
import { iniciais, quandoCurto } from "./comum"

type Caixa = "abertas" | "nao_lidas" | "resolvidas"
const PADRAO = { conversa: "", q: "", caixa: "abertas" }

export default function Mensagens() {
  const [p, setP] = useParametrosDaUrl(PADRAO)
  const todas = conversas.use()
  const papel = usePapel()
  const minhas = useMemo(() => todas.filter((cv) => podeVer(papel, cv)), [todas, papel])
  const aberta = !!p.conversa
  return (
    <div className={cn(
      "px-3 pt-3 md:px-4 lg:px-6 lg:pt-4",
      // a conversa ocupa a altura da janela (o compositor fica acima das abas do celular); a lista no celular rola com a página
      "lg:h-[calc(100dvh-var(--topo)-2rem)]",
      aberta && "max-lg:h-[calc(100dvh-var(--topo)-var(--abas)-env(safe-area-inset-bottom))] max-lg:pb-3",
    )}>
      <ComDados
        capacidade="mensagens" area="do atendimento" rotulo="as conversas"
        esqueleto={<EsqueletoCaixa />}
        estaVazio={minhas.length === 0}
        vazio={<EstadoVazio icone={Inbox} titulo="Nenhuma conversa." texto="As mensagens dos clientes chegam aqui." className="h-full" />}
      >
        <Caixa todas={todas} minhas={minhas} p={p} setP={setP} />
      </ComDados>
    </div>
  )
}

function EsqueletoCaixa() {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="space-y-2">{Array.from({ length: 7 }, (_, i) => <Esqueleto key={i} className="h-16 rounded-xl" />)}</div>
      <div className="flex flex-col gap-3 max-lg:hidden">
        {[0, 1, 2, 3].map((i) => <Esqueleto key={i} className={cn("h-14 w-2/3 rounded-2xl", i % 2 && "self-end")} />)}
      </div>
    </div>
  )
}

function Caixa({ todas, minhas, p, setP }: {
  todas: Conversa[]; minhas: Conversa[]; p: typeof PADRAO; setP: (m: Partial<typeof PADRAO>) => void
}) {
  const ms = mensagens.use()
  const cli = clientes.use()
  const papel = usePapel()
  const agora = useAgora()
  const pendentes = usePendentes()
  const processando = useProcessando()
  const ultima = useMemo(() => ultimaPorConversa(ms), [ms])
  const nome = useMemo(() => { const m = new Map(cli.map((c) => [c.id, c.nome])); return (id: string) => m.get(id) ?? "Cliente removido" }, [cli])
  const caixa = (["abertas", "nao_lidas", "resolvidas"].includes(p.caixa) ? p.caixa : "abertas") as Caixa
  const ordenadas = useMemo(() => [...minhas].sort((a, b) => (ultima.get(b.id)?.em ?? b.criadaEm).localeCompare(ultima.get(a.id)?.em ?? a.criadaEm)), [minhas, ultima])
  const contagem = {
    abertas: minhas.filter((c) => c.estado !== "resolvida").length,
    nao_lidas: minhas.filter((c) => c.naoLidas > 0).length,
    resolvidas: minhas.filter((c) => c.estado === "resolvida").length,
  }
  const lista = useMemo(() => {
    const t = normalizar(p.q.trim())
    return ordenadas.filter((c) => {
      if (caixa === "abertas" && c.estado === "resolvida") return false
      if (caixa === "nao_lidas" && c.naoLidas === 0) return false
      if (caixa === "resolvidas" && c.estado !== "resolvida") return false
      return !t || normalizar(nome(c.clienteId)).includes(t) || normalizar(c.id).includes(t) || normalizar(c.ref ?? "").includes(t) || normalizar(ultima.get(c.id)?.texto ?? "").includes(t)
    })
  }, [ordenadas, caixa, p.q, nome, ultima])

  const existe = todas.find((c) => c.id === p.conversa)
  const atual = existe && podeVer(papel, existe) ? existe : null
  const abrir = (id: string) => setP({ conversa: id })
  const naoLidas = minhas.reduce((s, c) => s + c.naoLidas, 0)

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* ---------- lista ---------- */}
      <Superficie como="section" aria-labelledby="titulo-mensagens" className={cn("flex min-h-0 flex-col overflow-hidden", p.conversa && "max-lg:hidden")}>
        <header className="grid gap-4 p-3 pb-2 shadow-[0_1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <h1 id="titulo-mensagens" className="t-pagina text-balance">Mensagens</h1>
              <p className="num text-xs text-muted-foreground" aria-live="polite">
                {naoLidas ? `${naoLidas} ${naoLidas === 1 ? "não lida" : "não lidas"}` : "Tudo lido"} · {minhas.length} {minhas.length === 1 ? "conversa" : "conversas"}
              </p>
            </div>
            <LinkButton variant="outline" size="sm" href={url("mensagens/modelos/")} className="shrink-0 rounded-full"><FileText /> Modelos</LinkButton>
          </div>
          <div className="grid gap-2">
          <Input type="search" value={p.q} onChange={(e) => setP({ q: e.target.value })} placeholder="Buscar cliente, OS ou texto" aria-label="Buscar conversa" className="h-10 rounded-full" />
          <SegmentadoDeVidro aria-label="Caixa" valor={caixa} aoMudar={(v) => setP({ caixa: v })} opcoes={[
            { id: "abertas", rotulo: "Abertas", contagem: contagem.abertas },
            { id: "nao_lidas", rotulo: "Não lidas", contagem: contagem.nao_lidas },
            { id: "resolvidas", rotulo: "Resolvidas", contagem: contagem.resolvidas },
          ]} />
          </div>
        </header>
        {lista.length === 0 ? (
          <div className="p-3">
            {p.q ? (
              <EstadoVazio variante="filtro" icone={SearchX} titulo={`Nenhuma conversa com “${p.q}”.`} texto="Busque pelo nome do cliente, pela OS ou por um trecho da mensagem."
                acao={<Button variant="outline" size="sm" onPress={() => setP({ q: "" })}>Limpar a busca</Button>} />
            ) : caixa === "nao_lidas" ? (
              <EstadoVazio variante="concluido" icone={MessageSquare} titulo="Nada novo. Você está em dia." />
            ) : (
              <EstadoVazio variante="filtro" icone={Inbox} titulo={caixa === "resolvidas" ? "Nenhuma conversa resolvida ainda." : "Nenhuma conversa aberta."}
                acao={<Button variant="outline" size="sm" onPress={() => setP({ caixa: caixa === "resolvidas" ? "abertas" : "resolvidas" })}>{caixa === "resolvidas" ? "Ver as abertas" : "Ver as resolvidas"}</Button>} />
            )}
          </div>
        ) : (
          <ul data-rolagem-permitida aria-label="Conversas" className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {lista.map((c) => (
              <ItemConversa key={c.id} c={c} nome={nome(c.clienteId)} ultima={ultima.get(c.id)} agora={agora} ativa={c.id === atual?.id}
                ocupada={pendentes.has(c.id) || processando.has(c.id)} abrir={abrir} />
            ))}
          </ul>
        )}
      </Superficie>

      {/* ---------- conversa ---------- */}
      <div className={cn("min-h-0", !p.conversa && "max-lg:hidden")}>
        {atual ? (
          <PainelConversa key={atual.id} cv={atual} nome={nome(atual.clienteId)} aoVoltar={() => setP({ conversa: "" })} />
        ) : existe ? (
          // PON-20: nada do objeto aparece para quem não pode (o técnico só abre a conversa da OS dele)
          <Superficie data-estado-tela="sem-permissao" className="grid h-full place-items-center p-6">
            <EstadoVazio icone={Lock} titulo={existe.ref ? "Esta conversa é de outra OS." : "Esta conversa não é de uma OS sua."} texto="Você vê só as conversas das OS atribuídas a você."
              acao={<Button variant="outline" onPress={() => setP({ conversa: "" })}>Ver minhas conversas</Button>} className="border-0 bg-transparent shadow-none" />
          </Superficie>
        ) : p.conversa ? (
          <Superficie className="grid h-full place-items-center p-6">
            <EstadoVazio icone={SearchX} titulo="Esta conversa não existe mais." texto="Ela pode ter sido apagada ao resetar os dados."
              acao={<Button variant="outline" onPress={() => setP({ conversa: "" })}>Ver as conversas</Button>} className="border-0 bg-transparent shadow-none" />
          </Superficie>
        ) : (
          <EstadoVazio icone={MessageSquare} titulo="Escolha uma conversa." texto="A conversa e o pedido ligado a ela aparecem aqui." className="h-full" />
        )}
      </div>
    </div>
  )
}

function ItemConversa({ c, nome, ultima, agora, ativa, ocupada, abrir }: {
  c: Conversa; nome: string; ultima?: Mensagem; agora: Date; ativa: boolean; ocupada: boolean; abrir: (id: string) => void
}) {
  const previa = ultima ? `${ultima.direcao === "saida" ? "Você: " : ""}${ultima.texto}` : "Sem mensagens"
  const nova = c.naoLidas > 0
  const falhou = ultima?.estado === "falhou"
  return (
    <li>
      <a
        href={url(`mensagens/?conversa=${c.id}`)}
        onClick={(e) => { e.preventDefault(); abrir(c.id) }}
        aria-current={ativa ? "true" : undefined}
        className={cn(
          "grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-[calc(var(--radius)*0.9)] px-2.5 py-2.5 outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring",
          ativa && "nav-ativo", ocupada && "opacity-70",
        )}
      >
        <span aria-hidden="true" className={cn("grid size-9 place-items-center rounded-full text-xs font-semibold", ativa ? "bg-primary text-primary-foreground" : "bg-muted")}>{iniciais(nome)}</span>
        <span className="min-w-0">
          <span className={cn("block truncate text-sm", nova ? "font-semibold" : "font-medium")} title={nome}>{nome}{nova && <span className="sr-only">, {c.naoLidas} não {c.naoLidas === 1 ? "lida" : "lidas"}</span>}</span>
          <span className={cn("block truncate text-xs", falhou ? "text-[var(--texto-negativo,var(--destructive))]" : nova ? "text-foreground" : "text-muted-foreground")} title={previa}>
            {falhou ? "Não enviada · " : ""}{previa}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1 self-start pt-0.5">
          <span className={cn("num text-xs whitespace-nowrap", nova ? "font-medium text-foreground" : "text-muted-foreground")}>{ultima ? quandoCurto(ultima.em, agora) : ""}</span>
          <span className="flex h-5 items-center gap-1.5">
            {nova && <PulsoAoVivo tom="destaque" chave={ultima?.id} />}
            {nova ? (
              <span aria-hidden="true" className="num grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{c.naoLidas}</span>
            ) : c.ref ? <span className="num text-xs whitespace-nowrap text-muted-foreground">{c.ref}</span> : null}
          </span>
        </span>
      </a>
    </li>
  )
}
