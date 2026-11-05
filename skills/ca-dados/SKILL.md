---
name: ca-dados
description: Garantias de dados no banco para sistemas transacionais complexos (ERPs, financeiro, estoque, fiscal, módulos de conversa, automação e IA) em PostgreSQL e Supabase. Ensina a declarar cada invariante uma vez e garanti-la no banco (constraint, trigger adiado, lock, RLS), a separar audit log, event log, ledger e diário, e a tratar dinheiro, tempo, numeração legal, períodos, idempotência, tenancy, segurança, migração e testes adversariais. Use ao desenhar ou mudar tabelas, colunas, constraints, funções, policies RLS, migrações, saldos, lançamentos, documentos com estado, multiempresa ou qualquer regra que precise valer mesmo quando alguém escreve SQL direto, mesmo que a pessoa não diga "invariante".
metadata:
  version: "0.9.0"
---

# Dados com garantia

Num sistema construído por agentes de IA, quem escreve no banco não passa só pelo código da aplicação: o agente, a service role, o PostgREST e as migrações falam SQL direto. Todos os ERPs estudados (Odoo, ERPNext, Tryton, iDempiere, OFBiz) guardam as regras na aplicação e todos têm escotilhas que as furam sem rastro. Por isso esta skill parte de uma regra:

**Cada invariante é declarada uma vez, com nome e mensagem, e garantida no banco. A aplicação é conveniência, não garantia.**

## As regras que valem sempre

1. **Invariante de uma linha** é CHECK, NOT NULL, UNIQUE ou FK. **Invariante entre linhas** (soma, saldo, balanceamento, período) é trigger de constraint adiado **mais** lock da linha-mestra (ou SERIALIZABLE com retry). Só o trigger falha sob concorrência. O catálogo está em `references/invariantes.md`.
2. **Quatro registros, nunca confundidos:** audit log (quem mudou o quê), event log (o que aconteceu, para outros módulos), ledger (movimentos que formam saldo) e diário contábil (lançamentos pelas regras contábeis). Ver `references/registros.md`.
3. **O fato não se edita.** O que foi postado, emitido ou liquidado é terminal. A correção é um registro novo ligado ao original (estorno, espelho, evento). Saldo é derivado dos movimentos, nunca escrito à mão.
4. **Dinheiro** em inteiro na menor unidade ou `numeric(p,s)` com escala declarada, sempre com a moeda ao lado. Nunca `float` nem `money`. Taxa de câmbio ausente falha, não vira 1. A política de arredondamento fica gravada no documento.
5. **Tempo:** `timestamptz` para instantes, `date` para datas contábeis. Data do fato separada da data do registro quando corrigir o passado for possível. Vigência com range e `EXCLUDE`.
6. **Número legal separado da chave técnica.** Sem lacuna por série, com tabela contadora na mesma transação. Sequence nunca é sem lacuna.
7. **Idempotência em dois níveis:** a chave da tentativa (guarda o hash do pedido e a resposta) e a referência de negócio única (rejeita duplicata). Resultado desconhecido de uma chamada externa não é falha.
8. **Tenant não é empresa.** O tenant é fronteira rígida; a empresa é dimensão de negócio. Sem decidir o modelo, não se gera schema: ver `references/tenancy.md`.
9. **Negar por padrão, em duas camadas:** GRANT e RLS. Hooks e políticas extras só restringem, nunca ampliam. Escrita sensível só por função com permissão checada dentro. Ver `references/seguranca.md`.
10. **Todo bypass tem nome, dono e trilha.** Service role, secret key, `BYPASSRLS`, `session_replication_role`, `DISABLE TRIGGER`: cada um listado, restrito e testado. Escotilha silenciosa é defeito.
11. **Schema só muda por arquivo de migração**, em expand–contract, nunca editando migração aplicada. Ver `references/evolucao.md`.
12. **Garantia sem teste adversarial é intenção.** Cada invariante tem um teste que tenta quebrá-la com o papel real, inclusive concorrência. Ver `references/testes.md`.

## Como trabalhar

1. **Liste as invariantes** da entrega antes do schema, no formato de `references/invariantes.md` (seção "Registro de invariantes"): regra, mecanismo, por onde poderia ser contornada, teste. Elas entram no `05-schema-backend.md` e viram critérios de aceite.
2. **Escolha o mecanismo pelo catálogo**, o mais simples que garante a regra. Se o catálogo não cobre o caso, registre como `[DESCONHECIDO]` e pesquise na documentação oficial antes de inventar.
3. **Decisões que são da pessoa** viram pergunta, não suposição: modelo de tenancy, unidade monetária e moedas, retenção de dados, quem pode usar cada bypass.
4. **Escreva a migração** e os testes adversariais juntos. Rode os testes com o papel real (não como `postgres`).
5. **Use as skills oficiais quando existirem:** `supabase-postgres-best-practices` e `supabase` (instale com `npx skills add supabase/agent-skills`). Esta skill decide o que garantir; elas decidem como fazer bem em Postgres e Supabase.

## Referências

| Arquivo | Leia quando |
|---|---|
| `references/invariantes.md` | toda regra de negócio que precisa valer no banco; o catálogo invariante → mecanismo → armadilha |
| `references/registros.md` | ledger, saldo, documento com estado, estorno, dinheiro, tempo, numeração, período, idempotência |
| `references/tenancy.md` | mais de um cliente, empresa ou filial; RLS por tenant |
| `references/seguranca.md` | GRANT, RLS, funções, chaves, MFA, bypass, dado pessoal, leitura por IA |
| `references/evolucao.md` | migração, mudança em tabela com dados, backfill, baseline |
| `references/testes.md` | provar uma invariante, testar isolamento, concorrência e falha parcial |
| `references/supabase.md` | o projeto roda em Supabase |
| `references/fontes.md` | conferir de onde veio uma regra e o que ainda não foi confirmado |
