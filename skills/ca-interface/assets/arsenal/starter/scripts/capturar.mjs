// Poucas capturas sob demanda: rota × largura × tema. Saída em capturas/<rota>-<largura>-<tema>.png
// Uso: node scripts/capturar.mjs [url] --rotas ",pedidos/" --larguras 1440,390 --temas claro,claro+vidro,escuro,escuro+vidro
//      [--preset noturno] [--estado vazio] [--inteira] [--abertura] [--espera 1200] [--saida capturas]
// Padrão: só a visão geral, 1440 px, tema claro. A barra F nunca entra na captura.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, abrirNavegador, argumentos, esperarPagina, semAbertura, subirServidor } from "./_comum.mjs";

const a = argumentos();
const rotas = String(typeof a.rotas === "string" ? a.rotas : "").split(",");
const larguras = String(a.larguras || "1440").split(",").map(Number);
const temas = String(a.temas || "claro").split(",");
const saida = join(RAIZ, String(a.saida || "capturas"));
mkdirSync(saida, { recursive: true });

const { url: BASE, parar } = await subirServidor(a._[0] || process.env.URL);
const browser = await abrirNavegador();
for (const largura of larguras) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: largura < 768 ? 844 : 900 }, isMobile: largura < 768, hasTouch: largura < 768 });
  if (!a.abertura) await semAbertura(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  erro de página:", e.message));
  for (const rota of rotas) {
    for (const tema of temas) {
      const [t, v] = tema.split("+");
      const q = new URLSearchParams({ tema: t, vidro: v === "vidro" ? "1" : "0" });
      if (a.preset) q.set("preset", a.preset);
      if (a.estado) q.set("estado", a.estado);
      await page.goto(`${BASE}${rota}${rota.includes("?") ? "&" : "?"}${q}`);
      await esperarPagina(page, Number(a.espera || 1200));
      const nome = `${(rota.replace(/\?.*$/, "").replace(/\/$/, "").replace(/\//g, "-") || "inicio")}-${largura}-${tema.replace("+", "-")}${a.preset ? "-" + a.preset : ""}${a.estado ? "-" + a.estado : ""}.png`;
      await page.screenshot({ path: join(saida, nome), fullPage: !!a.inteira });
      console.log("  " + join(String(a.saida || "capturas"), nome));
    }
  }
  await ctx.close();
}
await browser.close();
parar();
