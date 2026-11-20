process.on("unhandledRejection",e=>{});
import { abrir, ctx, vigiar, cap, ir, nota, BASE } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "d1440"); const p = await c.newPage(); vigiar(p, "gestora2");
const toasts = () => p.evaluate(() => [...document.querySelectorAll("[data-sonner-toast]")].map(e => e.innerText.replace(/\s+/g," ")));
// abre pedido atrasado direto
await ir(p, "/", 5000); await p.getByText("#1052").first().click(); await p.waitForTimeout(7000); nota("url", p.url()); 
await cap(p, "11-detalhe");
const dlg = p.getByRole("dialog");
nota("dialog", (await dlg.innerText().catch(()=>"(nenhum)")).replace(/\s+/g, " "));
const btn = dlg.getByRole("button", { name: /Mover para/ });
if (await btn.count()) { await btn.first().click(); await p.waitForTimeout(1200); await cap(p, "11-status-mudado"); nota("toasts", JSON.stringify(await toasts())); nota("dialog após", (await dlg.innerText().catch(()=>"(fechou)")).replace(/\s+/g," ").slice(0,200));
  await p.keyboard.press("Escape"); await p.waitForTimeout(700); await cap(p,"11-sheet-fechado-toast"); const desf = p.getByRole("button", { name: /Desfazer/i });
  if (await desf.count()) { await desf.first().click({timeout:4000}).catch(e=>nota("Desfazer não clicável após fechar sheet")); await p.waitForTimeout(1200); await cap(p, "11-desfeito"); nota("após desfazer", (await dlg.innerText().catch(()=>"(fechou)")).replace(/\s+/g," ").slice(0,200)); } else nota("SEM botão Desfazer");
}
await p.keyboard.press("Escape"); await p.waitForTimeout(800);
nota("após Esc, dialog?", await p.getByRole("dialog").count(), "url", p.url());
// filtros
await p.getByText("Só atrasados").click(); await p.waitForTimeout(800);
nota("contagem só atrasados", await p.evaluate(() => document.body.innerText.match(/\d+ de \d+ pedidos/)?.[0]));
await cap(p, "11-so-atrasados");
await p.locator("select").first().selectOption({ label: "Em andamento" }).catch(e => nota("select falhou", e.message.slice(0,80)));
await p.waitForTimeout(800);
nota("contagem atrasado+andamento", await p.evaluate(() => document.body.innerText.match(/\d+ de \d+ pedidos/)?.[0]));
await p.getByPlaceholder(/Buscar pedido/).fill("zzzz"); await p.waitForTimeout(800); await cap(p, "11-filtro-vazio");
await p.getByPlaceholder(/Buscar pedido/).fill(""); 
nota("url com filtros", p.url());
// exportar?
const exp = await p.getByText(/Exportar|CSV/i).count();
nota("elementos 'Exportar/CSV' na página:", exp);
// menu de ações da linha
await p.locator("button[aria-label^='Ações do pedido']").first().click(); await p.waitForTimeout(800);
nota("menu", (await p.getByRole("menu").innerText().catch(()=>"(sem menu)")).replace(/\s+/g," "));
await cap(p, "11-menu-linha");
await p.keyboard.press("Escape");
// quadro
await p.getByRole("button", { name: "Quadro" }).click(); await p.waitForTimeout(1500); await cap(p, "11-quadro");
await cap(p, "11-quadro-full", true);
await b.close();
