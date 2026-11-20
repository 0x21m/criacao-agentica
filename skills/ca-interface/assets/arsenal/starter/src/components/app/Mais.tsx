// Tela "Mais" (abas do celular): a navegação inteira do papel ativo, em grupos por módulo, mais a conta.
import { ChevronRight } from "lucide-react"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"
import { achatar, modulosVisiveis, navDoModulo, useSituacoesDosModulos } from "@/modulos/registro"
import { usePapel, usePessoa, nomeDoPapel } from "@/proto/permissoes"
import { url } from "@/lib/url"

export default function Mais() {
  const papel = usePapel()
  const eu = usePessoa()
  const grupos = modulosVisiveis(useSituacoesDosModulos()).map((m) => ({ m, itens: achatar(navDoModulo(m, papel)) })).filter((g) => g.itens.length)
  return (
    <div className="pb-6">
      <BannerSobreposto variante="compacta" titulo="Mais" descricao={`${eu.nome} · ${nomeDoPapel(papel)}`} sobreposicao={40}>
        <div className="mx-auto grid max-w-2xl gap-4">
          {grupos.map(({ m, itens }) => (
            <Superficie key={m.id} como="section" aria-label={m.nome} className="p-1.5">
              <ul>
                {itens.map((i) => (
                  <li key={i.caminho}>
                    <a href={url(i.caminho)} className="flex min-h-12 items-center gap-3 rounded-[calc(var(--radius)*0.9)] px-3 text-sm outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-ring">
                      <i.icone className="size-[1.0625rem] text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{i.rotulo}</span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </Superficie>
          ))}
        </div>
      </BannerSobreposto>
    </div>
  )
}
