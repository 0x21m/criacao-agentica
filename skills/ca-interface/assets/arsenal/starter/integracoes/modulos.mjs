// Rotas dos módulos: cada arquivo .astro em src/modulos/<id>/paginas/ vira uma rota, pelo caminho dentro de paginas/
// (src/modulos/pedidos/paginas/pedidos/novo/index.astro → /pedidos/novo/). Assim nenhum módulo edita src/pages nem o
// arquivo de outro. Duas páginas na mesma rota (de módulos diferentes ou de src/pages) param o build com o motivo.
// No dev server, página nova só aparece depois de reiniciar o `npm run dev` (a lista é lida na partida).
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Lista { rota, arquivo, modulo } das páginas dos módulos. Também usada pelos scripts (rotasDasPaginas). */
export function paginasDosModulos(raiz) {
  const dir = join(raiz, "src", "modulos");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const modulo of readdirSync(dir)) {
    const paginas = join(dir, modulo, "paginas");
    if (!existsSync(paginas) || !statSync(paginas).isDirectory()) continue;
    const andar = (d) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) andar(p);
        else if (n.endsWith(".astro")) {
          const r = relative(paginas, p).split(sep).join("/").replace(/\.astro$/, "");
          const rota = r === "index" ? "" : r.replace(/\/?index$/, "") + "/";
          out.push({ rota, arquivo: p, modulo });
        }
      }
    };
    andar(paginas);
  }
  return out.sort((a, b) => a.rota.localeCompare(b.rota));
}

/**
 * A primeira tela do painel: "" (a raiz) quando um módulo tem a página da raiz (o Início); senão, a primeira rota do
 * módulo do operador de menor `ordem` (um starter sem o Início, depois do scripts/modulos.mjs --manter).
 */
export function inicioDoPainel(raiz) {
  const paginas = paginasDosModulos(raiz);
  if (paginas.some((p) => p.rota === "")) return "";
  const ordem = (id) => {
    try {
      const t = readFileSync(join(raiz, "src", "modulos", id, "modulo.ts"), "utf8");
      if (!/ponta:s*["']operador["']/.test(t)) return Infinity;
      return Number(t.match(/ordem:s*(d+)/)?.[1] ?? 999);
    } catch { return Infinity; }
  };
  const ids = [...new Set(paginas.map((p) => p.modulo))].sort((a, b) => ordem(a) - ordem(b));
  return ids.length ? paginas.filter((p) => p.modulo === ids[0]).map((p) => p.rota).sort((a, b) => a.length - b.length)[0] : "";
}

export default function modulos() {
  return {
    name: "modulos-do-starter",
    hooks: {
      "astro:config:setup": ({ config, injectRoute, updateConfig, logger }) => {
        const raiz = fileURLToPath(config.root);
        const vistas = new Map();
        for (const p of paginasDosModulos(raiz)) {
          if (vistas.has(p.rota)) throw new Error(`Rota /${p.rota} declarada por dois módulos: ${vistas.get(p.rota)} e ${p.modulo}.`);
          if (existsSync(join(raiz, "src", "pages", p.rota, "index.astro"))) throw new Error(`Rota /${p.rota} existe em src/pages e no módulo ${p.modulo}.`);
          vistas.set(p.rota, p.modulo);
          injectRoute({ pattern: "/" + p.rota, entrypoint: p.arquivo });
        }
        logger.info(`${vistas.size} rotas de ${new Set(vistas.values()).size} módulos`);
        // a primeira tela do painel (logo, "Voltar ao início"): src/lib/url.ts, inicioDoPainel()
        updateConfig({ vite: { define: { "import.meta.env.INICIO_DO_PAINEL": JSON.stringify(inicioDoPainel(raiz)) } } });
      },
    },
  };
}
