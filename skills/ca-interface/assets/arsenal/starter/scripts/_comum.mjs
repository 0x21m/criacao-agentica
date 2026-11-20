// Partes comuns dos scripts: navegador da máquina (Chrome ou Edge, sem baixar nada), servidor de prévia e rotas.
import { chromium } from "playwright-core";
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { paginasDosModulos } from "../integracoes/modulos.mjs";

export const RAIZ = fileURLToPath(new URL("..", import.meta.url));

/** Abre o Chrome ou o Edge instalados. CHROME=<caminho do executável> força outro. */
export async function abrirNavegador() {
  if (process.env.CHROME) return chromium.launch({ executablePath: process.env.CHROME });
  for (const channel of ["chrome", "msedge"]) {
    try { return await chromium.launch({ channel }); } catch {}
  }
  throw new Error("Não achei Chrome nem Edge. Instale um deles ou passe CHROME=<caminho do executável>.");
}

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Usa a URL recebida ou sobe `astro preview` (gera o build antes, se não houver dist/).
 * Devolve { url, parar }. A URL sempre termina em "/".
 */
export async function subirServidor(urlRecebida) {
  if (urlRecebida) return { url: urlRecebida.endsWith("/") ? urlRecebida : urlRecebida + "/", parar: () => {} };
  const astro = join(RAIZ, "node_modules", "astro", "bin", "astro.mjs");
  if (!existsSync(join(RAIZ, "dist", "index.html"))) {
    console.log("Sem dist/: rodando o build…");
    const b = spawnSync(process.execPath, [astro, "build"], { cwd: RAIZ, stdio: "inherit" });
    if (b.status !== 0) throw new Error("O build falhou.");
  }
  const porta = Number(process.env.PORTA || 4329);
  const base = (process.env.BASE || "/").replace(/^\/?/, "/").replace(/\/?$/, "/");
  const proc = spawn(process.execPath, [astro, "preview", "--port", String(porta)], { cwd: RAIZ, stdio: "ignore" });
  const url = `http://localhost:${porta}${base}`;
  for (let i = 0; i < 480; i++) { // até 120 s: com a máquina ocupada (vários agentes), o preview demora a subir
    try { if ((await fetch(url)).ok) return { url, parar: () => proc.kill() }; } catch {}
    await espera(250);
  }
  proc.kill();
  throw new Error(`O servidor de prévia não respondeu em ${url}.`);
}

/** Rotas estáticas a partir de src/pages (sem 404 e sem rotas dinâmicas), no formato "", "pedidos/", ... */
export function rotasDasPaginas() {
  const dir = join(RAIZ, "src", "pages");
  const out = [];
  const andar = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) andar(p);
      else if (/\.(astro|md|mdx)$/.test(n) && !n.includes("[") && !/^404\./.test(n)) {
        const r = relative(dir, p).split(sep).join("/").replace(/\.(astro|md|mdx)$/, "");
        out.push(r === "index" ? "" : r.replace(/\/?index$/, "") + "/");
      }
    }
  };
  andar(dir);
  // as páginas dos módulos (src/modulos/<id>/paginas/)
  // (sem as dinâmicas, "site/loja/[sku]/": como em src/pages, só se chega a elas pelos links)
  for (const p of paginasDosModulos(RAIZ)) if (!p.rota.includes("[")) out.push(p.rota);
  return [...new Set(out)].sort();
}

/** Espera as ilhas hidratarem (astro-island sem [ssr]) e um respiro para as entradas animadas. */
export async function esperarPagina(page, respiro = 600) {
  await page.waitForFunction(() => !document.querySelector("astro-island[ssr]:not([client='visible'])"), null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(respiro);
}

/** Pula a abertura (splash) neste contexto: ela é conferida à parte. */
export async function semAbertura(ctx) {
  await ctx.addInitScript(() => { try { localStorage.setItem("proto-abertura-vista", "1"); sessionStorage.setItem("proto-abertura-vista", "1"); } catch {} });
}

/** Lê --chave valor e --flag dos argumentos. */
export function argumentos(argv = process.argv.slice(2)) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      a[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else a._.push(argv[i]);
  }
  return a;
}

/**
 * Guarda tudo o que o script escreve no console num arquivo de log do próprio worktree (logs/<script>-<data>.log, fora
 * do git), além de mostrar na tela. Cada worktree tem a sua pasta: agentes em paralelo não se misturam. Devolve o caminho.
 */
export function registrarLog(nome) {
  const pasta = join(RAIZ, "logs");
  mkdirSync(pasta, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const arq = join(pasta, `${nome}-${carimbo}.log`);
  const NL = String.fromCharCode(10);
  appendFileSync(arq, `# ${nome} ${process.argv.slice(2).join(" ")}${NL}`);
  for (const k of ["log", "error", "warn"]) {
    const orig = console[k].bind(console);
    console[k] = (...xs) => { orig(...xs); try { appendFileSync(arq, xs.map(String).join(" ") + NL); } catch {} };
  }
  console.log(`(log em ${relative(RAIZ, arq)})`);
  return arq;
}

/**
 * Filtro de rotas por prefixo: --rotas pedidos/,estoque/ deixa só as rotas que começam por um deles ("/" no começo é
 * opcional; "" ou "/" é só a raiz). Sem lista, tudo passa.
 */
export function filtroDeRotas(lista) {
  if (!lista || lista === true) return () => true;
  const pref = String(lista).split(",").map((x) => x.trim().replace(/^\/+/, "")).filter((x, i, a) => a.indexOf(x) === i);
  return (rota) => pref.some((p) => (p === "" ? rota === "" : rota.startsWith(p)));
}
