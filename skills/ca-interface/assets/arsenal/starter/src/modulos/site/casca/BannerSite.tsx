// Banner das páginas internas do site: o BannerSobreposto do starter (o mesmo do portal, spec 5.12 e 5.13) com um
// card do material Superficie avançando sobre ele. É o elo visual site -> agendamento -> portal (CLI-42): quem sai do
// site para o portal vê o mesmo banner e o mesmo card.
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"

export type FatoBanner = { rotulo: string; valor: string }
export type AcaoBanner = { rotulo: string; href: string; secundaria?: { rotulo: string; href: string } }

export default function BannerSite({
  sobrelinha,
  titulo,
  descricao,
  fatos,
  acao,
  nota,
}: {
  sobrelinha?: string
  titulo: string
  descricao?: string
  fatos?: FatoBanner[]
  acao?: AcaoBanner
  nota?: string
}) {
  const temCard = (fatos && fatos.length > 0) || acao
  return (
    <div className="escopo-starter">
      <BannerSobreposto variante="completa" sobrelinha={sobrelinha} titulo={titulo} descricao={descricao} sobreposicao={64}>
        {temCard && (
          <Superficie nivel="card" como="div" className="cartao-acao">
            {fatos && fatos.length > 0 && (
              <dl>
                {fatos.map((f) => (
                  <div key={f.rotulo}>
                    <dt>{f.rotulo}</dt>
                    <dd>{f.valor}</dd>
                  </div>
                ))}
              </dl>
            )}
            {acao && (
              <div className="btn-row">
                <a className="btn btn--primary" href={acao.href}>{acao.rotulo}</a>
                {acao.secundaria && <a className="btn btn--secondary" href={acao.secundaria.href}>{acao.secundaria.rotulo}</a>}
              </div>
            )}
            {nota && <p className="text-sm text-muted-foreground">{nota}</p>}
          </Superficie>
        )}
      </BannerSobreposto>
    </div>
  )
}
