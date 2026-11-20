# Modos: o procedimento de cada um

Leia a seção do modo escolhido antes do primeiro passo dele. As regras da casa, os portões, os selos, a família e o formato do relatório estão no `SKILL.md` e valem aqui também. Os portões aparecem em negrito.

## Antes de qualquer modo

Depois do "Ao entrar, sempre", faça o recon do stack (`references/stack-e-bibliotecas.md`, STK-01): framework, biblioteca de componentes e primitivas, CSS, pacote de ícones, toaster, fonte de tokens, comando de dev e porta, viewports suportados e, com a `criacao-agentica`, o `Rodar:` do ESTADO (a prova do projeto). No recon, confira também se links e caminhos respeitam o `base` do build (STK-25: grep por `href="/` e build numa subpasta) e se o layout tem transição de página sem piscar o shell nem o tema (STK-26; no Astro, o `ClientRouter`). Procure um **kit de componentes fornecido pela pessoa** (uma pasta como `componentes-de-referencia/`, com README de onde cada um cabe): se existir, ele vem antes do catálogo para os papéis que cobre (ARS-09, STK-27). Sem stack no projeto, o protótipo parte do **starter** do arsenal (`assets/arsenal/starter/`, ARS-11): leia o `LEIAME.md` dele antes de copiar. Todo modo que muda o sistema termina atualizando os documentos afetados (DOC-12).

**Lentes** (`references/lentes-e-ferramentas.md`): nos modos 1, 2 e 3, `break-ui` (pior caso) e `better-layout` (composição da tela-chave) rodam obrigatoriamente quando instaladas, cada uma num subagente de contexto limpo que devolve só os achados; sem elas, valem VER-32 e NAV-40. As outras lentes ficam para a revisão e a v2.

| Modo | Entrega | Modelo em `assets/` |
| --- | --- | --- |
| 1. Criar do zero | sozinha: pacote com perguntas e suposições, mapa de pontas e objetos, projeção, MVP, referências, protótipo v1 e pedido de aprovação; com a `criacao-agentica`: rodada de entrevista sem arquivos, depois o Especificar da entrega 1; no fim, build verificado e `DESIGN.md` | `modelo-tabela-de-estados.md`, `modelo-folha-do-sistema.md`, `modelo-rodada-de-aprovacao.md`, `modelo-design-md.md`, `modelo-relatorio.md` |
| 2. Tela ou fluxo | linha nova da projeção, rodada de aprovação, depois build verificado | `modelo-rodada-de-aprovacao.md`, `modelo-folha-do-sistema.md` (se o sistema não tiver folha), `modelo-relatorio.md` |
| 3. Revisar | relatório com achados P0 a P3 e veredito | `modelo-relatorio.md` |
| 4. Revisar mudança | relatório com status por achado e bloco de escopo com SHAs | `modelo-relatorio.md` |
| 5. Auditar deriva | relatório com métricas, inventário e plano de consolidação | `modelo-relatorio.md` |
| 6. Bancada | página descartável e "o que quebrou / o que resistiu / decisões para você" | `modelo-relatorio.md` (achados e decisões) |

## 1. Criar do zero

A primeira entrega não é código de produção, back-end, banco nem auth. O que ela é depende do cenário (DOC-14).

### Com a criacao-agentica (cenário 1)

A `criacao-agentica` pergunta antes de criar arquivos, e esta skill segue o Iniciar dela.

1. **Rodada de entrevista, sem arquivos.** No formato da `grilling`: perguntas numeradas, cada uma com a sua recomendação, redigidas para que "sim" a aceite. Além do que a `criacao-agentica` cobre (quem usa, onde ficam os dados, dinheiro, autonomia, nível), traga o que é de interface: as pontas e os atores, o objeto principal e o seu ciclo de vida, a tarefa que paga a conta, os dispositivos, os sistemas que já existem, as restrições de marca ou legais (fontes, cores e fotos que já são da marca) e os **três atributos de marca**, com o que o produto não é (`references/direcao-e-personalidade.md`, PER-03), e as práticas do domínio de onde podem sair os momentos-assinatura (EXP-56). O mapa de pontas e objetos e o recorte de MVP entram como leitura de volta, para confirmar. A única exceção a "sem arquivos": um briefing completo vai literal para `docs/brief.md` na hora (DOC-11).
2. Confirmados nível e escopo, a `criacao-agentica` cria PRD, ESTADO, ADR-0001 e `GLOSSARY.md`. Na v1, o que é desta skill vai como resumo de uma página; PRD, schema e glossário completos só depois da escolha da direção (PRO-28), respeitando o mínimo que a `criacao-agentica` exige no Iniciar.
3. **Especificar da entrega 1**, conduzido por ela, com esta skill nos passos de interface: `03` com pontas, objetos e tabela de projeção (os estados canônicos e as transições vão para o `05` pela `ca-dados`), **referências** (com o moodboard de cada direção, REF-15), `04` com direção e sistema inicial (um tema por direção), `tokens.json`, e o **protótipo v1**, enxuto (PRO-28): copiado do starter (ARS-11), **funcional e navegável de ponta a ponta** (PRO-26), com a folha do sistema em claro e escuro (`assets/modelo-folha-do-sistema.md`, PRO-23), o **painel de aparência** em configurações (claro e escuro, vidro ligável em qualquer um dos dois, parâmetros ao vivo) e as 2 ou 3 direções de personalidade como **presets desse painel**, cada uma com a sua variação de layout da tela-chave e diferindo em densidade, layout, par tipográfico e material (PRO-27, PER-06, PER-19), mais o quadro de fluxos de todas as pontas do MVP. Tudo o que é SEMPRE entra (checklist de presença, `references/niveis-de-regra.md`): abertura (EXP-60), carregamento com a marca (EST-49), kit de movimento (MOV-35). A descoberta de personalidade inclui a **busca tipográfica** (3 a 5 candidatas por papel, de pelo menos duas origens, PER-18; um par diferente por direção, PER-19; fontes hospedadas no projeto, com licença e acentos conferidos, TOK-33) e o **uso de profundidade** de cada direção (planos, gradiente, sobreposição, textura, PER-20). Escolha os **2 ou 3 momentos-assinatura** a partir das transições da projeção e das práticas do domínio, passados no teste da troca (EXP-02, EXP-56), com o da tela-chave esboçado em cada direção (EXP-03), e as 1 a 3 ações-chave de cada jornada (EXP-57, MOV-33). Depois das referências e antes do protótipo, **use o arsenal** (`references/arsenal.md`, ARS-01): cada tela-chave importa pelo menos 1 componente do arsenal; se nenhum serve, busque no 21st.dev, use o que servir e escreva a "Proposta de adição ao arsenal". Parta do starter (ARS-11), com o kit da pessoa quando houver (ARS-09), e sirva num servidor local (STK-04); sem back-end, com dados falsos em pt-BR na camada de dados do starter. O nível `prototipo` serve quando nada ainda é real.
4. **Passada de refinamento, passada de vida e passadas de verificação**, antes de qualquer rodada. A estética só acrescenta: nada do brief sai da tela (EXP-59). A biblioteca é piso, não teto: depois de montar, complete a **moldura** (EXP-36: sidebar recolhível animada que lembra a escolha, barra superior global, barra de ferramentas com troca de vista, cabeçalho e primeira coluna fixos, fluxo longo em etapas, uma ação principal por tela, banner de entrada) e deixe os **componentes vivos** (refinados à personalidade, controle que responde, troca de tela com transição: EXP-39 a EXP-41, MOV-25, MOV-26). Depois, a **passada de vida** (EXP-48): uma resposta por pilar, com tela e elemento, e a tabela vai na rodada. Em seguida, as passadas que bloqueiam: **pior caso** (`break-ui` ou VER-32, com a tabela robusta de LIS-28), **composição** na tela-chave (`better-layout` ou NAV-40, com o cabeçalho de NAV-41), **corte e sobreposição** medidos em 1280, 1366 e 1440 (VER-33), **operador no celular** (DIS-22), `scripts/navegar.mjs` limpo (PRO-26) e o **checklist de presença** (VER-34). As capturas desta etapa são do subagente verificador e só para verificar (PRO-28). Repita tudo a cada versão (na v2 com todos os momentos rodando; na v3 com o acabamento de movimento).
5. **Rodada de aprovação** (`assets/modelo-rodada-de-aprovacao.md`). Enquanto ela não sai, cada TAR de tela fica bloqueada por uma LAC `protótipo`, `bloqueia-tarefa`, resolvida pela DEC de aprovação (DOC-15). Em app novo há três rodadas (PRO-10): **v1** enxuta (PRO-28), com as direções como presets no protótipo navegável e o quadro de fluxos; **v2** fluxos completos navegáveis, na direção escolhida, com todos os estados, em desktop, tablet e celular; **v3** visual fino e movimento. Back-end só depois da aprovação final.
6. Construção por TAR, segundo o Executar da `criacao-agentica`, com o checklist de promoção de `references/prototipo-e-aprovacao.md`. O lint de tokens e as baselines visuais entram no `Rodar:` do ESTADO: CA verde com prova vermelha não é pronto.
7. **Verificação** (`references/verificacao.md`), comparação do build com o aprovado e **QA de uso**: cenários por papel gerados da tabela de projeção e das transições do `05`, cada um com a linha "isto não pode ser possível", jogados pelo `ca-verificador-ui`.
8. Documentos: DEC no `04` (com a fonte escolhida, o motivo e a licença, TOK-13, TOK-33), `DESIGN.md` a partir de `assets/modelo-design-md.md` e a linha de interface no arquivo de instruções do agente (DOC-10).

### Sozinha (cenários 2 e 4, ou projeto sem a criacao-agentica)

Um pacote único, construído sobre suposições declaradas, que termina pedindo a aprovação. O usuário reage a algo concreto em vez de responder um questionário no vazio.

1. **Perguntas de descoberta**, curtas e numeradas, cada uma com a suposição usada para seguir (os mesmos temas do passo 1 acima, inclusive os três atributos de marca, PER-03, e as práticas do domínio, EXP-56). Só pare antes do resto se uma resposta mudar o produto inteiro (não dá para saber quem é o cliente).
2. **Mapa de pontas e objetos**, no resumo de uma página da v1 (PRO-28): atores por ponta, objetos com atributos, relações e papéis, e o ciclo de vida de cada objeto na tabela de projeção (`assets/modelo-tabela-de-estados.md`), com as transições marcadas `[PROPOSTO]` como insumo para o `05`.
3. **Recorte de MVP**: o que entra na primeira fatia, o que fica para depois e por quê.
4. **Referências** por ponta e tipo de tela, mais o moodboard de cada direção (`references/referencias-e-bom-gosto.md`, REF-15). Em seguida, **consulte o arsenal** (ARS-01) para as telas do MVP.
5. **Sistema de design inicial**: tokens em três níveis, um preset do painel de aparência por direção (claro e escuro, com e sem vidro, STK-12, PRO-27), com par tipográfico próprio (PER-18, PER-19, TOK-33), uso de profundidade (PER-20, TOK-34 a TOK-38) e molas (TOK-39), e componentes base da biblioteca (`references/fundamentos-e-tokens.md`, `references/stack-e-bibliotecas.md`, `references/governanca.md`), cada direção com a sua folha do sistema (`assets/modelo-folha-do-sistema.md`).
6. **Momentos-assinatura e ações-chave**: 2 ou 3 momentos tirados das transições da projeção e das práticas do domínio, com o teste da troca (EXP-02, EXP-56), e as 1 a 3 ações-chave de cada jornada (EXP-57, MOV-33).
7. **Protótipo v1**, como no passo 3 acima: copiado do starter (ARS-11), funcional e navegável (PRO-26), com o arsenal ou o 21st em cada tela-chave (ARS-01, ARS-02) e o kit da pessoa quando houver (ARS-09), servido em servidor local (STK-04), 2 ou 3 direções como presets do painel de aparência (PER-06, PRO-27), tudo o que é SEMPRE (checklist de presença) e o quadro de fluxos.
8. **Passadas de refinamento, de vida e de verificação**, como no passo 4 acima (EXP-36, EXP-39 a EXP-41, EXP-48, EXP-59, VER-32 a VER-34), antes de cada rodada.
9. **Rodada de aprovação**, nas mesmas três rodadas: v1 enxuta com as direções como presets e o quadro, v2 fluxos completos com todos os estados, v3 visual e movimento. O movimento se aprova no protótipo; vídeo só se a pessoa pedir (PRO-25).
10. Construção por fatia em cima do aprovado, com o checklist de promoção.
11. **Verificação** e comparação do build com o aprovado.
12. Documentos (DOC-11, DOC-12): DEC no `04` (com a fonte, o motivo e a licença, TOK-33), `DESIGN.md`, linha de interface no arquivo de instruções (DOC-10).

## 2. Tela ou fluxo novo num sistema existente

1. Leia `DESIGN.md`, tokens, componentes e telas vizinhas. O sistema existente manda, inclusive na personalidade: ela vem da identidade dele, e a proposta é acentuar, não trocar (PER-12). Procure o fluxo ou componente que já faz parte disto: atalho chama o fluxo existente.
2. Localize o objeto e a tabela de projeção. Estado novo de objeto é da `ca-dados` (canônico e transição no `05`); aqui entra a linha de projeção, e você pergunta que pontas ela toca (operador, cliente, notificação, chat).
3. Declare o tamanho da mudança na primeira linha do plano.
4. **Referências**, leves: de 3 a 6 padrões para tela ou fluxo; opcionais para ajuste. Depois, **use o arsenal** (ARS-01): a tela importa pelo menos 1 componente do arsenal, adaptado ao sistema existente (ARS-02, PER-12), ou um do 21st com a "Proposta de adição ao arsenal"; as peças do starter (painel de aparência, barra F, camada de dados falsos, `navegar.mjs`) entram adaptadas ao stack (ARS-11).
5. **Protótipo** no stack real, servido em servidor local (STK-04), com os componentes, os ícones e os tokens do projeto e fixtures atrás da interface do futuro fetch, com a bancada mostrando todos os estados. Se o sistema não tem folha do sistema (ou equivalente que cubra o que a tela usa), ela é a primeira página do protótipo (PRO-23). Use o kit da pessoa quando houver (ARS-09). Antes da aprovação, faça a passada de refinamento e de vida no tamanho da tela: a moldura do sistema respeitada e completa onde a tela toca (EXP-36), componentes vivos e transição de tela (EXP-41, MOV-25, MOV-26), a tabela de EXP-48 na rodada e, se a tela toca um momento de valor sem reconhecimento, um momento-assinatura do domínio como sugestão marcada (EXP-05). Antes da aprovação, as passadas que bloqueiam: pior caso (`break-ui` ou VER-32), composição (`better-layout` ou NAV-40, NAV-41), corte e sobreposição (VER-33), tabela robusta (LIS-28) e, se é tela de operação usada no celular, DIS-22; nada do que a tela mostrava antes some (EXP-59).
6. **Aprovação.** Com a `criacao-agentica`, a TAR fica bloqueada pela LAC `protótipo` até a DEC.
7. Construção a partir do sistema e do aprovado; valor que falta vai ao token mais próximo e é listado. A TAR lista os arquivos que pode tocar e o fluxo existente a reutilizar; prova do projeto verde antes de pronto.
8. **Verificação**, com captura do build ao lado do aprovado, e QA de uso por papel quando há mais de uma ponta ou transição. Atualize os documentos (DOC-12): FLX e projeção no `03`, tela e DEC no `04`, receita nova no `DESIGN.md`.

## 3. Revisar tela, fluxo ou app

1. Resolva o escopo e diga a fronteira. Grande demais para inspecionar com seriedade: reduza a um fluxo completo e diga o que ficou de fora.
2. Recon, incluindo a tabela de projeção, o `05` e o `DESIGN.md`, se existirem.
3. Percorra os domínios na ordem da tabela de referências do `SKILL.md`, com `references/checklist.md`. Com mais de uma ponta, inclua pontas, cliente e chat e notificações. Tela que soma, conta ou deriva status, ou payload maior que o papel, é achado. Inclua os achados de stack e personalidade de `references/verificacao.md` (lista A, A14 a A19): sem biblioteca de ícones, emoji como ícone, status sem selo, um cinza só, componente artesanal onde há biblioteca, sem folha do sistema; e os achados de falta e de excesso de VER-31 (tela plana, moldura ausente, sem transição de tela, controle sem resposta, conclusão sem reconhecimento, clichê, enfeite em tarefa frequente). Rode as lentes da revisão (`references/lentes-e-ferramentas.md`): `break-ui` e `better-layout` obrigatórias se instaladas, `better-interface` como segunda opinião, cada uma em subagente de contexto limpo. Meça no navegador, com antes e depois sob dados de pior caso (VER-32, VER-33, B32, B34): composição, cabeçalho, tabela robusta e corte entram como achados P1 (NAV-40, NAV-41, LIS-28, VER-33); em app criado do zero, confira também o checklist de presença (VER-34).
4. Achados P0 a P3 com evidência, uma causa por linha.
5. Referências entram só como evidência de crítica ("3 de 3 apps de entrega põem a data acima do mapa"), com orçamento mínimo.
6. Entregue o relatório (`assets/modelo-relatorio.md`) e pare.
7. Se o usuário pedir correção: proponha-a com a biblioteca e os ícones que o projeto já usa (STK-06, STK-07); para P0 e P1, mostre **antes e depois lado a lado para aprovação**; ajustes pequenos vão agrupados num só pedido. Aplique o que for autorizado e **verifique de novo**.

## 4. Revisar mudança (diff ou PR)

1. Resolva o escopo pelo merge-base, mais arquivos não rastreados. Sem alvo claro, pergunte. Nunca faça `checkout` nem `stash` no trabalho do usuário.
2. Procure o protótipo e a DEC aprovados para o que mudou, e a TAR com os arquivos que ela pode tocar.
3. Compare captura do build com o aprovado quando houver.
4. Classifique cada achado: Introduzido, Regressão ou Pré-existente; mais **Diverge do aprovado** e **Sem protótipo aprovado** (P1 quando o tamanho exigia portão e não houve ordem de pulo). Diff fora dos arquivos da TAR e segundo fluxo para a mesma ação também são achados.
5. O veredito cobre só Introduzido, Regressão e as divergências. Este modo confere o portão, não o roda. No loop da entrega, a comparação com o aprovado é julgamento: vai para o relatório "Para ler", não para a condição.

## 5. Auditar deriva

1. Meça as métricas de deriva de `references/governanca.md`: literais fora de token, componentes duplicados, estilos livres em tela de produto, segundo set de ícones, strings de status soltas.
2. Inclua a deriva entre pontas: o mesmo estado com rótulo ou cor diferente fora da projeção, notificação sem evento de origem, rótulo que não é a palavra da tela do `GLOSSARY.md`.
3. Reporte cada achado contra a fonte (token, componente ou regra), não contra cada tela.
4. Entregue inventário, tendência se houver histórico e plano de consolidação em fatias pequenas. Correções seguem o portão de ajuste ou de tela.

## 6. Bancada de estados

É o motor dos protótipos e também um modo próprio.

1. Um componente ou tela por execução.
2. Estados vindos dos ramos do código e das linhas da projeção, agrupados em dados, conexão, acesso, operação e recurso. Inclua "não confirmado" (resultado desconhecido depois de timeout) e "módulo indisponível". Cada um sai alcançável, faltante ou contraditório.
3. Dados entram pela fronteira, sem editar o componente; seletor de estado fora do design system.
4. Sequências temporizadas: `otimista-sucesso`, `otimista-falha`, `duplo-clique`, `resposta-fora-de-ordem`, `refetch-com-filtro`, `conflito-entre-pontas`, `notificacao-atrasada`.
5. Pior caso pt-BR por eixo (nome longo, valor grande, zero itens, texto sem espaço).
6. Entregue a página e o relatório "o que quebrou / o que resistiu / decisões para você". A página é descartável: crie-a num caminho ignorado pelo git (por exemplo `.scratch/`, acrescentado ao `.gitignore` se faltar) ou apague-a antes do commit do modo, porque com a `criacao-agentica` o commit é automático. Escreva arquivos só neste modo ou a pedido; apague só com a palavra do usuário. Sem navegador, entregue a URL e diga que não conferiu.
