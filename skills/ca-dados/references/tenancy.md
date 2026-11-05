# Tenancy e multiempresa

## Tenant não é empresa

| | Tenant | Empresa / filial |
|---|---|---|
| O que é | Cliente do sistema; fronteira de dados | Entidade legal, fiscal ou contábil dentro do cliente |
| Compartilha dados com outro? | Nunca | Pode (cadastros comuns ao grupo) |
| Coluna | `tenant_id`, nunca nula | `empresa_id`, pode ser nula para registro compartilhado |
| Garantia | RLS `AS RESTRICTIVE` + `FORCE ROW LEVEL SECURITY` | FK composta (empresa_id, id) e lista de empresas permitidas do usuário |

"Empresa só para entidade legal separada; o resto é dimensão" (ERPNext). Centro de custo, filial operacional e loja costumam ser dimensões, não empresas.

## Árvore de decisão

Sem as respostas de P0, P1, P2 e P5, **não gere schema**: pergunte à pessoa e registre a decisão como ADR.

- **P0.** Quem é o cliente e o que é o tenant?
- **P1.** Mais de um cliente na mesma instalação ou banco? **Não** → instalação por cliente, sem `tenant_id`. **Sim** → P2.
- **P2.** Algum cliente exige, por contrato ou lei, dados separados, chave própria, backup próprio ou região própria? **Todos** → silo (recurso dedicado por tenant). **Alguns** → ponte (pool, e silo para esses). **Nenhum** → P3.
- **P3.** Muitos tenants pequenos e parecidos → pool (tabelas compartilhadas com `tenant_id`). Poucos e grandes, com risco de um atrapalhar o outro → ponte ou silo.
- **P4.** Há automação para migrar e monitorar N bancos? **Não** → pool, ou instalação por cliente com poucos clientes.
- **P5.** Há várias empresas ou filiais dentro do cliente? **Sim** → `empresa_id` como dimensão de negócio (vale também na instalação por cliente). **Não** → não crie "por precaução".
- **P6.** Personalização de schema por cliente? No pool, use tabela de extensão (satélite), nunca coluna por cliente.
- **P7.** Relatório entre tenants? Silo e ponte exigem um repositório analítico central.

Virar SaaS depois de nascer como instalação por cliente exige migrar todo o schema para ter `tenant_id`. A decisão custa pouco agora e muito depois.

## RLS para tenant: armadilhas

- Sem política, tudo é negado (e pela API do Supabase volta lista vazia, não erro).
- Dono da tabela, superusuário e `BYPASSRLS` ignoram RLS. `FORCE ROW LEVEL SECURITY` submete o dono.
- `USING` filtra o que se lê; `WITH CHECK` valida o que se escreve. A regra de tenant precisa dos dois.
- Políticas permissivas se somam por OU; a do tenant é `AS RESTRICTIVE` (E com as demais).
- FK, UNIQUE e PK ignoram RLS: a existência de um valor em outro tenant pode vazar por erro de unicidade.
- Sub-SELECT dentro da política tem custo e corrida; prefira coluna no próprio registro e função estável.
- O tenant do usuário vem de dado que ele não edita (no Supabase, `app_metadata`, nunca `user_metadata`) e pode estar velho até o token renovar: operação crítica reconfere no banco.
- O tenant entra também em chave de cache, nome de fila, chave de idempotência e nome de arquivo.

## Instalação por cliente, sem tenant

A RLS continua obrigatória: ela separa usuários e papéis. Exemplo de política por poder:

```sql
create policy le_proprio_saldo on fidelidade.saldos
  for select to authenticated
  using (cliente_id = (select app.cliente_do_usuario()) or (select app.tem_poder('fidelidade.ver_todos')));
```

`app.cliente_do_usuario()` e `app.tem_poder()` são funções estáveis do núcleo, `security definer` com `search_path = ''`, fora do schema exposto.

## Teste de isolamento (obrigatório)

Crie os tenants A e B (e duas empresas dentro de A, se houver) e, com o papel real:
- A tenta ler, alterar, apagar e mover registros de B;
- A tenta inserir registro com `tenant_id` de B;
- chamada sem contexto de tenant (deve falhar, não ver tudo);
- token com claim antiga depois de remover o acesso;
- filho de uma empresa apontando para pai de outra.

Todos devem falhar. Ver `testes.md`.
