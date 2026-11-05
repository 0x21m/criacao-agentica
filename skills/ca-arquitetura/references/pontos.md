# Como um módulo fala com outro

## Os caminhos permitidos

| Caminho | Quando | Garantia |
|---|---|---|
| **Porta** do dono | Escrever no domínio de outro módulo | Função transacional do dono, com permissão checada dentro |
| **Interface** do dono | Ler ou calcular algo do outro, ou executar um passo que outra porta pediu | Função privada, sem grant para papéis de aplicação; o poder já foi checado na porta de entrada |
| **Ponto em modo invariante** | O outro módulo pode vetar a operação (a venda não sai sem estoque) | Roda dentro da mesma transação; recusa desfaz tudo |
| **Ponto em modo reação** | O outro módulo reage ao fato, mas não pode impedi-lo (dar pontos de fidelidade) | Roda depois do commit, por outbox; falha é registrada e reprocessada, não desfaz o fato |
| **Ponto em modo consulta** | O outro módulo contribui com uma informação para uma leitura do dono (o saldo de pontos na tela do pedido) | Leitura pura, sem escrita, com a permissão do usuário; o dono reúne as respostas dos módulos ligados e a tela mostra o que vier, omitindo o "ausente" |
| **Evento publicado** | Integração, IA, analítico, qualquer consumidor futuro | Gravado no outbox na mesma transação; consumidor idempotente |

Leitura direta de tabela de outro dono é proibida, salvo o que o manifesto do núcleo publica como leitura comum.

## Pontos

- O dono oferece o ponto (`pontos_oferecidos`), com contrato versionado.
- Os módulos respondem (`respostas`), declarando o modo.
- Só conta a resposta de módulo ligado; módulo ausente ou desligado é tratado pela resposta na ausência.
- **Duas realizações de reação**, que o manifesto declara:
  - **depois do commit, por outbox**, com nova tentativa e fila de atenção: o padrão;
  - **na mesma transação, num savepoint**, sem nova tentativa: o fato e a reação ficam atômicos, mas a falha se perde (no PMD, prêmios de fidelidade e avisos perdidos). Só é permitida quando a reação não tem efeito externo e não carrega obrigação, e a falha dela entra na fila de atenção.
- **Reação que carrega uma obrigação** (abrir o caso de devolução, devolver estoque, avisar o cliente) não pode sumir quando o módulo que reage está desligado. Ou o núcleo cumpre a obrigação por conta própria, ou o fato é recusado enquanto ninguém pode cumpri-la. Cumprir por conta própria quer dizer: o núcleo registra a obrigação como estado dele ("devolução devida"), na mesma transação do fato, visível numa tela do núcleo e coberta por uma verificação com alerta; o módulo opcional só acrescenta a superfície de atendimento. No PMD, com o pós-venda desligado, um pedido pago fechado como não concluído não abriu caso e o dinheiro ficou no limbo.
- Uma reação nunca fura uma invariante, nem a do próprio módulo. Se a reação esbarraria numa (estorno de pontos que já foram gastos deixaria saldo negativo), ela registra a pendência e segue a política escrita para esse caso: permitir o negativo declarado, absorver ou mandar para uma pessoa. A política é uma regra de negócio (RN) decidida pela pessoa.
- Invariante é para o que **não pode** acontecer; reação é para o que **deve acontecer depois**. Na dúvida, reação: invariante demais deixa a transação lenta e frágil.

## Outbox e consumidores

- O evento é gravado na tabela de outbox na mesma transação do fato, só com as chaves declaradas no contrato.
- Um relay (job, fila, worker) entrega depois do commit. Pode entregar mais de uma vez: todo consumidor deduplica pelo id do evento e aplica o efeito na mesma transação.
- A outbox e o audit log são infraestrutura do núcleo, que é o dono deles. A tabela de deduplicação (inbox) é de cada módulo consumidor.
- A outbox tem retenção declarada e purga do que foi consumido.
- Um consumidor que falha não desfaz o fato; reprocessa do cursor.

## Tabela satélite

Quando um módulo precisa guardar algo sobre o registro de outro dono (o módulo de fidelidade guarda o nível do cliente):
- tabela do módulo que guarda, com a chave do registro do outro (`cliente_id`) e FK;
- o dono original não sabe que a satélite existe;
- coerência com outros campos do registro do dono ("a reserva é do mesmo cliente do pedido") se garante por trigger da satélite que lê o registro do dono, sem alterar a tabela dele;
- desligar o módulo deixa a satélite intacta; removê-lo a arquiva.

## Integração com o mundo externo

- Cada provedor (pagamento, mensageria, transportadora, sensor, banco, órgão fiscal) fica num **adapter**, o único lugar que conhece endereço, formato e segredo dele.
- O adapter declara capacidades; o que não oferece devolve `NAO_SUPORTADO`.
- Um provedor simulado passa na mesma suíte de testes que o real.
- Entrada externa é autenticada sobre o corpo bruto antes de qualquer leitura, guardada uma vez pelo id do provedor e reconciliada consultando o provedor; o payload externo nunca move dado crítico sozinho.
- Resultado desconhecido não é falha (ver `ca-dados`, `registros.md`).
