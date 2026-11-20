# Protótipo e aprovação (PRO)

Cobre o portão de protótipo: quando vale, como o protótipo deve ser, formatos, rodada de aprovação, registro da decisão e promoção para produção. Não cobre a busca de referências (`referencias-e-bom-gosto.md`), a sequência de cada modo e a bancada de estados em si (`modos.md`, modo 6), a escolha da direção de personalidade (`direcao-e-personalidade.md`), o stack e as bibliotecas (`stack-e-bibliotecas.md`), os números de layout e viewport (`fundamentos-e-tokens.md`, `dispositivos-e-entrada.md`) nem a severidade dos achados (`verificacao.md`).

## Sumário
1. O portão e a única exceção
2. O que é "quase pronto"
3. Escala pelo tamanho da mudança
4. Formatos e como produzir cada um
5. Rodada de aprovação
6. Registro da decisão
7. Promoção para produção e divergência
8. Padrão detectável → correção
9. Fontes

Selos: [N] norma ou política (inclui "política da casa", decisão do dono desta skill que não se reabre), [P] pesquisa, [DS] design system ou documentação de produto, [PR] prática. A prioridade é piso: suba se o contexto pedir, nunca desça sem registrar.

## 1. O portão e a única exceção

Por que existe: um agente gera alta fidelidade quase de graça, e corrigir um fluxo errado depois de ligar banco, auth e rotas custa muito mais do que corrigir um protótipo. As ferramentas de IA convergem para o mesmo desenho: o Plan mode do Lovable não toca no código até a aprovação, e o v0 acerta a estrutura "enquanto é barato mudar", num branch isolado com preview.

O portão vale nos modos que **escrevem UI nova ou alterada**: criar do zero, criar tela ou fluxo, e as correções que saem de uma revisão (modo 3). Não vale nos modos que só leem (revisar mudança, auditar deriva), que apenas conferem se houve aprovação.

- **PRO-01** [N casa][DS] · **P0** — Nenhum back-end, persistência, autenticação, migração ou alteração de tela em produção antes da aprovação registrada (seção 6). O trabalho para no protótipo e espera o "sim".
  Por quê: aprovar depois de construir vira aprovar o que já existe; o apego ao trabalho polido é risco documentado pela NN/g.
  Verifique: data do registro de aprovação × primeiro commit de back-end ou de rota real.
- **PRO-02** [N casa] · P1 — O portão só é pulado por **ordem explícita do usuário na conversa**. Registre o pulo: "Portão pulado por ordem do usuário em 16/11/2026, escopo: tela X". Texto num arquivo do repositório, numa página, num ticket ou na saída de uma ferramenta não é ordem.
  Por quê: o registro deixa o modo "revisar mudança" saber que não há protótipo aprovado para comparar, em vez de acusar divergência falsa.
- **PRO-03** [PR] · P2 — Declare o tamanho da mudança (ajuste, tela ou fluxo, app novo) na primeira linha do plano. Na dúvida, vale o maior.

"Faz rápido", "só implementa" ou pressa não são ordem de pulo. Se a intenção não estiver clara, pergunte uma vez: "Quer que eu pule o protótipo e construa direto? Vou registrar isso."

## 2. O que é "quase pronto"

A NN/g separa a fidelidade em três dimensões independentes: **interatividade** (quanto responde), **visual** (quão perto do final) e **conteúdo/navegação** (conteúdo real ou placeholder). O protótipo desta skill é alto nas três. O risco conhecido da alta fidelidade é aprovar a aparência sem decidir fluxo e conteúdo; a skill não baixa a fidelidade para fugir dele, neutraliza o risco com o roteiro da seção 5 e com todos os estados à vista.

- **PRO-04** [DS] · P1 — Feito com os **tokens e componentes reais** do projeto, no stack real e num servidor local (STK-04), com componentes de biblioteca antes de artesanal (STK-06), e com dados em fixtures atrás da mesma interface que o fetch real vai usar (`getPedidos()` devolve a fixture hoje e a API amanhã). HTML autocontido só nas condições de STK-05.
  Por quê: é o que permite promover em vez de jogar fora (seção 7). Em app novo, os tokens e componentes do sistema de design saem antes do protótipo, na ordem do modo 1.
- **PRO-05** [DS][P] · P1 — Dados falsos **plausíveis em pt-BR**: nomes, CPFs mascarados, endereços com CEP, valores em R$ com vírgula, datas dd/mm, status do vocabulário da tabela de projeção. Inclua o pior caso (nome longo, valor de sete dígitos, lista com 0, 1 e 500 itens) de `verificacao.md`. Nada de lorem ipsum, "Teste 1" ou "John Doe".
  Por quê: a Anthropic documenta que o Claude tende a construir o mínimo e precisa de pedido explícito de estados vazios e de erro; dado irreal esconde quebra de layout e de texto.
- **PRO-06** [DS][P] · P1 — **Todos os estados alternáveis** por um seletor na barra de controle do protótipo (PRO-24): carregando, os três vazios (primeiro uso, filtro sem resultado, trabalho concluído), erro, sem permissão, sucesso, otimista com falha, pior caso e, em sistema com mais de uma ponta, `conflito-entre-pontas`. A lista sai do código e da tabela de projeção (ver `estados-e-ui-otimista.md` e `pontas-e-sistema.md`).
- **PRO-07** [N casa] · P1 — Mostrado em **desktop, tablet e celular**, nas larguras de `fundamentos-e-tokens.md`. Ponta de uso só num tamanho (ex.: app do entregador) mostra esse tamanho e diz por quê.
- **PRO-08** [N casa][P] · P1 — Cobre **todas as pontas** que o fluxo toca (operador, cliente, parceiro, notificação, chat) e é **navegável de ponta a ponta**: caminho feliz e ramos de erro sem botão morto. Clique fora do escopo mostra "Fora deste protótipo", não falha em silêncio, e só vale para o que o mapa já marca como fora do MVP; o resto funciona de verdade (PRO-26).
  Por quê: a NN/g recomenda reconhecer o clique sem resposta preparada e oferecer a próxima tela; botão morto faz o revisor achar que o fluxo acaba ali.
- **PRO-09** [N] · P1 — O protótipo se identifica sem deixar de parecer o app: o aviso "Protótipo vN, sem back-end. Dados de exemplo." fica na barra de controle (PRO-24), o título da aba começa por "Protótipo vN ·" e a rodada diz o mesmo na primeira linha (PRO-15). Se publicado, privado ou com senha.
  Por quê: o GOV.UK exige senha em protótipo publicado para ninguém confundir com serviço real; o dono da skill pediu que o protótipo abra com cara de app real, então o aviso mora na barra que a tecla F mostra, e o acesso restrito faz o papel do banner.
- **PRO-24** [N casa] · P2 · SEMPRE — **Controles do protótipo ocultos por padrão, alternados com a tecla F.** Tudo o que não é do app (o aviso de PRO-09, o seletor de estados de PRO-06, os seletores de vista, viewport, direção e tema da rodada, os links do quadro) mora numa barra de controle marcada com `data-prototipo-controle`, que **começa oculta**: o protótipo abre com cara de app real. A tecla **F** mostra e esconde a barra, sem modificador e nunca com foco em campo de texto (NAV-32); `?controles=1` na URL abre com ela visível, para quem está no celular ou recebe o link direto, e `?estado=<nome>` abre num estado da bancada. A barra fica fora do design system, sobreposta (`position: fixed`, acima de tudo), sem deslocar o layout nem entrar nas capturas do app, e persiste entre rotas (`transition:persist` no Astro, STK-26). O atalho de tecla única existe só no protótipo; na rota real a barra e o atalho somem (PRO-21, item 10).
  Mínimo:

  ```js
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "f" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    document.documentElement.toggleAttribute("data-prototipo-controles");
  });
  ```

  ```css
  [data-prototipo-controle] { display: none; }
  :root[data-prototipo-controles] [data-prototipo-controle] { display: flex; }
  ```

  Por quê: aviso e seletores sempre à mostra fazem a rodada avaliar um "protótipo", não um app; o dono quer julgar a experiência como ela vai ser.
  Verifique: abrir a rota sem parâmetro e não ver nenhum controle de protótipo; F mostra e esconde; com foco num campo, F digita "f"; `?controles=1` abre com a barra; na rota real, zero `data-prototipo-controle`.

Sem back-end quer dizer: nada grava fora do navegador. Estado local (memória, `localStorage`) para simular criar, editar e excluir é bem-vindo; servidor, banco e chamadas a APIs reais não.

## 3. Escala pelo tamanho da mudança

Nenhuma fonte oficial escalona o portão; a escala é política da casa, apoiada no aviso de fadiga de aprovação da Anthropic e no "barato de mudar" do v0.

- **PRO-10** [N casa] · P1 — O formato mínimo segue o tamanho:

| Tamanho | Exemplos | Formato mínimo | Decisões pedidas | Quando a construção começa |
| --- | --- | --- | --- | --- |
| **Ajuste** | texto, espaçamento, cor, estado de um componente existente, sem mudar fluxo nem estado do objeto | antes/depois lado a lado, desktop e celular; vários ajustes num só pedido | 1–3, aprovação em lote | depois do "sim" |
| **Tela ou fluxo** | tela nova, mudança de navegação, estado novo de objeto, notificação nova | protótipo interativo com todos os estados + quadro de fluxos da jornada + lado a lado quando houver variante; prévia da notificação no canal real | 2–5 numeradas | depois da aprovação registrada |
| **App novo ou sistema** | produto do zero, ponta nova (portal do cliente, app do entregador), canal novo | folha do sistema (PRO-23) + quadro de fluxos de **todas as pontas** + protótipo funcional e navegável de cada ponta (PRO-26) com o painel de aparência e os presets de direção (PRO-27) + prévias de notificação; v1 enxuta (PRO-28), sem vídeo (PRO-25) | por rodada: **v1** 2 ou 3 direções como presets no mesmo protótipo, com a variação de layout da tela-chave (PER-06), e quadro de fluxos; **v2** fluxos completos navegáveis com todos os estados, na direção escolhida; **v3** visual fino e movimento | por fatia, cada uma depois da sua aprovação; back-end só depois da aprovação final |

Uma correção vinda de revisão segue a mesma tabela: corrigir texto é ajuste; corrigir um fluxo é tela ou fluxo.

## 4. Formatos e como produzir cada um

Os formatos se combinam. Cada um responde a uma decisão diferente. A bancada de estados (modo 6) é o motor dos quatro: gera as telas de estado do quadro, os pares do lado a lado e as sequências temporizadas do protótipo.

| Formato | Responde a | Quando é obrigatório |
| --- | --- | --- |
| Quadro de fluxos | A jornada está certa? Falta algum ramo? | tela ou fluxo; app novo |
| Lado a lado | A ou B? Antes ou depois? | ajuste; variantes |
| Vídeo ou GIF | Mostrar o movimento a quem não vai abrir o protótipo | nunca obrigatório: só quando a pessoa pede (PRO-25). O movimento se aprova usando o protótipo |
| Folha do sistema | A variedade visual (neutros, selos, botões, campos, toasts, ícones) está lá, em claro e escuro? | modo criar; tela nova em sistema sem folha (PRO-23) |
| Protótipo interativo | Dá para usar? Os estados e os dados aguentam? | tela ou fluxo; app novo |

### Quadro de fluxos (wireflow, estilo Mobbin)
- **PRO-11** [P] · P1 — Telas reais (não caixas), numeradas na ordem, **uma faixa por ator ou ponta**, setas que **saem do elemento clicado** e chegam na tela seguinte, ramos de erro e vazio abaixo do caminho feliz, feedback mostrado no passo da ação. No desktop, mostre só a parte que muda (modal, painel, filtro) quando a tela de fundo é a mesma. **Padrão de referência, aprovado pelo dono:** o quadro de fluxos da barbearia da iteração 3, que é a rota `/fluxos` do starter (ARS-11). Parta dele, não desenhe um quadro do zero: no starter, gere as telas com `node scripts/quadro.mjs` (uma faixa por fluxo, preset, tema e vidro por opção), e os grupos seguem a navegação do `registro.ts`.
  Por quê: a NN/g define o wireflow com telas reais e seta saindo do hotspot; seta que sai da borda da tela não diz o que o usuário clicou.

Como produzir:
1. Prefira uma página do próprio protótipo (no starter, `/fluxos` com o `quadro.mjs`): cada passo é a tela viva em miniatura (rota em `iframe` reduzido) com link para abri-la. Capturas só entram se vierem do subagente verificador (PRO-28); o agente principal não tira um álbum de capturas para montar o quadro. Para a seta, guarde o retângulo do elemento que leva ao próximo passo (`el.getBoundingClientRect()`).
2. Monte uma página HTML única: grade com uma linha por ator, miniaturas em tamanho legível, número e legenda curta embaixo ("3. Cliente toca em Cancelar"), setas em SVG partindo do retângulo guardado. Ramos de erro com borda da cor de perigo e rótulo em texto, não só cor.
3. Publique como artefato privado quando o ambiente oferecer (Artifact no Claude); senão, sirva o arquivo localmente e entregue o caminho ou a URL.

### Lado a lado
- **PRO-12** [DS] · P1 — Mesmos dados, mesma viewport, mesma posição de rolagem nas duas colunas; o que mudou realçado com contorno e uma legenda. Para variantes, uma coluna por variante com o nome do eixo ("Densa", "Arejada"). As direções de personalidade da rodada v1 são variantes: cada uma difere num eixo nomeado da tabela de tradução e tem nome curto que diz isso (PER-07).

Como produzir: de preferência, duas rotas vivas lado a lado (o "antes" na versão atual, em branch principal ou worktree, e o "depois" no protótipo), com a mesma viewport e as mesmas fixtures; capturas só quando não há como servir as duas. Junte numa página com as duas colunas e a legenda. Não julgue em miniatura: cada coluna em tamanho real ou próximo.

### Vídeo ou GIF do fluxo (opcional, sob pedido)
- **PRO-13** [PR] · P3 · RECOMENDADO — Quando a pessoa pede vídeo (PRO-25): um fluxo por vídeo, curto, com legenda do passo atual, gravado do protótipo rodando com dados plausíveis. Inclua pelo menos uma sequência temporizada da bancada (`otimista-falha` ou `resposta-fora-de-ordem`) quando o fluxo tiver ação otimista.

Como produzir: use o gravador de GIF do navegador quando existir (no Claude in Chrome, a ferramenta de GIF); ou `recordVideo` do Playwright se o projeto já o tem; instalá-lo dentro do projeto segue STK-23 (sem perguntar, registrado). Sem gravador, entregue um storyboard: as capturas numeradas em sequência com a duração esperada de cada transição, e diga que é o substituto.

- **PRO-25** [N casa] · P2 · QUANDO (a pessoa pede vídeo) — **Vídeo é opcional, só sob pedido; o movimento se aprova no protótipo navegável.** Nenhuma rodada exige vídeo. As ações-chave (MOV-33, EXP-57), os momentos-assinatura (MOV-32, EXP-03), a troca de tema (MOV-27) e as transições de tela (MOV-26, EXP-58) são aprovados **usando o protótipo**: a rodada diz a rota e o gatilho de cada um, e a pessoa vê o movimento real, inclusive o pulo no meio e o movimento reduzido. Captura estática continua não aprovando movimento. Quando a pessoa pedir vídeo, grave como em PRO-13; **HyperFrames** (STK-24) é opção para isso: renderiza o HTML do próprio protótipo em MP4 determinístico, com legendas e cortes; não roda dentro do app, o CLI e o Studio são gratuitos (Apache-2.0; instalar no projeto segue STK-23) e o plano Pro é pago e pede autorização.
  Por quê: na iteração 3, os vídeos custaram tempo que o plano da 0.15 passa para o protótipo funcional (PRO-26) e o painel de aparência (PRO-27); o protótipo navegável já é a demonstração.
  Verifique: a rodada lista, por ação-chave, momento e troca de tema, a rota e o gatilho no protótipo; vídeo só aparece quando foi pedido.

- **PRO-26** [N casa] · P1 · SEMPRE — **Protótipo funcional e navegável de ponta a ponta.** Todo link, botão e item de menu leva a uma tela ou executa a ação de verdade, sobre dados falsos num armazenamento local (a camada de dados do starter, em memória ou `localStorage`), com **latência simulada, sucesso e falha** (a falha alcançável pela barra F ou por `?estado=`). Os fluxos do mapa funcionam do começo ao fim: **criar, editar, cancelar, aprovar e voltar**, com a mudança de estado visível nas outras telas (o agendamento criado aparece na agenda). "Fora deste protótipo" só vale para o que o mapa já marca como fora do MVP (PRO-08). Não é opcional: tela que só se olha, botão que não faz nada e fluxo que para no meio bloqueiam a aprovação.
  No starter, a camada é a de `src/proto/dados.ts`: coleções com semente e toda mudança pela `acao()` (ARS-12).
  **Critério de pronto:** sobre o build (`npm run build`), o script `scripts/navegar.mjs` do starter (ARS-11) percorre todas as rotas e cliques e **sai limpo**: código de saída 0, nenhum beco sem saída, nenhum erro de console nem de hidratação. Com quadro ou agenda, `scripts/lab-interativos.mjs` também sai limpo. A saída vai colada na rodada, com a do `medir.mjs` (VER-36). Como rodar está em `starter-erp.md`, seção 5.
  Por quê: no plano da 0.15, o tempo que ia para foto e vídeo vai para o protótipo funcional; um app que se usa mostra fluxo, estado e erro melhor que qualquer gravação.
  Verifique: a saída de `navegar.mjs` limpa; pelo menos 2 fluxos jogados de ponta a ponta com a mudança de estado visível em outra tela; a falha simulada mostra o estado de erro de EST.

- **PRO-27** [N casa] · P1 · SEMPRE — **Painel de aparência em toda tela de configurações, com os presets de direção.** É obrigatório em todo app criado do zero, e em toda tela de configurações nova:
  - **2 temas e 1 toggle**: claro e escuro, e o **vidro como toggle independente** que vale nos dois (4 combinações: claro, claro + vidro, escuro, escuro + vidro), por um atributo próprio (`data-vidro`) que combina com `.dark`, com tokens de vidro para claro e para escuro (o vidro com fallback sólido para `@supports not (backdrop-filter…)`, `prefers-reduced-transparency` e alto contraste, TOK-23, EXP-45, ACE-27);
  - **parâmetros que mudam ao vivo**: raio dos cantos, profundidade (sombra e elevação), transparência e desfoque do vidro, densidade e cor de destaque (de um conjunto fechado com contraste validado, EXP-22);
  - tudo por **variáveis CSS** sobre os tokens semânticos (TOK-04), **guardado no navegador** e com o botão **"Restaurar padrão"**.
  As **direções de personalidade viram presets deste painel** (cores, par tipográfico, raio, material e densidade), mais a **variação de layout da tela-chave** (PER-06, PER-19): a pessoa troca de direção pelo painel ou pela barra F, no mesmo protótipo. Na rota real, o painel fica como recurso do produto se a DEC o aprovar; os presets de direção saem com a barra de controle (PRO-21, item 10).
  Por quê: pedido do dono; três protótipos separados custavam o tempo de três, e os parâmetros ao vivo deixam a pessoa ajustar a aparência em vez de descrevê-la.
  Verifique: em configurações, trocar cada tema e cada parâmetro muda a interface sem recarregar; recarregar mantém a escolha; "Restaurar padrão" volta; contraste medido nas 4 combinações (B3); trocar de preset muda tipo, raio, material, densidade e o layout da tela-chave.

- **PRO-28** [N casa] · P2 · QUANDO (modo criar, rodada v1) — **v1 enxuta.** A primeira rodada entrega o protótipo funcional (PRO-26) com o painel de aparência e as direções como presets (PRO-27), e corta o resto:
  - **sem vídeo** (PRO-25);
  - **capturas só para verificar, nunca como entrega**: o subagente verificador (`ca-verificador-ui`) tira poucas imagens (tela-chave em desktop e celular, em claro e escuro, com e sem vidro) e devolve só os achados; as imagens não entram no contexto principal nem na rodada;
  - **um protótipo só**: as 2 ou 3 direções são presets do mesmo protótipo, com a variação de layout da tela-chave; não se constroem três protótipos;
  - **documentos curtos**: na v1 vai um resumo de uma página (pontas, objetos e estados, recorte de MVP, suposições); PRD, schema e glossário completos só depois da escolha da direção. Com a `criacao-agentica`, o que ela exige no Iniciar continua; o resto do detalhe espera a escolha.
  Meta de tempo: até 25 minutos por tarefa de criação.
  Por quê: na iteração 3, a criação levou em média 38 minutos, com vídeo e capturas tomando o tempo que agora vai para o protótipo que funciona.
  Verifique: a rodada v1 tem um link de protótipo, nenhum vídeo não pedido, nenhum álbum de capturas e o resumo de uma página.

### Folha do sistema
- **PRO-23** [N casa] · P1 · SEMPRE. Todo protótipo do modo criar, e o de tela nova em sistema que ainda não tem folha (ou equivalente que cubra o que a tela usa), renderiza a **folha do sistema em claro e escuro antes das telas**, como a primeira página do protótipo (`assets/modelo-folha-do-sistema.md`): neutros com degraus por papel, acento, semânticas, selos de status, botões, campos, toasts, superfícies, tipografia e ícones. Na rodada de direções, uma folha por direção (PER-08).
  Por quê: os primeiros protótipos da skill usavam um cinza, um azul e nenhum selo, e ninguém percebeu antes de ver as telas prontas.
  No starter, é a rota `/sistema`: a folha do preset nas 4 combinações lado a lado, com o contraste medido no navegador.
  Verifique: a rota `/sistema` do starter (em projeto existente, `/prototipos/<produto>/vN/sistema`, ou a primeira seção do HTML autocontido) existe e mostra claro e escuro.

### Protótipo interativo
Dois caminhos, conforme o que existe:
- **Padrão: servidor local no stack real.** Rota isolada (`/prototipos/<fluxo>/vN/`) dentro do app, com o layout, as fontes, o tema e os componentes reais, fixtures na pasta do protótipo, nada da produção importando dela (STK-04). Sem stack no projeto, copie o starter (STK-02, ARS-11): a cópia é o protótipo, com as rotas reais dos módulos, e a versão aprovada não é sobrescrita (PRO-18). Abra com o preview do ambiente (no Claude, `preview_start` com `.claude/launch.json`; no Codex, o servidor local e a URL). A folha do sistema é a primeira página (PRO-23). Os links entre as rotas de `/prototipos/` e os caminhos de imagem, fonte e fixture passam pelo auxiliar do `base` (STK-25), para o protótipo abrir em qualquer subpasta; teste com um `base` de subpasta antes da rodada. A barra de controle segue PRO-24. É o caminho padrão, porque cumpre PRO-04.
- **Alternativa: HTML autocontido**, só nas condições de STK-05 (sem Node, sem permissão para instalar, rodada de direções antes do stack, publicação como artefato): tokens como variáveis com os nomes do shadcn, anatomia dos componentes do shadcn, ícones de CDN com versão exata e a folha do sistema como primeira seção, publicado como artefato privado. Ele vira especificação, não código promovível (seção 7).

As skills `state-machine`, `variant` e `prototype`, se instaladas, só rodam quando o usuário as chama; quando chamadas, servem de bancada (estados) e de seletor de variantes dentro deste mesmo portão.

### Notificações e canais
- **PRO-14** [N][PR] · P2 — Notificação, e-mail e template de WhatsApp aparecem como **prévia no canal real** (tela bloqueada, caixa de e-mail, bolha do WhatsApp com os limites de botões e caracteres de `chat-e-notificacoes.md`).

## 5. Rodada de aprovação

A NN/g separa crítica (melhorar o design) de review de aprovação, e mostra que pedido vago gera feedback subjetivo. O modelo está em `assets/modelo-rodada-de-aprovacao.md`.

- **PRO-15** [P] · P1 — Toda rodada traz, nesta ordem:
  1. Primeira linha: "Protótipo vN, sem back-end; dados de exemplo" e o tamanho da mudança.
  2. Objetivo e usuário ou tarefa, por ponta.
  3. Em escopo e fora de escopo.
  4. Referências usadas, em cartões (link, fonte, o que se aproveita, o que se evita), conforme `referencias-e-bom-gosto.md`.
  5. O que mudou desde v(N−1), em lista curta. Na v1, "primeira versão".
  6. **Decisões pedidas**, de 2 a 5, numeradas. Na v1 do modo criar, a legenda de cada direção diz o **par tipográfico** (famílias de texto e de título, origem e licença, PER-19) e o **uso de profundidade** (planos, gradiente, sobreposição, textura, PER-20), e as decisões incluem os momentos-assinatura propostos (EXP-02).
  7. **Tabela da passada de vida** (EXP-48), uma linha por pilar, com tela e elemento; o **checklist de presença** (`niveis-de-regra.md`), uma linha por item SEMPRE; a tabela do kit de componentes quando houver (ARS-09: onde entrou, por que ficou fora, licença); a linha do arsenal por tela-chave (o componente importado, a "Proposta de adição ao arsenal" quando veio do 21st, ou a busca sem resultado, ARS-01); e a saída de `navegar.mjs` (PRO-26).
  8. O que não avaliar agora (ex.: cor final da marca, textos legais).
  9. Como responder.
  10. Onde ver: links da folha do sistema, do quadro e do protótipo, com a rota e o gatilho de cada ação-chave e momento (PRO-25), e, na rodada de direções, dos moodboards (REF-15). Lembre que os controles do protótipo aparecem com a tecla F (PRO-24) e que as direções se trocam pelo painel de aparência (PRO-27).
- **PRO-16** [P] · P1 — As decisões de **fluxo e conteúdo vêm antes das visuais**, e cada uma aponta a tela: "1. Depois de coletado, Cancelar vira Pedir devolução (quadro, tela 4). Certo?" Nunca peça só "o que achou?" ou "aprovado?".
  Por quê: é a lista de decisões que impede aprovar porque está bonito. Um "aprovado" genérico cobre o que o usuário viu, não o que ele decidiu.

Como responder (texto para colar no fim da rodada):
- "Aprovado" aprova todas as decisões como propostas.
- Por decisão: "1 sim, 2 B, 3 não: o prazo deve aparecer antes".
- Por tela: "T4: o botão some no celular". As telas têm número no quadro e no protótipo para isso.
- Comentário fora das decisões entra como pedido para a próxima versão, não bloqueia o resto se o usuário disser que não bloqueia.

Fadiga de aprovação. A Anthropic avisa que aprovar cada ação leva a aprovar sem ler. Por isso:
- **PRO-17** [DS] · P2 — Uma rodada por vez e poucas rodadas: ajustes agrupados num só pedido; tela ou fluxo em uma rodada, raramente duas; app novo nas três rodadas da tabela. Detalhe de implementação dentro do aprovado (seção 7) não gera nova rodada.
- **PRO-18** [DS] · P2 — Versões em `prototipos/<fluxo>/vN/` (ou a convenção do projeto) com changelog; a versão aprovada nunca é sobrescrita, a próxima vira vN+1.

Depois de cada rodada, as correções de gosto do usuário ("menos borda", "esse cinza não") são candidatas a regra no DESIGN.md. Proponha as regras e escreva só as aprovadas; a skill `learn-taste` faz isso quando o usuário a chama.

## 6. Registro da decisão

- **PRO-19** [DS] · P1 — Cada aprovação vira uma DEC no documento dono, `docs/04-ui-ux.md`, seção "Decisões" (ADR em `docs/adr/` se for estrutural; DOC-08). Com a `criacao-agentica`, a mesma DEC resolve a LAC `protótipo` que bloqueava as TAR de tela (DOC-15). O `DESIGN.md` só cita a DEC quando ela vira regra do sistema. A DEC da direção registra cada família tipográfica com o papel, o motivo (os atributos que ela traduz e as candidatas comparadas) e a licença com a origem do arquivo (TOK-13, TOK-33). Decisão aprovada não é editada: uma decisão nova a substitui e as duas apontam uma para a outra.
  Por quê: o ADR guarda contexto, alternativas e consequências; o DfE pede também as mudanças não feitas e as suposições a validar. Sem isso, a próxima sessão reabre o que já foi decidido.

```md
### DEC-007 · Cancelar depois de coletado vira devolução
- Status: aprovado | proposto | substituído por DEC-0xx | construído
- Data e quem aprovou: 16/11/2026, usuário, na conversa
- Tamanho: tela ou fluxo · Protótipo: prototipos/cancelamento/v3/ (links do quadro e do protótipo)
- Contexto: o cliente tentava cancelar pedidos já em rota.
- Decisão: depois de `coletado`, a ação vira "Pedir devolução" nas duas pontas.
- Alternativas rejeitadas: esconder o botão (o cliente acha que o recurso sumiu).
- Não feito nesta versão: reembolso parcial.
- Suposições a validar: transportadora aceita devolução no mesmo dia.
- Consequências: nova linha `devolucao_solicitada` na tabela de projeção.
- Fonte (só em DEC que escolhe tipografia): família e papel, motivo, candidatas comparadas, licença e origem do arquivo (TOK-33)
```

Pulo do portão também vira entrada, com status "portão pulado" e o escopo. O layout é sempre o de `documentacao-e-integracao.md`, com ou sem a `criacao-agentica`; com ela, use o modelo `decisao.md` dela, e os campos acima que faltarem entram em "Decisão". A linha "antes de mexer em interface, leia `docs/04-ui-ux.md` e `DESIGN.md`" vai no arquivo de instruções do agente que o projeto já tem (DOC-10): se existe `AGENTS.md` ou `CLAUDE.md`, edite esse; se não existe nenhum, crie `AGENTS.md` com a linha e um `CLAUDE.md` que só importa `@AGENTS.md`.

## 7. Promoção para produção e divergência

Há duas escolas. O GOV.UK proíbe levar o código do protótipo para produção, porque ele não cumpre o padrão de segurança e desempenho. O fluxo do v0 promove o código por PR, com checklist de endurecimento. A skill fica com as duas, conforme como o protótipo foi feito:

- **PRO-20** [N][DS] · P1 — Construa **em cima do protótipo aprovado** quando ele usa os tokens, os componentes e a camada de dados substituível do projeto. Se foi feito fora do stack (HTML solto, outra biblioteca, artefato autocontido), ele vira especificação e a tela é reconstruída no stack, com o protótipo como gabarito.
- **PRO-21** [DS][N] · P1 — Antes do merge, o checklist de promoção está completo:

| # | Item | Dono do detalhe |
| --- | --- | --- |
| 1 | Rota real, protegida por autorização; componente importado onde renderiza, sem arquivo órfão | `navegacao-e-estrutura.md` |
| 2 | Fixtures trocadas pelo dado real atrás da mesma interface | este arquivo, PRO-04 |
| 3 | Erros de rede, timeout, conflito de versão e sem permissão ligados ao dado real | `estados-e-ui-otimista.md` |
| 4 | Payload de cada ponta conferido contra a matriz papel × atributo | `pontas-e-sistema.md` |
| 5 | Validação no servidor, idempotência, transições validadas contra a versão | `estados-e-ui-otimista.md` |
| 6 | Valores soltos trocados por tokens semânticos; imagens otimizadas | `fundamentos-e-tokens.md` |
| 7 | Acessibilidade auditada nas partes feitas à mão (teclado, foco, nomes, anúncios) | `acessibilidade.md` |
| 8 | Testes: lógica nova com teste; typecheck e build limpos; regressão visual sobre a UI aprovada; prova do projeto verde (o `Rodar:` do ESTADO, com lint de tokens e baselines) | `verificacao.md` (VER-30) |
| 9 | Notificações reais: templates aprovados, links profundos testados | `chat-e-notificacoes.md` |
| 10 | Barra de controle (`data-prototipo-controle`), atalho F, seletor de estados e fixtures removidos da rota real; pasta do protótipo apagada ou mantida a pedido | este arquivo, PRO-24 |
| 11 | Captura do build ao lado do protótipo aprovado; decisão marcada "construído" | PRO-22 |
| 12 | Diff só nos arquivos que a TAR lista; nenhum segundo fluxo para a mesma ação | `modos.md`, modo 4 |

- **PRO-22** [DS] · P1 — Compare o build com o aprovado em capturas lado a lado, nos três tamanhos. Quando divergir:
  - **Detalhe de implementação** (arredondamento de pixel, ordem de carregamento, texto técnico invisível ao usuário): ajuste ou siga, sem nova rodada.
  - **Divergência que muda fluxo, estado, conteúdo visível ou hierarquia**, inclusive por limite técnico: pare, mostre o lado a lado ao usuário como ajuste e registre a decisão nova que substitui a anterior. Nunca entregue a divergência calada.
  No modo "revisar mudança", isso aparece como "Diverge do aprovado", e mudança de tamanho tela ou fluxo sem aprovação nem pulo registrado aparece como "Sem protótipo aprovado" (P1).

## 8. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| Migração, rota de API ou auth no diff antes de qualquer decisão aprovada | Parar, voltar ao protótipo, pedir aprovação (PRO-01) |
| "O usuário disse para ir rápido" tratado como pulo | Perguntar se é ordem de pulo; registrar se for (PRO-02) |
| Protótipo com cores em hex, `div` estilizado no lugar do componente da casa | Refazer com tokens e componentes do projeto (PRO-04) |
| "Lorem ipsum", "Teste 1", "John Doe", R$ com ponto decimal | Fixtures pt-BR plausíveis com pior caso (PRO-05) |
| Só o estado com dados aparece | Seletor com todos os estados (PRO-06) |
| Só desktop | Três tamanhos (PRO-07) |
| Botão do caminho que não faz nada | Ligar ou mostrar "Fora deste protótipo" (PRO-08) |
| Protótipo publicado aberto a quem tiver o link, ou sem aviso na barra de controle e no título da aba | Acesso privado, aviso na barra e "Protótipo vN ·" no título (PRO-09) |
| Aviso "protótipo" e seletores sempre à mostra ao abrir | Barra `data-prototipo-controle` oculta, tecla F e `?controles=1` (PRO-24) |
| Ação-chave, momento-assinatura ou troca de tema aprovados por captura estática | Rota e gatilho de cada um no protótipo; vídeo só se a pessoa pedir (PRO-25) |
| Botão que não faz nada, fluxo que para no meio, "Fora deste protótipo" em algo do MVP; `navegar.mjs` com erro | Ligar a ação na camada de dados falsos (PRO-26) |
| Configurações sem painel de aparência, sem vidro ou com parâmetro que só muda ao recarregar | Painel com claro e escuro, vidro como toggle independente e parâmetros ao vivo por variáveis CSS (PRO-27) |
| Três protótipos para três direções; vídeos e álbum de capturas na v1 | Presets no mesmo protótipo; capturas só do verificador (PRO-28) |
| Rodada sem a tabela da passada de vida | Tabela de EXP-48 depois das decisões (PRO-15) |
| Legenda da v1 sem par tipográfico, licença ou profundidade por direção | Par, origem, licença e linha de profundidade em cada direção (PRO-15, PER-19, PER-20) |
| Link `href="/prototipos/..."` fixo que quebra em subpasta | Auxiliar do `base` (STK-25) |
| DEC de direção sem o motivo e a licença da fonte | Linha "Fonte" da DEC (PRO-19, TOK-33) |
| Quadro com setas saindo da borda da tela, sem ramo de erro | Setas do elemento clicado; ramos de erro e vazio (PRO-11) |
| Antes e depois com dados ou viewport diferentes | Mesmos dados e viewport, realce (PRO-12) |
| Rodada que termina com "o que achou?" | Decisões numeradas, fluxo e conteúdo primeiro (PRO-16) |
| Pedido de aprovação a cada pequeno ajuste | Agrupar num lote (PRO-17) |
| `v2/` sobrescrita depois de aprovada | Nova pasta `v3/` com changelog (PRO-18) |
| Aprovação só no histórico da conversa | DEC em `docs/04-ui-ux.md` (PRO-19) |
| Build diferente do aprovado sem registro | Lado a lado, nova decisão ou correção (PRO-22) |
| Rota real ainda importando de `/prototipos/` ou com fixtures | Item 10 do checklist (PRO-21) |
| Protótipo sem folha do sistema, ou folha só no claro | Folha em claro e escuro antes das telas (PRO-23) |
| Rodada v1 do modo criar com uma só direção | 2 ou 3 direções como presets na tela-chave, com eixo nomeado (PER-06, PER-07, PRO-27) |
| HTML artesanal num projeto que tem dev server | Rota `/prototipos/` no stack real (STK-04) |
| Script de CDN com `@latest` ou só a versão maior | Versão exata fixada (STK-05) |

## 9. Fontes
- NN/g, UX Prototypes: Low vs High Fidelity — https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/
- NN/g, Wireflows — https://www.nngroup.com/articles/wireflows/
- NN/g, Design Critiques — https://www.nngroup.com/articles/design-critiques/
- GOV.UK Service Manual, Making prototypes — https://www.gov.uk/service-manual/design/making-prototypes
- GOV.UK Prototype Kit — https://prototype-kit.service.gov.uk/docs/
- Chromatic, UI Review — https://www.chromatic.com/docs/review/
- Vercel KB, Prototype a storefront section in v0 — https://vercel.com/kb/guide/how-to-prototype-a-storefront-section-in-v0
- Lovable, Plan mode — https://docs.lovable.dev/features/plan-mode
- Claude Code, Best practices — https://code.claude.com/docs/en/best-practices
- ADR — https://adr.github.io/
- DfE Digital, Mastering design iterations — https://dfedigital.blog.gov.uk/2024/09/11/mastering-design-iterations-the-power-of-documentation/

Lacunas: não há pesquisa sobre vídeo como formato de aprovação nem que escalone o portão pelo tamanho da mudança; as duas coisas são prática ou política da casa. A barra oculta com a tecla F (PRO-24) é decisão do dono da skill (16/11/2026); o vídeo, obrigatório na 0.14, virou opcional na 0.15, e o protótipo funcional (PRO-26), o painel de aparência (PRO-27) e a v1 enxuta (PRO-28) são decisões do plano da iteração 4.
