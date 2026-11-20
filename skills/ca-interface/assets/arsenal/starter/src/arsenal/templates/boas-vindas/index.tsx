/**
 * TEMPLATE: Boas-vindas e login com banner de marca (base: glass-fold).
 * Para que serve: primeira impressão do sistema; fundo de marca em movimento lento, mensagem curta e um formulário
 * de entrada em vidro, com contraste garantido por véu e superfície semi-opaca.
 * Quando usar: login do painel ou do app, tela de boas-vindas, convite aceito, troca de senha concluída.
 * Quando não usar: atrás de formulário longo ou tabela; em tela que a pessoa revisita o dia todo (o WebGL roda sem parar).
 * Depende de: components/ui/glass-fold, lucide-react, templates/_base (useCoresDoTema).
 * Ao adaptar: as 3 cores do shader vêm de --chart-1 (lâminas), de uma mistura escura dela (fundo) e de uma mistura
 * clara (arestas); troque a marca, a frase e as rotas de "Esqueci a senha" e "Pedir acesso". Não há autenticação real.
 */
import { useId, useState, type FormEvent } from "react"
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck, Store } from "lucide-react"
import { GlassFold } from "@/components/ui/glass-fold"
import { cn } from "@/lib/utils"
import { ProvedorEstado, useEstadoTela } from "../_base/estado"
import { Carregando, Esqueleto, entrada } from "../_base/esqueleto"
import { NEGOCIO } from "../_base/formato"
import { useCoresDoTema } from "../_base/tema"

const campo =
  "h-11 w-full rounded-lg border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-[invalid=true]:border-destructive"

function Formulario() {
  const id = useId()
  const [verSenha, setVerSenha] = useState(false)
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get("email") ?? "").trim()
    const senha = String(f.get("senha") ?? "")
    const novo: typeof erros = {}
    if (!email) novo.email = "Digite o e-mail cadastrado."
    else if (!/^\S+@\S+\.\S+$/.test(email)) novo.email = "Confira o e-mail: falta o @ ou o domínio."
    if (!senha) novo.senha = "Digite a senha."
    else if (senha.length < 8) novo.senha = "A senha tem pelo menos 8 caracteres."
    setErros(novo)
    if (Object.keys(novo).length) {
      const primeiro = e.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(novo)[0]}"]`)
      primeiro?.focus()
      return
    }
    setEnviando(true)
    window.setTimeout(() => {
      setEnviando(false)
      setOk(true)
    }, 1200)
  }

  if (ok)
    return (
      <div role="status" className={cn("space-y-3 py-6 text-center", entrada)}>
        <ShieldCheck className="mx-auto size-8 text-sucesso" aria-hidden="true" />
        <p className="text-base font-medium">Tudo certo. Abrindo o painel…</p>
        <p className="text-sm text-muted-foreground">Protótipo: nenhuma credencial foi enviada.</p>
      </div>
    )

  return (
    <form noValidate onSubmit={enviar} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-email`} className="text-sm font-medium">E-mail</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="voce@ipemercados.com.br"
            aria-invalid={!!erros.email}
            aria-describedby={erros.email ? `${id}-email-erro` : undefined}
            className={cn(campo, "pl-9")}
          />
        </div>
        {erros.email && <p id={`${id}-email-erro`} className="text-sm text-destructive">{erros.email}</p>}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-senha`} className="text-sm font-medium">Senha</label>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Esqueci a senha</a>
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id={`${id}-senha`}
            name="senha"
            type={verSenha ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={!!erros.senha}
            aria-describedby={erros.senha ? `${id}-senha-erro` : undefined}
            className={cn(campo, "pr-11 pl-9")}
          />
          <button
            type="button"
            onClick={() => setVerSenha((v) => !v)}
            aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
            aria-pressed={verSenha}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {erros.senha && <p id={`${id}-senha-erro`} className="text-sm text-destructive">{erros.senha}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="lembrar" className="size-4 accent-primary" /> Manter conectado neste aparelho
      </label>
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-70"
      >
        {enviando ? <><Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Entrando…</> : <>Entrar <ArrowRight className="size-4" aria-hidden="true" /></>}
      </button>
      <button type="button" className="h-11 w-full rounded-lg border border-input bg-background/60 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
        Receber código por e-mail
      </button>
    </form>
  )
}

function Cartao() {
  const estado = useEstadoTela()
  return (
    <div className={cn("w-full max-w-[400px] rounded-2xl border border-white/25 bg-background/80 p-6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_24px_60px_-28px_rgba(0,0,0,.6)] backdrop-blur-xl sm:p-8", entrada)} style={{ animationDelay: "120ms" }}>
      {estado === "carregando" ? (
        <Carregando rotulo="Verificando sua sessão" className="space-y-5">
          <Esqueleto className="h-6 w-40" />
          <Esqueleto className="h-4 w-56" />
          <Esqueleto className="h-11 w-full" />
          <Esqueleto className="h-11 w-full" />
          <Esqueleto className="h-11 w-full" />
        </Carregando>
      ) : estado === "vazio" ? (
        <div className="space-y-4 py-2 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Store className="size-5" /></span>
          <h1 className="text-xl font-semibold tracking-tight">Nenhuma loja liberada</h1>
          <p className="text-sm text-muted-foreground">Seu acesso existe, mas ainda não foi ligado a nenhuma loja. Peça para a gerência liberar ou fale com o suporte.</p>
          <button type="button" className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Pedir acesso à gerência</button>
        </div>
      ) : (
        <>
          <h1 className="text-xl font-semibold tracking-tight">Entrar no painel</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Use o e-mail cadastrado pela sua loja.</p>
          <Formulario />
        </>
      )}
    </div>
  )
}

function Tela() {
  const cores = useCoresDoTema({
    laminas: "--chart-1",
    fundo: "color-mix(in oklch, var(--chart-1) 14%, black)",
    arestas: "color-mix(in oklch, var(--chart-1) 35%, white)",
  })
  return (
    <div className="relative isolate min-h-dvh w-full overflow-hidden bg-black text-white">
      <GlassFold color1={cores.laminas} color2={cores.fundo} color3={cores.arestas} speed={0.25} noise={0.12} className="absolute inset-0 -z-10" />
      {/* véu: garante contraste do texto sobre o shader */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.45)_0%,rgba(0,0,0,0)_35%,rgba(0,0,0,.55)_100%)] lg:bg-[linear-gradient(90deg,rgba(0,0,0,.6)_0%,rgba(0,0,0,.15)_55%,rgba(0,0,0,.35)_100%)]" />
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-10 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-12">
        <header className={cn("flex flex-col justify-between gap-10 lg:min-h-[520px] lg:max-w-md", entrada)}>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">I</span>
            <span className="text-sm font-medium tracking-tight">{NEGOCIO.nome}</span>
          </div>
          <div>
            <p className="text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl">Bom dia. A loja abre em 19 minutos.</p>
            <p className="mt-4 max-w-sm text-base text-pretty text-white/80">Pedidos, estoque e caixa da rede {NEGOCIO.nome} num só lugar.</p>
          </div>
          <p className="hidden text-xs text-white/70 lg:block">Suporte: (31) 3333-0000 · seg. a sáb., 7h às 22h</p>
        </header>
        <main className="flex justify-center lg:justify-end">
          <Cartao />
        </main>
      </div>
    </div>
  )
}

export default function TemplateBoasVindas() {
  return (
    <ProvedorEstado>
      <Tela />
    </ProvedorEstado>
  )
}
