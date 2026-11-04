# Loop da entrega

Não se dá um prompt por TAR: projeta-se o loop que dá os prompts. Os documentos já trazem tudo o que um loop precisa:
- **estado:** o ESTADO e o git;
- **próxima entrada:** a fronteira do `checar.py`;
- **condição de parada:** os CA com verificador;
- **freios:** LAC, `[DESCONHECIDO]`, "Esperando o responsável" e o limite de 3 rodadas de revisão.

O que gira o loop é o `/goal` do Claude Code. Depois de cada turno, um modelo pequeno e separado lê a conversa e decide se a condição foi atendida; se não foi, o agente continua. Quem decide que acabou não é quem fez o trabalho.

## Quando a entrega tem forma de loop

- A entrega está especificada e auditada, e cada TAR do loop passa no gate de prontidão do Executar.
- Cada CA tem verificador que a máquina roda. Um CA que só se confere olhando entra no loop se o "olhar" já virou script ou skill de verificação (`verificacao.md`, "Checagem que se repete"). Se não virou, fica para a pessoa no relatório.
- Nenhuma TAR do loop depende de uma decisão de julgamento ainda aberta: arquitetura nova, regra de negócio `[DESCONHECIDO]` ou requisito ambíguo. Essas seguem turno a turno.
- O loop é **fechado**: caminho, checagens e parada são definidos antes. O loop aberto, com objetivo e guarda-corpos mas sem caminho definido, só serve para explorar, no nível `prototipo`.

## A condição

O avaliador **só lê a conversa**: não roda comando nem abre arquivo. Então toda prova precisa aparecer impressa, seja a saída dos verificadores, seja a do `checar.py`. Uma TAR concluída sem saída visível não conta. Monte a condição com a lista real de TAR e entregue-a pronta para a pessoa colar:

```
/goal Entrega <N> da criacao-agentica: TAR-<a>, TAR-<b>, TAR-<c>. Uma TAR por vez, na ordem da fronteira, siga o modo Executar tarefa da skill criacao-agentica (construa, verifique cada CA mostrando a saída do verificador, revise, registre a conclusão, atualize o ESTADO e faça commit). Ao fim de cada TAR, rode python <skill>/scripts/checar.py e mostre a saída. Pronto quando a saída do checar.py mostrar todas essas TAR como concluídas, sem problema "TAR-… está concluída…". Pare antes, explicando o motivo, se surgir LAC que bloqueia, item em Esperando o responsável que bloqueie as demais, ou TAR sem convergir depois de 3 rodadas de revisão. Não altere critério, nem teste de CA já concluído, sem registrar uma DEC. Pare após <T> turnos.
```

- **`<T>`:** comece com 3 turnos por TAR, mais 2. Ajuste pelo piloto.
- **Modo de permissão:** para o loop rodar sem a pessoa, ela liga o modo auto; você não liga. Os hooks do plugin continuam pedindo a confirmação dela para push e para commit ou merge na `main`.
- **TAR pequena construída na própria sessão** pode ter o seu `/goal`, com a mesma forma: os CA dela, as saídas visíveis e um teto curto.

## Freios

1. **Teto de turnos**, escrito na condição. É o freio que sempre vale.
2. **Sem progresso:** o `/goal` para sozinho quando o agente passa vários turnos sem usar ferramenta. Uma TAR que gasta duas voltas sem mudar o diff também para o loop.
3. **TAR que não converge** (3 rodadas de revisão, ou construtor que não deixa os CA verdes) sai do loop e volta para o Especificar, registrada em "Esperando o responsável". Muita tentativa é sintoma de especificação ruim, não de pouco esforço.
4. **Gasto:** o `/goal` sem argumento mostra turnos e tokens. Se o piloto custou mais do que a TAR vale, a entrega segue turno a turno.

## Piloto na primeira vez

Antes do primeiro loop num projeto, e antes do primeiro `/implement-spec`, rode uma TAR só com o seu `/goal`. Confira turnos, tokens e se a evidência saiu visível. Só então rode a entrega inteira. Lote é mais caro de errar do que unidade.

## Ao parar, por qualquer motivo

"Feito" é uma alegação, não uma prova, e código que ninguém leu vira dívida de compreensão. O relatório do loop usa o bloco de "Como relatar" do SKILL.md, mais:

```
Para ler: por TAR, os arquivos que mais mudaram e o trecho que merece os seus olhos
Assumi no loop: cada [ASSUMIDO] e DEC criados sem a pessoa
Parou por: condição atendida | freio <qual> | erro <qual>
```

Uma TAR por vez é o padrão. Paralelo, com o `/implement-spec`, só até onde a pessoa consegue revisar: quem limita o paralelismo é a revisão, não a ferramenta.
