// Quadro de fluxos (PRO-11): percorre os fluxos do protótipo no Chrome da máquina, captura cada passo e guarda o
// retângulo do elemento tocado, para a rota /fluxos desenhar a seta saindo dele. Saída: public/quadro/ (JPEGs + quadro.json).
// Uso: node scripts/quadro.mjs [url] [--preset noite] [--tema escuro] [--vidro 1]
// Sem URL, sobe o `astro preview` (gera o build se faltar). Rode de novo depois de mudar uma tela.
// Cada fluxo declara o módulo (o id em src/modulos/<id>/ ou um caminho da navegação dele): a /fluxos agrupa por módulo,
// na ordem do registro.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, abrirNavegador, argumentos, esperarPagina, semAbertura, subirServidor } from "./_comum.mjs";

const a = argumentos();
const saida = join(RAIZ, "public", "quadro");
mkdirSync(saida, { recursive: true });
const { url: BASE, parar } = await subirServidor(a._[0] || process.env.URL);
const browser = await abrirNavegador();
const q = new URLSearchParams({ preset: String(a.preset || "noite"), tema: String(a.tema || "escuro"), vidro: String(a.vidro ?? "1") });
const D = { width: 1366, height: 768 }, M = { width: 390, height: 844 };
const fluxos = [];

async function fluxo(id, modulo, ponta, rota, vp, passos) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
  await semAbertura(ctx);
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${BASE}${rota}${rota.includes("?") ? "&" : "?"}${q}`);
  await esperarPagina(page, 2200);
  const telas = [];
  for (let i = 0; i < passos.length; i++) {
    const p = passos[i];
    if (p.antes) { await p.antes(page); await page.waitForTimeout(300); }
    let rect = null;
    if (p.alvo) {
      const l = p.alvo(page).first();
      await l.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      rect = await l.boundingBox();
    }
    const arquivo = `${id}-${i + 1}.jpg`;
    await page.screenshot({ path: join(saida, arquivo), type: "jpeg", quality: 82 });
    telas.push({ arquivo, legenda: p.legenda, rect, ramo: !!p.ramo, w: vp.width, h: vp.height });
    if (p.alvo) { await p.alvo(page).first().click(); await page.waitForTimeout(p.espera ?? 900); }
  }
  fluxos.push({ id, modulo, ponta, telas });
  await ctx.close();
  console.log("  " + ponta);
}

await fluxo("inicio", "inicio", "Operador · do início à OS atrasada", "", D, [
  // OS-1011 (semente fixa): atrasada e com passo direto; a primeira da lista (OS-1012) espera peça e não tem "Mover para"
  { legenda: "1. Visão geral: o banner resume o dia; toca numa OS atrasada da atenção do dia", alvo: (p) => p.locator("section[aria-label='Atenção do dia'] a[href*='id=OS-1011']"), espera: 2500 },
  { legenda: "2. Pedidos abre com a OS na folha lateral; toca no próximo passo", alvo: (p) => p.getByRole("dialog").getByRole("button", { name: /Mover para/ }), espera: 1400 },
  { legenda: "3. A etapa avança e a folha oferece Desfazer" },
]);
await fluxo("pedidos", "pedidos", "Operador · filtrar e abrir uma OS", "pedidos/", D, [
  { legenda: "1. Busca “split” na barra de filtros de vidro", antes: (p) => p.getByLabel("Buscar OS").fill("split"), alvo: (p) => p.locator("tbody tr").locator("a").first() },
  { legenda: "2. A OS abre na folha: eixos, o que o cliente lê, itens e linha do tempo" },
]);
await fluxo("quadro", "pedidos", "Operador · o quadro de OS", "pedidos/?vista=quadro", D, [
  { legenda: "1. Quadro de OS: arrastar com mouse, toque ou teclado; soltar em Aguardando cliente ou Prontas abre a sheet da ação (pessimista)" },
]);
await fluxo("novo", "pedidos/novo/", "Operador · criar uma OS", "pedidos/novo/", D, [
  { legenda: "1. Preenche o essencial; o resumo ao lado acompanha", antes: async (p) => {
      await p.locator("#titulo").fill("Split da sala não gela");
      await p.locator("#cliente").click(); await p.waitForTimeout(300); await p.getByRole("option").first().click();
    }, alvo: (p) => p.getByRole("button", { name: "Criar OS" }), espera: 2000 },
  { legenda: "2. Depois da resposta (pessimista), a OS entra na lista e abre na folha" },
]);
await fluxo("novo-erro", "pedidos/novo/", "Ramo · criar sem os campos obrigatórios", "pedidos/novo/", D, [
  { legenda: "1. Toca em Criar OS com o formulário vazio", alvo: (p) => p.getByRole("button", { name: "Criar OS" }), espera: 600, ramo: true },
  { legenda: "2. Cada campo diz o que falta; o foco vai para o primeiro", ramo: true },
]);
await fluxo("agenda", "agenda", "Operador · a agenda do dia por recurso", "agenda/", D, [
  { legenda: "1. Dia por recurso com a linha do agora e o conflito AG-3315 × AG-3316 destacado" },
]);
await fluxo("clientes", "clientes", "Operador · editar um cliente", "clientes/", D, [
  { legenda: "1. Escolhe o cliente na lista", alvo: (p) => p.getByRole("list", { name: "Clientes" }).getByRole("link").first() },
  { legenda: "2. O detalhe mostra a identidade e o resumo; toca em Editar", alvo: (p) => p.getByRole("button", { name: "Editar" }), espera: 700 },
  { legenda: "3. Diálogo de edição em vidro flutuante" },
]);
await fluxo("celular", "pedidos", "Celular · ver uma OS", "", M, [
  { legenda: "1. Início no celular; toca em Pedidos na ilha de abas", alvo: (p) => p.getByRole("navigation", { name: "Navegação principal" }).last().getByRole("link", { name: "Pedidos" }), espera: 1400 },
  { legenda: "2. Lista em cartões; toca na primeira atrasada", antes: (p) => p.getByRole("switch", { name: "Só atrasadas" }).press("Space") /* pelo teclado: no celular a barra fixa cobria o clique */, alvo: (p) => p.locator("[data-alvo-estendido]").first(), espera: 1200 },
  { legenda: "3. Detalhe em folha inferior com a ação principal" },
]);
await fluxo("celular-vazio", "pedidos", "Ramo · filtro sem resultado no celular", "pedidos/", M, [
  { legenda: "1. Busca um termo que não existe", antes: (p) => p.getByLabel("Buscar OS").fill("zzz"), alvo: (p) => p.getByRole("button", { name: "Limpar filtros" }).last(), espera: 700, ramo: true },
  { legenda: "2. Limpar filtros devolve a lista", ramo: true },
]);

writeFileSync(join(saida, "quadro.json"), JSON.stringify({ geradoEm: new Date().toISOString(), aparencia: Object.fromEntries(q), fluxos }, null, 1));
await browser.close();
parar();
console.log(`ok: ${fluxos.length} fluxos em public/quadro/`);
