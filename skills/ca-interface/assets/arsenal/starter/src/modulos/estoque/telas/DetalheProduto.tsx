// Detalhe do produto numa FolhaDeDetalhe (?id=FLT-0912): saldo grande por unidade, reservado e mínimo, preço e custo
// (só quem pode), a compra a caminho com a OS que espera a peça, os clientes no "Avise-me", as últimas movimentações e
// a linha do tempo. Ajustar (contagem; no celular, pelo teclado numérico) e transferir entre unidades são P, aqui
// dentro da folha. A folha declara o registro aberto: a barra F oferece "Outra pessoa mexe neste registro" (D2).
import { Suspense, lazy, useEffect, useState } from "react"
import { ArrowLeftRight, BellRing, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { SeloEixo } from "@/components/base/selos"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { Superficie } from "@/components/sistema/Superficie"
import { BotaoLiquido } from "@/components/movimento"
import { marcarAberto, type Colecao, type Registro } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES } from "@/proto/negocio"
import { pode, usePapel } from "@/proto/permissoes"
import { ETAPA_OS } from "@/proto/projecao"
import { pedidos } from "@/modulos/pedidos/dados"
import { moeda, dataHora, numero } from "@/lib/formato"
import { url } from "@/lib/url"
import { UNIDADES_ESTOQUE, TIPO_MOV, estadoDoProduto, compras, movimentacoes, produtos } from "../dados"
import { SeloCompra, SeloProduto } from "./comum"

// os formulários (teclado numérico, número deslizante) baixam só quando alguém pede ajuste ou transferência
const FormAjuste = lazy(() => import("./Formularios").then((m) => ({ default: m.FormAjuste })))
const FormTransferir = lazy(() => import("./Formularios").then((m) => ({ default: m.FormTransferir })))

type Modo = "ver" | "ajustar" | "transferir"

export function DetalheProduto({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const p = produtos.use().find((x) => x.id === id) ?? null
  const cmps = compras.use()
  const movs = movimentacoes.use()
  const oss = pedidos.use()
  const agora = useAgora()
  const papel = usePapel()
  const [modo, setModo] = useState<Modo>("ver")
  useEffect(() => { setModo("ver") }, [id])
  useEffect(() => { marcarAberto(p ? (produtos as unknown as Colecao<Registro>) : null, p?.id); return () => marcarAberto(null) }, [p?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const mexe = pode(papel, "estoque_movimentar")
  const veCusto = pode(papel, "ver_custo")
  const aCaminho = p ? cmps.filter((c) => (c.estado === "enviada" || c.estado === "recebida_parcial" || c.estado === "rascunho") && c.itens.some((i) => i.sku === p.id && i.recebido < i.qtd)) : []
  const ultimas = p ? movs.filter((m) => m.sku === p.id).slice(0, 5) : []

  return (
    <FolhaDeDetalhe
      aberto={!!p}
      aoFechar={aoFechar}
      sobre={p ? `${p.id} · ${p.categoria}` : undefined}
      titulo={p?.nome ?? ""}
      selos={p && <SeloProduto p={p} compras={cmps} detalhe />}
      rodape={p && mexe && p.ativo && modo === "ver" && (
        <>
          <BotaoLiquido onClick={() => setModo("ajustar")}><SlidersHorizontal className="size-4" /> Ajustar saldo</BotaoLiquido>
          <Button variant="outline" onPress={() => setModo("transferir")} isDisabled={p.saldo.pampulha + p.saldo.contagem === 0}><ArrowLeftRight /> Transferir</Button>
        </>
      )}
    >
      {p && (
        <>
          <section aria-label="Saldo por unidade" className="grid grid-cols-2 gap-2">
            {UNIDADES_ESTOQUE.map((u) => (
              <Superficie key={u} className="grid gap-1 p-3">
                <span className="text-xs text-muted-foreground">{UNIDADES[u].nome}</span>
                <span className="t-kpi">{numero(p.saldo[u])}</span>
              </Superficie>
            ))}
          </section>

          {modo === "ajustar" && (
            <section aria-label="Ajustar saldo" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
              <h3 className="t-card">Ajustar saldo</h3>
              <Suspense fallback={null}><FormAjuste p={p} aoTerminar={() => setModo("ver")} /></Suspense>
            </section>
          )}
          {modo === "transferir" && <Suspense fallback={null}><FormTransferir p={p} aoTerminar={() => setModo("ver")} /></Suspense>}

          <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Reservado</dt><dd className="num">{p.reservado}</dd>
            <dt className="text-muted-foreground">Mínimo</dt><dd className="num">{p.minimo} <span className="text-xs text-muted-foreground">somando as duas unidades</span></dd>
            <dt className="text-muted-foreground">Preço</dt><dd className="num">{moeda(p.preco)}</dd>
            {veCusto && <><dt className="text-muted-foreground">Custo</dt><dd className="num">{moeda(p.custo)} {p.preco > 0 && <span className="text-xs text-muted-foreground">· margem {Math.round((1 - p.custo / p.preco) * 100)}%</span>}</dd></>}
            <dt className="text-muted-foreground">Loja online</dt><dd>{p.vendavelOnline ? "À venda no site" : "Só no balcão"}</dd>
          </dl>

          {p.avisame > 0 && (
            <p className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2 text-sm">
              <BellRing className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span><span className="num font-semibold">{p.avisame}</span> {p.avisame === 1 ? "cliente esperando" : "clientes esperando"} o aviso de chegada</span>
            </p>
          )}

          {aCaminho.length === 0 && p.ativo && estadoDoProduto(p) !== "disponivel" && (
            <p className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] px-3 py-2 text-sm text-pretty">
              Nenhuma compra aberta com este produto. {mexe ? <>Gere a compra dos baixos em <a className="link-sistema" href={url("estoque/compras/")}>Compras</a>.</> : "A gestora gera a compra dos baixos."}
            </p>
          )}
          {aCaminho.length > 0 && (
            <section aria-labelledby="compras-produto" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
              <h3 id="compras-produto" className="t-card">Compras do produto</h3>
              <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
                {aCaminho.map((c) => {
                  const item = c.itens.find((i) => i.sku === p.id)!
                  const reservas = c.reservas.filter((r) => r.sku === p.id)
                  return (
                    <li key={c.id} className="grid min-w-0 gap-1.5 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <a className="link-sistema num inline-flex min-h-10 items-center font-medium" href={url(`estoque/compras/?id=${c.id}`)}>{c.id}</a>
                        <span className="flex min-w-0 justify-end"><SeloCompra c={c} agora={agora} detalhe /></span>
                      </div>
                      <p className="text-xs text-muted-foreground"><span className="num">{item.qtd - item.recebido}</span> de <span className="num">{item.qtd}</span> a receber · {c.fornecedor}</p>
                      {reservas.map((r) => {
                        const os = oss.find((o) => o.id === r.osId)
                        return os && (
                          <p key={r.osId} className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Reservada para</span>
                            <a className="link-sistema num" href={url(`pedidos/?id=${os.id}`)}>{os.id}</a>
                            <SeloEixo p={ETAPA_OS[os.etapa]} />
                          </p>
                        )
                      })}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section aria-labelledby="movs-produto" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 id="movs-produto" className="t-card">Últimas movimentações</h3>
              <a className="link-sistema inline-flex min-h-10 items-center text-sm" href={url(`estoque/movimentacoes/?q=${p.id}`)}>Ver todas</a>
            </div>
            {ultimas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma movimentação nos últimos 30 dias.</p> : (
              <ul className="grid gap-1.5 text-sm">
                {ultimas.map((m) => (
                  <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
                    <span className="min-w-0">
                      <span className="block truncate">{TIPO_MOV[m.tipo]}{m.ref ? <span className="text-muted-foreground"> · {m.ref}</span> : null}</span>
                      <span className="block text-xs text-muted-foreground">{UNIDADES[m.unidade].nome} · <span className="num whitespace-nowrap">{dataHora(m.em, { ano: false })}</span></span>
                    </span>
                    <span className={m.qtd > 0 ? "num text-right font-semibold text-positive" : "num text-right font-semibold text-negativo-texto"}>{m.qtd > 0 ? `+${m.qtd}` : `−${Math.abs(m.qtd)}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="hist-produto" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
            <h3 id="hist-produto" className="t-card">Linha do tempo</h3>
            <LinhaDoTempo eventos={p.historico} limite={5} />
          </section>
        </>
      )}
    </FolhaDeDetalhe>
  )
}
