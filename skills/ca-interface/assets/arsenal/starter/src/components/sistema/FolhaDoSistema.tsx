// Folha do sistema (PRO-23): a prova visual do material do preset ativo, lida ao vivo dos tokens. A rota /sistema mostra
// as 4 combinações (claro e escuro, com e sem vidro) lado a lado, cada uma num iframe desta folha com
// ?preset=&tema=&vidro=&embutida=1 (os tokens moram no <html>, então cada combinação precisa do próprio documento).
// O contraste é medido no navegador sobre as cores reais (WCAG 2.x): texto 4,5:1, borda de controle 3:1.
// Porte da folha da barbearia (iteração 3), agora sobre os tokens do starter e a Superficie.
import * as React from "react"
import { toast } from "sonner"
import {
  CircleAlert, CircleCheck, Copy, Download, Filter, Inbox, LayoutDashboard, Package, Pencil, Plus, Search, Settings, Trash2, Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Superficie } from "@/components/sistema/Superficie"
import { BotaoLiquido } from "@/components/movimento"
import { SeloEixo } from "@/components/base/selos"
import { ATRASADA, ETAPA_OS } from "@/proto/projecao"
import { EstadoErro, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { ehEscuro, useAparencia } from "@/proto/aparencia/aparencia"
import { presetPorId } from "@/proto/aparencia/presets"
import { cn } from "@/lib/utils"

/** Resolve uma cor CSS (token ou expressão) em [r, g, b, a] num elemento de contexto. */
function rgba(css: string, ctx: Element): [number, number, number, number] {
  const sonda = document.createElement("span")
  sonda.style.cssText = "position:absolute;visibility:hidden"
  sonda.style.color = css.startsWith("--") ? `var(${css})` : css
  ctx.appendChild(sonda)
  const v = getComputedStyle(sonda).color
  sonda.remove()
  const c = document.createElement("canvas")
  c.width = c.height = 1
  const x = c.getContext("2d", { willReadFrequently: true })!
  x.clearRect(0, 0, 1, 1)
  x.fillStyle = v
  x.fillRect(0, 0, 1, 1)
  const d = x.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2], d[3] / 255]
}
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
/** Contraste de fg sobre bg; um bg translúcido é composto sobre o fundo da página. */
function razao(fg: string, bg: string, ctx: Element) {
  const base = rgba("--background", ctx)
  const compor = (c: number[]) => c[3] >= 1 ? c : [0, 1, 2].map((i) => c[i] * c[3] + base[i] * (1 - c[3]))
  const b = compor(rgba(bg, ctx)), f = compor(rgba(fg, ctx))
  const [l1, l2] = [lum(f), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

function Contraste({ fg, bg, min }: { fg: string; bg: string; min: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const ap = useAparencia()
  const [v, setV] = React.useState<number | null>(null)
  React.useEffect(() => {
    const ler = () => ref.current && setV(razao(fg, bg, ref.current))
    const t = setTimeout(ler, 60)
    return () => clearTimeout(t)
  }, [fg, bg, ap])
  const ok = v !== null && v >= min
  return (
    <span ref={ref} className={cn("num text-xs font-medium", v === null ? "text-muted-foreground" : ok ? "text-positive" : "text-negativo-texto")}>
      {v === null ? "…" : `${v.toFixed(2).replace(".", ",")}:1 ${ok ? "passa" : "reprova"} (≥ ${String(min).replace(".", ",")})`}
    </span>
  )
}

function Bloco({ n, t, children }: { n: number; t: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`b${n}`} className="grid gap-3">
      <h2 id={`b${n}`} className="t-secao"><span className="num text-muted-foreground">{n}.</span> {t}</h2>
      {children}
    </section>
  )
}

function Amostra({ v, nome }: { v: string; nome: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="size-8 shrink-0 rounded-md shadow-[inset_0_0_0_1px_var(--border)]" style={{ background: `var(${v})` }} />
      <span className="min-w-0 leading-tight"><span className="block text-xs font-medium">{nome}</span><code className="block truncate font-mono text-[11px] text-muted-foreground" title={v}>{v}</code></span>
    </div>
  )
}

export default function FolhaDoSistema() {
  const ap = useAparencia()
  const p = presetPorId(ap.preset)
  const escuro = ehEscuro(ap)
  return (
    <div className="grid gap-10 p-5 md:p-6">
      <header className="grid gap-1">
        <p className="t-rotulo">{escuro ? "Escuro" : "Claro"} · {ap.vidro ? "com vidro" : "sem vidro"} · {p.arquetipo}</p>
        <h1 className="t-pagina text-[1.75rem]">{p.nome}</h1>
        <p className="text-sm text-muted-foreground">{p.descricao}</p>
      </header>

      <Bloco n={1} t="Neutros e papéis">
        <div className="grid grid-cols-2 gap-3">
          {[["--background", "Fundo"], ["--card", "Superfície"], ["--popover", "Flutuante"], ["--muted", "Afundada"], ["--sidebar", "Casca"], ["--border", "Borda"], ["--input", "Borda de controle"], ["--muted-foreground", "Texto secundário"], ["--foreground", "Texto principal"], ["--sup-veu", "Véu do vidro"]].map(([v, n]) => <Amostra key={v} v={v} nome={n} />)}
        </div>
        <ul className="grid gap-1 text-sm">
          <li>Texto principal sobre o fundo: <Contraste fg="--foreground" bg="--background" min={4.5} /></li>
          <li>Texto secundário sobre o fundo: <Contraste fg="--muted-foreground" bg="--background" min={4.5} /></li>
          <li>Texto secundário sobre o card: <Contraste fg="--muted-foreground" bg="--card" min={4.5} /></li>
          <li>Texto secundário sobre o véu do vidro: <Contraste fg="--muted-foreground" bg="--sup-veu" min={4.5} /></li>
          <li>Borda de controle sobre o card: <Contraste fg="--input" bg="--card" min={3} /></li>
        </ul>
      </Bloco>

      <Bloco n={2} t="Acento (um só)">
        <div className="grid grid-cols-2 gap-3">
          <Amostra v="--primary" nome="Acento cheio" /><Amostra v="--texto-primario" nome="Acento como texto" />
          <Amostra v="--primary-foreground" nome="Texto sobre o acento" /><Amostra v="--ring" nome="Foco" />
        </div>
        <ul className="grid gap-1 text-sm">
          <li>Texto sobre o acento: <Contraste fg="--primary-foreground" bg="--primary" min={4.5} /></li>
          <li>Acento como texto sobre o fundo: <Contraste fg="--texto-primario" bg="--background" min={4.5} /></li>
        </ul>
        <p className="text-xs text-muted-foreground">Onde aparece: ação principal, item ativo, foco, ponto ao vivo e o destaque de um número.</p>
      </Bloco>

      <Bloco n={3} t="Semânticas (tingidas para a base)">
        <ul className="grid gap-1.5 text-sm">
          {[["Sucesso", "--positive"], ["Aviso", "--texto-alerta"], ["Perigo", "--texto-negativo"], ["Informação", "--texto-azul"]].map(([n, v]) => (
            <li key={v} className="flex flex-wrap items-center gap-2"><span className="size-4 rounded-full" style={{ background: `var(${v})` }} /><span className="w-24">{n}</span><Contraste fg={v} bg="--card" min={4.5} /></li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5">
          <SeloEixo p={ETAPA_OS.solicitada} /><SeloEixo p={ETAPA_OS.em_diagnostico} /><SeloEixo p={ETAPA_OS.aguardando_aprovacao} /><SeloEixo p={ETAPA_OS.pronta} /><SeloEixo p={ATRASADA} />
        </div>
      </Bloco>

      <Bloco n={4} t="Botões">
        <div className="flex flex-wrap items-center gap-2">
          <BotaoLiquido><Plus className="size-4" /> Ação principal</BotaoLiquido>
          <Button variant="outline">Secundária</Button>
          <Button variant="ghost">Discreta</Button>
          <Button variant="destructive"><Trash2 /> Excluir</Button>
          <Button variant="outline" size="icon" aria-label="Mais"><Settings /></Button>
          <Button isDisabled>Desabilitado</Button>
        </div>
      </Bloco>

      <Bloco n={5} t="Campos">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label htmlFor="f-nome">Nome do cliente</Label><Input id="f-nome" placeholder="Nome ou telefone" /></div>
          <div className="grid gap-1.5"><Label htmlFor="f-valor">Valor</Label><Input id="f-valor" defaultValue="1.250,00" className="num text-right" /></div>
          <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="f-erro">Com erro</Label><Input id="f-erro" aria-invalid placeholder="Obrigatório" /><p className="text-xs text-negativo-texto">Informe o nome ou o telefone do cliente.</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-5"><Checkbox defaultSelected className="min-h-10">Avisar pelo WhatsApp</Checkbox><Switch defaultSelected className="min-h-10">Lembrete 2 h antes</Switch></div>
      </Bloco>

      <Bloco n={6} t="Superfícies (um material, cinco níveis)">
        <div className="grid grid-cols-2 gap-3">
          <Superficie nivel="casca" className="p-3 text-sm"><b className="font-medium">Casca</b><br /><span className="text-xs text-muted-foreground">lateral, barras</span></Superficie>
          <Superficie className="p-3 text-sm"><b className="font-medium">Card</b><br /><span className="text-xs text-muted-foreground">o padrão</span></Superficie>
          <Superficie nivel="flutuante" className="p-3 text-sm"><b className="font-medium">Flutuante</b><br /><span className="text-xs text-muted-foreground">menu, sheet, diálogo</span></Superficie>
          <Superficie nivel="destaque" className="p-3 text-sm"><b className="font-medium">Destaque</b><br /><span className="text-xs text-muted-foreground">KPI-herói</span></Superficie>
          <Superficie interativa tom="sucesso" className="p-3 text-sm"><b className="font-medium">Tingido</b><br /><span className="text-xs text-muted-foreground">tom sucesso</span></Superficie>
          <Superficie interativa tom="perigo" className="p-3 text-sm"><b className="font-medium">Tingido</b><br /><span className="text-xs text-muted-foreground">tom perigo</span></Superficie>
        </div>
        <div className="faixa-marca tinta-destaque rounded-[var(--raio-sup)] p-4"><p className="t-card">Faixa de marca</p><p className="text-xs text-muted-foreground">banner e identidade de registro</p></div>
      </Bloco>

      <Bloco n={7} t="Estados">
        <div className="grid gap-3">
          <EstadoVazio icone={Inbox} titulo="Nenhum pedido ainda" texto="Quando o primeiro pedido entrar, ele aparece aqui." className="py-6" />
          <EstadoErro className="py-6" />
          <div className="grid gap-2" aria-hidden="true"><Esqueleto className="h-4 w-2/3" /><Esqueleto className="h-4 w-1/2" /><Esqueleto className="h-24" /></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onPress={() => toast.success("Pedido salvo.")}><CircleCheck /> Aviso de sucesso</Button>
            <Button variant="outline" size="sm" onPress={() => toast.error("Não foi possível salvar.", { description: "Nada foi perdido." })}><CircleAlert /> Aviso de erro</Button>
          </div>
        </div>
      </Bloco>

      <Bloco n={8} t="Tipografia (escala de app)">
        <div className="grid gap-2">
          <p className="t-assinatura">R$ 18,4 mil</p>
          <p className="t-pagina">Título de página · 20 a 24 px</p>
          <p className="t-secao">Título de seção · 16 px</p>
          <p className="t-card">Título de card · 15 px</p>
          <p className="text-sm">Texto de interface · 14 px. Ação, opções, São João, R$ 1.234,56.</p>
          <p className="t-rotulo">Rótulo e metadado · 12 px</p>
          <p className="t-kpi">1.240 <span className="text-base text-muted-foreground">pedidos</span></p>
          <p className="text-xs text-muted-foreground">Display: <span style={{ fontFamily: p.fontes.titulo }}>{p.fontes.titulo.split(",")[0].replace(/"/g, "")}</span> · Texto: {p.fontes.texto.split(",")[0].replace(/"/g, "")}</p>
        </div>
      </Bloco>

      <Bloco n={9} t="Ícones (Lucide, traço 1,75 a 2)">
        <div className="grid grid-cols-6 gap-3 text-muted-foreground">
          {[LayoutDashboard, Package, Users, Settings, Plus, Pencil, Copy, Trash2, Filter, Download, Search, Inbox].map((I, i) => <I key={i} className="size-5" aria-hidden="true" />)}
        </div>
      </Bloco>
    </div>
  )
}
