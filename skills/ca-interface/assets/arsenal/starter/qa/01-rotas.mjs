import { abrir, ctx, vigiar, cap, ir, nota, BASE } from "./lib.mjs";
const b = await abrir();
const c = await ctx(b, "d1440"); const p = await c.newPage(); vigiar(p, "d");
await ir(p, "/");
// pular abertura
const links = new Set();
for (const u of ["/", "/arsenal/", "/pedidos/", "/clientes/", "/configuracoes/"]) {
  await ir(p, u);
  const hs = await p.$$eval("a[href]", as => as.map(a => a.getAttribute("href")));
  hs.filter(h => h.startsWith("/") || h.startsWith(BASE)).forEach(h => links.add(h.replace(BASE, "").split("#")[0]));
}
for (const r of ["/sistema", "/fluxos", "/sistema/", "/fluxos/", "/pedidos/novo/"]) {
  const resp = await p.goto(BASE + r); nota("status", r, resp.status());
}
console.log(JSON.stringify([...links].sort()));
await b.close();
