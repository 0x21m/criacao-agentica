// Módulo Entrada (5.1) · /entrar/: entrar como um papel. Banner da marca com o card de vidro sobreposto; e-mail e senha
// (protótipo: o e-mail decide a pessoa, qualquer senha com 6+ caracteres entra, nada é guardado) e as 5 portas da
// demonstração. Entrar é pessimista ("Entrando…"); quem tem mais de uma unidade escolhe a unidade, os outros passam
// pelo carregamento com a marca e caem no Início no papel escolhido.
import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { navigate } from "astro:transitions/client"
import { ArrowRight } from "lucide-react"
import { BotaoLiquido } from "@/components/movimento"
import { Button } from "@/components/ui/button"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { useConfig } from "@/proto/dados"
import { agora, useAgora } from "@/proto/relogio"
import { nomeDoPapel } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { DEMONSTRACAO, MAX_TENTATIVAS, SENHA_MINIMA, emailDaPessoa, entrar, escolheUnidade, quemEntra, useConectado, type QuemEntra } from "../dados"
import { AvisoSemConexao, CampoSenha, CampoTexto, CarregandoComMarca, CartaoEntrada, LinkTexto, MolduraEntrada } from "./comum"

const NAO_CONFEREM = "E-mail ou senha não conferem. Confira e tente de novo."
const MUITAS = "Muitas tentativas. Espere 1 minuto ou redefina a senha."
const EXEMPLO = { email: emailDaPessoa("marina"), senha: "exemplo123" }

export default function Entrar() {
  const id = useId()
  const ag = useAgora()
  const conectado = useConectado()
  const { latencia } = useConfig()
  const [p] = useParametrosDaUrl({ email: "" })
  const [email, setEmail] = useState(EXEMPLO.email)
  const [senha, setSenha] = useState(EXEMPLO.senha)
  const [erro, setErro] = useState<{ campo: "email" | "senha" | "geral"; texto: string } | null>(null)
  const [tentativas, setTentativas] = useState(0)
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [abrindo, setAbrindo] = useState<QuemEntra | null>(null)
  const refSenha = useRef<HTMLDivElement>(null)
  const [relogio, setRelogio] = useState(0)
  const bloqueado = bloqueadoAte !== null && Math.max(ag.getTime(), relogio) < bloqueadoAte
  const faltam = bloqueadoAte !== null ? Math.max(0, Math.ceil((bloqueadoAte - Math.max(ag.getTime(), relogio)) / 1000)) : 0

  // depois do primeiro acesso, o login chega com o e-mail de quem acabou de criar a senha
  useEffect(() => { if (p.email) setEmail(p.email) }, [p.email])
  // durante o bloqueio, a contagem anda de segundo em segundo pelo relógio do protótipo; passado o minuto, sai sozinho
  useEffect(() => {
    if (bloqueadoAte === null) return
    const t = setInterval(() => setRelogio(agora().getTime()), 1000)
    return () => clearInterval(t)
  }, [bloqueadoAte])
  useEffect(() => { if (bloqueadoAte !== null && !bloqueado) { setBloqueadoAte(null); setTentativas(0); setErro(null) } }, [bloqueado, bloqueadoAte])

  async function seguir(q: QuemEntra, origem: string) {
    setEnviando(origem)
    setErro(null)
    const r = await entrar(q)
    setEnviando(null)
    if (!r.ok) { setErro({ campo: "geral", texto: r.mensagem }); requestAnimationFrame(() => document.getElementById(`${id}-erro`)?.focus()); return }
    if (escolheUnidade(q.papel)) void navigate(url("entrar/unidade/"))
    else setAbrindo(q)
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando || bloqueado || !conectado) return
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErro({ campo: "email", texto: "Confira o e-mail: falta o @ ou o domínio." })
      document.getElementById(`${id}-email`)?.focus()
      return
    }
    const q = quemEntra(email)
    if (q && senha.length >= SENHA_MINIMA) return seguir(q, "formulario")
    // a conferência "do servidor" demora o mesmo que uma ação; a resposta não diz se errou o e-mail ou a senha
    setEnviando("formulario")
    await new Promise((ok) => setTimeout(ok, latencia))
    setEnviando(null)
    const n = tentativas + 1
    setTentativas(n)
    if (n >= MAX_TENTATIVAS) { const t = agora().getTime(); setRelogio(t); setBloqueadoAte(t + 60_000); setErro({ campo: "geral", texto: MUITAS }) }
    else setErro({ campo: "senha", texto: NAO_CONFEREM })
    refSenha.current?.querySelector("input")?.focus()
  }

  const idErro = `${id}-erro`
  const travado = !!enviando || bloqueado

  return (
    <MolduraEntrada descricao="Pedidos, agenda, clientes e caixa das duas unidades num lugar só.">
      <CartaoEntrada aria-labelledby={`${id}-titulo`}>
        {!conectado && <AvisoSemConexao />}
        <header className="mb-6 space-y-1">
          <h2 id={`${id}-titulo`} className="t-secao">Entrar no painel</h2>
          <p className="text-sm text-pretty text-muted-foreground">Use o seu e-mail de trabalho da Oficina Norte.</p>
        </header>

        <form noValidate onSubmit={enviar} className="space-y-4" aria-describedby={`${id}-nota`}>
          <CampoTexto id={`${id}-email`} rotulo="E-mail" tipo="email" valor={email} aoMudar={(v) => { setEmail(v); if (erro && erro.campo !== "geral") setErro(null) }}
            autoComplete="username" inputMode="email" invalido={erro?.campo === "email" || erro?.campo === "senha"}
            descritoPor={erro ? idErro : undefined} />
          {erro?.campo === "email" && <p id={idErro} role="alert" className="-mt-2 text-sm text-pretty text-destructive">{erro.texto}</p>}
          <div ref={refSenha}>
            <CampoSenha id={`${id}-senha`} valor={senha} aoMudar={(v) => { setSenha(v); if (erro?.campo === "senha") setErro(null) }}
              invalido={erro?.campo === "senha"} descritoPor={erro ? idErro : undefined}
              acao={<LinkTexto href={url("entrar/senha/")}>Esqueci a senha</LinkTexto>} />
          </div>
          {erro && erro.campo !== "email" && (
            <p id={idErro} role="alert" tabIndex={-1} className="text-sm text-pretty text-destructive outline-none">
              {erro.texto}
              {erro.texto === MUITAS && <> <LinkTexto href={url("entrar/senha/")} className="text-destructive underline underline-offset-4">Redefinir a senha</LinkTexto></>}
            </p>
          )}
          <BotaoLiquido type="submit" tamanho="lg" disabled={travado || !conectado} className="h-11 w-full">
            {enviando === "formulario" ? "Entrando…" : bloqueado ? `Tente de novo em ${Math.floor(faltam / 60)}:${String(faltam % 60).padStart(2, "0")}` : <>Entrar <ArrowRight className="size-4" aria-hidden="true" /></>}
          </BotaoLiquido>
        </form>

        <fieldset className="mt-6 border-t border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pt-5" disabled={travado || !conectado}>
          <legend className="sr-only">Entrar como demonstração</legend>
          <p aria-hidden="true" className="t-rotulo mb-3">Entrar como demonstração</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            {DEMONSTRACAO.map((q, i) => (
              <li key={q.pessoaId} className={cn("min-w-0 sm:col-span-2", (i === 0 || i === DEMONSTRACAO.length - 1) && "col-span-2")}>
                <Button variant="outline" className="h-11 w-full min-w-0 justify-start gap-1.5 px-3" isDisabled={travado || !conectado}
                  onPress={() => void seguir(q, q.pessoaId)}>
                  {enviando === q.pessoaId ? <span className="whitespace-nowrap">Entrando…</span> : (
                    <span className="flex min-w-0 flex-col items-start leading-tight">
                      <span className="whitespace-nowrap">{nomeDoPapel(q.papel)}</span>
                      <span className="max-w-full truncate text-xs font-normal text-muted-foreground" title={q.nome}>{q.nome.split(" ")[0]}</span>
                    </span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>

        <footer className="mt-6 space-y-2 text-sm">
          <p className="text-pretty text-muted-foreground">
            Recebeu um convite? <LinkTexto href={url("entrar/primeiro-acesso/")}>Criar o meu acesso</LinkTexto>
          </p>
          <p className="text-pretty text-muted-foreground">Sem convite? Peça a Marina Duarte (gestora).</p>
          <p id={`${id}-nota`} className="text-xs text-pretty text-foreground/80">
            Protótipo: use o e-mail de alguém da equipe (nome@oficinanorte.com.br) e qualquer senha com {SENHA_MINIMA} ou mais caracteres. Nada é guardado.
          </p>
        </footer>
      </CartaoEntrada>
      {abrindo && <CarregandoComMarca quem={abrindo.nome.split(" ")[0]} />}
    </MolduraEntrada>
  )
}
