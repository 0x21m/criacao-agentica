# Motor de execução: ponytail e as skills do Matt Pocock

Três camadas, cada uma com um dono:

| Camada | Dono | Decide |
|---|---|---|
| Filosofia de construção | ponytail (plugin `ponytail@ponytail`) | Quanto se escreve: a menor mudança completa, a escada de opções, o piso que nunca se corta, o fechamento "o que pulei e qual o risco" |
| Processo | skills do Matt Pocock (github.com/mattpocock/skills) | Como cada passo é bem feito: entrevistar, fatiar, testar, depurar |
| Contrato e estado | esta metodologia | O que fica registrado, onde, com que marcador, e o que conta como pronto |

A ponytail entra sozinha: os hooks do plugin injetam as regras no início de cada sessão e de cada subagente. Não as repita em documento nenhum; uma cópia diverge da fonte. O nível padrão é `full`; Iniciar e Especificar pedem `ultra`, em que o agente questiona as partes do pedido que a necessidade não justifica (`/ponytail ultra`, ou `PONYTAIL_DEFAULT_MODE=ultra` para tornar padrão).

As skills do Matt Pocock (github.com/mattpocock/skills) são o processo: como entrevistar, fatiar, testar e depurar bem. Elas e esta metodologia se ligam por `docs/agents/issue-tracker.md`, que manda as skills dele lerem e escreverem nos nossos documentos. Assim existe uma fonte de verdade só.

## Precedência

- A ponytail decide **quanto** se escreve, em código e em documento (a escada do contrato em `profundidade.md`).
- A skill especialista decide **como** o passo é feito.
- A metodologia decide **o que fica registrado** (REQ, CA, LAC, DEC, ADR, TAR, ESTADO), **onde** e **o que é pronto**.
- `docs/README.md` (Autonomia concedida) decide se pode commitar, integrar ou publicar, mesmo quando uma skill mandar.
- Um conflito que não se resolve por esses três pontos vira LAC.

## Como chamar cada uma

Parte das skills dele é **só-usuário** (`disable-model-invocation: true`): a ferramenta Skill recusa chamá-las, e elas nem aparecem na lista de skills do agente. Elas existem para a pessoa disparar com `/nome`.

| Tipo | Skills | Como usar quando o modo pede |
|---|---|---|
| Chamáveis | `grilling`, `domain-modeling`, `tdd`, `diagnosing-bugs`, `prototype`, `research`, `codebase-design`, `wizard`, `writing-for-agents`, `pr`, `ponytail-review`, `ponytail-audit`, `ponytail-debt` | Chame pela ferramenta Skill |
| Só-usuário, atalho | `grill-with-docs` | Chame `grilling` e `domain-modeling`, que é tudo o que ela faz |
| Só-usuário, procedimento | `to-tickets`, `implement`, `to-questionnaire`, `wait-what` | Leia `~/.claude/skills/<nome>/SKILL.md` e siga o procedimento, dizendo à pessoa que está seguindo |
| Só-usuário, sessão própria | `implement-spec`, `wayfinder`, `retro`, `improve-codebase-architecture`, `handoff` | Ofereça à pessoa o comando `/<nome>`, com o motivo. São fluxos longos, que orquestram subagentes ou olham a sessão inteira |

O que fazer quando uma skill não está instalada está na última coluna da tabela abaixo.

## Por modo

| Modo | Skill | Para quê | Sem a skill |
|---|---|---|---|
| Iniciar | `grill-with-docs` (= `grilling` + `domain-modeling`) | Entrevista por fronteira de decisões, gravando glossário e ADR enquanto avança | Rodadas curtas com recomendação; atualize `GLOSSARY.md` à mão |
| Iniciar (esforço grande, com névoa) | `wayfinder` | Mapa de tickets de decisão em `docs/mapas/` até o caminho ficar claro; produz decisões, não entregas | Liste as LAC por tipo de resolução e resolva uma por sessão |
| Especificar | (nossos modelos) + `research`, `prototype`, `to-questionnaire` | Fontes primárias; protótipo descartável para dúvida de comportamento ou aparência; questionário para quem não está no chat | Consulte a documentação e registre fonte e data |
| Especificar → plano | `to-tickets` | Fatiar a entrega em TAR bala traçadora, com `Bloqueada por:` e expand–contract | Use a seção "Fatiamento" do plano |
| Executar (uma TAR) | `implement` → `tdd` → revisão | Construir pela costura combinada, teste vermelho primeiro, revisão em dois eixos | Siga o modo Executar do SKILL.md |
| Executar (fronteira inteira) | Loop da entrega (`loop.md`), com o `/goal` nativo; em paralelo, `implement-spec` | Uma TAR por vez até a entrega fechar ou bater num freio; o `implement-spec` põe subagentes em worktrees, um por TAR, integrando num branch | Uma TAR por vez, pelo Próxima |
| Corrigir bug | `diagnosing-bugs` | Loop que fica vermelho antes de qualquer hipótese; teste de regressão antes do fix | `references/falhas.md` |
| Revisar | `ponytail-review`, rodada pelo agente `ca-revisor` | Correção, segurança, carga real, teste do que é arriscado, velocidade e o que cortar; um caso concreto por achado e um veredito | `ca-verificador` |
| Conformidade com a TAR (risco alto) | agente `ca-verificador` | Cego: CA contra o diff, prova por mutação, isolamento entre usuários | — |
| Encerrar entrega | `ponytail-debt`, depois `retro` | Erro mecânico vira checagem determinística; julgamento vira padrão de código; CLAUDE.md só com ponteiros | "Falha que importou deixa um caso", em `falhas.md` |
| Adotar / saúde do código | `ponytail-audit`; entre entregas, `improve-codebase-architecture` e `codebase-design` | Oportunidades de módulos profundos; vocabulário de costura e interface | — |
| A qualquer momento | `wait-what` | Reexplicar em linguagem simples, com o glossário | — |
| PR | `pr` | Corpo com o menor visual da mudança, evidência de antes e depois e o risco do merge | Relatório padrão do SKILL.md |
| Passo que só a pessoa faz | `wizard` | Script guiado para credenciais, painéis, migração pontual | Lista numerada em "Esperando o responsável" |

## Tensões já resolvidas

- **Costuras de teste** (`tdd`, `to-spec` mandam confirmar com o usuário): ficam registradas na seção "Costuras de teste" da TAR e o `ca-revisor-plano` as confere. Só vão ao responsável quando são costura nova ou mudam a arquitetura.
- **`to-spec`** não cria arquivo de spec. O issue-tracker.md distribui cada seção no documento dono. O modo Especificar costuma substituí-lo; use-o quando a conversa já decidiu tudo e só falta sintetizar.
- **Verificação:** a `ponytail-review` roda em toda entrega. O nosso `ca-verificador` (cego, com prova por mutação e teste de isolamento) e o `/security-review` nativo entram a mais nas TAR de risco `alto` (tabela em `verificacao.md`). Os dois recebem o `REVIEW.md`.
- **Tamanho dos testes:** a `tdd` pede teste primeiro; a ponytail pede um teste pequeno só para lógica não trivial. Valem as duas: todo CA tem verificador, e o verificador de uma mudança trivial pode ser um comando ou uma inspeção, sem teste novo.
- **Atalho deliberado:** um limite conhecido vira comentário `shortcut: <limite>, <quando melhorar>` no código. Não é LAC enquanto tiver gatilho; o `ponytail-debt` o recolhe no Encerrar.
- **Revisão de padrões:** o `code-review` do Matt Pocock não é usado; a `ponytail-review` cobre o eixo de padrões. Quando `tdd`, `implement` ou `implement-spec` mandam chamar "code-review", cai no `/code-review` nativo do Claude Code, o que é aceitável.
- **Fatiamento (`to-tickets`)**: ela manda iterar a quebra com a pessoa até a aprovação. Aqui o fatiamento é reversível: crie as TAR e mostre-as no relatório; a pessoa corrige se quiser.
- **Rodadas de revisão:** nova rodada só por achado `deve-corrigir`. A correção de um achado `deveria` ou `opcional` fecha com a leitura do diff por quem a fez, registrada como autorrevisão.
- **CA que atravessa duas TAR:** divida o CA, um por TAR. "Atendido em parte" não é resultado.
- **Hipóteses da `diagnosing-bugs`:** ela pede mostrar as hipóteses à pessoa antes de testar, sem bloquear. Aqui elas vão no relatório; o teste segue.
- **Handoff:** o `ESTADO.md` é o ponto de retomada persistente. O `handoff` dele só serve quando o trabalho viaja: outro harness, outro diretório, um colega.
- **Tipos de lacuna:** toda LAC diz como se resolve, nos mesmos tipos do `wayfinder`. São eles: `pesquisa` (agente sozinho, skill `research`), `protótipo` (com a pessoa, skill `prototype`), `entrevista` (com a pessoa, `grilling` + `domain-modeling`) e `tarefa manual` (fazer algo para poder decidir, como criar conta num serviço ou dar acesso).

## O time (subagentes do plugin)

Um subagente só se paga quando isola saída volumosa, precisa de independência imposta pela ferramenta ou de outro modelo. Entrevista, decisões e ESTADO ficam na sessão principal: subagente não fala com a pessoa.

| Agente | Modo | Faz | Ferramentas | Modelo |
|---|---|---|---|---|
| `ca-arqueologo` | Adotar | Extrai do código as regras `[OBSERVADO]` como RN e CA, com arquivo:linha e confiança | só leitura | sonnet |
| `ca-auditor` | Auditar | `checar.py` + cruzamento dos documentos; devolve só as LAC | só leitura | sonnet |
| `ca-revisor-plano` | Executar, risco alto | TAR contra o repositório, antes de codar | leitura + busca de fontes | sonnet |
| `ca-construtor` | Executar | Uma TAR num worktree, `tdd` pré-carregada, fontes oficiais antes de editar | tudo, menos criar subagentes | sonnet; opus na chamada em risco alto |
| `ca-revisor` | Executar, toda TAR | `ponytail-review` + `REVIEW.md` em contexto limpo | só leitura | sonnet |
| `ca-verificador` | Executar, risco alto | Cego: CA, mutação, isolamento, num worktree | leitura + Edit no worktree | inherit |
| `ca-rodador` | qualquer | Roda suíte, build ou comando longo; devolve só as falhas | Bash, Read | haiku |

As definições vivem na pasta `agents/` do plugin `criacao-agentica`. Instalados pelo plugin, os agentes aparecem com o prefixo do plugin (`criacao-agentica:ca-construtor`); se alguém copiar os arquivos para `~/.claude/agents/`, aparecem sem prefixo. Use o nome que estiver na lista de agentes disponíveis. A `implement-spec` pode usar o `ca-construtor` como seu implementador. Especialistas externos, só quando o projeto pedir: `claude-security` (auditoria de segurança profunda), `code-modernization` (legado pesado), `pr-review-toolkit` (falhas silenciosas e testes fracos que apareçam em "Já escapou").

## Quando um agente ou ferramenta falha

- **Worktree (`ca-construtor`, `ca-verificador`):** o isolamento `worktree` nasce da pasta da sessão. Se a sessão não estiver aberta dentro do repositório, a chamada falha com "not in a git repository". Plano B: crie o worktree você mesmo dentro do projeto (`git -C <projeto> worktree add .worktrees/<nome> <branch>`, com `.worktrees/` no `.gitignore` ou no `.git/info/exclude`), chame um agente `general-purpose` com o texto da definição do agente e o caminho do worktree, e remova o worktree ao terminar (`git worktree remove`). O ideal é abrir a sessão dentro do projeto, e aí o plano B não é preciso.
- **`/security-review`:** também roda sobre a pasta da sessão. Fora do repositório, aplique o procedimento dele num agente `general-purpose`, passando o intervalo de commits (`git -C <projeto> diff <base>..<branch>`).
- **Ferramenta de perguntas ausente** (num subagente ou num teste): escreva as perguntas na resposta, no formato da `grilling` (numeradas, com recomendação, "sim" aceita), e pare.
- **Custo:** o `ca-verificador` é o agente mais caro (pode passar de 100 mil tokens numa TAR grande). Ele se paga em risco alto; não o rode em risco baixo ou médio.

## Fronteira de fase

Ao terminar uma fase (entrevista, especificação, implementação), decida nesta ordem, e a primeira resposta "sim" vence:

1. **Continuar** se a próxima fase precisa desta como fonte primária e cabe no contexto que sobra. Entrevista → especificação → fatiamento ficam numa sessão só, para não perder o porquê.
2. **Limpar** se nada daqui importa para o que vem. Cada TAR é autocontida, então entre uma `implement` e outra é seguro limpar.
3. **Handoff** só se o trabalho viaja: outro harness, outro diretório, um colega.
4. **Subagente** se a tarefa roda sem a pessoa: revisão, pesquisa, verificação.
5. **Compactar**, com instrução do que preservar, nos demais casos.

Antes de limpar ou compactar, o `ESTADO.md` precisa estar atualizado.

## Instalação

As skills ficam fora desta skill e evoluem por conta própria (github.com/mattpocock/skills). Para o fluxo, bastam: `grilling`, `domain-modeling`, `grill-with-docs`, `to-tickets`, `implement`, `implement-spec`, `tdd`, `diagnosing-bugs`, `prototype`, `research`, `retro`, `wayfinder`, `wait-what`, `pr`, `wizard`, `to-questionnaire`, `codebase-design` e `improve-codebase-architecture`. Mais o plugin `ponytail@ponytail` (marketplace `DietrichGebert/ponytail`). O `setup-matt-pocock-skills` não é necessário: o modo Iniciar escreve `docs/agents/` e o bloco "Agent skills" a partir dos nossos modelos.

