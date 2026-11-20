# Documentação e integração (DOC)

Este arquivo é dono de onde cada coisa fica escrita no projeto e de como esta skill convive com a família `criacao-agentica` (o método, a `ca-dados` e a `ca-arquitetura`): o layout único de documentos, o dono de cada assunto, o que nasce em cada momento, a atualização ao terminar um modo, os quatro cenários de integração, os portões e a verificação dentro do método. Não cobre o conteúdo das decisões de interface (os outros arquivos de `references/`), o formato do registro de aprovação (`prototipo-e-aprovacao.md`, PRO-19), o conteúdo mínimo do `DESIGN.md` e o lint de tokens (`governanca.md`) nem os valores dos tokens (`fundamentos-e-tokens.md`).

Formato das regras: **ID** · [selo] · prioridade mínima. `processo` marca regra de método, que não gera achado de produto.

## Sumário

1. Um layout só
2. Um dono por assunto
3. Começar pequeno
4. Documentos ao terminar e na auditoria
5. Integração com a criacao-agentica
6. Regras de convivência
7. Verificação dentro do método
8. Modelos
9. Antes de terminar
10. Fontes

## 1. Um layout só

- **DOC-01** · [N casa] · processo. Use sempre o layout de documentos da `criacao-agentica`, mesmo quando esta skill roda sozinha. Nunca crie um layout paralelo (`docs/design/`, `docs/ux/`, tabela de estados solta). *Porquê:* se a `criacao-agentica` entrar depois, os documentos já estão no lugar e não há migração.

```
GLOSSARY.md                 termos do domínio e palavra da tela (DOC-09)
AGENTS.md ou CLAUDE.md      instruções do agente, com a linha de interface (DOC-10)
DESIGN.md                   receita do sistema, complemento do 04 (DOC-05)
tokens.json                 valores, formato W3C Design Tokens (DOC-05)
docs/brief.md               briefing recebido, literal, nunca editado (DOC-11)
docs/01-prd.md              negócio; versão leve quando sozinha (DOC-06)
docs/03-fluxo-app.md        jornadas, pontas, objetos, tabela de projeção (DOC-03)
docs/04-ui-ux.md            direção, sistema, telas, decisões de interface (DOC-04)
docs/05-schema-backend.md   estados canônicos, transições, permissões; dona ca-dados (DOC-07)
docs/adr/NNNN-slug.md       decisões estruturais (DOC-08)
docs/tarefas/TAR-NNN-slug.md  tarefas, com a criacao-agentica
prototipos/<fluxo>/vN/      versões do protótipo (PRO-18)
scripts/verificar-<assunto> e .claude/skills/verificar-<assunto>/   verificadores do projeto (DOC-26)
```

O resto do layout (`docs/README.md`, `docs/ESTADO.md`, `REVIEW.md`, `docs/02-trd.md`, `docs/06-plano-implementacao.md`, `docs/agents/`, `docs/mapas/`, os manifestos de módulo) é da `criacao-agentica` e das irmãs; veja `modelos/README.md` da skill dela em vez de copiar a lista (DOC-02).

- **DOC-02** · [N casa] · processo. Cada assunto tem um dono só. O outro documento cita o dono pelo nome e pela seção; não copia. Divergência entre dois documentos se resolve no dono e vira LAC quando o dono não decide. *Porquê:* texto duplicado diverge e ninguém sabe qual vale (regra da casa 6, para os números).

## 2. Um dono por assunto

| Assunto | Arquivo dono |
| --- | --- |
| Problema, público, escopo, REQ, RN, CA | `docs/01-prd.md` |
| Jornadas (FLX), inventário de telas, contrato de cada ação | `docs/03-fluxo-app.md` |
| Pontas, objetos compartilhados e **tabela de projeção por ponta** (rótulo do operador, frase do cliente, visível para, notificação, token de cor) | `docs/03-fluxo-app.md` (dona: `ca-interface`) |
| Estado canônico, transições válidas e quem pode cada uma | `docs/05-schema-backend.md` e o banco (dona: `ca-dados`) |
| Permissões por papel, classe do dado e o que cada payload leva | `docs/05-schema-backend.md` (dona: `ca-dados`; esta skill propõe e verifica) |
| Definição de cada número e status que a tela mostra | catálogo de definições (`ca-dados`) |
| Estados e níveis de desligamento de módulo | manifesto do módulo (`ca-arquitetura`) |
| Direção visual, referências aprovadas, sistema visual, por tela, interação e acessibilidade, validação visual | `docs/04-ui-ux.md` |
| Decisões de interface (DEC), inclusive aprovação de protótipo e pulo do portão | `docs/04-ui-ux.md`, seção "Decisões" |
| Decisões estruturais (ADR) | `docs/adr/` |
| Receitas de tela, componentes, cartão de voz, "não são antipadrões aqui", aposentado | `DESIGN.md` |
| Valores de cor, espaço, tipo, raio, sombra, duração | `tokens.json` |
| Termos canônicos, palavra da tela, apelidos registrados e sinônimos proibidos | `GLOSSARY.md` |
| Onde ler antes de mexer em interface | `AGENTS.md` ou `CLAUDE.md` (DOC-10) |
| Nível, tarefa ativa, o que espera o responsável, comando `Rodar:` | `docs/ESTADO.md` (só com a `criacao-agentica`) |

Fronteira com as irmãs, assunto por assunto. Regra geral: a `ca-dados` decide o que é verdade e quem pode; a `ca-arquitetura` decide onde mora e como os módulos se falam; a `ca-interface` decide como cada ponta mostra, diz e deixa agir, e verifica que a tela não inventou verdade nem permissão. A tela nunca é a garantia.

| Assunto | Dono | O que a ca-interface faz |
| --- | --- | --- |
| Estado canônico e transições | `ca-dados` (módulo dono pela `ca-arquitetura`) | Tabela de projeção no `03`, citando os estados pelo `_Código_` do glossário; transições por papel citadas do `05` |
| Status, KPIs e totais | `ca-dados` (uma definição por conceito) | Lê a definição e só formata; mostra período, fuso, unidade e corte que o contrato de leitura informa. Tela que soma, conta ou deriva status é achado |
| Tempo | `ca-dados` | Exibe no fuso que a resposta informa; "hoje" vem do servidor, nunca do aparelho; data do fato e do registro quando existem as duas |
| Dinheiro | `ca-dados` | Formato pt-BR, moeda visível quando há mais de uma; não recalcula nem arredonda de novo |
| Permissões, RLS e payload | `ca-dados` | Propõe papel × atributo × CTA a partir do protótipo; verifica na rede que o payload é subconjunto da matriz; desenha a reautenticação no ponto da ação |
| Idempotência e reenvio | `ca-dados` | Gera e reusa a chave; botão com guarda; estado "não confirmado" para resultado desconhecido; nunca reenvia com chave nova |
| Invariantes | `ca-dados` (códigos de módulo pela `ca-arquitetura`) | Microtexto para cada recusa nomeada; cada INV que veta ação da tela vira cenário "isto não pode ser possível" (DOC-25) |
| Fato que não se edita | `ca-dados` | Documento terminal não tem "Editar": a ação é estornar ou emitir correção, e a timeline mostra os dois ligados |
| Número legal × identificador | `ca-dados` | Mostra o código humano ou o número legal, nunca o UUID; rascunho sem número legal |
| Módulos e seus estados | `ca-arquitetura` | Desenha ocultar, negar poder, desligado com dados e "ausente", diferente de zero e de vazio; elemento de ponte só com os dois módulos ligados |
| Um fluxo por tarefa | `ca-arquitetura` | Atalho, paleta e lote chamam a mesma porta, com as mesmas confirmações; fluxo duplicado é achado |
| IA que lê os outros módulos | `ca-arquitetura` (proposta) e `ca-dados` (projeção e permissão) | UI da proposta pendente: quem propôs, o que muda, aprovar ou recusar, trilha; a resposta da IA não mostra o que o papel não vê |
| Notificações e tempo real | `ca-arquitetura` (evento, outbox, reação) | Conteúdo, canal, tom e link; deduplica pelo id do evento; obrigação aparece numa tela do núcleo |
| Trilha de auditoria | `ca-dados` | Mostra a trilha ao papel certo e pede o campo "por qual ponta" |
| Tenancy, empresa, período | `ca-dados` | Seletor de empresa é dimensão; tenant nunca se mistura; período fechado bloqueia a ação e diz por quê |
| Glossário e palavra da tela | `criacao-agentica` com a regra da `ca-dados` | Rótulo é a palavra da tela; marca branca usa apelido registrado, nunca termo novo |

- **DOC-03** · [N casa] · processo. O `docs/03-fluxo-app.md` guarda, além das jornadas do modelo, o mapa de pontas e atores, os objetos com relações e papéis e, por objeto, a tabela de projeção por ponta (modelo `assets/modelo-tabela-de-estados.md`, como seção do objeto). O estado canônico, as transições e quem pode ficam no `05` e no banco, donos da `ca-dados`; o `03` os cita pelo código, sem redefinir. *Porquê:* a projeção é navegação e voz de cada ponta; a verdade do estado precisa valer mesmo quando alguém escreve SQL direto (regra da casa 4).
- **DOC-04** · [N casa] · processo. O `docs/04-ui-ux.md` segue as seções do modelo (direção, sistema visual, por tela, interação e acessibilidade, validação visual), com as referências aprovadas na direção e uma seção "Decisões" com as DEC de interface. Ele aponta para `DESIGN.md` e `tokens.json` em vez de repetir valores e receitas.
- **DOC-05** · [DS] · processo. `DESIGN.md` e `tokens.json` são complemento do `04`, para quem constrói: o `DESIGN.md` diz como montar a próxima tela igual (GOV-19, modelo `assets/modelo-design-md.md`); o `tokens.json`, no formato W3C Design Tokens, é a fonte única de GOV-01. Projeto com outra fonte de tokens já estabelecida mantém a sua e o `04` aponta para ela (regra da casa 7).
- **DOC-06** · [N casa] · processo. Sozinha, a skill escreve um `docs/01-prd.md` leve: produto em uma frase, público, escopo e "fora desta versão", e os REQ e CA das jornadas do MVP. O resto do modelo fica `[ADIADO]` ou `[DESCONHECIDO]`, nunca inventado.
- **DOC-07** · [N casa] · processo. O `docs/05-schema-backend.md` é da `ca-dados`: estados canônicos, transições, matriz de autorização, classe do dado e invariantes. Esta skill não o escreve; propõe (papel × atributo × CTA, o que cada ponta precisa receber, as transições que o protótipo pressupõe) e verifica (payload na rede, transição recusada na tela). Sozinha, sem a `ca-dados`, ela registra essas propostas no `05` marcadas `[PROPOSTO]`, para revisão quando a `ca-dados` entrar.
- **DOC-08** · [N casa] · processo. Decisão local vira DEC no documento dono; decisão difícil de reverter, surpreendente sem contexto e fruto de trade-off real vira ADR em `docs/adr/`. Toda aprovação de protótipo e todo pulo do portão viram DEC (PRO-19). DEC aprovada não se edita: outra a substitui, e as duas se apontam.
- **DOC-09** · [N casa] · processo. Termos ficam no `GLOSSARY.md`, na raiz, no formato do modelo `glossario.md` (termo, definição curta, `_Código_`, `_Evitar_`). Telas, rótulos, notificações e documentos usam só termos dele (TXT-01, NAV-03); o vocabulário de um cliente ou de uma marca branca entra como apelido registrado.
- **DOC-10** · [N casa] · processo. A linha de interface ("antes de mexer em interface, leia docs/04-ui-ux.md e DESIGN.md") vai no arquivo de instruções do agente que o projeto já tem. Se existe `CLAUDE.md` ou `AGENTS.md`, edite esse e não crie o outro. Se não existe nenhum, crie `AGENTS.md` com a linha e um `CLAUDE.md` que só importa `@AGENTS.md`. Mover conteúdo da pessoa entre os dois espera aprovação. *Porquê:* um arquivo só, lido por todos os hosts, evita instruções divergentes, e a regra casa com a do modelo `instrucoes-agente.md` da `criacao-agentica`.

## 3. Começar pequeno

- **DOC-11** · [N casa] · processo. Crie só o que o momento pede. Arquivo vazio para preencher depois é proibido. Briefing completo recebido vai literal para `docs/brief.md` na hora, com ou sem a `criacao-agentica`: ele é a fonte e nunca se edita.

| Momento | Nasce |
| --- | --- |
| Modo 1, sozinha, pacote antes da aprovação | `GLOSSARY.md`; `docs/01-prd.md` leve; `docs/03-fluxo-app.md` com pontas, objetos, projeção e FLX do MVP; `docs/04-ui-ux.md` com direção, referências e sistema inicial; `tokens.json` inicial. Tudo `[PROPOSTO]` ou `[ASSUMIDO]` até a aprovação |
| Modo 1, com a `criacao-agentica`, primeira rodada do Iniciar | o `docs/brief.md` e o mínimo que ela cria com `[ASSUMIDO]` (PRD, ESTADO, ADR-0001, `GLOSSARY.md`); as perguntas, o mapa de pontas e o MVP vão na mesma resposta |
| Modo 1, com a `criacao-agentica`, Especificar da entrega 1 | o `03`, o `04`, o `tokens.json` e o protótipo v1 |
| Cada rodada aprovada | DEC no `04`; marcadores do que foi aprovado passam a `[CONFIRMADO]`; com a `criacao-agentica`, a LAC `protótipo` fica resolvida |
| Primeira construção | `DESIGN.md`; a linha de interface no arquivo de instruções (DOC-10) |
| Primeiro papel com permissão diferente | proposta para o `05` (DOC-07) |
| Primeira decisão estrutural | `docs/adr/NNNN-slug.md` |

Com a `criacao-agentica` presente, ela decide quando os documentos nascem (cria o mínimo com `[ASSUMIDO]` e pergunta na mesma rodada); esta tabela vale só para o que é de interface. O que continua com a pessoa, também com ela: o protótipo aprovado antes de construir (PRO-01).

## 4. Documentos ao terminar e na auditoria

- **DOC-12** · [N casa] · processo. Atualizar os documentos afetados faz parte de terminar qualquer modo que muda o sistema. Um modo não está feito com documento desatualizado nem, com a `criacao-agentica`, com a prova do projeto vermelha (DOC-26).

| Modo | Atualiza |
| --- | --- |
| 1. Criar do zero | todos os da tabela de DOC-11 que nasceram |
| 2. Tela ou fluxo | FLX e linha de projeção no `03`; proposta de estado ou transição para o `05` (DOC-07); tela e DEC no `04`; receita nova no `DESIGN.md`; token novo no `tokens.json` |
| 3. Revisar, com correção | DEC no `04` para cada correção aprovada que muda padrão |
| 5. Auditar deriva, com consolidação | `tokens.json`, `DESIGN.md` (inclusive "Aposentado") e o `04` |
| 4. Revisar mudança e 6. Bancada | nada; achado de documento desatualizado entra no relatório |

- **DOC-13** · [N casa] · P2. Auditar deriva confere documento contra código: rótulos da projeção no `03` e estados do `05` contra as strings e enums, sistema do `04` e `tokens.json` contra os valores usados, receitas do `DESIGN.md` contra as telas. Cada divergência é achado contra o dono (GOV-24), e o relatório diz qual lado parece certo; corrigir qualquer dos dois espera o usuário. *Porquê:* documento que mente é pior que documento nenhum, porque o próximo agente confia nele.

## 5. Integração com a criacao-agentica

- **DOC-14** · [N casa] · processo. Ao entrar, decida o cenário pelos sinais e diga qual é em uma linha. Projeto que já usa uma das duas skills cai em 2 ou 3, pelo que existe.

| Sinais no projeto | Cenário |
| --- | --- |
| Projeto novo e as duas skills em uso | 1 |
| Documentos desta skill no lugar, sem `docs/ESTADO.md`, e a pessoa adota a `criacao-agentica` | 2 |
| `docs/ESTADO.md` existe | 3 |
| Código existente, sem `docs/ESTADO.md` nem os documentos acima | 4 |

- **DOC-15** · [N casa] · processo. Cenário 1, projeto novo com as duas: a `criacao-agentica` conduz (Iniciar, nível, PRD, ESTADO, git) e esta skill atua como especialista nos passos de interface.
  - A primeira entrega do modo 1 é uma rodada da entrevista do Iniciar, no formato da `grilling`, junto com os documentos mínimos que a `criacao-agentica` cria com `[ASSUMIDO]`: as perguntas de pontas, objetos, estados e MVP, cada uma com a sua recomendação. O protótipo nasce só no Especificar da entrega 1, com nível e escopo declarados e não contestados (`modos.md`, modo 1).
  - No Especificar entrega, esta skill escreve o `03` (projeção) e o `04`, faz a etapa de referências e roda o portão de protótipo; o estado canônico e as transições vão para o `05` pela `ca-dados`.
  - A aprovação pendente é uma LAC tipo `protótipo`, impacto `bloqueia-tarefa`, que cita cada TAR de tela; a DEC de aprovação a resolve. Assim o `checar.py` mantém essas TAR fora da fronteira, e o loop da entrega nunca passa pelo portão.
  - Na revisão, as linhas de `checklist.md` que a TAR toca viram critérios de aceite, e o revisor as usa. Comparar o build com o aprovado é julgamento: no loop, vai para o relatório "Para ler", não para a condição.
- **DOC-16** · [N casa] · processo. Cenário 2, começou só com esta skill e depois adota a `criacao-agentica`: os documentos já estão no lugar (DOC-01). O Adotar dela completa `docs/ESTADO.md`, o nível (ADR-0001) e as TAR; transições e permissões marcadas `[PROPOSTO]` no `05` passam pela `ca-dados`. Nada desta skill muda de lugar.
- **DOC-17** · [N casa] · processo. Cenário 3, começou com a `criacao-agentica` e agora entra esta skill: leia `docs/ESTADO.md`, o `03`, o `04`, o `05` e o `GLOSSARY.md` antes de agir. Não crie documento paralelo; escreva nas seções dos documentos dela. Achado de revisão vira LAC ou TAR, conforme seja decisão da pessoa ou trabalho. Aprovação pendente vira LAC `protótipo` `bloqueia-tarefa` (DOC-15) e aparece em "Esperando o responsável" no ESTADO.
- **DOC-18** · [N casa] · processo. Cenário 4, projeto em andamento sem nenhuma das duas: o diagnóstico é só leitura. Extraia o sistema de design que já existe no código (cores, espaçamentos, tipos e componentes realmente usados, com contagem de usos) e meça a deriva (GOV-26), registrando tudo como `[OBSERVADO]` no `04`. Código mostra o que existe, não o que é desejado. Nada é reorganizado, renomeado ou consolidado sem aprovação, e o `04` só é criado depois de a pessoa confirmar.

## 6. Regras de convivência

- **DOC-19** · [N casa] · processo. Autoridade dos documentos: o PRD governa o negócio; o fluxo, a navegação e a projeção por ponta; o briefing (`04`), a expressão visual; o schema, os estados canônicos, as transições e as permissões. Conflito entre eles vira LAC com os dois lados citados, nunca escolha silenciosa.
- **DOC-20** · [N casa] · processo. As regras desta skill são conhecimento; os documentos do projeto são a lei. Uma DEC ou o `DESIGN.md` que escolhe diferente de um valor [PR], [DS] ou [P] daqui vence (GOV-24). Não vencem uma regra [N], que só vira exceção registrada, nem uma política [N casa], que só a ordem do usuário na conversa pula (ordem de precedência do `SKILL.md`).
- **DOC-21** · [N casa] · processo. Nos documentos do projeto, use os marcadores da `criacao-agentica` (`[CONFIRMADO]`, `[PROPOSTO]`, `[ASSUMIDO]`, `[DESCONHECIDO]`, `[OBSERVADO]`, `[NÃO SE APLICA]` com o motivo, `[ADIADO]` com a entrega) e os IDs dela (REQ, RN, CA, FLX, DEC, ADR, TAR, INV, LAC). IDs desta skill (NAV-12, EST-28) aparecem só como referência de regra, por exemplo "CA-014 (ACE-05)"; nunca numeram coisas do projeto.
- **DOC-22** · [N casa] · processo. Há três portões, em sequência: o de protótipo, antes de construir (PRO-01); o de integração, depois de construir e verificar, que é da `criacao-agentica` e da aprovação humana por risco; e o de publicar para cliente real, só depois da entrega 0 (backup restaurado, monitor, alertas, isolamento de ambiente, roteiro de incidente), que é da `criacao-agentica` e da `ca-dados`. Passar um não dispensa o outro. A interface que a entrega 0 pede (fila de atenção, obrigação visível numa tela do núcleo) é tela de fila de trabalho (LIS).
- **DOC-23** · [N casa] · processo. Com a `criacao-agentica` presente, git, branches, commits e autonomia seguem o "Git automático" do `SKILL.md` dela e a autonomia de `docs/README.md`; os hooks do plugin pedem confirmação antes de push e de commit ou merge na `main` (push no branch de trabalho segue sem pergunta quando a autonomia registrada o libera). O que é técnico e reversível pelo git, inclusive instalar dentro do projeto o que a interface precisa (STK-23), é do agente e fica registrado; com a pessoa ficam produto, dinheiro, dados, produção e a aprovação do protótipo. Os protótipos em `prototipos/<fluxo>/vN/` entram no commit "docs:" do modo, sempre com dados falsos, nunca segredo nem dado real. A página descartável da bancada (modo 6) fica num caminho ignorado pelo git (por exemplo `.scratch/`) ou é apagada antes do commit. Sozinha, esta skill não commita, não integra e não publica sem pedido, e nunca faz `checkout` nem `stash` no trabalho do usuário (VER-23).

## 7. Verificação dentro do método

- **DOC-25** · [N casa] · processo. Toda TAR que muda uma tela tem QA de uso por papel, com cenários "isto não pode ser possível" gerados da projeção do `03`, das transições do `05` e das INV. O procedimento, o formato do cenário e quem joga estão em `verificacao.md` (VER-28).
- **DOC-26** · [N casa] · processo. Com a `criacao-agentica`, o que a interface gera ou fixa entra na prova do projeto, o comando `Rodar:` do ESTADO: tokens compilados a partir do `tokens.json`, lint de tokens (GOV) e baselines de regressão visual. Os verificadores do projeto e a regra de rodar a prova antes do veredito estão em `verificacao.md` (VER-29, VER-30).

## 8. Modelos

- **DOC-24** · [N casa] · processo. Com a `criacao-agentica` instalada, use os modelos dela, em `references/modelos/` da skill dela (`01-prd`, `03-fluxo-app`, `04-ui-ux`, `05-schema-backend`, `decisao`, `adr`, `estado`, `glossario`, `instrucoes-agente`, `readme-docs`, `tarefa`), que desde a 0.12.0 já trazem as seções desta skill (objetos e projeção por ponta no `03`, "Decisões" no `04`). Sem ela, use os de `assets/` e siga as seções da tabela de DOC-02.

## 9. Antes de terminar

| Padrão detectável | Correção |
| --- | --- |
| `docs/design/`, `docs/ux/` ou tabela de estados em arquivo próprio | Seção no dono (DOC-01, DOC-03) |
| O mesmo assunto escrito em dois documentos | Fica no dono; o outro cita (DOC-02) |
| Transições ou estados canônicos redefinidos no `03` | Ficam no `05`; o `03` cita o código (DOC-03) |
| `05` escrito pela skill como se fosse dona | Proposta marcada `[PROPOSTO]` para a `ca-dados` (DOC-07) |
| Aprovação só na conversa | DEC no `04` (DOC-08) |
| Glossário dentro do `DESIGN.md` | `GLOSSARY.md` (DOC-09) |
| `AGENTS.md` criado ao lado de um `CLAUDE.md` que já existia, ou arquivo de instruções sem a linha de interface | Linha no arquivo existente (DOC-10) |
| Arquivo criado vazio para preencher depois | Apagar ou adiar (DOC-11) |
| Protótipo ou `03` criado na entrevista do Iniciar | Só no Especificar da entrega 1 (DOC-15) |
| Modo que mudou o sistema terminou sem atualizar documento | Atualizar antes do fechamento (DOC-12) |
| TAR de tela na fronteira sem DEC de protótipo | LAC `protótipo` `bloqueia-tarefa` (DOC-15) |
| Documento paralelo num projeto com `docs/ESTADO.md` | Escrever nos documentos dela (DOC-17) |
| ID desta skill numerando requisito ou tarefa | IDs da `criacao-agentica` (DOC-21) |
| Publicação para cliente real sem entrega 0 | Terceiro portão (DOC-22) |
| Página da bancada no histórico do git | Caminho ignorado ou apagada antes do commit (DOC-23) |
| TAR de tela concluída sem cenários "não pode" | QA de uso (DOC-25) |
| Pronto com lint de tokens ou baseline vermelha | Prova do projeto (DOC-26) |

## 10. Fontes

- [W3C Design Tokens Community Group](https://www.designtokens.org/)
- [AGENTS.md](https://agents.md/); [Claude Code, memória e imports com `@`](https://docs.anthropic.com/en/docs/claude-code/memory)
- [ADR](https://adr.github.io/)
- Plugin `criacao-agentica` 0.12.0: skill `criacao-agentica` (`SKILL.md`, `references/modos.md`, `orquestracao.md`, `loop.md`, `verificacao.md`, `profundidade.md`, `adocao.md`, `references/modelos/`), skill `ca-dados` (`registros.md`, `camadas.md`, `seguranca.md`, `tenancy.md`, `invariantes.md`, `operacao.md`) e skill `ca-arquitetura` (`onde-vai.md`, `ciclo.md`, `manifesto.md`, `pontos.md`); hooks `delegacao.py`, `guarda.py` e `inicio.py`
