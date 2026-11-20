// Escolhe os módulos que ficam no starter (fase 4). Um protótipo novo começa do ERP inteiro e tira o que não usa:
//
//   node scripts/modulos.mjs --listar                       os módulos, rotas, coleções, de quem dependem e quem depende deles
//   node scripts/modulos.mjs --manter pedidos,clientes,agenda [--simular] [--forcar]
//
// --manter apaga src/modulos/<id>/ de cada módulo fora da lista: as rotas (paginas/), as coleções (o dados.ts dele), a
// entrada do registro (o modulo.ts; o registro lê as pastas) e as linhas da MATRIZ (src/proto/permissoes.ts) que só ele
// usava. Antes, confere as dependências: recusa (código 1) se um módulo que fica depende de um que sai, pelo `depende` do
// modulo.ts ou por um import de verdade (de outro módulo ou de fora de src/modulos). `--forcar` apaga assim mesmo (o
// build vai quebrar nos imports citados). `--simular` só mostra. No fim, regenera o LEIAME (scripts/gerar-docs.mjs).
// Rode num checkout limpo (git) e confira com `npm run build && node scripts/navegar.mjs`; desfaça com git.
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { paginasDosModulos } from "../integracoes/modulos.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const MODS = join(RAIZ, "src", "modulos");
const PERMISSOES = join(RAIZ, "src", "proto", "permissoes.ts");
const rel = (p) => relative(RAIZ, p).split(sep).join("/");
const cache = new Map();
const ler = (p) => { if (!cache.has(p)) cache.set(p, readFileSync(p, "utf8")); return cache.get(p); };

// ---------- leitura dos modulo.ts (texto: sem executar TypeScript) ----------
const lista = (txt, campo) => {
  const m = txt.match(new RegExp(`\\b${campo}:\\s*\\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((x) => x[1]) : [];
};
const texto = (txt, campo) => txt.match(new RegExp(`\\b${campo}:\\s*["'\`]([^"'\`]+)["'\`]`))?.[1];

export function lerModulos(raiz = RAIZ) {
  const dir = join(raiz, "src", "modulos");
  const rotas = paginasDosModulos(raiz);
  return readdirSync(dir)
    .filter((id) => existsSync(join(dir, id, "modulo.ts")))
    .map((id) => {
      const txt = readFileSync(join(dir, id, "modulo.ts"), "utf8");
      return {
        id, nome: texto(txt, "nome") ?? id, ponta: texto(txt, "ponta") ?? "?", ordem: Number(txt.match(/\bordem:\s*(\d+)/)?.[1] ?? 999),
        colecoes: lista(txt, "colecoes"), depende: lista(txt, "depende"), rotas: rotas.filter((r) => r.modulo === id).map((r) => "/" + r.rota),
      };
    })
    .sort((a, b) => a.ordem - b.ordem);
}

/** Arquivos de código em src (para os imports e as capacidades). */
function arquivos(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== "node_modules") arquivos(p, out); }
    else if (/\.(ts|tsx|astro|mjs|js)$/.test(n)) out.push(p);
  }
  return out;
}
/** O módulo da pasta do arquivo (src/modulos/<id>/…), ou null. */
const moduloDoArquivo = (p) => { const r = rel(p).match(/^src\/modulos\/([^/]+)\//); return r && existsSync(join(MODS, r[1], "modulo.ts")) ? r[1] : null; };
/** Ids de módulo que o arquivo importa (por @/modulos/<id>/ ou caminho relativo que cai em src/modulos/<id>/). */
function importsDeModulos(p, ids) {
  const txt = ler(p);
  const achados = new Set();
  for (const m of txt.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g)) {
    const alvo = m[1];
    let id = alvo.match(/^@\/modulos\/([^/"']+)/)?.[1];
    if (!id && alvo.startsWith(".")) {
      const abs = rel(join(p, "..", alvo));
      id = abs.match(/^src\/modulos\/([^/]+)/)?.[1];
    }
    if (id && ids.has(id)) achados.add(id);
  }
  return achados;
}

// ---------- MATRIZ ----------
function capacidades() {
  const txt = readFileSync(PERMISSOES, "utf8");
  const bloco = txt.slice(txt.indexOf("export const MATRIZ"), txt.indexOf("} satisfies Record<string, Linha>"));
  return [...bloco.matchAll(/^ {2}([a-z_]+): \{/gm)].map((m) => m[1]);
}
/** Capacidades que só os módulos que saem usam (citadas entre aspas no código deles e em nenhum outro arquivo). */
function capacidadesSoDe(sai, todos) {
  const caps = capacidades();
  const usa = (p, c) => ['"', "'", "`"].some((q) => ler(p).includes(q + c + q));
  const fora = todos.filter((p) => p !== PERMISSOES && !sai.has(moduloDoArquivo(p)));
  const dentro = todos.filter((p) => sai.has(moduloDoArquivo(p)));
  return caps.filter((c) => dentro.some((p) => usa(p, c)) && !fora.some((p) => usa(p, c)));
}
function tirarDaMatriz(caps) {
  let txt = readFileSync(PERMISSOES, "utf8");
  for (const c of caps) txt = txt.replace(new RegExp(`^ {2}${c}: \\{.*\\},?\\r?\\n`, "m"), "");
  writeFileSync(PERMISSOES, txt);
}

// ---------- principal ----------
function argumentos(argv) {
  const a = { manter: null, listar: false, simular: false, forcar: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--listar") a.listar = true;
    else if (x === "--simular") a.simular = true;
    else if (x === "--forcar") a.forcar = true;
    else if (x === "--manter") a.manter = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (x.startsWith("--manter=")) a.manter = x.slice(9).split(",").map((s) => s.trim()).filter(Boolean);
    else { console.error(`Opção desconhecida: ${x}`); process.exit(2); }
  }
  return a;
}

function listar(mods) {
  const quemDepende = (id) => mods.filter((m) => m.depende.includes(id)).map((m) => m.id);
  console.log(`${mods.length} módulos (src/modulos/<id>/):\n`);
  for (const m of mods) {
    console.log(`${m.id.padEnd(14)} ${m.nome} · ${m.ponta}`);
    console.log(`${"".padEnd(14)} rotas: ${m.rotas.join(" ") || "nenhuma"}`);
    console.log(`${"".padEnd(14)} coleções: ${m.colecoes.join(", ") || "nenhuma"}`);
    console.log(`${"".padEnd(14)} depende de: ${m.depende.join(", ") || "nenhum"} · dependem dele: ${quemDepende(m.id).join(", ") || "nenhum"}\n`);
  }
}

function principal() {
  const a = argumentos(process.argv.slice(2));
  const mods = lerModulos();
  const ids = new Set(mods.map((m) => m.id));
  if (a.listar || !a.manter) {
    listar(mods);
    if (!a.manter) console.log("Para tirar módulos: node scripts/modulos.mjs --manter <ids separados por vírgula> [--simular] [--forcar]");
    return 0;
  }
  const desconhecidos = a.manter.filter((id) => !ids.has(id));
  if (desconhecidos.length) { console.error(`Módulo desconhecido: ${desconhecidos.join(", ")}. Veja --listar.`); return 2; }
  const fica = new Set(a.manter);
  const sai = new Set(mods.filter((m) => !fica.has(m.id)).map((m) => m.id));
  if (!sai.size) { console.log("Nada a tirar: todos os módulos ficam."); return 0; }

  // dependências: pelo `depende` e pelos imports de verdade
  const problemas = [];
  for (const m of mods.filter((x) => fica.has(x.id)))
    for (const d of m.depende) if (sai.has(d)) problemas.push(`${m.id} declara depende: "${d}"`);
  const todos = arquivos(join(RAIZ, "src"));
  for (const p of todos) {
    const dono = moduloDoArquivo(p);
    if (dono && sai.has(dono)) continue;
    for (const id of importsDeModulos(p, sai)) problemas.push(`${rel(p)} importa o módulo ${id}`);
  }
  const caps = capacidadesSoDe(sai, todos);

  console.log(`Ficam (${fica.size}): ${[...fica].join(", ")}`);
  console.log(`Saem (${sai.size}): ${[...sai].join(", ")}`);
  for (const m of mods.filter((x) => sai.has(x.id))) {
    console.log(`  - ${m.id}: ${rel(join(MODS, m.id))}/ · rotas ${m.rotas.join(" ") || "nenhuma"} · coleções ${m.colecoes.join(", ") || "nenhuma"}`);
  }
  console.log(`Linhas da MATRIZ que saem (só esses módulos usavam): ${caps.join(", ") || "nenhuma"}`);
  const daRaiz = mods.find((m) => sai.has(m.id) && m.rotas.includes("/"));
  if (daRaiz) console.log(`Sem o ${daRaiz.id}, a raiz (/) fica sem tela: o logo e o "Voltar ao início" passam a levar à primeira rota do módulo de menor ordem (inicioDoPainel).`);
  if (problemas.length) {
    console.log(`\n${a.forcar ? "Aviso" : "Recusado"}: ${problemas.length} dependência(s) de módulo que sai:`);
    for (const p of [...new Set(problemas)]) console.log(`  - ${p}`);
    if (!a.forcar) { console.log("\nMantenha também esses módulos, tire quem depende deles ou use --forcar."); return 1; }
  }
  if (a.simular) { console.log("\n(--simular: nada foi apagado)"); return 0; }

  for (const id of sai) rmSync(join(MODS, id), { recursive: true, force: true });
  if (caps.length) tirarDaMatriz(caps);
  console.log(`\nApagados ${sai.size} módulos${caps.length ? ` e ${caps.length} linhas da MATRIZ` : ""}.`);
  const gerador = join(RAIZ, "scripts", "gerar-docs.mjs");
  if (existsSync(gerador)) {
    const r = spawnSync(process.execPath, [gerador], { cwd: RAIZ, stdio: "inherit" });
    if (r.status !== 0) console.log("Aviso: o LEIAME não foi regenerado (scripts/gerar-docs.mjs falhou).");
  }
  console.log("Confira: npm run build && node scripts/navegar.mjs");
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(principal());
