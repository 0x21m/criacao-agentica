# Modelo de folha do sistema

A folha do sistema é uma **página própria do protótipo, renderizada antes das telas**, que mostra numa só rolagem toda a variedade visual que o produto vai usar: neutros, acento, semânticas, selos de status, botões, campos, toasts, superfícies, tipografia e ícones, **em claro e em escuro**. Ela existe porque os primeiros protótipos da skill usavam um cinza, um azul e nenhum selo, e ninguém percebeu antes de ver as telas prontas.

**Padrão de referência, aprovado pelo dono:** a folha do sistema da barbearia da iteração 3, portada para a rota `/sistema` do starter (ARS-11). Ela lê os tokens do preset ativo ao vivo, nas 4 combinações de claro, escuro e vidro. Parta dela e troque os tokens, não monte a folha do zero.

Quando é obrigatória:

- **Modo criar do zero:** sempre, uma folha **por direção** da rodada v1 (`references/direcao-e-personalidade.md`, PER-08) e, depois da escolha, a folha da direção aprovada.
- **Tela ou fluxo novo:** quando o sistema ainda não tem uma folha (ou equivalente: Storybook, página de componentes) que cubra o que a tela usa. Se tiver, aponte para ela e acrescente só o que a tela nova introduz.

Como fazer:

- Rota no stack real, antes das telas: `/prototipos/<produto>/vN/sistema` (`references/stack-e-bibliotecas.md`, STK-04). No HTML autocontido, é a primeira seção da página (STK-05).
- Tudo sai dos **componentes e tokens reais** (tema do shadcn gerado dos tokens, STK-10 e STK-11). Nenhum valor literal na folha: se algo só fica certo com literal, falta um token.
- Um seletor fixo no topo: **tema claro / escuro** e, na rodada de direções, **direção** (troca `data-theme`, STK-12). Os dois modos também podem aparecer lado a lado em colunas.
- Cada bloco tem um título curto e, ao lado de cada amostra, o nome do token ou da variante (`--success-subtle`, `Button variant="outline"`), para a pessoa poder apontar ("o selo `aguardando_peca` está fraco no escuro").
- Contraste medido nos pares de texto e de controle, nos dois modos, com o valor ao lado (TOK-16). Par que reprova fica marcado na própria folha, não escondido.
- Dados de exemplo em pt-BR plausível (PRO-05).

Os blocos abaixo são o mínimo. Troque os exemplos pelos objetos e estados do produto.

---

# Folha do sistema · <produto> · direção <nome> · v<N>

Barra de controle oculta, tecla F (PRO-24): "Protótipo vN, sem back-end. Dados de exemplo." (PRO-09) · Seletor: Claro | Escuro · Direção: A | B | C

## 1. Neutros 50–950 e papéis

Rampa de 11 degraus (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950), com o degrau usado por cada papel em cada modo.

| Papel (token) | Degrau no claro | Degrau no escuro | Amostra | Contraste medido |
| --- | --- | --- | --- | --- |
| Fundo da página (`bg-page`, `--background`) | | | | não se aplica |
| Superfície (`bg-surface`, `--card`) | | | | não se aplica |
| Superfície elevada (`bg-raised`, `--popover`) | | | | não se aplica |
| Afundada / campo (`bg-sunken`, `--muted`) | | | | não se aplica |
| Hover e item ativo (`bg-surface-hover`, `--accent`) | | | | não se aplica |
| Borda decorativa (`border-subtle`, `--border`) | | | | não se aplica |
| Borda de controle (`border`, `--input`) | | | | ≥ 3:1 |
| Texto principal (`text-primary`) | | | | ≥ 4,5:1 |
| Texto secundário (`text-secondary`, `--muted-foreground`) | | | | ≥ 4,5:1 sobre fundo, superfície e afundada |
| Texto desabilitado (`text-disabled`) | | | | isento, mas legível |

Mostre também as camadas empilhadas: página → card → popover aberto sobre o card, nos dois modos, para ver que os degraus se distinguem (TOK-20).

## 2. Acento

- Rampa do acento e os papéis `accent-subtle`, `accent-border`, `accent-solid` (`--primary`), `accent-solid-hover`, `accent-text`, `text-on-accent`.
- Onde ele aparece nesta direção (só ação e foco? também marca e seleção?), conforme a tabela de tradução (PER-04).
- Contraste de `text-on-accent` sobre `accent-solid` e de `accent-text` sobre fundo e superfície.

## 3. Semânticas

Uma linha por semântica, quatro variantes cada, nos dois modos:

| Semântica | `subtle` (fundo) | `border` | `solid` | `text` | Contraste de `text` sobre `subtle` |
| --- | --- | --- | --- | --- | --- |
| Sucesso | | | | | |
| Aviso | | | | | |
| Perigo (`--destructive` = `solid`) | | | | | |
| Informação | | | | | |
| Neutro (estado de negócio sem ação) | | | | | |

Confira que informação e acento estão a 15° ou mais de matiz (TOK-18).

## 4. Selos de status

**Um selo por estado de cada objeto**, tirado da tabela de estados (`assets/modelo-tabela-de-estados.md`): rótulo do operador, cor semântica e **ícone** da família (STK-17). Ao lado, a frase do cliente quando ela muda.

| Objeto | Estado interno | Selo (renderizado) | Cor | Ícone | Frase do cliente |
| --- | --- | --- | --- | --- | --- |
| Ordem de serviço | `aberta` | Aberta | neutro | círculo tracejado | "Recebemos seu aparelho" |
| Ordem de serviço | `aguardando_peca` | Aguardando peça | aviso | relógio | "Aguardando uma peça" |
| Ordem de serviço | `pronta_retirada` | Pronta para retirada | sucesso | check | "Pronto para retirar até 11/12" |
| Pedido | `tentativa_falhou` | Tentativa falhou | perigo | caminhão com alerta | "Não conseguimos entregar" |
| … | | | | | |

Mostre os selos também dentro de uma linha de tabela e de um card, que é onde vão viver.

## 5. Botões

Matriz variante × estado, com o tamanho padrão e o compacto (TOK seção 5):

| Variante | Normal | Hover | Pressionado | Foco (`:focus-visible`) | Carregando | Desabilitado |
| --- | --- | --- | --- | --- | --- | --- |
| Primário (`default`) | | | | | | |
| Secundário (`secondary`) | | | | | | |
| Outline | | | | | | |
| Ghost | | | | | | |
| Destrutivo (`destructive`) | | | | | | |
| Só ícone (`size="icon"`, com `aria-label` e tooltip) | | | | | | |
| Com ícone à esquerda ("Nova OS") | | | | | | |
| Link | | | | | | |

O destrutivo tem de ser **visivelmente distinto** do primário. "Carregando" mantém a largura e o rótulo ("Salvando…"). Hover e pressionado podem ser forçados por classe só na folha, para a pessoa ver sem passar o mouse.

## 6. Campos

| Campo | Vazio | Foco | Preenchido | Erro com mensagem | Desabilitado |
| --- | --- | --- | --- | --- | --- |
| Texto ("Nome do cliente") | | | | "Informe o nome do cliente" | |
| Com prefixo R$ (valor alinhado à direita, `tabular-nums`) | | | R$ 1.234,56 | "Informe um valor maior que zero" | |
| Com máscara CPF | | | 123.456.789-09 | "CPF inválido. Confira os 11 números" | |
| Com máscara telefone | | | (11) 98765-4321 | | |
| Select | | | | | |
| Combobox com busca | | aberto com resultados | | sem resultado: "Nenhum técnico com esse nome" | |
| Data (calendário pt-BR, dd/mm/aaaa) | | aberto | 22/11/2026 | "A data precisa ser depois de hoje" | |
| Área de texto | | | | | |
| Checkbox, radio, switch | | | | | |

Rótulo visível acima, ajuda abaixo quando existir, erro perto do próprio campo (TOK-06) e textos pela `microtexto-ptbr.md`.

## 7. Toasts e alertas

| Tipo | Toast (Sonner) | Alerta na página |
| --- | --- | --- |
| Sucesso | "OS 1042 salva" | |
| Erro | persistente, com ação ("Tentar de novo") | obrigatório também fora do toast (EST-16) |
| Aviso | | |
| Informação | | |
| Carregando → sucesso | "Enviando orçamento…" → "Orçamento enviado ao cliente" | não se aplica |
| Com Desfazer | "OS 1042 arquivada · Desfazer" (≥ 5 s, pausa no hover; Desfazer também no menu do item, EST-32) | não se aplica |

Cada um com o ícone da semântica e a cor `subtle`/`border`/`text`, nos dois modos.

## 8. Superfícies e componentes

Uma amostra viva de cada um, com dados do domínio:

- **Card** em repouso, hover (se clicável) e selecionado; card de KPI com valor, comparação positiva e **negativa** (TOK, anatomia de KPI).
- **Tabela** com cabeçalho, linha normal, hover, selecionada, valor negativo em R$, coluna de status com selo, ações por linha e linha de pior caso (nome longo).
- **Abas** e sub-abas, com a ativa e uma com contador.
- **Menu** (dropdown) com ícones, atalho à direita, separador e item destrutivo.
- **Popover** e **tooltip** (botão-ícone com tooltip de 1–2 palavras).
- **Sheet** (painel lateral) e **modal**, abertos sobre uma tela, com o scrim.
- **Vazios**: primeiro uso (com ícone ou ilustração da direção e a ação), filtro sem resultado, trabalho concluído.
- **Skeleton** da listagem e do detalhe.
- **Avatar** com foto, com iniciais e o grupo empilhado.

## 9. Tipografia

A escala inteira, com nome do token, tamanho, entrelinha e peso, e uma frase real em pt-BR em cada degrau: título da página, título de seção, título de componente, corpo, texto operacional, rótulo, metadado, valor de KPI, código (mono, `slashed-zero`: "OS-01042"), número tabular em coluna. Mostre o par tipográfico da direção e o motivo (PER-04).

## 10. Ícones

Grade com os ícones que o produto usa, da família escolhida, no tamanho de controle e no de vazio, com o nome: navegação, ações (criar, editar, duplicar, arquivar, excluir, filtrar, exportar, mais), status (um por estado), vazios, campos (busca, calendário, moeda), alertas. Mostre o par ativo/inativo (preenchido/traço, ou o substituto em Lucide) e o traço ao lado de texto 400 e 600 (STK-15, STK-16). Nenhum emoji (STK-14).

## 11. Checagem final: as telas usam essa variedade

Antes de mostrar o protótipo, percorra as telas e marque cada linha. Linha "não" vira correção ou explicação na rodada.

| Pergunta | Sim / não | Onde (tela) |
| --- | --- | --- |
| Todo status de objeto aparece como **selo** com cor e ícone, não como texto solto? | | |
| **Valores negativos** (saldo, variação, estorno) aparecem com o tratamento definido, com sinal e não só cor? | | |
| A **ação destrutiva** é distinta da primária e confirma ou desfaz conforme EST? | | |
| Há **camadas de superfície** perceptíveis (página, card, elevada) nos dois modos? | | |
| Os fluxos dão **feedback**: toast de sucesso, carregando → sucesso, erro no lugar, Desfazer? | | |
| Botões usam mais de uma variante, com **um** primário por vista (GOV-07)? | | |
| Campos mostram foco, erro com mensagem e máscara onde o dado tem formato (CPF, telefone, R$, data)? | | |
| **Ícones** da família na navegação, nas ações e nos vazios; nenhum emoji? | | |
| A escala de **neutros** tem pelo menos fundo, superfície, borda e dois níveis de texto em uso, não um cinza só? | | |
| O **acento** aparece onde a direção diz, e não em tudo? | | |
| O modo escuro foi aberto em todas as telas, não só na folha? | | |
| Algum valor visual da tela não está na folha? (Se sim, entra na folha ou vira token.) | | |
