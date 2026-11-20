// Detalhe de um lançamento numa FolhaDeDetalhe (?id=LAN-5012): valor, cliente ou fornecedor, referência, o que o
// cliente lê e o histórico. Receber: escolhe o meio (Pix, dinheiro, débito, crédito, boleto); o Pix gera QR e Copia e
// Cola com prazo (P) e a tela muda sozinha quando o banco confirma; o expirado oferece "Gerar novo código" e "Outra
// forma de pagamento"; dinheiro e cartão pedem confirmação (DialogoConfirmar). Pagar: lê a linha digitável do boleto.
// Pago: comprovante (ComprovantePix do arsenal) e Estornar; nunca Editar (EST-48). A baixa sem resposta fica "Enviado,
// ainda sem confirmação" com "Verificar status" e não deixa receber de novo (EST-46). A chave de idempotência nasce
// quando a folha abre, antes do clique (EST-40).
import { useEffect, useMemo, useState } from "react"
import { ArrowDownToLine, Banknote, Clock, CopyIcon, QrCode, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { FraseDoCliente } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { ComprovantePix } from "@/components/mift/fluxos/comprovante-pix"
import { CampoLinhaDigitavel } from "@/components/mift/fluxos/campos-br"
import { marcarAberto, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { EMPRESA, UNIDADES } from "@/proto/negocio"
import { fraseSemPermissao, pode, usePapel } from "@/proto/permissoes"
import { fraseNaoConfirmado } from "@/proto/projecao"
import { lerLinhaDigitavel } from "@/lib/boleto"
import { copiar } from "@/lib/copiar"
import { moeda } from "@/lib/formato"
import { url } from "@/lib/url"
import { MEIOS, emAberto, gerarPix, lancamentos, nomeDe, novaChave, pixExpirado, situacao, verificarStatus, type Lancamento, type Meio, type Natureza } from "../dados"
import { SeloLancamento } from "./comum"
import type { Pedido } from "./confirmacoes"

const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " às")
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const MEIOS_RECEBER: { id: Meio; rotulo: string }[] = [
  { id: "pix", rotulo: "Pix" }, { id: "dinheiro", rotulo: "Dinheiro" }, { id: "cartao_debito", rotulo: "Débito" }, { id: "cartao_credito", rotulo: "Crédito" }, { id: "boleto", rotulo: "Boleto" },
]

export default function DetalheLancamento({ id, natureza, aoFechar, pedir }: { id: string; natureza: Natureza; aoFechar: () => void; pedir: (p: Pedido) => void }) {
  const l = lancamentos.use().find((x) => x.id === id && x.natureza === natureza) ?? null
  const agora = useAgora()
  useEffect(() => { marcarAberto(l ? (lancamentos as unknown as Colecao<Registro>) : null, l?.id); return () => marcarAberto(null) }, [l?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FolhaDeDetalhe
      aberto={!!l}
      aoFechar={aoFechar}
      sobre={l ? `${l.id} · ${UNIDADES[l.unidade].nome}` : undefined}
      titulo={l?.descricao ?? ""}
      selos={l && <SeloLancamento l={l} />}
    >
      {l && <Corpo l={l} agora={agora} pedir={pedir} />}
    </FolhaDeDetalhe>
  )
}

function Corpo({ l, agora, pedir }: { l: Lancamento; agora: Date; pedir: (p: Pedido) => void }) {
  const papel = usePapel()
  const { p, ctx } = situacao(l, agora)
  const cliente = l.clienteId
  return (
    <>
      <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Valor</dt>
        <dd className="t-kpi num text-[1.5rem] leading-tight whitespace-nowrap">{moeda(l.valor)}</dd>
        <dt className="text-muted-foreground">{l.natureza === "receber" ? "Cliente" : "Fornecedor"}</dt>
        <dd className="min-w-0 break-words">{cliente ? <a className="link-sistema" href={url(`clientes/?id=${cliente}`)}>{nomeDe(l)}</a> : nomeDe(l)}</dd>
        {l.ref && <><dt className="text-muted-foreground">Referência</dt>
          <dd className="num">{l.ref.startsWith("OS-") ? <a className="link-sistema" href={url(`pedidos/?id=${l.ref}`)}>{l.ref}</a> : l.ref}</dd></>}
        <dt className="text-muted-foreground">Vencimento</dt><dd className="num">{new Date(l.vencimento).toLocaleDateString("pt-BR")}</dd>
        <dt className="text-muted-foreground">Categoria</dt><dd>{l.categoria}</dd>
        {l.meio && <><dt className="text-muted-foreground">Meio</dt><dd>{MEIOS[l.meio]}</dd></>}
        {l.pagoEm && l.estado === "pago" && <><dt className="text-muted-foreground">{l.natureza === "receber" ? "Recebido em" : "Pago em"}</dt><dd className="num">{dataHora(l.pagoEm)}</dd></>}
        {l.estornadoPor && <><dt className="text-muted-foreground">Estorno</dt><dd>Estornado por <a className="link-sistema num" href={url(`financeiro/${l.natureza === "receber" ? "pagar" : "receber"}/?id=${l.estornadoPor}`)}>{l.estornadoPor}</a></dd></>}
        {l.estornoDe && <><dt className="text-muted-foreground">Estorno de</dt><dd><a className="link-sistema num" href={url(`financeiro/${l.natureza === "receber" ? "pagar" : "receber"}/?id=${l.estornoDe}`)}>{l.estornoDe}</a></dd></>}
        {l.motivo && l.estado === "cancelado" && <><dt className="text-muted-foreground">Motivo</dt><dd className="break-words">{l.motivo}</dd></>}
      </dl>

      {l.natureza === "receber" && p.cliente && (
        <div className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5">
          <p className="t-rotulo mb-1">O cliente lê</p>
          <FraseDoCliente p={p} ctx={ctx} />
        </div>
      )}

      {l.envio ? <NaoConfirmado l={l} />
        : emAberto(l) && l.natureza === "receber" ? (pode(papel, "receber", { unidade: l.unidade }) ? <Receber l={l} agora={agora} pedir={pedir} /> : <SemPermissao texto={fraseSemPermissao(papel, "receber")} />)
        : emAberto(l) && l.natureza === "pagar" ? (pode(papel, "pagar") ? <Pagar l={l} pedir={pedir} /> : <SemPermissao texto={fraseSemPermissao(papel, "pagar")} />)
        : l.estado === "pago" ? <Pago l={l} pedir={pedir} />
        : l.estado === "previsto" ? <p className="text-sm text-pretty text-muted-foreground">Previsto: vira {l.natureza === "receber" ? "título a receber quando a OS for concluída" : "conta a pagar quando a compra for recebida"}. Já entra no fluxo projetado.</p>
        : null}

      {emAberto(l) && !l.envio && pode(papel, l.natureza === "receber" ? "receber" : "pagar") && (
        <Button variant="ghost" className="justify-self-start text-negativo-texto" onPress={() => pedir({ tipo: "cancelar", l })}><X /> Cancelar o título</Button>
      )}

      <section aria-labelledby="hist-lan">
        <h3 id="hist-lan" className="t-card mb-2">Linha do tempo</h3>
        <LinhaDoTempo eventos={l.historico} />
      </section>
    </>
  )
}

function SemPermissao({ texto }: { texto: string }) {
  return <p className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm text-pretty text-muted-foreground">{texto}</p>
}

function NaoConfirmado({ l }: { l: Lancamento }) {
  const ocupado = useProcessando().has(l.id)
  return (
    <section aria-labelledby="nao-conf" role="status" className="grid gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_14%,transparent)] px-3 py-3">
      <h3 id="nao-conf" className="flex items-center gap-1.5 text-sm font-medium"><Clock className="size-4" aria-hidden="true" /> {fraseNaoConfirmado}</h3>
      <p className="text-sm text-pretty text-muted-foreground">Baixa em {MEIOS[l.envio!.meio].toLowerCase()} enviada às {hora(l.envio!.em)}. Para não receber duas vezes, o título fica travado até o status voltar.</p>
      <Button variant="outline" className="min-w-[11rem] justify-self-start" isPending={ocupado} onPress={() => void verificarStatus(l)}><RefreshCw /> {ocupado ? "Verificando…" : "Verificar status"}</Button>
    </section>
  )
}

function Receber({ l, agora, pedir }: { l: Lancamento; agora: Date; pedir: (p: Pedido) => void }) {
  const [meio, setMeio] = useState<Meio>(l.estado === "aguardando_pix" || l.meio === "pix" ? "pix" : l.meio ?? "pix")
  // a chave de idempotência nasce quando a folha abre, antes do clique (EST-40)
  const chave = useMemo(() => novaChave(l.id), [l.id])
  return (
    <section aria-labelledby="receber-titulo" className="grid gap-3">
      <h3 id="receber-titulo" className="t-card">Receber</h3>
      <SegmentadoDeVidro aria-label="Meio de pagamento" opcoes={MEIOS_RECEBER} valor={meio} aoMudar={(m) => setMeio(m as Meio)} />
      {meio === "pix" ? <Pix l={l} agora={agora} aoOutraForma={() => setMeio("dinheiro")} /> : (
        <div className="grid gap-2">
          <p className="text-sm text-pretty text-muted-foreground">
            {meio === "dinheiro" ? "Conte o dinheiro antes de confirmar. O valor entra no caixa de hoje." : meio === "boleto" ? "Registre só depois de o boleto compensar no extrato." : "Confirme depois que a maquininha aprovar."}
          </p>
          <BotaoLiquido className="justify-self-start" onClick={() => pedir({ tipo: "receber", l, meio, chave })}><Banknote className="size-4" /> Receber {moeda(l.valor)}</BotaoLiquido>
        </div>
      )}
    </section>
  )
}

function Pix({ l, agora, aoOutraForma }: { l: Lancamento; agora: Date; aoOutraForma: () => void }) {
  const ocupado = useProcessando().has(l.id)
  const [erro, setErro] = useState<string | null>(null)
  const gerar = async () => { setErro(null); const r = await gerarPix(l); if (!r.ok) setErro(r.mensagem) }
  const expirado = pixExpirado(l, agora)
  if (l.estado !== "aguardando_pix" || !l.pixCodigo) {
    return (
      <div className="grid gap-2">
        <p className="text-sm text-pretty text-muted-foreground">O código vale {EMPRESA.pixMinutos} minutos. Mostre o QR ou envie o Copia e Cola ao cliente.</p>
        <BotaoLiquido className="min-w-[13rem] justify-self-start" onClick={() => void gerar()} disabled={ocupado}><QrCode className="size-4" /> {ocupado ? "Gerando…" : `Gerar Pix de ${moeda(l.valor)}`}</BotaoLiquido>
        {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
      </div>
    )
  }
  if (expirado) {
    return (
      <div role="status" className="grid gap-3 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--negative)_10%,transparent)] px-3 py-3">
        <p className="text-sm font-medium">O código expirou às {hora(l.pixExpiraEm!)}.</p>
        <div className="flex flex-wrap gap-2">
          <Button className="min-w-[11rem]" isPending={ocupado} onPress={() => void gerar()}><RefreshCw /> {ocupado ? "Gerando…" : "Gerar novo código"}</Button>
          <Button variant="outline" onPress={aoOutraForma}>Outra forma de pagamento</Button>
        </div>
        {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
      </div>
    )
  }
  const faltam = Math.min(EMPRESA.pixMinutos, Math.max(1, Math.ceil((new Date(l.pixExpiraEm!).getTime() - agora.getTime()) / 60000)))
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <QrPix codigo={l.pixCodigo} rotulo={`QR Code do Pix de ${moeda(l.valor)} (exemplo)`} />
        <div className="grid min-w-0 flex-1 gap-1 text-sm">
          <p className="font-medium">Pague até {hora(l.pixExpiraEm!)}</p>
          <p className="text-muted-foreground"><span className="num">{faltam}</span> {faltam === 1 ? "minuto" : "minutos"} para expirar</p>
          <p className="text-pretty text-muted-foreground" aria-live="polite">A tela muda sozinha quando o banco confirmar.</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] py-1 pr-1 pl-3">
        <span className="num min-w-0 flex-1 truncate text-xs" title={l.pixCodigo}>{l.pixCodigo}</span>
        <Button variant="outline" size="sm" className="h-10 shrink-0" onPress={() => void copiar(l.pixCodigo!, "Pix Copia e Cola copiado")}><CopyIcon /> Copiar</Button>
      </div>
    </div>
  )
}

/** QR de exemplo, desenhado a partir do código (não é lido por banco nenhum). Fundo claro nos dois temas. */
function QrPix({ codigo, rotulo }: { codigo: string; rotulo: string }) {
  const N = 29
  const celulas = useMemo(() => {
    let h = 2166136261
    const bits: boolean[] = []
    for (let i = 0; i < N * N; i++) { h = Math.imul(h ^ codigo.charCodeAt(i % codigo.length) ^ i, 16777619) >>> 0; bits.push((h & 3) === 0 || (h & 7) === 5) }
    return bits
  }, [codigo])
  const olho = (x: number, y: number) => x < 8 && y < 8 ? [x, y] : x >= N - 8 && y < 8 ? [x - (N - 8), y] : x < 8 && y >= N - 8 ? [x, y - (N - 8)] : null
  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} className="size-36 shrink-0 rounded-lg bg-white shadow-[0_0_0_1px_var(--sup-aro)]" role="img" aria-label={rotulo}>
      {celulas.map((on, i) => {
        const x = i % N, y = Math.floor(i / N)
        const o = olho(x, y)
        const preto = o ? (o[0] === 7 || o[1] === 7 ? false : o[0] === 0 || o[0] === 6 || o[1] === 0 || o[1] === 6 || (o[0] >= 2 && o[0] <= 4 && o[1] >= 2 && o[1] <= 4)) : on
        return preto ? <rect key={i} x={x} y={y} width="1.02" height="1.02" fill="#111" /> : null
      })}
    </svg>
  )
}

function Pagar({ l, pedir }: { l: Lancamento; pedir: (p: Pedido) => void }) {
  const [meio, setMeio] = useState<Meio>(l.meio === "pix" ? "pix" : "boleto")
  const [linha, setLinha] = useState(l.linhaDigitavel ?? "")
  const chave = useMemo(() => novaChave(l.id), [l.id])
  const leitura = useMemo(() => lerLinhaDigitavel(linha), [linha])
  const valorDiferente = leitura.valido && leitura.valor !== undefined && leitura.valor > 0 && Math.abs(leitura.valor - l.valor) > 0.009
  const pronto = meio === "pix" || leitura.valido
  return (
    <section aria-labelledby="pagar-titulo" className="grid gap-3">
      <h3 id="pagar-titulo" className="t-card">Pagar</h3>
      <SegmentadoDeVidro aria-label="Meio do pagamento" opcoes={[{ id: "boleto", rotulo: "Boleto" }, { id: "pix", rotulo: "Pix" }]} valor={meio} aoMudar={(m) => setMeio(m as Meio)} />
      {meio === "boleto" ? (
        <div className="grid gap-1.5">
          <label htmlFor={`linha-${l.id}`} className="text-sm font-medium">Linha digitável</label>
          <CampoLinhaDigitavel id={`linha-${l.id}`} valor={linha} aoMudar={setLinha} />
          {valorDiferente && <p role="alert" className="text-sm text-pretty">O boleto diz <span className="num font-medium">{moeda(leitura.valor!)}</span>; a conta é de <span className="num font-medium">{moeda(l.valor)}</span>. Confira antes de pagar.</p>}
        </div>
      ) : (
        <p className="text-sm text-pretty text-muted-foreground">Pix para a chave cadastrada de {nomeDe(l)}. O comprovante fica no título.</p>
      )}
      <BotaoLiquido className="justify-self-start" disabled={!pronto} onClick={() => pedir({ tipo: "pagar", l, meio, chave })}><ArrowDownToLine className="size-4 rotate-180" /> Pagar {moeda(l.valor)}</BotaoLiquido>
      {!pronto && <p className="text-xs text-muted-foreground">Digite ou cole os 47 ou 48 números do boleto.</p>}
    </section>
  )
}

function Pago({ l, pedir }: { l: Lancamento; pedir: (p: Pedido) => void }) {
  const papel = usePapel()
  const podeEstornar = !l.estornadoPor && !l.estornoDe && pode(papel, "estornar", { valor: l.valor })
  const recebido = l.natureza === "receber"
  const cliente = nomeDe(l)
  return (
    <section aria-labelledby="pago-titulo" className="grid gap-3">
      <h3 id="pago-titulo" className="t-card">{l.estornoDe ? "Estorno feito" : recebido ? "Pagamento confirmado" : "Conta paga"}</h3>
      {l.meio === "pix" && l.pagoEm ? (
        <ComprovantePix
          titulo={recebido ? "Pix recebido" : "Pix enviado"}
          valor={Math.round(l.valor * 100)}
          quando={dataHora(l.pagoEm)}
          de={recebido ? { nome: cliente, instituicao: "Banco do cliente" } : { nome: EMPRESA.razao, documento: EMPRESA.cnpj, instituicao: "Banco da Oficina Norte" }}
          para={recebido ? { nome: EMPRESA.razao, documento: EMPRESA.cnpj, instituicao: "Banco da Oficina Norte", chave: EMPRESA.pix } : { nome: cliente, instituicao: "Banco do fornecedor" }}
          idE2E={l.comprovanteId}
          linhas={[{ rotulo: "Título", valor: l.id }, ...(l.ref ? [{ rotulo: "Referência", valor: l.ref }] : [])]}
          nota="Comprovante de exemplo · nenhum dinheiro saiu"
          className="max-w-none"
        />
      ) : (
        <p className="text-sm text-pretty text-muted-foreground">{recebido ? "Recebido" : "Pago"} em {MEIOS[l.meio ?? "dinheiro"].toLowerCase()}{l.pagoEm ? ` em ${dataHora(l.pagoEm)}` : ""}. Pagamento confirmado não se edita: para corrigir, estorne.</p>
      )}
      {podeEstornar && <Button variant="outline" className="justify-self-start text-negativo-texto" onPress={() => pedir({ tipo: "estornar", l })}><X /> Estornar {moeda(l.valor)}</Button>}
    </section>
  )
}
