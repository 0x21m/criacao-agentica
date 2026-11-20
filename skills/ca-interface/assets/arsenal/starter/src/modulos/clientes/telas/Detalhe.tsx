// O cliente inteiro (?id=C-0007): banner curto da marca com a identidade (nome, tipo, etiquetas, "Cliente desde") e o
// resumo sobreposto (gasto total, OS abertas, a receber, com NumeroAnimado); faixa do pedido de exclusão (Portal) ou
// do anonimizado; abas Resumo · Pedidos · Agenda · Financeiro · Mensagens · Notas · Histórico, com a aba na URL.
// Cada aba lê a coleção do dono e some para quem não pode vê-la. As camadas (editar, mesclar, anonimizar) baixam
// só quando abrem.
import { Suspense, lazy, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CalendarCheck, Copy, FileText, Mail, MapPin, Pencil, Phone, Plus, ShieldAlert, ShieldOff, Tag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Superficie } from "@/components/sistema/Superficie"
import { SeloEixo } from "@/components/base/selos"
import { Email } from "@/components/base/texto"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { BotaoLiquido, NumeroAnimado } from "@/components/movimento"
import { marcarAberto, usePendentes, useProcessando, type Colecao, type Registro } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { pode, usePapel } from "@/proto/permissoes"
import { CLIENTE } from "@/proto/projecao"
import { emAberto as osEmAberto, pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { emAberto, lancamentos } from "@/modulos/financeiro/dados"
import { conversas, mensagens, ultimaPorConversa } from "@/modulos/mensagens/dados"
import { dataHora, dataLonga } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { clientes, duplicadosDe, exclusaoPendente, type Cliente } from "../dados"
import { iniciais } from "./Lista"
import { AbaAgenda, AbaFinanceiro, AbaHistorico, AbaMensagens, AbaNotas, AbaPedidos } from "./Abas"
import type { QualDialogo } from "./Dialogos"

const Dialogos = lazy(() => import("./Dialogos"))

export const ABAS = ["resumo", "pedidos", "agenda", "financeiro", "mensagens", "notas", "historico"] as const
export type Aba = (typeof ABAS)[number]

export function Detalhe({ c, aba, setAba, onVoltar, abrir }: { c: Cliente; aba: string; setAba: (a: string) => void; onVoltar: () => void; abrir: (id: string | null) => void }) {
  const [dialogo, setDialogo] = useState<QualDialogo>(null)
  const [usouDialogo, setUsouDialogo] = useState(false)
  const pendentes = usePendentes()
  const processando = useProcessando()
  const papel = usePapel()
  const agora = useAgora()
  const todos = clientes.use()
  const ps = pedidos.use()
  const ags = agendamentos.use()
  const lans = lancamentos.use()
  const cvs = conversas.use()
  const ms = mensagens.use()
  useEffect(() => { marcarAberto(clientes as unknown as Colecao<Registro>, c.id); return () => marcarAberto(null) }, [c.id])

  const os = useMemo(() => ps.filter((p) => p.clienteId === c.id), [ps, c.id])
  const horarios = useMemo(() => ags.filter((a) => a.clienteId === c.id), [ags, c.id])
  const cobrancas = useMemo(() => lans.filter((l) => l.clienteId === c.id && l.natureza === "receber" && l.estado !== "cancelado"), [lans, c.id])
  const minhasConversas = useMemo(() => cvs.filter((x) => x.clienteId === c.id), [cvs, c.id])
  const ultima = useMemo(() => ultimaPorConversa(ms), [ms])
  const duplicados = useMemo(() => duplicadosDe(c, todos), [c, todos])

  const anonimo = c.estado === "anonimizado"
  const exclusao = exclusaoPendente(c)
  const veFinanceiro = pode(papel, "financeiro_ver")
  const veMensagens = pode(papel, "mensagens")
  const veNotas = pode(papel, "nota_interna")
  const podeEditar = pode(papel, "editar_cliente") && !anonimo
  const podeAnonimizar = pode(papel, "anonimizar") && !anonimo

  // gasto total: OS pagas + vendas pagas (cobranças pagas que não são de OS, para não contar duas vezes)
  const gasto = os.filter((p) => p.pagamento === "pago" && p.etapa !== "cancelada").reduce((s, p) => s + p.total, 0)
    + cobrancas.filter((l) => l.estado === "pago" && !l.estornadoPor && !l.ref?.startsWith("OS-")).reduce((s, l) => s + l.valor, 0)
  const abertas = os.filter(osEmAberto).length
  const aReceber = cobrancas.filter(emAberto).reduce((s, l) => s + l.valor, 0)
  const dias = c.ultimaCompraEm ? Math.max(0, Math.round((agora.getTime() - new Date(c.ultimaCompraEm).getTime()) / 864e5)) : undefined
  const desde = new Date(c.criadoEm).getFullYear()

  const abas: { id: Aba; rotulo: string; n?: number }[] = [
    { id: "resumo", rotulo: "Resumo" },
    { id: "pedidos", rotulo: "Pedidos", n: os.length },
    { id: "agenda", rotulo: "Agenda", n: horarios.length },
    ...(veFinanceiro ? [{ id: "financeiro" as const, rotulo: "Financeiro", n: cobrancas.length }] : []),
    ...(veMensagens ? [{ id: "mensagens" as const, rotulo: "Mensagens", n: minhasConversas.length }] : []),
    ...(veNotas && !anonimo ? [{ id: "notas" as const, rotulo: "Notas" }] : []),
    { id: "historico", rotulo: "Histórico" },
  ]
  const abaAtual = abas.some((a) => a.id === aba) ? aba : "resumo"
  const abrirDialogo = (q: QualDialogo) => { setUsouDialogo(true); setDialogo(q) }

  const menu: ItemMenu[] = [
    ...(podeEditar ? [{ rotulo: "Mesclar com outro cadastro…", icone: Copy, aoEscolher: () => abrirDialogo("mesclar") }] : []),
    ...(podeAnonimizar ? [{ rotulo: "Anonimizar (LGPD)…", icone: Trash2, perigo: true, separadorAntes: podeEditar, aoEscolher: () => abrirDialogo("anonimizar") }] : []),
  ]
  const ocupado = pendentes.has(c.id) || processando.has(c.id)

  return (
    <Superficie className={cn("overflow-hidden transition-opacity", ocupado && "opacity-70")} aria-busy={ocupado || undefined}>
      {/* banner curto com a identidade do registro; o resumo avança sobre ele */}
      <div aria-hidden="true" className="faixa-marca h-20 md:h-24" />
      <div className="relative -mt-9 grid gap-5 px-4 pb-5 md:px-5">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit lg:hidden" onPress={onVoltar}><ArrowLeft /> Voltar para a lista</Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-1 basis-64 items-start gap-4">
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-[calc(var(--radius)*1.3)] bg-primary font-display text-2xl font-semibold text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_0_0_4px_var(--sup-veu),0_10px_24px_-10px_var(--primary)]">{iniciais(c.nome) || "?"}</span>
            <div className="min-w-0 pt-10">
              <h2 className="t-pagina text-balance break-words">{c.nome}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="num whitespace-nowrap">{c.id} ·</span><span className="whitespace-nowrap">{c.tipo === "pj" ? "Empresa" : "Pessoa física"} ·</span>
                <span className="whitespace-nowrap">Cliente desde <span className="num">{desde}</span></span>
                <SeloEixo p={CLIENTE[c.estado]} ctx={{ dias, canal: c.origem, quando: c.anonimizadoEm }} detalhe />
              </p>
              {c.etiquetas.length > 0 && (
                <ul aria-label="Etiquetas" className="mt-2 flex flex-wrap gap-1.5">
                  {c.etiquetas.map((e) => <li key={e} className="inline-flex max-w-full items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--foreground)_7%,transparent)] px-2.5 py-1 text-xs"><Tag className="size-3 shrink-0" aria-hidden="true" /><span className="truncate">{e}</span></li>)}
                </ul>
              )}
            </div>
          </div>
          {!anonimo && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {podeEditar && <Button variant="outline" onPress={() => abrirDialogo("editar")}><Pencil /> Editar</Button>}
              {pode(papel, "criar_pedido") && <BotaoLiquido href={url(`pedidos/novo/?cliente=${c.id}`)}><Plus className="size-4" /> Nova OS</BotaoLiquido>}
              {menu.length > 0 && <MenuDaLinha rotulo={`Mais ações de ${c.nome}`} itens={menu} />}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-y-3 border-y border-[color-mix(in_oklch,var(--foreground)_7%,transparent)] py-4">
          <div className="min-w-0"><dt className="t-rotulo">Gasto total</dt><dd className="t-kpi mt-1 text-2xl"><NumeroAnimado valor={gasto} formato="moedaInteira" /></dd></div>
          <div className="min-w-0"><dt className="t-rotulo">OS abertas</dt><dd className="t-kpi mt-1 text-2xl"><NumeroAnimado valor={abertas} /></dd></div>
          {veFinanceiro && <div className="min-w-0 max-sm:col-span-2"><dt className="t-rotulo">A receber</dt><dd className={cn("t-kpi mt-1 text-2xl", aReceber > 0 && "text-alerta-texto")}><NumeroAnimado valor={aReceber} formato="moedaInteira" /></dd></div>}
        </dl>

        {anonimo && (
          <p role="status" className="flex items-start gap-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm text-pretty">
            <ShieldOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Cliente anonimizado em <span className="num">{c.anonimizadoEm ? dataLonga(c.anonimizadoEm) : "—"}</span> a pedido do titular. Ficam só as OS e as notas fiscais exigidas por lei.</span>
          </p>
        )}
        {exclusao && <FaixaExclusao c={c} exclusao={exclusao} agora={agora} podeAnonimizar={podeAnonimizar} aoAnonimizar={() => abrirDialogo("anonimizar")} />}

        <Tabs selectedKey={abaAtual} onSelectionChange={(k) => setAba(k === "resumo" ? "" : String(k))} className="min-w-0 gap-4">
          <div data-rolagem-permitida className="-mx-4 overflow-x-auto px-4 md:-mx-5 md:px-5 [scrollbar-width:none]">
            <TabsList variant="line" aria-label="Partes do cliente" className="w-max flex-nowrap">
              {abas.map((a) => (
                <TabsTrigger key={a.id} id={a.id} className="min-h-9 flex-none px-2.5 pointer-coarse:min-h-10">
                  {a.rotulo}{a.n !== undefined && <span className="num text-xs text-muted-foreground">{a.n}</span>}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent id="resumo">
            <Resumo c={c} duplicados={duplicados.length} podeEditar={podeEditar} aoMesclar={() => abrirDialogo("mesclar")} proxima={horarios.filter((a) => (a.estado === "confirmado" || a.estado === "solicitado") && new Date(a.inicio) >= agora).sort((a, b) => a.inicio.localeCompare(b.inicio))[0]?.inicio} />
          </TabsContent>
          <TabsContent id="pedidos"><AbaPedidos c={c} lista={os} agora={agora} /></TabsContent>
          <TabsContent id="agenda"><AbaAgenda c={c} lista={horarios} /></TabsContent>
          {veFinanceiro && <TabsContent id="financeiro"><AbaFinanceiro c={c} lista={cobrancas} agora={agora} /></TabsContent>}
          {veMensagens && <TabsContent id="mensagens"><AbaMensagens c={c} lista={minhasConversas} ultima={ultima} /></TabsContent>}
          {veNotas && !anonimo && <TabsContent id="notas"><AbaNotas c={c} /></TabsContent>}
          <TabsContent id="historico"><AbaHistorico c={c} pedidos={os} agendamentos={horarios} /></TabsContent>
        </Tabs>
      </div>
      {usouDialogo && (
        <Suspense fallback={null}>
          <Dialogos qual={dialogo} c={c} aoFechar={() => setDialogo(null)} aoSair={abrir} />
        </Suspense>
      )}
    </Superficie>
  )
}

function FaixaExclusao({ c, exclusao, agora, podeAnonimizar, aoAnonimizar }: {
  c: Cliente; exclusao: { em: string; ate: string }; agora: Date; podeAnonimizar: boolean; aoAnonimizar: () => void
}) {
  const vencido = new Date(exclusao.ate) < agora
  const nome = c.tipo === "pj" ? c.nome : c.nome.split(" ")[0]
  return (
    <div role="status" className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm",
      vencido ? "bg-negative/12" : "bg-[color-mix(in_oklch,var(--alerta)_14%,transparent)]")}>
      <ShieldAlert className={cn("size-4 shrink-0", vencido ? "text-negativo-texto" : "text-alerta-texto")} aria-hidden="true" />
      <p className="min-w-0 flex-1 basis-60 text-pretty">
        <span className="font-medium">{nome} pediu a exclusão dos dados pelo portal</span> em <span className="num">{dataHora(exclusao.em, { ano: false })}</span>.{" "}
        {vencido ? <>O prazo venceu em <span className="num">{dataLonga(exclusao.ate)}</span>.</> : <>Atenda até <span className="num">{dataLonga(exclusao.ate)}</span> (15 dias, LGPD).</>}
      </p>
      {podeAnonimizar
        ? <Button size="sm" variant="destructive" onPress={aoAnonimizar}><Trash2 /> Anonimizar agora</Button>
        : <span className="text-xs text-muted-foreground">Quem anonimiza é a gestora ou o dono.</span>}
    </div>
  )
}

function Resumo({ c, duplicados, podeEditar, aoMesclar, proxima }: { c: Cliente; duplicados: number; podeEditar: boolean; aoMesclar: () => void; proxima?: string }) {
  if (c.estado === "anonimizado") return <p className="text-sm text-muted-foreground text-pretty">Os dados pessoais foram apagados. As OS, os horários e as cobranças continuam nas outras abas.</p>
  const end = c.endereco
  const enderecoTexto = `${end.logradouro}, ${end.numero}${end.complemento ? `, ${end.complemento}` : ""} · ${end.bairro}, ${end.cidade}/${end.uf} · ${end.cep}`
  const caixa = "min-w-0 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-3 shadow-[inset_0_0_0_1px_var(--sup-aro)]"
  return (
    <div className="grid gap-4">
      {duplicados > 0 && podeEditar && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--primary)_8%,transparent)] px-3 py-2.5 text-sm">
          <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 basis-56 text-pretty">{duplicados === 1 ? "Há 1 cadastro parecido com este" : `Há ${duplicados} cadastros parecidos com este`} (mesmo telefone, documento, e-mail ou nome).</p>
          <Button size="sm" variant="outline" onPress={aoMesclar}>Ver e mesclar</Button>
        </div>
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        {[
          { i: Mail, r: "E-mail", v: <Email email={c.email} /> },
          { i: Phone, r: "Telefone", v: <span className="num">{c.telefone}{c.whatsappConsentido ? <span className="text-muted-foreground"> · WhatsApp</span> : null}</span> },
          { i: FileText, r: c.tipo === "pj" ? "CNPJ" : "CPF", v: <span className="num whitespace-nowrap">{c.documento}</span> },
        ].map((x) => (
          <div key={x.r} className={caixa}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><x.i className="size-3.5" aria-hidden="true" /> {x.r}</dt>
            <dd className="mt-1 min-w-0">{x.v}</dd>
          </div>
        ))}
        <div className={cn(caixa, "sm:col-span-2", !proxima && "xl:col-span-3")}>
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" /> Endereço</dt>
          <dd className="mt-1 text-pretty break-words">{enderecoTexto}</dd>
        </div>
        {proxima && (
          <div className={cn(caixa, "sm:col-span-2 xl:col-span-1")}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarCheck className="size-3.5" aria-hidden="true" /> Próximo horário</dt>
            <dd className="num mt-1">{dataHora(proxima, { ano: false })}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
