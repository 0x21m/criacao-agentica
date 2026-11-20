# Estados e UI otimista

Este arquivo é dono de: inventário de estados, máquina de estados, indicadores de espera, superfícies de feedback, UI otimista, Desfazer, vazios, queda de conexão e auto-refresh. Não cobre números (tempos, durações, tempo de toast: `fundamentos-e-tokens.md`), redação das mensagens (`microtexto-ptbr.md`), anatomia de modal e drawer (`formularios-e-camadas.md`), movimento (`movimento.md`) nem estado canônico entre pontas (`pontas-e-sistema.md`).

As regras guiam a construção e servem de critério de revisão. Cada uma tem ID, selo de força e prioridade mínima (piso). O piso pode subir pelo impacto na tarefa; nunca desce sem exceção registrada.

## Sumário

1. Todo componente tem um inventário de estados
2. Estado de negócio não é estado de operação
3. Uma máquina de estados, não flags soltas
4. Feedback imediato e indicador proporcional
5. Cada mensagem tem a sua superfície
6. UI otimista com rollback visível
7. Desfazer de verdade
8. Vazios que dizem por que estão vazios
9. A internet cai e nada se perde nem duplica
10. Dados que se atualizam sozinhos
11. Por ponta
12. Antes de terminar
13. Fontes

## 1. Todo componente tem um inventário de estados

- **EST-01** · [PR] · P2 (P1 se faltar erro de carga ou sem permissão em tarefa essencial). Monte o inventário abaixo para cada componente de dados e cada tela. Marque cada estado como `alcançável`, `faltante` ou `contraditório`. Faltante e contraditório são achados. *Porquê:* nenhuma fonte isolada traz a lista completa, e o agente tende a construir só o caminho feliz.

| Grupo | Estado | O que precisa ser verdade |
| --- | --- | --- |
| Dados | carregando inicial | Indicador pela árvore da seção 4; nunca "0" nem "sem dados"; `aria-busy` |
| Dados | vazio inicial, filtrado, concluído, nada selecionado | Textos e ações diferentes (seção 8) |
| Dados | erro de carga | Mensagem no local, "Tentar de novo", sem stack |
| Dados | um item, típico, página + 1, volume longo | Plural certo; paginação sem página vazia |
| Dados | parcial | Região com erro não derruba as outras |
| Dados | desatualizado / atualizando | Dados anteriores visíveis com sinal sutil |
| Conexão | offline, sessão expirada | Diz o que aconteceu e o que foi preservado |
| Acesso | sem permissão, somente leitura, dono, membro | Motivo e o que libera, ao lado do controle; linha com o mesmo layout |
| Operação | otimista pendente | Mudança no mesmo quadro, marca de pendente, sem duplo envio |
| Operação | falha revertida | Valor anterior de volta, mensagem local, entrada preservada |
| Operação | enviando (pessimista) | Rótulo e largura preservados, comando bloqueado |
| Operação | conflito | Frase específica e a ação que ainda cabe (seção 6) |
| Operação | não confirmado | Enviado sem resposta do servidor; resultado desconhecido, sem reenvio que duplique (EST-46) |
| Operação | job em andamento, job com falha parcial | "N de M", cancelar, relatório por linha |
| Recurso | limite atingido, bloqueado, trial | Por quê e o que libera |
| Recurso | módulo indisponível (desligado, fora do ar, desligado com dados) | A região diz qual dos três e o que fazer, sem derrubar a tela (EST-47) |
| Negócio | documento terminal | Sem Editar; a correção é estorno ou documento novo (EST-48) |

Estados de interação (hover, foco, pressionado, desabilitado, selecionado) são de `acessibilidade.md` e `formularios-e-camadas.md`.

- **EST-02** · [P] · P1. Nunca mostre "0", "Nenhum registro" ou "sem dados" antes da resposta chegar. *Porquê:* a NN/g aponta vazio impreciso como particularmente danoso; o usuário age sobre um zero que não existe.
- **EST-03** · [PR] · P2. Estado que o código não alcança não é estado. Não crie ramo só para mostrar na bancada. Liste-o como faltante. *Porquê:* a bancada verifica o produto, não uma fantasia dele.
- **EST-04** · [PR] · P2. Quando o design aprovado não desenha um estado do inventário, implemente-o com o padrão já existente no sistema (skeleton, vazio, erro) e marque como desvio a confirmar. Nunca invente visual novo. Nunca omita em silêncio.

## 2. Estado de negócio não é estado de operação

- **EST-05** · [PR] · P2. Separe os dois. Estado de negócio ("Vencido", "Em negociação", "Pago") é rótulo nominal curto de um vocabulário fechado do domínio. Estado de operação ("Salvando…", "Não foi possível salvar") descreve o que a interface está fazendo agora. Nunca use o mesmo desenho para os dois. *Porquê:* um badge "Pendente" que significa ora "aguardando cliente", ora "requisição em voo" engana o operador.
- **EST-06** · [DS] · P2. Objeto com vários eixos (ciclo, pagamento, entrega) mostra um badge por eixo, como o Pedido da Shopify. Não colapse eixos num status só no painel do operador. A cor semântica de cada estado vem do token de estado, igual em todas as pontas.

## 3. Uma máquina de estados, não flags soltas

- **EST-07** · [PR] · P2. Modele o estado de requisição como união discriminada com nomes: `ocioso | carregando | sucesso | erro`, com `atualizando` e `desatualizado` explícitos quando existirem. Proíba combinações que não fazem sentido. *Porquê:* `isLoading`, `isError` e `data` independentes produzem "carregando e erro ao mesmo tempo" e "vazio durante o carregamento", os dois achados típicos.
- **EST-08** · [PR] · P2. Objetos com ciclo de vida (pedido, chamado, agendamento) têm transições válidas declaradas por estado. Exemplo: `cancelar` só vale até `coletado`; depois vira `solicitar devolução`. A UI mostra só as ações válidas para o estado atual. A tabela de transições mora com a tabela de projeção (`pontas-e-sistema.md`).
- **EST-48** · [PR] · P1. **Documento terminal não se edita.** O que é definitivo (nota emitida, venda fechada, pagamento liquidado, caixa fechado, laudo assinado) não oferece Editar nem campos editáveis; a correção é a ação que o domínio prevê: estorno, cancelamento com motivo, carta de correção ou documento novo que referencia o original, com o vínculo visível nos dois ("Estornada pela nota 2026/000458"). Quais estados são terminais vem do `05` (`ca-dados`). *Porquê:* editar o definitivo deixa o número na tela diferente do que foi emitido, pago ou declarado, e a decisão seguinte se apoia em dado errado.

## 4. Feedback imediato e indicador proporcional

Tempos, atrasos e mínimos estão em `fundamentos-e-tokens.md`, seção "Tempo de resposta e espera". Aqui fica a decisão.

- **EST-09** · [P] · P1. Todo comando pinta feedback dentro do limite de resposta imediata: estado pressionado, marca de pendente ou item otimista. Medir também a métrica de campo (INP) não substitui isso. *Porquê:* o INP conta só até o próximo paint e ignora a rede; um salvamento de 3 s pode ter INP ótimo.
- **EST-10** · [P]/[DS] · P2. Escolha o indicador por esta árvore:
  1. Abaixo do limite de fluxo de pensamento: nenhum skeleton nem spinner; o feedback do comando basta.
  2. Indicador só aparece depois do atraso de exibição e fica o tempo mínimo visível, para não piscar.
  3. Tela ou página inteira com estrutura conhecida: skeleton com a forma real; estático no operador, shimmer suave aceitável na ponta do cliente, parando sob movimento reduzido (MOV-17).
  4. Um módulo isolado (card, painel): spinner local no módulo.
  5. Acima do limite de atenção, upload, download e conversão: barra determinada com estimativa e Cancelar.
  6. Lote: "N de M"; total desconhecido: nomeie o item atual.
  7. Nunca skeleton em toast, menu, dropdown ou modal.
- **EST-49** · [N casa] · P1 · SEMPRE. **Carregamento inicial com a marca.** Todo app criado do zero tem obrigatoriamente um estado de carregamento inicial do app (antes do primeiro dado, depois da abertura de EXP-60) com a marca: o logo ou o símbolo, a moldura já desenhada e o skeleton com a forma real da primeira tela (EST-10, item 3). Spinner solto numa tela vazia não serve. Ele obedece ao atraso de exibição e ao tempo mínimo de `fundamentos-e-tokens.md` (não pisca em carga rápida), para sob movimento reduzido (MOV-17) e, acima do limite de atenção, diz o que está carregando. No starter, a tela chega pronta no HTML e não há tela de carregamento à parte: a espera com a marca é a moldura já desenhada com o `Esqueleto` do `ComDados`, que se vê com `?estado=carregando` (`starter-erp.md`). *Por quê:* pedido do dono; a primeira espera é parte da marca e o spinner solto é a cara de app sem cuidado. *Verificar:* abrir o app com a latência simulada da camada de dados falsos (PRO-26); a espera mostra marca e forma da tela, nunca só um spinner.
- **EST-11** · [P] · P2. Acima do limite de fluxo de pensamento, mostre texto, não só um botão desabilitado. O rótulo do botão vira o andamento ("Salvando…") e mantém a largura. *Porquê:* botão cinza por 2 s parece travado; foi medido assim num demo.
- **EST-12** · [DS] · P2. Em refetch, troca de filtro, paginação ou troca de aba com dados já na tela, mantenha os dados anteriores com sinal sutil. Nunca volte ao skeleton. Use `placeholderData: (anterior) => anterior` no TanStack Query ou `useTransition` no React.
- **EST-13** · [PR] · P2. O conteúdo aparece sem depender de animação. Não comece contêiner de conteúdo com `opacity: 0` à espera de `requestAnimationFrame`. A troca de vista não espera a animação de saída. *Porquê:* com rAF estrangulado, quatro demos ficaram mais de 2 s em branco com a URL já nova.
- **EST-14** · [DS] · P3. Mostre o trabalho real quando ele informa ("Validando 1.240 linhas… 3 de 5"). Nunca acrescente atraso artificial para parecer trabalho. Atraso de commit com fim informativo só com modo rápido disponível, e zero em fila usada o dia todo.

## 5. Cada mensagem tem a sua superfície

- **EST-15** · [P]/[DS] · P2. Escolha a superfície pela natureza da mensagem:

| Superfície | Use para | Não use para |
| --- | --- | --- |
| No local (campo, linha, card) | Erro de validação, falha de mutação, estado do item | Evento que o usuário não causou |
| No botão | Andamento da própria ação | Resultado que precisa ficar |
| Banner da página | Condição persistente: offline, somente leitura, sessão expirando, ambiente de demonstração | Erro de validação; mais de um por página |
| Toast | Confirmação de baixo risco, Desfazer, conclusão de job fora da tela | Erro crítico; única cópia de informação |
| Central de notificações | Histórico, jobs, eventos de outras pontas | Feedback imediato de clique |

- **EST-16** · [N]/[DS] · P1. Erro nunca fica só em toast. Erro crítico nunca some sozinho. Toast que expira carrega só o que também existe em outro lugar. *Porquê:* a Atlassian proíbe auto-dispensar erro crítico; o WCAG 2.2.1 passa a valer quando a informação só existe no toast.
- **EST-17** · [DS] · P3. Ação frequente cujo resultado já aparece na tela não recebe toast. Uma ação tem, em regra, uma superfície de confirmação: o morph do botão ou o toast; os dois juntos só quando o toast traz o que o morph não traz (Desfazer, link para o objeto). *Porquê:* excesso de feedback treina o usuário a ignorar tudo.
- **EST-18** · [N] · P2. Toda mudança de estado de operação tem a sua mensagem de status, determinável sem foco: sucesso, contagem e "salvo" em `role="status"`, o urgente em `role="alert"`, sequência em `role="log"`. A mecânica do critério (WCAG 4.1.3, região pré-renderizada) é de `acessibilidade.md`; aqui se confere que nenhum estado do inventário fica mudo.
- **EST-19** · [N] · P2. Contador animado fica fora de região viva. Feed de alta frequência usa `aria-live="off"` com rótulo atualizado e um resumo pontual. *Porquê:* cada quadro de um count-up vira um anúncio.
- **EST-20** · [DS] · P2. Pause o timer de toast quando a aba fica oculta. Um erro que expira em segundo plano é um erro perdido. Mantenha um toaster só no app (`governanca.md`).

## 6. UI otimista com rollback visível

- **EST-21** · [DS] · P2. Classifique toda mutação numa de três classes, e registre a classe no inventário de mutações da tela. A matriz é inferência a partir de Vercel, React e TanStack; não há estudo sobre otimismo e confiança.

| Classe | Quando | Exemplos |
| --- | --- | --- |
| Otimista | Sucesso provável, efeito local e reversível | Alternar, renomear, reordenar, marcar como lido, mover card de estágio, edição inline |
| Otimista com Desfazer | Remoção reversível por um tempo | Arquivar; excluir com cópia temporária |
| Pessimista | Depende de validação do servidor, envolve dinheiro, afeta terceiros ou outro sistema consome na hora | Pagamento, estorno, emissão de nota, e-mail ao cliente, aprovação, permissão, estoque, unicidade, regra fiscal |

- **EST-22** · [PR] · P2. Transição de estado de objeto compartilhado entre pontas não é otimista. O servidor valida contra a versão atual. A ponta que perde recebe uma frase específica e a ação que ainda cabe ("O pedido já saiu para entrega. Recusar no recebimento ou pedir devolução"). Tela aberta com dado vencido avisa "Este pedido foi atualizado" antes de deixar agir. *Porquê:* rollback por snapshot sobrescreve a mudança de outra pessoa.
- **EST-23** · [DS] · P1. Falha otimista reverte de forma visível: valor anterior de volta, mensagem no local, entrada preservada e "Tentar de novo" sem redigitar. Rollback silencioso é proibido. *Porquê:* todas as bibliotecas e guias associam o rollback a mensagem; em silêncio, o usuário acredita que salvou.
- **EST-24** · [DS] · P2. Aplique a mudança no mesmo quadro do evento, com marca de pendente na linha. A marca fica onde a ação foi feita até o resultado ("3 tentando…"). Não some quando o retry dispara.
- **EST-25** · [DS] · P1. Bloqueie o envio duplicado com três peças: `aria-disabled="true"` no botão pendente, guarda no handler que ignora o segundo clique e chave de idempotência gerada antes do primeiro envio. Mantenha rótulo e largura. A escolha entre `disabled` e `aria-disabled` (e por que não usar os dois) é de ACE-15. *Porquê:* botão desabilitado sozinho não prova nada (um "Tentar 3 de novo" clicado duas vezes criou 6 execuções num demo).
- **EST-26** · [DS] · P2. Resposta antiga nunca substitui a atual. Cancele queries em voo no `onMutate`, use `useActionState`, form actions, fila ou `AbortController`. *Porquê:* Actions em Transitions não garantem ordem.
- **EST-27** · [DS] · P2. A mutação atualiza KPI, contagens, badges e totais no mesmo quadro, a partir de um store com contagens derivadas. Coerência entre superfícies é de `indicadores-e-graficos.md`.
- **EST-28** · [PR] · P1. O que a UI confirma sobrevive ao recarregar. Se não sobrevive, o ambiente está rotulado como demonstração. *Porquê:* o piso P1 vem da definição de dano de `verificacao.md` (perda de trabalho e decisão sobre informação incorreta: o usuário segue achando que salvou), não do selo.
- **EST-29** · [PR] · P2. Operação acima do limite de atenção, ou cujo tempo depende do volume (exportar, importar, atualizar em massa), vira job: resposta imediata ("Exportação iniciada"), usuário livre para navegar, status num lugar persistente com "N de M", Cancelar, notificação ao terminar com link para o resultado e relatório por linha na falha parcial. Retry de job é um objeto novo ligado ao original, pessimista. O padrão completo é inferência; nenhum design system documenta um centro de jobs.
- **EST-30** · [N] · P2. Paridade de canal: mover pelo teclado ou pelo menu tem o mesmo eco do arrasto (anúncio, toast, Desfazer). Slider pelo teclado faz um commit só, ao parar.
- **EST-31** · [PR] · P2. Restrição local é validada durante o gesto: o alvo inválido aparece antes de soltar. No drop inválido nada muda; o item volta com o motivo nomeado e sem Desfazer. Prévia "what-if" mostra o valor futuro, e o valor depois do commit bate com a prévia.

## 7. Desfazer de verdade

- **EST-32** · [N]/[DS] · P2 (P1 em ação destrutiva sem outro caminho). Desfazer nunca existe só no toast. Ele também fica no histórico, no menu do item ou em Ctrl+Z. Toast com ação respeita o tempo mínimo de `fundamentos-e-tokens.md` (seção "Movimento, toast, tooltip e gesto") e pausa no hover, no foco e com a aba oculta. A ação seguinte não destrói o Desfazer anterior sem deixá-lo no histórico. *Porquê:* se Desfazer só vive num toast temporizado, o WCAG 2.2.1 se aplica e a perda vira agendada.
- **EST-33** · [PR] · P1. O toast com Desfazer fica alcançável acima do backdrop de qualquer dialog aberto, no top layer, e pelo teclado (atalho anunciado ou foco alcançável sem atravessar a página). É a dona da regra "toast e Desfazer acima do backdrop"; ACE-10 e CAM-25 só remetem para cá. *Porquê:* num demo o toast ficou inerte atrás do backdrop e o Desfazer, inalcançável. O piso P1 vem da definição de dano de `verificacao.md` (perda de trabalho sem saída: a ação destrutiva fica sem reversão alcançável), não do selo.
- **EST-34** · [PR] · P2. O inverso mira o ID do registro, nunca a posição numa lista. Use delta quando a operação é aditiva e snapshot quando é troca de status. Desfazer devolve o item à posição exata e restaura a seleção.
- **EST-35** · [PR] · P2. Depois de uma ação que remove o próprio gatilho (arquivar, excluir, mover), o foco vai ao item afetado, ao próximo da lista ou ao título da região. Nunca ao `body`. Depois de Desfazer, o foco volta ao item restaurado.
- **EST-36** · [P] · P1. Confirmação só para consequência séria e irreversível, que afeta outras pessoas ou muitos itens. Ela abre com foco na ação menos destrutiva. Ação reversível e frequente age na hora e oferece Desfazer. Ação de alto impacto reversível pode ter os dois, e a confirmação cita a janela de Desfazer. Redação da confirmação: `microtexto-ptbr.md`.

## 8. Vazios que dizem por que estão vazios

- **EST-37** · [P]/[DS] · P2. Distinga as variantes, com texto e ação próprios:

| Variante | Mostra | Ação |
| --- | --- | --- |
| Primeiro uso | O que é o lugar, uma linha de mecanismo só se orientar | Criar o primeiro ("Novo cliente") |
| Trabalho concluído | Que a fila acabou ("Todas as verificações foram decididas") | Ir ao próximo trabalho, se houver |
| Filtro sem resultado | Os critérios ativos | Limpar filtros |
| Nada selecionado | O que escolher | Nenhuma |
| Erro | Que não foi possível carregar | Tentar de novo |

Nunca reaproveite o mesmo desenho e texto para vazio e erro. Nunca guarde informação persistente no vazio.

## 9. A internet cai e nada se perde nem duplica

As fontes primárias consultadas não cobrem offline, conflito de versão nem sessão expirada; os demos estudados não têm rede. As regras abaixo são inferência de praticante a partir das regras de idempotência e rollback, e ficam com piso P2 até haver evidência executada no projeto.

- **EST-38** · [PR] · P2. Conexão perdida vira banner persistente de página ("Sem conexão. As alterações ficam guardadas neste aparelho até voltar"), dito só se for verdade. Volta da conexão é anunciada em `role="status"`.
- **EST-39** · [PR] · P2. Cadastro em andamento nunca se perde: guarde o rascunho localmente a cada mudança de campo e restaure ao reabrir, com aviso "Rascunho restaurado de 14:32". Sessão expirada reautentica sem descartar a entrada.
- **EST-40** · [DS]/[PR] · P2. Venda, pagamento e emissão não duplicam quando a rede cai no meio. Gere a chave de idempotência no cliente antes do primeiro envio e reenvie sempre com a mesma chave. Enquanto não houver confirmação, mostre "Enviando, não confirmado" com "Verificar status", nunca um segundo botão "Vender". *Porquê:* o usuário que não vê confirmação clica de novo; a chave faz o servidor reconhecer o retry. O cabeçalho `Idempotency-Key` ainda é rascunho IETF; implemente a garantia no servidor do projeto.
- **EST-41** · [PR] · P2. Ação feita offline fica numa fila visível ("2 alterações aguardando envio"), com resultado por item ao sincronizar. Conflito na volta segue EST-22.
- **EST-46** · [PR] · P2 (P1 quando envolve dinheiro, emissão ou mensagem ao cliente). **Não confirmado** é um estado próprio: a operação foi enviada e o servidor não confirmou (timeout, conexão caiu depois do envio, resposta perdida), então o resultado é desconhecido. Não é erro nem sucesso: mostre "Enviado, ainda sem confirmação" com "Verificar status", que consulta o servidor pela chave de idempotência (EST-40); mantenha bloqueado o reenvio que duplicaria; nunca diga "não foi possível" nem reverta como falha antes de saber. Quando o servidor responde, o estado resolve para sucesso ou falha. A chave e a consulta de status são definidas com a `ca-dados`. *Porquê:* tratar o desconhecido como falha leva ao segundo clique, e a venda sai duas vezes.
- **EST-47** · [PR] · P2. **Módulo indisponível** é estado de região, não de tela. Quando um módulo opcional está desligado ou fora do ar (fronteira e eventos da `ca-arquitetura`), a região que depende dele diz qual dos três casos é: **desligado** ("Estoque não está ativo nesta conta", com quem liga, sem ação morta), **fora do ar** ("Estoque fora do ar. Os outros dados estão atualizados." + Tentar de novo) ou **desligado com dados** (dados antigos em somente leitura, com a data). O resto da tela segue funcionando; links e ações para o módulo somem ou ficam desabilitados com o motivo. *Verificar:* bancada com o módulo nos três casos.

## 10. Dados que se atualizam sozinhos

- **EST-42** · [N] · P2. Painel com polling, auto-refresh ou ticker tem o estado "pausado" no inventário, com a idade do dado à vista enquanto pausado. O controle de pausa ou de frequência é exigido por ACE-25 (WCAG 2.2.2), dono do critério; aqui se confere que o estado existe e é desenhado.

- **EST-43** · [PR] · P2. Dado novo não desloca o que o usuário está lendo. Mostre "3 novos itens. Mostrar" e anuncie a contagem em `role="status"`. Inferência sem fonte primária.
- **EST-44** · [PR] · P3. Dado que envelhece mostra quando foi atualizado ("Atualizado há 12 min. Atualizar") e marca como desatualizado quando passa do intervalo esperado. Inferência sem fonte primária.
- **EST-45** · [PR] · P2. Atualização automática não anima o valor do dado funcional (nada de count-up nem morph no polling, MOV-04): a célula ou o card que mudou ganha só o realce curto de MOV-31. O valor anima quando a mudança foi causada pelo usuário (`movimento.md`).

## 11. Por ponta

- **Operador:** eixos técnicos separados, densidade alta, fila "o que precisa de mim", jobs e falhas agrupadas por assinatura com "Tentar todas". Ação frequente sem toast.
- **Cliente:** uma frase de resultado com data e próxima ação, nunca o estado técnico. Pessimista em tudo que envolve dinheiro. Estado intermediário honesto quando depende do outro lado ("Cancelamento em análise. Resposta até 24/11 por e-mail").
- **Parceiro e entregador:** só o que precisa; conexão instável é o caso normal, então a seção 9 sobe de prioridade.

## 12. Antes de terminar

| Padrão detectável | Correção |
| --- | --- |
| `isLoading && isError` possíveis juntos; vários booleanos de requisição | União discriminada (EST-07) |
| `data?.length === 0` renderiza vazio sem checar carregamento | Ramo de carregando antes do vazio (EST-02) |
| Skeleton reaparece ao trocar filtro ou página | `placeholderData` ou `useTransition` (EST-12) |
| `disabled={isPending}` em botão de envio | `aria-disabled` + guarda no handler + idempotência (EST-25) |
| `onError` sem mensagem nem restauração | Rollback visível com entrada preservada (EST-23) |
| Mutação sem `cancelQueries` ou `AbortController` | Controlar ordem das respostas (EST-26) |
| `toast.error(` como único tratamento | Erro no local; toast só complementa (EST-16) |
| Undo só dentro de `toast({ action })` | Desfazer também no histórico, menu ou Ctrl+Z (EST-32) |
| Timer de toast sem pausa em hover, foco e `visibilitychange` | Pausar nos três (EST-20, EST-32) |
| `log.shift()` ou índice no inverso | Inverso por ID (EST-34) |
| `document.activeElement === document.body` depois de ação | Foco no item afetado, próximo ou título (EST-35) |
| `opacity: 0` inicial em contêiner de conteúdo | Conteúdo visível sem depender da animação (EST-13) |
| `role="alert"` em sucesso; contador animado dentro de `aria-live` | `role="status"`; contador fora da região (EST-18, EST-19) |
| Mesmo componente e texto para vazio e erro | Variantes distintas (EST-37) |
| `setInterval` de refresh sem controle visível | Pausa ou frequência (EST-42) |
| Formulário longo sem rascunho local | Rascunho restaurável (EST-39) |
| POST de venda sem chave de idempotência | Chave gerada antes do primeiro envio (EST-40) |
| Timeout de envio tratado como erro, com botão para enviar de novo | Estado "não confirmado" com Verificar status (EST-46) |
| Tela inteira em erro porque um módulo opcional caiu ou está desligado | Estado de região: desligado, fora do ar ou desligado com dados (EST-47) |
| Botão Editar em nota emitida, venda fechada ou pagamento liquidado | Estorno, cancelamento ou documento novo com vínculo (EST-48) |

## 13. Fontes

- NN/g: [Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/), [Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/), [Progress Indicators](https://www.nngroup.com/articles/progress-indicators/), [Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/), [Indicators, Validations, Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/), [Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/), [Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- W3C: [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [ARIA23 log](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA23)
- web.dev: [INP](https://web.dev/articles/inp)
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines); [Carbon Loading](https://carbondesignsystem.com/patterns/loading-pattern/); [Carbon Notification](https://carbondesignsystem.com/components/notification/usage/); [Atlassian Flag](https://atlassian.design/components/flag/usage); [GOV.UK Notification banner](https://design-system.service.gov.uk/components/notification-banner/)
- React: [useOptimistic](https://react.dev/reference/react/useOptimistic), [useTransition](https://react.dev/reference/react/useTransition); TanStack: [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates), [Placeholder data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data); [SWR Mutation](https://swr.vercel.app/docs/mutation)
- [IETF Idempotency-Key draft-07](https://www.ietf.org/archive/id/draft-ietf-httpapi-idempotency-key-header-07.html) (rascunho expirado em 18/04/2026)
- [Shopify Order status](https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status)
- Praticantes: skills `state-machine` e `better-writing` (Jakub Krehel); `emil-design-eng`, `ask-sonner`, `choreograph`, `write-swift` (Emil Kowalski); demos code&chill medidos (Rapport, Fernly, Tandem, Wynlo, Ostrel, Cadra, Caelo, Bastio, Noria)
