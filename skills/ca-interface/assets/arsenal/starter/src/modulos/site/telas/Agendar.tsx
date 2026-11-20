// /site/agendar/?servico=limpeza-split(&horario=2026-11-17T10:00) · agendar pelo site (5.13; jornada da Juliana, passos
// 2 a 7). Etapas: Serviço → Endereço (CEP preenche e fica editável) → Horário (grade de horários livres, reserva de
// 10 min, P) → Seus dados (obrigatório e opcional escritos, o porquê do celular e do CPF) → Pagamento (Pix, preço fechado)
// ou Confirmar (avaliação: nada é pago agora). Estados: CEP não achado, fora da área + Avise-me, horários carregando e
// vazios, horário perdido para outra pessoa (3 sugestões), reserva expirada (volta ao Horário e guarda o resto), erro
// geral com o horário ainda guardado. Banner completo com o card da etapa sobreposto, como no Portal (CLI-42).
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, BellRing, MapPin } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { FraseDoCliente } from "@/components/base/selos"
import { BotaoLiquido } from "@/components/movimento"
import { CampoCep, CampoDocumento, CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { useProcessando } from "@/proto/dados"
import { useAgora } from "@/proto/relogio"
import { AGENDAMENTO } from "@/proto/projecao"
import { SERVICOS, SITE, ROTAS, PORTAL, agendaDireto, servicoPorId } from "@/proto/site"
import { cpfValido, formatar, telefoneValido } from "@/lib/documentos"
import { editarCampo, preencherEndereco, type CampoDoEndereco } from "@/lib/cep"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { agendamentos } from "@/modulos/agenda/dados"
import { lancamentos } from "@/modulos/financeiro/dados"
import { atendemos, aviseMe, semQuebra, concluirAgendamento, consultarCep, frasesDaArea, pagaNoAgendamento, valorDoAgendamento } from "../dados"
import { GradeDeHorarios } from "@/modulos/agenda/telas/GradeDeHorarios"
import { ocupa } from "@/modulos/agenda/dados"
import { BannerDaEtapa, Campo, Etapas, PixDoSite, Texto, diaSemana, hora, useParametro } from "./comum"

type Endereco = { cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; _daConsulta?: CampoDoEndereco[] }
type Pessoa = { nome: string; email: string; celular: string; cpf: string }
type Reserva = { id: string; ate: string; inicio: string; fim?: string; recursoId: string }
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

export default function Agendar() {
  const doSite = useParametro("servico")
  const horarioSugerido = useParametro("horario")
  if (doSite === undefined) return <Esqueleto />
  return <Fluxo inicial={doSite && servicoPorId(doSite) ? doSite : "limpeza-split"} sugerido={horarioSugerido ?? undefined} />
}

function Esqueleto() {
  return (
    <BannerDaEtapa sobrelinha="Agendar" titulo="Agendar um serviço" descricao="Buscando os serviços e os horários livres…">
      <div className="grid gap-3" aria-busy="true"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-40" /><Skeleton className="h-11 w-48" /></div>
    </BannerDaEtapa>
  )
}

function Fluxo({ inicial, sugerido }: { inicial: string; sugerido?: string }) {
  const agora = useAgora()
  const [servico, setServico] = useState(inicial)
  const [etapa, setEtapa] = useState(sugerido ? 1 : 0)
  const s = servicoPorId(servico)!
  const paga = pagaNoAgendamento(servico)
  const avaliacao = !agendaDireto(s)
  const ETAPAS = ["Serviço", "Endereço", "Horário", "Seus dados", paga ? "Pagamento" : "Confirmar"]

  const [end, setEnd] = useState<Endereco>({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "MG" })
  const [cepBuscado, setCepBuscado] = useState(false)
  const [errosEnd, setErrosEnd] = useState<Partial<Record<keyof Endereco, string>>>({})
  const fora = !!end.cidade.trim() && !atendemos(end.cidade)

  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [avisoHorario, setAvisoHorario] = useState<string | null>(null)
  const ags = agendamentos.use()
  const agReserva = reserva ? ags.find((a) => a.id === reserva.id) : undefined
  const reservaViva = !!agReserva && agReserva.estado === "reservado" && ocupa(agReserva, agora)
  const expirou = !!reserva && !reservaViva

  const [pessoa, setPessoa] = useState<Pessoa>({ nome: "", email: "", celular: "", cpf: "" })
  const [obs, setObs] = useState("")
  const [errosP, setErrosP] = useState<Partial<Record<keyof Pessoa, string>>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [feito, setFeito] = useState<{ osId: string; lancamentoId?: string } | null>(null)
  const enviando = useProcessando().has(reserva?.id ?? "-")
  const lans = lancamentos.use()
  const titulo = feito?.lancamentoId ? lans.find((l) => l.id === feito.lancamentoId) : undefined

  // a reserva venceu enquanto a pessoa preenchia: volta ao Horário, com o resto guardado
  useEffect(() => { if (expirou && !feito && etapa > 2) setEtapa(2) }, [expirou, feito, etapa])

  const irPara = (i: number) => { setErroGeral(null); setEtapa(i); requestAnimationFrame(() => document.getElementById("etapa-titulo")?.focus()) }

  function conferirEndereco() {
    const e: typeof errosEnd = {}
    if (end.cep.length !== 8) e.cep = "Digite os 8 números do CEP."
    for (const k of ["logradouro", "numero", "bairro", "cidade"] as const) if (!end[k].trim()) e[k] = "Preencha este campo."
    setErrosEnd(e)
    if (Object.keys(e).length || fora) return
    irPara(2)
  }

  function conferirPessoa() {
    const e: typeof errosP = {}
    if (pessoa.nome.trim().split(/\s+/).length < 2) e.nome = "Escreva nome e sobrenome."
    if (!emailValido(pessoa.email)) e.email = "Confira o e-mail: falta o @ ou o domínio."
    if (!telefoneValido(pessoa.celular, "celular")) e.celular = "Digite o celular com DDD: (31) 9 0000-0000."
    if (pessoa.cpf && !cpfValido(pessoa.cpf)) e.cpf = "Este CPF não confere. Confira os números."
    if (paga && !pessoa.cpf) e.cpf = "Precisamos do CPF para a nota fiscal do serviço pago."
    setErrosP(e)
    return !Object.keys(e).length
  }

  async function concluir() {
    if (!reserva || !conferirPessoa()) return
    setErroGeral(null)
    const r = await concluirAgendamento({
      reservaId: reserva.id, servico, observacao: obs,
      endereco: { cep: formatar.cep(end.cep), logradouro: end.logradouro.trim(), numero: end.numero.trim(), complemento: end.complemento.trim() || undefined, bairro: end.bairro.trim(), cidade: end.cidade.trim(), uf: end.uf },
      pessoa: { nome: pessoa.nome, email: pessoa.email, celular: formatar.telefone(pessoa.celular), cpf: pessoa.cpf ? formatar.cpf(pessoa.cpf) : "" },
    })
    if (r.ok && r.osId) {
      if (!r.lancamentoId) { location.assign(ROTAS.confirmacao(r.osId)); return }
      setFeito({ osId: r.osId, lancamentoId: r.lancamentoId }); irPara(4); return
    }
    if (!r.ok && "expirou" in r && r.expirou) { setReserva(null); setAvisoHorario(AGENDAMENTO.expirado.cliente!({})); irPara(2); return }
    if (!r.ok) setErroGeral(r.motivo === "falha" && reservaViva ? `Algo saiu do lugar do nosso lado. Seu horário continua guardado até ${hora(reserva.ate)}.` : r.mensagem)
  }

  const resumoServico = `${semQuebra(s.nome)} · ${paga ? moeda(valorDoAgendamento(servico)) : s.valor} · ${s.duracao}`
  const titulos = ["Qual serviço?", "Onde é o serviço?", "Escolha o horário", "Seus dados", feito ? (titulo?.estado === "pago" ? "Pagamento confirmado" : "Pague com Pix") : paga ? "Pagamento" : "Confirme o pedido"]

  return (
    <BannerDaEtapa sobrelinha={avaliacao ? "Pedir avaliação" : "Agendar"} titulo={semQuebra(avaliacao ? `Avaliação: ${s.nome.toLowerCase()}` : s.nome)}
      descricao={avaliacao ? `Visita de diagnóstico de ${SITE.taxaVisita}, abatida se você aprovar o orçamento. Respondemos com o orçamento em até 2 dias úteis.` : `${paga ? moeda(valorDoAgendamento(servico)) : s.valor}, ${s.duracao}, garantia de ${SITE.garantiaDias} dias.`}>
      <Etapas etapas={ETAPAS} atual={etapa} aoVoltar={feito ? undefined : (i) => irPara(i)} />
      <h2 id="etapa-titulo" tabIndex={-1} className="font-display text-xl font-semibold tracking-tight outline-none">{titulos[etapa]}</h2>

      {etapa === 0 && (
        <>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Serviço</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICOS.map((x) => (
                <label key={x.id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm has-[:checked]:bg-primary/8 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow has-[:checked]:shadow-[inset_0_0_0_2px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring motion-reduce:transition-none">
                  <input type="radio" name="servico" value={x.id} checked={servico === x.id} onChange={() => { setServico(x.id); setReserva(null) }} className="sr-only" />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="text-[14px] leading-snug font-medium text-pretty">{semQuebra(x.nome)}</span>
                    <span className="text-xs text-muted-foreground">{x.valor} · {x.duracao}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {avaliacao && <p className="text-sm text-pretty text-muted-foreground">O preço depende do diagnóstico: nada é pago agora. A visita custa {SITE.taxaVisita} e sai do preço quando você aprova o orçamento.</p>}
          <Rodape><BotaoLiquido className="h-11 min-w-[12rem]" onClick={() => irPara(1)}>Continuar <ArrowRight className="size-4" /></BotaoLiquido></Rodape>
        </>
      )}

      {etapa === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-6">
            <Campo id="cep" rotulo="CEP" erro={errosEnd.cep} className="sm:col-span-3">
              <CampoCep id="cep" valor={end.cep} aoMudar={(cep) => { setEnd((e) => ({ ...e, cep })); setCepBuscado(false) }} obrigatorio invalido={!!errosEnd.cep}
                consultar={consultarCep} aoEncontrar={(c) => { setEnd((e) => preencherEndereco(e, c.endereco)); setCepBuscado(true) }} />
            </Campo>
            <div className="hidden sm:col-span-3 sm:block" />
            <Campo id="logradouro" rotulo="Rua ou avenida" erro={errosEnd.logradouro} className="sm:col-span-4">
              <Texto id="logradouro" valor={end.logradouro} aoMudar={(v) => setEnd((e) => editarCampo(e, "logradouro", v))} autoComplete="address-line1" invalido={!!errosEnd.logradouro} />
            </Campo>
            <Campo id="numero" rotulo="Número" erro={errosEnd.numero} className="sm:col-span-2">
              <Texto id="numero" valor={end.numero} aoMudar={(v) => setEnd((e) => ({ ...e, numero: v }))} inputMode="numeric" invalido={!!errosEnd.numero} />
            </Campo>
            <Campo id="complemento" rotulo="Complemento" opcional className="sm:col-span-6">
              <Texto id="complemento" valor={end.complemento} aoMudar={(v) => setEnd((e) => ({ ...e, complemento: v }))} autoComplete="address-line2" placeholder="Apartamento, bloco, referência" />
            </Campo>
            <Campo id="bairro" rotulo="Bairro" erro={errosEnd.bairro} className="sm:col-span-3">
              <Texto id="bairro" valor={end.bairro} aoMudar={(v) => setEnd((e) => editarCampo(e, "bairro", v))} invalido={!!errosEnd.bairro} />
            </Campo>
            <Campo id="cidade" rotulo="Cidade" erro={errosEnd.cidade} className="sm:col-span-3">
              <Texto id="cidade" valor={end.cidade} aoMudar={(v) => setEnd((e) => editarCampo(e, "cidade", v))} autoComplete="address-level2" invalido={!!errosEnd.cidade} />
            </Campo>
          </div>
          {fora && <ForaDaArea cidade={end.cidade} />}
          {cepBuscado && !fora && <p className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Confira o endereço: dá para corrigir qualquer campo.</p>}
          <Rodape voltar={() => irPara(0)}>
            <BotaoLiquido className="h-11 min-w-[12rem]" onClick={conferirEndereco} disabled={fora}>Ver horários <ArrowRight className="size-4" /></BotaoLiquido>
          </Rodape>
        </>
      )}

      {etapa === 2 && (
        <>
          <p className="text-sm text-pretty text-muted-foreground">{resumoServico}. {end.bairro}, {end.cidade}.</p>
          {avisoHorario && <p role="alert" className="rounded-[var(--radius-lg)] bg-muted/70 p-3 text-sm font-medium">{avisoHorario}</p>}
          <GradeDeHorarios servico={servico} aoPedirLigacao={() => location.assign(PORTAL.conversa())}
            reservar={{
              origem: "site", reservaId: reservaViva ? reserva!.id : undefined,
              aoReservar: (r) => { setAvisoHorario(null); setReserva({ id: r.id, ate: r.reservadoAte.toISOString(), inicio: r.inicio.toISOString(), fim: agendamentos.porId(r.id)?.fim, recursoId: r.recursoId }) },
              aoExpirar: () => setReserva(null),
            }} />
          <Rodape voltar={() => irPara(1)}>
            <BotaoLiquido className="h-11 min-w-[12rem]" onClick={() => irPara(3)} disabled={!reservaViva}>Continuar <ArrowRight className="size-4" /></BotaoLiquido>
          </Rodape>
        </>
      )}

      {etapa === 3 && reserva && (
        <>
          <p className="text-sm text-pretty text-muted-foreground"><span className="capitalize">{diaSemana(reserva.inicio)}</span>, <span className="num whitespace-nowrap">{hora(reserva.inicio)}{reserva.fim ? ` a ${hora(reserva.fim)}` : ""}</span> · {end.logradouro}, {end.numero}, {end.bairro}. <FraseDoCliente p={AGENDAMENTO.reservado} ctx={{ ate: reserva.ate }} acao={<span />} className="inline" /></p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nome" rotulo="Nome completo" erro={errosP.nome} className="sm:col-span-2">
              <Texto id="nome" valor={pessoa.nome} aoMudar={(v) => setPessoa((p) => ({ ...p, nome: v }))} autoComplete="name" invalido={!!errosP.nome} />
            </Campo>
            <Campo id="email" rotulo="E-mail" porque="Para o comprovante e para entrar no portal do cliente." erro={errosP.email}>
              <Texto id="email" type="email" valor={pessoa.email} aoMudar={(v) => setPessoa((p) => ({ ...p, email: v }))} autoComplete="email" inputMode="email" invalido={!!errosP.email} aria-describedby="email-porque" />
            </Campo>
            <Campo id="celular" rotulo="Celular" porque="Para o técnico avisar quando estiver a caminho." erro={errosP.celular}>
              <CampoTelefone id="celular" so="celular" valor={pessoa.celular} aoMudar={(v) => setPessoa((p) => ({ ...p, celular: v }))} obrigatorio invalido={!!errosP.celular} descritoPor="celular-porque" />
            </Campo>
            <Campo id="cpf" rotulo="CPF" opcional={!paga} porque="Exigido para emitir a nota fiscal." erro={errosP.cpf}>
              <CampoDocumento id="cpf" aceita="cpf" valor={pessoa.cpf} aoMudar={(v) => setPessoa((p) => ({ ...p, cpf: v }))} obrigatorio={paga} invalido={!!errosP.cpf} descritoPor="cpf-porque" />
            </Campo>
            <Campo id="obs" rotulo="Algo que o técnico deva saber?" opcional className="sm:col-span-2">
              <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: o split fica no segundo andar" className="min-h-16 text-base" />
            </Campo>
          </div>
          <p className="text-xs text-pretty text-muted-foreground">Remarque ou cancele pelo portal até o serviço começar, sem custo{paga ? "; o Pix volta em até 3 dias úteis" : ""}. Nada é cobrado por pedir avaliação.</p>
          {erroGeral && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erroGeral}</p>}
          <Rodape voltar={() => irPara(2)}>
            <BotaoLiquido className="h-11 min-w-[14rem]" onClick={() => void concluir()} disabled={enviando}>
              {enviando ? "Enviando…" : paga ? `Pagar ${moeda(valorDoAgendamento(servico))} com Pix` : "Pedir a visita"}
            </BotaoLiquido>
          </Rodape>
        </>
      )}

      {etapa === 4 && feito && titulo && (
        <PixDoSite l={titulo} nome={pessoa.nome}
          depois={<div className="flex flex-wrap gap-2"><LinkButton className="h-11" href={ROTAS.confirmacao(feito.osId)}>Ver a confirmação <ArrowRight /></LinkButton></div>} />
      )}
    </BannerDaEtapa>
  )
}

function Rodape({ voltar, children }: { voltar?: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      {voltar ? <Button variant="ghost" className="h-11" onPress={voltar}><ArrowLeft /> Voltar</Button> : <span />}
      {children}
    </div>
  )
}

/** Fora da área (5.13): a frase com as cidades atendidas e o Avise-me quando chegar (P). */
function ForaDaArea({ cidade }: { cidade: string }) {
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState<"editando" | "enviando" | "feito">("editando")
  const [erro, setErro] = useState<string | null>(null)
  const enviar = async () => {
    if (!emailValido(email)) { setErro("Confira o e-mail: falta o @ ou o domínio."); return }
    setErro(null); setEstado("enviando")
    const r = await aviseMe(email, { cidade })
    if (r.ok) setEstado("feito"); else { setEstado("editando"); setErro(r.mensagem) }
  }
  return (
    <div role="status" className="grid gap-3 rounded-[var(--radius-lg)] bg-muted/70 p-4">
      <p className="text-sm font-medium text-pretty">{frasesDaArea.fora(cidade)}</p>
      {estado === "feito" ? (
        <p className="text-sm text-pretty">Combinado. Avisamos em {email} quando chegarmos a {cidade}.</p>
      ) : (
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
          <Campo id="email-area" rotulo="Seu e-mail" erro={erro} className="flex-1">
            <Texto id="email-area" type="email" valor={email} aoMudar={setEmail} autoComplete="email" invalido={!!erro} />
          </Campo>
          <Button type="submit" variant="outline" className={cn("h-11", erro && "sm:mb-7")} isPending={estado === "enviando"}><BellRing /> Avise-me quando chegar</Button>
        </form>
      )}
    </div>
  )
}
