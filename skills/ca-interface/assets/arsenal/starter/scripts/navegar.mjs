// Percorre o protótipo como uma pessoa apressada e aponta o que quebra. Sai com código 1 se achar problema.
// Uso: node scripts/navegar.mjs [url]   (sem url: gera o build se faltar e sobe `astro preview`)
// Opções: --larguras 1440,390   --rapido (não clica nos botões de navegação)
//         --rotas pedidos/,estoque/ (só as rotas com esses prefixos e as que os links delas revelam dentro dos prefixos;
//         pula a abertura, que é da home). O que sai no console também vai para logs/navegar-<data>.log do worktree.
//
// Confere, em 1440 e 390 de largura:
//  - todas as rotas de src/pages e as que os links revelam: status ≥ 400 (404), erro de console ou de página;
//  - links: destino que responde ≥ 400 (link morto), href vazio ou "#" (beco), clique que não leva ao destino;
//  - botões de navegação (barra superior, lateral, abas, barra de ferramentas): clique sem nenhum efeito;
//  - rolagem horizontal da página;
//  - texto cortado sem reticências (e reticências sem o texto inteiro no title, como aviso);
//  - elemento fixo ou grudado cobrindo conteúdo no topo e no fim da rolagem.
// As 4 combinações de aparência (claro, claro + vidro, escuro, escuro + vidro): a rodada completa na primeira,
// e nas outras três todas as rotas de novo com as verificações de página (sem clicar).
// Os estados de cada tela que usa <ComDados> (?estado=carregando|vazio|erro) e o "Tentar de novo" do erro.
// Detectores do auditor do MIFT UI: rótulo quebrado, card órfão, rolagem dupla e alvo de toque < 40 px no celular.
// E a abertura: aparece na primeira visita, "Pular" funciona e, com movimento reduzido, não aparece nem deixa
// animação longa rodando.
import { abrirNavegador, argumentos, esperarPagina, filtroDeRotas, registrarLog, rotasDasPaginas, semAbertura, subirServidor } from "./_comum.mjs";

const args = argumentos();
registrarLog("navegar");
const naRota = filtroDeRotas(args.rotas);
const LARGURAS = String(args.larguras || "1440,390").split(",").map(Number);
const ALTURA = { 1440: 900, 390: 844 };
const problemas = [];
const avisos = [];
const falha = (largura, rota, tipo, detalhe) => problemas.push({ largura, rota: "/" + rota, tipo, detalhe });
const aviso = (largura, rota, tipo, detalhe) => avisos.push({ largura, rota: "/" + rota, tipo, detalhe });

const { url: BASE, parar } = await subirServidor(args._[0] || process.env.URL);
const base = new URL(BASE);
const rotaDe = (href) => {
  const u = new URL(href, BASE);
  if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname)) return null;
  return u.pathname.slice(base.pathname.length);
};
const browser = await abrirNavegador();
console.log(`Navegando em ${BASE} (${LARGURAS.join(" e ")} px)${args.rotas ? `, só ${args.rotas}` : ""}…`);

// ---------------------------------------------------------------- abertura
if (!args.rotas) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // a abertura dura até 1,2 s depois do "load": entra sem esperar o load e clica em "Pular" assim que ela aparece
  // aquece o servidor de prévia (a primeira resposta a frio atrasava o "Pular" em mais de 3 s sem defeito na abertura)
  await fetch(BASE).catch(() => {})
  await page.goto(BASE, { waitUntil: "commit" });
  const apareceu = await page.waitForSelector("[data-abertura-tela]", { timeout: 4000 }).then(() => true, () => false);
  if (!apareceu) falha(1440, "", "abertura", "a abertura não apareceu na primeira visita (confira MARCA.abertura.ativa)");
  else {
    // clique de verdade, sem force: o Playwright espera o botão ficar estável e visível e passa o ponteiro por cima
    // (o que pausa o relógio da abertura). Se o clique não chegar, é defeito da abertura, e o teste acusa.
    const erroPular = await page.getByRole("button", { name: "Pular" }).click({ timeout: 3000 }).then(() => null, (e) => e.message.split(String.fromCharCode(10))[0]);
    if (erroPular) falha(1440, "", "abertura", `"Pular" não recebe o clique: ${erroPular.slice(0, 140)}`);
    const saiu = await page.waitForSelector("[data-abertura-tela]", { state: "detached", timeout: 1500 }).then(() => true, () => false);
    if (!saiu) falha(1440, "", "abertura", "\"Pular\" não fechou a abertura em 1,5 s");
    const coberta = await page.evaluate(() => document.documentElement.hasAttribute("data-abertura"));
    if (coberta) falha(1440, "", "abertura", "a home continua coberta depois de pular");
    await page.reload();
    await page.waitForTimeout(800);
    if (await page.$("[data-abertura-tela]")) falha(1440, "", "abertura", "a abertura tocou de novo na mesma sessão");
  }
  await ctx.close();

  const red = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p2 = await red.newPage();
  for (const rota of ["", "pedidos/"]) {
    await p2.goto(BASE + rota);
    await esperarPagina(p2, 400);
    if (rota === "" && (await p2.$("[data-abertura-tela]"))) falha(1440, rota, "movimento reduzido", "a abertura apareceu com movimento reduzido");
    const longas = await p2.evaluate(() => document.getAnimations()
      .filter((a) => a.playState === "running")
      .map((a) => ({ alvo: a.effect?.target?.className?.toString?.().slice(0, 60) || a.effect?.target?.tagName, t: a.effect?.getComputedTiming() }))
      .filter((a) => a.t && (a.t.endTime === Infinity || a.t.endTime > 500))
      .map((a) => `${a.alvo} (${a.t.endTime === Infinity ? "infinita" : Math.round(a.t.endTime) + " ms"})`));
    for (const l of longas) falha(1440, rota, "movimento reduzido", `animação longa rodando: ${l}`);
  }
  await red.close();
}

// ---------------------------------------------------------------- verificações de página (rodam no navegador)
function verificarPagina(fase) {
  const visivel = (e) => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    // checkVisibility: conteúdo de <details> fechado e content-visibility não contam
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05 && (e.checkVisibility?.({ contentVisibilityAuto: true }) ?? true);
  };
  const fora = (e) => e.closest("[data-prototipo-controle], [aria-hidden='true'], svg, canvas, .sr-only, [data-nao-verificar]");
  const out = { rolagem: null, cortados: [], semTitle: [], cobertos: [] };
  // no celular, conteúdo largo faz o navegador encolher a página: innerWidth passa da largura do aparelho
  const sobra = Math.max(document.documentElement.scrollWidth, innerWidth) - screen.width;
  if (sobra > 1) {
    const culpado = [...document.querySelectorAll("body *")].find((e) => e.getBoundingClientRect().right > screen.width + 1 && visivel(e) && !fora(e));
    out.rolagem = `${sobra}px a mais${culpado ? `; ex.: <${culpado.tagName.toLowerCase()} class="${String(culpado.className).slice(0, 60)}">` : ""}`;
  }
  if (fase === "topo") {
    for (const e of document.querySelectorAll("body *")) {
      if (fora(e) || !visivel(e)) continue;
      const cs = getComputedStyle(e);
      if (!["hidden", "clip"].includes(cs.overflowX) || e.scrollWidth <= e.clientWidth + 1 || e.clientWidth < 4) continue;
      if (!["nowrap", "pre"].includes(cs.whiteSpace)) continue;
      const texto = e.innerText?.trim();
      if (!texto) continue;
      // reticências só aparecem se o texto corre em linha (sem filho em bloco ou inline-block cortado no meio)
      const emLinha = [...e.children].every((c) => getComputedStyle(c).display === "inline" || c.matches(".sr-only"));
      if (cs.textOverflow === "ellipsis" && emLinha) {
        if (!e.title && !e.closest("[title]")) out.semTitle.push(texto.slice(0, 60));
      } else out.cortados.push(texto.slice(0, 60));
    }
  }
  // fixo ou grudado cobrindo conteúdo: no topo da rolagem olha a metade de cima; no fim, a de baixo
  // (no meio da rolagem, conteúdo passar por baixo de barra fixa é normal)
  const main = document.querySelector("main") || document.body;
  const fixoDe = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const p = getComputedStyle(x).position; if (p === "fixed" || p === "sticky") return x; } return null; };
  for (const alvo of main.querySelectorAll("a, button, input, select, textarea, h1, h2, h3, p, td, dd, dt, li")) {
    if (fora(alvo) || !visivel(alvo)) continue;
    const r = alvo.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + Math.min(r.height / 2, 12);
    if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
    if (fase === "fim" ? cy < innerHeight / 2 : cy > innerHeight / 2) continue;
    const topo = document.elementFromPoint(cx, cy);
    if (!topo || alvo.contains(topo) || topo.contains(alvo)) continue;
    const f = fixoDe(topo);
    if (f && !f.contains(alvo) && !fixoDe(alvo)?.contains(f) && !fora(f)) {
      out.cobertos.push(`"${(alvo.innerText || alvo.getAttribute("aria-label") || alvo.tagName).trim().slice(0, 40)}" sob <${f.tagName.toLowerCase()} class="${String(f.className).slice(0, 50)}">`);
    }
  }
  // Detectores levados do auditor do MIFT UI (ferramentas/auditor/detectores.js), adaptados aos seletores do starter.
  out.extras = [];
  if (fase === "topo") {
    // §3 rótulo quebrado: o mesmo trecho de texto de um controle ocupando mais de uma linha
    for (const el of document.querySelectorAll("button, [role=button], [role=tab], [role=radio], [role=switch], [role=checkbox], [role=menuitem], [data-slot=badge], label, th")) {
      if (fora(el) || !visivel(el)) continue;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const t = n.textContent.trim();
        if (t.length < 3 || !t.includes(" ") || n.parentElement.closest(".sr-only")) continue;
        if (t.length > 32 && el.matches("label, [role=checkbox], [role=radio]")) continue;
        const rg = document.createRange();
        rg.selectNodeContents(n);
        const linhas = new Set([...rg.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
        if (linhas.size > 1) { out.extras.push(["rótulo quebrado", `"${t.slice(0, 40)}" em ${linhas.size} linhas`]); break; }
      }
    }
    // §6c card órfão: grade de cards cuja última linha tem 1 card e a primeira 3 ou mais
    for (const el of document.querySelectorAll("main *")) {
      if (fora(el) || el.children.length < 3 || !/grid/.test(getComputedStyle(el).display)) continue;
      const itens = [...el.children].filter((c) => visivel(c) && (c.matches("[data-slot=card]") || c.querySelector(":scope > [data-slot=card], :scope > a > [data-slot=card]")));
      if (itens.length < 3) continue;
      const largura = el.getBoundingClientRect().width, linhas = new Map();
      for (const c of itens) {
        const r = c.getBoundingClientRect();
        if (r.width > largura * 0.9) continue; // card de largura toda ocupa a linha de propósito
        linhas.set(Math.round(r.top), (linhas.get(Math.round(r.top)) ?? 0) + 1);
      }
      const n = [...linhas.values()];
      if (n.length > 1 && n[0] >= 3 && n.at(-1) === 1) out.extras.push(["card órfão", `${n.join(" + ")} cards por linha`]);
    }
    // Alturas diferentes na mesma linha do grid (tolerância de 2 px): cards lado a lado com a base desalinhada (degrau).
    // Item de grid que ocupa várias linhas é comparado pela soma; cards empilhados contam pela célula.
    for (const el of document.querySelectorAll("main *")) {
      if (fora(el) || !/grid/.test(getComputedStyle(el).display) || el.children.length < 2) continue;
      // coluna lateral presa (sticky, align-self: start) não é card da linha: fica de fora
      const celulas = [...el.children].filter((c) => visivel(c) && (c.matches(".sup") || c.querySelector(".sup")) && !["start", "flex-start"].includes(getComputedStyle(c).alignSelf) && getComputedStyle(c).position !== "sticky");
      if (celulas.length < 2) continue;
      const linhas = new Map();
      for (const c of celulas) {
        const r = c.getBoundingClientRect(), sup = c.matches(".sup") ? c : c.querySelector(".sup") || c;
        const rs = sup.getBoundingClientRect();
        const k = Math.round(r.top);
        if (!linhas.has(k)) linhas.set(k, []);
        linhas.get(k).push({ base: Math.round(rs.bottom), celula: Math.round(r.bottom), nome: (sup.querySelector("h2, h3, [data-slot=card-title]")?.textContent || "").trim().slice(0, 24) });
      }
      for (const [, l] of linhas) {
        if (l.length < 2) continue;
        // só compara quem termina na mesma célula de grid (spans diferentes terminam em linhas diferentes)
        const porCelula = new Map();
        for (const x of l) { const k = x.celula; porCelula.set(k, [...(porCelula.get(k) ?? []), x]); }
        const bases = l.map((x) => x.base), alvo = Math.max(...l.map((x) => x.celula));
        const curtos = l.filter((x) => x.celula === alvo && alvo - x.base > 2);
        if (curtos.length) out.extras.push(["altura diferente na linha", `${curtos.map((x) => `"${x.nome}" ${alvo - x.base}px acima`).join(", ")} (bases ${[...new Set(bases)].join("/")})`]);
      }
    }
    // Card sem o gradiente do sistema: superfície (card ou destaque) com fundo chapado.
    for (const card of document.querySelectorAll("main .sup:not([data-nivel=casca]):not([data-nivel=fundo])")) {
      if (fora(card) || !visivel(card)) continue;
      if (!/gradient/.test(getComputedStyle(card).backgroundImage)) out.extras.push(["card sem gradiente", `"${(card.querySelector("h2, h3")?.textContent || card.getAttribute("aria-label") || "").trim().slice(0, 30)}" com fundo chapado`]);
    }
    // Moldura dupla: card dentro de card (uma superfície, um canvas ou um bloco com raio e borda próprios ocupando quase
    // todo o card de fora). Ou é um, ou é outro.
    for (const card of document.querySelectorAll("main .sup")) {
      if (fora(card) || !visivel(card)) continue;
      const rc = card.getBoundingClientRect();
      if (rc.width < 120 || rc.height < 120) continue;
      for (const filho of card.querySelectorAll(".sup, canvas, [data-peak-chart]")) {
        if (!visivel(filho) || filho.closest("[data-nao-verificar]")) continue;
        const rf = filho.getBoundingClientRect();
        const cs = getComputedStyle(filho);
        const moldura = filho.matches(".sup, [data-peak-chart]") || parseFloat(cs.borderRadius) > 4;
        if (moldura && (rf.width * rf.height) / (rc.width * rc.height) > 0.6) {
          out.extras.push(["moldura dupla", `"${(card.querySelector("h2, h3")?.textContent || card.getAttribute("aria-label") || "").trim().slice(0, 30)}" tem ${filho.tagName.toLowerCase()} com moldura própria dentro`]);
          break;
        }
      }
    }
    // Card partido: card translúcido que cobre só em parte um fundo muito diferente (o banner escuro atrás do título e o
    // fundo claro embaixo). Mede o alfa do fundo do card e a fração dele que fica sobre um banner.
    for (const card of document.querySelectorAll("main .sup")) {
      if (fora(card) || !visivel(card)) continue;
      const m = getComputedStyle(card).backgroundColor.match(/rgba?\(([^)]+)\)/);
      const alfa = m ? Number(m[1].split(/[ ,/]+/).filter(Boolean)[3] ?? 1) : 1;
      if (alfa >= 0.95) continue;
      const rc = card.getBoundingClientRect();
      for (const ban of document.querySelectorAll("[data-slot=banner-sobreposto] > div:first-child")) {
        const rb = ban.getBoundingClientRect();
        const sob = Math.max(0, Math.min(rc.bottom, rb.bottom) - Math.max(rc.top, rb.top));
        if (sob > 8 && sob < rc.height - 8 && rc.left < rb.right && rc.right > rb.left)
          out.extras.push(["card partido", `"${(card.querySelector("h2, h3")?.textContent || "").trim().slice(0, 30)}" translúcido (alfa ${alfa.toFixed(2)}) com ${Math.round(sob)} px sobre o banner`]);
      }
    }
    // Cor de dados fora do acento: --chart-1 com matiz longe do --primary (os gráficos ficavam azuis num preset verde).
    {
      const cor = (v) => { const sd = document.createElement("span"); sd.style.color = `var(${v})`; document.body.appendChild(sd); const c = getComputedStyle(sd).color; sd.remove();
        const cv = document.createElement("canvas").getContext("2d"); cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const [r, g, b] = cv.getImageData(0, 0, 1, 1).data.map((x) => x / 255);
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
        if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return { h: (h * 60 + 360) % 360, s: d / (1 - Math.abs(mx + mn - 1) || 1) }; };
      const a1 = cor("--chart-1"), pr = cor("--primary");
      const dif = Math.min(Math.abs(a1.h - pr.h), 360 - Math.abs(a1.h - pr.h));
      if (a1.s > 0.2 && pr.s > 0.2 && dif > 65) out.extras.push(["cor de dados fora do acento", `--chart-1 a ${Math.round(dif)}° do --primary (preset ${document.documentElement.dataset.preset}, destaque ${document.documentElement.dataset.destaque})`]);
    }
    // Rótulos de eixo colidindo: dois rótulos do mesmo eixo de gráfico com caixas sobrepostas ou a menos de 4 px.
    for (const eixo of document.querySelectorAll("[data-eixo], .recharts-cartesian-axis-ticks, svg g[class*='axis']")) {
      const rotulos = [...eixo.querySelectorAll("span, text")].filter((e) => e.textContent.trim() && e.getBoundingClientRect().width > 0);
      const caixas = rotulos.map((e) => ({ t: e.textContent.trim(), r: e.getBoundingClientRect() })).sort((x, y) => x.r.left - y.r.left);
      for (let i = 1; i < caixas.length; i++) {
        const a = caixas[i - 1], b = caixas[i];
        if (Math.abs(a.r.top - b.r.top) < a.r.height && b.r.left < a.r.right + 4) { out.extras.push(["rótulos de eixo colidindo", `"${a.t}" e "${b.t}"`]); break; }
      }
    }
    // NAV-42, nada solto: texto, número, botão ou ícone dentro do <main> fora de qualquer superfície ou grupo (Superficie,
    // banner, cabeçalho fixo, formulário, diálogo, tabela, lista, figura ou [data-grupo]).
    // o site público (html[data-site]) segue as regras de site da design-taste-frontend (o gate dela confere), não as do painel
    const noSite = document.documentElement.hasAttribute("data-site");
    const grupo = "section:has(> h2, > h3, > header), [data-slot=superficie], .sup, [data-slot=banner-sobreposto], [data-barra-ferramentas], .casca-fixa, form, [role=dialog], table, ul, ol, dl, figure, nav, header, [data-grupo], [data-estado-tela=vazio], [data-estado-tela=erro], [role=status], [role=alert], .faixa-marca";
    for (const el of (document.querySelector("main") || document.body).querySelectorAll("p, span, a, button, h1, h2, h3, svg")) {
      if (noSite || fora(el) || !visivel(el) || el.closest(grupo)) continue;
      const t = (el.innerText || el.getAttribute("aria-label") || "").trim();
      if (!t && el.tagName !== "svg") continue;
      out.extras.push(["elemento solto", `<${el.tagName.toLowerCase()}> "${t.slice(0, 40)}" fora de superfície ou grupo`]);
    }
    // TOK-45, quebra ruim: "R$" numa linha e o valor na outra; botão, selo ou item de navegação em 2 linhas; palavra
    // sozinha na última linha de um título.
    for (const el of document.querySelectorAll("main *")) {
      if (fora(el) || !visivel(el) || el.children.length) continue;
      const t = el.textContent.trim();
      if (!/R\$\s?\d/.test(t)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const linhas = new Set([...rg.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      if (linhas.size > 1 && /^R\$\s?[\d.,]+(\s?(mil|mi|bi))?$/.test(t)) out.extras.push(["quebra ruim", `"${t}" quebrou entre o símbolo e o valor`]);
    }
    // controle (botão, selo, aba, item de navegação) com o próprio texto em 2 linhas; cartão clicável (com bloco dentro)
    // não é controle e fica de fora. Só os nós de texto contam (camadas decorativas do botão, não).
    for (const el of document.querySelectorAll("button, [data-slot=badge], nav a, [role=tab]")) {
      if (fora(el) || !visivel(el)) continue;
      if ([...el.querySelectorAll("*")].some((c) => ["block", "grid", "flex"].includes(getComputedStyle(c).display) && c.textContent.trim())) continue;
      // linhas = faixas verticais que não se sobrepõem (textos de tamanhos diferentes na mesma linha contam como uma)
      const linhas = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest("[aria-hidden=true], .sr-only")) continue;
        const rg = document.createRange();
        rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) {
          if (r.width <= 1) continue;
          const l = linhas.find((x) => r.top < x.b - 2 && r.bottom > x.t + 2);
          if (l) { l.t = Math.min(l.t, r.top); l.b = Math.max(l.b, r.bottom); } else linhas.push({ t: r.top, b: r.bottom });
        }
      }
      if (linhas.length > 1) out.extras.push(["quebra ruim", `"${el.innerText.trim().slice(0, 30)}" em 2 linhas (controle ou selo)`]);
    }
    for (const h of document.querySelectorAll("main h1, main h2, main h3")) {
      if (fora(h) || !visivel(h)) continue;
      const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), palavras = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const re = /\S+/g; let m;
        while ((m = re.exec(n.textContent))) { const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const r = rg.getBoundingClientRect(); if (r.width) palavras.push(Math.round(r.top)); }
      }
      const linhas = [...new Set(palavras)];
      if (!noSite && linhas.length > 1 && palavras.filter((t) => t === linhas.at(-1)).length === 1) out.extras.push(["quebra ruim", `título "${h.textContent.trim().slice(0, 40)}" com uma palavra sozinha na última linha`]);
    }
    // §2 rolagem dupla: uma área com rolagem vertical própria numa página que também rola
    if (document.documentElement.scrollHeight > innerHeight + 2) {
      for (const el of document.querySelectorAll("body *")) {
        if (fora(el) || !visivel(el) || el.closest("[role=dialog], [role=menu], [role=listbox], [data-rolagem-permitida], [data-radix-popper-content-wrapper]")) continue;
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 40)
          out.extras.push(["rolagem dupla", `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 50)}"> rola ${el.scrollHeight}px em ${el.clientHeight}px`]);
      }
    }
    // §6 alvo de toque pequeno (só no celular): regra da casa, 40 px no menor lado
    if (screen.width < 768) {
      for (const el of document.querySelectorAll("button, a[href], [role=button], [role=tab], [role=checkbox], [role=radio], input, select, textarea")) {
        // a chave e o controle deslizante são tocados pelo rótulo e pelo polegar, não pelo input escondido
        if (fora(el) || !visivel(el) || el.closest("[role=switch], [data-slot=slider], [data-slot=switch]") || el.matches("[role=switch]")) continue;
        // alvo estendido: o card inteiro é clicável; campo dentro de rótulo conta pelo rótulo
        const caixa = el.closest("[data-alvo-estendido]") || (el.matches("input") && el.closest("label")) || el;
        const r = caixa.getBoundingClientRect();
        // link dentro de frase: a WCAG 2.2 (2.5.8) isenta alvo em texto corrido
        const emFrase = el.matches("a") && getComputedStyle(el).display === "inline" && (el.parentElement?.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 3;
        // 1×1 px: link "Pular para o conteúdo" escondido até receber foco (sr-only com outro nome de classe)
        if (r.width <= 1 && r.height <= 1) continue;
        if (Math.min(r.width, r.height) < 40 && !emFrase)
          out.extras.push(["alvo de toque pequeno", `${Math.round(r.width)}×${Math.round(r.height)}px "${(el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 30)}"`]);
      }
    }
  }
  out.extras = [...new Map(out.extras.map((x) => [x.join("|"), x])).values()].slice(0, 16);
  out.cobertos = [...new Set(out.cobertos)].slice(0, 5);
  out.cortados = [...new Set(out.cortados)].slice(0, 8);
  out.semTitle = [...new Set(out.semTitle)].slice(0, 8);
  return out;
}

// marca o DOM para saber se um clique teve efeito
const instalarObservador = () => {
  window.__mut = 0;
  window.__obs?.disconnect();
  window.__obs = new MutationObserver((l) => { window.__mut += l.length; });
  window.__obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
};

const SELETOR_NAV = "header button, nav button, aside button, [data-barra-ferramentas] button";

// ---------------------------------------------------------------- por largura
for (const largura of LARGURAS) {
  const ctx = await browser.newContext({
    viewport: { width: largura, height: ALTURA[largura] ?? 900 },
    isMobile: largura < 768, hasTouch: largura < 768,
  });
  await semAbertura(ctx);
  let page, rotaAtual = "";
  const abrirPagina = async () => {
    page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") falha(largura, rotaAtual, "erro de console", m.text().slice(0, 200)); });
    page.on("pageerror", (e) => falha(largura, rotaAtual, "erro de página", e.message.slice(0, 200)));
  };
  await abrirPagina();
  // Numa varredura longa o Chrome às vezes derruba a aba ("Page crashed"): abre outra e tenta a rota de novo, uma vez.
  const ir = async (url) => {
    try { return await page.goto(url); }
    catch (e) {
      if (!/crash|closed/i.test(e.message)) throw e;
      aviso(largura, rotaAtual, "aba reaberta", e.message.slice(0, 80));
      await page.close().catch(() => {});
      await abrirPagina();
      return page.goto(url);
    }
  };

  const fila = rotasDasPaginas().filter(naRota);
  const vistas = new Set();
  const comEstados = new Set(); // telas com <ComDados> (marcam data-estado-tela)
  const links = new Map(); // chave (rota + nomes dos parâmetros) → { href, origem }
  while (fila.length) {
    const rota = fila.shift();
    if (vistas.has(rota)) continue;
    vistas.add(rota);
    rotaAtual = rota;
    const resp = await ir(BASE + rota);
    if (!resp || resp.status() >= 400) { falha(largura, rota, "404", `a rota respondeu ${resp?.status()}`); continue; }
    await esperarPagina(page);

    if (await page.$("[data-estado-tela]")) comEstados.add(rota);
    const r1 = await page.evaluate(verificarPagina, "topo");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
    const r2 = await page.evaluate(verificarPagina, "fim");
    await page.evaluate(() => window.scrollTo(0, 0));
    if (r1.rolagem || r2.rolagem) falha(largura, rota, "rolagem horizontal", r1.rolagem || r2.rolagem);
    for (const t of r1.cortados) falha(largura, rota, "texto cortado sem reticências", t);
    for (const t of r1.semTitle) aviso(largura, rota, "reticências sem title", t);
    for (const c of new Set([...r1.cobertos, ...r2.cobertos])) falha(largura, rota, "fixo cobrindo conteúdo", c);
    for (const [tipo, detalhe] of r1.extras) falha(largura, rota, tipo, detalhe);

    const hrefs = await page.$$eval("a", (as) => as
      // [data-nao-verificar]: demos e templates do autor no /arsenal (links "#" de exemplo são deles)
      .filter((a) => !a.closest("[data-prototipo-controle], [data-nao-verificar]") && a.getBoundingClientRect().width > 0)
      .map((a) => ({ href: a.getAttribute("href"), abs: a.href, texto: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 40) })));
    for (const h of hrefs) {
      if (h.href === null || h.href === "" || h.href === "#" || h.href.startsWith("javascript:")) { falha(largura, rota, "beco sem saída", `link "${h.texto}" sem destino (href="${h.href}")`); continue; }
      if (h.href.startsWith("#")) continue; // âncora na mesma página (ex.: pular para o conteúdo)
      const destino = rotaDe(h.abs);
      if (destino === null) continue; // link externo
      const u = new URL(h.abs);
      const chave = destino + "?" + [...u.searchParams.keys()].sort().join("&");
      if (!links.has(chave)) links.set(chave, { href: h.href, abs: h.abs, origem: rota, texto: h.texto });
      if (!vistas.has(destino) && naRota(destino)) fila.push(destino);
    }
  }

  // links: o destino responde e o clique leva até ele
  for (const { href, abs, origem, texto } of links.values()) {
    const st = (await page.request.get(abs).catch(() => null))?.status() ?? 0;
    if (st >= 400 || st === 0) { falha(largura, origem, "link morto", `"${texto}" → ${href} (${st})`); continue; }
    rotaAtual = origem;
    await ir(BASE + origem);
    await esperarPagina(page, 200);
    const alvo = page.locator(`a[href="${href}"]:visible`).first();
    if (!(await alvo.count())) continue;
    const antes = page.url();
    if (new URL(abs).href === new URL(antes).href) continue;
    const esperado = new URL(abs);
    const chegou = (u) => u.pathname === esperado.pathname && u.search === esperado.search;
    // espera a navegação (ClientRouter ou recarga) chegar ao destino, não um tempo fixo: com a máquina ocupada
    // (vários agentes rodando ao mesmo tempo) a troca pode passar de 1 s sem defeito nenhum
    await Promise.all([
      page.waitForURL(chegou, { timeout: 10000, waitUntil: "commit" }).catch(() => {}),
      alvo.click({ timeout: 5000 }).catch(() => {}),
    ]);
    const depois = new URL(page.url());
    if (!chegou(depois))
      falha(largura, origem, "link sem efeito", `"${texto}" → ${href} parou em ${depois.pathname}${depois.search}`);
  }

  // botões de navegação: cada clique precisa mudar alguma coisa
  if (!args.rapido) {
    // as páginas de item do /arsenal repetem a mesma moldura: os botões dela já foram testados nas outras rotas
    for (const rota of [...vistas].filter((r) => !/^arsenal\/.+/.test(r))) {
      rotaAtual = rota;
      await ir(BASE + rota);
      await esperarPagina(page, 200);
      const n = await page.locator(SELETOR_NAV).count();
      for (let i = 0; i < n; i++) {
        if (i > 0) { await ir(BASE + rota); await esperarPagina(page, 200); }
        const b = page.locator(SELETOR_NAV).nth(i);
        if (!(await b.isVisible()) || (await b.isDisabled())) continue;
        // já selecionado (aba ativa, vista atual): clicar de novo não muda nada, e está certo
        if (await b.evaluate((e) => ["aria-pressed", "aria-selected", "aria-checked"].some((k) => e.getAttribute(k) === "true") || e.getAttribute("data-state") === "active")) continue;
        const nome = ((await b.getAttribute("aria-label")) || (await b.innerText())).trim().slice(0, 40);
        await page.evaluate(instalarObservador);
        const antes = page.url();
        const erroClique = await b.click({ timeout: 3000 }).then(() => null, (e) => e.message.split("\n")[0]);
        if (erroClique) { falha(largura, rota, "botão sem efeito", `"${nome}" não recebe o clique: ${erroClique.slice(0, 120)}`); continue; }
        await page.waitForTimeout(600);
        const efeito = page.url() !== antes || (await page.evaluate(() => window.__mut).catch(() => 1)) > 0;
        if (!efeito) falha(largura, rota, "botão sem efeito", `"${nome}"`);
        await page.keyboard.press("Escape").catch(() => {});
      }
    }
  }
  // estados de cada tela (padrão ?estado= do MIFT UI, jornada genérica): o estado pedido aparece de verdade,
  // sem erro, e "Tentar de novo" no erro volta aos dados
  for (const rota of comEstados) {
    rotaAtual = rota;
    for (const estado of ["carregando", "vazio", "erro"]) {
      await ir(`${BASE}${rota}?estado=${estado}`);
      await esperarPagina(page, 300);
      // o estado da URL vale depois da hidratação: com a máquina ocupada, espera ele aparecer (até 6 s) antes de julgar
      await page.waitForFunction((e) => document.querySelector("[data-estado-tela]")?.dataset.estadoTela === e, estado, { timeout: 6000 }).catch(() => {});
      const visto = await page.$eval("[data-estado-tela]", (e) => e.dataset.estadoTela).catch(() => null);
      if (visto !== estado) { falha(largura, rota, "estado", `?estado=${estado} mostrou "${visto}"`); continue; }
      const r = await page.evaluate(verificarPagina, "topo");
      if (r.rolagem) falha(largura, rota, `rolagem horizontal [${estado}]`, r.rolagem);
      for (const t of r.cortados) falha(largura, rota, `texto cortado sem reticências [${estado}]`, t);
      if (estado === "erro") {
        await page.getByRole("button", { name: "Tentar de novo" }).first().click().catch(() => {});
        await page.waitForTimeout(400);
        const depois = await page.$eval("[data-estado-tela]", (e) => e.dataset.estadoTela).catch(() => null);
        if (depois !== "dados") falha(largura, rota, "estado", `"Tentar de novo" no erro levou a "${depois}"`);
      }
    }
  }

  // as outras 3 combinações de tema e vidro: as mesmas rotas, só as verificações de página
  for (const [tema, vidro] of [["claro", "1"], ["escuro", "0"], ["escuro", "1"]]) {
    for (const rota of vistas) {
      rotaAtual = rota;
      const resp = await ir(`${BASE}${rota}?tema=${tema}&vidro=${vidro}`);
      if (!resp || resp.status() >= 400) continue;
      await esperarPagina(page, 300);
      const combo = `[${tema}${vidro === "1" ? " + vidro" : ""}]`;
      const r = await page.evaluate(verificarPagina, "topo");
      if (r.rolagem) falha(largura, rota, `rolagem horizontal ${combo}`, r.rolagem);
      for (const t of r.cortados) falha(largura, rota, `texto cortado sem reticências ${combo}`, t);
    }
  }
  // cabeçalho fixo da tabela (TabelaDados, a partir de 1280 px): rola a lista e compara os pixels do cabeçalho e do
  // vão entre a barra de cima e ele em duas posições de rolagem. Se mudaram, o conteúdo está aparecendo por trás
  // (texto sobre texto) ou o cabeçalho não grudou logo abaixo da barra.
  if (largura >= 1280 && vistas.has("pedidos/")) {
    rotaAtual = "pedidos/";
    for (const [tema, vidro] of [["escuro", "1"], ["claro", "0"]]) {
      await ir(`${BASE}pedidos/?tema=${tema}&vidro=${vidro}`);
      await esperarPagina(page, 300);
      const combo = `[${tema}${vidro === "1" ? " + vidro" : ""}]`;
      const regiao = async () => page.evaluate(() => {
        const th = document.querySelector("[data-tabela-dados] thead");
        const topo = document.querySelector("header.casca-fixa");
        if (!th || !topo) return null;
        const t = th.getBoundingClientRect(), b = topo.getBoundingClientRect();
        // do pé da barra superior até o pé do cabeçalho da tabela: o vão (faixa recolhida do banner) e o cabeçalho
        return { x: Math.round(t.left), y: Math.round(b.bottom), w: Math.round(t.width), h: Math.round(t.bottom - b.bottom), topoTh: t.top, esperado: b.bottom };
      });
      const tirar = async (r) => (await page.screenshot({ clip: { x: r.x, y: r.y, width: r.w, height: r.h } })).toString("base64");
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(500);
      const r1 = await regiao();
      if (!r1) { falha(largura, "pedidos/", "cabeçalho fixo", `tabela sem cabeçalho ${combo}`); continue; }
      const a1 = await tirar(r1);
      await page.evaluate(() => window.scrollBy(0, 230));
      await page.waitForTimeout(500);
      const r2 = await regiao();
      if (Math.abs(r2.topoTh - r1.topoTh) > 1) { falha(largura, "pedidos/", "cabeçalho fixo", `o cabeçalho da tabela não ficou parado ao rolar ${combo} (${Math.round(r1.topoTh)} → ${Math.round(r2.topoTh)} px)`); continue; }
      const a2 = await tirar(r1);
      const dif = await page.evaluate(async ([x, y]) => {
        const ler = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => { const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const g = c.getContext("2d"); g.drawImage(i, 0, 0); ok(g.getImageData(0, 0, i.width, i.height).data); }; i.src = "data:image/png;base64," + b64; });
        const [p, q] = await Promise.all([ler(x), ler(y)]);
        let ruins = 0;
        for (let k = 0; k < p.length; k += 4) if (Math.abs(p[k] - q[k]) + Math.abs(p[k + 1] - q[k + 1]) + Math.abs(p[k + 2] - q[k + 2]) > 48) ruins++;
        return ruins / (p.length / 4);
      }, [a1, a2]);
      // até 0,5 % de pixels diferentes: o desfoque do vidro muda um pouco de tom com o que passa atrás, o texto não
      if (dif > 0.005) falha(largura, "pedidos/", "cabeçalho fixo", `o cabeçalho ou o vão abaixo da barra mudou ao rolar ${combo}: ${(dif * 100).toFixed(1)} % dos pixels (o conteúdo aparece por trás)`);
    }
  }
  console.log(`  ${largura} px: ${vistas.size} rotas, ${links.size} tipos de link, ${comEstados.size} telas × 3 estados, 4 combinações de tema`);
  await ctx.close();
}

await browser.close();
parar();

for (const a of avisos) console.log(`  aviso  ${a.largura}px ${a.rota}  ${a.tipo}: ${a.detalhe}`);
if (problemas.length) {
  console.log(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.log(`  ✗ ${p.largura}px ${p.rota}  ${p.tipo}: ${p.detalhe}`);
  process.exit(1);
}
console.log("\nTudo certo: nenhum beco sem saída, erro, rolagem horizontal, corte sem reticências ou fixo cobrindo conteúdo.");
