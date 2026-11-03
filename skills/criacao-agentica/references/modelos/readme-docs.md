<!-- Modelo da skill criacao-agentica. Copie para docs/README.md. -->

# Documentação — [produto]
O que é: índice dos documentos, papéis e a autonomia concedida ao agente.
Governa: quem decide o quê e até onde o agente vai sozinho.
Não duplica: o dicionário (em `GLOSSARY.md`) nem as decisões estruturais (em `docs/adr/`).

## Índice
| Documento | Estado | Versão | Responsável |
|---|---|---|---|
| [ESTADO.md](ESTADO.md) | vigente | — | agente |
| [../GLOSSARY.md](../GLOSSARY.md) | vigente | — | [responsável] |
| [01-prd.md](01-prd.md) | [rascunho/em revisão/vigente/não se aplica] | [versão] | [nome/papel] |
| [02-trd.md](02-trd.md) | [estado] | [versão] | [responsável] |
| [03-fluxo-app.md](03-fluxo-app.md) | [estado] | [versão] | [responsável] |
| [04-ui-ux.md](04-ui-ux.md) | [estado] | [versão] | [responsável] |
| [05-schema-backend.md](05-schema-backend.md) | [estado] | [versão] | [responsável] |
| [06-plano-implementacao.md](06-plano-implementacao.md) | [estado] | [versão] | [responsável] |
| [tarefas/](tarefas/) | — | — | — |
| [adr/](adr/) | — | — | — |

Nível do projeto: [prototipo/mvp/transacional/evolucao] — ver ADR-0001.

## Papéis
Responsável pelo produto: [nome] — decide objetivos, escopo e concessões de negócio.
Agente: planeja, implementa e verifica dentro da autonomia abaixo.
Revisão: [ponytail-review / verificador independente / pessoa] — autorrevisão não equivale a revisão independente.

## Autonomia concedida
Vale também para as skills que mandarem commitar, integrar ou publicar.
Pode sem perguntar: [padrão: iniciar o git, criar branches de trabalho, commitar neles, juntar TAR concluída no branch da entrega, editar e testar]
Precisa perguntar: [padrão: integrar na main, push, publicar, migração em produção, instalar algo, gastar]
Fora do alcance: [ex.: credenciais, apagar dados reais]
Aprovação humana por risco: ver a tabela em `references/verificacao.md` da skill; os caminhos que sempre pedem uma pessoa ficam no `REVIEW.md`.
