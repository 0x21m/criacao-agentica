process.on("unhandledRejection", e => console.log("REJ", e.message.slice(0,200)));
import { abrir, ctx, vigiar, cap, ir, nota } from "./lib.mjs";
const b = await abrir(); const c = await ctx(b, "iphone"); const p = await c.newPage(); vigiar(p, "atendente");
const t = async (fn, rot) => { try { return await fn(); } catch (e) { nota("FALHOU", rot, e.message.split("\n")[0].slice(0,150)); } };
await ir(p, "/", 5000);
await t(() => p.getByRole("link", { name: /^Novo$/ }).last().tap(), "tap aba Novo"); await p.waitForTimeout(5000);
nota("url", p.url()); await cap(p, "20-novo-celular");
await cap(p, "20-novo-celular-full", true);
// enviar vazio
await t(() => p.getByRole("button", { name: /Criar pedido/ }).tap(), "tap criar vazio"); await p.waitForTimeout(800);
await cap(p, "20-novo-erros");
nota("erros visiveis", await p.evaluate(() => [...document.querySelectorAll("[data-slot=field-error],[role=alert],.text-destructive,[aria-invalid=true]")].map(e => e.tagName + ":" + (e.innerText||e.getAttribute("name")||"").slice(0,60)).join(" | ")));
const desc = "QATESTE Substituição completa do sistema de climatização central com garantia estendida de cinco anos e manutenção trimestral incluída";
await t(() => p.getByLabel(/O que será feito/).fill(desc), "desc");
// cliente: como é o campo?
const cli = p.getByRole("button", { name: /Escolha o cliente/ }).first();
nota("campo cliente tag", await t(() => cli.evaluate(e => e.tagName + " role=" + e.getAttribute("role"))));
await t(() => cli.tap(), "tap cliente"); await p.waitForTimeout(1000); await cap(p, "20-cliente-aberto");
nota("opções", await p.evaluate(() => [...document.querySelectorAll("[role=option],option")].map(e => e.innerText.trim()).slice(0,40).join(" | ")));
const longo = await p.evaluate(() => [...document.querySelectorAll("[role=option],option")].map(e=>e.innerText.trim()).sort((a,b)=>b.length-a.length)[0]);
nota("cliente mais longo", longo);
await t(() => p.getByRole("option", { name: longo }).first().tap(), "tap opção longa");
await p.waitForTimeout(600);
await t(() => p.getByLabel(/Valor/).fill("98765432,10"), "valor"); 
await t(() => p.getByLabel(/Valor/).blur(), "blur");
await p.waitForTimeout(400); await cap(p, "20-form-preenchido");
await cap(p, "20-form-preenchido-full", true);
await t(() => p.getByRole("button", { name: /Criar pedido/ }).tap(), "tap criar"); await p.waitForTimeout(5000);
nota("url após criar", p.url()); await cap(p, "20-apos-criar");
nota("toast", await p.evaluate(() => [...document.querySelectorAll("[data-sonner-toast]")].map(e => e.innerText.replace(/\s+/g," ")).join(" | ")));
await t(()=>p.getByRole("link",{name:/^Pedidos$/}).last().tap(),"aba pedidos"); await p.waitForTimeout(5000); await cap(p,"20-lista-apos-criar"); const achou = await p.getByText(desc.slice(0, 30)).count(); nota("novo pedido na lista?", achou);
// busca global pela lupa
await t(() => p.getByRole("button", { name: /Buscar/ }).first().tap(), "tap lupa"); await p.waitForTimeout(1200);
await p.keyboard.type("Compan", { delay: 60 }); await p.waitForTimeout(900); await cap(p, "20-busca-global");
nota("resultados busca", await p.evaluate(() => [...document.querySelectorAll("[role=option]")].map(e=>e.innerText.replace(/\s+/g," ")).slice(0,8).join(" | ")));
await t(() => p.getByRole("option").first().tap(), "tap resultado"); await p.waitForTimeout(5000);
nota("url resultado", p.url()); await cap(p, "20-cliente-detalhe");
await cap(p, "20-cliente-detalhe-full", true);
await b.close();
