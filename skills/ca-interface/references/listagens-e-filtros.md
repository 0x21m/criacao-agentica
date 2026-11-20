# Listagens e filtros (LIS)

Cobre a escolha entre tabela, lista e cards, colunas, densidade, seleção e ações por linha e em lote, paginação, busca, filtros, ordenação, exportação, listagem no celular e reflexo de mutações em contagens. Não cobre estados de carregamento, UI otimista e jobs longos (`estados-e-ui-otimista.md`), URL e histórico em geral (`navegacao-e-estrutura.md`), números de altura de linha, alvos e debounce (`fundamentos-e-tokens.md`), KPI e gráficos (`indicadores-e-graficos.md`) nem fixtures de pior caso (`verificacao.md`).

Formato: **ID** · selo · prioridade mínima — regra, seguida do porquê. Regra só [PR] fica em P2 no máximo.

## Sumário
1. Forma da listagem
2. Colunas, alinhamento e densidade
3. Abrir, selecionar e agir sem conflito
4. Ações em lote
5. Paginação, carregar mais e virtualização
6. Busca e filtros
7. Ordenação
8. Exportação
9. Listagem no celular
10. Uma mutação, todas as contagens
11. Padrão detectável → correção

## 1. Forma da listagem

- **LIS-01** · [DS] · P3 — Escolha a forma pela tarefa: tabela para comparar atributos repetidos entre registros; lista para identificar o item e entrar no detalhe; cards para blocos heterogêneos com identidade visual (pessoas, projetos, arquivos); pares rótulo/valor para os atributos de um registro. Não esconda comparação dentro de cards de altura imprevisível.
  Porquê: HIG e o briefing ligam tabela a comparação e lista a navegação; card como solução automática quebra o alinhamento que permite comparar.
- **LIS-02** · [PR] · P3 — A listagem de trabalho abre na fila "o que precisa de mim" ("A enviar", "Vence hoje"), com contagem por estado nas visões ou chips. O botão da linha nomeia a próxima transição do objeto ("Começar separação", "Marcar embalado"); o resto vai para o menu "⋯".
  Porquê: nos demos executados (Tandem, Ostrel, Bastio), a fila como visão padrão e o verbo da próxima etapa poupam um clique e uma decisão por registro.

## 2. Colunas, alinhamento e densidade

- **LIS-03** · [DS] · P3 — Comece pelas colunas da decisão: identificador principal, campos que decidem, status e ações. Alinhe pelo tipo: texto à esquerda, números e valores à direita com `tabular-nums`, datas num formato só; cabeçalho alinhado como o conteúdo. Larguras iniciais ficam em `fundamentos-e-tokens.md`.
  Porquê: alinhamento por tipo deixa a coluna comparável num relance; o briefing pede colunas priorizadas por tarefa.
- **LIS-04** · [PR] · P2 — Texto livre não empurra status nem ações: célula de texto com `min-width: 0`, truncamento com acesso ao valor completo (tooltip, expansão ou detalhe) e `overflow-wrap: anywhere` em ID e e-mail; colunas de status e ações não encolhem.
  Porquê: num demo, `nowrap` sem reticências escondeu a coluna Status atrás da rolagem; noutro, uma palavra longa abriu a célula em 560 px numa coluna de 262. Teste com a fixture de pior caso pt-BR (razão social longa, CNJ, R$ 9.999.999,99).
- **LIS-05** · [N] · P2 — Status tem texto (e, se ajudar, badge discreto e ícone); cor nunca é o único canal (WCAG 1.4.1). Data e número não precisam de cápsula. *Alerta de uso consciente:* célula que vira card dentro da tabela (sombra, borda e fundo próprios) quebra a leitura da linha e tira a densidade; o que a célula pede é selo, ícone, avatar ou barra pequena, com o card reservado ao detalhe e ao kanban.
  Porquê: até 4,5% das pessoas têm alguma forma de daltonismo (NN/g); cápsula em tudo apaga a hierarquia.
- **LIS-28** · [N casa] · P1 · QUANDO (tabela, lista ou card de lista) — **Tabela robusta.** Toda tabela segura o pior caso sem mudar de forma. É obrigatório: **Camadas fixas empilhadas:** a barra de ferramentas fixa da página e o cabeçalho fixo da tabela são da mesma família (mesmo material do preset, mesma largura de conteúdo, mesmo raio e borda de luz; nunca uma faixa preta de ponta a ponta); o título do card de lista e a linha de colunas grudam juntos como um bloco só que continua o contorno do card (borda lateral, cantos de cima, borda de luz), com uma pequena margem abaixo da barra; o vão entre eles nunca deixa ver as linhas rolando.
  - **larguras de coluna definidas** (`table-layout: fixed`, ou `grid-template-columns` com `minmax`): identificador, status, valores e ações têm largura própria e não encolhem; o texto livre absorve o resto (LIS-04);
  - **altura de linha constante** na densidade escolhida (LIS-07): texto longo não quebra a linha em duas nem empurra a seguinte;
  - **texto longo numa linha só, com reticências** (`text-overflow: ellipsis`, `min-width: 0`) e o **texto completo no hover e no foco** (tooltip que abre também pelo teclado, DIS-12; `title` só no hover não basta);
  - **números tabulares alinhados à direita** (`tabular-nums`), nunca truncados (DIS-12): a coluna tem largura para o maior valor plausível (`R$ 9.999.999,99`);
  - **cabeçalho fixo** (`position: sticky`) em toda tabela que rola, não só nas longas (LIS-06 vira piso).
  O mesmo vale para **listas e cards**: título com reticências e completo no hover e no foco, metadados em altura fixa, valores tabulares à direita.
  Porquê: na iteração 3, colunas cortaram em 1366 px e o texto longo quebrava a forma das linhas; o pior caso (VER-32) só passa com larguras e alturas decididas antes.
  Verificar: com as fixtures de pior caso de VER-16, a largura de cada coluna medida no navegador é a mesma da fixture normal; todas as linhas têm a mesma altura; o texto completo aparece no hover e com Tab; o cabeçalho fica no topo ao rolar.
- **LIS-06** · [P] · P3 — Em tabela com mais de uma tela de linhas, o cabeçalho fica fixo (em toda tabela que rola, pelo piso de LIS-28). Em rolagem horizontal, a coluna identificadora também, com sombra sutil indicando o que passou por baixo. Bordas leves, zebra ou realce de hover ajudam a seguir a linha; zebra nunca se confunde com seleção.
  Porquê: NN/g (Data Tables); os três ERPs medidos não fixavam o cabeçalho.
- **LIS-07** · [DS] · P2 — Ofereça densidade padrão e compacta, com a compacta opt-in e persistida por usuário; a mais densa só em grade de especialista operada com mouse. Em qualquer densidade, alvos clicáveis dentro da linha respeitam o mínimo de WCAG 2.5.8 ou a exceção de espaçamento. Valores em `fundamentos-e-tokens.md`.
  Porquê: Material diz que alta densidade "não cumpre requisitos de acessibilidade" e deve ser opt-in; Carbon oferece cinco alturas. Operador quer densidade; cliente quer conforto (`pontas-e-sistema.md`).

## 3. Abrir, selecionar e agir sem conflito

Abrir, selecionar e agir são três intenções diferentes e precisam de três alvos diferentes.

- **LIS-08** · [N] · P1 — A linha abre por link real (`<a href>` no identificador, para Ctrl/⌘+clique e nova aba funcionarem) ou por elemento focável que abre com Enter. `tr` só com `onclick` não serve. P1 quando é o único caminho para o detalhe; senão P2.
  Porquê: WCAG 2.1.1; num demo, o único elemento focável da linha era o checkbox.
- **LIS-09** · [DS] · P2 — Separe as zonas: checkbox seleciona, link abre, botão age. Clicar numa ação ou no checkbox nunca abre o detalhe por acidente. Foco de teclado, seleção para lote e registro aberto no painel são três estados visuais distintos.
  Porquê: o briefing lista "linha inteira e botão interno disparam juntos" como antipadrão; HIG distingue seleção persistente, seleção para lote e feedback de toque.
- **LIS-10** · [P] · P2 — Ações por linha não dependem de hover: no máximo uma ou duas frequentes como ícone com nome acessível e tooltip; o resto num menu "⋯" com nome acessível; ações sobre vários registros na barra de lote. Ícones de linha têm espaço suficiente entre si (WCAG 2.5.8); ação destrutiva colada a outra sem esse espaço sobe para P1.
  Porquê: NN/g mostra que muitas ações inline ficam difíceis de clicar e que escondê-las no hover as torna difíceis de achar; no toque, ação que só aparece no hover fica inalcançável.
- **LIS-11** · [N] · P1 — Arrastar (reordenar, mover de etapa) sempre tem alternativa sem arrasto: botão de avanço no card ou menu "Mover para…" com a etapa atual marcada e focada. Os caminhos geram o mesmo eco (toast, anúncio, Desfazer).
  Porquê: WCAG 2.5.7 exige alternativa a arrastar. Detalhes de gesto em `dispositivos-e-entrada.md`; paridade de eco em `estados-e-ui-otimista.md`.

## 4. Ações em lote

- **LIS-12** · [DS] · P2 — A seleção mostra quantidade e escopo em palavras: "12 selecionados", "Selecionar todos os 248 resultados deste filtro", "Selecionar os pedidos desta tela que podem avançar". A barra de lote aparece só com seleção e mostra só comandos válidos para ela. Defina e mostre o que acontece com a seleção quando o filtro muda (mantida, limpa ou recalculada).
  Porquê: seleção invisível ou de escopo ambíguo faz uma ação atingir registros que o usuário não via.
- **LIS-13** · [DS] · P2 — O resultado do lote vem por item: sucesso total, parcial ou falha. Em falha parcial ("10 de 12 atualizados"), atualize os 10, identifique os 2 com o motivo e ofereça tratar só esses, sem repetir os que deram certo. O Desfazer do lote reverte todos os itens.
  Porquê: cenário de aceite do briefing; "Algo deu errado" para 12 registros obriga a conferir um por um.
- **LIS-14** · [DS] · P2 — Lote que demora acima do limite de atenção, ou cujo tempo cresce com o volume, vira job com status, cancelamento e notificação (`estados-e-ui-otimista.md`). O botão de lote não pode disparar duas vezes (guarda no handler + chave de idempotência, mesma referência).
  Porquê: num demo, "Tentar 3 de novo" clicado duas vezes criou 6 execuções.

## 5. Paginação, carregar mais e virtualização

- **LIS-15** · [DS] · P3 — Escolha pelo volume e pela tarefa: paginação quando o usuário precisa voltar a uma posição ou citar uma página; "Carregar mais" para percorrer; virtualização só quando o volume medido exige, nunca por padrão. Exponha posição e total ("51–100 de 2.409") quando o total é conhecido; não invente total que ainda não foi calculado.
  Porquê: o briefing proíbe virtualizar por padrão; virtualização quebra o Ctrl+F do navegador e pode confundir leitores de tela, então tem de pagar esse custo.

Trocar de página, filtro ou ordenação mantém os dados anteriores na tela com sinal sutil, sem voltar ao skeleton (EST-12 em `estados-e-ui-otimista.md`). Página e quantidade carregada entram na URL (`navegacao-e-estrutura.md`).

## 6. Busca e filtros

- **LIS-16** · [DS] · P3 — Organize uma toolbar: busca, filtros frequentes visíveis, botão "Filtros" para os demais e ferramentas da listagem (densidade, colunas, exportar) no lado oposto. Quando falta espaço, recolha primeiro filtros secundários e ferramentas pouco usadas, nunca a busca ou a ação principal. Uma segunda linha deliberada para os filtros ativos é melhor que quebra acidental.
  Porquê: o briefing pede hierarquia na toolbar e prioridade de recolhimento previsível (HIG Toolbars).
- **LIS-17** · [P] · P1 — Filtros ativos ficam sempre visíveis com a contagem de resultados ("Status: Ativo · Responsável: Ana — 37 clientes"). Remover um filtro é diferente de "Limpar filtros", que volta aos padrões declarados. Total e filtrado são distinguíveis.
  Porquê: NN/g pede indicação clara de filtros ativos; "filtro ativo invisível" é gatilho com piso P1 na verificação, porque o usuário toma o subconjunto pelo todo.
- **LIS-18** · [DS] · P2 — Escolha aplicação imediata ou em lote pelo custo da consulta e pela combinação de critérios, e mantenha a mesma escolha no produto. Imediata: controles simples e resposta rápida, sem deslocar o layout. Em lote: rascunho separado do estado aplicado, "Aplicar" e "Limpar" claros, contagem de critérios consistente; ao aplicar, a paginação volta ao início quando a página antiga não faz sentido.
  Porquê: misturar os dois modelos na mesma tela faz o usuário não saber se o filtro já vale.
- **LIS-19** · [P] · P2 — O controle ecoa a entrada em até 100 ms, mesmo quando a consulta é pesada. O debounce atrasa só a consulta remota, nunca o texto no campo nem o estado do controle (valor inicial em `fundamentos-e-tokens.md`). Filtro local pesado recalcula com `useDeferredValue`/`startTransition` ou num worker. Resposta antiga nunca sobrescreve a mais recente (abort ou controle de ordem). Defina o que Enter faz.
  Porquê: 0,1 s é o limite de manipulação direta (NN/g); num demo, filtrar 2.409 linhas na thread principal custava 109–258 ms por tecla, e debounce de fetch não resolve filtro local.
- **LIS-20** · [DS] · P2 — O escopo da busca é explícito ("Buscar em clientes"), e limpar a busca não redefine filtros não relacionados sem avisar.
  Porquê: HIG pede escopo reconhecível. Busca global e paleta ficam em `navegacao-e-estrutura.md`.
- **LIS-21** · [DS] · P2 — Vazio filtrado é diferente de vazio inicial e de falha: diz que nada corresponde aos critérios, mostra quais critérios estão ativos e oferece "Limpar filtros" (ou remover o mais restritivo). Carregando nunca mostra "0" nem "Nenhum resultado". Quando o custo permite, chips com contagem por faceta ("Online 54 · Atacado 0") previnem o vazio antes do clique.
  Porquê: NN/g diz que vazio impreciso é particularmente danoso; num demo, a busca zerada mostrava "Solte um negócio aqui". Variantes de vazio em EST-37; texto em `microtexto-ptbr.md`.

## 7. Ordenação

- **LIS-22** · [N] · P3 — Ordene pelo cabeçalho da coluna, com direção visível, `aria-sort` no cabeçalho ativo e a nova ordem anunciada. Ordenação no servidor reflete o conjunto inteiro, não reorganiza só a página visível; diga o alcance quando houver dúvida. A ordenação entra na URL.
  Porquê: WCAG 1.3.1 para a relação cabeçalho–ordem; ordenar só a página atual mente sobre "maior" e "mais recente".
- **LIS-23** · [PR] · P3 — Anime a reordenação (FLIP com `transform`, MOV-28) quando o próprio usuário mudou a ordem. *Alerta de uso consciente:* em refresh e polling, a linha que muda de lugar enquanto a pessoa lê faz perder o alvo do clique; ali a linha alterada ganha o realce curto de MOV-31 e a nova ordem entra sem deslizar (ou com "3 novos · Mostrar", EST-43). Em lista longa, anime só o que está visível e meça (MOV-10).
  Porquê: o movimento explica a mudança causada pelo usuário; em refresh, desloca o que ele estava lendo. Gate de frequência em `movimento.md`.

## 8. Exportação

- **LIS-24** · [DS] · P2 — A exportação diz o escopo antes de gerar: página atual, seleção ou todos os resultados filtrados, com a contagem ("Exportar 248 clientes filtrados"). Respeita as permissões do usuário (colunas e registros que ele não pode ver não saem no arquivo). Valores, arredondamento e período batem com a tela (`indicadores-e-graficos.md`). Volume grande vira job (`estados-e-ui-otimista.md`).
  Porquê: o briefing exige escopo explícito e permissão respeitada; arquivo com número diferente da tela destrói a confiança no sistema.

## 9. Listagem no celular

- **LIS-25** · [P] · P2 — Decida pela tarefa, não converta toda tabela em cards. Consultar um registro por vez (achar um cliente e abrir): lista com identificador, status e um metadado útil, ou cards por CSS (`tr { display: grid }` com `data-label`). Comparar valores entre registros: mantenha a tabela com rolagem interna, cabeçalho e primeira coluna fixos, overflow visível (coluna cortada ou seta, não pontinhos) e seletor de colunas. Ocultar colunas por prioridade vem antes de virar card.
  Porquê: NN/g (Mobile Tables) recomenda cards só para ver um registro por vez; o briefing lista "tabela móvel virou cards sem valores comparáveis" como antipadrão.
- **LIS-26** · [PR] · P2 — No celular, filtros avançados abrem em sheet ou página, com resumo dos aplicados visível na listagem; chips removíveis têm alvo de toque suficiente. O campo de busca não dispara zoom no iOS (regra e valor em `dispositivos-e-entrada.md`).
  Porquê: o briefing pede busca em largura total e filtros avançados em superfície adequada; campo pequeno no iOS amplia a página.

## 10. Uma mutação, todas as contagens

- **LIS-27** · [PR] · P2 — Uma mutação (aprovar, mover, arquivar, editar) atualiza no mesmo quadro a linha, as contagens das visões e abas, os badges da navegação, os KPIs e os totais. Use um store único com contagens derivadas (EST-27), não contadores mantidos à mão em cada componente. Se a edição tira o registro do filtro atual, trate de forma previsível (sai com transição curta e aviso, ou fica marcado como "não corresponde mais ao filtro").
  Porquê: num demo, aprovar um reembolso mudou o KPI e dois badges de 8 para 7 no mesmo quadro; contadores divergentes fazem o usuário duvidar de que a ação valeu. Coerência de números entre telas em `indicadores-e-graficos.md`.

## 11. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| `<tr onClick>` sem `<a href>` nem `tabindex`/Enter | LIS-08 |
| Botão dentro da linha sem `stopPropagation`; clicar na ação abre o detalhe | LIS-09 |
| Ações de linha com `opacity: 0` até `:hover` | LIS-10 |
| Arrasto sem botão ou menu "Mover para…" | LIS-11 |
| `white-space: nowrap` em célula de texto sem `text-overflow` nem `min-width: 0` | LIS-04 |
| Status só com bolinha colorida | LIS-05 |
| Tabela longa sem `position: sticky` no cabeçalho | LIS-06 |
| Coluna que muda de largura ou linha que dobra de altura com o pior caso; texto cortado sem reticências nem texto completo no foco; número à esquerda ou sem `tabular-nums` | LIS-28 |
| Densidade alta como padrão para todos | LIS-07 |
| Barra de lote sem contagem; "Selecionar todos" sem dizer se é a página ou o filtro | LIS-12 |
| Lote com um único toast "Algo deu errado" | LIS-13 |
| Virtualização em lista de 50 itens | LIS-15 |
| Trocar filtro mostra skeleton e apaga a tabela | EST-12 |
| Filtros aplicados sem resumo visível nem contagem | LIS-17 |
| Mistura de filtro imediato e botão "Aplicar" na mesma toolbar | LIS-18 |
| Filtro local recalculado a cada tecla na thread principal; fetch sem abort | LIS-19 |
| Mesmo texto para vazio inicial e vazio filtrado; "0" durante o carregamento | LIS-21 |
| Ordenação por segmentado sem `aria-sort`; ordena só a página carregada | LIS-22 |
| Exportar sem escopo nem contagem | LIS-24 |
| `@media` que transforma toda tabela em cards | LIS-25 |
| Contadores da sidebar buscados à parte e atualizados depois da linha | LIS-27 |

## Fontes

- NN/g — Data Tables: https://www.nngroup.com/articles/data-tables/
- NN/g — Mobile Tables: https://www.nngroup.com/articles/mobile-tables/
- NN/g — Empty States: https://www.nngroup.com/articles/empty-state-interface-design/
- NN/g — Response Times: https://www.nngroup.com/articles/response-times-3-important-limits/
- Carbon — Data table style: https://carbondesignsystem.com/components/data-table/style/
- Material — Applying density: https://material.io/design/layout/applying-density.html
- Apple HIG — Lists and tables: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- Apple HIG — Toolbars: https://developer.apple.com/design/human-interface-guidelines/toolbars
- Baymard — Back Button Expectations (filtros como visões): https://baymard.com/blog/back-button-expectations
- TanStack Query — Placeholder data: https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data
- react.dev — useTransition: https://react.dev/reference/react/useTransition
- W3C — WCAG 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- W3C — WCAG 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Estudos code&chill (Wynlo, Ostrel, Cadra, Noria): síntese de estudo prático (demos medidos), sem arquivo público
