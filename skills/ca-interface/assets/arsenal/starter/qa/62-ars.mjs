import { abrir, ctx, cap, ir } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "iphone"); const p = await c.newPage();
for (const r of ["template-kpis-operador", "template-app-cliente", "metric-switcher-trend-chart-demo"]) { await ir(p, `/arsenal/${r}/`, 4500); await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); }); await p.waitForTimeout(800); await cap(p, `62-iphone-${r}-full`, true); }
await b.close();
