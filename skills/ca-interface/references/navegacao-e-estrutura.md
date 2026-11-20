# Navegação e estrutura (NAV)

Cobre arquitetura da informação por objetos, shell do app, profundidade, breadcrumbs, URL como estado, paleta de comandos, atalhos, tela inicial, interligação entre módulos e continuidade de trabalho. Não cobre listagens e filtros (`listagens-e-filtros.md`), escolha de camada e abas dentro da página (`formularios-e-camadas.md`), números de largura e duração (`fundamentos-e-tokens.md`), adaptação por dispositivo em detalhe (`dispositivos-e-entrada.md`) nem passagens entre pontas por notificação (`pontas-e-sistema.md`).

Formato de cada regra: **ID** · selo · prioridade mínima — regra. O porquê vem logo depois. Selos: [N] norma, [P] pesquisa, [DS] design system, [PR] praticante. Regra só [PR] fica em P2 no máximo.

## Sumário
1. Objetos antes de telas
2. Interligação entre módulos
3. Shell do app
4. Profundidade e breadcrumbs
5. URL como estado
6. Paleta de comandos e busca
7. Atalhos
8. Tela inicial
8A. Composição e cabeçalho
9. Continuidade de trabalho
10. Padrão detectável → correção

## 1. Objetos antes de telas

Arquitetura da informação (objetos, grupos, nomes, relações) vem antes da navegação, que é só a parte visível dela. Desenhar menu antes de saber os objetos gera navegação que espelha o organograma ou o banco de dados, não a tarefa.

- **NAV-01** · [P] · P2 — Antes da primeira tela, liste os objetos do sistema (Cliente, Pedido, Fatura, Chamado…) com atributos, ações e ciclo de vida, e monte a matriz de relações objeto × objeto (OOUX/ORCA). Cada objeto principal vira página de detalhe com URL própria.
  Porquê: o NN/g manda desenhar a AI antes da navegação; a matriz torna visível cada relação que precisa de link, e relação sem representação na UI é beco sem saída.
- **NAV-02** · [DS] · P2 — Organize a navegação pela tarefa do usuário, não pela estrutura interna do negócio, dos módulos do ERP ou das tabelas.
  Porquê: Carbon pede navegação por tarefa; menu por departamento obriga o usuário a saber como a empresa se organiza por dentro.
- **NAV-03** · [PR] · P2 — Use um só nome por objeto e por ação em todas as telas e pontas (glossário no `GLOSSARY.md`). O mesmo identificador do objeto (nº do pedido, protocolo) aparece em todas as telas e pontas.
  Porquê: sinônimos ("Pedido", "Ordem", "Venda") fazem o usuário duvidar se são coisas diferentes; o mesmo número permite que operador e cliente falem do mesmo objeto. Microtexto em `microtexto-ptbr.md`.

## 2. Interligação entre módulos

Fluxos interligados dependem de cada célula da matriz de objetos virar um caminho navegável nos dois sentidos.

- **NAV-04** · [DS] · P2 — Toda relação mapeada aparece nos dois registros. Na página do objeto, um bloco "Relacionados" mostra cada tipo com contagem e link para a lista já filtrada pelo pai (`/faturas?cliente=123`), não para a lista geral.
  Porquê: HubSpot trata associações como sempre bidirecionais; link para lista sem filtro joga o usuário de volta à busca.
- **NAV-05** · [DS] · P2 — Toda referência textual a outro objeto é link real (`<a href>`): "Pedido SO-5316", "para Lumen Bike Studio", o comprador do pedido. Nenhum ID ou nome de registro aparece como texto morto.
  Porquê: nos demos medidos, OS, faturas e movimentos citavam outros objetos sem link, e o usuário tinha de copiar e buscar.
- **NAV-06** · [N] · P2 — Hovercard ou peek de registro relacionado (campos-chave e ações rápidas) também abre por foco e por toque, fecha com Esc sem mover o ponteiro, aceita o ponteiro sobre ele e não some sozinho (WCAG 1.4.13). Tem sempre um link que abre o registro de verdade.
  Porquê: preview só por hover exclui teclado e toque; o critério 1.4.13 vale para hovercards.
- **NAV-07** · [DS] · P2 — Ação contextual que cria objeto em outro módulo chega preenchida com o vínculo: "Criar fatura" a partir do Cliente já traz o cliente; "Produzir mais" a partir do estoque traz produto e lote. Ao concluir, o foco volta à origem e o objeto novo aparece na origem, na lista do módulo e nos contadores.
  Porquê: sem pré-preenchimento, o usuário redigita o que o sistema já sabe; sem retorno, perde o lugar. Demos executados confirmam o padrão.
- **NAV-08** · [PR] · P3 — Quando um módulo depende do estado de outro, mostre esse estado como coluna ou campo ("Produção: WO-2047 100%") e libere a próxima ação a partir dele ("Marcar pronto para envio").
  Porquê: o usuário decide sem abrir o outro módulo.

## 3. Shell do app

O shell é a moldura persistente: cabeçalho global, navegação, área de trabalho. Cada rota usa a mesma moldura; rota que parece página independente quebra a sensação de app.

- **NAV-09** · [DS] · P2 — O cabeçalho global dá senso de lugar: organização ou workspace ativo, ambiente (produção, homologação), conta e modo. Trocar de organização ou ambiente deixa indicação persistente. Links do cabeçalho navegam no próprio produto, sem nova aba.
  Porquê: Carbon exige "senso de lugar" no header; operar no ambiente errado é erro caro e silencioso.
- **NAV-10** · [DS] · P2 — A sidebar lista módulos estáveis e curtos. Conteúdo ilimitado criado pelo usuário (projetos, clientes, pastas) não entra nela; vai para "Recentes/Favoritos", para a paleta ou para drill-down com breadcrumbs.
  Porquê: Carbon proíbe conteúdo ilimitado na side nav; a lista cresce até esconder os destinos fixos.
- **NAV-11** · [P] · P2 — No desktop, a navegação global fica visível. Itens de navegação primária têm ícone e rótulo visível. Sidebar recolhida (trilho) mantém nome acessível e tooltip em cada ícone, indica o item ativo e persiste a preferência do usuário.
  Porquê: no estudo do NN/g, a navegação foi usada em 89% das tarefas quando parcialmente visível e em 44% quando escondida atrás de um ícone; só casa, impressão e lupa são ícones universais.
- **NAV-12** · [DS] · P2 — No celular, os destinos recorrentes vão numa barra de navegação inferior, com rótulo em cada item e "Mais" para o restante; busca fica separada. A barra inferior navega e não executa comandos ("Criar cliente" é botão, não aba). Seção vazia não some da barra: explica a ausência. Seção não autorizada pode não aparecer.
  Porquê: HIG manda usar tab bar para navegar, não para agir, e não esconder abas vazias, para os destinos não mudarem de lugar.
- **NAV-13** · [PR] · P3 — A navegação se adapta em degraus: sidebar expandida → trilho de ícones → barra inferior com "Mais". Pontos de troca e larguras ficam em `fundamentos-e-tokens.md`; decida pela largura útil, não pelo nome do aparelho.
  Porquê: os demos com shell responsivo mantêm a mesma ordem de destinos nos três degraus, o que preserva a memória espacial.
- **NAV-14** · [PR] · P3 — O item ativo da navegação muda na hora: `aria-current="page"` e o conteúdo atualizam antes de qualquer animação, e o indicador visual desliza com `spring-rapida`, sem quique, ou troca na hora (TOK-39, MOV-05).
  Porquê: troca de módulo é ação de dezenas a centenas de vezes por dia; um demo só confirmava a aba ativa cerca de 1 s depois do toque. Regras de movimento em `movimento.md`.
- **NAV-15** · [DS] · P2 — Rótulo de dropdown do cabeçalho só abre o menu; não é link ao mesmo tempo. Um controle, uma função.
  Porquê: Carbon separa os dois; controle com duas funções surpreende quem clica no rótulo.

## 4. Profundidade e breadcrumbs

- **NAV-16** · [DS] · P2 — A sidebar tem no máximo dois níveis de hierarquia. Profundidade maior (coleções, registros, documentos) vai para a área de conteúdo, com drill-down e breadcrumbs.
  Porquê: HIG limita a sidebar a dois níveis; uma árvore inteira de módulos, submódulos e registros vira labirinto.
- **NAV-17** · [P] · P3 — Breadcrumb mostra a hierarquia do objeto (Clientes > Lumen Bike Studio > Pedido SO-5316), não o histórico de cliques. A página atual é o último item, sem link e visualmente distinta. Inclua só níveis que têm página própria. Dispense em estrutura rasa (1–2 níveis). No celular, mostre o último ou os dois últimos níveis, sem quebrar em várias linhas.
  Porquê: diretrizes do NN/g; "voltar por onde vim" é papel do Voltar do navegador.

## 5. URL como estado

A URL é o mecanismo de continuidade: compartilhar, recarregar, voltar e abrir em nova aba dependem dela. O usuário percebe cada filtro aplicado e cada painel aberto como uma visão distinta.

- **NAV-18** · [P] · P2 — Toda visão que o usuário percebe como distinta tem URL: registro aberto, aba principal e aba do registro, painel de detalhe, filtros, busca confirmada, ordenação, período de KPI, página ou quantidade carregada. Dados sensíveis (CPF, e-mail, texto livre de pessoa) ficam fora da URL.
  Porquê: Baymard viu usuários tratarem cada filtro como visão própria; os seis demos de dados perdiam tudo ao recarregar.
- **NAV-19** · [DS] · P2 — Escolha push ou replace pela regra abaixo, e mantenha a mesma regra em todo o produto.

  | Mudança | Histórico |
  | --- | --- |
  | Abrir registro, trocar aba principal, abrir painel de detalhe grande, aplicar filtro confirmado | push |
  | Digitar na busca, ajustar ordenação, carregar mais, ajustes transitórios de UI | replace |
  | Navegar entre itens de uma fila com o painel aberto (J/K) | replace, desde que abrir e fechar o painel usem push/back |
  | Fechar camada que a própria aplicação abriu | `history.back()` |
  | Fechar camada que veio de deep link | replace para a URL-mãe |

  Porquê: push demais polui o Voltar; push de menos faz o Voltar sair do app. Fechar com push faz o Voltar reabrir o drawer, defeito medido num demo.
- **NAV-20** · [P] · P2 — Voltar desfaz a última visão: fecha o overlay ou o painel, remove o último filtro aplicado e atualiza a UI para refletir o estado da URL. Avançar refaz. A rolagem é restaurada nos dois sentidos.
  Porquê: Baymard viu a maioria dos overlays não fechar com Voltar e viu filtro removido pelo Voltar que continuava marcado na UI, e o usuário achou que nada mudou.
- **NAV-21** · [DS] · P2 — No celular, abrir o detalhe a partir de uma lista entra no histórico, e o Voltar do sistema volta à lista sem sair do app. Sobe para P1 em fluxo essencial.
  Porquê: em demos com `replaceState` ou sem URL, o Voltar do Android saía do app.
- **NAV-22** · [N] · P2 — Em troca de rota numa SPA: atualize `document.title` do mais específico ao mais geral ("Pedido SO-5316 · Pedidos · Produto"), mova o foco para o `<h1 tabindex="-1">` da nova vista, atualize `aria-current` e restaure a rolagem no voltar e no avançar (WCAG 2.4.2 e 2.4.3).
  Porquê: sem isso, quem usa leitor de tela não percebe a troca, e a aba do navegador não diz onde a pessoa está.
- **NAV-23** · [N] · P2 — Links de navegação e de registro são `<a href>` reais, para Ctrl/⌘+clique, clique do meio, "copiar link" e "abrir em nova aba" funcionarem. Não use `onclick` em `div` ou `tr` como único caminho (WCAG 2.1.1).
  Porquê: navegação por JS sem `<a>` quebra nova aba e teclado. A regra da linha de tabela está em `listagens-e-filtros.md`.
- **NAV-24** · [N] · P1 — Deep link reproduz a visão: colar a URL numa aba anônima, já autenticada, mostra a mesma aba, filtros, registro e painel. O destino confere permissão antes de mostrar (o link pode ter sido encaminhado) e trata objeto que mudou desde o envio ("Este pedido já foi entregue"). Link de filtro não promete fotografia dos dados.
  Porquê: o critério de aceite da continuidade é esse teste; mostrar dado a quem não pode ver é falha de LGPD (art. 46), não de gosto.
- **NAV-25** · [DS] · P3 — Navegação superada não sobrescreve a atual: aborte o fetch da rota antiga (`event.signal` da Navigation API, `AbortController` ou token de corrida). Cache de vistas montadas tem teto (LRU).
  Porquê: respostas fora de ordem mostram a tela errada; um demo sem teto chegou a 15,7 mil nós no DOM. Respostas fora de ordem em mutações ficam em `estados-e-ui-otimista.md`.

## 6. Paleta de comandos e busca

- **NAV-26** · [DS] · P2 — A paleta de comandos abre de qualquer tela com o mesmo atalho (Ctrl+K / ⌘K), numa camada própria acima de tudo, e devolve o foco ao elemento anterior ao fechar. Ela abre no mesmo quadro do atalho, com o campo focado e aceitando digitação; a caixa pode acompanhar com opacidade e escala curtas, sem atrasar nada, e os itens aparecem juntos, sem stagger (MOV-02).
  Porquê: regras do Superhuman; abrir a paleta é ação de 100+ vezes por dia, e a frequência pede a resposta mais curta (MOV-01): o que incomoda é esperar, não o movimento.
- **NAV-27** · [N] · P2 — A paleta é um combobox ARIA (APG): `role="combobox"` no campo, `aria-expanded`, `aria-controls` apontando o listbox, foco DOM sempre no campo, `aria-activedescendant` na opção ativa, ↓/↑ movem, Enter executa, Esc fecha, Home/End continuam editando texto. A contagem de resultados e o vazio são anunciados (`role="status"`).
  Porquê: é o padrão que leitores de tela entendem; capturar Home/End quebra a edição do texto.
- **NAV-28** · [DS] · P3 — Cada comando mostra seu atalho em `<kbd>`. Antes de digitar, a paleta mostra recentes e ações do contexto atual (registro aberto). A busca é tolerante a erro e a sinônimos. Resultados vêm agrupados por tipo (Cliente, Pedido, Ação), e o resultado pode trazer a ação ("Mover para Proposta enviada ⇧↵"). O vazio diz o que dá para buscar ("Tente um número de OS, um SKU, um cliente").
  Porquê: a paleta ensina os atalhos e acelera a retomada; vazio genérico não orienta.
- **NAV-29** · [P] · P2 — Paleta e atalhos são aceleradores. Toda ação alcançável por eles também tem caminho visível na interface.
  Porquê: NN/g e Primer: acelerador nunca é o único caminho; aprender o produto não pode depender dele.
- **NAV-30** · [DS] · P2 — O escopo da busca fica explícito: "Buscar em clientes" (atua no conjunto da listagem) é diferente de "Buscar no sistema" (vários módulos). Sugestões não oferecem registros que o usuário não pode abrir.
  Porquê: HIG pede escopo reconhecível; busca local que parece global faz o usuário concluir que o registro não existe.

## 7. Atalhos

- **NAV-31** · [N] · P2 — Atalho de tecla única (letra, número, símbolo, inclusive com Shift, e sequências como G depois A) só existe se puder ser desligado, remapeado para incluir Ctrl/Alt, ou se só funcionar com foco no componente (WCAG 2.1.4). Tecla única que altera dado (concluir, aprovar, excluir) fica ativa só com foco na fila ou no item.
  Porquê: quem usa voz dispara atalhos ao ditar, e quem usa teclado dispara por acidente; os demos usavam C, N, T, D e G sem opção de desligar.
- **NAV-32** · [DS] · P2 — Tecla única nunca dispara com foco em `input`, `textarea`, `select` ou `contenteditable`. Não sobrescreva atalhos do navegador, do sistema ou de tecnologia assistiva: Ctrl/⌘ + F, L, T, W, N, P, C, V, A, Z. Se precisar de busca própria, use outro atalho ou deixe o segundo Ctrl+F chegar ao navegador.
  Porquê: Primer manda evitar essas combinações; leitores de tela reservam muitas teclas únicas.
- **NAV-33** · [PR] · P3 — Teste todo atalho com símbolo ("[", "/", "?", ";") num teclado ABNT2. Prefira letras com modificador. Decida entre `event.key` (o caractere digitado) e `event.code` (a posição física) e registre a escolha.
  Porquê: "[" exige AltGr em teclados não US (caso documentado na sidebar do Jira), e "/" e "?" mudam de lugar no ABNT2.
- **NAV-34** · [DS] · P3 — Ensine atalhos no ponto de uso: tecla no tooltip ("Excluir · Del"), na linha do menu alinhada à direita, dentro do botão quando a fila é operada por teclado ("Aprovar A"); `aria-keyshortcuts` no controle; lista pesquisável no diálogo "?", que reflete o estado ligado/desligado das teclas únicas.
  Porquê: NN/g pede descoberta por dicas; cheat sheet é o último recurso. `aria-keyshortcuts` só anuncia, não implementa.

## 8. Tela inicial

- **NAV-35** · [PR] · P2 — A tela inicial de cada ponta responde primeiro "o que precisa de mim agora": filas com contagem ("Esperando você 7", "Vence hoje 3", "Falhas 4"), exceções e pendências, cada item levando à lista já filtrada. Métricas e gráficos vêm depois e respondem a uma decisão (`indicadores-e-graficos.md`).
  Porquê: o briefing manda posicionar exceções e pendências conforme o trabalho; nos demos executados, a fila como tela inicial elimina a busca diária pelo que fazer. No cliente, o equivalente é o pedido ou chamado ativo em destaque (`cliente.md`).
- **NAV-36** · [PR] · P3 — Cada contagem da tela inicial diz o escopo e bate com a lista que abre: "4 com falha hoje" leva à lista com o filtro "hoje", não a "7 com falha" sem período.
  Porquê: demos mostraram contagens divergentes sem escopo rotulado. Coerência numérica em `indicadores-e-graficos.md`.

## 8A. Composição e cabeçalho

- **NAV-40** · [N casa] · P1 · QUANDO (desktop) — **Composição que usa a largura.** No desktop de referência (1440×900), as telas de visão geral, painel e detalhe são obrigatoriamente compostas numa **grade de 12 colunas com cards de pelo menos dois tamanhos diferentes** (bento), em **mestre-detalhe** (lista e detalhe lado a lado) ou em conteúdo com **painel lateral**. É obrigatório também:
  - **o que decide o dia fica acima da dobra**: a fila do que precisa de mim (NAV-35), o KPI-herói e a ação principal aparecem inteiros nos primeiros 900 px, sem rolar;
  - **nada de coluna única empilhada com mais de 2,5 telas de altura** (2.250 px em 1440×900);
  - **nada de rolagem interna dentro da página**: card ou seção com rolagem própria dentro de uma página que já rola é achado. A exceção é o mestre-detalhe em que a página fica fixa na altura da janela e só a lista e o detalhe rolam.
  Fora do desktop, a composição é de DIS-05 e DIS-22. Lente: `better-layout` na tela-chave, quando instalada (`lentes-e-ferramentas.md`); sem ela, esta regra é o critério.
  Porquê: na iteração 3, telas de visão geral viraram colunas únicas e longas, com a largura do desktop sobrando nas laterais e o que importava abaixo da dobra.
  Verificar: em 1440×900, a altura rolável da página, ou do contêiner principal (VER-18), é ≤ 2.250 px; a grade tem 12 trilhas (ou equivalente) e pelo menos duas larguras de card; o bloco que decide o dia tem `getBoundingClientRect().bottom` ≤ 900; nenhum elemento com `overflow: auto` ou `scroll` e conteúdo maior que a caixa dentro do contêiner que já rola, fora da exceção.
- **NAV-41** · [N casa] · P1 · QUANDO (tela de operação) — **Cabeçalho pela frequência da tela.** O banner alto (saudação, imagem, resumo do dia, EXP-37) só entra em tela de marca (boas-vindas, login, abertura), de visão geral e do cliente. Em tela de operação, usada o dia todo (agenda, fila, quadro, tabela, caixa, detalhe de trabalho), o topo é obrigatoriamente um **cabeçalho compacto** (título, contexto, ação principal) ou um **banner que recolhe para o cabeçalho compacto ao rolar**. Ponto de partida: em 1440×900, a área de trabalho (primeira linha da grade, da tabela ou da agenda) começa até 200 px do topo da janela.
- **NAV-42** · [N casa] · P1 · SEMPRE — **Nada solto: todo elemento pertence a um grupo.** Cada texto, número, botão ou ícone está dentro de uma superfície ou de um grupo com título (lei da proximidade): rótulo junto do valor, ação junto do que ela afeta, metadado junto do item. Elemento flutuando sozinho entre dois blocos, botão perdido no fim da página, número sem rótulo, card órfão numa linha da grade e linha de texto solta abaixo de uma lista são achados. A hierarquia se lê em 3 níveis por tela (título da página, título de grupo, conteúdo), com espaço maior **entre** grupos do que **dentro** deles. *Por quê:* elemento solto apaga a hierarquia e deixa a tela bagunçada, mesmo com bom visual. *Verificar:* detector de card órfão e de elemento sem contêiner no `navegar.mjs`; lente `better-layout` e `layout` do Impeccable; olhar as capturas procurando o que não tem dono.
  Porquê: na iteração 3, a grade da agenda da barbearia só começava por volta de 260 px numa tela de 900, com o banner comendo a área de trabalho de uma tela de alta frequência.
  Verificar: em cada tela de operação, medir o topo da área de trabalho em 1440×900 (≤ 200 px, ou banner que recolhe ao rolar 100 px); banner alto só nas telas de marca, visão geral e cliente.

## 9. Continuidade de trabalho

- **NAV-37** · [DS] · P2 — Ao voltar do detalhe, a lista restaura critérios, página, rolagem e seleção. Se o registro editado saiu do conjunto (mudou de status), explique ou reflita a mudança; não dependa de a linha continuar no mesmo índice.
  Porquê: critério de aceite do briefing para "localizar, consultar e voltar"; lista que reseta obriga a refazer a busca.
- **NAV-38** · [DS] · P3 — Ofereça pontos de retomada: "Recentes" no seletor e na paleta, "Continuar de onde parou" na tela inicial do módulo, e o passo atual de fluxos longos na URL (`?passo=3`). Rascunho e salvamento ficam em `formularios-e-camadas.md`.
  Porquê: Carbon recomenda recentes e frequentes no switcher; o resto é inferência registrada na base (sem fonte primária sobre retomada entre dispositivos).
- **NAV-39** · [DS] · P2 — Fechar qualquer camada devolve o foco a quem a abriu, ou ao destino lógico quando o gatilho sumiu (`formularios-e-camadas.md`). Trocar de módulo e voltar mantém o estado útil de cada destino (filtro, aba, rolagem).
  Porquê: HIG pede que a navegação por abas preserve contexto; foco perdido no `body` obriga a recomeçar do topo.

## 10. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| ID ou nome de registro renderizado fora de `<a>` (regex de padrão de ID no texto) | NAV-05: virar link para o registro |
| Relação visível só num dos lados | NAV-04: bloco "Relacionados" com contagem e lista filtrada pelo pai |
| Sidebar com lista de projetos ou clientes que cresce | NAV-10: mover para Recentes/Favoritos, paleta ou drill-down |
| Menu hambúrguer no desktop; trilho só de ícones sem nome acessível | NAV-11 |
| Barra inferior com "Criar" ou "+" como aba | NAV-12: comando vira botão |
| Breadcrumb com o item atual clicável ou mostrando histórico | NAV-17 |
| Filtro, busca, ordenação ou período só em estado de memória; F5 perde tudo | NAV-18 |
| Fechar drawer com `pushState`; Voltar reabre a camada | NAV-19 |
| `replaceState` ao abrir detalhe no celular; Voltar sai do app | NAV-21 |
| `document.title` fixo em todas as rotas; foco fica no link clicado após trocar de rota | NAV-22 |
| `<tr onClick>` ou `<div onClick>` navegando sem `<a href>` | NAV-23 |
| Fetch de rota sem abort; vistas mantidas montadas sem teto | NAV-25 |
| Paleta que segura a digitação, com entrada lenta ou stagger dos itens | NAV-26, MOV-02 |
| Paleta sem `role="combobox"` / `aria-activedescendant`; foco não volta ao fechar | NAV-26, NAV-27 |
| `keydown` com tecla única sem checar `event.target` editável nem preferência de desligar | NAV-31, NAV-32 |
| `preventDefault` em Ctrl/⌘+F, L, T, W, N | NAV-32 |
| Atalho em "[" ou "/" sem teste ABNT2 | NAV-33 |
| Tela inicial abre em grade de KPIs sem fila de pendências | NAV-35 |
| Voltar do detalhe reseta página e rolagem | NAV-37 |
| Visão geral no desktop em coluna única com mais de 2,5 telas, ou com card que rola dentro da página | NAV-40: grade de 12 colunas com cards de tamanhos diferentes, mestre-detalhe ou painel lateral |
| Banner alto em agenda, fila ou tabela; área de trabalho começando abaixo de 200 px em 1440×900 | NAV-41: cabeçalho compacto ou banner que recolhe ao rolar |

## Fontes

- NN/g — IA vs. Navigation: https://www.nngroup.com/articles/ia-vs-navigation/
- NN/g — Breadcrumbs: https://www.nngroup.com/articles/breadcrumbs/
- NN/g — Hidden navigation: https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/
- NN/g — UI Accelerators: https://www.nngroup.com/articles/ui-accelerators/
- NN/g — Icon Usability: https://www.nngroup.com/articles/icon-usability/
- Adobe Design — Object maps (OOUX): https://adobe.design/ideas/why-ux-designers-should-create-object-maps-and-how-to-start
- HubSpot — Associate records: https://knowledge.hubspot.com/records/associate-records
- Carbon — Global header / UI shell: https://carbondesignsystem.com/patterns/global-header/
- Apple HIG — Sidebars: https://developer.apple.com/design/human-interface-guidelines/sidebars
- Apple HIG — Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Apple HIG — Searching: https://developer.apple.com/design/human-interface-guidelines/searching
- Baymard — Back Button Expectations: https://baymard.com/blog/back-button-expectations
- Chrome — Navigation API: https://developer.chrome.com/docs/web-platform/navigation-api
- Superhuman — Command palette: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/
- WAI-ARIA APG — Combobox: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- W3C — WCAG 2.1.4 Character Key Shortcuts: https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html
- W3C — WCAG 1.4.13 Content on Hover or Focus: https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- Primer — Keyboard shortcuts: https://primer.style/accessibility/patterns/keyboard-shortcuts
- Atlassian Community — "[" e AltGr: https://community.atlassian.com/forums/Navigation-Refresh-articles/A-full-height-sidebar-for-better-navigation/ba-p/3144347
- Estudos code&chill (Rapport, Tandem, Wynlo, Cadra, Ostrel, Bastio): síntese de estudo prático (demos medidos), sem arquivo público
