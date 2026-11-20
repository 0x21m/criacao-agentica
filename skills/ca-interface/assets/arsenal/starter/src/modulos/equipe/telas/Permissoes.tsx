// Módulo Equipe (5.10) · /equipe/permissoes/: quem vê e quem pode. Lê a MATRIZ de permissoes.ts (fonte única).
// Desktop: uma TabelaDados por grupo de módulos (linhas = capacidades, colunas = papéis); cada célula abre o popover
// "por que esta permissão" (a regra, o que ela quer dizer e a nota da matriz) e, para o dono, a troca da regra.
// Celular: um papel por vez (?papel=), a lista de capacidades com interruptores.
// A edição é SIMULADA (protótipo): grava em `ajustes_permissao` (P), marca a célula e avisa; as outras telas e a acao()
// continuam com a MATRIZ (ver BASE no modulo.ts). "Restaurar padrão" desfaz todos os ajustes (P, com confirmação).
import { Suspense, lazy, useMemo, useState } from "react"
import { Check, FlaskConical, Minus, MapPin, RotateCcw, SearchX, SlidersHorizontal, UserRound } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Superficie } from "@/components/sistema/Superficie"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { useProcessando } from "@/proto/dados"
import { MATRIZ, PAPEIS, nomeDoPapel, pessoaDoPapel, pode, usePapel, type Capacidade, type Papel, type Regra } from "@/proto/permissoes"
import { cn } from "@/lib/utils"
import { normalizar } from "@/modulos/registro"
import { explicaRegra, ajustes, regraEfetiva, restaurarPadrao, rotuloRegra, simularRegra, type Ajuste } from "../dados"
import { CabecalhoEquipe } from "./comum"
import type { Alvo } from "./PorQue"

const PorQueFlutuante = lazy(() => import("./PorQue"))

/** Grupos por módulo (a ordem da navegação). Capacidade nova que outro módulo acrescentar cai em "Outras". */
const GRUPOS: { titulo: string; caps: string[] }[] = [
  { titulo: "Início e pedidos", caps: ["ver_inicio", "ver_pedidos", "criar_pedido", "mover_os", "enviar_orcamento", "registrar_aprovacao", "concluir_os", "cancelar_os", "desconto_alto"] },
  { titulo: "Agenda", caps: ["ver_agenda", "mover_agenda"] },
  { titulo: "Clientes e mensagens", caps: ["ver_clientes", "editar_cliente", "nota_interna", "anonimizar", "mensagens"] },
  { titulo: "Estoque e custos", caps: ["estoque_ver", "estoque_ajustar", "ver_custo"] },
  { titulo: "Financeiro e relatórios", caps: ["financeiro_ver", "ver_totais", "receber", "pagar", "estornar", "fechar_caixa", "relatorios"] },
  { titulo: "Equipe e empresa", caps: ["equipe_ver", "equipe_gerir", "auditoria", "configuracoes_empresa", "aparencia", "trocar_unidade"] },
]
const TODAS = Object.keys(MATRIZ) as Capacidade[]
const agrupadas = (() => {
  const conhecidas = new Set(GRUPOS.flatMap((g) => g.caps))
  const outras = TODAS.filter((c) => !conhecidas.has(c))
  return [...GRUPOS.map((g) => ({ titulo: g.titulo, caps: g.caps.filter((c): c is Capacidade => c in MATRIZ) })), ...(outras.length ? [{ titulo: "Outras", caps: outras }] : [])]
})()

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ICONE: Record<string, typeof Check> = { true: Check, false: Minus, proprias: UserRound, unidade: MapPin, parcial: SlidersHorizontal }
const LEGENDA = { true: "em qualquer registro", false: "a tela some e a ação recusa", proprias: "só as atribuídas a ele", unidade: "só as da unidade dele", parcial: "a tela abre com um recorte" } as const
const lerRegra = (s: string): Regra => (s === "true" ? true : s === "false" ? false : (s as Regra))
// ?ver= escolhe o papel no celular (não ?papel=, que é o "Ver como" da barra F)
const PADRAO = { q: "", simuladas: "", ver: "gestora" }

export default function Permissoes() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const lista = ajustes.use()
  const papel = usePapel()
  const editavel = MATRIZ.equipe_gerir[papel] === true
  const [restaurando, setRestaurando] = useState(false)
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const processando = useProcessando()
  const simuladas = lista.filter((a) => a.regra !== null).length
  const filtrado = f.q !== "" || !!f.simuladas
  const limpar = () => setF({ q: "", simuladas: "" })
  const grupos = useMemo(() => {
    const t = normalizar(f.q.trim())
    return agrupadas.map((g) => ({
      ...g,
      caps: g.caps.filter((c) => (!t || normalizar(MATRIZ[c].rotulo).includes(t) || normalizar(g.titulo).includes(t)) &&
        (!f.simuladas || PAPEIS.some((p) => regraEfetiva(lista, c, p.id).simulada))),
    })).filter((g) => g.caps.length)
  }, [f.q, f.simuladas, lista])
  const papelCel = (PAPEIS.some((p) => p.id === f.ver) ? f.ver : "gestora") as Papel
  const abre = pode(papel, "equipe_ver")

  return (
    <>
      <CabecalhoEquipe
        tela="permissoes"
        titulo="Permissões"
        descricao="Quem vê e quem pode, papel por papel"
        contagem={!abre ? undefined : `${TODAS.length} ações · ${PAPEIS.length} papéis${simuladas ? ` · ${simuladas} ${simuladas === 1 ? "simulada" : "simuladas"}` : ""}`}
        acoes={editavel && simuladas > 0 && <Button variant="outline" onPress={() => setRestaurando(true)}><RotateCcw /> Restaurar padrão</Button>}
      >
        {abre && <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar permissão" placeholder="Buscar ação (ex.: custo, caixa)" filtrado={filtrado} aoLimpar={limpar}>
          <Select aria-label="Papel" selectedKey={papelCel} onSelectionChange={(k) => setF({ ver: String(k) })} className="w-[calc(50%-0.25rem)] lg:hidden">
            <SelectTrigger className="h-10 rounded-full"><SelectValue className="!block truncate" /></SelectTrigger>
            <SelectContent>{PAPEIS.map((p) => <SelectItem key={p.id} id={p.id}>{p.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Switch isSelected={!!f.simuladas} onChange={(v) => setF({ simuladas: v ? "1" : "" })} className="min-h-10 px-2">Só as simuladas</Switch>
        </BarraFerramentas>}
      </CabecalhoEquipe>

      <div className="grid gap-4 px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="equipe_ver" area="do dono e da gestora" rotulo="a matriz de permissões"
          esqueleto={<EsqueletoMatriz />}
          vazio={<EstadoVazio icone={SlidersHorizontal} titulo="Nenhuma permissão definida" texto="A matriz aparece aqui quando os papéis forem configurados." />}
        >
          {() => (
            <>
              <Superficie tom="aviso" className="flex items-start gap-3 rounded-[var(--radius-xl)] px-4 py-3 text-sm">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-alerta-texto" aria-hidden="true" />
                <p className="text-pretty">
                  <span className="font-medium">Protótipo: a edição desta matriz é simulada.</span>{" "}
                  {editavel
                    ? "A mudança fica só neste navegador e aparece marcada aqui; as outras telas continuam com a matriz padrão."
                    : <>Só {pessoaDoPapel("dono").nome} (dono) muda a matriz.<span className="max-lg:hidden"> Clique numa célula para ver o porquê de cada regra.</span></>}
                </p>
              </Superficie>
              <dl data-grupo aria-label="Legenda" className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
                {(["true", "false", "proprias", "unidade", "parcial"] as const).map((k) => {
                  const I = ICONE[k]
                  return <div key={k} className="flex items-center gap-1.5"><dt className="flex items-center gap-1 font-medium text-foreground"><I className="size-3.5" aria-hidden="true" />{rotuloRegra(lerRegra(k))}</dt><dd>{LEGENDA[k]}</dd></div>
                })}
              </dl>
              {grupos.length === 0 ? (
                <EstadoVazio variante="filtro" icone={SearchX} titulo={f.simuladas && !f.q ? "Nenhuma permissão simulada." : `Nenhuma ação com “${f.q}”.`}
                  texto={f.simuladas && !f.q ? "A matriz está igual ao padrão." : "Tente outra palavra, como custo, caixa ou agenda."}
                  acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
              ) : (
                <>
                  <div className="grid gap-4 max-lg:hidden">
                    {grupos.map((g) => <TabelaDoGrupo key={g.titulo} titulo={g.titulo} caps={g.caps} ajustes={lista} processando={processando} abrir={setAlvo} />)}
                  </div>
                  <PorPapel papel={papelCel} grupos={grupos} ajustes={lista} editavel={editavel} />
                </>
              )}
            </>
          )}
        </ComDados>
      </div>
      {alvo && <Suspense fallback={null}><PorQueFlutuante alvo={alvo} aoFechar={() => setAlvo(null)} ajustes={lista} editavel={editavel} /></Suspense>}
      <DialogoConfirmar aberto={restaurando} aoFechar={() => setRestaurando(false)} titulo="Restaurar a matriz padrão?"
        descricao={`${simuladas === 1 ? "O ajuste simulado volta" : `Os ${simuladas} ajustes simulados voltam`} à regra padrão. O que foi feito continua registrado na auditoria.`}
        confirmar="Restaurar padrão" voltar="Manter os ajustes" aoConfirmar={() => restaurarPadrao()} />
    </>
  )
}

function EsqueletoMatriz() {
  return (
    <div className="grid gap-4">
      {[5, 3].map((n, g) => (
        <div key={g} className="grid gap-2">
          <Esqueleto className="h-12 rounded-lg" />
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_repeat(5,6rem)] gap-2 max-lg:grid-cols-[minmax(0,1fr)_3rem]">
              <Esqueleto className="h-10 rounded-md" />
              {Array.from({ length: 5 }, (_, j) => <Esqueleto key={j} className={cn("h-10 rounded-md", j > 0 && "max-lg:hidden")} />)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- desktop: uma tabela por grupo
function TabelaDoGrupo({ titulo, caps, ajustes: lista, processando, abrir }: { titulo: string; caps: Capacidade[]; ajustes: Ajuste[]; processando: Set<string>; abrir: (a: Alvo) => void }) {
  const colunas: ColunaDados<Capacidade>[] = [
    { id: "cap", titulo: "Ação", tipo: "texto", valor: (c) => capitalizar(MATRIZ[c].rotulo) },
    ...PAPEIS.map((p): ColunaDados<Capacidade> => ({
      id: p.id, titulo: p.nome, tipo: "status", largura: "8rem",
      texto: (c) => rotuloRegra(regraEfetiva(lista, c, p.id).regra),
      valor: (c) => <CelulaRegra cap={c} papel={p.id} ajustes={lista} ocupado={processando.has(`${c}:${p.id}`)} abrir={abrir} />,
    })),
  ]
  return (
    <TabelaDados<Capacidade> titulo={titulo} colunas={colunas} linhas={caps} idDe={(c) => c} quebra="lg" className="max-lg:hidden"
      contagem={<><span className="num">{caps.length}</span> {caps.length === 1 ? "ação" : "ações"}</>} />
  )
}

/** A célula: um botão simples (hidrata leve); o popover "por que" é um só para a matriz, ancorado aqui. */
function CelulaRegra({ cap, papel, ajustes: lista, ocupado, abrir }: { cap: Capacidade; papel: Papel; ajustes: Ajuste[]; ocupado: boolean; abrir: (a: Alvo) => void }) {
  const { regra, simulada } = regraEfetiva(lista, cap, papel)
  const I = ICONE[String(regra)] ?? SlidersHorizontal
  return (
    <button type="button" onClick={(e) => abrir({ cap, papel, el: e.currentTarget })} aria-haspopup="dialog"
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 h-8 max-w-full gap-1.5 px-2 font-normal", regra === false && "text-muted-foreground",
        simulada && "bg-[color-mix(in_oklch,var(--alerta)_16%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--alerta)_55%,transparent)]")}
      aria-label={`${nomeDoPapel(papel)}, ${MATRIZ[cap].rotulo}: ${rotuloRegra(regra)}${simulada ? " (simulada)" : ""}. Ver o porquê`}>
      <I aria-hidden="true" className={cn(regra === true && "text-positive")} />
      <span className="truncate">{ocupado ? "Enviando…" : rotuloRegra(regra)}</span>
      {simulada && !ocupado && <span aria-hidden="true" title="Simulada" className="size-1.5 shrink-0 rounded-full bg-alerta" />}
    </button>
  )
}

// ---------------------------------------------------------------- celular: um papel por vez, com interruptores
function PorPapel({ papel, grupos, ajustes: lista, editavel }: {
  papel: Papel; grupos: { titulo: string; caps: Capacidade[] }[]; ajustes: Ajuste[]; editavel: boolean
}) {
  const processando = useProcessando()
  const [erro, setErro] = useState<string | null>(null)
  async function alternar(cap: Capacidade, ligado: boolean) {
    setErro(null)
    const padrao = MATRIZ[cap][papel] as Regra
    const r = await simularRegra(cap, papel, ligado ? (padrao === false ? true : padrao) : false, lista.find((a) => a.id === `${cap}:${papel}`))
    if (!r.ok) setErro(r.mensagem)
  }
  return (
    <div className="grid gap-4 lg:hidden">
      {erro && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erro}</p>}
      {grupos.map((g) => (
        <Superficie key={g.titulo} como="section" aria-label={g.titulo} className="rounded-[var(--raio-sup)] px-4 py-2">
          <div className="flex items-baseline justify-between gap-2 py-2"><h2 className="t-card">{g.titulo}</h2><span className="text-xs text-muted-foreground">{nomeDoPapel(papel)}</span></div>
          <ul className="divide-y divide-[color-mix(in_oklch,var(--foreground)_7%,transparent)]">
            {g.caps.map((c) => {
              const { regra, padrao, simulada } = regraEfetiva(lista, c, papel)
              const ocupado = processando.has(`${c}:${papel}`)
              const detalhe = ocupado ? "Enviando…" : simulada ? `Simulada · padrão: ${rotuloRegra(padrao)}` : regra !== true && regra !== false ? explicaRegra(regra) : undefined
              return (
                <li key={c}>
                  {editavel ? (
                    <Switch isSelected={regra !== false} isDisabled={ocupado} onChange={(v) => void alternar(c, v)}
                      className="min-h-12 w-full flex-row-reverse justify-between gap-4 py-1.5">
                      <Linha c={c} detalhe={detalhe} simulada={simulada} />
                    </Switch>
                  ) : (
                    // só leitura: a regra escrita, sem interruptor que pareça editável
                    <div className="flex min-h-12 items-center justify-between gap-4 py-1.5">
                      <Linha c={c} detalhe={detalhe} simulada={simulada} />
                      <span className={cn("flex shrink-0 items-center gap-1 text-sm", regra === false && "text-muted-foreground")}>
                        {(() => { const I = ICONE[String(regra)] ?? SlidersHorizontal; return <I className={cn("size-4", regra === true && "text-positive")} aria-hidden="true" /> })()}
                        {rotuloRegra(regra)}
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Superficie>
      ))}
    </div>
  )
}

function Linha({ c, detalhe, simulada }: { c: Capacidade; detalhe?: string; simulada: boolean }) {
  return (
    <span className="grid min-w-0 gap-0.5">
      <span className="text-sm text-pretty">{capitalizar(MATRIZ[c].rotulo)}</span>
      {detalhe && <span className={cn("text-xs text-pretty", simulada ? "text-alerta-texto" : "text-muted-foreground")}>{detalhe}</span>}
    </span>
  )
}
