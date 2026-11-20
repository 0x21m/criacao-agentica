# Indicadores e gráficos (IND)

Cobre KPIs, escolha e honestidade de gráficos, cor por significado, movimento em dados, acessibilidade de gráficos e coerência do mesmo número entre telas. Não cobre carregamento por card e dados desatualizados como estado (`estados-e-ui-otimista.md`), contagens de listagem após mutação (`listagens-e-filtros.md`), tokens de cor e números de layout (`fundamentos-e-tokens.md`), curvas e durações (`movimento.md`) nem formatação pt-BR de moeda e data (`microtexto-ptbr.md`).

Formato: **ID** · selo · prioridade mínima — regra, seguida do porquê. Regra só [PR] fica em P2 no máximo, salvo quando a severidade vem da definição de dado errado em `verificacao.md` (dito na regra).

## Sumário
1. KPI pela decisão
2. Período, unidade, base e ausência
3. Cor pela polaridade
4. Gráfico pela pergunta
5. Movimento em dados
6. Acessibilidade
7. Coerência entre telas
8. Padrão detectável → correção

## 1. KPI pela decisão

- **IND-01** · [P] · P3 — Cada indicador nomeia a decisão que apoia. Em painel operacional (ação imediata), exceções, pendências e variações relevantes vêm primeiro; em painel analítico, a pergunta de análise. Comece com 3–4 indicadores prioritários; se houver mais métricas legítimas, agrupe por decisão e revele o resto sob demanda. Sem grade decorativa de KPIs nem gráfico que repete os mesmos números.
  Porquê: NN/g separa painéis operacionais de analíticos; KPI sem decisão vira ruído que esconde o que exige ação. A tela inicial começa pelo "que precisa de mim" (`navegacao-e-estrutura.md`).
- **IND-02** · [PR] · P3 — Card de KPI: rótulo, valor, contexto de comparação; uma altura por linha de KPIs com espaço reservado para rótulo de duas linhas. Linha de KPIs incompleta ou meio vazia é achado. *Alerta de uso consciente (gradiente, brilho, padrão, ícone grande):* o número é o protagonista, e o efeito precisa de papel (EXP-01). O **KPI-herói** (um ou dois por tela, no banner de entrada ou no topo de um painel de acompanhamento, com o número que a pessoa veio ver) pode ter gradiente da marca, brilho ou borda luminosa como papel de hierarquia (TOK-36, EXP-42), com o número medido no pior ponto do fundo (TOK-37) e sem efeito em loop (MOV-32). KPI em **grade densa** (linha de quatro ou mais, painel consultado o dia todo) fica sem gradiente, padrão, faixa ou ícone grande competindo com o número, com acento de cor no máximo uma vez.
  Porquê: a taste-skill e o briefing ("cinco KPIs com gradientes diferentes") apontam que decoração repetida compete com o significado; o dono da skill aprovou brilho em KPI de destaque, que é hierarquia, não decoração.

- **IND-20** · [PR] · P3 · RECOMENDADO — **Número grande em peso leve, rótulo pequeno em caixa alta.** O número principal do KPI não é negrito: peso 200 a 500, `letter-spacing` de −0,02 a −0,04em e `tabular-nums`; o rótulo faz o contraponto, pequeno, em caixa alta, semibold e espaçado. Contraste do número no tamanho real (TOK-16) e o rótulo continua dizendo período e unidade (IND-04).
  Origem: finance-bento (peso 200), peak-chart (300/500), stats-bento, market-card, market-snapshot e metric-switcher; `ANALISE.md` do arsenal, padrão 4.
- **IND-03** · [DS] · P2 — KPI clicável leva a uma visão coerente com o que contou: a lista filtrada pelo mesmo critério, período e escopo, com a mesma contagem. Drill-down preserva os filtros e o Voltar devolve ao painel no mesmo estado.
  Porquê: critério de aceite do briefing; clicar em "37 atrasados" e ver 52 registros quebra a confiança.

## 2. Período, unidade, base e ausência

- **IND-04** · [DS] · P1 — Todo número diz período, unidade e, se houver variação, a base de comparação: "Receita recebida · R$ 128.450,00 · +8,4% vs. ago/2026 · 1–30 set". O escopo vai rotulado onde o número aparece sempre que ele puder divergir de outro ("4 com falha hoje" × "7 aguardando há 2 dias").
  Porquê: "KPI sem período ou unidade" é gatilho com piso P1 na verificação; o briefing exige unidade, período e escala; num demo, duas contagens de falha divergiam por escopo não rotulado.
- **IND-05** · [DS] · P2 — Ausência não é zero. Formas distintas para: sem dado ("—" com motivo acessível), zero medido ("0"), negativo (um único sinal de menos tipográfico no produto), futuro ou período incompleto (hachura ou marca "parcial"), estimativa (rótulo "estimado"). Em gráfico de linha, não ligue pontos ausentes como se fossem medidos. Meta acima de 100% tem teto visual ou explicação. Pedido sem itens não aparece como "R$ 0,00". Sobe para P1 quando o carregamento mostra "0" ou "sem dados" antes da resposta.
  Porquê: a sessão da WWDC sobre gráficos manda testar zeros e ausências; demos mostraram "10952%" e "$0.00" enganosos; "vazio antes da resposta" é gatilho P1.

Carimbo de atualização e dado desatualizado seguem EST-44 em `estados-e-ui-otimista.md`; dado parcial ou estimado diz isso no próprio indicador (IND-05).

## 3. Cor pela polaridade

- **IND-06** · [N] · P1 — A cor da variação segue o significado da métrica, não o sinal: inadimplência, churn, prazo médio e custo em alta são desfavoráveis. Use tokens por polaridade (`--trend-favorable`, `--trend-unfavorable`, `--trend-neutral`) apontando para os semânticos de sucesso e perigo, e cada métrica declara sua polaridade. A variação sempre leva sinal, seta ou texto além da cor (WCAG 1.4.1).
  Porquê: "cor semântica invertida" e "só cor" são gatilhos P1 na verificação; o briefing dá o exemplo da inadimplência que não recebe verde por subir. Tokens em `fundamentos-e-tokens.md`.
- **IND-07** · [P] · P2 — Cor categórica identifica série, não magnitude. Quantidades vão em comprimento e posição. Use a paleta categórica validada do projeto, com rótulos diretos nas séries quando possível em vez de legenda distante.
  Porquê: NN/g (atributos pré-atentivos): comprimento e posição 2D são os canais certos para quantidade; área, ângulo e cor são fracos para comparar.

## 4. Gráfico pela pergunta

- **IND-08** · [P] · P3 — Escreva a pergunta antes de escolher a forma ("Quantos pedidos foram concluídos por dia em setembro?"). Barras para comparar categorias; linha para sequência no tempo; dispersão para relação entre duas medidas; composição só quando a pergunta é participação no todo; bullet chart em vez de gauge radial. Cabeçalho do gráfico com título e período.
  Porquê: NN/g prefere barras, linhas e dispersão; WWDC parte da pergunta para a forma.
- **IND-09** · [P] · P2 — Sem 3D, sem pizza ou donut com muitas fatias, sem treemap em painel simples, sem área colorida só para preencher espaço. Pizza só para participação de poucas partes que somam um todo e que não precisam de comparação fina; caso contrário, barras ordenadas.
  Porquê: NN/g desaconselha pizza e donut "na maior parte das vezes", gauges radiais e 3D, porque ângulo, área e perspectiva distorcem a comparação.
- **IND-10** · [DS] · P2 — Escala honesta: barras começam em zero; eixo que não começa em zero (comum em linha) é justificado pela pergunta e marcado visualmente. Unidade no eixo ou no título, escala e legenda só quando necessárias. Mini gráfico (sparkline) tem contexto suficiente para não parecer mais preciso do que é.
  Porquê: o briefing proíbe escalas enganosas; WWDC mostra que base zero preserva a comparação por altura.
- **IND-11** · [DS] · P2 — Controle de período centralizado quando o período é compartilhado pela tela; controle local só onde há necessidade independente, e o gráfico que foge do filtro global diz isso. O período entra na URL (`navegacao-e-estrutura.md`).
  Porquê: o briefing proíbe seletor de período em todo gráfico por convenção e pede mostrar exceções ao filtro global.
- **IND-12** · [DS] · P3 — No celular, reduza a quantidade de marcas e reposicione a legenda sem esconder unidade, período ou tendência. Gráfico largo rola dentro do card, não a página.
  Porquê: orientação do briefing; altura inicial da área de gráfico em `fundamentos-e-tokens.md` (TOK-32).

## 5. Movimento em dados

Dado funcional nunca mostra valor falso: não conta a partir de zero nem anima o valor em montagem, refresh ou polling (MOV-04, EST-45); a mudança automática ganha só o realce curto da célula ou do card (MOV-31). A entrada de gráfico em tela ocasional e a mudança causada pelo usuário seguem MOV-18. As regras abaixo tratam do que sobra.
- **IND-13** · [PR] · P2 — Morph de gráfico anima só `transform` e `opacity` (barras com `scaleY`, pontos com `translate`); nunca `height`, `width`, `flex-grow` ou atributos de layout em dezenas de marcas.
  Porquê: medido num demo: barras com `scaleY` não geraram nenhum quadro longo em 1,3 s; o mesmo produto animando `height` e `flex-grow` em 90 colunas teve quadro longo de 316 ms e depois 51–63 ms por quadro.
- **IND-14** · [PR] · P2 — Número operacional não faz contagem animada (count-up) e não anima a cada mudança: durante a animação, a tela mostra valores falsos. Se um KPI raro de destaque mantiver a animação, o valor final já está no HTML, a largura é reservada, usa `tabular-nums` e fica fora de `aria-live`.
  Porquê: demos mostraram "705" no lugar de "1.058" por segundos, contagem 0 ao lado de total de US$ 2,01 mi e 44 mutações de texto em 900 ms num preço.

- **IND-21** · [PR] · P3 · RECOMENDADO — **Dados que se desenham na ordem de leitura.** Quando o gráfico ou o KPI-herói entra (o desenho na entrada é obrigatório no kit de movimento, MOV-35), a ordem segue a leitura: estrutura (grade e eixo) → linha ou barras → número → interpretação (seta, delta, frase), com curva de saída (expo-out ou cúbica). A duração segue a frequência (MOV-18) e o valor final está em texto desde o início (MOV-04, IND-14).
  Origem: peak-chart (grade 0,9 s → linha 2,1 s → número 1,7 s → seta), market-card (intro e odômetro), finance-bento (contagem de 900 ms), market-snapshot (`pathLength` 0,65 s), stats-card-2; `ANALISE.md` do arsenal, padrão 6.

## 6. Acessibilidade

- **IND-15** · [N] · P2 — Todo gráfico tem resumo textual com unidade e período (`role="img"` com `aria-label`, ou legenda visível) e uma alternativa com os valores: tabela, lista ou "Ver dados". O resumo só afirma o que os dados sustentam.
  Porquê: WCAG 1.1.1; num demo, o `aria-label` listava números sem unidade nem mês.
- **IND-16** · [N] · P2 — Valores de pontos e tooltips são alcançáveis por teclado (pontos focáveis por setas, com o valor anunciado) e por toque (tocar mostra o valor e um segundo toque ou um botão fecha). Tooltip de gráfico segue WCAG 1.4.13: Esc fecha, aceita o ponteiro sobre ele, não some sozinho. Sobe para P1 quando o valor só existe no tooltip de hover.
  Porquê: o briefing pede tooltip compatível com toque e teclado; nos demos medidos, o card do gráfico tinha zero elementos focáveis.

Painel que se atualiza sozinho segue ACE-25 (pausa ou controle de frequência), EST-42 (estado "pausado" com a idade do dado) e EST-43 (não deslocar o que se lê; anunciar só o resumo).

## 7. Coerência entre telas

O mesmo número precisa ser o mesmo em todo lugar: no KPI, no gráfico, na tabela, na exportação, em outra tela e em outra ponta.

- **IND-17** · [PR] · P1 — A mesma grandeza tem o mesmo valor, arredondamento e formato em toda superfície. Um formatador por grandeza (moeda, percentual, quantidade, prazo) e uma regra de arredondamento, num só módulo; nenhum `toFixed` ou formatação ad hoc em componente. Diferença legítima (bruto × líquido, período distinto) vem rotulada. P0 quando há decisão demonstrada tomada sobre o valor errado.
  Porquê: a prioridade vem da definição de severidade de `verificacao.md` (dado errado), não do selo. Demos mediram "$502" no modal contra "$501.60" na lista, 18.946 contra 18.945 em três lugares e "Net 15" no pedido contra "Net 30" na fatura.
- **IND-18** · [DS] · P2 — Ao conferir coerência, aplique os mesmos critérios (filtros, período, permissões) nas quatro superfícies e compare. Diferença precisa de explicação na UI. Não afirme que uma fórmula está correta sem verificar a fonte e a definição da métrica.
  Porquê: o briefing exige coerência entre cards, gráficos, tabelas e exportação e proíbe atestar fórmula sem checar.

Uma mutação atualiza KPI, gráfico e totais no mesmo quadro que a linha e os badges (EST-27; reflexo na listagem em LIS-27).

- **IND-19** · [PR] · P3 — Score ou nota composta é explicável: número, grau, tendência e 2–4 sinais (▲ aumenta / ▼ diminui) com o fato-chave; cada sinal tem prefixo para leitor de tela ("Aumenta a nota:"); o anel decorativo fica `aria-hidden`. O score reage à ação que o usuário acabou de concluir.
  Porquê: padrão executado num demo de CRM; nota sem razão não ajuda a decidir.

## 8. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| Grade de 8+ KPIs sem relação com decisão; gráfico repetindo o número do card | IND-01 |
| KPI em grade densa com gradiente, brilho ou ícone grande; gradiente diferente em cada card; altura diferente na mesma linha | IND-02 (brilho só no KPI-herói) |
| Clique no KPI abre lista sem o filtro correspondente | IND-03 |
| Número sem período, unidade ou base ("+12%") | IND-04 |
| `?? 0` ou valor inicial `0` antes da resposta; ausência plotada como zero; linha ligando buracos | IND-05 |
| Variação verde sempre que positiva, sem saber a polaridade | IND-06 |
| Cor como único canal de série ou de magnitude | IND-06, IND-07 |
| Pizza com muitas fatias; 3D; gauge radial | IND-08, IND-09 |
| Barras com eixo começando acima de zero | IND-10 |
| Seletor de período repetido em cada card | IND-11 |
| Animação de gráfico em `height`, `width` ou `flex-grow`; animação em todo refresh | IND-13, EST-45 |
| Count-up (`NumberFlow`, `CountUp`, rAF incremental) em número operacional | IND-14 |
| Gráfico sem resumo nem tabela; card do gráfico com zero focáveis | IND-15, IND-16 |
| Polling que reordena ou anuncia cada número em `aria-live` | EST-42, EST-43 |
| `toFixed`, `Math.round` ou `Intl.NumberFormat` espalhados por componente | IND-17 |
| Mesmo ID com valores diferentes em duas telas ou na exportação | IND-17, IND-18 |
| KPI só atualiza no próximo polling depois da ação | EST-27, LIS-27 |

## Fontes

- NN/g — Dashboards: Making Charts and Graphs Easier to Understand: https://www.nngroup.com/articles/dashboards-preattentive/
- Apple HIG — Charts: https://developer.apple.com/design/human-interface-guidelines/charts
- WWDC22 — Design an effective chart: https://developer.apple.com/videos/play/wwdc2022/110340/
- W3C — WCAG 1.1.1 Non-text Content: https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html
- W3C — WCAG 1.4.1 Use of Color: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- W3C — WCAG 1.4.13 Content on Hover or Focus: https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- W3C — WCAG 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- W3C — WCAG 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- Estudos code&chill (Wynlo, Ostrel, Cadra, Rapport, Caelo, Tandem, Noria): síntese de estudo prático (demos medidos), sem arquivo público
- Tokens de tendência por polaridade (IND-06): síntese de estudo prático; a base normativa da regra é WCAG 1.4.1, acima
