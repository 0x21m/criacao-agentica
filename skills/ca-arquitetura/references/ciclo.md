# Ciclo de vida do módulo

## Os quatro estados

| Estado | Dados | Portas | Leituras de outros módulos |
|---|---|---|---|
| **Ausente** | Não existem | Não existem | Resposta na ausência |
| **Ligado** | Existem | Funcionam | Normais |
| **Desligado com dados** | Ficam | Recusam com `MODULO_INDISPONIVEL` | Resposta na ausência; os dados continuam para histórico e retenção |
| **Removido** | Arquivados por id, recuperáveis | Não existem; EXECUTE revogado | Resposta na ausência |

- Os níveis de desligamento do manifesto são graus entre ligado e removido: **ocultar** (ligado, sem tela), **negar poder** (ligado, portas de escrita recusam), **desligar** (desligado com dados), **remover**.
- A primeira instrução de toda porta de escrita de um opcional é o **portão** (`modulo_portao('estoque')`), que recusa se o módulo não está ligado.
- **Remoção é recusada enquanto houver trabalho aberto** (reserva pendente, documento em rascunho, fila não vazia), com o código `MODULO_TRABALHO_ABERTO` e a lista do que falta.
- Desligar ou remover nunca apaga dado que a retenção exige guardar (fiscal, contábil). O fluxo mínimo do núcleo (vender, receber, apagar dado pessoal a pedido) continua funcionando em qualquer estado dos opcionais.
- A porta de apagamento de dado pessoal (eraser) funciona em qualquer estado: o portão não se aplica a ela.
- Eventos destinados a um módulo desligado ficam **retidos**, nunca descartados; ao religar, o consumidor retoma do cursor. Remover exige a fila vazia ou o descarte declarado e registrado.
- Ao religar, o backfill roda de novo (é idempotente). Se a regra do negócio pede cobrir o período desligado (pontos de pedidos pagos nesse intervalo), isso é uma regra decidida pela pessoa, não um efeito colateral.
- Desativar é recusado se outro módulo ligado depende deste.
- A resposta na ausência vale também para **reação com obrigação** (`pontos.md`): declare no manifesto quem cumpre a obrigação quando o módulo está desligado.
- **Matriz de composição.** Gerada do registro de módulos: cada módulo em cada estado, e o fluxo crítico rodando em cada célula. Um módulo novo entra na matriz sozinho.
- **Teste gêmeo.** A mesma operação do núcleo (a mesma venda) roda com e sem os opcionais; o resultado do núcleo é o mesmo. Se diferir, o núcleo depende de um opcional.

## Ponte

- Uma ponte junta dois (ou mais) módulos nomeados e só existe quando todos estão ligados.
- Ela não tem estado próprio além do necessário para ligar os dois; o que pertence a um dos lados fica nele.
- Ligar o segundo módulo instala a ponte; desligar qualquer um desliga a ponte.
- A ponte responde a pontos dos dois lados; não sobrescreve nada deles.

## Instalação condicionada ao contexto

O manifesto pode declarar `instala_quando` (país, segmento, plano). Exemplo: a localização fiscal brasileira entra quando a empresa é do Brasil. A condição é dado, avaliada na instalação e registrada.

## Instalar sobre dados que já existem

- Ligar um módulo pode exigir backfill (criar saldos a partir dos movimentos, gerar documentos para pedidos abertos). Ele é **declarado** no manifesto, **idempotente** e **testado** sobre um banco com dados.
- Nunca código livre que roda uma vez e some.

## Atualizar

Migração em três fases (detalhe na `ca-dados`, `evolucao.md`):
1. **antes** de o módulo atualizar o schema;
2. **depois** de atualizar (backfill, recálculo);
3. **fim**, depois que todos os módulos atualizaram, para o que depende de outro módulo (pontes).

Cada migração pertence a um módulo e só toca tabelas dele.
