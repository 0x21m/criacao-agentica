// Módulo Equipe (5.10) · /equipe/: as pessoas em TabelaDados (pessoa, papel, unidade, estado, último acesso) com busca e
// filtros na URL (?q=&papel=&estado=), a pessoa numa FolhaDeDetalhe (?id=PES-11) e o diálogo "Convidar".
// Classes (seção 5.10): convidar, reenviar, mudar papel, suspender e reativar são P; cancelar convite é O + Desfazer.
// Quem não abre a equipe (PON-20) vê só o estado sem permissão: nenhuma linha, nenhum nome; o financeiro ganha o atalho
// para a auditoria financeira, que é dele.
import { useMemo, useState } from "react"
import { Ban, History, MailPlus, SearchX, ShieldCheck, UserCheck, UserPlus, UsersRound, X } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ComDados, EstadoSemPermissao, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { MenuDaLinha, type ItemMenu } from "@/components/base/MenuDaLinha"
import { LinhaDoTempo } from "@/components/base/LinhaDoTempo"
import { SeloEixo } from "@/components/base/selos"
import { Email } from "@/components/base/texto"
import { BotaoLiquido } from "@/components/movimento"
import { usePendentes, useProcessando } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { UNIDADES, COMPETENCIA, pessoaPorId, type Unidade } from "@/proto/negocio"
import { MATRIZ, PAPEIS, nomeDoPapel, pessoaDoPapel, pode, usePapel, type Capacidade, type Papel } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { normalizar } from "@/modulos/registro"
import { cn } from "@/lib/utils"
import {
  ESTADO_MEMBRO, cancelarConvite, convidar, definirSuspensao, equipe, mudarPapel, papeisQueConvida, perdasAoTrocar, podeGerir,
  reenviarConvite, validarConvite, type EstadoMembro, type Membro,
} from "../dados"
import { AvatarPessoa, CabecalhoEquipe, quandoCurto } from "./comum"

// ?funcao= (não ?papel=, que é o "Ver como" da barra F)
const PADRAO = { q: "", funcao: "todos", estado: "todos", id: "" }
const nomeUnidade = (u: Unidade | "todas") => (u === "todas" ? "Todas" : UNIDADES[u].nome)
const ctxEstado = (m: Membro) => ({ quando: m.estado === "convidado" ? m.convidadoEm : m.suspensoEm })
/** Último acesso; para o convite, quando foi enviado ("convite 13/11"). */
const acessoCurto = (m: Membro, agora: Date) => m.estado === "convidado"
  ? `convite ${m.convidadoEm ? new Date(m.convidadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}`.trim()
  : quandoCurto(m.ultimoAcesso, agora)
const ESTADOS: { id: EstadoMembro; rotulo: string }[] = [
  { id: "ativo", rotulo: ESTADO_MEMBRO.ativo.rotulo }, { id: "convidado", rotulo: ESTADO_MEMBRO.convidado.rotulo }, { id: "suspenso", rotulo: ESTADO_MEMBRO.suspenso.rotulo },
]

export default function Pessoas() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const todos = equipe.use()
  const papel = usePapel()
  const [convidando, setConvidando] = useState(false)
  const lista = useMemo(() => {
    const t = normalizar(f.q.trim())
    return todos.filter((m) => (f.funcao === "todos" || m.papel === f.funcao) && (f.estado === "todos" || m.estado === f.estado) &&
      (!t || normalizar(m.nome).includes(t) || normalizar(m.email).includes(t)))
  }, [todos, f])
  const filtrado = f.q !== "" || f.funcao !== "todos" || f.estado !== "todos"
  const limpar = () => setF({ q: "", funcao: "todos", estado: "todos" })
  const pendentes = todos.filter((m) => m.estado === "convidado").length
  const veEquipe = pode(papel, "equipe_ver")
  const convida = papeisQueConvida(papel).length > 0
  const rotuloFiltro = [f.funcao !== "todos" && nomeDoPapel(f.funcao as Papel), f.estado !== "todos" && ESTADO_MEMBRO[f.estado as EstadoMembro]?.rotulo, f.q && `“${f.q}”`].filter(Boolean).join(" · ")
  const botaoConvidar = <BotaoLiquido onClick={() => setConvidando(true)}><UserPlus className="size-4" /> Convidar</BotaoLiquido>

  return (
    <>
      <CabecalhoEquipe
        tela="pessoas"
        titulo="Equipe e permissões"
        descricao="Quem trabalha aqui e o que cada um acessa"
        contagem={veEquipe ? (filtrado ? `${lista.length} de ${todos.length}` : `${todos.length} pessoas${pendentes ? ` · ${pendentes} ${pendentes === 1 ? "convite" : "convites"}` : ""}`) : undefined}
        acoes={veEquipe && convida && botaoConvidar}
      >
        {veEquipe && (
          <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar pessoa" placeholder="Buscar nome ou e-mail" filtrado={filtrado} aoLimpar={limpar}>
            <Select aria-label="Filtrar por papel" selectedKey={f.funcao} onSelectionChange={(k) => setF({ funcao: String(k) })} className="w-[calc(50%-0.25rem)] sm:w-44">
              <SelectTrigger className="h-10 rounded-full"><SelectValue className="!block truncate" /></SelectTrigger>
              <SelectContent>
                <SelectItem id="todos">Papel: todos</SelectItem>
                {PAPEIS.map((p) => <SelectItem key={p.id} id={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select aria-label="Filtrar por estado" selectedKey={f.estado} onSelectionChange={(k) => setF({ estado: String(k) })} className="w-[calc(50%-0.25rem)] sm:w-48">
              <SelectTrigger className="h-10 rounded-full"><SelectValue className="!block truncate" /></SelectTrigger>
              <SelectContent>
                <SelectItem id="todos">Estado: todos</SelectItem>
                {ESTADOS.map((e) => <SelectItem key={e.id} id={e.id}>{e.rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </BarraFerramentas>
        )}
      </CabecalhoEquipe>

      <div className="px-4 pt-4 pb-6 md:px-6">
        {!veEquipe && pode(papel, "auditoria") ? (
          <div data-estado-tela="sem-permissao" className="grid justify-items-center gap-3">
            <EstadoSemPermissao area="do dono e da gestora" />
            <LinkButton variant="outline" href={url(`equipe/auditoria/?papel=${papel}`)}><History /> Abrir a auditoria financeira</LinkButton>
          </div>
        ) : (
          <ComDados
            capacidade="equipe_ver" area="do dono e da gestora" rotulo="a equipe"
            esqueleto={<div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>}
            estaVazio={todos.length <= 1}
            vazio={<EstadoVazio icone={UsersRound} titulo="Só você na equipe" texto="Convide quem trabalha com você. Cada pessoa entra com o papel e a unidade que você escolher." acao={convida ? botaoConvidar : undefined} />}
          >
            {() => lista.length === 0 ? (
              <EstadoVazio variante="filtro" icone={SearchX} titulo={`Nenhuma pessoa com ${rotuloFiltro}.`} texto={f.q ? "Confira a grafia ou limpe os filtros para ver a equipe inteira." : "Ninguém com este papel ou estado agora. Limpe os filtros para ver a equipe inteira."}
                acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
            ) : (
              <Lista lista={lista} total={todos.length} filtrado={filtrado} aberto={f.id} abrir={(id) => setF({ id })} />
            )}
          </ComDados>
        )}
      </div>
      {veEquipe && <DetalhePessoa id={f.id || null} aoFechar={() => setF({ id: "" })} />}
      {veEquipe && convida && <DialogoConvidar aberto={convidando} aoFechar={() => setConvidando(false)} />}
    </>
  )
}

// ---------------------------------------------------------------- lista
function Lista({ lista, total, filtrado, aberto, abrir }: { lista: Membro[]; total: number; filtrado: boolean; aberto: string; abrir: (id: string) => void }) {
  const agora = useAgora()
  const pendentes = usePendentes()
  const processando = useProcessando()
  const marcados = useMemo(() => new Set([...pendentes, ...processando]), [pendentes, processando])
  const linkPessoa = (m: Membro, className?: string) => (
    <a href={url(`equipe/?id=${m.id}`)} onClick={(e) => { e.preventDefault(); abrir(m.id) }} title={m.nome}
      className={cn("block truncate rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring", className)}>{m.nome}</a>
  )
  const colunas: ColunaDados<Membro>[] = [
    { id: "pessoa", titulo: "Pessoa", tipo: "texto", texto: (m) => `${m.nome} · ${m.email}`, valor: (m) => (
      <span className="flex min-w-0 items-center gap-2.5">
        <AvatarPessoa nome={m.nome} apagado={m.estado !== "ativo"} />
        <span className="min-w-0 leading-tight">{linkPessoa(m)}<Email email={m.email} className="text-xs text-muted-foreground" /></span>
      </span>
    ) },
    { id: "papel", titulo: "Papel", tipo: "texto", largura: "9rem", valor: (m) => nomeDoPapel(m.papel) },
    { id: "unidade", titulo: "Unidade", tipo: "texto", largura: "9rem", valor: (m) => nomeUnidade(m.unidade) },
    { id: "estado", titulo: "Estado", tipo: "status", largura: "11rem", valor: (m) => <SeloEixo p={ESTADO_MEMBRO[m.estado]} /> },
    { id: "acesso", titulo: "Último acesso", tipo: "data", largura: "9rem", valor: (m) => acessoCurto(m, agora) },
    { id: "acoes", titulo: "Ações", tipo: "acoes", valor: (m) => <MenuPessoa m={m} abrir={abrir} /> },
  ]
  return (
    <TabelaDados<Membro>
      titulo="Pessoas"
      colunas={colunas}
      linhas={lista}
      idDe={(m) => m.id}
      contagem={filtrado ? <><span className="num">{lista.length}</span> de <span className="num">{total}</span></> : undefined}
      aoAbrir={(m) => abrir(m.id)}
      aberto={aberto}
      pendentes={marcados}
      quebra="lg"
      cartao={(m) => (
        <div className="flex items-start gap-3">
          <AvatarPessoa nome={m.nome} apagado={m.estado !== "ativo"} className="mt-0.5" />
          <div className="grid min-w-0 flex-1 gap-1">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="block min-w-0 truncate text-sm font-medium" title={m.nome}>{m.nome}</span>
              <span className="flex shrink-0 justify-end"><SeloEixo p={ESTADO_MEMBRO[m.estado]} /></span>
            </div>
            <span className="block min-w-0 truncate text-xs text-muted-foreground" title={m.email}>{m.email}</span>
            <p className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{nomeDoPapel(m.papel)} · {nomeUnidade(m.unidade)}</span>
              <span className="num shrink-0">{acessoCurto(m, agora)}</span>
            </p>
          </div>
        </div>
      )}
    />
  )
}

function MenuPessoa({ m, abrir }: { m: Membro; abrir: (id: string) => void }) {
  const papel = usePapel()
  const [suspendendo, setSuspendendo] = useState(false)
  const itens: ItemMenu[] = [{ rotulo: "Abrir a pessoa", icone: UsersRound, aoEscolher: () => abrir(m.id) }]
  const eu = pessoaDoPapel(papel).id === m.id
  if (m.estado === "convidado" && podeGerir(papel, "convite", m.papel)) {
    itens.push({ rotulo: "Reenviar o convite", icone: MailPlus, aoEscolher: () => void reenviarConvite(m) })
    itens.push({ rotulo: "Cancelar o convite", icone: X, perigo: true, separadorAntes: true, aoEscolher: () => void cancelarConvite(m) })
  }
  if (!eu && m.estado === "suspenso" && podeGerir(papel, "suspender", m.papel)) itens.push({ rotulo: "Reativar o acesso", icone: UserCheck, aoEscolher: () => void definirSuspensao(m, false) })
  if (!eu && m.estado === "ativo" && podeGerir(papel, "suspender", m.papel)) itens.push({ rotulo: "Suspender o acesso…", icone: Ban, perigo: true, separadorAntes: true, aoEscolher: () => setSuspendendo(true) })
  return (
    <>
      <MenuDaLinha rotulo={`Ações de ${m.nome}`} itens={itens} />
      <ConfirmarSuspensao m={m} aberto={suspendendo} aoFechar={() => setSuspendendo(false)} />
    </>
  )
}

function ConfirmarSuspensao({ m, aberto, aoFechar }: { m: Membro; aberto: boolean; aoFechar: () => void }) {
  return (
    <DialogoConfirmar aberto={aberto} aoFechar={aoFechar} perigo titulo={`Suspender o acesso de ${m.nome}?`}
      descricao={`${m.curto} não consegue mais entrar a partir de agora. As OS, os agendamentos e o histórico continuam como estão; dá para reativar depois.`}
      confirmar="Suspender o acesso" voltar="Manter o acesso" aoConfirmar={() => definirSuspensao(m, true)} />
  )
}

// ---------------------------------------------------------------- detalhe da pessoa
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function DetalhePessoa({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const m = equipe.use().find((x) => x.id === id) ?? null
  const papel = usePapel()
  const agora = useAgora()
  const processando = useProcessando()
  const [trocando, setTrocando] = useState<{ para: Papel; perdas: Capacidade[] } | null>(null)
  const [suspendendo, setSuspendendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = !!m && processando.has(m.id)
  const eu = !!m && pessoaDoPapel(papel).id === m.id
  const mudaPapel = !!m && !eu && m.estado !== "convidado" && podeGerir(papel, "papel", m.papel)
  const gereConvite = !!m && m.estado === "convidado" && podeGerir(papel, "convite", m.papel)
  const suspende = !!m && !eu && m.estado !== "convidado" && podeGerir(papel, "suspender", m.papel)
  const competencias = m ? pessoaPorId(m.id)?.competencias : undefined

  async function escolherPapel(para: Papel) {
    if (!m || para === m.papel) return
    setErro(null)
    const perdas = perdasAoTrocar(m.papel, para)
    if (perdas.length) { setTrocando({ para, perdas }); return }
    const r = await mudarPapel(m, para)
    if (!r.ok) setErro(r.mensagem)
  }
  async function executar(p: Promise<{ ok: boolean; mensagem?: string }>, fechar = false) {
    setErro(null)
    const r = await p
    if (!r.ok) setErro(r.mensagem ?? null)
    else if (fechar) aoFechar()
  }

  const caps = Object.keys(MATRIZ) as Capacidade[]
  const naoPode = m ? caps.filter((c) => !pode(m.papel, c)) : []
  const perdasTexto = (perdas: Capacidade[]) => {
    const r = perdas.map((c) => MATRIZ[c].rotulo)
    const mostra = r.slice(0, 3)
    return `${m?.curto} deixa de: ${mostra.join("; ")}${r.length > 3 ? `; e mais ${r.length - 3}` : ""}.`
  }

  return (
    <>
      <FolhaDeDetalhe
        aberto={!!m}
        aoFechar={() => { setErro(null); aoFechar() }}
        sobre={m && <Email email={m.email} />}
        titulo={m?.nome ?? ""}
        selos={m && <SeloEixo p={ESTADO_MEMBRO[m.estado]} ctx={ctxEstado(m)} detalhe />}
        rodape={m && (gereConvite ? (
          <>
            <BotaoLiquido disabled={ocupado} onClick={() => void executar(reenviarConvite(m))}><MailPlus className="size-4" /> {ocupado ? "Enviando…" : "Reenviar o convite"}</BotaoLiquido>
            <Button variant="ghost" className="text-negativo-texto" isDisabled={ocupado} onPress={() => { void cancelarConvite(m); aoFechar() }}><X /> Cancelar o convite</Button>
          </>
        ) : suspende ? (
          m.estado === "suspenso"
            ? <Button key="acesso" isDisabled={ocupado} onPress={() => void executar(definirSuspensao(m, false))}><UserCheck /> {ocupado ? "Enviando…" : "Reativar o acesso"}</Button>
            : <Button key="acesso" variant="outline" className="text-negativo-texto" isDisabled={ocupado} onPress={() => setSuspendendo(true)}><Ban /> Suspender o acesso…</Button>
        ) : undefined)}
      >
        {m && (
          <>
            {erro && <p role="alert" className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)] px-3 py-2 text-sm text-pretty">{erro}</p>}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 grid gap-1.5">
                <dt className="t-rotulo" id="rot-papel">Papel</dt>
                <dd>
                  {mudaPapel ? (
                    <Select aria-labelledby="rot-papel" selectedKey={m.papel} onSelectionChange={(k) => void escolherPapel(k as Papel)} isDisabled={ocupado} className="w-full">
                      <SelectTrigger className="h-10 w-full">{ocupado ? <span className="text-muted-foreground">Enviando…</span> : <SelectValue />}</SelectTrigger>
                      <SelectContent>{PAPEIS.filter((p) => p.id !== "dono").map((p) => <SelectItem key={p.id} id={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <span className="flex min-h-10 items-center">{nomeDoPapel(m.papel)}{eu && <span className="text-muted-foreground">&nbsp;· você</span>}</span>
                  )}
                </dd>
              </div>
              <div className="min-w-0"><dt className="t-rotulo">Unidade</dt><dd className="mt-1">{nomeUnidade(m.unidade)}</dd></div>
              <div className="min-w-0">
                <dt className="t-rotulo">{m.estado === "convidado" ? "Convite" : "Último acesso"}</dt>
                <dd className="num mt-1">{m.estado === "convidado" ? quandoCurto(m.convidadoEm, agora) : quandoCurto(m.ultimoAcesso, agora)}</dd>
              </div>
              {m.papel === "tecnico" && competencias && competencias.length > 0 && (
                <div className="col-span-2 min-w-0"><dt className="t-rotulo">Atende</dt><dd className="mt-1 text-pretty">{capitalizar(competencias.map((c) => COMPETENCIA[c]).join(", "))}</dd></div>
              )}
            </dl>

            <section aria-labelledby="acesso-titulo" className="grid min-w-0 gap-2 [overflow-wrap:anywhere] rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-3 shadow-[inset_0_0_0_1px_var(--sup-aro)]">
              <h3 id="acesso-titulo" className="flex items-center gap-1.5 text-sm font-medium"><ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" /> O que {nomeDoPapel(m.papel).toLowerCase()} pode</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {naoPode.length === 0 ? <>Pode tudo: as <span className="num">{caps.length}</span> ações do sistema.</>
                  : <>Pode <span className="num">{caps.length - naoPode.length}</span> de <span className="num">{caps.length}</span> ações. Não pode: {naoPode.slice(0, 3).map((c) => MATRIZ[c].rotulo).join("; ")}{naoPode.length > 3 ? `; e mais ${naoPode.length - 3}` : ""}.</>}
              </p>
              <LinkButton variant="outline" size="sm" className="w-fit" href={url(`equipe/permissoes/?ver=${m.papel}`)}>Ver na matriz</LinkButton>
            </section>

            <section aria-labelledby="hist-pessoa" className="grid min-w-0 gap-2 [overflow-wrap:anywhere]">
              <h3 id="hist-pessoa" className="text-sm font-medium">Histórico</h3>
              <LinhaDoTempo eventos={m.historico} />
            </section>
          </>
        )}
      </FolhaDeDetalhe>
      {m && trocando && (
        <DialogoConfirmar aberto={!!trocando} aoFechar={() => setTrocando(null)} titulo={`Mudar ${m.curto} para ${nomeDoPapel(trocando.para).toLowerCase()}?`}
          descricao={perdasTexto(trocando.perdas)} confirmar={`Mudar para ${nomeDoPapel(trocando.para).toLowerCase()}`} voltar={`Manter ${nomeDoPapel(m.papel).toLowerCase()}`}
          aoConfirmar={() => mudarPapel(m, trocando.para)} />
      )}
      {m && <ConfirmarSuspensao m={m} aberto={suspendendo} aoFechar={() => setSuspendendo(false)} />}
    </>
  )
}

// ---------------------------------------------------------------- convidar
function DialogoConvidar({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const papel = usePapel()
  const opcoes = papeisQueConvida(papel)
  const vazio = { nome: "", email: "", papel: (opcoes.includes("atendente") ? "atendente" : opcoes[0]) as Papel, unidade: "pampulha" as Unidade | "todas" }
  const [v, setV] = useState(vazio)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const invalido = validarConvite(v.email)
  function fechar() { if (enviando) return; setV(vazio); setTentou(false); setErro(null); aoFechar() }
  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setTentou(true)
    if (invalido || enviando) return
    setEnviando(true); setErro(null)
    const r = await convidar(v)
    setEnviando(false)
    if (!r.ok) { setErro(r.mensagem); return }
    setV(vazio); setTentou(false); aoFechar()
  }
  return (
    <Dialog isOpen={aberto} onOpenChange={(o) => !o && fechar()} className="sm:max-w-md" isDismissable={!enviando}>
      <form onSubmit={enviar} className="grid gap-4" noValidate>
        <DialogHeader>
          <DialogTitle>Convidar pessoa</DialogTitle>
          <DialogDescription className="text-pretty">A pessoa recebe um e-mail para criar a senha. Até aceitar, aparece como convite pendente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="cv-email">E-mail</Label>
          <Input id="cv-email" type="email" maxLength={254} autoComplete="off" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoFocus
            aria-invalid={tentou && invalido ? true : undefined} aria-describedby="cv-email-msg" placeholder="nome@oficinanorte.com.br" />
          <p id="cv-email-msg" aria-live="polite" className={cn("min-h-4 text-xs", tentou && invalido ? "text-negativo-texto" : "text-muted-foreground")}>
            {tentou && invalido ? invalido : "O link para criar a senha chega neste endereço."}
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cv-nome">Nome <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Input id="cv-nome" maxLength={80} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} autoComplete="off" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label id="cv-papel">Papel</Label>
            <Select aria-labelledby="cv-papel" selectedKey={v.papel} onSelectionChange={(k) => setV({ ...v, papel: k as Papel })}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{opcoes.map((p) => <SelectItem key={p} id={p}>{nomeDoPapel(p)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label id="cv-unidade">Unidade</Label>
            <Select aria-labelledby="cv-unidade" selectedKey={v.unidade} onSelectionChange={(k) => setV({ ...v, unidade: k as Unidade | "todas" })}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(UNIDADES) as Unidade[]).map((u) => <SelectItem key={u} id={u}>{UNIDADES[u].nome}</SelectItem>)}
                <SelectItem id="todas">Todas as unidades</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {papel === "gestora" && <p className="text-xs text-pretty text-muted-foreground">Como gestora, você convida atendentes e técnicos. Para outros papéis, peça a {pessoaDoPapel("dono").nome}.</p>}
        {erro && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erro}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={fechar} isDisabled={enviando}>Cancelar</Button>
          <BotaoLiquido type="submit" disabled={enviando}><MailPlus className="size-4" /> <span className="inline-grid"><span className={cn("col-start-1 row-start-1", enviando && "invisible")}>Enviar convite</span><span className={cn("col-start-1 row-start-1", !enviando && "invisible")}>Enviando…</span></span></BotaoLiquido>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

