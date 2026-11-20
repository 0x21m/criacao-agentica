// De que módulo é cada rota: lido das pastas src/modulos/<id>/paginas/ (a mesma regra de integracoes/modulos.mjs).
// SÓ NO SERVIDOR (AppShell, páginas .astro): o glob lista as páginas, e importar isto numa ilha levaria todas para o
// navegador. No navegador, o Base.astro deixa o id na <meta name="proto-modulo">.
const PAGINAS = Object.keys(import.meta.glob("/src/modulos/*/paginas/**/*.astro"))

/** { rota, modulo } de cada página de módulo; rota sem o base e com barra no fim ("" na raiz, "pedidos/novo/"). */
export const ROTAS_DOS_MODULOS: { rota: string; modulo: string }[] = PAGINAS.flatMap((k) => {
  const m = k.match(/^\/src\/modulos\/([^/]+)\/paginas\/(.+)\.astro$/)
  if (!m) return []
  const r = m[2]
  return [{ rota: r === "index" ? "" : r.replace(/\/?index$/, "") + "/", modulo: m[1] }]
})

/** O módulo dono da rota (a de `rotaAtual()`, sem barras nas pontas), se for página de módulo. */
export function moduloDaRota(rota: string): string | undefined {
  const r = rota ? rota.replace(/\/?$/, "/") : ""
  return ROTAS_DOS_MODULOS.find((x) => x.rota === r)?.modulo ?? DINAMICAS.find((x) => x.re.test(r))?.modulo
}
// rotas dinâmicas ("site/loja/[sku]/", "docs/[...resto]/"): cada [x] casa um segmento; [...x], o resto
const DINAMICAS = ROTAS_DOS_MODULOS.filter((x) => x.rota.includes("[")).map((x) => ({
  modulo: x.modulo,
  re: new RegExp("^" + x.rota.split("/").map((s) => (/^\[\.\.\..+\]$/.test(s) ? ".*" : /^\[.+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|\\]/g, "\\$&"))).join("/") + "$"),
}))
