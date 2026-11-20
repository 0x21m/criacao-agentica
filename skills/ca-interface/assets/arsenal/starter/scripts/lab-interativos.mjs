// Teste de verdade do Kanban (/pedidos/?vista=quadro) e da agenda (/agenda/) interativos, no Chrome instalado.
// Faz arrasto real com o mouse, toque emulado (iPhone, hasTouch, eventos de toque pelo CDP) e teclado; confere que o
// item mudou de lugar e que o "Desfazer" do toast volta. Tira as capturas em capturas/.
//
//   node scripts/lab-interativos.mjs [url]        (sem URL: sobe o `astro preview` do build, como o navegar.mjs)
//
// Sai com código 1 se algum passo falhar. O console também vai para logs/lab-interativos-<data>.log do worktree.
import { devices } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { abrirNavegador, RAIZ, registrarLog, subirServidor } from "./_comum.mjs";
registrarLog("lab-interativos");

const { url: BASE, parar } = await subirServidor(process.argv[2] || process.env.URL);
const CAPTURAS = join(RAIZ, "capturas");
mkdirSync(CAPTURAS, { recursive: true });

const resultados = [];
let falhas = 0;
// "Aguardando peça" pede o motivo (P): antes de confirmar, a OS não muda de coluna.
async function motivoDaPeca(page) {
  const d = page.getByRole("dialog");
  await d.waitFor({ timeout: 3000 });
  igual(await colunaDoCartao(page, "OS-1047"), "execucao", "antes do motivo, continua em Em execução");
  await d.getByLabel("Qual peça e observação").fill("Capacitor 35 µF, fornecedor confirma amanhã");
  await d.getByRole("button", { name: "Mover para Aguardando peça" }).click();
  await d.waitFor({ state: "detached" });
}

async function passo(nome, f) {
  const t = Date.now();
  try { await f(); resultados.push(`  ok    ${nome} (${Date.now() - t} ms)`); }
  catch (e) {
    falhas++; resultados.push(`  FALHA ${nome}: ${e.message.split("\n")[0]}`);
    // FALHAS=<pasta> guarda uma captura de cada passo que falhou
    if (process.env.FALHAS && paginaAtual) await paginaAtual.screenshot({ path: join(process.env.FALHAS, `falha-${falhas}.png`) }).catch((x) => console.log("captura:", x.message));
  }
  console.log(resultados.at(-1));
}
const igual = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: esperava ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); };
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function ate(f, msg, ms = 4000) {
  const fim = Date.now() + ms;
  let ultimo;
  while (Date.now() < fim) { ultimo = await f(); if (ultimo) return ultimo; await espera(60); }
  throw new Error(`${msg} (último valor: ${JSON.stringify(ultimo)})`);
}

const navegador = await abrirNavegador();
const erros = [];
let paginaAtual = null;
async function novaPagina(opcoes, caminho) {
  const ctx = await navegador.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo", ...opcoes });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => erros.push(`${caminho}: ${e.message}`));
  await page.goto(BASE + caminho, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cartao-id], [data-bloco-id]", { timeout: 15000 });
  paginaAtual = page;
  await espera(300);
  return { ctx, page };
}
// no starter as colunas têm mais cartões que a tela: o cartão é rolado até aparecer antes de medir
const centro = async (loc) => { await loc.scrollIntoViewIfNeeded().catch(() => {}); const b = await loc.boundingBox(); if (!b) throw new Error("elemento fora da tela"); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
/** Ponto de soltar no fim visível de uma lista (a coluna pode passar da altura da tela). */
const fimVisivel = async (page, loc) => { const b = await loc.boundingBox(); const alto = page.viewportSize().height; return { x: b.x + b.width / 2, y: Math.min(b.y + b.height - 8, alto - 24) }; };

/** Arrasto de mouse em passos (o MouseSensor precisa de 5 px antes de começar). */
async function arrastarMouse(page, de, para, { passos = 14, antesDeSoltar } = {}) {
  await page.mouse.move(de.x, de.y);
  await page.mouse.down();
  await page.mouse.move(de.x + 8, de.y + 8, { steps: 3 });
  for (let i = 1; i <= passos; i++) await page.mouse.move(de.x + ((para.x - de.x) * i) / passos, de.y + ((para.y - de.y) * i) / passos);
  await espera(120);
  await page.mouse.move(para.x, para.y);
  try { if (antesDeSoltar) await antesDeSoltar(); }
  finally { await page.mouse.up(); }
}

/** Toque real pelo CDP: segura 350 ms (o TouchSensor pede 250 ms parado) e arrasta. */
async function arrastarToque(page, de, para, { passos = 16, segurar = 350 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const toque = (type, p) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: p ? [{ x: Math.round(p.x), y: Math.round(p.y) }] : [] });
  await toque("touchStart", de);
  await espera(segurar);
  for (let i = 1; i <= passos; i++) { await toque("touchMove", { x: de.x + ((para.x - de.x) * i) / passos, y: de.y + ((para.y - de.y) * i) / passos }); await espera(16); }
  await espera(150);
  await toque("touchMove", para);
  await toque("touchEnd");
  await cdp.detach();
}
async function tocar(page, p) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: Math.round(p.x), y: Math.round(p.y) }] });
  await espera(60);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

async function desfazer(page, textoToast) {
  const toast = page.locator("[data-sonner-toast]", { hasText: textoToast }).first();
  await toast.waitFor({ timeout: 5000 });
  await toast.getByRole("button", { name: "Desfazer" }).click();
}

// ---------- Kanban ----------
const colunaDoCartao = (page, id) => page.evaluate((id) => document.querySelector(`[data-cartao-id="${id}"]`)?.closest("[data-coluna]")?.getAttribute("data-coluna") ?? null, id);
const indiceNaColuna = (page, id) => page.evaluate((id) => {
  const li = document.querySelector(`[data-cartao-id="${id}"]`)?.closest("[data-item-id]");
  return li ? [...li.parentElement.querySelectorAll(":scope > [data-item-id]")].indexOf(li) : -1;
}, id);

console.log(`\nKanban (${BASE}pedidos/?vista=quadro)`);
{
  const { ctx, page } = await novaPagina({ viewport: { width: 1440, height: 900 } }, "pedidos/?vista=quadro");
  await page.screenshot({ path: join(CAPTURAS, "kanban-desktop.png") });

  await passo("mouse: OS-1047 de Em execução para Aguardando peça, com vaga e cartão erguido", async () => {
    // traz Em execução e Aguardando peça para o meio da tela
    await page.evaluate(() => { const q = document.querySelector("[data-quadro]"); const c = q.querySelector('[data-coluna="execucao"]'); q.scrollLeft = c.offsetLeft - q.offsetLeft - 200; });
    igual(await colunaDoCartao(page, "OS-1047"), "execucao", "coluna inicial");
    const de = await centro(page.locator('[data-cartao-id="OS-1047"]'));
    const alvo = await centro(page.locator('[data-coluna="aguardando_peca"] [data-lista]'));
    await arrastarMouse(page, de, { x: alvo.x, y: alvo.b.y + alvo.b.height - 10 }, {
      antesDeSoltar: async () => {
        igual(await page.locator(".vaga-cartao").count(), 1, "vaga tracejada no destino");
        igual(await page.locator(".cartao-erguido").count() >= 1, true, "cartão erguido com sombra");
        igual(await page.locator('#motivo-novas').count(), 1, "coluna inválida com o motivo");
        await page.screenshot({ path: join(CAPTURAS, "kanban-arrastando.png") });
      },
    });
    await motivoDaPeca(page);
    await ate(async () => (await colunaDoCartao(page, "OS-1047")) === "aguardando_peca", "OS-1047 não foi para Aguardando peça");
  });
  await passo("mouse: Desfazer volta a OS-1047 para Em execução", async () => {
    await desfazer(page, "OS-1047: aguardando peça.");
    await ate(async () => (await colunaDoCartao(page, "OS-1047")) === "execucao", "Desfazer não devolveu a OS-1047");
  });
  await passo("mouse: soltar em coluna inválida (Novas) não muda nada", async () => {
    await page.evaluate(() => { document.querySelector("[data-quadro]").scrollLeft = 0; });
    const de = await centro(page.locator('[data-cartao-id="OS-1052"]'));
    const alvo = await centro(page.locator('[data-coluna="novas"] [data-lista]'));
    await arrastarMouse(page, de, alvo);
    await espera(300);
    igual(await colunaDoCartao(page, "OS-1052"), "aguardando_cliente", "OS-1052 continua em Aguardando cliente");
  });
  await passo("mouse: soltar em Aguardando cliente abre a sheet e só move depois de Enviar orçamento", async () => {
    const de = await centro(page.locator('[data-cartao-id="OS-1055"]'));
    await arrastarMouse(page, de, await fimVisivel(page, page.locator('[data-coluna="aguardando_cliente"] [data-lista]')));
    await page.getByRole("heading", { name: "Enviar orçamento" }).waitFor({ timeout: 3000 });
    igual(await colunaDoCartao(page, "OS-1055"), "diagnostico", "antes de confirmar, continua em Diagnóstico");
    await page.getByLabel("Total do orçamento (R$)").fill("1.250,00");
    await page.getByRole("button", { name: "Enviar orçamento" }).click();
    await ate(async () => (await colunaDoCartao(page, "OS-1055")) === "aguardando_cliente", "não moveu depois do envio");
    await page.getByRole("dialog").waitFor({ state: "detached" });
  });
  await passo("teclado: Espaço pega, ← muda de coluna, Enter solta (OS-1044 para Em execução)", async () => {
    await page.locator('[data-cartao-id="OS-1044"]').focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowLeft");
    const anuncio = await page.locator("[data-anuncio]").first().textContent();
    if (!/Em execução/.test(anuncio)) throw new Error(`anúncio sem a coluna: ${anuncio}`);
    await page.keyboard.press("Enter");
    await ate(async () => (await colunaDoCartao(page, "OS-1044")) === "execucao", "OS-1044 não foi para Em execução");
    const foco = await page.evaluate(() => document.activeElement?.getAttribute("data-cartao-id"));
    igual(foco, "OS-1044", "foco continua no cartão");
  });
  await passo("teclado: Desfazer volta a OS-1044", async () => {
    await desfazer(page, "OS-1044: em execução.");
    await ate(async () => (await colunaDoCartao(page, "OS-1044")) === "aguardando_peca", "Desfazer não devolveu a OS-1044");
  });
  await passo("teclado: ↑ reordena dentro da coluna e Esc cancela", async () => {
    const inicio = await indiceNaColuna(page, "OS-1066")
    if (inicio < 1) throw new Error(`a OS-1066 precisa ter alguém acima dela (está em ${inicio})`)
    await page.locator('[data-cartao-id="OS-1066"]').focus();
    await page.keyboard.press("Space"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Escape");
    await espera(200);
    igual(await indiceNaColuna(page, "OS-1066"), inicio, "Esc deixou no lugar");
    await page.keyboard.press("Space"); await page.keyboard.press("ArrowUp"); await page.keyboard.press("Enter");
    await ate(async () => (await indiceNaColuna(page, "OS-1066")) === inicio - 1, "OS-1066 não subiu");
  });
  await passo("adicionar rápido no fim de Novas e editar o título no lugar (F2)", async () => {
    await page.getByRole("button", { name: "Adicionar OS" }).click();
    await page.getByLabel("Título da OS").fill("Revisão do split da cozinha");
    await page.keyboard.press("Enter");
    const nova = page.locator('[data-coluna="novas"] [data-cartao-id]', { hasText: "Revisão do split da cozinha" });
    await nova.waitFor({ timeout: 3000 });
    await page.keyboard.press("Escape");
    await nova.focus();
    await page.keyboard.press("F2");
    await page.getByLabel("Título do cartão").fill("Revisão do split da cozinha (urgente)");
    await page.keyboard.press("Enter");
    await page.locator('[data-coluna="novas"] [data-cartao-id]', { hasText: "(urgente)" }).waitFor({ timeout: 3000 });
  });
  await passo("recolher e expandir coluna", async () => {
    await page.getByRole("button", { name: "Recolher Prontas" }).click();
    await page.locator('[data-coluna="prontas"][data-recolhida]').waitFor();
    await page.getByRole("button", { name: "Expandir Prontas" }).click();
    await page.locator('[data-coluna="prontas"]:not([data-recolhida])').waitFor();
  });
  await ctx.close();
}

{
  const iphone = devices["iPhone 15"];
  const { ctx, page } = await novaPagina({ viewport: iphone.viewport, deviceScaleFactor: iphone.deviceScaleFactor, isMobile: true, hasTouch: true, userAgent: iphone.userAgent }, "pedidos/?vista=quadro");
  await passo("celular: uma coluna por vez com abas", async () => {
    igual(await page.locator('[role="tab"][data-aba-coluna]').count(), 7, "7 abas");
    await page.screenshot({ path: join(CAPTURAS, "kanban-celular.png") });
  });
  await passo("toque: segurar 250 ms e arrastar OS-1047 até a aba Aguardando peça", async () => {
    await page.locator('[data-aba-coluna="execucao"]').tap();
    await espera(600);
    await page.evaluate(() => { const a = document.querySelector('[data-aba-coluna="aguardando_peca"]'); a.parentElement.scrollLeft = a.offsetLeft - 120; });
    await espera(200);
    const de = await centro(page.locator('[data-cartao-id="OS-1047"]'));
    const aba = await centro(page.locator('[data-aba-coluna="aguardando_peca"]'));
    await arrastarToque(page, de, aba);
    await motivoDaPeca(page);
    await ate(async () => (await colunaDoCartao(page, "OS-1047")) === "aguardando_peca", "OS-1047 não foi para Aguardando peça pelo toque");
  });
  await passo("toque: Desfazer volta a OS-1047", async () => {
    const toast = page.locator("[data-sonner-toast]", { hasText: "OS-1047: aguardando peça." }).first();
    await toast.waitFor({ timeout: 5000 });
    await toast.getByRole("button", { name: "Desfazer" }).tap();
    await ate(async () => (await colunaDoCartao(page, "OS-1047")) === "execucao", "Desfazer não devolveu a OS-1047");
  });
  await ctx.close();
}

// ---------- Agenda ----------
const blocoInfo = (page, id) => page.evaluate((id) => {
  const b = document.querySelector(`[data-bloco-id="${id}"]:not([data-fantasma])`);
  return b ? { col: b.closest("[data-col-agenda]")?.getAttribute("data-col-agenda"), rotulo: b.getAttribute("aria-label") } : null;
}, id);
const yDoMinuto = async (page, col, min) => {
  const b = await page.locator(`[data-col-agenda="${col}"]`).boundingBox();
  return b.y + (min - 480);
};

console.log(`\nAgenda (${BASE}agenda/)`);
{
  const { ctx, page } = await novaPagina({ viewport: { width: 1440, height: 900 } }, "agenda/");
  await page.evaluate(() => { document.querySelector("[data-agenda]").scrollTop = 60; });
  await espera(150);
  await page.screenshot({ path: join(CAPTURAS, "agenda-desktop.png") });

  await passo("linha do agora na coluna de hoje", async () => {
    igual(await page.locator('[data-col-agenda="bruno"] .bg-negative').count() > 0, true, "linha do agora");
  });
  await passo("mouse: AG-3302 do Bruno 10:00 para o Gustavo 11:00", async () => {
    const bl = page.locator('[data-bloco-id="AG-3302"]');
    const { b } = await centro(bl);
    const de = { x: b.x + b.width / 2, y: b.y + 20 }; // 20 px abaixo do topo = 20 min
    const gus = await page.locator('[data-col-agenda="gustavo"]').boundingBox();
    const para = { x: gus.x + gus.width / 2, y: (await yDoMinuto(page, "gustavo", 660)) + 20 };
    await arrastarMouse(page, de, para, {
      antesDeSoltar: async () => { igual(await page.locator("[data-fantasma]").count(), 1, "fantasma no destino"); },
    });
    await ate(async () => { const i = await blocoInfo(page, "AG-3302"); return i?.col === "gustavo" && i.rotulo.includes("11:00 a 12:00"); }, "AG-3302 não foi para Gustavo 11:00");
  });
  await passo("mouse: Desfazer volta o AG-3302 para Bruno 10:00", async () => {
    await desfazer(page, "AG-3302 movido");
    await ate(async () => { const i = await blocoInfo(page, "AG-3302"); return i?.col === "bruno" && i.rotulo.includes("10:00 a 11:00"); }, "Desfazer não devolveu o AG-3302");
  });
  await passo("conflito ao vivo: AG-3308 (limpeza) sobre o Bruno às 14:00 (Esc cancela)", async () => {
    const bl = await page.locator('[data-bloco-id="AG-3308"]').boundingBox();
    const de = { x: bl.x + bl.width / 2, y: bl.y + 15 };
    const bru = await page.locator('[data-col-agenda="bruno"]').boundingBox();
    const para = { x: bru.x + bru.width / 2, y: (await yDoMinuto(page, "bruno", 840)) + 15 };
    await page.mouse.move(de.x, de.y); await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(de.x + ((para.x - de.x) * i) / 12, de.y + ((para.y - de.y) * i) / 12);
    await espera(150);
    try {
      igual(await page.locator("[data-fantasma][data-conflito]").count(), 1, "fantasma com conflito");
      await page.screenshot({ path: join(CAPTURAS, "agenda-conflito-ao-vivo.png") });
    } finally {
      await page.keyboard.press("Escape");
      await page.mouse.up();
    }
    await espera(200);
    const i = await blocoInfo(page, "AG-3308");
    igual(i.col, "elisa", "AG-3308 continua com a Elisa");
  });
  await passo("alvo inválido: montagem (AG-3310) no Bruno fica hachurada e não muda", async () => {
    const bl = await page.locator('[data-bloco-id="AG-3310"]').boundingBox();
    const de = { x: bl.x + bl.width / 2, y: bl.y + 20 };
    const bru = await page.locator('[data-col-agenda="bruno"]').boundingBox();
    await arrastarMouse(page, de, { x: bru.x + bru.width / 2, y: (await yDoMinuto(page, "bruno", 720)) + 20 }, {
      antesDeSoltar: async () => {
        const t = await page.locator("[data-fantasma][data-invalido]").textContent();
        if (!/Bruno não faz montagem/.test(t)) throw new Error(`motivo errado: ${t}`);
      },
    });
    await espera(300);
    igual((await blocoInfo(page, "AG-3310")).col, "fabio", "AG-3310 continua com o Fábio");
  });
  await passo("esticar a borda: AG-3305 de 15:00–16:00 para 15:00–16:30", async () => {
    const alca = page.locator('[data-bloco-id="AG-3305"] [data-alca="fim"]');
    const { x, y } = await centro(alca);
    await arrastarMouse(page, { x, y }, { x, y: y + 30 });
    await ate(async () => (await blocoInfo(page, "AG-3305"))?.rotulo.includes("15:00 a 16:30"), "AG-3305 não esticou");
  });
  await passo("esticar: Desfazer volta a 16:00", async () => {
    await desfazer(page, "AG-3305 agora vai");
    await ate(async () => (await blocoInfo(page, "AG-3305"))?.rotulo.includes("15:00 a 16:00"), "Desfazer não voltou a duração");
  });
  await passo("criar arrastando no vazio: Gustavo 13:00–14:30 abre o diálogo preenchido e cria", async () => {
    const gus = await page.locator('[data-col-agenda="gustavo"]').boundingBox();
    const x = gus.x + gus.width / 2;
    await arrastarMouse(page, { x, y: (await yDoMinuto(page, "gustavo", 780)) + 3 }, { x, y: (await yDoMinuto(page, "gustavo", 870)) });
    await page.getByRole("heading", { name: "Novo agendamento" }).waitFor({ timeout: 3000 });
    igual(await page.getByRole("combobox", { name: "Início" }).inputValue(), "780", "início 13:00");
    igual(await page.getByRole("combobox", { name: "Duração" }).inputValue(), "90", "duração 1 h 30");
    igual(await page.getByRole("combobox", { name: "Recurso" }).inputValue(), "gustavo", "recurso Gustavo");
    await page.getByRole("button", { name: "Criar agendamento" }).click();
    await ate(async () => page.evaluate(() => document.querySelectorAll('[data-col-agenda="gustavo"] [data-bloco-id]:not([data-fantasma])').length === 1), "bloco novo não apareceu no Gustavo");
    await page.getByRole("dialog").waitFor({ state: "detached" });
  });
  await passo("teclado: Espaço pega AG-3302, ↓↓ anda 30 min, Enter solta; Desfazer volta", async () => {
    await page.locator('[data-bloco-id="AG-3302"]').focus();
    await page.keyboard.press("Space"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown");
    const anuncio = await page.locator("[data-anuncio]").first().textContent();
    if (!/10:30 a 11:30/.test(anuncio)) throw new Error(`anúncio sem o horário: ${anuncio}`);
    await page.keyboard.press("Enter");
    await ate(async () => (await blocoInfo(page, "AG-3302"))?.rotulo.includes("10:30 a 11:30"), "AG-3302 não andou pelo teclado");
    await desfazer(page, "AG-3302 movido");
    await ate(async () => (await blocoInfo(page, "AG-3302"))?.rotulo.includes("10:00 a 11:00"), "Desfazer não voltou o AG-3302");
  });
  await passo("teclado: Alt+↓ estica e → troca de recurso (AG-3302 para Diego… conflito anunciado), Esc cancela", async () => {
    await page.locator('[data-bloco-id="AG-3302"]').focus();
    await page.keyboard.press("Space"); await page.keyboard.press("Alt+ArrowDown"); await page.keyboard.press("ArrowRight");
    const anuncio = await page.locator("[data-anuncio]").first().textContent();
    if (!/10:00 a 11:15, Diego Reis/.test(anuncio) || !/Conflito com AG-3304/.test(anuncio)) throw new Error(`anúncio inesperado: ${anuncio}`);
    await page.keyboard.press("Escape");
    await espera(200);
    const i = await blocoInfo(page, "AG-3302");
    igual(i.col, "bruno", "Esc deixou no Bruno"); igual(i.rotulo.includes("10:00 a 11:00"), true, "Esc deixou o horário");
  });
  await passo("semana do recurso: 6 colunas e sexta 20/11 bloqueada", async () => {
    // a troca de vista é o segmentado de vidro da base (React Aria: cada opção é um "radio")
    await page.getByRole("radio", { name: "Semana" }).click();
    await page.locator('[data-col-agenda="2026-11-20"]').waitFor();
    igual(await page.locator("[data-col-agenda]").count(), 6, "seg a sáb");
    const t = await page.locator('[data-col-agenda="2026-11-20"]').textContent();
    if (!/Feriado/.test(t)) throw new Error("sexta sem o aviso de feriado");
    await page.screenshot({ path: join(CAPTURAS, "agenda-semana-desktop.png") });
  });
  await ctx.close();
}

{
  const iphone = devices["iPhone 15"];
  const { ctx, page } = await novaPagina({ viewport: iphone.viewport, deviceScaleFactor: iphone.deviceScaleFactor, isMobile: true, hasTouch: true, userAgent: iphone.userAgent }, "agenda/");
  await passo("celular: um recurso por vez", async () => {
    igual(await page.locator("[data-col-agenda]").count(), 1, "uma coluna");
    await page.screenshot({ path: join(CAPTURAS, "agenda-celular.png") });
  });
  await passo("toque: segurar e arrastar AG-3302 de 10:00 para 11:00", async () => {
    const bl = await page.locator('[data-bloco-id="AG-3302"]').boundingBox();
    const de = { x: bl.x + bl.width / 2, y: bl.y + 20 };
    await arrastarToque(page, de, { x: de.x, y: de.y + 60 });
    await ate(async () => (await blocoInfo(page, "AG-3302"))?.rotulo.includes("11:00 a 12:00"), "AG-3302 não foi para 11:00 pelo toque");
  });
  await passo("toque: Desfazer volta o AG-3302 para 10:00", async () => {
    const toast = page.locator("[data-sonner-toast]", { hasText: "AG-3302 movido" }).first();
    await toast.waitFor({ timeout: 5000 });
    await toast.getByRole("button", { name: "Desfazer" }).tap();
    await ate(async () => (await blocoInfo(page, "AG-3302"))?.rotulo.includes("10:00 a 11:00"), "Desfazer não voltou pelo toque");
  });
  await passo("encaixe por toque: tocar num horário livre abre o Novo agendamento nele", async () => {
    await page.evaluate(() => { document.querySelector("[data-agenda]").scrollTop = 100; });
    await espera(200);
    // no starter o cabeçalho do celular é mais alto: rola a página até 12:00 ficar no meio da tela, longe das abas
    const alvo = await yDoMinuto(page, "bruno", 720)
    await page.evaluate((y) => window.scrollBy(0, y - innerHeight / 2), alvo)
    await espera(300);
    const col = await page.locator('[data-col-agenda="bruno"]').boundingBox();
    const y = (await yDoMinuto(page, "bruno", 720)) + 10; // 12:10 → encaixa em 12:00
    await tocar(page, { x: col.x + col.width / 2, y });
    await page.getByRole("heading", { name: "Novo agendamento" }).waitFor({ timeout: 3000 });
    igual(await page.getByRole("combobox", { name: "Início" }).inputValue(), "720", "início 12:00");
    await page.screenshot({ path: join(CAPTURAS, "agenda-celular-encaixe.png") });
  });
  await ctx.close();
}

await navegador.close();
parar();
if (erros.length) { console.log("\nErros de página:"); for (const e of erros) console.log("  " + e); }
console.log(`\n${resultados.length - falhas} de ${resultados.length} passos ok. Capturas em capturas/.`);
process.exit(falhas || erros.length ? 1 : 0);
