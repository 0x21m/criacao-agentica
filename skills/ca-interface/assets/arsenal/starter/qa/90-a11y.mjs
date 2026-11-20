process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, cap, ir, nota } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "d1280"); const p = await c.newPage();
for (const u of ["/", "/pedidos/", "/pedidos/novo/", "/clientes/", "/configuracoes/aparencia/"]) {
  await ir(p, u, 4500);
  const r = await p.evaluate(() => {
    const semNome = [...document.querySelectorAll("button,a,[role=button],input,select")].filter(e => e.offsetParent && !(e.getAttribute("aria-label") || e.innerText?.trim() || e.labels?.length || e.getAttribute("aria-labelledby") || e.title || e.placeholder)).map(e => e.outerHTML.slice(0, 70));
    const hs = [...document.querySelectorAll("h1,h2,h3,h4")].map(h => h.tagName[1]);
    const h1 = hs.filter(x => x === "1").length;
    const pulos = hs.filter((x, i) => i && x - hs[i - 1] > 1).length;
    const ingles = [...document.querySelectorAll("[aria-label],button,span")].map(e => e.getAttribute("aria-label") || "").filter(t => /\b(Close|Open|Toggle|Loading|Previous|Next|Search)\b/.test(t));
    return { semNome: semNome.slice(0, 4), h1, pulos, ingles: [...new Set(ingles)].slice(0, 5), lang: document.documentElement.lang };
  });
  nota("A11Y", u, JSON.stringify(r));
}
// foco visível na tabela
await ir(p, "/pedidos/", 4500);
await p.locator("a", { hasText: "#1069" }).first().focus(); await p.waitForTimeout(300); await cap(p, "90-foco-linha");
const ring = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + " " + s.outlineWidth + " " + s.boxShadow.slice(0, 60); }); nota("foco link #1069:", ring);
await p.keyboard.press("Enter"); await p.waitForTimeout(2500);
nota("Enter no link abre detalhe?", await p.getByRole("dialog").count(), "foco em:", await p.evaluate(() => document.activeElement.outerHTML.slice(0, 90)));
await p.keyboard.press("Escape"); await p.waitForTimeout(800);
nota("após Esc foco volta para:", await p.evaluate(() => document.activeElement.outerHTML.slice(0, 90)));
// quadro: teclado
await p.getByRole("button", { name: "Quadro" }).click(); await p.waitForTimeout(1200);
nota("cards do quadro focáveis:", await p.evaluate(() => [...document.querySelectorAll("main a, main [tabindex='0']")].filter(e => e.offsetParent).length));
// zoom 200% (reflow em 640)
await p.setViewportSize({ width: 640, height: 800 }); await ir(p, "/", 4500); await cap(p, "90-reflow-640");
nota("reflow 640 ox:", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await b.close();
