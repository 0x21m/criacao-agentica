<!-- Modelo da skill criacao-agentica. Copie para docs/01-prd.md e preencha.
Substitua os colchetes. Use [DESCONHECIDO] quando faltar informação e
[NÃO SE APLICA — motivo] quando o campo não fizer sentido. Preencha você mesmo
o que puder e marque [ASSUMIDO]; um contrato cheio de vazios devolve o trabalho. -->

# PRD — [produto]
O que é: Contrato do produto: o que será entregue, para quem e como verificar.
Governa: Problema, escopo, regras de negócio e aceite.
Não duplica: Detalhes de implementação.
Versão: [versão] | Estado: [rascunho/em revisão/vigente]
Responsável: [nome/papel] | Última atualização: [data]

## Contexto e resultado
Produto em uma frase: [quem consegue fazer o quê e com qual benefício]
Problema observado: [dor e evidência; distinguir hipótese de observação]
Solução atual: [como o público resolve hoje]
Público prioritário: [perfil, contexto, necessidade e restrições]
Objetivo desta versão: [mudança concreta desejada]
Métrica de sucesso: [nome, fórmula, unidade, fonte e período]
Referência atual: [valor ou [DESCONHECIDO]]
Meta: [valor e prazo ou hipótese a validar]

## Escopo
Incluído nesta versão: [capacidades]
Fora desta versão: [exclusões explícitas]
Restrições: [prazo, orçamento, operação e obrigações já confirmadas]

## Requisitos
REQ-[ID]: [comportamento esperado]
Usuário e benefício: [quem ganha o quê]
Prioridade e motivo: [essencial/importante/posterior + justificativa]
História: Como [papel], quero [ação], para [resultado].
Regras relacionadas: [RN-IDs]
Critérios relacionados: [CA-IDs]

## Regras de negócio
RN-[ID]: [condição, regra, exceções e resultado]

## Critérios de aceite
CA-[ID] — REQ-[ID]
Dado [estado inicial], quando [ação], então [resultado observável].
Verificador: [teste, comando, procedimento repetível ou "decisão do responsável"]
Incluir casos relevantes de falha, permissão e limite.

## Perguntas e lacunas
LAC-[ID] [marcador] [descrição]
Refs: [IDs] | Impacto: [bloqueia-tarefa TAR-IDs / bloqueia-futura / não-bloqueia]
Resolução: [pesquisa / protótipo / entrevista / tarefa manual]
Proposta: [recomendação] | Responsável: [quem decide] | Estado: [aberta/resolvida por DEC-ID ou ADR-NNNN]

## Histórico de mudanças
[data, decisão, motivo e documentos afetados]

<!-- Pronto para uso: é possível distinguir o que será entregue, o que não será entregue e como verificar o resultado. “Interface intuitiva” precisa ser traduzida em comportamentos ou critérios verificáveis. -->
