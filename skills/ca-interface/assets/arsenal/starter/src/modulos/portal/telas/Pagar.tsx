// /portal/pagar/?id=LAN-5021 · pagar (5.12). Valor, recebedor (Oficina Norte e CNPJ) e o meio no segmentado de vidro:
// Pix (QR, Pix Copia e Cola e "Pague até 10:11"; expirado: "Gerar novo código" e "Pagar com cartão"), cartão (parcelas
// com valor e total) e boleto (linha digitável). Tudo P. Momento-assinatura: o Pix que se confirma sozinho. Quando o
// banco confirma (sozinho em 6 s, pela barra F ou pelo Financeiro na outra aba), o QR dá lugar a um check que se desenha, o valor rola até
// "Pago" e o comprovante (comprovante-pix do arsenal) aparece. Com movimento reduzido, a troca é direta.
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CopyIcon, CreditCard, FileText, QrCode, RefreshCw } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Superficie } from "@/components/sistema/Superficie"
import { FraseDoCliente } from "@/components/base/selos"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { ComprovantePix } from "@/components/mift/fluxos/comprovante-pix"
import { useProcessando } from "@/proto/dados"
import { EMPRESA } from "@/proto/negocio"
import { PIX_EXPIRADO } from "@/proto/projecao"
import { mola } from "@/proto/movimento"
import { useAgora } from "@/proto/relogio"
import { copiar } from "@/lib/copiar"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { FRASES, bancoConfirmaPix, buscarCobranca, gerarBoleto, gerarPixDoCliente, pagarNoCartao, useDadosDoCliente, type CobrancaCliente, type DadosDoCliente } from "../dados"
import { BannerCliente, ComDadosCliente, EsqueletoCliente, NaoAchado, OutraConta, diaHora, hora, ir, useParametro } from "./comum"

type Meio = "pix" | "cartao" | "boleto"
/** Ms até o "banco" confirmar sozinho no protótipo: os mesmos 6 s do Pix do site (site/telas/comum.tsx, AUTO_CONFIRMA). */
const AUTO_CONFIRMA = 6000

export default function Pagar() {
  const id = useParametro("id")
  const dados = useDadosDoCliente()
  if (id === undefined) return <EsqueletoCliente titulo="Pagar" />
  const achado = id ? buscarCobranca(dados, id) : null
  return (
    <ComDadosCliente oQue="o pagamento" titulo="Pagar">
      {() => !achado ? <NaoAchado oQue="Pagamento" /> : "erro" in achado ? (achado.erro === "outra-conta" ? <OutraConta /> : <NaoAchado oQue="Pagamento" />) : <Tela c={achado.cobranca} dados={dados} pedidoId={achado.pedido?.id} />}
    </ComDadosCliente>
  )
}

function Tela({ c, dados, pedidoId }: { c: CobrancaCliente; dados: DadosDoCliente; pedidoId?: string }) {
  const pago = c.estado === "pago"
  // pago já na chegada: tudo parado. Pago enquanto a pessoa olhava: o momento toca.
  const pagoNaChegada = useRef(pago).current
  const [meio, setMeio] = useState<Meio>(c.meio === "boleto" ? "boleto" : "pix")
  return (
    <>
      <BannerCliente sobrelinha={<span className="num">{c.ref ?? c.id} · Pagamento</span>} titulo={pago ? "Pagamento confirmado" : `Pagar ${moeda(c.valor)}`}
        descricao={<FraseDoCliente p={c.p} ctx={c.ctx} acao={<span />} />}>
        <Superficie nivel="card" className="grid w-full max-w-[640px] gap-5 p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="grid gap-1">
              <p className="t-rotulo">Valor</p>
              <ValorQueVira valor={c.valor} pago={pago} animar={!pagoNaChegada} />
            </div>
            <dl className="grid min-w-0 gap-0.5 text-sm md:text-right">
              <dt className="t-rotulo">Para</dt>
              <dd className="text-pretty">{EMPRESA.razao}</dd>
              <dd className="num text-muted-foreground">CNPJ {EMPRESA.cnpj}</dd>
            </dl>
          </div>
          {pago ? <Confirmado c={c} nome={dados.cliente.nome} animar={!pagoNaChegada} pedidoId={pedidoId} /> : (
            <>
              <SegmentadoDeVidro aria-label="Forma de pagamento" valor={meio} aoMudar={(m) => setMeio(m as Meio)}
                opcoes={[{ id: "pix", rotulo: "Pix" }, { id: "cartao", rotulo: "Cartão" }, { id: "boleto", rotulo: "Boleto" }]} />
              {meio === "pix" ? <Pix c={c} aoCartao={() => setMeio("cartao")} /> : meio === "cartao" ? <Cartao c={c} /> : <Boleto c={c} />}
            </>
          )}
        </Superficie>
      </BannerCliente>
    </>
  )
}

/** O valor que rola até "Pago" quando o banco confirma. */
function ValorQueVira({ valor, pago, animar }: { valor: number; pago: boolean; animar: boolean }) {
  const reduzido = useReducedMotion()
  const anima = animar && !reduzido
  return (
    <p className="t-kpi num relative h-[1.1em] overflow-hidden" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {pago ? (
          <motion.span key="pago" className="flex items-baseline gap-2 text-positive" initial={anima ? { y: "100%", opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={mola.padrao}>
            Pago <span className="text-base text-muted-foreground">{moeda(valor)}</span>
          </motion.span>
        ) : (
          <motion.span key="valor" className="block" exit={anima ? { y: "-100%", opacity: 0 } : undefined} transition={mola.padrao}>{moeda(valor)}</motion.span>
        )}
      </AnimatePresence>
    </p>
  )
}

function Pix({ c, aoCartao }: { c: CobrancaCliente; aoCartao: () => void }) {
  const agora = useAgora()
  const ocupado = useProcessando().has(c.id)
  const [erro, setErro] = useState<string | null>(null)
  const gerar = async () => { setErro(null); const r = await gerarPixDoCliente(c.id, c.versao); if (!r.ok) setErro(r.mensagem) }
  // o Pix aberto e válido se confirma sozinho (como no site); a barra F continua confirmando na hora
  const aberto = !!c.pix && !c.expirado
  useEffect(() => {
    if (!aberto) return
    const t = setTimeout(() => bancoConfirmaPix(c.id), AUTO_CONFIRMA)
    return () => clearTimeout(t)
  }, [aberto, c.id, c.pix?.codigo])
  if (c.expirado) {
    return (
      <div role="status" className="grid gap-3 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--negative)_10%,transparent)] p-4">
        <FraseDoCliente p={PIX_EXPIRADO} acao={<span />} className="font-medium" />
        <div className="flex flex-wrap gap-2">
          <Button className="h-10 min-w-[12rem]" isPending={ocupado} onPress={() => void gerar()}><RefreshCw /> {ocupado ? "Gerando…" : "Gerar novo código"}</Button>
          <Button variant="outline" className="h-10" onPress={aoCartao}><CreditCard /> Pagar com cartão</Button>
        </div>
        {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
      </div>
    )
  }
  if (!c.pix) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-pretty text-muted-foreground">O código vale {EMPRESA.pixMinutos} minutos. Pague no app do seu banco com o QR ou com o Pix Copia e Cola.</p>
        <BotaoLiquido className="h-11 min-w-[14rem] justify-self-start" onClick={() => void gerar()} disabled={ocupado}><QrCode className="size-4" /> {ocupado ? "Gerando…" : `Gerar Pix de ${moeda(c.valor)}`}</BotaoLiquido>
        {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
      </div>
    )
  }
  const faltam = Math.min(EMPRESA.pixMinutos, Math.max(1, Math.ceil((new Date(c.pix.expira).getTime() - agora.getTime()) / 60000)))
  return (
    <div className="grid gap-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <QrDoPix codigo={c.pix.codigo} rotulo={`QR Code do Pix de ${moeda(c.valor)} (exemplo)`} />
        <div className="grid min-w-0 flex-1 gap-1 text-center text-sm sm:text-left">
          <p className="text-base font-medium">Pague até <span className="num">{hora(c.pix.expira)}</span></p>
          <p className="text-muted-foreground"><span className="num">{faltam}</span> {faltam === 1 ? "minuto" : "minutos"} para expirar</p>
          <p className="text-pretty text-muted-foreground">A tela muda sozinha quando o banco confirmar.</p>
        </div>
      </div>
      <div className="grid gap-1.5">
        <p className="t-rotulo">Pix Copia e Cola</p>
        <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] py-1 pr-1 pl-3">
          <span className="num min-w-0 flex-1 truncate text-xs" title={c.pix.codigo}>{c.pix.codigo}</span>
          <Button variant="outline" className="h-10 shrink-0" onPress={() => void copiar(c.pix!.codigo, "Pix Copia e Cola copiado")}><CopyIcon /> Copiar</Button>
        </div>
      </div>
    </div>
  )
}

function Cartao({ c }: { c: CobrancaCliente }) {
  const max = c.valor >= 300 ? 3 : c.valor >= 100 ? 2 : 1
  const [parcelas, setParcelas] = useState(1)
  const ocupado = useProcessando().has(c.id)
  const [erro, setErro] = useState<string | null>(null)
  const pagar = async () => { setErro(null); const r = await pagarNoCartao(c.id, c.versao, parcelas); if (!r.ok) setErro(r.mensagem) }
  return (
    <div className="grid gap-3">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Parcelas sem juros</legend>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <label key={n} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] px-3 text-sm shadow-[inset_0_0_0_1px_var(--border)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring")}>
            <input type="radio" name={`parcelas-${c.id}`} value={n} checked={parcelas === n} onChange={() => setParcelas(n)} className="size-4 accent-[var(--primary)]" />
            <span className="num flex-1">{n} × {moeda(Math.round((c.valor / n) * 100) / 100)}</span>
            <span className="num text-muted-foreground">total {moeda(c.valor)}</span>
          </label>
        ))}
      </fieldset>
      <p className="text-xs text-pretty text-muted-foreground">Os dados do cartão são digitados no ambiente do provedor de pagamento; a Oficina não os guarda.</p>
      <BotaoLiquido className="h-11 min-w-[14rem] justify-self-start" onClick={() => void pagar()} disabled={ocupado}><CreditCard className="size-4" /> {ocupado ? "Enviando…" : `Pagar ${moeda(c.valor)} no cartão`}</BotaoLiquido>
      {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
    </div>
  )
}

function Boleto({ c }: { c: CobrancaCliente }) {
  const ocupado = useProcessando().has(c.id)
  const [erro, setErro] = useState<string | null>(null)
  const gerar = async () => { setErro(null); const r = await gerarBoleto(c.id, c.versao); if (!r.ok) setErro(r.mensagem) }
  if (c.meio === "boleto" && c.linhaDigitavel) {
    return (
      <div className="grid gap-2">
        <FraseDoCliente p={c.p} ctx={c.ctx} acao={<span />} />
        <p className="t-rotulo">Linha digitável</p>
        <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] py-1 pr-1 pl-3">
          <span className="num min-w-0 flex-1 truncate text-xs" title={c.linhaDigitavel}>{c.linhaDigitavel}</span>
          <Button variant="outline" className="h-10 shrink-0" onPress={() => void copiar(c.linhaDigitavel!, "Linha digitável copiada")}><CopyIcon /> Copiar</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="grid gap-3">
      <p className="text-sm text-pretty text-muted-foreground">O boleto vence em {EMPRESA.boletoDias} dias. A confirmação leva até 3 dias úteis depois do pagamento.</p>
      <Button variant="outline" className="h-11 min-w-[12rem] justify-self-start" isPending={ocupado} onPress={() => void gerar()}><FileText /> {ocupado ? "Gerando…" : "Gerar boleto"}</Button>
      {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
    </div>
  )
}

/** Pago: o check que se desenha e o comprovante. */
function Confirmado({ c, nome, animar, pedidoId }: { c: CobrancaCliente; nome: string; animar: boolean; pedidoId?: string }) {
  const reduzido = useReducedMotion()
  const anima = animar && !reduzido
  const iniciais = nome.split(" ").map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(" ")
  return (
    <div className="grid gap-5">
      <div role="status" className="flex items-center gap-3">
        <svg viewBox="0 0 48 48" className="size-12 shrink-0 text-positive" aria-hidden="true">
          <motion.circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" initial={anima ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} />
          <motion.path d="M14 24.5 21 31 34 17" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            initial={anima ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: anima ? 0.4 : 0, ease: [0.23, 1, 0.32, 1] }} />
        </svg>
        <div className="grid gap-0.5 text-sm">
          <FraseDoCliente p={c.p} ctx={c.ctx} acao={<span />} className="text-base font-medium" />
          {c.pagoEm && <p className="text-muted-foreground"><span className="num">{diaHora(c.pagoEm)}</span>{c.meio ? ` · ${c.meio === "pix" ? "Pix" : "cartão"}` : ""}</p>}
        </div>
      </div>
      <motion.div initial={anima ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ ...mola.macia, delay: anima ? 0.7 : 0 }}>
        {c.meio === "pix" && c.pagoEm ? (
          <ComprovantePix titulo="Pagamento por Pix" valor={Math.round(c.valor * 100)} quando={diaHora(c.pagoEm)}
            de={{ nome: iniciais, instituicao: "Seu banco" }}
            para={{ nome: EMPRESA.razao, documento: EMPRESA.cnpj, instituicao: "Banco da Oficina Norte", chave: EMPRESA.pix }}
            idE2E={c.comprovanteId} linhas={[{ rotulo: "Referência", valor: c.ref ?? c.id }]} nota="Comprovante de exemplo · nenhum dinheiro saiu" className="max-w-none" />
        ) : (
          <p className="text-sm text-pretty text-muted-foreground">{c.pagoEm ? FRASES.pagoNoCartao({ quando: c.pagoEm }) : ""} O recibo também fica no pedido.</p>
        )}
      </motion.div>
      <div className="flex flex-wrap gap-2">
        {pedidoId && <LinkButton className="h-10" href={ir.pedido(pedidoId)}>Ver o pedido</LinkButton>}
        <LinkButton variant="ghost" className="h-10" href={ir.inicio()}>Voltar ao início</LinkButton>
      </div>
    </div>
  )
}

/** QR de exemplo desenhado a partir do código (nenhum banco o lê). Fundo claro nos dois temas, maior no desktop. */
// BASE: o QrPix do Financeiro (DetalheLancamento.tsx) não é exportado; esta é a mesma regra de desenho, local.
function QrDoPix({ codigo, rotulo }: { codigo: string; rotulo: string }) {
  const N = 29
  const celulas = useMemo(() => {
    let h = 2166136261
    const bits: boolean[] = []
    for (let i = 0; i < N * N; i++) { h = Math.imul(h ^ codigo.charCodeAt(i % codigo.length) ^ i, 16777619) >>> 0; bits.push((h & 3) === 0 || (h & 7) === 5) }
    return bits
  }, [codigo])
  const olho = (x: number, y: number) => (x < 8 && y < 8 ? [x, y] : x >= N - 8 && y < 8 ? [x - (N - 8), y] : x < 8 && y >= N - 8 ? [x, y - (N - 8)] : null)
  const reduzido = useReducedMotion()
  return (
    <motion.svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} className="size-44 shrink-0 rounded-xl bg-white shadow-[0_0_0_1px_var(--sup-aro)] md:size-52" role="img" aria-label={rotulo}
      initial={reduzido ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={mola.padrao}>
      {celulas.map((on, i) => {
        const x = i % N, y = Math.floor(i / N)
        const o = olho(x, y)
        const preto = o ? (o[0] === 7 || o[1] === 7 ? false : o[0] === 0 || o[0] === 6 || o[1] === 0 || o[1] === 6 || (o[0] >= 2 && o[0] <= 4 && o[1] >= 2 && o[1] <= 4)) : on
        return preto ? <rect key={i} x={x} y={y} width="1.02" height="1.02" fill="#111" /> : null
      })}
    </motion.svg>
  )
}
