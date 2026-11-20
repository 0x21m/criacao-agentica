// Presets de direção: um objeto por direção (PER, STK-12). Cada um escolhe valores dos eixos de aparência do MIFT UI
// (skin, raio, borda, destaque, densidade) mais o que o starter acrescenta (tema, vidro, profundidade e o par de fontes).
// Para criar uma direção nova, copie um objeto e troque os valores. O painel e a barra F trocam de preset.
export const SKINS = ["padrao", "suave", "nitida", "noturna"] as const
export const RAIOS = ["compacto", "padrao", "arredondado", "pilula"] as const
export const BORDAS = ["linha", "sombra", "nenhuma"] as const
/** "marca" = o acento do próprio preset (o padrão). Os outros são os destaques do MIFT, com contraste conferido. */
export const DESTAQUES = ["marca", "azul", "violeta", "esmeralda", "ambar", "rosa", "grafite"] as const
export const DENSIDADES = ["compacta", "padrao", "confortavel", "campo"] as const
export const PROFUNDIDADES = ["plana", "padrao", "funda"] as const
export const TEMAS_IDS = ["claro", "escuro", "sistema"] as const

export type Skin = (typeof SKINS)[number]
export type Raio = (typeof RAIOS)[number]
export type Borda = (typeof BORDAS)[number]
export type DestaqueNomeado = (typeof DESTAQUES)[number]
export type Densidade = (typeof DENSIDADES)[number]
export type Profundidade = (typeof PROFUNDIDADES)[number]
/** Claro, escuro ou seguir o sistema. O vidro é um interruptor à parte e vale nos dois. */
export type Tema = (typeof TEMAS_IDS)[number]

/** Paleta de cada preset (tokens em src/styles/sistema.css, seção PRESETS): data-preset no <html>. */
export const PALETAS = ["noite", "aurora", "vidro", "sobrio", "sinal"] as const
export type Paleta = (typeof PALETAS)[number]

export type Preset = {
  id: Paleta
  nome: string
  /** Arquétipo: Moderno, Liquid Glass ou Ferramenta. */
  arquetipo: string
  /** Banner de marca: "shader" (glass-fold nas cores do preset, escuro) ou "plano" (faixa clara, sem efeito). */
  banner: "shader" | "plano" | "aberto"
  /** Opacidade mínima do vidro (o padrão é 0,6; o Vidro pede menos, cada nível ainda garante a dele). */
  vidroOpacidade?: number
  /** Uma linha: para quem é e qual a sensação. */
  descricao: string
  /** Par tipográfico (família CSS): display para títulos, números e hero; texto para o resto. Inter é só o padrão. */
  fontes: { titulo: string; texto: string }
  /** Amostras para o seletor (a cor de verdade vem dos tokens do CSS). */
  amostra: { base: string; acento: string; brilho: string }
  skin: Skin
  raio: Raio
  borda: Borda
  /** "marca" usa o acento do preset; um destaque nomeado ou uma cor própria em hex troca só o acento. */
  destaque: DestaqueNomeado | `#${string}`
  densidade: Densidade
  profundidade: Profundidade
  vidro: boolean
  /** Tema sugerido; sem ele, mantém o que a pessoa escolheu. */
  tema?: Tema
}

const INTER = '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif'
const pilha = (f: string) => `"${f}", ${INTER}`

// Os presets são os templates de protótipo: cada um é uma base completa (paleta, fonte, densidade, material, fundo
// ambiente, banner e movimento), não só outra cor. Todos têm as 4 combinações desenhadas (claro e escuro, com e sem
// vidro). Três arquétipos fixos, adaptados à marca de cada produto pelo acento, pelo par tipográfico e pelo fundo:
//   Noite (Moderno, o padrão) · Vidro (Liquid Glass) · Sóbrio (ferramenta de trabalho).
// Mais duas variações: Aurora (Moderno em azul profundo, núcleo escuro) e Sinal (Moderno em preto e laranja).
// Os mesmos tokens servem ao painel (versão densa) e às superfícies de marketing (landing, portal do cliente).
// Para uma direção nova, copie um objeto e o bloco do preset no sistema.css.
export const PRESETS: Preset[] = [
  {
    id: "noite", banner: "shader", nome: "Noite", arquetipo: "Moderno",
    descricao: "Verde-petróleo quase preto, acento lima, cabeçalho com sobreposição e cards tingidos por status.",
    fontes: { titulo: pilha("Bricolage Grotesque Variable"), texto: pilha("Onest Variable") },
    amostra: { base: "#0d1a17", acento: "#c4f25a", brilho: "#1f4a3c" },
    skin: "padrao", raio: "padrao", borda: "linha", destaque: "marca", densidade: "padrao", profundidade: "padrao", vidro: true, tema: "escuro",
  },
  {
    id: "vidro", banner: "aberto", vidroOpacidade: 0.42, nome: "Vidro", arquetipo: "Liquid Glass",
    descricao: "Papel de parede rico que respira, vidro de verdade com refração, borda de luz e molas.",
    fontes: { titulo: pilha("Figtree Variable"), texto: INTER },
    amostra: { base: "#dfe8fb", acento: "#2f6fe4", brilho: "#f4a98f" },
    skin: "padrao", raio: "arredondado", borda: "linha", destaque: "marca", densidade: "padrao", profundidade: "padrao", vidro: true, tema: "claro",
  },
  {
    id: "sobrio", nome: "Sóbrio", arquetipo: "Ferramenta", banner: "plano",
    descricao: "Claro, limpo e contido: lateral clara, banner plano, acento azul-grafite. Densidade de ferramenta séria.",
    fontes: { titulo: pilha("Archivo Variable"), texto: pilha("Archivo Variable") },
    amostra: { base: "#f2f3f5", acento: "#3d5a80", brilho: "#ffffff" },
    skin: "padrao", raio: "compacto", borda: "linha", destaque: "marca", densidade: "compacta", profundidade: "padrao", vidro: false, tema: "claro",
  },
  {
    id: "aurora", banner: "shader", nome: "Aurora", arquetipo: "Moderno",
    descricao: "Azul-marinho profundo, azul elétrico e ciano, KPI com núcleo escuro. Finanças, dados e SaaS.",
    fontes: { titulo: pilha("Geist Variable"), texto: INTER },
    amostra: { base: "#0a1124", acento: "#4f8ef7", brilho: "#1d6fd8" },
    skin: "padrao", raio: "padrao", borda: "linha", destaque: "marca", densidade: "padrao", profundidade: "padrao", vidro: true, tema: "escuro",
  },
  {
    id: "sinal", banner: "shader", nome: "Sinal", arquetipo: "Moderno",
    descricao: "Preto grafite com o laranja da marca e brilho no cabeçalho, grotesca técnica.",
    fontes: { titulo: pilha("Space Grotesk Variable"), texto: pilha("Manrope Variable") },
    amostra: { base: "#141210", acento: "#f26b1d", brilho: "#7a3412" },
    skin: "padrao", raio: "padrao", borda: "linha", destaque: "marca", densidade: "padrao", profundidade: "padrao", vidro: true, tema: "escuro",
  },
]

export const PRESET_PADRAO = PRESETS[0]
/** Ids antigos (antes da fase 1) apontam para o preset novo mais próximo. */
const ANTIGOS: Record<string, Paleta> = { caloroso: "vidro", areia: "vidro", noturno: "noite", oficina: "sobrio" }
export const presetPorId = (id: string) => PRESETS.find((p) => p.id === (ANTIGOS[id] ?? id)) ?? PRESET_PADRAO
