# Dispositivos e entrada (DIS)

Cobre composição pelo espaço disponível e por contêiner, altura e viewport, teclado virtual, safe areas, zoom e texto ampliado, entrada híbrida (toque, mouse, teclado, caneta), o checklist de "parece app nativo no celular", a matriz de teste e o suporte de recursos datado. Não cobre números de tamanho, alvo e largura de inspeção (`fundamentos-e-tokens.md`), qual superfície de camada usar e como ela achata no celular (`formularios-e-camadas.md`), tabela e filtros em detalhe (`listagens-e-filtros.md`), shell e navegação (`navegacao-e-estrutura.md`), auditoria WCAG e atalhos de teclado (`acessibilidade.md`) nem a animação em si (`movimento.md`).

Formato das regras: **ID** [selo] · prioridade mínima — regra. *Por quê* e *Verificar* quando ajudam. As regras valem para todas as pontas; a ponta do cliente, quase sempre no celular, é onde o checklist da seção 6 mais pesa, e o painel do operador visto no iPad é onde ele mais falha.

Ordem de trabalho: entender a tarefa → identificar espaço, entrada e ambiente → definir escala → compor → escolher melhoria opcional → testar.

## 1. Composição pelo espaço e pelo contêiner

**DIS-01** [DS] · P2 — Decida o layout pela área CSS disponível, nunca pela marca do aparelho, user agent ou resolução física. Breakpoint nasce do conteúdo: mantenha o layout expandido até ele deixar de caber. As larguras de inspeção de `fundamentos-e-tokens.md` são amostras de teste, não breakpoints. Lista e detalhe lado a lado a partir de ~641 epx, decidido pela largura útil do contêiner, não da janela. *Por quê:* 844×390 não é desktop só por ser largo, e um tablet largo continua sendo usado com toque.

**DIS-02** [DS] · P3 — Componente se adapta ao contêiner (container queries): o card de KPI dentro do painel lateral responde à largura do painel. Duas armadilhas: a query não estiliza o próprio contêiner, e `container-type: inline-size` num item flex sem largura colapsa a zero. Container size queries são Baseline amplamente disponível (seção 8).

**DIS-03** [N] · P2 — Ordem visual igual à do DOM em todas as larguras: nada de `order`, `row-reverse` ou `grid-area` reordenando KPIs ou blocos no celular (WCAG 1.3.2 e 2.4.3). Se a prioridade muda no celular (pendências antes do gráfico), reordene no DOM. *Verificar:* grep das três propriedades + caminhada de Tab a 390 px.

**DIS-04** [PR] · P2 — Filho flex ou grid com texto longo leva `min-width: 0` (ou `minmax(0, 1fr)`), e a ação final leva `flex-shrink: 0`. Altura de contêiner de texto é `min-height`, nunca `height`. *Por quê:* sem isso, uma razão social ou um e-mail longo empurra a coluna de status para fora (blowout de 560 px medido num demo).

**DIS-05** [PR] · P3 — Shell responsivo de app: sidebar → trilho de ícones → tab bar inferior com "Mais" em sheet e busca separada; abas roláveis com rolagem automática até a ativa e espiada do próximo item; board com `scroll-snap-type: x mandatory` e a próxima coluna espiando. O painel de detalhe abre sempre do mesmo lado. Regras de navegação em `navegacao-e-estrutura.md`. Tabela no celular: cabeçalho e primeira coluna fixos, overflow visível e seletor de colunas; cards só quando a tarefa é ver um registro por vez (`listagens-e-filtros.md`).

**DIS-22** [N casa] · P1 · QUANDO (tela de operação usada no celular) — **O operador no celular tem layout próprio**, não a versão de desktop encolhida. Abaixo de 768 px, a tela de operação (agenda, fila, quadro, OS, caixa) mostra obrigatoriamente **uma coluna por vez**: abas ou controle segmentado entre as vistas (por exemplo, "Agora", "Agenda", "Na cadeira"), ou **lista → detalhe** em telas separadas com Voltar (NAV-21), e a ação principal no rodapé com safe area (DIS-07, DIS-09). Colunas espremidas, a grade de agenda de seis colunas a 375 px e a tabela com rolagem horizontal como forma principal são achado. Coluna que decide no desktop vira aba ou seção no celular, nunca some (EXP-59). *Por quê:* na iteração 3, a agenda do operador só encolhia a versão de desktop, e a versão anterior da skill tinha telas próprias de celular e tablet. *Verificar:* a 390×844, cada tela de operação mostra uma coluna por vez, sem rolagem horizontal da página (B1), e cada informação da versão desktop está em alguma aba ou tela.

## 2. Altura, viewport e teclado virtual

**DIS-06** [DS] · P2 — Escolha a unidade de altura pela função: `100dvh` no shell do app, em sheets e drawers; `100svh` numa primeira dobra que precisa caber com as barras abertas; `lvh` quase nunca. `100vh` no shell é achado. Conteúdo maior que a tela cresce e rola, sem altura fixa cortando o fim. *Por quê:* no celular, `100vh` mede a viewport com a barra de URL recolhida e esconde o botão fixo embaixo. `dvh` não resolve o teclado; teste-o à parte (DIS-08).

**DIS-07** [N]/[DS] · P1 — Modal e sheet usam `max-height: 100dvh`, corpo rolável e **ações fora da área rolável**; a ação primária fica em chrome estável (rodapé sticky com safe area). Teste também pouca altura: conteúdo de rolagem horizontal deve funcionar a **256 CSS px** de altura (WCAG 1.4.10), e paisagem 844×390 pede cabeçalho econômico ou detalhe em página. *Por quê:* "Salvar" encoberto no celular impede a tarefa.

**DIS-08** [DS] · P1 — Com o teclado virtual aberto, o campo focado, o erro dele e o comando que conclui continuam alcançáveis. Uma barra fixa que fica atrás do teclado muda de estratégia (rolagem normal, ação no fluxo), não ganha `z-index`. Para medir a área visível use `VisualViewport`, sabendo que ela também encolhe com zoom: não infira teclado pela altura sozinha. `interactive-widget=resizes-content` é melhoria, não pré-requisito; a VirtualKeyboard API é só Chromium e, com `overlaysContent`, a oclusão vira sua responsabilidade (suporte na seção 8). Nenhum rascunho some quando a viewport muda. *Verificar:* focar o último campo, provocar erro, trocar de campo, fechar o teclado, girar e salvar.

## 3. Safe areas

**DIS-09** [DS] · P2 — `viewport-fit=cover` só quando o layout trata os insets. Aí, `env(safe-area-inset-*, 0px)` dentro de `calc()` em header fixo, barra inferior, tab bar, **toasts, sheets** e botão flutuante, com **um único responsável** pelo inset (shell ou barra, nunca os dois). Fundo e mídia sangram até a borda; controles ficam dentro das margens. Os insets são físicos: em RTL, troque o lado num override. Safe area não mede o teclado. *Verificar:* retrato, paisagem e app instalado, se houver; a última linha e a última ação ficam acessíveis.

## 4. Zoom e texto ampliado

**DIS-10** [N] · P1 — Nunca bloqueie zoom: nada de `user-scalable=no` nem `maximum-scale`. O texto chega a **200%** (WCAG 1.4.4) e o layout reflui a **320 CSS px** de largura sem perder conteúdo nem função (1.4.10); tabelas, mapas e código rolam no próprio contêiner. *Verificar:* 1366×768 com zoom de 200% real (não o zoom da prévia do DevTools) e 320×640.

**DIS-11** [PR] · P2 — Escala que acompanha a preferência: tamanhos em `rem` (`fundamentos-e-tokens.md`), media queries em `rem` ou `em` para o layout mudar quando a fonte do navegador aumenta, controles que crescem com o texto (um campo de 40 px não corta texto ampliado), e nenhuma animação para altura medida no tamanho padrão. `-webkit-text-size-adjust: 100%` evita a inflação de fonte em paisagem sem bloquear o zoom. Teste também a escala de texto e de tela do Android.

**DIS-12** [N]/[PR] · P1 — Texto truncado tem caminho de volta por teclado e toque: expandir, detalhe ou tooltip acionável por foco. `title` só no hover não conta. Nunca trunque número, valor, data ou o que se compara. *Por quê:* a razão social e o número de processo cortados sem acesso escondem justamente o dado que distingue um registro (WCAG 2.1.1 quando o valor completo não tem outra rota).

## 5. Entrada híbrida

**DIS-13** [N] · P1 — Contrato de entrada: toque simples para os comandos comuns; hover só complementa; teclado é caminho completo (WCAG 2.1.1); gesto é atalho com alternativa (2.5.1 para gesto de trajetória ou multiponto; 2.5.7 para arrastar, com "Mover para…" ou botões acima/abaixo). Ação que só aparece no hover da linha é inalcançável no toque: mostre-a sempre ou ponha-a num menu "⋯" com nome acessível. *Por quê:* toque e mouse não são exclusivos; num iPad com trackpad ou notebook com tela touch, os dois chegam juntos.

**DIS-14** [DS] · P3 — Detecte capacidade com media query, nunca com user agent ou largura: `pointer` e `hover` descrevem a entrada principal, `any-pointer` e `any-hover` as disponíveis. `pointer: coarse` não é detector de celular nem `hover: hover` dispensa toque. Prefira CSS a JS: um `useIsTouchDevice()` para esconder hover é a ferramenta errada.

**DIS-15** [PR] · P3 — Arrastar no toque: segure 280–350 ms com pré-escala como aviso e cancele se o dedo andar além do limiar antes (a rolagem vence); no mouse, comece após poucos pixels (valores na tabela de tokens). `touchmove` só chama `preventDefault` depois que o arrasto começou; trate `pointercancel`; capture o ponteiro e ignore toques extras. A instrução muda com o dispositivo: "Arraste um card" é falso no toque com arrasto desligado.

**DIS-16** [PR] · P3 — Área de toque ampliada por pseudo-elemento (`::after` com inset negativo) sob `pointer: coarse`, no `<button>` ou `<label>`, nunca no `<input>`, sem mudar a linha densa e sem sobrepor áreas vizinhas. Camadas decorativas levam `pointer-events: none`. O mínimo de 24×24 com exceção de espaçamento e a recomendação de 44–48 estão em `fundamentos-e-tokens.md`.

**DIS-17** [PR] · P2 — Sheet, drawer e swipe usam a biblioteca já instalada (Vaul em projeto shadcn) em vez de reimplementar. O comportamento mínimo é este:
- com o dedo baixado, segue 1:1, sem easing nem mola;
- ao soltar, fecha por distância **ou** velocidade e herda a velocidade;
- é interrompível e fecha na direção em que entrou;
- overlay e escala do fundo derivam do mesmo valor de arraste;
- filhos interativos não iniciam arraste (`data-vaul-no-drag`).

Gesto nunca é o único caminho: há botão Fechar, Esc e Voltar (regras da superfície em `formularios-e-camadas.md`). Sob movimento reduzido, o rastreamento 1:1 continua; saem momento e bounce. *Por quê:* um sheet bem feito são "semanas de casos de borda".

## 6. Checklist "parece app nativo no celular"

**DIS-18** [PR] · P2 — Toda ponta exposta em celular ou tablet passa pela linha de base abaixo. Cada item tem assinatura textual e vira checagem por grep. P2 nos itens que escondem ação ou disparam zoom (4, 3); P3 nos demais.

| # | Sintoma | Correção | Assinatura para grep |
| --- | --- | --- | --- |
| 1 | Hover preso após o toque | Hover de cor e fundo sob `@media (hover: hover)`; com movimento, também `(pointer: fine)` (`movimento.md`); `(hover: none)` zera hovers. Tailwind 4 já embrulha `hover:`; no 3, ligar `hoverOnlyWhenSupported` | `:hover` fora de media query |
| 2 | Flash cinza ou azul ao tocar | `-webkit-tap-highlight-color: transparent` **e** `:active` próprio em todo tocável, senão some o único feedback | ausência de `:active` |
| 3 | Botão fixo sob a barra, altura errada | `100dvh` no shell (DIS-06) | `100vh` |
| 4 | Página dá zoom ao focar um campo | Fonte de input ≥ 16 px sob `pointer: coarse` (`max(16px, 1em)` ou `text-base sm:text-sm`), inclusive os campos compactos de 14 px da toolbar desktop vista no iPad | `font-size` < 16 px em `input`, `select`, `textarea` |
| 5 | Teclado errado | `type` certo (`email`, `tel`), `inputmode` (`numeric` em CPF, CEP e código; `decimal` em dinheiro), `enterkeyhint` (`search`, `done`, `send`, `next`), `autocapitalize="none"`, `autocorrect="off"` e `spellcheck="false"` em código e e-mail, `autocomplete` válido. `inputmode` é dica, não validação; `type="number"` só para quantidade real | campo sem `inputmode` ou `enterkeyhint` |
| 6 | Toque lento, duplo toque dá zoom | `touch-action: manipulation` em `button`, `a`, `[role=button]`; `pan-y` em trilho horizontal; `none` só na superfície do gesto | `touch-action: none` em contêiner amplo |
| 7 | Pull-to-refresh ou rubber band sequestra a rolagem | `overscroll-behavior: contain` em sheet, painel, menu, chat e lista lateral roláveis; `none` no root só em app shell com rolagem própria (página de documento pode querer o pull-to-refresh nativo); nunca `touchmove` + `preventDefault` global | ausência em overlay rolável |
| 8 | Conteúdo cortado no notch ou no indicador de início | Safe areas (DIS-09) | `position: fixed` com `bottom: 0` sem `env(` |
| 9 | Pressão longa seleciona o rótulo ou abre callout | `user-select: none` e `-webkit-touch-callout: none` **só em controles** (botão, aba, chip, alça), nunca em `body`, linha ou contêiner: no CRM o usuário copia nome, e-mail e ID | `user-select: none` em `body` ou linha |
| 10 | Barra de status com cor errada | `<meta name="theme-color">` por `prefers-color-scheme` (cor do topo do header, não da marca) + `color-scheme: light dark`; atualizar por JS se o tema for por classe; `theme_color` e `background_color` no manifest | ausência de `theme-color` |
| 11 | Fonte infla em paisagem | `-webkit-text-size-adjust: 100%` | ausência |
| 12 | Zoom bloqueado | Meta viewport `width=device-width, initial-scale=1` (+ `viewport-fit=cover` se tratar insets); nada de `maximum-scale` (DIS-10) | `user-scalable=no`, `maximum-scale` |
| 13 | Feedback só por vibração | Vibration API não existe no Safari iOS; vibração nunca é canal único | `navigator.vibrate` sem par visual |

## 7. Matriz de teste: real × emulado

**DIS-19** [DS] · P2 — Teste pelas larguras de inspeção de `fundamentos-e-tokens.md` (incluindo 320×640, 844×390 em paisagem, 1366×768 com zoom de 125%, 150% e 200%, texto ampliado e uma janela intermediária com sidebar aberta e detalhe), e registre por teste:
- sistema, navegador e versão;
- ambiente **real, emulado ou simulado**;
- viewport de layout e visual quando importar, DPR, zoom, ajuste de texto;
- entrada, estado dos dados, tarefa, resultado e limitações.

"Testado no iPhone" só vale para Safari iOS num aparelho ou simulador, nunca para uma janela Chrome com preset de iPhone. Screenshot não é teste de responsividade.

Cobertura inicial de navegadores: Chromium desktop; Safari em iPhone; Chrome Android; Samsung Internet se estiver no público (fica fora do conjunto Baseline); Firefox para Gecko; tablet com entrada híbrida quando pertinente. Num Galaxy, Samsung Internet e Chrome são testes separados.

A emulação do DevTools não reproduz:
- hover pegajoso e tap highlight;
- o efeito da barra de URL nas unidades de altura;
- zoom ao focar input, atraso de clique e overscroll;
- safe areas e teclado virtual (inclusive flutuante ou dividido);
- GPU fraca e pouca memória (throttling simula só CPU).

Para isso use aparelho real (IP da rede local, Safari Web Inspector, `chrome://inspect`), de preferência um intermediário de alguns anos atrás, ou simulador. O relatório separa "verificado no código" de "precisa de aparelho".

Inclua cenários de retomada: alternar de app e voltar, bloquear e desbloquear, Voltar com teclado ou camada aberta, girar. Nada de reenvio, sucesso fictício ou rascunho perdido.

**DIS-20** [DS] · P3 — Dobráveis: abrir, fechar e redimensionar já exige layout contínuo e sem reset do trabalho. Dois painéis só quando cada segmento tem área útil, sem texto ou botão essencial sobre a dobra, e com alternativa sem detecção de segmento. Viewport Segments é Chromium 138+ (a API mudou do trial para `window.viewport.segments`); tutoriais antigos com flags são históricos. Anote se o teste cobriu só redimensionamento ou também postura em aparelho real.

## 8. Suporte de recursos (nov/2026)

Situação conferida na base em **novembro de 2026** (webstatus.dev e MDN BCD). Próxima revisão sugerida: **maio de 2027**, junto com a graduação das métricas de soft navigation.

| Recurso | Situação | Use como |
| --- | --- | --- |
| Container size queries | Baseline amplo (desde 14/08/2025) | Padrão |
| `svh` / `lvh` / `dvh` | Baseline amplo (desde 05/06/2025; Safari 15.4) | Padrão |
| Intersection Observer | Baseline amplo (desde 2021) | Padrão |
| Popover API | Baseline recente desde 27/01/2025 (Safari iOS 18.3); amplo previsto ~jul/2027 | Seguro nos motores atuais; confira iOS < 18.3 |
| View Transitions (mesmo documento) | Baseline recente desde 14/10/2025 (Firefox 144) | Melhoria progressiva |
| View Transitions entre documentos | Limitado: Chrome/Edge 126, Safari 18.2, Firefox só preview | Melhoria progressiva |
| Navigation API | Baseline recente desde 13/01/2026 (Chrome/Edge 102, Firefox 147, Safari 26.2) | Usável com fallback de `history` |
| `scrollbar-gutter` | Baseline recente desde 11/12/2024; amplo previsto ~jun/2027 | Usável |
| Anchor positioning | Dados conflitantes: BCD dá o básico (`anchor-name`, `anchor()`) nos três motores desde jan/2026; webstatus classifica como limitado; `position-anchor` só nas versões de 2026 | Básico com teste; recursos novos como melhoria |
| `interestfor` (interest invokers) | Limitado, só Chromium (BCD: Chrome 142; webstatus: 149) | Melhoria com polyfill |
| `interactive-widget` | Chrome Android 108, Firefox Android 133, Samsung 21; desktop não; Safari 27.3 em beta, não confirmado | Melhoria; testar o teclado sem depender dele |
| VirtualKeyboard API | Limitado, Chromium 94+ (Samsung 17) | Não usar como pré-requisito |
| Viewport Segments | Limitado, Chromium 138+ | Melhoria |
| Long Animation Frames | Limitado, Chromium 123+ | Diagnóstico; sem ele, use trace |
| `text-box: trim-both` | Chromium 133+, Safari 18.2+, sem Firefox | Melhoria |
| `transition-behavior` com `overlay` | Só Chromium | Melhoria |

**DIS-21** [DS] · P2 — Adote por recurso, não por marca. Recurso visual novo é melhoria progressiva com fallback que conclui a tarefa. Não reprove o produto por não usar uma API nova. Reprove o fluxo essencial que depende de uma API sem alternativa num ambiente suportado (P1 quando a tarefa para). *Verificar:* desligue o recurso (ou use um motor sem ele) e conclua o fluxo.

## 9. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| Breakpoint por nome de aparelho, `navigator.userAgent` para layout | Área CSS e conteúdo (DIS-01) |
| Card de KPI que muda por `@media` de viewport dentro de painel lateral | Container query (DIS-02) |
| `order`, `row-reverse`, `grid-area` reordenando no celular | Reordenar no DOM (DIS-03) |
| Tela de operação no celular com as colunas do desktop espremidas | Uma coluna por vez, abas ou lista → detalhe (DIS-22) |
| Filho flex com texto longo sem `min-width: 0` | `min-width: 0`, ação com `flex-shrink: 0` (DIS-04) |
| `height: 100vh` no shell, sheet ou drawer | `100dvh` (DIS-06) |
| Modal com botões dentro da área rolável | Ações fora da rolagem, `max-height: 100dvh` (DIS-07) |
| Barra fixa inferior com campo de texto e sem teste de teclado | Ação no fluxo; testar com teclado aberto (DIS-08) |
| `viewport-fit=cover` sem nenhum `env(safe-area-inset` | Tratar insets ou remover o `cover` (DIS-09) |
| Inset somado no shell e na barra | Um único responsável (DIS-09) |
| `user-scalable=no`, `maximum-scale=1` | Remover (DIS-10) |
| `@media (min-width: 768px)` em px para trocar layout | Media query em `rem`/`em` (DIS-11) |
| Célula com `text-overflow: ellipsis` e só `title` | Caminho por teclado e toque (DIS-12) |
| Ações da linha só com `:hover` / `group-hover` | Visíveis ou em "⋯" (DIS-13) |
| `useIsTouchDevice()`, `'ontouchstart' in window` para estilo | `pointer` / `hover` / `any-pointer` (DIS-14) |
| `touchmove` com `preventDefault` desde o primeiro evento | Só após o arrasto começar (DIS-15) |
| Sheet artesanal sem velocidade, overlay ligado ou focus trap | Biblioteca instalada (DIS-17) |
| Itens da seção 6 ausentes | Linha de base do DIS-18 |
| Relatório "testado no iPhone" feito no DevTools | Declarar emulado; testar em Safari iOS (DIS-19) |
| Fluxo que exige Popover, anchor ou View Transition sem fallback | Fallback que conclui a tarefa (DIS-21) |

## 10. Fontes

- W3C WCAG 2.2 — [1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html); [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html); [2.5.7 Dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html); [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- WebKit — [Viewport units (Safari 15.4)](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/); [Designing for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/); [Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/)
- Chrome — [Viewport resize behavior](https://developer.chrome.com/blog/viewport-resize-behavior); [VirtualKeyboard](https://developer.chrome.com/docs/web-platform/virtual-keyboard); [Viewport Segments](https://developer.chrome.com/blog/viewport-segments-api-shipped); [Device Mode](https://developer.chrome.com/docs/devtools/device-mode)
- MDN — [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport); [pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/pointer); [any-pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/any-pointer); [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action); [inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode); [meta viewport](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)
- [web.dev — Viewport units](https://web.dev/blog/viewport-units); [web.dev — Baseline](https://web.dev/baseline); [webstatus.dev](https://webstatus.dev/); [MDN browser-compat-data](https://github.com/mdn/browser-compat-data)
- [Apple — Safari Responsive Design Mode](https://developer.apple.com/documentation/safari-developer-tools/responsive-design-mode); [Samsung — Remote Test Lab](https://developer.samsung.com/remote-test-lab)
- [NN/g — Mobile Tables](https://www.nngroup.com/articles/mobile-tables/); [Microsoft — List/details](https://learn.microsoft.com/windows/apps/design/controls/list-details)
- Skills instaladas (praticante): `mobile-native`, `gestures`, `better-layout`, `better-accessibility`, `break-ui`; demos code&chill (Pane, Rapport, Fernly), no estudo "Incorporação dos estudos ao playbook" (nov/2026)
