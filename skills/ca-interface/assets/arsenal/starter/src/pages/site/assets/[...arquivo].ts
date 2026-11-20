// Serve o kit da design-taste-frontend (src/components/site/kit/) como arquivos simples em /site/assets/...
// O kit precisa dos caminhos relativos entre os módulos (system.js importa moments/moments.js, que importa
// <id>/moment.js e liga <id>/moment.css), então ele não pode passar pelo bundler. Os arquivos são cópias sem
// edição do kit (o gate.mjs confere isso). No build estático vira dist/site/assets/...
// Transplante: este endpoint vai junto para src/pages/site/assets/ do starter (ou mova o kit para public/site/assets/
// e apague o endpoint; os caminhos /site/assets/... continuam os mesmos).
import type { APIRoute, GetStaticPaths } from "astro";
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.join(process.cwd(), "src", "modulos", "site", "casca", "kit");
const TIPOS: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function listar(dir: string, base = ""): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) return listar(path.join(dir, e.name), rel);
    return TIPOS[path.extname(e.name)] ? [rel] : [];
  });
}

export const getStaticPaths: GetStaticPaths = () => listar(RAIZ).map((arquivo) => ({ params: { arquivo } }));

export const GET: APIRoute = ({ params }) => {
  const rel = String(params.arquivo || "");
  const alvo = path.normalize(path.join(RAIZ, rel));
  if (!alvo.startsWith(RAIZ) || !fs.existsSync(alvo)) return new Response("não encontrado", { status: 404 });
  return new Response(fs.readFileSync(alvo), {
    headers: { "Content-Type": TIPOS[path.extname(alvo)] ?? "application/octet-stream" },
  });
};
