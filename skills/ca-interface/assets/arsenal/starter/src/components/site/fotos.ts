// Fotografias do site: stand-ins do Wikimedia Commons em WebP (640, 1024 e 1400 de largura), com a licença e o autor
// em fotos/fotos.json. O Vite dá a URL de cada arquivo (dev e build).
import meta from "./fotos/fotos.json";

const arquivos = import.meta.glob("./fotos/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export type FotoMeta = { w: number; h: number; sizes: number[]; by: string; licence: string; licenceUrl?: string; page: string };
export const FOTOS = meta as Record<string, FotoMeta>;

export function foto(id: string) {
  const m = FOTOS[id];
  if (!m) throw new Error(`foto desconhecida: ${id}`);
  const src = (w: number) => arquivos[`./fotos/${id}-${w}.webp`];
  const maior = m.sizes[m.sizes.length - 1];
  return {
    src: src(maior),
    srcset: m.sizes.map((w) => `${src(w)} ${w}w`).join(", "),
    width: maior,
    height: Math.round((m.h * maior) / m.w),
  };
}
