# Modelo de relatório

Use este modelo nos modos revisar, revisar mudança, auditar deriva e bancada, e no fechamento dos modos de criação. Apague as seções que não se aplicam ao modo, mas nunca "O que não foi verificado" nem o veredito.

---

**Veredito:** Aprovado no escopo verificado | Requer correções | Evidência insuficiente (motivo)

## Diagnóstico

Duas ou três frases: o estado geral, o problema que mais pesa e o que resolve a maior parte. Sem lista.

## Escopo e cobertura

- **Modo:** revisar | revisar mudança | auditar deriva | bancada | fechamento de criação
- **Escopo:** rotas, telas, fluxos e pontas incluídos. No modo mudança: base, cabeça e SHAs.
- **Fronteira:** o que ficou de fora e por quê.
- **Stack:** framework, estilos, biblioteca de componentes, tokens.
- **Documentos do projeto:** `DESIGN.md`, `CLAUDE.md`, `AGENTS.md`, tabela de estados, DECs (ou "não há").
- **Protótipo aprovado:** versão e DEC (ou "não há"; ou "portão pulado por ordem do usuário em DD/MM/AAAA").
- **Viewports e estados percorridos:** por exemplo 1366×768, 768×1024 toque, 390×844 toque; carregando, vazio, erro, sem permissão, pior caso.

| Domínio | Evidência inspecionada | Resultado |
| --- | --- | --- |
| Pontas e sistema (PON) | tabela de estados, payload da ponta cliente | 2 achados |
| Estados e UI otimista (EST) | bancada da lista de pedidos | sem achados |
| Acessibilidade (ACE) | Tab pelo roteiro da tarefa, contraste computado | 1 achado |
| Navegação (NAV) | … | … |
| Formulários e camadas (CAM) | … | … |
| Listagens e filtros (LIS) | … | … |
| Indicadores e gráficos (IND) | … | … |
| Dispositivos e entrada (DIS) | … | … |
| Cliente (CLI) | … | … |
| Chat e notificações (COM) | … | Não revisado: não há chat neste escopo |
| Microtexto (TXT) | … | … |
| Movimento (MOV) | … | … |
| Tokens e governança (TOK, GOV) | … | … |

Um domínio só fica "sem achados" se a célula de evidência nomeia o arquivo, a tela ou a checagem. Sem isso, "Não revisado: motivo".

## Achados

Ordene por prioridade e, dentro dela, por alcance: um token ou componente compartilhado vem antes do mesmo sintoma numa folha. Uma causa é uma linha, com todos os locais. Até 15 achados; P0 e P1 nunca ficam de fora por causa do teto.

| ID | Prioridade | Local e cenário | Evidência e impacto | Correção | Aceite |
| --- | --- | --- | --- | --- | --- |
| A1 | P0 · [N] · PON-12 | `api/pedidos/[id].ts:42`; ponta cliente, pedido em análise | O payload do cliente traz `score_antifraude` e `nota_interna` (resposta de rede capturada). Expõe dado interno ao titular e a quem tiver o link | Montar o payload por papel no servidor; remover os campos da resposta do cliente | Resposta de rede da ponta cliente sem os dois campos em todos os estados do pedido |
| A2 | P1 · [N]/[DS] · EST-16 | `components/SalvarPedido.tsx:88`; celular 390×844, erro de rede | O erro aparece só num toast de 4 s e some; a entrada se perde (captura `a2-erro.png`). O operador acha que salvou | Erro inline junto ao formulário com a entrada preservada e "Tentar de novo" | Com a rede derrubada, o erro fica na tela até ação e o texto digitado continua lá |
| A3 | P2 · [PR] · MOV-02 | `components/PaletaComandos.tsx:31`; desktop 1366×768, atalho Ctrl+K | A paleta aberta pelo teclado entra com 300 ms de escala (gravação `a3-paleta.webm`). Quem usa atalho espera a cada vez | Abrir sem animação quando o gatilho é teclado; manter a animação só no clique, se houver | Ctrl+K mostra a paleta no quadro seguinte, com o foco já no campo |

No modo revisar mudança, acrescente a coluna **Status** depois da prioridade: Introduzido, Regressão, Pré-existente, Diverge do aprovado ou Sem protótipo aprovado. O veredito considera só Introduzido, Regressão e as divergências.

Os arquivos e cenários dos exemplos são fictícios; os IDs são reais. Use sempre IDs de `references/checklist.md`.

Sem achados: "Nenhum achado acionável no escopo verificado."

## Exceções registradas

| Regra | Onde | Motivo | Quem decidiu e quando |
| --- | --- | --- | --- |
| … | … | … | … |

## Decisões para o usuário

Escolhas que dependem de negócio ou gosto e que a skill não deve tomar sozinha. Numere e dê a recomendação com o porquê.

1. Nome longo de cliente na lista: truncar com tooltip ou quebrar em duas linhas? Recomendo truncar, porque a lista é de varredura e o nome inteiro está no painel de detalhe.
2. …

## O que resistiu

O que foi testado e se comportou bem. Ajuda a não "consertar" o que funciona.

## O que não foi verificado

| Grupo | Itens |
| --- | --- |
| Verificado executando | comando ou interação e resultado (ex.: `npm run build` limpo; Tab pela tarefa de cancelar pedido em 1366×768) |
| Só passou em tipos ou build | … |
| Não verificado | o que não rodou e por quê (ex.: rota autenticada sem conta de teste) |
| Precisa de dispositivo | Safari iOS, teclado virtual, leitor de tela, toque real, desempenho em celular intermediário |

## Mudanças realizadas e pendências

Só quando houve correção autorizada: arquivos alterados, o que cada mudança resolve (por ID) e o que ficou pendente com justificativa.

---

`REVISAO: APROVADO-NO-ESCOPO` | `REVISAO: REQUER-CORRECOES <n>` | `REVISAO: EVIDENCIA-INSUFICIENTE (<motivo>)`
