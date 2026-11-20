// Mapa de uso do arsenal: quais módulos e telas usam cada peça, por varredura dos imports (nada escrito à mão).
//
//   node scripts/mapa-arsenal.mjs                 a lista no terminal (peça → módulos e telas)
//   node scripts/mapa-arsenal.mjs @/components/ui/glass-fold
//
// Lê todos os .ts, .tsx, .astro e .mjs de src/, resolve os imports (@/ → src/, caminhos relativos) e sobe o grafo ao
// contrário a partir da peça até as telas: src/modulos/<id>/telas/* e paginas/* (módulo e tela) e src/pages/* (rota).
// A casca (src/components/app, src/layouts) conta como "casca": a peça aparece em toda tela do painel. As demos do
// próprio arsenal (src/arsenal, src/pages/arsenal) não contam. O /arsenal chama usoDaPeca() no build.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const EXT = [".ts", ".tsx", ".astro", ".mjs", ".js"];
const rel = (raiz, p) => relative(raiz, p).split(sep).join("/");

function arquivos(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) arquivos(p, out);
    else if (EXT.some((e) => n.endsWith(e))) out.push(p);
  }
  return out;
}
function resolver(raiz, de, alvo) {
  let base;
  if (alvo.startsWith("@/")) base = join(raiz, "src", alvo.slice(2));
  else if (alvo.startsWith(".")) base = resolve(dirname(de), alvo);
  else return null;
  const tentativas = [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, "index" + e))];
  return tentativas.find((t) => existsSync(t) && statSync(t).isFile()) ?? null;
}

const cache = new Map();
/** O grafo ao contrário (arquivo → quem o importa), uma vez por processo. */
function grafo(raiz) {
  if (cache.has(raiz)) return cache.get(raiz);
  const quemImporta = new Map();
  for (const p of arquivos(join(raiz, "src"))) {
    const txt = readFileSync(p, "utf8");
    for (const m of txt.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g)) {
      const alvo = resolver(raiz, p, m[1].replace(/\?.*$/, ""));
      if (!alvo) continue;
      if (!quemImporta.has(alvo)) quemImporta.set(alvo, new Set());
      quemImporta.get(alvo).add(p);
    }
  }
  const g = { quemImporta };
  cache.set(raiz, g);
  return g;
}

/** Onde o arquivo aparece: tela de módulo, página, casca, demo do arsenal ou peça intermediária (null). */
function terminal(raiz, p) {
  const r = rel(raiz, p);
  if (r.startsWith("src/arsenal/") || r.startsWith("src/pages/arsenal/")) return { tipo: "demo" };
  let m = r.match(/^src\/modulos\/([^/]+)\/(telas|paginas)\/(.+)\.(tsx|ts|astro)$/);
  // "pedidos/novo/index" → "/pedidos/novo/"; "index" → "/"
  const rota = (s) => "/" + s.replace(/(^|\/)index$/, "").replace(/([^/])$/, "$1/");
  if (m) return { tipo: "modulo", modulo: m[1], tela: m[2] === "paginas" ? rota(m[3]) : m[3] };
  m = r.match(/^src\/pages\/(.+)\.(astro|ts)$/);
  if (m) return { tipo: "pagina", rota: rota(m[1]) };
  if (r.startsWith("src/components/app/") || r.startsWith("src/layouts/")) return { tipo: "casca", arquivo: r };
  return null;
}

/**
 * Quem usa a peça do import ("@/components/ui/glass-fold"). Devolve { modulos: { id → telas[] }, paginas: rotas[],
 * casca: bool, via: arquivos intermediários }. Para nas telas: o que a tela importa é dela.
 */
export function usoDaPeca(importar, raiz = process.cwd()) {
  const inicio = resolver(raiz, join(raiz, "src", "x.ts"), importar);
  const uso = { modulos: {}, paginas: [], casca: false, achou: !!inicio };
  if (!inicio) return uso;
  const { quemImporta } = grafo(raiz);
  const vistos = new Set([inicio]);
  const fila = [inicio];
  while (fila.length) {
    const atual = fila.shift();
    for (const q of quemImporta.get(atual) ?? []) {
      if (vistos.has(q)) continue;
      vistos.add(q);
      const t = terminal(raiz, q);
      if (t?.tipo === "demo") continue;
      if (t?.tipo === "modulo") { (uso.modulos[t.modulo] ??= new Set()).add(t.tela); continue; }
      if (t?.tipo === "pagina") { uso.paginas.push(t.rota); continue; }
      // a casca está em toda tela do painel: basta dizer "casca" (subir dela listaria todas as páginas)
      if (t?.tipo === "casca") { uso.casca = true; continue; }
      fila.push(q);
    }
  }
  return {
    ...uso,
    modulos: Object.fromEntries(Object.entries(uso.modulos).map(([id, s]) => [id, [...s].sort()]).sort(([a], [b]) => a.localeCompare(b))),
    paginas: [...new Set(uso.paginas)].sort(),
  };
}
/** Os caminhos de import citados num texto de "importar" do catálogo. */
export const importsDoTexto = (texto) => [...String(texto).matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = fileURLToPath(new URL("..", import.meta.url));
  const pedidos = process.argv.slice(2);
  let alvos = pedidos;
  if (!alvos.length) {
    const arq = join(raiz, "src", "arsenal", "catalogo.ts");
    if (!existsSync(arq)) { console.log("Sem src/arsenal/ (o limpar-arsenal.mjs já tirou o arsenal). Passe o import da peça."); process.exit(0); }
    const cat = readFileSync(arq, "utf8");
    const kit = cat.match(/const KIT = ["']([^"']+)["']/)?.[1];
    alvos = [...new Set(importsDoTexto(cat.replace(/\$\{KIT\}/g, kit ?? "")).filter((a) => a.startsWith("@/") && !a.includes("${")))];
  }
  for (const a of alvos) {
    const u = usoDaPeca(a, raiz);
    const mods = Object.entries(u.modulos).map(([id, telas]) => `${id} (${telas.join(", ")})`);
    const onde = [...(u.casca ? ["casca (todas as telas do painel)"] : []), ...mods, ...u.paginas].join("; ");
    console.log(`${a}\n  ${!u.achou ? "não achei o arquivo" : onde || "nenhuma tela usa"}`);
  }
}
