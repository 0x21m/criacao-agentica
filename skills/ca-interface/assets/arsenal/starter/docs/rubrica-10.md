# Rubrica de 10/10 do starter

Piso: a Noite da barbearia (iteração 3) recebeu **6,5/10** do dono. Meta: **9/10 ou mais** em cada critério. Cada
critério é observável numa captura ou no navegador; a nota é dada preset a preset, nas capturas de
`capturas/fase1/` (Visão geral, Clientes e Aparência, 1440 e 390 px, 4 combinações). Referências em
[referencias-10.md](referencias-10.md).

## Critérios

1. **Hierarquia em 3 segundos.** Uma coisa grande por tela (título de página 20 a 24 px ou um KPI-herói); o olho cai
   primeiro na saudação e nos números do dia, depois na atenção, depois no resto.
2. **Ritmo de 4/8 px.** Espaços e alturas na grade (4, 8, 12, 16, 24, 32); vãos iguais entre cards; topos e bases da
   mesma linha alinhados (o `navegar.mjs` mede: alturas diferentes na linha com 2 px de tolerância).
3. **Acento contido (≤ 5 % da área).** Ação principal, item ativo, ponto ao vivo, um número em destaque, linha do
   gráfico. Nada mais pintado de acento.
4. **Um material só.** Todas as superfícies saem da `Superficie` (mesma borda com gradiente, luz de 1 px, raio e
   sombra, com forças por nível). Nenhum card padrão do shadcn; nenhum card com fundo diferente na mesma linha.
5. **Profundidade legível.** Fundo ambiente → casca → card → destaque → flutuante, cada camada separada por luz e
   sombra, não por linha cinza; o vidro desfoca de verdade e nunca deixa texto sobre texto.
6. **Tipografia afinada.** Par display + texto do preset, escala compacta de app, números tabulares, KPI em peso leve,
   tracking negativo só nos tamanhos grandes, rótulos de 12 px. Nenhum número truncado.
7. **Contraste medido.** Texto ≥ 4,5:1 e borda de controle ≥ 3:1 nas 4 combinações (a `/sistema` mede no navegador).
8. **Microinterações.** Pressão que afunda (0,96), card clicável que sobe 2 px com a borda acendendo, sublinhado que se
   desenha, foco visível na hora, entrada única no carregamento (nada de fade a cada rolagem), tudo parado com
   movimento reduzido.
9. **Estados desenhados.** Vazio, erro e carregando no mesmo material, curtos e calmos.
10. **Qualidade no celular.** Base de 15 px, alvos de 40 px, ilha de abas que não cobre o fim da página, nada cortado
    nem com rolagem lateral, números inteiros.

## Notas por preset (autocrítica com as lentes better-ui, apple-design e emil-design-eng)

Ver a seção "Notas" no fim deste arquivo, preenchida depois das capturas da fase.

## Verificador "um sistema só" (consistency.mjs da design-taste-frontend)

Levados em conta: button-styles, button-shape, card-family, card-layout, link-styles, nesting, heading-scale,
text-contrast/contrast, tap-size, collide, off-viewport, focus-ring, a11y-name, motion-layer e reduced-motion.

Ignorados, por serem regras de site de marketing (uma tela de app não tem hero nem seções de uma tela):

| Verificação | Por que não vale para o painel |
|---|---|
| hero-*, one-section, section-height, section-air, fold-*, one-heading, container-edges | Um painel não tem hero nem seções de altura de tela; a primeira dobra é trabalho, não apresentação |
| photo-* | O app não usa fotografia; os gráficos e o shader são a camada visual |
| copy-headline, copy-fact, copy-buttons | Regras de texto de landing (manchete com fato, verbo de venda); os rótulos do app seguem a ca-interface |
| visual-caption | Pede que nenhum gráfico tenha legenda; no app o gráfico tem `aria-label` para leitor de tela (o `figcaption` invisível foi trocado por `aria-label`) |
| moment-none, stagger, top-stagger em grade de dados | "Momento" de landing; no painel a grade de cards é medida pelo detector de alturas do `navegar.mjs` |
| page-meta, share-meta | Protótipo com `noindex`, sem compartilhamento |
| scroll-reveal no gráfico que se desenha | O desenho do gráfico ao entrar na tela é a entrada única dele (MOV da ca-interface), parado com movimento reduzido |

## Notas (fase 1, 16/11/2026)

Autocrítica sobre as capturas de `capturas/fase1/` e as rodadas do testador (`qa/`), com as lentes better-ui (raio
concêntrico, sombra para elevação, pressão 0,96, transição nomeada, hover só com ponteiro), apple-design (material,
profundidade, movimento que respeita a preferência) e emil-design-eng (entrada única, nada de mola com repique em
operação, resposta imediata em interação frequente). Escala de 0 a 10; a Noite da barbearia (6,5) é o piso.

| Critério | Noite | Vidro | Sóbrio | Aurora | Sinal |
|---|---|---|---|---|---|
| 1. Hierarquia em 3 s | 9 | 8,5 | 9 | 9 | 9 |
| 2. Ritmo 4/8 e alturas | 9 | 9 | 9 | 9 | 9 |
| 3. Acento contido | 9 | 9 | 9,5 | 9 | 8,5 |
| 4. Um material só | 9 | 9 | 9 | 9 | 9 |
| 5. Profundidade legível | 9 | 9 | 8 | 9 | 9 |
| 6. Tipografia afinada | 8,5 | 8,5 | 9 | 9 | 8,5 |
| 7. Contraste medido | 9 | 8,5 | 9 | 9 | 9 |
| 8. Microinterações | 8,5 | 9 | 8 | 8,5 | 8,5 |
| 9. Estados desenhados | 8,5 | 8,5 | 8,5 | 8,5 | 8,5 |
| 10. Celular | 8,5 | 8,5 | 8,5 | 8,5 | 8,5 |
| **Média** | **8,8** | **8,7** | **8,8** | **8,9** | **8,8** |

Onde ficou abaixo de 9 e por quê (bloqueios honestos):
- **Tipografia (Noite, Vidro, Sinal):** o peak-chart do autor desenha o título e o número dentro do canvas, na fonte que
  recebe, mas com tamanhos próprios; a legenda e o "Atualizado" saíram do canvas para 12 px, o resto segue o desenho dele.
- **Microinterações:** a entrada do peak-chart é do autor (acelerada para ~1,1 s); o arrastar e soltar do quadro e as
  paradas da folha inferior (meia e cheia) ficaram para a fase de interação.
- **Celular:** alvos de 40 px (a regra da casa); o testador pede 44 px na densidade padrão do toque. A densidade
  "campo" já dá 48 px; subir o padrão do toque para 44 px é uma decisão para o dono.
- **Profundidade no Sóbrio (8):** é contido de propósito (sem brilho, borda fraca); a separação vem do tom e do aro.
- **Vidro (hierarquia 8,5):** o cabeçalho aberto (sem caixa) sobre o papel de parede é mais leve que o banner dos
  outros presets; é o caráter do preset, mas o primeiro olhar demora um pouco mais.

## Crítica do Impeccable (modo Operate, heurísticas de Nielsen, 0 a 40)

| Tela | Noite | Vidro | Sóbrio | Aurora | Sinal |
|---|---|---|---|---|---|
| Visão geral | 32 | 31 | 32 | 32 | 32 |
| Pedidos | 33 | 32 | 33 | 33 | 33 |
| Aparência | 30 | 30 | 30 | 30 | 30 |

Principais descontos: ajuda e documentação (2 a 3 em todas: protótipo sem ajuda contextual), flexibilidade (Pedidos
ganhou filtros na URL, CSV e Ctrl K, mas não tem ações em lote nem atalhos de linha), Aparência com muitas opções por
grupo (carga cognitiva moderada: preset, tema, vidro, 5 eixos e acento). Regras do `craft-floor.md` aplicadas: a
sobrelinha acima do título saiu do banner e do Novo pedido (proibida), mola com repique trocada pela saída exponencial,
superfícies da página no seletor de texto, foco e números tabulares com o tema.

## Notas (fase 2, 16/11/2026): telas dos módulos

Crítica do Impeccable (modo Operate) num subagente, sobre capturas do build e o código, **antes** do polish. Escala de
Nielsen de 0 a 40 por tela; a rubrica de 10 critérios para o conjunto (preset Noite).

| Tela | Nielsen |
|---|---|
| Visão geral | 32 |
| Pedidos (lista) | 30 |
| Quadro de OS | 30 (pelo código) |
| Detalhe da OS | 30 |
| Agenda | 28 |
| Clientes | 29 |
| Nova OS | 32 (pelo código) |

Rubrica do conjunto: hierarquia 8,5 · ritmo 8,5 · acento 9 · material 8,5 · profundidade 9 · tipografia 8,5 · contraste 8 ·
microinterações 8,5 · estados 8,5 · celular 8. **Média 8,5.**

Aplicado depois (ver ALTERACOES, fase 2, "Passada de refinamento"): colunas da lista, ações do banner numa linha,
"Hoje" legível, ação destrutiva discreta na folha, total dos itens, selo de atraso também no cliente, moldura dupla,
textos de vazio e de desfazer. **Não reavaliado** depois do polish (a nova nota fica para a revisão do dono).
Ficou de fora, por decisão ou custo: o cabeçalho da agenda no celular ainda ocupa três faixas (segmentado, navegação
do dia, recursos); a ordem dos botões nas sheets de ação (principal antes do "Cancelar") difere da dos formulários.
(As duas foram resolvidas na rodada seguinte, abaixo.)

## Reavaliação (fase 2, depois do polish e das pendências da base, 16/11/2026)

Crítica do Impeccable (`critique`, modo Operate) num subagente de contexto limpo, sobre capturas do build em 1440 e
390 px no **Noite escuro** e no **Sóbrio claro** (`capturas/critica-base/`, fora do git) e o código. O detector do
Impeccable rodou sobre a base e os módulos: 0 achados. Já com o cabeçalho da agenda em duas faixas e a ordem dos
botões padronizada; antes dos ajustes P1/P2 listados abaixo.

| Tela | Nielsen antes do polish | Agora |
|---|---|---|
| Visão geral (Início) | 32 | 32 |
| Pedidos (lista) | 30 | 31 |
| Pedidos (quadro) | 30 | 31 |
| Agenda | 28 | 29 |
| Clientes | 29 | 29 |

Os dois presets dão a mesma nota, menos na Agenda (cada um perdia num ponto diferente: o "Hoje" no Noite, a cor dos
blocos no Sóbrio). Descontos comuns: ajuda e documentação (2 em todas, protótipo sem ajuda contextual) e flexibilidade
(lista e Clientes sem ordenar por coluna; Clientes sem lote).

Rubrica do conjunto (Noite / Sóbrio): hierarquia 9 / 9 · ritmo 8,5 / 8,5 · acento 9 / 9 · material 9 / 9 ·
profundidade 9 / 8 · tipografia 8,5 / 9 · contraste 8,5 / 8,5 · microinterações 8,5 / 8,5 · estados 8,5 / 8,5 ·
celular 8,5 / 8,5. **Média: Noite 8,7 · Sóbrio 8,65** (era 8,5, só Noite).

Nenhum P0. Aplicado depois da crítica (da base):
- **P1 · Agenda:** blocos em conflito lado a lado mostravam "Ótica Visã…" e "Conflito co…". Em meia coluna o bloco
  agora mostra o nome e um selo curto "Conflito" com ícone; o texto inteiro segue no title e no nome acessível
  (`AgendaInterativa.tsx`).
- **P2 · Agenda:** a rolagem inicial para na hora cheia antes do agora (a primeira hora e os blocos dela não ficam
  cortados); "Hoje" marcado sem o fundo cinza no tema escuro (parecia desabilitado); blocos misturados em `oklab`
  (no Sóbrio o azul saía rosado).
- **P2 · Folha de detalhe no celular:** o rodapé de ações gruda no pé da folha, como no desktop.
- **P2 · Barra superior:** o contador do sino não cobre mais o ícone no desktop.
- **P3 · Cabeçalho:** a contagem ("· 52 OS") não quebra no meio.

Ficou de fora (decisão do dono ou custo): ordenar por coluna na `TabelaDados` (pede API nova: fica para a base
depois da junção dos módulos), rótulo visível no "Novo agendamento" do celular e degradê na ponta dos chips de
recurso, alinhar o "Nova OS" do banner do Início à base dos KPIs, e o "4 de 12" da atenção do dia ao lado de
"6 OS atrasadas". A nota acima não foi refeita depois dos ajustes (a próxima leitura fica para a revisão do dono).
