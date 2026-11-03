# Modelos

| Modelo | Destino no projeto | Quando |
|---|---|---|
| `readme-docs.md` | `docs/README.md` | Iniciar ou Adotar: índice, papéis, autonomia |
| `glossario.md` | `GLOSSARY.md` (raiz) | Iniciar ou Adotar; atualizado sempre que um termo se resolve |
| `adr.md` | `docs/adr/NNNN-slug.md` | Decisão estrutural; a primeira é o nível do projeto (ADR-0001) |
| `decisao.md` | dentro do documento dono | Decisão local que afeta manutenção ou comportamento |
| `review.md` | `REVIEW.md` (raiz) | Iniciar ou Adotar; "Já escapou" cresce a cada bug que passou de uma TAR concluída |
| `estado.md` | `docs/ESTADO.md` | Iniciar ou Adotar; reescrito no Encerrar |
| `instrucoes-agente.md` | `CLAUDE.md` ou `AGENTS.md` | Se já existe um, acrescente só as linhas de entrada e saída e o bloco "Agent skills" |
| `agents-issue-tracker.md` | `docs/agents/issue-tracker.md` | Iniciar ou Adotar: conecta as skills do Matt Pocock aos nossos documentos |
| `agents-domain.md` | `docs/agents/domain.md` | Idem |
| `01-prd.md` | `docs/01-prd.md` | Iniciar (jornada prioritária); Especificar (cada entrega) |
| `02-trd.md` | `docs/02-trd.md` | Especificar, conforme o nível |
| `03-fluxo-app.md` | `docs/03-fluxo-app.md` | Especificar |
| `04-ui-ux.md` | `docs/04-ui-ux.md` | Especificar, quando houver tela |
| `05-schema-backend.md` | `docs/05-schema-backend.md` | Especificar, quando houver dados persistidos |
| `06-plano-implementacao.md` | `docs/06-plano-implementacao.md` | Especificar: as entregas e a lista de TAR |
| `tarefa.md` | `docs/tarefas/TAR-NNN-slug.md` | Uma por tarefa; o registro de conclusão é preenchido no Executar |

Quais documentos são obrigatórios em cada nível: `../profundidade.md`. Como as skills do Matt Pocock se ligam a estes arquivos: `../motor.md`.

Ao copiar um modelo, apague o comentário `<!-- Modelo da skill … -->` do topo: ele é instrução para o agente, não conteúdo do projeto.

## Convenções que o `checar.py` lê

- Um ID é **definido** quando abre a linha ou o título: `REQ-001: …`, `# TAR-004 — …`, `CA-002 — REQ-001`. Em qualquer outro lugar (meio da linha, item de lista, tabela) é **referência**. O `ESTADO.md` só referencia, nunca define. Um arquivo em `docs/tarefas/` define só a própria TAR, e um em `docs/mapas/` só a própria LAC; todo o resto neles é referência.
- `docs/adr/0003-slug.md` define `ADR-0003` pelo nome do arquivo.
- O bloco de um ID vai da definição até a próxima definição ou o próximo título de nível igual ou superior. As referências dentro do bloco pertencem a ele. Num arquivo de tarefa, o título `#` abre o bloco e ele vai até o fim do arquivo.
- `Bloqueada por:` dentro de uma TAR ou de uma LAC declara os bloqueios; é dali que sai a fronteira.
- TAR concluída precisa de uma linha `- CA-NNN: atendido …` para cada CA citado.
- TAR concluída com uma linha `- [deve-corrigir] … — aberto` (ou sem `corrigido`/`descartado`) é problema.
- LAC com `bloqueia-tarefa` e sem `resolvida` bloqueia as TAR que cita.
- No `GLOSSARY.md`, os termos de `_Evitar_:` ou `_Avoid_:` são procurados nos documentos.
- REQ ou CA com `[ADIADO` no bloco (ex.: `Critérios relacionados: [ADIADO — entrega 2]`) não é acusado por falta de CA ou de TAR.
- `docs/brief.md` não é varrido em busca de termos proibidos: é o texto literal da pessoa.
- Os colchetes dos modelos (`REQ-[ID]`, `TAR-[NNN]`) não contam como IDs.
