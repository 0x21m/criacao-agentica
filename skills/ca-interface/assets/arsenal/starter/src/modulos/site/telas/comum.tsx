// Peças comuns das telas de transação do site (agendar, confirmação, loja, carrinho, checkout): o banner completo com o
// card da etapa sobreposto (o mesmo BannerSobreposto do Portal, para o cliente não sentir a troca, CLI-42), as etapas
// com texto (CLI-40), o campo com rótulo e o porquê (CLI-22, CLI-23), o Pix do site com o momento-assinatura do Portal
// (o QR dá lugar ao check que se desenha e ao comprovante) e os formatos.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Check, CopyIcon, RefreshCw } from "lucide-react"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ComprovantePix } from "@/components/mift/fluxos/comprovante-pix"
import { useProcessando } from "@/proto/dados"
import { EMPRESA } from "@/proto/negocio"
import { PAGAMENTO } from "@/proto/projecao"
import { mola } from "@/proto/movimento"
import { useAgora } from "@/proto/relogio"
import { copiar } from "@/lib/copiar"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import type { Lancamento } from "@/modulos/financeiro/dados"
import { bancoConfirmaPixDoSite, gerarNovoPix } from "../dados"

// ---------- URL ----------
/** Um parâmetro da URL; `undefined` até a página hidratar (no servidor não há query string): a tela mostra o esqueleto. */
export function useParametro(nome: string): string | null | undefined {
  const [v, setV] = useState<string | null | undefined>(undefined)
  useEffect(() => { setV(new URLSearchParams(location.search).get(nome)) }, [nome])
  return v
}

// ---------- formatos ----------
export const hora = (iso: string | Date) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
export const diaSemana = (iso: string | Date) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "")
export const diaHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " às")

// ---------- banner ----------
/** O banner completo das telas de transação, com o card da etapa sobreposto (64 px). */
export function BannerDaEtapa({ sobrelinha, titulo, descricao, children, largura = 720 }: { sobrelinha?: ReactNode; titulo: ReactNode; descricao?: ReactNode; children: ReactNode; largura?: number }) {
  return (
    <div className="escopo-starter">
      <BannerSobreposto variante="completa" sobrelinha={sobrelinha} titulo={titulo} descricao={descricao} sobreposicao={64}>
        <Superficie nivel="card" className="grid w-full min-w-0 gap-5 p-4 sm:p-5 md:p-6" style={{ maxWidth: largura }}>
          {children}
        </Superficie>
      </BannerSobreposto>
    </div>
  )
}

// ---------- etapas ----------
/** As etapas com número e texto (não só cor); a atual com aria-current. Concluídas viram botões para voltar (CLI-21). */
export function Etapas({ etapas, atual, aoVoltar }: { etapas: string[]; atual: number; aoVoltar?: (i: number) => void }) {
  return (
    <>
    <p className="text-sm text-muted-foreground sm:hidden">Etapa {atual + 1} de {etapas.length} · <span className="font-medium text-foreground">{etapas[atual]}</span></p>
    <ol aria-label="Etapas" className="hidden flex-wrap gap-x-1 gap-y-2 text-sm sm:flex">
      {etapas.map((e, i) => {
        const feita = i < atual
        const conteudo = (
          <>
            <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
              i === atual ? "bg-primary text-primary-foreground" : feita ? "bg-positive/15 text-positive" : "bg-muted text-muted-foreground")}>
              {feita ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(i === atual ? "font-medium" : "text-muted-foreground")}>{e}</span>
            {feita && <span className="sr-only"> (concluída)</span>}
          </>
        )
        return (
          <li key={e} aria-current={i === atual ? "step" : undefined} className="flex items-center">
            {feita && aoVoltar ? (
              <button type="button" onClick={() => aoVoltar(i)} className="inline-flex min-h-10 items-center gap-2 rounded-full pr-3 pl-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">{conteudo}</button>
            ) : (
              <span className="inline-flex min-h-10 items-center gap-2 pr-3 pl-1">{conteudo}</span>
            )}
          </li>
        )
      })}
    </ol>
    </>
  )
}

// ---------- campos ----------
/** Campo com rótulo visível, "obrigatório" ou "opcional" escrito (CLI-22), o porquê (CLI-23) e o erro embaixo. */
export function Campo({ id, rotulo, opcional, porque, erro, children, className }: { id: string; rotulo: string; opcional?: boolean; porque?: string; erro?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo} <span className="font-normal text-muted-foreground">{opcional ? "(opcional)" : "(obrigatório)"}</span>
      </label>
      {children}
      {porque && <p id={`${id}-porque`} className="text-xs text-pretty text-muted-foreground">{porque}</p>}
      {erro && <p id={`${id}-erro`} role="alert" className="text-sm text-negativo-texto">{erro}</p>}
    </div>
  )
}
export function Texto({ id, valor, aoMudar, invalido, ...resto }: { id: string; valor: string; aoMudar: (v: string) => void; invalido?: boolean } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "id">) {
  return <Input id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={invalido || undefined} className="h-11 text-base" {...resto} />
}

// ---------- Pix ----------
/** QR de exemplo desenhado a partir do código (nenhum banco o lê). Fundo claro nos dois temas. */
// BASE: o QrPix do Financeiro não é exportado; é a mesma regra de desenho que o Portal copiou.
function QrDoPix({ codigo, rotulo }: { codigo: string; rotulo: string }) {
  const N = 29
  const celulas = useMemo(() => {
    let h = 2166136261
    const bits: boolean[] = []
    for (let i = 0; i < N * N; i++) { h = Math.imul(h ^ codigo.charCodeAt(i % codigo.length) ^ i, 16777619) >>> 0; bits.push((h & 3) === 0 || (h & 7) === 5) }
    return bits
  }, [codigo])
  const olho = (x: number, y: number) => (x < 8 && y < 8 ? [x, y] : x >= N - 8 && y < 8 ? [x - (N - 8), y] : x < 8 && y >= N - 8 ? [x, y - (N - 8)] : null)
  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} className="size-44 shrink-0 rounded-xl bg-white shadow-[0_0_0_1px_var(--sup-aro)] md:size-52" role="img" aria-label={rotulo}>
      {celulas.map((on, i) => {
        const x = i % N, y = Math.floor(i / N)
        const o = olho(x, y)
        const preto = o ? (o[0] === 7 || o[1] === 7 ? false : o[0] === 0 || o[0] === 6 || o[1] === 0 || o[1] === 6 || (o[0] >= 2 && o[0] <= 4 && o[1] >= 2 && o[1] <= 4)) : on
        return preto ? <rect key={i} x={x} y={y} width="1.02" height="1.02" fill="#111" /> : null
      })}
    </svg>
  )
}

/** Segundos até o "banco" confirmar sozinho no protótipo (passo 7 da jornada: "barra F ou 6 s"). */
const AUTO_CONFIRMA = 6000

/**
 * O pagamento por Pix de um título do site: valor, recebedor, QR, Pix Copia e Cola e "Pague até"; expirado, "Gerar
 * novo código"; pago, o check que se desenha e o comprovante. O "banco" confirma sozinho em 6 s (ou pela barra F).
 */
export function PixDoSite({ l, nome, depois }: { l: Lancamento; nome: string; depois?: ReactNode }) {
  const agora = useAgora()
  const reduzido = useReducedMotion()
  const ocupado = useProcessando().has(l.id)
  const [erro, setErro] = useState<string | null>(null)
  const pagoNaChegada = useRef(l.estado === "pago").current
  const expirado = l.estado === "aguardando_pix" && !!l.pixExpiraEm && new Date(l.pixExpiraEm) <= agora
  const aberto = l.estado === "aguardando_pix" && !expirado
  useEffect(() => {
    if (!aberto) return
    const t = setTimeout(() => bancoConfirmaPixDoSite(l.id), AUTO_CONFIRMA)
    return () => clearTimeout(t)
  }, [aberto, l.id, l.pixCodigo])
  const gerar = async () => { setErro(null); const r = await gerarNovoPix(l.id); if (!r.ok) setErro(r.mensagem) }

  const cabeca = (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="grid gap-1">
        <p className="t-rotulo">Valor</p>
        <p className="t-kpi num" aria-live="polite">{l.estado === "pago" ? <span className="text-positive">Pago</span> : moeda(l.valor)}</p>
      </div>
      <dl className="grid min-w-0 gap-0.5 text-sm md:text-right">
        <dt className="t-rotulo">Para</dt>
        <dd className="text-pretty">{EMPRESA.razao}</dd>
        <dd className="num text-muted-foreground">CNPJ {EMPRESA.cnpj}</dd>
      </dl>
    </div>
  )

  if (l.estado === "pago") {
    const anima = !pagoNaChegada && !reduzido
    const iniciais = nome.split(" ").map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(" ")
    return (
      <div className="grid gap-5">
        {cabeca}
        <div role="status" className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" className="size-12 shrink-0 text-positive" aria-hidden="true">
            <motion.circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" initial={anima ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} />
            <motion.path d="M14 24.5 21 31 34 17" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              initial={anima ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: anima ? 0.4 : 0, ease: [0.23, 1, 0.32, 1] }} />
          </svg>
          <div className="grid gap-0.5 text-sm">
            <FraseDoCliente p={PAGAMENTO.pago} ctx={{ quando: l.pagoEm }} acao={<span />} className="text-base font-medium" />
            {l.pagoEm && <p className="text-muted-foreground"><span className="num">{diaHora(l.pagoEm)}</span> · Pix</p>}
          </div>
        </div>
        <motion.div initial={anima ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ ...mola.macia, delay: anima ? 0.7 : 0 }}>
          <ComprovantePix titulo="Pagamento por Pix" valor={Math.round(l.valor * 100)} quando={diaHora(l.pagoEm ?? l.vencimento)}
            de={{ nome: iniciais, instituicao: "Seu banco" }}
            para={{ nome: EMPRESA.razao, documento: EMPRESA.cnpj, instituicao: "Banco da Oficina Norte", chave: EMPRESA.pix }}
            idE2E={l.comprovanteId} linhas={[{ rotulo: "Referência", valor: l.ref ?? l.id }]} nota="Comprovante de exemplo · nenhum dinheiro saiu" className="max-w-none" />
        </motion.div>
        {depois}
      </div>
    )
  }

  if (expirado) {
    return (
      <div className="grid gap-4">
        {cabeca}
        <div role="status" className="grid gap-3 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--negative)_10%,transparent)] p-4">
          <p className="text-sm font-medium text-pretty">O código Pix expirou às <span className="num">{hora(l.pixExpiraEm!)}</span>. Gere um novo para pagar.</p>
          <Button className="h-10 justify-self-start" isPending={ocupado} onPress={() => void gerar()}><RefreshCw /> {ocupado ? "Gerando…" : "Gerar novo código"}</Button>
          {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
        </div>
      </div>
    )
  }

  const faltam = Math.min(EMPRESA.pixMinutos, Math.max(1, Math.ceil((new Date(l.pixExpiraEm!).getTime() - agora.getTime()) / 60000)))
  return (
    <div className="grid gap-4">
      {cabeca}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <QrDoPix codigo={l.pixCodigo ?? l.id} rotulo={`QR Code do Pix de ${moeda(l.valor)} (exemplo)`} />
        <div className="grid min-w-0 flex-1 gap-1 text-center text-sm sm:text-left">
          <p className="text-base font-medium">Pague até <span className="num">{hora(l.pixExpiraEm!)}</span></p>
          <p className="text-muted-foreground"><span className="num">{faltam}</span> {faltam === 1 ? "minuto" : "minutos"} para expirar</p>
          <p className="text-pretty text-muted-foreground">A tela muda sozinha quando o banco confirmar.</p>
        </div>
      </div>
      <div className="grid gap-1.5">
        <p className="t-rotulo">Pix Copia e Cola</p>
        <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] py-1 pr-1 pl-3">
          <span className="num min-w-0 flex-1 truncate text-xs" title={l.pixCodigo}>{l.pixCodigo}</span>
          <Button variant="outline" className="h-10 shrink-0" onPress={() => void copiar(l.pixCodigo ?? "", "Pix Copia e Cola copiado")}><CopyIcon /> Copiar</Button>
        </div>
      </div>
    </div>
  )
}
