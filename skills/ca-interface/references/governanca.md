# Governança e padronização

Este arquivo é dono de como o padrão se mantém quando novas telas surgem: as sete camadas de padronização, o roteiro de tela nova a partir do sistema, a auditoria de deriva, o kit compartilhado entre pontas e as exceções. Não cobre os valores dos tokens (`fundamentos-e-tokens.md`), o protocolo de revisão e o relatório (`verificacao.md`), o portão de protótipo (`prototipo-e-aprovacao.md`) nem a tabela de projeção entre pontas (`pontas-e-sistema.md`).

Princípio: um check vence uma frase. Toda regra que pode virar checagem automática vira, e a checagem leva o ID da regra.

## Sumário

1. Camada 1: fonte única de tokens
2. Camada 2: componentes como única porta
3. Camada 3: regras executáveis
4. Camada 4: bancada e regressão visual
5. Camada 5: documentação viva
6. Camada 6: contribuição, revisão e depreciação
7. Camada 7: métricas de deriva
8. Exceções com teto e motivo
9. Criar tela nova a partir do sistema
10. Auditar deriva
11. Um kit para todas as pontas
12. Antes de terminar
13. Fontes

## 1. Camada 1: fonte única de tokens

- **GOV-01** · [DS] · P2. Uma fonte única de tokens, no formato W3C Design Tokens (`tokens.json`), com os três níveis de TOK-02. Tudo o mais é gerado dela por ferramenta tipo Style Dictionary (CSS, Tailwind, plataformas nativas); arquivo gerado não se edita à mão. Em Tailwind, substitua o tema padrão em vez de estendê-lo, para que `bg-blue-600` não exista como atalho. *Porquê:* com a paleta padrão disponível, cada tela nova escolhe um azul.
- **GOV-02** · [PR] · P3. A gramática de nomes de TOK-03 vira lint: os antipadrões que ela lista (`--color-blue-button`, `--color-text-2`, token de borda usado em `color:`, `primary` como marca) falham na checagem, e token novo só entra pela revisão da fonte.
- **GOV-03** · [N]/[PR] · P2. Pares semânticos são derivados e validados no build: texto secundário, tinta sobre acento e ação sobre fundo passam pelo contraste de `fundamentos-e-tokens.md`, e o build falha quando um par não atinge. O tema escuro sai com as mesmas garantias.
- **GOV-04** · [DS] · P2. Os eixos de tema são os de TOK-04; aqui fica o processo: cada tema é um conjunto de valores gerado da mesma fonte, aplicado por script inline antes do primeiro paint, sem flash, e revisado lado a lado com o tema base. Rampa clara simplesmente invertida no escuro é achado.
- **GOV-05** · [PR] · P3. Movimento e material também são tokens: um helper único de duração com escala global, um conjunto fechado de curvas e o material por espessura com fallback sólido declarado (`movimento.md`).

## 2. Camada 2: componentes como única porta

- **GOV-06** · [PR] · P2. Telas de produto montam só com componentes do sistema, com props fechadas. Sem `className` nem `style` livres em tela de produto; sem primitivo importado direto da biblioteca de base fora do pacote de componentes. *Porquê:* a porta aberta é por onde a deriva entra; Airbnb mede adoção comparando uso de componentes do sistema com componentes feitos do zero.
- **GOV-07** · [PR] · P3. Inventário fechado de variantes por papel: um primário, um secundário, um terciário e um destrutivo; um raio por família; uma espessura de linha fina; um estilo de link. Um botão preenchido por vista.
- **GOV-08** · [PR] · P2. Receitas de tela viram componentes de página com contrato de estados: `ListPage`, `DetailPanel` com rota própria, `QueuePage` (fila + registro), `BoardPage` com os três modos de mover, `SettingsPage` com modelo de salvamento declarado. Cada um já traz carregando, vazio, erro e sem permissão (`estados-e-ui-otimista.md`).
- **GOV-09** · [PR] · P2. Serviços transversais têm uma instância cada: gerenciador de camadas com um Esc, toaster no top layer, formatadores `Intl` por grandeza, helper de duração e store com contagens derivadas. *Porquê:* dois formatadores de moeda produziram "$502" e "$501.60" para o mesmo valor num demo.
- **GOV-10** · [PR] · P3. O sistema se declara no markup: `data-theme`, `data-density`, `data-radius`, `data-screen-kind` na raiz. Checagens leem esses atributos em vez de inferir. Trocar o visual muda o CSS, nunca a marcação.
- **GOV-11** · [PR] · P3. Uma família de ícones, escolhida pela direção (`stack-e-bibliotecas.md`, STK-15), com versão e licença fixadas, em arquivos locais, cor por `currentColor`. Set descartado leva o motivo registrado.

## 3. Camada 3: regras executáveis

- **GOV-12** · [PR] · P2. Cada linha do checklist que pode ser checada nomeia a checagem que a pega. A verificação estática (lista A de `verificacao.md`) roda no CI em todo PR. O que só o olho resolve fica marcado como "para os seus olhos".
- **GOV-13** · [PR] · P2. O CI roda no mínimo:
  - stylelint: literal de cor, `line-height` em px, `transition: all`, `"tnum"` cru;
  - ESLint: `className`/`style` em telas de produto, `disabled={!isValid}`, `<tr onClick>`, segundo pacote de ícones, emoji em rótulo de componente (STK-14), import de primitiva Radix ou Base UI fora de `components/ui/` (STK-08, GOV-06);
  - lint de microtexto pt-BR (`microtexto-ptbr.md`);
  - checagem estática de acessibilidade.
- **GOV-14** · [PR] · P2. Níveis FAIL, WARN e INFO com orçamento: acima do orçamento é WARN; a partir de 2× o orçamento + 1, FAIL. Regra só [PR] nunca dá FAIL sozinha. A severidade do script não é a prioridade do achado; P0–P3 é decisão do agente pelo impacto.
- **GOV-15** · [PR] · P1. Anti-burla: nunca detectar o checker (`navigator.webdriver`, UA headless), nunca editar o checker para passar, nunca esconder o problema (`overflow: hidden` no `body` para sumir com overflow). Essas checagens não aceitam exceção. *Porquê:* o piso P1 vem da definição de dano de `verificacao.md`: esconder o problema faz o relatório aprovar o que está quebrado, e a decisão de entregar passa a se basear em informação incorreta.

## 4. Camada 4: bancada e regressão visual

- **GOV-16** · [PR] · P2. Todo componente de produto tem seus estados numa bancada ou no Storybook, com dados entrando pela fronteira (props, cache semeado, MSW) e sem editar o componente. Carregando fica parado até o seletor mudar. Cada estado tem URL (`__estado`, `__sequencia`). O seletor fica visualmente fora do design system.
- **GOV-17** · [DS] · P2. Regressão visual por (rota, estado, viewport), com tema escuro e movimento reduzido, capturada só depois de estabilizar. A captura registra o que ainda carregava. A UI aprovada no protótipo vira a linha de base.
- **GOV-18** · [PR] · P2. A fixture de pior caso pt-BR (`verificacao.md`) fica no repositório como teste de regressão.

## 5. Camada 5: documentação viva

- **GOV-19** · [PR] · P2. O projeto tem um `DESIGN.md` com dono declarado, complemento do `docs/04-ui-ux.md`, ligado pela porta de agentes de DOC-10 (o `CLAUDE.md` ou `AGENTS.md` do projeto, com "antes de mexer em interface, leia docs/04-ui-ux.md e DESIGN.md"). Conteúdo mínimo (modelo em `assets/modelo-design-md.md`):
  - tipo de cada tela, com tarefa dominante e desempate;
  - decisões que viraram regra, com o porquê e a DEC de origem;
  - cartão de voz (o glossário com sinônimos proibidos mora no `GLOSSARY.md`, DOC-09);
  - lista "não são antipadrões aqui" (tabela densa para especialista, toast de sucesso junto do estado atualizado);
  - paleta com nota de uso;
  - roteiro de tela nova (seção 9);
  - seção "Aposentado", com motivo e data.
- **GOV-20** · [PR] · P3. Decisão de design aprovada vira registro DEC com versão, quem aprovou, data, alternativas rejeitadas e status, no documento dono (DOC-08). Os IDs DEC são os mesmos da `criacao-agentica`, com ou sem ela.

## 6. Camada 6: contribuição, revisão e depreciação

- **GOV-21** · [PR] · P3. Regra de três: um componente novo nasce quando o terceiro uso aparece. Antes disso, componha com o que existe.
- **GOV-22** · [PR] · P2. Toda mudança de UI passa pelo modo "revisar mudança" de `verificacao.md`: status por achado, leitura do lado removido do diff, mudança incompleta e raio de impacto.
- **GOV-23** · [PR] · P3. Depreciação tem três peças: aviso no componente antigo, codemod que migra os usos e changelog com data. Depois da migração, o antigo vai para "Aposentado" com motivo. Ao promover uma variante, apague as outras e busque o parâmetro removido no código.
- **GOV-24** · [PR] · P3. Achado de consistência é "o mesmo detalhe feito de dois jeitos no mesmo produto". Diferença em relação a um valor de partida desta skill não é achado quando o projeto decidiu e registrou outro.
- **GOV-25** · [PR] · P3. Ao construir de um design, mapeie cada valor para o token mais próximo e liste os arredondados. Se a diferença passa de 2 px ou cai noutro degrau de cor, pergunte. Valor arbitrário (`w-[343px]`) só com exceção.

## 7. Camada 7: métricas de deriva

- **GOV-26** · [PR] · P3. Meça as métricas abaixo a cada auditoria e mostre a tendência entre execuções.

| Métrica | Como contar |
| --- | --- |
| Literais de cor fora de token | grep de hex, `rgb(`, `hsl(`, `oklch(`, classes de cor, `fill`/`stroke`, config de gráfico; fundir cores com ΔE OKLab < 0,02 |
| Tamanhos tipográficos distintos | valores computados nos nós folha |
| Raios, sombras, curvas e durações distintos | declarações; grep de `cubic-bezier`, `back.out`, `elastic` |
| Estilos de botão e de card | checagens de família |
| Famílias de ícones | imports (meta: 1) |
| Componentes avulsos | primitivos fora da biblioteca; `className` livre em tela |
| Adoção | % de telas montadas com componentes de página |
| Strings fora do catálogo e sinônimos | lint de microtexto |
| Formatação divergente | `toFixed`, `"R$ " +`, `toLocaleDateString()` sem localidade |
| Tokens por componente | contagem no nível 3 (muitos indicam papéis semânticos faltando) |
| Exceções abertas e `!important` | contagem |

- **GOV-27** · [PR] · P3. Consolidar paleta ou escala é proposta com inventário, nunca correção automática.

## 8. Exceções com teto e motivo

- **GOV-28** · [PR] · P2. Exceção é por achado, no formato `{checagem, alvo, motivo}`, com motivo de pelo menos 12 caracteres que diga por que a regra não se aplica ali. Uma exceção cobre um achado; alvo que casa vários é recusado. Teto de 5 exceções abertas por projeto; passou, corrija em vez de dispensar. Checagens de anti-burla e de norma [N] em tarefa essencial não aceitam exceção. Toda exceção sai impressa no relatório. *Porquê:* o agente pode discordar do checker, mas de forma registrada e auditável, sem dispensa em massa.
- **GOV-29** · [PR] · P3. Exceção de design (desvio consciente do sistema numa tela) entra no `DESIGN.md` com motivo e data de revisão. Desvio sem registro é deriva.

## 9. Criar tela nova a partir do sistema

1. Recon: stack, tokens, componentes de página, `DESIGN.md`, `CLAUDE.md`, `AGENTS.md`, comando de preview e viewports suportados. Nomeie o que encontrou ou diga que não há.
2. Declare na linha 1 do plano o tipo de tela (operacional, analítica, cadastro, tempo real, portal externo) e a tarefa dominante.
3. Inventarie objetos e relações, os estados exigidos (`estados-e-ui-otimista.md`) e os dados de pior caso com os limites do schema.
4. Escreva o texto antes, pelo glossário e pelo cartão de voz.
5. Planeje por região, uma linha cada: componente de página, dado, estados e o porquê de qualquer movimento.
6. Arme a verificação antes de existir tela: bancada e checagens com alvo.
7. Protótipo e aprovação (`prototipo-e-aprovacao.md`), salvo ordem explícita de pular.
8. Construa só com componentes e tokens. Valor que falta segue GOV-25. Componente que falta segue GOV-21.
9. Verifique com no máximo 3 rodadas de correção e tente rejeitar a própria mudança (`verificacao.md`).
10. Atualize os documentos afetados (DOC-12): DEC no `docs/04-ui-ux.md`, receita ou regra nova no `DESIGN.md`.

## 10. Auditar deriva

1. Leia `DESIGN.md` e a fonte de tokens. Sem fonte de tokens, o primeiro achado é esse.
2. Conte as métricas de GOV-26 e compare com a execução anterior, se houver JSON salvo.
3. Faça o inventário de paleta, escala tipográfica, raios e curvas, com contagem de usos por valor.
4. Registre achados contra a fonte quando a causa é token ou guideline compartilhado, com os componentes como locais.
5. Proponha consolidação (quais valores fundir, codemod, ordem), nunca aplique sem pedido.
6. Escreva arquivo só se o usuário quiser histórico (o JSON de métricas).

## 11. Um kit para todas as pontas

- **GOV-30** · [DS] · P2. Painel do operador, app e portal do cliente, parceiro e e-mails usam o mesmo conjunto de nomes semânticos e os mesmos componentes. O que muda é o tema por eixo: densidade compacta no operador, confortável no cliente; marca do cliente ou do parceiro (marca branca); contexto de uso (entregador ao sol pede alvos maiores e contraste alto, prática não verificada em fonte). *Porquê:* a Atlassian mantém um conjunto de tokens para todos os apps e escolhe tokens pelo significado, não pelo valor.
- **GOV-31** · [PR] · P2. Componentes de estado (badge, timeline, banner) leem o estado canônico e a tabela de projeção. O mesmo estado tem a mesma cor semântica em todas as pontas, mesmo com rótulos diferentes.
- **GOV-32** · [DS] · P2. Mesmos dados, linguagens diferentes: a tela do cliente não reaproveita a tabela do admin. O kit tem componentes de página por ponta sobre os mesmos primitivos.
- **GOV-33** · [N]/[DS] · P2. Na superfície de terceiro (checkout de lojista, portal de parceiro), a plataforma manda: use só os componentes dela e aceite a marca do dono da superfície.
- **GOV-34** · [PR] · P3. O kit é um pacote versionado com changelog; cada ponta declara a versão que usa e a auditoria de deriva compara as versões em uso.

## 12. Antes de terminar

| Padrão detectável | Correção |
| --- | --- |
| Hex, `rgb(`, `oklch(` em componente | Token semântico (TOK-02, GOV-01) |
| `bg-blue-600` ou `var(--blue-600)` em componente | Semântico; tema Tailwind substituído (GOV-01) |
| `--color-primary` como marca ao lado de `--color-text-primary` | Gramática de nomes (TOK-03, lint GOV-02) |
| `className=` ou `style=` em tela de produto | Prop fechada ou variante (GOV-06) |
| Dois `<Toaster`, dois formatadores de moeda | Uma instância (GOV-09) |
| Imports de dois pacotes de ícones | Uma família (GOV-11) |
| `w-[343px]`, valor arbitrário | Token mais próximo ou exceção (GOV-25) |
| Componente novo usado uma vez | Compor com o existente (GOV-21) |
| `navigator.webdriver` no app; checker editado | Remover; não aceita exceção (GOV-15) |
| Exceção sem motivo ou cobrindo vários achados | Uma exceção por achado, com motivo (GOV-28) |
| `AGENTS.md` sem a linha de interface, ou `CLAUDE.md` sem `@AGENTS.md` | Porta de agentes (GOV-19, DOC-10) |
| Tela do cliente usando a tabela do admin | Componente de página da ponta (GOV-32) |
| Mesmo estado com cores diferentes em duas pontas | Token de estado único (GOV-31) |

## 13. Fontes

- [W3C Design Tokens Community Group](https://www.designtokens.org/); [Style Dictionary](https://styledictionary.com/)
- [Atlassian Design tokens](https://atlassian.design/foundations/tokens/design-tokens)
- [Shopify Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions); [Checkout styling](https://shopify.dev/docs/apps/build/checkout/styling)
- [Airbnb design system at React Conf (InfoQ)](https://www.infoq.com/news/2020/02/airbnb-design-system-react-conf); [Uber Base Web](https://www.uber.com/us/en/blog/introducing-base-web/)
- [Chromatic review](https://www.chromatic.com/docs/review/); [ADR](https://adr.github.io/)
- Praticantes: `design-taste-frontend` 2.5.1 (gate, waivers, checagens nomeadas); `better-colors`, `better-interface`, `interface-review`, `state-machine`, `build-design`, `variant` (Jakub Krehel); kit code&chill (serviços transversais com uma instância)
