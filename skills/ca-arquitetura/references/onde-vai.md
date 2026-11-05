# Onde vai o que é novo

Consulte antes de decidir. Se o caso não está aqui, registre a decisão como ADR.

| O que chega | Onde mora |
|---|---|
| Campo novo sobre algo que o próprio módulo é dono | Coluna na tabela dele, em expand–contract |
| Campo novo sobre registro de outro dono | Tabela satélite no módulo que precisa do campo |
| Estado novo de um documento | Valor no domínio de estados + transições na tabela de transições + função de transição |
| Regra que pode impedir uma operação de outro módulo | Resposta em modo invariante ao ponto do dono |
| Algo que deve acontecer depois de um fato | Resposta em modo reação, ou consumidor de evento |
| Número de relatório ou indicador | Consulta ou view; materializada só se medir lentidão |
| Módulo que contribui com valor no documento de outro dono (desconto, taxa, frete) | O dono oferece um ponto de ajuste; o documento guarda a linha de ajuste com o módulo de origem e o valor congelado |
| Integração com serviço externo | Adapter num módulo próprio |
| Dependência entre dois módulos opcionais | Ponte |
| Variação por país, segmento ou cliente | Configuração ou dado do módulo, ou módulo condicionado ao contexto; nunca bifurcação do núcleo |
| Dado que a IA precisa ler | Projeção de leitura com a permissão do usuário (ver `ca-dados`, `seguranca.md`) |
| Ação que a IA quer fazer | Proposta pendente que passa pela porta do dono quando aprovada |
| Saldo ou total | Derivado de movimentos; tabela de saldo só como cache recalculável |
| Correção de algo já postado | Documento ou movimento compensatório ligado ao original |
| Cadastro usado por vários módulos | Dado mestre com um dono; os outros referenciam pelo id |

## Escada de padrões

Suba um degrau só quando o de baixo se esgotou de fato (medido, não imaginado):

0. Transação local + constraints + agregados pequenos.
1. Módulos com fronteira e glossário; esquema por módulo.
2. Idempotência natural (upsert pela chave de negócio), retry com backoff e timeout.
3. Estorno e trilha só de inserção, em vez de transação compensatória ou event sourcing.
4. Leitura: índices, views, modelo de leitura no mesmo banco, view materializada.
5. Assíncrono interno: fila em tabela + worker; depois consumidores concorrentes.
6. Adapter como módulo; circuit breaker e isolamento nas dependências externas.
7. Outbox e inbox (só quando algo sai do banco).
8. Broker dedicado, fila de mensagens mortas.
9. Saga orquestrada (máquina de estados em tabela) com compensação, só ao cruzar bancos ou sistemas.
10. Saga coreografada, strangler fig, CQRS com bancos separados.
11. Event sourcing, só num subdomínio do tipo ledger.

"Para a maioria dos sistemas e das partes de um sistema", CRUD com boas constraints basta (Microsoft, sobre event sourcing).
