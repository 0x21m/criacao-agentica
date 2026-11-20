process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, ir, nota } from "./lib.mjs";
const b = await abrir();
const c = await ctx(b, "iphone"); const p = await c.newPage(); vigiar(p, "fim");
for (const [n, u] of [["pedidos", "/pedidos/"], ["inicio", "/"], ["clientes", "/clientes/"], ["aparencia", "/configuracoes/aparencia/"], ["config", "/configuracoes/"]]) {
  await ir(p, u, 4500);
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(700);
  const r = await p.evaluate(() => { const nav = [...document.querySelectorAll("nav")].find(n => getComputedStyle(n).position === "fixed" || getComputedStyle(n.parentElement).position === "fixed"); const navTop = nav ? nav.getBoundingClientRect().top : innerHeight; const els = [...document.querySelectorAll("main *")].filter(e => e.children.length === 0 && e.innerText?.trim()); const ult = els.map(e => e.getBoundingClientRect().bottom).sort((a, b) => b - a)[0]; return { navTop: Math.round(navTop), ultimoTexto: Math.round(ult) }; });
  nota(`FIM ${n}`, JSON.stringify(r), r.ultimoTexto > r.navTop ? "CONTEÚDO ATRÁS DA BARRA" : "ok");
  await cap(p, `80-iphone-fim-${n}`);
}
for (const u of ["/sistema/", "/fluxos/"]) { await ir(p, u, 4500); await cap(p, `80-iphone${u.replace(/\//g, "-")}`); }
await c.close();
const d = await ctx(b, "d1440"); const q = await d.newPage(); vigiar(q, "d");
for (const u of ["/sistema/", "/fluxos/", "/configuracoes/"]) { await ir(q, u, 4500); await cap(q, `80-d${u.replace(/\//g, "-")}`); nota(u, "ox", await q.evaluate(() => document.documentElement.scrollWidth - innerWidth)); }
await b.close();
