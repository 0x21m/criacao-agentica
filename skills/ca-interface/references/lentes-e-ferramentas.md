# Lentes e ferramentas do ambiente

Toda lente citada aqui é de instalação obrigatória (seção "Instalar" do README do plugin), e as passadas marcadas como obrigatórias abaixo **não são opcionais**: elas rodam. O navegador e os MCPs seguem opcionais. Se uma lente faltar, não siga em silêncio: diga em uma linha qual falta e o comando para instalar, e só aplique a regra própria indicada como fallback se a pessoa mandar seguir sem ela, registrando isso no relatório.

## Passadas com lentes

A ca-interface é a dona do fluxo e chama outras skills como lentes, em passadas definidas. Para não estourar tempo e tokens:

- cada lente roda num **subagente de contexto limpo** (briefing da seção "Agentes delegados" do `SKILL.md`), que recebe a URL local, a rota e o critério, e **devolve só os achados**, já na escala e nos selos desta skill; o agente principal não carrega a saída inteira da lente;
- **na v1, as lentes obrigatórias**: `break-ui`, `better-layout`, o verificador de consistência da `design-taste-frontend` e, do Impeccable, `critique` e `polish`; as demais entram por necessidade da tela;
- as outras ficam para a revisão (modo 3) ou para a v2.

| Passada | Lente | Quando | Fallback na skill |
| --- | --- | --- | --- |
| Dados de pior caso | `break-ui` | **Obrigatória**, sempre antes de mostrar: v1, tela nova e revisão | VER-32, VER-16, LIS-28, VER-33 |
| Composição e hierarquia | `better-layout` | **Obrigatória**, sempre na tela-chave: v1, tela nova e revisão | NAV-40, NAV-41, PON |
| Superfícies, ícones, sombras | `better-ui` | refinamento da v2 e revisão | TOK-34, TOK-42, EXP-39 a EXP-46 |
| Tipografia | `better-typography` | revisão e v2 | TOK-33, PER-18 |
| Acessibilidade | `better-accessibility` | revisão e v2 | ACE |
| Movimento que falta ou que sobra | `find-animation-opportunities`, `review-animations` | v2 | MOV, MOV-35 |
| Gráficos | `dataviz` | quando a tela tem gráfico | IND |
| Segunda opinião geral | `better-interface` | só no modo revisar | VER |
| Landing, site e páginas públicas do cliente | `design-taste-frontend` (inteira: hero, seções, fotos, movimento e o `gate.mjs` dela) | **Obrigatória** quando o sistema tem site ou landing (CLI-42) | CLI-42, EXP, MOV |
| Um sistema só (consistência visual) | `design-taste-frontend` (`scripts/consistency.mjs`, só as checagens de sistema: botões, cards, raio, links, aninhamento, escala de títulos, contraste, toque, colisão, foco, hover, movimento reduzido) | **Obrigatória**, em todo protótipo antes de mostrar | VER-33, VER-34, conformidade visual |

### Passada de refinamento completa (ordem)

Depois de montar as telas e antes de cada rodada de aprovação, o refinamento roda **nesta ordem**, cada etapa num subagente que devolve achados ou um diff contido. Uma etapa só começa com a anterior aplicada; a lente que falta segue a regra do início deste arquivo.

| # | Etapa | Lentes | Regras |
| --- | --- | --- | --- |
| 1 | Estrutura e hierarquia: nada solto, grupos, 3 níveis, grade horizontal | `better-layout`, Impeccable `layout` | NAV-42, NAV-40, NAV-41, EXP-61 |
| 2 | Tipografia e quebra de linha | `better-typography`, Impeccable `typeset` | TOK-45, TOK-33, escala compacta |
| 3 | Superfícies, ícones, sombras, material único | `better-ui`, `apple-design` | EXP-61, TOK-34, TOK-42 a TOK-44 |
| 4 | Movimento: microinterações, transições, coreografia | `emil-design-eng`, `animate`, `choreograph`, `review-animations`, Impeccable `animate` | MOV-25, MOV-26, MOV-35 |
| 5 | Toque, gestos e celular nativo | `gestures`, `mobile-native`, Impeccable `adapt` | DIS-22, arrastar e soltar acessível |
| 6 | Pior caso, estados e textos | `break-ui`, Impeccable `harden` e `clarify` | VER-32, EST, TXT |
| 7 | Acessibilidade | `better-accessibility`, Impeccable `audit` | ACE |
| 8 | Consistência de sistema | `consistency.mjs` da `design-taste-frontend` | VER-33, EXP-61 |
| 9 | QA de uso real com toque (personas, dispositivos emulados) | `webapp-testing` ou MCP do Playwright | VER-35 |
| 10 | Crítica com nota e acabamento final | Impeccable `critique` e depois `polish` | rubrica 10/10 |

As etapas 1, 2, 6, 8, 9 e 10 são **obrigatórias** em todo protótipo; 3, 4, 5 e 7 entram sempre que a tela tem o assunto (superfícies, movimento, uso no celular, formulário). Na v1, faça a passada inteira só na tela-chave de cada direção; nas demais telas, as etapas 1, 2, 6 e 8.

### Impeccable: os playbooks por passada

O plugin `impeccable` (4.9.2 ou mais nova) tem um playbook por tipo de trabalho. Ele entra **como lente de passada**, chamado com o comando certo (`/impeccable <comando> <alvo>`, ou a skill `impeccable:impeccable` com o comando no argumento), sempre num subagente que devolve achados ou um diff contido. Quem define o fluxo, as direções (PER-21, `assets/direcoes-padrao.md`), os presets e os documentos continua sendo a ca-interface.

| Passada da ca-interface | Comando do Impeccable | Quando | Regras nossas que ele reforça |
| --- | --- | --- | --- |
| Crítica com nota (rubrica de 10/10) | `critique` | **Obrigatória**, antes de mostrar a v1 e no modo revisar; a nota entra na legenda da rodada | VER, EXP-61, rubrica do starter |
| Auditoria técnica (acessibilidade, desempenho, responsivo) | `audit` | revisão e antes de promover para construção | ACE, VER-33, DIS |
| Composição, ritmo e hierarquia | `layout` | junto com `better-layout` na tela-chave | NAV-40, NAV-41, TOK-05 |
| Celular, tablet e telas diferentes | `adapt` | sempre que a tela tem uso no celular; operador no celular | DIS-22, CLI |
| Movimento com propósito | `animate` | passada de vida (EXP-48) e kit de movimento | MOV-35, MOV-25, MOV-26 |
| Personalidade e momentos | `delight` | momentos-assinatura e preset Vidro | EXP-02 a EXP-05, EXP-56 |
| Tipografia | `typeset` | escala compacta de app, par por preset | TOK-33, PER-18 |
| Dosar a intensidade | `quieter` (Sóbrio, telas de operação) e `bolder` (Noite, Sinal, telas de marca) | ajuste fino de preset | PER-21, NAV-41 |
| Estados, i18n e casos de borda | `harden` | junto com a passada de pior caso | EST, VER-32, TXT |
| Primeiro uso e vazios | `onboard` | abertura, primeiro acesso e estados vazios | EXP-60, EST-49 |
| Microcopy | `clarify` | textos, rótulos e erros em pt-BR | TXT |
| Desempenho da interface | `optimize` | WebGL, canvas e listas longas | ARS-07, STK |
| Acabamento final | `polish` | **Obrigatória**, última passada antes de cada rodada de aprovação | conformidade visual, EXP-61 |
| Alternativas de um elemento para escolher | `generate` e `live` | quando o dono quer comparar variações no navegador | PRO (rodada de aprovação) |
| DESIGN.md a partir do protótipo aprovado | agente `impeccable-documenter` | depois da aprovação, antes de construir | DOC, PRO-19 |
| Revisão final contra a direção | agente `impeccable-finish-reviewer` | junto com o `ca-verificador-ui` | VER-34 |
| Revisão do movimento capturado | agente `impeccable-motion-reviewer` | quando há momento-assinatura ou kit de movimento | MOV |

Cuidados:
- **Modos do Impeccable × pontas da ca-interface:** landing e site = Persuade; telas do operador = Operate; ajuda e documentação = Read; momento-assinatura e vitrine = Experience. Passe o modo certo para a lente.
- O Impeccable trabalha com `PRODUCT.md` e `DESIGN.md`. Num projeto da ca-interface, o `DESIGN.md` é o mesmo arquivo (DOC); o `PRODUCT.md` pode ser gerado pelo `init` a partir do `docs/01-prd.md` quando a lente pedir. Não deixe a lente criar uma segunda fonte de verdade de tokens.
- Antes de qualquer edição de interface feita pela lente, ela lê o `craft-floor.md` dela (piso de qualidade e proibições absolutas), que soma às nossas regras.
- O hook de detector de design do Impeccable (`/impeccable hooks on`) é opcional por projeto; não ligue junto com outro gate automático sem combinar com o dono.

As regras de site da `design-taste-frontend` (hero na primeira tela, uma seção por tela, fotos guiando) valem na landing e nas páginas públicas, **não** nas telas de trabalho do operador; nelas, só o verificador de consistência e a camada de movimento (hover que sobe 2 px, botão que afunda, entrada única). `high-end-visual-design` e `gpt-taste` seguem só para gerar direções (`direcao-e-personalidade.md`, seção 8).

Como saber se está instalada: a lista de skills disponíveis na sessão. Ausente, pare a passada e diga em uma linha qual falta e como instalar ("break-ui não instalada; instale pela seção Instalar do README do plugin"). O fallback só entra se a pessoa mandar seguir sem ela, e vai para o relatório ("break-ui ausente; passada por VER-32, a pedido").

## Outras skills como lentes

Fora das passadas acima, outras skills instaladas dão uma segunda leitura quando o domínio pede profundidade.

| Lente | Use para |
| --- | --- |
| `emil-design-eng`, `review-animations`, `animate`, `animation-performance` | movimento, press, transições, desempenho de animação |
| `better-accessibility` | segunda leitura de teclado, foco, ARIA e leitor de tela |
| `mobile-native` | sensação de app no celular e no tablet |
| `break-ui` | pior caso de dados num componente ou tela |
| `interface-review` | segunda leitura de um diff de interface no modo 4 (invocação manual: sugira ao usuário, não chame) |
| `state-machine` | rascunhar o ciclo de vida de um objeto; o canônico vai para o `05` pela `ca-dados` |
| `better-writing`, `better-layout`, `better-colors`, `better-typography` | texto, layout, cor e tipo, quando o domínio pede profundidade |
| `dataviz` | gráficos e KPIs |

As irmãs da família (`criacao-agentica`, `ca-dados`, `ca-arquitetura`) não são lentes: elas são donas de assuntos e estão na seção "Família" do `SKILL.md`.

Ao usar uma lente, traga o achado para a escala, os selos e o formato desta skill. Valores de praticante continuam [PR], mesmo vindos de uma skill excelente.

## Ferramentas do ambiente

Use o que estiver disponível e caia na alternativa sem drama.

- **Navegador embutido** (Claude Code no app de desktop): sobe o servidor local por `.claude/launch.json`, tira capturas em vários viewports, lê console e rede. Alternativa: Playwright ou Chromium do projeto; sem navegador nenhum, entregue a URL e marque como não verificado o que depende de renderização.
- **Artefato publicado com comentários** (claude.ai): bom para a rodada de aprovação, porque a pessoa comenta direto na tela. Publique privado. Alternativa: o protótipo servido localmente, com a URL na conversa; capturas, só as do subagente verificador e só se a pessoa não puder abrir o link (PRO-28).
- **MCPs de referência** (Mobbin, Refero, shadcn, 21st.dev, LottieFiles): use só se já estiverem conectados, dentro do orçamento declarado, e repasse literalmente qualquer aviso de uso do fornecedor. Alternativa: navegação humana no navegador embutido ou pedir 2 a 3 links ao usuário. Nunca raspe site, use endpoint privado ou contorne login, paywall ou bloqueio.
- **Codex e outros ambientes sem esses recursos**: o fluxo é o mesmo; o protótipo vira página local, e a aprovação acontece na conversa com o link local; capturas só como no item acima.
