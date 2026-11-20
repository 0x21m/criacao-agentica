// Camadas do detalhe (baixam só quando abrem, React.lazy): Editar (O + Desfazer, campos BR), Mesclar duplicados
// (P, "Não dá para desfazer depois de 1 minuto") e Anonimizar (P, confirmação digitando o nome). Nas duas P, o botão
// diz "Mesclando…"/"Anonimizando…" com a mesma largura, nada fecha durante a espera e o erro aparece aqui dentro.
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { BotaoLiquido } from "@/components/movimento"
import { normalizar } from "@/modulos/registro"
import { formatar } from "@/lib/documentos"
import { dataCurta, dataLonga } from "@/lib/formato"
import { clientes, digitos, duplicadosDe, salvarCliente, anonimizarCliente, exclusaoPendente, type Cliente } from "../dados"
import { fraseDosVinculos, mesclarClientes, vinculosDe } from "../acoes"
import { Campo, CamposEndereco, enderecoParaForm, formParaEndereco, validarContato, validarEndereco, type EnderecoForm } from "./campos"

export type QualDialogo = "editar" | "mesclar" | "anonimizar" | null

export default function Dialogos({ qual, c, aoFechar, aoSair }: { qual: QualDialogo; c: Cliente; aoFechar: () => void; aoSair: (id: string | null) => void }) {
  return (
    <>
      <EditarCliente c={c} aberto={qual === "editar"} aoFechar={aoFechar} />
      <MesclarClientes c={c} aberto={qual === "mesclar"} aoFechar={aoFechar} aoSair={aoSair} />
      <AnonimizarCliente c={c} aberto={qual === "anonimizar"} aoFechar={aoFechar} />
    </>
  )
}

// ---------- Editar ----------
type FormEditar = { nome: string; email: string; telefone: string; whatsapp: boolean; endereco: EnderecoForm }
const doCliente = (c: Cliente): FormEditar => ({ nome: c.nome, email: c.email, telefone: digitos(c.telefone), whatsapp: c.whatsappConsentido, endereco: enderecoParaForm(c.endereco) })

function EditarCliente({ c, aberto, aoFechar }: { c: Cliente; aberto: boolean; aoFechar: () => void }) {
  const [v, setV] = useState(() => doCliente(c))
  const [tentou, setTentou] = useState(false)
  useEffect(() => { if (aberto) { setV(doCliente(c)); setTentou(false) } }, [aberto, c])
  const erros = { ...validarContato(v), ...validarEndereco(v.endereco), ...(v.nome.trim().length < 2 ? { nome: "Escreva o nome." } : {}) }
  const mostrar = tentou ? erros : {}
  function salvar(e: React.FormEvent) {
    e.preventDefault()
    setTentou(true)
    if (Object.keys(erros).length) return
    void salvarCliente(c, {
      nome: v.nome.trim(), email: v.email.trim(), telefone: formatar.telefone(v.telefone), whatsappConsentido: v.whatsapp, endereco: formParaEndereco(v.endereco),
    })
    aoFechar()
  }
  return (
    <Dialog isOpen={aberto} onOpenChange={(o) => !o && aoFechar()} className="sm:max-w-2xl">
      <form onSubmit={salvar} className="grid gap-5" noValidate>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription className="break-words"><span className="num">{c.id}</span> · {c.tipo === "pj" ? "CNPJ" : "CPF"} <span className="num whitespace-nowrap">{c.documento}</span> (não muda)</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo={c.tipo === "pj" ? "Razão social ou nome fantasia" : "Nome completo"} erro={mostrar.nome} className="sm:col-span-2">
            {(a) => <Input id={a.id} aria-describedby={a.descritoPor} aria-invalid={a.invalido || undefined} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} autoComplete="name" />}
          </Campo>
          <Campo rotulo="E-mail" erro={mostrar.email}>
            {(a) => <Input id={a.id} type="email" aria-describedby={a.descritoPor} aria-invalid={a.invalido || undefined} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" />}
          </Campo>
          <Campo rotulo="Telefone" erro={mostrar.telefone}>
            {(a) => <CampoTelefone id={a.id} descritoPor={a.descritoPor} invalido={a.invalido} valor={v.telefone} aoMudar={(t) => setV({ ...v, telefone: t })} className="h-10" />}
          </Campo>
          <Switch isSelected={v.whatsapp} onChange={(w) => setV({ ...v, whatsapp: w })} className="min-h-10 sm:col-span-2">Aceita avisos por WhatsApp</Switch>
        </div>
        <CamposEndereco valor={v.endereco} aoMudar={(endereco) => setV({ ...v, endereco })} erros={mostrar} />
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar}>Cancelar</Button>
          <BotaoLiquido type="submit">Salvar</BotaoLiquido>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ---------- Mesclar ----------
function MesclarClientes({ c, aberto, aoFechar, aoSair }: { c: Cliente; aberto: boolean; aoFechar: () => void; aoSair: (id: string | null) => void }) {
  const todos = clientes.use()
  const sugeridos = useMemo(() => duplicadosDe(c, todos), [c, todos])
  const [busca, setBusca] = useState("")
  const [outroId, setOutroId] = useState<string>("")
  const [ficaId, setFicaId] = useState<string>(c.id)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => { if (aberto) { setBusca(""); setOutroId(sugeridos[0]?.id ?? ""); setFicaId(c.id); setErro(null) } }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps
  const t = normalizar(busca.trim())
  const achados = t.length >= 2 ? todos.filter((x) => x.id !== c.id && x.estado !== "anonimizado" && !sugeridos.includes(x) && (normalizar(x.nome).includes(t) || normalizar(x.id).includes(t))).slice(0, 4) : []
  const opcoes = [...sugeridos, ...achados]
  const outro = todos.find((x) => x.id === outroId)
  const fica = ficaId === c.id ? c : outro
  const sai = ficaId === c.id ? outro : c
  const vinc = sai ? vinculosDe(sai.id) : null

  async function mesclar() {
    if (!fica || !sai || enviando) return
    setEnviando(true); setErro(null)
    const r = await mesclarClientes(fica, sai)
    setEnviando(false)
    if (!r.ok) return setErro(r.mensagem)
    aoFechar()
    if (sai.id === c.id) aoSair(fica.id)
  }
  return (
    <Dialog isOpen={aberto} onOpenChange={(o) => { if (!o && !enviando) aoFechar() }} isDismissable={!enviando} className="sm:max-w-lg">
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void mesclar() }}>
        <DialogHeader>
          <DialogTitle>Mesclar cadastros</DialogTitle>
          <DialogDescription className="text-pretty">Junte dois cadastros da mesma pessoa. OS, horários, cobranças e conversas passam para o que fica; o outro some.</DialogDescription>
        </DialogHeader>
        <RadioGroup aria-label="Cadastro parecido" value={outroId} onChange={setOutroId} className="gap-2">
          <p className="t-card">{sugeridos.length ? "Parecidos com este" : "Nenhum cadastro parecido. Busque pelo nome ou código."}</p>
          {opcoes.map((x) => (
            <RadioGroupItem key={x.id} value={x.id} variante="cartao" className="min-h-12">
              <span className="block truncate font-medium" title={x.nome}>{x.nome}</span>
              <span className="block truncate text-xs text-muted-foreground"><span className="num">{x.id}</span> · <span className="num">{x.telefone}</span> · {x.email}</span>
            </RadioGroupItem>
          ))}
        </RadioGroup>
        <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar outro cadastro" aria-label="Buscar outro cadastro para mesclar" />
        {outro && (
          <RadioGroup aria-label="Qual cadastro fica" value={ficaId} onChange={setFicaId} className="grid gap-2 sm:grid-cols-2">
            <p className="t-card sm:col-span-2">Qual fica</p>
            {[c, outro].map((x) => (
              <RadioGroupItem key={x.id} value={x.id} variante="cartao" className="min-h-12">
                <span className="block truncate font-medium" title={x.nome}>{x.nome}</span>
                <span className="block text-xs text-muted-foreground"><span className="num">{x.id}</span> · desde <span className="num">{dataLonga(x.criadoEm)}</span></span>
              </RadioGroupItem>
            ))}
          </RadioGroup>
        )}
        {fica && sai && vinc && (
          <p className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_12%,transparent)] px-3 py-2 text-sm text-pretty">
            <span className="num whitespace-nowrap">{sai.id}</span> some.{" "}{Object.values(vinc).some(Boolean) ? <>{fraseDosVinculos(vinc).replace(/^./, (x) => x.toUpperCase())} {Object.values(vinc).reduce((s, n) => s + n, 0) === 1 ? "passa" : "passam"} para <span className="num whitespace-nowrap">{fica.id}</span>.</> : "Nada está ligado a ele."}
            {" "}<strong className="font-medium">Não dá para desfazer depois de 1 minuto.</strong>
          </p>
        )}
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>Cancelar</Button>
          <Button type="submit" isPending={enviando} isDisabled={!outro} className="min-w-[9rem]">{enviando ? "Mesclando…" : "Mesclar"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

// ---------- Anonimizar ----------
function AnonimizarCliente({ c, aberto, aoFechar }: { c: Cliente; aberto: boolean; aoFechar: () => void }) {
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tentou, setTentou] = useState(false)
  useEffect(() => { if (aberto) { setTexto(""); setErro(null); setTentou(false) } }, [aberto])
  const confere = normalizar(texto.trim()) === normalizar(c.nome)
  const pedido = exclusaoPendente(c)
  async function ir() {
    setTentou(true)
    if (!confere || enviando) return
    setEnviando(true); setErro(null)
    const r = await anonimizarCliente(c)
    setEnviando(false)
    if (!r.ok) setErro(r.mensagem)
    else aoFechar()
  }
  return (
    <Dialog isOpen={aberto} onOpenChange={(o) => { if (!o && !enviando) aoFechar() }} isDismissable={!enviando} className="sm:max-w-md">
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void ir() }}>
        <DialogHeader>
          <DialogTitle>Anonimizar {c.nome}?</DialogTitle>
          <DialogDescription className="text-pretty">
            {pedido ? <>Pedido do titular pelo portal em <span className="num">{dataCurta(pedido.em)}</span>. </> : null}
            O nome vira “Cliente removido” e o contato, o endereço e as notas são apagados. As OS e as notas fiscais ficam, como a lei exige.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-[var(--radius-lg)] bg-[color-mix(in_oklch,var(--alerta)_14%,transparent)] px-3 py-2 text-sm font-medium">Não dá para desfazer.</p>
        <Campo rotulo="Digite o nome do cliente para confirmar" erro={tentou && !confere ? `Escreva “${c.nome}” exatamente.` : null}>
          {(a) => <Input id={a.id} aria-describedby={a.descritoPor} aria-invalid={a.invalido || undefined} value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" autoFocus />}
        </Campo>
        {erro && <p role="alert" className="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negativo-texto">{erro}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onPress={aoFechar} isDisabled={enviando}>Manter os dados</Button>
          <Button type="submit" variant="destructive" isPending={enviando} className="min-w-[10rem]">{enviando ? "Anonimizando…" : "Anonimizar"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
