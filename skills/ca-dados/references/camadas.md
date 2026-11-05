# Camadas, definições e o bruto

Cada tabela declara a sua camada no manifesto do módulo (`camada:`). A camada decide as regras que a tabela segue e a trava que as garante.

| Camada | O que guarda | Regra | Trava |
|---|---|---|---|
| **Bruto** | O que aconteceu ou o que alguém declarou, inteiro: pagamento, evento, movimento, mensagem, aviso do provedor | Não se altera nem se apaga; corrigir é um registro novo | Trigger que recusa UPDATE, DELETE e TRUNCATE (`ENABLE ALWAYS`); um teste falha se surgir tabela bruta sem ele. Única exceção declarada: o apagamento de dado pessoal |
| **Estado** | Como cada coisa está agora (situação do pedido, do caso, da reserva) | Toda mudança de estado grava um evento bruto | Um teste falha se uma função mudar o estado sem gravar o evento |
| **Derivado** | Uma conta guardada para ganhar velocidade (saldo, total, contador) | Declara a função que o refaz a partir do bruto | Uma verificação compara o guardado com o recalculado e precisa voltar vazia |
| **Definição** | A fórmula versionada de cada conceito do negócio | Uma fórmula por conceito, montada a partir do bruto, nunca de outro derivado | Um teste falha se uma tela, relatório, planilha ou ferramenta de IA calcular o conceito por conta própria |

Tabelas de infraestrutura (outbox, inbox, chaves de idempotência, fila de atenção) não são bruto do negócio: são operacionais, com retenção e purga declaradas. A outbox e a fila de atenção são do núcleo; a inbox de cada consumidor é do módulo que consome.

## O catálogo de definições

O mesmo número calculado em vários lugares é o erro mais comum de um sistema que cresce. No PMD, uma venda aparecia com 6 números diferentes; havia 4 regras de "cliente que voltou", 4 relógios para "hoje" e 31 somas feitas nas telas, em 22 arquivos.

- Cada conceito (faturamento, recebido, a devolver, cliente, cliente que voltou, estoque baixo, atrasado, "hoje") tem **uma** função no banco, com versão, num catálogo.
- Telas, relatórios, exportações e IA leem só do catálogo.
- **O status derivado que o usuário vê é um conceito**, com uma função. Não é uma coluna que a tela lê e que pode ficar velha (o pedido marcado "Pago" depois de devolvido).
- O significado de cada conceito é decisão da pessoa (o que conta como venda, em que dia, com ou sem frete). Escreva a pergunta, não presuma a resposta.
- Mudar uma definição é mudança de versão: diga quais números do passado mudam.

## O contrato de leitura

Toda resposta de uma porta de leitura diz o que contém:
- o período e o fuso usados;
- a unidade;
- o que ficou de fora (dado de teste, demonstração, apagado);
- se foi cortada (paginação, limite).

"Hoje" é o dia do negócio, que o servidor manda em toda resposta, nunca o relógio do aparelho. Um teste de contrato confere as portas de leitura.

## O glossário

Uma casa só para os termos (por exemplo `glossario.csv`, que gera o `GLOSSARY.md`). Cada termo tem:
- o identificador no código e a palavra da tela;
- a definição e a unidade;
- a fonte (a tabela ou a função do catálogo);
- os sinônimos proibidos.

O vocabulário de cada cliente ("comanda" no lugar de "pedido") é um **apelido registrado** de um termo, nunca um termo novo. Um teste confere que o catálogo e o glossário têm os mesmos termos; outro varre telas, portas e ferramentas de IA atrás de sinônimos proibidos.

## Guardar o bruto original

O dado bruto que se perde não volta. Guarde:
- a **resposta inteira do provedor**, não só os campos extraídos;
- a **hora do provedor** ao lado da nossa;
- o **valor digitado** ao lado do normalizado (telefone, e-mail, documento);
- a **contagem** junto com a diferença (inventário);
- o que a pessoa digitou numa divisão ou ajuste, antes de redistribuir;
- a **mensagem bruta** intocada; lido, resultado e intenção vão para uma tabela de estado.

E um fato numa só tabela: o motivo fica no evento, o pedido lê o último; o endereço fica no pedido, a entrega lê de lá.

## Inventário de um sistema que já existe

Para adotar estas regras num código existente, leia em quatro passadas:
1. o que as pessoas digitam;
2. o que as máquinas mandam (provedores, webhooks, jobs);
3. a camada de cada tabela;
4. cada conceito, com todos os lugares que o calculam.

Os achados caem em quatro classes: um conceito com várias contas; o mesmo dado gravado duas vezes; o bruto que se perde; a entrada sem proteção contra repetição. Cada um entra numa lista de exceções que só diminui, e a trava da regra passa a valer para o que é novo.
