# Verificação

Quem constrói avalia o próprio trabalho com boa vontade: sabe o que quis fazer e lê o que quis fazer. Por isso a verificação tem duas camadas, a sua e, quando o risco pede, a de quem não fez o trabalho.

## Na profundidade que o momento pede

| Quando | O que roda |
|---|---|
| Depois de cada edição | A checagem rápida do arquivo tocado (tipos, lint, teste do módulo) |
| Ao fechar uma TAR | Os testes afetados e o verificador de cada CA |
| Antes de integrar | Um comando só: suíte completa, build, `checar.py`, nenhum segredo. Uma checagem pesada roda uma vez por estado de código |
| Ao fim de uma entrega ou versão | O produto inteiro, percorrido e olhado |
| Quando o responsável decidir | Auditoria de segurança ou desempenho |

## Verificação própria

1. Rode cada verificador como escrito e registre: atendido, não atendido ou não verificável.
2. **Confira o que mudou, não só que a sua mudança está lá.** Leia o diff inteiro: ferramentas reescrevem arquivos (finais de linha, aspas, ordem) quando você edita uma linha só.
3. **Tente quebrar a própria prova.** Para os critérios que importam, devolva o defeito de propósito (reverta a linha, inverta a condição) e veja o teste falhar. Teste que sobrevive ao próprio defeito não prova nada. Restaure o código depois.
4. Duas verificações verdes não são uma suíte verde. Rode o que existe completo e inclua casos que deveriam falhar.
5. **Olhe.** O que tem tela é capturado em cada estado afetado, em largura de celular e de desktop, e lido como a pessoa leria. Procure `undefined`, `null`, `NaN`, `[object Object]` e `Invalid Date` no texto visível. O navegador é compartilhado entre sessões e agentes: abra uma aba própria, confira a origem (endereço e porta) antes de digitar ou clicar, e comece com o armazenamento do site limpo. Use dados de teste que você mesmo criou.
6. **Teste que pode derrubar ou travar o processo** (o vermelho de "o servidor cai") roda com tempo limite (`timeout 60 …`) ou em processo filho, para não pendurar a sessão.

## Checagem que se repete vira verificador do projeto

Na segunda vez que você repetir a mesma checagem à mão, transforme-a em verificador. Exemplos: abrir a tela, clicar no controle novo, ler o console, medir o tempo. Proponha à pessoa em uma linha e crie no "sim". Na ordem da escada:
1. **Teste ou script** (`scripts/verificar-<assunto>`), quando a checagem é determinística. É o mais barato de rodar e o único que um loop roda sem julgamento.
2. **Skill do projeto** (`.claude/skills/verificar-<assunto>/SKILL.md`), quando a checagem precisa de olho: passos numerados, o que capturar e o que conta como falha.

O verificador passa a ser citado nos CA que ele cobre. Uma regra vale para os dois formatos: se um passo falha, corrija e rode tudo de novo **desde o passo 1**. Verificação pela metade não se entrega.

## Revisão pelo nível de risco

O risco vem da mudança, não de quem a escreveu, e fica no campo `Risco:` da TAR. Na dúvida, o nível de cima. Caminhos listados em "Caminhos que sempre pedem uma pessoa" do `REVIEW.md` são `alto`, qualquer que seja o tamanho da mudança.

| Risco | Exemplos | Revisão |
|---|---|---|
| `baixo` | texto, documentação, mudança aditiva atrás de flag | `ponytail-review` |
| `médio` | mudança comum de produto | `ponytail-review`; o responsável aprova lendo a evidência antes de integrar |
| `alto` | auth, cobrança, dados de terceiros, migração, CI, instalador, efeito difícil de desfazer | o acima + `ca-revisor-plano` antes de codar + `ca-verificador` + `/security-review`; aprovação do responsável antes de integrar |

A aprovação humana é condição para **integrar** na base, não para concluir a TAR: a TAR concluída libera as dependentes no branch de trabalho, e a aprovação espera em "Esperando o responsável" no ESTADO. Aprovação de agente nunca ocupa o lugar de uma aprovação humana. A aprovação vale para o commit aprovado: commit novo depois dela pede nova aprovação.

## Revisão padrão

Entregue o `REVIEW.md` ao revisor junto com o diff: ele não o lê sozinho. Toda entrega passa pela skill `ponytail-review`, rodada pelo agente `ca-revisor` para ter contexto limpo, que lê o código conectado e não só o diff, julga pela carga esperada e só aponta achado com caso concreto. Atalho marcado `shortcut:` com limite nomeado é decisão, não achado.

## Verificação independente

Use, além da revisão padrão, em toda TAR de risco `alto`. Chame o agente `ca-verificador` e entregue a ele o `REVIEW.md`.

- Ele recebe **só** os CA com seus verificadores, o diff ou intervalo de commits e como rodar o projeto. Não recebe o seu relatório nem a conversa: um verificador que lê a explicação de quem construiu começa a concordar com ela.
- Só tem acesso de leitura e de execução. Se achar defeito, relata. Um verificador que corrige virou um segundo construtor, e aí ninguém está verificando.
- Rode antes as checagens baratas (tipos, testes tocados, build) para não gastar uma revisão com falhas que a máquina já mostraria.
- Uma rodada por entrega, não por bloco.

## Todo achado tem resposta

Cada achado da revisão entra no registro de conclusão da TAR como `- [deve-corrigir|deveria|opcional] <achado> — corrigido | descartado: <motivo> | aberto`. Achado `deve-corrigir` em aberto impede `Estado: concluída`; o `checar.py` acusa. Descartar é legítimo, desde que com o motivo (falso positivo, comportamento intencional, atalho `shortcut:` com gatilho).

## A revisão converge

- **No máximo 3 rodadas** de revisão e correção. Na quarta, pare e repense a abordagem com a pessoa: o problema é o plano, não a linha.
- **Da segunda rodada em diante, revise só o diff novo.**
- **Nomeie a classe do bug**, para corrigir todas as ocorrências de uma vez.
- **Achado já registrado não se repete.**
- Defeito que já existia antes da TAR é `herdado`: não é culpa desta mudança e não a bloqueia; vira LAC.

## Sem implicância

A pergunta é se o objetivo foi atingido e se algo real impede, não "o que dá para achar?". Um achado só bloqueia por dano real: dinheiro perdido ou errado, dado pessoal exposto, permissão ou segurança quebrada, fluxo que não funciona. Ele diz o que acontece se ficar assim, com quem, e quanto custa corrigir. O resto é no máximo três notas de uma linha, que não bloqueiam nada. "Nada a corrigir" é o resultado esperado de uma boa construção.

## Desconfie do instrumento

Quando uma verificação dá uma resposta surpreendente, verifique a verificação antes do código: build velho, servidor servindo a versão anterior, elemento errado medido, cache, aba de outra sessão. Reproduza o resultado por um segundo caminho antes de agir.

## Nunca enfraqueça a verificação

Reescrever o teste que falha, afrouxar o critério ou estreitar o que é olhado deixa o resultado parecendo verificado sem a verificação existir. Se o critério estava errado, mude-o abertamente, com o motivo, e registre como DEC.
