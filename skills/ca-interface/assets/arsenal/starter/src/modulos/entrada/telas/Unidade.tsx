// Módulo Entrada (5.1) · /entrar/unidade/: escolher a unidade (quem trabalha em mais de uma: dono, gestora, financeiro).
// Desktop: as duas unidades em cards grandes lado a lado (foto, endereço, "Hoje: N visitas") e "Todas as unidades"
// embaixo; celular: lista. As visitas de hoje vêm da agenda (contagem derivada, nada fixo). Trocar é otimista (O) e
// passa pelo carregamento com a marca até o Início.
import { useId, useMemo, useState } from "react"
import { Building2, Check, Layers } from "lucide-react"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { Superficie } from "@/components/sistema/Superficie"
import { LinkButton } from "@/components/ui/button"
import { foto } from "@/components/site/fotos"
import { agendamentos } from "@/modulos/agenda/dados"
import { UNIDADES, recursoPorId, type Unidade } from "@/proto/negocio"
import { mesmoDia, useAgora } from "@/proto/relogio"
import { nomeDoPapel, usePapel, usePessoa, useSessao } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { nomeDaUnidade, trocarUnidade, type EscolhaUnidade } from "../dados"
import { CarregandoComMarca, LinkTexto, MolduraEntrada, fraseDaUnidade, saudacao } from "./comum"

// fotos do site (stand-ins com licença em fotos.json; créditos em /site/creditos/)
const FOTO: Record<Unidade, string> = { pampulha: "f160025964", contagem: "f41117679" }
const PAPEL_DA_UNIDADE: Record<Unidade, string> = { pampulha: "Matriz, loja e bancada", contagem: "Base de campo e depósito" }
const FORA = ["cancelado", "expirado", "faltou"]
const visitas = (n: number) => `Hoje: ${n} ${n === 1 ? "visita" : "visitas"}`

export default function EscolherUnidade() {
  const id = useId()
  const ag = useAgora()
  const papel = usePapel()
  const sessao = useSessao()
  const pessoa = usePessoa()
  const lista = agendamentos.use()
  const [indo, setIndo] = useState<EscolhaUnidade | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [abrindo, setAbrindo] = useState(false)

  const contagem = useMemo(() => {
    const hoje = lista.filter((a) => mesmoDia(new Date(a.inicio), ag) && !FORA.includes(a.estado))
    const de = (u: Unidade) => hoje.filter((a) => recursoPorId(a.recursoId)?.unidade === u).length
    return { pampulha: de("pampulha"), contagem: de("contagem"), todas: hoje.length }
  }, [lista, ag])
  const aberta = fraseDaUnidade(ag)

  async function escolher(u: EscolhaUnidade) {
    if (indo) return
    setIndo(u)
    setErro(null)
    setAbrindo(true)
    const r = await trocarUnidade(u)
    if (!r.ok) { setAbrindo(false); setIndo(null); setErro(r.mensagem) }
  }

  return (
    <MolduraEntrada largura="larga" titulo={`${saudacao(ag)}, ${pessoa.curto}`}
      descricao={`Você entrou como ${nomeDoPapel(papel).toLowerCase()}. Escolha a unidade de hoje; dá para trocar depois pela busca do topo.`}>
      <ComDados capacidade="trocar_unidade" area="de quem trabalha nas duas unidades" rotulo="as unidades"
        esqueleto={
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => <Esqueleto key={i} className="h-72 rounded-[var(--raio-sup)] max-md:h-24" />)}
            <Esqueleto className="h-20 rounded-[var(--raio-sup)] md:col-span-2" />
          </div>
        }
        vazio={
          <EstadoVazio icone={Building2} titulo="Nenhuma unidade liberada para você"
            texto="Seu acesso existe, mas ainda não está ligado a uma unidade. Peça a Marina Duarte (gestora) para liberar."
            acao={<LinkButton variant="outline" href={url("entrar/")}>Voltar ao login</LinkButton>} />
        }>
        <section aria-labelledby={`${id}-titulo`} className="space-y-4">
          <h2 id={`${id}-titulo`} className="sr-only">Unidades</h2>
          {erro && <p role="alert" className="text-sm text-pretty text-destructive">{erro}</p>}
          <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
            {(Object.keys(UNIDADES) as Unidade[]).map((u) => (
              <CartaoUnidade key={u} unidade={u} atual={sessao.unidade === u} indo={indo === u} desabilitado={!!indo}
                aoEscolher={() => void escolher(u)}
                detalhe={<>{visitas(contagem[u])}<span aria-hidden="true"> · </span>{aberta}</>} />
            ))}
            <Superficie como="li" interativa className="relative flex min-h-16 items-start gap-3 p-3 md:col-span-2 md:items-center md:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[calc(var(--raio-sup)*0.6)] bg-muted text-muted-foreground"><Layers className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="t-card"><button type="button" onClick={() => void escolher("todas")} disabled={!!indo} aria-pressed={sessao.unidade === "todas"}
                    className="inline-flex items-center text-left outline-none max-md:min-h-10 after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
                    Todas as unidades
                  </button></h3>
                  {sessao.unidade === "todas" && <Atual />}
                </div>
                <span className="block text-sm text-pretty text-muted-foreground">Os números de Pampulha e Contagem lado a lado.</span>
                <span className="num block pt-1 text-sm font-medium whitespace-nowrap md:hidden">{indo === "todas" ? "Abrindo…" : visitas(contagem.todas)}</span>
              </div>
              <span className="num shrink-0 text-sm font-medium whitespace-nowrap max-md:hidden">{indo === "todas" ? "Abrindo…" : visitas(contagem.todas)}</span>
            </Superficie>
          </ul>
          <p className="text-center text-sm text-muted-foreground">
            Não é você? <LinkTexto href={url("entrar/")}>Entrar com outra conta</LinkTexto>
          </p>
        </section>
      </ComDados>
      {abrindo && indo && <CarregandoComMarca quem={pessoa.curto} onde={indo === "todas" ? "nas duas unidades" : `em ${nomeDaUnidade(indo)}`} minimo={900} />}
    </MolduraEntrada>
  )
}

function Atual() {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--primary)_16%,transparent)] px-2 text-xs font-medium whitespace-nowrap text-foreground">
      <Check className="size-3" aria-hidden="true" /> Atual
    </span>
  )
}

/** Card da unidade: foto (desktop) ou miniatura (celular), nome, papel da unidade, endereço e o dia. O card todo clica. */
function CartaoUnidade({ unidade, atual, indo, desabilitado, aoEscolher, detalhe }: {
  unidade: Unidade; atual: boolean; indo: boolean; desabilitado: boolean; aoEscolher: () => void; detalhe: React.ReactNode
}) {
  const f = foto(FOTO[unidade])
  const u = UNIDADES[unidade]
  return (
    <Superficie como="li" interativa className={cn("relative flex h-full gap-3 p-3 md:flex-col md:gap-4 md:p-4", atual && "ring-2 ring-[color-mix(in_oklch,var(--primary)_55%,transparent)]")}>
      <img src={f.src} srcSet={f.srcset} sizes="(min-width: 768px) 420px, 64px" width={f.width} height={f.height} alt="" loading="lazy" decoding="async"
        className="size-16 shrink-0 rounded-[calc(var(--raio-sup)*0.6)] object-cover md:aspect-[16/9] md:h-auto md:w-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="t-card">
            <button type="button" onClick={aoEscolher} disabled={desabilitado} aria-pressed={atual}
              className="inline-flex items-center text-left outline-none max-md:min-h-10 after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
              {u.nome}
            </button>
          </h3>
          {atual && <Atual />}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{PAPEL_DA_UNIDADE[unidade]}</span>
        <span className="text-sm text-pretty text-muted-foreground max-md:line-clamp-3" title={u.endereco}>{u.endereco}</span>
        <span className="num mt-auto pt-1 text-sm font-medium">{indo ? "Abrindo…" : detalhe}</span>
      </div>
    </Superficie>
  )
}
