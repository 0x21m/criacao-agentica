# Critérios de aceite e verificadores

Um critério é um resultado observável. O verificador é como outra pessoa confirma esse resultado sem confiar em quem construiu. Escreva os dois **antes** da mudança: critério escrito depois descreve o que foi feito e não pega o que foi feito errado.

## Formato

```
CA-007 — REQ-003
Dado [estado inicial], quando [ação], então [resultado observável].
Verificador: [teste, comando, procedimento repetível ou "decisão do responsável"]
```

Inclua os casos de falha, permissão e limite que importam, não só o caminho feliz.

## Fraco × forte

| Fraco | Por que falha | Forte |
|---|---|---|
| "O desconto funciona" | Ninguém consegue discordar | "Dado total 100,00 e cupom DEZ, o total do pedido é 90,00. Verificador: teste unitário `aplica cupom percentual`" |
| "A tela está bonita" | Gosto, não verificação | "Em 375 px não há texto cortado nem rolagem horizontal. Verificador: captura em 375/768/1280" |
| "Os testes passam" | Não diz nada sobre esta mudança | "O teste `recusa cupom vencido` falha antes da mudança e passa depois. Verificador: rodar nos dois commits" |
| "O botão chama `salvar()`" | Testa o seletor e morre quando a tela é reescrita | "Ao confirmar, o agendamento aparece na lista após recarregar. Verificador: teste da jornada pela rota" |
| "Interface intuitiva" | Adjetivo | "O caso comum se completa em até 3 interações a partir da tela inicial. Verificador: fluxo roteirizado que conta toques" |

## Escolhendo o verificador

Em ordem de preferência: um teste automatizado que já existe; um teste novo escrito primeiro; um comando cuja saída é inequívoca; um procedimento curto escrito para que outro agente o repita. Um critério que só você consegue julgar leva a marca `[julgado]`. É permitido, mas não vale como prova. Um critério que só o responsável pode julgar diz isso e fica com ele.

Por camada:

| Camada | Verificação adequada |
|---|---|
| Regras e cálculos | Testes determinísticos |
| Persistência e autorização | Testes de integração, incluindo usuário errado sendo recusado |
| Jornadas críticas | Ponta a ponta |
| Visual | Inspeção dos estados e tamanhos afetados |
| Concorrência | Teste com tentativas simultâneas |

Ajuste trivial não exige teste que só repete a implementação.

## Metas ditas de passagem

As metas mais importantes de um pedido costumam estar no contexto, não na lista chamada "critérios". Leia o pedido inteiro e transforme cada frase de meta em critério. Elas quase sempre descrevem uma experiência e pedem verificação de experiência:

| Frase | Critério | Verificador |
|---|---|---|
| "Registrar uma despesa em menos de 10 segundos" | Caso comum em até 3 interações | Fluxo roteirizado que conta toques e campos |
| "Ela tem pouca paciência com formulário" | Nenhum campo obrigatório além do valor | Teste de que salvar só com o valor funciona |
| "Sessões de 1 a 3 minutos" | Partida típica termina entre 60 e 180 s | Robô que joga por regra simples, várias sementes |

## De onde vêm os critérios

| Campo do documento | Vira |
|---|---|
| CA do PRD | Critérios da TAR, com teste escrito antes |
| Métrica de sucesso do PRD | Critério com verificação de experiência |
| "Fora desta versão" do PRD | Linha de fora de escopo de cada TAR |
| Estados do fluxo (carregando, vazio, erro, cancelado) | Testes da regra por trás de cada estado |
| Matriz de autorização do schema | Testes de recusa para o papel errado e para outro usuário ou equipe |
| Requisitos técnicos do TRD | Critérios com métrica, cenário e forma de medir |

## Quando o verificador não pode rodar

Diga "não verificável — motivo". Não troque em silêncio por uma verificação mais fraca e não declare a TAR concluída apoiado só nos outros critérios.
