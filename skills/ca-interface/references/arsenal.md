# Arsenal de componentes e templates de tela

Ponto de partida pronto para protótipos. Fica em `assets/arsenal/`:

- `starter/`: o projeto inicial do protótipo, pronto para copiar e rodar (ARS-11). É o ERP modular "Oficina Norte", só de front-end: Astro 7, React 19, shadcn aria-nova e Tailwind 4; 13 módulos em `src/modulos/<id>/`; os 5 presets nas 4 combinações; as rotas `/arsenal`, `/sistema`, `/fluxos` e `/site`; a camada de dados (`colecao`, `acao`), o relógio fixo, as permissões e a projeção de status; as peças de base (tabela, cabeçalho, folha de detalhe, quadro, agenda, estados); a barra F e os scripts `navegar`, `medir`, `lab-interativos` e `quadro`. Resumo para o agente: `starter-erp.md`. Fonte completa: `starter/docs/contratos.md` e `starter/LEIAME.md`; leia-os na hora de usar.
- `templates/<id>/index.tsx`: uma tela inteira montada em volta de cada componente. Todas estão em pt-BR, usam as cores pelas variáveis do tema, têm claro e escuro, estados de carregando e vazio, a barra de estados oculta com a tecla F, e versões para desktop e celular. O comentário no topo de cada `index.tsx` diz para que serve a tela, quando usar, quando não usar, de quais arquivos depende e o que trocar ao adaptar. `templates/_base/` reúne as partes comuns: moldura do operador, estado da tela, esqueleto, formato pt-BR e leitura das cores do tema. Os arquivos `*-ptbr.tsx` dentro de um template são cópias traduzidas do componente.
- `ui/`: os componentes na versão que compila, copiados de `components/ui/` da vitrine (ajustes em `base-projeto/ALTERACOES.md`).
- `base-projeto/`: `index.css` com o tema shadcn, os tokens `--chart-1..5`, `--sucesso` e `--aviso`, mais `utils.ts` (`cn`) e `components.json`. É o mínimo para um template rodar.
- `previas/<id>-desktop.jpg` e `-celular.jpg`: como cada template fica. Olhe antes de escolher.
- `componentes/<nome>/`: o original do autor com a demo, como referência. `componentes/README.md` traz dependências e cuidados, `componentes/ANALISE.md` explica por que cada um funciona e termina com os padrões que se repetem, e `componentes/LICENCAS.md` e `CREDITS.md` cobrem autoria e licença.

| Template (`templates/<id>`) | Tela | Base |
|---|---|---|
| `boas-vindas` | Boas-vindas e login com banner de marca em movimento e formulário em vidro | glass-fold |
| `abertura` | Abertura do app: o logo surge numa gota de vidro e cede lugar à home (tem "Pular") | liquid-glass-logo-reveal (`GlassIconReveal`) |
| `app-cliente` | Home do app do cliente com a navegação em pílula fixa embaixo | liquid-glass-navbar |
| `painel-cliente-vidro` | "Minha conta" do cliente em vidro sobre foto | adjustable-glass-dashboard |
| `visao-financeira` | Visão geral em bento com material por card (gradiente com núcleo, vidro, sólido) | padrões do finance-bento, reconstruídos em React |
| `destaque-kpi` | Visão geral do gestor com 2 KPIs-herói numa faixa escura | peak-chart |
| `resumo-do-dia` | "Como foi hoje": um número-herói que se percorre hora a hora | market-card |
| `tendencias` | Grade de tendências por unidade, com troca de período em cada card | market-snapshot |
| `relatorios` | Relatórios: troca de indicador, comparação, eventos, tabela e CSV | metric-switcher |
| `categorias` | Tabela de trabalho com resumo lateral de participação | stats-card-2 |
| `kpis-operador` | Primeira tela do dia do operador: faixa de KPIs sóbria e o que pede ação | statistics-card-7 |
| `resumo-do-mes` | Fechamento do mês com bento de destaque e conquistas | stats-bento |

O arsenal é piso, não teto: acelera o começo e traz o acabamento que se perde quando tudo é feito do zero. A personalidade do produto continua vindo da direção escolhida (PER) e das referências (REF).

## Quando usar cada um

| Situação | Template ou componente | Ponta |
|---|---|---|
| Boas-vindas, login, cadastro, banner de entrada da marca | `glass-fold` | cliente, marca |
| Abertura do app, splash, momento de marca na primeira entrada | `liquid-glass-logo-reveal` | cliente |
| Navegação principal do app do cliente no celular | `liquid-glass-navbar` | cliente (celular) |
| Painel do cliente com personalidade, em vidro sobre foto | `adjustable-glass-dashboard` | cliente |
| Visão geral rica em bento com gradientes por card | `finance-bento` | cliente, gestor |
| KPI-herói com brilho e período | `peak-chart`, `market-card` | operador (visão geral), gestor |
| Faixa de destaque com hierarquia (resumo do mês, conquistas) | `stats-bento` | gestor, cliente |
| KPIs do dia a dia, sóbrios e densos | `statistics-card-7` | operador (alta frequência) |
| Tendência compacta com troca de período | `market-snapshot` | operador, cliente |
| Relatório e análise com troca de métrica, comparação, tabela e CSV | `metric-switcher-trend-chart-demo` | operador, gestor |
| Resumo lateral com participação por categoria | `stats-card-2` | operador |

## Regras

**ARS-11 [N casa] P1 · SEMPRE: parta do starter.** Usar o starter é obrigatório em todo app criado do zero: sem stack no projeto (STK-02), o protótipo começa copiando `assets/arsenal/starter/`, o ERP modular com os dados falsos, a casca, os presets e os scripts já prontos (`starter-erp.md`). Antes de copiar, leia o `LEIAME.md` e o `docs/contratos.md` dele. Depois:
1. troque os pontos de troca (marca, negócio, papéis, projeção, relógio, preset);
2. deixe só os módulos que o produto usa: desligar um módulo é apagar a pasta dele, conferindo antes quem o tem em `depende`;
3. crie os módulos que faltam pelo contrato (ARS-13).

Não instale nem configure do zero o que o starter já traz (stack, tema, casca, rotas, camada de dados, permissões, projeção, painel de aparência, barra F, abertura, kit de movimento, scripts). Em projeto com stack próprio, o starter vira fonte de peças: o painel de aparência, a barra F, a camada de dados e os scripts entram adaptados ao stack e ao sistema do projeto (STK-06, PER-12). *Por quê:* na iteração 3, montar o stack a cada caso custou o tempo que vai para o protótipo funcional (PRO-26); desde a 0.16 o starter já é um ERP inteiro, e partir dele é mais rápido que montar telas soltas. *Verificar:* o protótipo tem `src/modulos/registro.ts` e `src/proto/dados.ts` do starter (ou uma linha na DEC diz por que não), e o relatório não registra `npm create`, `shadcn init` nem tema refeito à mão.

**ARS-12 [N casa] P1 · QUANDO (protótipo sobre o starter): use a base, não a contorne.** É obrigatório:
- **status só pela projeção**: rótulo do operador e frase do cliente saem de `src/proto/projecao.ts`, por `SeloEixo` e `FraseDoCliente`; o portal lê `paraOCliente()`, nunca o registro cru (PON-06, PON-12);
- **toda mudança pela `acao()`**, com a classe da tabela de estados: otimista (com Desfazer quando cabe) ou pessimista para o que afeta terceiro, é irreversível ou mexe em dinheiro (EST-21), com a `capacidade` conferida dentro da ação e `conferir` nos objetos compartilhados (EST-22);
- tabela pela `TabelaDados`, card pela `Superficie` ou `Card`, estados pelo `ComDados` e seus vizinhos.

String de status escrita na tela, `setState` que muda dado sem `acao()` ou ação de dinheiro otimista é achado P1. *Por quê:* a projeção e a ação são onde moram a verdade, a permissão e o conflito; contornar uma delas faz a tela mentir para uma das pontas. *Verificar:* grep de rótulos de status em `src/modulos/`; toda escrita em coleção dentro de `aplicar` de uma `acao()`; o modo de cada ação contra a tabela de estados.

**ARS-13 [N casa] P1 · QUANDO (módulo novo no starter): só na própria pasta.** Módulo novo nasce em `src/modulos/<id>/` com `modulo.ts`, `dados.ts`, `telas/` e `paginas/`, como na seção 2 do `contratos.md`. Ele importa a base e as coleções e ações exportadas por outros módulos, mas **não edita arquivo de ninguém**: nem `registro.ts`, nem `src/pages`, nem a base, nem o `dados.ts` de outro módulo. A única exceção é uma linha na `MATRIZ` de `permissoes.ts` para capacidade nova. Faltou algo na base: comentário `// BASE:` no `modulo.ts` e peça local na pasta; a base absorve depois, em commit próprio. *Por quê:* é o que deixa vários agentes construírem módulos em paralelo e ligar ou desligar um módulo sem quebrar os outros. *Verificar:* o diff do módulo só toca `src/modulos/<id>/` (e a linha da `MATRIZ`); as lacunas aparecem como `// BASE:`.

**ARS-01 [N casa] P1 · SEMPRE: cada tela-chave usa o arsenal ou o 21st, de verdade.** Nos modos que criam tela, depois das referências e antes do protótipo, veja que template ou componente cobre cada tela-chave, mesmo que só em parte. É obrigatório:
1. Cada tela-chave **importa pelo menos 1 componente ou template do arsenal** (`templates/`, `ui/` ou os componentes do 21st já instalados no starter), de verdade no código e adaptado por ARS-02 a ARS-06.
2. Se nenhum serve, **busque nos registros instaláveis**: o 21st.dev e o React Bits (componentes animados de texto, fundo e interação). Use o MCP do shadcn quando estiver conectado (`npx shadcn@latest mcp`, que busca e instala de qualquer registro do `components.json`), o MCP do 21st se estiver conectado, ou o site. Instale com `npx shadcn@latest add @react-bits/<nome>` ou `npx shadcn@latest add "https://21st.dev/r/<autor>/<componente>"`; o starter já traz o registro `@react-bits` no `components.json`. Use-o adaptado (STK-23, licença por ARS-08) e escreva na rodada uma **"Proposta de adição ao arsenal"**: nome, link, por que serve e onde entra.
3. Só se nenhum registro tiver nada, a legenda da rodada diz em uma linha o que foi buscado e por que nada serviu.

Criar a tela-chave do zero sem tentar o arsenal e o 21st é achado P1. *Por quê:* até a 0.14 a regra só mandava consultar, e o arsenal ficava de fora de telas que ele cobria. *Verificar:* `import` de um componente do arsenal ou do 21st no arquivo de cada tela-chave; a proposta de adição quando veio do 21st; ou a linha da busca sem resultado.

**ARS-02 [N casa] P1: adapte, não cole.** Ao partir de um template:
- troque textos, dados, ícones e logo pelos do produto;
- passe as cores para os tokens da direção escolhida (TOK, PER);
- conecte a moldura (NAV) e os estados reais (EST).

A demo do autor nunca vai como tela.

**ARS-03 [N casa] P1: o papel decide o componente, não o efeito.** Componente com brilho, WebGL ou animação contínua entra onde a tela é rara ou de marca: entrada, splash, KPI-herói, momento-assinatura (EXP). Em tela de uso intenso, prefira o par sóbrio (`statistics-card-7`, `metric-switcher`) ou reduza a intensidade (MOV-01).

**ARS-04 [N] P1: idioma e formato pt-BR.** Vários componentes trazem textos em inglês e formatam em `en-US`. Antes de mostrar, troque para moeda R$, separadores brasileiros, datas `dd/mm` e textos em português (TXT). Use a prop de formatação quando o componente tiver uma; quando não tiver, ajuste o `toLocaleString`.

**ARS-05 [N] P1: acessibilidade continua valendo.** Componente bonito pode chegar sem rótulo, com foco invisível ou com movimento que não para. Antes da aprovação, confira:
- foco, `aria-label` traduzido e teclado;
- movimento reduzido;
- contraste do texto sobre gradiente ou foto (TOK-37).

O `componentes/README.md` lista os problemas já conhecidos de cada um.

**ARS-06 [N casa] P2: tokens fixos viram token.** Cor hexadecimal fixa no código, `hsl(var(--primary))` num tema em oklch e cor de status do Tailwind (`green-500`) passam para as variáveis do tema. Assim, trocar a marca troca o template inteiro.

**ARS-07 [P] P2: desempenho de canvas e WebGL.** Os componentes de shader e canvas já pausam fora da tela. Mesmo assim:
- no máximo um efeito WebGL contínuo por tela;
- nada de WebGL atrás de tabela ou formulário;
- teste no celular antes de aprovar.

**ARS-08 [N] P1: licença antes de publicar.** Usar nos protótipos e no projeto da pessoa é livre. Para publicar o componente ou um derivado em repositório público, ou para vender, confira o `LICENCAS.md`. Sem licença declarada, peça autorização ao autor ou reconstrua o padrão sem copiar o código.

**ARS-09 [N casa] P2: componentes fornecidos pela pessoa entram no arsenal do projeto.** Se a pessoa enviar componentes, por exemplo do 21st.dev:
1. salve cada um sem alteração numa pasta de referência do projeto;
2. registre o que é, as dependências e os cuidados de cada um;
3. use-os onde têm papel, adaptados pelas regras ARS-02 a ARS-06;
4. registre os que não couberam e o motivo.

**ARS-10 [N casa] P3: o arsenal cresce com o que for aprovado.** Uma tela aprovada que resolveu bem um caso novo pode virar template. Ela entra na mesma estrutura: `index.tsx` com o comentário de uso, pt-BR, tokens, estados e os controles ocultos com F.

## Instalação rápida de um template

Sem projeto, não há o que instalar: copie o starter (ARS-11), que já traz a estrutura abaixo. Estes passos são para pôr um template num projeto que já existe.

1. Confira se o projeto tem a estrutura shadcn: `components.json`, `@/lib/utils` com `cn`, alias `@/` e Tailwind v4. Se não tiver, rode `npx shadcn@latest init`. Depois, junte ao CSS global os tokens de `base-projeto/index.css` que faltarem (`--chart-N`, `--sucesso`, `--aviso`).
2. Copie de `ui/` para `components/ui/` os componentes de que o template depende (veja o comentário do topo). Copie também `templates/_base/` e a pasta do template para dentro do protótipo.
3. Instale as dependências do componente, listadas em `componentes/README.md`: `gsap`, `@gsap/react`, `framer-motion`, `lucide-react`, `class-variance-authority`, `radix-ui`. A instalação dentro do projeto é livre (STK-23).
4. Em Astro, monte a tela como ilha React: uma ilha `client:load` por página (a tela), `client:visible` para efeito abaixo da dobra e `client:idle` para a moldura (STK-29).
