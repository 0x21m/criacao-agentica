# Criação agêntica

Metodologia para o Claude Code levar uma intenção de produto até entregas verificáveis.

O agente transforma decisões em software. Quando falta uma decisão, ele a reconhece como lacuna e a resolve dentro da autonomia concedida ou a leva a você. Cada mudança pode ser acompanhada do requisito até o comportamento verificado, e a próxima sessão continua sem reconstruir decisões pela conversa.

## O que tem dentro

- **A skill `criacao-agentica`.** É ativada quando você diz "quero construir X", "quero fazer a funcionalidade Y", "e agora?" ou "quebrou". Ela traz:
  - modos: Iniciar, Adotar, Especificar, Auditar, Executar, Corrigir, Próxima, Encerrar;
  - documentos-contrato na profundidade que o projeto pede: PRD, TRD, fluxo, UI/UX, schema, plano;
  - glossário e IDs rastreáveis: `REQ`, `RN`, `CA`, `FLX`, `DEC`, `ADR`, `TAR`, `LAC`;
  - critérios de aceite escritos antes do código, cada um com quem o verifica;
  - revisão pelo nível de risco e verificação por quem não fez o trabalho;
  - `docs/ESTADO.md` como ponto de retomada entre sessões;
  - `scripts/checar.py`, que aponta problemas de rastreabilidade e a fronteira de tarefas prontas;
  - o **loop da entrega**: a skill monta um `/goal` que executa as tarefas da entrega uma a uma até todas fecharem ou o loop bater num freio (teto de turnos, lacuna, revisão que não converge) e termina com o que você precisa ler.
- **Hook de início** (só em projetos com `docs/ESTADO.md` ou `docs/01-prd.md`): ao abrir, retomar ou compactar a sessão, põe no contexto o índice das três skills, o estado do `checar.py` e a próxima ação do ESTADO; cada subagente recebe o índice curto. Assim o método e as skills de dados e de arquitetura entram sem depender de alguém lembrar.
- **Hooks de git** (só em projetos com `docs/ESTADO.md`; nos demais, não fazem nada). Pedem a sua confirmação antes de `push` e antes de commit ou merge na `main`, e barram o commit enquanto houver tarefa marcada concluída sem registro de verificação. Precisam de Python no PATH (`python` ou `python3`).
- **A skill `ca-dados`:** garantias de dados no banco (PostgreSQL e Supabase). Cada invariante é declarada uma vez e garantida no banco, com o catálogo invariante → mecanismo → armadilha, os quatro registros (audit log, event log, ledger, diário), dinheiro, tempo, numeração legal, períodos, idempotência, tenancy, segurança, migração e testes adversariais.
- **A skill `ca-arquitetura`:** o padrão de módulo para sistemas complexos e modulares: núcleo soberano, manifesto tipado, estados do módulo, ponte, tabela satélite, pontos entre módulos (invariante e reação), fronteiras verificadas por máquina e a tabela "onde vai o que é novo".
- **7 agentes:**

  | Agente | Faz |
  |---|---|
  | `ca-arqueologo` | Extrai do código existente as regras de negócio, com arquivo e linha |
  | `ca-auditor` | Cruza os documentos antes de implementar e devolve só as lacunas |
  | `ca-revisor-plano` | Confronta uma tarefa de risco alto com o repositório antes de codar |
  | `ca-construtor` | Constrói uma tarefa num worktree próprio, teste primeiro |
  | `ca-revisor` | Revisa em contexto limpo cada tarefa construída |
  | `ca-verificador` | Verifica às cegas uma tarefa de risco alto, com prova por mutação e teste de isolamento |
  | `ca-rodador` | Roda suíte e build e devolve só as falhas |

## Instalar

No Claude Code, como dois comandos separados:

```
/plugin marketplace add 0x21m/criacao-agentica
```
```
/plugin install criacao-agentica@criacao-agentica
```

Só a skill, sem os agentes:

```bash
npx skills add 0x21m/criacao-agentica
```

## Dependências recomendadas

A metodologia funciona sozinha: quando uma peça falta, ela tem um caminho alternativo escrito em `references/motor.md`. Com estas peças, ela fica bem melhor:

- **[ponytail](https://github.com/DietrichGebert/ponytail)**, a filosofia de construção (a menor mudança completa e o que nunca se corta):
  ```
  /plugin marketplace add DietrichGebert/ponytail
  ```
  ```
  /plugin install ponytail@ponytail
  ```
- **[Skills do Matt Pocock](https://github.com/mattpocock/skills)**, o motor do processo (`grilling`, `domain-modeling`, `tdd`, `diagnosing-bugs`, `to-tickets`, `implement` e outras):
  ```bash
  npx skills add mattpocock/skills
  ```
- **git**, com o seu nome e e-mail configurados. A metodologia usa o git para desfazer, revisar por diff, construir em cópia isolada e registrar evidência.

## Como começar

Abra o Claude Code **dentro da pasta do projeto** e diga o que quer:

- "quero construir um app para …", num projeto novo;
- "quero adotar a criacao-agentica neste projeto", num projeto que já tem código;
- "e agora?", num projeto que já usa o método.

O agente pergunta antes de criar qualquer arquivo.

## Créditos

- A estrutura dos seis documentos parte do tutorial "Os 6 documentos que você cria antes de pedir o app pra IA", de Felipe Tâmbara. O ciclo de execução, os controles de consistência, a rastreabilidade e o restante são adaptações deste projeto e não devem ser atribuídos a ele.
- [Matt Pocock](https://github.com/mattpocock/skills): skills usadas como motor do processo. A integração aponta para elas e não as copia.
- [Ponytail](https://github.com/DietrichGebert/ponytail), de Dietrich Gebert: a filosofia de construção.
- "How the Claude Code team does code review", da Anthropic: revisão por nível de risco, `REVIEW.md` e convergência da revisão.
- Ideias de verificação, critérios e governança vindas das skills `universal-harness` e `project-charter`, do mesmo autor.

## Licença

MIT
