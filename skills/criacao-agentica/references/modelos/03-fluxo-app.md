<!-- Modelo da skill criacao-agentica. Copie para docs/03-fluxo-app.md e preencha.
Substitua os colchetes. Use [DESCONHECIDO] quando faltar informação e
[NÃO SE APLICA — motivo] quando o campo não fizer sentido. Preencha você mesmo
o que puder e marque [ASSUMIDO]; um contrato cheio de vazios devolve o trabalho. -->

# Fluxo do app — [produto]
O que é: Jornadas, telas, transições e estados observáveis.
Governa: Navegação e o contrato de cada ação.
Não duplica: Schema completo.
PRD de referência: [versão]

## Inventário de telas
Por tela: [nome canônico, rota quando aplicável, objetivo, papéis,
dados necessários, ações e estados]
Pontos de entrada: [URL, convite, busca, notificação ou outro]

## Objetos e projeção por ponta
Pontas e atores: [operador, cliente, parceiro, chat, notificações; quem usa cada uma]
Por objeto compartilhado: [nome canônico do GLOSSARY.md, relações e papéis]

| Eixo | Estado interno | Rótulo do operador | Frase do cliente (próxima ação) | Visível para | Notificação e canal | Operador pode suprimir? | Cor |
|---|---|---|---|---|---|---|---|
| [eixo] | `[_Código_]` | [rótulo] | "[frase]" ([ação]) | [pontas] | [evento · canal ou nenhuma] | [Sim/Não/—] | [token] |

Transições usadas pela tela: [citadas do 05 pelo código; o estado canônico e quem pode cada transição não se redefinem aqui]
Sem tela própria para o cliente: [NÃO SE APLICA — motivo]. Formato e exemplos: `assets/modelo-tabela-de-estados.md` da skill `ca-interface`.

## FLX-[ID] — [jornada]
Requisitos relacionados: [REQ-IDs]
Ator: [papel]
Pré-condições: [estado, autenticação, acesso e dados existentes]
Caminho principal: [entrada → ações → resultado]
Caminhos alternativos: [edição, cancelamento, retorno e recuperação]

## Contrato de cada ação
Ação: [nome]
Gatilho e entrada: [interação e dados]
Validação: [regra e local de aplicação]
Processamento: [operação e estado visível enquanto ocorre]
Sucesso: [feedback, dados alterados e destino]
Falha: [mensagem, dados preservados e forma de tentar novamente]
Repetição: [efeito de clique duplo/reenvio quando relevante]
Permissão negada: [comportamento]

## Estados transversais
[carregando, vazio, erro, sem permissão, indisponível e offline]
Para cada estado aplicável: [mensagem e próxima ação possível]
Navegação: [voltar, link direto, atualização de página e saída]
Primeiro uso: [onboarding mínimo ou [NÃO SE APLICA — motivo]]

## Perguntas e lacunas
LAC-[ID] [marcador] [descrição]
Refs: [IDs] | Impacto: [bloqueia-tarefa TAR-IDs / bloqueia-futura / não-bloqueia]
Resolução: [pesquisa / protótipo / entrevista / tarefa manual]
Proposta: [recomendação] | Responsável: [quem decide] | Estado: [aberta/resolvida por DEC-ID ou ADR-NNNN]

<!-- Pronto para uso: as ações relevantes têm destino e recuperação definidos. Estado offline não exige suporte offline completo; pode exigir apenas comunicação clara e preservação adequada do que foi digitado. -->
