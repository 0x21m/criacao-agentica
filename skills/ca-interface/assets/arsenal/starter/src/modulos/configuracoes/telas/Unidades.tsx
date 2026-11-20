// Módulo Configurações (5.11) · /configuracoes/unidades/: as 2 unidades em cartões (endereço, horário, recursos da
// agenda e a equipe da unidade). Desktop: cartões lado a lado, da mesma altura; celular: lista. "Editar" abre a
// FolhaDeDetalhe (?id=pampulha) com o CEP que busca o endereço; salvar é otimista com Desfazer.
import { useMemo, useState, type FormEvent } from "react"
import { Clock, MapPin, MapPinned, Pencil, Phone, Users, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { FolhaDeDetalhe } from "@/components/base/FolhaDeDetalhe"
import { Cortado } from "@/components/base/texto"
import { CampoCep, CampoTelefone } from "@/components/mift/fluxos/campos-br"
import { Superficie } from "@/components/sistema/Superficie"
import { criarCepDeExemplo, editarCampo, preencherEndereco, type EnderecoPreenchivel } from "@/lib/cep"
import { cepValido, formatar, telefoneValido } from "@/lib/documentos"
import { EQUIPE, RECURSOS } from "@/proto/negocio"
import { usePode } from "@/proto/permissoes"
import { empresa, enderecoDe, salvarSecao, unidades, type Horario, type UnidadeCfg } from "../dados"
import { Campo, CascaConfig, TituloDoBloco } from "./comum"

// latência fixa: nada de Math.random() em tela
const consultarCep = criarCepDeExemplo({ latencia: () => 350 })

export const textoDoHorario = (h: Horario) =>
  `Seg a sex ${h.semana.abre}–${h.semana.fecha}${h.sabado ? ` · sáb ${h.sabado.abre}–${h.sabado.fecha}` : " · sáb fechado"} · dom fechado`

export default function Unidades() {
  const lista = unidades.use()
  const [f, setF] = useParametrosDaUrl({ id: "" })
  const aberta = lista.find((u) => u.id === f.id)
  return (
    <CascaConfig secao="unidades" titulo="Unidades" descricao={<>Onde a oficina atende <span className="num whitespace-nowrap text-muted-foreground">· {lista.length} unidades</span></>}>
      <ComDados capacidade="configuracoes_empresa" area="da gestão" rotulo="as unidades" estaVazio={!lista.length}
        esqueleto={<div className="grid gap-4 xl:grid-cols-2"><Esqueleto className="h-80" /><Esqueleto className="h-80" /></div>}
        vazio={<EstadoVazio icone={MapPinned} titulo="Nenhuma unidade" texto="Restaure os dados de exemplo em Configurações." />}>
        <ul className="grid gap-4 xl:grid-cols-2">
          {lista.map((u) => <li key={u.id} className="grid"><CartaoUnidade u={u} aoEditar={() => setF({ id: u.id })} /></li>)}
        </ul>
      </ComDados>
      <FolhaUnidade u={aberta} aoFechar={() => setF({ id: "" })} />
    </CascaConfig>
  )
}

function Linha({ icone: Icone, rotulo, children }: { icone: typeof MapPin; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{rotulo}</dt>
        <dd className="text-sm text-pretty">{children}</dd>
      </div>
    </div>
  )
}

function CartaoUnidade({ u, aoEditar }: { u: UnidadeCfg; aoEditar: () => void }) {
  const pode = usePode("configuracoes_empresa")
  const recursos = RECURSOS.filter((r) => r.unidade === u.id)
  const pessoas = EQUIPE.filter((p) => p.unidade === u.id)
  // o horário é um só, o da empresa (BASE: horário por unidade quando a agenda souber ler)
  const horario = empresa.use()[0]?.horario ?? u.horario
  return (
    <Superficie como="article" aria-labelledby={`un-${u.id}`} className="grid h-full content-start gap-4 p-4 md:p-6">
      <TituloDoBloco id={`un-${u.id}`} titulo={u.nome} descricao={u.funcao}
        acao={pode && <Button variant="outline" size="sm" onPress={aoEditar} className="pointer-coarse:min-h-10" aria-label={`Editar a unidade ${u.nome}`}><Pencil /> Editar</Button>} />
      <dl className="grid gap-3">
        <Linha icone={MapPin} rotulo="Endereço">{enderecoDe(u)}, <span className="num whitespace-nowrap">{formatar.cep(u.cep)}</span></Linha>
        <Linha icone={Phone} rotulo="Telefone"><span className="num whitespace-nowrap">{formatar.telefone(u.telefone)}</span></Linha>
        <Linha icone={Clock} rotulo="Horário (o da empresa)">{textoDoHorario(horario)}</Linha>
        <Linha icone={Wrench} rotulo={`Recursos da agenda · ${recursos.length}`}>
          <span className="flex flex-wrap gap-1.5 pt-1">
            {recursos.map((r) => <span key={r.id} className="inline-flex min-h-7 items-center rounded-full bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] px-2.5 text-xs whitespace-nowrap">{r.curto}</span>)}
          </span>
        </Linha>
        <Linha icone={Users} rotulo={`Equipe da unidade · ${pessoas.length}`}>{pessoas.length ? pessoas.map((p) => p.curto).join(", ") : "Ninguém fixo; quem atende todas as unidades aparece nas duas."}</Linha>
      </dl>
    </Superficie>
  )
}

type Rascunho = Pick<UnidadeCfg, "nome" | "funcao" | "cep" | "numero" | "telefone"> & EnderecoPreenchivel

function FolhaUnidade({ u, aoFechar }: { u?: UnidadeCfg; aoFechar: () => void }) {
  return (
    <FolhaDeDetalhe aberto={!!u} aoFechar={aoFechar} sobre={u ? "Unidade" : undefined} titulo={u?.nome ?? ""}
      rodape={u && (
        <>
          <Button variant="ghost" onPress={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-unidade">Salvar</Button>
        </>
      )}>
      {u && <FormUnidade key={`${u.id}-${u.versao}`} u={u} aoSalvar={aoFechar} />}
    </FolhaDeDetalhe>
  )
}

function FormUnidade({ u, aoSalvar }: { u: UnidadeCfg; aoSalvar: () => void }) {
  const inicial = useMemo<Rascunho>(() => ({ nome: u.nome, funcao: u.funcao, cep: u.cep, logradouro: u.logradouro, numero: u.numero, bairro: u.bairro, cidade: u.cidade, uf: u.uf, telefone: u.telefone }), [u])
  const [r, setR] = useState<Rascunho>(inicial)
  const [erros, setErros] = useState<Record<string, string | null>>({})
  const [falha, setFalha] = useState<string | null>(null)
  const campo = (c: "logradouro" | "bairro" | "cidade" | "uf", v: string) => setR((x) => editarCampo(x, c, v))
  async function enviar(e: FormEvent) {
    e.preventDefault()
    const n = {
      nome: r.nome.trim() ? null : "Dê um nome à unidade.",
      cep: cepValido(r.cep) ? null : "CEP com 8 números.",
      logradouro: r.logradouro?.trim() ? null : "Preencha a rua.",
      numero: r.numero.trim() ? null : "Preencha o número (ou s/n).",
      cidade: r.cidade?.trim() ? null : "Preencha a cidade.",
      uf: r.uf?.trim().length === 2 ? null : "2 letras.",
      telefone: telefoneValido(r.telefone) ? null : "Telefone com DDD.",
    }
    setErros(n)
    if (Object.values(n).some(Boolean)) return
    const { _daConsulta: _, ...limpo } = r
    const res = await salvarSecao(unidades, u, {
      ...limpo, nome: r.nome.trim(), funcao: r.funcao.trim(), logradouro: r.logradouro!.trim(), bairro: r.bairro?.trim() ?? "",
      cidade: r.cidade!.trim(), uf: r.uf!.trim().toUpperCase(),
    } as Partial<UnidadeCfg>, `salvar a unidade ${u.nome}`, "Unidade salva.")
    if (res.ok) aoSalvar(); else setFalha(res.mensagem)
  }
  return (
    <form id="form-unidade" noValidate onSubmit={enviar} className="grid gap-4">
      <Campo rotulo="Nome" erro={erros.nome}>{(a) => <Input {...a} value={r.nome} maxLength={40} onChange={(x) => setR({ ...r, nome: x.target.value })} className="h-10" />}</Campo>
      <Campo rotulo="O que funciona aqui">{(a) => <Input {...a} value={r.funcao} maxLength={60} onChange={(x) => setR({ ...r, funcao: x.target.value })} className="h-10" />}</Campo>
      <Campo rotulo="CEP" erro={erros.cep}>
        {(a) => <CampoCep id={a.id} descritoPor={a["aria-describedby"]} invalido={!!erros.cep} valor={r.cep} consultar={consultarCep}
          aoMudar={(cep) => setR((x) => ({ ...x, cep }))} aoEncontrar={(c) => setR((x) => preencherEndereco(x, c.endereco))} className="h-10 sm:max-w-48" />}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <Campo rotulo="Rua" erro={erros.logradouro}>{(a) => <Input {...a} value={r.logradouro ?? ""} onChange={(x) => campo("logradouro", x.target.value)} className="h-10" />}</Campo>
        <Campo rotulo="Número" erro={erros.numero}>{(a) => <Input {...a} value={r.numero} maxLength={10} onChange={(x) => setR({ ...r, numero: x.target.value })} className="h-10" />}</Campo>
      </div>
      <Campo rotulo="Bairro">{(a) => <Input {...a} value={r.bairro ?? ""} onChange={(x) => campo("bairro", x.target.value)} className="h-10" />}</Campo>
      <div className="grid gap-4 grid-cols-[minmax(0,1fr)_5rem]">
        <Campo rotulo="Cidade" erro={erros.cidade}>{(a) => <Input {...a} value={r.cidade ?? ""} onChange={(x) => campo("cidade", x.target.value)} className="h-10" />}</Campo>
        <Campo rotulo="UF" erro={erros.uf}>{(a) => <Input {...a} value={r.uf ?? ""} maxLength={2} autoCapitalize="characters" onChange={(x) => campo("uf", x.target.value.toUpperCase())} className="h-10" />}</Campo>
      </div>
      <Campo rotulo="Telefone" erro={erros.telefone}>
        {(a) => <CampoTelefone id={a.id} descritoPor={a["aria-describedby"]} invalido={!!erros.telefone} valor={r.telefone} aoMudar={(v) => setR({ ...r, telefone: v })} className="h-10 sm:max-w-56" />}
      </Campo>
      <p className="text-xs text-pretty text-muted-foreground">Endereço atual: <Cortado texto={enderecoDe(u)} className="inline-block max-w-full align-bottom" /></p>
      {falha && <p role="alert" className="text-sm text-pretty text-destructive">{falha} O que você digitou continua aqui.</p>}
    </form>
  )
}
