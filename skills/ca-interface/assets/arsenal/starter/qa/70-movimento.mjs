process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, nota, BASE } from "./lib.mjs";
const b = await abrir();
for (const rm of ["no-preference", "reduce"]) {
  const c = await ctx(b, "d1280", { reducedMotion: rm, abertura: true }); const p = await c.newPage(); vigiar(p, rm);
  const t0 = Date.now();
  await p.goto(BASE + "/", { waitUntil: "commit" });
  // tempo até a abertura sumir
  let fim = null;
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(150); const vis = await p.evaluate(() => !!document.querySelector("main") && !![...document.querySelectorAll("button")].find(b => b.innerText.trim() === "Pular" && b.offsetParent)); if (i === 4) await cap(p, `70-${rm}-abertura`); if (!vis && i > 3) { fim = Date.now() - t0; break; } }
  nota(`abertura (${rm}) some em ~`, fim, "ms");
  for (const ms of [100, 400, 900, 2000]) { await p.waitForTimeout(ms === 100 ? 100 : ms - [100,400,900,2000][[100,400,900,2000].indexOf(ms)-1]); await cap(p, `70-${rm}-t${ms}`); }
  const anims = await p.evaluate(() => document.getAnimations().map(a => `${a.effect?.target?.className?.toString().slice(0,25)}:${Math.round(a.effect?.getComputedTiming().duration)}ms ${a.playState}`).slice(0, 12));
  nota(`animações ativas 2s após (${rm})`, anims.length, JSON.stringify(anims));
  // animações infinitas
  await p.waitForTimeout(5000);
  nota(`ainda rodando 7s depois (${rm})`, JSON.stringify(await p.evaluate(() => document.getAnimations().filter(a => a.playState === "running").map(a => `${a.effect?.target?.tagName}.${(a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? "").toString().slice(0,30)} it=${a.effect?.getComputedTiming().iterations}`).slice(0, 8))));
  // troca de rota
  await p.click("a[href='/pedidos/']"); await p.waitForTimeout(120); await cap(p, `70-${rm}-transicao-120ms`); await p.waitForTimeout(300); await cap(p, `70-${rm}-transicao-420ms`);
  await c.close();
}
// esquema escuro do sistema com tema=sistema
const c = await ctx(b, "iphone", { colorScheme: "light" }); const p = await c.newPage();
await p.goto(BASE + "/?tema=sistema", { waitUntil: "load" }); await p.waitForTimeout(4000); nota("sistema+light ->", await p.evaluate(() => document.documentElement.className)); await cap(p, "70-sistema-light-iphone");
await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(800); nota("sistema muda ao vivo p/ dark ->", await p.evaluate(() => document.documentElement.className)); await cap(p, "70-sistema-dark-iphone");
await b.close();
