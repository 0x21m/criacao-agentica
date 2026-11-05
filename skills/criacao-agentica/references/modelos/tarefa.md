<!-- Modelo da skill criacao-agentica. Uma tarefa por arquivo:
docs/tarefas/TAR-NNN-slug.md. É o "ticket" que to-tickets cria, implement lê
e o verificador usa como spec. Uma TAR é uma bala traçadora: atravessa todas as
camadas que precisa (dados, regra, interface, testes) e, concluída, pode ser
demonstrada ou verificada sozinha. Cabe numa sessão de contexto limpo.
Evite caminhos de arquivo e trechos de código: envelhecem rápido. -->

# TAR-[NNN] — [título: o comportamento entregue, em termos do glossário]
Estado: [a fazer/em execução/bloqueada/em revisão/concluída/integrada/publicada/descartada]
<!-- "bloqueada" é para quem espera uma LAC; quem espera outra TAR fica "a fazer" e o "Bloqueada por:" a segura.
"concluída" = critérios atendidos, revisada e registrada; libera as dependentes. A aprovação humana (risco médio ou alto) é para integrar. -->
Bloqueada por: [TAR-IDs e LAC-IDs que precisam fechar antes, ou "nada"]
Executor: [agente/pessoa]
Risco: [baixo/médio/alto] — [o que na mudança define o nível]
Entrega: [nome da entrega no plano]

## O que entrega
[o comportamento de ponta a ponta, do ponto de vista de quem usa; não uma lista por camada]

## Critérios de aceite
Implementa: CA-[ID], CA-[ID] (definidos no PRD)
Condições técnicas: [as pertinentes]

## Costuras de teste
[interfaces públicas onde os testes vão morar, a mais alta possível; o que cada uma pega e o que deixa passar.
Costura nova ou que muda a arquitetura → confirmar com o responsável.]

## Fontes
O que já existia e foi usado ou consultado antes de construir (ordem em `references/fontes.md` da skill):
- [skill, MCP, CLI, API ou URL] — [o que confirmou ou fez] — [data]
[ou: nada externo]

## Escopo
Muda: [o que muda]
Fora: [o que esta tarefa não toca]
Arquivos que pode tocar: [caminhos ou padrões; tocar fora reprova a revisão]
Fluxo existente a reutilizar: [fluxo, porta ou componente que já faz isto, ou "nenhum" depois de procurar]
Fecha: [INV, LAC ou achados que esta tarefa resolve]
Autonomia: [decisões que o executor pode tomar sozinho]
Recuperação: [como desfazer, se houver migração ou efeito difícil de reverter]

## Registro de conclusão
Preencher ao concluir, a partir do diff e das verificações rodadas, não da lembrança.
Mudanças: [resultado e arquivos relevantes]
Verificação:
- CA-[ID]: [atendido/não atendido/não verificável] — como: [comando, teste ou procedimento] — onde: [commit, ambiente] — [data]
Não verificado: [limitação e motivo]
Revisão: [ca-revisor / + ca-verificador / + security-review] — rodadas: [N]
Aprovação para integrar: [não exigida (risco baixo) / pendente / aprovada pelo responsável no commit X]
Achados:
- [deve-corrigir|deveria|opcional] [achado] — [corrigido | descartado: motivo | aberto]
Integração: [commit/PR/merge]
Publicação: [não publicada ou versão e ambiente]
Documentos atualizados: [referências]

## Comentários
[histórico em ordem: data — quem — o quê]
