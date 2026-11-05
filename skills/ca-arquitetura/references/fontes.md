# De onde vêm as regras

Estudo de 04/11/2026, por documentação e código de referência. Leitura web resumida automaticamente: confira nomes e detalhes na fonte antes de virarem exigência.

| Regra | Fontes |
|---|---|
| Núcleo soberano, manifesto tipado, resposta na ausência, 4 estados, satélite, pontos invariante/reação, verificador com lista | PMD (ARCHITECTURE.md, documentação interna, declarado, não auditado em código) |
| Ponte que só existe com os dois módulos | PMD (bridge), Odoo (`auto_install` com subconjunto de dependências), Tryton (`[register A B]` em `tryton.cfg`) |
| Instalação condicionada ao contexto | Odoo (`countries` no manifesto de `l10n_br`) |
| Migração em três fases | Odoo (`migrations/<versão>/pre-`, `post-`, `end-`), ERPNext (`pre_model_sync`, `post_model_sync`) |
| Backfill declarado | Odoo (`post_init_hook` do `sale_stock`, como contraexemplo de código livre) |
| Não injetar coluna nem sobrescrever método | Odoo (`_inherit`), OFBiz (`extend-entity`), ERPNext (Custom Field na tabela do módulo), como contraexemplos |
| Desligar não destrói | Odoo e ERPNext (desinstalar apaga), Tryton (desativar recusado com dependente) |
| Reações em fases | OFBiz (ECA: invoke, commit, return, global-rollback), iDempiere (16 momentos, pós-commit separado), Spring Modulith (registro de publicações de eventos) |
| Hooks que só negam | ERPNext (`get_doc_permissions`) |
| Lista que só encolhe, ordem de resolução, adoção | Packwerk e Shopify Engineering, ArchUnit, dependency-cruiser, eslint-plugin-boundaries, Spring Modulith (`verify`) |
| Escada de padrões | Microsoft Azure Architecture Center, AWS Prescriptive Guidance |
