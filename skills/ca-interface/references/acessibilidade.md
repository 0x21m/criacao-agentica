# Acessibilidade (ACE)

Cobre a WCAG 2.2 AA como base para todas as pontas: semântica e nomes, foco, teclado, camadas e rotas, formulários, alvos e arrasto, conteúdo em hover e foco, reflow e zoom, contraste, anúncios, tempo e movimento, `forced-colors` e o limite da verificação automática. Não cobre: valores de contraste, alvos e tempos (`fundamentos-e-tokens.md`), o mapa de movimento reduzido (`movimento.md`), mecânica de layout responsivo (`dispositivos-e-entrada.md`), política de camadas e quando usar tooltip (`formularios-e-camadas.md`)
, acessibilidade de gráficos (`indicadores-e-graficos.md`), chat (`chat-e-notificacoes.md`, COM-16), obrigação legal da ponta pública (`cliente.md`, CLI-40).

Formato: **ID** [selo] · prioridade mínima — regra. A prioridade é piso.

## Sumário
1. Base e regra de reporte · 2. Semântica e nomes · 3. Foco e teclado · 4. Camadas e rotas · 5. Formulários · 6. Alvos e arrasto · 7. Hover e foco · 8. Reflow e zoom · 9. Contraste e cor · 10. Anúncios · 11. Tempo e movimento · 12. Forced-colors · 13. O que automação não prova · Padrões → correção · Fontes

## 1. Base e regra de reporte

**ACE-01** [N] · P1 — **WCAG 2.2 AA é o alvo de todas as pontas**: painel, app, portal, loja, chat e e-mails. A ponta pública tem obrigação legal mais forte (CLI-40), mas o operador também é usuário, e a densidade não isenta de nenhum critério AA.

Regra de reporte: um achado cita **um critério A/AA pelo número** ou uma tarefa concreta que um usuário de tecnologia assistiva não consegue completar. Itens AAA, convenções do ARIA APG, "um `h1` por página" e alvos de 44 px são **recomendação**: não passam de P2 sozinhos. Densidade estabelecida e usável não é achado. Na dúvida, siga o padrão da plataforma e **remova ARIA em vez de acrescentar**: nenhum ARIA é melhor que ARIA errado.

Por ponta: o operador denso pode usar alvos mínimos com a exceção de espaçamento (ACE-16); no cliente, o alvo de toque confortável é o padrão (`fundamentos-e-tokens.md`).

## 2. Semântica e nomes

**ACE-02** [N] · P1 — **Elemento nativo pelo papel**: `<a href>` para navegação (abre em nova aba, clique do meio), `<button>` para ação, `<table>` com `<th scope>` para dados tabulares. `<div onClick>` não serve (4.1.2, 2.1.1). Landmarks (`header`, `nav`, `main`); vários do mesmo tipo levam rótulo (`<nav aria-label="Principal">`). Heading é estrutura, não tamanho (1.3.1).

**ACE-03** [N] · P1 — **Todo controle tem nome acessível**, e o nome **começa pelo texto visível** (2.5.3 Label in Name): o botão "Enviar" não pode ter `aria-label="Submeter mensagem"`, porque quem usa comando de voz diz o que vê. Botão só com ícone tem `aria-label` e o ícone leva `aria-hidden="true"`. Precedência do nome: `aria-labelledby` > `aria-label` > conteúdo nativo > `title`. `aria-label` em `div` ou `span` genérico não vale (ARIA 1.2).

**ACE-04** [N] · P2 — `<title>` do mais específico ao geral ("Pedido #PED-10482 · Pedidos · Loja") (2.4.2). O `lang` da página está certo (`pt-BR`) (3.1.1).

## 3. Foco e teclado

**ACE-05** [N] · P1 — **Foco visível em toda parada** (2.4.7). Estilize `:focus-visible`, não `:focus`. Prefira o anel do navegador com `outline-offset`. Anel próprio usa token de foco com contraste **contra todas as cores adjacentes que cruza**, inclusive estados hover e selecionado (1.4.11). `outline: none` só com substituto verificado. Use `:focus-within` no wrapper de campo com ícone.

**ACE-06** [N] · P1 — **Foco não encoberto** (2.4.11 Focus Not Obscured, AA): o elemento focado nunca fica totalmente sob cabeçalho, barra de filtros, cabeçalho de tabela, banner ou barra de ação fixos. Use `html { scroll-padding-block-start: <altura do chrome fixo>; scroll-padding-block-end: <altura da barra inferior> }` e `scroll-margin-block-start` nas âncoras. *Verificar:* caminhada de Tab por roteiro de tarefa, também dentro de contêineres roláveis.

**ACE-07** [N] · P2 — **Ordem visual = ordem do DOM** (1.3.2, 2.4.3). Não reordene com `order`, `flex-direction: *-reverse` nem com posição de grid em nenhuma largura: o Tab e o leitor de tela seguem o DOM. Se o celular pede outra ordem, mude o DOM ou aceite a ordem do DOM em todas as larguras (mecânica em `dispositivos-e-entrada.md`).

**ACE-08** [N] · P1 — **Teclado completo**: toda função opera sem mouse (2.1.1), sem armadilha de foco (2.1.2). Atalho de tecla única pode ser desligado, remapeado com modificador ou só vale com foco no componente (2.1.4, nível A). `tabindex` só `0` ou `-1`, nunca positivo. Caminho só por ponteiro (ação que existe só no hover da linha, menu de contexto sem tecla) é P1.

**ACE-09** [DS] · P2 (P1 quando algo fica inalcançável) — **Widgets compostos** seguem o mapa de teclas do ARIA APG: abas, toolbar, menu, radio group e controle segmentado com **roving tabindex** (uma parada de Tab, setas movem, Home e End); combobox mantém o foco no campo com `aria-activedescendant`. Listbox com Tab em cada opção é achado.

## 4. Gestão de foco em camadas e rotas

**ACE-10** [DS]/[N] · P1 — **Camadas modais** (dialog, sheet, drawer modal):
- use `<dialog>` com `showModal()` (fundo inerte, Esc nativo); se for próprio, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e `inert` no fundo;
- ao abrir, o foco vai para o primeiro elemento útil; **em confirmação destrutiva, para a ação menos destrutiva**;
- Esc fecha a camada aberta por último (tooltip → menu → diálogo);
- ao fechar, o foco volta ao gatilho, ou a um contêiner lógico se o gatilho sumiu (linha excluída).

Toast e Desfazer acima do backdrop: EST-33. A política de camadas está em `formularios-e-camadas.md`.

**ACE-11** [N]/[DS] · P2 — **Mudança de rota em SPA** atualiza `document.title` (2.4.2), move o foco para o `<h1 tabindex="-1">` ou para o `<main>` da nova tela, restaura a rolagem no voltar e avançar e começa no topo em navegação nova. Atualização parcial (filtro, aba) não move o foco: anuncia o resultado (ACE-23).

## 5. Formulários

**ACE-12** [N] · P1 — **Rótulo programático** em todo campo; placeholder não é rótulo (1.3.1, 3.3.2). Erro com texto junto do campo, ligado por `aria-describedby`, e `aria-invalid="true"`, que sai ao corrigir (3.3.1). Nunca só borda vermelha (1.4.1). Ao enviar com erro, o foco vai ao primeiro campo inválido. A entrada é preservada.

**ACE-13** [N] · P2 — **Finalidade do campo** (1.3.5): `autocomplete` válido nos dados do usuário (`name`, `email`, `tel`, `postal-code`, `address-line1`, `cc-number`, `one-time-code`, `new-password`), `name` descritivo e `<form>` real. Use `inputmode` certo (`numeric` para CEP, CPF e código; `decimal` para dinheiro; `type="number"` só para quantidade). Colar nunca é bloqueado. Faça trim antes de validar.

**ACE-14** [N] · P1 — **3.3.7 Redundant Entry** (A): não peça de novo, no mesmo processo, o que o usuário já informou; ofereça "Mesmo endereço de entrega" ou preencha. **3.3.8 Accessible Authentication** (AA): login e verificação sem teste cognitivo, com colar e gerenciador de senhas funcionando (`autocomplete="current-password"`, `one-time-code`). Pesam no checkout e na conta.

**ACE-15** [DS] · P2 — **Desabilitado e pendente.** `disabled` nativo tira o controle do Tab; `aria-disabled="true"` só anuncia, então bloqueie no handler e estilize. Não use os dois juntos. Use `disabled` nativo só para indisponível permanente, com o motivo em texto ao lado. Controle desabilitado que precisa explicar o motivo usa `aria-disabled` ou texto ao lado, porque tooltip em `disabled` nativo não abre por teclado nem por toque. **Não desabilite o envio até o formulário ficar válido**: valide no envio. O `disabled` nativo joga o foco para o `<body>`. Botão pendente e envio duplicado (as três peças): EST-25.

## 6. Alvos e arrasto

**ACE-16** [N] · P1 — Dona do critério de alvo. **Alvo mínimo 2.5.8 (AA)**: 24 × 24 CSS px, **ou** a exceção de espaçamento, entre outras (controle equivalente, link em texto corrido, controle do navegador, essencial). Cálculo da exceção: desenhe um círculo de 24 px de diâmetro centrado em cada alvo menor que 24 px; ele não pode cruzar outro alvo nem o círculo de outro alvo. Caso simples: dois ícones de 20 px precisam de pelo menos 4 px de folga entre si. Ícones de ação em linha de tabela são o caso mais comum de falha, e se uma das ações for destrutiva, o erro de alvo pode virar P0. Os números (24 px e a recomendação de 44–48 px) ficam em `fundamentos-e-tokens.md` (TOK-30, TOK-31). Áreas expandidas não se sobrepõem.

**ACE-17** [N] · P1 — **Arrasto com alternativa** (2.5.7 Dragging Movements, AA): reordenar lista, mover card de kanban, ajustar coluna ou slider tem alternativa de ponteiro único (botões mover para cima e para baixo, menu "Mover para…", campo numérico). Gesto multiponto ou por trajetória tem alternativa (2.5.1). `touch-action: none` só na superfície do gesto.

## 7. Conteúdo em hover e foco

**ACE-18** [N] · P2 (P1 se o conteúdo for necessário para a tarefa) — Conteúdo que aparece no hover ou no foco (tooltip, prévia, popover de hover) é **dispensável** (Esc sem mover o ponteiro ou o foco), **hoverable** (dá para levar o ponteiro até ele sem que suma) e **persistente** (fica até ser dispensado ou perder o hover ou o foco) (1.4.13). Aparece também no foco por teclado, não só no hover. O `title` nativo está fora do escopo do critério e não serve como única via de informação. Esta regra é a dona do comportamento de tooltip; quando usar tooltip ou toggletip em CAM-27, texto em TXT-12, números em TOK-29.

## 8. Reflow e zoom

**ACE-19** [N] · P1 — **Reflow** (1.4.10): sem perda de conteúdo nem rolagem nos dois sentidos a **320 CSS px de largura** (equivale a 1280 px com 400% de zoom), e a **256 CSS px de altura** para conteúdo que rola na horizontal. A exceção é o conteúdo bidimensional (tabela larga, mapa, gráfico, código), que rola **no próprio contêiner**, não na página. Texto a 200% sem corte (1.4.4). Espaçamento de texto aumentado sem corte (1.4.12). Nunca use `maximum-scale=1` nem `user-scalable=no`.

**ACE-20** [PR] · P2 — **Zoom em rem**: tamanhos de fonte em `rem`; media e container queries de troca de layout em `rem` ou `em`, para que a fonte ampliada no navegador também troque o layout; contêiner de texto com `min-height`, não `height` fixo. Sem isso, a fonte maior corta texto mesmo quando o zoom de página passa.

## 9. Contraste e cor

**ACE-21** [N] · P1 — **Contraste de texto** (1.4.3) e **contraste não textual** (1.4.11: bordas de campo, ícones que carregam sentido, anel de foco, estados de componente, séries de gráfico necessárias), com os valores em `fundamentos-e-tokens.md` (TOK-16). Meça **contra o fundo real e no pior ponto**: vidro, transparência, zebra, imagem e estado hover ou selecionado. Desabilitado e decorativo são isentos. Verifique os dois modos (claro e escuro) e as densidades.

**ACE-22** [N] · P1 — **Cor nunca sozinha** (1.4.1): status, erro, série de gráfico, link no texto e etapa do stepper têm também texto, ícone, forma ou posição. Cor semântica a favor do significado: vermelho de perigo não marca sucesso nem ação comum.

## 10. Anúncios

**ACE-23** [N] · P2 (P1 quando a única confirmação de uma ação é visual) — **Mensagens de status** (4.1.3) são determináveis sem mover o foco:
- resultado e sucesso ("18 resultados", "Salvo") vão em `role="status"`;
- `role="alert"` só para urgente: usar `alert` para conteúdo não urgente é falha;
- sequência (chat, log de atividade) vai em `role="log"` (COM-16).

A região viva já existe **vazia no DOM antes** do texto mudar, porque inserir a região já com o texto costuma não ser anunciado. Durante a carga, use `aria-busy="true"` na região e depois anuncie o resultado. Nunca mova o foco para um toast. Árvore de decisão: o foco já vai para lá → nada; o texto é ligado a um controle → `aria-describedby`; não urgente → `status`; urgente → `alert`.

## 11. Tempo e movimento

**ACE-24** [N] · P1 — **Tempo ajustável** (2.2.1, A): sessão que expira avisa antes e permite estender. Toast que traz a única via de uma ação passa a ser limite de tempo: a regra do Desfazer é EST-32, a de erro em toast é EST-16 e as durações ficam em TOK-28.

**ACE-25** [N] · P2 — Dona do critério 2.2.2; o estado "pausado" no inventário é EST-42. **Pausar, parar, ocultar** (2.2.2, A): o que se move, pisca ou rola por mais de 5 s tem pausa. **Conteúdo que se atualiza sozinho** (painel com polling, ticker, fila ao vivo) tem controle de pausa ou de frequência, qualquer que seja a duração. Carrossel começa pausado.

**ACE-26** [N] · P3 (P2 se o feedback some) — **Movimento a partir de interação** (2.3.3, AAA): respeite `prefers-reduced-motion`, oferecendo o movimento só sob `no-preference`. Mudanças de cor, opacidade e blur não contam como movimento no critério. O mapa do que fica e do que zera (deslocamento, escala, parallax, stagger) é dono de `movimento.md` (MOV-21). Nada pisca mais de 3 vezes por segundo (2.3.1, A, P1). Mudança de estado nunca é comunicada só por movimento.

## 12. Forced-colors

**ACE-27** [PR] · P2 — Em `@media (forced-colors: active)` (alto contraste do Windows), nenhuma informação some: foco, seleção, estado desabilitado, borda de campo e ícone de status continuam visíveis. Use borda transparente onde só havia sombra ou fundo (ela vira visível no modo forçado) e cores de sistema (`Highlight`, `CanvasText`, `GrayText`) quando precisar. `forced-color-adjust: none` só com checagem visual. Ícone SVG usa `currentColor`. *Verificar:* emular `forced-colors: active` no DevTools.

## 13. O que automação não prova

**ACE-28** [DS]/[PR] · P2 — O relatório **separa o que foi verificado automaticamente do que foi conferido à mão**. Nunca afirme "acessível" ou "conforme" só com auditoria automática. A automação pega bem: nome ausente, contraste medido, `outline: none`, `tabindex` positivo, `user-scalable=no`, foco encoberto numa caminhada roteirizada. Ela **não prova**:
- se o nome, o texto alternativo e o rótulo **fazem sentido** (um `aria-label="botão"` passa);
- se a ordem de foco e de leitura é **lógica** para a tarefa;
- se a gestão de foco em camadas, rotas e exclusões leva aonde deveria;
- se os anúncios saem na hora certa e sem verbosidade, com leitor de tela real (NVDA, VoiceOver, TalkBack);
- zoom real de 200% e 400% (o zoom emulado do DevTools não é igual), texto ampliado do sistema e teclado virtual do iOS;
- toque real, Safari, Firefox e Samsung Internet;
- se a alternativa ao arrasto e ao gesto está completa;
- contraste sobre imagem, vídeo ou fundo dinâmico.

Uma revisão de acessibilidade tem duas caminhadas manuais: **só teclado**, percorrendo todo o fluxo, e **leitor de tela**, com cada controle anunciando nome, papel e estado. O que não rodou entra como "Não verificado", nunca como aprovado (ver `verificacao.md`).

## Padrão detectável → correção

| Padrão detectável | Correção | ID |
| --- | --- | --- |
| `<div onClick>`, `<span role="button">` sem teclado | `<button>` ou `<a href>` | ACE-02 |
| Botão só com ícone sem `aria-label`; `aria-label` diferente do texto visível | Nome que começa pelo texto visível; ícone `aria-hidden` | ACE-03 |
| `outline: none` / `outline: 0` sem substituto | `:focus-visible` com anel em token | ACE-05 |
| `position: sticky/fixed` no topo sem `scroll-padding-block-start` | `scroll-padding` com a altura do chrome | ACE-06 |
| `order:`, `flex-direction: row-reverse`, `grid-area` reordenando | Reordenar no DOM | ACE-07 |
| `tabindex="1"` (ou maior) | `0`, `-1` ou ordem do DOM | ACE-08 |
| Ação que só aparece com `:hover` | Visível no foco e no toque, ou menu acessível | ACE-08 |
| Modal sem `inert` no fundo; foco não volta ao fechar | `<dialog>` + `showModal()`; devolver o foco | ACE-10 |
| Troca de rota sem `document.title` nem foco | Título + foco no `h1` ou `main` | ACE-11 |
| `placeholder` como único rótulo; erro só com borda | `<label>` + texto ligado por `aria-describedby` | ACE-12 |
| Campo de endereço ou CPF sem `autocomplete`; `onPaste` bloqueado | Tokens de `autocomplete`; liberar colar | ACE-13 |
| `disabled={!isValid}` no envio; `disabled` + `aria-disabled` juntos | Validar no envio; um só mecanismo | ACE-15 |
| Ícones de 16–20 px colados em linha de tabela | 24 px ou exceção de espaçamento calculada | ACE-16 |
| Kanban ou lista só arrastável | Botões ou menu "Mover para…" | ACE-17 |
| Tooltip só em CSS `:hover`, sem Esc e sem foco | Componente que cumpre 1.4.13 | ACE-18 |
| `user-scalable=no`, `maximum-scale=1`; `height` fixo em contêiner de texto | Remover; `min-height`; queries em `rem` | ACE-19, ACE-20 |
| Cor de status sem texto ou ícone | Texto ou ícone junto da cor | ACE-22 |
| Região viva inserida já com o texto; `role="alert"` para "Salvo" | Região estável e vazia; `status` | ACE-23 |
| Toast com Desfazer que expira sem pausa | Pausa em hover, foco e aba oculta, ou Desfazer no histórico | ACE-24 |
| Polling ou auto-refresh sem controle | Pausar ou escolher frequência | ACE-25 |
| Animação de deslocamento fora de `prefers-reduced-motion: no-preference` | Envolver na query; mapa em `movimento.md` | ACE-26 |
| Foco ou seleção feitos só com `box-shadow` | Borda ou outline transparente para `forced-colors` | ACE-27 |
| Relatório "acessível" só com auditoria automática | Caminhadas de teclado e leitor; marcar o não verificado | ACE-28 |

## Fontes

- W3C, WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C, Understanding 2.4.11 Focus Not Obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- W3C, Understanding 2.5.8 Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- W3C, Understanding 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- W3C, Understanding 1.4.10 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C, Understanding 1.4.13 Content on Hover or Focus: https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- W3C, Understanding 1.4.3 e 1.4.11: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html · https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- W3C, Understanding 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- W3C, Understanding 2.2.1 Timing Adjustable: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- W3C, Understanding 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- W3C, Understanding 2.1.4 Character Key Shortcuts: https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html
- W3C, ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
- Skill instalada `better-accessibility` (foco, formulários, alvos, anúncios, movimento e zoom), consultada como prática.
