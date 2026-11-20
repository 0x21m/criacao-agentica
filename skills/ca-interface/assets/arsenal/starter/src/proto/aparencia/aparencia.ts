// Estado da aparência: um sistema só. O preset (data-preset) traz a paleta, o fundo ambiente, o material e as fontes;
// os eixos ajustam por cima. Tokens em src/styles/sistema.css.
// Estado da aparência: um sistema só com os eixos do MIFT UI (skin, raio, borda, destaque, densidade, por atributo
// na raiz, como em src/lib/skins.ts do MIFT) e os do starter (tema claro/escuro/sistema, vidro independente,
// profundidade, transparência e desfoque do vidro, fontes do preset, destaque em cor livre).
// Guardado no localStorage; o script inline do Base.astro reaplica antes da pintura, para não piscar.
import { useSyncExternalStore } from "react"
import {
  BORDAS, DENSIDADES, DESTAQUES, PRESETS, PRESET_PADRAO, PROFUNDIDADES, RAIOS, SKINS, TEMAS_IDS, presetPorId,
  type Borda, type Densidade, type Preset, type Profundidade, type Raio, type Skin, type Tema,
} from "./presets"

export type Aparencia = {
  preset: string
  tema: Tema
  vidro: boolean
  skin: Skin
  raio: Raio
  borda: Borda
  /** Nome de um destaque do MIFT ou cor própria "#rrggbb". */
  destaque: string
  densidade: Densidade
  profundidade: Profundidade
  vidroOpacidade: number // 0,2–0,9
  vidroDesfoque: number // px
}

// v2 (fase 1): presets Noite, Aurora e Areia; o que estava guardado antes não vale mais.
export const CHAVE = "proto-aparencia-v2"
export const TEMAS: { id: Tema; nome: string }[] = [
  { id: "claro", nome: "Claro" }, { id: "escuro", nome: "Escuro" }, { id: "sistema", nome: "Seguir o sistema" },
]
export const ROTULOS = {
  skin: { padrao: "Do preset", suave: "Suave", nitida: "Nítida", noturna: "Noturna" },
  raio: { compacto: "Compacto", padrao: "Padrão", arredondado: "Arredondado", pilula: "Pílula" },
  borda: { linha: "Contorno", sombra: "Sombra", nenhuma: "Só o tom" },
  densidade: { compacta: "Compacta", padrao: "Padrão", confortavel: "Confortável", campo: "Campo" },
  profundidade: { plana: "Plana", padrao: "Padrão", funda: "Funda" },
  destaque: { marca: "Do preset", azul: "Azul", violeta: "Violeta", esmeralda: "Esmeralda", ambar: "Âmbar", rosa: "Rosa", grafite: "Grafite" },
} as const

export function doPreset(p: Preset, temaAtual: Tema = "claro"): Aparencia {
  return {
    preset: p.id, tema: p.tema ?? temaAtual, vidro: p.vidro, skin: p.skin, raio: p.raio, borda: p.borda,
    destaque: p.destaque, densidade: p.densidade, profundidade: p.profundidade, vidroOpacidade: p.vidroOpacidade ?? 0.6, vidroDesfoque: 20,
  }
}
export const PADRAO = doPreset(PRESET_PADRAO)

// ---------- contraste (WCAG) para o texto sobre um destaque em cor livre ----------
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contraste = (a: string, b: string) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
const ESCURO_TEXTO = "#111318"
/** Branco ou quase preto, o que tiver mais contraste com o destaque. */
export const textoSobre = (hex: string) => (contraste(hex, "#ffffff") >= contraste(hex, ESCURO_TEXTO) ? "#ffffff" : ESCURO_TEXTO)
export const ehHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v)

/**
 * Valida o que vem do armazenamento ou da URL: nomes só de listas fechadas, números presos às faixas, cor só em hex.
 * Nada de texto livre vira CSS. (Modelo: validarAparencia do MIFT UI, src/lib/skins.ts.)
 */
export function validar(x: unknown): Aparencia {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>
  const p = presetPorId(typeof o.preset === "string" ? o.preset : PADRAO.preset)
  const b = doPreset(p)
  const de = <T,>(v: unknown, lista: readonly T[], padrao: T) => (lista.includes(v as T) ? (v as T) : padrao)
  const num = (v: unknown, min: number, max: number, padrao: number) => (typeof v === "number" && isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao)
  return {
    preset: p.id,
    tema: o.tema === "vidro" ? "escuro" : de(o.tema, TEMAS_IDS, b.tema), // "vidro" foi tema antes de virar interruptor
    vidro: o.tema === "vidro" ? true : typeof o.vidro === "boolean" ? o.vidro : b.vidro,
    skin: de(o.skin, SKINS, b.skin),
    raio: de(o.raio, RAIOS, b.raio),
    borda: de(o.borda, BORDAS, b.borda),
    destaque: typeof o.destaque === "string" && (ehHex(o.destaque) || (DESTAQUES as readonly string[]).includes(o.destaque)) ? o.destaque : b.destaque,
    densidade: de(o.densidade, DENSIDADES, b.densidade),
    profundidade: de(o.profundidade, PROFUNDIDADES, b.profundidade),
    vidroOpacidade: num(o.vidroOpacidade, 0.2, 0.9, b.vidroOpacidade),
    vidroDesfoque: num(o.vidroDesfoque, 0, 40, b.vidroDesfoque),
  }
}

// ---------- aplicar ----------
/** Atributos da raiz (eixos nomeados). Vazio = sem o atributo. */
export function atributos(a: Aparencia): Record<string, string> {
  return {
    "data-skin": a.skin, "data-raio": a.raio, "data-borda": a.borda, "data-densidade": a.densidade,
    "data-profundidade": a.profundidade, "data-destaque": ehHex(a.destaque) ? "" : a.destaque,
    "data-preset": presetPorId(a.preset).id,
    // o modo do banner (shader, plano ou aberto) vai na raiz: o CSS do BannerSobreposto decide antes de hidratar
    "data-banner": presetPorId(a.preset).banner,
  }
}
/** Variáveis no style da raiz (valores contínuos e o destaque em cor livre). */
export function variaveis(a: Aparencia): Record<string, string> {
  const p = presetPorId(a.preset)
  const v: Record<string, string> = {
    "--fonte-titulo": p.fontes.titulo, "--fonte-texto": p.fontes.texto,
    "--p-vidro-opacidade": String(a.vidroOpacidade), "--p-vidro-desfoque": `${a.vidroDesfoque}px`,
  }
  if (ehHex(a.destaque)) {
    const t = textoSobre(a.destaque)
    Object.assign(v, {
      "--primary": a.destaque, "--primary-foreground": t, "--accent": a.destaque, "--accent-foreground": t,
      "--texto-primario": a.destaque, "--sidebar-primary": a.destaque, "--sidebar-primary-foreground": t, "--chart-1": a.destaque,
    })
  }
  return v
}

const sistemaEscuro = () => typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches
/** O tema resolvido: "sistema" vira claro ou escuro conforme o aparelho. */
export const ehEscuro = (a: Aparencia) => a.tema === "escuro" || (a.tema === "sistema" && sistemaEscuro())

export function aplicarNoDocumento(a: Aparencia) {
  const r = document.documentElement
  const css = Object.entries(variaveis(a)).map(([k, v]) => `${k}:${v}`).join(";")
  r.setAttribute("style", css)
  const at = atributos(a)
  for (const [k, v] of Object.entries(at)) { if (v) r.setAttribute(k, v); else r.removeAttribute(k) }
  r.classList.toggle("dark", ehEscuro(a))
  if (a.vidro) r.dataset.vidro = "on"; else delete r.dataset.vidro
  return { css, at }
}

let atual: Aparencia = PADRAO
const ouvintes = new Set<() => void>()

/** Página embutida (?embutida=1: as 4 combinações da folha do sistema em iframes) não grava a escolha da pessoa. */
const embutida = typeof window !== "undefined" && new URLSearchParams(location.search).get("embutida") === "1"

export function definir(mudanca: Partial<Aparencia>) {
  atual = validar({ ...atual, ...mudanca })
  const { css, at } = aplicarNoDocumento(atual)
  // o script inline do layout lê daqui: css, atributos, tema e vidro
  if (!embutida) try { localStorage.setItem(CHAVE, JSON.stringify({ a: atual, css, at, tema: atual.tema, vidro: atual.vidro })) } catch {}
  ouvintes.forEach((f) => f())
}
export const aparencia = () => atual
export const trocarPreset = (id: string) => definir(doPreset(presetPorId(id), atual.tema))
export const trocarTema = (tema: Tema) => definir({ tema })
export const trocarVidro = (vidro: boolean) => definir({ vidro })
/** Volta ao preset atual sem ajustes manuais. */
export const restaurarPadrao = () => definir(doPreset(presetPorId(atual.preset), atual.tema))

export function useAparencia() {
  return useSyncExternalStore((f) => (ouvintes.add(f), () => ouvintes.delete(f)), () => atual, () => PADRAO)
}

// inicializa no navegador: guardado + ?preset=, ?tema= e ?vidro=1|0 na URL (capturas e links diretos)
if (typeof window !== "undefined") {
  try { atual = validar(JSON.parse(localStorage.getItem(CHAVE) || "null")?.a ?? PADRAO) } catch { atual = PADRAO }
  const q = new URLSearchParams(location.search)
  const pr = q.get("preset"), te = q.get("tema"), vi = q.get("vidro")
  if (pr && PRESETS.some((p) => p.id === pr)) atual = doPreset(presetPorId(pr), atual.tema)
  if (te) atual = validar({ ...atual, tema: te })
  if (vi === "1" || vi === "0") atual = { ...atual, vidro: vi === "1" }
  if (pr || te || vi) definir({})
  else aplicarNoDocumento(atual)
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => atual.tema === "sistema" && definir({}))
}
