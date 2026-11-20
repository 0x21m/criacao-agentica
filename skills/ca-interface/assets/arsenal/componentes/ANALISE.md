# Análise dos 12 componentes de referência

Feita sobre a vitrine em `../vitrine/` (Vite + React 19 + TypeScript 5.9 + Tailwind v4 + estrutura shadcn), com cada componente instalado e renderizado pelo demo do autor. Rodar: `npm run dev` na vitrine e abrir `http://localhost:5180`. Capturas em `../vitrine/capturas/<nome>-desktop.png` (1440×900) e `-celular.png` (375×812, DPR 2, toque), feitas com `vitrine/scripts/capturar.mjs` (Chrome headless por CDP). Variantes extras: `*-escuro-*` (tema escuro) e `finance-bento-reduzido-*` (movimento reduzido).

**Como foi testado.** Navegador embutido em 1440 de largura e celular; teclado e leitura dos atributos ARIA por script na página; tema escuro por classe `.dark`; movimento reduzido emulado no Chrome headless (`prefers-reduced-motion: reduce`). Console lido no navegador embutido e no headless, nas 12 rotas: **nenhum erro nem aviso** de nenhum componente.

**Limite do teste.** O painel do navegador embutido roda como página em segundo plano (medido: ~2 quadros por segundo de `requestAnimationFrame`), então as animações em canvas e WebGL ficam paradas ou lentas nele. As capturas e a leitura do movimento foram feitas no Chrome headless em tempo real, e as durações e curvas vêm do código. `market-card` e `peak-chart` foram capturados com movimento reduzido, que mostra o estado final.

**Escala das notas.** Beleza e uso real: 1 fraco, 5 excelente. Esforço de adaptação: 1 = cai no produto quase como está, 5 = é preciso reconstruir.

---

## 1. adjustable-glass-dashboard

Painel inteiro em vidro sobre foto: barra superior, trilho de ícones, saldo, fluxo de caixa, atividade, metas, dock no celular e um painel "Adjust glass" que muda o vidro ao vivo.

**Por que é bonito**
- Três planos claros: foto quente desfocada no fundo, uma moldura de vidro grande (`.gw-glass`) e painéis internos mais opacos. O vidro é `color-mix(var(--gw-surface) 30%, transparent)` com `backdrop-filter: blur(22px) saturate(1.2)`, e um véu de cor (`--gw-tint`, opacidade 0,12) por cima que puxa tudo para a mesma temperatura da foto.
- A borda é luz, não linha: `inset 0 1px 0` com o branco a 60% (borda de cima acesa), `inset 0 0 0 1px` a ~20% (contorno), e uma sombra longa e negativa `0 20px 52px -25px` que descola o vidro sem sujar.
- Raios em escala coerente: moldura ~30px, painéis 17–22px, botões 8–10px, segmentado 6px. Cada nível de aninhamento perde raio.
- Tipografia sóbria: tudo em 500; o saldo grande ($28,430.60) em peso médio, rótulos pequenos e cinza-esverdeado; uma única cor de destaque verde-musgo (`--gw-accent`), usada só em estado positivo.
- Paleta inteira em tokens `--gw-*` com `light-dark()`, então claro e escuro saem do mesmo arquivo.

**Movimento**
- Entrada dos painéis com GSAP: de `y: 12, opacity: .45, blur(3px)` para o repouso, `duration: 0.48`, `stagger: 0.045`, `power3.out`, refeita a cada troca de aba (`revertOnUpdate`). O desfoque que some junto com a subida é o que dá a sensação de "foco chegando".
- Movimento reduzido: a animação inteira está dentro de `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`, então com redução não há entrada nenhuma.

**Padrões reaproveitáveis**
- Vidro só funciona sobre algo que vale a pena desfocar; com fundo liso ele vira cinza sujo. Ensinar: vidro = fundo rico + blur 16–24px + saturação 1,1–1,3 + véu da cor dominante + borda de luz em cima.
- Paleta de componente em tokens próprios com `light-dark()`, todos derivados do tema.
- Fallback explícito: `@supports not (backdrop-filter: blur(1px))` troca o vidro por cor sólida.
- Entrada que combina deslocamento curto (12px), opacidade parcial (começa em .45, não em 0) e blur de 3px, com escalonamento curto (45ms).
- No celular o trilho lateral vira abas horizontais no topo e a navegação vai para um dock.

**Problemas**
- Acessibilidade: boa base (28 `aria-hidden` em ícones, 16 `aria-label`, `aria-current`, `role="progressbar"` com valores, `role="status"`). Mas o texto cinza claro sobre vidro claro tem contraste baixo ("Welcome back, Troy", "Personal workspace" na barra, rótulos de metas), e esse contraste muda com a foto: não dá para garantir AA sem véu mais opaco.
- Desempenho: `backdrop-filter` em muitas camadas sobre uma foto grande é caro em celular médio, principalmente com rolagem.
- i18n: `Intl.NumberFormat("en-US")` fixo para moeda; textos em inglês no código.
- Foto de fundo do CDN do 21st (trocar por imagem própria). Licença não informada.
- 2.569 linhas: é um painel pronto, não um componente.

**Onde cabe**: app do cliente com personalidade (carteira, conta, assinatura), tela de visão geral pessoal. **Não usar**: painel do operador de uso intenso (o vidro cansa e o contraste oscila), telas com tabela longa, qualquer lugar sem imagem de fundo de qualidade.

**Notas**: beleza 5 · uso real 3 · esforço de adaptação 4.

---

## 2. finance-bento

Painel bento escuro de finanças pessoais: patrimônio em faixas empilhadas, número em matriz de pontos, medidor de alocação em traços, KPI em cor de destaque, metas em réguas, fluxo de caixa espelhado, cripto e ações.

**Por que é bonito**
- Cada card tem papel e cor próprios, mas todos seguem a mesma receita: gradiente vertical de 4 paradas `linear-gradient(180deg, top 0%, base 36%, base 74%, bottom 100%)` (claro em cima, saturado no meio, um pouco mais claro embaixo) e um **núcleo escuro desfocado** no centro (`.core`: `left/right 10%`, `top 16%`, `bottom -6%`, `border-radius: 90px`, `filter: blur(60px)`). O núcleo cria profundidade: o card parece aceso pelas bordas e fundo por dentro.
- Borda de luz em todos os cards: `inset 0 1px 0 rgba(255,255,255,.2), inset 0 0 0 1px rgba(255,255,255,.06)`; no card amarelo-limão, `inset 0 1px 0 rgba(255,255,255,.5)`.
- Três tipos de superfície com função clara: gradiente (cards-herói), vidro escuro `rgba(255,255,255,.06)` + `blur(20px)` (cards de apoio) e sólido na cor de destaque (um único KPI).
- Uma cor de destaque só, `--acc: #E8FF1F`, usada para deltas, réguas preenchidas e foco. Todo o resto é branco com três opacidades de texto (`--t1` 100%, `--t2` 56%, `--t3` 38%) e linha a 14%.
- Tipografia em contraste de pesos: números grandes em **Geist 200** a 40px com `letter-spacing: -.04em` e `tabular-nums`; títulos 600 a 18px; rótulos 600 em caixa alta a 11,5px com `.06em`; valores e chips em **Geist Mono 600**. O fino-grande contra o mono-pequeno é o que faz parecer caro.
- Gráficos-assinatura que só existem aqui: número em matriz de pontos 5×7, medidor de traços radiais, réguas de tracinhos, colunas em cápsula.
- Raio único de 28px nos cards, 14px no segmentado, 11px nos chips; espaçamento de 14px na grade.

**Movimento**
- Cards entram com `opacity .7s ease` e `transform: translateY(14px) scale(.985)` em `.9s cubic-bezier(.32,.72,0,1)`, disparados depois de `document.fonts.ready` (evita salto de fonte). Itens internos escalonados em 60ms; colunas da matriz de pontos em 7ms cada.
- Números contam com `easeOutCubic` em 900ms; o patrimônio "cresce" da esquerda.
- Tooltip: `opacity/transform .15s`. Segmentado: `background .25s`.
- Movimento reduzido: `@media (prefers-reduced-motion)` tira a transição dos cards, e a flag `reduce` faz contagens e desenhos irem direto ao fim (conferido na captura `finance-bento-reduzido-*`).

**Padrões reaproveitáveis**
- Receita do card com profundidade: gradiente vertical claro→saturado→claro + núcleo escuro desfocado + borda de luz em cima. Funciona com qualquer matiz da marca.
- Hierarquia por tipo de superfície (gradiente / vidro / sólido) em vez de por tamanho de sombra.
- Uma cor de destaque gritante, usada com parcimônia, contra uma base monocromática.
- Números grandes finos (200–300) com tracking negativo e tabulares; números pequenos em mono.
- Esperar as fontes antes da entrada.

**Problemas**
- Não é React: monta HTML em string, usa `innerHTML` e eventos manuais dentro de um efeito, com `@ts-nocheck`. Estudar e reconstruir.
- `toLocaleString('en-US')` e símbolos USD/EUR fixos; textos em inglês.
- Selo "by vasnev.art" ligado por padrão; o avatar da demo é foto de pessoa real (não reaproveitar).
- Cores todas fixas no CSS (não seguem o tema; claro e escuro dão o mesmo resultado).
- Contraste: `--t3` (38% de branco) em 12,5px sobre preto fica perto de 4,5:1 e abaixo disso sobre os gradientes claros. Texto branco sobre o rosa e o verde claros do topo dos cards fica no limite.
- Gráficos sem alternativa textual (`aria-hidden`); a matriz de pontos é `aria-hidden` e o valor não aparece em texto para leitor de tela.

**Onde cabe**: app do cliente (visão geral financeira, carteira, conquistas), tela de resumo com personalidade. **Não usar**: painel do operador denso; qualquer tela que precise do tema claro; colar como está.

**Notas**: beleza 5 · uso real 3 · esforço de adaptação 5.

---

## 3. glass-fold

Fundo WebGL de lâminas de vidro dobradas, com 3 cores, grão e velocidade (GradFlow).

**Por que é bonito**
- Três cores com papéis fixos: corpo da lâmina (`#1e3cc8`), fundo (`#06081e`) e arestas acesas (`#96d7ff`). As arestas claras e finas sobre um azul profundo dão a sensação de vidro sem nenhum reflexo literal.
- Grão de filme (0,12) tira o aspecto de gradiente digital liso.
- Composição em diagonal, com áreas escuras grandes onde o texto pode pousar (canto inferior esquerdo no demo).
- O demo usa título 36px peso 500 com `tracking-tight` e um subtítulo branco a 60%, e um botão-pílula em vidro (`bg-white/10`, `border-white/20`, `backdrop-blur-md`).

**Movimento**
- Loop contínuo de shader; o tempo acumula `dt × speed` (com `dt` limitado a 0,1s), então mudar a velocidade nunca dá salto. `speed` 0,5 no demo: movimento lento.
- Movimento reduzido: sem loop; desenha um quadro parado e só redesenha ao redimensionar. Correto.
- DPR limitado a 2.

**Padrões reaproveitáveis**
- Fundo de marca gerado com 3 cores que vêm dos tokens: corpo, fundo e luz.
- Grão sutil em gradientes grandes.
- Movimento ambiente lento e acumulado; parado com movimento reduzido.

**Problemas**
- Texto sobre o shader: no demo, o subtítulo passa por cima de uma aresta clara e perde contraste (visível na captura). Precisa de véu escuro medido atrás do texto.
- WebGL em tela cheia roda o tempo todo; não pausa fora da tela nem com a aba oculta (o rAF do navegador pausa a aba oculta, mas não a rolagem para fora). Custo em celular e bateria.
- Sem fallback se o WebGL falhar (fica canvas vazio sobre o fundo).
- Cores recebem só hex (`hexToVec3`), então não aceitam `var(--primary)` direto; é preciso ler o token e converter.

**Onde cabe**: boas-vindas, login, cabeçalho de marca, tela de sucesso, banner de abertura. **Não usar**: atrás de tabela, formulário longo ou qualquer texto denso; em tela de uso intenso.

**Notas**: beleza 5 · uso real 4 · esforço de adaptação 2.

---

## 4. liquid-glass-logo-reveal

Revelação de logo dentro de uma gota de vidro que refrata e solta a marca (WebGL2, shader portado de zanwei/glass-icon-reveal, MIT).

**Por que é bonito**
- A física é convincente: a gota nasce com mola (`bounce`, `response`), aumenta o logo como lente (`bulge`), dispersa cor na borda (`dispersion`, `colorBleed`) e o logo "escorrega" para fora da magnificação (`glide`) até ficar plano. A captura de desktop pega o meio da revelação (lâmina com arestas iridescentes); a de celular pega o fim (logo plano azul).
- Fundo neutro claro (`#e8e8eb`) e o logo em uma cor saturada só: o vidro é o único efeito.
- Forma do bloco em superelipse (`corner ~5`, como ícone de app).

**Movimento**
- Linha do tempo de molas, em segundos; em `loop` (padrão `true`) segura o logo `hold` segundos, desfoca em 0,5s (`OUTRO`) e recomeça. Clique refaz.
- Movimento reduzido: congela num quadro com o vidro já sobre o logo (`time = 1.4`), sem tocar.
- Se o WebGL2 falhar, mostra o logo plano por máscara CSS (bom fallback).

**Padrões reaproveitáveis**
- Momento-assinatura de marca de 1 a 2 segundos, que toca uma vez e cai no estado final útil.
- Fallback estático que já é o estado final.
- Parâmetros físicos nomeados (resposta, amortecimento, profundidade óptica) em vez de durações soltas.

**Problemas**
- Só `GlassReveal21st` é exportado, com a marca do 21st embutida; para usar outro logo é preciso exportar `GlassIconReveal`.
- `loop = true` por padrão: numa abertura real, tem que ser `loop={false}` e ter um jeito de pular.
- `role="img"` com `aria-label="Logo"` padrão e `cursor-pointer` sem ser botão: clicar refaz, mas não há foco nem teclado.
- Custo: WebGL2 + transformada de distância (SDF) do logo no CPU a cada troca de logo.
- 1.117 linhas, muitas constantes de ajuste fino.

**Onde cabe**: splash do app, primeira abertura, tela de sucesso de marca (assinatura concluída, pedido feito). **Não usar**: em loop em tela de trabalho, como carregamento real (não sabe quanto falta), em qualquer fluxo repetido várias vezes por dia.

**Notas**: beleza 5 · uso real 2 · esforço de adaptação 2.

---

## 5. liquid-glass-navbar

Barra de navegação em pílula de água (WebGL): a gota estica até o item, divide em saltos longos, ondula ao toque, e cada ícone tem uma cena (avião decola, gota respinga, globo gira).

**Por que é bonito**
- Pílula de vidro: `rgba(255,255,255,.14)` + `blur(10px) saturate(1.2) brightness(1.08)`, borda de luz `inset 0 1px 1px rgba(255,255,255,.7)` + contorno `inset 0 0 0 1px rgba(255,255,255,.2)`, e duas sombras azuladas (`0 12px 32px -14px rgba(0,40,90,.5)` longa e `0 2px 6px rgba(0,40,90,.1)` de contato). Sombra tingida da cor do fundo, não preta.
- No Chrome, refração real por filtro SVG (`feTurbulence` + `feDisplacementMap`) aplicado no `backdrop-filter`.
- Item: 42px de altura, 16px de padding, 14px peso 500, `-.01em`; ativo sobe 1px e cresce 8% com curva elástica `cubic-bezier(.3,1.6,.5,1)`.
- No celular vira só ícones (labels somem), o que é o certo.

**Movimento**
- Gota em WebGL guiada por mola; ripples ao tocar; ambiente de água em loop enquanto visível.
- Cenas de ícone: 0,5s a 1,3s (`nvPop .5s`, `nvPlane 1.15s`, `nvDoor 1.3s`).
- Movimento reduzido: sem animações de ícone (`animation: none !important`) e a água só se mexe na troca de item, sem ambiente. Bom.
- Som opcional sintetizado (desligado no demo).

**Padrões reaproveitáveis**
- Sombra de duas camadas tingida pela cor do ambiente (longa e difusa + curta de contato).
- Indicador de item ativo como objeto que viaja (não um sublinhado que pisca).
- Navegação por setas dentro da barra (`ArrowLeft/Right` com volta circular).
- Recompensa pequena e específica por item, desligada com movimento reduzido.

**Problemas**
- `aria-label="Main"` fixo, em inglês. `aria-current="page"` em `<button>` (deveria ser `<a>` com rota, ou `aria-pressed`/`aria-selected` num tablist).
- Ícones próprios (traço 1,8, 18px); trocar pela família do produto.
- Foco: `outline 2px #00A2FF` fixo, não segue o tema.
- WebGL e loop de água constante na barra que fica sempre na tela: custo contínuo de bateria no celular.
- Licença não informada.

**Onde cabe**: navegação principal do app do cliente no celular (barra inferior flutuante), app de marca. **Não usar**: navegação do operador (o efeito cansa em 200 cliques por dia), mais de 5 itens, fundo escuro sem `tone="dark"`.

**Notas**: beleza 5 · uso real 4 · esforço de adaptação 2.

---

## 6. market-card

Card de estatística escuro aceso por um brilho azul que acompanha o marcador; número grande com odômetro, chip de variação, linha que sobe pelo card e slider acessível.

**Por que é bonito**
- O brilho é um campo escalar suave (grade bicúbica) passado por uma rampa de cor derivada de **uma** cor de destaque (`accent #4358e2`), pintado em meia resolução. A luz mora atrás da parte "passada" do gráfico: quando o marcador anda, a luz anda junto. Dado e luz contam a mesma história.
- Linha branca até o marcador e cinza depois: passado e futuro sem legenda.
- Número enorme ($12B) em peso 500, rótulo em 380 e legenda com a parte importante em 520 ("-2.4% decrease") e o resto apagado. Pesos intermediários (380, 520) que só fontes variáveis permitem.
- Raio de 27 em 499 de largura (proporção fixa; o card escala como um todo).
- Fundo com grade fraca que só aparece em dois cantos.

**Movimento**
- Um único loop de rAF que pausa fora da tela (`IntersectionObserver`) e com a aba oculta (`visibilitychange`). Intro de 2,05s (`T_END`): linha desenha, anel entra com `backOut` (pequeno estouro), chip aparece entre 1,42s e 1,92s, guia tracejada entre 1,3s e 1,9s. "Respiração" do brilho a cada 5,4s.
- Dígitos rolam como odômetro.
- Movimento reduzido: tudo no estado final, sem respiração, marcador salta direto (conferido na captura).

**Padrões reaproveitáveis**
- Destaque visual ligado ao dado (a luz segue o ponto selecionado).
- Passado em cor cheia, futuro/resto em tom apagado.
- Animação de canvas com um só loop que dorme fora da tela.
- Slider de gráfico acessível: `role="slider"`, `aria-valuemin/max/now`, `aria-valuetext` com a frase inteira ("Market Size $12B, -2.4% decrease from the previous quarter."), setas, Page Up/Down, Home/End.

**Problemas**
- Foco do slider sem anel visível (`outline: none`; medido no navegador).
- `aria-valuetext` em inglês e montado pelo componente ("decrease from the previous quarter"): precisa de prop para traduzir a frase inteira.
- Fonte padrão SF/Segoe; no Windows cai em Segoe UI (a captura mostra), o que muda o caráter.
- `background` e `grid` desenham o fundo inteiro; num layout, usar `background="transparent"` e `grid={false}`.
- Cores todas por prop em hex; não seguem o tema.
- Campo de brilho calculado na CPU: aceitável para 1 card, não para 6.

**Onde cabe**: indicador-herói de uma visão geral (faturamento, ocupação), topo de relatório, app do cliente ("seu saldo"). **Não usar**: grade de muitos KPIs, tema claro, card pequeno (precisa de ~500px de largura para respirar).

**Notas**: beleza 5 · uso real 4 · esforço de adaptação 3.

---

## 7. market-snapshot

Card compacto de cotação: preço, variação, linha, troca de período com aba que desliza e data no hover.

**Por que é bonito**
- Densidade bem resolvida em 340px: nome 11px/500 cinza, preço 22px/600 com `tracking -0.035em` e `tabular-nums`, variação 11px/600 em verde.
- Linhas de grade tracejadas `2 5` com a cor do texto a 5,5% (`color-mix`), quase invisíveis.
- Borda hairline também por `color-mix(var(--foreground) 5.5%)`: adapta ao tema sozinha.
- Usa `var(--card)`, `var(--foreground)`, `var(--muted-foreground)` e `var(--chart-N, fallback)`: segue o tema de verdade.
- Indicador de período: barrinha de 3px com topo arredondado que desliza por `layoutId`.

**Movimento**
- Linha redesenha ao trocar período: `pathLength 0→1` em 0,65s com `ease [0.16, 1, 0.3, 1]` (expo-out).
- Preço troca com `opacity/y 4px` (`AnimatePresence popLayout`).
- Aba: mola `stiffness 400, damping 34`.
- Movimento reduzido: `useReducedMotion` desliga a entrada da linha e do preço.

**Padrões reaproveitáveis**
- Hairline e grade por `color-mix` da cor do texto (5–6%), não por cinza fixo.
- Curva expo-out `[0.16, 1, 0.3, 1]` para dados que se desenham.
- Aba deslizante com mola firme para seleção de período.
- Tooltip só com o que falta (a data), porque o preço já muda no cabeçalho.

**Problemas**
- Dados e textos fixos no arquivo (AMZN); precisa virar props.
- Botões de período sem `aria-pressed`; o gráfico só responde a ponteiro (sem teclado); texto de 9–10px no tooltip e no rodapé.
- `toLocaleTimeString('en-US')` fixo; `$` fixo.
- O demo força `.dark` no `<html>` ao montar e não desfaz (efeito colateral visível na vitrine).

**Onde cabe**: card de tendência pequeno num painel, lateral de detalhe, app do cliente. **Não usar**: como gráfico principal de análise; para quem precisa ler o valor exato por teclado.

**Notas**: beleza 4 · uso real 4 · esforço de adaptação 2.

---

## 8. metric-switcher-trend-chart-demo

Bloco de gráfico de tendência: troca de KPI por cards, intervalo (7D–90D), comparação com o período anterior, anotações (evento e campanha), tooltip, tabela e exportação CSV.

**Por que é bonito**
- Sóbrio e todo em tokens: `bg-card`, `border`, `muted-foreground`, `var(--color-chart-N)`; no claro usa o laranja do `chart-1` e no escuro muda sozinho (`metric-switcher-escuro-*`).
- KPI selecionado com fundo tingido da cor da série e borda na mesma cor; os outros neutros. O card vira legenda e seletor ao mesmo tempo.
- Área com gradiente vertical da cor da série até transparente; período anterior em linha tracejada fina da mesma cor.
- Anotações como faixas cinza (campanha) e linhas pontilhadas (evento), com rótulo em cima: contexto sem poluir.
- Tipografia: título 20px bold `tracking-tight`, rótulos 12px caixa alta com `tracking-wider`, valores 24px bold `tabular-nums`, deltas 14px semibold com seta.

**Movimento**
- Quase nenhum: `transition-colors` nos controles. A troca de métrica é instantânea. Respeita movimento reduzido por não depender de movimento.

**Padrões reaproveitáveis**
- Cards de KPI que são também as abas do gráfico (`role="tablist"`, roving tabindex com setas, conferido).
- Intervalo como `radiogroup` com setas (conferido: seta direita leva de 30D a 90D).
- Comparação com período anterior "fatia a fatia" (o slot `i` do anterior alinhado ao slot `i` do atual).
- Tabela equivalente ("View as table") e exportação: o gráfico tem alternativa acessível de verdade.
- `aria-live` para anunciar mudanças, `aria-describedby` no gráfico.
- `locale` como prop (datas e números via `Intl`).
- `yAxis: "zero" | "auto"` documentado com o motivo.

**Problemas**
- Textos fixos em inglês ("Export CSV", "View as table", "Hide table", "increase/decrease versus the previous period") mesmo com `locale`.
- Os `tab` não têm nome curto; o nome acessível é o texto inteiro do card ("Orders14.7K7.2% increase versus…").
- Vermelho/verde nos deltas (com seta, então não depende só da cor).
- No celular, a área do gráfico corta à direita dentro do card estreito (ver `-celular.png`): o SVG não reduz os rótulos de anotação.

**Onde cabe**: tela de relatórios e análise do operador, página de desempenho. **Não usar**: app do cliente final (é denso e analítico), card pequeno de painel.

**Notas**: beleza 3 · uso real 5 · esforço de adaptação 2.

---

## 9. peak-chart

Card de KPI vertical com brilho em canvas, grade que esmaece, linha-cometa, ponto que pousa no pico e pulsa, número que conta, seta de tendência, menu de período em vidro e morph da linha ao trocar dados.

**Por que é bonito**
- Brilho pintado em camadas medidas da referência: preenchimento azul `#1678ff`, sombras pretas que cavam o meio escuro, névoas e **três aros internos subindo da borda de baixo** (o card parece aceso por baixo). Halo externo em `#0e50ff` a 85%.
- Linha com intensidade que cai ao longe do pico (`LINE_FALLOFF`, `LINE_POWER`): o pico é a parte mais viva.
- Grade só na metade de baixo, a 23% de opacidade, esmaecendo.
- Tipografia levíssima: rótulos em peso 200–250 com `fontStretch` 108–116% (largo e fino), número de 89px em peso 500. O contraste fino-largo contra o número sólido é o charme.
- Mudar `accent` gira o matiz do brilho inteiro (o segundo card verde é o mesmo componente).
- Menu de período em vidro: `blur(18px) saturate(150%)`.

**Movimento**
- Linha do tempo em segundos: grade 0,9s; linha desenha de 0,25s por 2,1s; número conta de 1,0s por 1,7s; seta em 2,65s; repouso em 3,3s; respiração a partir de 4,6s; morph de dados em 0,75s.
- Movimento reduzido: estado final direto (captura).

**Padrões reaproveitáveis**
- Sequência com ordem de leitura: estrutura (grade) → dado (linha) → conclusão (número) → interpretação (seta).
- Luz vindo de baixo/borda como assinatura de card escuro.
- Matiz de destaque como única prop de cor, que gira toda a arte.
- Morph entre séries em vez de redesenhar do zero.

**Problemas**
- `toLocaleString("en-US")` no número principal; textos padrão em inglês.
- Legenda de 11,6px peso 250 em cinza sobre preto: legível em tela boa, fraca em tela ruim.
- Menu de período: `aria-haspopup="listbox"` e Escape fecha, mas as opções têm todas `tabIndex 0` e não há navegação por setas; o gráfico não tem alternativa textual.
- Tamanho por `width` em px calculado pelo demo; não é fluido por CSS.
- Canvas com várias camadas por quadro: 1 ou 2 por tela no máximo.

**Onde cabe**: KPI de destaque da visão geral, resumo do dia, tela de conquista. **Não usar**: em grade, em lista, em tema claro, para valores que o operador precisa comparar lado a lado.

**Notas**: beleza 5 · uso real 3 · esforço de adaptação 3.

---

## 10. stats-bento

Grade bento de indicadores: card-herói na cor primária com listras diagonais mascaradas e cards secundários com mini barras, contagem e nota.

**Por que é bonito**
- Hierarquia por massa: o herói ocupa 3 colunas e 2 linhas em `bg-primary`; os outros são `bg-muted` ou `bg-card` com borda. Inversão de cor é o que manda o olho para o 64%.
- Textura: `repeating-linear-gradient(45deg, #808080 0 1px, transparent 1px 10px)` a 30%, mascarada por `radial-gradient(ellipse 80% 50% at 100% 0%, #000 70%, transparent 110%)`: as listras só aparecem no canto superior direito e somem. Detalhe barato e sofisticado.
- Números sem negrito: 64% em `text-6xl tracking-tighter` peso normal; +240% em `text-3xl`. Rótulos em 10–12px semibold caixa alta `tracking-widest`.
- Raio grande (`rounded-3xl`, 24px), padding generoso (40px no herói, 24–32px nos outros), gap de 16px.
- Mini barras com `rounded-full` e alturas crescentes: gráfico sem eixo, só forma.
- Segue o tema: no escuro o herói vira claro (`stats-bento-escuro-*`), e continua funcionando.

**Movimento**: nenhum.

**Padrões reaproveitáveis**
- Herói por inversão de cor (primária cheia) + secundários neutros.
- Textura geométrica mascarada num canto.
- Números grandes em peso normal com tracking apertado; rótulos minúsculos espaçados.
- Bento com spans diferentes (3×2, 3×1, 1×1, 2×1).

**Problemas**
- Textos e números fixos no arquivo; `min-h-screen` na seção; estrela "★" como caractere; `#808080` fixo na textura.
- Sem semântica: números soltos em `<p>`/`<h3>`, sem relação rótulo-valor (`<dl>` resolveria).
- Mini barras sem texto alternativo.

**Onde cabe**: faixa de destaque no topo de um resumo, página "sobre", tela de conquistas do cliente, topo de relatório. **Não usar**: dados que mudam e precisam de comparação (não tem delta nem período), painel denso.

**Notas**: beleza 4 · uso real 4 · esforço de adaptação 1.

---

## 11. stats-card-2

Card com valor de mercado, sparkline animada, barra de participação e lista de itens.

**Por que é bonito**
- Card shadcn padrão (`rounded-xl border bg-card shadow-sm p-6 space-y-6`) bem ritmado: valor 30px bold + unidade 18px cinza na mesma linha de base.
- Barra de participação empilhada de 8px com legenda em pontos: leitura de proporção imediata.
- Sparkline que sangra até as bordas (`-mx-6`).

**Movimento**
- Linha desenha com `pathLength 0→1` em 1,5s `easeInOut`; área aparece em 1,5s com 0,2s de atraso.
- Movimento reduzido: **não respeita** (framer-motion sem `useReducedMotion`).

**Padrões reaproveitáveis**
- Valor + unidade em pesos e tamanhos diferentes na mesma linha de base.
- Barra de proporção empilhada com legenda acima.
- Sparkline de borda a borda dentro do card.

**Problemas**
- `hsl(var(--primary))` no gradiente: inválido com tema em oklch, então a área preenchida some no escuro e vira cinza no claro (ver `stats-card-2-escuro-*`). Trocar por `var(--primary)`.
- `id="sparkline-gradient"` fixo: dois cards na mesma tela colidem.
- Cores da participação em classes fixas (`bg-blue-500`...) e `text-green-500`; ícones do CDN do 21st; `Intl.NumberFormat("en-US")`.
- Sparkline sem alternativa textual; sem movimento reduzido.
- `1.5s` para uma sparkline é longo para um card de painel.

**Onde cabe**: resumo lateral (participação por categoria, top itens), painel do operador como card secundário. **Não usar**: como destaque (é genérico), sem corrigir o gradiente.

**Notas**: beleza 3 · uso real 4 · esforço de adaptação 2.

---

## 12. statistics-card-7

Faixa de 3 KPIs lado a lado num só contorno (título, período, valor, selo de variação com ícone e comparação), que empilha por container query.

**Por que é bonito**
- Um contorno só (`rounded-xl border`) com divisórias internas, em vez de 3 cards soltos: lê como um bloco, economiza borda e sombra.
- Ritmo vertical claro: título 18px semibold + período 14px cinza; 24px de espaço; valor 30px bold `tracking-tight` + selo; comparação 14px com a parte numérica colorida e o resto em `muted`.
- Responsivo por **container query** (`@container`, `@3xl:grid-cols-3`): empilha pelo tamanho do lugar onde está, não da tela (ver `-celular.png`).
- Selo de variação com ícone específico do significado (seta, pessoa, tendência para baixo), não só cor.

**Movimento**: nenhum.

**Padrões reaproveitáveis**
- Faixa de KPIs num contorno único com divisórias.
- Container query para componentes que vivem em larguras diferentes.
- Comparação "+8.20k vs prev. 60 days" com número colorido e contexto neutro.
- Ícone no selo que reforça o sentido além da cor.

**Problemas**
- O arquivo `statistics-card-7.tsx` é um contador de exemplo; o componente real está no demo.
- `card`, `badge-2`, `button-1` são variantes do autor (sean0205), que duplicam os do shadcn padrão.
- Cores por status fixas (`green-600`, `blue-600`, `red-500`); o valor colorido inteiro (`valueColor`) existe nos dados mas não é usado.
- No demo, `max-w-5xl` sem `mx-auto` deixa a faixa encostada à esquerda no desktop (ver captura).
- `$956.82k`, "vs prev." em inglês.

**Onde cabe**: KPIs do dia a dia do operador (vendas, novos clientes, cancelamentos), topo da visão geral, cabeçalho de relatório. **Não usar**: app do cliente final como destaque (é sóbrio demais), mais de 4 KPIs na mesma faixa.

**Notas**: beleza 3 · uso real 5 · esforço de adaptação 1.

---

## Tabela-resumo

| Componente | Beleza | Uso real | Esforço | Papel |
|---|---|---|---|---|
| adjustable-glass-dashboard | 5 | 3 | 4 | Moldura de app do cliente em vidro |
| finance-bento | 5 | 3 | 5 | Linguagem visual premium (reconstruir) |
| glass-fold | 5 | 4 | 2 | Fundo de marca, boas-vindas, login |
| liquid-glass-logo-reveal | 5 | 2 | 2 | Splash e momento de marca |
| liquid-glass-navbar | 5 | 4 | 2 | Navegação do app do cliente no celular |
| market-card | 5 | 4 | 3 | Indicador-herói |
| market-snapshot | 4 | 4 | 2 | Card de tendência compacto |
| metric-switcher-trend-chart-demo | 3 | 5 | 2 | Relatório e análise do operador |
| peak-chart | 5 | 3 | 3 | KPI de destaque com personalidade |
| stats-bento | 4 | 4 | 1 | Faixa de destaque com hierarquia |
| stats-card-2 | 3 | 4 | 2 | Resumo lateral |
| statistics-card-7 | 3 | 5 | 1 | Faixa de KPIs do operador |

Observação: os mais bonitos são os menos prontos para uso e os mais caros de adaptar; os mais úteis no dia a dia são os mais sóbrios. Uma skill deveria ensinar a **misturar**: base sóbria (statistics-card-7, metric-switcher) com um ou dois momentos de personalidade (market-card, peak-chart, glass-fold) por tela.

---

## Síntese: 14 padrões transversais

1. **Borda de luz em cima (`inset 0 1px 0`) + contorno interno fraco (`inset 0 0 0 1px`).** A borda é um brilho de 1px no topo (branco a 20–70%) e um contorno a 6–20%, nunca uma linha cinza sólida. Aparece em: finance-bento, adjustable-glass-dashboard, liquid-glass-navbar, market-card (aro do card), peak-chart (aros internos de baixo).

2. **Gradiente vertical com núcleo escuro desfocado.** Fundo do card claro→saturado→claro em 4 paradas, com uma forma escura grande e muito desfocada (`blur 60px`) no meio; o card parece aceso pelas bordas. Aparece em: finance-bento (todos os cards de cor), peak-chart (sombras pretas que cavam o centro + aros), market-card (campo de brilho com o meio escuro).

3. **Uma cor de destaque só, contra base monocromática.** Tudo é neutro com 2–3 opacidades de texto; uma cor (limão, azul, verde, laranja) marca o que importa: delta, ponto ativo, série selecionada. Aparece em: finance-bento (`#E8FF1F`), market-card (azul do brilho), peak-chart (`accent`), market-snapshot (verde), metric-switcher (`chart-1`), adjustable-glass-dashboard (verde-musgo).

4. **Números grandes em peso leve ou normal, tracking negativo e tabulares.** O número principal não é negrito: 200 (finance-bento), 300/500 (peak-chart), normal (stats-bento), com `letter-spacing` de −0,02 a −0,04em e `tabular-nums`. Rótulos pequenos em caixa alta, semibold e espaçados fazem o contraponto. Aparece em: finance-bento, peak-chart, stats-bento, market-card, market-snapshot, metric-switcher.

5. **Hierarquia por tipo de superfície, não por sombra.** O herói muda de material (cor primária cheia, gradiente, sólido de destaque) e os secundários ficam neutros ou em vidro. Aparece em: stats-bento (herói `bg-primary`), finance-bento (gradiente / vidro / sólido), adjustable-glass-dashboard (moldura de vidro / painéis mais opacos).

6. **Dados que se desenham e números que contam, na ordem de leitura.** Estrutura → linha → número → interpretação, com curva de saída (expo-out ou cúbica) e durações de 0,65s a 2s. Aparece em: peak-chart (grade 0,9s → linha 2,1s → número 1,7s → seta), market-card (intro 2,05s, odômetro), finance-bento (contagem 900ms, patrimônio cresce), market-snapshot (`pathLength` 0,65s), stats-card-2 (1,5s).

7. **Entrada escalonada curta, de deslocamento pequeno.** 12–14px de subida, opacidade parcial ou escala .985, 45–60ms entre itens, curva de saída forte. Aparece em: adjustable-glass-dashboard (GSAP 0,48s, `power3.out`, stagger 45ms, com blur 3px→0), finance-bento (0,9s `cubic-bezier(.32,.72,0,1)`, 60ms entre itens, depois de `fonts.ready`).

8. **Movimento reduzido leva ao estado final, não a um estado vazio.** Com redução, o componente mostra o resultado (linha desenhada, logo pousado, quadro parado do shader), sem animação de entrada nem ambiente. Aparece em: market-card, peak-chart, finance-bento, glass-fold, liquid-glass-logo-reveal, liquid-glass-navbar, adjustable-glass-dashboard, market-snapshot. Falha em: stats-card-2.

9. **Um loop de animação que dorme fora da tela.** Canvas e WebGL com um único `requestAnimationFrame`, pausado por `IntersectionObserver` e `visibilitychange`, DPR limitado a 2. Aparece em: market-card, peak-chart, liquid-glass-navbar (anda só enquanto visível). Falta em: glass-fold (não pausa fora da tela).

10. **Vidro com receita completa.** Fundo rico atrás + `backdrop-filter: blur(10–24px) saturate(1.1–1.5)` + véu da cor dominante + borda de luz + fallback sólido em `@supports not`. Aparece em: adjustable-glass-dashboard, liquid-glass-navbar, finance-bento (cards de apoio), peak-chart (menu), glass-fold (botão do demo).

11. **Sombra longa e negativa, tingida pela cor do ambiente.** `0 20px 52px -25px` ou `0 12px 32px -14px` com a cor do fundo (azul, verde) em vez de preto, mais uma sombra curta de contato. Aparece em: adjustable-glass-dashboard, liquid-glass-navbar, finance-bento (tooltip).

12. **Linhas finas por mistura com a cor do texto.** Hairlines e grades com `color-mix(in srgb, var(--foreground) 5–6%, transparent)` ou branco a 6–14%, para seguirem o tema sozinhas. Aparece em: market-snapshot, finance-bento (`--hair` 14%), adjustable-glass-dashboard (`--gw-line`), peak-chart (grade a 23%).

13. **Controles de dado acessíveis de verdade.** Seleção de período e métrica como `radiogroup`/`tablist` com roving tabindex e setas; gráfico como `slider` com `aria-valuetext` em frase; tabela equivalente e exportação. Aparece em: metric-switcher (tablist, radiogroup, tabela, CSV, `aria-live`), market-card (slider com setas, PageUp/Down, Home/End), liquid-glass-navbar (setas). Falta em: peak-chart (menu sem setas), market-snapshot (sem `aria-pressed`, gráfico só por ponteiro).

14. **Raio que diminui com o aninhamento, e raio grande no herói.** Moldura 28–30px, cards 17–24px, botões 8–11px, chips no raio de pílula. Aparece em: adjustable-glass-dashboard, finance-bento (28 / 14 / 11), stats-bento (24px), market-card (27 em 499), peak-chart (56 em 540).

**Problemas que se repetem e que a skill deve cobrar sempre**: formatação presa em `en-US` (8 de 12), textos fixos em inglês dentro do componente (11 de 12), cores em hex fixo fora do tema (8 de 12), foco sem anel visível ou com cor fixa (market-card, liquid-glass-navbar), gráfico sem alternativa textual (peak-chart, stats-card-2, finance-bento, stats-bento), licença não informada (todos, menos o shader do logo reveal, que é MIT).

---

## Templates

Um template de 1 tela por componente, em `../vitrine/src/templates/<id>/index.tsx`, na seção "Templates" da navegação da vitrine (`#/template/<id>`). Todos têm: textos, datas e R$ em pt-BR com dados fictícios de uma rede de mercados ("Ipê Mercados" / app "Ipê Clube"); cores por token (`--primary`, `--chart-N`, `--sucesso`, `--destructive`); claro e escuro; ícones lucide; entrada suave (`fade` + 8px, 500ms, escalonada em 60ms, desligada com movimento reduzido); estados "carregando" (esqueleto) e "vazio" pela barra oculta que aparece com a tecla **F** (`data-prototipo-controle`) ou por `?estado=carregando|vazio` na URL. As partes comuns ficam em `templates/_base/` (moldura do operador com barra lateral recolhível e gaveta no celular, estados, esqueleto, formatação, leitura de tokens em hex). Capturas: `../vitrine/capturas/template-<id>-desktop.png` e `-celular.png`.

| Template (id) | Componente | Tela | Uso indicado | O que adaptar |
|---|---|---|---|---|
| `boas-vindas` | glass-fold | Login com banner de marca em WebGL, véu de contraste e card de formulário em vidro | Login, boas-vindas, convite aceito | Marca e frase; as 3 cores do shader saem de `--chart-1` (lâminas, mistura escura, mistura clara); rotas de senha e acesso; autenticação real |
| `abertura` | liquid-glass-logo-reveal | Splash com o logo numa gota de vidro (uma vez, com "Pular") que passa para a home do clube | Primeira abertura do app, sucesso de marca | SVG do logo (`LOGO`), duração, home seguinte; guardar que a abertura já foi vista |
| `app-cliente` | liquid-glass-navbar | Home do app do cliente (pedido a caminho, pontos, categorias, ofertas) com a barra em pílula fixa embaixo | App do cliente no celular, até 5 destinos | Itens da barra e o conteúdo de cada aba; o tom segue o tema |
| `painel-cliente-vidro` | adjustable-glass-dashboard (cópia pt-BR) | "Minha conta" em vidro sobre foto do Unsplash: saldo, fluxo, movimentação, metas, dock no celular | Portal ou app do cliente com personalidade | Foto (de preferência própria), dados e moeda; usa os estados vazios internos do componente |
| `visao-financeira` | finance-bento (reconstruído em React) | Bento financeiro: gradiente com núcleo escuro, vidro e sólido na cor de destaque; faixas, medidor de traços, réguas e cápsulas | Visão geral do cliente (carteira, investimentos, metas) | Dados; tokens `--chart-1..5` para os cards e `--chart-4` como destaque único |
| `destaque-kpi` | peak-chart | Visão geral da semana do operador com 2 KPIs-herói numa faixa escura e a explicação dos números abaixo | Visão geral do gerente, resumo semanal | Séries e rótulos; no máximo 2 por tela; valores inteiros (o número principal formata em en-US) |
| `resumo-do-dia` | market-card (cópia pt-BR) | Resumo do dia com o faturamento acumulado navegável hora a hora, canais e pendências | Topo da visão geral do gerente | Série horária e formato curto ("64 mil"); cores lidas do tema escuro nos dois temas |
| `tendencias` | market-snapshot (versão com props) | Grade de cards de tendência por loja com troca de período e ranking | Comparar 3 a 8 séries independentes | Séries por unidade e o que cada card mede |
| `relatorios` | metric-switcher (cópia pt-BR) | Relatório com troca de indicador, intervalo, eventos marcados, tabela e CSV, filtro por loja | Relatórios e análise do operador | Dados da API, indicadores, eventos e moeda |
| `categorias` | stats-card-2 (versão corrigida) | Tabela de vendas por categoria com resumo lateral fixo (total, tendência, participação, destaques) | Telas de lista do operador com contexto à vista | Categorias, itens em destaque e período |
| `kpis-operador` | statistics-card-7 (card + badge-2) | Visão geral do operador: faixa de 3 KPIs, pedidos de hoje e estoque baixo | Painel de alta frequência | KPIs, pedidos, estoque; status por token |
| `resumo-do-mes` | stats-bento (versão com props) | Resumo do mês: bento com herói na cor primária, destaques e metas | Topo de relatório mensal, fechamento, conquistas | Números do bento, destaques e metas |

**Limitações conhecidas dos templates**
- `destaque-kpi`: o número principal do peak-chart sai em `en-US` (usar só inteiros abaixo de 1.000 ou ajustar o `toLocaleString` do componente). A captura de celular foi feita com DPR 1: com DPR 2 o Chrome headless (renderização por software) travou com os dois canvases.
- `painel-cliente-vidro`: o selo de variação do saldo sai com ponto ("+6.4%") porque o componente usa `toFixed` internamente; o resto está em pt-BR. O contraste do texto cinza sobre o vidro continua dependendo da foto.
- `abertura`: a passagem para a home é por tempo (3,4 s; 0,6 s com movimento reduzido), porque o componente não avisa quando termina. Sem WebGL2, mostra o logo plano.
- `resumo-do-dia`: o card lê as cores do tema escuro também no claro, de propósito (o brilho foi desenhado para fundo escuro). O slider ganhou anel de foco pelo contêiner (`focus-within`), já que o componente não desenha um.
- `app-cliente`: o `aria-label="Main"` do componente é trocado por "Navegação principal" depois de montar; as abas além de "Início" mostram um estado vazio de protótipo.
