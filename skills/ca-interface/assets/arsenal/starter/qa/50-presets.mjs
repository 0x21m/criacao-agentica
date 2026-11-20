process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, ir, nota, CAP } from "./lib.mjs";
import fs from "node:fs";
const b = await abrir();
const presets = ["noite", "vidro", "sobrio", "aurora", "sinal"];
const combos = [["claro",0],["claro",1],["escuro",0],["escuro",1]];
const rota = process.argv[2] || "/"; const tag = process.argv[3] || "inicio"; const disp = process.argv[4] || "d1280";
for (const pr of presets) {
  const c = await ctx(b, disp); const p = await c.newPage(); vigiar(p, pr);
  for (const [tema, v] of combos) {
    const sep = rota.includes("?") ? "&" : "?";
    await ir(p, `${rota}${sep}preset=${pr}&tema=${tema}&vidro=${v}`, 4500);
    const m = await p.evaluate(() => {
      const h = document.documentElement;
      const cards = [...document.querySelectorAll("main [data-slot=card], main section, main article")].filter(e => e.offsetHeight > 80 && e.offsetWidth > 150);
      const semBlur = cards.filter(e => { const s = getComputedStyle(e); return (s.backdropFilter === "none" || !s.backdropFilter) && s.backgroundColor.includes("/") || s.backgroundColor.startsWith("rgba") && (s.backdropFilter==="none"); }).length;
      const blur = cards.map(e => getComputedStyle(e).backdropFilter).filter(x => x && x !== "none");
      // linhas de cards (mesmo top) com alturas diferentes
      const rows = {}; cards.forEach(e => { const r = e.getBoundingClientRect(); const k = Math.round(r.top / 4); (rows[k] ||= []).push(Math.round(r.height)); });
      const desn = Object.values(rows).filter(a => a.length > 1 && Math.max(...a) - Math.min(...a) > 6).map(a => a.join("/"));
      const sombras = new Set(cards.map(e => getComputedStyle(e).boxShadow.slice(0, 40))).size;
      const raios = new Set(cards.map(e => getComputedStyle(e).borderRadius)).size;
      return { tema: h.className, vidro: h.dataset.vidro, skin: h.dataset.skin, font: getComputedStyle(document.body).fontFamily.split(",")[0], n: cards.length, comBlur: blur.length, desn, sombras, raios };
    });
    nota(`PRESET ${pr} ${tema} vidro=${v}`, JSON.stringify(m));
    await cap(p, `50-${tag}-${pr}-${tema}-v${v}`);
  }
  await c.close();
}
// montagem
const c = await ctx(b, "d1440"); const p = await c.newPage();
for (const pr of presets) {
  const imgs = combos.map(([t, v]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(CAP + `50-${tag}-${pr}-${t}-v${v}.png`).toString("base64")}"><figcaption>${pr} · ${t} · vidro ${v}</figcaption></figure>`).join("");
  await p.setContent(`<style>body{margin:0;background:#888;display:grid;grid-template-columns:1fr 1fr;gap:6px;font:14px sans-serif}img{width:100%;display:block}figure{margin:0}figcaption{background:#000;color:#fff;padding:2px 6px}</style>${imgs}`);
  await p.waitForTimeout(300); await p.screenshot({ path: CAP + `51-montagem-${tag}-${pr}.png`, fullPage: true });
}
await b.close();
