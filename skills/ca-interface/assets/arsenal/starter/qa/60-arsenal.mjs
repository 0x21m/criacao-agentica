process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, ir, nota, CAP, BASE } from "./lib.mjs";
import fs from "node:fs";
const b = await abrir();
const c0 = await ctx(b, "d1440"); const p0 = await c0.newPage(); await ir(p0, "/arsenal/", 4000);
const rotas = [...new Set(await p0.$$eval("a[href^='/arsenal/']", as => as.map(a => a.getAttribute("href"))))].filter(h => h !== "/arsenal/");
await cap(p0, "60-arsenal-index-d"); await cap(p0, "60-arsenal-index-d-full", true); await c0.close();
nota("rotas arsenal", rotas.length);
for (const d of ["d1440", "iphone"]) {
  const c = await ctx(b, d); const p = await c.newPage();
  let erros = []; p.on("pageerror", e => erros.push(e.message.slice(0, 120))); p.on("console", m => { if (m.type() === "error") erros.push(m.text().slice(0, 120)); });
  for (const r of rotas) {
    erros = [];
    const resp = await p.goto(BASE + r, { waitUntil: "load" }).catch(e => null); await p.waitForTimeout(3500);
    let m; try { m = await p.evaluate(() => {
      const ox = document.documentElement.scrollWidth - innerWidth;
      const fora = [...document.querySelectorAll("main *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== "fixed"; }).length;
      const cortado = [...document.querySelectorAll("main h1,main h2,main h3,main p,main span,main button")].filter(e => e.children.length === 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== "ellipsis" && getComputedStyle(e).overflow !== "visible").map(e => e.innerText.slice(0, 25));
      return { ox, fora, cortado: cortado.slice(0, 4) };
    }); } catch (e) { m = { ox: "?", fora: "?", cortado: ["NAVEGOU SOZINHA para " + p.url()] }; await p.waitForTimeout(1500); }
    const nome = r.replace(/\//g, "_").replace(/^_arsenal_/, "").replace(/_$/, "");
    await p.screenshot({ path: CAP + `60-${d}-${nome}.png`, scale: "css" });
    const flag = (m.ox > 0 || m.cortado.length || erros.length || (resp && resp.status() >= 400)) ? "ALERTA" : "ok";
    nota(`ARS ${flag} ${d} ${r} status=${resp?.status()} ox=${m.ox} foraDaTela=${m.fora} cortado=${JSON.stringify(m.cortado)} erros=${JSON.stringify(erros.slice(0, 2))}`);
  }
  await c.close();
}
// montagens
const c = await ctx(b, "d1440"); const p = await c.newPage();
for (const d of ["d1440", "iphone"]) {
  const files = fs.readdirSync(CAP).filter(f => f.startsWith(`60-${d}-`)).sort();
  for (let i = 0; i < files.length; i += (d === "iphone" ? 10 : 9)) {
    const grupo = files.slice(i, i + (d === "iphone" ? 10 : 9));
    const html = grupo.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(CAP + f).toString("base64")}"><figcaption>${f}</figcaption></figure>`).join("");
    await p.setContent(`<style>body{margin:0;background:#777;display:grid;grid-template-columns:repeat(${d === "iphone" ? 5 : 3},1fr);gap:4px;font:12px sans-serif}img{width:100%;display:block}figure{margin:0}figcaption{background:#000;color:#fff;padding:1px 4px}</style>${html}`);
    await p.waitForTimeout(300); await p.screenshot({ path: CAP + `61-mont-${d}-${String(i).padStart(2, "0")}.png`, fullPage: true });
  }
}
await b.close();
