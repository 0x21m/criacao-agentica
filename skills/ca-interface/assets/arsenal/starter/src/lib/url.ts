// Auxiliar único de caminho (STK-25): todo link e arquivo de public/ passa por aqui,
// para o protótipo abrir em qualquer subpasta. Nunca escreva href="/..." fixo.
export function url(caminho = ""): string {
  const base = import.meta.env.BASE_URL || "/";
  const b = base.endsWith("/") ? base : base + "/";
  return b + caminho.replace(/^\/+/, "");
}

/**
 * A primeira tela do painel (o logo e o "Voltar ao início" levam para ela): a raiz, ou, num starter sem o Início
 * (scripts/modulos.mjs --manter), a primeira rota do módulo de menor ordem. Calculada pela integração dos módulos.
 */
export function inicioDoPainel(): string {
  return url((import.meta.env.INICIO_DO_PAINEL as string | undefined) ?? "");
}

/** Caminho atual sem o base, sem barra no começo nem no fim ("" na raiz). */
export function rotaAtual(pathname: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const p = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return p.replace(/^\/+|\/+$/g, "");
}
