# Alterações feitas na cópia dos componentes

Os originais ficam em `../componentes-de-referencia/` e não foram tocados. Aqui está tudo o que mudou na cópia dentro de `src/`, para compilar no projeto vitrine. Visual e comportamento ficaram iguais aos do autor.

## Componentes (`src/components/ui/`)

| Arquivo | Alteração | Por quê |
|---|---|---|
| `finance-bento.tsx` | Troquei a ordem das duas primeiras linhas: `// @ts-nocheck` passou para antes de `"use client";` | O TypeScript só respeita `@ts-nocheck` quando o comentário vem antes da primeira instrução. Com a diretiva antes, o arquivo era checado e dava ~200 erros de tipo implícito |
| `avatar.tsx` | `import { cva, VariantProps }` virou `import { cva, type VariantProps }` | `verbatimModuleSyntax` do template do Vite exige import de tipo explícito |
| `button-1.tsx` | `import { ChevronDown, LucideIcon }` virou `import { ChevronDown, type LucideIcon }` | Mesmo motivo |
| `card.tsx`, `badge-2.tsx` | Copiados de `statistics-card-7/` sem alteração | O demo importa `@/components/ui/card` e `@/components/ui/badge-2` |
| `statistics-card-7/globals-extra.css` | Não copiado como arquivo. A linha útil (`--color-destructive-foreground: var(--destructive-foreground)` no `@theme inline`, e `--destructive-foreground` em `:root` e `.dark`) foi para `src/index.css` | A outra linha tem erro do autor (`----color-destructive-foreground`) |
| `liquid-glass-logo-reveal.tsx` | `function GlassIconReveal` virou `export function GlassIconReveal`, e `interface GlassIconRevealProps` virou `export interface` | Fase de templates: o template `abertura` usa um logo próprio, como o README de referência indica. O demo continua igual |
| Demais (`adjustable-glass-dashboard`, `glass-fold`, `liquid-glass-navbar`, `market-card`, `market-snapshot`, `metric-switcher-trend-chart-demo`, `peak-chart`, `stats-bento`, `stats-card-2`, `statistics-card-7`) | Sem alteração | Compilaram como vieram |

## Demos (`src/demos/`)

| Arquivo | Alteração | Por quê |
|---|---|---|
| `finance-bento.tsx` | Acrescentei `style={undefined}` no `<FinanceBento>` | Como o componente é `@ts-nocheck`, o TS infere as props pela desestruturação, e `style` (sem valor padrão) virou obrigatória |
| Demais | Sem alteração | |

## Projeto (não é código dos componentes)

- `typescript` fixado em `~5.9.3`. O `create vite` atual instala o TypeScript 7 (tsgo), e `strict` virou padrão lá; voltei para a 5.9, que é a linha estável que o shadcn usa, e deixei `strict: true` explícito.
- `tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters` e `erasableSyntaxOnly` desligados, para não ter que editar os componentes por variável não usada. Alias `@/*` → `./src/*` no `tsconfig.json` e no `tsconfig.app.json`.
- `vite.config.ts`: plugin `@tailwindcss/vite`, alias `@` → `src`, porta 5180 com `strictPort`.
- `components.json` e `src/lib/utils.ts` (`cn`) escritos à mão, no formato do `shadcn init` (estilo new-york, base neutral, variáveis CSS, ícones lucide).
- `src/index.css`: `@import "tailwindcss"`, `@import "tw-animate-css"`, variante `dark` por classe, tema shadcn completo em oklch (claro e escuro, com `--chart-1..5` e `--sidebar-*`), e `--font-sans: Geist` / `--font-mono: Geist Mono`.
- `index.html`: `lang="pt-BR"` e as fontes Geist e Geist Mono do Google Fonts.
- `src/App.tsx`: índice com navegação lateral, rotas por hash (`#/<nome>` para demos, `#/template/<nome>` para templates), botão de tema claro/escuro, menu recolhível no celular e modo `?captura=1` (mostra só o demo, sem a moldura da vitrine). `?tema=escuro` força o tema.
- `src/index.css` (fase de templates): tokens semânticos `--sucesso` e `--aviso` (claro e escuro) mapeados para `text-sucesso`, `bg-aviso` etc.

## Templates (`src/templates/`)

Cópias adaptadas, feitas para os templates. Os arquivos de `src/components/ui/` não mudam por causa delas.

| Arquivo | Origem | O que mudou |
|---|---|---|
| `painel-cliente-vidro/glass-workspace-ptbr.tsx` | `adjustable-glass-dashboard.tsx` | Só textos em pt-BR, `Intl` em `pt-BR` e nomes de categoria dos ícones (Entrada, Alimentação, Viagem, Compras) |
| `relatorios/grafico-tendencia-ptbr.tsx` | `metric-switcher-trend-chart-demo.tsx` | Textos fixos em pt-BR (botões, legenda, tabela, textos para leitor de tela, CSV), `locale` padrão `pt-BR`, percentuais com vírgula |
| `resumo-do-dia/marcador-ptbr.tsx` | `market-card.tsx` | Frase da variação ("de alta"/"de queda"), rótulos ARIA e decimal com vírgula |
| `resumo-do-mes/bento-destaque.tsx` | `stats-bento.tsx` | Props no lugar de textos fixos, ícone lucide no lugar de "★", textura em `currentColor`, sem `min-h-screen`, texto alternativo nas barras |
| `categorias/card-participacao.tsx` | `stats-card-2.tsx` | `var(--primary)` no gradiente, `useId` no id, movimento reduzido, pt-BR, ícones lucide, cores por token |
| `tendencias/card-tendencia.tsx` | `market-snapshot.tsx` | Props, pt-BR, `aria-pressed`, `layoutId` único, setas no gráfico, queda em `--destructive` |
| `visao-financeira/index.tsx` | padrões do `finance-bento.tsx` | Reconstrução em React com tokens; não usa o arquivo original |
| `_base/*` | novo | Moldura do operador, estados de protótipo (tecla F, `data-prototipo-controle`, `?estado=`), esqueleto, vazio, entrada, formatação pt-BR, leitura de tokens em hex |

- `scripts/capturar.mjs`: captura com o Chrome headless por CDP, sem dependência, em 1440×900 e 375×812 (DPR 2, toque), com opções `REDUZIDO=1` (movimento reduzido), `ESCURO=1` e `ESPERA=<ms>`, e imprime erros e avisos do console.
