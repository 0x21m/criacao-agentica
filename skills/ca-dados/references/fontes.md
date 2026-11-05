# De onde vêm as regras

Estudo feito em 04/11/2026: documentação oficial e código de referência, lidos por agentes. Boa parte da leitura web passou por um resumo automático, então nomes de função, números e prazos devem ser conferidos na fonte antes de virarem exigência num projeto.

## Fontes primárias

- PostgreSQL (versão atual): https://www.postgresql.org/docs/current/ — constraints, triggers, isolamento, locking, RLS, funções, tipos, migração de constraints. Wiki "Don't Do This": https://wiki.postgresql.org/wiki/Don%27t_Do_This
- Supabase: https://supabase.com/docs — API e RLS, chaves, Auth e MFA, funções, Edge Functions, filas, Vault, Realtime, migrações, testes, backups, checklist de produção, MCP.
- Ledgers: TigerBeetle (https://docs.tigerbeetle.com), Formance (https://docs.formance.com).
- Padrões: Microsoft Azure Architecture Center, AWS Prescriptive Guidance (outbox, saga, compensação).
- Multitenancy: AWS SaaS Lens, Azure "Architect multitenant solutions".
- Segurança: OWASP ASVS 5.0, API Security Top 10, Top 10 for LLM Applications.
- Pagamentos e webhooks: Stripe docs, Standard Webhooks, IETF draft do header Idempotency-Key.
- ERPs como referência de domínio (não de garantia): Odoo, ERPNext/Frappe, Tryton, iDempiere, Apache OFBiz.

## Confirmado nesta versão

- `session_replication_role`: só superusuário ou quem tem o privilégio `SET` no parâmetro pode mudá-lo; `replica` desliga triggers comuns, regras e checagens de FK (runtime-config-client).

## Ainda não confirmado

- Constraint declarativa para "vigências sem lacuna" e a constraint temporal nativa (`WITHOUT OVERLAPS`).
- Data em que o Supabase passa a revogar os grants padrão de objetos novos.
- Prazos e números operacionais do Supabase (jobs do cron, RPO do PITR, timeouts de hook).
