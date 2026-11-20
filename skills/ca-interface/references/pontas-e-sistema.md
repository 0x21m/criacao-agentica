# Pontas e sistema (PON)

Cobre atores e pontas, objetos compartilhados, a projeção por ponta do estado canônico (a máquina canônica, as transições e quem pode mudam de estado moram no `docs/05-schema-backend.md`, dona: `ca-dados`; aqui fica como cada ponta mostra), propostas pendentes da IA, eixos de status, permissões e LGPD no payload, conflitos e tempo real entre pontas, passagens por link, temas por ponta e reservas de item único. Não cobre: jornadas e telas do cliente (`cliente.md`), chat e notificações (`chat-e-notificacoes.md`), UI otimista de ações locais (`estados-e-ui-otimista.md`), tokens e números (`fundamentos-e-tokens.md`), critérios WCAG (`acessibilidade.md`).

A unidade de trabalho aqui é o **objeto compartilhado**, não a tela. Um Pedido, Chamado, Agendamento ou Orçamento tem uma única máquina de estados, definida no `05` pela `ca-dados`; cada ponta (operador, cliente, parceiro, entregador, canais) recebe uma projeção dela. A tela é consequência dessa projeção.

Formato das regras: **ID** [selo] · prioridade mínima — regra. *Por quê* e *Verificar* quando ajudam. A prioridade é piso: suba se o caso pedir; para baixar, registre a exceção.

## 1. Atores e pontas

**PON-01** [P] · P1 — Antes da primeira tela de um sistema novo ou de uma ponta nova, monte o **mapa de ecossistema**: pessoas (cliente, operador, atendente, parceiro, entregador), organizações e produtos externos (transportadora, gateway de pagamento, WhatsApp) e superfícies (painel, app, portal, loja, e-mail, push). *Por quê:* a NN/g o recomenda no início da descoberta; sem ele, pontas e eventos aparecem tarde, quando mudar já custa caro. *Verificar:* arquivo de design nos modos de criar.

**PON-02** [P] · P2 — Faça **um blueprint de serviço (ou quadro de fluxos) por jornada distinta**, com **uma linha de visibilidade por público**. O frontstage do entregador é backstage para o cliente, então uma linha só não basta. Leia o blueprint assim:
- cada célula de evidência (e-mail, push, tela de status, comprovante) vira requisito de tela ou de notificação;
- cada seta que cruza uma linha de visibilidade vira evento: atualização em tempo real na ponta aberta ou aviso (ver `chat-e-notificacoes.md`);
- a camada de políticas e regulamentos é onde se anota a LGPD de cada etapa (seção 5).

*Verificar:* para cada seta que cruza a linha existe evento, linha na tabela de projeção e tela de destino.

**PON-03** [PR] · P3 — Mapa de jornada com **um ator por mapa** (NN/g). Não misture cliente e operador no mesmo mapa; junte-os no blueprint.

## 2. Objetos compartilhados (ORCA com coluna de papel)

Modele Objetos, Relações, CTAs e Atributos (ORCA, de Sophia Prater) antes das telas. Para sistemas com várias pontas, acrescente a coluna **papel** em dois lugares:

| Inventário | Pergunta da coluna papel | Exemplo |
| --- | --- | --- |
| CTAs por objeto | Quem pode executar? Em quais estados? | Cancelar: cliente até `coletado`; operador até `em_rota`; entregador nunca |
| Atributos por objeto | Quem vê? Quem edita? | Custo e margem: só operador gerente; telefone: entregador só durante a entrega |

**PON-04** [PR] · P2 — A matriz **papel × atributo × CTA** está documentada (arquivo ORCA ou equivalente) como leitura por ponta. A fonte das permissões é o `05` e as políticas do banco (dona: `ca-dados`); aqui se mantém o que cada papel vê e pode acionar em cada tela, conferido contra o `05`, e divergência vira LAC, não decisão da tela. *Por quê:* sem ela, cada tela decide sozinha quem vê o quê, e o vazamento aparece na revisão, não no desenho.

**PON-05** [PR] · P3 — O **mesmo identificador** do objeto (ex.: `#PED-10482`), definido no `05` pela `ca-dados`, aparece igual em todas as pontas, nas notificações e no chat. *Por quê:* o operador acha em segundos o que o cliente está vendo.

## 3. Uma máquina de estados por objeto, projetada por público

**PON-06** [DS]/[PR] · P1 — Todo objeto compartilhado tem **um estado canônico** no servidor, definido no `05` com as transições (dona: `ca-dados`), e uma **tabela de projeção** por público no `03`, que é desta skill. Nenhuma ponta inventa estado nem rótulo fora dela. Use `assets/modelo-tabela-de-estados.md`: estado interno, rótulo do operador, frase do cliente com a próxima ação, quem vê, notificação e canal principal, se o operador pode suprimir, cor semântica. *Por quê:* é o contrato que o protótipo mostra, a bancada percorre e a revisão confere. Com ela, o revisor aponta a linha violada. *Verificar:* grep de strings de status fora do arquivo de projeção; strings de status soltas em componentes são achado.

Recorte do modelo (Pedido de e-commerce):

| Eixo | Estado interno | Operador vê | Cliente lê (+ ação) | Visível para |
| --- | --- | --- | --- | --- |
| pagamento | `antifraude` | Em análise antifraude (score 0,71) | "Pagamento em confirmação" | cliente (frase), operador (motivo e score) |
| fulfillment | `on_hold_upsell` | Em espera (upsell) | "Pedido confirmado" (sem mudança) | só operador |
| entrega | `tentativa_falhou` | Tentativa 1 falhou (ausente) | "Não conseguimos entregar. Reagende" + Reagendar | cliente, operador, entregador |
| ciclo | `cancelamento_solicitado` | Cancelamento pedido: aprovar até 24/11 | "Cancelamento em análise. Resposta até 24/11 por e-mail" | cliente, operador |

**PON-07** [PR] · P2 — As **transições válidas por estado e por papel** moram no `05` (`ca-dados`); a tabela de projeção cita o código de cada transição e diz, por ponta, como a ação aparece. Exemplo: `cancelar` só vale até `coletado`; depois a ação vira `solicitar devolução`. O servidor aplica essas transições (seção 6), e a UI mostra só as ações válidas, ou mostra a ação desabilitada com o motivo quando o cliente espera encontrá-la (ver `cliente.md`).

**PON-08** [P] · P1 — A **timeline do cliente nunca contradiz a do operador**: mesma ordem de eventos, menos detalhe. O call center, o rastreador e o e-mail dizem a mesma coisa (NN/g, consistência entre canais). *Verificar:* bancada com a mesma sequência de eventos renderizada nas duas pontas.

**PON-09** [PR] · P2 — O operador vê, ao lado do estado interno, **a frase que o cliente está lendo** e a cópia do que foi enviado a ele (e-mail, push, WhatsApp). *Por quê:* o atendente responde ao que o cliente vê, não ao estado técnico. Padrão observado na timeline da Shopify e no Intercom.

**PON-10** [DS] · P2 — O mesmo estado usa o **mesmo token semântico de cor** em todas as pontas, mesmo quando o rótulo muda. Os tokens são escolhidos pelo significado, não pelo valor (Atlassian). Os valores ficam em `fundamentos-e-tokens.md`.

## 4. Eixos paralelos de status

**PON-11** [DS] · P2 — Separe **eixos ortogonais** em vez de um status único que mistura tudo. Para pedido: ciclo (aberto, arquivado, cancelado), pagamento (pendente, autorizado, pago, parcialmente pago, reembolsado…) e entrega ou fulfillment (não separado, em separação, parcialmente enviado, entregue…), como no admin da Shopify.
- No operador, mostre os eixos como **badges separados** ("Pago" + "Aguardando separação").
- Para o cliente, derive **uma frase** a partir dos eixos ("A caminho · chega até qui, 21/11").
- Cancelar não encerra todos os eixos: um pedido cancelado com reembolso pendente ainda dá trabalho. Mostre o eixo que ficou aberto ("Cancelado · reembolso pendente").

*Padrão detectável:* enum único com valores como `pago_enviado` e `cancelado_reembolsado`. É sinal de eixos colapsados.

## 5. Permissões e LGPD como regra de payload

A LGPD dá a base: necessidade, ou "limitação do tratamento ao mínimo necessário" (art. 6º, III); acesso facilitado do titular (art. 9º); acesso e correção (art. 18); registro das operações (art. 37); medidas de segurança técnicas e administrativas (art. 46).

**PON-12** [N] · **P0** — A API de cada ponta **devolve só os atributos do papel**. O payload por papel e a RLS são definidos pela `ca-dados` no `05`; aqui se confere, ponta por ponta, que a resposta não traz mais do que a projeção mostra. Notas internas, score e motivo de antifraude, custo, margem, nome do atendente, SKU interno e erro bruto **nunca entram no payload do cliente** nem no do parceiro sem necessidade. *Por quê:* esconder no front (CSS, `hidden`, condicional de render) não é medida de segurança (art. 46). O dado está na aba Rede de quem abrir o DevTools. *Verificar:* inspecionar as respostas de rede na ponta cliente e em links públicos.

**PON-13** [N]/[PR] · P1 — Link público ou de convidado mostra **cidade e UF, não o endereço completo**, e não mostra nome completo nem telefone até haver autenticação (art. 6º, III). Detalhe em `cliente.md`.

**PON-14** [N] · P2 — Acesso a dados pessoais e alterações no objeto geram **trilha de auditoria: quem mudou o quê, de qual valor para qual, quando e por qual ponta**, visível ao papel adequado (art. 37). Mudança feita por automação ou robô aparece como tal ("Sistema · regra de antifraude"), não como pessoa.

**PON-15** [PR] · P2 — Dados de contato entre pontas expiram com a necessidade. O entregador vê nome e endereço da entrega e, de preferência, telefone mascarado ou ligação intermediada, só enquanto a entrega está ativa. O cliente vê do entregador só o necessário para reconhecê-lo. *Ressalva:* mascaramento e expiração são prática de mercado, sem fonte primária verificada.

O conteúdo mínimo de notificação na tela bloqueada é regra de `chat-e-notificacoes.md`. "Meus dados" é regra de `cliente.md`.

## 6. Consistência em tempo real e conflitos entre pontas

UI otimista serve para ações locais e reversíveis (ver `estados-e-ui-otimista.md`). Entre pontas, ela não basta: o rollback por snapshot sobrescreve o que outra pessoa mudou enquanto o pedido estava em voo.

**PON-16** [PR] · P2 (suba para P1 quando a perda leva a dinheiro, entrega ou promessa errada) — **Transição de estado de objeto compartilhado não é otimista.** O servidor valida a transição contra a **versão atual** (versão, ETag ou `updated_at`) e contra as transições válidas (PON-07). Enquanto confirma, mostre "processando" no próprio controle. **O lado que perde** recebe:
- uma frase específica sobre o que aconteceu, em vez de "Erro 409" ou "Algo deu errado": "Seu pedido já saiu para entrega.";
- a alternativa certa como CTA: "Você pode recusar no recebimento ou pedir devolução." + [Pedir devolução];
- o estado atual na tela, sem precisar recarregar.

*Verificar:* sequência de bancada `conflito-entre-pontas` (o cliente cancela enquanto o operador despacha, com as duas telas lado a lado).

**PON-17** [PR] · P2 — Tela aberta com dado vencido **avisa antes de deixar agir**: "Este pedido foi atualizado por Ana às 14:32" + [Ver mudanças]. O aviso não descarta o rascunho de quem está editando. *Verificar:* mudar o objeto em outra ponta com a tela aberta.

**PON-18** [PR] · P2 — Cada transição gera **um evento com três consumidores**: tempo real nas pontas abertas, notificação conforme a tabela de projeção e trilha de auditoria. O evento nasce da transição do `05` (`ca-dados`) e sai pelo outbox (`ca-arquitetura`); aqui, a projeção diz o que cada consumidor mostra em cada ponta. Nenhum canal tem status escrito à mão em paralelo. *Por quê:* se a tela, o e-mail e o histórico nascem do mesmo evento, não se contradizem.

## 7. Passagens entre pontas

**PON-19** [N] · P1 — Notificação, e-mail e link **abrem o objeto exato na ponta certa**, nunca a home ou a lista. O Voltar segue a hierarquia esperada: tela regular abre com a pilha completa (lista → detalhe); tela que só existe por causa da notificação abre sem pilha. A norma é do Android ("preserve the user's expected navigation experience"); na web, o equivalente é a URL canônica do objeto com o pai real no Voltar do app. *Verificar:* abrir cada link de notificação a frio e usar o Voltar.

**PON-20** [N] · P1 — O destino **confere permissão antes de mostrar**, porque o link pode ter sido encaminhado (LGPD art. 46). Sem permissão: "Este pedido pertence a outra conta. Entre com a conta certa", sem vazar nenhum dado do objeto.

**PON-21** [PR] · P2 — O destino **trata o objeto que mudou desde o envio**: "Este pedido já foi entregue às 15:02", com a ação que vale agora. Isso substitui a ação que a notificação oferecia.

**PON-22** [PR] · P3 — A passagem **carrega contexto**. "Entregador chegou" abre a entrega com o código de confirmação. "Orçamento pronto" abre o orçamento com Aprovar e Recusar. O chat abre com o objeto que o cliente via (ver `chat-e-notificacoes.md`).

## 8. Um design system, temas e densidades por ponta

**PON-23** [DS] · P2 — Use **um conjunto de tokens semânticos** com nomes iguais em todas as pontas e **temas em eixos independentes**: marca (inclusive marca branca de parceiro), modo (claro, escuro, alto contraste), densidade (compacta no painel, confortável no cliente) e contexto de uso. A Atlassian admite temas que não são de cor (densidade, movimento reduzido). Os valores de cada densidade ficam em `fundamentos-e-tokens.md`. *Ressalva:* alvos maiores e alto contraste para uso ao sol no app do entregador são prática, não verificada em fonte.

**PON-24** [DS] · P2 — **A ponta do cliente não reaproveita a tabela densa do admin.** Os mesmos dados ganham duas linguagens: admin denso e orientado a lote; checkout e conta contidos e voltados a um pedido (lição da Shopify). Componentes de estado (badge, timeline, banner) leem a mesma tabela de projeção nas duas.

**PON-25** [N]/[DS] · P1 — Em **superfície de terceiro** (extensão de checkout, portal de parceiro), use só os componentes da plataforma e a marca do dono. As extensões de checkout da Shopify rodam em sandbox, ficam "limited to specific UI components and APIs" e herdam a marca do lojista.

## 9. Reservas e concorrência (unidade única)

Item único (peça usada, unidade de demonstração, horário de agenda, vaga) é o caso em que dois atores prometem a mesma coisa. Nenhuma fonte primária desta base cobre o tema. As regras abaixo são síntese [PR], derivadas de PON-06 e PON-16.

**PON-26** [PR] · P2 — **Disponibilidade é estado do objeto**, com eixo próprio na tabela de projeção: `disponivel`, `reservado` (com `reservado_ate` e `reservado_para`), `vendido` ou `ocupado`, `indisponivel`. O servidor concede a reserva de forma atômica: quem chega primeiro leva, e a segunda tentativa cai em PON-16.

**PON-27** [PR] · P2 — **Dois atendentes não prometem o mesmo item.** Antes de prometer, o atendente vê "Reservado por Ana para Carla Souza até 15:30" no próprio item, na busca e na lista. O botão de reservar ou vender respeita o estado em vez de deixar tentar e falhar depois. Se ainda assim perder a disputa, recebe a frase específica e alternativas: itens semelhantes, lista de espera, avisar quando liberar.

**PON-28** [PR] · P2 — A reserva **tem prazo visível para quem reservou**, tanto para o cliente ("Reservado para você até 15:30") quanto para o atendente. Ela expira sozinha, libera o item e gera evento. O cliente vê "Indisponível no momento" ou "Reservado", **nunca para quem nem por quem** (PON-12). Não use contagem regressiva falsa nem "3 pessoas vendo agora" como pressão (ver `cliente.md`).

**PON-29** [PR] · P3 — Defina em DEC quando a reserva começa: no carrinho, no início do checkout ou só no pagamento. Defina também o que acontece com o sinal se a reserva expirar. Os dois lados leem a regra na tela, não num termo escondido.

## 10. Propostas da IA

**PON-30** [N casa] · P1. Quando uma IA sugere uma mudança num objeto (estado, valor, classificação, resposta ao cliente, item de pedido), ela aparece como **proposta pendente**, nunca aplicada sem confirmação: marcada como sugestão da IA, com o que muda (antes → depois), o motivo ou a origem, e as ações Aplicar, Editar e Descartar para o papel que pode decidir. Até a confirmação, nada muda no objeto, nada aparece nas outras pontas e nenhuma notificação sai. Aplicada, entra na trilha como "Proposto pela IA, aplicado por Ana" (PON-14). Se o objeto mudou desde a sugestão, a proposta fica vencida e pede para ser refeita (PON-21). *Por quê:* ação da IA aplicada direto é ação no alvo errado sem dono; a ação proposta e o seu fluxo de confirmação são desenhados com a `ca-arquitetura`. *Verificar:* cenário de QA "a proposta é aplicada sem confirmação" (`verificacao.md`, VER-28).

## Padrão detectável → correção

| Padrão detectável | Correção | ID |
| --- | --- | --- |
| String de status literal em componente (`"Enviado"`, `'Em análise'`) | Ler rótulo e cor da tabela de projeção | PON-06 |
| Enum único que combina eixos (`pago_enviado`) | Separar ciclo, pagamento e entrega; derivar a frase do cliente | PON-11 |
| Campo interno no JSON da rota do cliente, escondido por CSS ou condicional | Serializador por papel no servidor | PON-12 |
| Página de rastreio pública com endereço completo | Cidade/UF até autenticar | PON-13 |
| `setState` otimista em cancelar, despachar ou reservar | Validar versão no servidor; "processando"; frase + CTA para quem perde | PON-16 |
| Erro genérico em conflito (409 → "Algo deu errado") | Frase do estado atual + alternativa | PON-16 |
| Link de notificação para `/` ou `/pedidos` | URL canônica do objeto + pilha coerente | PON-19 |
| Detalhe do objeto sem checar dono ou papel no servidor | Checagem de permissão no destino | PON-20 |
| Tabela do admin renderizada no portal do cliente | Componente de pedido único com tema confortável | PON-24 |
| Reserva sem prazo ou sem dono visível | `reservado_ate` e `reservado_para` no item, nas listas e na busca | PON-27, PON-28 |
| Sugestão da IA que muda o objeto ou notifica o cliente sem clique de confirmação | Proposta pendente com Aplicar, Editar e Descartar | PON-30 |
| Transições ou permissões definidas só no `03` ou no componente | Ficam no `05` (`ca-dados`); a projeção cita | PON-06, PON-07 |

## Fontes

- NN/g, Service Blueprints: https://www.nngroup.com/articles/service-blueprints-definition/
- NN/g, Journey Mapping 101: https://www.nngroup.com/articles/journey-mapping-101/
- NN/g, Mapping in Discovery: https://www.nngroup.com/articles/mapping-in-discovery/
- NN/g, Status Trackers: https://www.nngroup.com/articles/status-tracker-progress-update/
- A List Apart, OOUX (Prater): https://alistapart.com/article/ooux-a-foundation-for-interaction-design/
- Shopify Help, Order status: https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status
- Shopify.dev, Checkout UI extensions: https://shopify.dev/docs/api/checkout-ui-extensions
- Atlassian, Design tokens: https://atlassian.design/foundations/tokens/design-tokens
- Lei 13.709/2018 (LGPD): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Android Developers, Start an Activity from a Notification: https://developer.android.com/develop/ui/views/notifications/navigation
- CoddyKit, rollback e conflito: https://www.coddykit.com/courses/react/rollback-on-error-and-conflict-resolution-6735101
- Ably LiveSync, conflict resolution: https://www.mintlify.com/ably/docs/livesync/conflict-resolution
