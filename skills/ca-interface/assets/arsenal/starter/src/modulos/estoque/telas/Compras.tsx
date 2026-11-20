// Módulo Estoque (5.6) · /estoque/compras/: compras de fornecedor (CMP-) em TabelaDados e o detalhe numa folha
// (?id=CMP-0007) com os itens, a previsão, a OS que espera a peça e as ações por estado: enviar (P), cancelar até
// enviada (P, com motivo) e receber inteira ou em parte (P, diálogo com a quantidade por item). Gerar a compra dos
// itens baixos é O com Desfazer. Filtros na URL (?q=&estado=abertas).
import { Suspense, lazy, useEffect, useMemo, useState } from "react"
import { PackageOpen, Send, ShoppingCart, SearchX, Truck, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { SeloEixo } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { BotaoLiquido } from "@/components/movimento"
import { marcarAberto, usePendentes, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { DIA, useAgora } from "@/proto/relogio"
import { UNIDADES, expediente } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { ETAPA_OS } from "@/proto/projecao"
import { pedidos } from "@/modulos/pedidos/dados"
import { dataCurta, dataPorExtenso, moeda, numero } from "@/lib/formato"
import { url } from "@/lib/url"
import { cancelarCompra, compraAberta, compras, enviarCompra, faltaReceber, gerarCompraDosBaixos, produtos, totalDaCompra, type Compra } from "../dados"
import { CabecalhoEstoque, SeloCompra } from "./comum"

const ReceberCompra = lazy(() => import("./ReceberCompra"))

const PADRAO = { q: "", estado: "todas", id: "" }
const recebivel = (c: Compra) => c.estado === "enviada" || c.estado === "recebida_parcial"
const cancelavel = (c: Compra) => c.estado === "rascunho" || c.estado === "enviada"

/** Previsão padrão ao enviar: 3 dias de expediente a partir de hoje (pula domingo e feriado, como o 20/11). */
function previsaoPadrao(de: Date) {
  let d = new Date(de.getFullYear(), de.getMonth(), de.getDate(), 12)
  let n = 0
  while (n < 3) { d = new Date(d.getTime() + DIA); if (expediente(d)) n++ }
  return d
}

export default function Compras() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const todas = compras.use()
  const agora = useAgora()
  const papel = usePapel()
  const mexe = pode(papel, "estoque_movimentar")
  const veCusto = pode(papel, "ver_custo")
  const ve = pode(papel, "estoque_historico")
  const lista = useMemo(() => {
    const t = f.q.trim().toLowerCase()
    return todas.filter((c) => (f.estado === "todas" || (f.estado === "abertas" ? compraAberta(c) : !compraAberta(c))) &&
      (!t || c.id.toLowerCase().includes(t) || c.fornecedor.toLowerCase().includes(t) || c.itens.some((i) => i.sku.toLowerCase().includes(t)) || c.reservas.some((r) => r.osId.toLowerCase().includes(t))))
  }, [todas, f])
  const filtrado = f.q !== "" || f.estado !== "todas"
  const limpar = () => setF({ q: "", estado: "todas" })
  const [enviar, setEnviar] = useState<Compra | null>(null)
  const [cancelar, setCancelar] = useState<Compra | null>(null)
  const [receber, setReceber] = useState<Compra | null>(null)
  const pendentes = usePendentes()
  const processando = useProcessando()
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  const nAbertas = todas.filter(compraAberta).length

  function gerar() {
    const ids = gerarCompraDosBaixos()
    if (!ids.length) toast.info("Todos os itens abaixo do mínimo já estão numa compra aberta.")
    else setF({ estado: "todas", q: "" })
  }
  const acoes = { aoEnviar: setEnviar, aoCancelar: setCancelar, aoReceber: setReceber }

  const colunas: ColunaDados<Compra>[] = [
    { id: "id", titulo: "Compra", tipo: "id", largura: "6.5rem", texto: (c) => c.id,
      valor: (c) => <a href={url(`estoque/compras/?id=${c.id}`)} onClick={(e) => { e.preventDefault(); setF({ id: c.id }) }} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{c.id}</a> },
    { id: "fornecedor", titulo: "Fornecedor", tipo: "texto", valor: (c) => c.fornecedor },
    { id: "unidade", titulo: "Entrega em", tipo: "texto", largura: "7rem", valor: (c) => UNIDADES[c.unidade].nome },
    { id: "itens", titulo: "Unidades", tipo: "numero", largura: "5.75rem", valor: (c) => String(c.itens.reduce((s, i) => s + i.qtd, 0)) },
    ...(veCusto ? [{ id: "total", titulo: "Total", tipo: "moeda", largura: "8.5rem", valor: (c: Compra) => moeda(totalDaCompra(c)) } satisfies ColunaDados<Compra>] : []),
    { id: "previsao", titulo: "Previsão", tipo: "data", largura: "5.5rem", valor: (c) => (c.estado === "rascunho" ? "—" : dataCurta(c.previsao)) },
    { id: "estado", titulo: "Situação", tipo: "status", largura: "10rem", valor: (c) => <SeloCompra c={c} agora={agora} /> },
    { id: "os", titulo: "Para a OS", tipo: "texto", largura: "6.5rem", valor: (c) => c.reservas.map((r) => r.osId).join(", ") || "—" },
    ...(mexe ? [{ id: "acoes", titulo: "Ações", tipo: "acoes", valor: (c: Compra) => <MenuCompra c={c} abrir={(id) => setF({ id })} {...acoes} /> } satisfies ColunaDados<Compra>] : []),
  ]

  return (
    <>
      <CabecalhoEstoque ativa="estoque/compras/" titulo="Compras" descricao="Pedidos aos fornecedores, previsão e recebimento"
        contagem={!ve ? undefined : filtrado ? `${lista.length} de ${todas.length}` : `${nAbertas} ${nAbertas === 1 ? "aberta" : "abertas"} de ${todas.length}`}
        acoes={mexe && <BotaoLiquido onClick={gerar}><ShoppingCart className="size-4" /> Gerar compra dos baixos</BotaoLiquido>}>
        {ve && <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar compra" placeholder="Buscar compra, fornecedor ou SKU" filtrado={filtrado} aoLimpar={limpar}>
          <div className="w-full sm:w-72">
            <SegmentadoDeVidro aria-label="Situação das compras" valor={f.estado} aoMudar={(estado) => setF({ estado })}
              opcoes={[{ id: "todas", rotulo: "Todas" }, { id: "abertas", rotulo: `Abertas · ${nAbertas}` }, { id: "fechadas", rotulo: "Fechadas" }]} />
          </div>
        </BarraFerramentas>}
      </CabecalhoEstoque>

      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="estoque_historico" area="do estoque" rotulo="as compras" estaVazio={todas.length === 0}
          esqueleto={<div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>}
          vazio={<EstadoVazio icone={Truck} titulo="Nenhuma compra ainda." texto="Gere a compra dos itens abaixo do mínimo e envie ao fornecedor por aqui."
            acao={mexe ? <BotaoLiquido onClick={gerar}><ShoppingCart className="size-4" /> Gerar compra dos baixos</BotaoLiquido> : undefined} />}>
          {() => lista.length === 0 ? (
            f.estado === "abertas" && !f.q
              ? <EstadoVazio variante="concluido" icone={PackageOpen} titulo="Nenhuma compra aberta." texto="Tudo o que foi pedido já chegou ou foi cancelado." />
              : <EstadoVazio variante="filtro" icone={SearchX} titulo={`Nenhuma compra ${f.estado === "abertas" ? "aberta" : f.estado === "fechadas" ? "fechada" : ""}${f.q ? ` com “${f.q}”` : ""}.`.replace("  ", " ").replace(" .", ".")}
                  texto="Tente outro termo ou limpe os filtros para ver todas." acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
          ) : (
            <div>
              <TabelaDados<Compra>
                titulo="Compras de fornecedor"
                colunas={colunas}
                linhas={lista}
                idDe={(c) => c.id}
                contagem={<><span className="num">{lista.length}</span> de <span className="num">{todas.length}</span></>}
                aoAbrir={(c) => setF({ id: c.id })}
                aberto={f.id}
                pendentes={marcados}
                cartao={(c) => (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <a href={url(`estoque/compras/?id=${c.id}`)} onClick={(e) => { e.preventDefault(); setF({ id: c.id }) }}
                        className="num inline-flex min-h-10 items-center rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{c.id}</a>
                      <span className="flex min-w-0 max-w-[62%] justify-end"><SeloCompra c={c} agora={agora} detalhe /></span>
                    </div>
                    <span className="block truncate text-sm font-medium" title={c.fornecedor}>{c.fornecedor}</span>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate"><span className="num">{c.itens.reduce((s, i) => s + i.qtd, 0)}</span> unidades · {UNIDADES[c.unidade].nome}{c.reservas.length ? ` · para ${c.reservas.map((r) => r.osId).join(", ")}` : ""}</span>
                      {veCusto && <span className="num shrink-0 text-sm font-semibold text-foreground">{moeda(totalDaCompra(c))}</span>}
                    </div>
                  </>
                )}
                totais={{ rotulo: "Totais do recorte", itens: [
                { rotulo: "Compras", valor: numero(lista.length) },
                { rotulo: "Unidades a receber", valor: numero(lista.filter(recebivel).reduce((s, c) => s + faltaReceber(c), 0)) },
                ...(veCusto ? [{ rotulo: "Total", valor: moeda(lista.filter((c) => c.estado !== "cancelada").reduce((s, c) => s + totalDaCompra(c), 0)) }] : []),
              ] }}
              />
            </div>
          )}
        </ComDados>
      </div>

      <DetalheCompra id={f.id || null} aoFechar={() => setF({ id: "" })} {...acoes} />
      <DialogoConfirmar aberto={!!enviar} aoFechar={() => setEnviar(null)} titulo={`Enviar a ${enviar?.id ?? ""} ao fornecedor?`}
        descricao={enviar && <>A {enviar.fornecedor} recebe o pedido de <span className="num">{enviar.itens.reduce((s, i) => s + i.qtd, 0)}</span> unidades{veCusto ? <> no valor de <span className="num whitespace-nowrap">{moeda(totalDaCompra(enviar))}</span></> : null}. Previsão de entrega: {dataPorExtenso(previsaoPadrao(agora))}, em {UNIDADES[enviar.unidade].nome}.</>}
        confirmar="Enviar compra" voltar="Manter em rascunho" aoConfirmar={() => (enviar ? enviarCompra(enviar, previsaoPadrao(agora)) : undefined)} />
      <DialogoConfirmar aberto={!!cancelar} aoFechar={() => setCancelar(null)} perigo titulo={`Cancelar a ${cancelar?.id ?? ""}?`}
        descricao={cancelar && (cancelar.estado === "enviada" ? `Avise a ${cancelar.fornecedor}: o pedido já foi enviado. A compra fica no histórico como cancelada.` : "O rascunho fica no histórico como cancelado.")}
        motivo="Motivo do cancelamento" confirmar="Cancelar a compra" voltar="Manter a compra" aoConfirmar={(m) => (cancelar ? cancelarCompra(cancelar, m) : undefined)} />
      {receber && <Suspense fallback={null}><ReceberCompra c={receber} aoFechar={() => setReceber(null)} /></Suspense>}
    </>
  )
}

type Acoes = { aoEnviar: (c: Compra) => void; aoCancelar: (c: Compra) => void; aoReceber: (c: Compra) => void }

function MenuCompra({ c, abrir, aoEnviar, aoCancelar, aoReceber }: { c: Compra; abrir: (id: string) => void } & Acoes) {
  const itens: ItemMenu[] = [{ rotulo: "Abrir a compra", icone: Truck, aoEscolher: () => abrir(c.id) }]
  if (c.estado === "rascunho") itens.push({ rotulo: "Enviar ao fornecedor…", icone: Send, aoEscolher: () => aoEnviar(c) })
  if (recebivel(c)) itens.push({ rotulo: "Receber…", icone: PackageOpen, aoEscolher: () => aoReceber(c) })
  if (cancelavel(c)) itens.push({ rotulo: "Cancelar a compra…", icone: X, perigo: true, separadorAntes: true, aoEscolher: () => aoCancelar(c) })
  return <MenuDaLinha rotulo={`Ações da ${c.id}`} itens={itens} />
}

function DetalheCompra({ id, aoFechar, aoEnviar, aoCancelar, aoReceber }: { id: string | null; aoFechar: () => void } & Acoes) {
  const c = compras.use().find((x) => x.id === id) ?? null
  const ps = produtos.use()
  const oss = pedidos.use()
  const agora = useAgora()
  const papel = usePapel()
  const processando = useProcessando()
  const mexe = pode(papel, "estoque_movimentar")
  const veCusto = pode(papel, "ver_custo")
  useEffect(() => { marcarAberto(c ? (compras as unknown as Colecao<Registro>) : null, c?.id); return () => marcarAberto(null) }, [c?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const ocupado = !!c && processando.has(c.id)
  const nome = (sku: string) => ps.find((p) => p.id === sku)?.nome ?? sku
  // uma camada modal por vez: a ação fecha a folha e abre o diálogo
  const passar = (f: (c: Compra) => void) => () => { if (c) { f(c); aoFechar() } }
  return (
    <FolhaDeDetalhe
      aberto={!!c}
      aoFechar={aoFechar}
      sobre={c ? `${c.id} · entrega em ${UNIDADES[c.unidade].nome}` : undefined}
      titulo={c?.fornecedor ?? ""}
      selos={c && <SeloCompra c={c} agora={agora} detalhe />}
      rodape={c && mexe && (
        <>
          {c.estado === "rascunho" && <BotaoLiquido onClick={passar(aoEnviar)} disabled={ocupado}><Send className="size-4" /> {ocupado ? "Enviando…" : "Enviar ao fornecedor"}</BotaoLiquido>}
          {recebivel(c) && <BotaoLiquido onClick={passar(aoReceber)} disabled={ocupado}><PackageOpen className="size-4" /> {ocupado ? "Enviando…" : "Receber"}</BotaoLiquido>}
          {cancelavel(c) && <Button variant="ghost" className="text-negativo-texto sm:mr-auto" onPress={passar(aoCancelar)} isDisabled={ocupado}><X /> Cancelar a compra</Button>}
        </>
      )}
    >
      {c && (
        <>
          <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Previsão</dt><dd className="num">{c.estado === "rascunho" ? <span className="text-muted-foreground">definida ao enviar</span> : dataPorExtenso(c.previsao)}</dd>
            <dt className="text-muted-foreground">Criada em</dt><dd className="num">{dataCurta(c.criadoEm)}</dd>
            {veCusto && <><dt className="text-muted-foreground">Total</dt><dd className="num">{moeda(totalDaCompra(c))}</dd></>}
            {c.motivoCancelamento && <><dt className="text-muted-foreground">Motivo</dt><dd className="min-w-0 break-words">{c.motivoCancelamento}</dd></>}
          </dl>

          {c.reservas.length > 0 && (
            <section aria-labelledby="os-compra" className="grid gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_10%,transparent)] px-3 py-2.5">
              <h3 id="os-compra" className="t-rotulo">Peça reservada para OS</h3>
              {c.reservas.map((r) => {
                const os = oss.find((o) => o.id === r.osId)
                return os && (
                  <div key={r.osId} className="grid gap-1 text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <a className="link-sistema num font-medium" href={url(`pedidos/?id=${os.id}`)}>{os.id}</a>
                      <SeloEixo p={ETAPA_OS[os.etapa]} />
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={os.titulo}>{os.titulo} · {r.qtd}× {r.sku}</p>
                    {os.etapa === "aguardando_peca" && <p className="text-xs text-pretty">Ao receber, a {os.id} volta para Em execução e a gestora é avisada.</p>}
                  </div>
                )
              })}
            </section>
          )}

          <section aria-labelledby="itens-compra" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
            <h3 id="itens-compra" className="t-card">Itens</h3>
            <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 text-sm">
              {c.itens.map((i) => (
                <li key={i.sku} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5">
                  <span className="truncate" title={nome(i.sku)}>{nome(i.sku)}</span>
                  {veCusto ? <span className="num text-right">{moeda(i.qtd * i.custo)}</span> : <span />}
                  <span className="text-xs text-muted-foreground"><a className="link-sistema num" href={url(`estoque/?id=${i.sku}`)}>{i.sku}</a> · <span className="num">{i.qtd}</span> {i.qtd === 1 ? "unidade" : "unidades"}{veCusto && <> × <span className="num">{moeda(i.custo)}</span></>}</span>
                  <span className="num text-right text-xs text-muted-foreground">recebido {i.recebido} de {i.qtd}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="hist-compra" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
            <h3 id="hist-compra" className="t-card">Linha do tempo</h3>
            <LinhaDoTempo eventos={c.historico} />
          </section>
        </>
      )}
    </FolhaDeDetalhe>
  )
}
