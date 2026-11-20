# Chat e notificações (COM)

Cobre o chat do lado do cliente, o console do atendente, o repasse do robô para humano, notificações derivadas de eventos, a central de preferências, WhatsApp Business, SMS e e-mail. Não cobre: máquina de estados e eventos (`pontas-e-sistema.md`), redação das mensagens (`microtexto-ptbr.md`), toasts dentro do app (`estados-e-ui-otimista.md`), critérios WCAG em geral (`acessibilidade.md`), prévias de notificação no protótipo (`prototipo-e-aprovacao.md`).

Chat e notificações são pontas, não acessórios. Elas leem a mesma tabela de projeção (PON-06) e nascem dos mesmos eventos (PON-18), então não podem contradizer a tela.

Formato: **ID** [selo] · prioridade mínima — regra. A prioridade é piso.

*Datação:* a pesquisa de chat da NN/g é de 2018–2019, anterior aos robôs com LLM. As regras de interação continuam válidas; o que ela diz sobre a capacidade do robô está datado.

## 1. Chat do lado do cliente

**COM-01** [P] · P2 — **Uma entrada só, rotulada "Chat"**, com rótulo estável, alcançável também em Ajuda e Fale conosco, não só no botão flutuante. Rótulos vagos ("Faça uma pergunta") se confundem com busca ou e-mail. Chat difícil de achar foi lido como "a empresa não quer ser contatada". Dois robôs com papéis diferentes confundem: junte numa entrada.

**COM-02** [P] · P1 — **O robô diz que é robô desde a primeira mensagem**, diz que há humanos e quando estão disponíveis ("Atendentes de seg. a sex., 8h às 18h"). Para a NN/g, não dizer desde o início é um erro; quem sabe que fala com robô escreve de forma mais direta e fica mais satisfeito. Abra com uma oferta de ajuda objetiva, não com "Como vai?".

**COM-03** [P]/[DS] · P1 — **O robô admite quando não sabe e oferece a saída.** Um "não entendi" honesto foi melhor que uma resposta confiante e errada. A saída para humano (ou telefone, ou outro canal) fica visível ou é oferecida depois de uma falha, de um pedido explícito ("atendente", "humano") ou de sinais de frustração. Não bloqueie texto livre sem essa saída à vista (o antipadrão observado é "Typing is disabled").

**COM-04** [P] · P1 — **O repasse ao humano nunca pede ao cliente que repita** pergunta, pedido, e-mail ou endereço. O robô passa ao atendente uma nota estruturada (COM-11). Se o chat cair, contexto e progresso ficam salvos.

**COM-05** [P] · P2 — **Espera realista, digitando e horário.** Dê uma estimativa de tempo real, não só a posição na fila, sem mensagens de fila contraditórias. Mostre "Ana está digitando", timestamp em cada mensagem e status sem ambiguidade ("Agent is paused" fez usuários acharem que o agente saiu). Em pesquisas demoradas, mande "Ainda estou verificando". Fora do horário, diga quando a resposta virá.

**COM-06** [P] · P2 — **Três estilos de mensagem**: cliente, atendente ou robô, e sistema. Mensagem de sistema ("Sessão encerrada", "Pedido atualizado para A caminho") não pode parecer vinda do atendente. Diferencie por posição, fundo e rótulo, não só por cor.

**COM-07** [P] · P2 — **A conversa persiste como thread retomável**: fechar a aba não a mata, e o cliente volta pelo app, pelo link do e-mail ou pelo push. Ofereça a **transcrição** por e-mail ou PDF sem pedir de novo o e-mail já informado. Anexos de foto e documento funcionam no celular.

**COM-08** [PR] · P3 — Quando a resposta vai demorar, peça permissão de push **nesse contexto** ("Quer ser avisado quando responderem?"). É o pedido contextual de COM-17 ligando chat e notificação.

**COM-09** [PR] · P2 — **A mudança de status aparece como mensagem de sistema na conversa** ("Pedido #PED-10482 atualizado para Saiu para entrega · 14:32"), lida da tabela de projeção e com link para o objeto. Ela não substitui a atualização da tela aberta (PON-17).

## 2. Console do atendente

**COM-10** [DS] · P1 — **Contexto do objeto ao lado da conversa.** O painel lateral abre com o objeto que o cliente via quando abriu o chat (o deep link de origem, PON-22): estado nos eixos, frase que o cliente lê, histórico e ações permitidas ao papel. Ninguém pergunta "qual pedido?". O layout comum tem 3 ou 4 painéis: caixas com contador, lista, conversa, contexto.

**COM-11** [DS] · P2 — **Nota de repasse do robô** no topo da conversa, como nota interna: por que escalou, resumo do pedido, dados já coletados, objeto de origem e próximo passo sugerido (a API de escalação do Intercom aceita até 10.000 caracteres de contexto). O roteamento do robô aparece como estado de primeira classe: resolvida, repassada, abandonada.

**COM-12** [DS]/[N] · P1 — **Resposta pública e nota interna nunca se confundem.** O compositor alterna entre as duas de forma explícita, com **fundo diferente e rótulo de quem vê** ("Visível para o cliente" / "Só equipe"), não só com uma aba ou uma cor. O modo volta ao padrão seguro depois de enviar uma nota. *Por quê:* nota interna vazada ao cliente é incidente de privacidade (LGPD art. 46).

**COM-13** [DS] · P2 — **Detecção de colisão** em caixa compartilhada: indicador de quem está vendo e de quem está digitando na lista e na conversa, com rascunho visível aos colegas (Front, Help Scout). Evita duas respostas ao mesmo cliente.

**COM-14** [PR] · P2 — O atendente vê **a cópia do que o cliente recebeu**: mensagem automática, e-mail, push, template de WhatsApp, na conversa ou na timeline do objeto (PON-09).

**COM-15** [DS] · P2 — Ação do operador que notifica o cliente (enviar, cancelar, reembolsar, editar rastreio) oferece **"Notificar cliente" no momento da ação**, com prévia, como na Shopify. A confirmação de pedido é sempre enviada.

## 3. Acessibilidade do chat

**COM-16** [N] · P1 — O histórico do chat é um contêiner **`role="log"`**: mensagens novas são lidas sem mover o foco (o exemplo canônico da técnica ARIA23 é um histórico de chat). Status pontuais ("Ana entrou na conversa", "Mensagem enviada") vão em `role="status"`. Os dois atendem ao SC 4.1.3 (AA). O foco fica no compositor depois de enviar. *Ressalva:* anunciar "digitando" em região viva pode ficar verboso; não há fonte verificada sobre isso, então teste com leitor de tela antes de anunciar.

## 4. Notificações derivadas de eventos

**COM-17** [P] · P2 — **Peça permissão de push no contexto**, não no primeiro uso, explicando o benefício antes do prompt do sistema (NN/g).

**COM-18** [P]/[PR] · P1 — **Toda notificação deriva de um evento de mudança de estado** listado na tabela de projeção. Nada é escrito à mão num canal paralelo. Cada uma responde a três perguntas:
1. o que aconteceu: "Pedido #PED-10482 saiu para entrega";
2. o que vem a seguir ou o que fazer: "Chega hoje até 18h. Tenha o código 4821 em mãos";
3. um link que **abre o objeto exato** (PON-19).

Envie só o que é relevante para a pessoa; não notifique cada pequeno evento.

**COM-19** [PR] · P2 — **Um evento, um canal principal**: push se o app está instalado e com permissão; senão WhatsApp utility (com opt-in); e-mail como registro. Não dispare push, WhatsApp e SMS do mesmo evento por padrão. Não duplique e-mail da loja e da transportadora (NN/g).

**COM-20** [PR] · P2 — **Confira se o estado ainda vale antes de enviar.** Não mande "saiu para entrega" se o pedido já está "entregue". Na fila, reavalie no momento do envio. *Verificar:* sequência de bancada `notificacao-atrasada`.

**COM-21** [P] · P2 — **Agrupe rajadas**: mais de 5 notificações de uma vez viram uma só, colapsada no estado mais recente (NN/g), sem depender do agrupamento do sistema.

**COM-22** [N] · P1 — **Conteúdo mínimo na tela bloqueada**: nada de valor, endereço, CPF, diagnóstico ou texto de conversa no corpo do push (LGPD art. 46). "Novidade no seu pedido #PED-10482" basta. *Ressalva:* a orientação da Apple sobre isso não pôde ser verificada no HIG.

**COM-23** [P]/[N] · P1 — **Central de preferências em matriz tipo × canal**, dentro do app:
- linhas por tipo (pedido e entrega, atendimento, segurança, novidades e ofertas); colunas por canal (push, WhatsApp, e-mail, SMS);
- pré-requisito visível por canal ("Ative as notificações do sistema", "Confirme seu WhatsApp");
- a lista explícita do que não se desliga (confirmação de pedido, segurança da conta), com o motivo;
- marketing sempre opt-in e separado do transacional, também no WhatsApp (recomendação da Meta);
- opt-out nunca escondido e presente na própria mensagem (link no e-mail, "SAIR" ou "STOP" no SMS).

**COM-24** [PR] · P3 — **Badge de não lidas por conversa e por pedido**, zerado ao abrir a tela correspondente, não ao abrir o app.

Horário de silêncio: não há fonte primária para regra brasileira nem para o comportamento das plataformas nesta base. Não afirme nenhuma regra. Se o produto tiver horário de silêncio, ele é decisão de produto registrada em DEC.

## 5. WhatsApp Business

*Regras da Meta, checadas em 16/11/2026. Mudam por trimestre: confira a data antes de citar preço ou categoria.*

- Desde 01/07/2025, a cobrança é **por mensagem entregue**, por categoria de template (marketing, utility, authentication) e por país.
- A **janela de 24 h** abre com a última mensagem (ou ligação) do usuário e reinicia a cada nova mensagem dele. Dentro dela vale mensagem livre (service); fora, só template aprovado.
- Desde **01/10/2026**, utility dentro da janela é cobrada, e service tem 1.000 mensagens grátis por mês por número, sem acúmulo.
- No Brasil, o faturamento em BRL começou em 01/07/2026.
- A Meta monitora a categorização e pode reclassificar um template como MARKETING. Fontes secundárias dizem que conteúdo misto vira marketing; a URL antiga do guia de categorização dá 404 e a nova não foi lida.

**COM-25** [N] · P1 — **Template utility sem nenhum conteúdo promocional**: nada de cupom, "aproveite também" ou vitrine. Misturar muda a categoria, o custo e a regra de consentimento.

**COM-26** [N] · P1 — **Opt-in que nomeia a empresa** e deixa claro que a pessoa aceita receber mensagens, **separado por categoria** (transacional × marketing), com instrução de opt-out por categoria.

**COM-27** [N] · P1 — O console mostra **o estado da janela de 24 h** ("Janela aberta · fecha em 3 h 12 min" ou "Janela fechada"). Com a janela fechada, o compositor livre vira **seletor de templates aprovados**. *Verificar:* fixture de janela vencida.

**COM-28** [N] · P1 — Botões de resposta: **no máximo 3**, títulos únicos com **até 20 caracteres** ("Ver pedido", "Falar c/ atendente", "Reagendar"); corpo até 1.024 caracteres; rodapé até 60. O deep link vai num botão de URL do template (limites desse botão não verificados). Os limites de list messages também não foram verificados.

**COM-29** [PR] · P3 — Não repita no WhatsApp o que o cliente já leu no chat do app. Desde a cobrança da utility, a duplicação custa dinheiro, além de atenção.

## 6. SMS e e-mail

**COM-30** [P] · P2 — **E-mail transacional é o registro**: assunto com o número do objeto e o fato ("Pedido #PED-10482 enviado"), link direto ao objeto sem novo login (CLI-07) e opt-out no rodapé para o que não é obrigatório. Ele não manda o cliente direto para a transportadora sem caminho de volta (CLI-04).

**COM-31** [PR] · P3 — **SMS** só para o que precisa de alcance sem app nem internet (código de entrega, tentativa falha), com o link curto do objeto e a instrução de saída. Regras de SMS A2P no Brasil (horário, remetente, short code) não têm fonte primária nesta base: não afirme nenhuma. A Anatel revogou a obrigatoriedade do 0303 em 2025 e pediu plano sobre autenticação de SMS; o estado atual não foi confirmado.

Autenticação de remetente de e-mail (SPF, DKIM, DMARC) e as exigências de provedores para envio em massa não foram pesquisadas.

## Padrão detectável → correção

| Padrão detectável | Correção | ID |
| --- | --- | --- |
| Primeira mensagem do robô sem dizer que é robô | Identificação + quando há humanos | COM-02 |
| Texto livre desabilitado sem saída para humano | Saída visível ou oferecida | COM-03 |
| Atendente pergunta "qual o número do pedido?" depois do repasse | Nota de repasse + painel com o objeto de origem | COM-04, COM-10, COM-11 |
| Mensagens de sistema e do atendente com o mesmo estilo | Terceiro estilo com rótulo | COM-06 |
| Lista de mensagens sem `role="log"`; "enviado" sem região de status | `role="log"` e `role="status"` | COM-16 |
| Compositor com nota e resposta diferenciadas só por aba ou cor | Fundo + rótulo "Visível para o cliente" / "Só equipe" | COM-12 |
| Notificação disparada em código de tela ou com texto livre | Disparo pelo evento de estado, texto da projeção | COM-18 |
| Push, WhatsApp e e-mail para o mesmo evento | Canal principal + e-mail de registro | COM-19 |
| Envio da fila sem reler o estado | Conferir o estado atual antes de enviar | COM-20 |
| Push com valor, endereço ou trecho de conversa | Corpo mínimo | COM-22 |
| Template utility com cupom ou oferta | Separar em template de marketing com opt-in próprio | COM-25 |
| Console sem indicação da janela de 24 h | Estado da janela + seletor de templates quando fechada | COM-27 |
| Botão de template com mais de 20 caracteres ou mais de 3 botões | Encurtar ou reduzir | COM-28 |

## Fontes

- NN/g, Customer-Service Chat (Budiu): https://www.nngroup.com/articles/chat-ux/
- NN/g, Chatbots (Budiu): https://www.nngroup.com/articles/chatbots/
- NN/g, Push Notifications (Kendrick): https://www.nngroup.com/articles/push-notification/
- NN/g, Status Trackers: https://www.nngroup.com/articles/status-tracker-progress-update/
- Intercom Help, escalação do Fin: https://www.intercom.com/help/en/articles/11433030
- Intercom Developers, escalateFinConversation: https://developers.intercom.com/docs/references/preview/rest-api/api.intercom.io/fin-agent/escalatefinconversation
- Zendesk, conversation interface: https://support.zendesk.com/hc/en-us/articles/4408823962906-Understanding-the-conversation-interface-for-agents
- Zendesk, agent interface: https://support.zendesk.com/hc/en-us/articles/4408883355546-Introduction-to-the-Support-agent-interface-standard-agent-interface
- Front, collision detection: https://help.front.com/en/articles/2403
- Help Scout, collaborate in the inbox: https://docs.helpscout.com/article/1583-collaborate-with-your-team-in-the-inbox
- Shopify Help, Customer notifications: https://help.shopify.com/en/manual/fulfillment/setup/notifications/customer-notifications
- W3C, ARIA23 (role=log): https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA23
- W3C, Understanding 4.1.3: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- Meta, WhatsApp pricing: https://developers.facebook.com/docs/whatsapp/pricing
- Meta, Getting opt-in: https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in
- Meta, Integrity and content guidelines: https://developers.facebook.com/documentation/business-messaging/whatsapp/direct-send/integrity-and-content-guidelines/
- Meta, Interactive reply buttons: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-reply-buttons-messages
- Teletime, Anatel e 0303: https://teletime.com.br/07/08/2025/anatel-flexibiliza-uso-do-prefixo-0303-para-chamadas-massivas/
