# Verificação

Este arquivo é dono de como se prova que uma tela, um fluxo ou uma mudança está certo: severidade P0–P3, gatilhos, níveis de evidência, vereditos, rodadas, formato de achado, dados de pior caso, verificação estática, verificação no navegador e revisão de mudança. Não cobre as regras de cada domínio (cada referência é dona das suas), os limiares numéricos (`fundamentos-e-tokens.md`), a bancada como ferramenta de construção (`estados-e-ui-otimista.md` e `prototipo-e-aprovacao.md`) nem o modelo do relatório (`assets/modelo-relatorio.md`).

Princípio: evidência, não gosto. Densidade, raio ou voz de que se discorda não é achado. O que não rodou não vira aprovado. Falta é achado tanto quanto excesso: a tela fria (plana, sem moldura, sem resposta, sem transição, sem reconhecimento) e o enfeite sem papel saem os dois no relatório (EXP-01, seção 15).

## Sumário

1. Severidade P0–P3
2. Gatilhos que forçam piso
3. Níveis de evidência
4. Vereditos
5. Rodadas de correção
6. Formato de achado
7. Dados de pior caso pt-BR
8. Verificação estática (lista A)
9. Verificação no navegador (lista B)
10. Riscos da verificação automatizada
11. Revisão de mudança
12. QA de uso
13. Verificador do projeto no loop
14. Prova do projeto antes do veredito de build
15. Falta e excesso
15A. Corte, sobreposição e presença
16. Antes de terminar
17. Fontes

## 1. Severidade P0–P3

| Prioridade | Critério | Exemplo |
| --- | --- | --- |
| P0 crítica | Risco demonstrado de perda de trabalho, ação no alvo errado ou decisão relevante sobre informação incorreta | Lote afeta registros fora do escopo; KPI usa período diferente do exibido; venda duplicada |
| P1 alta | Impede tarefa essencial num cenário suportado ou cria erro operacional provável | "Salvar" encoberto no celular; fluxo essencial impossível pelo teclado |
| P2 média | Aumenta esforço, ambiguidade ou inconsistência de forma relevante, com alternativa viável | Filtros ativos pouco claros; Voltar perde a ordenação |
| P3 baixa | Acabamento ou melhoria localizada | Espaçamento inconsistente; ícone desalinhado |

- **VER-01** · [PR] · processo. Classifique pelo impacto observado na tarefa, frequência e abrangência, não pelo tipo de componente. A prioridade de cada regra é piso: suba pelo impacto; desça só com exceção registrada. Regra só [PR] não passa de P2 sozinha, com uma exceção: o piso pode ser P1 ou P0 quando a prioridade vem do critério de dano da tabela acima (dado ou número errado, perda de trabalho, ação no alvo errado), e o porquê da regra diz isso (ex.: IND-17, EST-28, EST-33). Preferência estética nunca vira prioridade alta.

## 2. Gatilhos que forçam piso

- **VER-02** · [N]/[PR] · P1 (P0 com risco demonstrado de dado ou alvo errado). Estes sintomas recebem P1 no ato, sem rebaixar porque a superfície é menor:
  - controle sem nome acessível;
  - controle focável sem foco visível;
  - caminho só por ponteiro;
  - movimento ignorando `prefers-reduced-motion`;
  - corte, sobreposição ou controle inalcançável na largura mínima ou com zoom de 200%;
  - contraste renderizado reprovado em texto ou controle;
  - estado comunicado só por cor ou só por movimento;
  - ação destrutiva sem confirmação nem Desfazer;
  - truncado sem acesso ao valor completo; conteúdo oculto sem pista;
  - erro sem caminho de recuperação;
  - cor semântica invertida (vermelho de perigo em ação não destrutiva);
  - KPI sem período ou unidade; filtro ativo invisível; lote sem escopo declarado;
  - vazio exibido antes da resposta;
  - protótipo sem folha do sistema em claro e escuro (PRO-23); tela de app sem biblioteca de ícones onde a tarefa os pede (STK-13);
  - texto sobre foto, vídeo ou gradiente sem contraste medido no pior ponto (TOK-37);
  - protótipo ou build que quebra servido numa subpasta (`base`, STK-25); app de várias telas sem moldura (EXP-36).
  Gatilhos vêm antes de tudo no relatório. O teto de achados nunca corta um gatilho.

## 3. Níveis de evidência

- **VER-03** · [PR] · processo. Todo achado tem dois eixos. O selo ([N], [P], [DS], [PR]) diz a força da regra. O nível diz a força da observação:

| Nível | Significa | Exemplo |
| --- | --- | --- |
| Executado | Rodou e mediu | Clique → primeira mutação de DOM em 64 ms, aba visível |
| Código | Lido no código servido | `disabled={isPending}` em `Botao.tsx:42` |
| Imagem | Visto em captura ou vídeo | Captura 390×844 do estado `erro-carga` |
| Hipótese | Inferido, falta confirmar | "Provável salto de layout ao chegar a lista" |

- **VER-04** · [PR] · processo. Afirmação visual exige render; afirmação de código exige código. Revisão só por imagem fecha com a lista do que a imagem escondeu: hover, foco, ativo, desabilitado, carregando, vazio, erro, movimento, outras larguras, teclado, outro tema. Não informe px a partir de screenshot sem escala declarada; cor e contraste são exatos, tamanho só como razão.
- **VER-05** · [PR] · processo. Emulação em Chromium headless nunca é "dispositivo real". Toque, teclado virtual do iOS, Safari, leitor de tela e INP de campo ficam como "precisa de dispositivo" até alguém medir.

## 4. Vereditos

- **VER-06** · [PR] · processo. O relatório termina com uma linha canônica:

| Linha final | Quando |
| --- | --- |
| `REVISAO: APROVADO-NO-ESCOPO` | Nenhum P0/P1 aberto; toda checagem essencial rodou; P2/P3 listados e justificados |
| `REVISAO: REQUER-CORRECOES n` | Algum P0/P1 aberto, ou rodadas esgotadas com pendência |
| `REVISAO: EVIDENCIA-INSUFICIENTE (motivo)` | Checagem quebrou, rota ou viewport não percorrida, medida parcial, tempo medido com aba em segundo plano, domínio essencial não revisado |
| `REVISAO: EVIDENCIA-INSUFICIENTE (setup: motivo)` | Alvo errado, URL fora de host local ou staging nomeado, redirecionou para login, só a casca do framework carregou |
| `REVISAO: ENCERRADA-PELO-USUARIO ("palavras")` | O usuário encerrou com pendências; as palavras dele vão para o relatório |

- **VER-07** · [PR] · processo. Não verificado nunca vira aprovado. Checagem pulada aparece como "não verificado", nunca como passou. Largura não percorrida torna a rodada incompleta. Probe que expirou vira "parcialmente medido" e não reprova nem aprova. Encerrar como usuário é só com as palavras dele, nunca por julgamento próprio.
- **VER-08** · [PR] · processo. Cobertura por domínio é obrigatória: `Domínio | Evidência inspecionada | Sem achados / N achados / Não revisado: motivo`. Um domínio só fica "sem achados" se a referência dele foi lida na sessão. Domínio não carregado é "Não revisado", nunca recriado de memória.

## 5. Rodadas de correção

- **VER-09** · [PR] · processo. No modo com implementação, no máximo 3 rodadas de correção. Rodar de novo sem mudar código nem exceções reaproveita o resultado e não conta rodada (impressão digital do alvo). Esgotadas as rodadas, pare e reporte as pendências. *Porquê:* evita o laço de "corrigir até o checker calar".
- **VER-10** · [PR] · processo. Modo rápido (2 viewports, uma carga, sem medidas caras) entre rodadas; completo só no fechamento. O rápido nunca fecha a revisão.
- **VER-11** · [PR] · processo. Tente rejeitar a própria mudança: remova a mudança e rode o teste novo; se ainda passa, não prova nada. Componente compartilhado conferido numa página só conta como não conferido. Percorra recarregar, voltar, avançar e deep link.

## 6. Formato de achado

- **VER-12** · [PR] · processo. Cada achado tem: `ID | P | Domínio | Status (só em mudança) | Local e cenário (arquivo:linha ou rota, viewport, estado) | Antes | Depois | Por quê e impacto | Aceite | Selo · nível`. Evidência de navegador leva seletor, medida, limiar e recorte com o elemento marcado.
- **VER-13** · [PR] · processo. Uma causa raiz é uma linha, com todos os locais. Quando a causa é token ou guideline compartilhado, o achado vai contra a fonte e os componentes viram locais. Até 15 achados, sem preencher até o teto. Sem achados, a frase é "Nenhum achado acionável no escopo verificado."
- **VER-14** · [PR] · processo. Proponha a correção mais barata que funciona: apagar, usar a plataforma, reusar o que o projeto tem, corrigir o valor, adicionar. Se o código revisado acrescenta algo que apagar resolveria, isso é achado e a correção é apagar.
- **VER-15** · [PR] · processo. Feche com "O que resistiu" e "Decisões para você" (truncar ou quebrar, paginar ou virtualizar, o que um campo vazio mostra).

## 7. Dados de pior caso pt-BR

- **VER-16** · [PR] · P2 (P1 se uma ação some ou um valor sai errado). Antes de declarar pronto, injete o pior caso em lista, detalhe, KPI e formulário. Escolha os eixos pelo que o componente renderiza e declare em uma linha os eixos descartados. Use os limites reais do schema (Zod, migração, `maxLength`); "nenhum limite encontrado" é achado. CPF e CNPJ gerados válidos de teste, nunca reais; domínios `.example` ou `.test`.

| Eixo | Valores |
| --- | --- |
| Nomes | `Maria das Graças Albuquerque de Sant'Anna Vasconcelos`; `João Pedro Gonçalves Júnior` (iniciais JG); `Zé`; nome ausente, só e-mail; homônimos |
| Empresas | Razão social `Companhia Brasileira de Distribuição e Comércio de Produtos Alimentícios Ltda.`; fantasia ausente; razão e fantasia iguais |
| Documentos | CNPJ `12.345.678/0001-95` e cru `12345678000195`; CPF `123.456.789-09`; processo CNJ `0001234-56.2026.8.26.0100` (não quebra no meio); CNPJ alfanumérico só depois de confirmar vigência e máscara |
| Contato | `(11) 91234-5678`, `(11) 3456-7890`, com `+55`; CEP `01310-100`; e-mail `financeiro.contasapagar@distribuidora-sao-joao-batista.example.com.br` |
| Códigos e arquivos | Nota `2026/000457`; UUID; `Contrato_Social_Alteração_7ª_FINAL_assinado (1).pdf` (truncar no meio) |
| Dinheiro | `R$ 9.999.999,99` em coluna de total; `R$ 0,00` × ausente `—`; negativo `-R$ 1.234,56` × `(R$ 1.234,56)`; `142%`, `-3,2%` |
| Números | `0`, `1`, `1.284`, `1.000.000`; `null`, `NaN` exibidos; valor ao vivo sem `tabular-nums` |
| Plural | 0, 1 e 2 em toda contagem ("0 cliente" é o defeito pt-BR) |
| Coleções | 0, 1, tamanho da página, página + 1, 1.000 linhas, um item 10× maior que os outros |
| Status | Todos os valores do enum na mesma lista; `Aguardando aprovação do financeiro`; doze etiquetas num registro |
| Texto livre | Descrição de 2.000 caracteres; quebra de linha em campo de uma linha; `<script>` e `&amp;` literais |
| Tempo | "agora", "há 12 dias", vencimento futuro × vencido; `2026-12-31T23:30:00-03:00` (outro dia em UTC); Acre e Noronha; `01/01/1970` |
| Estados | Carregando, erro, parcial, desatualizado, sem permissão, o próprio usuário na lista, otimista pendente, falha revertida, sessão expirada |
| Contêiner | Largura mínima, coluna estreita de painel, espremido por irmão, tela muito larga, altura mínima de reflow em conteúdo com rolagem horizontal (`fundamentos-e-tokens.md`) |

- **VER-32** · [N casa] · P1 · SEMPRE. **Passada de pior caso antes de mostrar.** Na v1, na tela nova e na revisão, antes de qualquer rodada ou veredito, rode a passada de pior caso sobre a tela-chave e as listas: nome enorme, e-mail sem quebra, valor gigante, zero itens e mil itens, mais os eixos da tabela acima que a tela renderiza. A skill `break-ui`, obrigatória, é a lente desta passada, num subagente de contexto limpo que devolve só os achados (`lentes-e-ferramentas.md`); se a pessoa mandar seguir sem ela, esta seção, LIS-28 e VER-33 são o critério. **Qualquer quebra é achado P1**: coluna que muda de largura, linha que dobra, texto que vaza ou corta sem reticências, ação que some ou é empurrada, número cortado. *Por quê:* na iteração 3, colunas cortaram em 1366 px e um botão principal saiu truncado; o pior caso só aparece quando é injetado. *Verificar:* o relatório da passada lista os eixos usados, o antes e depois de cada quebra corrigida e nenhuma quebra aberta.

## 8. Verificação estática (lista A)

Roda em segundos, sem navegador, e conta como evidência de código. Os limiares vêm de `fundamentos-e-tokens.md`.

| # | Checagem | Regra dona |
| --- | --- | --- |
| A1 | `transition: all`; animação de propriedade de layout; `ease-in` na entrada; `scale(0)` | `movimento.md` |
| A2 | `:hover` fora de `@media (hover: hover)`; `100vh` no shell; input pequeno em ponteiro grosso | `dispositivos-e-entrada.md` |
| A3 | `user-scalable=no`, `maximum-scale=1`; `outline: none` sem substituto; `tabindex` > 0 | `acessibilidade.md` |
| A4 | Dois `<Toaster`; erro só em toast; `disabled={isPending}` em envio | `estados-e-ui-otimista.md` |
| A5 | Lint de microtexto pt-BR | `microtexto-ptbr.md` |
| A6 | Literal de cor em componente; primitivo em componente; valor arbitrário | `governanca.md` |
| A7 | `line-height` em px; `letter-spacing` em px; contagem de tamanhos distintos | `fundamentos-e-tokens.md` |
| A8 | `className`/`style` livres em tela; primitivo fora da biblioteca; segundo set de ícones; SVG com `fill="#…"` | `governanca.md` |
| A9 | `<tr onClick` sem link; `aria-label` em `div` genérica; `role="menu"` em navegação; `title` junto de `aria-label` | `acessibilidade.md`, `listagens-e-filtros.md` |
| A10 | `bounce`, `stiffness` ou `damping` literais fora dos tokens de mola; `bounce` ≠ 0 em `spring-rapida` ou em press, toggle, check e aba; `back.out`/`elastic` em modal ou painel grande; duração global zerada com `!important`; `opacity: 0` inicial em contêiner de conteúdo | `movimento.md` (MOV-24), `fundamentos-e-tokens.md` (TOK-39), `estados-e-ui-otimista.md` |
| A11 | `user-select: none` em contêiner de dado | `dispositivos-e-entrada.md` |
| A12 | `toFixed(2)` exibido; `"R$ " +`; plural sem `=0`; data sem localidade | `microtexto-ptbr.md` |
| A13 | Métricas de deriva, em JSON para tendência | `governanca.md` |
| A14 | Sem pacote de ícones no `package.json` nem nos imports; navegação, ações por linha ou status sem ícone. P1 | `stack-e-bibliotecas.md` (STK-13) |
| A15 | Emoji como ícone: grep por caracteres de emoji em JSX, HTML e rótulos de status e de navegação. P2; P1 quando o emoji é o único portador do sentido | `stack-e-bibliotecas.md` (STK-14) |
| A16 | Status como texto solto, sem selo com cor semântica e ícone. P2; P1 quando o estado é comunicado só por cor (ACE-22) | `stack-e-bibliotecas.md` (STK-17), `listagens-e-filtros.md` (LIS-05) |
| A17 | Um tom de cinza só: superfície, borda e texto sem degraus de neutro por papel (bloco 1 de `assets/modelo-folha-do-sistema.md`). P2 [PR] | `fundamentos-e-tokens.md` (TOK-04) |
| A18 | Componente artesanal onde a biblioteca adotada tem um: `div onClick` como menu, diálogo, abas ou combobox; toast, tabela ordenável ou máscara à mão. P2; P1 quando perde acessibilidade que a biblioteca daria | `stack-e-bibliotecas.md` (STK-06) |
| A19 | Protótipo sem a rota ou a seção da folha do sistema, ou com a folha só no claro. P1 | `prototipo-e-aprovacao.md` (PRO-23) |
| A20 | `href="/`, `src="/`, `fetch("/` e `url(/` com barra fixa em `src/` de projeto com `base` configurável. P1 | `stack-e-bibliotecas.md` (STK-25) |
| A21 | Layout Astro sem `<ClientRouter />` ou transição equivalente; shell e ilhas com estado sem `transition:persist`; tema não reaplicado em `astro:after-swap`. P2 | `stack-e-bibliotecas.md` (STK-26), `movimento.md` (MOV-26) |
| A22 | Fonte sem licença registrada na DEC, carregada de CDN em vez de hospedada no projeto, ou sem os acentos do português nos pesos usados. Licença P1; acento P2 | `fundamentos-e-tokens.md` (TOK-33) |
| A23 | Gradiente com cor literal ou sem papel nomeado; `box-shadow` literal fora dos níveis `elevation-*`. P3 | `fundamentos-e-tokens.md` (TOK-34, TOK-36) |
| A24 | `animation: … infinite` em pulso ou enfeite sem parada em ~5 s nem controle de pausa; pulso fora dos tokens de TOK-40. P2 (WCAG 2.2.2) | `movimento.md` (MOV-31), `fundamentos-e-tokens.md` (TOK-40) |
| A25 | `navigator.vibrate` sem sinal visual junto ou disparado a cada toque e tecla. P2 como único sinal; P3 a cada toque | `fundamentos-e-tokens.md` (TOK-41) |
| A26 | `data-prototipo-controle` ou o atalho F na rota real; barra de controle do protótipo visível por padrão. P2 | `prototipo-e-aprovacao.md` (PRO-24) |

## 9. Verificação no navegador (lista B)

Roda em minutos, em Chromium via CDP, e conta como "executado em Chromium headless emulado". Matriz mínima: largura mínima de reflow, celular retrato com toque, celular paisagem, tablet com toque, desktop comum e a altura mínima de reflow só para conteúdo com rolagem horizontal (dimensões em `fundamentos-e-tokens.md`). Roda por rota declarada e por estado da bancada.

| # | Checagem | Regra dona |
| --- | --- | --- |
| B1 | Overflow na largura mínima, no documento e nos contêineres roláveis do shell | `acessibilidade.md` (1.4.10) |
| B2 | Alvos de toque em ponteiro grosso, agrupados por assinatura | `acessibilidade.md` (2.5.8) |
| B3 | Contraste com cor e fundo computados, conferido por pixels | `acessibilidade.md` |
| B4 | Foco visível e não encoberto, com Tab por roteiro de tarefa e releitura temporizada | `acessibilidade.md` |
| B5 | Nome, `aria-expanded`, `aria-current` e `<title>` mudando entre rotas | `acessibilidade.md`, `navegacao-e-estrutura.md` |
| B6 | CLS na carga e depois de filtrar | `fundamentos-e-tokens.md` |
| B7 | Clique → feedback em ações seguras: primeira mutação de DOM e Event Timing | `estados-e-ui-otimista.md` |
| B8 | Animação de propriedade de layout durante a interação | `movimento.md` |
| B9 | Ação revelada só no hover | `listagens-e-filtros.md` |
| B10 | Movimento reduzido: algo ainda se move, isentando indicadores de espera | `movimento.md` |
| B11 | Exceções de script e respostas ≥ 400 em rota essencial | este arquivo |
| B12 | Pior caso pt-BR injetado; repetir B1 e corte de texto | seção 7 |
| B13 | Captura por rota × estado × viewport, depois de estabilizar; escuro e reduzido | `governanca.md` |
| B14 | Foco depois de ação que remove o gatilho não cai no `body` | `estados-e-ui-otimista.md` |
| B15 | Com dialog aberto, o toast está no top layer; Esc fecha só o topo | `estados-e-ui-otimista.md`, `formularios-e-camadas.md` |
| B16 | Abrir e fechar camada, `history.back()` não reabre; filtro, período e ordenação sobrevivem ao recarregar | `navegacao-e-estrutura.md` |
| B17 | A mesma grandeza com o mesmo valor e formato em lista, detalhe, KPI e badge | `indicadores-e-graficos.md` |
| B18 | Folha do sistema e cada tela abertas também no tema escuro: captura, contraste (B3) e degraus de superfície distinguíveis | `prototipo-e-aprovacao.md` (PRO-23), `fundamentos-e-tokens.md` |
| B19 | Em Astro, cada controle de ilha React responde ao clique (mutação de DOM); componente sem `client:*` que não faz nada é achado | `stack-e-bibliotecas.md` (STK-19) |
| B20 | Emoji no texto renderizado de controles, selos e navegação, conferindo o grep de A15 | `stack-e-bibliotecas.md` (STK-14) |
| B21 | Planos de cada tela principal: nomear fundo, superfície e algo à frente na captura; tela com um plano só é "tela plana" | `experiencia-premium.md` (EXP-46), `fundamentos-e-tokens.md` (TOK-34) |
| B22 | Moldura: percorrer o checklist de EXP-36 (sidebar que recolhe e lembra, barra superior global, barra de ferramentas, cabeçalho e coluna fixos, etapas, uma ação principal) | `experiencia-premium.md` (EXP-36) |
| B23 | Navegar por todas as rotas gravando: nenhuma troca com corte seco; shell e tema não piscam | `movimento.md` (MOV-26), `stack-e-bibliotecas.md` (STK-26) |
| B24 | Acionar cada controle com mouse, toque e teclado: cada um dá resposta visível em ≤ 100 ms | `movimento.md` (MOV-25), `experiencia-premium.md` (EXP-41) |
| B25 | Último passo de cada fluxo do MVP: o que a pessoa vê ao concluir | `movimento.md` (MOV-30), `experiencia-premium.md` (EXP-18) |
| B26 | Ação-chave: tocar no meio, Esc e qualquer tecla pulam para o estado final; repetir com movimento reduzido e CPU lenta | `movimento.md` (MOV-33) |
| B27 | Pulsos: cada um num estado que acontece agora, um por região, parando em ~5 s ou com pausa | `movimento.md` (MOV-31), `experiencia-premium.md` (EXP-16) |
| B28 | Texto sobre foto, vídeo ou gradiente: par texto × pior pixel, nos dois modos e nas larguras de inspeção | `fundamentos-e-tokens.md` (TOK-37) |
| B29 | Build com `base` de subpasta (`astro build && astro preview`): todas as rotas, imagens, fontes e fixtures abrem | `stack-e-bibliotecas.md` (STK-25) |
| B30 | Protótipo abre sem nenhum controle de protótipo; F mostra e esconde a barra; `?controles=1` abre com ela | `prototipo-e-aprovacao.md` (PRO-24) |
| B31 | Kit de movimento: transição de tela, controle com mola ou líquido, número que rola, gráfico que se desenha, texto de destaque com entrada, cards escalonados e estado ao vivo que pulsa, cada um apontado por rota e elemento; repetir com movimento reduzido | `movimento.md` (MOV-35) |
| B32 | Corte e sobreposição em 1280×800, 1366×768 e 1440×900 e no celular: texto de ação truncado, coluna cortada, elemento fixo cobrindo conteúdo, na página inteira e rolada até o fim | este arquivo (VER-33) |
| B33 | Sobre o build, `scripts/navegar.mjs` do starter percorre todas as rotas e cliques e sai limpo; com quadro ou agenda, `lab-interativos.mjs` também | `prototipo-e-aprovacao.md` (PRO-26) |
| B34 | Composição em 1440×900: grade de 12 colunas com cards de tamanhos diferentes, altura ≤ 2.250 px, nada de rolagem interna, o que decide o dia acima da dobra; topo da área de trabalho em tela de operação | `navegacao-e-estrutura.md` (NAV-40, NAV-41) |
| B35 | `npm run build` e `scripts/medir.mjs`: troca ≤ 300 ms e início interativo ≤ 1,5 s; nada medido no dev server | este arquivo (VER-36) |

Ficam fora do mínimo, como "precisa de dispositivo": zoom real de 200%, teclado virtual do iOS, Safari, Firefox, Samsung Internet, INP de campo, leitor de tela e toque real.

## 10. Riscos da verificação automatizada

- **VER-17** · [PR] · processo. Login: se a rota redireciona para login, a resposta é `EVIDENCIA-INSUFICIENTE (setup: login)`, nunca aprovado. Use o arquivo de estado de sessão do setup de e2e do projeto, com conta de teste do seed. Restrinja a host local (`localhost`, `127.0.0.1`, `[::1]`, `*.localhost`, `*.test`) ou a staging nomeado pelo usuário. Nunca use o perfil real do navegador nem senha real.
- **VER-18** · [PR] · processo. Rolagem interna: num shell com `main { overflow: auto }`, `document.scrollingElement` só vê a primeira tela. Descubra o contêiner rolável principal e percorra dentro dele em B1, B4, B12 e B13.
- **VER-19** · [PR] · processo. Mutação: só ações seguras numa lista explícita (abrir, filtrar, ordenar, paginar, fechar). Salvar, excluir e enviar só com back-end simulado (MSW na bancada).
- **VER-20** · [PR] · processo. Dados vivos e máquina compartilhada: congele o relógio e use fixtures. Meça quadros e tempos só com a aba visível (`document.visibilityState` e rAF estável antes da medida); senão a medida vira "parcialmente medido". Clique → mutação de DOM é a métrica robusta. Imprima o contexto: mediana de N, dispersão, carga do host, CPU, DPR, motor e versão. Com host acima de metade da CPU, FAIL de tempo cai para WARN.
- **VER-21** · [PR] · processo. Windows:
  - procure Chrome em Program Files, x86 e `LOCALAPPDATA`, Edge nos dois e `CHROME_PATH`;
  - `spawn` com array de argumentos, sem shell, por causa de caminhos com espaço; `windowsHide: true`;
  - encerre com `taskkill /pid N /T /F` e um watchdog que mate só os próprios processos;
  - apague o perfil temporário com várias tentativas espaçadas (antivírus e perfil travado);
  - portas só em loopback; hook em `sh` exige Git Bash, então prefira o gate manual.

## 11. Revisão de mudança

- **VER-22** · [PR] · processo. Classifique cada achado por causa: `Introduzido`, `Regressão` ou `Pré-existente` (no máximo 3 pré-existentes, rotulados "não é desta mudança"). O veredito considera só Introduzido e Regressão. Confirme com `git blame` no intervalo.
- **VER-23** · [PR] · processo. Resolva o escopo sem adivinhar: diff de branch com três pontos contra o merge-base; some arquivos não rastreados (`git ls-files --others --exclude-standard`); base do PR por `gh pr view --json baseRefName`; detecte rebase ou merge em andamento; exclua lockfiles, snapshots e gerados conferindo a contagem. Sem mudança detectável, pergunte. Nunca `checkout`, `switch` nem `stash` na árvore do usuário; render só em worktree isolado.
- **VER-24** · [PR] · processo. Leia o lado removido do diff contra os sinais: `aria-*`, `role=`, `<label`, `scope`, `aria-sort`, `aria-busy`, `role="status"`, `placeholderData`, parâmetros de URL de filtro e página, `tabular-nums`, `Intl`, `min-width: 0`, `scroll-padding`, confirmação e Desfazer, `@media (hover: hover)`, `prefers-reduced-motion`. Substituição equivalente zera o sinal (literal trocado por token de mesmo valor, `role="button"` que virou `<button>`).
- **VER-25** · [PR] · processo. Procure mudança incompleta: variante sem todos os estados, componente novo sem vazio, carregando, erro e largura estreita, filtro novo fora da URL, KPI novo sem período nem unidade, ação por linha sem caminho sem hover, controle adicionado numa superfície e não nas irmãs. Escopo excessivo não é achado.
- **VER-26** · [PR] · processo. Raio de impacto: expanda um salto (importadores diretos), dois só para tokens, tema e primitivos; no máximo 5 consumidores, priorizando rotas de entrada. Token alterado é buscado pelo nome, não pelo arquivo. Declare quantos ficaram de fora.
- **VER-27** · [DS] · P1 quando o tamanho da mudança exigia portão. Compare o build com o protótipo aprovado (registro DEC, `prototipo-e-aprovacao.md`). Divergência sem DEC é achado com status `Diverge do aprovado`. Mudança que exigia protótipo e não teve, sem ordem do usuário para pular, recebe `Sem protótipo aprovado`.

## 12. QA de uso

Código certo pode ser sistema errado para quem usa; o segundo fluxo que pula a regra só aparece no clique.

- **VER-28** · [N casa] · processo. Toda TAR que muda uma tela tem QA de uso: **cenários com papel e objetivo**, gerados da tabela de projeção do `03` e das transições por papel do `05`, cada um com uma linha **"isto não pode ser possível"** (a regra "cancelar só até coletado" vira "o operador tenta cancelar depois de coletado" e espera a ação ausente ou recusada com o motivo). Cada INV que veta uma ação da tela vira um cenário desses, e cada proposta pendente da IA (PON-30) ganha o cenário "a proposta é aplicada sem confirmação". Quem joga é um agente com navegador que não leu o código (`ca-verificador-ui`), no ambiente local, com dados de teste; o relatório de quem construiu não vai a ele. Entrega `transacional` fecha com uma caminhada da pessoa pelos cenários principais.

Formato de cada cenário:

```
Cenário: <papel> quer <objetivo> (origem: linha da projeção ou transição do 05, INV-…)
Passos: o que a pessoa faz, na ponta e no viewport dela
Esperado: o que ela vê e o que muda nas outras pontas
Isto não pode ser possível: a ação proibida tentada, e a recusa esperada
Resultado: passou / falhou (evidência: captura, rota, estado) / não verificado: motivo
```

## 13. Verificador do projeto no loop

- **VER-29** · [N casa] · processo. Checagem visual que se repete vira **verificador do projeto**, para valer dentro do loop da entrega e não só na revisão final: `scripts/verificar-interface` para o que um script decide (overflow em 320 px, lint de tokens, axe, grep de emoji e de primitiva fora de `components/ui/`) e `.claude/skills/verificar-<tela>/` para o que precisa de olho (roteiro de capturas da folha do sistema e das telas, claro e escuro). Toda saída é impressa, com o comando que a reproduz; verificador mudo não conta como evidência. Com a `criacao-agentica`, o script entra no `Rodar:` do ESTADO.

## 14. Prova do projeto antes do veredito de build

- **VER-30** · [N casa] · P1. Antes de qualquer veredito sobre um build, rode a **prova do projeto** (com a `criacao-agentica`, o `Rodar:` do ESTADO: tokens compilados a partir do `tokens.json`, lint de tokens, baselines de regressão visual e os verificadores de VER-29) no worktree de quem construiu, e cole o resultado. Prova vermelha impede `APROVADO-NO-ESCOPO`: CA verde com prova vermelha não é pronto. Prova que não rodou dá `EVIDENCIA-INSUFICIENTE (prova do projeto não rodou)`. Baseline atualizada para passar exige o motivo e a captura do antes.

## 15. Falta e excesso

- **VER-31** · [N casa] · processo. Toda revisão e toda autoverificação de protótipo procuram os dois lados: o que falta para o app parecer vivo e o que sobra sem papel (EXP-01). Cada linha abaixo vira achado com a prioridade mínima indicada; a regra dona tem o detalhe.

**Falta**

| Achado | Prioridade mínima | Regra dona | Como ver |
| --- | --- | --- | --- |
| Tela plana, "cara de screenshot": um plano só, sem elevação nem sobreposição | P2 | TOK-34, EXP-46 | B21 |
| Moldura ausente ou incompleta em app de várias telas | P1 | EXP-36 | B22 |
| Troca de tela, aba ou etapa com corte seco ("sem transição de tela") | P2 | MOV-26, EXP-12, EXP-58 | B23 |
| Controle sem resposta visual ao ser acionado | P2 | MOV-25, EXP-41 | B24 |
| Conclusão de fluxo sem reconhecimento | P3 (P2 quando a pessoa não sabe se concluiu) | MOV-30, EXP-18 | B25 |
| Componente idêntico ao padrão da biblioteca | P2 | EXP-39 | comparar com o padrão |
| Modo criar sem momentos-assinatura, ou momentos que não rodam no protótipo | P1 | EXP-02, EXP-03 | rodada e protótipo |
| Item do checklist de presença ausente (abertura, carregamento com a marca, kit de movimento, painel de aparência, starter, arsenal) | P1 | VER-34 | tabela de presença |
| Informação do brief ou da versão anterior que sumiu na passada de vida | P1 | EXP-59 | brief × tela-chave |
| Protótipo com botão morto, fluxo que para no meio ou `navegar.mjs` com erro | P1 | PRO-26 | B33 |
| Velocidade medida no dev server, ou troca acima de 300 ms e início acima de 1,5 s no build | P1 | VER-36 | B35 |
| Visão geral do desktop em coluna única, longa ou com rolagem interna; o que decide o dia abaixo da dobra | P1 | NAV-40 | B34 |
| Banner alto em tela de operação | P1 | NAV-41 | B34 |
| Operador no celular com a versão de desktop encolhida | P1 | DIS-22 | 390×844 |
| Tabela que muda de forma com o pior caso | P1 | LIS-28, VER-32 | B12 |
| Ação-chave que só troca de tela ou fecha num toast | P2 | MOV-33, EXP-57 | executar no protótipo |
| Rodada sem a tabela da passada de vida | P2 | EXP-48, PRO-15 | rodada |
| Rodada v1 com direções que diferem só em cor, barra lateral ou banner (mesma fonte, mesmo layout, mesma densidade ou mesmo material) | P1 | PER-19 | trocar os presets na tela-chave |
| Direção sem uso de profundidade declarado | P2 | PER-20 | legenda |

**Excesso e uso sem critério**

| Achado | Prioridade mínima | Regra dona | Como ver |
| --- | --- | --- | --- |
| Clichê como momento: carimbo, confete, troféu, mascote, "sucesso" genérico | P1 no modo criar; P2 fora dele | EXP-56 | teste da troca |
| Enfeite em tarefa frequente (fila, tabela, formulário diário, navegação) | P2 | PER-16, EXP-49, MOV-32 | teste do 50º uso |
| Mais de uma celebração no mesmo fluxo | P2 | EXP-51, MOV-30 | percorrer o fluxo |
| Pulso eterno, sem parada nem pausa | P2 ([N] WCAG 2.2.2) | MOV-31, EXP-16 | B27, A24 |
| Pulso em elemento que não está vivo, ou mais de um por região | P3 | MOV-31, TOK-40 | B27 |
| Ação-chave que não dá para pular, ou que segura a próxima tarefa | P2 | MOV-33, EXP-52 | B26 |
| Gradiente sem papel ou fora dos tokens da marca | P3 | TOK-36, EXP-42 | A23 |
| Quique em controle frequente (press, toggle, check, aba) | P3 | TOK-39 | A10 |
| Vibração como único sinal, ou a cada toque | P2 / P3 | TOK-41, EXP-11 | A25 |
| Texto sobre imagem ou gradiente sem véu medido | P1 | TOK-37, EXP-47 | B28 |
| Fonte sem licença registrada; fonte sem os acentos do português | P1; P2 | TOK-33 | A22 |
| `href="/` fixo que quebra o build em subpasta | P1 | STK-25 | A20, B29 |
| Layout sem `ClientRouter` ou tema que pisca entre rotas | P2 | STK-26 | A21, B23 |

## 15A. Corte, sobreposição e presença

- **VER-33** · [N casa] · P1 · SEMPRE. **Corte e sobreposição medidos no navegador.** Antes de mostrar e na revisão, meça em 1280×800, 1366×768 e 1440×900, e no celular de referência: (1) **nenhum texto de ação truncado** (botão, item de menu, aba: `scrollWidth > clientWidth` no rótulo é achado; ação longa ganha rótulo mais curto ou quebra, nunca reticências); (2) **nenhuma coluna cortada** (a última coluna do quadro ou da tabela inteira à vista, ou com rolagem horizontal declarada e coluna identificadora fixa, LIS-06); (3) **nenhum elemento fixo cobrindo conteúdo** (barra fixa, botão flutuante, rodapé de ação: o último item da página, rolada até o fim, fica inteiro acima dele; `scroll-padding` e espaço reservado). Cada caso é achado P1. A medida é no navegador (B32), não na captura. *Por quê:* na iteração 3, a 5ª coluna do quadro do ERP cortava em 1366 px, o botão principal saiu "Avançar: Aguardando aprovação do clie…" e a barra fixa da Casa Vela cobria itens e subtotal. *Verificar:* B32, com os números medidos no relatório.

- **VER-34** · [N casa] · P1 · SEMPRE. **Checklist de presença.** No app criado do zero, a verificação confere cada linha do checklist de presença (`niveis-de-regra.md`), uma por regra SEMPRE, com a evidência pedida lá. No protótipo sobre o starter, a evidência das linhas 1 e 7 é a saída dos scripts rodados sobre o build (`navegar.mjs`, `medir.mjs` e, com quadro ou agenda, `lab-interativos.mjs`), colada no relatório. Cada item ausente é achado P1 (ou a prioridade da regra, se for maior), com o ID da regra dona; item presente sem evidência é "não verificado" (VER-07). *Por quê:* pedido do dono; o que é regra de adicionar só existe se alguém confere a presença. *Verificar:* a tabela de presença no relatório, com uma linha por item e a evidência.
- **VER-35** · [N casa] · P1 · SEMPRE — **QA de uso real com toque.** Antes de cada rodada de aprovação, alguém que não fez o trabalho (subagente) usa o protótipo como pessoas reais: dispositivos emulados com toque (descritores do Playwright: iPhone, Pixel, iPad, com `hasTouch`), `tap`, rolar e deslizar por gesto, segurar e arrastar, teclado, dados de pior caso, troca de preset, tema e vidro, movimento reduzido. No starter, use também a barra F: "Ver como" para cada papel, "Simular a outra ponta", o relógio que avança e duas abas lado a lado (operador e portal). Os cenários vêm das personas do brief (no mínimo uma por ponta; num ERP, os roteiros por persona da especificação) e cada passo relevante gera captura olhada com olho de designer. Ferramentas: skill `webapp-testing` ou o MCP do Playwright, ou `playwright-core` do starter; o arrasto com toque do quadro e da agenda já tem prova no `lab-interativos.mjs`, e o QA olha o resto. A saída é um relatório com notas por área e achados P0 a P3 com a captura que prova. *Por quê:* muito defeito e muita melhoria só aparecem usando e olhando, não no código nem no build. *Verificar:* o relatório anexado à rodada.

- **VER-36** · [N casa] · P1 · SEMPRE — **Velocidade medida no build, nunca no dev server.** Antes de cada rodada, rode `npm run build` e `node scripts/medir.mjs` (no starter; em outro stack, a medida equivalente sobre o build de produção). Metas: troca de página em até 300 ms e início interativo em até 1,5 s, mediana de 3 em 1440 px. Os números vão na rodada. Número tirado do `npm run dev` não vale como prova, nem para aprovar nem para reprovar. Meta estourada é achado P1 com a página e a medida. *Por quê:* o dev server serve os módulos sem empacotar e é mais lento por natureza; medir nele escondia a velocidade real e fazia caçar lentidão que não existe. *Verificar:* a saída do `medir.mjs` no relatório, com o comando de build antes (B35).

## 16. Antes de terminar

| Padrão detectável | Correção |
| --- | --- |
| "Aprovado" com checagem que não rodou | `EVIDENCIA-INSUFICIENTE` com o motivo (VER-07) |
| Domínio marcado "sem achados" sem a referência lida | "Não revisado: motivo" (VER-08) |
| Mesmo sintoma em várias linhas | Uma linha por causa, todos os locais (VER-13) |
| Gatilho rebaixado por superfície menor | Piso P1 (VER-02) |
| [PR] sozinho como P0 ou P1, sem dano da seção 1 | Rebaixar a P2, achar regra mais forte ou mostrar o dano (VER-01) |
| px informado a partir de screenshot | Razão, ou escala declarada (VER-04) |
| Medida de tempo com aba em segundo plano | Refazer visível ou "parcialmente medido" (VER-20) |
| Rota autenticada medida sem sessão | `setup: login` (VER-17) |
| Quarta rodada de correção | Parar e reportar (VER-09) |
| Correção que adiciona wrapper ou ARIA onde apagar resolvia | Apagar (VER-14) |
| `git checkout` ou `stash` durante revisão | Worktree isolado (VER-23) |
| Fixture "Teste 1", "Fulano" | Pior caso pt-BR da seção 7 (VER-16) |
| TAR de tela concluída sem cenários de papel nem "isto não pode ser possível" | QA de uso (VER-28) |
| Checagem visual repetida à mão a cada rodada | Verificador do projeto com saída impressa (VER-29) |
| Veredito de build com a prova do projeto vermelha ou sem rodar | Rodar a prova; vermelha é `REQUER-CORRECOES` (VER-30) |
| Protótipo só no claro; emoji em selo; ilha Astro que não responde | B18, B20, B19 |
| Revisão que só aponta excesso e deixa passar a tela fria | Os dois lados da seção 15 (VER-31) |
| Protótipo testado só na raiz do servidor | Build com `base` de subpasta (B29) |
| Pior caso não injetado antes da rodada | Passada de pior caso, com `break-ui` (VER-32) |
| Corte e sobreposição avaliados por captura | Medir no navegador em 1280, 1366 e 1440 (VER-33, B32) |
| App criado do zero sem a tabela de presença | Checklist de presença (VER-34) |

## 17. Fontes

- Briefing original do playbook (tabela P0–P3 e estados de veredito)
- W3C WCAG 2.2: [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [1.4.3 Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- web.dev: [Web Vitals](https://web.dev/articles/vitals), [INP](https://web.dev/articles/inp)
- [Chromatic review](https://www.chromatic.com/docs/review/)
- Praticantes: `design-taste-frontend` 2.5.1, `gate.mjs`, `consistency.mjs`, `perf.mjs` (lidos, não executados); `better-interface`, `interface-review`, `explain-interface`, `afk`, `break` (Jakub Krehel); `break-ui` (Emil Kowalski); demos code&chill
