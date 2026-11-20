// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import modulos from "./integracoes/modulos.mjs";

// base configurável para servir numa subpasta (STK-25): BASE=/teste/ npm run build
export default defineConfig({
  base: process.env.BASE || "/",
  // as rotas dos módulos saem de src/modulos/<id>/paginas/ (docs/contratos.md)
  integrations: [react(), modulos()],
  vite: {
    plugins: [tailwindcss()],
    // dev server: empacota de uma vez as dependências grandes (sem isso, a primeira abertura de cada tela descobre
    // dependência nova, reempacota e recarrega) e aquece as telas da casca. A velocidade de verdade se mede no build.
    optimizeDeps: {
      include: [
        "react", "react-dom", "react-dom/client", "react/jsx-runtime", "react-aria-components", "motion/react",
        "lucide-react", "sonner", "@dnd-kit/core", "clsx", "tailwind-merge", "class-variance-authority",
      ],
    },
    server: {
      warmup: { clientFiles: ["./src/components/app/*.tsx", "./src/modulos/**/*.tsx", "./src/proto/*.tsx"] },
    },
  },
  devToolbar: { enabled: false },
  // troca de página rápida: as páginas da navegação são buscadas ao passar o ponteiro (e ao aparecer, no toque)
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
});
