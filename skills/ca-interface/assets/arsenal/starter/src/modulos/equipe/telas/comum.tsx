// Peças comuns das três telas do módulo Equipe: o cabeçalho com a troca entre Pessoas, Permissões e Auditoria
// (segmentado de vidro do CabecalhoPagina, que navega), o avatar com as iniciais e o "último acesso" curto.
import type { ReactNode } from "react"
import { Avatar } from "@/components/ui/avatar"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { VidroLiquido } from "@/colecao/vidro-liquido"
import { pode, usePapel, type Papel } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"

const TELAS = [
  { id: "pessoas", rotulo: "Pessoas", caminho: "equipe/" },
  { id: "permissoes", rotulo: "Permissões", caminho: "equipe/permissoes/" },
  { id: "auditoria", rotulo: "Auditoria", caminho: "equipe/auditoria/" },
] as const
type Tela = (typeof TELAS)[number]["id"]

/** Quais das três telas o papel abre (a troca só aparece com 2 ou mais). */
export function telasDoPapel(papel: Papel): Tela[] {
  return TELAS.filter((t) => (t.id === "auditoria" ? pode(papel, "auditoria") : pode(papel, "equipe_ver"))).map((t) => t.id)
}

export function CabecalhoEquipe({ tela, titulo, descricao, contagem, acoes, children }: {
  tela: Tela; titulo: string; descricao: string; contagem?: ReactNode; acoes?: ReactNode; children?: ReactNode
}) {
  const papel = usePapel()
  const abre = telasDoPapel(papel)
  const vistas = TELAS.filter((t) => abre.includes(t.id) || t.id === tela).map(({ id, rotulo }) => ({ id, rotulo }))
  // a troca entre as 3 telas são LINKS (são páginas, não vistas) no mesmo vidro e na mesma gota do segmentado do cabeçalho
  return (
    <CabecalhoPagina
      titulo={titulo}
      descricao={contagem === undefined ? descricao : (
        // a contagem fica colada à descrição e nunca começa uma linha com "·"
        <span className="text-pretty">{descricao} <span className="num whitespace-nowrap text-muted-foreground max-sm:block" aria-live="polite"><span className="max-sm:hidden">· </span>{contagem}</span></span>
      )}
      acoes={(vistas.length > 1 || acoes) && (
        <>
          {vistas.length > 1 && (
            <nav aria-label="Telas da equipe" className="w-full shrink-0 sm:w-[19.5rem]">
              <VidroLiquido raio="pilula" material="regular" espessura={0.8} semRefracao className="w-full p-1">
                <ul className="grid auto-cols-fr grid-flow-col gap-0.5">
                  {vistas.map((v) => (
                    <li key={v.id} className="flex min-w-0">
                      <a href={url(TELAS.find((t) => t.id === v.id)!.caminho)} aria-current={v.id === tela ? "page" : undefined}
                        title={v.rotulo}
                        className={cn("flex min-h-10 w-full min-w-0 items-center justify-center rounded-full px-1.5 text-sm font-semibold whitespace-nowrap text-foreground outline-none transition-[background-color,scale] duration-150 focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.96] motion-reduce:active:scale-100",
                          v.id === tela
                            ? "bg-[light-dark(var(--card),color-mix(in_oklch,var(--foreground)_24%,var(--background)))] shadow-[0_1px_3px_color-mix(in_oklch,black_14%,transparent),inset_0_0_0_0.5px_color-mix(in_oklch,var(--foreground)_10%,transparent)]"
                            : "hover:bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)]")}>
                        <span className="truncate">{v.rotulo}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </VidroLiquido>
            </nav>
          )}
          {acoes}
        </>
      )}
    >
      {children}
    </CabecalhoPagina>
  )
}

export const iniciais = (nome: string) => nome.split(" ").filter((x) => /^\p{L}/u.test(x)).map((x) => x[0]).slice(0, 2).join("").toUpperCase()

/** Avatar com as iniciais (o avatar do arsenal, sem foto: o protótipo não tem imagem de pessoa). */
export function AvatarPessoa({ nome, apagado, className }: { nome: string; apagado?: boolean; className?: string }) {
  return (
    <Avatar aria-hidden="true" className={cn("grid place-items-center text-[0.7rem] font-semibold", apagado ? "bg-muted text-muted-foreground" : "bg-[color-mix(in_oklch,var(--primary)_16%,transparent)] text-foreground", className)}>
      {iniciais(nome) || "?"}
    </Avatar>
  )
}

const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const dia = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
const chave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** "hoje, 09:38" · "ontem, 17:12" · "12/11, 08:05" (o "agora" vem do relógio do protótipo). */
export function quandoCurto(iso: string | undefined, agora: Date) {
  if (!iso) return "—"
  const d = new Date(iso)
  const ontem = new Date(agora.getTime() - 864e5)
  if (chave(d) === chave(agora)) return `hoje, ${hora(d)}`
  if (chave(d) === chave(ontem)) return `ontem, ${hora(d)}`
  return `${dia(d)}, ${hora(d)}`
}
