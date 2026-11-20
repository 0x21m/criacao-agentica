# Relatório de uso real: starter de protótipos (Oficina Norte)

Testado em 16/11/2026, das 13:05 às 13:55, em `http://localhost:4400/` (servidor de desenvolvimento do Astro), enquanto outro agente construía. Cada achado traz o horário em que foi visto. O starter mudou durante o teste: o banner do início ganhou a caixa de KPIs por volta das 13:43, e `/sistema/` e `/fluxos/` passaram de 404 para 200 por volta das 13:10. Os achados de layout foram conferidos de novo às 13:49.

Como testei: scripts Node com o `playwright-core` do projeto e o Chrome instalado (`starter/qa/*.mjs`), sem baixar navegador. Usei os descritores iPhone 13, Pixel 7 e iPad (gen 7) com `hasTouch` e `isMobile`, além de desktop em 1440×900 e 1280×800. No celular a interação foi por `tap`. Os gestos foram eventos de toque pelo CDP (`Input.dispatchTouchEvent`): deslizar o quadro, segurar e arrastar card e puxar a folha. Também testei teclado (Tab, setas, Enter, Esc, Ctrl K, F), `reducedMotion: 'reduce'`, esquema claro e escuro do sistema e a matriz de 5 presets × claro/escuro × vidro (20 combinações) no início em 1280 e em `/pedidos/` no iPhone. As capturas ficam em `starter/qa/cap/`. As montagens `51-*` e `61-*` juntam várias capturas numa imagem só.

**Lentes usadas:**
- `impeccable` 4.9.2, nos modos critique (Operate, heurísticas de Nielsen e carga cognitiva) e audit. O detector rodou na página renderizada de `/`, `/pedidos/` e `/pedidos/novo/` e no código-fonte.
- `consistency.mjs` da design-taste-frontend, só com as checagens de sistema (layout, contenção, texto e foco) em `/` e `/pedidos/`, a 1440, 820 e 390 px.
- `break-ui`, `better-interface`, `gestures`, `review-animations` e `better-accessibility`: apliquei os critérios dessas lentes à mão sobre os percursos, sem carregar cada skill, para não estourar o contexto.
- `impeccable:impeccable-motion-reviewer`: ficou disponível no fim da sessão e revisou as capturas de movimento (achados 40 a 44). Antes disso, revi o movimento aqui pelas capturas de 100 ms, 400 ms, 900 ms e 2 s e pela API `document.getAnimations()`.

Os achados de cada lente trazem a origem entre colchetes: [uso], [impeccable], [consistency].

---

## Resumo (notas de 1 a 10)

| Área | Nota | Por quê |
|---|---|---|
| Visual geral | 6,5 | No desktop escuro (Noite, Sinal, Aurora) o painel tem cara de produto. Mas o card "Pedidos no dia de pico" é de outra família, há texto de 6,7 px, e o banner com ondas compete com o título em quase toda página. |
| Consistência | 5,5 | Cards de estilos diferentes na mesma linha, alturas desiguais, o mesmo dado em 3 formatos (R$ 98,9 mi / R$ 98.765.432,10), o estado de erro sem margem e demos do arsenal em inglês e dólar. |
| Celular e toque | 4,5 | O formulário de novo pedido estoura a largura com o cliente de nome longo (P0). A folha de detalhe é lateral, não puxa e não fecha por gesto. Os campos têm 40 px de altura. O iPad em retrato herda a lateral de 240 px e quebra o banner sílaba por sílaba. |
| Interação e movimento | 5,5 | Filtros, busca e desfazer existem. Mas o Desfazer fica inalcançável quando a folha está aberta, o aviso dura cerca de 3 s, Ctrl K não abre o pedido, não há exportar e a abertura de 3,7 s volta em toda sessão. |
| Acessibilidade | 6 | Tem `lang`, um h1 por página, link para pular ao conteúdo, foco que volta ao link de origem e nomes acessíveis. Contra: badge com contraste de 2,5:1 e 10 px, "Close" em inglês na folha, erros que não somem ao corrigir, alvos de 23 a 40 px e erro de hidratação com movimento reduzido. |
| Presets | 7 | Os 5 presets trocam fonte, cor e banner de forma coerente, e o modo claro do Vidro é o mais bonito. O vidro liga e desliga sem diferença perceptível na maioria das telas, e no Sóbrio claro a alternância Lista/Quadro some no celular. |

**Nota geral de uso: 5,8 de 10.** A distância até 9 está em 6 erros de celular e tablet, em 2 de fluxo (Desfazer e Ctrl K) e na unificação da família de cards.

---

## Achados (ordenados por gravidade)

Formato: **[P] tipo · onde (rota · dispositivo · preset/combinação) · horário** · o que acontece · captura · sugestão. As capturas estão em `starter/qa/cap/`.

### P0

1. **[P0] erro · `/pedidos/novo/` · iPhone 13 · Noite escuro · 13:24 e 13:49 [uso, break-ui]** · Ao escolher o cliente "Companhia Brasileira de Distribuição e Comércio de Peças Automotivas Pesadas do Vale do Paraíba Ltda.", o card do formulário passa da borda direita da tela. Os campos, a barra de progresso e o "1 de 4 campos obrigatórios" ficam cortados, e como o corpo não rola na horizontal, a parte cortada some. O botão Criar pedido continua visível só porque fica embaixo. · `20-form-preenchido-full.png`, `30A-form-cliente-longo.png`, `41-iphone-form-1349.png` · Pôr `min-w-0` no grid ou flex do formulário e no gatilho do Select, `truncate` no valor escolhido e `max-w-full` no popover. Testar com o cliente c99 como caso fixo.
2. **[P0] erro · `/` · iPad (gen 7) retrato 810 px · Noite escuro · 13:31 e 13:49 [uso, consistency: spill e overlap-text a 820]** · O banner do início se espreme ao lado da lateral fixa de 240 px. "Bom dia, Marina" quebra palavra por palavra, "Segunda-/feira" quebra no hífen, e "12 pedidos atrasados pedem atenção hoje" fica com recuo e um ponto solto. Às 13:31 os KPIs quebravam sílaba por sílaba ("Em abe rto", "A rec ebe r") e "R$ 93,5 mi" ficava sobre "15 no mês" (texto sobre texto). Às 13:49 a caixa de KPIs empilhada já resolveu a sobreposição. O card do pico ainda passa da margem direita, e "Atualizado há 5 min" fica atrás do seletor Semana/Mês. · `40-ipad-inicio.png`, `41-ipad-inicio-1349.png` · Abaixo de 1024 px, recolher a lateral para ícones ou usar a barra de abas. Empilhar o banner (saudação em cima, KPIs embaixo) com container query, e não por viewport.

### P1

3. **[P1] erro · `/pedidos/?id=…` · desktop 1440 · Noite escuro · 13:20 [uso]** · Na folha de detalhe, "Mover para concluído" mostra o aviso "Pedido #1052: concluído. Desfazer", mas o aviso fica atrás do overlay da folha. Não se vê nem se clica. Ao fechar a folha (cerca de 3 s depois), o aviso já sumiu. Na prática não há como desfazer a mudança feita pela folha. O próprio `/fluxos/` promete "o aviso oferece Desfazer". · `11-status-mudado.png`, `11-sheet-fechado-toast.png` · Renderizar o Toaster acima do overlay (z-index e portal fora da camada modal) ou pôr o Desfazer dentro da própria folha, junto do selo de status.
4. **[P1] erro · aviso com Desfazer · desktop 1280 · 13:29 [uso, better-interface]** · O aviso de mudança de status pelo menu da linha some em cerca de 3,0 s. É pouco tempo para ler, mirar e clicar em Desfazer. O aviso de exclusão também tem a mesma duração. · `30C-toast-status.png`, `30C-excluir.png` · Duração de 6 a 8 s em avisos com ação, e pausar enquanto o ponteiro ou o foco estiverem sobre o aviso.
5. **[P1] erro · Ctrl K · desktop 1280 · 13:30 [uso]** · A busca "1099" encontra o pedido. Com ↓ e Enter, a tela vai para `/pedidos/` sem abrir o pedido (sem `?id=`, sem folha). · `30C-ctrlk-1099.png`, `30C-ctrlk-destino.png` · Navegar para `/pedidos/?id=pXX` e selecionar o primeiro resultado automaticamente, para Enter funcionar sem seta.
6. **[P1] erro · `/pedidos/novo/` · iPhone · 13:24 [uso, break-ui, better-accessibility]** · Depois de um envio vazio, os erros ("Descreva o pedido em pelo menos 3 letras", "Escolha o cliente", "Informe um valor maior que zero") continuam em vermelho mesmo com os campos já preenchidos e válidos. · `20-form-preenchido-full.png` · Revalidar o campo a cada mudança (ou no blur) depois do primeiro erro e limpar a mensagem quando ficar válido.
7. **[P1] erro · `/pedidos/novo/` · iPhone · 13:29 [break-ui]** · O campo Valor aceita "abc" e "-50" sem máscara. O Prazo aceita 01/01/2020. · log de `30-misto.mjs` · Máscara de moeda pt-BR (`inputmode="decimal"`, `lerMoeda`) e `min` de hoje no prazo, ou um aviso de que o prazo está no passado.
8. **[P1] erro · `/clientes/?id=c99` · iPhone · 13:29 [uso, break-ui]** · Na faixa de KPIs do cliente, "Total comprado R$ 98,8 mi" encosta em "Ticket médio R$ 98,8 mi" ("miR$"): os números colidem. O "1" de Pedidos tem outra escala. O avatar "C" fica alinhado pela base do nome de 6 linhas, e não pelo topo. · `30A-cliente-detalhe-full.png` · Grid de 3 colunas com `min-w-0` e números em `clamp()`, ou KPIs empilhados abaixo de 400 px. Alinhar o avatar pelo topo.
9. **[P1] erro · `/clientes/?id=c11` · iPad · 13:32 [uso]** · Na tabela de pedidos do cliente, a coluna de descrição encolhe para zero e sobra só um traço "|" entre o número e a data. O e-mail é truncado ("contato@petsh…"). · `40-ipad-cliente-detalhe.png` · Dar `minmax(8rem,1fr)` à descrição e mostrar o e-mail em linha inteira ou com quebra (`break-all`).
10. **[P1] erro · `/` · todos os dispositivos e presets · 13:17 [impeccable: undersized-ui-text e heading-scale; consistency]** · "Recorde da semana" no card do pico tem 6,7 px, ilegível. "Atualizado há 5 min" tem 10,7 px. O badge de notificações "12" tem 10 px, com branco sobre #ff7d7c a 2,5:1. · `10-inicio-5s.png` · Piso de 12 px para texto funcional. Badge com fundo vermelho mais escuro (≥ 4,5:1) ou texto escuro.
11. **[P1] melhoria · `/` · desktop, todos os presets escuros · 13:17 [uso, consistência pedida pelo dono]** · Cards de estilos diferentes na mesma linha. "Pedidos no dia de pico" tem raio maior, borda brilhante, brilho inferior e fundo diferente dos vizinhos "Atenção do dia" e "Faturamento por dia" (é um template do arsenal colado). As alturas também não batem: 470 contra 465 px no desktop, e 452 contra 342 px no iPad. No modo claro o mesmo card vira um card comum: o preset muda a família do card. · `10-inicio-5s.png`, `51-montagem-inicio-noite.png` · Uma família só de card (mesmo raio, borda e sombra), com o destaque vindo do conteúdo (número grande ou cor do acento), e `items-stretch` na linha.
12. **[P1] melhoria · aparência, vidro on/off · desktop e iPhone · 13:37 e 13:44 [uso, presets]** · Em todos os 5 presets, ligar o vidro aplica `backdrop-filter` (4 de 5 cards no início, 43 de 44 em `/pedidos/`), mas o resultado fica quase igual ao vidro desligado, porque o fundo ambiente é liso e não há o que desfocar. Para o dono, o interruptor parece não fazer nada ("vidro sem desfoque"). · `51-montagem-inicio-*.png`, `51-montagem-pedidos-cel-*.png` · Com o vidro ligado, dar ao fundo um conteúdo que mostre o desfoque: manchas de cor com mais contraste, a onda do banner passando por trás dos cards ou um ruído. Também baixar a opacidade do véu.
13. **[P1] erro · `/pedidos/` · iPhone · Sóbrio claro (com e sem vidro) · 13:45 [presets]** · A alternância Lista/Quadro fica branco sobre branco, e o ícone da lista ativa praticamente some. · `51-montagem-pedidos-cel-sobrio.png` · Dar ao segmentado uma borda ou fundo `--muted` no Sóbrio claro e conferir o contraste ≥ 3:1 do controle.
14. **[P1] erro · `/?estado=erro` · desktop 1280 · 13:30 [uso]** · O card de erro encosta na lateral, no topo e na borda direita, sem margem e sem banner, ao contrário de todas as outras telas. · `30C-estado-erro.png` · Renderizar o estado de erro dentro do mesmo container e gutter das páginas, com o cabeçalho da página mantido.
15. **[P1] erro · arsenal `template-kpis-operador` · iPhone · 13:49 [uso, break-ui]** · A tabela "Pedidos de hoje" e o card "Estoque baixo" passam da borda: os valores ficam cortados ("R$ 38…", "R$ 2.14…") sem rolagem horizontal visível. · `62-iphone-template-kpis-operador-full.png` · Envolver a tabela em `overflow-x-auto` com sombra de rolagem, ou virar lista de cards abaixo de 480 px.
16. **[P1] melhoria · gestora · `/pedidos/` · desktop · 13:20 [uso]** · Não há exportar em nenhum lugar (zero ocorrências de "Exportar" ou "CSV" em `/pedidos/`), embora o template do arsenal `kpis-operador` tenha o botão. Os filtros também não vão para a URL, então não dá para compartilhar nem voltar ao mesmo filtro. · `11-filtro-vazio.png` · Botão "Exportar" na barra de filtros (CSV do recorte atual) e filtros em `?status=&atrasados=1&q=`.

### P2

17. **[P2] melhoria · folha de detalhe · Pixel 7 e iPhone · 13:32 [gestures]** · No celular a folha abre pela lateral com cerca de 300 px. O nome do cliente longo quebra em 7 linhas. Não há alça, ela não acompanha o dedo e não fecha ao puxar para baixo nem ao deslizar para a direita (testado por toque do CDP). Só fecha pelo X ou com Esc. · `40-pixel-sheet.png`, `20-apos-criar.png` · Abaixo de 640 px, usar uma folha inferior com alça, pontos de parada (meia e cheia) e fechar ao puxar, com velocidade e elástico na borda.
18. **[P2] melhoria · quadro (kanban) · iPad · 13:32 [gestures]** · O quadro rola na horizontal pelo toque (scrollLeft de 24 para 360), mas não tem arrastar e soltar: segurar e arrastar um card não move nada. A primeira coluna começa encostada na lateral (x=248, contra a margem de 264), sem `scroll-padding`. · `40-ipad-quadro-deslizado.png`, `40-ipad-quadro-arrastar-card.png` · Arrastar com pressão longa (≥ 300 ms) entre colunas para mudar o status, com Desfazer; `scroll-snap` e `scroll-padding-inline` iguais ao gutter.
19. **[P2] erro · Ctrl K · desktop · 13:30 [uso]** · O anel de foco do campo da paleta aparece só como duas linhas verticais lima nas laterais, cortado em cima e embaixo pelo container. · `30C-ctrlk-1099.png` · Pôr `ring-inset` no campo ou dar `overflow: visible` ao container, ou tirar o anel e marcar o item ativo.
20. **[P2] erro · folha de detalhe · todos os dispositivos · 13:17 [better-accessibility]** · O botão de fechar se anuncia como "Close" (texto sr-only em inglês). · `10-gestora` (dialog innerText) · Trocar por "Fechar".
21. **[P2] erro · movimento reduzido · desktop · 13:43 [review-animations]** · Com `prefers-reduced-motion: reduce`, o React registra "Hydration failed because the server rendered text didn't match the client" no início. Provavelmente é o número animado que já renderiza o valor final no cliente. · log de `70-movimento.mjs` · Ler a preferência só depois de montar o componente (`useEffect`) ou renderizar o mesmo texto inicial no servidor e no cliente.
22. **[P2] melhoria · abertura (splash) · todos · 13:43 [review-animations]** · A abertura leva cerca de 3,7 s e volta em toda sessão nova (o `sessionStorage` vale por aba). Com movimento reduzido ainda leva 1,6 s. No celular a forma é um quadrado verde com emendas visíveis e pontos laranja nos cantos, um artefato do filtro de vidro. · `02-iphone-inicio.png` (primeira rodada, 13:07), `70-no-preference-t100.png` · Mostrar só na primeira visita (`localStorage`), no máximo 1,2 s, sem abertura com movimento reduzido. Conferir o filtro SVG da forma no iOS e Android emulados.
23. **[P2] erro · campos e alvos · iPhone · 13:29 [better-accessibility, gestures]** · Campos e botões com 40 px de altura, "Lista" e "Quadro" com 40×36, números de pedido como links de 47×23 e o interruptor "Só atrasados" com área de 13×13 no input. · log de `30-misto.mjs` · Na densidade padrão do celular, alvo de ≥ 44×44 (a densidade "campo" já existe; usar o mesmo valor no toque) e a linha inteira do card como alvo.
24. **[P2] melhoria · `/` · desktop · 13:17 [impeccable: nested-cards; better-interface]** · O banner do início repete o dado: "Em aberto 18 pedidos" e logo abaixo "A receber R$ 98,9 mi / 18 em aberto". O "Atenção do dia" mostra o badge "4" enquanto o banner diz 12 atrasados, então a pessoa conta duas vezes. · `10-inicio-5s.png` · Trocar a linha "18 em aberto" por algo novo (por exemplo, "R$ X vencidos") e mostrar "4 de 12" no badge.
25. **[P2] melhoria · demos do arsenal · desktop e iPhone · 13:44 [uso]** · Várias demos estão em inglês e em dólar: `statistics-card-7` ("Total Sales & Cost", "Churn Rate"), `finance-bento` e `adjustable-glass-dashboard` ("Overview", "$28,430.60"), `metric-switcher-trend-chart-demo` ("increase versus the previous…"), `stats-card-2` ("4.00T USD"), `market-card` ("$12B"). · `61-mont-d1440-*.png` · Traduzir as demos para pt-BR e R$ (o README diz que o que se aprova no arsenal é o que as telas importam).
26. **[P2] melhoria · arsenal · iPhone · 13:47 [uso]** · Em todas as páginas de componente, o celular mostra primeiro o bloco de texto (quando usar, import, dependências), e a peça só aparece depois de uma ou duas telas de rolagem. O import é cortado sem rolagem visível. · `61-mont-iphone-*.png` · Peça viva primeiro, documentação depois (ou em abas), e o import com `overflow-x-auto`.
27. **[P2] erro · `/fluxos/` · desktop 1440 · 13:47 [uso]** · Em cada faixa, a terceira miniatura é cortada na borda direita do card. As miniaturas são escuras e pequenas demais para ler. · `80-d-fluxos-.png` · Grid de 3 colunas com `minmax(0,1fr)` dentro do card, ou rolagem horizontal com snap, e um clique que amplia a miniatura.
28. **[P2] melhoria · `/pedidos/` · iPad · 13:32 [uso]** · A barra fixa de título da lista é translúcida e deixa o texto da linha de baixo aparecer por trás ("Auto Peças Rodovia" sob "Pedidos"), um caso leve de texto sobre texto. · `40-ipad-lista-rolada.png` · Aumentar o desfoque e a opacidade da barra fixa, ou pôr uma borda inferior com fundo sólido.
29. **[P2] erro · `/configuracoes/aparencia/` · desktop 1440 · 13:07 [uso]** · Na "Prévia do material", o selo "Em andamento" e o "Campo de exemplo" passam cerca de 22 px da borda do card externo (houve rolagem horizontal de 3 px na página). · `02-d1440-aparencia.png` · `min-w-0` e `overflow-hidden` no card da prévia, e o campo com `w-full` dentro do padding.
30. **[P2] melhoria · `/pedidos/novo/` · desktop · 13:07 [better-layout]** · Na linha Valor/Prazo, rótulos e campos ficam desalinhados: "Valor (R$)" está em y=424 e "Prazo" em y=429, e os campos estão em 437 e 448. · `02-d1440-novo.png` · Alinhar a linha pelo topo e reservar a altura da dica ("Use vírgula para os centavos") nos dois campos.

### P3

31. **[P3] melhoria · banners · Sinal (claro e escuro) · 13:45 [impeccable: radial-spotlight-glow; consistency busy-ground]** · O subtítulo "Acompanhe, filtre e avance os pedidos" atravessa as ondas claras do banner, com o fundo agitado atrás do texto. · `51-montagem-pedidos-cel-sinal.png` · Gradiente de leitura à esquerda do banner ou ondas só na metade direita.
32. **[P3] melhoria · `/pedidos/` · desktop · 13:29 [uso]** · O "×" de fechar do aviso fica em cima do selo "Cancelado" da linha. · `30C-excluir.png` · Avisos acima da área de conteúdo (offset igual à altura da barra), ou o fechar dentro do aviso.
33. **[P3] melhoria · dados de exemplo · `/clientes/` · 13:07 [break-ui]** · E-mails que não batem com o nome: "Restaurante Sabor da Serra" com `contato@restaurantesaborda…` e "Construtora Alicerce" com `…construtoraalicerc…`. A contagem de pedidos aparece solta, sem rótulo. · `02-d1440-clientes.png` · Gerar o e-mail a partir do nome e rotular a contagem ("2 pedidos").
34. **[P3] melhoria · movimento · `/` [impeccable: bounce-easing]** · `cubic-bezier(0.34, 1.3–1.4, 0.64, 1)` em `src/styles/sistema.css:1058` e no início: um repique que soa datado em painel de operação. · fonte · Usar `ease-out` exponencial no painel e guardar a mola para gestos.
35. **[P3] observação · servidor · 13:33 a 13:35** · Entre 13:33 e 13:35 as páginas com `?preset=` chegaram em branco, sem fonte e sem classe, mas o motivo foi meu: o Git Bash converteu "/" em caminho. Às 13:35 tudo carregava normalmente. Não é defeito do starter. Registro só para quem repetir o teste: use `MSYS_NO_PATHCONV=1`.

### Achados adicionais: consistency.mjs (13:55) e revisor de movimento do Impeccable (13:58)

O `consistency.mjs` terminou em `/pedidos/` (38 FAIL, 42 WARN) e em `/pedidos/novo/` (22 FAIL, 33 WARN). Muitos FAIL são de página de marketing e não se aplicam a painel (hero-screen, one-section, copy-*). Fiquei só com os de sistema:

36. **[P2] erro · `/pedidos/` · 820 px · [consistency: spill, off-grid]** · A barra de filtros ("Todos os status…") passa do seu card e sai da grade. É o mesmo problema visto no iPad em `40-ipad-quadro-deslizado.png`, com o campo de busca sem ocupar a largura. · `qa/cons/iniciopedidos_/` · Pôr os filtros em grid com `minmax(0,1fr)` e a busca com `flex-1 basis-full` abaixo de 900 px.
37. **[P2] erro · `/pedidos/` (tabela) · 820 px · [consistency: overlap-text]** · Na linha do pedido #1099, o cliente longo ("Companhia Brasileira…") invade a coluna vizinha. No início, "R$ 16.734,00" encosta no texto ao lado em "Pedidos recentes". · `qa/cons/` · `min-w-0` e `truncate` na célula, com largura mínima por coluna (`table-layout: fixed` e `colgroup`).
38. **[P3] melhoria · todas as rotas · [consistency: focus-ring]** · Há classes `focus:outline-hidden` e `focus-visible:outline-none` sem anel substituto em alguns controles. A checagem focus-visible passou no geral, mas vale auditar cada controle que remove o outline. · `qa/cons/*.txt` · Todo `outline-none` acompanhado de `focus-visible:ring-*`.
39. **[P3] melhoria · `/pedidos/novo/` · [consistency: heading-scale]** · O "R$ 0,00" do resumo é maior que o título "Novo pedido": o número vazio vira o elemento principal da tela. · `02-d1440-novo.png` · Deixar o valor do resumo esmaecido enquanto for zero, ou num tamanho menor que o h1.

Revisor de movimento do Impeccable (`impeccable:impeccable-motion-reviewer`, sobre as capturas; os tempos vêm das minhas medições, não das dele):

40. **[P1] erro · abertura · [impeccable-motion]** · A abertura tem duas fases com um quadro morto entre elas: carregador com barra (100 ms), tela vazia só com "Pular" (400 ms) e só então o bloco de vidro com o logo (900 ms). Somam 3,7 s em toda sessão, contra o próprio catálogo, que diz para não usar abertura em fluxo de uso diário (`src/arsenal/catalogo.ts:33`). · `70-no-preference-t100.png`, `-t400.png`, `-t900.png` · `localStorage` (uma vez por aparelho), no máximo 1200 ms com saída em 300 ms, e esconder o carregador só quando a forma já tiver pintado.
41. **[P2] erro · carregador com movimento reduzido · [impeccable-motion]** · `.carregamento-barra` (`src/styles/global.css:1741`) continua deslizando sem fim com `prefers-reduced-motion: reduce`. · `70-reduce-abertura.png` · `@media (prefers-reduced-motion: reduce) { .carregamento-barra { animation: none; width: 100%; opacity: .5 } }`.
42. **[P2] melhoria · gráfico do card do pico · [impeccable-motion]** · Aos 2 s, o card central ainda está vazio (sem linha e sem "24") enquanto o resto já assentou: o desenho de 1400 ms sobra depois de tudo. · `70-no-preference-t2000.png` · Desenhar em cerca de 700 ms com ease-out, junto com a entrada, e mostrar o número desde o primeiro quadro.
43. **[P2] observação · hidratação · [impeccable-motion]** · O revisor discorda da minha hipótese do achado 21. Para ele, a causa provável do erro de hidratação são os dados ou o texto dependente da hora, diferentes entre servidor e cliente. Os KPIs mudaram entre sessões (R$ 77,2 mi e 12 concluídos às 13:07, contra R$ 98,9 mi e 16 às 13:17). · `02-iphone-inicio.png`, `10-inicio-5s.png` · Fixar a semente e a data dos dados simulados, e renderizar no cliente "há 5 min" e a saudação.
44. **[P3] melhoria · hover com mola · [impeccable-motion]** · Elevação no hover de 420 ms com `cubic-bezier(0.34, 1.4, 0.64, 1)` (`sistema.css:1058`), longa demais para resposta imediata. · fonte · 200 ms com `cubic-bezier(0.23, 1, 0.32, 1)`, sem overshoot.

Manter, segundo o revisor: o crossfade curto do ClientRouter com a moldura parada, a regra `reduce` que zera as view transitions, o "Pular" na abertura e o número que já nasce com o valor final no HTML.

### O que funcionou bem (para não perder)

- Filtros combinados com contagem viva ("6 de 43 pedidos"), estado vazio com "Limpar filtros" e quadro com colunas vazias tratadas.
- A criação de pedido abre o pedido recém-criado (#1100) e a lista o mostra.
- A busca pela lupa no celular encontra o cliente de nome longo e abre o detalhe.
- O foco volta ao link de origem depois de Esc, os nomes acessíveis estão completos e a reflow em 640 px não tem rolagem horizontal.
- O tema "sistema" acompanha a troca claro/escuro em tempo real.
- Nenhuma animação fica em laço depois de 7 s.
- Os 5 presets são coerentes entre si em cor, fonte e banner. O Vidro claro é a melhor combinação visual.

---

## Top 10 melhorias que mais elevariam a nota

1. **Formulário à prova de nome longo no celular** (achado 1): `min-w-0` no grid e no Select, valor truncado e teste fixo com o cliente c99.
2. **Tablet de verdade abaixo de 1024 px** (achado 2): lateral recolhida ou barra de abas, banner do início empilhado por container query e cards da linha com a mesma altura.
3. **Uma família só de card** (achados 11 e 24): mesmo raio, borda e sombra em toda a visão geral. O card do pico perde o brilho próprio, ganha destaque pelo número e pelo acento, e a linha usa `items-stretch`.
4. **Desfazer que se alcança** (achados 3 e 4): o aviso acima da folha (ou o Desfazer dentro da folha), com 6 a 8 s e pausa no hover e no foco.
5. **Folha inferior com gesto no celular** (achado 17): alça, pontos de parada, fechar ao puxar e elástico. É o que mais muda a sensação de app nativo.
6. **Vidro que se vê** (achado 12): fundo com conteúdo atrás dos cards quando o vidro está ligado, para o interruptor do dono produzir diferença visível nos 5 presets.
7. **Piso tipográfico e contraste** (achados 10 e 13): nada abaixo de 12 px, badge de notificação com ≥ 4,5:1 e controle segmentado com ≥ 3:1 no Sóbrio claro.
8. **Fluxo da gestora completo** (achados 5 e 16): Ctrl K abre o pedido, botão Exportar CSV do recorte e filtros na URL.
9. **Validação viva no formulário** (achados 6, 7 e 30): o erro some ao corrigir, máscara de moeda, prazo mínimo e a linha Valor/Prazo alinhada.
10. **Arsenal em português e com a peça primeiro** (achados 15, 25 e 26): demos em pt-BR e R$, a peça viva antes da documentação no celular e tabelas com rolagem horizontal.

---

## O que não deu para testar, e por quê

- **Safari e Firefox reais:** só o Chrome instalado foi usado, como pedido. O vidro sem `backdrop-filter` (Firefox antigo) e o filtro SVG do botão líquido no WebKit ficaram sem verificação. Os descritores do iPhone emulam a tela e o toque, não o motor WebKit.
- **Leitor de tela real (NVDA ou VoiceOver):** conferi nomes, papéis, títulos e foco pelo DOM, mas não o que é anunciado nem a ordem de leitura falada (por exemplo, se o aviso usa `aria-live`).
- **Arrastar e soltar no quadro:** o recurso não existe. Testei que segurar e arrastar não faz nada, então não houve gesto a avaliar.
- **Desempenho real e quadros por segundo:** tudo rodou no servidor de desenvolvimento (hidratação de cerca de 5 s, com skeleton longo ao abrir pedido pelo início). Os tempos não representam o build, e o FPS das animações não foi medido.
- **Exportar:** não existe na interface, então não deu para testar o arquivo gerado.
- **Matriz de presets completa em todas as rotas:** a matriz de 20 combinações cobriu o início (desktop) e `/pedidos/` (iPhone). As demais rotas foram vistas só no preset Noite escuro e por amostragem.
- **Densidades (compacta, confortável, campo), raio, borda e destaque próprio no painel de aparência:** não troquei esses ajustes finos. Foram testados só preset, tema e vidro.
- **Troca de rota (crossfade):** minhas capturas em 120 e 420 ms foram feitas antes de a navegação acontecer, então a transição não foi avaliada. É preciso recapturar em 0, 60, 120, 180 e 300 ms depois do clique efetivo.
- **Landscape no celular e teclado virtual aberto:** não emulados. O teclado virtual cobrindo a barra de abas no formulário fica sem verificação.
