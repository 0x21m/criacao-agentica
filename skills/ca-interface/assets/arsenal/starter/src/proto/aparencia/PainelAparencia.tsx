// Painel de aparência: preset (Noite, Aurora, Areia), tema, vidro e os eixos do MIFT UI (pele, cantos, borda,
// densidade, destaque) mais profundidade, transparência e desfoque do vidro. Tudo muda na hora no app inteiro, fica no
// localStorage e é um sistema só: o preset escolhe a paleta, o fundo ambiente, o material e as fontes; os eixos
// ajustam por cima. A prévia ao lado é o próprio material (Superficie), não uma imagem.
import type { ReactNode } from "react"
import { Check, Monitor, Moon, RotateCcw, Sun, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { BotaoLiquido } from "@/components/movimento"
import { Superficie } from "@/components/sistema/Superficie"
import { BannerSobreposto } from "@/components/sistema/BannerSobreposto"
import { cn } from "@/lib/utils"
import { BORDAS, DENSIDADES, DESTAQUES, PRESETS, PROFUNDIDADES, RAIOS, SKINS } from "./presets"
import { ROTULOS, TEMAS, contraste, definir, ehHex, restaurarPadrao, textoSobre, trocarPreset, trocarTema, trocarVidro, useAparencia, type Aparencia } from "./aparencia"

const ICONE_TEMA = { claro: Sun, escuro: Moon, sistema: Monitor }
/** Amostra de cada destaque nomeado (a cor de verdade vem do CSS). "marca" é o acento do preset atual. */
const AMOSTRA: Record<string, string> = {
  marca: "var(--primary)", azul: "oklch(0.488 0.243 264.376)", violeta: "oklch(0.5 0.23 293)", esmeralda: "oklch(0.5 0.13 160)",
  ambar: "oklch(0.55 0.15 60)", rosa: "oklch(0.55 0.2 0)", grafite: "oklch(0.3 0.01 260)",
}
const opcao = "min-h-10 whitespace-nowrap rounded-full px-3 text-sm outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-ring aria-checked:font-semibold aria-checked:text-foreground aria-[checked=true]:nav-ativo"

function Grupo({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <Superficie como="section" aria-label={titulo} className="grid gap-4 p-4 md:p-6">
      <header>
        <h2 className="t-secao">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>}
      </header>
      {children}
    </Superficie>
  )
}

/**
 * Escolha única entre poucos valores: trilho com a opção marcada em pílula (role=radiogroup). Cada opção ocupa a largura
 * do próprio rótulo e divide a sobra (flex 1 1 auto); se não couber numa linha, o trilho quebra em duas. O rótulo nunca
 * corta (P2-8: "Arredondado", "Confortável", "Do preset" inteiros a 390 e a 1440).
 */
function Eixo<K extends keyof Aparencia>({ chave, rotulo, valores, nomes }: { chave: K; rotulo: string; valores: readonly string[]; nomes: Record<string, string> }) {
  const a = useAparencia()
  return (
    <div className="grid gap-2">
      <span id={`eixo-${chave}`} className="t-rotulo">{rotulo}</span>
      <div role="radiogroup" aria-labelledby={`eixo-${chave}`} className="flex flex-wrap gap-1 rounded-[1.5rem] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-1 shadow-[inset_0_0_0_1px_var(--sup-aro)]">
        {valores.map((v) => {
          const on = a[chave] === v
          return (
            <button key={v} type="button" role="radio" aria-checked={on} onClick={() => definir({ [chave]: v } as Partial<Aparencia>)}
              className={cn(opcao, "flex-[1_1_auto] text-muted-foreground", on && "nav-ativo")}>
              {nomes[v]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CartaoPreset({ p, on }: { p: (typeof PRESETS)[number]; on: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={() => trocarPreset(p.id)}
      className={cn("group/preset relative grid overflow-hidden rounded-[var(--raio-sup)] text-left outline-none transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0",
        on ? "shadow-[0_0_0_2px_var(--primary),0_12px_28px_-16px_var(--sombra-cor)]" : "shadow-[0_0_0_1px_var(--sup-aro),0_8px_20px_-16px_var(--sombra-cor)]")}>
      {/* miniatura: a base do preset com o brilho ambiente, o acento e uma superfície */}
      <span aria-hidden="true" className="relative block h-20" style={{ background: `radial-gradient(80% 90% at 15% 0%, ${p.amostra.brilho}, transparent 70%), ${p.amostra.base}` }}>
        <span className="absolute bottom-3 left-3 h-6 w-14 rounded-full" style={{ background: p.amostra.acento }} />
        <span className="absolute right-3 bottom-3 h-10 w-16 rounded-lg" style={{ background: "rgb(255 255 255 / 0.12)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.3), 0 0 0 1px rgb(255 255 255 / 0.1)" }} />
      </span>
      <span className="grid gap-0.5 bg-[color-mix(in_oklch,var(--sup-veu)_92%,transparent)] p-3">
        <span className="flex items-center justify-between gap-2">
          <span className="text-base leading-tight font-semibold" style={{ fontFamily: p.fontes.titulo }}>{p.nome}</span>
          {on ? <Check className="size-4 text-[var(--texto-primario)]" aria-hidden="true" /> : <span className="text-[11px] text-muted-foreground">{p.arquetipo}</span>}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">{p.descricao}</span>
      </span>
    </button>
  )
}

export default function PainelAparencia() {
  const a = useAparencia()
  const livre = ehHex(a.destaque)
  const texto = livre ? textoSobre(a.destaque) : "#ffffff"
  const razao = livre ? contraste(a.destaque, texto) : 0

  return (
    <BannerSobreposto variante="compacta" titulo="Aparência" descricao="Preset, tema, vidro e ajustes finos, guardados neste navegador" sobreposicao={40}
      acoes={<Button variant="outline" onPress={restaurarPadrao} className="border-[oklch(1_0_0/0.16)]"><RotateCcw /> Restaurar o preset</Button>}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 pb-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4">
          <Grupo titulo="Direção" descricao="Cada preset é um template completo: paleta, fundo ambiente, material, fontes, densidade e movimento. Os ajustes abaixo vão por cima.">
            <div role="radiogroup" aria-label="Direção" className="grid gap-5">
              {[{ titulo: "Arquétipos", lista: PRESETS.filter((p) => ["noite", "vidro", "sobrio"].includes(p.id)) },
                { titulo: "Variações do Moderno", lista: PRESETS.filter((p) => ["aurora", "sinal"].includes(p.id)) }].map((g) => (
                <div key={g.titulo} className="grid gap-2">
                  <p className="t-rotulo">{g.titulo}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {g.lista.map((p) => <CartaoPreset key={p.id} p={p} on={a.preset === p.id} />)}
                  </div>
                </div>
              ))}
            </div>
          </Grupo>

          <Grupo titulo="Tema e vidro" descricao="Claro ou escuro, e o vidro por cima dos dois: as 4 combinações são desenhadas em cada preset.">
            <div role="radiogroup" aria-label="Tema" className="flex flex-wrap gap-1 rounded-[1.5rem] bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] p-1 shadow-[inset_0_0_0_1px_var(--sup-aro)]">
              {TEMAS.map((t) => {
                const I = ICONE_TEMA[t.id]
                const on = a.tema === t.id
                return (
                  <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => trocarTema(t.id)}
                    className={cn(opcao, "flex flex-[1_1_auto] items-center justify-center gap-2 px-2.5 text-muted-foreground", on && "nav-ativo")}>
                    <I className="size-4 shrink-0" aria-hidden="true" /> <span>{t.id === "sistema" ? "Sistema" : t.nome}</span>
                  </button>
                )
              })}
            </div>
            <Switch isSelected={a.vidro} onChange={trocarVidro} className="min-h-10">Vidro: superfícies translúcidas com desfoque sobre o fundo ambiente</Switch>
            <div className={cn("grid gap-5 sm:grid-cols-2", !a.vidro && "opacity-60")}>
              <div className="grid gap-2">
                <div className="flex justify-between text-sm"><span id="r-opacidade" className="t-rotulo">Opacidade mínima</span><span className="num text-muted-foreground">{Math.round(a.vidroOpacidade * 100)}%</span></div>
                <Slider aria-labelledby="r-opacidade" value={a.vidroOpacidade} minValue={0.2} maxValue={0.9} step={0.05} isDisabled={!a.vidro}
                  onChange={(v) => definir({ vidroOpacidade: v as number })} />
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between text-sm"><span id="r-desfoque" className="t-rotulo">Desfoque</span><span className="num text-muted-foreground">{a.vidroDesfoque} px</span></div>
                <Slider aria-labelledby="r-desfoque" value={a.vidroDesfoque} minValue={12} maxValue={24} step={1} isDisabled={!a.vidro}
                  onChange={(v) => definir({ vidroDesfoque: v as number })} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{a.vidro ? "Cada nível tem uma opacidade mínima própria para o texto passar de 4,5:1; o controle só deixa mais opaco." : "Opacidade e desfoque valem com o vidro ligado."}</p>
          </Grupo>

          <Grupo titulo="Ajustes" descricao="Mudam ao vivo no app inteiro (atributos no <html>, como no MIFT UI).">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2"><Eixo chave="densidade" rotulo="Densidade" valores={DENSIDADES} nomes={ROTULOS.densidade} /></div>
              <Eixo chave="raio" rotulo="Cantos" valores={RAIOS} nomes={ROTULOS.raio} />
              <Eixo chave="borda" rotulo="Borda das superfícies" valores={BORDAS} nomes={ROTULOS.borda} />
              <Eixo chave="profundidade" rotulo="Profundidade" valores={PROFUNDIDADES} nomes={ROTULOS.profundidade} />
              <Eixo chave="skin" rotulo="Pele" valores={SKINS} nomes={ROTULOS.skin} />
            </div>
            <div className="grid gap-2 pt-4 shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span id="eixo-destaque" className="t-rotulo">Acento</span>
                {a.destaque !== "marca" && (
                  <span className="flex items-center gap-2">
                    <Badge variant="alerta">Ajuste manual</Badge>
                    <Button variant="ghost" size="sm" onPress={() => definir({ destaque: "marca" })}><RotateCcw /> Voltar ao acento do preset</Button>
                  </span>
                )}
              </div>
              <div role="radiogroup" aria-labelledby="eixo-destaque" className="flex flex-wrap items-center gap-1.5">
                {DESTAQUES.map((d) => (
                  <button key={d} type="button" role="radio" aria-checked={a.destaque === d} aria-label={ROTULOS.destaque[d]} title={ROTULOS.destaque[d]}
                    onClick={() => definir({ destaque: d })}
                    className="grid size-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:ring-offset-2 aria-checked:ring-offset-background">
                    <span className={cn("size-7 rounded-full shadow-[inset_0_1px_0_oklch(1_0_0/0.3),0_0_0_1px_var(--sup-aro)]", d === "marca" && "grid place-items-center text-[10px] font-bold text-primary-foreground")} style={{ background: AMOSTRA[d] }}>{d === "marca" ? "P" : null}</span>
                  </button>
                ))}
                <label className="inline-flex min-h-10 items-center gap-2 pl-2 text-sm">
                  <input type="color" value={livre ? a.destaque : "#2457d6"} onChange={(e) => definir({ destaque: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded-full border-0 bg-transparent p-0.5" aria-label="Acento em cor própria" />
                  Cor própria
                </label>
                {livre && (
                  <>
                    <Input aria-label="Acento em hexadecimal" value={a.destaque} className="num h-10 w-28"
                      onChange={(e) => ehHex(e.target.value) && definir({ destaque: e.target.value })} />
                    <span className="text-sm text-muted-foreground">
                      Texto {texto === "#ffffff" ? "branco" : "escuro"} · <span className="num">{razao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}:1</span>{" "}
                      {razao >= 4.5 ? <Badge variant="positivo">AA</Badge> : <Badge variant="alerta">abaixo de AA</Badge>}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">"P" é o acento do próprio preset. Um acento só por tela: ação principal, item ativo, ponto ao vivo e o destaque de um número.</p>
            </div>
          </Grupo>
        </div>

        {/* Prévia ao vivo do material: os cinco níveis lado a lado, com o preset atual. */}
        <div className="min-w-0 xl:sticky xl:top-[calc(var(--topo)+4rem)] xl:self-start">
          <Superficie nivel="casca" aria-label="Prévia" className="grid grid-cols-[minmax(0,1fr)] gap-3 p-3">
            <p className="t-rotulo-caixa px-1 pt-1">Prévia do material</p>
            <Superficie nivel="destaque" className="grid gap-1 p-4">
              <span className="t-rotulo">A receber hoje</span>
              <span className="t-kpi">R$ 18,4 mil</span>
              <span className="text-xs text-muted-foreground">nível destaque · núcleo escuro</span>
            </Superficie>
            <Superficie className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="t-card">Pedido #1042</p>
                  <p className="truncate text-sm text-muted-foreground">Troca de vitrine · Padaria Pão de Mel</p>
                </div>
                <Badge variant="alerta">Em andamento</Badge>
              </div>
              <Input placeholder="Campo de exemplo" aria-label="Campo de exemplo" />
              <div className="flex flex-wrap gap-2">
                <BotaoLiquido>Ação principal</BotaoLiquido>
                <Button variant="outline">Secundária</Button>
              </div>
            </Superficie>
            <Superficie tom="aviso" className="flex items-center gap-3 p-3 text-sm">
              <TriangleAlert className="size-4 shrink-0 text-alerta-texto" aria-hidden="true" />
              <span className="min-w-0">Card tingido pelo status (tom aviso)</span>
            </Superficie>
            <div className="flex flex-wrap gap-1.5 px-1 pb-1">
              <Badge variant="positivo">Concluído</Badge><Badge variant="azul">Novo</Badge><Badge variant="negativo">Atrasado</Badge><Badge variant="neutro">Cancelado</Badge>
            </div>
          </Superficie>
        </div>
      </div>
    </BannerSobreposto>
  )
}
