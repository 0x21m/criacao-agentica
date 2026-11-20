// Módulo Clientes (5.5) · /clientes/: mestre-detalhe. Lista de 360 px à esquerda (busca, segmentos em chips), detalhe
// à direita com banner curto, resumo sobreposto e abas (Detalhe.tsx). No celular a lista e o detalhe se alternam
// ("Voltar"). O cliente, a aba, a busca e o segmento ficam na URL (?id=C-0007&aba=pedidos&q=&seg=).
// Técnico (ver_clientes "proprias"): só nome, bairro e telefone dos clientes com visita dele em andamento.
import { useMemo } from "react"
import { Clock, MapPin, Phone, UserPlus, Users } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { Button } from "@/components/ui/button"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { Superficie } from "@/components/sistema/Superficie"
import { BotaoLiquido } from "@/components/movimento"
import { pode, usePapel, usePessoa } from "@/proto/permissoes"
import { servicoPorSlug } from "@/proto/negocio"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { dataHora } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { clientes, type Cliente } from "../dados"
import { ListaClientes } from "./Lista"
import { Detalhe } from "./Detalhe"

const PADRAO = { id: "", q: "", seg: "todos", aba: "" }

export default function Clientes() {
  const [p, setP] = useParametrosDaUrl(PADRAO)
  const lista = clientes.use()
  const papel = usePapel()
  const tecnico = papel === "tecnico"
  const podeCriar = pode(papel, "editar_cliente")
  return (
    <>
      <CabecalhoPagina titulo="Clientes" descricao={tecnico ? "Os clientes das suas visitas de agora" : "Quem compra de você e o histórico de cada um"}
        contagem={tecnico ? undefined : `${lista.filter((c) => c.estado !== "anonimizado").length} clientes`}
        acoes={podeCriar && <BotaoLiquido href={url("clientes/novo/")}><UserPlus className="size-4" /> Novo cliente</BotaoLiquido>} />
      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="ver_clientes" area="do atendimento" rotulo="os clientes"
          esqueleto={<EsqueletoClientes />}
          estaVazio={lista.length === 0}
          vazio={<EstadoVazio icone={Users} titulo="Nenhum cliente ainda." texto="Eles entram sozinhos pelo site ou você cadastra."
            acao={podeCriar ? <BotaoLiquido href={url("clientes/novo/")}><UserPlus className="size-4" /> Novo cliente</BotaoLiquido> : undefined} />}
        >
          {() => tecnico ? <DaVisita lista={lista} /> : (
            <MestreDetalhe lista={lista} p={p} setP={setP} podeCriar={podeCriar} />
          )}
        </ComDados>
      </div>
    </>
  )
}

function EsqueletoClientes() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[22.5rem_minmax(0,1fr)]">
      <Superficie className="grid content-start gap-1.5 p-3">
        <Esqueleto className="h-9 rounded-lg" />
        <div className="mb-1.5 flex gap-1.5">{["w-14", "w-16", "w-14", "w-20"].map((w, i) => <Esqueleto key={i} className={cn("h-8 rounded-full", w)} />)}</div>
        {Array.from({ length: 10 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}
      </Superficie>
      <div className="grid content-start gap-4 max-lg:hidden">
        <Esqueleto className="h-48 rounded-[var(--raio-sup)]" />
        <div className="flex gap-2">{Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-9 w-24 rounded-lg" />)}</div>
        <Esqueleto className="h-64 rounded-[var(--raio-sup)]" />
      </div>
    </div>
  )
}

function MestreDetalhe({ lista: todos, p, setP, podeCriar }: {
  lista: Cliente[]; p: typeof PADRAO; setP: (m: Partial<typeof PADRAO>) => void; podeCriar: boolean
}) {
  const ps = pedidos.use()
  const atual = todos.find((c) => c.id === p.id) ?? null
  const contagemOS = useMemo(() => {
    const m = new Map<string, number>()
    ps.forEach((x) => m.set(x.clienteId, (m.get(x.clienteId) ?? 0) + 1))
    return m
  }, [ps])
  const abrir = (id: string | null) => setP({ id: id ?? "", aba: "" })

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[22.5rem_minmax(0,1fr)]">
      <ListaClientes todos={todos} q={p.q} setQ={(q) => setP({ q })} seg={p.seg} setSeg={(seg) => setP({ seg })} id={p.id || null}
        abrir={abrir} contagemOS={contagemOS} podeCriar={podeCriar} className={cn(p.id && "max-lg:hidden")} />
      <div className={cn("min-w-0", !p.id && "max-lg:hidden")}>
        {atual ? <Detalhe key={atual.id} c={atual} aba={p.aba || "resumo"} setAba={(aba) => setP({ aba })} onVoltar={() => abrir(null)} abrir={abrir} />
          : p.id ? (
            <EstadoVazio icone={Users} titulo={`${p.id} não existe mais.`} texto="O cadastro pode ter sido mesclado com outro. Busque pelo nome." className="h-full min-h-80"
              acao={<Button variant="outline" onPress={() => abrir(null)}>Voltar para a lista</Button>} />
          ) : (
            <EstadoVazio icone={Users} titulo="Escolha um cliente" texto="Os dados, os pedidos, a agenda e as conversas aparecem aqui." className="h-full min-h-80" />
          )}
      </div>
    </div>
  )
}

/** Técnico: só durante a visita (agendamento dele em atendimento), e só nome, bairro e telefone. */
function DaVisita({ lista }: { lista: Cliente[] }) {
  const eu = usePessoa()
  const ags = agendamentos.use()
  const agora = ags.filter((a) => a.recursoId === eu.id && a.estado === "em_atendimento")
  if (!agora.length) return (
    <EstadoVazio icone={Clock} titulo="Os dados do cliente aparecem durante a visita." texto="Marque a chegada no Meu dia e o nome, o bairro e o telefone aparecem aqui."
      acao={<a href={url("")} className={cn(buttonVariants({ variant: "outline" }))}>Ir para o Meu dia</a>} />
  )
  return (
    <ul className="grid gap-4 md:grid-cols-2" aria-label="Clientes das visitas em andamento">
      {agora.map((a) => {
        const c = lista.find((x) => x.id === a.clienteId)
        if (!c) return null
        return (
          <li key={a.id}>
            <Superficie className="grid gap-3 p-4">
              <div className="min-w-0">
                <h2 className="t-card truncate" title={c.nome}>{c.nome}</h2>
                <p className="text-sm text-muted-foreground"><span className="num">{a.id}</span> · {servicoPorSlug(a.servicoSlug)?.nome ?? a.servicoSlug} · desde <span className="num">{dataHora(a.inicio, { ano: false })}</span></p>
              </div>
              <p className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-muted-foreground" aria-hidden="true" /> {a.bairro || c.endereco.bairro}</p>
              <a href={`tel:+55${c.telefone.replace(/\D/g, "")}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 w-fit")}><Phone /> <span className="num">{c.telefone}</span></a>
            </Superficie>
          </li>
        )
      })}
    </ul>
  )
}
