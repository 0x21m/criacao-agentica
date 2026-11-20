# Experiência premium (EXP)

Cobre o que faz um app parecer software feito com carinho por uma grande empresa, e não uma captura de tela: os momentos-assinatura pelos quais o produto será lembrado, os 12 pilares de experiência premium, a moldura obrigatória de um app com mais de uma tela, os componentes vivos (a biblioteca como piso), a profundidade e as camadas, a passada de vida antes de mostrar um protótipo, os freios de uso consciente e a régua de comparação com apps de referência. Não cobre os números de duração, mola, sombra, raio e contraste (`fundamentos-e-tokens.md`), a mecânica de cada animação, interrupção e movimento reduzido (`movimento.md`), a escolha da personalidade e do orçamento de deleite (`direcao-e-personalidade.md`), as bibliotecas e o tema do shadcn (`stack-e-bibliotecas.md`), os estados e a UI otimista em detalhe (`estados-e-ui-otimista.md`), a navegação, a paleta e os atalhos (`navegacao-e-estrutura.md`), as frases (`microtexto-ptbr.md`) nem a mecânica do portão e da rodada (`prototipo-e-aprovacao.md`).

Formato das regras: **ID** · [selo] · prioridade mínima. Regra. *Por quê* e *Verificar* quando ajudam. Selos: [N] norma ou política oficial; [N casa] política da casa (aqui: as decisões do dono desta skill de 16/11/2026 sobre momentos-assinatura, os 12 pilares, a moldura do app, os componentes vivos, a profundidade, a passada de vida e a troca de proibições de estilo por alertas de uso consciente); [P] pesquisa; [DS] design system ou documentação de produto; [PR] praticante. Prioridade é piso; [PR] sozinho não passa de P2.

Nenhum número novo mora aqui (regra da casa 6). Onde esta referência pede um token que ainda não existe (preset de mola, nível de elevação, padrão de vibração, duração do pulso), use o mais próximo de `fundamentos-e-tokens.md` e liste a falta.

## Sumário

1. Forma e função sempre
2. Momentos-assinatura
3. Os 12 pilares
4. Moldura do app
5. Componentes vivos
6. Profundidade e camadas
7. Passada de vida
8. Freios: alertas de uso consciente
9. Régua de comparação
10. Padrão detectável → correção
11. Fontes

## 1. Forma e função sempre

Os protótipos que a skill gerava acertavam fluxo e estados e mesmo assim pareciam frios: tela plana, sem moldura de app, sem resposta ao toque, componentes idênticos ao padrão da biblioteca, nenhuma conclusão reconhecida. Nada estava errado; nada estava vivo. É a "cara de screenshot": a interface parece uma imagem de si mesma.

A resposta não é enfeitar. É fazer cada superfície responder, orientar, lembrar e reconhecer, com acabamento que mostra cuidado. Enfeite é bem-vindo quando tem papel; o que não tem papel é ruído, e o que falta é frieza. A verificação aponta as duas coisas.

- **EXP-01** · [N casa] · P2. **Forma e função sempre.** Todo efeito visual ou de movimento nomeia o seu papel numa linha do roteiro do protótipo: resposta (o app ouviu), orientação (de onde veio, para onde vai), continuidade (é o mesmo objeto), hierarquia (o que está acima do quê), vida (isto está acontecendo agora), reconhecimento (você concluiu algo) ou marca (este é o nosso produto). Efeito sem papel é excesso; superfície principal sem nenhum desses papéis é falta. Quase nada é proibido no estilo: o critério é bonito, organizado e intencional. *Verificar:* para cada efeito do protótipo, a linha do papel; para cada tela principal, pelo menos resposta, orientação e hierarquia presentes.

## 2. Momentos-assinatura

Um produto é lembrado por poucos momentos, não pela média das telas. A pesquisa do pico e do fim mostra que a memória de uma experiência pesa o momento mais intenso e o final mais do que a duração. Por isso a skill escolhe de propósito onde ficam esses picos, e eles ficam no momento de valor do objeto, não num botão qualquer. E o momento é **deste produto**: nasce de como as pessoas dele trabalham, não de um repertório genérico de "deleite".

- **EXP-02** · [N casa] · P1 (no modo criar) · SEMPRE. No modo criar do zero, decida **2 ou 3 momentos-assinatura**: as interações pelas quais o produto será lembrado. Cada um nasce de uma transição de estado que importa para alguém na tabela de projeção (orçamento aceito, aparelho pronto, caixa fechado, pagamento concluído, primeiro horário reservado), nunca de uma ação genérica (salvar, abrir menu). Registre no roteiro do protótipo: nome do momento, gatilho (transição do `05`), o que acontece em cada ponta, frequência por dia, de que prática do domínio ele vem (EXP-56) e a versão em movimento reduzido. A lista entra como decisão numerada na rodada v1 e, aprovada, vai para a DEC da direção. *Por quê:* sem escolha, o capricho se espalha por igual e nenhum momento se destaca; com escolha, o esforço vai para onde a memória fica. *Verificar:* o roteiro tem de 2 a 3 momentos, cada um com a transição de origem e a prática do domínio.
- **EXP-56** · [N casa] · P1 (no modo criar) · SEMPRE. **O momento é específico do produto e do domínio, nunca um clichê.** Ele mostra algo que só este produto pode mostrar, tirado do trabalho real dos seus usuários: os passos reais do reparo, a cadeira que enche ao longo do dia, o caminho real da entrega. Tropos genéricos de deleite não contam como momento-assinatura: carimbo ("APROVADO", "PAGO", "ENTREGUE"), confete, troféu, medalha, mascote comemorando, animação genérica de "sucesso" que serviria a qualquer app. *Por quê:* o dono da skill avaliou o carimbo como clichê; momento genérico é esquecido justamente porque já foi visto em todo lugar. *Verificar:* teste da troca: se o momento caberia igual num app de outro ramo trocando só o texto, ele é clichê e volta para o domínio. Uma confirmação de pagamento é significativa; o carimbo sobre ela é o tropo. **Dois casos que não se confundem:** o **check desenhado** no traço e na cor da marca, dentro da ação-chave cinematográfica (MOV-33, EXP-57), é permitido e esperado; o clichê é o **carimbo ou selo de texto** ("APROVADO", "PAGO", "ENTREGUE") estampado sobre a tela ou o card. Um modal "Aprovado às 15:14" com o check animado é ação-chave, não carimbo.
- **EXP-57** · [N casa] · P2. **As 1 a 3 ações-chave de cada jornada ganham transição cinematográfica** ("liquid motion"): o elemento acionado se expande em continuidade até a confirmação em tela cheia, o reconhecimento acontece na linguagem visual do produto com mola, e a tela recolhe de volta ao objeto já atualizado, sem corte. Exemplo: o cliente conclui o pagamento → a confirmação cresce a partir do próprio botão Pagar → o check se desenha no traço e na cor da marca, com o valor e o pedido → a tela recolhe até o pedido, que já mostra "Pago" no passo da timeline. Construa com componentes bonitos de React (21st.dev, shadcn/ui, Magic UI, Aceternity, React Bits; STK-09 vale: expressão só em momento de marca) e com Motion e View Transitions (`movimento.md`). Os freios valem inteiros: só em ação rara e de alto significado (EXP-49), interrompível e sem segurar a próxima tarefa (EXP-52), com versão em movimento reduzido entregue junto (EXP-50), gatilho só depois da confirmação do servidor (EXP-04). *Verificar:* executar cada ação-chave no protótipo; nenhum quadro de corte entre o botão, a confirmação e o objeto atualizado; Esc ou toque fora encerra na hora.
- **EXP-03** · [N casa] · P1 (no modo criar). Cada momento-assinatura é **prototipado com capricho no stack real** (STK-04), com dados plausíveis, e **mostrado rodando no protótipo navegável**: a rodada diz, por momento, a rota e o gatilho para vê-lo (PRO-15 item 10). Na v1 basta o momento da tela-chave esboçado; na v2 todos rodam no protótipo; na v3 recebem o acabamento final de movimento. Captura estática não serve para aprovar um momento: movimento se aprova usando. Vídeo só se a pessoa pedir (PRO-25). *Verificar:* a rodada lista, por momento, a rota e o gatilho, e o momento dispara no protótipo.
- **EXP-04** · [PR] · P2. Anatomia de um momento bem feito:
  - **gatilho real**: dispara quando o servidor confirma a transição, nunca antes (transição de objeto compartilhado não é otimista, PON-16, EST-22); até lá, o botão mostra o andamento;
  - **resposta imediata, cerimônia curta**: o reconhecimento começa no mesmo quadro da confirmação e não segura a próxima ação; a pessoa pode seguir enquanto ele acontece (EXP-52);
  - **eco nas outras pontas**: o mesmo momento aparece, na intensidade de cada ponta, onde o objeto é visto (a jornada do aparelho que o atendente vê é a mesma que o cliente acompanha e que a mensagem resume, EXP-35);
  - **versão em movimento reduzido**: o mesmo reconhecimento por cor, ícone e texto, sem deslocamento (MOV-21, MOV-22);
  - **teste do 50º uso**: se o operador vive o momento dezenas de vezes por dia, a versão dele é curta e a cerimônia fica para a ponta que o vive raramente (EXP-49).
- **EXP-05** · [PR] · P3. Em sistema existente (modo 2), quando a tela nova toca um momento de valor sem reconhecimento nenhum, proponha um momento-assinatura como **sugestão marcada**, dentro da identidade do sistema (PER-12) e do domínio (EXP-56), rodando no protótipo.

Exemplos, cada um tirado do trabalho real do ramo:

| Produto | Momento | Gatilho | Operador (painel) | Cliente (app, mensagem) | Prática do domínio |
| --- | --- | --- | --- | --- | --- |
| Assistência técnica | A jornada do aparelho pela bancada | cada etapa do reparo concluída | o card da OS mostra a silhueta do aparelho avançando pelas etapas reais (recebido, diagnóstico, peça, reparo, teste, pronto), com a etapa atual viva e o técnico responsável | a mesma jornada, em linguagem do cliente, com a foto do aparelho dele e a próxima etapa prevista | o aparelho passa de bancada em bancada; o cliente quer saber em que passo ele está |
| Assistência técnica | Pronto para retirar | OS passa a "Pronto para retirar" | o card atravessa até a coluna final em continuidade e o contador da coluna sobe | a jornada se completa no aparelho, o endereço e o horário de retirada sobem para o topo e "Como chegar" vira a ação principal | o momento de valor do cliente é ter o aparelho de volta |
| Barbearia | O dia da cadeira | cada atendimento confirmado ou concluído | a linha do dia de cada cadeira enche em tempo real, com os horários vagos à vista e o próximo cliente em destaque | o horário reservado aparece na cadeira e no profissional escolhidos, com o tempo até a vez | a barbearia pensa em cadeira e horário, não em lista de pedidos |
| Barbearia | Fechamento do dia | fechamento do caixa | as cadeiras do dia se condensam no resumo: atendimentos por profissional, total, melhor horário e comparação com a semana | não se aplica | o dono fecha o dia contando o que cada cadeira rendeu |
| Loja com app | Pagamento concluído | pagamento confirmado | o pedido entra na fila de separação com o valor confirmado | a confirmação cresce do botão Pagar, o check se desenha na linguagem da marca e recolhe até o pedido atualizado (EXP-57) | pagar é a decisão de maior significado da jornada do cliente |

## 3. Os 12 pilares

Cada pilar traz regras verificáveis e exemplos para as duas pontas mais comuns: o **painel** (operador, admin, ERP) e o **app do cliente** (acompanhamento, conta, loja). A intensidade de cada pilar muda por ponta (PER-14) e pela frequência de uso (EXP-49).

### 3.1 Velocidade sentida

Rapidez percebida vem de responder antes de terminar. Abaixo de cerca de 400 ms de resposta, a produtividade sobe porque a pessoa não perde o fio (limiar de Doherty); o feedback do comando cabe no limite de TOK-24.

- **EXP-06** · [P] · P2. **Responda antes de terminar.** Todo comando pinta feedback no limite de TOK-24 (EST-09). Onde a classe da mutação permite (EST-21), aplique a UI otimista com marca de pendente e reversão visível (EST-23, EST-24); onde não permite (transição de objeto compartilhado, dinheiro), o botão vira andamento na hora ("Aprovando…", EST-11). *Verificar:* gravação a 60 qps; nenhum clique sem mudança visível no quadro seguinte.
- **EXP-07** · [DS] · P2. **Chegue antes do clique.** Links e linhas que levam a outra tela pré-carregam ao passar o mouse ou ao entrar na viewport (no Astro, `prefetch` com a estratégia `hover` ou `viewport`; no React, o prefetch do roteador ou da biblioteca de dados). Skeleton tem **a forma real** do conteúdo que vem: mesmas colunas, mesmas alturas de linha, mesmo lugar do título (MOV-17). Busca é **instantânea**: resultado enquanto digita, filtrando o que já está na tela de imediato e buscando o resto em segundo plano, com a resposta antiga nunca substituindo a nova (EST-26). *Verificar:* trocar skeleton por conteúdo não desloca nada; a busca mostra o primeiro resultado sem Enter.
- **EXP-08** · [DS] · P2. **Teclado como atalho de tudo** nos apps de uso diário: paleta Ctrl+K (⌘K no Mac) de qualquer tela (NAV-26, NAV-27), atalhos ensinados no tooltip e no menu ("Aprovar · A", NAV-34), com a paleta aberta no mesmo quadro e o campo já aceitando digitação (MOV-02).

Exemplos. Painel: a lista de OS abre a OS em menos de um piscar porque o detalhe foi pré-carregado no hover; Ctrl+K → "nova OS" → Enter. Cliente: o rastreio mostra o skeleton da timeline com o número certo de passos, e "Confirmar retirada" muda de rótulo no toque.

### 3.2 Sensação física

Interfaces premium parecem objetos: cedem ao toque, têm peso, param com elasticidade no limite. Isso vem de molas e de resposta no `pointerdown`, não de animação longa.

- **EXP-09** · [N casa] · P2. **Molas como token.** O projeto tem presets de mola nomeados (no mínimo: resposta rápida para press e toggle, padrão para camadas, gesto para o que o dedo solta), definidos em `fundamentos-e-tokens.md` e usados pelo nome; nenhuma curva ou mola literal em componente (regra da casa 5). Todo controle responde fisicamente: botão afunda no `pointerdown` (MOV-14), toggle desliza, checkbox se desenha, "Copiar" vira "Copiado" e volta. *Verificar:* busca por `stiffness`, `damping`, `cubic-bezier` literais fora do arquivo de tokens.
- **EXP-10** · [PR] · P2. **Arrastar tem peso.** O item arrastado ganha elevação (sombra de nível acima, EXP-43) e leve escala, segue o ponteiro 1:1, solta com inércia até o encaixe e, no limite (fim da lista, coluna que não aceita), resiste com limite elástico em vez de travar seco (EST-31). Todo arrasto tem alternativa sem arrasto (LIS-11, WCAG 2.5.7). *Verificar:* arrastar até a borda e soltar; o item não salta nem some.
- **EXP-11** · [PR] · P2. **Vibração e som são temperos.** No celular, um pulso curto de vibração confirma conclusões e limites atingidos (soltar no lugar certo, chegar ao fim do puxar para atualizar), nunca a cada toque ou tecla, usando o padrão do token. A Vibration API da web não existe no Safari do iPhone: trate como melhoria progressiva e nunca como único sinal; em app nativo ou casca nativa, use a háptica da plataforma. Som é **opcional e desligado por padrão**, com ajuste nas preferências, e nunca carrega informação sozinho. *Verificar:* com vibração e som indisponíveis, nenhum estado fica sem sinal visual.

Exemplos. Painel: arrastar a OS no kanban levanta o card com sombra e a coluna de destino se ilumina; o toggle "Avisar cliente" desliza com a mola rápida. Cliente: puxar a lista do pedido estica com resistência e vibra uma vez ao atingir o ponto de atualizar.

### 3.3 Continuidade de espaço

A pessoa entende onde está quando o app mostra de onde as coisas vêm. Corte seco entre telas faz cada tela parecer outro programa.

- **EXP-12** · [N casa] · P2. **Toda troca de tela tem transição** (View Transitions; no Astro, o `ClientRouter` com `transition:name` nos elementos compartilhados), como melhoria progressiva (MOV-19): o card da lista **vira** o cabeçalho do detalhe; o painel lateral entra pelo lado do gatilho e sai por onde entrou (MOV-13); a moldura (sidebar, barra superior) **não pisca** entre rotas (`transition:persist` ou layout compartilhado). A troca de tema claro e escuro também tem transição, com a revelação circular a partir do ponto do clique (`movimento.md`). Sob movimento reduzido, crossfade curto. *Verificar:* navegar lista → detalhe → voltar gravando; nenhum quadro em branco e nenhum salto da moldura.
- **EXP-13** · [DS] · P2. **Voltar devolve o lugar.** Ao voltar, a lista reaparece com a mesma rolagem, a mesma linha selecionada e destacada brevemente, os mesmos filtros (na URL, NAV-20) e o foco no item de onde se saiu. Abas e etapas guardam o que foi digitado (EST-39). *Verificar:* rolar até o item 80, abrir, voltar; o item 80 está à vista e focado.
- **EXP-58** · [N casa] · P2. **Fluxo interativo, sem cortes.** Um fluxo inteiro (checkout, abertura de OS, agendamento) se sente como um movimento contínuo: os elementos compartilhados viajam de etapa em etapa (o aparelho escolhido no passo 1 vira o cabeçalho do passo 2; o resumo do carrinho encolhe até a barra do pagamento; o horário escolhido sobe para a confirmação), a direção segue o modelo mental (avançar entra pela direita, voltar pela esquerda, MOV-13) e nenhuma etapa aparece com corte seco. Feito com View Transitions e Motion (`layoutId` fora de navegação ocupada, MOV-09), como melhoria progressiva; sob movimento reduzido, crossfade curto. As ações-chave do fluxo recebem a transição cinematográfica de EXP-57. *Verificar:* percorrer o fluxo de ponta a ponta no protótipo; apontar, em cada troca de etapa, o elemento que viaja.

Exemplos. Painel: a linha da OS se expande no painel de detalhe à direita com o número da OS no mesmo lugar; Esc devolve a linha com destaque. Cliente: a miniatura do aparelho no card do pedido cresce até a foto do topo do detalhe.

### 3.4 Vida e tempo real

Um app vivo mostra que o mundo está acontecendo: quem está ali, o que mudou, há quanto tempo. Sem isso a tela parece uma impressão.

- **EXP-14** · [DS] · P2. **O dado diz a sua idade e o que chegou.** Região que se atualiza mostra "Atualizado há 2 min" com a hora absoluta acessível (EST-44, TXT-38) e, quando chega algo novo, "3 novos · Mostrar" sem deslocar o que a pessoa lê (EST-43). Mudança feita por outra pessoa no registro aberto avisa antes de deixar agir (PON-17).
- **EXP-15** · [PR] · P2. **Presença e atividade.** Em registro que mais de uma pessoa opera, mostre quem está vendo o mesmo registro (avatares pequenos com nome no tooltip, "Ana também está nesta OS") e, na tela inicial ou no detalhe, um feed de atividade com quem fez o quê e quando (a mesma trilha de PON-14, PON-18), com link para o objeto. Presença respeita o papel: o cliente não vê nomes de funcionários que o papel não mostra (PON-12).
- **EXP-16** · [N casa] · P2. **Estado ao vivo pulsa.** O que está acontecendo agora (OS em reparo neste momento, entregador a caminho, atendente digitando, conexão ativa, "ao vivo") tem um indicador que pulsa suave e devagar, um por região, ao lado do texto e da cor do estado (MOV-22). Estado parado não pulsa. O pulso obedece à WCAG 2.2.2 (requisito, MOV-31): para sozinho em até ~5 s depois que o estado começa ou muda e fica como ponto aceso, ou há controle de pausa; pulso eterno sem controle é achado. Sob movimento reduzido, o indicador fica estático; o pulso não é anunciado ao leitor de tela. Os valores do pulso estão em TOK-40. *Por quê:* o pulso é o único sinal que diz "agora" sem texto extra; usado em tudo, perde o sentido. *Verificar:* em cada tela, conte os pulsos; cada um corresponde a um estado que muda em tempo real.

Exemplos. Painel: card "Em reparo" com ponto pulsando na cor do estado, "Bruno está nesta OS", feed "Carla aprovou o orçamento da OS 4821 há 3 min". Cliente: "Seu técnico está trabalhando no aparelho agora" com o ponto vivo, e "Atualizado às 14:32".

### 3.5 Progresso e recompensa

Progresso visível motiva: quanto mais perto da meta, mais esforço as pessoas investem, e começar com algum progresso aumenta a conclusão. Reconhecer o que foi concluído é o que fecha o ciclo.

- **EXP-17** · [P] · P2. **Metas e marcos com dado real.** Anéis e barras de meta mostram valor, meta e período em texto (IND-04), saem do mesmo número do resto da tela (IND-17) e enchem quando o valor muda de verdade, não a cada visita (MOV-04, IND-14). Marcos ("100ª OS concluída", "primeira venda no Pix") aparecem uma vez, no momento em que acontecem. *Verificar:* o anel e o KPI ao lado mostram o mesmo número.
- **EXP-18** · [N casa] · P2. **Conclusão é reconhecida.** Toda conclusão de fluxo que importa (OS entregue, caixa fechado, cadastro completo, pedido pago) recebe reconhecimento proporcional: no mínimo o estado final claro com ícone e frase de resultado (TXT-15); nos momentos raros, a transição cinematográfica da ação-chave (EXP-57), a jornada do objeto que se completa ou o resumo, sempre na linguagem do domínio (EXP-56), nunca carimbo, confete ou troféu. Encerrar o dia de trabalho é um momento: o **resumo do dia** (total, quantidade, destaque, comparação) aparece no fechamento, na unidade com que o negócio pensa (cadeiras, bancadas, rotas). *Verificar:* para cada fluxo do MVP, o que a pessoa vê no último passo.
- **EXP-19** · [P] · P2. **Primeiros passos** num checklist dispensável na tela inicial de quem acabou de chegar ("Cadastre o primeiro serviço · Conecte o WhatsApp · Abra a primeira OS"), que já começa com um item feito (a conta criada) e some quando completo, com um reconhecimento final.
- **EXP-20** · [PR] · P2. **Gamificação sóbria em B2B.** Progresso, marcos do próprio negócio e controle sim; pontos sem sentido, sequências que punem a ausência e ranking público entre funcionários não, salvo pedido explícito do dono do negócio registrado em DEC. A celebração reconhece o trabalho; nunca cobra.

Exemplos. Painel: anel "18 de 25 OS entregues esta semana"; no fechamento, as bancadas do dia se condensam no resumo com o que cada técnico concluiu. Cliente: a jornada do aparelho com o passo atual vivo e, ao ficar pronto, a jornada se completa sobre a foto do aparelho dele.

### 3.6 Posse e personalização

Quando o app reconhece a pessoa e deixa ela arrumar o espaço, ele vira dela.

- **EXP-21** · [PR] · P2. **O app sabe quem está ali.** Saudação por horário e nome no topo da tela inicial ("Boa tarde, Carla"), no fuso do negócio (TXT-37), com o resumo do momento. O espaço tem identidade: logo, nome e cor da unidade ou da loja no seletor de unidade e na moldura.
- **EXP-22** · [PR] · P2. **A pessoa arruma o próprio espaço:** cor de destaque escolhida de um conjunto fechado de tokens já validados em contraste nos dois modos (nunca cor livre), densidade padrão ou compacta (TOK-14, LIS-07), favoritos na navegação e vistas salvas de listagem (filtros, colunas, ordem) com nome. Preferências persistem por usuário no servidor, para seguirem a pessoa de aparelho em aparelho; navegador só como cache. *Verificar:* trocar o destaque e recarregar em outro navegador; a escolha volta.

Exemplos. Painel: "Bom dia, Bruno · 7 OS esperam peça", vista salva "Minhas urgentes" na barra lateral. Cliente: nome e foto do aparelho no topo, endereço favorito pré-escolhido.

### 3.7 Antecipação

O app premium já sabe o próximo passo provável e o oferece, sem decidir pela pessoa.

- **EXP-23** · [PR] · P2. **Próxima ação sugerida.** Cada estado do objeto mostra a ação mais provável como principal (CLI-02 no cliente; no operador, "Enviar orçamento" quando o diagnóstico acabou). Campos começam com padrões inteligentes: último valor usado pela pessoa, valor mais comum, data mais provável, sempre editáveis.
- **EXP-24** · [PR] · P2. **Um dado preenche o resto.** CEP preenche o endereço (CLI-24); IMEI ou número de série preenche marca e modelo quando há base consultável, com a fonte declarada e o resultado editável; cliente digitado autocompleta do histórico com os últimos aparelhos e endereços. Falha da consulta nunca bloqueia: o campo segue manual. *Verificar:* desligar a consulta; o formulário continua completável.
- **EXP-25** · [PR] · P2. **Alerta antes do problema.** O app avisa o que vai dar errado enquanto ainda dá para evitar ("A peça chega dia 21, depois do prazo prometido ao cliente (19/11). Avisar cliente?"), com a ação no próprio aviso. Proposta gerada por IA é proposta: a pessoa confirma (`ca-arquitetura`).

Exemplos. Painel: ao abrir a OS, "Garantia vence em 3 dias" com "Priorizar"; IMEI digitado vira "iPhone 13, 128 GB". Cliente: "Retirar amanhã às 10h?" já com o último horário escolhido.

### 3.8 Confiança visível

A pessoa ousa usar rápido quando vê que nada se perde.

- **EXP-26** · [DS] · P2. **Desfazer em tudo que é reversível**, também fora do toast (EST-32); **salvamento automático com indicador** sempre à vista no cabeçalho do registro: "Salvando…", "Salvo às 14:32", "Não salvo · Tentar de novo" (CAM-08, EST-18). Nunca "Salvo" antes da confirmação do servidor (EST-28).
- **EXP-27** · [DS] · P2. **Histórico à mão e estados honestos.** Todo registro mostra quem mudou o quê e quando, a um clique (PON-14), e a interface diz a verdade sobre o que não sabe: "Não confirmado" (EST-46), "Sem conexão" (EST-38), "Módulo indisponível" (EST-47), nunca um sucesso presumido.

Exemplos. Painel: "Editado por Ana às 14:10 · Ver histórico" no cabeçalho da OS; arquivar com "Desfazer" e Ctrl+Z. Cliente: "Pagamento em confirmação pelo banco" em vez de "Pago" antes da hora.

### 3.9 Voz

- **EXP-28** · [PR] · P2. **Microtexto humano** no tom decidido (PER-05): frases curtas de resultado, datas relativas com a absoluta acessível (TXT-38), vazios que ensinam o primeiro passo e erros com o que aconteceu, o estado dos dados e o próximo passo (TXT-21, LIS-21). Humor raro, só onde não há risco: nunca em erro, dinheiro, prazo ou perda de dado (TXT-33). *Verificar:* ler em voz alta os vazios, erros e conclusões do MVP; cada um diz o que fazer agora.

Exemplos. Painel: "Nenhuma OS esperando peça. Bom sinal." no vazio de trabalho concluído. Cliente: "Chega amanhã, até as 18h" em vez de "Em trânsito".

### 3.10 Detalhes de cuidado

Os detalhes que ninguém pede e todo mundo nota.

- **EXP-29** · [PR] · P3. **A aba trabalha:** título com contexto e contador ("(3) Fila de OS · Oficina"), favicon com marca de alerta quando há algo novo ou urgente, voltando ao normal ao ver.
- **EXP-30** · [PR] · P3. **A marca chega aos detalhes nativos:** anel de foco, seleção de texto (`::selection`), cursor de texto (`caret-color`), barra de rolagem e `accent-color` dos controles nativos com os tokens da marca, dentro do contraste (TOK-16, ACE-21).
- **EXP-31** · [PR] · P2. **As telas de exceção são telas:** 404 e offline com a ilustração ou o ícone da marca, uma frase útil e caminho de volta (busca, início, últimos acessados); versão de impressão (`@media print`) de comprovante, OS e orçamento, limpa e com a marca; imagem de compartilhamento (Open Graph) do link público, com marca e sem dado pessoal (PON-13). *Verificar:* abrir uma rota inexistente, desligar a rede e imprimir um comprovante.

### 3.11 Celular como nativo

- **EXP-32** · [DS] · P2. **Gestos de app nativo, com saída sem gesto:** sheets arrastáveis com pontos de parada (Vaul, DIS-17) e botão Fechar visível (CAM-32); puxar para atualizar com o botão "Atualizar" ou a idade do dado também tocável; deslizar a linha para revelar ações, com as mesmas ações no menu "⋯" (LIS-10, WCAG 2.5.1 e 2.5.7). Barra inferior na navegação de celular (NAV-13, DIS-05).
- **EXP-33** · [DS] · P2. **Instalável e de borda a borda:** PWA com manifesto, ícones (incluindo maskable e `apple-touch-icon`), `theme-color`, nome curto e tela de abertura com a marca; `viewport-fit=cover` com `env(safe-area-inset-*)` em barra inferior, sheet e botão flutuante, para nada ficar sob o entalhe ou a barra de gestos (DIS-07). *Verificar:* instalar no Android e no iPhone; abrir pelo ícone; nada encostado nas bordas.

Exemplos. Painel no tablet do balcão: sheet de detalhe da OS arrastável até meia altura. Cliente: app instalado com o ícone da loja, tela de abertura na cor da marca, barra inferior com Pedidos, Conta e Ajuda.

### 3.12 Marca em todas as pontas

- **EXP-34** · [PR] · P2. **Ilustração e ícones com a marca.** Vazios, sucesso e exceções usam ilustração no estilo da direção (PER-04); os poucos ícones que a família instalada não tem são desenhados na mesma grade e traço dela (STK-15, STK-16), nunca misturados de outra família. Gráficos usam a paleta de dados derivada dos tokens da marca, tipografia do produto e o mesmo raio e grade (IND-07), não o tema padrão da biblioteca de gráficos.
- **EXP-35** · [N casa] · P2. **Toda ponta conta com o mesmo design:** e-mail, template de WhatsApp, push, comprovante, PDF e notificação usam a mesma marca, os mesmos nomes de estado e as mesmas cores de estado do app (PON-10, COM), e aparecem como prévia no canal real na rodada (PRO-14). *Verificar:* o comprovante e o e-mail ao lado da tela do app; mesmo selo de estado, mesma voz.

## 4. Moldura do app

App com mais de uma tela precisa de moldura: a estrutura estável que diz onde a pessoa está, o que pode fazer e como sair. Sem ela, cada tela é um cartaz solto, e o protótipo parece uma sequência de capturas.

- **EXP-36** · [N casa] · P1 · SEMPRE. Todo app com mais de uma tela (protótipo e build) cumpre o checklist abaixo, na ponta onde se aplica. Item ausente sem motivo registrado é achado.

| Item | O que é | Verificar |
| --- | --- | --- |
| Sidebar recolhível | navegação lateral que recolhe para trilho de ícones com animação curta (`transform`, MOV-08), tooltip no trilho, atalho de teclado, e **lembra a escolha** por usuário (no padrão shadcn, o bloco Sidebar com `collapsible="icon"` e o estado persistido) | recolher, recarregar: continua recolhida |
| Barra superior global | busca ou paleta (EXP-08), notificações com contador, menu do usuário, troca de unidade ou loja e troca de tema | presente em todas as telas da ponta, no mesmo lugar |
| Barra de ferramentas da tela | ações rápidas, filtros frequentes visíveis, busca local e, quando o objeto tem etapas, troca de vista quadro, lista e tabela (LIS-16) | a vista escolhida fica na URL e é lembrada |
| Tabelas largas | cabeçalho fixo (LIS-06) e primeira coluna fixa ao rolar na horizontal, com sombra indicando a borda | rolar nos dois eixos: identificador e cabeçalho sempre à vista |
| Fluxos longos em etapas | cadastro ou processo longo vira etapas (stepper com passo na URL, NAV-38), abas ou páginas, nunca uma rolagem gigante | contar alturas de tela por passo; nenhum passo exige rolar várias telas |
| Uma ação principal por tela | um só botão primário; secundárias agrupadas (botão secundário, menu "⋯", barra de ferramentas) | contar botões primários por tela: um |
| Banner de entrada | na tela inicial de cada ponta, no topo junto da navegação global: saudação, resumo do dia, foto ou ilustração e a ação do momento (EXP-37); alto só em tela de marca, visão geral e cliente, compacto ou recolhível em tela de operação (NAV-41) | presente na tela inicial; topo da área de trabalho medido (NAV-41) |
| Abertura e carregamento | abertura com o logo da marca revelado em vidro, uma vez, com "Pular" (EXP-60); carregamento inicial com a marca (EST-49) | abrir o app limpo |
| Navegação no celular | trilho ou barra inferior, sheet para "Mais" (NAV-13, DIS-05) | percorrer a moldura a 375 px |

- **EXP-37** · [N casa] · P2. **Banner de entrada.** A tela inicial abre com um banner que se funde à moldura: saudação por nome e horário (EXP-21), o resumo do dia em dois ou três números com período (IND-04), imagem ou ilustração da marca ou da unidade e **a ação do momento** ("Abrir caixa", "7 OS esperam peça · Ver"). Onde ele entra é de NAV-41: alto só em tela de marca, visão geral e cliente; em tela de operação, cabeçalho compacto ou banner que recolhe ao rolar, para não roubar a área de trabalho (EXP-49). Texto sobre imagem ou gradiente segue EXP-47.
- **EXP-60** · [N casa] · P1 · SEMPRE. **Tela de abertura do app.** Todo app criado do zero tem obrigatoriamente uma abertura com o **logo da marca revelado em vidro**, a partir do template `abertura` e do `GlassIconReveal` do arsenal (no starter, em `assets/arsenal/starter/`; o `LEIAME.md` diz onde). Ela toca **uma vez** por navegador (a escolha fica guardada), tem **"Pular"** visível e acionável por teclado, e **sai direto** para a primeira tela com movimento reduzido (logo pousado, sem animação). Nunca segura a pessoa: qualquer toque ou tecla encerra (EXP-52), e o app carrega por trás. Sem WebGL2, mostra o logo plano. *Por quê:* pedido do dono; é o primeiro momento de marca e o arsenal já o traz pronto. *Verificar:* abrir o app num perfil limpo (toca), recarregar (não toca de novo), Tab até "Pular", repetir com movimento reduzido (vai direto).
- **EXP-61** · [N casa] · P1 · SEMPRE. **Conformidade visual: o elemento-assinatura dita o sistema.** Quando um componente de destaque entra (do arsenal, do 21st ou criado), as características visuais dele (borda com gradiente, brilho, borda de luz, raio, material) viram tokens e se aplicam a **todas** as superfícies, em intensidades por nível (fundo, casca, card, destaque, flutuante), por um componente base de superfície. Um card com gradiente ao lado de cards padrão é achado: **todos os cards têm o mesmo estilo**. Se o elemento-assinatura é um card com gradiente, **todo card do produto tem o gradiente**, em intensidade por nível (card suave, destaque forte, flutuante com vidro denso); num preset sóbrio o gradiente fica contido, quase tom sobre tom, mas existe. Cards da mesma linha de grid têm a **mesma altura** (tolerância de 2 px), com o conteúdo distribuído por dentro. O shadcn é base: **nenhum componente aparece com o visual padrão do shadcn** (card branco ou cinza com borda fina, botão e badge padrão); tudo passa pelos tokens do preset. A **paleta de dados** (`--chart-1` a `--chart-5`) também é do preset e acompanha o destaque escolhido: gráfico azul num tema verde é achado; nenhum componente tem cor de fallback fixa. Card de vidro que **sobe sobre um banner** usa o nível de vidro mais denso ou um véu uniforme: o fundo escuro do banner não pode virar uma faixa atrás do título, deixando o card "partido" em dois tons. Faixas encostadas da mesma superfície (título do card e cabeçalho da tabela, por exemplo) têm o mesmo tom e material e grudam juntas ao rolar; a separação de nível é por espaço ou linha fina de 1 px, nunca por duas superfícies de tons diferentes com emenda seca. Componente de terceiro que traz cartão próprio (canvas com moldura, brilho e raio, como peak-chart e market-card) entra **sem a moldura dele** dentro da superfície do sistema, ou substitui a superfície; nunca as duas molduras ao mesmo tempo, e sempre ocupando a célula da grade sem largura fixa. *Por quê:* um componente bonito no meio de uma página padrão parece colado, e o app fica com cara de template. *Verificar:* `navegar.mjs` (altura por linha de grid, cor fixa fora dos tokens) e o `consistency.mjs` da design-taste-frontend (card-family, button-styles); comparar os cards de cada tela nas capturas.
- **EXP-38** · [PR] · P2. **Uma ação principal, secundárias agrupadas.** A ação principal fica no mesmo lugar em todas as telas do mesmo tipo (canto da barra de ferramentas no desktop, rodapé fixo com safe area no celular, DIS-07). Ação destrutiva nunca é a principal visual ao lado da construtiva.

## 5. Componentes vivos

Biblioteca de componentes é **piso, não teto**. O shadcn instalado e sem toque produz a mesma cara de mil outros apps; o componente vira do produto quando recebe a personalidade e passa a responder.

- **EXP-39** · [N casa] · P2. **Refine todo componente da biblioteca à personalidade**, no componente do sistema (STK-08), nunca deixando idêntico ao padrão: raio da família escolhida (TOK-21), densidade, ícone da família com o peso certo, cor de estado e variantes semânticas (STK-11), elevação dos níveis do projeto (EXP-44), estados de hover, press, foco e desabilitado desenhados. *Verificar:* compare o Button, o Badge, o Card, o Input e a Table do protótipo com o padrão da biblioteca; pelo menos três eixos diferem e cada diferença vem da tabela de PER-04.
- **EXP-40** · [N casa] · P2. **Status tem cor e vida.** O estado do objeto aparece com a cor do estado (PON-10, STK-17) em todo lugar onde aparece: selo, passo da timeline, barra de progresso, coluna e card do kanban, ponto no calendário. Na timeline e em itens ao vivo, **o passo atual pulsa** (EXP-16); os concluídos ficam preenchidos e os futuros em contorno. Cor nunca sozinha: ícone e texto junto (ACE-22).
- **EXP-41** · [N casa] · P2. **Todo controle responde e toda troca tem transição.** Cada controle interativo tem microinteração curta e interrompível (press, toggle, check, copiar, arrastar, abrir e fechar camada), pelos presets de mola (EXP-09) e pelas regras de `movimento.md`; troca de vista, de aba e de tela tem transição real (EXP-12). Controle que muda de estado sem nenhuma resposta visual é achado. *Verificar:* passar por cada controle da tela com mouse, toque e teclado; anotar o que não responde.

## 6. Profundidade e camadas

Tela plana é tela fria. Profundidade organiza: o que está à frente pede atenção, o que está atrás dá contexto. Gradiente, sombra, sobreposição e textura são ferramentas de hierarquia quando têm papel e saem dos tokens.

- **EXP-42** · [N casa] · P2. **Gradientes com papel, dos tokens da marca:** banner que se funde ao fundo da página, brilho sutil no botão principal, gradiente que pulsa devagar em estado ao vivo, moldura ou borda de destaque, fundo de tela de exceção. Todo gradiente usa paradas de tokens (acento, neutros, semânticas) e nomeia o papel (EXP-01). Gradiente genérico que não vem da marca (o roxo-azul de template) é achado de direção (PER, seção 7).
- **EXP-43** · [N casa] · P2. **Elevação em vários níveis**, como tokens nomeados (no mínimo: plano, repouso, elevado, flutuante, sobreposto), cada um com sombra e superfície próprias nos dois modos (no escuro, superfície mais clara e anel em vez de sombra preta, TOK-20). Cada componente usa o nível do seu papel: card em repouso, card sob o mouse ou arrastado sobe um nível, barra fixa e popover flutuam, modal sobrepõe. *Verificar:* listar os níveis usados numa tela principal; pelo menos três.
- **EXP-44** · [PR] · P2. **Sobreposição intencional:** avatar ou foto do aparelho que avança sobre a borda do banner, cards que sobem sobre o fim do banner de entrada, foto atrás do cabeçalho com véu de cor da marca. A sobreposição nunca cobre conteúdo nem alvo de toque, e funciona no celular.
- **EXP-45** · [PR] · P2. **Textura, ruído e desfoque com fallback.** Ruído fino em superfícies grandes, vidro desfocado em barra fixa e sheet, padrão discreto de marca no banner: com `@supports` para o desfoque e uma superfície sólida equivalente quando faltar suporte, com `prefers-reduced-transparency` ou em alto contraste (ACE-27); desempenho medido (EXP-53).
- **EXP-46** · [N casa] · P2. **Pelo menos três planos visíveis** em cada tela principal: fundo (página, gradiente ou imagem), superfície (cards, painéis) e algo à frente (barra fixa, elemento sobreposto, popover, botão flutuante, card elevado). *Verificar:* na captura, nomear os três planos.
- **EXP-47** · [N] · P1. **Texto sobre gradiente ou foto tem contraste medido** no ponto mais desfavorável do fundo, nos dois modos (TOK-16, ACE-21); quando a imagem varia, véu ou sombra de texto garantem o mínimo. Contraste estimado não conta.

Exemplos. Painel: banner com gradiente do acento que se dissolve no fundo, saudação e três KPIs; cards da fila sobem sobre o fim do banner; barra de ferramentas com vidro desfocado ao rolar. Cliente: foto do aparelho sobre o banner do pedido, véu na cor da marca, timeline em card elevado.

## 7. Passada de vida

Antes de qualquer protótipo ir para a pessoa, uma passada de propósito procura onde o app ainda está frio. É o equivalente, para a experiência, da autoverificação de estados.

- **EXP-48** · [N casa] · P2. **Antes de mostrar qualquer protótipo**, responda uma pergunta por pilar e as da moldura, dos componentes e da profundidade, apontando a tela e o elemento. Pilar sem resposta vira correção antes da rodada ou entra na rodada como "não feito, por quê". Registre a tabela na rodada (PRO-15), logo depois das decisões. *Verificar:* a rodada tem a tabela preenchida, com tela e elemento em cada linha.

| Pergunta | Pilar |
| --- | --- |
| Onde este app responde antes de terminar? | Velocidade sentida |
| Onde ele cede, pesa e para com elasticidade? | Sensação física |
| Onde ele mostra de onde as coisas vêm e devolve o lugar ao voltar? | Continuidade |
| Onde ele mostra que algo está acontecendo agora e quem está ali? | Vida e tempo real |
| Onde ele mostra progresso e celebra uma conclusão? | Progresso e recompensa |
| Onde ele reconhece a pessoa e deixa ela arrumar o espaço? | Posse e personalização |
| Onde ele antecipa o próximo passo ou um problema? | Antecipação |
| Onde ele mostra que nada se perde? | Confiança visível |
| Onde o texto soa como gente e ajuda no vazio e no erro? | Voz |
| Qual detalhe de cuidado ninguém pediu? | Detalhes de cuidado |
| Como ele se comporta como app nativo no celular? | Celular como nativo |
| A mensagem e o comprovante parecem o mesmo produto? | Marca em todas as pontas |
| A moldura está completa? | Moldura (EXP-36) |
| Que componente ainda está igual ao padrão da biblioteca? | Componentes vivos (EXP-39) |
| Quais são os três planos de cada tela principal? | Profundidade (EXP-46) |
| Quais são os momentos-assinatura, de que prática do domínio vêm e em que rota e gatilho rodam no protótipo? | Momentos-assinatura (EXP-02, EXP-56) |
| Quais são as ações-chave de cada jornada e como elas fluem sem corte? | Transição cinematográfica e fluxo interativo (EXP-57, EXP-58) |

- **EXP-59** · [N casa] · P1 · SEMPRE. **A estética não tira informação.** A passada de refinamento e a passada de vida só **acrescentam**. Antes de mostrar, faça o inventário da tela-chave e de cada tela que mudou: todo dado, coluna, contagem, ação e estado pedidos no brief, ou presentes na versão anterior, continuam na tela, no mesmo alcance (o que era visível continua visível; nada vira só hover, só folha do sistema ou "fora deste protótipo"). A ação destrutiva continua na tela real com o tratamento de perigo, não só na folha. Trocar informação por banner, ilustração, espaço ou efeito é regressão P1. Efeito que cobre informação é de EXP-54. *Por quê:* na iteração 3, a coluna "Agora" da barbearia (aguardando, atrasados, na cadeira, a receber) sumiu, o ERP perdeu "dinheiro do dia" e "pedidos da loja", e "Recusar" e "Cancelar" viraram botões neutros. *Verificar:* lista do brief × tela-chave, item por item, antes e depois de cada passada; nenhum item faltando nem rebaixado.

## 8. Freios: alertas de uso consciente

Nada aqui é proibição de estilo. São os alertas que mantêm a vida a serviço da tarefa. As proibições que ficam são outras: contraste abaixo do WCAG, informação só por cor, emoji como ícone e enfeite em tarefa de alta frequência.

- **EXP-49** · [N casa] · P2. **A frequência escolhe a intensidade**, em vez de remover o movimento:

| Frequência | Intensidade | Exemplos |
| --- | --- | --- |
| 100+ por dia | resposta curta tipo mola rápida, sem cerimônia; teclado instantâneo (MOV-02) | press, toggle, selecionar linha, trocar aba |
| Dezenas por dia | resposta curta com continuidade | abrir detalhe, mover card, filtrar |
| Ocasional | movimento padrão, camadas com origem | modal, sheet, configurações, troca de tema |
| Rara ou marco | cerimônia: momento-assinatura do domínio (EXP-56), transição cinematográfica (EXP-57), ilustração | orçamento aceito, pagamento concluído, caixa fechado, primeiro uso |

  *Verificar:* teste do 50º uso de MOV-01 em cada efeito; o que incomodaria na quinquagésima vez desce uma linha.
- **EXP-50** · [N casa] · P2. **Movimento reduzido sempre respeitado**, com o mapa de `movimento.md` (MOV-21): o momento-assinatura, o pulso, a transição de tela e a troca de tema têm versão reduzida entregue junto, sem perder o sinal de estado (MOV-22).
- **EXP-51** · [N casa] · P2. **No máximo uma celebração por fluxo** e nenhuma em ação frequente (PER-16, PER-17). Duas cerimônias seguidas no mesmo fluxo viram uma.
- **EXP-52** · [PR] · P2. **Nada segura o usuário esperando animação:** o commit é imediato, o próximo clique funciona durante qualquer transição, momento-assinatura ou celebração, e toda animação é interrompível (MOV-16, MOV-20).
- **EXP-53** · [PR] · P2. **Efeito pesado tem desempenho medido:** desfoque grande, sombra em lista longa, ruído animado, shader, cena 3D, partículas. Grave no celular intermediário real (MOV-10), sem quadros longos e sem piora de INP na tela; se passar, reduza a área, troque por estático ou mova para momento raro. Efeito de cena (Three.js, Rive, shader) só em momento de marca (STK-09).
- **EXP-54** · [PR] · P3. **Nenhum efeito esconde informação:** sobreposição, véu, desfoque e textura nunca reduzem a leitura de número, status ou ação, nem cobrem alvo de toque.

## 9. Régua de comparação

O bom gosto vem de apps que já resolveram o problema (REF-01). Para a experiência, a régua é um conjunto de apps de referência estudados pela mão, no mesmo método dos demos medidos antes: usar, gravar, medir e anotar o padrão, nunca copiar a tela.

- **EXP-55** · [PR] · P3. Antes da v2 do modo criar, estude pela mão 2 ou 3 apps da régua que tenham a mesma natureza de tarefa, e anote, por app, de 3 a 5 detalhes observados, cada um com captura ou vídeo, o pilar a que serve e como ele se traduz na direção escolhida. Os cartões seguem `referencias-e-bom-gosto.md` (link, sem rehospedar, nível de padrão, REF-07, REF-09, REF-11).

| App | O que estudar |
| --- | --- |
| Linear | velocidade sentida, paleta e atalhos, transição lista → detalhe, estados otimistas |
| Stripe (dashboard) | moldura, tabelas, detalhe de pagamento, gráficos com identidade, histórico de eventos |
| Arc | personalização do espaço, cores por espaço, continuidade entre vistas |
| Things | sensação física, conclusão reconhecida, voz, celebração discreta |
| Raycast | teclado, paleta, resposta instantânea sem animação |
| Notion | vazios que ensinam, presença, primeiros passos |
| Vercel | status ao vivo, logs em tempo real, idade do dado, profundidade sóbria |
| Apps da Apple | sheets, háptica, materiais e desfoque, transições de continuidade |

## 10. Padrão detectável → correção

**Falta**

| Padrão detectável | Correção |
| --- | --- |
| Tela principal plana: um plano só, sem elevação, sem banner, cards iguais no fundo cinza | Três planos (EXP-46), níveis de elevação (EXP-43), banner de entrada (EXP-37) |
| App de várias telas sem sidebar, sem barra superior global ou sem barra de ferramentas | Checklist da moldura (EXP-36) |
| Sidebar recolhível que esquece a escolha ao recarregar | Persistir por usuário (EXP-36) |
| Tabela larga com cabeçalho ou primeira coluna que somem ao rolar | Cabeçalho e coluna fixos (EXP-36, LIS-06) |
| Cadastro longo numa rolagem só | Etapas com passo na URL (EXP-36) |
| Duas ou mais ações primárias na mesma tela | Uma principal, secundárias agrupadas (EXP-38) |
| Troca de tela, aba ou tema com corte seco | Transição real com fallback (EXP-12, EXP-41) |
| Voltar perde rolagem, seleção ou filtros | Restaurar o lugar (EXP-13) |
| Botão, toggle ou checkbox sem resposta visual no press | Microinteração com mola rápida (EXP-09, EXP-41) |
| Arrastar sem sombra, sem inércia ou que trava seco no limite | Elevação, inércia e limite elástico (EXP-10) |
| Conclusão de fluxo sem reconhecimento (volta à lista em silêncio) | Estado final com ícone e frase; no momento raro, jornada que se completa, resumo ou transição cinematográfica do domínio (EXP-18, EXP-57) |
| Fluxo de várias etapas com corte seco entre elas | Elementos compartilhados que viajam de etapa em etapa (EXP-58) |
| Ação-chave da jornada (pagar, aceitar orçamento) que só troca de tela | Transição cinematográfica do botão à confirmação e de volta ao objeto (EXP-57) |
| Modo criar sem momentos-assinatura, ou com momentos só descritos | 2 ou 3 momentos, rodando no protótipo (EXP-02, EXP-03) |
| App criado do zero sem abertura de marca ou com spinner solto no carregamento inicial | Abertura com o logo em vidro e carregamento com a marca (EXP-60, EST-49) |
| Passada de vida que trocou informação por banner, ilustração ou espaço | Devolver a informação; a estética só acrescenta (EXP-59) |
| Button, Badge, Card ou Table idênticos ao padrão do shadcn | Refinar no componente do sistema (EXP-39) |
| Timeline ou kanban sem cor por status e sem passo atual destacado | Cor do estado e passo atual vivo (EXP-40, EXP-16) |
| Dado que se atualiza sem idade nem "novos" | "Atualizado há…" e "3 novos" (EXP-14) |
| Salvamento automático sem indicador; ação reversível sem Desfazer | Indicador de salvamento e Desfazer (EXP-26) |
| 404, offline e impressão com a cara padrão do navegador | Telas de exceção com a marca (EXP-31) |
| Gráfico no tema padrão da biblioteca | Paleta e tipografia da marca (EXP-34) |
| E-mail, WhatsApp ou comprovante sem a marca e com outro nome de estado | Mesmo design em todas as pontas (EXP-35) |
| Celular sem barra inferior, sem safe area ou sem instalação | Celular como nativo (EXP-32, EXP-33) |
| Rodada sem a tabela da passada de vida | Passada de vida antes de mostrar (EXP-48) |

**Excesso**

| Padrão detectável | Correção |
| --- | --- |
| Efeito sem papel nomeado (gradiente, brilho, partícula, parallax "porque fica bonito") | Nomear o papel ou remover (EXP-01) |
| Gradiente que não sai dos tokens da marca | Paradas de token com papel (EXP-42) |
| Clichê: tropo genérico de deleite (carimbo "APROVADO" ou "PAGO", confete, troféu, mascote, animação genérica de "sucesso") como momento-assinatura | Momento específico do domínio, tirado de como os usuários trabalham: a jornada do aparelho pela bancada, o dia da cadeira enchendo (EXP-56) |
| Celebração ou cerimônia em ação frequente | Mover para o momento raro; resposta curta na ação frequente (EXP-49, EXP-51) |
| Duas celebrações no mesmo fluxo | Uma só (EXP-51) |
| Pulso em estado parado, vários pulsos na mesma região ou pulso eterno sem pausa | Pulso só no que acontece agora, um por região, parando em ~5 s ou com pausa (EXP-16, MOV-31) |
| Animação que segura o próximo clique ou atrasa o commit | Commit imediato, animação interrompível (EXP-52) |
| Desfoque, sombra ou shader que derruba quadros no celular | Medir e reduzir (EXP-53) |
| Texto sobre foto ou gradiente sem contraste medido | Medir no pior ponto; véu (EXP-47) |
| Sobreposição que cobre número, status ou alvo de toque | Reposicionar (EXP-54) |
| Ranking público entre funcionários ou sequência que pune ausência | Gamificação sóbria (EXP-20) |
| Vibração a cada toque, som ligado por padrão | Vibração só em conclusão e limite; som desligado (EXP-11) |

## 11. Fontes

- NN/g · [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) (visibilidade do estado do sistema); [Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/); [The Peak-End Rule](https://www.nngroup.com/articles/peak-end-rule/); [The Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) [P]
- Doherty, W. J.; Thadani, A. J. · The Economic Value of Rapid Response Time, IBM, 1982 (limiar de cerca de 400 ms) [P]
- Kahneman, D. et al. · When More Pain Is Preferred to Less: Adding a Better End, Psychological Science, 1993 (pico e fim) [P]
- Kivetz, R.; Urminsky, O.; Zheng, Y. · The Goal-Gradient Hypothesis Resurrected, Journal of Marketing Research, 2006 [P]
- Nunes, J. C.; Drèze, X. · The Endowed Progress Effect, Journal of Consumer Research, 2006 [P]
- W3C · WCAG 2.2: 1.4.3 Contraste, 1.4.11 Contraste não textual, 2.2.2 Pausar, parar, ocultar, 2.3.3 Animação a partir de interações, 2.5.1 Gestos de ponteiro, 2.5.7 Movimentos de arrastar [N]
- W3C · [Web Application Manifest](https://www.w3.org/TR/appmanifest/); [The Open Graph protocol](https://ogp.me/) [DS]
- Astro · [Prefetch](https://docs.astro.build/en/guides/prefetch/); [View transitions](https://docs.astro.build/en/guides/view-transitions/) [DS]
- MDN · [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API); [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) (sem suporte no Safari); [backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter); [env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env); [prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) [DS]
- shadcn/ui · [Sidebar](https://ui.shadcn.com/docs/components/sidebar) (recolher para ícones, estado persistido) [DS]
- Apple · Human Interface Guidelines: [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) [DS]
- Rauno Freiberg · [Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) [PR]
- Skills instaladas (praticante): `emil-design-eng`, `apple-design`, `animate`, `gestures`, `choreograph`, `find-animation-opportunities`, `better-ui`, `high-end-visual-design`, `mobile-native`
- Apps de referência observados (Linear, Stripe, Arc, Things, Raycast, Notion, Vercel, apps da Apple) [PR]
- Decisões do dono da skill sobre experiência premium, momentos-assinatura, moldura, componentes vivos, profundidade e freios (16/11/2026), depois de testar os protótipos gerados e achá-los frios [N casa]

Lacunas: não há pesquisa que fixe "2 ou 3 momentos", "três planos" ou "uma celebração por fluxo"; são política da casa. A gamificação sóbria em B2B é prática, não pesquisa. As URLs acima não foram reabertas nesta redação (nov/2026): confira antes de citá-las como evidência num achado.
