// Estado de região de módulo indisponível (EST-47): desligado, desligado com dados guardados ou fora do ar. Diz qual dos
// três é e o que fazer, sem ação morta: quem pode ligar vê "Ligar"; os outros, a quem pedir. Serve a qualquer id, mesmo
// de módulo que ainda não existe ("loja"): o nome, o gênero e o que acontece com os dados vêm do registro da situação
// (src/proto/modulos.ts), gravado por quem desliga, ou das props.
// O guarda de rota do AppShell (GuardaDeModulo) mostra esta peça no lugar da tela; um módulo pode usá-la numa região.
import { CircleCheck, CloudOff, PowerOff, RotateCw } from "lucide-react"
import { LinkButton } from "@/components/ui/button"
import { formatosDaProjecao } from "@/proto/projecao"
import { MATRIZ, aQuemPedir, pode, usePapel } from "@/proto/permissoes"
import { useRegistroDoModulo } from "@/proto/modulos"
import { inicioDoPainel, url } from "@/lib/url"
import { cn } from "@/lib/utils"

const { d, h } = formatosDaProjecao

export type PropsModuloIndisponivel = {
  /** Id do módulo (o do registro, ou um que ainda não existe, como "loja"). */ id: string
  /** Nome quando o registro da situação não traz ("Estoque"). */ nome?: string
  genero?: "o" | "a"
  /** O que acontece com os dados enquanto está desligado. */ dados?: string
  /** Rota do módulo (sem o base: "estoque/"), para "Abrir" e "Tentar de novo". */ rota?: string
  /** Rota que a pessoa tentou abrir (sem o base). */ de?: string
  /** Onde se liga o módulo (sem o base: "configuracoes/modulos/#estoque"); sem ela, não há "Ligar". */ ondeLigar?: string
  className?: string
}

export function ModuloIndisponivel({ id, nome: nomeProp, genero, dados: dadosProp, rota, de, ondeLigar, className }: PropsModuloIndisponivel) {
  const m = useRegistroDoModulo(id)
  const papel = usePapel()
  const cap = "configuracoes_empresa"
  const liga = !!ondeLigar && cap in MATRIZ && pode(papel, cap)
  const nome = m?.nome ?? nomeProp ?? id
  const g = m?.genero ?? genero ?? "o"
  const dados = m?.dados ?? dadosProp
  const destino = de ? url(de.replace(/\/?$/, "/")) : rota ? url(rota) : inicioDoPainel()
  const caixa = (tom: "neutro" | "perigo", Icone: typeof CloudOff, titulo: string, texto: string, acoes: React.ReactNode, caso: string) => (
    <div data-estado-modulo={caso} role={tom === "perigo" ? "alert" : "status"} data-nivel="card" data-tom={tom === "perigo" ? "perigo" : undefined}
      className={cn("sup mx-auto flex max-w-lg flex-col items-center justify-center gap-3 rounded-[var(--raio-sup)] px-6 py-12 text-center", className)}>
      <span className={cn("grid size-11 place-items-center rounded-full", tom === "perigo" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}><Icone className="size-5" aria-hidden="true" /></span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-balance">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">{texto}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">{acoes}</div>
    </div>
  )
  const voltar = <LinkButton variant="outline" href={inicioDoPainel()} className="pointer-coarse:min-h-10">Voltar ao início</LinkButton>
  if (!m || m.situacao === "ligado") {
    return caixa("neutro", CircleCheck, `${nome} está ligad${g}`, "O módulo voltou a funcionar para a equipe.",
      rota ? <LinkButton href={destino} className="pointer-coarse:min-h-10">Abrir {g} {nome}</LinkButton> : voltar, "ligado")
  }
  if (m.situacao === "fora_do_ar") {
    return caixa("perigo", CloudOff, `${nome} fora do ar`, `Desde ${h(m.desde)}. Os outros dados estão atualizados; só esta parte não responde agora.`,
      <>{voltar}<LinkButton href={destino} className="pointer-coarse:min-h-10"><RotateCw /> Tentar de novo</LinkButton></>, "fora-do-ar")
  }
  const quando = `Desligad${g} por ${m.quem} em ${d(m.desde)} às ${h(m.desde)}.`
  return caixa("neutro", PowerOff, `${nome} não está ativ${g} nesta conta`,
    `${quando} ${dados ?? ""} ${liga ? "" : `Para religar, peça a ${aQuemPedir(papel)}.`}`.replace(/\s+/g, " ").trim(),
    <>{voltar}{liga && <LinkButton href={url(ondeLigar)} className="pointer-coarse:min-h-10">Ligar {g} {nome}</LinkButton>}</>,
    dados ? "desligado-com-dados" : "desligado")
}
