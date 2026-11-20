// Tira o /arsenal do protótipo pronto: a rota, o catálogo, as demos e os templates que nenhuma tela importa.
// Os componentes (src/components/ui, movimento, mift, colecao) ficam: o protótipo os importa.
// Uso: node scripts/limpar-arsenal.mjs [--simular]
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { RAIZ } from "./_comum.mjs";

const simular = process.argv.includes("--simular");
const src = join(RAIZ, "src");
const tirar = (p) => { if (!existsSync(p)) return; console.log(`${simular ? "(simulação) " : ""}remove ${relative(RAIZ, p)}`); if (!simular) rmSync(p, { recursive: true, force: true }); };

// templates usados fora do arsenal (import "@/arsenal/templates/<id>")
const usados = new Set();
const andar = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (p.startsWith(join(src, "arsenal")) || p.startsWith(join(src, "pages", "arsenal"))) continue;
    if (statSync(p).isDirectory()) andar(p);
    else if (/\.(tsx?|astro|mjs)$/.test(n)) for (const m of readFileSync(p, "utf8").matchAll(/@\/arsenal\/templates\/([a-z0-9-]+)/g)) usados.add(m[1]);
  }
};
andar(src);

tirar(join(src, "pages", "arsenal"));
for (const f of ["catalogo.ts", "fontes.ts", "NavArsenal.astro", "Palco.tsx", "vivos.tsx", "brasil.tsx", "demos"]) tirar(join(src, "arsenal", f));
const tpl = join(src, "arsenal", "templates");
if (existsSync(tpl)) {
  for (const id of readdirSync(tpl)) if (id !== "_base" && !usados.has(id)) tirar(join(tpl, id));
  if (usados.size === 0) tirar(join(src, "arsenal"));
}

// item "Arsenal" da navegação (linha marcada com // arsenal)
const nav = join(src, "modulos", "prototipo", "modulo.ts");
const txt = readFileSync(nav, "utf8");
const limpo = txt.split("\n").filter((l) => !l.includes("// arsenal:")).join("\n").replace(/, Shapes(?=[ ,])/, "");
if (limpo !== txt) { console.log(`${simular ? "(simulação) " : ""}tira o Arsenal de src/modulos/prototipo/modulo.ts`); if (!simular) writeFileSync(nav, limpo); }
console.log(usados.size ? `Templates mantidos (importados pelo protótipo): ${[...usados].join(", ")}` : "Nenhum template em uso: o arsenal saiu inteiro.");
console.log("Pronto. Rode npm run build e node scripts/navegar.mjs.");
