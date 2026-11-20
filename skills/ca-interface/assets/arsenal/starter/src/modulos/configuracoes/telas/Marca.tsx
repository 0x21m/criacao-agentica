// Módulo Configurações (5.11) · /configuracoes/marca/: logo, nome e cores do banner. Desktop: os campos e, ao lado, a
// prévia ao vivo (banner completo com o glass-fold do arsenal, o portal do cliente e o e-mail), trocada no segmentado.
// Celular: empilhado, a prévia embaixo. Salvar é otimista com Desfazer. O banner do app continua lendo o preset (BASE).
import { Suspense, lazy, useState } from "react"
import { Check, Palette } from "lucide-react"
import { Radio, RadioGroup } from "react-aria-components"
import { useReducedMotion } from "motion/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ComDados, Esqueleto, EstadoVazio } from "@/components/app/estados"
import { SegmentadoDeVidro } from "@/colecao/vidro-segmentado"
import { Superficie } from "@/components/sistema/Superficie"
import { useCoresDoTema } from "@/lib/tema"
import { useAparencia } from "@/proto/aparencia/aparencia"
import { presetPorId } from "@/proto/aparencia/presets"
import { cn } from "@/lib/utils"
import { CORES_DA_MARCA, LOGOS, empresa, enderecoDe, marca, salvarSecao, unidades, type CorDaMarca, type Logo, type Marca as TMarca } from "../dados"
import { Campo, CascaConfig, SecaoForm, TituloDoBloco, useRascunho } from "./comum"

const GlassFold = lazy(() => import("@/components/ui/glass-fold").then((m) => ({ default: m.GlassFold })))

type Rascunho = Pick<TMarca, "nome" | "assinatura" | "logo" | "cor">
const LIMITE = { nome: 32, assinatura: 60 }
// texto sobre o banner: claro sobre o shader e as cores da marca; escuro no banner plano do preset (Sóbrio)
const T1 = "text-white group-data-[claro]/marca:text-foreground"
const T2 = "text-white/75 group-data-[claro]/marca:text-muted-foreground"
/** O banner da marca sai claro? Só com "Do preset" num preset de banner plano. */
function useBannerClaro(cor: CorDaMarca) {
  const { preset } = useAparencia()
  return cor === "preset" && presetPorId(preset).banner === "plano"
}

export default function Marca() {
  const m = marca.use()[0]
  return (
    <CascaConfig secao="marca" titulo="Marca" descricao="Como a oficina aparece no app, no portal e nos e-mails">
      <ComDados capacidade="configuracoes_empresa" area="da gestão" rotulo="a marca" estaVazio={!m}
        esqueleto={<div className="grid gap-4 xl:grid-cols-2"><Esqueleto className="h-96" /><Esqueleto className="h-96" /></div>}
        vazio={<EstadoVazio icone={Palette} titulo="Nenhuma marca cadastrada" texto="Restaure os dados de exemplo em Configurações." />}>
        {() => <Conteudo m={m} />}
      </ComDados>
    </CascaConfig>
  )
}

function Conteudo({ m }: { m: TMarca }) {
  const { rascunho: r, setRascunho, sujo, descartar } = useRascunho<Rascunho>({ nome: m.nome, assinatura: m.assinatura, logo: m.logo, cor: m.cor }, m.versao)
  const [erroNome, setErroNome] = useState<string | null>(null)
  const mudar = (p: Partial<Rascunho>) => setRascunho({ ...r, ...p })
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-start">
      <SecaoForm titulo="Identidade" descricao="Vale para a equipe toda e para o cliente." sujo={sujo} aoDescartar={() => { setErroNome(null); descartar() }}
        validar={() => { const ok = r.nome.trim().length > 0; setErroNome(ok ? null : "Dê um nome à marca."); return ok }}
        aoSalvar={() => salvarSecao(marca, m, { ...r, nome: r.nome.trim(), assinatura: r.assinatura.trim() }, "salvar a marca", "Marca salva.")}
>
        <Campo rotulo="Nome" erro={erroNome} ajuda={`Até ${LIMITE.nome} caracteres. Aparece no topo do app e do portal.`}>
          {(a) => <Input {...a} value={r.nome} maxLength={LIMITE.nome} onChange={(e) => { mudar({ nome: e.target.value }); if (erroNome) setErroNome(null) }} className="h-10" />}
        </Campo>
        <Campo rotulo="Assinatura" ajuda="Uma linha embaixo do nome, no banner e no e-mail.">
          {(a) => <Input {...a} value={r.assinatura} maxLength={LIMITE.assinatura} onChange={(e) => mudar({ assinatura: e.target.value })} className="h-10" />}
        </Campo>
        <div className="grid gap-1.5">
          <Label id="marca-logo">Logo</Label>
          <RadioGroup aria-labelledby="marca-logo" value={r.logo} onChange={(v) => mudar({ logo: v as Logo })} className="grid grid-cols-3 gap-2">
            {LOGOS.map((l) => (
              <Radio key={l.id} value={l.id} className={({ isSelected, isFocusVisible }) => cn(
                "flex min-h-20 cursor-default flex-col items-center justify-center gap-1.5 rounded-[calc(var(--radius)*1.1)] border px-2 py-2 text-xs outline-none transition-[border-color,background-color,scale] duration-150 active:scale-[0.96] motion-reduce:active:scale-100",
                isSelected ? "border-primary bg-[color-mix(in_oklch,var(--primary)_10%,transparent)] font-medium text-foreground" : "border-[color-mix(in_oklch,var(--foreground)_12%,transparent)] text-muted-foreground hover:border-[color-mix(in_oklch,var(--foreground)_24%,transparent)]",
                isFocusVisible && "ring-3 ring-ring/50")}>
                <LogoDaMarca logo={l.id} nome={r.nome || "Oficina Norte"} className="size-8 text-foreground" />
                <span className="truncate">{l.nome}</span>
              </Radio>
            ))}
          </RadioGroup>
        </div>
        <div className="grid gap-1.5">
          <Label id="marca-cor">Cores do banner</Label>
          <RadioGroup aria-labelledby="marca-cor" value={r.cor} onChange={(v) => mudar({ cor: v as CorDaMarca })} className="flex flex-wrap gap-2">
            {CORES_DA_MARCA.map((c) => (
              <Radio key={c.id} value={c.id} className={({ isSelected, isFocusVisible }) => cn(
                "inline-flex min-h-10 cursor-default items-center gap-2 rounded-full border py-1 pr-3 pl-1.5 text-sm whitespace-nowrap outline-none transition-[border-color,scale] duration-150 active:scale-[0.96] motion-reduce:active:scale-100",
                isSelected ? "border-primary font-medium text-foreground" : "border-[color-mix(in_oklch,var(--foreground)_12%,transparent)] text-muted-foreground hover:border-[color-mix(in_oklch,var(--foreground)_24%,transparent)]",
                isFocusVisible && "ring-3 ring-ring/50")}>
                {({ isSelected }) => (
                  <>
                    <Amostra cor={c.id} />
                    {c.nome}
                    {isSelected && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                  </>
                )}
              </Radio>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">"Do preset" segue a aparência de cada pessoa.</p>
        </div>
      </SecaoForm>
      <Previa r={r} />
    </div>
  )
}

/** As três cores da amostra (corpo, fundo, luz); "Do preset" lê as do banner do tema atual. */
function Amostra({ cor }: { cor: CorDaMarca }) {
  const cores = CORES_DA_MARCA.find((c) => c.id === cor)?.cores
  const fundo = cores ? `conic-gradient(${cores[0]} 0 50%, ${cores[1]} 0 75%, ${cores[2]} 0)` : "conic-gradient(var(--banner-1) 0 50%, var(--banner-2) 0 75%, var(--banner-3) 0)"
  return <span aria-hidden="true" className="size-7 shrink-0 rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_14%,transparent)]" style={{ background: fundo }} />
}

/** O logo escolhido, em currentColor. */
export function LogoDaMarca({ logo, nome, className }: { logo: Logo; nome: string; className?: string }) {
  const iniciais = nome.split(/\s+/).filter((p) => /^\p{L}/u.test(p)).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?"
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <g fill="currentColor">
        {logo === "hexagono" && (<><path d="M50 8 88 30v40L50 92 12 70V30Z" opacity=".35" /><path d="M50 24 74 38v24L50 76 26 62V38Z" /></>)}
        {logo === "gota" && (<><path d="M50 6C50 6 16 44 16 64a34 34 0 0 0 68 0C84 44 50 6 50 6Z" opacity=".35" /><path d="M50 30C50 30 30 54 30 66a20 20 0 0 0 40 0C70 54 50 30 50 30Z" /></>)}
        {logo === "monograma" && (<><circle cx="50" cy="50" r="44" opacity=".35" /><text x="50" y="50" dy=".35em" textAnchor="middle" fontSize="38" fontWeight="700" fill="currentColor" style={{ fontFamily: "var(--font-display, inherit)" }}>{iniciais}</text></>)}
      </g>
    </svg>
  )
}

const VISTAS = [{ id: "banner", rotulo: "Banner" }, { id: "portal", rotulo: "Portal" }, { id: "email", rotulo: "E-mail" }]

/** Prévia ao vivo do rascunho (antes de salvar). */
function Previa({ r }: { r: Rascunho }) {
  const [vista, setVista] = useState("banner")
  const claro = useBannerClaro(r.cor)
  const email = empresa.use()[0]?.email ?? ""
  const matriz = unidades.use()[0]
  const nome = r.nome.trim() || "Sua marca"
  return (
    <Superficie como="section" aria-labelledby="marca-previa" className="grid gap-4 p-4 md:p-6 xl:sticky xl:top-[calc(var(--topo)+var(--faixa-fixa)+0.5rem)]">
      <TituloDoBloco id="marca-previa" titulo="Prévia" descricao="Muda enquanto você edita; ninguém vê antes de salvar." />
      <SegmentadoDeVidro aria-label="Onde ver a marca" opcoes={VISTAS} valor={vista} aoMudar={setVista} className="sm:w-80" />
      {vista === "banner" && <PreviaBanner r={r} nome={nome} />}
      {vista === "portal" && (
        <div className="overflow-hidden rounded-[calc(var(--radius)*1.2)] border border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] bg-background">
          <div className="flex items-center gap-2.5 border-b border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] px-4 py-3">
            <LogoDaMarca logo={r.logo} nome={nome} className="size-7 shrink-0 text-primary" />
            <span className="min-w-0 truncate font-semibold">{nome}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">Minha conta</span>
          </div>
          <div data-claro={claro || undefined} className="group/marca relative isolate overflow-hidden px-4 py-5">
            <FundoDaMarca cor={r.cor} pequeno />
            <p className={`text-xs ${T2}`}>Olá, Juliana</p>
            <p className={`t-secao ${T1}`}>Seu orçamento chegou</p>
          </div>
          <div className="grid gap-1 px-4 py-4 text-sm">
            <p className="font-medium">OS-1052 · Conserto de split</p>
            <p className="text-muted-foreground">Orçamento pronto: R$&nbsp;1.480,00. Válido até 26/11.</p>
          </div>
        </div>
      )}
      {vista === "email" && (
        <div className="overflow-hidden rounded-[calc(var(--radius)*1.2)] border border-[color-mix(in_oklch,var(--foreground)_10%,transparent)] bg-background text-sm">
          <div className="border-b border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] px-4 py-2.5 text-xs text-muted-foreground">
            <p className="truncate">De: {nome} &lt;{email}&gt;</p>
            <p className="truncate">Assunto: Seu orçamento da OS-1052</p>
          </div>
          <div data-claro={claro || undefined} className="group/marca relative isolate flex items-center gap-2.5 overflow-hidden px-4 py-4">
            <FundoDaMarca cor={r.cor} pequeno />
            <LogoDaMarca logo={r.logo} nome={nome} className={`size-8 shrink-0 ${T1}`} />
            <span className="min-w-0">
              <span className={`block truncate font-semibold ${T1}`}>{nome}</span>
              {r.assinatura && <span className={`block truncate text-xs ${T2}`}>{r.assinatura}</span>}
            </span>
          </div>
          <div className="grid gap-2 px-4 py-4">
            <p>Olá, Juliana.</p>
            <p className="text-pretty text-muted-foreground">O orçamento do conserto do seu split está pronto: R$&nbsp;1.480,00, válido até 26/11. Aprove pelo portal ou responda este e-mail.</p>
          </div>
          <p className="border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] px-4 py-2.5 text-xs text-pretty text-muted-foreground">{nome}{matriz ? ` · ${enderecoDe(matriz)}` : ""}</p>
        </div>
      )}
    </Superficie>
  )
}

/** O banner completo: o shader glass-fold nas cores escolhidas (parado com movimento reduzido). */
function PreviaBanner({ r, nome }: { r: Rascunho; nome: string }) {
  return (
    <div data-claro={useBannerClaro(r.cor) || undefined} className="group/marca relative isolate overflow-hidden rounded-[calc(var(--raio-sup)*1.1)] px-5 pt-6 pb-10 md:px-6">
      <FundoDaMarca cor={r.cor} />
      <div className="flex items-center gap-2.5">
        <LogoDaMarca logo={r.logo} nome={nome} className={`size-8 shrink-0 ${T1}`} />
        <span className={`min-w-0 truncate font-semibold ${T1}`}>{nome}</span>
      </div>
      <p className={`mt-6 text-sm ${T2}`}>Segunda, 16 de novembro</p>
      <p className={`t-pagina text-balance ${T1}`}>Bom dia, Marina</p>
      {r.assinatura && <p className={`mt-1 max-w-prose text-sm text-pretty ${T2}`}>{r.assinatura}</p>}
    </div>
  )
}

function FundoDaMarca({ cor, pequeno }: { cor: CorDaMarca; pequeno?: boolean }) {
  const reduzido = useReducedMotion()
  const { preset } = useAparencia()
  const doTema = useCoresDoTema({ a: "--banner-1", b: "--banner-2", c: "--banner-3" })
  const fixas = CORES_DA_MARCA.find((c) => c.id === cor)?.cores
  const cores = fixas ? { a: fixas[0], b: fixas[1], c: fixas[2] } : doTema
  // fundo enquanto o shader não chega (e no lugar dele, no preset de banner plano ou aberto, que pinta o banner claro)
  const base = fixas ? fixas[1] : "var(--banner-2, #0b1020)"
  const shader = !!fixas || presetPorId(preset).banner === "shader"
  const claro = useBannerClaro(cor)
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: base }}>
      {cores && shader && !pequeno && (
        <Suspense fallback={null}>
          <GlassFold color1={cores.a} color2={cores.b} color3={cores.c} speed={reduzido ? 0 : 0.18} scale={1.1} noise={0.08} className="size-full" />
        </Suspense>
      )}
      {(pequeno || !shader) && cores && (
        <div className="size-full" style={{ background: `radial-gradient(120% 140% at 85% 20%, ${cores.a} 0%, transparent 60%), radial-gradient(80% 90% at 100% 100%, color-mix(in oklch, ${cores.c} 33%, transparent) 0%, transparent 55%), ${cores.b}` }} />
      )}
      {!claro && <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(0_0_0/0.45),rgb(0_0_0/0.1)_70%)]" />}
    </div>
  )
}
