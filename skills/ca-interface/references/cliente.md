# Cliente (CLI)

Cobre as jornadas da ponta do cliente: rastreio, orçamento e aprovação, conta e histórico, comprovantes e garantia, checkout e pagamentos brasileiros, cancelamento e devolução, loja de itens únicos, serviço sem preço fechado, entrega e retirada, e o que nunca mostrar. Não cobre: máquina de estados e payload por papel (`pontas-e-sistema.md`), chat e notificações (`chat-e-notificacoes.md`), critérios WCAG (`acessibilidade.md`), mecânica de formulário e camadas (`formularios-e-camadas.md`), redação (`microtexto-ptbr.md`), números (`fundamentos-e-tokens.md`).

O cliente quer três coisas: **uma data, uma frase simples e um caminho de volta**. Toda frase de status vem da tabela de projeção (PON-06). Esta referência diz como ela aparece na tela.

Formato: **ID** [selo] · prioridade mínima — regra. A prioridade é piso.

## Sumário
1. Princípios da ponta · 2. Rastreio · 3. Orçamento e aprovação · 4. Serviço sem preço fechado · 5. Conta e histórico · 6. Comprovantes e garantia · 7. Checkout e pagamento · 8. Cancelamento e devolução · 9. Loja de itens únicos · 10. Entrega e retirada · 11. Acessibilidade legal · 12. O que nunca mostrar · Padrões → correção · Fontes

## 1. Princípios da ponta

**CLI-01** [P]/[PR] · P2 — **Celular primeiro.** Desenhe a tela do cliente na largura do celular e depois amplie: uma coluna, estado do objeto no topo, uma ação primária visível sem rolar, alvos de toque confortáveis e teclado certo por campo. *Por quê:* no benchmark da Baymard, checkout em celular e em desktop estão igualmente fracos (59% "medíocre" ou pior), e o celular é a maior parte do tráfego (número de fonte secundária, não verificado). A densidade é a confortável (`fundamentos-e-tokens.md`).

**CLI-02** [PR] · P2 — **Cada estado do cliente tem uma próxima ação primária e um canal de ajuda.** Nenhum estado é beco sem saída. A ação muda com o estado: "Rastrear" a caminho, "Avaliar" depois da entrega, "Reagendar" na tentativa falha. *Verificar:* percorrer todas as linhas da tabela de projeção na ponta cliente.

**CLI-03** [P] · P2 — **Paridade com o operador.** Toda ação que o operador faz sobre o pedido (cancelar, alterar endereço, reagendar, pedir devolução) tem equivalente de autoatendimento **ou** aparece desabilitada com o motivo e o caminho alternativo. *Por quê:* na Baymard, remover o botão de devolução depois do prazo gerou incerteza; mostrar desabilitado com o motivo funciona melhor. *Verificar:* comparar os inventários de CTA das duas pontas (PON-04).

## 2. Rastreio e acompanhamento

Rastrear é o recurso de autoatendimento mais valorizado: 50% o põem em primeiro lugar (Baymard). A atualização de setembro de 2026 reafirma isso e espera que a página da loja traga toda a informação, inclusive foto como prova de entrega.

**CLI-04** [P] · P1 — O rastreio fica **no próprio site** e mostra os **6 dados da Baymard**:
1. data prevista de entrega, o dado mais procurado;
2. barra de progresso que inclui as etapas **antes** do envio;
3. nome da transportadora;
4. código de rastreio clicável, que abre a página da transportadora;
5. histórico detalhado e datado;
6. resumo do conteúdo: miniaturas dos itens e total.

Só 33% dos sites testados tinham os seis. O link para a transportadora continua disponível, mas a página dela não substitui a da loja: e-mails que mandam direto para lá deixam o cliente sem caminho de volta.

**CLI-05** [P] · P2 — Mostre **data prevista ("chega até qui, 21/11")**, não prazo ("5 a 8 dias úteis"), no checkout e no rastreio. Quando houver incerteza, use uma faixa de datas, não uma faixa de dias.

**CLI-06** [P] · P1 — Status em **linguagem do cliente**: nada de jargão nem código cru de transportadora (o exemplo negativo da NN/g é "Cert. of Posting Created"). Traduza eventos como "Objeto em trânsito – por favor aguarde" para o vocabulário da loja. Ponha a atualização **mais recente em destaque** e o **histórico datado** abaixo, com a mais nova no topo. *Verificar:* grep de termos internos e códigos nas rotas do cliente.

**CLI-07** [P] · P1 — E-mail, SMS e WhatsApp levam ao rastreio **sem novo login**, por link assinado e com validade. Como alternativa, ofereça a busca por número do pedido + e-mail ou CEP, dizendo onde o cliente acha o número. O link público obedece a PON-13: cidade e UF, sem endereço completo. *Verificar:* abrir os links em sessão anônima.

**CLI-08** [P]/[PR] · P2 — **Atraso com motivo e nova previsão**, sem esperar o cliente perguntar: "Atrasou por causa da chuva na rota. Nova previsão: sáb, 23/11." A data antiga aparece riscada ou no histórico. Na ausência de novidade em processos longos, uma atualização curta mantém a confiança (NN/g). Erro diagnóstico: "não encontrado" explica que o rastreio pode ainda não estar ativo.

**CLI-09** [PR] · P2 — **Pedido dividido** tem um rastreio por pacote, cada um com seus itens. Fluxo com ramos (cancelamento, devolução, entrega parcial) mostra um **estado terminal claro** ("Pedido cancelado · reembolso até 25/11") em vez de um stepper travado no meio.

**CLI-10** [PR] · P3 — O **pedido ativo aparece fora da tela do pedido**, como faixa ou card na home, com o estado atual e a data.

## 3. Orçamento e aprovação ou recusa pelo cliente

O Código de Defesa do Consumidor proíbe "executar serviços sem a prévia elaboração de orçamento e autorização expressa do consumidor" (art. 39, VI). O art. 40 exige orçamento prévio discriminando mão de obra, materiais e equipamentos, condições de pagamento e datas de início e término. Salvo estipulação em contrário, o orçamento vale 10 dias (§1º). Uma vez aprovado, obriga as duas partes e só muda por livre negociação (§2º).

**CLI-11** [N] · P1 — A tela do orçamento mostra, **antes** do botão Aprovar, o que o art. 40 pede: itens de mão de obra e de materiais com valores, condições de pagamento, datas previstas de início e término e **validade com data** ("Válido até 26/11"). O total aparece junto do botão.

**CLI-12** [N] · P1 — **Aprovação expressa e registrada.** O cliente aprova com uma ação explícita, e o sistema guarda quem aprovou, quando, por qual canal e **qual versão** do orçamento. O operador não muda o estado para "aprovado" sem esse registro, ou registra a autorização recebida por outro canal com anexo ou nota (PON-14). Execução antes da aprovação é bloqueada no servidor.

**CLI-13** [PR] · P2 — **Recusar é tão fácil quanto aprovar**: mesmo nível visual secundário, motivo opcional e o que acontece depois ("Seu aparelho fica disponível para retirada até 30/11, sem custo" ou a taxa de avaliação, se houver e tiver sido informada antes). Orçamento vencido mostra "Orçamento expirado em 26/11" + [Pedir novo orçamento].

**CLI-14** [N]/[PR] · P2 — **Mudança depois de aprovado gera nova versão** com o que mudou destacado e uma nova aprovação (art. 40, §2º). As duas versões ficam no histórico. A frase do cliente nunca muda de valor silenciosamente.

## 4. Serviço sem preço fechado (pedido de avaliação)

**CLI-15** [PR] · P2 — Quando o preço depende de diagnóstico, **não finja preço**. O CTA é "Pedir avaliação", não "Comprar". A tela diz:
- o que acontece e quando: "Respondemos com o orçamento em até 2 dias úteis";
- se há taxa de avaliação, quanto é e se ela é abatida do serviço;
- uma faixa "a partir de" só quando for real e conferida.

O objeto segue estados honestos na tabela de projeção: `avaliacao_solicitada` → `em_avaliacao` → `orcamento_enviado` → `aprovado` | `recusado` | `expirado`. Cada um tem frase, data e próxima ação.

## 5. Conta e histórico

**CLI-16** [P] · P2 — A **lista de pedidos mostra os itens** (miniatura e nome) sem abrir cada pedido. Na Bloomingdale's, uma participante abriu 4 pedidos até achar o certo. A lista e o detalhe são o ponto de partida para alterar, cancelar, devolver, avaliar e comprar de novo.

**CLI-17** [N] · P2 — **"Meus dados"**: o cliente vê, corrige e entende o uso dos próprios dados em linguagem clara (LGPD arts. 9º e 18).

**CLI-18** [P] · P3 — Segurança sem bloqueio: requisitos de senha visíveis **antes** do envio, opção de mostrar a senha, passkey ou código de uso único quando houver, 2FA opcional. Cartão salvo é editável sem precisar excluir e recadastrar. Segurança nunca bloqueia o checkout.

## 6. Comprovantes e garantia

**CLI-19** [PR] · P2 — Comprovante de pagamento, nota fiscal e orçamento aprovado ficam **no próprio pedido**, baixáveis e compartilháveis, sem pedir ao atendimento. O comprovante de Pix não leva propaganda nem oferta. *Ressalva:* a proibição do BC foi vista só por manchete, com data não verificada.

**CLI-20** [N] · P2 — **Garantia com data de fim calculada**, não só "90 dias". O CDC dá prazo de reclamação por vício aparente de 30 dias para serviço e produto não duráveis e de 90 dias para duráveis (art. 26). A garantia contratual complementa a legal e é dada por termo escrito, que explica em que consiste (art. 50). Na tela, mostre:
- "Garantia até 14/02/2027";
- o que cobre e o que não cobre;
- como acionar: um botão que abre um chamado ligado ao pedido, sem pedir de novo o número.

## 7. Checkout e pagamento

Na Baymard, 59% dos checkouts são "medíocres" ou piores. Os números usados aqui são os do artigo de estado atual, o mais recente.

**CLI-21** [P] · P1 — **Compra como convidado**, com a criação de conta oferecida **na confirmação**, não antes (56% dos sites erram). Etapas concluídas viram resumos editáveis.

**CLI-22** [P] · P1 — **Obrigatórios e opcionais marcados explicitamente**. Marcar só um dos dois falhou: 32% pularam um obrigatório quando só os opcionais estavam marcados. A mecânica do campo está em `formularios-e-camadas.md`.

**CLI-23** [P] · P2 — **Explique por que pede telefone e CPF** ao lado do campo: "Para a transportadora avisar sobre a entrega" e "Exigido para emitir a nota fiscal". 68% relutam em informar o telefone, e 47% dos sites não explicam. Não peça o que não usa.

**CLI-24** [P] · P2 — **CEP preenche** logradouro, bairro, cidade e UF, que continuam **editáveis**. Se a busca falhar, os campos abrem para digitação manual com uma frase neutra. Isso corta cerca de 40% da digitação.

**CLI-25** [PR] · P3 — CEP e CPF com `inputmode="numeric"`, máscara que não bloqueia colar e validação do dígito verificador no envio. `autocomplete` é regra de `acessibilidade.md`.

**CLI-26** [N] · P1 — **Pix** segue o Anexo IV do Regulamento Pix (Requisitos Mínimos para a Experiência do Usuário; versão 7.4, vigente a partir de 01/03/2027):
- QR Code **e** botão de copiar com a nomenclatura regulada ("Pix Copia e Cola"), feedback de copiado anunciado (`role="status"`);
- valor e recebedor visíveis;
- expiração visível ("Pague até 14:32");
- status que muda sozinho para "Pagamento confirmado" sem recarregar;
- quando expira, [Gerar novo código] e outra forma de pagamento.

*Verificar:* fixture com código expirado e fixture com confirmação chegando com a tela aberta.

**CLI-27** [PR] · P2 — **Boleto**: linha digitável copiável, valor, vencimento, opção de baixar o PDF e o prazo de compensação dito antes de escolher. *Ressalva:* o prazo usual de até 3 dias úteis não foi verificado. Tire o número de configuração, não fixe na tela. O pedido fica em "Aguardando pagamento do boleto · vence 20/11".

**CLI-28** [PR] · P3 — **Cartão**: parcelas com o valor de cada uma **e** o total, juros explícitos quando houver, e cartão salvo mostrado só como bandeira + 4 últimos dígitos.

**CLI-29** [PR] · P2 — **Sinal + saldo**: mostre os dois valores, a data do saldo, o meio de pagamento do saldo e o que acontece se não for pago (o item volta a ficar disponível? o sinal é devolvido?). Mostre isso **antes** de pagar o sinal. O eixo de pagamento tem estado próprio: "Sinal pago · saldo de R$ 1.240,00 até 30/11" + [Pagar saldo].

**CLI-30** [DS] · P2 — A **confirmação** segue o GOV.UK: número do pedido em destaque, o que acontece a seguir e quando, contato, link de rastreio, comprovante para guardar. Não ponha vitrine no lugar da confirmação.

**CLI-31** [PR] · P2 — Sem **urgência artificial** (contador falso, "5 pessoas vendo") e sem anúncio dentro do checkout, da confirmação e do rastreio. Contagem regressiva só quando o prazo é real (reserva, Pix).

## 8. Cancelamento e devolução

**CLI-32** [N] · P1 — **Direito de arrependimento**: em compra fora do estabelecimento (site, app, telefone), o consumidor pode desistir em 7 dias a contar da assinatura ou do recebimento (CDC art. 49). O caminho de desistência aparece no pedido durante esse prazo, sem exigir contato com o atendimento.

**CLI-33** [DS]/[PR] · P2 — **Consequência antes da ação irreversível**: valor, prazo e método do reembolso aparecem na confirmação ("Reembolso de R$ 189,90 no Pix em até 3 dias úteis"), como no padrão confirm an action do MoJ. O resultado aparece **no próprio pedido**. Sucesso usa cor neutra ou de sucesso, nunca de erro (o contraexemplo é a H&M, com cancelamento bem-sucedido em banner vermelho).

**CLI-34** [PR] · P2 (suba para P1 se houver dinheiro em jogo) — Ação que depende do outro lado gera **estado intermediário honesto nas duas pontas**, com prazo e canal de resposta: "Cancelamento em análise. Resposta até 24/11 por e-mail." O operador vê a mesma pendência com o prazo dele (PON-06).

**CLI-35** [P] · P2 — Devolução: elegibilidade clara por item, mesmo depois do prazo (botão desabilitado com o motivo, CLI-03), pelo menos uma opção grátis quando a política permitir, escolha clara da forma de reembolso e status do pedido atualizado assim que a devolução começa.

## 9. Loja com itens únicos e estado de conservação

Nenhuma fonte desta base cobre usados e peças únicas. As regras são síntese [PR].

**CLI-36** [PR] · P2 — **Estado de conservação numa escala definida e explicada** (ex.: Novo, Excelente, Bom, Com marcas), com link "O que significa cada estado". Venha com **fotos reais da unidade**, inclusive dos defeitos, cada defeito descrito em texto, e com o que foi testado. Foto de catálogo não serve como foto da peça única.

**CLI-37** [PR] · P2 — "1 disponível" é informação, não pressão. Reservado e vendido seguem PON-26 a PON-28. A página do item vendido **continua no ar** com "Vendido" e itens semelhantes, em vez de 404, porque o link foi compartilhado e indexado.

## 10. Entrega e retirada

**CLI-38** [PR] · P2 — **Endereço, custo e horário da entrega ficam separados de outras previsões.** "Pronto para envio em 2 dias" (preparo) não se confunde com "Chega até qui, 21/11" (entrega). O custo do frete aparece junto da opção, antes do pagamento. Todas as formas de entrega e retirada ficam num seletor só (53% dos sites não fazem isso, Baymard).

**CLI-39** [PR] · P2 — **Retirada**: endereço da loja com link de mapa, horário de funcionamento, a partir de quando está pronto, prazo para retirar, documento ou código necessário e quem pode retirar no lugar do cliente. O estado "Pronto para retirada" dispara aviso pelo canal principal (ver `chat-e-notificacoes.md`).

## 11. Acessibilidade legal

**CLI-40** [N] · P1 — As telas públicas têm **WCAG 2.2 AA** como alvo. O EAA (Diretiva UE 2019/882) vale desde 28/06/2025 para e-commerce que atende consumidores da UE; a norma harmonizada EN 301 549 incorpora a WCAG 2.1 AA. No Brasil, o art. 63 da LBI obriga sites de empresas com sede ou representação no país, mas ainda não há regulamento técnico (o MPF ajuizou ação pedindo a regulamentação; o desfecho não foi confirmado). A 2.2 AA cobre a 2.1 AA e acrescenta critérios que pesam no checkout: 3.3.7, 3.3.8 e 2.5.8. Os critérios estão em `acessibilidade.md`; aqui fica só o piso mais alto da ponta pública. Stepper sempre com texto, não só cor, e mudança de status anunciada.

## 12. O que nunca mostrar ao cliente

**CLI-41** [N] · **P0** — Nem na tela nem no payload (PON-12): notas internas; nome ou ID interno do atendente quando a política não prevê; motivo e score de antifraude; custo, margem e preço de compra; SKU interno, ID de banco e erro bruto ou stack; dados completos de pagamento (só bandeira + 4 últimos); endereço completo, nome e telefone em link público ou de convidado; dados de outros clientes, inclusive "reservado para Fulano"; estados internos sem tradução (`on_hold_upsell`, `nf_emitida`).

**CLI-42** [N casa] · **P1** · SEMPRE quando o sistema tem site ou landing — **A jornada do cliente começa na landing e tem uma estética só.** Quando o produto vende ou agenda para o público, o mapa de pontas inclui o site: landing, página de serviço ou produto, preços e contato, feitos com a `design-taste-frontend` (lentes). O fluxo do cliente segue dali sem quebra: landing → serviço ou produto → agendar ou comprar → checkout → criar conta → portal do cliente. Do primeiro ao último passo, os mesmos tokens de marca, fontes, fundo ambiente, banner com sobreposição e movimento; o cliente não pode sentir que saiu do site e caiu num sistema genérico. O painel do operador usa o mesmo preset na versão de operação (mais densa e compacta). *Por quê:* a landing é muitas vezes o primeiro contato, e a quebra de estética entre o site e o portal derruba confiança. *Verificar:* percorrer a jornada da landing ao portal no protótipo; comparar tokens, fontes e materiais entre o site e o portal; achado P1 para página do fluxo do cliente com material, fonte ou paleta diferentes da landing.

## Padrão detectável → correção

| Padrão detectável | Correção | ID |
| --- | --- | --- |
| "Prazo: 5 a 8 dias úteis" | Data prevista ou faixa de datas | CLI-05 |
| Código de rastreio como texto puro; e-mail que só leva à transportadora | Rastreio no site com os 6 dados e link para a transportadora | CLI-04 |
| Status com termo interno ou evento cru dos Correios | Frase da tabela de projeção | CLI-06 |
| Link do e-mail pede login ou número + CEP de novo | Link assinado direto ao pedido | CLI-07 |
| Botão de devolução some depois do prazo | Desabilitado com motivo e alternativa | CLI-03, CLI-35 |
| Orçamento aprovado só por mudança de status pelo operador | Aprovação expressa com versão registrada | CLI-12 |
| Orçamento sem validade ou sem itens discriminados | Itens, condições, datas e "Válido até" | CLI-11 |
| Cadastro obrigatório antes do pagamento | Convidado; conta na confirmação | CLI-21 |
| Asterisco sem legenda ou só "(opcional)" | Marcar obrigatórios e opcionais | CLI-22 |
| CEP preenche e trava os campos | Campos editáveis e entrada manual | CLI-24 |
| Pix sem expiração, sem copiar ou que exige recarregar | Requisitos do Anexo IV | CLI-26 |
| Sinal cobrado sem data e condição do saldo | Os dois valores, data e consequência antes de pagar | CLI-29 |
| Cancelamento bem-sucedido em vermelho | Cor neutra ou de sucesso, resultado no pedido | CLI-33 |
| Item vendido retorna 404 | Página "Vendido" com semelhantes | CLI-37 |

## Fontes

- Baymard, 6 Key Order-Tracking Details: https://baymard.com/blog/integrate-tracking-info
- Baymard, Accounts & Self-Service 2026: https://baymard.com/blog/accounts-and-self-service-ux-research-2026
- Baymard, Current State of Checkout UX: https://baymard.com/research-articles/current-state-of-checkout-ux
- Baymard, ZIP auto-detection: https://baymard.com/blog/zip-code-auto-detection
- NN/g, Status Trackers: https://www.nngroup.com/articles/status-tracker-progress-update/
- GOV.UK, Confirmation pages: https://design-system.service.gov.uk/patterns/confirmation-pages
- MoJ, Confirm an action: https://design-patterns.service.justice.gov.uk/patterns/confirm-an-action/
- BCB, Regulamento Pix, Anexo IV v7.4: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/versoes_futuras/IV_RequisitosMinimosparaExperienciadoUsuario-versao7-4.pdf
- Lei 8.078/1990 (CDC), arts. 26, 39, 40, 49, 50: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Lei 13.709/2018 (LGPD): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Level Access, EAA: https://www.levelaccess.com/compliance-overview/european-accessibility-act/
- MPF, regulamentação do art. 63 da LBI: https://www.mpf.mp.br/o-mpf/unidades/pr-sp/noticias/mpf-exige-que-a-uniao-defina-regras-para-garantir-acessibilidade-em-sites-publicos-e-privados
