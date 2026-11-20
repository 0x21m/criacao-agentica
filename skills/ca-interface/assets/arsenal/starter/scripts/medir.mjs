// Mede a velocidade NO BUILD (o dev server serve os módulos sem empacotar e é naturalmente mais lento; não meça nele).
// Início (/): primeira pintura com conteúdo, conteúdo com dados na tela e tela interativa (a ilha da página hidratada);
// a casca (lateral, barra superior, abas, avisos, barra F) hidrata depois, em client:idle, e é medida à parte.
// Troca de página pela lateral (ClientRouter, com a busca prévia aquecida pelo ponteiro) para cada rota de módulo que a
// lateral mostra à gestora (as rotas saem de src/modulos/<id>/paginas/, o mesmo registro do build): até o conteúdo com
// dados e até a tela nova ficar interativa. Cada medida roda 3 vezes; vale a mediana.
// Metas: troca com conteúdo em até 300 ms e início interativo em até 1,5 s. Sai com código 1 se passar.
// Uso: node scripts/medir.mjs [url] [--vezes 3] [--lento 4]   (--lento: CPU 4× mais lenta, como um notebook simples;
// é leitura de estresse: mostra os números e não reprova)   --rotas estoque/,financeiro/ (só essas trocas)
// O que sai no console também vai para logs/medir-<data>.log do worktree.
import { abrirNavegador, argumentos, filtroDeRotas, RAIZ, registrarLog, semAbertura, subirServidor } from "./_comum.mjs";
import { paginasDosModulos } from "../integracoes/modulos.mjs";

const a = argumentos();
registrarLog("medir");
const META_TROCA = Number(a["meta-troca"] || 300);
const META_INICIO = Number(a["meta-inicio"] || 1500);
const VEZES = Number(a.vezes || 3);
const { url: BASE, parar } = await subirServidor(a._[0] || process.env.URL);
const browser = await abrirNavegador();
const mediana = (xs) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];

/** Ilha da página: a que não é da casca (as da casca têm transition:persist). */
const ILHA_DA_PAGINA = "astro-island:not([data-astro-transition-persist])";

async function novaPagina() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await semAbertura(ctx);
  // marca o instante em que o conteúdo com dados entra no documento (no HTML do servidor ou depois da hidratação)
  await ctx.addInitScript(() => {
    const ver = () => { if (!window.__tDados && document.querySelector("[data-estado-tela=dados]")) window.__tDados = performance.now(); };
    new MutationObserver(ver).observe(document, { childList: true, subtree: true });
  });
  const page = await ctx.newPage();
  if (a.lento) { const s = await ctx.newCDPSession(page); await s.send("Emulation.setCPUThrottlingRate", { rate: Number(a.lento) || 4 }); }
  return { ctx, page };
}

const inicio = { pintura: [], dados: [], interativo: [], casca: [] };
for (let i = 0; i < VEZES; i++) {
  const { ctx, page } = await novaPagina();
  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: "commit" });
  await page.waitForFunction((sel) => {
    const pag = document.querySelectorAll(sel);
    return document.querySelector("[data-estado-tela=dados]") && pag.length && [...pag].every((x) => !x.hasAttribute("ssr"));
  }, ILHA_DA_PAGINA, { timeout: 20000 });
  const interativo = Date.now() - t0;
  await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"), null, { timeout: 20000 });
  const casca = Date.now() - t0;
  const nav = await page.evaluate(() => {
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    // com dados: não antes da primeira pintura (se já estão no HTML, aparecem nela)
    return { fcp: Math.round(fcp), dados: Math.round(Math.max(fcp, window.__tDados ?? 0)) };
  });
  inicio.pintura.push(nav.fcp); inicio.interativo.push(interativo); inicio.casca.push(casca);
  inicio.dados.push(nav.dados);
  await ctx.close();
}
console.log(`início (/), mediana de ${VEZES}: primeira pintura ${mediana(inicio.pintura)} ms · conteúdo com dados ${mediana(inicio.dados)} ms · tela interativa ${mediana(inicio.interativo)} ms · casca inteira ${mediana(inicio.casca)} ms`);

const { ctx, page } = await novaPagina();
await page.goto(BASE);
await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"), null, { timeout: 20000 });
// as rotas dos módulos que a lateral mostra (a raiz por último, para cada volta terminar onde começou)
const naRota = filtroDeRotas(a.rotas);
const naLateral = new Set(await page.$$eval("aside a[href]", (as) => as.map((x) => new URL(x.href).pathname)));
const basePath = new URL(BASE).pathname;
// só as que abrem dentro da casca do app (troca pelo ClientRouter): o site e o portal têm casca própria e abrem por
// carga completa, o que destruiria o contexto da medição; as dinâmicas ("site/loja/[sku]/") não têm link na lateral
const naCasca = async (r) => { try { return (await (await fetch(new URL(r, BASE))).text()).includes('data-astro-transition-persist="lateral"'); } catch { return false; } };
const candidatas = paginasDosModulos(RAIZ).map((p) => p.rota).filter((r) => !r.includes("[") && naRota(r) && naLateral.has(basePath + r));
const rotas = (await Promise.all(candidatas.map(async (r) => ((await naCasca(r)) ? r : null)))).filter((r) => r !== null)
  .sort((x, y) => (x === "") - (y === "") || x.localeCompare(y));
if (!rotas.length) { console.log("✗ nenhuma rota de módulo na lateral" + (a.rotas ? ` com ${a.rotas}` : "")); process.exit(1); }
const trocas = Object.fromEntries(rotas.map((r) => [r, { dados: [], interativa: [] }]));
for (let i = 0; i < VEZES; i++) {
  for (const rotulo of rotas) {
    const href = basePath + rotulo;
    if (new URL(page.url()).pathname === href) continue; // já está nela (lista de uma rota só)
    const link = page.locator(`aside a[href="${href}"]`).first();
    await link.hover();
    await page.waitForTimeout(250);
    const [dados, interativa] = await page.evaluate(async ({ r, sel }) => {
      const a = [...document.querySelectorAll("aside a[href]")].find((x) => new URL(x.href).pathname === r);
      const antes = document.querySelector("main");
      const t = performance.now();
      a.click();
      // conteúdo com dados: o <main> novo na tela com o estado "dados" (ou a página sem ComDados)
      await new Promise((ok) => { const v = () => { const m = document.querySelector("main"); return m !== antes && (m.querySelector("[data-estado-tela=dados]") || !m.querySelector("[data-estado-tela]")) ? ok() : requestAnimationFrame(v); }; v(); });
      const tDados = performance.now() - t;
      await new Promise((ok) => { const v = () => ([...document.querySelectorAll(sel)].every((x) => !x.hasAttribute("ssr")) ? ok() : requestAnimationFrame(v)); v(); });
      return [Math.round(tDados), Math.round(performance.now() - t)];
    }, { r: href, sel: ILHA_DA_PAGINA });
    trocas[rotulo].dados.push(dados); trocas[rotulo].interativa.push(interativa);
    await page.waitForTimeout(300);
  }
}
let pior = 0;
for (const r of rotas) {
  if (!trocas[r].dados.length) continue;
  const d = mediana(trocas[r].dados), it = mediana(trocas[r].interativa);
  pior = Math.max(pior, d);
  console.log(`troca para /${r}: conteúdo com dados ${d} ms · interativa ${it} ms  (amostras ${trocas[r].dados.join(", ")})`);
}
await ctx.close();
await browser.close();
parar();
const falhas = [];
if (pior > META_TROCA) falhas.push(`troca acima de ${META_TROCA} ms (pior mediana: ${pior} ms)`);
if (mediana(inicio.interativo) > META_INICIO) falhas.push(`início interativo acima de ${META_INICIO} ms (${mediana(inicio.interativo)} ms)`);
// com --lento a leitura é de estresse (as metas valem para a máquina normal): mostra, mas não reprova
if (falhas.length && a.lento) { console.log(`(CPU ${Number(a.lento) || 4}× mais lenta: leitura de estresse, sem reprovar) ${falhas.join("; ")}`); process.exit(0); }
if (falhas.length) { console.log("✗ " + falhas.join("; ")); process.exit(1); }
console.log(`ok: troca até ${pior} ms (meta ${META_TROCA}), início interativo ${mediana(inicio.interativo)} ms (meta ${META_INICIO})`);
