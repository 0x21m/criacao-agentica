# Evolução do schema

## Regras

- **Schema só muda por arquivo de migração** versionado. Nada de mudança manual no painel ou em produção.
- **Migração aplicada nunca é editada.** Correção é migração nova.
- **Expand–contract** para toda mudança que quebra quem lê ou escreve:
  1. expandir (coluna, tabela ou função nova, compatível com o código antigo);
  2. migrar dados e leitores, com backfill idempotente;
  3. contrair (remover o antigo) só quando nada mais o usa.
- **Remover coluna com dados:** coluna inerte → cópia para `_aposentada` → drop numa migração posterior. Um check recusa o drop sem a cópia.
- **Nova invariante em tabela com dados:** `ADD CONSTRAINT ... NOT VALID`, corrigir os dados antigos, `VALIDATE CONSTRAINT`. Registre o que foi corrigido.
- **Função redefinida várias vezes:** a verdade é o corpo vivo no banco, não a última ocorrência textual de `CREATE OR REPLACE`. Reescrever função de outro dono exige conferir que o corpo atual é o esperado (por exemplo, md5 do corpo).

## Fases da migração

| Fase | Quando roda | Para quê |
|---|---|---|
| Antes | Antes de o módulo atualizar seu schema | Preparar dados que a mudança vai exigir |
| Depois | Depois de o módulo atualizar | Backfill, recálculo de derivados |
| Fim | Depois que **todos** os módulos atualizaram | Migração que depende de outro módulo já atualizado (caso das pontes) |

## Backfill

Ligar um módulo sobre dados que já existem, ou criar coluna derivada, exige backfill:
- declarado (no manifesto do módulo, ver `ca-arquitetura`), não escondido num script;
- idempotente (rodar duas vezes dá o mesmo resultado);
- em lotes quando a tabela é grande, sem segurar lock longo;
- com teste que roda sobre um banco com dados de exemplo.

## Identidade dos dados de módulo

Dados que o módulo traz (plano de contas padrão, tabelas de domínio, papéis) têm chave natural estável (`modulo.codigo`), para atualizar sem duplicar e remover sem apagar o que é do usuário. Dado editado pelo usuário não é sobrescrito pela atualização.

## Baseline e reprodutibilidade

- O schema reconstruído do zero a partir das migrações deve ser igual ao banco atual. Um teste compara (estrutura, funções, políticas, grants).
- Snapshot de schema e registros gerados são gerados, nunca editados à mão; o teste falha se ficarem velhos.
- Restaurar o backup num ambiente isolado é testado periodicamente. Backup que nunca foi restaurado não é recuperação.
