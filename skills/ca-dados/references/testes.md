# Testes de garantia

Uma invariante só passa de `[DECLARADO]` para `[TESTADO]` quando um teste tenta violá-la e falha pelo motivo certo.

## Como testar

- **Com o papel real.** Em Supabase, pgTAP (`supabase test db`) com `set local role authenticated` e `set local request.jwt.claims` do usuário de teste. Testar como `postgres` não prova nada sobre RLS.
- **Casos negativos sempre.** Para cada caso permitido, um negado: outro usuário, outro tenant, outro estado, sem segundo fator, sem poder.
- **Teste de classe, não de exemplo.** Gere as entradas inválidas a partir da regra (nulo, vazio, negativo, tipo errado, fora do domínio, limite exato) em vez de um exemplo escolhido.
- **Concorrência de verdade.** Duas conexões ao mesmo tempo, não duas chamadas em sequência. Em PGlite ou banco em memória a concorrência real não é provada: rode no Postgres.
- **Mutação.** Desligue a garantia (remova o trigger, afrouxe o CHECK) e veja o teste falhar; restaure. Teste que sobrevive à remoção da garantia não prova nada.

## Testes que o projeto gera, não escreve à mão

- **Por classe, a partir dos registros.** Do catálogo de definições, do mapa de donos e da lista de tabelas brutas saem os testes: toda tabela bruta recusa UPDATE, toda função que muda estado grava evento, todo conceito do catálogo tem um só lugar que o calcula. Cada teste gerado é provado com um defeito plantado.
- **Verificações vazias** (`invariantes.md`, terceiro tipo): cada consulta acende quando o defeito é forçado.
- **Apagamento com marcador.** Um titular de teste recebe um valor marcador em todos os campos pessoais; depois do eraser, uma busca pelo marcador em todo o banco (inclusive índices, embeddings e cópias) precisa voltar vazia.
- **Ensaio de atualização.** O banco de ontem, com dados, recebe as migrations de hoje e passa nos testes; o código de ontem contra o schema expandido continua funcionando.
- **Backup ida e volta.** O backup é restaurado num ambiente isolado e as verificações vazias passam nele.

## Testes adversariais de referência

Escolha os que se aplicam à entrega. Cada um define pré-condição, dados sintéticos, entrada, resultado esperado e limpeza.

| ID | Experimento | Invariante |
|---|---|---|
| T01 | Duas vendas simultâneas com estoque para uma | Não vender mais que o existente |
| T02 | Evento externo duplicado, atrasado ou fora de ordem | Idempotência e transições válidas |
| T03 | Cobrança aprovada sem liquidação | Distinguir confirmação do provedor, dinheiro efetivo e conciliação |
| T04 | Reembolso parcial depois de cobrança e estoque movimentados | Preservar histórico e saldos com compensação |
| T05 | Falha entre o commit e a publicação externa | Nada perdido nem duplicado (outbox) |
| T06 | Repetir comando depois de timeout | Sem operação duplicada |
| T07 | Usuário de papel inferior ou de outro tenant | Sem leitura nem escrita não autorizada, inclusive por bypass |
| T08 | Módulo opcional desligado durante a operação | O fluxo mínimo continua íntegro |
| T09 | Banco reconstruído do zero comparado ao atual | Reprodutibilidade de funções, políticas e constraints |
| T10 | Código antigo contra schema expandido | Compatibilidade e rollback |
| T11 | Backup restaurado em ambiente isolado | Recuperação real |
| T12 | Mudança de preço ou tributo depois do documento | Fato histórico não é reescrito |
| T13 | Evento externo com assinatura inválida ou fora do contrato | Fronteira de confiança |
| T14 | Mesma entidade com códigos de provedor diferentes | Identidade e unicidade |
| T15 | Edição em período fechado | Recusa ou ajuste pela política, com trilha |
| T16 | Apagamento de dado pessoal com trilha imutável | Anonimização sem editar a trilha |
| T17 | Duas atualizações concorrentes do mesmo registro | Sem atualização perdida |
| T18 | Provedor indisponível ou sem confirmação | Timeout, retry controlado, reconciliação |

Fonte: prompt-mestre de extração arquitetural do PMD, adaptado.
