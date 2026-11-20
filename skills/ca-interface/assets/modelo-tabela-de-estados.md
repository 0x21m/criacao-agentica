# Modelo de tabela de estados

Uma tabela de projeção por objeto compartilhado. Ela é o contrato de cada ponta: o protótipo mostra cada linha, a bancada percorre cada linha e a revisão aponta a linha violada. Salve no projeto como uma seção do objeto em `docs/03-fluxo-app.md` (DOC-03).

Como preencher:

- **Estado interno** é o valor canônico no banco, um por eixo, citado pelo `_Código_` do `GLOSSARY.md`. Ele é definido no `docs/05-schema-backend.md` pela `ca-dados`; esta tabela não o redefine. Objetos com eixos paralelos (ciclo, pagamento, entrega) têm uma linha por estado de cada eixo.
- **Rótulo do operador** pode ser técnico e carregar detalhe (motivo, prazo, número).
- **Frase do cliente** diz o resultado em linguagem simples, com data quando houver, e a próxima ação entre parênteses. Vários estados internos podem dar a mesma frase.
- **Visível para** lista as pontas. O payload de quem não está na lista não leva o dado.
- **Notificação e canal** nasce do evento de mudança de estado. Um canal principal por evento; e-mail costuma ser o registro.
- **Operador pode suprimir?** Sim (no momento da ação ou por configuração), Não, ou travessão quando não há notificação.
- **Cor** é o token semântico do estado, igual em todas as pontas mesmo quando o rótulo muda.

As **transições válidas** (de qual estado, por qual ação, de quem, para qual estado) são canônicas no `05` e no banco, donos da `ca-dados`: ao lado da tabela, cite as que a tela usa. Sozinha, sem `05`, registre o trecho abaixo marcado `[PROPOSTO]`, como insumo para ele. Transição de objeto compartilhado é validada no servidor contra a versão atual; não é otimista.

Os exemplos abaixo são ilustrativos. Troque estados, prazos e canais pelos do seu negócio.

---

## Exemplo 1 · Ordem de serviço (assistência técnica)

Eixos: ciclo da OS e orçamento.

| Eixo | Estado interno | Rótulo do operador | Frase do cliente (próxima ação) | Visível para | Notificação e canal | Operador pode suprimir? | Cor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ciclo | `aberta` | Aberta · aguardando triagem | "Recebemos seu aparelho" (Acompanhar) | cliente, atendente, técnico | Recebimento · WhatsApp utility + e-mail com o número da OS | Não | neutro |
| ciclo | `em_diagnostico` | Em diagnóstico · técnico Ana | "Estamos avaliando o aparelho. Orçamento até sex, 22/11" | cliente, atendente, técnico | nenhuma | — | info |
| orçamento | `orcamento_enviado` | Orçamento enviado R$ 420,00 · vence 29/11 | "Seu orçamento está pronto: R$ 420,00" (Aprovar ou Recusar) | cliente, atendente | Orçamento · WhatsApp utility com botões "Ver orçamento" | Não | aviso |
| orçamento | `orcamento_aprovado` | Aprovado pelo cliente 23/11 10:14 | "Orçamento aprovado. Conserto previsto para ter, 26/11" | cliente, atendente, técnico | Confirmação · e-mail | Sim, no momento da ação | sucesso |
| orçamento | `orcamento_recusado` | Recusado · devolver sem conserto | "Você recusou o orçamento. Retire o aparelho até 06/12" (Ver endereço) | cliente, atendente | Instruções · e-mail + WhatsApp utility | Não | neutro |
| ciclo | `aguardando_peca` | Aguardando peça · pedido F-2231 · previsão 02/12 | "Aguardando uma peça. Nova previsão: seg, 02/12" | cliente, atendente, técnico | Atraso · WhatsApp utility, só se passar da data prometida | Sim, por configuração | aviso |
| ciclo | `em_reparo` | Em reparo · técnico Ana | "Conserto em andamento" | cliente, atendente, técnico | nenhuma | — | info |
| ciclo | `em_teste` | Em teste de qualidade | "Conserto em andamento" (sem mudança para o cliente) | atendente, técnico | nenhuma | — | info |
| ciclo | `pronta_retirada` | Pronta · aguardando retirada desde 27/11 | "Pronto para retirar até 11/12" (Ver endereço e horário) | cliente, atendente | Pronto · WhatsApp utility + push | Não | sucesso |
| ciclo | `entregue` | Entregue 28/11 16:40 · assinatura | "Aparelho retirado em 28/11. Garantia até 28/02" (Avaliar) | cliente, atendente | Recibo · e-mail | Sim, por configuração | neutro |
| ciclo | `cancelada` | Cancelada pelo cliente · motivo | "OS cancelada. Retire o aparelho até 06/12" | cliente, atendente | Cancelamento · e-mail | Sim, no momento da ação | neutro |

Transições válidas (trecho):

| De | Ação | Quem | Para |
| --- | --- | --- | --- |
| `em_diagnostico` | Enviar orçamento | técnico, atendente | `orcamento_enviado` |
| `orcamento_enviado` | Aprovar | cliente, atendente em nome do cliente | `orcamento_aprovado` |
| `orcamento_enviado` | Recusar | cliente, atendente em nome do cliente | `orcamento_recusado` |
| `orcamento_aprovado` | Iniciar reparo | técnico | `em_reparo` ou `aguardando_peca` |
| qualquer antes de `em_reparo` | Cancelar | cliente, atendente | `cancelada` |
| `em_reparo` em diante | Cancelar | ninguém; vira "Pedir para falar com a loja" no lado do cliente | — |

---

## Exemplo 2 · Pedido de loja online

Eixos: pagamento, entrega e ciclo.

| Eixo | Estado interno | Rótulo do operador | Frase do cliente (próxima ação) | Visível para | Notificação e canal | Operador pode suprimir? | Cor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pagamento | `aguardando_pagamento` | Aguardando Pix (expira 14:32) | "Pague com Pix até 14:32" (Copiar código Pix) | cliente, operador | nenhuma; a tela aberta atualiza sozinha | — | aviso |
| pagamento | `em_analise` | Em análise antifraude · score 0,71 | "Pagamento em confirmação" | cliente (só a frase), operador (motivo e score) | nenhuma | — | info |
| pagamento | `pago` | Pago | "Pedido confirmado" (Acompanhar pedido) | todos | Confirmação · e-mail + push ou WhatsApp utility | Não | sucesso |
| entrega | `em_separacao` | Em separação · NF 12345 | "Preparando seu pedido · chega até qui, 21/11" | cliente, operador | nenhuma | — | info |
| entrega | `em_transito` | Coletado · Transportadora X · BR123 | "A caminho · chega até qui, 21/11" (Rastrear) | cliente, operador, transportadora | Enviado · push ou WhatsApp utility com link do pedido | Sim, no momento da ação | info |
| entrega | `tentativa_falhou` | Tentativa 1 falhou (ausente) | "Não conseguimos entregar" (Reagendar) | cliente, operador, entregador | Exceção · push + WhatsApp utility | Não | perigo |
| entrega | `entregue` | Entregue 15:02 · foto | "Entregue hoje às 15:02" (Avaliar ou Pedir ajuda) | todos | Entregue · push | Sim, por configuração | sucesso |
| ciclo | `cancelado` + pagamento `reembolso_em_processamento` | Cancelado · reembolso pendente | "Pedido cancelado. Reembolso no Pix em até 3 dias úteis" | cliente, operador | Cancelamento · e-mail + push | Sim, no momento da ação | neutro |

Transições válidas (trecho):

| De | Ação | Quem | Para |
| --- | --- | --- | --- |
| `pago` até `em_separacao` | Cancelar | cliente, operador | `cancelado` |
| `em_transito` em diante | Cancelar | ninguém; vira "Solicitar devolução" | `devolucao_solicitada` |
| `tentativa_falhou` | Reagendar | cliente | `em_transito` |

Regras que esta tabela garante:

- A timeline do cliente segue a mesma ordem da do operador, com menos detalhe.
- O operador vê, ao lado do estado interno, a frase que o cliente está lendo.
- Cancelado com reembolso pendente usa cor neutra, nunca a de erro.
- Score e motivo de antifraude nunca entram no payload do cliente.
