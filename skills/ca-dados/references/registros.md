# Registros, dinheiro, tempo e numeração

## Os quatro registros

| Registro | Responde | Forma | Pode apagar? |
|---|---|---|---|
| **Audit log** | Quem mudou o quê, quando, de que valor para que valor | Linha por mudança, escrita por trigger ou pela função, nunca pela aplicação | Não. Dado pessoal entra como referência ou pseudônimo, para o apagamento não precisar editar a trilha |
| **Event log / outbox** | O que aconteceu, para outros módulos e integrações | Evento com id, tipo, agregado, versão do contrato e payload projetado, gravado na mesma transação do fato | Purga depois de consumido, com retenção declarada |
| **Ledger** | Movimentos que formam saldo (dinheiro, estoque, pontos, crédito) | Linhas só de inserção; saldo derivado | Não. Correção é movimento compensatório |
| **Diário contábil** | Lançamentos pelas regras contábeis | Projeção do ledger e dos documentos por regras versionadas | Não depois de postado |

Não guarde os quatro numa tabela genérica de eventos. Cada um tem dono, retenção e leitor diferentes.

## Ledger

- **Saldo derivado, nunca escrito à mão.** Se houver tabela de saldo (por desempenho), ela é atualizada na mesma transação do movimento e pode ser recalculada do zero; um teste compara as duas.
- **Movimento com conta, ativo ou moeda, quantidade em inteiro**, referência do documento de origem, data do fato e data do registro.
- **Correção por estorno** ligado ao original, um por original, com a data de efeito escolhida de propósito (a do original ou a atual; ambas existem nos ERPs).
- **Duas fases quando há reserva:** pendente → confirmado, anulado ou expirado. Resolve uma vez; captura parcial devolve a sobra; o limite é checado na reserva.
- **Validade por tempo** (pontos, créditos, lotes que vencem): cada entrada é um lote com data de vencimento; o consumo aloca lotes em ordem (FIFO) numa tabela de alocação só de inserção; um job gera o movimento de expiração do que sobrou do lote, com a data do vencimento como data do fato, idempotente por lote.
- **Limites na conta** (saldo mínimo e máximo) checados com lock da conta.
- **Conta muito disputada** (caixa central, contrapartida padrão) vira gargalo de lock: fragmente em várias contas e consolide na leitura.

## Documento com estado

O ciclo de vida do documento é descrito na skill `ca-arquitetura`. No banco ele vira:
- tabela de transições permitidas (estado de, estado para, quem pode) e trigger que recusa transição fora dela;
- histórico de estados só de inserção, com autor e instante;
- estado terminal protegido por trigger (`ENABLE ALWAYS`);
- documento espelho para correção, ligado nos dois sentidos.

## Dinheiro

- Inteiro na menor unidade, ou `numeric(p,s)` com escala declarada. A escala é escolhida com folga: trocá-la depois exige migrar todo o ledger.
- Toda quantia tem a moeda na mesma linha. Documento em moeda estrangeira guarda as duas quantias (moeda do documento e moeda da empresa) e a taxa usada.
- Taxa ausente para a data **falha**. Diferença de câmbio é movimento próprio, gerado pela liquidação.
- Arredondamento: a política (por linha ou global) e a precisão ficam gravadas no documento, para um documento antigo não mudar quando a configuração mudar. A diferença de centavos tem regra de distribuição determinística.
- Comparar quantias exige a mesma escala; nunca compare `float`.

## Tempo

- `timestamptz` para instantes; `date` para datas contábeis e fiscais.
- **Data do fato** (`efetivo_em`) e **data do registro** (`registrado_em`) separadas quando o sistema aceita registro atrasado ou retroativo. Bitemporal completo só onde corrigir o passado é rotina (folha, fiscal): é caro.
- **Valores congelados no ato:** preço, desconto, frete, tributo e taxa usados no documento ficam no documento. Mudar a tabela de preços não reescreve o passado.
- **Vigência** com `tstzrange` ou `daterange` e `EXCLUDE` contra sobreposição.

## Numeração legal

- A chave primária é técnica (UUID ou bigint). O número legal é outro campo, alocado por (empresa, série, ano ou modelo) numa tabela contadora, na mesma transação do documento.
- O número só nasce quando o documento é emitido ou postado, não no rascunho.
- Faixa inutilizada é registro com motivo e protocolo. Número nunca é reaproveitado.

## Períodos

- Três níveis: **aberto**, **fechado** (reversível, com motivo e autor) e **travado** (irreversível, só avança).
- Fechamento por tipo de documento quando o negócio pede (vendas fechadas, compras abertas).
- Exceção para escrever em período fechado é registro explícito, com autor, motivo e prazo.
- O trigger que checa o período **falha fechado**: período não encontrado é recusa.

## Idempotência

| Nível | Para quê | Como |
|---|---|---|
| Chave da tentativa | Repetir o mesmo pedido devolve a mesma resposta | Tabela de chaves com hash do pedido, resposta e validade; pedido diferente com a mesma chave é recusado |
| Referência de negócio | O mesmo fato não entra duas vezes | UNIQUE na referência externa (`provedor, id_externo`) ou natural |

- Chamada externa com resultado desconhecido (timeout) **não é falha**: o estado fica "não confirmado", e só se resolve consultando o provedor ou recebendo o evento. Nunca reenviar sozinho sem a mesma chave.
- Evento recebido é deduplicado pelo id do evento e processado na mesma transação do efeito.
