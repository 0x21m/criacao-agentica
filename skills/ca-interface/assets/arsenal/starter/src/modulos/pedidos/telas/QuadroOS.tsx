// Módulo Pedidos · vista "quadro" (5.3, /pedidos/?vista=quadro): o QuadroInterativo ligado às ordens de serviço.
// Transplantado do laboratório da fase 3 (sb-interativos). Movimentos de classe O gravam na hora com Desfazer (toast de
// 8 s). Soltar em "Agendadas", "Aguardando cliente" ou "Prontas" não move: abre a sheet da ação (agendar, enviar
// orçamento, concluir), que roda em modo PESSIMISTA (D1): nada muda até a resposta, o botão diz "Enviando…" e a falha
// aparece dentro da sheet e no toast. Soltar em "Aguardando peça" abre o diálogo com o motivo (qual peça, observação),
// também pessimista: cancelar deixa o cartão onde estava. Alvo inválido apaga a coluna com o motivo e não muda nada.
// Carregado sob demanda (React.lazy em Pedidos.tsx): o @dnd-kit só baixa quando alguém abre o quadro.
import { useMemo, useState, type ReactNode } from "react"
import { CalendarClock, Users } from "lucide-react"
import { moeda, dataCurta } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { usePendentes, useProcessando } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { RECURSOS, recursoPorId } from "@/proto/negocio"
import { clientes, nomeCliente } from "@/modulos/clientes/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { compras } from "@/modulos/estoque/dados"
import {
  COLUNAS_OS, aguardarPeca, atrasado, previsaoDaPeca, colunaDaEtapa, criarOSRapida, movimentoOS, moverOS, ordemEntre, pedidos, renomearOS,
  type ColunaOS, type Pedido as OS,
} from "../dados"
import { SheetAcaoOS, type AcaoOS } from "./AcoesOS"
import { QuadroInterativo, type ColunaQuadro } from "@/components/interativos/QuadroInterativo"


export default function QuadroOS({ lista }: { lista?: OS[] }) {
  const todas = pedidos.use()
  const cli = clientes.use()
  const pendentes = usePendentes()
  const processando = useProcessando()
  // marcados no quadro: com mudança otimista a caminho ou com ação pessimista esperando resposta
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  const [tecnico, setTecnico] = useState<string>("todos")
  const [confirmar, setConfirmar] = useState<AcaoOS>(null)
  const [peca, setPeca] = useState<{ os: OS; ordem: number } | null>(null)

  const colunas: ColunaQuadro[] = useMemo(() => COLUNAS_OS.map((c) => ({
    id: c.id, titulo: c.titulo, limite: c.limite, vazio: `Nenhuma OS em ${c.titulo}.`,
    adicionar: c.id === "novas" ? {
      rotulo: "Adicionar OS", placeholder: "Título da OS", rotuloOpcoes: "Cliente",
      opcoes: cli.filter((x) => x.estado !== "anonimizado").map((x) => ({ id: x.id, rotulo: x.nome })),
      aoCriar: (titulo: string, cliente?: string) => { criarOSRapida(titulo, cliente ?? "C-0007") },
    } : undefined,
  })), [cli])

  const itens = useMemo(() => {
    const ordemCol = new Map(COLUNAS_OS.map((c, i) => [c.id, i]))
    return (lista ?? todas)
      .filter((o) => colunaDaEtapa(o.etapa))
      .filter((o) => tecnico === "todos" || (tecnico === "nenhum" ? !o.responsavelId : o.responsavelId === tecnico))
      .sort((a, b) => ordemCol.get(colunaDaEtapa(a.etapa)!)! - ordemCol.get(colunaDaEtapa(b.etapa)!)! || a.ordem - b.ordem)
  }, [lista, todas, tecnico])

  const titulo = (c: string) => COLUNAS_OS.find((x) => x.id === c)?.titulo ?? c

  return (
    <>
      <div role="group" aria-label="Filtrar por técnico" className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-3 [scrollbar-width:none]">
        <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {[{ id: "todos", curto: "Todos" }, ...RECURSOS.filter((r) => r.id !== "bancada-pampulha"), { id: "nenhum", curto: "Sem técnico" }].map((r) => (
          <button key={r.id} type="button" aria-pressed={tecnico === r.id} onClick={() => setTecnico(r.id)}
            className="h-8 shrink-0 rounded-full px-3 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10 bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] aria-pressed:bg-[color-mix(in_oklch,var(--foreground)_15%,transparent)] aria-pressed:font-semibold aria-pressed:text-foreground">
            {r.curto}
          </button>
        ))}
      </div>
      <div>
          <QuadroInterativo<OS>
            rotulo="Quadro de OS"
            chave="os"
            colunas={colunas}
            itens={itens}
            idDe={(o) => o.id}
            colunaDe={(o) => colunaDaEtapa(o.etapa)!}
            tituloDe={(o) => o.titulo}
            validar={(o, c) => { const m = movimentoOS(o, c as ColunaOS); return m.tipo === "invalido" ? m.motivo : null }}
            aoSoltar={(o, c, viz, idx) => {
              const m = movimentoOS(o, c as ColunaOS)
              if (m.tipo === "direto") {
                void moverOS(o.id, m.etapa, ordemEntre(viz.antes?.ordem, viz.depois?.ordem))
                return `${o.id} movida para ${titulo(c)}, posição ${idx + 1}.`
              }
              if (m.tipo === "invalido") return m.motivo
              if (m.tipo === "peca") {
                setPeca({ os: o, ordem: ordemEntre(viz.antes?.ordem, viz.depois?.ordem) })
                return `Abrindo o motivo da espera de peça da ${o.id}. O cartão só muda de coluna depois da confirmação.`
              }
              setConfirmar({ tipo: m.tipo, os: o })
              const acao = { agendar: "o agendamento da visita", orcamento: "o envio do orçamento", concluir: "a conclusão" }[m.tipo]
              return `Abrindo ${acao} da ${o.id}. O cartão só muda de coluna depois da confirmação.`
            }}
            aoRenomear={(o, t) => void renomearOS(o.id, t)}
            pendentes={marcados}
            renderCartao={(o, { titulo }) => <CorpoCartao os={o} titulo={titulo} />}
          />
      </div>
      <SheetAcaoOS c={confirmar} onFechar={() => setConfirmar(null)} />
      <DialogoConfirmar
        aberto={!!peca}
        aoFechar={() => setPeca(null)}
        titulo={peca ? `${peca.os.id} aguardando peça` : ""}
        descricao={peca ? <>A OS sai de Em execução e o cliente vê “Aguardando uma peça”. Diga qual peça falta e o que combinar.</> : null}
        confirmar="Mover para Aguardando peça"
        voltar="Manter em execução"
        motivo="Qual peça e observação"
        aoConfirmar={(motivo) => (peca ? aguardarPeca(peca.os.id, motivo, peca.ordem) : undefined)}
      />
    </>
  )
}

const iniciais = (nome?: string) => (nome ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("")

function CorpoCartao({ os, titulo }: { os: OS; titulo: ReactNode }) {
  const ags = agendamentos.use()
  const cmps = compras.use()
  const agora = useAgora()
  const atrasada = (o: OS) => atrasado(o, agora)
  const tec = recursoPorId(os.responsavelId)
  const ag = ags.find((a) => os.agendamentoIds.includes(a.id))
  const detalhe =
    os.etapa === "aprovada" ? <Selo tom="positivo">Aprovada · aguarda início</Selo>
    : os.etapa === "aguardando_aprovacao" && os.orcamento?.validoAte ? <Selo tom="alerta">v{os.orcamento.versao} · vence {dataCurta(os.orcamento.validoAte)}</Selo>
    : os.etapa === "aguardando_peca" ? <Selo tom="alerta">Peça chega {dataCurta(previsaoDaPeca(os, cmps).previsao)}</Selo>
    : os.etapa === "pronta" ? <Selo tom="positivo">A cobrar</Selo>
    : os.etapa === "agendada" && ag ? <Selo tom="azul">{new Date(ag.inicio).toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</Selo>
    : os.orcamento?.estado === "rascunho" ? <Selo tom="neutro">Orçamento em rascunho</Selo>
    : null
  return (
    <div className="grid gap-1.5 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <span className="num shrink-0 font-semibold text-muted-foreground">{os.id}</span>
        {detalhe}
        {atrasada(os) && <Selo tom="perigo" className="ml-auto">Atrasada</Selo>}
      </div>
      {titulo}
      <span className="truncate text-xs text-muted-foreground" title={nomeCliente(os.clienteId)}>{nomeCliente(os.clienteId)}</span>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className={cn("inline-flex shrink-0 items-center gap-1", atrasada(os) && "text-negativo-texto")}>
          <CalendarClock className="size-3" aria-hidden="true" /> <span className="num">{dataCurta(os.prazo)}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="num truncate font-medium text-foreground">{os.total ? moeda(os.total) : "Sob orçamento"}</span>
          <span title={tec?.nome ?? "Sem técnico"} aria-label={tec ? `Técnico: ${tec.nome}` : "Sem técnico"}
            className="grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklch,var(--foreground)_10%,transparent)] text-[10px] font-semibold text-foreground">
            {tec ? iniciais(tec.nome) : "–"}
          </span>
        </span>
      </div>
    </div>
  )
}

function Selo({ tom, className, children }: { tom: "positivo" | "alerta" | "azul" | "perigo" | "neutro"; className?: string; children: ReactNode }) {
  const t = {
    positivo: "bg-positive/14 text-[color-mix(in_oklch,var(--positive)_80%,var(--foreground))]",
    alerta: "bg-alerta/18 text-alerta-texto",
    azul: "bg-[color-mix(in_oklch,var(--primary)_16%,transparent)] text-foreground",
    perigo: "bg-negative/14 text-negativo-texto",
    neutro: "bg-[color-mix(in_oklch,var(--foreground)_8%,transparent)] text-muted-foreground",
  }[tom]
  return <span className={cn("inline-flex min-w-0 items-center truncate rounded-full px-1.5 text-[11px] leading-[18px] font-medium", t, className)}>{children}</span>
}

