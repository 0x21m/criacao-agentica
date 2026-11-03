<!-- Modelo da skill criacao-agentica. Copie para docs/06-plano-implementacao.md.
O plano é o índice das entregas. Cada tarefa vive no próprio arquivo em
docs/tarefas/ (modelo tarefa.md), criado à mão ou pela skill to-tickets. -->

# Plano de implementação — [produto]
O que é: entregas da versão, em ordem, e as tarefas de cada uma.
Governa: a sequência e o escopo de cada entrega.
Não duplica: o conteúdo das tarefas nem os critérios (que vivem no PRD).
Baseline: [versões dos documentos e commit de referência, se houver]
Objetivo da versão: [resultado]

## Entrega: [nome — capacidade utilizável ou pré-requisito técnico]
Cobre: [REQ-IDs] | Critérios: [CA-IDs]
Dependências: [entregas, credenciais, decisões ou dados]
Riscos concretos: [risco e tratamento proporcional]
Preparação: [refatoração que torna a mudança fácil, se houver — feita antes, como TAR própria]
Tarefas:
- TAR-[NNN] — [título]
- TAR-[NNN] — [título]

## Fatiamento
Cada tarefa é uma bala traçadora: um caminho estreito mas completo por todas as camadas que a entrega usa, demonstrável ou verificável sozinho, do tamanho de uma sessão de contexto limpo. Uma refatoração larga (renomear coluna, mudar tipo compartilhado) não cabe numa fatia: sequencie como expand–contract. Primeiro acrescente a forma nova ao lado da antiga, depois migre em lotes, um TAR por lote, e por fim remova a antiga num TAR bloqueado por todos os lotes.

<!-- Pronto para uso: cada tarefa tem resultado verificável e cabe numa mudança revisável. "Criar todo o frontend" é grande demais; "concluir o fluxo de cadastro com seus estados" é um limite útil. -->
