process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, ir, nota } from "./lib.mjs";
const t = async (fn, rot) => { try { return await fn(); } catch (e) { nota("FALHOU", rot, e.message.split("\n")[0].slice(0,150)); } };
const b = await abrir();
{ // A: overflow do formulário com cliente longo
  const c = await ctx(b, "iphone"); const p = await c.newPage(); vigiar(p, "A");
  await ir(p, "/pedidos/novo/", 5000);
  await p.getByLabel(/O que será feito/).fill("Troca de vitrine");
  await p.getByRole("button", { name: /Escolha o cliente/ }).tap(); await p.waitForTimeout(600);
  await p.getByRole("option", { name: /Companhia Brasileira/ }).tap(); await p.waitForTimeout(800);
  nota("A overflow-x após cliente longo:", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), "largura form:", await p.evaluate(() => Math.round(document.querySelector("form")?.getBoundingClientRect().width)));
  await cap(p, "30A-form-cliente-longo");
  await p.getByLabel(/Valor/).fill("abc"); await p.getByLabel(/Valor/).blur(); await p.waitForTimeout(300);
  nota("A valor 'abc' ->", await p.getByLabel(/Valor/).inputValue());
  await p.getByLabel(/Valor/).fill("-50"); await p.getByLabel(/Valor/).blur(); nota("A valor '-50' ->", await p.getByLabel(/Valor/).inputValue());
  await p.getByLabel(/Prazo/).fill("2020-01-01").catch(()=>{}); nota("A prazo passado aceito? ", await p.getByLabel(/Prazo/).inputValue());
  // busca global
  await ir(p, "/clientes/", 5000);
  await t(() => p.getByRole("button", { name: /^Buscar/ }).first().tap(), "lupa"); await p.waitForTimeout(1200);
  await p.keyboard.type("Compan", { delay: 50 }); await p.waitForTimeout(900); await cap(p, "30A-busca-global");
  await t(() => p.getByRole("option").first().tap(), "resultado"); await p.waitForTimeout(5000);
  nota("A url resultado", p.url()); await cap(p, "30A-cliente-detalhe"); await cap(p, "30A-cliente-detalhe-full", true);
  // alvos pequenos no celular
  await ir(p, "/pedidos/", 5000);
  nota("A alvos <44px em /pedidos:", await p.evaluate(() => [...document.querySelectorAll("a,button,[role=switch],input,select,[role=button]")].filter(e => e.offsetParent && getComputedStyle(e).visibility!=="hidden").map(e => { const r = e.getBoundingClientRect(); return [r, e]; }).filter(([r]) => r.width > 0 && (r.width < 44 || r.height < 44)).map(([r, e]) => `${(e.getAttribute("aria-label")||e.innerText||e.tagName).trim().slice(0,22)}=${Math.round(r.width)}x${Math.round(r.height)}`).slice(0, 25).join("; ")));
  await c.close();
}
{ // C: toast via menu da linha (desktop)
  const c = await ctx(b, "d1280"); const p = await c.newPage(); vigiar(p, "C");
  await ir(p, "/pedidos/", 5000);
  await p.locator("button[aria-label^='Ações do pedido']").nth(1).click(); await p.waitForTimeout(500);
  await p.getByRole("menuitem", { name: /Mover para/ }).first().click(); await p.waitForTimeout(400);
  await cap(p, "30C-toast-status");
  const t0 = Date.now(); let vivo = true; while (vivo && Date.now() - t0 < 12000) { vivo = (await p.locator("[data-sonner-toast]").count()) > 0; await p.waitForTimeout(250); }
  nota("C toast durou ~", Date.now() - t0, "ms");
  await p.locator("button[aria-label^='Ações do pedido']").nth(2).click(); await p.waitForTimeout(500);
  await p.getByRole("menuitem", { name: /Excluir/ }).first().click(); await p.waitForTimeout(700);
  await cap(p, "30C-excluir"); nota("C excluir abre confirmação?", await p.getByRole("alertdialog").count() + await p.getByRole("dialog").count());
  await p.keyboard.press("Escape");
  // Ctrl K
  await p.keyboard.press("Control+k"); await p.waitForTimeout(800); await cap(p, "30C-ctrlk");
  await p.keyboard.type("1099"); await p.waitForTimeout(700); await cap(p, "30C-ctrlk-1099");
  await p.keyboard.press("ArrowDown"); await p.keyboard.press("Enter"); await p.waitForTimeout(5000); nota("C ctrlK enter url", p.url()); await cap(p, "30C-ctrlk-destino");
  // F barra controles
  await p.keyboard.press("Escape"); await p.mouse.click(700, 260); await p.keyboard.press("f"); await p.waitForTimeout(800); await cap(p, "30C-barra-f");
  for (const e of ["carregando", "vazio", "erro"]) { await ir(p, "/?estado=" + e, 5000); await cap(p, "30C-estado-" + e); await ir(p, "/clientes/?estado=" + e, 4000); await cap(p, "30C-clientes-" + e); }
  await c.close();
}
await b.close();
