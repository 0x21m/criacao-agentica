// Módulo Equipe (5.10) · /equipe/auditoria/: quem fez o quê. Não tem coleção própria: lê o `historico` de cada coleção
// declarada (useTodasAsColecoes da base: OS, agenda, clientes, estoque, financeiro, equipe, matriz…) e mostra numa TabelaDados (quando, quem, ponta,
// objeto, o que, de → para), com filtros na URL (?q=&quem=&ponta=&periodo=). Automações aparecem como "Sistema · regra".
// PON-20: a tela abre só com "auditoria"; o financeiro (regra parcial) vê só os eventos de pagamento, e nada mais chega
// à tela (o recorte é feito antes de montar as linhas).
import { useMemo, useState } from "react"
import { History, SearchX, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { useTodasAsColecoes, type Evento, type Registro } from "@/proto/dados"
import { useAgora, DIA } from "@/proto/relogio"
import { UNIDADES } from "@/proto/negocio"
import { MATRIZ, PAPEIS, nomeDoPapel, pode, usePapel, type Papel, type Regra } from "@/proto/permissoes"
import { ETAPA_OS, type EtapaOS } from "@/proto/projecao"
import { url } from "@/lib/url"
import { normalizar } from "@/modulos/registro"
import { ESTADO_MEMBRO, rotuloRegra, type Ajuste, type EstadoMembro, type Membro } from "../dados"
import { CabecalhoEquipe } from "./comum"

type Linha = Evento & { id: string; objeto: string; caminho: string }
const PONTA: Record<Evento["quem"]["tipo"], string> = { pessoa: "Equipe", cliente: "Cliente", sistema: "Sistema" }
const PERIODOS = [{ id: "hoje", rotulo: "Hoje", dias: 0 }, { id: "7d", rotulo: "7 dias", dias: 7 }, { id: "30d", rotulo: "30 dias", dias: 30 }, { id: "tudo", rotulo: "Tudo", dias: Infinity }]
const PADRAO = { q: "", quem: "todos", ponta: "todas", periodo: "7d" }
const LOTE = 50 // 50 linhas por vez: a tabela e os cartões do celular hidratam juntos

/** Um valor de "de" ou "para" em texto, pelo eixo (os rótulos vêm da projeção e da matriz, nunca escritos aqui). */
function valorDoEixo(eixo: string | undefined, v: string | undefined) {
  if (!v) return undefined
  if (eixo === "etapa") return ETAPA_OS[v as EtapaOS]?.rotulo ?? v
  if (eixo === "papel") return PAPEIS.some((p) => p.id === v) ? nomeDoPapel(v as Papel) : v
  if (eixo === "estado") return ESTADO_MEMBRO[v as EstadoMembro]?.rotulo ?? v
  if (eixo === "unidade") return UNIDADES[v as keyof typeof UNIDADES]?.nome ?? v
  if (eixo === "permissao") return rotuloRegra((v === "true" ? true : v === "false" ? false : v) as Regra)
  return v
}
const VERBO: Record<string, string> = { etapa: "Mudou a etapa", papel: "Mudou o papel", unidade: "Mudou a unidade" }
/** O "o quê" sem repetir o de → para que já está na coluna própria. */
function oQue(e: Evento) {
  if (!e.de || !e.para || !e.texto.includes("→")) return e.texto
  return VERBO[e.eixo ?? ""] ?? e.texto.replace(/:\s[^:]*→[^:]*$/, "")
}
const deParaTexto = (e: Evento) => {
  const de = valorDoEixo(e.eixo, e.de), para = valorDoEixo(e.eixo, e.para)
  return de && para ? `${de} → ${para}` : para ? `→ ${para}` : "—"
}
const quemTexto = (e: Evento) => (e.quem.tipo === "sistema" ? "Sistema · regra" : e.quem.nome)
/** "16/11 09:41"; de outro ano, "03/02/25 09:41". */
const quando = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", ...(d.getFullYear() !== 2026 ? { year: "2-digit" } : {}), hour: "2-digit", minute: "2-digit" }).replace(",", "")
}

export default function Auditoria() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const papel = usePapel()
  const agora = useAgora()
  // todas as coleções declaradas (a base lê o registro): módulo novo com `historico` entra sem linha nova aqui
  const todasAsColecoes = useTodasAsColecoes()
  const [limite, setLimite] = useState(LOTE)
  const soFinanceiro = MATRIZ.auditoria[papel] === "parcial"
  // PON-20: sem "auditoria", nenhuma linha é montada (nem nomes no filtro, nem contagem no cabeçalho)
  const abre = pode(papel, "auditoria")

  // todas as linhas que este papel pode ver, da mais nova para a mais antiga
  const todas = useMemo(() => {
    if (!abre) return []
    const linhas: Linha[] = []
    const juntar = (h: Evento[], objeto: string, caminho: string, base: string) => h.forEach((e, i) => linhas.push({ ...e, id: `${base}#${i}`, objeto, caminho }))
    // o nome que a tabela mostra: a pessoa na equipe, o papel na matriz, o id nas outras
    const objetoDe = (nome: string, r: Registro) => nome === "equipe" ? (r as Membro).nome : nome === "ajustes_permissao" ? `Matriz · ${nomeDoPapel((r as Ajuste).papel)}` : r.id
    for (const c of todasAsColecoes) for (const r of c.lista) if (r.historico?.length) juntar(r.historico, objetoDe(c.nome, r), c.caminho?.(r) ?? "", `${c.nome}:${r.id}`)
    const visiveis = soFinanceiro ? linhas.filter((l) => l.eixo === "pagamento") : linhas
    // desempate pelo id: a ordem das coleções muda conforme a ordem dos imports (servidor × navegador)
    return visiveis.sort((a, b) => b.em.localeCompare(a.em) || a.id.localeCompare(b.id))
  }, [todasAsColecoes, soFinanceiro, abre])

  const pessoas = useMemo(() => [...new Set(todas.filter((l) => l.quem.tipo === "pessoa").map((l) => l.quem.nome))].sort((a, b) => a.localeCompare(b, "pt-BR")), [todas])
  const lista = useMemo(() => {
    const dias = PERIODOS.find((p) => p.id === f.periodo)?.dias ?? 7
    const desde = dias === 0 ? new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime() : agora.getTime() - dias * DIA
    const t = normalizar(f.q.trim())
    return todas.filter((l) => new Date(l.em).getTime() >= desde &&
      (f.quem === "todos" || (f.quem === "sistema" ? l.quem.tipo === "sistema" : l.quem.nome === f.quem)) &&
      (f.ponta === "todas" || l.quem.tipo === f.ponta) &&
      (!t || normalizar(l.objeto).includes(t) || normalizar(l.texto).includes(t) || normalizar(l.quem.nome).includes(t)))
  }, [todas, f, agora])
  const filtrado = f.q !== "" || f.quem !== "todos" || f.ponta !== "todas" || f.periodo !== PADRAO.periodo
  const limpar = () => { setF({ q: "", quem: "todos", ponta: "todas", periodo: PADRAO.periodo }); setLimite(LOTE) }
  const nomePeriodo = { hoje: "hoje", "7d": "nos últimos 7 dias", "30d": "nos últimos 30 dias" }[f.periodo] ?? ""
  const naPonta = f.ponta !== "todas" ? ` na ponta ${PONTA[f.ponta as Evento["quem"]["tipo"]]}` : ""
  const tituloVazio = f.quem !== "todos"
    ? `Nenhuma mudança ${f.quem === "sistema" ? "do sistema" : `de ${f.quem.split(" ")[0]}`}${naPonta} neste período.`
    : `Nenhuma mudança${naPonta} ${f.q ? `com “${f.q}” ` : ""}${f.periodo === "tudo" ? "registrada" : nomePeriodo}.`

  return (
    <>
      <CabecalhoEquipe
        tela="auditoria"
        titulo="Auditoria"
        descricao={soFinanceiro ? "Quem mexeu em pagamentos, e quando" : "Quem fez o quê, quando e em qual registro"}
        contagem={abre ? `${lista.length} ${lista.length === 1 ? "evento" : "eventos"}` : undefined}
      >
        {abre && <BarraFerramentas busca={f.q} aoBuscar={(q) => { setF({ q }); setLimite(LOTE) }} rotuloBusca="Buscar na auditoria" placeholder="Buscar registro ou ação" filtrado={filtrado} aoLimpar={limpar}>
          <Select aria-label="Período" selectedKey={f.periodo} onSelectionChange={(k) => { setF({ periodo: String(k) }); setLimite(LOTE) }} className="w-[calc(50%-0.25rem)] sm:w-44">
            <SelectTrigger className="h-10 rounded-full"><History /><SelectValue className="!block truncate" /></SelectTrigger>
            <SelectContent>{PERIODOS.map((p) => <SelectItem key={p.id} id={p.id}>{p.rotulo}</SelectItem>)}</SelectContent>
          </Select>
          <Select aria-label="Ponta" selectedKey={f.ponta} onSelectionChange={(k) => { setF({ ponta: String(k) }); setLimite(LOTE) }} className="w-[calc(50%-0.25rem)] sm:w-40">
            <SelectTrigger className="h-10 rounded-full"><SelectValue className="!block truncate" /></SelectTrigger>
            <SelectContent>
              <SelectItem id="todas">Ponta: todas</SelectItem>
              {(Object.keys(PONTA) as Evento["quem"]["tipo"][]).map((p) => <SelectItem key={p} id={p}>{PONTA[p]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select aria-label="Quem fez" selectedKey={f.quem} onSelectionChange={(k) => { setF({ quem: String(k) }); setLimite(LOTE) }} className="w-full sm:w-52">
            <SelectTrigger className="h-10 rounded-full"><UserRound /><SelectValue className="!block truncate" /></SelectTrigger>
            <SelectContent>
              <SelectItem id="todos">Pessoa: todas</SelectItem>
              <SelectItem id="sistema">Sistema · regras</SelectItem>
              {pessoas.map((n) => <SelectItem key={n} id={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </BarraFerramentas>}
      </CabecalhoEquipe>

      <div className="grid gap-3 px-4 pt-4 pb-6 md:px-6">
        <ComDados
          capacidade="auditoria" area="do dono e da gestora" rotulo="a auditoria"
          esqueleto={<div className="space-y-2">{Array.from({ length: 10 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>}
          estaVazio={todas.length === 0}
          vazio={soFinanceiro
            ? <EstadoVazio icone={History} titulo="Nenhum pagamento registrado ainda" texto="Cada recebimento, Pix e estorno aparece aqui, com quem fez e quando." />
            : <EstadoVazio icone={History} titulo="Nada registrado ainda" texto="Cada mudança em OS, agenda, clientes e equipe aparece aqui, com quem fez e quando." />}
        >
          {() => lista.length === 0 ? (
            <EstadoVazio variante="filtro" icone={SearchX} titulo={tituloVazio} texto="Amplie o período ou limpe os filtros."
              acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
          ) : (
            <>
              <Tabela lista={lista.slice(0, limite)} total={lista.length} />
              {lista.length > limite && (
                <div data-grupo className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                  <span>Mostrando <span className="num">{limite}</span> de <span className="num">{lista.length}</span></span>
                  <Button variant="outline" onPress={() => setLimite((n) => n + LOTE)}>Mostrar mais {Math.min(LOTE, lista.length - limite)}</Button>
                </div>
              )}
            </>
          )}
        </ComDados>
      </div>
    </>
  )
}

function LinkObjeto({ l, className }: { l: Linha; className?: string }) {
  if (!l.caminho) return <span title={l.objeto} className={`num block truncate font-medium ${className ?? ""}`}>{l.objeto}</span>
  return <a href={url(l.caminho)} title={l.objeto} className={`num block truncate rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}>{l.objeto}</a>
}

function Tabela({ lista, total }: { lista: Linha[]; total: number }) {
  // duas linhas por célula: "o quê" com o de → para embaixo; "quem" com a ponta embaixo (sem colunas quase vazias)
  const duas = (cima: string, baixo?: string) => (
    <span className="grid min-w-0 leading-tight">
      <span className="truncate" title={cima}>{cima}</span>
      {baixo && <span className="truncate text-xs text-muted-foreground" title={baixo}>{baixo}</span>}
    </span>
  )
  const colunas: ColunaDados<Linha>[] = [
    { id: "objeto", titulo: "Registro", tipo: "id", largura: "10rem", texto: (l) => l.objeto, valor: (l) => <LinkObjeto l={l} /> },
    { id: "oque", titulo: "O que mudou", tipo: "texto", texto: (l) => `${oQue(l)} ${deParaTexto(l)}`, valor: (l) => duas(oQue(l), deParaTexto(l) !== "—" ? deParaTexto(l) : undefined) },
    { id: "quem", titulo: "Quem", tipo: "pessoa", largura: "12rem", texto: (l) => quemTexto(l), valor: (l) => duas(quemTexto(l), l.quem.tipo === "sistema" ? undefined : PONTA[l.quem.tipo]) },
    { id: "quando", titulo: "Quando", tipo: "data", largura: "8rem", valor: (l) => quando(l.em) },
  ]
  return (
    <TabelaDados<Linha>
      titulo="Mudanças"
      colunas={colunas}
      linhas={lista}
      idDe={(l) => l.id}
      quebra="lg"
      contagem={<><span className="num">{lista.length}</span> de <span className="num">{total}</span></>}
      cartao={(l) => (
        <div className="grid gap-1">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <LinkObjeto l={l} className="text-sm" />
            <span className="num shrink-0 text-xs text-muted-foreground">{quando(l.em)}</span>
          </div>
          <p className="text-sm text-pretty">{oQue(l)}</p>
          {deParaTexto(l) !== "—" && <p className="truncate text-xs text-muted-foreground" title={deParaTexto(l)}>{deParaTexto(l)}</p>}
          <p className="truncate text-xs text-muted-foreground">{quemTexto(l)}{l.quem.tipo === "sistema" ? "" : ` · ${PONTA[l.quem.tipo]}`}</p>
        </div>
      )}
    />
  )
}

