// Módulo Entrada (5.1) · /entrar/senha/: "Esqueci a senha". E-mail → "Se o e-mail estiver cadastrado, enviamos um link."
// A resposta é a mesma exista ou não a conta (não revela quem tem acesso). O e-mail confirmado nunca quebra no meio
// (EmailNumaLinha: uma linha, o nome cortado com reticências e o domínio sempre inteiro). Pessimista: "Enviando…".
import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, MailCheck } from "lucide-react"
import { BotaoLiquido } from "@/components/movimento"
import { Button, LinkButton } from "@/components/ui/button"
import { url } from "@/lib/url"
import { emailDaPessoa, pedirLinkDeSenha, useConectado } from "../dados"
import { AvisoSemConexao, CampoTexto, CartaoEntrada, EmailNumaLinha, LinkTexto, MolduraEntrada } from "./comum"

export default function RecuperarSenha() {
  const id = useId()
  const conectado = useConectado()
  const [email, setEmail] = useState(emailDaPessoa("marina"))
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState<string | null>(null)
  const refTitulo = useRef<HTMLHeadingElement>(null)
  // depois de enviar, o foco vai para a confirmação (quem usa teclado ou leitor de tela não volta ao começo da página)
  useEffect(() => { if (enviado) refTitulo.current?.focus() }, [enviado])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando || !conectado) return
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErro("Confira o e-mail: falta o @ ou o domínio."); document.getElementById(`${id}-email`)?.focus(); return }
    setEnviando(true)
    setErro(null)
    const r = await pedirLinkDeSenha()
    setEnviando(false)
    if (!r.ok) { setErro(r.mensagem); document.getElementById(`${id}-email`)?.focus(); return }
    setEnviado(email.trim().toLowerCase())
  }

  return (
    <MolduraEntrada titulo="Recuperar o acesso" descricao="Acontece. Digite o e-mail e mandamos um link para criar uma senha nova.">
      <CartaoEntrada aria-labelledby={`${id}-titulo`}>
        {!conectado && <AvisoSemConexao texto="Sem conexão. Peça o link quando a internet voltar." />}
        {enviado ? (
          <div role="status" className="space-y-4">
            <span className="grid size-11 place-items-center rounded-full bg-[color-mix(in_oklch,var(--positive)_14%,transparent)] text-positive"><MailCheck className="size-5" aria-hidden="true" /></span>
            <div className="space-y-1.5">
              <h2 id={`${id}-titulo`} ref={refTitulo} tabIndex={-1} className="t-secao outline-none">Confira a sua caixa de entrada</h2>
              <p className="text-sm text-pretty text-muted-foreground">Se o e-mail estiver cadastrado, enviamos um link. Ele chega em alguns minutos; olhe também o spam.</p>
            </div>
            <div className="rounded-[calc(var(--raio-sup)*0.6)] bg-[color-mix(in_oklch,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm">
              <p className="t-rotulo">Enviado para</p>
              <EmailNumaLinha email={enviado} className="font-medium" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="h-11 sm:flex-1" onPress={() => setEnviado(null)}>Usar outro e-mail</Button>
              <LinkButton href={url("entrar/")} className="h-11 sm:flex-1"><ArrowLeft aria-hidden="true" /> Voltar ao login</LinkButton>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-6 space-y-1">
              <h2 id={`${id}-titulo`} className="t-secao">Esqueci a senha</h2>
              <p className="text-sm text-pretty text-muted-foreground">Digite o e-mail de trabalho. O link vale por 30 minutos.</p>
            </header>
            <form noValidate onSubmit={enviar} className="space-y-4">
              <CampoTexto id={`${id}-email`} rotulo="E-mail" tipo="email" valor={email} aoMudar={(v) => { setEmail(v); setErro(null) }}
                autoComplete="username" inputMode="email" invalido={!!erro} descritoPor={erro ? `${id}-erro` : undefined} />
              {erro && <p id={`${id}-erro`} role="alert" className="text-sm text-pretty text-destructive">{erro}</p>}
              <BotaoLiquido type="submit" tamanho="lg" disabled={enviando || !conectado} className="h-11 w-full">
                {enviando ? "Enviando…" : "Enviar o link"}
              </BotaoLiquido>
            </form>
            <p className="mt-5 border-t border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] pt-4 text-sm text-muted-foreground">
              Lembrou? <LinkTexto href={url("entrar/")}>Voltar ao login</LinkTexto>
            </p>
          </>
        )}
      </CartaoEntrada>
    </MolduraEntrada>
  )
}
