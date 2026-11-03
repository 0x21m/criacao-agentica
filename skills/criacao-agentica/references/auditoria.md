# Auditoria de consistência

Rode antes de implementar uma entrega e depois de qualquer mudança de escopo. O objetivo é que cada funcionalidade especificada tenha um caminho de implementação, e cada tarefa tenha justificativa no escopo. Requisitos técnicos também justificam tarefas sem tela.

## Primeiro o mecânico

Rode `python <skill>/scripts/checar.py` na raiz do projeto. Ele encontra, sem julgamento:

- REQ sem nenhum CA;
- CA que nenhuma TAR implementa;
- referência a um ID que não foi definido;
- ID definido duas vezes;
- TAR concluída sem verificação registrada;
- termo marcado `_Evitar_` no `GLOSSARY.md` aparecendo nos documentos;
- TAR bloqueada por TAR ou LAC inexistente, e a fronteira resultante;
- LAC que bloqueia tarefa.

Corrija o que for mecânico antes de gastar raciocínio com o resto.

## Depois o semântico

Para a entrega em questão, cruze:

| Cruzamento | Exemplo de problema |
|---|---|
| Produto × fluxo | O PRD permite cancelar, mas nenhuma ação de cancelamento foi definida |
| Fluxo × dados | A tela mostra um prazo que não é armazenado nem calculado |
| Dados × autorização | Registros pertencem a equipes, mas o acesso depende só de login |
| UI/UX × fluxo | Há componente de erro, mas não há regra de recuperação |
| TRD × produto | A funcionalidade depende de uma API cuja capacidade está `[DESCONHECIDO]` |
| Plano × aceite | A TAR declara sucesso sem verificar o resultado para o usuário |
| Glossário × documentos | O mesmo estado aparece com nomes ou significados diferentes |
| Regra × concorrência | A RN diz "um por horário", mas nada impede duas reservas simultâneas |
| Fora de escopo × plano | Uma TAR implementa algo que o PRD pôs fora desta versão |

Pergunte também o que falta para construir **sem adivinhar**: cada adivinhação silenciosa vira retrabalho.

## Registro dos achados

O que é decisão do responsável vira uma LAC na seção "Perguntas e lacunas" do documento dono do assunto (ou no ESTADO, se cruzar vários ou não for de produto). O que você resolve na hora, por derivação ou escolha local reversível, vira uma linha `[ASSUMIDO]` ou uma DEC no documento dono, sem LAC:

```
LAC-012 [DESCONHECIDO] Fluxo × dados: a tela Agenda mostra "prazo", que não existe no schema.
Refs: FLX-002, entidade Agendamento
Impacto: bloqueia-tarefa TAR-005
Proposta: mostrar o prazo calculado a partir de horario.inicio, ou tirar o prazo da tela [PROPOSTO]
Responsável: responsável (o que a tela mostra) | Estado: aberta
```

Impactos: `bloqueia-tarefa` (cite as TAR), `bloqueia-futura` ou `não-bloqueia`.

Quem decide depende do tipo:

| Tipo | Quem resolve |
|---|---|
| Decisão de produto (escopo, regra, prioridade, o que o usuário vê) | Responsável |
| Derivação de domínio (consequência lógica do que já foi decidido) | Agente; registra |
| Decisão técnica local e reversível | Agente; registra |
| Decisão técnica estrutural (stack, provedor, topologia, modelo de dados) | Responsável, com recomendação |

Bloqueie só as TAR afetadas e mantenha o trabalho independente andando. Uma decisão posterior adotada explicitamente substitui a anterior e exige atualizar as referências. Código existente é evidência do comportamento atual, mas não prova sozinho que esse comportamento é o desejado.
