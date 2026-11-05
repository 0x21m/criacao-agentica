# Operação: nada falha em silêncio

Uma garantia no banco impede o erro. Esta referência trata do que só se percebe depois: o job que parou, a fila que encheu, o backup que não roda. No PMD, o maior risco de um dia não estava no código: o backup estava parado havia uma semana porque os minutos do CI tinham acabado.

## Jobs e reações

- **Todo job lê a resposta do que chamou.** Um cron que dispara uma chamada HTTP e não lê o resultado fica verde enquanto e-mail e pagamento param.
- **Lote item a item.** Um item com erro não derruba o lote nem trava a fila: cada item tem a sua transação ou o seu savepoint, e o erro dele fica registrado.
- **Falhas seguidas acendem alerta** (por exemplo, 3 falhas seguidas do mesmo job).
- **Fila parada acende alerta**, mesmo com o cron verde: item mais velho que o prazo.
- **Dinheiro nunca fica parado sem alerta**: atrasado, em dobro, parcial, a mais ou sem destino aparece na fila de atenção. O prazo de cada alerta é decisão da pessoa; até ela decidir, o alerta acende no primeiro dia.
- **Nova tentativa tem fim**: depois de N tentativas o item vai para a atenção de uma pessoa, nunca fica "pedido" para sempre bloqueando os seguintes.
- **Credencial que vence** tem sonda e data de validade; a falha diz "credencial vencida", não um erro genérico.
- **Publicar** confere que o que está no ar bate com o que foi publicado; o host pode perder o aviso e deixar a versão velha sem erro.

## Verificações que precisam voltar vazias

O arquivo de verificações de consequência (`invariantes.md`, terceiro tipo) também é a conferência operacional:
- roda nos testes e no simulador sempre;
- em produção, só leitura, por um papel sem escrita, e só depois de a retenção dos dados lidos estar decidida;
- cada linha que voltar não vazia abre um item na fila de atenção, com a consulta e o registro.

## Entrega 0: base para operar

Antes do primeiro cliente real (níveis `mvp` com dados reais, `transacional` e `evolucao`), uma entrega própria, com prova:

| Item | Prova |
|---|---|
| Backup | Um backup de hoje, verde, e uma **restauração cronometrada** num ambiente isolado, com o tempo anotado. Backup que nunca foi restaurado não é recuperação |
| Monitor | Um monitor de fora avisa quando a porta de saúde ou o sistema param |
| Alertas | Job parado, fila parada e dinheiro sem destino acendem alerta para uma pessoa |
| Isolamento de ambiente | Um build ou script local nunca alcança o projeto real: a configuração local aponta para o ambiente local, e o script recusa endereço que não seja da máquina |
| Roteiro de incidente | Uma página: detectar, conter, revogar, erradicar, recuperar, revisar, com "ensaiado em" preenchido |
| Plano e custos | O plano do provedor tem backup e não pausa o projeto; o orçamento de CI cobre os jobs que a operação usa |

Se algum item não puder ser feito agora, ele vira uma LAC que bloqueia publicar para cliente real, nunca um silêncio.
