// Módulo Configurações (5.11) · /configuracoes/modulos/: ligar e desligar os módulos opcionais (Estoque, Loja online).
// Desligar é pessimista e pede confirmação: vale para a equipe toda. Desligado, o módulo some da navegação, do Ctrl K e
// do sino, e quem entra numa rota dele vê o estado de região do EST-47 (registro: `ativo(id)` e o guarda do AppShell).
import { useState } from "react"
import { Blocks, Eye, Package, ShoppingBag } from "lucide-react"
import { LinkButton } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { SeloEixo } from "@/components/base/selos"
import { Superficie } from "@/components/sistema/Superficie"
import { useProcessando } from "@/proto/dados"
import { usePode } from "@/proto/permissoes"
import { formatosDaProjecao } from "@/proto/projecao"
import { url } from "@/lib/url"
import { ESTADO_MODULO, OPCIONAL, ligarModulo, useModulosOpcionais, type IdOpcional, type ModuloOpcional } from "../dados"
import { CascaConfig } from "./comum"

const ICONE: Record<IdOpcional, typeof Package> = { estoque: Package, loja: ShoppingBag }
const { d, h } = formatosDaProjecao

export default function Modulos() {
  const lista = useModulosOpcionais()
  const ligados = lista.filter((m) => m.situacao !== "desligado").length
  return (
    <CascaConfig secao="modulos" titulo="Módulos" descricao={<>Partes do sistema que a oficina pode desligar <span className="num whitespace-nowrap text-muted-foreground">· {ligados} de {lista.length} ligados</span></>}>
      <ComDados capacidade="configuracoes_empresa" area="da gestão" rotulo="os módulos" estaVazio={!lista.length}
        esqueleto={<div className="grid gap-4"><Esqueleto className="h-52" /><Esqueleto className="h-52" /></div>}
        vazio={<EstadoVazio icone={Blocks} titulo="Nenhum módulo opcional" texto="Restaure os dados de exemplo em Configurações." />}>
        <ul className="grid gap-4">
          {lista.map((m) => <li key={m.id} id={m.id} className="grid scroll-mt-[calc(var(--topo)+var(--faixa-fixa)+1rem)]"><Cartao m={m} /></li>)}
        </ul>
        <p className="text-sm text-pretty text-muted-foreground">Pedidos, Agenda, Clientes, Financeiro e Mensagens são o núcleo e ficam sempre ligados.</p>
      </ComDados>
    </CascaConfig>
  )
}

function Cartao({ m }: { m: ModuloOpcional }) {
  const info = OPCIONAL[m.id]
  const Icone = ICONE[m.id]
  const g = m.id === "loja" ? "a" : "o"
  const mexe = usePode("configuracoes_empresa")
  const ocupado = useProcessando().has(m.id)
  const [trocar, setTrocar] = useState(false)
  const ligado = m.situacao !== "desligado"
  return (
    <Superficie como="article" aria-labelledby={`mod-${m.id}`} tom={m.situacao === "fora_do_ar" ? "perigo" : undefined} className="grid gap-4 p-4 md:p-6">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[calc(var(--radius)*0.9)] bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)]"><Icone className="size-5" /></span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id={`mod-${m.id}`} className="t-card truncate">{info.nome}</h2>
          <SeloEixo p={ESTADO_MODULO[m.situacao]} ctx={{ desde: m.desde }} detalhe />
        </div>
        <Switch aria-label={ligado ? `Desligar ${g} ${info.nome}` : `Ligar ${g} ${info.nome}`} isSelected={ligado} isDisabled={!mexe || ocupado} onChange={() => setTrocar(true)} />
      </header>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Ao desligar</dt><dd className="text-pretty">{info.some}</dd></div>
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Os dados</dt><dd className="text-pretty">{info.dados}</dd></div>
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Quem depende</dt><dd className="text-pretty">{info.depende}</dd></div>
      </dl>
      {m.situacao !== "ligado" && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pt-4">
          <p className="min-w-0 flex-1 basis-60 text-sm text-pretty text-muted-foreground">
            {m.situacao === "fora_do_ar"
              ? `Fora do ar desde ${h(m.desde)}. Quem abre o módulo vê o aviso e o resto do sistema segue normal.`
              : `${m.id === "loja" ? "Desligada" : "Desligado"} por ${m.quem} em ${d(m.desde)} às ${h(m.desde)}.`}
          </p>
          <LinkButton variant="outline" size="sm" href={url(`configuracoes/indisponivel/?modulo=${m.id}`)} className="pointer-coarse:min-h-10"><Eye /> Ver como a equipe vê</LinkButton>
        </div>
      )}
      <DialogoConfirmar aberto={trocar} aoFechar={() => setTrocar(false)} perigo={ligado}
        titulo={ligado ? `Desligar ${g} ${info.nome} para a equipe?` : `Ligar ${g} ${info.nome} de novo?`}
        descricao={ligado ? `${info.some} ${info.dados} Dá para religar a qualquer hora.` : `${info.nome} volta para a navegação, o Ctrl K e o sino de todo mundo.`}
        voltar={ligado ? `Manter ${m.id === "loja" ? "ligada" : "ligado"}` : "Voltar"} confirmar={ligado ? "Desligar" : "Ligar"}
        aoConfirmar={() => ligarModulo(m, !ligado)} />
    </Superficie>
  )
}
