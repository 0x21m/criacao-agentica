import { abrir, ctx, vigiar, cap, ir, nota, BASE } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "d1440"); const p = await c.newPage(); vigiar(p, "gestora");
const dump = async (sel="[role=dialog],[role=menu],[data-sonner-toast]") => p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.getAttribute("role")+": "+e.innerText.replace(/\s+/g," ").slice(0,300)), sel);
await p.goto(BASE + "/", { waitUntil: "commit" }); await p.waitForTimeout(400); await cap(p, "10-inicio-0s4");
await p.waitForTimeout(4600); await cap(p, "10-inicio-5s");
await cap(p, "10-inicio-full", true);
// o que é clicável em Atenção do dia
const att = await p.evaluate(() => { const h=[...document.querySelectorAll("h2,h3,p,span,div")].find(e=>e.textContent.trim()==="Atenção do dia"); const card=h?.closest("section,article,[class*=card]")||h?.parentElement?.parentElement; return card ? [...card.querySelectorAll("a,button,[role=button],[tabindex]")].map(e=>e.tagName+" "+(e.getAttribute("href")||"")+" "+e.innerText.replace(/\s+/g," ").slice(0,40)) : "sem card"; });
nota("ATENCAO clicaveis", JSON.stringify(att));
const pico = await p.evaluate(() => { const e=[...document.querySelectorAll("*")].find(e=>e.children.length===0 && e.textContent.trim()==="Pedidos no dia de pico"); return e?.closest("div[class]")?.parentElement?.innerText.replace(/\s+/g," ").slice(0,200); });
nota("PICO texto", pico);
// abre um atrasado
await p.getByText("#1052").first().click(); await p.waitForTimeout(2500);
nota("URL após clicar #1052", p.url()); await cap(p, "10-atrasado-aberto");
nota("dialogs", JSON.stringify(await dump()));
await b.close();
