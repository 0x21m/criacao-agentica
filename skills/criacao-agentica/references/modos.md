# Modos: o procedimento de cada um

Leia a seção do modo escolhido antes do primeiro passo dele. As regras de todos os modos, a autonomia, o git automático e o formato do relatório estão no SKILL.md e valem aqui também.

## Iniciar

1. **Pergunte antes de criar arquivos.** As respostas definem o nível e quais documentos existem. Criar primeiro gera campos vazios para a pessoa preencher sozinha. Duas exceções: um briefing completo é guardado literal em `docs/brief.md` na hora (é a fonte), e um termo que a pessoa já confirmou pode entrar no `GLOSSARY.md` assim que se resolve.
2. **Entreviste com as skills `grilling` e `domain-modeling`** (juntas, são o `grill-with-docs`): cada rodada traz só as perguntas cujos pré-requisitos já estão decididos, numeradas, cada uma com a sua recomendação, redigida para que "sim" a aceite. A recomendação puxa para a menor versão que faz o trabalho principal; o que fica de fora vai para "Fora desta versão", em uma linha. Na primeira rodada, cubra o que decide o nível: quem usa, onde os dados ficam, se há dinheiro ou dados de terceiros. Cubra também o problema, como se resolve hoje, a jornada prioritária, o sinal de sucesso e a **autonomia** (o que você pode fazer no git sem perguntar; integrar e publicar são da pessoa). Fatos você descobre sozinho, inclusive pesquisando em fonte oficial durante a entrevista (`references/fontes.md`); decisões são da pessoa. Com briefing, pergunte só o que ele deixa em aberto.
3. **Esforço grande demais para uma sessão e ainda com névoa:** proponha à pessoa o `/wayfinder`, com o mapa em `docs/mapas/`. Névoa é não conseguir ainda formular as perguntas com precisão (uma reconstrução sem documentação, um produto cujo público nem está definido). Um pedido grande mas claro, como um SaaS com escopo descrito, não é névoa: é entrevista.
4. **Recomende o nível** com `references/profundidade.md`, como uma pergunta da entrevista; a pessoa confirma. Junte a **leitura de volta** (o que é, para quem, o que entra, o que fica fora, a jornada prioritária) à última rodada de perguntas, para não gastar uma ida e volta só com ela.
5. Confirmados o nível e a leitura de volta, crie **só o mínimo**: o PRD, `docs/ESTADO.md`, `docs/adr/0001-nivel.md` e o `GLOSSARY.md` (se ainda não existir). Os demais nascem quando o primeiro modo precisar deles: `docs/README.md` (índice e autonomia) antes do primeiro commit; `REVIEW.md` antes da primeira revisão; `docs/agents/` e o bloco "Agent skills" no `CLAUDE.md` só se for usar uma skill do Matt Pocock que grava em documentos (`to-tickets`, `implement-spec`, `wayfinder`); os documentos técnicos, no Especificar.
6. Perguntas que ficaram para a pessoa antes de existir o ESTADO vão na sua resposta; ao criar o ESTADO, entram em "Esperando o responsável".

## Adotar (projeto existente)

Siga `references/adocao.md`. Em resumo: diagnostique antes de documentar, registre o comportamento atual como `[OBSERVADO]` (código é evidência do que existe, não prova de que é o desejado), documente só o que a próxima mudança toca e não reorganize arquivos da pessoa sem aprovação. Código que cabe numa leitura você lê direto; o agente `ca-arqueologo` e a skill `ponytail-audit` entram quando o código é grande demais para isso. O Adotar também pergunta antes de criar arquivos: diagnóstico é só leitura, e os documentos nascem depois da confirmação. Se o projeto já usa as skills do Matt Pocock (existe `docs/agents/`), adapte o `issue-tracker.md` existente em vez de substituí-lo, e preserve o que já está em `.scratch/` como fonte até migrar.

## Especificar entrega

1. Localize a capacidade no PRD. Se ela não estiver lá, pare e diga: ou é escopo que ninguém aprovou, ou o produto mudou e o PRD não acompanhou. A pessoa decide qual dos dois.
2. Escreva os critérios de aceite **antes** de qualquer código, cada um com o verificador que outra pessoa poderia reexecutar (`references/criterios.md`). Metas ditas de passagem ("registrar em menos de 10 segundos") também viram critérios. Um CA verificável numa TAR só; se ele cobre duas, divida-o.
3. Detalhe nos documentos afetados o necessário para essa entrega, passando cada documento ou seção pela escada do contrato (`references/profundidade.md`). O piso nunca se corta: estados de erro, permissão, isolamento de dados e acessibilidade, além do caminho feliz. Preencha você mesmo o que puder, marcando `[ASSUMIDO]`. Schema, invariantes e migração seguem a skill `ca-dados` (cada invariante no formato do registro dela); módulo novo ou mudança que cruza módulos segue a `ca-arquitetura` (manifesto antes do código).
4. Resolva as lacunas pelo tipo: `pesquisa` com a skill `research`, seguindo a ordem de `references/fontes.md` e registrando fonte e data; `protótipo` com `prototype` (termina num veredito registrado como DEC ou ADR); `entrevista` com `grilling`; responsável fora do chat com `to-questionnaire`.
5. Rode o modo **Auditar**.
6. **Planeje pelos objetivos da pessoa.** Escreva os objetivos dela nas palavras dela; TAR que não fecha nenhum objetivo sai do plano. Todo número do plano (prazo, tamanho, taxa) tem fonte; estimativa sem fonte é marcada como julgamento. Entrega grande vira **ondas** (sequenciais) e **pistas** (paralelas, sem arquivo em comum). Decisão da pessoa entra no ESTADO com quantas TAR trava e até quando, e as que demoram (advogado, tarefa manual, conta externa) aparecem primeiro. Emenda ao plano regenera o índice e a ordem de leitura, nunca é anexada ao fim. Plano grande: comece pelo enxuto que serve aos objetivos e reclassifique o resto contra o código depois.
7. **Fatie seguindo o procedimento da `to-tickets`**: TAR bala traçadora, uma por arquivo em `docs/tarefas/`, cada uma com `Bloqueada por:` e costuras de teste. Refatoração preparatória vem primeiro; refatoração larga segue expand–contract; um pré-requisito técnico real (o banco antes da tela) pode ser uma TAR própria, com o motivo no plano. O fatiamento é reversível: mostre-o à pessoa no relatório em vez de esperar aprovação. Liste as TAR na entrega do plano.

## Auditar

Antes de implementar uma entrega, delegue ao agente `ca-auditor` o cruzamento de produto, fluxo, dados, autorização, interface, técnica e tarefas (`references/auditoria.md`); ele devolve só as lacunas, e você as grava. O que é decisão da pessoa vira `LAC` com referências, impacto (`bloqueia-tarefa`, `bloqueia-futura`, `não-bloqueia`), tipo de resolução, proposta e responsável. O que você mesmo resolve por derivação ou escolha local reversível vira uma linha `[ASSUMIDO]` ou uma DEC no documento dono, sem LAC. Você pode reclassificar a resolução que o auditor propôs, com o motivo. Bloqueie só as tarefas afetadas (em `Bloqueada por:`) e siga com o trabalho independente.

## Executar tarefa

1. **Gate de prontidão.** A TAR está na fronteira; tem o que entrega, escopo e fora de escopo, **os arquivos que pode tocar e o fluxo existente a reutilizar**; CA com verificador; costuras de teste; estados relevantes definidos; dependências disponíveis ou simuladas explicitamente. Se falhar, volte ao Especificar. Simulação valida só a camada que exercita.
2. **Risco.** Defina o campo `Risco:` da TAR pela mudança (tabela em `references/verificacao.md`). **Revisão do plano** (risco alto): agente `ca-revisor-plano`, que confronta a TAR com o repositório antes da primeira edição.
3. **Construa com o agente `ca-construtor`** (worktree próprio, `tdd` carregada; em risco alto, passe `model: opus` e `effort: high` na chamada), ou na sessão seguindo o procedimento da `implement` quando a TAR é pequena e o contexto já está aqui. Se o agente falhar ao criar o worktree (a sessão não está aberta dentro do repositório), siga o plano B de `references/motor.md`. As costuras de teste ficam na TAR; não é preciso confirmá-las com a pessoa, salvo costura nova que muda a arquitetura. Antes de editar, procure o que já existe pela ordem de `references/fontes.md`; quem construiu relata as fontes e você as grava na seção "Fontes" da TAR. O método é o da `tdd`: teste do critério primeiro, visto falhando pelo motivo certo, depois o mínimo que o faz passar, uma fatia por vez, pela interface pública. Para a fronteira inteira de uma entrega, proponha à pessoa o `/implement-spec`.
4. Quando um passo não funcionar como escrito, pare e diga o que quebrou e o que propõe. Construir outra coisa e relatar o plano como executado é a falha que este método existe para evitar.
5. **Verifique** cada CA com o verificador nomeado e revise o diff inteiro. Suíte, build e outros comandos de saída longa vão para o agente `ca-rodador`, que devolve só as falhas. Teste que pode derrubar ou travar o processo roda com tempo limite (`references/verificacao.md`).
6. **Revise pelo nível de risco** (`references/verificacao.md`), entregando o `REVIEW.md` a cada revisor. Sempre o agente `ca-revisor` (a `ponytail-review` em contexto limpo). Em risco alto, também o agente `ca-verificador` (cego: CA contra o diff, mutação e isolamento, numa cópia isolada) e o `/security-review`. Todo achado fica corrigido ou descartado com motivo. Nova rodada só por achado `deve-corrigir`; correção de achado menor fecha com a sua leitura do diff. No máximo 3 rodadas; depois, repense a abordagem com a pessoa. Sem revisão nenhuma, declare `autorrevisão`.
7. **Prova do projeto.** Em projeto `transacional`, ou em qualquer projeto com arquivos gerados, registros ou baselines, os CA verdes não bastam: o construtor roda a prova do projeto no próprio worktree (o comando `Rodar:` do ESTADO), atualiza o que for gerado e só então a TAR segue. No PMD, "pronto = os CA da TAR" custou um dia em quatro rodadas de integração paradas por registros mecânicos. A revisão confere também que o diff só toca os arquivos declarados na TAR e que nenhuma ação ganhou um segundo fluxo.
8. **QA de uso** quando a TAR muda uma tela: cenários com papel e objetivo, incluindo o que **não pode** ser possível, jogados por quem não leu o código (`references/verificacao.md`).
9. Preencha o **registro de conclusão** e marque a TAR `concluída`: as dependentes entram na fronteira e seguem no branch de trabalho. Em risco médio ou alto, a **aprovação humana** é condição para **integrar** na base, não para concluir: ponha o pedido em "Esperando o responsável" no ESTADO, com a evidência a ler. Aprovação de agente nunca substitui a humana. Atualize os documentos afetados no mesmo commit; commit e integração seguem a autonomia de `docs/README.md`.

## Corrigir

Use a skill `diagnosing-bugs`: primeiro um comando que fica **vermelho** com o sintoma exato, depois reproduzir e minimizar, 3 a 5 hipóteses falsificáveis (mostradas à pessoa no relatório, sem esperar), instrumentação marcada e o teste de regressão antes do fix. Se o bug destruiu dados, diga o que a correção **não** recupera.

O registro depende do projeto:
- **Com `docs/`:** o bug vira uma TAR (ou entra na TAR que o causou) com CA do comportamento correto, e passa pela revisão do Executar conforme o risco. Se passou por uma TAR concluída, entra em "Já escapou" no `REVIEW.md`, com o teste de regressão.
- **Sem `docs/`:** o registro é o teste de regressão mais o commit com a hipótese confirmada. Ofereça o Adotar em uma linha; não imponha.

"Não há costura correta para o teste" é um achado: vira LAC para `improve-codebase-architecture`. Sem a skill: `references/falhas.md`.

## Próxima

1. Parta da **fronteira** e do bloco PENDENTE do `checar.py`.
2. Tire o que é de entrega posterior.
3. Ordene e **diga o motivo da ordem**: o que desbloqueia outras vem antes; o risco mais provável de estar errado se aprende cedo; domínio sensível (login, pagamento, upload, dados pessoais) pede especificação antes. Se a fronteira está vazia por causa de LAC, ofereça a decisão que a destrava.
4. Ofereça duas a quatro opções como decisões concretas, com a sua recomendação. Com duas ou mais TAR da mesma entrega prontas e com forma de loop, uma das opções é o **Loop da entrega**.
5. Se não sobra nada no escopo da versão, diga isso: o próximo passo é integrar ou publicar, não inventar funcionalidade.

## Loop da entrega

Em vez de a pessoa dizer "e agora?" a cada TAR, um `/goal` gira o modo Executar sobre as TAR da entrega até todas concluírem ou o loop bater num freio. A pessoa decide; o loop executa. Siga `references/loop.md`: quando a entrega tem forma de loop, a condição a montar, os freios, o piloto na primeira vez e o relatório "Para ler" ao parar. O `/goal` é comando da pessoa: você monta a condição e a entrega pronta para ela colar.

## Encerrar

Reescreva `docs/ESTADO.md` com `references/modelos/estado.md`, a partir do diff, dos testes rodados e dos commits, não da lembrança: a memória do próprio trabalho tende para o que se pretendia fazer. Atualize-o também a cada TAR concluída, para que uma sessão interrompida não deixe o ESTADO para trás. Espere os agentes de construção e verificação terminarem antes de relatar; se precisar relatar antes, o ESTADO diz exatamente o que ainda está rodando, em que commit, e o que falta fazer com o resultado. Distinga **concluído** (critérios atendidos, revisado e registrado), **integrado** (na base definida, com a aprovação exigida pelo risco) e **publicado** (no ambiente declarado, com verificação pós-entrega). Ao fechar uma entrega, rode a skill `ponytail-debt`: os atalhos `shortcut:` vão para o ESTADO, e todo atalho sem gatilho de revisão vira LAC `bloqueia-futura`. Depois, proponha à pessoa o `/retro` na mesma sessão. Para decidir entre continuar, limpar, compactar ou passar adiante, use "Fronteira de fase" em `references/motor.md`.
