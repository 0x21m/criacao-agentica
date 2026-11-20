# Fundamentos e tokens (TOK)

Fonte única de números da skill: estrutura de tokens, espaço, tipo, dimensões, densidade e larguras de shell, conteúdo e camadas, cor e contraste, raio, borda, elevação em níveis, gradiente, textura, desfoque e superfície, tempos de resposta e de espera, durações, curvas e molas, toast, tooltip, alvos e larguras de inspeção. Não cobre quando animar (`movimento.md`), qual indicador de espera usar em cada estado (`estados-e-ui-otimista.md`), viewport, teclado virtual e entrada (`dispositivos-e-entrada.md`) nem a auditoria WCAG completa (`acessibilidade.md`), a escolha da família tipográfica pela personalidade (`direcao-e-personalidade.md`, PER-18) nem as origens e licenças das fontes (`catalogo-de-fontes.md`, "Fontes de texto livres"). Os outros arquivos apontam para cá e não repetem estes valores.

Formato das regras: **ID** [selo] · prioridade mínima — regra. *Por quê* e *Verificar* quando ajudam. Os valores [PR] e [DS] são **padrão inicial**: valem quando o projeto não tem os seus.

As regras de estilo deste arquivo são **alertas de uso consciente**: dizem quando e onde um recurso (sombra, gradiente, desfoque, textura, serifa, mola) funciona e quando atrapalha; nenhum é proibido. Continuam **requisito** só o que é norma ou função: contraste WCAG, informação só por cor, licença, preferências de acessibilidade do sistema (movimento, transparência, contraste) e desempenho que bloqueia a tarefa.

## Sumário

1. Como usar estes números
2. Tokens em três níveis
3. Espaço e proximidade
4. Tipografia por ponta
5. Dimensões, densidade e larguras
6. Cor e contraste
7. Raio, borda, elevação, gradiente e superfície
8. Tempo de resposta e espera
9. Movimento, molas, toast, tooltip e gesto
10. Alvos de toque
11. Tabela consolidada
12. Padrão detectável → correção
13. Fontes

## 1. Como usar estes números

**TOK-01** [DS] · P2 — Use os tokens do projeto quando existirem; os valores deste arquivo só preenchem o que falta. Achado é **inconsistência interna** (dois valores para o mesmo papel, literal fora da escala) ou violação [N], nunca "o projeto usa 0,96 e aqui diz 0,97". *Por quê:* um sistema coerente com outros números vale mais que um transplante; só norma e métrica oficial são universais. *Verificar:* a mesma grandeza aparece com valores diferentes em componentes equivalentes.

Leia a coluna "Força" da tabela consolidada antes de classificar: só [N] e [P] sustentam P0/P1 sozinhos; [PR] não passa de P2, salvo quando a prioridade vem da definição de dano de `verificacao.md` (ver `SKILL.md`, "Selos, prioridade e precedência").


## 2. Tokens em três níveis

**TOK-02** [DS] · P2 — Organize em três níveis: **primitivo** (`--blue-600`, `--space-4`) → **semântico** por papel (`--color-text-secondary`, `--space-group`) → **componente** (`--button-height`), que só aponta para semânticos. Componente nunca lê primitivo. *Por quê:* o semântico é o que sobrevive à troca de tema, marca e densidade; o volume de tokens de componente é métrica de deriva. Fonte única, geração e lint estão em `governanca.md` (GOV-01, GOV-02, GOV-04).

**TOK-03** [PR] · P3 — Nomeie pelo papel, nunca pelo valor ou lugar. Gramática: neutros começam pela propriedade (`--color-{bg|text|border}-{variante}-{estado}`); acento e status começam pelo papel (`--color-{accent|danger|warning|success|info}-{subtle|border|solid|text}`). Uma palavra por conceito: `text`, `bg`, `border`, `accent`; `primary` só para "o mais proeminente do grupo" (`--color-text-primary`), nunca para a marca. *Verificar (grep):* `--color-blue-button`, `--color-sidebar-gray`, `--color-text-2`, `bg-blue-600` em componente, token de borda usado em `color:`.

**TOK-04** [DS] · P2 — Temas são conjuntos de valores sobre os mesmos semânticos, em eixos independentes: marca, modo (claro, escuro, alto contraste), **densidade**, movimento e contexto de uso. Todas as pontas usam os mesmos nomes (`pontas-e-sistema.md`, PON-23). *Por quê:* operador compacto e cliente confortável não justificam dois design systems.

Papéis semânticos mínimos para apps e painéis:

| Grupo | Tokens |
| --- | --- |
| Superfície | `bg-page`, `bg-surface`, `bg-surface-hover`, `bg-surface-active`, `bg-raised` (menu, popover, painel flutuante), `bg-sunken` (input, trilho), `bg-scrim` |
| Texto | `text-primary`, `text-secondary`, `text-disabled`, `text-placeholder`, `text-inverse`, `text-on-accent`, `text-link` |
| Borda | `border-subtle` (decorativa), `border` (controle, ≥ 3:1), `border-strong`, `border-focus`, `separator` |
| Acento | `accent-subtle`, `accent-border`, `accent-solid`, `accent-solid-hover`, `accent-text` |
| Status ×4 | `{danger,warning,success,info}-{subtle,border,solid,text}` |
| Tendência | `trend-favorable-text`, `trend-unfavorable-text`, `trend-neutral-text` (o componente escolhe pela polaridade da métrica; o token aponta para success/danger) |
| Tipo | `font-text`, `font-display` (pode apontar para a mesma família), `font-mono` (TOK-13, TOK-33) |
| Elevação | `elevation-{plano,repouso,elevado,flutuante,sobreposto}-shadow` e `-bg`, em claro e escuro (TOK-34, TOK-35; níveis de EXP-43); `shadow-border` e `shadow-border-hover` (anel); `shadow-overlay` fica como apelido de `elevation-flutuante-shadow` |
| Gradiente | paradas `gradient-brand-from`, `gradient-brand-via`, `gradient-brand-to`; papéis `gradient-banner`, `gradient-glow`, `gradient-live`, `gradient-frame` (TOK-36) |
| Véu e textura | `bg-veil` (texto sobre imagem ou gradiente, TOK-37), `texture-noise` e `noise-opacity` (opcional, TOK-38) |
| Pulso e vibração | `pulse-duration`, `pulse-scale`, `pulse-opacity` (TOK-40); `haptic-confirm`, `haptic-limit`, `haptic-error` (TOK-41) |
| Desfoque | `blur-chrome`, `blur-card`, `blur-thick` (TOK-23) |
| Mola | `spring-rapida`, `spring-padrao`, `spring-macia` (TOK-39) |

Em projeto com shadcn/ui, as variáveis do tema (`--background`, `--card`, `--primary`, `--muted`, `--border`, `--ring` e as demais) são **geradas destes semânticos**, em claro e escuro, sem valor literal novo no CSS do tema, e as semânticas de status entram como variantes (`stack-e-bibliotecas.md`, STK-10, STK-11). Os nomes `primary` e `accent` do shadcn são contrato da biblioteca, não exceção a TOK-03: `--primary` do shadcn aponta para `accent-solid`, e `--accent` do shadcn é o realce de hover e de item ativo de menu, não a marca. Na camada de primitivos, a **rampa neutra padrão tem 11 degraus** (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950), e cada papel de superfície, borda e texto escolhe o seu degrau por modo (bloco 1 de `assets/modelo-folha-do-sistema.md`); um cinza só para fundo, borda e texto é achado (`verificacao.md`, A17). O ícone de vazio tem **token de tamanho próprio** (`icon-size-empty`, seção 5), maior que o de controle.

## 3. Espaço e proximidade

**TOK-05** [PR] · P3 — Todo intervalo recorrente sai da escala de base 4: **4, 8, 12, 16, 24, 32, 40, 48** px (2 px só como microajuste óptico). Em app, 48 é o teto útil; 64+ é ritmo de landing page. *Por quê:* intervalo solto é a primeira deriva visível.

**TOK-06** [PR] · P3 — Proximidade: o espaço entre grupos é **pelo menos o dobro** do espaço interno. Receita inicial: 4–8 px dentro do grupo, 12–16 px entre irmãos, 24–32 px entre grupos. Agrupe com espaço primeiro, depois com fundo, e reserve a linha separadora para dado denso (tabela, lista longa); linha somada a um vão que já separa é separação dupla, que pesa sem informar. *Por quê:* o leitor deve ver os grupos sem uma borda em volta de tudo. *Verificar:* o erro de um campo fica mais perto do próprio campo que do seguinte.

**TOK-07** [PR] · P3 — O contêiner controla o vão entre filhos (`gap`); o componente controla o próprio padding. Folga entre controles: 12 px se têm borda ou fundo; **24 px entre glifos sem borda**, contando o padding (ícones de ação em linha de tabela). Uma altura por linha de cards na página. *Por quê:* ícones colados sem borda geram clique no alvo errado, que vira P0 se a ação for destrutiva.

## 4. Tipografia por ponta

Os tamanhos ficam em `rem` no código (base 16 px: 12 = 0,75rem, 14 = 0,875rem, 16 = 1rem, 18 = 1,125rem, 24 = 1,5rem). Entrelinha sem unidade.

| Papel | Operador denso (painel, ERP, CRM) | Cliente e leitura (app, loja, portal) | Peso |
| --- | --- | --- | --- |
| Título da página | 24 / 1,333 (20 / 1,4 em cabeçalho compacto) | 24 / 1,333 (20 / 1,4 no celular) | 600 |
| Título de seção | 18 / 1,333 | 18–20 / 1,3 | 600 |
| Título de componente (card, painel) | 16 / 1,5 | 16–18 / 1,4 | 500 |
| Texto operacional, linha de tabela | 14 / 1,429 | — | 400 |
| Corpo de leitura, formulário amplo | 16 / 1,5 | 16 / 1,5 | 400 |
| Rótulo de controle (botão, campo, filtro) | 14 / 1,429 | 14–16 / 1,429 | 500 |
| Texto de input | 14 no desktop; **16 sob `pointer: coarse`** | 16 | 400 |
| Metadado | 12 / 1,333 (1,4 se quebrar) | 13–14 / 1,4 | 400–500 |
| Valor de KPI | 28 / 1,286 | 28 / 1,286 | 600 |
| KPI de destaque excepcional | 32 / 1,25 | 32 / 1,25 | 600 |

A coluna do cliente é inferência a partir do briefing (16 px para leitura e toque) e da taste-skill (nada essencial abaixo de 13 px); trate como [PR].

**TOK-08** [PR] · P3 — Escala fechada: no máximo ~10 tamanhos, sem meio pixel fora da escala, razão ≥ 1,2× entre níveis de título (24 → 18 → 14 passa). Um tamanho por tipo de elemento na página toda. *Por quê:* 18 tamanhos com meios pixels (medido num demo) é sinal de valores copiados de tela em tela.

**TOK-09** [PR] · P3 — Tamanho em `rem`; `line-height` sem unidade; `letter-spacing` em `em`. Texto que quebra em 3+ linhas pede ≥ 1,4. Títulos de 24 px ou mais: 0 a −0,02 em. Caixa alta (só sigla ou overline) de até 14 px leva +0,05 em; rótulos e cabeçalhos de tabela em caixa de frase. *Por quê:* entrelinha em px não acompanha zoom de texto (`acessibilidade.md`); `em` acompanha qualquer tamanho.

**TOK-10** [PR] · P3 — Pesos: 400 no texto, 500 em rótulo e título de componente, **600 como teto**, só em título de página e valor de KPI. Nada abaixo de 400 em texto menor que 18 px. Ênfase dentro do mesmo papel é um degrau de peso, não de tamanho. 700+ fica fora do padrão de texto de app; a exceção consciente é a face de título ou display da direção no peso em que foi desenhada (uma condensada a 700 num cabeçalho de marca, por exemplo), registrada no `DESIGN.md`, sem levar 700 a rótulo, tabela ou corpo. *Por quê:* "tudo em negrito" apaga a hierarquia; 600 basta quando posição e agrupamento fazem o trabalho.

**TOK-11** [PR] · P3 — Números: `font-variant-numeric: tabular-nums` pela propriedade (nunca `"tnum"` cru) em colunas, timers, contadores e preços; `slashed-zero` em códigos (pedido, NF, SKU, protocolo); monoespaçada só para identificador e código. Espaço não separável entre número e unidade ("R$ 128.450,00", "12 un."). *Por quê:* a propriedade continua valendo no fallback; dígitos proporcionais fazem a coluna tremer.

**TOK-12** [PR] · P3 — Texto essencial nunca abaixo de 12 px no operador nem de 13 px no cliente; não reduza fonte para caber, reduza molduras. *Por quê:* encolher texto é o atalho que esconde um problema de layout.

**TOK-13** [PR] · P3 — Fontes: a escolha fica registrada no `DESIGN.md` com o motivo (os atributos de PER-03 que ela traduz e as candidatas comparadas, PER-18), o papel de cada família (`font-text`, `font-display`, `font-mono`) e a mono do par. Orçamento inicial: até 2 famílias além da mono, até 4 arquivos e ~160 KiB de fonte no primeiro carregamento (uma variável conta como um arquivo por estilo); carregue toda face usada (negrito sintetizado deforma). **Nenhuma fonte é banida**: Inter, a fonte do sistema e as serifadas continuam válidas. *Alerta:* título serifado elegante sobre corpo em Inter, sem motivo nos atributos, virou assinatura de interface feita por IA; use o par quando os atributos o pedem e depois de compará-lo com candidatas de outras origens (`catalogo-de-fontes.md`, "Fontes de texto livres"). *Verificar:* `font-weight` sem face carregada correspondente; `DESIGN.md` sem o motivo da fonte.

**TOK-33** [N]/[PR] · P2 — Critérios práticos de uma família, conferidos antes de ela entrar no tema: 1. **licença** livre para o uso (OFL, Apache 2.0 ou equivalente; vale a licença que acompanha o arquivo, não o rodapé do site), registrada na DEC (STK-23); família paga, de assinatura ou com restrição comercial só com autorização do usuário; 2. **acentos do português** completos em todos os pesos usados (ç, ã, õ, á, é, í, ó, ú, â, ê, ô, à, em caixa alta e baixa) e os sinais de dinheiro e número (R$, nº, º, ª, %, travessão); 3. **números tabulares** na família que mostra dados (tabela, KPI, preço, timer; TOK-11), ou a mono assume os números; 4. **fonte variável** quando existir (um arquivo cobre os pesos; os eixos `wdth` e `opsz` dão título e texto a partir da mesma família); 5. **hospedada no projeto**, não carregada de CDN de terceiro no build: em Astro, a API de fontes com o provedor Fontsource (`fontProviders.fontsource()`) ou o pacote `@fontsource-variable/<família>` (estático: `@fontsource/<família>`), e arquivo local para família fora do npm, com `font-display: swap` e fallback de métrica ajustada. Licença ausente ou incompatível com o uso é P1 (risco legal, [N]); acento faltando em texto do produto é P2 (o fallback mistura dois desenhos na mesma palavra). *Verificar:* digitar "Ação, opções, São João, R$ 1.234,56 — nº 0" em cada peso usado e ver se nenhum glifo cai no fallback; ligar `font-variant-numeric: tabular-nums` e ver os dígitos ficarem da mesma largura.

## 5. Dimensões, densidade e larguras

| Componente | Desktop padrão | Desktop compacto (opt-in) | Toque (celular, tablet) |
| --- | --- | --- | --- |
| Botão e campo de uma linha | 40 px | 32–36 px | 44–48 px de área acionável |
| Ícone em controle | 16 px com rótulo de 14; 20 px com rótulo de 16 ou isolado | 16 px | 20–24 px |
| Traço renderizado do ícone | 1,5 px ao lado de texto 400; 2 px ao lado de 500–600 | igual | igual |
| Distância ícone–texto | 8 px | 4–8 px | 8 px |
| Ícone de vazio (`icon-size-empty`) | 40 px | 32 px | 40–48 px |
| Padding horizontal de botão | 16 px (opcional 14 do lado do ícone) | 12 px | 16 px |
| Linha de tabela, uma linha de texto | 40–48 px | 32–36 px; 24 px só em grade de especialista com mouse | 48–56 px com ações por toque |
| Linha com nome e metadado | 64 px | 56 px | 64–72 px |
| Item de navegação | 40–44 px | 36–40 px | 44–48 px |
| Padding de card | 24 px | 16 px | 16–20 px |

Valores de linha e controle são **mínimos**: deixe crescer com texto ampliado, zoom ou conteúdo multilinha.

**TOK-14** [N]/[DS] · P2 — Densidade alta é **opt-in**, persistida por usuário, e nunca leva alvo abaixo de 24×24 CSS px sem exceção de espaçamento (seção 10). Operador: padrão ou compacto. Cliente: confortável. *Por quê:* o Material diz que componentes de alta densidade não atendem acessibilidade e devem ser escolha do usuário; o cliente não reaproveita a tabela densa do admin. Sobe para P1 quando o alvo fica abaixo de 24×24.

**TOK-15** [PR] · P3 — Não misture três alturas de controle na mesma toolbar. Tamanho visual e área acionável são coisas separadas: um ícone de 20 px pode ocupar botão de 44 px, desde que as áreas não se sobreponham.

### Larguras de partida (shell, conteúdo e camadas)

Todos são [PR] e **padrão inicial**: ajuste ao idioma, à marca, à quantidade de destinos e ao conteúdo. Não são breakpoints nem requisitos.

| Elemento | Valor inicial | Fonte |
| --- | --- | --- |
| Sidebar expandida | 240–256 px | briefing §27 |
| Sidebar recolhida | 64–72 px | briefing §27 |
| Barra superior (opcional; omita se só repete o cabeçalho da página) | 56–64 px de altura | briefing §27 |
| Degraus da navegação (NAV-13) | sidebar expandida → trilho de ícones de 76 px a partir de ~1100 px de largura útil → barra inferior com "Mais" e busca separada a partir de ~760 px | demo code&chill (Pane), medido |
| Margem do conteúdo | 24–32 px desktop; 24 px tablet; 16 px celular | briefing §27 |
| Toolbar de listagem | controles de 40 px; 8 px entre controles relacionados; 16 px até a tabela quando são regiões distintas | briefing §28 |
| Campo de busca | 280–360 px, encolhe quando falta espaço; no celular, largura disponível | briefing §28 |
| Colunas de tabela | checkbox 40–48 px; nome flexível; status 120–160 px; data 120–144 px; menu de ações 40–48 px | briefing §29 |
| Padding horizontal de célula | 16 px; 12 px no compacto | briefing §29 |
| Formulário de leitura sequencial | largura máxima 640–720 px | briefing §32 |
| Painel lateral | 400–560 px | briefing §33 |
| Modal | 400–560 px, com margem livre e só o corpo rolando | briefing §33 |
| Área de gráfico | 240–320 px de altura; 16–24 px entre o cabeçalho e a visualização | briefing §30 |
| Anatomia de KPI | rótulo 14, 8 px, valor 28, 8 px, comparação 12–14; padding 24 px (16 compacto); 16–24 px entre cards | briefing §30 |

O trilho de 76 px do demo e a sidebar recolhida de 64–72 px do briefing não conflitam na prática: escolha um valor na faixa de 64–76 px e use-o em todo o produto.

**TOK-32** [PR] · P3 — Use as larguras de partida acima quando o projeto não tem as suas, e troque de composição quando a largura útil não comporta a forma (lista + painel que não cabem viram drill-down; sidebar vira trilho e depois barra inferior). Uma largura por papel no produto. *Por quê:* painel que cobre quase toda a tela média e deixa sobra inútil, ou tabela presa numa coluna estreita por estética, são os dois erros que o briefing aponta. *Verificar:* a mesma camada aparece com larguras diferentes em telas equivalentes; a composição se mantém espremida abaixo do ponto em que deixou de caber.

## 6. Cor e contraste

**TOK-16** [N] · P1 — Contraste mínimo: **4,5:1** para texto; **3:1** para texto grande (≥ 24 px, ou ≥ 18,67 px em negrito) e para o que identifica controle, estado, foco e gráfico (WCAG 1.4.3 e 1.4.11). Desabilitado e logotipo são isentos. Meça o par **renderizado contra o fundo real e o pior ponto**: card, linha zebrada, cabeçalho translúcido, vidro sobre papel de parede, badge com alfa. *Por quê:* texto sobre cor com alfa não tem contraste estático; no demo Pane o texto secundário caiu para 2,0–2,4:1 sobre a parada âmbar. P1 em texto essencial abaixo do limiar. *Verificar:* nunca relate contraste que não mediu; informe par, valor e limiar.

**TOK-17** [PR] · P3 — APCA é **complementar**, nunca critério de falha: corpo Lc 75 (preferido 90), rótulo e título Lc 60, texto grande Lc 45, ícone de contorno fino Lc 45, ícone sólido e componente Lc 30, divisor Lc 15. 7:1 (AAA) é recomendação. *Por quê:* a APCA ajuda onde a WCAG engana (tema escuro, ícone de traço 1,5 px), mas a conformidade é WCAG.

**TOK-18** [PR] · P2 — Uma cor, um significado. Estrutura: uma rampa neutra (80–95% da interface), **um acento** (ação, foco, seleção; menos de ~3% da tela fora dos controles) e de 0 a 4 status (sempre com texto ou ícone). Matizes a menos de 15° em OKLCH contam como a mesma cor: acento azul com info azul faz o badge parecer clicável. Estado de negócio neutro ("Rascunho", "Em análise") em tons de tinta; cor só quando há algo a fazer. Um preenchimento colorido de ênfase por vista. Cor nunca é canal único (`acessibilidade.md`). P2 em conflito semântico; P3 no resto.

**TOK-19** [PR] · P3 — Sólido de acento e de status no degrau 600 (branco sobre a maioria dos 500 falha 4,5:1); se a cor da marca falhar, ela continua marca, mas o preenchimento interativo usa um degrau mais escuro. Ação em acento só com ≥ 3:1 contra o fundo; senão, tinta. Para sistema novo, gere rampas em OKLCH com biblioteca (L constante por degrau entre hues); em sistema existente, siga a notação do projeto.

**TOK-20** [PR] · P3 — Tema escuro é recalibrado, não invertido: acento 1–2 degraus menos vivo, degraus de superfície perceptíveis (quatro pretos parecidos apagam os planos; a elevação no escuro é por clareamento, TOK-35), todos os pares remedidos. Um mecanismo só (`prefers-color-scheme` ou classe com toggle, não os dois). `prefers-contrast: more` aumenta a distância de luminosidade em ≥ 0,15. Suspenda transições na troca de tema (`movimento.md`).

**TOK-44** [PR] · P3 · RECOMENDADO — **Uma cor de destaque só, contra base monocromática.** Tudo o que não é status fica nos neutros, com 2 ou 3 opacidades de texto; uma cor (o acento da direção) marca o que importa naquela vista: o delta, o ponto ativo, a série selecionada, a ação principal. É o TOK-18 levado ao acabamento: as cores de status continuam com o papel delas, mas nenhuma segunda cor de destaque disputa a atenção. *Origem:* finance-bento (`#E8FF1F`), market-card (azul do brilho), peak-chart (`accent`), market-snapshot (verde), metric-switcher (`chart-1`), adjustable-glass-dashboard (verde-musgo), na `ANALISE.md` do arsenal, padrão 3. *Verificar:* contar matizes de destaque fora de status numa vista: uma.
**TOK-45** [N casa] · P1 · SEMPRE — **Quebra de linha cuidada.** Títulos e rótulos curtos usam `text-wrap: balance`; parágrafos e descrições, `text-wrap: pretty` (sem palavra sozinha na última linha). Espaço que não quebra (`&nbsp;` ou `white-space: nowrap` no trecho) entre `R$` e o valor, número e unidade, data e hora, e em nomes curtos de ação. Botões, chips, selos e itens de navegação não quebram linha: se não cabem, o layout muda (ícone só, menu, outra linha da barra), nunca o texto quebra no meio. Rótulo de campo e cabeçalho de coluna em uma linha, com reticências e texto completo no foco (LIS-28) quando faltar espaço. Hifenização só em texto corrido longo (`hyphens: auto` com `lang="pt-BR"`). *Por quê:* quebras estranhas (R$ numa linha e o valor na outra, título com uma palavra sobrando, botão em duas linhas) fazem a tela parecer feita às pressas. *Verificar:* `navegar.mjs` e o detector de rótulo quebrado (MIFT) em 1440, 1024 e 390; lente `better-typography` e `typeset` do Impeccable.


## 7. Raio, borda, elevação, gradiente e superfície

**TOK-21** [PR] · P3 — Raio por família nomeada: `sharp` 4/6/8 para ERP denso e fintech; `soft` 8/12/20 como padrão (campo e botão 8, card 12, modal e painel flutuante 12–16, badge 4–6 ou pílula). Raio aninhado = externo − padding − borda, com piso de 6 px, **só quando o filho preenche o pai** (menu 12 com padding 4 → item 8; trilho e polegar de segmentado; imagem em card). Bordas coladas à tela ficam retas. Acima de 24 px de padding, cada camada mantém seu token.

**TOK-22** [PR] · P3 — Borda define estrutura; sombra e superfície definem **plano**. Card em repouso usa uma forma por tipo de card: borda de 1 px com 8–14% da tinta, anel `--shadow-border` ou `--elevation-repouso-shadow`; formas diferentes em cards equivalentes são inconsistência. A sombra cresce com o nível de elevação (TOK-34, EXP-43): o que está mais perto da pessoa tem sombra mais longa e difusa. *Alerta "sombra em tudo":* a mesma sombra forte em todo card, campo e botão apaga a diferença entre planos e pesa a tela. *Alerta "tela plana":* tela principal toda no mesmo plano, sem nada elevado nem sobreposto, parece screenshot. Em `forced-colors`, borda transparente de 1 px sob o anel. No máximo dois níveis de superfície com fundo ou borda aninhados; card dentro de card dentro de card exige justificativa de cada camada.

**TOK-23** [PR] · P2 — Translucidez e desfoque são **opcionais** e rendem mais no chrome (sidebar, barra superior, tab bar, overlays) e em painel sobre imagem. Requisitos quando usados: área de dados sólida ou ≥ 85% opaca (leitura); contraste medido no pior ponto (TOK-16); três espessuras de token (`blur-chrome`, `blur-card`, `blur-thick`; ponto de partida 8, 16 e 24 px, com fundo a 70–85%); fallback sólido declarado para `@supports not (backdrop-filter…)`, `prefers-reduced-transparency`, `prefers-contrast: more` e um toggle "Reduzir transparência"; e desempenho, porque trava a tarefa: rolar a página mais longa com vidro não custa mais de ~2× o tempo de quadro do sólido. *Alertas:* vidro claro sobre vidro claro apaga a borda dos dois planos (dê a um deles fundo mais opaco); desfoque animado é caro (curto, < 20 px, só na entrada de camada rara, não a cada rolagem); vidro cobrindo mais de ~25% da viewport pesa em aparelho modesto. *Por quê:* no demo Pane o vidro derrubou a rolagem de 120 para 24–60 fps; o sólido ficou em 120.

**TOK-34** [PR]/[N casa] · P3 — **Elevação em cinco níveis nomeados** (os de EXP-43), cada um com sombra e superfície próprias nos dois modos. As sombras são suaves e **em camadas** (uma curta e nítida para o contato, uma longa e difusa para a distância), com a cor do neutro mais escuro da rampa (não preto puro), e nenhum `box-shadow` literal fica fora dos tokens:

| Nível | Tokens | Usa em | Sombra de partida (claro) |
| --- | --- | --- | --- |
| plano | `elevation-plano-shadow` (nenhuma), `-bg` = `bg-page` | fundo, faixa de página, área de tabela que encosta no fundo | sem sombra |
| repouso | `elevation-repouso-shadow`, `-bg` = `bg-surface` | card em repouso, painel fixo da página | `0 1px 2px rgb(N / .05), 0 1px 3px rgb(N / .04)` |
| elevado | `elevation-elevado-shadow`, `-bg` = `bg-surface` | card clicável em hover, item arrastado, botão principal, card ou avatar sobreposto ao banner | `0 1px 2px rgb(N / .05), 0 4px 12px -2px rgb(N / .08)` |
| flutuante | `elevation-flutuante-shadow` (apelido `shadow-overlay`), `-bg` = `bg-raised` | barra fixa ao rolar, popover, menu, select, tooltip rico, toast, botão flutuante | `0 2px 4px rgb(N / .05), 0 8px 24px -4px rgb(N / .12)` |
| sobreposto | `elevation-sobreposto-shadow`, `-bg` = `bg-raised` | modal, sheet, painel lateral sobre a página, paleta de comandos | `0 8px 16px rgb(N / .08), 0 24px 64px -12px rgb(N / .22)` |

`N` é o neutro 950 da direção em canais RGB (ou `oklch` com alfa). A **tela principal mostra pelo menos três planos** [N casa] (EXP-46): fundo, superfície e algo à frente (banner com card avançando sobre ele, avatar sobreposto, barra fixa, botão flutuante); flutuante e sobreposto aparecem com a camada aberta ou ao rolar. Mudar de nível (card que sobe ao ser arrastado, hover de card clicável) troca de token, sem sombra intermediária inventada; a mudança anima com `spring-rapida`. *Por quê:* a iteração 3 do dono pede profundidade intencional; sombra em duas camadas lê como luz real, e uma sombra única e grande parece carimbo. *Verificar:* `box-shadow` literal; dois valores de sombra para o mesmo nível; tela principal sem nenhum plano acima da superfície.

**TOK-35** [PR] · P3 — No escuro, **elevação por clareamento de superfície**: cada nível sobe um degrau de luminosidade no seu `-bg` (plano `bg-page` → repouso `bg-surface` → elevado → flutuante → sobreposto, cerca de +0,03 a +0,05 de L em OKLCH por degrau), com realce na borda superior (`inset 0 1px 0 rgb(255 255 255 / .06)`) ou anel branco de 6–10%; a sombra continua, mais escura e mais curta, só para separar a camada do fundo. Remeça os pares de texto em cada degrau (TOK-16). *Por quê:* sombra escura sobre fundo escuro quase não aparece; o olho lê a superfície mais clara como a mais próxima.

**TOK-36** [PR] · P3 — **Gradientes são tokens derivados da marca** (acento, neutros e status da direção), cada um com papel nomeado, sem cor literal. As **paradas da marca** são tokens próprios: `gradient-brand-from` (o acento ou a cor da marca), `gradient-brand-via` (vizinho de matiz a 20–40° em OKLCH, mesmo croma ou menor) e `gradient-brand-to` (o `bg-page` ou um neutro da rampa, para fundir ao fundo), definidas por direção e por modo; os papéis abaixo só combinam essas paradas e os status (EXP-42).

| Token | Papel | Receita inicial |
| --- | --- | --- |
| `gradient-banner` | banner de entrada ou cabeçalho que se funde ao fundo | `linear-gradient(to bottom in oklch, var(--accent-subtle), var(--bg-page))`, ou duas manchas radiais de acento e de um vizinho de matiz em croma baixo sobre `bg-page` |
| `gradient-glow` | brilho do botão principal, destaque de foco | radial de `accent-solid` a 25–40% de alfa atrás ou na borda superior do botão; um pouco mais forte em hover |
| `gradient-live` | estado ao vivo (em rota, em atendimento, gravando) | do sólido do status ao `subtle`, num ciclo lento (3–6 s, `linear`), parado sob movimento reduzido |
| `gradient-frame` | moldura de card ou plano em destaque | borda de 1 px em `linear-gradient` ou `conic-gradient` do acento ao transparente, por `background-clip` ou máscara |

Interpole em `oklch` (`in oklch`) para não passar por cinza no meio; 2 ou 3 paradas bastam. *Quando usar:* banner de entrada personalizado, botão principal da tela, estado vivo, um plano que precisa de destaque, momento de marca. *Alertas:* "gradiente sem papel" (em card comum, fundo de tabela ou todos os botões, tira do gradiente o poder de destacar); matiz alheia à marca (o roxo-azul genérico quando a marca não é roxa nem azul); gradiente animado por `background-position` em superfície grande repinta a cada quadro, então anime `opacity` ou `transform` de um pseudo-elemento. Status num gradiente continua com texto ou ícone (ACE-22).

**TOK-37** [N] · P1 — Texto sobre gradiente, foto ou vídeo cumpre o contraste de TOK-16 no **pior ponto** da área sob o texto, em claro e escuro e nas larguras de inspeção (o recorte da imagem muda com a largura). Quando não cumpre, aplique um **véu medido** (`bg-veil`: gradiente do `bg-page` ou do neutro escuro com alfa só sob o texto, ou painel com desfoque de TOK-23) e anote no `DESIGN.md` o alfa mínimo que passou. Sombra de texto não substitui o véu. Imagem que o usuário troca (capa, banner personalizado) assume o pior caso: véu sempre. *Verificar:* medir o par texto × pixel mais claro da área (texto escuro: o mais escuro); informar par, valor e limiar.

**TOK-38** [PR] · P3 — Textura e ruído são **opcionais** e servem a superfícies grandes de marca (banner, vazio inicial, login, cabeçalho do cliente), tirando o aspecto plástico de um gradiente: ruído SVG (`feTurbulence`) ou bloco PNG pequeno (≤ ~10 KiB) repetido, nos tokens `texture-noise` (a fonte do ruído) e `noise-opacity` (ponto de partida 0,04; faixa 0,02–0,06; no escuro, em geral um pouco menor). *Alertas:* ruído sob dado, tabela ou texto longo atrapalha a leitura; ruído animado custa quadros. Com `prefers-contrast: more` ou `forced-colors`, a textura sai. Meça o contraste com a textura aplicada (TOK-16).

**TOK-42** [PR] · P3 · RECOMENDADO — **Borda de luz no topo, no lugar da linha cinza.** Card e painel elevados ganham um brilho de 1 px no topo (`box-shadow: inset 0 1px 0` em branco a 20–70% no escuro, ou o `--foreground` em mistura baixa no claro) e um contorno interno fraco (`inset 0 0 0 1px` a 6–20%), em vez de uma borda cinza sólida. Vira token de superfície (`--edge-light`), por modo, e respeita `forced-colors` (TOK-22). *Origem:* finance-bento, adjustable-glass-dashboard, liquid-glass-navbar, market-card e peak-chart (`ANALISE.md` do arsenal, padrão 1). *Verificar:* o card elevado tem o realce no topo e nenhuma borda cinza sólida de 1 px em volta.

**TOK-43** [PR] · P3 · RECOMENDADO — **Gradiente vertical com núcleo escuro desfocado**, para o card-herói ou de marca: fundo claro → saturado → claro em 4 paradas dos tokens da marca (TOK-36), com uma forma escura grande e muito desfocada (`filter: blur(60px)`) no meio, para o card parecer aceso pelas bordas. Um por vista, nunca em card de grade densa nem atrás de tabela (IND-02); o texto sobre ele tem contraste medido no pior ponto (TOK-37). *Origem:* finance-bento (cards de cor), peak-chart (sombras que cavam o centro), market-card (campo de brilho com o meio escuro); `ANALISE.md` do arsenal, padrão 2; o template `visao-financeira` já o traz. *Verificar:* no máximo um por vista e contraste medido.

## 8. Tempo de resposta e espera

Três relógios distintos, que não se fundem: o **quadro** (feedback e animação), a **interação** (INP) e a **operação** (indicador, otimismo ou job, conforme `estados-e-ui-otimista.md`).

**TOK-24** [P] · P1 — Limite de feedback após comando: **≤ 100 ms** (pressed, linha pendente, item otimista ou rótulo "Salvando…"). A regra e a medida são de EST-09. *Por quê:* 0,1 s é o limite para parecer instantâneo e dar sensação de manipulação direta; o debounce atrasa a consulta, nunca o eco do campo.

**TOK-25** [N] · P2 — INP no p75 por dispositivo: **≤ 200 ms bom**, ≤ 500 ms precisa melhorar, acima disso ruim; LCP ≤ 2,5 s; CLS ≤ 0,1. É métrica de campo, **não limite perceptivo**: nunca use "200 ms" como limiar de percepção. O INP não mede rede: exija também o estado adequado ao tempo total da operação. Métricas de soft navigation no CrUX são experimentais até a graduação prevista para maio de 2027; registre como contexto, não reprove. Sobe para P1 em interação crítica medida acima de 500 ms.

**TOK-26** [P]/[DS] · P1 — Limiares da espera proporcional: nenhum indicador extra abaixo de ~300 ms (só o feedback do TOK-24); indicador aparece após **~300 ms** e fica visível **pelo menos ~400 ms**; acima de 1 s o indicador é obrigatório e tem texto; acima de 10 s, progresso determinado, estimativa e cancelar; acima de minutos ou por volume, job em segundo plano. Faixas por indicador: skeleton estático até 10 s em tela inteira; spinner local de módulo entre 2 e 10 s; barra acima de 10 s e em arquivos. A árvore de escolha do indicador é de EST-10; jobs, de EST-29. *Por quê:* o atraso e o mínimo evitam o lampejo que parece falha; NN/g, Vercel e Emil convergem nesses números.

## 9. Movimento, molas, toast, tooltip e gesto

Os valores estão na tabela consolidada. Antes de usar qualquer duração, passe pelos portões de frequência e propósito de `movimento.md`: eles escolhem o movimento certo para a frequência, não o removem. Ação frequente ganha resposta curta e interrompível no próprio controle (`spring-rapida`); momento raro pode ter cerimônia. Em superfície 100+/dia, a frequência escolhe a intensidade, não a ausência (MOV-01): ação por teclado entrega o resultado no mesmo quadro (MOV-02), a troca de conteúdo usa o menor movimento que ainda responde (crossfade curto com o shell parado, indicador que desliza) e nada faz a pessoa esperar.

**TOK-27** [PR] · P3 — Um token por papel de curva: `--ease-out` para entrar e sair, `--ease-in-out` para mover na tela, `linear` para progresso e spinner, `ease` para cor; molas em TOK-39. *Alerta:* `ease-in` em entrada ou em resposta a toque parece atraso (começa devagar justo quando a pessoa espera reação); use-o só em saída curta que deixa a tela. Se o projeto tem curvas, use as dele: `cubic-bezier(0.2, 0, 0, 1)` (Material) e `(0.23, 1, 0.32, 1)` (Emil) são equivalentes para este fim.

**TOK-39** [PR] · P3 — Três **molas como token**, com os nomes usados em `movimento.md`:

| Token | Uso | Motion (`type: "spring"`) | Aproximação em CSS |
| --- | --- | --- | --- |
| `spring-rapida` | resposta de controle frequente: press, toggle, check, chip, troca de aba, item que entra numa lista | `visualDuration: 0.2, bounce: 0` | 200 ms com `--ease-out` |
| `spring-padrao` | camada que abre (popover, painel, sheet), card que sobe ao ser arrastado, reordenar | `visualDuration: 0.3, bounce: 0.1` | 300 ms com `linear()` gerado da mola |
| `spring-macia` (gesto) | o que o dedo solta (sheet arremessada, card solto no encaixe), momento raro: conclusão, marco | `visualDuration: 0.45, bounce: 0.2` | 450 ms com `linear()` gerado da mola |

A mola é interrompível e parte da velocidade atual (MOV-16), por isso serve à ação frequente (EXP-09). **Bounce pequeno é permitido onde a personalidade pede** (uma direção calorosa pode levar `spring-padrao` a 0,15 e `spring-macia` a 0,25–0,3, registrado no tema da direção), **mas `spring-rapida` fica sempre em `bounce: 0`**: controle de alta frequência (press, toggle, check, aba, seleção de linha) nunca quica, porque o quique vira atraso e enfeite na quinquagésima vez (requisito do dono). *Alerta:* acima de 0,3 parece mola solta em qualquer lugar. Sob movimento reduzido, a mola vira troca curta de opacidade ou instantânea (MOV-21). Valores são ponto de partida [PR]; o projeto pode ter os seus. *Verificar:* `transition` com duração literal onde cabe um token de mola; `bounce` fora dos três tokens.

**TOK-40** [PR] · P3 — **Pulso de estado ao vivo** (EXP-16, MOV-22) como token: `pulse-duration` 2000 ms por ciclo (faixa 1600–2400 ms; mais rápido parece alarme), `pulse-scale` de 1 a 1,8 no halo, `pulse-opacity` de 0,45 a 0 no halo, curva `ease-out`, infinito só enquanto o estado for ao vivo. O pulso anima `transform` e `opacity` de um pseudo-elemento (halo), nunca o tamanho do texto ou do selo; o ponto central fica parado e legível. Sob movimento reduzido, o halo some e o ponto fica estático. *Alerta:* mais de um pulso por região, ou pulso em estado parado, apaga o sentido de "agora".

**TOK-41** [PR] · P3 — **Padrões de vibração** como token (EXP-11), para celular: `haptic-confirm` = um pulso de 10–15 ms (conclusão, soltar no lugar certo), `haptic-limit` = 8 ms (limite atingido, ponto de atualizar do puxar), `haptic-error` = `[12, 60, 12]` (falha que impede seguir). Na web, `navigator.vibrate` como melhoria progressiva (não existe no Safari do iPhone); em casca nativa, a háptica da plataforma no nível equivalente (leve, médio, notificação de erro). Requisito: a vibração nunca é o único sinal, e nunca dispara a cada toque ou tecla. *Verificar:* com a vibração indisponível, todo estado tem sinal visual.

**TOK-28** [N]/[DS] · P1 — Tempo de toast na tela: sucesso sem ação 4–5 s; com ação ("Desfazer") ≥ 5 s, pausando em hover, foco e aba oculta; erro e aviso crítico **sem tempo** (não se dispensam sozinhos). Donos das regras: erro fora do toast em EST-16, pausa em EST-20, Desfazer também fora do toast em EST-32. *Por quê:* se o Desfazer só existe num toast temporizado, o WCAG 2.2.1 passa a valer; a Atlassian proíbe auto-dispensa em erro crítico.

**TOK-29** [DS] · P3 — Números do tooltip: 1–2 palavras em botão-ícone; offset de 4 px; atraso de entrada pelo padrão da biblioteca instalada, só no primeiro (vizinhos abrem na hora). Nenhum design system publica atraso em ms; o exemplo do Chrome (200 ms entrada, 100 ms saída) não é norma. Donos do resto: comportamento WCAG 1.4.13 em ACE-18; quando usar tooltip ou toggletip em CAM-27; texto do tooltip em TXT-12.

## 10. Alvos de toque

**TOK-30** [N] · P1 — Alvo mínimo **24×24 CSS px** (WCAG 2.5.8 AA). O critério, as exceções e o cálculo do círculo de espaçamento são de ACE-16. *Por quê:* é o único número de alvo que gera P1.

**TOK-31** [DS] · P3 — Recomendação, não critério de falha: **44–48 px** em toque (WCAG 2.5.5 AAA 44×44; HIG 44×44 pt no iOS e 28×28 pt nas outras plataformas; Material 48 dp) e 40 px no desktop onde a densidade permitir. Amplie a área com pseudo-elemento sob `pointer: coarse`, sem mexer na linha densa e sem sobrepor áreas (técnica em `dispositivos-e-entrada.md`).

## 11. Tabela consolidada

| Tema | Valor | Força | Fonte | Posição recomendada |
| --- | --- | --- | --- | --- |
| Escala de espaço | 4, 8, 12, 16, 24, 32, 40, 48 px (+2 óptico) | [PR] | briefing §22; taste | Teto 48 em app |
| Proximidade | interno 4–8; irmãos 12–16; grupos 24–32; grupo ≥ 2× interno | [PR] | briefing §22.2; better-layout | Critério de aceite: ≥ 2× |
| Folga entre controles | 12 px com borda; 24 px entre glifos sem borda | [PR] | better-layout | Ações por linha |
| Espiada de conteúdo oculto | 16–32 px | [PR] | better-layout | Carrossel de KPI e abas roláveis no celular |
| Escala tipográfica | ver seção 4; ≤ ~10 tamanhos; razão ≥ 1,2× | [PR] | briefing §23; code&chill; taste | — |
| Pesos | 400 / 500 / teto 600; ≥ 400 abaixo de 18 px | [PR] | conflito taste × briefing | 600 só em título de página e KPI |
| Entrelinha | sem unidade; ≥ 1,4 em 3+ linhas | [PR] | better-typography | Regra |
| Mínimo HIG | 11 pt iOS/iPadOS; 10 pt macOS | [DS] | HIG Typography | Referência para app nativo |
| Medida de texto corrido | 60–75 caracteres (`65ch`) | [PR] | better-typography | Só observação, ajuda, e-mail; nunca tabela |
| Fontes | ≤ 2 famílias + mono; ≤ 4 arquivos e ~160 KiB no 1º carregamento; variável quando houver | [PR] | taste perf; Fontsource | Orçamento inicial (TOK-13) |
| Critérios de fonte | licença livre no arquivo; ç ã õ e acentos em todos os pesos; `tnum` onde há dados; hospedada no projeto | [N]/[PR] | SIL OFL; TOK-33 | Licença é requisito; o resto, critério |
| Controle | 40 / 32–36 / 44–48 px | [PR] | briefing §24 | Ver seção 5 |
| Linha de tabela | 24, 32, 40, 48, 64 px (Carbon) × 48 / 36–40 (briefing) × 60 (demos) | conflito | Carbon; briefing; code&chill | Padrão 40–48; compacto 32–36 opt-in; 24 só especialista com mouse; 60 só em lista de registros de duas linhas |
| Densidade | −4 dp por passo; alta densidade opt-in | [DS] | Material 2 (M3 não verificado) | Regra |
| Contraste | 4,5:1 texto; 3:1 texto grande e não-texto | [N] | WCAG 1.4.3, 1.4.11 | Critério de falha |
| Contraste AAA | 7:1 | [N] AAA | WCAG 1.4.6 | Recomendação; não reprova |
| APCA | Lc 75 / 60 / 45 / 30 / 15 | [PR] | better-colors | Informativo |
| Daltonismo | até ~4,5% da população | [P] | NN/g | Cor nunca canal único |
| Paleta | neutro 80–95%; 1 acento < ~3% fora de controles; 0–4 status; hues ≥ 15° | [PR] | better-colors; taste | Regra |
| Raio | sharp 4/6/8; soft 8/12/20; aninhado com borda, piso 6 | [PR] | taste; better-ui; briefing §25 | Fórmula com borda, só filho que preenche |
| Elevação | plano / repouso / elevado / flutuante / sobreposto, sombras de duas camadas com a cor do neutro 950; escuro: clareamento de superfície + realce de 6% | [PR] | better-ui; apple-design; EXP-43 | TOK-34, TOK-35 |
| Planos na tela principal | ≥ 3 (fundo, superfície, elevado ou sobreposto) | [N casa] | decisão do dono (iteração 3) | TOK-34 |
| Borda de card | 1 px, 8–14% da tinta, ou anel de sombra | [PR] | taste; better-ui | Uma forma por tipo de card |
| Gradiente | banner, brilho, ao vivo, moldura; `in oklch`; 2–3 paradas; da marca | [PR] | decisão do dono (iteração 3) | TOK-36 |
| Texto sobre imagem ou gradiente | contraste no pior ponto; véu medido | [N] | WCAG 1.4.3 | TOK-37, critério de falha |
| Textura | `noise-opacity` 0,04 (0,02–0,06), bloco ≤ ~10 KiB, só superfície grande de marca | [PR] | EXP-45 | TOK-38, opcional |
| Vidro e desfoque | chrome ≤ ~25% da viewport; dado ≥ 85% opaco; espessuras 8 / 16 / 24 px; rolagem ≤ 2× o sólido | [PR] · demo medido | code&chill Pane | Opcional, com fallback (TOK-23) |
| Feedback após comando | ≤ 100 ms | [P] | NN/g Response Times | Obrigatório |
| Fluxo de pensamento | ≤ 1 s; acima, indicador com texto | [P] | NN/g | Regra |
| Limite de atenção | 10 s; acima, % + estimativa + cancelar | [P] | NN/g | Minutos ou volume: job |
| INP | ≤ 200 bom; ≤ 500 precisa melhorar; > 500 ruim (p75) | [N] | web.dev INP | Métrica, não percepção |
| LCP / CLS | ≤ 2,5 s / ≤ 0,1 (p75) | [N] | web.dev Vitals | Soft navs experimentais até ~05/2027 |
| Tarefa longa | ≤ 50 ms por bloco | [DS] | web.dev RAIL | Heurística (RAIL superado) |
| Escrita de rede | POST/PATCH/DELETE < 500 ms | [DS] | Vercel | Orçamento inicial |
| Atraso do indicador | mostrar após 150–300 ms; mínimo visível 300–500 ms | [DS] | Vercel | ~300 ms de atraso; ~400 ms de mínimo |
| Spinner/shimmer curto | spinner ou shimmer em operação < 300 ms é achado | [PR] | remove-animations | Conciliado pelo atraso |
| Escolha do indicador | skeleton estático < 10 s tela; spinner 2–10 s módulo; barra > 10 s e arquivos; "N de M" | [P]/[DS] | NN/g Skeleton; Carbon | Refetch mantém dados |
| Debounce de busca | 250–400 ms | [PR] hipótese | briefing §28 | Atrasa só a consulta |
| Teclado / 100+ por dia | resultado no mesmo quadro (0 ms de espera); troca de conteúdo com o menor movimento que responde (crossfade ≤ 150 ms, conteúdo já presente); feedback do controle: `spring-rapida` | [PR] | animate; remove-animations; decisão do dono (iteração 3) | MOV-01, MOV-02; foco e seleção seguem visíveis |
| Press | `scale(.97–.985)`, 90–160 ms, ease-out, no `pointerdown` | [PR] | Emil; taste; better-ui | Abaixo de .95 ou em `:disabled` é achado |
| Hover de cor/fundo | entrada 100–150 ms; saída ≈ 0,8× | [PR] | taste; better-ui; briefing | Hover de linha: só fundo, ~100 ms |
| Tooltip (animação) | ~125 ms, `scale(.97)`; vizinhos 0 ms | [PR] | animate | Atraso pela biblioteca |
| Menu / dropdown / popover | entrada 150–200 ms; saída 100–150 ms; origem no acionador | [PR]/[DS] | Emil; taste; Carbon 150 ms | Sem overshoot |
| Acordeão | 200 ms, altura medida + opacidade | [PR] | animate | Acordeão pequeno; linha de tabela abre sem animar altura (custo de layout) |
| Modal | 200–250 ms, origem central, backdrop junto | [PR]/[DS] | animate; Carbon 240 ms | Padrão inicial |
| Painel lateral desktop | 200–280 ms | conciliação | briefing 240 × Emil até 500 | Teto ~300 ms |
| Sheet móvel arrastável | até ~500 ms, `cubic-bezier(0.32, 0.72, 0, 1)` | [PR] | Vaul | Com gesto; no desktop, painel lateral de 200–280 ms |
| Drawer flutuante pequeno | ~200 ms | [PR] | Vaul | — |
| Toast (animação) | 200–400 ms (Sonner 400 `ease`; Carbon 240) | conflito | Sonner; Carbon | Nenhum dos dois é achado |
| Indicador de navegação ativa | desliza com `spring-rapida` (sem quique); `aria-current` e conteúdo imediatos | [PR] | code&chill; animate; decisão do dono (iteração 3) | Abas locais ocasionais: `spring-padrao` (MOV-05, NAV-14) |
| Saída | ≈ 0,8× a entrada (150–200 ms), simultânea; remover instantâneo é válido | [PR] | Emil; better-ui | Simetria só é achado em press/hold |
| Teto geral de UI | < 300 ms fora de modal, drawer, sheet e toast | [PR] | review-animations | Acima: reduzir para 200–250 |
| Stagger | tela diária: bloco único ou stagger mínimo (≤ 30 ms por item, total ≤ 150 ms), só na primeira entrada da tela, nunca em refetch nem em menu reaberto; raro: onda de até ~60 ms por bloco, total ≤ ~500 ms | [PR] | choreograph; conflito better-ui; decisão do dono (iteração 3) | Alerta de uso consciente (MOV-05, MOV-29) |
| Troca de vista com alturas diferentes | `clamp(150ms, Δaltura/500, 270ms)` | [PR] | choreograph | Painel que troca de registro |
| Hold-to-confirm | 2 s `linear` ao segurar; volta em 200 ms ease-out | [PR] | Emil | Só adicional, com alternativa por teclado |
| Curvas | out `(0.23,1,0.32,1)`; in-out `(0.77,0,0.175,1)`; drawer `(0.32,0.72,0,1)`; linear em progresso | [PR] | emil-design-eng | Tokens do projeto primeiro |
| Curva standard Material | `cubic-bezier(0.2, 0, 0, 1)` | [DS] | Material 3 (MDC) | Equivalente aceitável |
| Mola | `spring-rapida` 0,2 s, bounce 0 (sempre); `spring-padrao` 0,3 s, bounce 0,1; `spring-macia` (gesto) 0,45 s, bounce 0,2; bounce até 0,3 se a direção pede, nunca na rápida; Apple: amortecimento 1,0, resposta 0,3–0,4 s | [PR] | animate; apple-design; Motion; EXP-09 | TOK-39 |
| Pulso ao vivo | ciclo 2 s (1,6–2,4); halo escala 1 → 1,8, opacidade 0,45 → 0; um por região | [PR] | EXP-16 | TOK-40 |
| Vibração | confirmar 10–15 ms; limite 8 ms; erro `[12, 60, 12]`; nunca sinal único | [PR] | EXP-11 | TOK-41 |
| Orçamento de quadro | 16,7 ms (60 Hz) / 8 ms (120 Hz) | técnico | animation-performance | Projetar para 8 ms |
| Blur animado | < 20 px (2–5 px bastam); só na entrada de camada rara | [PR] | animation-performance | Alerta de desempenho |
| Gesto: dispensar | velocidade > ~0,11 px/ms ou ~40–50% do curso | [PR] | gestures; Emil | Usar biblioteca |
| Gesto: direção | histerese ~10 px | [PR] | apple-design | — |
| Arrastar no toque | segurar 280–350 ms com pré-escala .975; cancelar se andar > 8–10 px; mouse 5–6 px | [PR] · demo | code&chill | Com alternativa "Mover para…" |
| Toast (tempo na tela) | sucesso 4–5 s; com ação ≥ 5 s com pausa; erro persistente | [N]/[DS] | WCAG 2.2.1; Carbon 5 s; Atlassian; Sonner 4 s | Ver TOK-28 |
| Confirmação "Copiado" | check por ~1,5–2 s + `aria-live` polido | [PR] não verificado | better-ui (lacuna) | Padrão inicial |
| Tooltip (comportamento) | Esc fecha, hoverable, persistente | [N] | WCAG 1.4.13 | Regra |
| Tooltip (conteúdo) | 1–2 palavras; offset 4 px; sem interativos | [DS] | Carbon; Fluent 2 | Regra |
| Tooltip (atraso) | exemplo 200 ms entrada / 100 ms saída | plataforma | Chrome `interestfor` | Usar padrão da biblioteca |
| Alvo mínimo | 24×24 CSS px com exceções | [N] | WCAG 2.5.8 | Critério de falha |
| Alvo de toque | 44–48 px; desktop 40 | [DS] | WCAG 2.5.5 AAA; HIG; Material | Recomendação |
| Reflow | 320 CSS px de largura; 256 CSS px de altura | [N] | WCAG 1.4.10 | Ver `dispositivos-e-entrada.md` |
| Zoom de texto | 200% | [N] | WCAG 1.4.4 | Regra |
| Input no iOS | fonte ≥ 16 px; nunca `user-scalable=no` | [PR] | mobile-native | Regra (evita zoom) |
| Classes de janela | < 600 / 600–839 / ≥ 840 dp | [DS] | Android large screens | Referência |
| Lista-detalhe | lado a lado ≥ 641 epx; empilhado 320–640 | [DS] | Microsoft | Decidir pela largura do contêiner |
| Shell | sidebar 240–256; recolhida 64–72; barra superior 56–64 | [PR] | briefing §27 | Padrão inicial (TOK-32) |
| Degraus da navegação | trilho 76 px a partir de ~1100 px; barra inferior a partir de ~760 px | [PR] · demo | code&chill Pane | Padrão inicial; o conteúdo decide o ponto (DIS-01) |
| Margem do conteúdo | 24–32 desktop; 24 tablet; 16 celular | [PR] | briefing §27 | Padrão inicial |
| Busca e toolbar | busca 280–360 px; controles 40 px; 8 px entre eles | [PR] | briefing §28 | Padrão inicial |
| Colunas de tabela | checkbox 40–48; status 120–160; data 120–144; ações 40–48; padding 16 (12) | [PR] | briefing §29 | Padrão inicial |
| Formulário | largura máxima 640–720 px | [PR] | briefing §32 | Padrão inicial |
| Painel lateral / modal | 400–560 px | [PR] | briefing §33 | Padrão inicial |
| Área de gráfico | 240–320 px de altura | [PR] | briefing §30 | Padrão inicial; testar legibilidade |
| Larguras de inspeção (não breakpoints) | 320×640; 360×800; 390×844; 844×390; 768×1024; 1024×768; 1366×768 (zoom 125/150/200%); 1920×1080; 2560×1080; janela intermediária com sidebar | [PR] | briefing §92 | Matriz de teste e protótipo |
| Divulgação progressiva | ≤ 2 níveis | [P] | NN/g | `formularios-e-camadas.md` |

## 12. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| Hex, `rgb(`, `oklch(` literal em componente | Token semântico; literal só na camada de primitivos |
| `--color-text-2`, `--color-blue-button`, `bg-blue-600` em componente | Renomear por papel (TOK-03) |
| `line-height: 20px` ou em `rem` | Entrelinha sem unidade (TOK-09) |
| `font-size` em px num tamanho fora da escala, meio pixel | Passo da escala em `rem` (TOK-08) |
| `font-feature-settings: "tnum"` | `font-variant-numeric: tabular-nums` (TOK-11) |
| `font-weight: 700` como padrão de título | 600 no máximo; 500 em título de componente (TOK-10) |
| Texto essencial em 11 px ou "cinza pequeno" | Papel de metadado com contraste medido (TOK-12, TOK-16) |
| `bg-success/10` com texto sem medição | Medir o renderizado ou usar token sólido (TOK-16) |
| Acento e info com a mesma matiz | Separar ≥ 15° ou info em neutro (TOK-18) |
| A mesma sombra forte em todo card, campo e botão | Sombra pelo nível: repouso no card parado, níveis maiores só no elevado e nas camadas (TOK-22, TOK-34) |
| Tela principal toda num plano, sem banner, sobreposição nem elevação | Três planos: fundo, superfície e um elevado ou sobreposto (TOK-34) |
| `box-shadow` literal; sombra única, grande e preta | Token do plano, em duas camadas, com a cor do neutro (TOK-34) |
| Elevação no escuro só com sombra preta | Clareamento de superfície e realce de borda (TOK-35) |
| `linear-gradient` com hex literal; gradiente em card comum ou em todos os botões | Token de gradiente com papel (TOK-36) |
| Texto sobre foto ou gradiente sem medição; `text-shadow` como correção | Véu medido no pior ponto (TOK-37) |
| Ruído atrás de tabela ou texto longo | Textura só em superfície grande de marca (TOK-38) |
| Borda e anel misturados em cards equivalentes | Uma forma por tipo de card (TOK-22) |
| Filho com o mesmo `rounded-*` do pai com padding | Raio aninhado com borda, piso 6 (TOK-21) |
| `backdrop-filter` em área de dados ou sem `@supports`/`prefers-reduced-transparency` | Sólido ≥ 85% e fallbacks (TOK-23) |
| Linha de tabela compacta como padrão para todos | Padrão 40–48; compacto opt-in persistido (TOK-14) |
| Spinner que aparece em 0 ms e some em 80 ms | Atraso ~300 ms e mínimo ~400 ms (TOK-26) |
| Toast de erro com `duration` finita; Desfazer só no toast | Persistente; ação também fora do toast (TOK-28) |
| Ícone de 16 px sem área de toque ampliada em `pointer: coarse` | Área ≥ 24×24 com exceção medida; recomendação 44 (TOK-30, TOK-31) |
| `bg-green-100 text-green-800` em selo de status | Variante do Badge com token semântico (`bg-success-subtle text-success-text`) (`stack-e-bibliotecas.md`, STK-11) |
| `--primary` com valor literal no CSS do tema do shadcn | Gerado dos semânticos, em claro e escuro (STK-10) |
| Fonte carregada de `fonts.googleapis.com` no build; família sem ç, ã ou õ no peso usado | Fontsource ou arquivo local; outra família (TOK-33) |
| `DESIGN.md` sem motivo da fonte; título serifado + Inter por hábito | Motivo e candidatas comparadas (TOK-13, PER-18) |
| Pulso em estado parado, vários pulsos na mesma região, vibração a cada toque | Pulso só no ao vivo, um por região; vibração só em conclusão e limite (TOK-40, TOK-41) |
| `ease-in` em entrada; `bounce` solto fora dos tokens; quique em controle frequente | `--ease-out`; `spring-rapida`, `spring-padrao`, `spring-macia` (TOK-27, TOK-39) |

## 13. Fontes

- NN/g — [Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/); [Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/); [Progress Indicators](https://www.nngroup.com/articles/progress-indicators/); [Dashboards preattentive](https://www.nngroup.com/articles/dashboards-preattentive/)
- web.dev — [INP](https://web.dev/articles/inp); [Web Vitals](https://web.dev/articles/vitals); [RAIL](https://web.dev/articles/rail); [CrUX soft navs](https://web.dev/blog/crux-experimental-soft-navs)
- W3C WCAG 2.2 — [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html); [1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html); [2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html); [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
- Carbon — [Data table style](https://carbondesignsystem.com/components/data-table/style/); [Loading](https://carbondesignsystem.com/patterns/loading-pattern/); [Notification](https://carbondesignsystem.com/components/notification/usage/); [Motion](https://carbondesignsystem.com/elements/motion/overview/); [Tooltip](https://carbondesignsystem.com/components/tooltip/usage/)
- [Atlassian — Flag](https://atlassian.design/components/flag/usage); [Atlassian — Design tokens](https://atlassian.design/foundations/tokens/design-tokens); [Fluent 2 — Tooltip](https://fluent2.microsoft.design/components/web/react/core/tooltip/usage)
- [Material — Density](https://material.io/design/layout/applying-density.html); [MDC Android Motion](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Motion.md)
- Apple HIG — [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility); [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Microsoft — List/details](https://learn.microsoft.com/windows/apps/design/controls/list-details); [Android — Large screens](https://developer.android.com/design/ui/large-screens)
- [Chrome — Interest invokers](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/interest-triggered-action-previews)
- Tipografia · [Fontsource: Install](https://fontsource.org/docs/getting-started/install); [Astro: Fonts](https://docs.astro.build/en/guides/fonts/) (lidos em nov/2026); [SIL Open Font License](https://openfontlicense.org/) (não reaberto)
- Movimento · [Motion: Spring](https://motion.dev/docs/spring) (não reaberto nesta redação; `visualDuration` e `bounce` conforme a API conhecida em nov/2026)
- Decisões do dono da skill, iteração 3 (16/11/2026): tipografia ampla sem lista negra; profundidade, gradiente e camadas; proibições de estilo trocadas por alertas de uso consciente
- Skills instaladas (praticante): `emil-design-eng`, `animate`, `choreograph`, `review-animations`, `remove-animations`, `animation-performance`, `gestures`, `mobile-native`, `better-ui`, `better-typography`, `better-colors`, `better-layout`, `design-taste-frontend`; demos code&chill (medições do estudo "Incorporação dos estudos ao playbook", nov/2026)

Lacunas: os valores de sombra, gradiente, textura e mola de TOK-34 a TOK-41 são ponto de partida de prática, sem medição própria; ajuste-os na folha do sistema de cada direção. A API de fontes do Astro foi lida na documentação atual; a versão em que deixou de ser experimental não foi conferida.
