# Formulários e camadas (CAM)

Cobre formulários e salvamento, escolha de superfície (inline, popover, painel lateral, modal, página, sheet), divulgação progressiva, abas, sub-abas, segmentados e acordeões, política de empilhamento, foco de entrada e de retorno, Esc, alterações pendentes e a tradução das camadas para o celular. Não cobre larguras, durações e pontos de troca (`fundamentos-e-tokens.md`), animação de abrir e fechar (`movimento.md`), envio duplicado, UI otimista e toasts (`estados-e-ui-otimista.md`), URL e histórico de camadas em geral (`navegacao-e-estrutura.md`), gestos de sheet (`dispositivos-e-entrada.md`) nem textos de erro e botões (`microtexto-ptbr.md`).

Formato: **ID** · selo · prioridade mínima — regra, seguida do porquê. Regra só [PR] fica em P2 no máximo.

## Sumário
1. Formulários
2. Salvamento
3. Escolha de superfície
4. Divulgação progressiva
5. Abas, sub-abas, segmentados e acordeões
6. Política de empilhamento
7. Foco, Esc e alterações pendentes
8. Camada com URL própria
9. Tradução para o celular
10. Padrão detectável → correção

## 1. Formulários

- **CAM-01** · [N] · P2 — Todo campo tem rótulo visível e persistente, associado ao controle. Placeholder só exemplifica formato e nunca substitui o rótulo. Sobe para P1 quando o campo fica sem nome acessível. Em busca e filtro compactos, rótulo visualmente oculto com `aria-label` é aceito.
  Porquê: WCAG 3.3.2 e 4.1.2; o rótulo que some ao digitar obriga a apagar para lembrar o que era o campo.
- **CAM-02** · [N] · P2 — Uma só convenção de obrigatório/opcional no produto, explicada uma vez e marcada no rótulo, não só na cor. Somente leitura (focável, copiável) é diferente de indisponível; indisponível diz o motivo e o que libera, ao lado do controle ("Só administradores podem aprovar. Pedir acesso").
  Porquê: WCAG 3.3.2; campo cinza sem motivo parece defeito.
- **CAM-03** · [DS] · P3 — Agrupe campos por tarefa com títulos que digam o grupo ("Identificação", "Contato", "Endereço"). Formulário de leitura sequencial tem largura máxima de leitura; duas colunas só para campos curtos e relacionados (cidade/UF, início/fim). Medidas em `fundamentos-e-tokens.md`.
  Porquê: o briefing proíbe espremer nome completo e observação em colunas estreitas para "aproveitar espaço".
- **CAM-04** · [N] · P2 — Valide no envio; depois do primeiro envio, revalide no blur o campo que tinha erro. Requisito conhecido (formato, tamanho) aparece como ajuda antes de digitar. Campo com erro tem `aria-invalid="true"` e `aria-describedby` apontando a mensagem com exemplo ("Use o formato nome@empresa.com.br"). No envio com erro, o foco vai ao primeiro campo inválido e um status anuncia a contagem ("2 campos precisam de correção"). Nunca desabilite o botão de envio para forçar validação (`disabled={!isValid}`).
  Porquê: WCAG 3.3.1 e 3.3.3; validar durante a digitação pune antes da interação, e botão desabilitado não diz o que falta.
- **CAM-05** · [N] · P2 — Erro de campo aparece no campo, nunca só num toast. Erro de campo é diferente de falha geral do servidor (que vai num aviso no topo do formulário com "Tentar de novo"). O valor salvo é o valor digitado: nada de arredondamento ou truncamento silencioso. Sobe para P1 quando o sistema salva valor diferente do digitado.
  Porquê: WCAG 3.3.1; num demo, 9.999.999,99 virava 10.000.000 por `step=10` + `Math.round`, e isso só aparecia num toast que sumia.
- **CAM-06** · [DS] · P1 — Nunca descarte entrada em silêncio. Falha de envio mantém tudo o que foi digitado. Fechar camada, trocar de registro, navegar ou fechar a aba com alterações pendentes ou inválidas mantém o rascunho, bloqueia com mensagem no campo ou pergunta ("Descartar alterações em Pedido SO-5316?" com "Continuar editando" / "Descartar"). Não peça confirmação em toda navegação: só quando há algo a perder. P0 quando a perda é demonstrada.
  Porquê: Fluent 2 manda avisar antes de fechar drawer com inputs; num demo, um e-mail inválido fazia o código marcar o formulário como limpo e perder também os campos válidos.
- **CAM-07** · [N] · P2 — Campos com `autocomplete` válido (nome, e-mail, telefone, CEP), `inputmode` correto (numérico para CPF, CEP, valores) e colar permitido, inclusive em senha e código.
  Porquê: WCAG 1.3.5; bloquear colar e preencher obriga a digitar o que o navegador já sabe. Máscaras e documentos brasileiros em `cliente.md`.

## 2. Salvamento

- **CAM-08** · [DS] · P2 — Declare o modelo de salvamento por tela e não misture sem explicar. Explícito: "Salvar" e "Descartar" claros, com "Salvar" rotulado pelo resultado. Automático: indicador sempre visível em `role="status"` com quatro estados: "Salvando…", "Todas as alterações salvas", "Alterações não salvas" e "Não foi possível salvar. Tentar de novo". Se houver botão Salvar numa tela com autosave, diga o que ele faz a mais.
  Porquê: o briefing exige política declarada e estados de salvando, salvo e falha; num demo, o drawer salvava sozinho e Configurações exigia Salvar, sem aviso.

Envio único (botão pendente com `aria-disabled`, guarda no handler, rótulo "Salvando…" e chave de idempotência) segue EST-25, e uma só superfície de confirmação por ação segue EST-17, ambos em `estados-e-ui-otimista.md`.

- **CAM-09** · [PR] · P2 — Fluxo longo (wizard, cadastro extenso) salva rascunho no servidor, mostra "Salvo há X min", guarda o passo atual na URL e permite sair e voltar ao mesmo passo. Configuração que afeta produção usa rascunho sobre o publicado: "Alterações não publicadas" e "Publicar".
  Porquê: inferência registrada na base (sem fonte primária sobre retomada entre dispositivos) e padrão observado no demo Noria. Rascunho local contra perda segue EST-39.

## 3. Escolha de superfície

Suba do menos para o mais intrusivo e só suba quando a tarefa exigir.

| Situação | Superfície | Evite |
| --- | --- | --- |
| Detalhe curto e opcional de uma linha ou seção | Expansão inline / disclosure | Esconder o que quase todos precisam |
| Poucos controles presos a um elemento: filtro, ordenação, menu, configuração local | Popover / disclosure | Entrada obrigatória; conteúdo de página inteira |
| Ver ou editar um item mantendo a lista visível; alternar entre itens; tarefa frequente; 1–3 passos | Painel lateral não modal (peek) | Cobrir quase toda a tela média; fluxo longo |
| Decisão crítica, curta e rara que deve interromper; confirmação destrutiva; entrada obrigatória curta e autossuficiente | Modal central | Tarefa frequente; conteúdo que exige consultar o fundo; tabela grande |
| Fluxo longo, muitas escolhas, comparação, conteúdo maior que o maior modal, URL importante | Página | Espremer em sobreposição |
| Ações contextuais curtas no celular | Bottom sheet | Formulário extenso; substituir página |
| Evento do sistema não iniciado pelo usuário | Toast ou aviso inline (`estados-e-ui-otimista.md`) | Diálogo |

- **CAM-10** · [DS] · P2 — Escolha a superfície pela matriz acima. Tarefa repetida com frequência não fica em modal; modal não substitui página. Se o conteúdo não cabe no maior tamanho de modal sem rolagem excessiva, vá para página.
  Porquê: Carbon, Atlassian e NN/g convergem: "um modal não é alternativa a uma página", e modal em tarefa frequente interrompe dezenas de vezes por dia.
- **CAM-11** · [DS] · P3 — Para triagem de coleções (filas, pedidos, chamados), prefira lista + painel de detalhe lateral não modal, que se atualiza ao selecionar e permite navegar entre itens com ele aberto (J/K ou setas, além de clique). O painel tem gatilho visível, não só atalho. "Abrir em página" fica para edição longa. Abaixo do ponto de troca (em `fundamentos-e-tokens.md`), vira drill-down.
  Porquê: Microsoft List/details e o peek do Linear; o peek só por teclado precisa de gatilho visível num app de negócio comum.
- **CAM-12** · [DS] · P2 — Popover e disclosure abrem só por clique explícito, não recebem entrada obrigatória nem informação crítica, não passam de 6 colunas do grid de largura e ficam um aberto por vez. Prefira `popover="auto"` (fecha com clique fora e Esc, no top layer).
  Porquê: Carbon (Disclosures); a Popover API resolve light dismiss, Esc e camada sem escalada de `z-index`.
- **CAM-13** · [DS] · P2 — Painel lateral tem largura útil sem deixar sobra inutilizável ao lado. Drawer com passos não passa de 2–3 passos; fluxo maior vai para página. Navegação abre à esquerda, notificações e detalhe à direita, sempre do mesmo lado, e a ação primária fica sempre no mesmo canto.
  Porquê: Fluent 2 (Drawer); lado e canto consistentes permitem agir sem procurar.
- **CAM-14** · [DS] · P2 — Modal: botão Fechar visível no cabeçalho, Esc fecha, cabeçalho e rodapé fixos com só o corpo rolando, altura limitada à viewport dinâmica, ações nunca encobertas pela rolagem ou pelo teclado virtual, um único botão primário, rótulo da ação espelhando o título ("Arquivar pedido"). Validação acontece antes de fechar; com erro, o modal fica aberto e o erro aparece inline. Sobe para P1 quando a ação fica encoberta.
  Porquê: Carbon e Atlassian (Modal); ação escondida pela rolagem trava a tarefa.

## 4. Divulgação progressiva

Simplicidade por design, complexidade sob demanda. A frase é síntese do princípio de divulgação progressiva do NN/g, não citação de fonte primária.

- **CAM-15** · [P] · P2 — No máximo dois níveis: camada 0 (página) + camada 1 (painel, popover ou expansão). Camada 2 só com justificativa (submenu fly-out, menu dentro de painel). Precisar de um terceiro nível é sinal de problema de arquitetura de informação: simplifique antes de aninhar.
  Porquê: NN/g: designs com mais de dois níveis costumam ter baixa usabilidade porque o usuário se perde entre eles.
- **CAM-16** · [P] · P2 — Divida pelo uso medido (analytics, observação, frequência), não pela impressão de quem projeta. O gatilho da camada secundária fica visível, com rótulo que diz o que vem ("Mais filtros", "Opções de cobrança") e um só caminho até ela. Campo obrigatório e erro nunca ficam recolhidos sem pista: seção recolhida mostra a pendência ("Cobrança · 2 campos pendentes") e abre para a correção.
  Porquê: NN/g pede "information scent" forte e critério de frequência real; o briefing dá o exemplo da seção com pendência.
- **CAM-17** · [P] · P3 — Se o usuário precisa de quase todo o conteúdo, mostre tudo numa página com subtítulos em vez de esconder em abas ou acordeões.
  Porquê: NN/g: "relevância vence comprimento de página"; cada clique para revelar custa tempo e atenção.

## 5. Abas, sub-abas, segmentados e acordeões

- **CAM-18** · [DS] · P2 — Abas: uma só linha, acima do painel, poucas, rótulos de 1–2 palavras em caixa de frase, pelo menos dois indicadores da ativa (peso ou cor + sublinhado ou fundo), a mais usada primeiro e selecionada por padrão. Não use abas para conteúdo que precisa ser comparado. Não misture abas de navegação e abas dentro da página no mesmo controle, nem faça links parecerem abas.
  Porquê: 20 diretrizes do NN/g (revisadas em 09/2026): rótulo longo indica que a escolha é complicada demais para abas; comparar entre abas sobrecarrega a memória.
- **CAM-19** · [N] · P2 — Semântica APG: `tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, roving tabindex (Tab entra na aba ativa, ←/→ movem). Ativação automática ao focar só quando o painel aparece sem latência; com carga, ativação manual (Enter/Espaço). Segmentado que filtra ou troca visão usa grupo de rádio ou botões com `aria-pressed`, não `role="tab"` só pela aparência.
  Porquê: padrão WAI-ARIA Tabs; ativação automática com carga deixa o foco lento.
- **CAM-20** · [PR] · P2 — Aba principal da página e aba do registro entram na URL (`?aba=faturas`), para recarregar, compartilhar e voltar caírem na mesma aba. O frame das abas reserva altura mínima para não mudar de tamanho na troca.
  Porquê: não há fonte primária sobre aba na URL (lacuna registrada na base); a regra decorre de URL como estado (`navegacao-e-estrutura.md`). Demos com altura reservada não saltam na troca.
- **CAM-21** · [P] · P3 — Sub-abas são último recurso: estilo distinto do primeiro nível (pílulas ou segmentado, nunca uma segunda linha de abas iguais) e nunca um terceiro nível.
  Porquê: nenhuma fonte recomenda abas aninhadas; duas linhas iguais quebram a regra de linha única, e três níveis passam do limite de divulgação progressiva.
- **CAM-22** · [DS] · P3 — Segmentado troca a visão dos mesmos dados (Dia/Semana/Mês, Lista/Quadro); aba troca conjuntos de conteúdo; não misture destino e comando no mesmo segmentado ("Clientes / Financeiro / Excluir"). Acordeão serve a conteúdo curto, a rótulos longos e ao celular, com `aria-expanded` no gatilho e estado de cada seção mantido.
  Porquê: HIG (Segmented controls) e NN/g (Accordions); a distinção segmentado × aba é inferência coerente com o HIG, sem fonte direta.

## 6. Política de empilhamento

- **CAM-23** · [DS] · P2 — Proibido: modal sobre modal, disclosure dentro de disclosure, mais de um drawer sobreposto, sheet sobre sheet. Permitido como camada transitória: popover ou menu dentro de painel ou modal, submenu fly-out. Confirmação dentro de drawer é inline no próprio drawer. Se a tarefa pede um segundo diálogo, feche o primeiro ou leve a tarefa para página.
  Porquê: Carbon ("um modal nunca deve abrir outro"), Atlassian ("não abra diálogos a partir de diálogos") e Fluent 2 (sem vários drawers overlay).
- **CAM-24** · [DS] · P2 — Scrim (fundo escurecido) só quando o fundo está bloqueado. Painel não modal não tem scrim nem prende o foco; modal tem scrim, fundo `inert` e `aria-modal="true"`. `aria-modal` só quando o código bloqueia de fato toda interação externa. A aparência (lateral, inferior) não define a modalidade; o bloqueio define.
  Porquê: APG (Dialog) e HIG (Modality); painel não modal com overlay escuro promete um bloqueio que não existe.
- **CAM-25** · [N] · P2 — Um gerenciador de camadas no produto: `<dialog>.showModal()` para modais e o atributo `popover` para camadas leves (top layer, sem escada de `z-index`); um só listener de Esc fecha a camada do topo da pilha e só ela, inclusive o drawer de navegação no celular.
  Porquê: WCAG 2.1.2 (sem armadilha de teclado); num demo, o Esc não fechava o drawer de navegação móvel. Serviço transversal único em `governanca.md`.

O toaster fica acima de qualquer backdrop, e o Desfazer continua alcançável com um modal aberto (EST-33 em `estados-e-ui-otimista.md`). Monte-o no top layer pelo mesmo gerenciador de camadas.

- **CAM-26** · [PR] · P2 — Nenhum ancestral de overlay tem `transform`, `filter` ou `will-change` que crie novo bloco de contenção e corte tooltip, menu ou modal `position: fixed`. Prefira renderizar overlays no top layer ou em portal.
  Porquê: causa técnica comum de tooltip cortado dentro de linha ou card (notas jakubkrehel).
- **CAM-27** · [N] · P2 (P1 se informação essencial só existe no tooltip) — Tooltip só complementa: não tem conteúdo interativo nem informação essencial. Motivo de indisponibilidade vai em texto ao lado do controle, não no tooltip. Conteúdo interativo ou explicação mais longa vai em toggletip aberto por clique. Use `popover="hint"` quando disponível para não fechar os popovers abertos. Esta regra é a dona de quando usar tooltip ou toggletip.
  Porquê: Carbon (Tooltip) e WCAG 1.4.13. Comportamento (Esc, hoverable, persistente, abre no foco) em ACE-18; texto, `aria-label` e atalho em TXT-12; números em TOK-29.


## 7. Foco, Esc e alterações pendentes

Para cada camada, defina: como fecha, quando Esc se aplica, onde o foco entra, para onde volta e o que acontece com alterações pendentes.

- **CAM-28** · [DS] · P2 — Foco de entrada: no primeiro campo; no título (`tabindex="-1"`) quando o conteúdo é longo ou só de leitura; no botão mais usado em diálogo informativo. Em confirmação destrutiva, na ação menos destrutiva (sobe para P1). Painel não modal recebe foco ao abrir por ação do usuário, mas não o prende.
  Porquê: APG (Dialog Modal); foco no destrutivo faz um Enter apressado apagar dados.
- **CAM-29** · [N] · P2 — Foco de retorno: ao fechar, volta ao elemento que abriu a camada. Se ele não existe mais (a ação removeu o item), vai ao item afetado, ao próximo da fila ou ao `h1` da lista. Nunca cai no `body` (o caso de mutação que remove o gatilho está em EST-35). Camada aberta por deep link devolve o foco ao `h1` da vista-mãe.
  Porquê: WCAG 2.4.3; seis demos deixavam o foco no `body` depois de concluir, pagar, rejeitar ou desfazer.

Confirmação destrutiva (quando usar, foco na ação menos destrutiva, rótulos que não competem como "Manter pedido" e "Cancelar pedido", consequência em valores) segue EST-36 em `estados-e-ui-otimista.md`.

- **CAM-30** · [DS] · P2 — Esc, clique fora e Voltar fecham a camada pelo mesmo caminho que o botão Fechar, incluindo a regra de alterações pendentes de CAM-06. Clique fora não fecha modal com formulário preenchido.
  Porquê: fechar por caminhos diferentes com resultados diferentes surpreende; perder um formulário por clicar fora é perda silenciosa.

## 8. Camada com URL própria

Painel de registro e modal de detalhe grande têm URL própria e título de documento ("Pedido SO-5316 · Pedidos · Produto"); Voltar fecha a camada; fechar usa `history.back()` quando o app abriu a camada e replace quando ela veio de deep link, nunca push. As regras com ID estão em `navegacao-e-estrutura.md` (URL como estado, push × replace, troca de rota). Modal de confirmação e popover não ganham URL.

## 9. Tradução para o celular

As camadas achatam no celular. Decida pela largura útil (pontos em `fundamentos-e-tokens.md`), não pelo nome do aparelho.

| Desktop | Celular |
| --- | --- |
| Painel lateral / drawer | Tela cheia (página com Voltar) ou sheet expansível |
| Lista + detalhe lado a lado | Drill-down empilhado, detalhe entra no histórico |
| Modal curto, popover de ações ou menu | Bottom sheet modal |
| Modal com formulário | Tela cheia com cabeçalho próprio (Fechar e ação) |
| Abas | Abas roláveis com auto-rolagem até a ativa, ou acordeão / conteúdo sequencial com sumário |
| Popover de filtros | Sheet ou página de filtros com "Aplicar" e resumo na listagem |

- **CAM-31** · [DS] · P2 — Traduza cada camada pela tabela acima. Diálogo não modal no desktop pode virar bloqueio de tela cheia no celular; mantenha saída clara, Voltar fechando e estado preservado.
  Porquê: NN/g (Modal & Nonmodal) e Microsoft (List/details); GOV.UK mostra abas como conteúdo sequencial no celular. Painel → tela cheia e abas → roláveis são inferências sem fonte primária lida.
- **CAM-32** · [P] · P2 — Bottom sheet tem botão Fechar visível, fecha com Voltar, não se empilha, não exige gesto e não substitui fluxo de página. Regras de gesto e alcance em `dispositivos-e-entrada.md`.
  Porquê: NN/g (Bottom Sheets), que também classifica como "em grande parte incorreta" a ideia de que sheets melhoram o alcance do polegar.

## 10. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| `<input placeholder=…>` sem `<label>` nem `aria-label` | CAM-01 |
| Asterisco só em cor; campo cinza sem motivo | CAM-02 |
| `disabled={!isValid}` no submit; validação a cada tecla | CAM-04 |
| `toast.error` para erro de campo; `step` + `Math.round` alterando o valor | CAM-05 |
| Fechar ou trocar de registro com `dirty` sem guardar nem perguntar | CAM-06, CAM-30 |
| `onPaste={e => e.preventDefault()}`; `autocomplete="off"` em campo pessoal | CAM-07 |
| Autosave sem indicador; autosave e botão Salvar na mesma tela sem explicação | CAM-08 |
| `disabled` nativo durante envio, sem guarda no handler nem idempotência | EST-25 |
| Morph "Salvo" e toast para a mesma ação | EST-17 |
| Formulário longo ou tabela grande dentro de modal; edição frequente em modal | CAM-10 |
| Painel de detalhe aberto só por atalho | CAM-11 |
| Popover com campo obrigatório; dois popovers abertos | CAM-12 |
| Modal com rodapé dentro da área rolável; `max-height` em `vh` | CAM-14 |
| Três níveis: página → painel → modal → popover com formulário | CAM-15, CAM-23 |
| Seção recolhida escondendo erro após envio | CAM-16 |
| Duas linhas de abas iguais; aba com rótulo de 4+ palavras; abas para comparar | CAM-18, CAM-21 |
| `role="tab"` em segmentado de filtro; Tab percorre cada aba | CAM-19 |
| Aba selecionada só em estado de memória | CAM-20 |
| Modal aberto a partir de modal; dois drawers abertos | CAM-23 |
| Overlay escuro atrás de painel não modal | CAM-24 |
| `z-index: 9999` e escada de valores; vários listeners de Esc | CAM-25 |
| Toaster fora do top layer com `<dialog>` aberto | EST-33 |
| `will-change: transform` em card que contém tooltip ou menu | CAM-26 |
| Tooltip com link ou botão; informação essencial só no tooltip | CAM-27 |
| Confirmação destrutiva com foco no botão destrutivo; "Cancelar" × "Cancelar pedido" | CAM-28, EST-36 |
| `document.activeElement === document.body` depois de fechar ou concluir | CAM-29 |
| Painel lateral do desktop reaproveitado espremido em 390 px | CAM-31 |
| Sheet sobre sheet; sheet que só fecha arrastando | CAM-32 |

## Fontes

- NN/g — Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g — Accordions: https://www.nngroup.com/articles/accordions-complex-content/
- NN/g — Modal & Nonmodal Dialogs: https://www.nngroup.com/articles/modal-nonmodal-dialog/
- NN/g — Tabs, Used Right: https://www.nngroup.com/articles/tabs-used-right/
- NN/g — Confirmation Dialogs: https://www.nngroup.com/articles/confirmation-dialog/
- NN/g — Bottom Sheets: https://www.nngroup.com/articles/bottom-sheet/
- Carbon — Dialogs: https://carbondesignsystem.com/patterns/dialog-pattern/
- Carbon — Modal: https://carbondesignsystem.com/components/modal/usage/
- Carbon — Disclosures: https://carbondesignsystem.com/patterns/disclosures-pattern/
- Carbon — Tooltip: https://carbondesignsystem.com/components/tooltip/usage/
- Atlassian — Modal dialog: https://atlassian.design/components/modal-dialog/usage
- Fluent 2 — Drawer: https://fluent2.microsoft.design/components/web/react/core/drawer/usage
- Microsoft Learn — List/details: https://learn.microsoft.com/windows/apps/design/controls/list-details
- Linear — Peek: https://linear.app/docs/peek
- GOV.UK — Tabs: https://design-system.service.gov.uk/components/tabs/
- Apple HIG — Modality: https://developer.apple.com/design/human-interface-guidelines/modality
- Apple HIG — Segmented controls: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
- WAI-ARIA APG — Dialog (Modal): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- WAI-ARIA APG — Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- MDN — Popover API: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using
- W3C — WCAG 1.3.5, 1.4.13, 2.1.2, 2.4.3, 3.3.1, 3.3.2, 3.3.3: https://www.w3.org/WAI/WCAG22/Understanding/
- Estudos code&chill (Rapport, Tandem, Fernly, Wynlo, Ostrel, Cadra, Noria): síntese de estudo prático (demos medidos), sem arquivo público
