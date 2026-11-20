// Peças das telas de entrada: a moldura (banner da marca com o card sobreposto, 5.1), o carregamento com a marca depois
// do "Entrar" (EST-49, com as classes da abertura da base), o campo de senha com "mostrar" e o aviso de sem conexão.
import { useEffect, useId, useState, type ReactNode } from "react"
import { navigate } from "astro:transitions/client"
import { Eye, EyeOff, WifiOff } from "lucide-react"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { Superficie } from "@/components/sistema/Superficie"
import { Esqueleto } from "@/components/app/estados"
import { Logo } from "@/components/app/Logo"
import { TextoRevelado } from "@/components/movimento"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MARCA } from "@/proto/marca"
import { useAgora } from "@/proto/relogio"
import { expediente } from "@/proto/negocio"
import { dataPorExtenso } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"

export const saudacao = (d: Date) => (d.getHours() < 12 ? "Bom dia" : d.getHours() < 18 ? "Boa tarde" : "Boa noite")
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`

/** "Aberta até 18:00" / "Abre às 8:00" / "Fechada agora" / "Fechada hoje": o expediente da unidade no instante. */
export function fraseDaUnidade(d: Date) {
  const e = expediente(d)
  if (!e) return "Fechada hoje"
  const m = d.getHours() * 60 + d.getMinutes()
  if (m < e.abre) return `Abre às ${hm(e.abre)}`
  if (m >= e.fecha) return "Fechada agora"
  return `Aberta até ${hm(e.fecha)}`
}

/** "Lojas abertas até 18:00" / "Lojas fechadas hoje": o que o banner diz do dia, sem nenhum dado de cliente. */
function fraseDoDia(d: Date) {
  const e = expediente(d)
  if (!e) return "Lojas fechadas hoje"
  const m = d.getHours() * 60 + d.getMinutes()
  if (m < e.abre) return `Lojas abrem às ${hm(e.abre)}`
  if (m >= e.fecha) return "Lojas já fecharam hoje"
  return `Lojas abertas até ${hm(e.fecha)}`
}

/**
 * Banner da marca em tela cheia (BannerSobreposto completo, glass-fold nas cores do preset) com o card de entrada
 * sobreposto ao terço inferior. `titulo` padrão: a saudação da equipe pela hora do protótipo.
 */
export function MolduraEntrada({ titulo, descricao, largura = "estreita", children }: {
  titulo?: string; descricao?: ReactNode; largura?: "estreita" | "larga"; children: ReactNode
}) {
  const ag = useAgora()
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col pb-8">
      <BannerSobreposto
        variante="completa"
        sobreposicao={72}
        sobrelinha={
          <span className="flex min-w-0 items-center gap-2">
            <Logo className="size-6 rounded-[8px]" />
            <span className="font-medium text-foreground">{MARCA.nome}</span>
          </span>
        }
        titulo={<TextoRevelado texto={titulo ?? `${saudacao(ag)}, equipe Norte`} como="span" />}
        descricao={descricao}
        conteudoDoBanner={
          <p className="hidden shrink-0 text-right text-sm text-muted-foreground md:block">
            <span className="block">{maiuscula(dataPorExtenso(ag))}</span>
            <span className="num block whitespace-nowrap">{hora(ag)} · {fraseDoDia(ag)}</span>
          </p>
        }
      >
        <div className={cn("entrada-sobre -mx-2 sm:mx-auto", largura === "estreita" ? "sm:max-w-[420px]" : "sm:max-w-[880px]")}>
          {children}
        </div>
      </BannerSobreposto>
    </div>
  )
}

/** O card de vidro da entrada (Superficie destaque, material vidro). */
export function CartaoEntrada({ children, className, ...p }: { children: ReactNode; className?: string; "aria-labelledby"?: string }) {
  return (
    <Superficie como="section" nivel="destaque" material="vidro" className={cn("p-5 sm:p-7", className)} {...p}>
      {children}
    </Superficie>
  )
}

/** Sem conexão (5.1): faixa no topo do card. */
export function AvisoSemConexao({ texto = "Sem conexão. Tente entrar quando a internet voltar." }: { texto?: string }) {
  return (
    <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-[calc(var(--raio-sup)*0.6)] bg-[color-mix(in_oklch,var(--alerta)_14%,transparent)] px-3 py-2.5 text-sm text-pretty">
      <WifiOff className="mt-0.5 size-4 shrink-0 text-[var(--alerta)]" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}

/** Campo de senha com "Mostrar senha" (40 px), rótulo, ação ao lado do rótulo e descrição ou erro ligados. */
export function CampoSenha({ id, rotulo = "Senha", valor, aoMudar, acao, invalido, descritoPor, autoComplete = "current-password", desabilitado }: {
  id: string; rotulo?: string; valor: string; aoMudar: (v: string) => void; acao?: ReactNode; invalido?: boolean
  descritoPor?: string; autoComplete?: string; desabilitado?: boolean
}) {
  const [ver, setVer] = useState(false)
  return (
    <div className="space-y-1.5">
      <div className="flex min-h-6 items-baseline justify-between gap-3">
        <Label htmlFor={id}>{rotulo}</Label>
        {acao}
      </div>
      <div className="relative">
        <Input id={id} name={id} type={ver ? "text" : "password"} value={valor} onChange={(e) => aoMudar(e.target.value)}
          autoComplete={autoComplete} aria-invalid={invalido || undefined} aria-describedby={descritoPor} disabled={desabilitado}
          spellCheck={false} autoCapitalize="none" className="h-11 pr-12" />
        <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Esconder senha" : "Mostrar senha"} aria-pressed={ver}
          className="absolute top-1/2 right-0.5 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
          {ver ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

/** Campo de texto simples da entrada (rótulo em cima, 44 px). */
export function CampoTexto({ id, rotulo, valor, aoMudar, tipo = "text", invalido, descritoPor, acao, ...resto }: {
  id: string; rotulo: string; valor: string; aoMudar: (v: string) => void; tipo?: "text" | "email"; invalido?: boolean
  descritoPor?: string; acao?: ReactNode; autoComplete?: string; inputMode?: "email" | "text"; disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex min-h-6 items-baseline justify-between gap-3">
        <Label htmlFor={id}>{rotulo}</Label>
        {acao}
      </div>
      <Input id={id} name={id} type={tipo} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={invalido || undefined}
        aria-describedby={descritoPor} spellCheck={false} autoCapitalize={tipo === "email" ? "none" : undefined} className="h-11" {...resto} />
    </div>
  )
}

/** E-mail numa linha que nunca quebra no meio: corta o nome com reticências e mantém o domínio inteiro à vista. */
export function EmailNumaLinha({ email, className }: { email: string; className?: string }) {
  const i = email.lastIndexOf("@")
  if (i < 1) return <span className={cn("block truncate", className)} title={email}>{email}</span>
  return (
    <span className={cn("flex min-w-0 whitespace-nowrap", className)} title={email}>
      <span className="min-w-0 truncate">{email.slice(0, i)}</span>
      <span className="shrink-0">{email.slice(i)}</span>
    </span>
  )
}

/** Link discreto de texto (Esqueci a senha, Voltar ao login): sublinhado que se desenha, alvo de 40 px no toque. */
export function LinkTexto({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={cn("link-sistema inline-flex min-h-6 items-center text-sm whitespace-nowrap pointer-coarse:min-h-10", className)}>{children}</a>
  )
}

/**
 * Carregamento com a marca (EST-49) entre o "Entrar" e o Início: o logo da abertura (mesmas classes da camada #abertura
 * da base) sobre a moldura e o esqueleto do Início, e depois a troca de página. Fica pelo menos `minimo` ms para não
 * piscar; com movimento reduzido, nada se mexe.
 */
export function CarregandoComMarca({ quem, onde, destino = "", minimo = 700 }: { quem: string; onde?: string; destino?: string; minimo?: number }) {
  const id = useId()
  useEffect(() => {
    const t = setTimeout(() => void navigate(url(destino)), minimo)
    return () => clearTimeout(t)
  }, [destino, minimo])
  return (
    <div role="status" aria-live="polite" aria-labelledby={id} className="entrada-carregando fixed inset-0 z-[60] grid place-items-center">
      {/* a moldura do painel e o esqueleto do Início, já no lugar */}
      <div aria-hidden="true" className="absolute inset-0 flex opacity-60">
        <div className="hidden w-60 shrink-0 p-3 lg:block"><Esqueleto className="h-full rounded-[var(--raio-sup)]" /></div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-3 md:p-6">
          <Esqueleto className="h-10 w-full rounded-[var(--raio-sup)]" />
          <Esqueleto className="h-40 w-full rounded-[calc(var(--raio-sup)*1.3)]" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => <Esqueleto key={i} className="h-44 rounded-[var(--raio-sup)]" />)}
          </div>
        </div>
      </div>
      <Superficie nivel="flutuante" className="abertura-miolo relative max-w-[calc(100%-2rem)] px-8 py-8 text-center sm:px-10 motion-reduce:[animation:none]">
        <span className="abertura-logo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: MARCA.logo }} />
        <span className="font-display text-lg font-semibold tracking-tight">{MARCA.nome}</span>
        <span id={id} className="text-sm text-muted-foreground">Abrindo o Início de {quem}{onde ? ` ${onde}` : ""}…</span>
      </Superficie>
    </div>
  )
}
