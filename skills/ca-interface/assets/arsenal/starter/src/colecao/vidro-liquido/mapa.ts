export type FormaDoVidro = {
  /** Largura e altura da forma, em px CSS (inteiros). */
  largura: number
  altura: number
  /** Raio dos cantos em px (limitado à metade do lado menor: com a metade, vira pílula). */
  raio: number
  /** Largura da borda curva (o "bisel") em px: a faixa da forma onde a luz se desvia. */
  bisel: number
}

export type MapaDeRefracao = {
  /** PNG em data URL: R = deslocamento em x, G = deslocamento em y (128 = parado). */
  url: string
  /** Maior deslocamento do mapa, em px (o `scale` do feDisplacementMap é o dobro disto vezes a espessura). */
  maximo: number
}

// MIFT: gerador do mapa de deslocamento do vidro líquido. Para cada ponto da forma (retângulo de cantos
// arredondados), mede a distância até a borda e a direção da borda; dentro do bisel, a superfície é uma curva convexa
// (perfil circular suavizado, h(t) = (1 − (1 − t)^2)^½, que espalha o desvio por todo o bisel em vez de concentrá-lo na
// beira; o "squircle" de expoente 4 dava uma faixa estreita e listrada) e o raio de luz vertical se desvia pela lei de Snell (vidro, n = 1,5).
// O desvio aponta para dentro (o fundo visto perto da borda vem de mais para o centro), cresce perto da borda e some
// no miolo, que fica sem distorção. Só a faixa do bisel é calculada; o miolo é preenchido de uma vez com o neutro.
// Os mapas ficam em cache por forma: botões do mesmo tamanho compartilham o mesmo PNG.

const INDICE_DO_VIDRO = 1.5
const AMOSTRAS = 256

/** Perfil da superfície (altura de 0 a 1) ao longo do bisel: t = 0 na borda, 1 no começo do miolo. */
const perfil = (t: number) => Math.sqrt(1 - (1 - t) * (1 - t))

/** Desvio relativo (0 a 1) em cada ponto do bisel, pela inclinação do perfil e pela refração de Snell. */
const desvio = (() => {
  const tabela = new Float32Array(AMOSTRAS)
  let maior = 0
  for (let i = 0; i < AMOSTRAS; i++) {
    const t = i / (AMOSTRAS - 1)
    const h = 1e-3
    const inclinacao = (perfil(Math.min(1, t + h)) - perfil(Math.max(0, t - h))) / (Math.min(1, t + h) - Math.max(0, t - h))
    const normal = Math.atan(inclinacao)
    const refratado = Math.asin(Math.sin(normal) / INDICE_DO_VIDRO)
    const valor = Math.tan(normal - refratado) * (0.35 + 0.65 * perfil(t))
    tabela[i] = valor
    maior = Math.max(maior, valor)
  }
  for (let i = 0; i < AMOSTRAS; i++) tabela[i] /= maior || 1
  return tabela
})()

const cache = new Map<string, MapaDeRefracao>()

export function chaveDaForma({ largura, altura, raio, bisel }: FormaDoVidro) {
  return `${largura}x${altura}r${raio}b${bisel}`
}

/** Gera (ou devolve do cache) o mapa de deslocamento de uma forma. Só no navegador. */
export function mapaDeRefracao(forma: FormaDoVidro): MapaDeRefracao | null {
  const largura = Math.max(1, Math.round(forma.largura))
  const altura = Math.max(1, Math.round(forma.altura))
  const raio = Math.max(0, Math.min(forma.raio, largura / 2, altura / 2))
  const bisel = Math.max(1, Math.min(forma.bisel, largura / 2, altura / 2))
  const chave = chaveDaForma({ largura, altura, raio, bisel })
  const pronto = cache.get(chave)
  if (pronto) return pronto
  if (typeof document === "undefined") return null

  const tela = document.createElement("canvas")
  tela.width = largura
  tela.height = altura
  const ctx = tela.getContext("2d")
  if (!ctx) return null
  const imagem = ctx.createImageData(largura, altura)
  const px = imagem.data
  // Neutro (sem deslocamento) em toda a imagem; depois só o bisel é reescrito.
  for (let i = 0; i < px.length; i += 4) {
    px[i] = 128
    px[i + 1] = 128
    px[i + 2] = 128
    px[i + 3] = 255
  }

  const meiaL = largura / 2
  const meiaA = altura / 2
  const escreve = (x: number, y: number) => {
    const cx = x + 0.5 - meiaL
    const cy = y + 0.5 - meiaA
    const qx = Math.abs(cx) - (meiaL - raio)
    const qy = Math.abs(cy) - (meiaA - raio)
    const fora = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
    const distancia = -(Math.min(Math.max(qx, qy), 0) + fora - raio)
    if (distancia <= 0 || distancia >= bisel) return
    // Direção da borda mais próxima (normal para fora).
    let nx: number
    let ny: number
    if (qx > 0 && qy > 0) {
      nx = (qx / fora) * Math.sign(cx)
      ny = (qy / fora) * Math.sign(cy)
    } else if (qx > qy) {
      nx = Math.sign(cx)
      ny = 0
    } else {
      nx = 0
      ny = Math.sign(cy)
    }
    const t = distancia / bisel
    const forca = desvio[Math.min(AMOSTRAS - 1, Math.round(t * (AMOSTRAS - 1)))]
    // Para dentro: o fundo amostrado vem do lado do centro (a borda "puxa" a imagem, como uma lente convexa).
    const i = (y * largura + x) * 4
    px[i] = Math.round(128 - nx * forca * 127)
    px[i + 1] = Math.round(128 - ny * forca * 127)
  }

  const faixa = Math.ceil(bisel) + 1
  for (let y = 0; y < altura; y++) {
    const naFaixaV = y < faixa || y >= altura - faixa
    if (naFaixaV) {
      for (let x = 0; x < largura; x++) escreve(x, y)
    } else {
      for (let x = 0; x < Math.min(faixa, largura); x++) escreve(x, y)
      for (let x = Math.max(faixa, largura - faixa); x < largura; x++) escreve(x, y)
    }
  }
  ctx.putImageData(imagem, 0, 0)
  const mapa = { url: tela.toDataURL("image/png"), maximo: bisel }
  if (cache.size > 64) cache.delete(cache.keys().next().value!)
  cache.set(chave, mapa)
  return mapa
}

/**
 * O navegador aplica filtro SVG (`url(#…)`) no `backdrop-filter`? Hoje só os de motor Chromium (Chrome, Edge, Opera,
 * Samsung Internet). Safari e Firefox aceitam a sintaxe mas não desenham a refração: caem no vidro com desfoque.
 */
export function suportaRefracao() {
  if (typeof navigator === "undefined") return false
  const marcas = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands
  if (marcas?.some((m) => /Chromium/i.test(m.brand))) return true
  const ua = navigator.userAgent
  return /\bChrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS/.test(ua)
}
