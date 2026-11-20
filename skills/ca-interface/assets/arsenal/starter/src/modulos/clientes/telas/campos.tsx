// Peças de formulário do Clientes: o rótulo com erro (Campo) e o bloco de endereço com o CampoCep que preenche e
// deixa editar (campos-br do arsenal MIFT + lib/cep). Usados no Novo cliente e no Editar.
import { useId, type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CampoCep } from "@/components/mift/fluxos/campos-br"
import { criarCepDeExemplo, editarCampo, preencherEndereco, type CampoDoEndereco, type EnderecoPreenchivel } from "@/lib/cep"
import { cpfValido, cnpjValido, cepValido, telefoneValido, formatar } from "@/lib/documentos"
import { cn } from "@/lib/utils"
import type { Endereco } from "../dados"

/** Latência fixa: nada de Math.random numa tela (o adaptador de exemplo sorteia por padrão). */
export const consultarCep = criarCepDeExemplo({ latencia: () => 320 })

export function Campo({ rotulo, ajuda, erro, className, children }: {
  rotulo: string; ajuda?: ReactNode; erro?: string | null; className?: string
  children: (a: { id: string; descritoPor?: string; invalido: boolean }) => ReactNode
}) {
  const id = useId()
  const desc = erro ? `${id}-e` : ajuda ? `${id}-a` : undefined
  return (
    <div className={cn("grid min-w-0 content-start gap-1.5", className)}>
      <Label htmlFor={id} className="truncate">{rotulo}</Label>
      {children({ id, descritoPor: desc, invalido: !!erro })}
      {erro ? <p id={`${id}-e`} className="text-sm text-pretty text-negativo-texto">{erro}</p>
        : ajuda ? <p id={`${id}-a`} className="text-xs text-pretty text-muted-foreground">{ajuda}</p> : null}
    </div>
  )
}

/** Endereço do formulário: crus (CEP só dígitos) e de onde veio cada campo, para a consulta seguinte. */
export type EnderecoForm = EnderecoPreenchivel & { cep: string; numero: string; complemento: string }
export const enderecoParaForm = (e?: Endereco): EnderecoForm => !e || e.cep === "—"
  ? { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" }
  : { cep: e.cep.replace(/\D/g, ""), logradouro: e.logradouro, numero: e.numero, complemento: e.complemento ?? "", bairro: e.bairro, cidade: e.cidade, uf: e.uf }
export const formParaEndereco = (f: EnderecoForm): Endereco => ({
  cep: f.cep ? formatar.cep(f.cep) : "", logradouro: f.logradouro?.trim() ?? "", numero: f.numero.trim(), complemento: f.complemento.trim() || undefined,
  bairro: f.bairro?.trim() ?? "", cidade: f.cidade?.trim() ?? "", uf: (f.uf ?? "").trim().toUpperCase(),
})

export type ErrosEndereco = Partial<Record<"cep" | "uf", string>>
export function validarEndereco(f: EnderecoForm): ErrosEndereco {
  const e: ErrosEndereco = {}
  if (f.cep && !cepValido(f.cep)) e.cep = "CEP com 8 números, como 31270-000."
  if (f.uf && !/^[A-Za-z]{2}$/.test(f.uf.trim())) e.uf = "UF com 2 letras."
  return e
}

/** Erros do contato (telefone e e-mail) e do documento, com as frases do formulário. */
export function validarContato({ telefone, email }: { telefone: string; email: string }) {
  const e: Partial<Record<"telefone" | "email", string>> = {}
  if (!telefoneValido(telefone)) e.telefone = "Telefone com DDD, como (31) 98877-0001."
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = "Confira o e-mail: falta o @ ou o domínio."
  return e
}
export const documentoValido = (tipo: "pf" | "pj", cru: string) => (tipo === "pf" ? cpfValido(cru) : cnpjValido(cru))

const TEXTOS: { k: Exclude<CampoDoEndereco, "uf">; rotulo: string; classe: string; auto: string }[] = [
  { k: "logradouro", rotulo: "Rua ou avenida", classe: "sm:col-span-4", auto: "address-line1" },
  { k: "bairro", rotulo: "Bairro", classe: "sm:col-span-3", auto: "address-level3" },
  { k: "cidade", rotulo: "Cidade", classe: "sm:col-span-3", auto: "address-level2" },
]

/** CEP que preenche rua, bairro, cidade e UF (só o vazio ou o que veio de outra consulta); tudo segue editável. */
export function CamposEndereco({ valor, aoMudar, erros = {} }: { valor: EnderecoForm; aoMudar: (f: EnderecoForm) => void; erros?: ErrosEndereco }) {
  const campo = (k: CampoDoEndereco, v: string) => aoMudar(editarCampo(valor, k, v))
  return (
    <fieldset className="grid min-w-0 gap-4 sm:grid-cols-6">
      <legend className="t-card mb-3">Endereço</legend>
      <Campo rotulo="CEP" erro={erros.cep} className="sm:col-span-2">
        {(a) => <CampoCep id={a.id} descritoPor={a.descritoPor} invalido={a.invalido} valor={valor.cep} className="h-10"
          aoMudar={(cep) => aoMudar({ ...valor, cep })} consultar={consultarCep}
          aoEncontrar={(r) => aoMudar(preencherEndereco({ ...valor }, r.endereco))} />}
      </Campo>
      {TEXTOS.slice(0, 1).map((t) => (
        <Campo key={t.k} rotulo={t.rotulo} className={t.classe}>
          {(a) => <Input id={a.id} aria-describedby={a.descritoPor} value={valor[t.k] ?? ""} onChange={(e) => campo(t.k, e.target.value)} autoComplete={t.auto} />}
        </Campo>
      ))}
      <Campo rotulo="Número" className="sm:col-span-2">
        {(a) => <Input id={a.id} value={valor.numero} onChange={(e) => aoMudar({ ...valor, numero: e.target.value })} inputMode="text" />}
      </Campo>
      <Campo rotulo="Complemento (opcional)" className="sm:col-span-4">
        {(a) => <Input id={a.id} value={valor.complemento} onChange={(e) => aoMudar({ ...valor, complemento: e.target.value })} autoComplete="address-line2" />}
      </Campo>
      {TEXTOS.slice(1).map((t) => (
        <Campo key={t.k} rotulo={t.rotulo} className={t.k === "cidade" ? "sm:col-span-2" : t.classe}>
          {(a) => <Input id={a.id} value={valor[t.k] ?? ""} onChange={(e) => campo(t.k, e.target.value)} autoComplete={t.auto} />}
        </Campo>
      ))}
      <Campo rotulo="UF" erro={erros.uf} className="sm:col-span-1">
        {(a) => <Input id={a.id} aria-describedby={a.descritoPor} aria-invalid={a.invalido || undefined} value={valor.uf ?? ""} maxLength={2}
          onChange={(e) => campo("uf", e.target.value.toUpperCase())} autoComplete="address-level1" className="uppercase" />}
      </Campo>
    </fieldset>
  )
}
