# Segurança de dados

## Duas camadas: GRANT e RLS

- **GRANT** decide se o papel pode tocar a tabela; **RLS** decide quais linhas. As duas são necessárias.
- Revogue os privilégios padrão e conceda explicitamente o que cada papel precisa. Toda tabela nova nasce negada.
- Uma forma de garantir isso é um event trigger que liga RLS em toda tabela criada, e um teste que falha se aparecer tabela sem RLS ou sem política.

## Escrita por porta

- Escrita sensível é uma função transacional (uma porta): entrada validada, permissão checada **dentro** (`requer_poder('...')`), efeito e auditoria na mesma transação.
- `SECURITY INVOKER` é o padrão. `SECURITY DEFINER` só quando a função precisa de mais privilégio que o chamador, e então: `SET search_path = ''`, nomes qualificados, esquema não exposto, `REVOKE EXECUTE ... FROM PUBLIC` (e dos papéis anônimos) e checagem do ator no corpo.
- **"Só a tela impede" é defeito.** Duplo clique, duas abas e dois operadores são testados no banco.
- Mass assignment: a porta lê só os campos que aceita; campo de estado, dono, tenant e valor calculado nunca vêm do pedido.

## Poderes

- Permissão atômica (um verbo sobre um recurso: `pedido.cancelar`, `reembolso.emitir`) e papéis como conjuntos de poderes.
- **Segundo fator por poder**, não por tela, com recência: o poder sensível exige autenticação recente.
- **Duas pessoas** para operação de alto valor ou irreversível: quem pede não aprova.
- Autorização por campo e por estado do objeto: poder alterar o pedido não é poder alterar o valor de um pedido já pago.
- Revogação vale na hora: teste "revogar e repetir a chamada".
- Toda chamada entre módulos e toda leitura por IA carregam a identidade do usuário de origem. Executar como servidor depois de autorizar como usuário, nunca o contrário.

## Bypass nomeado

Liste no TRD cada caminho que ignora as garantias e quem pode usá-lo:

| Caminho | Ignora | Como restringir |
|---|---|---|
| Superusuário, dono das tabelas | RLS (sem FORCE), triggers (pode desligar) | Ninguém da aplicação usa; migração só por arquivo |
| Papel com `BYPASSRLS` / service role / secret key | RLS | Só no servidor, uma chave por componente, nunca no navegador nem em log |
| `session_replication_role = replica` | Triggers comuns e FKs | Triggers críticos com `ENABLE ALWAYS`; ninguém da aplicação tem o privilégio (ver `invariantes.md`) |
| `SECURITY DEFINER` | RLS do chamador | Regras acima; lista das funções definer revisada |
| Desligar trigger, `TRUNCATE` | Imutabilidade | Só o dono; trigger de TRUNCATE; event trigger que alerta |

Bypass sem nome é defeito. Cada uso de bypass em produção fica auditado.

## Dado pessoal e classificação

- Cada coluna tem uma classe: **público**, **interno**, **pessoal**, **segredo** (e, quando o domínio pede, **financeiro** e **fiscal**). O nível pertence ao dado; hash de espaço pequeno (telefone, CPF) mantém o nível.
- Uma matriz audiência × classe diz onde cada nível pode aparecer (tela, API, log, IA, exportação). Pessoal e segredo nunca vão para URL, log ou bundle do navegador.
- Inventário de dados: tabela, classe, finalidade, retenção, quem vê e o **eraser** (a função que apaga ou anonimiza por titular). Retenção legal (fiscal, contábil) prevalece sobre o apagamento: anonimize o que identifica a pessoa e mantenha o fato.
- Trilha de auditoria guarda referência ou pseudônimo, para o eraser não precisar editá-la.
- As quatro perguntas de toda mudança: que segredo nunca é guardado; como o apagamento alcança o dado pessoal; o que limita o crescimento anônimo; por quanto tempo fica e como sai.

## Leitura por IA

- A IA lê **com a permissão do usuário** que a acionou, nunca com service role.
- Lê por projeções próprias (views com `security_invoker = true`), sem colunas de classe pessoal ou segredo, salvo finalidade registrada.
- Embeddings herdam tenant, empresa e permissão da linha de origem; o eraser e a retenção os alcançam.
- Texto livre de terceiros (mensagem de cliente, documento recebido) é dado, não instrução.
- A IA não escreve no domínio: propõe. O mecanismo está na skill `ca-arquitetura` (camada cognitiva, quando existir) ou em pacote de IA.
