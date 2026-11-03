<!-- Modelo da skill criacao-agentica. Copie para docs/05-schema-backend.md e preencha.
Substitua os colchetes. Use [DESCONHECIDO] quando faltar informação e
[NÃO SE APLICA — motivo] quando o campo não fizer sentido. Preencha você mesmo
o que puder e marque [ASSUMIDO]; um contrato cheio de vazios devolve o trabalho. -->

# Schema do backend — [produto]
O que é: Dados que existem, quem pode operá-los e seu ciclo de vida.
Governa: Modelo de dados, invariantes, autorização e retenção.
Não duplica: Jornada visual completa.
PRD e TRD de referência: [versões]

## Minimização
Dados necessários: [dado, finalidade e motivo para persistir]
Dados que não serão armazenados: [lista e responsabilidade de terceiros]
Dados temporários ou apenas locais: [lista e ciclo de vida]

## Entidades
Nome canônico: [nome]
Finalidade e proprietário: [significado e usuário/equipe responsável]
Campos: [nome, tipo, obrigatório, padrão e validação]
Identificador e relações: [chaves e cardinalidade]
Restrições: [unicidade, integridade e invariantes]
Índices: [consulta atendida e motivo]
Estados e transições: [referência às regras de negócio]

## Matriz de autorização
Para cada entidade e papel:
[ler, criar, alterar, excluir + condição por registro/campo]
Negação padrão: [como operações sem regra são recusadas]
Aplicação: [servidor/banco e mecanismos utilizados]
Isolamento: [como usuário/equipe não acessa registros de outro]

## Operações e contratos
Por operação: [ator, entrada, validação, efeito, saída e erros]
Transação/concorrência: [invariantes e proteção quando aplicável]
Reenvio seguro: [estratégia para operações sujeitas a duplicação]

## Ciclo de vida
Retenção: [prazo ou regra, fundamento confirmado e responsável]
Exclusão e exportação: [escopo e limitações]
Backup: [referência ao TRD e efeitos sobre exclusão]
Auditoria: [eventos necessários e dados omitidos]

## Evolução
Migrações: [ordem, compatibilidade, validação e recuperação]
Dados iniciais: [dados sintéticos de desenvolvimento e dados de produção]
Testes de acesso: [casos permitidos, negados e entre usuários/equipes]

## Perguntas e lacunas
LAC-[ID] [marcador] [descrição]
Refs: [IDs] | Impacto: [bloqueia-tarefa TAR-IDs / bloqueia-futura / não-bloqueia]
Resolução: [pesquisa / protótipo / entrevista / tarefa manual]
Proposta: [recomendação] | Responsável: [quem decide] | Estado: [aberta/resolvida por DEC-ID ou ADR-NNNN]

<!-- Pronto para uso: as regras podem ser implementadas e verificadas no servidor ou banco. Ocultar um botão não implementa autorização. Este documento contribui para a segurança; não a garante isoladamente. -->
