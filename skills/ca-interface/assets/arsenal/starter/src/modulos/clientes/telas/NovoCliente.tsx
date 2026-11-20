// /clientes/novo/ (5.5): cadastro em card, PF ou PJ (segmentado de vidro), com os campos BR do arsenal MIFT:
// CampoDocumento (CPF ou CNPJ), CampoTelefone e CampoCep que preenche e deixa editar. Valida no envio; CPF/CNPJ ou
// e-mail já cadastrado → "Já existe {nome} com este CPF." + Abrir. Ação P: "Cadastrando…" e só então abre o cliente.
// ?nome= vem do "Cadastrar “{jul}”" da busca sem resultado.
import { useEffect, useState } from "react"
import { ArrowLeft, UserPlus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ComDados, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { Superficie } from "@/components/sistema/Superficie"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { CampoDocumento, CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { formatar } from "@/lib/documentos"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { clientes, criarCliente, jaExiste, type Cliente } from "../dados"
import { Campo, CamposEndereco, documentoValido, enderecoParaForm, formParaEndereco, validarContato, validarEndereco, type EnderecoForm } from "./campos"

type Form = { tipo: "pf" | "pj"; nome: string; documento: string; email: string; telefone: string; whatsapp: boolean; endereco: EnderecoForm }
const VAZIO: Form = { tipo: "pf", nome: "", documento: "", email: "", telefone: "", whatsapp: true, endereco: enderecoParaForm() }

export default function NovoCliente() {
  return (
    <>
      <CabecalhoPagina titulo="Novo cliente" descricao="Entra como lead até o primeiro pagamento" />
      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="editar_cliente" area="do atendimento" rotulo="o cadastro" estaVazio={false} vazio={null}
          esqueleto={<Esqueleto className="mx-auto h-[36rem] max-w-3xl rounded-[var(--raio-sup)]" />}>
          <Formulario />
        </ComDados>
      </div>
    </>
  )
}

function Formulario() {
  const [v, setV] = useState<Form>(VAZIO)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [existe, setExiste] = useState<{ cliente: Cliente; campo: string } | null>(null)
  useEffect(() => {
    const nome = new URLSearchParams(location.search).get("nome")
    if (nome) setV((x) => ({ ...x, nome }))
  }, [])

  const doc = v.tipo === "pf" ? "CPF" : "CNPJ"
  const erros: Partial<Record<"nome" | "documento" | "telefone" | "email" | "cep" | "uf", string>> = {
    ...validarContato(v), ...validarEndereco(v.endereco),
    ...(v.nome.trim().length < 2 ? { nome: v.tipo === "pf" ? "Escreva o nome completo." : "Escreva a razão social ou o nome fantasia." } : {}),
    ...(!documentoValido(v.tipo, v.documento) ? { documento: v.documento ? `${doc} inválido. Confira os números.` : `Escreva o ${doc}.` } : {}),
  }
  const mostrar = tentou ? erros : {}

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setTentou(true); setErro(null); setExiste(null)
    if (Object.keys(erros).length || enviando) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
      return
    }
    const documento = v.tipo === "pf" ? formatar.cpf(v.documento) : formatar.cnpj(v.documento)
    const dup = jaExiste(clientes.ler(), { documento, email: v.email })
    if (dup) return setExiste(dup)
    setEnviando(true)
    const r = await criarCliente({
      tipo: v.tipo, nome: v.nome.trim(), documento, email: v.email.trim(), telefone: formatar.telefone(v.telefone),
      whatsappConsentido: v.whatsapp, endereco: formParaEndereco(v.endereco),
    })
    if (!r.ok) { setEnviando(false); return setErro(r.mensagem) }
    location.assign(url(`clientes/?id=${r.id}`))
  }

  return (
    <Superficie como="section" className="mx-auto max-w-3xl p-4 md:p-6" aria-labelledby="novo-titulo">
      <form onSubmit={enviar} noValidate className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="novo-titulo" className="t-card">Dados do cliente</h2>
          <div className="w-64 max-sm:w-full">
            <SegmentadoDeVidro aria-label="Tipo de cliente" valor={v.tipo} aoMudar={(t) => setV({ ...v, tipo: t as Form["tipo"], documento: "" })}
              opcoes={[{ id: "pf", rotulo: "Pessoa física" }, { id: "pj", rotulo: "Empresa" }]} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo={v.tipo === "pf" ? "Nome completo" : "Razão social ou nome fantasia"} erro={mostrar.nome} className="sm:col-span-2">
            {(a) => <Input id={a.id} aria-describedby={a.descritoPor} aria-invalid={a.invalido || undefined} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} autoComplete={v.tipo === "pf" ? "name" : "organization"} />}
          </Campo>
          <Campo rotulo={doc} erro={mostrar.documento}>
            {(a) => <CampoDocumento key={v.tipo} aceita={v.tipo === "pf" ? "cpf" : "cnpj"} id={a.id} descritoPor={a.descritoPor} invalido={a.invalido} obrigatorio
              valor={v.documento} aoMudar={(d) => setV({ ...v, documento: d })} className="h-10" />}
          </Campo>
          <Campo rotulo="Telefone" erro={mostrar.telefone}>
            {(a) => <CampoTelefone id={a.id} descritoPor={a.descritoPor} invalido={a.invalido} obrigatorio valor={v.telefone} aoMudar={(t) => setV({ ...v, telefone: t })} className="h-10" />}
          </Campo>
          <Campo rotulo="E-mail (opcional)" erro={mostrar.email}>
            {(a) => <Input id={a.id} type="email" aria-describedby={a.descritoPor} aria-invalid={a.invalido || undefined} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" />}
          </Campo>
          <Switch isSelected={v.whatsapp} onChange={(w) => setV({ ...v, whatsapp: w })} className="min-h-10 self-end">Aceita avisos por WhatsApp</Switch>
        </div>
        <CamposEndereco valor={v.endereco} aoMudar={(endereco) => setV({ ...v, endereco })} erros={mostrar} />
        {existe && (
          <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_14%,transparent)] px-3 py-2.5 text-sm">
            <span className="min-w-0 flex-1 basis-56 text-pretty">Já existe <strong className="font-medium">{existe.cliente.nome}</strong> com este {existe.campo}.</span>
            <a href={url(`clientes/?id=${existe.cliente.id}`)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Abrir <span className="num">{existe.cliente.id}</span></a>
          </p>
        )}
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <a href={url("clientes/")} className={cn(buttonVariants({ variant: "ghost" }), "h-10")}><ArrowLeft /> Voltar para a lista</a>
          <Button type="submit" isPending={enviando} className="h-10 min-w-[11rem]"><UserPlus /> {enviando ? "Cadastrando…" : "Cadastrar cliente"}</Button>
        </div>
      </form>
    </Superficie>
  )
}
