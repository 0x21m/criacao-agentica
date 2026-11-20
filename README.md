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
- **Hook de início** (só em projetos com `docs/ESTADO.md` ou `docs/01-prd.md`): ao abrir, retomar ou compactar a sessão, põe no contexto o índice das quatro skills, o estado do `checar.py` e a próxima ação do ESTADO; cada subagente recebe o índice curto. Assim o método e as skills de dados, de arquitetura e de interface entram sem depender de alguém lembrar.
- **Hook de delegação** (só em projetos do método): confere se cada chamada de agente tem modelo e as linhas do briefing (Objetivo, Pronto quando, Resposta, Pare quando). Avisa por padrão e recusa no nível transacional.
- **Hooks de git** (só em projetos com `docs/ESTADO.md`; nos demais, não fazem nada). Pedem a sua confirmação antes de `push` e antes de commit ou merge na `main`, e barram o commit enquanto houver tarefa marcada concluída sem registro de verificação. Precisam de Python no PATH (`python` ou `python3`).
- **A skill `ca-dados`:** garantias de dados no banco (PostgreSQL e Supabase). Cada invariante é declarada uma vez e garantida no banco, com o catálogo invariante → mecanismo → armadilha, os quatro registros (audit log, event log, ledger, diário), dinheiro, tempo, numeração legal, períodos, idempotência, tenancy, segurança, migração e testes adversariais.
- **A skill `ca-arquitetura`:** o padrão de módulo para sistemas complexos e modulares: núcleo soberano, manifesto tipado, estados do módulo, ponte, tabela satélite, pontos entre módulos (invariante e reação), fronteiras verificadas por máquina e a tabela "onde vai o que é novo".
- **A skill `ca-interface`:** telas, apps e fluxos do sistema inteiro (painel do operador, ERP ou CRM, app e portal do cliente, loja, parceiros, chat e notificações) em desktop, tablet e celular, com referências de bom gosto, um protótipo aprovado por você antes de construir, `DESIGN.md` e tokens, estados de cada tela, revisão de interface e QA de uso no navegador.
- **10 agentes:**

  | Agente | Faz |
  |---|---|
  | `ca-arqueologo` | Extrai do código existente as regras de negócio, com arquivo e linha |
  | `ca-auditor` | Cruza os documentos antes de implementar e devolve só as lacunas |
  | `ca-revisor-plano` | Confronta uma tarefa de risco alto com o repositório antes de codar |
  | `ca-construtor` | Constrói uma tarefa num worktree próprio, teste primeiro |
  | `ca-revisor` | Revisa em contexto limpo cada tarefa construída |
  | `ca-verificador` | Verifica às cegas uma tarefa de risco médio ou alto, com prova por mutação e teste de isolamento |
  | `ca-rodador` | Roda suíte e build e devolve só as falhas |
  | `ca-referencias` | Busca de 3 a 6 referências de bom gosto antes do protótipo de uma tela ou fluxo |
  | `ca-revisor-ui` | Revisa uma tela, fluxo ou diff de interface em contexto limpo, com achados P0 a P3 |
  | `ca-verificador-ui` | Verifica no navegador, sem ter feito o trabalho, viewports, estados e o QA de uso |

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

### Para a ca-interface

A `ca-interface` chama estas skills como lentes "obrigatórias se instaladas" (`skills/ca-interface/references/lentes-e-ferramentas.md`). Sem elas, cai no caminho alternativo e o acabamento piora:

- **[taste-skill](https://github.com/Leonxlnx/taste-skill)**, com a `design-taste-frontend` (landing, site e a checagem de consistência visual de todo protótipo):
  ```bash
  npx skills add Leonxlnx/taste-skill
  ```
- **[Impeccable](https://github.com/pbakaus/impeccable)**, para as passadas `critique` e `polish`:
  ```
  /plugin marketplace add pbakaus/impeccable
  ```
  ```
  /plugin install impeccable@impeccable
  ```
- **[Skills do Jakub Krehel](https://github.com/jakubkrehel/skills)**, com a `better-layout` (composição da tela-chave) e as outras `better-*`:
  ```bash
  npx skills add jakubkrehel/skills
  ```
- **[Skills do Emil Kowalski](https://github.com/emilkowalski/skills)**, com a `break-ui` (dados de pior caso antes de mostrar) e as de movimento:
  ```bash
  npx skills add emilkowalski/skills
  ```

Fora as skills:

- **Node 22 ou mais novo** e **Chrome ou Edge** instalados. O starter do arsenal (`skills/ca-interface/assets/arsenal/starter/`) roda com `npm install` e `npm run dev`, e os scripts de verificação (`navegar`, `medir`, `lab-interativos`) abrem o navegador da máquina.
- **MCPs de referência** (Mobbin, Refero, 21st.dev), opcionais. A skill só os usa se já estiverem conectados; sem eles, pede 2 ou 3 links ou navega no navegador embutido.

Depois de instalar tudo, reinicie o Claude Code.

## Como começar

Abra o Claude Code **dentro da pasta do projeto** e diga o que quer:

- "quero construir um app para …", num projeto novo;
- "quero adotar a criacao-agentica neste projeto", num projeto que já tem código;
- "e agora?", num projeto que já usa o método.

O agente cria só os documentos mínimos, marca como `[ASSUMIDO]` o que escolheu por você e pergunta na mesma rodada; você corrige o que discordar.

## Créditos

- A estrutura dos seis documentos parte do tutorial "Os 6 documentos que você cria antes de pedir o app pra IA", de Felipe Tâmbara. O ciclo de execução, os controles de consistência, a rastreabilidade e o restante são adaptações deste projeto e não devem ser atribuídos a ele.
- [Matt Pocock](https://github.com/mattpocock/skills): skills usadas como motor do processo. A integração aponta para elas e não as copia.
- [Ponytail](https://github.com/DietrichGebert/ponytail), de Dietrich Gebert: a filosofia de construção.
- "How the Claude Code team does code review", da Anthropic: revisão por nível de risco, `REVIEW.md` e convergência da revisão.
- Ideias de verificação, critérios e governança vindas das skills `universal-harness` e `project-charter`, do mesmo autor.

## Licença

MIT
