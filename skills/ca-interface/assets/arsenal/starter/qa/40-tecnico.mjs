process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, ir, nota } from "./lib.mjs";
const t = async (fn, rot) => { try { return await fn(); } catch (e) { nota("FALHOU", rot, e.message.split("\n")[0].slice(0,150)); } };
const b = await abrir();
const c = await ctx(b, "ipad"); const p = await c.newPage(); vigiar(p, "ipad");
const cdp = await c.newCDPSession(p);
const arrastar = async (x0, y0, x1, y1, passos = 12, segurar = 0) => {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
  if (segurar) await p.waitForTimeout(segurar);
  for (let i = 1; i <= passos; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * i / passos, y: y0 + (y1 - y0) * i / passos }] }); await p.waitForTimeout(16); }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};
nota("viewport", JSON.stringify(p.viewportSize()));
await ir(p, "/", 5000); await cap(p, "40-ipad-inicio"); await cap(p, "40-ipad-inicio-full", true);
await ir(p, "/pedidos/", 5000); await cap(p, "40-ipad-lista");
await t(() => p.getByRole("button", { name: "Quadro" }).tap(), "quadro"); await p.waitForTimeout(1500); await cap(p, "40-ipad-quadro");
const sx0 = await p.evaluate(() => { const el = [...document.querySelectorAll("*")].find(e => e.scrollWidth > e.clientWidth + 20 && getComputedStyle(e).overflowX !== "visible" && e.clientWidth > 300); window.__q = el; return el ? el.scrollLeft + "/" + (el.scrollWidth - el.clientWidth) : "sem rolagem horizontal"; });
nota("quadro rolagem horizontal", sx0);
await arrastar(600, 600, 150, 600); await p.waitForTimeout(800);
nota("após deslizar quadro", await p.evaluate(() => window.__q ? window.__q.scrollLeft : "-"));
await cap(p, "40-ipad-quadro-deslizado");
// segurar e arrastar card (DnD)
await arrastar(200, 420, 600, 420, 20, 600); await p.waitForTimeout(800); await cap(p, "40-ipad-quadro-arrastar-card");
nota("dialog após segurar/arrastar?", await p.getByRole("dialog").count());
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
// tap num card
const card = p.locator("a[href*='id=p'], [role=button]:has-text('#10')").first();
await t(() => card.tap(), "tap card"); await p.waitForTimeout(3000); await cap(p, "40-ipad-card-aberto");
// tentar fechar o sheet por gesto (arrastar para a direita/baixo)
await arrastar(560, 300, 760, 300); await p.waitForTimeout(800); nota("sheet ainda aberto após arrastar p/ direita?", await p.getByRole("dialog").count());
await p.keyboard.press("Escape");
// rolagem por toque da lista e barras fixas
await t(() => p.getByRole("button", { name: "Lista" }).tap(), "lista");
await p.waitForTimeout(800);
await arrastar(400, 900, 400, 200, 15); await p.waitForTimeout(800); await cap(p, "40-ipad-lista-rolada");
nota("scrollY após gesto", await p.evaluate(() => scrollY));
// algo atrás de barras fixas no fim da página?
await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600); await cap(p, "40-ipad-lista-fim");
nota("fixos", await p.evaluate(() => [...document.querySelectorAll("body *")].filter(e => ["fixed","sticky"].includes(getComputedStyle(e).position) && e.offsetHeight > 30).map(e => { const r = e.getBoundingClientRect(); return `${e.tagName}.${(e.className+"").slice(0,30)} y=${Math.round(r.top)} h=${Math.round(r.height)} w=${Math.round(r.width)}`; }).join(" | ")));
// tamanhos de alvos no ipad
nota("alvos <44 ipad /pedidos", await p.evaluate(() => [...document.querySelectorAll("a,button,[role=switch],input,select,[role=radio]")].filter(e => e.offsetParent).map(e => [e.getBoundingClientRect(), e]).filter(([r]) => r.width > 2 && (r.width < 44 || r.height < 44)).map(([r, e]) => `${(e.getAttribute("aria-label")||e.innerText||e.tagName).trim().replace(/\s+/g," ").slice(0,20)}=${Math.round(r.width)}x${Math.round(r.height)}`).filter((v,i,a)=>a.indexOf(v)===i).slice(0, 20).join("; ")));
await ir(p, "/clientes/", 5000); await cap(p, "40-ipad-clientes");
await t(() => p.getByText("Pet Shop Patas").first().tap(), "tap cliente"); await p.waitForTimeout(3000); await cap(p, "40-ipad-cliente-detalhe");
await c.close();
// celular: puxar o sheet
const c2 = await ctx(b, "pixel"); const q = await c2.newPage(); vigiar(q, "pixel");
const cdp2 = await c2.newCDPSession(q);
await ir(q, "/pedidos/?id=p13", 7000); await cap(q, "40-pixel-sheet");
const vp = q.viewportSize(); nota("pixel vp", JSON.stringify(vp));
await cdp2.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: vp.width - 60, y: 40 }] });
for (let i = 1; i <= 12; i++) { await cdp2.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: vp.width - 60, y: 40 + i * 40 }] }); await q.waitForTimeout(16); }
await cdp2.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await q.waitForTimeout(800);
nota("pixel sheet fechou ao puxar p/ baixo?", (await q.getByRole("dialog").count()) === 0);
await cap(q, "40-pixel-sheet-puxado");
await b.close();
