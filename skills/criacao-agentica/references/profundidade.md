# Profundidade: quanto contrato o trabalho precisa

Comece pelo menor conjunto de detalhes que permite uma entrega correta. Aprofunde quando aparecer dependência, risco ou ambiguidade concreta. O nível é a primeira decisão do projeto: registre-o como `ADR-0001` em `docs/adr/` (ele é difícil de reverter e explica a profundidade dos documentos) e repita-o no ESTADO.

## A escada do contrato

A mesma escada da ponytail, aplicada a documentos. Para cada documento ou seção, pare no primeiro degrau que resolve:

1. **Precisa existir?** Se ninguém vai decidir, construir ou verificar nada a partir dele, não escreva. Diga em uma linha o que ficou de fora.
2. **Já existe?** Um briefing, o código, um documento atual, uma ADR. Aponte para ele.
3. **Cabe numa linha** de um documento que já existe (o PRD, o TRD, a TAR)? Uma linha.
4. Só então, seção ou documento próprio, o mais curto que ainda responde aos campos.

**O piso não passa pela escada:** validação na fronteira de confiança, tratamento de erro que evita perda de dados, segurança, isolamento entre usuários e acessibilidade. Em projeto com dados reais, os estados de erro do fluxo existem sempre; com mais de um usuário, também a matriz de autorização do schema e os CA de isolamento, por menor que seja a entrega. O tamanho de cada um segue o dano (ver "Proporcionalidade do piso" abaixo).

## Os quatro níveis

| Nível | Quando | Foco |
|---|---|---|
| `prototipo` | Hipótese visual ou de fluxo; nada é real | Hipótese, fluxo e UI. Dados simulados identificados. Nenhuma alegação de operação real |
| `mvp` | Usuários reais, dados reais | Persistência, autorização, erros, operação e jornada principal verificáveis |
| `transacional` | Dinheiro movimentado, estoque, dados de terceiros em volume, reserva cujo conflito causa prejuízo | Regras de estado, concorrência, repetição de operações, integrações e recuperação |
| `evolucao` | Produto existente recebendo mudança | Diagnóstico do atual, contratos preservados, documentação concentrada na mudança |

Na dúvida entre dois níveis, escolha pelo pior dano possível de um erro, não pelo tamanho do código. Um app pequeno que guarda dados de saúde é `mvp` ou mais. O agente recomenda o nível; a pessoa confirma.

**Casos que confundem:**

| Caso | Nível | Por quê |
|---|---|---|
| App pessoal, um dono, dados só no aparelho (lista de empréstimos, controle de hábitos) | `mvp` local | Dados reais, mas um usuário só: sem schema próprio (uma seção "Dados" no TRD), sem autorização entre usuários; o piso é não perder dados (não gravar por cima do ilegível, exportar) |
| Agenda ou reserva em que o conflito é um incômodo (dois clientes no mesmo horário de barbearia) | `mvp` | O conflito vira RN e CA de concorrência; não há dinheiro nem dano grande |
| Reserva em que o conflito custa dinheiro (passagem, ingresso pago, estoque) | `transacional` | O conflito é prejuízo; pede regras de estado e recuperação |
| Dois usuários conhecidos dividindo dados (casal, sócios) | `mvp` | Há autorização entre eles e isolamento contra terceiros, mas sem volume |
| Mudança num projeto existente que passa a guardar dados de outras pessoas (login novo) | `evolucao` com a matriz de `mvp` para a parte nova | O que existe fica Δ; o que nasce segue o nível do dano novo |

Antes do primeiro cliente real (`mvp` com dados reais, `transacional`, `evolucao`), a **entrega 0** deixa o sistema operável: backup restaurado, monitor, alertas, isolamento de ambiente e roteiro de incidente (skill `ca-dados`, `references/operacao.md`). Sem ela, publicar para cliente real fica bloqueado por uma LAC.

## Matriz documento × nível

`●` obrigatório, como arquivo próprio ou como seção completa de outro · `◐` seção curta (pode viver dentro do PRD ou do plano) · `○` uma linha `[NÃO SE APLICA — motivo]` · `Δ` só o que a mudança toca

| Documento | prototipo | mvp | transacional | evolucao |
|---|---|---|---|---|
| ESTADO | ● | ● | ● | ● |
| 01 PRD | ◐ | ● | ● | Δ |
| GLOSSARY.md | ◐ | ● | ● | ● |
| README (índice + autonomia) | ○ | ◐ | ● | ◐ |
| REVIEW.md | ○ | ◐ | ● | ◐ |
| 02 TRD | ○ | ◐ | ● | Δ |
| 03 Fluxo do app | ◐ | ● | ● | Δ |
| 04 Briefing de UI/UX | ◐ | ◐ | ◐ | Δ |
| 05 Schema do backend | ○ | ● (◐ em `mvp` local) | ● | Δ |
| 06 Plano de implementação | ◐ | ● | ● | ● |
| docs/agents/ (integração com o motor) | ○ | só se usar `to-tickets`, `implement-spec` ou `wayfinder` | idem | idem |

Nenhum documento nasce antes de o modo que o usa precisar dele: veja a ordem no Iniciar de `modos.md`.

Notas:

- **Sem backend:** o schema vira uma seção "Dados" no TRD ("dados no localStorage, dono único, nada sincronizado") e diz explicitamente o que é local, temporário ou inexistente. Não crie banco nem login só para preencher o modelo.
- **Sem tela** (só API, CLI, job): o fluxo vira o contrato de cada operação (entrada, validação, efeito, saída, erros), que pode morar no schema; o briefing de UI/UX é `[NÃO SE APLICA — sem tela]`.
- **Briefing completo recebido:** guarde-o literal em `docs/brief.md`; ele é a fonte e não é editado. Escreva apenas o que ele deixa em aberto, quase sempre os estados do fluxo e o plano.
- **Mudança que não altera comportamento:** nenhum documento novo; só a TAR com seus CA.
- **Funcionalidade que muda comportamento:** atualize PRD (requisito e CA) e fluxo (telas e estados novos) no mesmo commit da implementação.
- **Arquivo ou seção:** no início, os seis podem ser seções de um arquivo só. Separe quando o volume justificar. `●` exige o conteúdo completo, não um arquivo.
- **Proporcionalidade do piso:** o piso (erros, perda de dados, autorização, isolamento, acessibilidade) nunca some, mas tem o tamanho do dano. Num app pessoal, "não perder dados" pode ser não gravar por cima do que não se conseguiu ler; num SaaS, é transação, backup e restauração testada.

## Mudança de nível

Um projeto sobe de nível quando passa a guardar dados de outras pessoas, a cobrar ou a ter efeitos difíceis de desfazer. Registre a mudança como nova ADR, que substitui a ADR-0001, e rode o modo Auditar com a matriz nova: os documentos que passaram de `○` ou `◐` para `●` viram lacunas.
