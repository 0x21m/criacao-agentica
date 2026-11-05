---
name: ca-dados
description: Garantias de dados no banco para sistemas transacionais complexos (ERPs, financeiro, estoque, fiscal, módulos de conversa, automação e IA) em PostgreSQL e Supabase. Ensina a declarar cada invariante uma vez e garanti-la no banco (constraint, trigger adiado, lock, RLS), a separar audit log, event log, ledger e diário, e a tratar dinheiro, tempo, numeração legal, períodos, idempotência, tenancy, segurança, migração e testes adversariais. Use ao desenhar ou mudar tabelas, colunas, constraints, funções, policies RLS, migrações, saldos, lançamentos, documentos com estado, multiempresa ou qualquer regra que precise valer mesmo quando alguém escreve SQL direto, mesmo que a pessoa não diga "invariante".
metadata:
  version: "0.11.0"
---

# Dados com garantia

Num sistema construído por agentes de IA, quem escreve no banco não passa só pelo código da aplicação: o agente, a service role, o PostgREST e as migrações falam SQL direto. Todos os ERPs estudados (Odoo, ERPNext, Tryton, iDempiere, OFBiz) guardam as regras na aplicação e todos têm escotilhas que as furam sem rastro. Por isso esta skill parte de uma regra:

**Cada invariante é declarada uma vez, com nome e mensagem, e garantida no banco. A aplicação é conveniência, não garantia.**

## As regras que valem sempre

1. **Três tipos de invariante.** De linha: CHECK, NOT NULL, UNIQUE, FK. Entre linhas: trigger adiado mais lock da linha-mestra, ou saldo materializado com CHECK quando toda escrita passa por porta (esta só detecta quem escreve fora). De consequência entre entidades ("pedido cancelado com dinheiro tem devolução"): uma **verificação que precisa voltar vazia**, rodada nos testes, no simulador e em produção só leitura. O catálogo e o mapa estado → consequência estão em `references/invariantes.md`.
2. **Cada tabela declara a camada:** bruto (não se reescreve), estado (toda mudança grava evento), derivado (recalculável e conferido) ou definição (uma fórmula por conceito, que telas, relatórios e IA leem). O status que o usuário vê é um conceito com uma função. Ver `references/camadas.md`.
3. **Quatro registros, nunca confundidos:** audit log (quem mudou o quê), event log (o que aconteceu, para outros módulos), ledger (movimentos que formam saldo) e diário contábil (lançamentos pelas regras contábeis). Ver `references/registros.md`.
4. **O fato não se edita.** O que foi postado, emitido ou liquidado é terminal. A correção é um registro novo ligado ao original (estorno, espelho, evento). Saldo é derivado dos movimentos, nunca escrito à mão.
5. **Dinheiro** em inteiro na menor unidade ou `numeric(p,s)` com escala declarada, sempre com a moeda ao lado. Nunca `float` nem `money`. Taxa de câmbio ausente falha, não vira 1. A política de arredondamento fica gravada no documento.
6. **Tempo:** `timestamptz` para instantes, `date` para datas contábeis. Data do fato separada da data do registro quando corrigir o passado for possível. Vigência com range e `EXCLUDE`.
7. **Número legal separado da chave técnica.** Sem lacuna por série, com tabela contadora na mesma transação. Sequence nunca é sem lacuna.
8. **Idempotência em dois níveis:** a chave da tentativa (guarda o hash do pedido e a resposta) e a referência de negócio única (rejeita duplicata). Resultado desconhecido de uma chamada externa não é falha.
9. **Tenant não é empresa.** O tenant é fronteira rígida; a empresa é dimensão de negócio. Sem decidir o modelo, não se gera schema: ver `references/tenancy.md`.
10. **Negar por padrão, em duas camadas:** GRANT e RLS. Hooks e políticas extras só restringem, nunca ampliam. Escrita sensível só por função com permissão checada dentro. Ver `references/seguranca.md`.
11. **Todo bypass tem nome, dono e trilha.** Service role, secret key, `BYPASSRLS`, `session_replication_role`, `DISABLE TRIGGER`: cada um listado, restrito e testado. Escotilha silenciosa é defeito.
12. **Schema só muda por arquivo de migração**, em expand–contract, nunca editando migração aplicada. Ver `references/evolucao.md`.
13. **Nada falha em silêncio:** job lê a resposta do que chamou, lote vai item a item, fila parada e dinheiro sem destino acendem alerta, e antes do primeiro cliente real vem a entrega 0 (backup restaurado, monitor, alertas). Ver `references/operacao.md`.
14. **Garantia sem teste adversarial é intenção.** Cada invariante tem um teste que tenta quebrá-la com o papel real, inclusive concorrência. Ver `references/testes.md`.

## Como trabalhar

1. **Liste as invariantes** da entrega antes do schema, no formato de `references/invariantes.md` (seção "Registro de invariantes"): regra, mecanismo, por onde poderia ser contornada, teste. Elas entram no `05-schema-backend.md` e viram critérios de aceite.
2. **Escolha o mecanismo pelo catálogo**, o mais simples que garante a regra. Se o catálogo não cobre o caso, registre como `[DESCONHECIDO]` e pesquise na documentação oficial antes de inventar.
3. **Decisões que são da pessoa** viram pergunta, não suposição: modelo de tenancy, unidade monetária e moedas, retenção de dados, quem pode usar cada bypass.
4. **Escreva a migração** e os testes adversariais juntos. Rode os testes com o papel real (não como `postgres`).
5. **Use as skills oficiais quando existirem:** `supabase-postgres-best-practices` e `supabase` (instale com `npx skills add supabase/agent-skills`). Esta skill decide o que garantir; elas decidem como fazer bem em Postgres e Supabase.

## Família

- **Volte à `criacao-agentica`** para registrar: cada INV entra no `docs/05-schema-backend.md`, vira critério de aceite de uma TAR e aparece no ESTADO. Sem o método, a garantia fica sem dono nem verificação.
- **Chame a `ca-arquitetura`** para saber de que módulo é cada tabela, onde fica um campo novo e como um módulo fala com outro antes de escrever a migração.

## Referências

| Arquivo | Leia quando |
|---|---|
| `references/invariantes.md` | toda regra de negócio que precisa valer no banco; o catálogo invariante → mecanismo → armadilha |
| `references/camadas.md` | camada de cada tabela, catálogo de definições, contrato de leitura, glossário, guardar o bruto, inventário de um sistema existente |
| `references/operacao.md` | jobs, filas, alertas, credenciais, publicação e a entrega 0 antes do primeiro cliente real |
| `references/registros.md` | ledger, saldo, documento com estado, estorno, dinheiro, tempo, numeração, período, idempotência |
| `references/tenancy.md` | mais de um cliente, empresa ou filial; RLS por tenant |
| `references/seguranca.md` | GRANT, RLS, funções, chaves, MFA, bypass, dado pessoal, leitura por IA |
| `references/evolucao.md` | migração, mudança em tabela com dados, backfill, baseline |
| `references/testes.md` | provar uma invariante, testar isolamento, concorrência e falha parcial |
| `references/supabase.md` | o projeto roda em Supabase |
| `references/fontes.md` | conferir de onde veio uma regra e o que ainda não foi confirmado |
