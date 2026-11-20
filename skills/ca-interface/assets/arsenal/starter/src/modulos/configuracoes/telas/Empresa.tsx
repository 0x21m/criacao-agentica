// Módulo Configurações (5.11) · /configuracoes/empresa/: o formulário da empresa em seções (identificação,
// atendimento, horário e feriados, regras de venda e a chave Pix). Cada seção salva sozinha, otimista com Desfazer; a
// chave Pix é pessimista e pede confirmação ("Os próximos Pix vão para esta chave."), e só o dono troca.
import { useState } from "react"
import { Building2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { CampoDocumento, CampoMoeda, CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { cnpjValido, cpfValido, telefoneValido } from "@/lib/documentos"
import { aQuemPedir, usePapel, usePode } from "@/proto/permissoes"
import { cn } from "@/lib/utils"
import { empresa, salvarSecao, trocarChavePix, type Empresa as TEmpresa, type Faixa, type Feriado, type Horario } from "../dados"
import { Campo, CascaConfig, SecaoForm, useRascunho } from "./comum"

const emailValido = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
const dataCurta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

export default function Empresa() {
  const e = empresa.use()[0]
  return (
    <CascaConfig secao="empresa" titulo="Empresa" descricao="Dados, horário, regras de venda e Pix">
      <ComDados capacidade="configuracoes_empresa" area="da gestão" rotulo="os dados da empresa" estaVazio={!e}
        esqueleto={<div className="grid gap-4"><Esqueleto className="h-56" /><Esqueleto className="h-40" /><Esqueleto className="h-72" /></div>}
        vazio={<EstadoVazio icone={Building2} titulo="Nenhum dado da empresa" texto="Restaure os dados de exemplo em Configurações." />}>
        {() => (
          <>
            <Identificacao e={e} />
            <Atendimento e={e} />
            <HorarioEFeriados e={e} />
            <Regras e={e} />
            <ChavePix e={e} />
          </>
        )}
      </ComDados>
    </CascaConfig>
  )
}

function Identificacao({ e }: { e: TEmpresa }) {
  const { rascunho: r, setRascunho, sujo, descartar } = useRascunho({ nome: e.nome, razao: e.razao, cnpj: e.cnpj }, e.versao)
  const [erros, setErros] = useState<Record<string, string | null>>({})
  const validar = () => {
    const n = { nome: r.nome.trim() ? null : "Dê o nome fantasia.", razao: r.razao.trim() ? null : "A razão social vai na nota e no contrato.", cnpj: cnpjValido(r.cnpj) ? null : "CNPJ inválido. Confira os 14 caracteres." }
    setErros(n)
    return !Object.values(n).some(Boolean)
  }
  return (
    <SecaoForm titulo="Identificação" descricao="Vai na OS, no comprovante e no rodapé dos e-mails." sujo={sujo} validar={validar}
      aoDescartar={() => { setErros({}); descartar() }}
      aoSalvar={() => salvarSecao(empresa, e, { nome: r.nome.trim(), razao: r.razao.trim(), cnpj: r.cnpj }, "salvar a identificação da empresa", "Identificação salva.")}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <Campo rotulo="Nome fantasia" erro={erros.nome}>
          {(a) => <Input {...a} value={r.nome} maxLength={40} onChange={(x) => setRascunho({ ...r, nome: x.target.value })} className="h-10" />}
        </Campo>
        <Campo rotulo="CNPJ" erro={erros.cnpj}>
          {(a) => <CampoDocumento aceita="cnpj" id={a.id} descritoPor={a["aria-describedby"]} invalido={!!erros.cnpj} valor={r.cnpj} aoMudar={(v) => setRascunho({ ...r, cnpj: v })} className="h-10" />}
        </Campo>
        <Campo rotulo="Razão social" erro={erros.razao} className="md:col-span-2">
          {(a) => <Input {...a} value={r.razao} maxLength={120} onChange={(x) => setRascunho({ ...r, razao: x.target.value })} className="h-10" />}
        </Campo>
      </div>
    </SecaoForm>
  )
}

function Atendimento({ e }: { e: TEmpresa }) {
  const { rascunho: r, setRascunho, sujo, descartar } = useRascunho({ whatsapp: e.whatsapp, email: e.email }, e.versao)
  const [erros, setErros] = useState<Record<string, string | null>>({})
  const validar = () => {
    const n = { whatsapp: telefoneValido(r.whatsapp) ? null : "Telefone com DDD, 10 ou 11 números.", email: emailValido(r.email) ? null : "E-mail no formato nome@dominio.com.br." }
    setErros(n)
    return !Object.values(n).some(Boolean)
  }
  return (
    <SecaoForm titulo="Atendimento" descricao="Onde o cliente fala com a oficina. Aparece no site, no portal e nas mensagens." sujo={sujo} validar={validar}
      aoDescartar={() => { setErros({}); descartar() }}
      aoSalvar={() => salvarSecao(empresa, e, { whatsapp: r.whatsapp, email: r.email.trim() }, "salvar o atendimento", "Atendimento salvo.")}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <Campo rotulo="WhatsApp" erro={erros.whatsapp}>
          {(a) => <CampoTelefone id={a.id} descritoPor={a["aria-describedby"]} invalido={!!erros.whatsapp} valor={r.whatsapp} aoMudar={(v) => setRascunho({ ...r, whatsapp: v })} className="h-10" />}
        </Campo>
        <Campo rotulo="E-mail" erro={erros.email}>
          {(a) => <Input {...a} type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={r.email} onChange={(x) => setRascunho({ ...r, email: x.target.value })} className="h-10" />}
        </Campo>
      </div>
    </SecaoForm>
  )
}

/** Abre e fecha de uma faixa do horário. */
function CamposDaFaixa({ rotulo, faixa, aoMudar, erro }: { rotulo: string; faixa: Faixa; aoMudar: (f: Faixa) => void; erro?: string | null }) {
  return (
    <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{rotulo}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <Input type="time" aria-label={`${rotulo}: abre`} aria-invalid={erro ? true : undefined} value={faixa.abre} onChange={(x) => aoMudar({ ...faixa, abre: x.target.value })} className="h-10 w-full min-w-0 tabular-nums" />
        <span className="shrink-0 text-sm text-muted-foreground">às</span>
        <Input type="time" aria-label={`${rotulo}: fecha`} aria-invalid={erro ? true : undefined} value={faixa.fecha} onChange={(x) => aoMudar({ ...faixa, fecha: x.target.value })} className="h-10 w-full min-w-0 tabular-nums" />
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </fieldset>
  )
}

function HorarioEFeriados({ e }: { e: TEmpresa }) {
  const { rascunho: r, setRascunho, sujo, descartar } = useRascunho<{ horario: Horario; feriados: Feriado[] }>({ horario: e.horario, feriados: e.feriados }, e.versao)
  const [novo, setNovo] = useState({ data: "", nome: "" })
  const [erros, setErros] = useState<Record<string, string | null>>({})
  const faixaRuim = (f: Faixa | null) => (f && f.fecha <= f.abre ? "O fechamento vem depois da abertura." : null)
  const validar = () => {
    const n = { semana: faixaRuim(r.horario.semana), sabado: faixaRuim(r.horario.sabado) }
    setErros(n)
    return !n.semana && !n.sabado
  }
  function adicionar() {
    if (!novo.data || !novo.nome.trim()) return setErros({ ...erros, novo: "Escolha a data e dê um nome ao feriado." })
    if (r.feriados.some((f) => f.data === novo.data)) return setErros({ ...erros, novo: `${dataCurta(novo.data)} já está na lista.` })
    setRascunho({ ...r, feriados: [...r.feriados, { data: novo.data, nome: novo.nome.trim() }].sort((a, b) => a.data.localeCompare(b.data)) })
    setNovo({ data: "", nome: "" })
    setErros({ ...erros, novo: null })
  }
  return (
    <SecaoForm titulo="Horário e feriados" descricao="A agenda bloqueia fora do expediente e nos feriados." sujo={sujo} validar={validar}
      aoDescartar={() => { setErros({}); descartar() }}
      aoSalvar={() => salvarSecao(empresa, e, { horario: r.horario, feriados: r.feriados }, "salvar o horário", "Horário salvo.")}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        <CamposDaFaixa rotulo="Segunda a sexta" faixa={r.horario.semana} erro={erros.semana} aoMudar={(semana) => setRascunho({ ...r, horario: { ...r.horario, semana } })} />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
          <div className="flex min-h-6 items-center justify-between gap-3">
            <span id="emp-sabado" className="text-sm font-medium">Abre aos sábados</span>
            <Switch aria-labelledby="emp-sabado" isSelected={!!r.horario.sabado}
              onChange={(v) => setRascunho({ ...r, horario: { ...r.horario, sabado: v ? { abre: "08:00", fecha: "12:00" } : null } })} />
          </div>
          {r.horario.sabado
            ? <CamposDaFaixa rotulo="Sábado" faixa={r.horario.sabado} erro={erros.sabado} aoMudar={(sabado) => setRascunho({ ...r, horario: { ...r.horario, sabado } })} />
            : <p className="text-sm text-muted-foreground">Fechado aos sábados.</p>}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Domingo: fechado.</p>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
        <h3 className="text-sm font-medium">Feriados <span className="num font-normal text-muted-foreground">· {r.feriados.length}</span></h3>
        {r.feriados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum feriado. A agenda abre todos os dias úteis.</p>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
            {r.feriados.map((f) => (
              <li key={f.data} className="flex min-w-0 min-h-10 items-center gap-3 rounded-[calc(var(--radius)*0.9)] pl-3 hover:bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)]">
                <span className="num w-[5.5rem] shrink-0 text-sm text-muted-foreground">{dataCurta(f.data)}</span>
                <span className="min-w-0 flex-1 truncate text-sm" title={f.nome}>{f.nome}</span>
                <Button type="button" variant="ghost" size="icon" aria-label={`Tirar ${f.nome}`} className="size-10 shrink-0"
                  onPress={() => setRascunho({ ...r, feriados: r.feriados.filter((x) => x.data !== f.data) })}><X /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[10.5rem_minmax(0,1fr)_auto] sm:items-start">
          <Input type="date" aria-label="Data do novo feriado" value={novo.data} min="2026-01-01" max="2027-12-31" onChange={(x) => setNovo({ ...novo, data: x.target.value })} className="h-10 tabular-nums" />
          <Input aria-label="Nome do novo feriado" placeholder="Nome do feriado" value={novo.nome} maxLength={60}
            onChange={(x) => setNovo({ ...novo, nome: x.target.value })} onKeyDown={(k) => { if (k.key === "Enter") { k.preventDefault(); adicionar() } }} className="h-10" />
          <Button type="button" variant="outline" onPress={adicionar} className="h-10"><Plus /> Adicionar</Button>
        </div>
        {erros.novo && <p role="alert" className="text-sm text-destructive">{erros.novo}</p>}
      </div>
    </SecaoForm>
  )
}

function CampoNumero({ rotulo, valor, aoMudar, sufixo, ajuda, erro }: { rotulo: string; valor: number; aoMudar: (n: number) => void; sufixo: string; ajuda?: string; erro?: string | null }) {
  return (
    <Campo rotulo={rotulo} ajuda={ajuda} erro={erro}>
      {(a) => (
        <div className="flex items-center gap-2">
          <Input {...a} inputMode="numeric" value={Number.isFinite(valor) ? String(valor) : ""} maxLength={4}
            onChange={(x) => aoMudar(Number(x.target.value.replace(/\D/g, "") || NaN))} className="h-10 w-24 text-right tabular-nums" />
          <span className="text-sm text-muted-foreground">{sufixo}</span>
        </div>
      )}
    </Campo>
  )
}

function Regras({ e }: { e: TEmpresa }) {
  const inicial = { garantiaDias: e.garantiaDias, validadeDias: e.validadeDias, taxaVisita: e.taxaVisita, pixMinutos: e.pixMinutos, boletoDias: e.boletoDias }
  const { rascunho: r, setRascunho, sujo, descartar } = useRascunho(inicial, e.versao)
  const [erros, setErros] = useState<Record<string, string | null>>({})
  const faixa = (n: number, min: number, max: number, nome: string) => (Number.isFinite(n) && n >= min && n <= max ? null : `${nome} entre ${min} e ${max}.`)
  const validar = () => {
    const n = {
      garantiaDias: faixa(r.garantiaDias, 90, 365, "Garantia"), validadeDias: faixa(r.validadeDias, 1, 60, "Validade"),
      pixMinutos: faixa(r.pixMinutos, 5, 1440, "Prazo"), boletoDias: faixa(r.boletoDias, 1, 30, "Vencimento"),
    }
    setErros(n)
    return !Object.values(n).some(Boolean)
  }
  return (
    <SecaoForm titulo="Regras de venda" descricao="Valem para orçamentos, visitas e cobranças novas." sujo={sujo} validar={validar}
      aoDescartar={() => { setErros({}); descartar() }}
      aoSalvar={() => salvarSecao(empresa, e, r, "salvar as regras de venda", "Regras de venda salvas.")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CampoNumero rotulo="Garantia de serviço" sufixo="dias" ajuda="O CDC pede no mínimo 90 dias." valor={r.garantiaDias} erro={erros.garantiaDias} aoMudar={(n) => setRascunho({ ...r, garantiaDias: n })} />
        <CampoNumero rotulo="Validade do orçamento" sufixo="dias corridos" valor={r.validadeDias} erro={erros.validadeDias} aoMudar={(n) => setRascunho({ ...r, validadeDias: n })} />
        <Campo rotulo="Taxa de visita" ajuda="Abatida se o orçamento for aprovado.">
          {(a) => <CampoMoeda id={a.id} descritoPor={a["aria-describedby"]} valor={r.taxaVisita} aoMudar={(v) => setRascunho({ ...r, taxaVisita: v ?? 0 })} maximo={100000} className="h-10" />}
        </Campo>
        <CampoNumero rotulo="Pix expira em" sufixo="minutos" valor={r.pixMinutos} erro={erros.pixMinutos} aoMudar={(n) => setRascunho({ ...r, pixMinutos: n })} />
        <CampoNumero rotulo="Boleto vence em" sufixo="dias" valor={r.boletoDias} erro={erros.boletoDias} aoMudar={(n) => setRascunho({ ...r, boletoDias: n })} />
      </div>
    </SecaoForm>
  )
}

/** Tipo da chave Pix: e-mail, celular, CPF, CNPJ ou aleatória; null se não parece nenhuma. */
function tipoDaChave(c: string) {
  const s = c.trim()
  const dig = s.replace(/\D/g, "")
  if (emailValido(s)) return "e-mail"
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return "aleatória"
  if (/^[\d.\-/]+$/.test(s) && dig.length === 14 && cnpjValido(dig)) return "CNPJ"
  if (/^[\d.\-]+$/.test(s) && dig.length === 11 && cpfValido(dig)) return "CPF"
  if (/^\+?[\d\s()-]+$/.test(s) && telefoneValido(dig.replace(/^55(?=\d{10,11}$)/, ""))) return "celular"
  return null
}

function ChavePix({ e }: { e: TEmpresa }) {
  const papel = usePapel()
  const pode = usePode("configuracoes_pagamento")
  const { rascunho: r, setRascunho, sujo, descartar } = useRascunho({ pix: e.pix }, e.versao)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const tipo = tipoDaChave(r.pix)
  return (
    <>
      <SecaoForm titulo="Chave Pix" descricao="Para onde vão os Pix das cobranças. É uma integração de pagamento." sujo={sujo} rotuloSalvar="Trocar a chave"
        validar={() => { setErro(tipo ? null : "Use e-mail, celular, CPF, CNPJ ou chave aleatória."); return !!tipo }}
        aoDescartar={() => { setErro(null); descartar() }}
        aoSalvar={() => setConfirmar(true)}
        bloqueio={!pode ? `Só o dono troca a chave Pix. Peça a ${aQuemPedir(papel)}.` : undefined}>
        <Campo rotulo="Chave" erro={erro} ajuda={tipo ? `Chave do tipo ${tipo}.` : "E-mail, celular, CPF, CNPJ ou chave aleatória."}>
          {(a) => <Input {...a} value={r.pix} maxLength={77} autoCapitalize="none" spellCheck={false} onChange={(x) => { setRascunho({ pix: x.target.value }); if (erro) setErro(null) }} className={cn("h-10 md:max-w-md")} />}
        </Campo>
      </SecaoForm>
      <DialogoConfirmar aberto={confirmar} aoFechar={() => setConfirmar(false)}
        titulo="Trocar a chave Pix?"
        descricao={<>Os próximos Pix vão para esta chave: <strong className="break-all">{r.pix.trim()}</strong>. Os códigos já gerados continuam com a chave antiga até expirar.</>}
        voltar="Manter a atual" confirmar="Trocar a chave"
        aoConfirmar={() => trocarChavePix(e, r.pix.trim())} />
    </>
  )
}
