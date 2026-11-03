<!-- Modelo da skill criacao-agentica. Copie para docs/agents/issue-tracker.md.
É o arquivo que as skills de engenharia do Matt Pocock (to-tickets, implement,
implement-spec, wayfinder, to-spec, triage) leem para saber onde
o trabalho mora. Ele as aponta para os documentos da metodologia, para que
exista uma fonte de verdade só. -->

# Issue tracker: documentos da metodologia de criação agêntica

O trabalho deste repositório vive em markdown, dentro de `docs/`, no formato da metodologia de criação agêntica. Não há `.scratch/` nem tracker externo. Use os IDs estáveis (`REQ`, `RN`, `CA`, `FLX`, `DEC`, `ADR`, `TAR`, `LAC`) e nunca os renumere. Vocabulário de domínio: `GLOSSARY.md`.

## Onde cada coisa mora

| Conceito das skills | Aqui |
|---|---|
| Spec de uma funcionalidade | Não é um arquivo próprio. É a entrega descrita em `docs/06-plano-implementacao.md`, que aponta para REQ, RN e CA no `docs/01-prd.md` e para os trechos afetados de fluxo, UI/UX, schema e TRD |
| Ticket / issue de implementação | Um arquivo por tarefa: `docs/tarefas/TAR-NNN-slug.md` |
| Critérios de aceite do ticket | A seção "Critérios de aceite" da TAR, que cita CA do PRD |
| Bloqueios | A linha `Bloqueada por:` da TAR (TAR-IDs e LAC-IDs) |
| Status / rótulo de triagem | A linha `Estado:` da TAR (tabela abaixo) |
| Comentários | Seção `## Comentários` no fim do arquivo, em ordem |
| Decisão de arquitetura | `docs/adr/NNNN-slug.md` (ID `ADR-NNNN`) |

## Quando uma skill disser "publique a spec" (to-spec)

Não crie arquivo de spec. Distribua cada parte no documento dono e registre a entrega no plano:

| Seção da spec | Vai para |
|---|---|
| Problem Statement, Solution | PRD: Contexto e resultado |
| User Stories | PRD: um `REQ` por história, com seus `CA` (Dado/quando/então + Verificador) |
| Implementation Decisions | TRD, schema ou fluxo, conforme o assunto; decisão estrutural vira ADR |
| Testing Decisions | Costuras de teste de cada TAR |
| Out of Scope | PRD: Fora desta versão |
| Further Notes | Seção "Perguntas e lacunas" do documento dono, como LAC quando for pendência |

Depois acrescente ou atualize a entrega em `docs/06-plano-implementacao.md` com os REQ e CA que ela cobre.

## Quando uma skill disser "publique os tickets" (to-tickets)

Crie um arquivo por tarefa em `docs/tarefas/`, com o modelo de tarefa da metodologia, numerando a partir do próximo TAR-NNN livre, bloqueadores primeiro. Cada tarefa cita os CA que implementa e as tarefas ou lacunas que a bloqueiam em `Bloqueada por:`. Liste as TAR na entrega correspondente do plano. Estado inicial: `a fazer`.

## Quando uma skill disser "busque o ticket"

Leia `docs/tarefas/TAR-NNN-*.md` e, a partir dele, os CA no PRD e os trechos que ele cita. Diga o título da TAR antes de começar.

## Quando o trabalho de um ticket terminar

Preencha o "Registro de conclusão" da TAR com uma linha por CA (`- CA-NNN: atendido — como: … — onde: …`), mude `Estado:` e atualize os documentos afetados no mesmo commit. Fechar = `concluída`; depois de integrado na base, `integrada`.

## Fronteira

Uma TAR está na fronteira quando `Estado: a fazer`, todos os TAR em `Bloqueada por:` estão `concluída` ou além, e nenhuma LAC em `Bloqueada por:` está aberta. `python <skill criacao-agentica>/scripts/checar.py` calcula a fronteira. Entre as prontas, a de menor número vence.

Reivindicar: mude `Estado:` para `em execução` e salve antes de qualquer trabalho.

## Papéis de triagem → estados

| Papel | Aqui |
|---|---|
| `needs-triage` | LAC aberta no documento dono, ainda sem proposta |
| `needs-info` | `Estado: bloqueada` com a LAC em `Bloqueada por:` |
| `ready-for-agent` | `Estado: a fazer`, `Executor: agente` |
| `ready-for-human` | `Estado: a fazer`, `Executor: pessoa` |
| `wontfix` | `Estado: descartada`, com o motivo em Comentários |

## Wayfinding (esforço grande demais para uma sessão)

- **Mapa:** `docs/mapas/<esforco>/mapa.md`, com Destino, Notas, Decisões até agora, Ainda não especificado e Fora de escopo. O destino é uma entrega, uma ADR ou uma mudança.
- **Ticket de decisão:** é uma lacuna. Um arquivo por ticket, `docs/mapas/<esforco>/LAC-NNN-slug.md`, numerado a partir do próximo LAC livre do projeto, com a pergunta no corpo e as linhas `Resolução: pesquisa|protótipo|entrevista|tarefa`, `Estado: aberta|reivindicada|resolvida` e `Bloqueada por: LAC-NNN, …`.
- **Fronteira:** LAC abertas, desbloqueadas e não reivindicadas; menor número primeiro.
- **Resolver:** resposta sob `## Resposta`, `Estado: resolvida`, uma linha com o resumo e o link em Decisões até agora no `mapa.md`. Decisão estrutural vira ADR; requisito vira REQ no PRD.

## Autonomia

Commit, merge, push e publicação seguem a seção "Autonomia concedida" de `docs/README.md`, mesmo quando uma skill mandar commitar.
