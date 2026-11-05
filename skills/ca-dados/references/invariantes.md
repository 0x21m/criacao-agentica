# Invariantes no banco

## Registro de invariantes

Toda invariante da entrega entra no `05-schema-backend.md` neste formato, antes do código:

```
INV-NNN — <regra em uma frase, com termos do glossário>
Tipo: linha (inclui imutável e só inserção) | entre linhas (A ou B) | consequência
Mecanismo: <constraint, trigger adiado + lock, saldo materializado + porta, verificação vazia, RLS, ...> (linha do catálogo abaixo)
Contorno possível: <quem ou o quê poderia furar: dono da tabela, service role, sessão replica, SQL direto, outra rota>
Proteção do contorno: <REVOKE, FORCE RLS, ENABLE ALWAYS, papel sem privilégio, ou "aceito: motivo">
Teste: <o teste adversarial que tenta violar, com o papel real>
Evidência: [DECLARADO | GARANTIDO | TESTADO | EM OPERAÇÃO]
```

Nunca escreva "o sistema garante X" sem nomear o mecanismo e os caminhos que o contornam. Um README não prova isolamento; um CHECK não prova consistência entre tabelas; um teste verde não prova que não há outra rota.

## Os três tipos de invariante

**1. De linha.** CHECK, NOT NULL, UNIQUE, FK, coluna gerada. Imediata e barata.

**2. Entre linhas** (soma, saldo, balanceamento, período). Duas realizações, cada uma com a sua condição:

| Realização | Como | Quando serve | O que garante |
|---|---|---|---|
| A. Trigger adiado | Trigger de constraint `DEFERRABLE INITIALLY DEFERRED` que reconfere o agregado, mais lock da linha-mestra por todos os escritores (ou SERIALIZABLE com retry de `40001`) | Sempre; obrigatória quando alguém escreve fora de uma porta | **Impede** a violação, venha de onde vier |
| B. Saldo materializado | Coluna de saldo com CHECK, lock dentro da porta, nenhum grant de escrita para papéis da aplicação, e uma verificação que compara o saldo com o recalculado | Só quando **toda** escrita passa por uma porta | Impede pela porta e **detecta** quem escreve fora dela (dono da tabela, migração, sessão replica) |

Trigger sozinho, em `READ COMMITTED`, deixa duas transações concorrentes passarem. A realização B é a do PMD e funciona, com a condição escrita.

**3. De consequência entre entidades.** "Se a entidade A está assim, a B tem que estar assado": pedido cancelado com dinheiro recebido tem devolução ou caso aberto; caso fechado não tem dinheiro devido; pedido encerrado não segura estoque. Nenhum CHECK nem trigger pega isso de forma barata, porque a consequência depende de outro módulo e do tempo. Todos os erros de dinheiro do PMD em 04/11 foram deste tipo.

A garantia é uma **verificação que precisa voltar vazia**: uma consulta SQL que lista as linhas que violam a consequência.
- Mora num arquivo versionado (por exemplo `verificacoes.sql`), uma consulta por invariante, com o id `INV`.
- Roda nos testes e no simulador sempre, e em produção só leitura (`operacao.md`).
- É provada forçando o defeito: o teste cria o caso errado e a consulta precisa acender.
- Quando as duas entidades são do mesmo módulo e mudam na mesma transação, **previna também**: trigger adiado (tipo 2) na transição, e a verificação fica como rede para o que escapar.
- Cada módulo é dono das verificações sobre as suas tabelas, no seu arquivo; uma verificação que lê outro módulo usa a interface dele e só roda com ele presente.
- Para achá-las, faça o mapa **estado → quem escreve → consequência esperada**. Para cada transição de cada máquina de estados, o que mais no sistema precisa mudar junto. Cada consequência sem mecanismo é uma INV deste tipo:

| Transição | Quem escreve | Consequência esperada | INV |
|---|---|---|---|
| pedido pago → cancelado | `pedidos.cancelar` | devolução devida registrada | INV-… (entre linhas, mesma transação) + verificação |
| devolução → concluída | `pagamentos.devolver` | a devolver do pedido = 0 | INV-… (consequência) |
| caso de devolução → fechado | `pos_venda.fechar_caso` | a devolver do pedido = 0 | INV-… (consequência, no pós-venda) |

## Catálogo: invariante → mecanismo → armadilha

Base das URLs: `https://www.postgresql.org/docs/current/`.

| # | Invariante | Mecanismo | Armadilha | Fonte |
|---|---|---|---|---|
| 1 | Valor de linha válido (valor > 0, status no domínio) | CHECK + NOT NULL | NULL passa no CHECK; só vê a própria linha; não é adiável | ddl-constraints |
| 2 | Saldo materializado nunca negativo | CHECK (saldo >= 0) na coluna de saldo | Só vale se o saldo é coluna; saldo derivado de soma não é checável por CHECK | ddl-constraints |
| 3 | Saldo derivado de lançamentos nunca negativo | Lock da linha-mestra da conta + trigger, ou SERIALIZABLE | `FOR UPDATE` só protege se todos os escritores travam; SERIALIZABLE exige retry | explicit-locking, transaction-iso |
| 4 | Lançamento balanceado (débito = crédito) | Constraint trigger AFTER ROW DEFERRABLE INITIALLY DEFERRED que soma o documento | É por linha (dispara N vezes: deduplique por documento); WHEN não é adiado; transition table não vale em constraint trigger; sem lock, dois lotes no mesmo documento passam | sql-createtrigger |
| 5 | Lançamento postado imutável | Trigger BEFORE UPDATE OR DELETE + BEFORE TRUNCATE, REVOKE UPDATE/DELETE | Dono pode `DISABLE TRIGGER`; sessão com `session_replication_role = replica` pula trigger comum: use `ENABLE ALWAYS TRIGGER`; RLS não cobre TRUNCATE | sql-altertable, trigger-definition |
| 6 | Tabela só de inserção (correção por estorno) | Privilégio só de INSERT + trigger de bloqueio + RLS sem política de UPDATE/DELETE | Superusuário e `BYPASSRLS` ignoram RLS; dono ignora sem `FORCE ROW LEVEL SECURITY` | ddl-rowsecurity |
| 7 | Período fechado não aceita escrita | Trigger BEFORE INSERT/UPDATE/DELETE que consulta a tabela de períodos com `FOR SHARE`; o fechamento usa `FOR UPDATE` | Sem lock, um fechamento concorrente passa; se o período não for encontrado, **recuse** (o iDempiere deixa passar) | explicit-locking |
| 8 | Número sem lacuna por série (nota fiscal) | Tabela contadora por série, `UPDATE ... RETURNING` na mesma transação | Sequence e identity nunca são sem lacuna; o contador serializa a emissão por série | functions-sequence |
| 9 | Unicidade (documento por empresa) | UNIQUE (empresa_id, numero) | NULLs são distintos por padrão: use `NULLS NOT DISTINCT`; em tabela particionada a chave de partição entra no UNIQUE | ddl-constraints |
| 10 | Só um ativo por entidade | UNIQUE INDEX ... WHERE (ativo) | É índice, não constraint; não serve de alvo de FK | ddl-constraints |
| 11 | Pai e filho da mesma empresa | FK composta (empresa_id, id) → UNIQUE (empresa_id, id) no pai, empresa_id NOT NULL | Com coluna nula a FK é ignorada (MATCH SIMPLE); `ON DELETE SET NULL` sem lista de colunas anula empresa_id | ddl-constraints |
| 12 | Vigências sem sobreposição | `EXCLUDE USING gist (chave WITH =, vigencia WITH &&)` com `tstzrange`/`daterange` e `btree_gist` | Não serve de árbitro de `ON CONFLICT DO UPDATE`; limites `[)` por convenção | rangetypes |
| 13 | Vigências sem lacuna | Não há constraint declarativa confirmada; trigger adiado | `[DESCONHECIDO]`: confirmar antes de prometer | — |
| 14 | Cabeçalho e itens na mesma transação, em qualquer ordem | FK `DEFERRABLE INITIALLY DEFERRED` | `RESTRICT` não adia (`NO ACTION` adia); constraint adiável não é alvo de FK nem árbitro de ON CONFLICT | sql-createtable |
| 15 | Valor monetário exato | `numeric(p,s)` ou inteiro na menor unidade | Sem escala declarada não há coerção; `numeric` aceita NaN; `float` e `money` não | datatype-numeric; wiki "Don't Do This" |
| 16 | Total coerente com componentes da mesma linha | `GENERATED ALWAYS AS (...) STORED` | Só a mesma linha; não agrega filhos | ddl-generated-columns |
| 17 | Instante correto | `timestamptz`; datas contábeis como `date` | `timestamp` sem fuso ignora o offset em silêncio; `BETWEEN` com instante inclui as duas pontas | datatype-datetime |
| 18 | Isolamento entre tenants ou empresas | RLS com USING e WITH CHECK, `FORCE ROW LEVEL SECURITY`, política `AS RESTRICTIVE` para a regra de tenant | Superusuário e BYPASSRLS ignoram; UNIQUE/PK/FK ignoram RLS (canal lateral); UPDATE filtrado retorna 0 linhas sem erro | ddl-rowsecurity |
| 19 | Escrita só por rotina controlada | Função `SECURITY DEFINER` com `SET search_path = ''` (ou esquema e `pg_temp`), `REVOKE EXECUTE FROM PUBLIC` | Sem search_path fixo a função é sequestrável; EXECUTE vai para PUBLIC por padrão | sql-createfunction |
| 20 | Fila sem processamento duplo | `SELECT ... FOR UPDATE SKIP LOCKED` | Só para fila; a ordem não é garantida | sql-select |
| 21 | Processo exclusivo (fechamento, conciliação) | Advisory lock de transação | É convenção: só protege quem chama | explicit-locking |
| 22 | Ninguém derruba tabela crítica | Event trigger em `ddl_command_start` com `WHEN TAG IN` | Não cobre roles, bancos e tablespaces; pode ser desligado | event-trigger-definition |
| 23 | Trilha ou captura de mudanças | Trigger de auditoria na mesma transação, ou logical decoding | Slot parado retém WAL e pode derrubar o banco; entrega pode repetir | logicaldecoding-explanation |
| 24 | Pedido repetido não duplica | `INSERT ... ON CONFLICT (chave) DO NOTHING` | O árbitro exige constraint não adiável | sql-insert |
| 25 | Nova invariante em tabela com dados | `ADD CONSTRAINT ... NOT VALID` e depois `VALIDATE CONSTRAINT` | `NOT VALID` só barra linhas novas até validar | sql-altertable |

## O bypass que desliga triggers e FKs

`session_replication_role = replica` faz triggers comuns e regras não dispararem **e desliga todas as checagens de FK** (FKs são triggers). Só superusuários e quem tem o privilégio `SET` nesse parâmetro podem mudá-lo (documentação oficial, runtime-config-client). Por isso:

- Triggers que guardam invariante crítica usam `ALTER TABLE ... ENABLE ALWAYS TRIGGER`.
- Confira quem pode usar o parâmetro no projeto, por exemplo `select has_parameter_privilege('<papel>', 'session_replication_role', 'SET');` para cada papel que escreve. O papel da aplicação e o dos agentes não podem tê-lo.
- Em Supabase, o papel `postgres` (dono das migrações) é privilegiado. Migração que precise desse modo é exceção registrada, nunca rotina.

## Invariantes que os ERPs tratam como sagradas

Referência para pacotes de domínio, não para copiar o mecanismo deles (quase todos garantem só na aplicação):

- Lançamento balanceado, arredondado na moeda.
- Lançamento postado não muda em campos contábeis; correção por estorno ligado.
- Período fechado não aceita escrita; o fechamento travado só avança.
- Número legal sem lacuna por série; nome único só entre postados.
- Conta com lançamentos não é apagada.
- Reconciliação não casa linha já conciliada nem de outra conta ou empresa.
- Estoque: reservado + comprometido ≤ existente.
