// Módulo Mensagens · /mensagens/modelos/ (?id=MOD-01): os modelos por evento. TabelaDados (nome, gatilho, canal) e o
// editor com prévia ao vivo ao lado (desktop) ou numa folha (celular e tablet). Banner compacto (5.9). O gatilho é o
// evento da OS que dispara a mensagem automática: o rótulo vem da projeção. Salvar é otimista com Desfazer.
// Arsenal: TabelaDados, CabecalhoPagina, BarraFerramentas, FolhaDeDetalhe, bubble.tsx (prévia), textarea, select.
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { ArrowLeft, Bot, FileText, Plus, SearchX, Zap } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { usePendentes } from "@/proto/dados"
import { fraseSemPermissao, usePapel, pode } from "@/proto/permissoes"
import { ETAPA_OS, ETAPAS_OS, type EtapaOS } from "@/proto/projecao"
import { useIsMobile } from "@/hooks/use-mobile"
import { dataCurta } from "@/lib/formato"
import { url } from "@/lib/url"
import { normalizar } from "@/modulos/registro"
import { CANAL, VARIAVEIS, criarModelo, modelos, preencher, salvarModelo, variaveisDeExemplo, type Canal, type Modelo } from "../dados"

const LIMITE_WHATSAPP = 1024 // corpo de template do WhatsApp (COM-28)
const GATILHOS = ETAPAS_OS.filter((e) => ETAPA_OS[e].cliente)

export default function Modelos() {
  const [f, setF] = useParametrosDaUrl({ id: "", q: "" })
  const lista = modelos.use()
  const papel = usePapel()
  const edita = pode(papel, "mensagens_modelos")
  const visiveis = useMemo(() => {
    const t = normalizar(f.q.trim())
    return lista.filter((m) => !t || normalizar(m.nome).includes(t) || normalizar(m.texto).includes(t))
  }, [lista, f.q])
  const atual = lista.find((m) => m.id === f.id) ?? null
  const celular = useIsMobile(1024)
  const novo = () => setF({ id: criarModelo() })

  return (
    <>
      <CabecalhoPagina
        titulo="Modelos de mensagem"
        descricao="Textos prontos para responder e as mensagens automáticas de cada etapa"
        contagem={f.q ? `${visiveis.length} de ${lista.length}` : `${lista.length} modelos`}
        acoes={<>
          <LinkButton variant="outline" href={url("mensagens/")} className="rounded-full"><ArrowLeft /> Conversas</LinkButton>
          {edita && <BotaoLiquido onClick={novo}><Plus className="size-4" /> Novo modelo</BotaoLiquido>}
        </>}
      >
        <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar modelo" placeholder="Buscar nome ou texto" filtrado={!!f.q} aoLimpar={() => setF({ q: "" })} />
      </CabecalhoPagina>
      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="mensagens" area="do atendimento" rotulo="os modelos"
          esqueleto={<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]"><div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div><Esqueleto className="h-96 rounded-xl max-lg:hidden" /></div>}
          estaVazio={lista.length === 0}
          vazio={<EstadoVazio icone={FileText} titulo="Nenhum modelo ainda" texto="Crie um texto pronto para responder mais rápido." acao={edita ? <BotaoLiquido onClick={novo}><Plus className="size-4" /> Novo modelo</BotaoLiquido> : undefined} />}
        >
          {() => (
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
              {visiveis.length === 0 ? (
                <EstadoVazio variante="filtro" icone={SearchX} titulo={`Nenhum modelo com “${f.q}”.`} texto="Busque por uma palavra do texto."
                  acao={<Button variant="outline" onPress={() => setF({ q: "" })}>Limpar a busca</Button>} />
              ) : <Tabela lista={visiveis} total={lista.length} aberto={f.id} abrir={(id) => setF({ id })} />}
              <Superficie data-rolagem-permitida className="sticky top-[calc(var(--topo)+var(--faixa-fixa)+0.5rem)] max-h-[calc(100dvh-var(--topo)-var(--faixa-fixa)-1.5rem)] overflow-y-auto overscroll-contain p-4 pb-4 max-lg:hidden">
                {atual ? <Editor key={atual.id} m={atual} edita={edita} /> : (
                  <div className="grid place-items-center py-10 text-center">
                    <span className="mb-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><FileText className="size-5" /></span>
                    <p className="text-sm font-medium">Escolha um modelo</p>
                    <p className="mt-1 max-w-56 text-sm text-pretty text-muted-foreground">O texto, as variáveis e a prévia aparecem aqui.</p>
                  </div>
                )}
              </Superficie>
            </div>
          )}
        </ComDados>
      </div>
      <FolhaDeDetalhe aberto={celular && !!atual} aoFechar={() => setF({ id: "" })} sobre={atual?.id} titulo={atual?.nome ?? ""}>
        {atual && <Editor key={atual.id} m={atual} edita={edita} />}
      </FolhaDeDetalhe>
    </>
  )
}

// o gatilho é um evento, não um alerta: texto com o rótulo da projeção, sem o tom de status
const rotuloGatilho = (g?: EtapaOS) => (g
  ? <span className="flex min-w-0 items-center gap-1.5"><Zap className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="truncate" title={`Quando a OS fica ${ETAPA_OS[g].rotulo}`}>{ETAPA_OS[g].rotulo}</span></span>
  : <span className="text-muted-foreground">Manual</span>)

function Tabela({ lista, total, aberto, abrir }: { lista: Modelo[]; total: number; aberto: string; abrir: (id: string) => void }) {
  const pendentes = usePendentes()
  const colunas: ColunaDados<Modelo>[] = [
    { id: "nome", titulo: "Nome", tipo: "texto", valor: (m) => m.nome },
    { id: "gatilho", titulo: "Gatilho", tipo: "status", largura: "11rem", valor: (m) => rotuloGatilho(m.gatilho), texto: (m) => (m.gatilho ? ETAPA_OS[m.gatilho].rotulo : "Manual") },
    { id: "canal", titulo: "Canal", tipo: "texto", largura: "6.5rem", valor: (m) => CANAL[m.canal] },
    { id: "atualizado", titulo: "Editado", tipo: "data", largura: "5.5rem", valor: (m) => dataCurta(m.atualizadoEm) },
  ]
  return (
    <TabelaDados<Modelo>
      titulo="Modelos" colunas={colunas} linhas={lista} idDe={(m) => m.id} quebra="lg"
      contagem={<><span className="num">{lista.length}</span> de <span className="num">{total}</span></>}
      aoAbrir={(m) => abrir(m.id)} aberto={aberto} pendentes={pendentes}
      cartao={(m) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium" title={m.nome}>{m.nome}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{CANAL[m.canal]}</span>
          </div>
          <span className="block truncate text-xs text-muted-foreground" title={m.texto}>{m.texto}</span>
          <div className="flex min-w-0">{rotuloGatilho(m.gatilho)}</div>
        </>
      )}
    />
  )
}

type Rascunho = Pick<Modelo, "nome" | "texto" | "canal" | "gatilho">
/** Rascunho por modelo nesta sessão: trocar de linha na tabela não descarta o que estava sendo editado. */
const rascunhos = new Map<string, Rascunho>()

function Editor({ m, edita }: { m: Modelo; edita: boolean }) {
  const papel = usePapel()
  const todos = modelos.use()
  const [v, setVLocal] = useState<Rascunho>(() => rascunhos.get(m.id) ?? { nome: m.nome, texto: m.texto, canal: m.canal, gatilho: m.gatilho })
  const setV = (n: Rascunho) => { rascunhos.set(m.id, n); setVLocal(n) }
  const u = useId()
  // salvou (ou outra aba salvou): o editor volta ao que está gravado
  const versaoVista = useRef(m.versao)
  useEffect(() => {
    if (m.versao === versaoVista.current) return
    versaoVista.current = m.versao
    rascunhos.delete(m.id); setVLocal({ nome: m.nome, texto: m.texto, canal: m.canal, gatilho: m.gatilho })
  }, [m.versao]) // eslint-disable-line react-hooks/exhaustive-deps
  const desconhecidas = (v.texto.match(/\{\w+\}/g) ?? []).filter((x) => !(VARIAVEIS as readonly string[]).includes(x))
  const repetido = v.gatilho ? todos.find((x) => x.id !== m.id && x.gatilho === v.gatilho) : undefined
  const mudou = v.nome !== m.nome || v.texto !== m.texto || v.canal !== m.canal || v.gatilho !== m.gatilho
  const longo = v.canal === "whatsapp" && v.texto.length > LIMITE_WHATSAPP
  const vazio = !v.nome.trim() || !v.texto.trim() || desconhecidas.length > 0
  const previa = preencher(v.texto, variaveisDeExemplo())
  const inserir = (x: string) => setV({ ...v, texto: `${v.texto}${v.texto && !v.texto.endsWith(" ") ? " " : ""}${x}` })

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (mudou && !vazio && !longo) void salvarModelo(m, { ...v, nome: v.nome.trim() }) }}>
      <div className="grid gap-1.5">
        <Label htmlFor={`nome-${u}`}>Nome</Label>
        <Input id={`nome-${u}`} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} disabled={!edita} aria-invalid={!v.nome.trim() || undefined} />
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium" id={`canal-${u}`}>Canal</span>
        <SegmentadoDeVidro aria-labelledby={`canal-${u}`} valor={v.canal} aoMudar={(c) => edita && setV({ ...v, canal: c as Canal })} isDisabled={!edita}
          opcoes={(Object.keys(CANAL) as Canal[]).map((c) => ({ id: c, rotulo: CANAL[c] }))} />
      </div>
      <div className="grid gap-1.5">
        <Label id={`gat-${u}`}>Gatilho</Label>
        <Select aria-labelledby={`gat-${u}`} selectedKey={v.gatilho ?? "manual"} isDisabled={!edita}
          onSelectionChange={(k) => setV({ ...v, gatilho: k === "manual" ? undefined : (String(k) as EtapaOS) })} className="w-full">
          <SelectTrigger className="w-full min-w-0"><SelectValue className="min-w-0 truncate" /></SelectTrigger>
          <SelectContent>
            <SelectItem id="manual">Manual (só quando alguém usa)</SelectItem>
            {GATILHOS.map((g) => <SelectItem key={g} id={g} textValue={ETAPA_OS[g].rotulo}>Quando a OS fica {ETAPA_OS[g].rotulo}</SelectItem>)}
          </SelectContent>
        </Select>
        {repetido && <p className="text-xs text-pretty text-muted-foreground">O modelo “{repetido.nome}” já usa este gatilho. Os dois saem quando a OS mudar.</p>}
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={`texto-${u}`}>Texto</Label>
          <span className={longo ? "num text-xs text-[var(--texto-negativo,var(--destructive))]" : "num text-xs text-muted-foreground"}>{v.texto.length}{v.canal === "whatsapp" ? ` de ${LIMITE_WHATSAPP.toLocaleString("pt-BR")}` : ""}</span>
        </div>
        <Textarea id={`texto-${u}`} value={v.texto} onChange={(e) => setV({ ...v, texto: e.target.value })} disabled={!edita} className="min-h-28" aria-describedby={`vars-${u}`} aria-invalid={longo || !v.texto.trim() || undefined} />
        {longo && <p className="text-xs text-[var(--texto-negativo,var(--destructive))]">O WhatsApp aceita até 1.024 caracteres. Encurte o texto.</p>}
        {desconhecidas.length > 0 && <p role="alert" className="text-xs text-[var(--texto-negativo,var(--destructive))]">{desconhecidas.join(", ")} não é uma variável. Use {VARIAVEIS.join(", ")}.</p>}
        {edita && (
          <div id={`vars-${u}`} className="flex flex-wrap gap-1.5" aria-label="Inserir variável">
            {VARIAVEIS.map((x) => <Button key={x} type="button" variant="outline" size="sm" className="num rounded-full" onPress={() => inserir(x)}>{x}</Button>)}
          </div>
        )}
      </div>
      <section aria-label="Prévia" className="grid gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Bot className="size-3.5" aria-hidden="true" /> Prévia com a OS-1052 da Juliana · {CANAL[v.canal]}</p>
        <Bubble variant="tinted" align="end" className="max-w-[92%]">
          <BubbleContent className="text-pretty whitespace-pre-line [overflow-wrap:anywhere]">{previa || "O texto aparece aqui."}</BubbleContent>
        </Bubble>
      </section>
      {edita ? (
        // os botões grudam no pé do painel: Salvar nunca fica abaixo da dobra
        <div className="sticky bottom-0 z-[1] flex flex-wrap justify-end gap-2 bg-[color-mix(in_oklch,var(--card)_92%,transparent)] py-3 lg:-mx-4 lg:-mb-4 lg:px-4 shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)] backdrop-blur-sm">
          {mudou && <span className="me-auto self-center text-xs text-muted-foreground">Alterações não salvas</span>}
          <Button type="button" variant="ghost" isDisabled={!mudou} onPress={() => { rascunhos.delete(m.id); setVLocal({ nome: m.nome, texto: m.texto, canal: m.canal, gatilho: m.gatilho }) }}>Descartar</Button>
          <Button type="submit" isDisabled={!mudou || vazio || longo}>Salvar</Button>
        </div>
      ) : <p className="text-xs text-pretty text-muted-foreground">{fraseSemPermissao(papel, "mensagens_modelos")}</p>}
    </form>
  )
}
