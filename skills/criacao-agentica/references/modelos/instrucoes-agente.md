<!-- Modelo da skill criacao-agentica. Copie para o arquivo de instruções que o
host lê em toda sessão (Claude Code: CLAUDE.md; outros: AGENTS.md). Se um dos
dois já existe, edite esse e não crie o outro. Ele é lido inteiro a cada sessão:
só ponteiros. O bloco "Agent skills" é o que as skills do Matt Pocock procuram. -->

# [produto]

Este projeto segue a metodologia de criação agêntica (skill `criacao-agentica`).
Ao começar: leia `docs/ESTADO.md` e rode `python <skill>/scripts/checar.py`.
Ao terminar: reescreva `docs/ESTADO.md`.
Autonomia: `docs/README.md`, seção "Autonomia concedida".

## Agent skills

### Issue tracker

Trabalho em markdown dentro de `docs/`: tarefas em `docs/tarefas/`, critérios no PRD. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` na raiz e `docs/adr/`. See `docs/agents/domain.md`.

## Comandos
Instalar: [comando]
Rodar: [comando]
Testar: [comando]
Checar tipos e lint: [comando]
Build: [comando]

## Erros a não repetir
Um erro corrigido duas vezes vira uma linha aqui; uma linha violada duas vezes vira teste, hook ou regra de lint.
- [data] [erro e a regra que o evita]
