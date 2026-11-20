// Módulo Configurações (5.11) · /configuracoes/integracoes/: WhatsApp, gateway Pix, e-mail e nota fiscal em cartões
// com o estado (Conectado · Desligado · Erro). Tudo simulado: nenhuma chave ou token real, a conta é um texto de
// exemplo. "Testar conexão", "Reconectar" e ligar ou desligar são pessimistas; o resultado fica no cartão. O gateway
// Pix é integração de pagamento: só o dono mexe (a gestora vê).
import { useState } from "react"
import { CircleCheck, CircleX, Mail, MessageCircle, PlugZap, QrCode, ReceiptText, RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { SeloEixo } from "@/components/base/selos"
import { Cortado } from "@/components/base/texto"
import { Superficie } from "@/components/sistema/Superficie"
import { useProcessando } from "@/proto/dados"
import { aQuemPedir, pode, usePapel } from "@/proto/permissoes"
import { cn } from "@/lib/utils"
import { ESTADO_INTEGRACAO, INTEGRACAO, capacidadeDa, fraseDoErro, oNome, integracoes, ligarIntegracao, reconectar, testarConexao, type IdIntegracao, type Integracao } from "../dados"
import { CascaConfig } from "./comum"

const ICONE: Record<IdIntegracao, typeof Mail> = { whatsapp: MessageCircle, pix: QrCode, email: Mail, nfe: ReceiptText }

export default function Integracoes() {
  const lista = integracoes.use()
  const ligadas = lista.filter((i) => i.estado !== "desligado").length
  return (
    <CascaConfig secao="integracoes" titulo="Integrações" descricao={<>Serviços ligados à oficina <span className="num whitespace-nowrap text-muted-foreground">· {ligadas} de {lista.length} ligadas</span></>}>
      <ComDados capacidade="configuracoes_empresa" area="da gestão" rotulo="as integrações" estaVazio={!lista.length}
        esqueleto={<div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((n) => <Esqueleto key={n} className="h-64" />)}</div>}
        vazio={<EstadoVazio icone={PlugZap} titulo="Nenhuma integração" texto="Restaure os dados de exemplo em Configurações." />}>
        <ul className="grid gap-4 md:grid-cols-2">
          {lista.map((i) => <li key={i.id} id={i.id} className="grid scroll-mt-[calc(var(--topo)+var(--faixa-fixa)+1rem)]"><Cartao i={i} /></li>)}
        </ul>
        <p className="text-sm text-pretty text-muted-foreground">Protótipo: as conexões são simuladas e nenhuma chave real fica guardada aqui.</p>
      </ComDados>
    </CascaConfig>
  )
}

function Cartao({ i }: { i: Integracao }) {
  const papel = usePapel()
  const mexe = pode(papel, capacidadeDa(i))
  const info = INTEGRACAO[i.id]
  const Icone = ICONE[i.id]
  const processando = useProcessando().has(i.id)
  const [fazendo, setFazendo] = useState<"testar" | "reconectar" | null>(null)
  const [falha, setFalha] = useState<string | null>(null)
  const [trocar, setTrocar] = useState(false)
  const ocupado = processando || !!fazendo
  async function rodar(qual: "testar" | "reconectar") {
    setFalha(null)
    setFazendo(qual)
    const r = await (qual === "testar" ? testarConexao(i) : reconectar(i))
    setFazendo(null)
    if (!r.ok) setFalha(r.mensagem)
  }
  const ligada = i.estado !== "desligado"
  return (
    <Superficie como="article" aria-labelledby={`int-${i.id}`} tom={i.estado === "erro" ? "perigo" : undefined} className="grid h-full content-start gap-4 p-4 md:p-6">
      <header className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[calc(var(--radius)*0.9)] bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)]"><Icone className="size-5" /></span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id={`int-${i.id}`} className="t-card truncate">{info.nome}</h2>
          <SeloEixo p={ESTADO_INTEGRACAO[i.estado]} ctx={{ desde: i.desde }} detalhe />
        </div>
        <Switch aria-label={ligada ? `Desligar ${info.nome}` : `Ligar ${info.nome}`} isSelected={ligada} isDisabled={!mexe || ocupado} onChange={() => setTrocar(true)} />
      </header>
      <p className="text-sm text-pretty text-muted-foreground">{info.papel}</p>
      <dl className="grid gap-0.5">
        <dt className="text-xs text-muted-foreground">Conta de exemplo</dt>
        <dd className="text-sm"><Cortado texto={i.conta} className="block" /></dd>
      </dl>

      {i.estado === "erro" && (
        <div role="alert" className="flex gap-2.5 rounded-[calc(var(--radius)*0.9)] bg-[color-mix(in_oklch,var(--destructive)_10%,transparent)] px-3 py-2.5 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-pretty">{fraseDoErro(i)}</p>
        </div>
      )}
      {i.teste && !(i.estado === "erro" && i.teste.ok) && (
        <p role="status" className={cn("flex gap-2 text-sm text-pretty", i.teste.ok ? "text-foreground" : "text-destructive")}>
          {i.teste.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" /> : <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {i.teste.texto}
        </p>
      )}
      {falha && <p role="alert" className="text-sm text-pretty text-destructive">{falha}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {!mexe ? (
          <p className="text-sm text-pretty text-muted-foreground">Só o dono mexe {i.id === "nfe" ? "na" : "no"} {info.nome}. Peça a {aQuemPedir(papel)}.</p>
        ) : !ligada ? (
          <p className="text-sm text-muted-foreground">{ESTADO_INTEGRACAO.desligado.rotulo}. {info.queda}</p>
        ) : (
          <>
            <Button variant="outline" isDisabled={ocupado} onPress={() => rodar("testar")} className="min-w-36 pointer-coarse:min-h-10">
              {fazendo === "testar" ? "Testando…" : "Testar conexão"}
            </Button>
            {i.estado === "erro" && (
              <Button isDisabled={ocupado} onPress={() => rodar("reconectar")} className="min-w-32 pointer-coarse:min-h-10">
                <RefreshCw /> {fazendo === "reconectar" ? "Reconectando…" : "Reconectar"}
              </Button>
            )}
          </>
        )}
      </div>

      <DialogoConfirmar aberto={trocar} aoFechar={() => setTrocar(false)} perigo={ligada}
        titulo={ligada ? `Desligar ${oNome(i.id)}?` : `Ligar ${oNome(i.id)}?`}
        descricao={ligada ? `${info.queda} Vale para a equipe toda.` : `${info.papel} Vale para a equipe toda, com a conta de exemplo.`}
        voltar={ligada ? `Manter ligad${info.g}` : "Voltar"} confirmar={ligada ? "Desligar" : "Ligar"}
        aoConfirmar={() => ligarIntegracao(i, !ligada)} />
    </Superficie>
  )
}
