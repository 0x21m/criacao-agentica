// /site/checkout/ · fechar a compra da loja (5.13): Entrega ou retirada (um seletor só, preço e data junto de cada opção,
// CLI-38) → Seus dados (CPF com o porquê) → Pagamento (Pix do Financeiro). Fechar a compra é P: a venda nasce
// aguardando o Pix e os itens ficam reservados no estoque; o banco confirma sozinho (ou pela barra F) e a tela muda.
// Compra como convidado; a conta é oferecida na confirmação (CLI-21). Banner com o card da etapa, como no Portal.
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Package, Store, Truck, Zap } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BotaoLiquido } from "@/components/movimento"
import { CampoCep, CampoDocumento, CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { useProcessando } from "@/proto/dados"
import { ROTAS } from "@/proto/site"
import { cpfValido, formatar, telefoneValido } from "@/lib/documentos"
import { editarCampo, preencherEndereco, type CampoDoEndereco } from "@/lib/cep"
import { moeda } from "@/lib/formato"
import { cn } from "@/lib/utils"
import { lancamentos } from "@/modulos/financeiro/dados"
import { atendemos, consultarCep, fecharCompra, carrinho, opcoesDeFrete, retirada, type Entrega, type OpcaoFrete } from "../dados"
import { BannerDaEtapa, Campo, Etapas, PixDoSite, Texto } from "./comum"
import { useLinhasDoCarrinho } from "./Carrinho"

type Endereco = { cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; _daConsulta?: CampoDoEndereco[] }
type Pessoa = { nome: string; email: string; celular: string; cpf: string }
const ETAPAS = ["Entrega ou retirada", "Seus dados", "Pagamento"]
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
const ICONE = { retirada: Store, economica: Truck, expressa: Zap }

export default function Checkout() {
  const [pronto, setPronto] = useState(false)
  useEffect(() => setPronto(true), [])
  const { linhas, subtotal } = useLinhasDoCarrinho()
  const [feito, setFeito] = useState<{ pedidoId: string; lancamentoId: string } | null>(null)
  // fechar a compra esvazia o carrinho antes de a tela saber o número: o fluxo que começou continua montado
  const comecou = useRef(false)
  if (pronto && linhas.length) comecou.current = true
  if (!pronto) {
    return <BannerDaEtapa sobrelinha="Loja online" titulo="Fechar a compra"><div className="grid gap-3" aria-busy="true"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-40" /></div></BannerDaEtapa>
  }
  if (!linhas.length && !comecou.current) {
    return (
      <BannerDaEtapa sobrelinha="Loja online" titulo="Fechar a compra">
        <div role="status" className="grid justify-items-start gap-3">
          <p className="text-sm">Seu carrinho está vazio. Escolha os produtos na loja.</p>
          <LinkButton className="h-11" href={ROTAS.loja()}>Ver a loja</LinkButton>
        </div>
      </BannerDaEtapa>
    )
  }
  return <Fluxo linhas={linhas} subtotal={subtotal} feito={feito} aoFechar={setFeito} />
}

function Fluxo({ linhas, subtotal, feito, aoFechar }: { linhas: ReturnType<typeof useLinhasDoCarrinho>["linhas"]; subtotal: number; feito: { pedidoId: string; lancamentoId: string } | null; aoFechar: (f: { pedidoId: string; lancamentoId: string }) => void }) {
  const [etapa, setEtapa] = useState(feito ? 2 : 0)
  const [end, setEnd] = useState<Endereco>({ cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "MG" })
  // o CEP já calculado no produto ou no carrinho vem preenchido, com o endereço dele (editável)
  useEffect(() => {
    let c: string | null = null
    try { c = sessionStorage.getItem("site-cep-entrega") } catch {}
    if (!c) return
    const cep = c
    setEnd((e) => ({ ...e, cep }))
    const controle = new AbortController()
    consultarCep(cep, controle.signal).then((r) => { if (r.tipo === "encontrado") setEnd((e) => preencherEndereco(e, r.endereco)) }).catch(() => {})
    return () => controle.abort()
  }, [])
  const [tipo, setTipo] = useState<Entrega["tipo"]>("retirada")
  const [errosEnd, setErrosEnd] = useState<Partial<Record<keyof Endereco, string>>>({})
  const [pessoa, setPessoa] = useState<Pessoa>({ nome: "", email: "", celular: "", cpf: "" })
  const [errosP, setErrosP] = useState<Partial<Record<keyof Pessoa, string>>>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [resumo] = useState(() => ({ linhas, subtotal }))
  const enviando = useProcessando().size > 0
  const lans = lancamentos.use()
  const titulo = feito ? lans.find((l) => l.id === feito.lancamentoId) : undefined

  const base = feito || !linhas.length ? resumo : { linhas, subtotal }
  const ret = retirada()
  const entregas = end.cep.length === 8 ? opcoesDeFrete(end.cep, base.subtotal) : null
  const opcoes: OpcaoFrete[] = [ret, ...(entregas ?? [])]
  const escolhida = opcoes.find((o) => o.id === tipo) ?? ret
  const total = Math.round((base.subtotal + escolhida.preco) * 100) / 100
  const fora = end.cep.length === 8 && !entregas && !!end.cidade && !atendemos(end.cidade)

  const irPara = (i: number) => { setErroGeral(null); setEtapa(i); requestAnimationFrame(() => document.getElementById("etapa-titulo")?.focus()) }

  function conferirEntrega() {
    if (tipo === "retirada") return irPara(1)
    const e: typeof errosEnd = {}
    if (end.cep.length !== 8) e.cep = "Digite os 8 números do CEP."
    for (const k of ["logradouro", "numero", "bairro", "cidade"] as const) if (!end[k].trim()) e[k] = "Preencha este campo."
    setErrosEnd(e)
    if (!Object.keys(e).length) irPara(1)
  }
  function conferirPessoa() {
    const e: typeof errosP = {}
    if (pessoa.nome.trim().split(/\s+/).length < 2) e.nome = "Escreva nome e sobrenome."
    if (!emailValido(pessoa.email)) e.email = "Confira o e-mail: falta o @ ou o domínio."
    if (!telefoneValido(pessoa.celular, "celular")) e.celular = "Digite o celular com DDD: (31) 9 0000-0000."
    if (!cpfValido(pessoa.cpf)) e.cpf = pessoa.cpf ? "Este CPF não confere. Confira os números." : "Precisamos do CPF para a nota fiscal."
    setErrosP(e)
    if (!Object.keys(e).length) irPara(2)
  }
  async function pagar() {
    setErroGeral(null)
    const entrega: Entrega = { tipo: escolhida.id, preco: escolhida.preco, prazo: escolhida.prazo, cep: tipo === "retirada" ? undefined : formatar.cep(end.cep),
      endereco: tipo === "retirada" ? undefined : `${end.logradouro.trim()}, ${end.numero.trim()}${end.complemento.trim() ? `, ${end.complemento.trim()}` : ""}, ${end.bairro.trim()}, ${end.cidade.trim()}` }
    const r = await fecharCompra({
      itens: carrinho.ler(), entrega,
      pessoa: { nome: pessoa.nome, email: pessoa.email, celular: formatar.telefone(pessoa.celular), cpf: formatar.cpf(pessoa.cpf) },
      endereco: tipo === "retirada" ? undefined : { cep: formatar.cep(end.cep), logradouro: end.logradouro.trim(), numero: end.numero.trim(), complemento: end.complemento.trim() || undefined, bairro: end.bairro.trim(), cidade: end.cidade.trim(), uf: end.uf },
    })
    if (r.ok && r.pedidoId && r.lancamentoId) aoFechar({ pedidoId: r.pedidoId, lancamentoId: r.lancamentoId })
    else if (!r.ok) setErroGeral(r.mensagem)
  }

  const Resumo = (
    <div className="grid gap-1 rounded-[var(--radius-lg)] bg-muted/50 p-3 text-sm">
      {base.linhas.map(({ i, p }) => (
        <div key={i.id} className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate" title={p.nome}>{i.qtd} × {p.nome}</span><span className="num shrink-0">{moeda(i.qtd * p.preco)}</span></div>
      ))}
      <div className="flex items-baseline justify-between gap-3 text-muted-foreground"><span>{escolhida.rotulo}</span><span className="num">{escolhida.preco ? moeda(escolhida.preco) : "Grátis"}</span></div>
      <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border/60 pt-2 font-semibold"><span>Total</span><span className="num">{moeda(total)}</span></div>
    </div>
  )

  return (
    <BannerDaEtapa sobrelinha="Loja online" titulo={feito ? (titulo?.estado === "pago" ? "Compra confirmada" : "Pague com Pix") : "Fechar a compra"} descricao={`${base.linhas.length} ${base.linhas.length === 1 ? "produto" : "produtos"} · ${moeda(total)}`}>
      <Etapas etapas={ETAPAS} atual={etapa} aoVoltar={feito ? undefined : irPara} />
      <h2 id="etapa-titulo" tabIndex={-1} className="font-display text-xl font-semibold tracking-tight outline-none">{ETAPAS[etapa]}</h2>

      {etapa === 0 && (
        <>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Como receber</legend>
            {opcoes.map((o) => {
              const I = ICONE[o.id]
              return (
                <label key={o.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm shadow-[inset_0_0_0_1px_var(--border)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
                  <input type="radio" name="entrega" value={o.id} checked={tipo === o.id} onChange={() => setTipo(o.id)} className="size-4 shrink-0 accent-[var(--primary)]" />
                  <I className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="grid min-w-0 flex-1 gap-0.5"><span className="font-medium text-pretty">{o.rotulo}</span><span className="text-xs text-muted-foreground">{o.prazo}</span></span>
                  <span className="num shrink-0 font-medium">{o.preco ? moeda(o.preco) : "Grátis"}</span>
                </label>
              )
            })}
          </fieldset>
          {!entregas && !fora && <p className="flex items-start gap-2 text-sm text-muted-foreground"><Package className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Para ver a entrega em casa, digite o CEP abaixo.</p>}
          {fora && <p role="status" className="rounded-[var(--radius-lg)] bg-muted/70 p-3 text-sm text-pretty">Não entregamos em {end.cidade} ainda. A retirada no balcão da Pampulha continua valendo.</p>}
          <div className="grid gap-4 sm:grid-cols-6">
            <Campo id="cep" rotulo="CEP de entrega" opcional={tipo === "retirada"} erro={errosEnd.cep} className="sm:col-span-3">
              <CampoCep id="cep" valor={end.cep} aoMudar={(cep) => setEnd((e) => ({ ...e, cep }))} invalido={!!errosEnd.cep} consultar={consultarCep}
                aoEncontrar={(c) => setEnd((e) => preencherEndereco(e, c.endereco))} />
            </Campo>
            {tipo !== "retirada" && (
              <>
                <div className="hidden sm:col-span-3 sm:block" />
                <Campo id="logradouro" rotulo="Rua ou avenida" erro={errosEnd.logradouro} className="sm:col-span-4"><Texto id="logradouro" valor={end.logradouro} aoMudar={(v) => setEnd((e) => editarCampo(e, "logradouro", v))} autoComplete="address-line1" invalido={!!errosEnd.logradouro} /></Campo>
                <Campo id="numero" rotulo="Número" erro={errosEnd.numero} className="sm:col-span-2"><Texto id="numero" valor={end.numero} aoMudar={(v) => setEnd((e) => ({ ...e, numero: v }))} inputMode="numeric" invalido={!!errosEnd.numero} /></Campo>
                <Campo id="complemento" rotulo="Complemento" opcional className="sm:col-span-6"><Texto id="complemento" valor={end.complemento} aoMudar={(v) => setEnd((e) => ({ ...e, complemento: v }))} autoComplete="address-line2" /></Campo>
                <Campo id="bairro" rotulo="Bairro" erro={errosEnd.bairro} className="sm:col-span-3"><Texto id="bairro" valor={end.bairro} aoMudar={(v) => setEnd((e) => editarCampo(e, "bairro", v))} invalido={!!errosEnd.bairro} /></Campo>
                <Campo id="cidade" rotulo="Cidade" erro={errosEnd.cidade} className="sm:col-span-3"><Texto id="cidade" valor={end.cidade} aoMudar={(v) => setEnd((e) => editarCampo(e, "cidade", v))} invalido={!!errosEnd.cidade} /></Campo>
              </>
            )}
          </div>
          {Resumo}
          <Rodape voltar={() => location.assign(ROTAS.carrinho())} rotuloVoltar="Carrinho">
            <BotaoLiquido className="h-11 min-w-[12rem]" onClick={conferirEntrega}>Continuar <ArrowRight className="size-4" /></BotaoLiquido>
          </Rodape>
        </>
      )}

      {etapa === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nome" rotulo="Nome completo" erro={errosP.nome} className="sm:col-span-2"><Texto id="nome" valor={pessoa.nome} aoMudar={(v) => setPessoa((p) => ({ ...p, nome: v }))} autoComplete="name" invalido={!!errosP.nome} /></Campo>
            <Campo id="email" rotulo="E-mail" porque="Para o comprovante e para entrar no portal do cliente." erro={errosP.email}>
              <Texto id="email" type="email" valor={pessoa.email} aoMudar={(v) => setPessoa((p) => ({ ...p, email: v }))} autoComplete="email" inputMode="email" invalido={!!errosP.email} aria-describedby="email-porque" />
            </Campo>
            <Campo id="celular" rotulo="Celular" porque={tipo === "retirada" ? "Para avisar quando o pedido estiver pronto para retirar." : "Para a entrega avisar quando estiver a caminho."} erro={errosP.celular}>
              <CampoTelefone id="celular" so="celular" valor={pessoa.celular} aoMudar={(v) => setPessoa((p) => ({ ...p, celular: v }))} obrigatorio invalido={!!errosP.celular} descritoPor="celular-porque" />
            </Campo>
            <Campo id="cpf" rotulo="CPF" porque="Exigido para emitir a nota fiscal." erro={errosP.cpf}>
              <CampoDocumento id="cpf" aceita="cpf" valor={pessoa.cpf} aoMudar={(v) => setPessoa((p) => ({ ...p, cpf: v }))} obrigatorio invalido={!!errosP.cpf} descritoPor="cpf-porque" />
            </Campo>
          </div>
          {Resumo}
          <Rodape voltar={() => irPara(0)}>
            <BotaoLiquido className="h-11 min-w-[12rem]" onClick={conferirPessoa}>Ir para o pagamento <ArrowRight className="size-4" /></BotaoLiquido>
          </Rodape>
        </>
      )}

      {etapa === 2 && !feito && (
        <>
          {Resumo}
          <p className="text-xs text-pretty text-muted-foreground">Você pode desistir em até 7 dias depois de receber ou retirar, pelo portal, com o dinheiro de volta no Pix. Os itens ficam reservados enquanto o Pix vale.</p>
          {erroGeral && <p role="alert" className="text-sm text-pretty text-negativo-texto">{erroGeral} <a className="underline" href={ROTAS.carrinho()}>Abrir o carrinho</a></p>}
          <Rodape voltar={() => irPara(1)}>
            <BotaoLiquido className="h-11 min-w-[14rem]" onClick={() => void pagar()} disabled={enviando}>{enviando ? "Enviando…" : `Pagar ${moeda(total)} com Pix`}</BotaoLiquido>
          </Rodape>
        </>
      )}
      {etapa === 2 && feito && titulo && (
        <PixDoSite l={titulo} nome={pessoa.nome}
          depois={<LinkButton className="h-11 justify-self-start" href={ROTAS.confirmacao(feito.pedidoId)}>Ver a confirmação <ArrowRight /></LinkButton>} />
      )}
    </BannerDaEtapa>
  )
}

function Rodape({ voltar, rotuloVoltar = "Voltar", children }: { voltar: () => void; rotuloVoltar?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between")}>
      <Button variant="ghost" className="h-11" onPress={voltar}><ArrowLeft /> {rotuloVoltar}</Button>
      {children}
    </div>
  )
}
