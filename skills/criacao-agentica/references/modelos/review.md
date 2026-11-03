<!-- Modelo da skill criacao-agentica. Copie para REVIEW.md na raiz do projeto.
O modo Executar entrega este arquivo à ponytail-review e ao verificador; nenhum
dos dois o lê sozinho. Curto: o revisor o lê inteiro a cada revisão. -->

# Revisão — [produto]

## O que conta como falha aqui
[Uma linha por área, em termos do que dá errado para quem usa. Ex.: "agendamento: duas pessoas no mesmo horário"; "documentação: ela mente"; "configuração: aponta para o lugar errado".]

## Caminhos que sempre pedem uma pessoa
[auth, cobrança, migrações, CI, instalador, …] — risco alto, qualquer que seja o tamanho da mudança.

## Ignorar
[caminhos gerados, vendor, fixtures, …]

## Regras do revisor
- Cada achado cita arquivo e linha e um caso concreto. Palpite pelo nome não é achado.
- No máximo 3 achados "opcional" por revisão.
- Nomeie a classe do bug, para que todas as ocorrências sejam corrigidas de uma vez.
- Comece pela contagem: "N achados (X deve-corrigir)". Sem achados: diga "nada a corrigir".

## Já escapou
Cada bug que passou por uma TAR concluída entra aqui. O revisor procura cada um destes de novo.
- [data] [o que deu errado, em uma linha] — [onde morava] — [TAR que deixou passar] — teste: [nome do teste de regressão]
