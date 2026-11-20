// Gera a tabela de módulos do LEIAME.md a partir do registro (os modulo.ts de src/modulos/<id>/, as rotas das pastas
// paginas/ e a MATRIZ de src/proto/permissoes.ts). Nada da tabela se escreve à mão: rode depois de criar, tirar ou mudar
// um módulo (o scripts/modulos.mjs --manter já roda este no fim).
//
//   node scripts/gerar-docs.mjs            reescreve o trecho entre <!-- modulos:inicio --> e <!-- modulos:fim -->
//   node scripts/gerar-docs.mjs --conferir sai com código 1 se o LEIAME estiver desatualizado (sem escrever)
//
// O /fluxos mostra o mesmo mapa ao vivo (lê o registro no build).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lerModulos } from "./modulos.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const LEIAME = join(RAIZ, "LEIAME.md");
const INICIO = "<!-- modulos:inicio -->", FIM = "<!-- modulos:fim -->";
const PAPEIS = { dono: "dono", gestora: "gestora", atendente: "atendente", tecnico: "técnico", financeiro: "financeiro" };

/** Linhas da MATRIZ: capacidade → papéis que abrem a tela (tudo que não é false). */
function matriz(raiz) {
  const txt = readFileSync(join(raiz, "src", "proto", "permissoes.ts"), "utf8");
  const out = {};
  for (const m of txt.matchAll(/^ {2}([a-z_]+): \{([^\n]*)\},?$/gm)) {
    out[m[1]] = Object.keys(PAPEIS).filter((p) => { const v = m[2].match(new RegExp(`\\b${p}:\\s*([^,}]+)`))?.[1]?.trim(); return v && v !== "false"; });
  }
  return out;
}
/** O que o módulo mostra: a primeira frase do comentário do topo do modulo.ts, sem o "Módulo X (5.n):". */
function descricao(txt) {
  const linhas = [];
  for (const l of txt.split(/\r?\n/)) { if (!l.startsWith("//")) break; const s = l.replace(/^\/\/\s?/, ""); if (!s.trim()) break; linhas.push(s.trim()); }
  const t = linhas.join(" ").replace(/^Módulo [^:]+:\s*/, "").replace(/^Ferramentas do protótipo[^:]*:\s*/, "");
  const frase = t.match(/^(.+?[.])(\s|$)/)?.[1] ?? t;
  const curta = frase.length > 160 ? frase.slice(0, 157).replace(/\s+\S*$/, "") + "…" : frase;
  return curta.charAt(0).toUpperCase() + curta.slice(1);
}
/** Quem vê: os papéis da capacidade do primeiro item da navegação (ou a ponta). */
function papeis(m, txt, mat) {
  if (m.ponta === "cliente") return "cliente (portal)";
  if (m.ponta === "publico") return "público";
  if (m.ponta === "ferramenta") return "todos (ferramenta do protótipo)";
  const nav = txt.slice(txt.indexOf("nav:"), txt.indexOf("colecoes:") > 0 ? txt.indexOf("colecoes:") : undefined);
  const cap = nav.match(/capacidade:\s*["']([a-z_]+)["']/)?.[1];
  if (!/nav:\s*\[\s*\{/.test(txt)) return "fora da navegação (links e Ctrl K)";
  if (!cap || !mat[cap]) return "todos os papéis";
  const ps = mat[cap];
  return ps.length === 5 ? "todos os papéis" : ps.map((p) => PAPEIS[p]).join(", ") + ` (\`${cap}\`)`;
}

export function tabelaDosModulos(raiz = RAIZ) {
  const mat = matriz(raiz);
  const mods = lerModulos(raiz);
  const cod = (xs) => xs.map((x) => `\`${x}\``).join(", ");
  const linhas = mods.map((m) => {
    const txt = readFileSync(join(raiz, "src", "modulos", m.id, "modulo.ts"), "utf8");
    const rotas = m.rotas.length ? cod(m.rotas) : "(ferramentas em `src/pages`)";
    return `| \`${m.id}\` | ${m.nome} | ${rotas} | ${papeis(m, txt, mat)} | ${m.colecoes.length ? cod(m.colecoes) : "nenhuma"} | ${m.depende.length ? cod(m.depende) : "nenhum"} | ${descricao(txt).replace(/\|/g, "\\|")} |`;
  });
  return [
    INICIO,
    `<!-- gerado por node scripts/gerar-docs.mjs a partir do registro (src/modulos/*/modulo.ts); não edite à mão -->`,
    "",
    "| Módulo | Nome | Rotas | Quem vê | Coleções | Depende de | O que mostra |",
    "|---|---|---|---|---|---|---|",
    ...linhas,
    "",
    `${mods.length} módulos. Para tirar os que um protótipo não usa: \`node scripts/modulos.mjs --manter <ids>\` (veja \`--listar\`).`,
    FIM,
  ].join("\n");
}

function principal() {
  const conferir = process.argv.includes("--conferir");
  const atual = readFileSync(LEIAME, "utf8");
  const nl = atual.includes("\r\n") ? "\r\n" : "\n";
  const txt = atual.replace(/\r\n/g, "\n");
  const i = txt.indexOf(INICIO), f = txt.indexOf(FIM);
  if (i < 0 || f < i) { console.error(`O LEIAME.md não tem os marcadores ${INICIO} e ${FIM}.`); return 2; }
  const novo = (txt.slice(0, i) + tabelaDosModulos() + txt.slice(f + FIM.length)).replace(/\n/g, nl);
  if (novo === atual) { console.log("LEIAME.md em dia."); return 0; }
  if (conferir) { console.log("LEIAME.md desatualizado: rode node scripts/gerar-docs.mjs"); return 1; }
  writeFileSync(LEIAME, novo);
  console.log("LEIAME.md: tabela de módulos regenerada.");
  return 0;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(principal());
