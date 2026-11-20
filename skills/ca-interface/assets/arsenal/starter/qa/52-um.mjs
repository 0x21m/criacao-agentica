import { abrir, ctx, vigiar, cap, ir, nota } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "d1280"); const p = await c.newPage(); vigiar(p, "um");
for (const u of ["/", "/?preset=sobrio&tema=claro&vidro=0"]) { await ir(p, u, 5000); nota(u, await p.evaluate(() => document.documentElement.className + " | " + getComputedStyle(document.body).fontFamily.slice(0,30) + " | body len " + document.body.innerText.length)); }
await cap(p, "52-um");
await b.close();
