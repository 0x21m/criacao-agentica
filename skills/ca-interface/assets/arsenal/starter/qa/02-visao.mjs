import { abrir, ctx, vigiar, cap, ir, nota } from "./lib.mjs";
const b = await abrir();
const rotas = [["inicio","/"],["pedidos","/pedidos/"],["novo","/pedidos/novo/"],["clientes","/clientes/"],["config","/configuracoes/"],["aparencia","/configuracoes/aparencia/"],["arsenal","/arsenal/"]];
for (const d of ["d1440","iphone","ipad"]) {
  const c = await ctx(b, d); const p = await c.newPage(); vigiar(p, d);
  for (const [n,u] of rotas) { await ir(p, u); await p.waitForTimeout(1800); await cap(p, `02-${d}-${n}`); }
  // overflow horizontal
  for (const [n,u] of rotas) { await ir(p,u); const o = await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth); if (o>0) nota("OVERFLOW-X", d, u, o); }
  await c.close();
}
await b.close();
