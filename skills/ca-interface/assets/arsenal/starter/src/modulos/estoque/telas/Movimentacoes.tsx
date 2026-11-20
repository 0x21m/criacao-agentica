// Módulo Estoque (5.6) · /estoque/movimentacoes/: o que entrou e saiu (imutável: correção é outro ajuste).
// TabelaDados com data, SKU, produto, tipo, unidade, quantidade com sinal, referência e quem fez; totais de entradas e
// saídas do recorte embaixo; lista abaixo de 1280 px. Filtros na URL (?q=FLT-0912&tipo=ajuste&unidade=contagem).
import { useMemo } from "react"
import { ArrowLeftRight, Download, Filter, MapPin, SearchX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados, type ColunaDados } from "@/components/base/TabelaDados"
import { agora } from "@/proto/relogio"
import { pode, usePapel } from "@/proto/permissoes"
import { UNIDADES, type Unidade } from "@/proto/negocio"
import { dataHora, numero } from "@/lib/formato"
import { url } from "@/lib/url"
import { cn } from "@/lib/utils"
import { TIPO_MOV, UNIDADES_ESTOQUE, movimentacoes, produtos, type Movimentacao, type TipoMov } from "../dados"
import { CabecalhoEstoque } from "./comum"

const PADRAO = { q: "", tipo: "todos", unidade: "todas" }
const sinal = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0")

function exportarCsv(lista: Movimentacao[], nome: (sku: string) => string) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const linhas = lista.map((m) => [m.id, new Date(m.em).toLocaleString("pt-BR"), m.sku, nome(m.sku), TIPO_MOV[m.tipo], UNIDADES[m.unidade].nome, String(m.qtd), m.ref ?? "", m.motivo ?? "", m.por].map(esc).join(";"))
  const csv = "﻿" + ["Id;Data;SKU;Produto;Tipo;Unidade;Quantidade;Referência;Motivo;Por", ...linhas].join("\r\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  a.download = `movimentacoes-${agora().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  toast.success(`${linhas.length} ${linhas.length === 1 ? "movimentação exportada" : "movimentações exportadas"} em CSV.`)
}

export default function Movimentacoes() {
  const [f, setF] = useParametrosDaUrl(PADRAO)
  const papel = usePapel()
  const ve = pode(papel, "estoque_historico")
  const todas = movimentacoes.use()
  const ps = produtos.use()
  const nome = useMemo(() => { const m = new Map(ps.map((p) => [p.id, p.nome])); return (sku: string) => m.get(sku) ?? sku }, [ps])
  const lista = useMemo(() => {
    const t = f.q.trim().toLowerCase()
    return todas.filter((m) => (f.tipo === "todos" || m.tipo === f.tipo) && (f.unidade === "todas" || m.unidade === f.unidade) &&
      (!t || m.sku.toLowerCase().includes(t) || nome(m.sku).toLowerCase().includes(t) || (m.ref ?? "").toLowerCase().includes(t) || m.por.toLowerCase().includes(t)))
  }, [todas, f, nome])
  const filtrado = f.q !== "" || f.tipo !== "todos" || f.unidade !== "todas"
  const limpar = () => setF({ q: "", tipo: "todos", unidade: "todas" })
  const entradas = lista.filter((m) => m.qtd > 0).reduce((s, m) => s + m.qtd, 0)
  const saidas = lista.filter((m) => m.qtd < 0).reduce((s, m) => s + m.qtd, 0)
  const rotuloFiltro = [f.tipo !== "todos" && TIPO_MOV[f.tipo as TipoMov], f.unidade !== "todas" && UNIDADES[f.unidade as Unidade]?.nome, f.q && `“${f.q}”`].filter(Boolean).join(" · ")

  const colunas: ColunaDados<Movimentacao>[] = [
    { id: "em", titulo: "Data", tipo: "data", largura: "8.75rem", valor: (m) => dataHora(m.em, { ano: false }) },
    { id: "sku", titulo: "SKU", tipo: "id", largura: "6rem", texto: (m) => m.sku,
      valor: (m) => <a href={url(`estoque/?id=${m.sku}`)} className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{m.sku}</a> },
    { id: "produto", titulo: "Produto", tipo: "texto", valor: (m) => nome(m.sku) },
    { id: "tipo", titulo: "Tipo", tipo: "texto", largura: "9rem", valor: (m) => TIPO_MOV[m.tipo], texto: (m) => (m.motivo ? `${TIPO_MOV[m.tipo]}: ${m.motivo}` : TIPO_MOV[m.tipo]) },
    { id: "unidade", titulo: "Unidade", tipo: "texto", largura: "6.5rem", valor: (m) => UNIDADES[m.unidade].nome },
    { id: "qtd", titulo: "Qtd.", tipo: "numero", largura: "4.5rem", texto: (m) => sinal(m.qtd),
      valor: (m) => <span className={cn("font-semibold", m.qtd > 0 ? "text-positive" : "text-negativo-texto")}>{sinal(m.qtd)}</span> },
    { id: "ref", titulo: "Referência", tipo: "texto", largura: "9rem", valor: (m) => m.ref ?? m.motivo ?? "—" },
    { id: "por", titulo: "Por", tipo: "pessoa", largura: "8.5rem", valor: (m) => m.por },
  ]

  return (
    <>
      <CabecalhoEstoque ativa="estoque/movimentacoes/" titulo="Movimentações" descricao="Entradas, saídas, ajustes e transferências dos últimos 30 dias"
        contagem={!ve ? undefined : filtrado ? `${lista.length} de ${todas.length}` : `${todas.length} movimentações`}>
        {ve && <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} rotuloBusca="Buscar movimentação" placeholder="Buscar SKU, produto, referência"
          filtrado={filtrado} aoLimpar={limpar}
          acoes={pode(papel, "estoque_exportar") && <Button variant="outline" className="h-10 rounded-full" onPress={() => exportarCsv(lista, nome)}><Download /> Exportar CSV</Button>}>
          <Select aria-label="Filtrar por tipo" selectedKey={f.tipo} onSelectionChange={(k) => setF({ tipo: String(k) })} className="w-full sm:w-52">
            <SelectTrigger className="h-10 rounded-full"><Filter /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem id="todos">Todos os tipos</SelectItem>
              {(Object.keys(TIPO_MOV) as TipoMov[]).map((t) => <SelectItem key={t} id={t}>{TIPO_MOV[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select aria-label="Filtrar por unidade" selectedKey={f.unidade} onSelectionChange={(k) => setF({ unidade: String(k) })} className="w-full sm:w-48">
            <SelectTrigger className="h-10 rounded-full"><MapPin /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem id="todas">As duas unidades</SelectItem>
              {UNIDADES_ESTOQUE.map((u) => <SelectItem key={u} id={u}>{UNIDADES[u].nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </BarraFerramentas>}
      </CabecalhoEstoque>

      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="estoque_historico" area="do estoque" rotulo="as movimentações" estaVazio={todas.length === 0}
          esqueleto={<div className="space-y-2">{Array.from({ length: 10 }, (_, i) => <Esqueleto key={i} className="h-12 rounded-lg" />)}</div>}
          vazio={<EstadoVazio icone={ArrowLeftRight} titulo="Nenhuma movimentação ainda." texto="Entradas de compra, vendas, saídas para OS e ajustes aparecem aqui assim que acontecem." />}>
          {() => lista.length === 0 ? (
            <EstadoVazio variante="filtro" icone={SearchX} titulo={`Nenhuma movimentação com ${rotuloFiltro}.`} texto="Tente outro termo ou limpe os filtros para ver todas."
              acao={<Button variant="outline" onPress={limpar}>Limpar filtros</Button>} />
          ) : (
            <div>
              <TabelaDados<Movimentacao>
                titulo="Entradas e saídas"
                colunas={colunas}
                linhas={lista}
                idDe={(m) => m.id}
                contagem={<><span className="num">{lista.length}</span> de <span className="num">{todas.length}</span></>}
                cartao={(m) => (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <a href={url(`estoque/?id=${m.sku}`)} className="num inline-flex min-h-10 items-center rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{m.sku}</a>
                      <span className={cn("num text-lg font-semibold", m.qtd > 0 ? "text-positive" : "text-negativo-texto")}>{sinal(m.qtd)}</span>
                    </div>
                    <span className="block truncate text-sm" title={nome(m.sku)}>{nome(m.sku)}</span>
                    <span className="block truncate text-xs text-muted-foreground" title={[TIPO_MOV[m.tipo], m.motivo, m.ref].filter(Boolean).join(" · ")}>
                      {TIPO_MOV[m.tipo]} · {UNIDADES[m.unidade].nome}{m.ref ? ` · ${m.ref}` : m.motivo ? ` · ${m.motivo}` : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground"><span className="num">{dataHora(m.em, { ano: false })}</span> · {m.por}</span>
                  </>
                )}
                totais={{ rotulo: "Totais do recorte", itens: [
                { rotulo: "Entradas", valor: `+${numero(entradas)}` },
                { rotulo: "Saídas", valor: `−${numero(Math.abs(saidas))}` },
                { rotulo: "Saldo do período", valor: sinal(entradas + saidas) },
              ] }}
              />
            </div>
          )}
        </ComDados>
      </div>
    </>
  )
}
