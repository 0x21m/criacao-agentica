// Módulo Início (5.2) · a visão do dia. Banner com sobreposição (BannerSobreposto) com a saudação, a unidade e quatro
// números; o bento avança sobre ele. O recorte segue a seção 2 (linha `ver_inicio` da MATRIZ) e cada bloco só monta
// para quem tem a capacidade dele (pode/usePode):
//   completa (dono, gestora): atenção, KPI-herói "Faturamento do mês", agenda de hoje, a receber hoje, estoque, OS por etapa;
//   balcão (atendente, só a unidade dela, sem valores do caixa): o herói vira "Pedidos de hoje" e o dinheiro vira Mensagens;
//   financeira (financeiro): só o bloco financeiro, ampliado (atenção financeira, herói, a receber, a pagar, caixa);
//   meu dia (técnico): próxima visita e o que levar, a agenda dele e as OS dele.
// Todos os números saem das coleções de Pedidos, Agenda, Clientes, Financeiro, Estoque e Mensagens (dia.ts).
// Sem dado protegido no HTML do servidor: até o papel ser conhecido (depois da hidratação), só a moldura e o esqueleto.
import { useMemo, type ReactNode } from "react"
import { CalendarPlus, Inbox, Plus, Receipt, TriangleAlert } from "lucide-react"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Carregando, ComDados, Esqueleto } from "@/components/app/estados"
import { useAberturaAcabou } from "@/components/app/Abertura"
import { BotaoLiquido, PulsoAoVivo, TextoRevelado } from "@/components/movimento"
import { useAgora } from "@/proto/relogio"
import { pode, type Capacidade } from "@/proto/permissoes"
import { formatosDaProjecao as fp } from "@/proto/projecao"
import { dataPorExtenso, moeda, numero } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { pedidos } from "@/modulos/pedidos/dados"
import { agendamentos } from "@/modulos/agenda/dados"
import { clientes } from "@/modulos/clientes/dados"
import { caixas, lancamentos, saldoHoje } from "@/modulos/financeiro/dados"
import { compras, produtos } from "@/modulos/estoque/dados"
import { conversas, mensagens } from "@/modulos/mensagens/dados"
import { nomeDaUnidade } from "@/modulos/entrada/dados"
import { ativo, useSituacoesDosModulos, type MapaDeSituacoes } from "@/modulos/registro"
import { FONTES_VAZIAS, numerosDoDia, recortar, serieRecebido, seriePedidos, type Fontes } from "../dia"
import { useQuemVe, type QuemVe, type Visao } from "../sessao"
import { AgendaDeHoje, APagar, AReceberHoje, Atencao, CaixaDoDia, Comparacao, Estoque, Heroi, itensDeAtencao, Mensagens, OSPorEtapa, type Nome } from "./blocos"
import { doTecnico, MeuDia } from "./MeuDia"
import { Entrada, ItemDaEntrada, KpiBanner, Numero } from "./pecas"

const saudacao = (d: Date) => (d.getHours() < 12 ? "Bom dia" : d.getHours() < 18 ? "Boa tarde" : "Boa noite")
const mesAnterior = (d: Date) => new Date(d.getFullYear(), d.getMonth() - 1, 1).toLocaleDateString("pt-BR", { month: "long" })
const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`

// Ligado e desligado (EST-47, P2-14): cada bloco é de um módulo e só aparece com ele ligado. O módulo desligado ou fora do
// ar some do Início inteiro: os dados dele saem das fontes (a atenção do dia e os números do banner também param de
// citá-lo) e a capacidade que abre o bloco dele responde "não" aqui.
const MODULO_DA_CAPACIDADE: Partial<Record<Capacidade, string>> = {
  ver_pedidos: "pedidos", criar_pedido: "pedidos", ver_agenda: "agenda", financeiro_painel: "financeiro", pagar: "financeiro",
  fechar_caixa: "financeiro", estoque_ver: "estoque", estoque_movimentar: "estoque", mensagens: "mensagens",
}
function soLigados(f: Fontes, sit: MapaDeSituacoes): Fontes {
  const on = (id: string) => ativo(id, sit)
  return {
    pedidos: on("pedidos") ? f.pedidos : [], agendamentos: on("agenda") ? f.agendamentos : [],
    lancamentos: on("financeiro") ? f.lancamentos : [], caixas: on("financeiro") ? f.caixas : [],
    produtos: on("estoque") ? f.produtos : [], compras: on("estoque") ? f.compras : [],
    conversas: on("mensagens") ? f.conversas : [], mensagens: on("mensagens") ? f.mensagens : [],
  }
}
/** pode() do papel, e o módulo da capacidade ligado. */
const podeLigado = (papel: QuemVe["papel"], c: Capacidade, sit: MapaDeSituacoes) => pode(papel, c) && (!MODULO_DA_CAPACIDADE[c] || ativo(MODULO_DA_CAPACIDADE[c]!, sit))

/** Bloco do bento que falha sozinho quando a barra F força o erro (EST-47): o resto da tela segue funcionando. */
type ErroEm = "estoque" | "agenda" | "caixa" | null

export default function VisaoGeral() {
  const quem = useQuemVe()
  const acabou = useAberturaAcabou()
  const agora = useAgora()
  const ps = pedidos.use(), ags = agendamentos.use(), lans = lancamentos.use(), cxs = caixas.use()
  const prods = produtos.use(), cmps = compras.use(), cvs = conversas.use(), msgs = mensagens.use(), cli = clientes.use()
  const sit = useSituacoesDosModulos()
  const nome: Nome = useMemo(() => { const m = new Map(cli.map((c) => [c.id, c.nome])); return (id: string) => m.get(id) ?? "Cliente removido" }, [cli])
  const f = useMemo(
    () => soLigados(recortar({ pedidos: ps, agendamentos: ags, lancamentos: lans, caixas: cxs, produtos: prods, compras: cmps, conversas: cvs, mensagens: msgs }, quem.unidade), sit),
    [ps, ags, lans, cxs, prods, cmps, cvs, msgs, quem.unidade, sit],
  )

  // antes de saber quem vê (servidor e hidratação): moldura e esqueleto, nenhum número
  if (!quem.conhecido) {
    return <Carregando rotulo="os números do dia"><Cabecalho quem={quem} agora={agora} acabou={acabou}><EsqueletoBento visao="completa" /></Cabecalho></Carregando>
  }
  const tela = (dados: Fontes, erroEm: ErroEm = null) => (
    <Cabecalho quem={quem} agora={agora} acabou={acabou} f={dados} nome={nome} sit={sit}>
      {quem.visao === "meu_dia"
        ? <MeuDia f={dados} eu={quem.pessoa} papel={quem.papel} agora={agora} nome={nome} iniciar={acabou} erro={erroEm === "agenda"} />
        : <Bento quem={quem} f={dados} agora={agora} nome={nome} iniciar={acabou} erroEm={erroEm} sit={sit} />}
    </Cabecalho>
  )
  const erroEm: ErroEm = quem.visao === "financeira" ? "caixa" : quem.visao === "meu_dia" ? "agenda" : "estoque"
  return (
    <ComDados
      capacidade="ver_inicio" area="da operação" rotulo="os números do dia"
      esqueleto={<Cabecalho quem={quem} agora={agora} acabou={acabou}><EsqueletoBento visao={quem.visao} /></Cabecalho>}
      erro={tela(f, erroEm)}
      estaVazio={f.pedidos.length === 0 && f.agendamentos.length === 0 && f.lancamentos.length === 0}
      vazio={tela(FONTES_VAZIAS)}
    >
      {() => tela(f)}
    </ComDados>
  )
}

// ===================================================== bento =====================================================
function Bento({ quem, f, agora, nome, iniciar, erroEm, sit }: { quem: QuemVe; f: Fontes; agora: Date; nome: Nome; iniciar: boolean; erroEm: ErroEm; sit: MapaDeSituacoes }) {
  const { papel, visao } = quem
  const pd = (c: Capacidade) => podeLigado(papel, c, sit)
  const n = numerosDoDia(f, agora)
  const financeira = visao === "financeira"
  const itens = itensDeAtencao(f, agora, papel, nome, financeira)
  // o herói com dinheiro só para quem abre o financeiro; o balcão vê o mesmo herói com a contagem de OS
  const heroiDinheiro = visao !== "balcao" && pd("financeiro_painel")
  const heroi = heroiDinheiro ? (
    <Heroi titulo="Faturamento do mês" icone={Receipt} formato="moeda" formatoPonto={moeda}
      serie={(p) => serieRecebido(f.lancamentos, p, agora)}
      rotuloNumero={(p) => (p === "mes" ? `Recebido de 1º a ${fp.d(agora.toISOString())}` : "Recebido nos últimos 7 dias")}
      detalhe={(p) => (p === "mes"
        ? <Comparacao atual={serieRecebido(f.lancamentos, "mes", agora).dados.reduce((s, v) => s + v, 0)} anterior={n.entradasAnterior} mes={mesAnterior(agora)} />
        : <span>{plural(n.nReceberHoje, "título vence", "títulos vencem")} hoje</span>)} />
  ) : pd("ver_pedidos") ? (
    <Heroi titulo="Pedidos de hoje" icone={Inbox} formato="numero" formatoPonto={(v) => plural(v, "OS", "OS")}
      serie={(p) => seriePedidos(f.pedidos, p, agora)} numero={() => n.pedidosHoje}
      rotuloNumero={() => "OS criadas hoje"}
      detalhe={() => <span>{plural(n.abertas, "OS em andamento", "OS em andamento")} na unidade</span>} />
  ) : null
  const col = financeira ? "md:col-span-3 xl:col-span-4" : "md:col-span-3 xl:col-span-3"
  return (
    <Entrada iniciar={iniciar} className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-6 md:gap-4 xl:grid-cols-12">
      {/* o primeiro bloco é o herói (Faturamento do mês para dono e gestora, P2-12); a atenção do dia vem ao lado */}
      {heroi && <ItemDaEntrada className="md:col-span-6 xl:col-span-8">{heroi}</ItemDaEntrada>}
      <ItemDaEntrada className="md:col-span-6 xl:col-span-4"><Atencao itens={itens} /></ItemDaEntrada>

      {financeira ? (
        <>
          {pd("financeiro_painel") && <ItemDaEntrada className="md:col-span-6 xl:col-span-4"><AReceberHoje n={n} f={f} agora={agora} /></ItemDaEntrada>}
          {pd("pagar") && <ItemDaEntrada className={col}><APagar n={n} f={f} agora={agora} /></ItemDaEntrada>}
          {pd("fechar_caixa") && <ItemDaEntrada className={col}><CaixaDoDia f={f} unidade={quem.unidade} agora={agora} erro={erroEm === "caixa"} /></ItemDaEntrada>}
        </>
      ) : (
        <>
          {pd("ver_agenda") && <ItemDaEntrada className="md:col-span-6 xl:col-span-6"><AgendaDeHoje f={f} unidade={quem.unidade} agora={agora} nome={nome} podeCriar={pd("criar_pedido")} /></ItemDaEntrada>}
          {visao === "balcao"
            ? pd("mensagens") && <ItemDaEntrada className={col}><Mensagens f={f} nome={nome} /></ItemDaEntrada>
            : pd("financeiro_painel") && <ItemDaEntrada className={col}><AReceberHoje n={n} f={f} agora={agora} /></ItemDaEntrada>}
          {pd("estoque_ver") && <ItemDaEntrada className={col}><Estoque f={f} agora={agora} erro={erroEm === "estoque"} /></ItemDaEntrada>}
          {pd("ver_pedidos") && <ItemDaEntrada className="md:col-span-6 xl:col-span-12"><OSPorEtapa f={f} agora={agora} /></ItemDaEntrada>}
        </>
      )}
    </Entrada>
  )
}

// ===================================================== banner =====================================================
function Cabecalho({ quem, agora, acabou, f, nome, sit, children }: { quem: QuemVe; agora: Date; acabou: boolean; f?: Fontes; nome?: Nome; sit?: MapaDeSituacoes; children: ReactNode }) {
  const { papel, visao, conhecido } = quem
  const primeiro = quem.pessoa.curto
  const titulo = conhecido ? `${saudacao(agora)}, ${primeiro}` : saudacao(agora)
  const n = f ? numerosDoDia(f, agora) : null
  const tec = f && visao === "meu_dia" ? doTecnico(f, quem.pessoa, agora) : null
  const trocaUnidade = conhecido && pode(papel, "trocar_unidade")

  let frase: ReactNode = <span>Carregando os números do dia…</span>
  if (n && f && nome) {
    if (tec) frase = tec.proxima
      ? <span>{tec.proxima.estado === "em_atendimento" ? "Em atendimento agora: " : `Próxima visita às ${fp.h(tec.proxima.inicio)}: `}<b className="font-medium text-foreground">{nome(tec.proxima.clienteId)}</b>.</span>
      : <span>{!tec.hoje.length ? "Nenhuma visita na sua agenda hoje." : tec.hoje.every((a) => a.estado === "concluido") ? "Todas as visitas de hoje foram concluídas." : "Nenhuma visita a fazer agora."}</span>
    else if (visao === "financeira") frase = n.nReceberVencido
      ? <Alerta caminho="financeiro/receber/">{plural(n.nReceberVencido, "título vencido a receber", "títulos vencidos a receber")}, <span className="num whitespace-nowrap">{moeda(n.receberVencido)}</span>.</Alerta>
      : <span>Nada vencido a receber.</span>
    else frase = n.atrasadas
      ? <Alerta caminho={pode(papel, "ver_pedidos") ? "pedidos/?atrasados=1" : undefined}>{n.atrasadas} {n.atrasadas === 1 ? "OS atrasada pede" : "OS atrasadas pedem"} atenção hoje.</Alerta>
      : <span>Tudo em dia por aqui.</span>
  }

  const todosOsKpis: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; modulo: string }[] = !n ? [] : tec ? [
    { rotulo: "Visitas hoje", valor: <Numero valor={tec.hoje.length} />, detalhe: tec.hoje.length ? plural(tec.concluidas, "concluída", "concluídas") : "agenda livre", modulo: "agenda" },
    { rotulo: "Minhas OS", valor: <Numero valor={tec.abertas.length} />, detalhe: tec.atrasadas ? plural(tec.atrasadas, "atrasada", "atrasadas") : "em dia", modulo: "pedidos" },
    ...(pode(papel, "mensagens") ? [{ rotulo: "Mensagens", valor: <Numero valor={tec.naoLidas} />, detalhe: tec.naoLidas === 1 ? "não lida" : "não lidas", modulo: "mensagens" }] : []),
  ] : visao === "financeira" ? [
    quem.unidade === "todas"
      ? { rotulo: "Saldo em conta", valor: <Numero valor={saldoHoje(f!.lancamentos, agora)} formato="moedaCompacta" />, detalhe: "realizado até agora", modulo: "financeiro" }
      : { rotulo: "Recebido no mês", valor: <Numero valor={n.entradas} formato="moedaCompacta" />, detalhe: `até ${fp.d(agora.toISOString())}`, modulo: "financeiro" },
    { rotulo: "Recebido hoje", valor: <Numero valor={n.recebidoHoje} formato="moedaCompacta" />, detalhe: `${plural(n.nReceberHoje, "título vence", "títulos vencem")} hoje`, modulo: "financeiro" },
    { rotulo: "Vencidos", valor: <Numero valor={n.receberVencido} formato="moedaCompacta" />, detalhe: plural(n.nReceberVencido, "título a receber", "títulos a receber"), modulo: "financeiro" },
    { rotulo: "A pagar", valor: <Numero valor={n.aPagar} formato="moedaCompacta" />, detalhe: n.nPagarVencido ? `${plural(n.nPagarVencido, "vencida", "vencidas")}` : "nada vencido", modulo: "financeiro" },
  ] : [
    { rotulo: "Visitas hoje", valor: <Numero valor={n.visitasHoje} />, detalhe: n.emAtendimento ? `${numero(n.emAtendimento)} em atendimento` : plural(n.concluidasHoje, "concluída", "concluídas"), modulo: "agenda" },
    { rotulo: "OS em execução", valor: <Numero valor={n.emExecucao} />, detalhe: "na oficina", modulo: "pedidos" },
    { rotulo: "Orçamentos", valor: <Numero valor={n.aguardandoCliente} />, detalhe: "aguardando o cliente", modulo: "pedidos" },
    visao !== "balcao" && pode(papel, "financeiro_painel")
      ? { rotulo: "Recebido hoje", valor: <Numero valor={n.recebidoHoje} formato="moedaDoDia" />, detalhe: "caixa, cartão e Pix", modulo: "financeiro" }
      : { rotulo: "Pedidos de hoje", valor: <Numero valor={n.pedidosHoje} />, detalhe: "OS criadas hoje", modulo: "pedidos" },
  ]
  const kpis = todosOsKpis.filter((k) => !sit || ativo(k.modulo, sit))

  return (
    <div className="pb-6">
      <BannerSobreposto
        titulo={<TextoRevelado como="span" texto={titulo} iniciar={acabou} />}
        descricao={
          <span className="grid gap-1">
            <span className="first-letter:uppercase">{dataPorExtenso(agora)}</span>
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              {conhecido && (
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span>{nomeDaUnidade(quem.unidade)}</span>
                  {trocaUnidade && <a href={url("entrar/unidade/")} aria-label="Trocar de unidade" className="link-sistema -my-3 inline-flex min-h-10 items-center font-medium text-foreground">Trocar</a>}
                </span>
              )}
              <PulsoAoVivo rotulo="Ao vivo" />
            </span>
            {frase}
          </span>
        }
        acoes={conhecido && <Acoes quem={quem} />}
        conteudoDoBanner={!f ? <KpisEsqueleto /> : (
          // no banner escuro, os números ficam num painel de vidro (.kpis-banner): o shader não tira o contraste. Três números
          // só lado a lado a partir de 360 px: em 320 o rótulo ("Visitas hoje") cortava
          <dl className={cn("kpis-banner grid gap-x-5 gap-y-3 @3xl/banner:ml-auto @3xl/banner:mr-2 @3xl/banner:flex @3xl/banner:gap-x-6", kpis.length === 3 ? "grid-cols-2 min-[360px]:grid-cols-3" : "grid-cols-2")}>
            {kpis.map((k) => <KpiBanner key={k.rotulo} rotulo={k.rotulo} detalhe={k.detalhe}>{k.valor}</KpiBanner>)}
          </dl>
        )}
        sobreposicao={56}
      >
        {children}
      </BannerSobreposto>
    </div>
  )
}

function Alerta({ children, caminho }: { children: ReactNode; caminho?: string }) {
  const corpo = <><TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-[var(--alerta)]" aria-hidden="true" /><span>{children}</span></>
  return caminho
    ? <a href={url(caminho)} className="link-sistema inline-flex min-h-10 items-center gap-1.5 self-start text-foreground">{corpo}</a>
    : <span className="inline-flex items-start gap-1.5">{corpo}</span>
}

/** Atalhos do cabeçalho (5.2): Nova OS (principal) e Novo agendamento; o financeiro vai direto ao receber. */
function Acoes({ quem }: { quem: QuemVe }) {
  const { papel, visao } = quem
  if (visao === "financeira") return pode(papel, "financeiro_painel") ? <BotaoLiquido href={url("financeiro/receber/")}><Receipt className="size-4" /> Receber</BotaoLiquido> : null
  if (!pode(papel, "criar_pedido")) return null
  return (
    <>
      {pode(papel, "ver_agenda") && (
        <BotaoLiquido href={url("agenda/")} variante="outline" aria-label="Novo agendamento" title="Novo agendamento" className="size-10 rounded-full p-0">
          <CalendarPlus className="size-4" />
        </BotaoLiquido>
      )}
      <BotaoLiquido href={url("pedidos/novo/")}><Plus className="size-4" /> Nova OS</BotaoLiquido>
    </>
  )
}

// ===================================================== esqueletos =====================================================
function KpisEsqueleto() {
  return (
    <div aria-hidden="true" className="kpis-banner grid grid-cols-2 gap-x-5 gap-y-3 @3xl/banner:ml-auto @3xl/banner:mr-2 @3xl/banner:flex @3xl/banner:gap-x-8">
      {[0, 1, 2, 3].map((i) => <div key={i} className="grid gap-1.5"><Esqueleto className="h-3 w-20" /><Esqueleto className="h-7 w-16" /><Esqueleto className="h-3 w-24" /></div>)}
    </div>
  )
}

/** A forma real do bento de cada recorte, para a troca não pular. */
/** Uma caixa do esqueleto com a forma de um bloco: título, número e linhas. */
function CaixaEsqueleto({ className }: { className?: string }) {
  return (
    <div className={cn("sup flex flex-col gap-3 rounded-[var(--raio-sup,var(--radius-xl))] p-4 md:p-5", className)} data-nivel="card">
      <Esqueleto className="h-4 w-32" /><Esqueleto className="h-8 w-24" />
      <Esqueleto className="mt-auto h-3 w-full" /><Esqueleto className="h-3 w-4/5" /><Esqueleto className="h-3 w-3/5" />
    </div>
  )
}

function EsqueletoBento({ visao }: { visao: Visao }) {
  const r = ""
  if (visao === "meu_dia") return (
    <div className="grid gap-3 md:gap-4 lg:grid-cols-12">
      <CaixaEsqueleto className={cn("h-80 lg:col-span-7", r)} /><CaixaEsqueleto className={cn("h-80 lg:col-span-5", r)} /><CaixaEsqueleto className={cn("h-56 lg:col-span-12", r)} />
    </div>
  )
  return (
    <div className="grid gap-3 md:grid-cols-6 md:gap-4 xl:grid-cols-12">
      <CaixaEsqueleto className={cn("h-[22rem] md:col-span-6 xl:col-span-4", r)} />
      <CaixaEsqueleto className={cn("h-[22rem] md:col-span-6 xl:col-span-8", r)} />
      <CaixaEsqueleto className={cn("h-72 md:col-span-6", r, visao === "financeira" ? "xl:col-span-4" : "xl:col-span-6")} />
      <CaixaEsqueleto className={cn("h-72 md:col-span-3", r, visao === "financeira" ? "xl:col-span-4" : "xl:col-span-3")} />
      <CaixaEsqueleto className={cn("h-72 md:col-span-3", r, visao === "financeira" ? "xl:col-span-4" : "xl:col-span-3")} />
    </div>
  )
}

