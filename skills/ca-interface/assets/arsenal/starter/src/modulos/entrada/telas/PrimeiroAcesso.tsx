// Módulo Entrada (5.1) · /entrar/primeiro-acesso/?convite=CNV-0003: aceitar o convite e criar a senha, em 3 etapas no
// card ("Seus dados" → "Senha" → "Pronto"). Os requisitos da senha ficam visíveis antes de enviar, com "Mostrar senha".
// Criar o acesso é pessimista e confere a versão do convite. Convite vencido, já aceito ou inexistente: a frase da 5.1
// e o caminho de volta, sem formulário.
import { useId, useState, type FormEvent, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, Check, CircleCheck, Circle, MailWarning } from "lucide-react"
import { BotaoLiquido } from "@/components/movimento"
import { Button, LinkButton } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Cortado } from "@/components/base/texto"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { nomeDoPapel } from "@/proto/permissoes"
import { useAgora } from "@/proto/relogio"
import { dataCurta } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { CONVITE_PADRAO, aceitarConvite, conviteVenceu, convites, nomeDaUnidade, useConectado, type Convite } from "../dados"
import { AvisoSemConexao, CampoSenha, CampoTexto, CartaoEntrada, EmailNumaLinha, LinkTexto, MolduraEntrada } from "./comum"

const ETAPAS = ["Seus dados", "Senha", "Pronto"] as const
const requisitos = (senha: string, email: string) => [
  { texto: "8 ou mais caracteres", ok: senha.length >= 8 },
  { texto: "Letras e números", ok: /[a-zA-Z]/.test(senha) && /\d/.test(senha) },
  { texto: "Diferente do seu e-mail", ok: !!senha && !senha.toLowerCase().includes(email.split("@")[0].toLowerCase()) },
]

export default function PrimeiroAcesso() {
  const id = useId()
  const ag = useAgora()
  const [p] = useParametrosDaUrl({ convite: CONVITE_PADRAO })
  const c = convites.use().find((x) => x.id === p.convite)
  // o convite aceito aqui continua nas etapas (vai ao "Pronto"); aberto de novo depois, cai no "já aceito"
  const [aceitoAqui, setAceitoAqui] = useState<string | null>(null)
  const emEtapas = !!c && (aceitoAqui === c.id || (c.estado === "convidado" && !conviteVenceu(c, ag)))

  return (
    <MolduraEntrada titulo={c && emEtapas ? `Boas-vindas, ${c.nome.split(" ")[0]}` : "Primeiro acesso"}
      descricao={c && emEtapas ? "Primeiro acesso: confirme seus dados e crie a sua senha." : "O link do convite abre o seu primeiro acesso."}>
      <CartaoEntrada aria-labelledby={`${id}-titulo`}>
        {c && emEtapas ? (
          <Etapas key={c.id} id={id} convite={c} aoAceitar={() => setAceitoAqui(c.id)} />
        ) : !c ? (
          <Recado id={id} titulo="Convite não encontrado" texto="Este link não abre nenhum convite. Confira se copiou o endereço inteiro ou peça um novo a Marina Duarte." />
        ) : c.estado === "ativo" ? (
          <Recado id={id} titulo="Este convite já foi aceito" texto={<>O acesso de {c.nome} já existe. Entre com o e-mail <Cortado texto={c.email} className="inline-block max-w-full align-bottom font-medium text-foreground" /> e a sua senha.</>}
            acao={<LinkButton href={url(`entrar/?email=${encodeURIComponent(c.email)}`)} className="h-11 w-full">Ir para o login</LinkButton>} />
        ) : (
          <Recado id={id} titulo="Convite vencido" texto={`Este convite venceu em ${dataCurta(c.venceEm)}. Peça um novo a ${c.convidadoPor}.`} />
        )}
      </CartaoEntrada>
    </MolduraEntrada>
  )
}

function Recado({ id, titulo, texto, acao }: { id: string; titulo: string; texto: ReactNode; acao?: ReactNode }) {
  return (
    <div role="status" className="space-y-4">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><MailWarning className="size-5" aria-hidden="true" /></span>
      <div className="space-y-1.5">
        <h2 id={`${id}-titulo`} className="t-secao">{titulo}</h2>
        <p className="text-sm text-pretty text-muted-foreground">{texto}</p>
      </div>
      {acao ?? <LinkButton variant="outline" href={url("entrar/")} className="h-11 w-full">Voltar ao login</LinkButton>}
    </div>
  )
}

function Etapas({ id, convite: c, aoAceitar }: { id: string; convite: Convite; aoAceitar: () => void }) {
  const conectado = useConectado()
  const [etapa, setEtapa] = useState(0)
  const [nome, setNome] = useState(c.nome)
  const [telefone, setTelefone] = useState("31900000000")
  const [senha, setSenha] = useState("exemplo123")
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const reqs = requisitos(senha, c.email)
  const idErro = `${id}-erro`

  function seguir(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro("Digite o seu nome."); return }
    setErro(null)
    setEtapa(1)
  }
  async function criar(e: FormEvent) {
    e.preventDefault()
    if (enviando || !conectado) return
    if (reqs.some((r) => !r.ok)) { setErro("A senha ainda não cumpre os requisitos marcados."); return }
    setEnviando(true)
    setErro(null)
    aoAceitar()
    const r = await aceitarConvite(c, { nome, telefone })
    setEnviando(false)
    if (!r.ok) { setErro(r.mensagem); return }
    setEtapa(2)
  }

  return (
    <>
      {!conectado && <AvisoSemConexao texto="Sem conexão. Crie o acesso quando a internet voltar; o que você digitou continua aqui." />}
      <header className="mb-5 space-y-4">
        <ol className="flex items-center gap-2" aria-label="Etapas do primeiro acesso">
          {ETAPAS.map((nomeEtapa, i) => (
            <li key={nomeEtapa} aria-current={i === etapa ? "step" : undefined} className="flex min-w-0 items-center gap-2">
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                i < etapa ? "bg-primary text-primary-foreground" : i === etapa ? "bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] text-foreground ring-1 ring-primary" : "bg-muted text-muted-foreground")}>
                {i < etapa ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={cn("text-xs whitespace-nowrap", i === etapa ? "font-medium text-foreground" : "text-muted-foreground max-sm:sr-only")}>{nomeEtapa}</span>
              {i < ETAPAS.length - 1 && <span aria-hidden="true" className="h-px w-4 shrink-0 bg-[color-mix(in_oklch,var(--foreground)_18%,transparent)] sm:w-6" />}
            </li>
          ))}
        </ol>
        <h2 id={`${id}-titulo`} className="t-secao">{etapa === 0 ? "Confira os seus dados" : etapa === 1 ? "Crie a sua senha" : "Acesso criado"}</h2>
      </header>

      {etapa === 0 && (
        <form noValidate onSubmit={seguir} className="space-y-4">
          <div className="space-y-1.5 rounded-[calc(var(--raio-sup)*0.6)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm">
            <p className="t-rotulo" title={`Convite de ${c.convidadoPor}`}>Convite de {c.convidadoPor}</p>
            <EmailNumaLinha email={c.email} className="font-medium" />
            <p className="text-pretty text-muted-foreground">{nomeDoPapel(c.papel)} em {nomeDaUnidade(c.unidade)}, válido até {dataCurta(c.venceEm)}.</p>
          </div>
          <CampoTexto id={`${id}-nome`} rotulo="Nome completo" valor={nome} aoMudar={setNome} autoComplete="name" invalido={!!erro} descritoPor={erro ? idErro : undefined} />
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-tel`}>Celular <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <CampoTelefone id={`${id}-tel`} so="celular" valor={telefone} aoMudar={setTelefone} />
          </div>
          {erro && <p id={idErro} role="alert" className="text-sm text-destructive">{erro}</p>}
          <BotaoLiquido type="submit" tamanho="lg" className="h-11 w-full">Continuar <ArrowRight className="size-4" aria-hidden="true" /></BotaoLiquido>
        </form>
      )}

      {etapa === 1 && (
        <form noValidate onSubmit={criar} className="space-y-4">
          <input type="email" name="username" autoComplete="username" value={c.email} readOnly hidden />
          <CampoSenha id={`${id}-senha`} rotulo="Senha nova" valor={senha} aoMudar={(v) => { setSenha(v); setErro(null) }} autoComplete="new-password"
            invalido={!!erro} descritoPor={`${id}-req${erro ? ` ${idErro}` : ""}`} />
          <ul id={`${id}-req`} aria-label="Requisitos da senha" className="space-y-1.5 text-sm">
            {reqs.map((r) => (
              <li key={r.texto} className={cn("flex items-center gap-2", r.ok ? "text-foreground" : "text-muted-foreground")}>
                {r.ok ? <CircleCheck className="size-4 shrink-0 text-positive" aria-hidden="true" /> : <Circle className="size-4 shrink-0" aria-hidden="true" />}
                <span>{r.texto}<span className="sr-only">{r.ok ? ": cumprido" : ": falta"}</span></span>
              </li>
            ))}
          </ul>
          {erro && <p id={idErro} role="alert" className="text-sm text-pretty text-destructive">{erro}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="ghost" className="h-11 sm:w-auto" isDisabled={enviando} onPress={() => { setErro(null); setEtapa(0) }}>
              <ArrowLeft aria-hidden="true" /> Voltar
            </Button>
            <BotaoLiquido type="submit" tamanho="lg" disabled={enviando || !conectado} className="h-11 flex-1">
              {enviando ? "Criando…" : "Criar o acesso"}
            </BotaoLiquido>
          </div>
        </form>
      )}

      {etapa === 2 && (
        <div role="status" className="space-y-4">
          <p className="text-sm text-pretty text-muted-foreground">
            Pronto, {nome.trim().split(/\s+/)[0] || c.nome.split(" ")[0]}. Você entra como {nomeDoPapel(c.papel).toLowerCase()} em {nomeDaUnidade(c.unidade)}, com o e-mail abaixo e a senha que acabou de criar.
          </p>
          <EmailNumaLinha email={c.email} className="font-medium" />
          <LinkButton href={url(`entrar/?email=${encodeURIComponent(c.email)}`)} className="h-11 w-full">Entrar agora <ArrowRight aria-hidden="true" /></LinkButton>
        </div>
      )}

      {etapa < 2 && (
        <p className="mt-5 border-t border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pt-4 text-sm text-muted-foreground">
          Já tem acesso? <LinkTexto href={url("entrar/")}>Entrar</LinkTexto>
        </p>
      )}
    </>
  )
}
