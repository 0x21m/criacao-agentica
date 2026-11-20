import { abrir, ctx, ir } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "iphone"); const p = await c.newPage();
await ir(p, "/pedidos/novo/", 5000);
console.log(await p.evaluate(() => [...document.querySelectorAll("input,select,textarea,button")].filter(e=>e.offsetParent).map(e => { const id=e.id; const lab = e.labels?.[0]?.innerText || e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby")||"").split(" ").map(i=>document.getElementById(i)?.innerText).join(" "); const r=e.getBoundingClientRect(); return `${e.tagName} name=${e.name} label="${(lab||"").trim()}" ${Math.round(r.width)}x${Math.round(r.height)} hidden=${getComputedStyle(e).opacity}`; }).join("\n")));
await b.close();
