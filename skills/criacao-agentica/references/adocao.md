# Adotar o método num projeto existente

O projeto já tem código e não tem estes documentos. O erro comum é tentar documentar tudo de uma vez: gasta-se uma sessão inteira escrevendo descrição de código que ninguém vai ler. Documente o que existe só na medida em que a próxima mudança toca.

## Procedimento

0. **Pergunte antes de criar arquivos**, como no Iniciar: o diagnóstico é só leitura, e os documentos nascem depois de a pessoa confirmar o que você entendeu e o que pode fazer no git.
1. **Diagnóstico, só leitura.** Leia as instruções do projeto (`CLAUDE.md`, `AGENTS.md`, README), a estrutura, a stack, os scripts de build e teste, o estado do git e o que roda hoje. Código que cabe numa leitura você lê direto. Se for grande, o agente `ca-arqueologo` extrai as regras e a skill `ponytail-audit` mapeia riscos; não rode os dois num projeto pequeno, eles repetem o mesmo trabalho.
2. **Rode o que existe:** testes, build e, se houver, o app. Registre o que passa e o que falha **antes** de mudar qualquer coisa. Uma falha herdada é reportada como herdada, não como sua.
3. Depois da confirmação, **crie `GLOSSARY.md`** com os termos de domínio que o código já usa (`_Código_` com o identificador). Onde o código usa dois nomes para a mesma coisa, registre o canônico e o outro em `_Evitar_`. Não renomeie código sem pedido. O `docs/README.md` (índice e autonomia) nasce antes do primeiro commit; o `docs/agents/`, só se for usar `to-tickets`, `implement-spec` ou `wayfinder`.
4. **Registre o nível** `evolucao` como ADR-0001 (se a mudança passa a guardar dados de outras pessoas, a parte nova segue a matriz de `mvp`; ver `profundidade.md`) e crie `docs/ESTADO.md` com o diagnóstico e a primeira mudança pedida. Decisões de arquitetura já visíveis no código e surpreendentes sem contexto viram ADR com `[OBSERVADO]`, para ninguém "consertar" o que foi deliberado.
5. **Documente a fatia tocada:** para a mudança pedida, escreva no PRD e no fluxo o comportamento atual que ela afeta, marcado `[OBSERVADO]`, e o comportamento desejado, marcado conforme a origem. A diferença entre os dois é a especificação da mudança.
6. **Contratos a preservar:** liste no TRD o que não pode quebrar (APIs públicas, formatos de dados, rotas, integrações) e como verificar que continua funcionando.
7. Siga para o modo Especificar entrega.

## Projeto grande ou monorepo

Num código grande, o contexto se enche de instruções e leituras que não têm nada a ver com a tarefa. Isso custa tokens e piora o trabalho. No diagnóstico, ofereça à pessoa o que reduz o escopo. É configuração do projeto: cada item é uma decisão dela, e nenhum é imposto.

| Problema | O que oferecer (documentação oficial: code.claude.com/docs/en/large-codebases) |
|---|---|
| Um CLAUDE.md na raiz cobrindo todos os subsistemas | Um `CLAUDE.md` por diretório (pacote ou subsistema), cada um com só as convenções daquela área, e a raiz com o que vale em todo lugar |
| Leituras de código gerado, build ou de terceiros já versionado | Regras `Read(...)` em `permissions.deny` no `.claude/settings.json` |
| Achar definições e chamadas varrendo arquivos | Um plugin de code intelligence (LSP) da linguagem, do marketplace oficial (`references/fontes.md`: ferramenta pronta primeiro) |
| Worktree dos agentes copiando o repositório inteiro | `worktree.sparsePaths` com as pastas que a mudança toca, mais `.claude`, e `worktree.symlinkDirectories` para `node_modules` |
| Trabalho concentrado num pacote | Abrir a sessão no diretório do pacote; um pacote vizinho entra com `--add-dir` |

Uma mudança que atravessa pacotes fica numa sessão só e com o plano em arquivo: a TAR e o ESTADO sobrevivem à compactação, a conversa não.

## O que não fazer

- Não introduza uma árvore de documentos concorrente: se o projeto já tem `docs/` ou ADRs, adapte os caminhos ao que existe e registre o mapeamento no README.
- Não mova, renomeie nem reorganize arquivos da pessoa sem aprovação. Nada se perde num rearranjo, mas quem não acha mais as próprias coisas perdeu algo.
- Não trate `[OBSERVADO]` como requisito. Código prova o que acontece, não o que se queria que acontecesse. Comportamento estranho vira LAC para o responsável, não regra no PRD.
- Não proponha reescrita sem justificativa e autorização.
