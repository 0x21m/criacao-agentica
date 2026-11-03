<!-- Modelo da skill criacao-agentica. Copie para docs/agents/domain.md.
Mesmo papel do domain.md do setup-matt-pocock-skills, com as convenções da metodologia. -->

# Documentos de domínio

Como as skills devem consumir a documentação de domínio deste repositório antes de explorar o código.

## Antes de explorar, leia

- **`GLOSSARY.md`** na raiz: o dicionário mestre. Os termos em `_Evitar_` (ou `_Avoid_`) não aparecem em saída nenhuma: nome de teste, hipótese, título de tarefa, proposta de refatoração.
- **`docs/adr/`**: as ADRs que tocam a área em que você vai trabalhar.
- **`docs/ESTADO.md`**: o ponto de retomada, com a tarefa ativa e o que espera o responsável.

Se algum não existir, siga em silêncio. Eles são criados quando o primeiro termo ou a primeira decisão se resolve.

## Layout

Contexto único:

```
/
├── GLOSSARY.md
├── docs/
│   ├── README.md, ESTADO.md, 01-prd.md … 06-plano-implementacao.md
│   ├── adr/0001-slug.md
│   ├── tarefas/TAR-001-slug.md
│   └── agents/issue-tracker.md, domain.md
└── src/
```

## Use o vocabulário do glossário

Quando a sua saída nomear um conceito de domínio, use o termo do `GLOSSARY.md`. Se o conceito não estiver lá, ou você está inventando linguagem (reconsidere) ou há uma lacuna real (registre para `domain-modeling`).

## Sinalize conflito com ADR

Se a sua saída contradiz uma ADR, diga explicitamente em vez de passar por cima:

> _Contradiz ADR-0007 (…), mas vale reabrir porque…_

## Marcadores de certeza

Nos documentos em `docs/`, afirmações levam `[CONFIRMADO]`, `[PROPOSTO]`, `[ASSUMIDO]`, `[DESCONHECIDO]`, `[OBSERVADO]` ou `[NÃO SE APLICA — motivo]`. Não apresente proposta como decisão.
