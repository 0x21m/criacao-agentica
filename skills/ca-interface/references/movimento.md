# Movimento (MOV)

Cobre a postura de movimento da skill, o sistema de movimento (durações, curvas e presets de mola como token), as microinterações que todo controle tem, a transição entre telas, a continuidade, a coreografia, a troca de tema animada, o estado ao vivo, a gamificação e a celebração, a interrupção, o desempenho, o movimento reduzido, a correção de movimento e o vocabulário dos achados. Não cobre durações, curvas e limiares em número (`fundamentos-e-tokens.md`, seção 9 e tabela consolidada), qual indicador de espera cada estado pede (`estados-e-ui-otimista.md`), gestos de toque e sheets arrastáveis (`dispositivos-e-entrada.md` e a skill `gestures`), a escolha da superfície de camada (`formularios-e-camadas.md`), o orçamento de deleite e os momentos de personalidade (`direcao-e-personalidade.md`, PER-16 e PER-17) nem qual biblioteca instalar para cada papel (`stack-e-bibliotecas.md`, STK-24). Os pilares de experiência premium que este arquivo implementa (molas, transição de tela, estado ao vivo, frequência que escolhe a intensidade, ações-chave cinematográficas, fluxo sem cortes) estão em `experiencia-premium.md` (EXP-09, EXP-12, EXP-16, EXP-40, EXP-49, EXP-56 a EXP-58).

Formato das regras: **ID** [selo] · prioridade mínima — regra. *Por quê* e *Verificar* quando ajudam. [N casa] aqui inclui as decisões do dono do produto (nov/2026): "forma e função sempre", toda microinteração tem resposta, transição de tela sempre, troca de tema com revelação circular, molas como token. [PR] sozinho não passa de P2.

## Postura

Interface que não se move parece captura de tela. O movimento é o que faz a interface parecer física, rápida e cuidada: o botão afunda quando é tocado, a lista abre espaço para o item novo, a tela seguinte chega de algum lugar. **Forma e função sempre**: todo movimento tem um papel, e enfeite intencional é um papel legítimo quando está no lugar e na dose certos.

O critério de frequência **escolhe** o movimento, não o remove. Ação repetida 100 vezes por dia ganha a resposta mais curta e firme do sistema (mola rápida, no mesmo quadro do toque); momento raro ganha cerimônia (coreografia, ilustração, celebração), e a ação mais importante do fluxo ganha uma encenação cinematográfica (MOV-33). O estilo é moderno: movimento líquido, profundidade e fluxo contínuo entre passos (MOV-34). Quase nada é proibido por estilo: o que este arquivo dá são **alertas de uso consciente**, com o critério de quando e onde. Ficam como requisito, não como alerta: movimento reduzido respeitado (MOV-21), nenhuma animação bloqueia a tarefa nem esconde conteúdo (MOV-16, MOV-20), estado nunca só por movimento (MOV-22), valor nunca falso durante a animação (MOV-04) e o que se move sozinho tem pausa ou para (WCAG 2.2.2, MOV-31).

Inspire-se em produtos que fazem isso bem e olhe-os em movimento, não em captura: o Telegram troca de tema com revelação circular; o Things desenha o check e celebra a conclusão do dia; o Linear e o Raycast respondem ao teclado sem esperar; o iOS faz o painel seguir o dedo e assentar com mola. Busque os fluxos no Mobbin ou em vídeo (REF) e anote o padrão, nunca copie o desenho.

## 1. Ordem de decisão

Decida nesta ordem e registre no plano, ou no achado, o passo que decidiu:

1. Tarefa: o que o usuário está fazendo e quantas vezes por dia.
2. **Frequência escolhe o tipo de movimento** (MOV-01, MOV-02).
3. **Propósito** nomeado (MOV-03), inclusive o de enfeite intencional.
4. Preset do sistema (MOV-24): mola rápida, padrão ou macia; duração e curva dos tokens.
5. Ferramenta que entrega esse movimento (MOV-07, STK-24).
6. Propriedades (MOV-08).
7. Interrupção (MOV-16) e saída (MOV-13).
8. Movimento reduzido, entregue junto (MOV-21).

"Nenhum movimento" é resultado raro e precisa de motivo; o resultado típico de uma ação muito frequente é **o menor movimento que ainda responde**.

**MOV-01** [N casa] · P2 — A frequência escolhe o movimento e a intensidade, nunca a ausência (EXP-49):

| Frequência | Movimento certo | Exemplos em painel e app |
| --- | --- | --- |
| 100+ por dia | Resposta curta e firme: mola rápida sem atraso, feedback no mesmo quadro, nada que o usuário espere terminar | Press de botão, toggle, check, troca de aba de módulo (indicador desliza, conteúdo já está lá), seleção de linha, navegação principal (crossfade curto) |
| Dezenas por dia | Mola padrão curta; opacidade, cor e deslocamento pequeno | Abrir filtro e popover, expandir item, reordenar, adicionar e remover da lista |
| Ocasional | Mola padrão ou macia, com origem e saída coerentes | Modal, painel, sheet, toast, configurações, troca de tema |
| Rara ou primeira vez | Cerimônia: coreografia, ilustração animada, celebração, momento-assinatura | Onboarding, vazio inicial, conclusão de fluxo longo, primeiro pedido, marco |
| Ação-chave do fluxo (1 a 3) | Encenação cinematográfica pulável (MOV-33) | Cliente conclui o pagamento, confirma o agendamento, aprova o orçamento |

*Por quê:* em alta frequência, o que incomoda é a **espera**, não o movimento; uma resposta de 150 ms que acompanha o toque é sentida como peso físico, e a ausência dela, como interface morta. *Verificar:* teste do 50º uso: na quinquagésima repetição do dia, o movimento ainda ajuda ou faz esperar? Se faz esperar, troque pelo preset mais curto, não pela ausência. P2 quando o movimento de uma superfície 100+/dia atrasa a tarefa; P2 também quando ela não responde nada (MOV-25).

**MOV-02** [PR] · P2 — Ação disparada por teclado (atalho, paleta de comandos, salto de foco, setas, j/k) entrega o **resultado no mesmo quadro**: foco, seleção e conteúdo novo estão lá antes de qualquer movimento. O movimento pode acompanhar sem atrasar: o indicador de seleção desliza com mola rápida enquanto a linha já está selecionada; a paleta abre em ≤ 120 ms só com opacidade e escala `.98 → 1`, com o campo já focado e aceitando digitação. *Alerta:* quem usa teclado está no ritmo mais rápido do produto; qualquer animação que segure o próximo comando é achado. *Verificar:* digitar o atalho e já começar a escrever; nenhum caractere se perde.

**MOV-03** [PR] · P3 — Cada movimento nomeia um propósito numa linha do plano: feedback, consistência espacial, continuidade, indicação de estado, evitar mudança brusca, explicação (onboarding), vida (estado ao vivo), reconhecimento (conclusão, marco) ou **enfeite intencional** (personalidade, momento-assinatura). Enfeite é propósito válido quando a direção o pede e o nível de frequência comporta (MOV-32, PER-16). *Por quê:* sem propósito nomeado o movimento se acumula até a interface parecer lenta; com propósito, cada um ganha o preset certo.

**MOV-07** [PR] · P3 — Use a ferramenta que entrega o movimento escolhido, da mais leve para a mais rica: transição CSS → `@starting-style` → animação CSS → WAAPI → Motion (padrão nas ilhas React: molas, layout, gestos, `AnimatePresence`) → bibliotecas especializadas (catálogo em STK-24). Instalar a biblioteca certa é incentivado (STK-23); o alerta é contra **sistema paralelo**: as curvas e molas vêm dos tokens do projeto (MOV-24), não de valores soltos em cada componente. Se o pedido é um **componente** (toast, drawer, menu, paleta), use o primitivo ou a biblioteca já instalada em vez de animar uma `<div>` à mão.

## 2. Sistema de movimento

**MOV-24** [N casa] · P2 — Molas como token (EXP-09). O movimento é um sistema de tokens, como cor e espaço: **durações** e **curvas** (TOK-27 e tabela consolidada) **mais três presets de mola** com nome (TOK-39), registrados no `tokens.json` e no `DESIGN.md` e usados por nome em todo o código:

| Preset (TOK-39) | Papel no movimento |
| --- | --- |
| `spring-rapida` | Microinteração e ação 100+/dia: press, toggle, check, indicador de aba, chip, seleção. Sempre sem quique (TOK-39) |
| `spring-padrao` | Camadas e continuidade: popover, painel, reordenar, layout, troca de vista, shared element curto; favorito e contador que nasce, com o quique que a direção registrar |
| `spring-macia` | Gesto e cerimônia: o que o dedo solta com momento, entrada de onboarding, confirmação da ação-chave, shared element hero |

Nome, uso e valores (duração visual, quique, aproximação em CSS) moram em TOK-39 e na tabela consolidada de `fundamentos-e-tokens.md` (regra da casa 6); este arquivo só cita os presets pelo nome, e o `tokens.json` do projeto vence. Fora do React, a mola vira curva CSS com `linear()` gerada do mesmo preset (gerador de `linear()` ou a função equivalente da biblioteca), para que CSS e Motion sintam igual. O preset `spring-macia` cobre o papel "gesto" de EXP-09 (o que o dedo solta com momento). Bounce cresce ao contrário do tamanho: elemento pequeno e ocasional aguenta mais, painel grande quase nenhum (skill `choreograph`), e o controle de alta frequência nunca quica (TOK-39). Bounce depois de um gesto com momento é natural; bounce num modal aberto por clique é alerta. *Por quê:* mola é interrompível por natureza (parte da velocidade atual) e dá a sensação física que o dono pediu; com nome, ela não deriva entre telas. *Verificar:* grep por `stiffness`, `damping`, `bounce` e `cubic-bezier` literais fora do arquivo de tokens; cada um é um preset sem nome.

## 3. Microinterações

**MOV-25** [N casa] · P1 · SEMPRE — **Todo controle responde, com mola ou estilo líquido.** É obrigatório em todo app criado do zero (kit de movimento, MOV-35): controle sem resposta visual ao ser acionado é achado. A resposta começa em ≤ 100 ms (TOK-24), usa `spring-rapida` ou duração curta, é interrompível e nunca atrasa o efeito. Botões e controles principais têm **resposta de mola**, e o estilo **líquido** (refração ou gota que acompanha o indicador, como a `liquid-glass-navbar` do arsenal) entra na navegação e nos controles de marca. A frequência dosa a intensidade (MOV-01): no 100+ por dia, a mola é rápida e sem quique. Repertório mínimo:

| Controle | Resposta |
| --- | --- |
| Botão | Afunda no `pointerdown`: `scale(.97)` ou deslocamento de 1 px com sombra menor; volta com `spring-rapida` ao soltar (MOV-14) |
| Toggle e switch | O botão desliza com `spring-rapida`, sem quique (TOK-39), e o trilho troca de cor junto |
| Checkbox e item de tarefa | O check **se desenha** (`pathLength` ou `stroke-dashoffset`, ~150–200 ms); o texto da tarefa concluída pode riscar ou esmaecer |
| Copiar | O ícone vira check e o rótulo vira "Copiado" por ~1,5–2 s, com `aria-live` polido; volta sozinho |
| Favoritar, curtir, fixar | Pulsa uma vez (`scale 1 → 1,2 → 1` com `spring-padrao` e o quique leve da direção) e passa de traço a preenchido (STK-16) |
| Arrastar | O item ganha sombra elevada, `scale(1.02)` e leve inclinação (1–3°); os vizinhos abrem espaço deslizando; ao soltar, assenta com `spring-padrao` |
| Abas e segmentado | O indicador desliza até a aba nova com `spring-rapida`; `aria-current` e conteúdo mudam antes |
| Expandir e recolher | O chevron gira; o conteúdo entra com altura medida e opacidade (acordeão pequeno) ou empurra com layout animation |
| Campo | O anel de foco aparece sem saltar; erro dá um *shake* curto (≤ 300 ms, deslocamento ≤ 6 px) junto da mensagem, nunca no lugar dela |
| Contador e valor alterado pelo usuário | O dígito rola (NumberFlow ou equivalente) com o valor final já no DOM |
| Salvar e enviar | O rótulo vira "Salvando…" com spinner na mesma caixa e depois um check breve; nada muda a largura do botão (MOV-17) |
| Seleção de linha e cartão | Fundo e borda mudam com cor curta; seleção múltipla mostra a barra de ações deslizando da borda |

*Por quê:* é a resposta tátil que dá sensação premium; os protótipos sem ela foram avaliados como "mortos e frios". *Verificar:* percorrer cada tipo de controle da tela com mouse, toque e teclado e confirmar uma resposta visível em cada (B24). Achado típico: "sem resposta tátil" (P1 no app criado do zero).

**MOV-14** [PR] · P3 — Press no `pointerdown` (`:active`), nunca atrás de `:hover` e nunca em `:disabled`; valores na tabela de tokens. Fase deliberada lenta, resposta rápida: segurar para confirmar enche em `linear` e volta rápido ao soltar; tempo simétrico em press ou hold é achado. *Alerta de uso consciente:* ripple, squish elástico e press com bounce são expressões de marca válidas; em ação 100+/dia ficam no `spring-rapida`, curtos o bastante para não serem notados como espera. *Por quê:* esperar o `click` "parece morto".

**MOV-15** [PR] · P3 — Hover **com movimento** (escala, elevação, deslocamento, brilho que segue o cursor) só sob `@media (hover: hover) and (pointer: fine)`. Hover de cor e fundo fica sob `(hover: hover)` (`dispositivos-e-entrada.md`). Nada no hover empurra vizinhos nem muda o tamanho que o elemento ocupa no fluxo. Elevação de cartão no hover é bem-vinda em superfície navegável (catálogo, galeria, cartões de módulo); em linha de tabela densa, prefira cor.

**MOV-11** [PR] · P3 — Camada entra a partir de `scale(.95–.97)` com opacidade, e desloca com porcentagem do próprio elemento (`translateY(100%)`), não com px fixos. *Alerta:* `scale(0)` em camada parece surgir do nada; ele é legítimo só em elemento pequeno que **nasce** (ponto de notificação, contador que aparece, pulso do favorito).

**MOV-12** [PR] · P3 — Popover, menu, dropdown e tooltip escalam a partir do acionador (`transform-origin` no gatilho; Base UI fornece `var(--transform-origin)`). O **modal é exceção**: fica centrado, e o backdrop anima junto, na mesma duração. O scrim existe só quando o fundo está bloqueado (`formularios-e-camadas.md`).

## 4. Telas, continuidade e coreografia

**MOV-26** [N casa] · P1 · SEMPRE — **Toda troca de tela tem transição** (EXP-12). É obrigatória em todo app criado do zero (kit de movimento, MOV-35). Corte seco entre telas é achado ("sem transição de tela"). O tipo segue a relação entre as telas, e a duração segue a frequência (MOV-01):

| Relação | Transição | Duração |
| --- | --- | --- |
| Irmãs (módulos, abas de topo, itens da navegação principal) | Shell parado; só o conteúdo faz crossfade curto, opcionalmente com deslocamento de 4–8 px | ≤ 150–200 ms; em 100+/dia, o menor valor |
| Hierarquia (lista → detalhe, cartão → página) | Shared element: o cartão ou a linha vira o cabeçalho do detalhe; o resto faz crossfade | `spring-padrao` |
| Sequência (wizard, checkout, importação em passos) | Direcional: avançar entra pela direita, voltar pela esquerda (invertido em RTL) | `spring-padrao` |
| Camada sobre a tela (painel, sheet, detalhe lateral) | Entra da borda de onde vem e sai pelo mesmo caminho | tabela de tokens |

No padrão Astro (STK-02), use o `<ClientRouter />` no layout, `transition:name` nos elementos compartilhados, `transition:animate` por relação (`fade`, `slide` ou animação própria) e `transition:persist` no shell e nas ilhas que guardam estado (sidebar, player, toaster); a mecânica está em STK-26. Em outro stack, View Transitions da plataforma ou o roteador do framework com Motion. A transição é melhoria progressiva (MOV-19): o conteúdo novo é navegável no mesmo instante, com ou sem o efeito. *Por quê:* a transição diz de onde a tela veio e para onde voltar; sem ela, cada clique parece recarregar um site. *Verificar:* navegar pelas rotas do protótipo e confirmar que nenhuma troca é corte seco e que o shell não pisca.

**MOV-28** [N casa] · P3 — **Continuidade**: o que muda de lugar se move até lá, em vez de sumir e reaparecer.
- **Shared element**: o mesmo objeto em duas vistas (miniatura → foto, linha → cabeçalho do detalhe, avatar → perfil) faz a ponte (`layoutId` no Motion; `transition:name` no Astro).
- **Layout animation**: quando o conteúdo muda de tamanho ou ordem, os elementos deslizam até a nova posição (`layout` no Motion).
- **Lista que reordena** desliza; item adicionado aparece no lugar com altura e opacidade; item removido fecha o vão (AutoAnimate numa linha, ou Motion com `AnimatePresence mode="popLayout"`).
- **Painel entra da borda** de onde vem; menu contextual cresce do ponto clicado; toast sobe da borda onde mora.
- **Item que vai para um destino** (adicionar ao carrinho, mover para pasta) pode voar até o destino uma vez, com o destino reagindo (contador pulsa), em ação ocasional.

*Alerta:* continuidade em lista muito longa ou em tabela com centenas de linhas custa quadro; anime só o que está visível e meça (MOV-10).

**MOV-29** [PR] · P3 — **Coreografia** quando vários elementos se movem juntos: um lidera (o que o usuário tocou ou o que mais importa), os outros seguem em ordem de leitura com sobreposição, e alguém fica parado como âncora. Escreva a linha do tempo antes de codar (skill `choreograph`). Orçamento pela frequência: em tela diária o grupo termina em ≲ 300 ms; no nível raro, a cerimônia pode ter passos maiores. Sub-animações de um mesmo componente ficam na mesma família de tempo (um drawer de 500 ms que redimensiona em 200 ms parece dois objetos).

**MOV-05** [PR] · P3 — Stagger e overshoot escolhidos pela frequência, não banidos (a entrada escalonada dos cards é obrigatória no kit de movimento, MOV-35; esta regra dosa a intensidade):
- **Tela diária** (lista, menu, dropdown, paleta, conteúdo de aba, widget de painel): o grupo entra em bloco único, ou com stagger mínimo dentro do limite da tabela de tokens, e **só na primeira entrada da tela**; menu e dropdown reabertos dezenas de vezes aparecem juntos.
- **Momento raro** (onboarding, vazio inicial, dashboard na primeira visita, conclusão): stagger pleno, como onda.
- **Overshoot** (`bounce`, `back.out`): natural em elemento pequeno e ocasional (favorito, contador que nasce) com `spring-padrao`, e depois de gesto com momento com `spring-macia`; o controle de alta frequência (press, toggle, check, aba) fica sem quique (TOK-39); *alerta* em toast, diálogo e painel grandes abertos por clique, onde parece instável.
- O indicador de navegação ativa desliza com `spring-rapida`, com `aria-current` mudando antes do movimento.

*Por quê:* nos demos medidos, entradas de rota de 0,9 a 4 s em toda visita e um tab bar que confirmou a aba ativa ~1 s depois do toque; o problema era a espera, não o movimento.

**MOV-13** [PR] · P3 — Saída:
- pelo mesmo caminho da entrada (o que subiu desce; o que veio da direita sai para a direita);
- mais curta e mais simples que a entrada, simultânea, sem stagger reverso, porque o usuário já decidiu sair;
- o elemento removido deixa o fluxo **imediatamente** e os irmãos fecham o vão enquanto ele some (`AnimatePresence mode="popLayout"` ou `position: absolute` antes de animar);
- troca de vista no mesmo contêiner é crossfade com `popLayout`, não `sync`;
- a duração cresce com a distância quando o contêiner muda de altura (fórmula na tabela de tokens).

**MOV-19** [DS] · P3 — View Transitions são **melhoria progressiva**. A atualização funcional acontece uma vez, com ou sem o efeito; sem suporte, com interrupção ou com navegação rápida, a tarefa conclui igual. Foco e leitura não dependem do snapshot, e nada é declarado salvo porque uma animação terminou. Use nomes de transição únicos por página e não dê `view-transition-name` a centenas de linhas de uma vez (custo de captura). Suporte em `dispositivos-e-entrada.md`. Usos padrão: troca de tela (MOV-26), shared element entre rotas (MOV-28) e troca de tema (MOV-27).

## 5. Tema claro e escuro

**MOV-27** [N casa] · P3 — **Troca de tema com revelação circular** a partir do ponto do clique, via View Transitions (EXP-12). Suspendem-se só as transições individuais de cor; a troca em si é animada:

1. No clique, guarde as coordenadas (`event.clientX`, `event.clientY`); acionado por teclado (`event.detail === 0`), use o centro do botão (`getBoundingClientRect()`). Calcule o raio final até o canto mais distante: `Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))`.
2. **Suspenda as transições individuais de cor** antes de trocar (classe na raiz que zera `transition` em todos os elementos durante a troca), ou a nova captura mostra cada cartão mudando de cor no seu próprio tempo.
3. `const t = document.startViewTransition(() => aplicarTema(novo))`, em que `aplicarTema` troca a classe ou o `data-theme` da raiz, atualiza `aria-pressed` ou o rótulo do botão e grava a escolha.
4. Em `await t.ready`, anime o pseudo-elemento novo: `document.documentElement.animate({ clipPath: [\`circle(0px at ${x}px ${y}px)\`, \`circle(${r}px at ${x}px ${y}px)\`] }, { duration: 400–500, easing: 'var(--ease-out)' equivalente, pseudoElement: '::view-transition-new(root)' })`.
5. CSS: `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }` para que só o círculo apareça.
6. Em `t.finished`, remova a classe que suspendia as transições. Segundo clique durante a revelação: `t.skipTransition()` e comece a nova.
7. **Sem suporte** a `startViewTransition`: troque o tema na hora, com as transições individuais ainda suspensas (sem a onda de cores atrasadas).
8. **Movimento reduzido**: em vez do círculo, esmaecimento curto (~150 ms de opacidade no `::view-transition-new(root)`) ou troca direta.

O tema inicial é aplicado por script inline no `<head>` antes do primeiro paint (STK-21) e reaplicado depois de cada troca de página do `ClientRouter` (STK-26), para não piscar. *Por quê:* decisão do dono; a troca de tema é um momento ocasional que pode ter cerimônia, e a revelação a partir do dedo amarra causa e efeito. *Verificar:* trocar o tema por clique em cantos diferentes, por teclado, com movimento reduzido e num navegador sem suporte; nenhum cartão "atrasa" a cor.

**MOV-06** [PR] · P3 — Sem transição espúria: nada anima na primeira renderização por acidente (`AnimatePresence initial={false}` em troca de estado, nunca em volta de entrada intencional) nem ao recarregar. Na troca de tema, as transições de cor de cada elemento ficam suspensas; o movimento da troca é o da MOV-27. *Verificar:* dar F5 e trocar o tema; nada desliza nem borra fora da revelação.

## 6. Vida, progresso e reconhecimento

**MOV-31** [N casa] · P1 · SEMPRE — **Estado ao vivo pulsa** (EXP-16, EXP-40). É obrigatório em todo app criado do zero que tenha algo acontecendo agora (kit de movimento, MOV-35). O status atual de um objeto (pedido "Em preparo", entregador "A caminho", atendente "Online", gravação, sincronização, "Ao vivo") tem um pulso sutil (anel que expande e esmaece em torno do ponto, ou opacidade), com período de 1,5–2 s. Regras de uso consciente:
- só no estado que está **acontecendo agora** (na timeline, o passo atual); estados terminados ficam estáticos; *alerta:* pulso em elemento que não está vivo (botão, selo parado, badge de novidade permanente) gasta o sinal e vira ruído;
- um pulso por área visível, para que ele aponte e não vire ruído;
- o pulso acompanha texto e ícone (MOV-22, ACE-22), nunca os substitui;
- **WCAG 2.2.2** (requisito): o pulso para sozinho em até ~5 s depois que o estado começa ou muda e fica como ponto aceso, ou há controle de pausa; pulso eterno sem controle é achado;
- movimento reduzido: ponto aceso estático;
- valor que muda sozinho (polling, tempo real) ganha um realce curto na célula ou no cartão alterado (fundo que esmaece em ~1 s), sem mover o layout.

*Por quê:* "componentes vivos" foi pedido do dono; o pulso diz que o sistema está acompanhando em tempo real.

**MOV-30** [N casa] · P3 — **Gamificação sóbria e celebração rara.** Progresso e reconhecimento dão sensação de controle:
- **progresso** visível em tarefa de várias etapas (barra ou anel que enche com `spring-padrao`, etapas que se marcam);
- **marcos**: a etapa vira check que se desenha; o objeto avança visivelmente na sua linha do tempo (a OS passa de "Em reparo" para "Pronta" deslizando na trilha de etapas);
- **sequência e metas** só quando o produto as tem de verdade, sem pontos inventados;
- **conclusão sempre reconhecida**: terminar um fluxo (pedido enviado, OS fechada, pagamento confirmado) mostra um estado de sucesso com movimento próprio; conclusão sem reconhecimento é achado (P3; P2 quando o usuário não sabe se concluiu);
- **celebração no máximo uma por fluxo**, só em conclusão rara ou marco real, nunca em ação 100+/dia; dura ≤ ~2 s, não cobre a próxima ação e não bloqueia clique; com movimento reduzido vira o estado final estático.

**A celebração e o movimento-assinatura nascem do domínio do produto** (EXP-56), não de clichês genéricos: na barbearia, a cadeira e o horário confirmados se encaixam na agenda; na assistência técnica, o aparelho volta inteiro na trilha da OS; no rastreio, a rota se completa até a porta. *Alerta de clichê:* carimbo de "PAGO" ou "APROVADO", troféu, confete por padrão e fogos genéricos dizem "interface feita por IA"; confete é opção só quando a direção da marca o justifica e registrado como escolha (STK-24). O orçamento de deleite do produto é de PER-17; a biblioteca, de STK-24.

**MOV-32** [N casa] · P3 — **Enfeite intencional e momentos-assinatura** (EXP-56). Cada produto tem 2 ou 3 momentos-assinatura, nascidos de uma transição de estado que importa no domínio (EXP-02: orçamento aceito, aparelho pronto, caixa fechado, pagamento concluído) e passados no teste da troca (EXP-56), prototipados e mostrados rodando no protótipo na rodada de aprovação (vídeo só sob pedido, PRO-25). A troca de tema, o primeiro acesso e o vazio inicial pedem capricho, mas são enfeite intencional, não momento-assinatura. Enfeite fora dos momentos também é bem-vindo quando tem papel: gradiente que pulsa devagar atrás do banner de entrada, brilho que percorre o botão principal uma vez, borda luminosa no cartão em destaque, ilustração Rive ou Lottie no vazio, shader no cabeçalho da marca. *Alertas de uso consciente:* enfeite em loop contínuo numa superfície de trabalho cansa e cai na WCAG 2.2.2 (pare ou dê controle); enfeite atrás de texto exige contraste medido em todos os quadros; enfeite em fila, tabela e formulário diário compete com a tarefa e fica fora, salvo resposta de controle (MOV-25). *Por quê:* o dono aprovou momentos-assinatura e quer enfeite intencional; o critério é onde e quanto, não "nunca".

**MOV-04** [PR] · P2 — Dado que o usuário lê ou opera nunca mostra valor falso. KPI, gráfico, linha de tabela e número não animam a partir de zero na montagem, no refresh, no polling nem ao voltar à tela. O movimento destaca **mudança real**: a mudança causada por uma ação do usuário (trocar o período, aplicar filtro) pode rolar o dígito ou fazer morph; a mudança automática ganha o realce curto da MOV-31. Count-up a partir de zero só em KPI de destaque raro, com o valor final no HTML e largura reservada, nunca em tabela. *Por quê:* nos demos medidos, count-ups mostraram valores falsos durante a animação (contagem 0 com total de US$ 2,01 mi), decisão sobre número errado.

**MOV-18** [PR] · P3 — Gráfico: morph quando a mudança vem da ação do usuário (período, filtro, série ligada ou desligada), com `transform` e `opacity`, curto, nunca no polling. *Alerta:* desenhar a linha (line drawing) ou crescer as barras na primeira entrada de uma tela ocasional é aceitável se terminar em ≤ ~600 ms e o valor final estiver acessível em texto desde o início; em gráfico que se reabre dezenas de vezes por dia, o desenho é curto (≤ ~300 ms) ou só na primeira abertura da sessão, nunca ausente no app criado do zero (kit de movimento, MOV-35). Sob movimento reduzido, troca instantânea.

**MOV-17** [P]/[DS] · P3 — Carregamento: o skeleton tem o layout final e a troca skeleton → conteúdo é instantânea ou um fade curto, sem deslocar o que já está na tela. Spinner gira em `linear`, cabe na caixa do botão sem mudar a pegada, e o rótulo fica ("Salvando…"). Refetch, filtro e paginação não voltam ao skeleton. *Alerta:* skeleton estático é o padrão no operador (NN/g); shimmer suave é aceitável na ponta do cliente e em carregamento curto, parando sob movimento reduzido. O pulso de estado ao vivo **fica** (MOV-31, EXP-16, EXP-40), com versão estática sob movimento reduzido; o alerta é para loop decorativo em elemento persistente que não está vivo, que vira execução única ou estado estático. *Por quê:* o indicador que muda o tamanho do botão faz a toolbar pular.

## 6A. Movimento líquido e cinematográfico

O estilo de movimento é moderno: **líquido** (formas que se fundem e se esticam em vez de trocar), **cinematográfico** (encenação, profundidade, foco) e **fluxo interativo** (cada passo continua do anterior). Ele se concentra onde a ação tem mais significado e convive com a resposta curta das ações frequentes.

**MOV-33** [N casa] · P2 — **Ação-chave cinematográfica** (EXP-57). As 1 a 3 ações mais importantes de um fluxo (o cliente conclui o pagamento, confirma o agendamento, aprova o orçamento; o técnico fecha a OS) ganham uma tomada de tela encenada, listada no plano e prototipada no protótipo navegável:

1. **Zoom de entrada**: o elemento da ação (o botão "Pagar", o cartão do horário) faz morph e zoom até preencher a tela, como shared element (`layoutId` no Motion ou `view-transition-name`), com o fundo recuando em profundidade (escala e desfoque leve).
2. **Confirmação encenada**: o sinal de conclusão toca com física de mola (`spring-macia`), feito da linguagem visual do próprio produto (o check desenhado no traço e na cor da marca, o objeto do domínio chegando ao lugar dele, MOV-30), nunca carimbo genérico; texto e valor confirmados aparecem em revelação escalonada. O check desenhado é permitido e esperado aqui; o clichê é o carimbo ou selo de texto "APROVADO" estampado na tela (EXP-56).
3. **Zoom de saída**: a tela recolhe de volta para o contexto **atualizado** (o pedido já aparece como pago na lista, a agenda já mostra o horário), com o elemento pousando onde passa a morar.

Alertas que valem sempre: só em ação **rara e de alto significado**, nunca em ação diária nem em fila do operador; **pulável e interrompível** no toque, clique, Esc ou qualquer tecla, indo direto ao estado final; o commit e o estado real já aconteceram antes da encenação (MOV-16, MOV-20), que nunca bloqueia a próxima tarefa; duração total ≲ 1,2–1,5 s até o contexto estar utilizável; versão de movimento reduzido entregue junto (crossfade para o estado final com o check já desenhado, MOV-21); desempenho medido em celular intermediário (MOV-10). *Por quê:* pedido do dono; o momento em que o cliente paga ou confirma é o de maior tensão do fluxo, e uma confirmação encenada e contínua dá a certeza que um toast não dá. *Verificar:* executar a ação, tocar no meio para pular, repetir com movimento reduzido e com CPU lenta; o contexto final é o mesmo nos três.

**MOV-34** [N casa] · P3 — **Repertório líquido e cinematográfico**, para momentos-assinatura (MOV-32), ações-chave (MOV-33) e telas ocasionais, com o critério de cada um:

| Técnica | O que é | Onde cabe | Alerta |
| --- | --- | --- | --- |
| Morph líquido (gooey) | Formas que se fundem e se separam (filtro SVG de desfoque + contraste, ou SVG/`clip-path` morph) | Botão que vira painel, indicador que escorre entre abas, bolhas de chat se formando | Filtro SVG custa caro em área grande; restrinja ao elemento e meça |
| Parallax em camadas | Planos de profundidade movendo em velocidades diferentes no scroll ou no ponteiro | Banner de entrada, onboarding, cabeçalho de perfil | Nunca em tabela ou formulário; zera com movimento reduzido |
| Blur to focus | O conteúdo novo chega desfocado e entra em foco enquanto o fundo desfoca | Abertura de camada importante, foco no resultado de uma ação | Blur ≤ limite da tabela de tokens; texto legível no estado final |
| Revelação encenada (staged reveal) | Partes da tela entram em ordem de leitura, com coreografia (MOV-29) | Primeira entrada de um painel, confirmação, onboarding | Só na primeira entrada ou no raro (MOV-05) |
| Fluxo contínuo (EXP-58) | Cada passo continua do anterior: o elemento escolhido vira o cabeçalho do passo seguinte, o resumo cresce a partir do item | Checkout, agendamento, wizard, lista → detalhe → ação | Sem corte seco entre passos (MOV-26); Voltar refaz o caminho ao contrário |

*Por quê:* o dono pediu movimento "líquido, cinematográfico e de fluxo interativo"; a lista dá o vocabulário e o lugar de cada técnica para que o efeito sirva à tarefa. *Verificar:* todo passo de um fluxo do cliente chega por continuidade; cada técnica usada aparece com o lugar e o propósito no plano (MOV-03).

**MOV-35** [N casa] · P1 · SEMPRE — **Kit de movimento mínimo.** Todo app criado do zero traz no protótipo, obrigatoriamente, os sete itens abaixo. Não é opcional: a falta de qualquer um bloqueia a aprovação (VER-34). O starter traz os componentes prontos (`assets/arsenal/starter/`; o `LEIAME.md` lista cada um). Nenhum item é removido pela frequência: a frequência (MOV-01) só dosa a intensidade e a duração. Todos têm versão de movimento reduzido entregue junto (MOV-21) e nenhum mostra valor falso (MOV-04).

| Item | Onde | Dose pela frequência | Regra dona |
| --- | --- | --- | --- |
| Transição entre telas | toda troca de rota, aba principal e etapa | crossfade curto na navegação 100+ por dia; continuidade e shared element no raro | MOV-26 |
| Botões e controles com mola ou estilo líquido | todo controle; líquido (refração, gota) na navegação e nos controles de marca | mola rápida sem quique no frequente | MOV-25 |
| Números que contam ou rolam (odômetro) | KPI-herói conta na primeira entrada, com o valor final no HTML e largura reservada; valor alterado pela pessoa rola do valor anterior ao novo | número operacional não conta a partir de zero, só rola na mudança real (MOV-04, IND-14) | MOV-25, IND-14 |
| Gráficos que se desenham na entrada | linha, barra ou anel se desenha ao entrar, com o valor em texto desde o início | ≤ ~600 ms em tela ocasional; curto ou só na primeira abertura da sessão em tela diária | MOV-18 |
| Texto de destaque com entrada animada | título do banner, número-herói, frase da conclusão: entra por palavra ou linha, uma vez | só na primeira entrada da tela; em tela de operação, curto (≤ ~400 ms) | este item |
| Entrada escalonada dos cards | cards, KPIs e itens de grade na primeira entrada da tela | stagger pleno no raro; mínimo e só na primeira entrada no diário | MOV-05 |
| Estado ao vivo que pulsa | o passo atual, o que acontece agora | um por região, para em ~5 s (WCAG 2.2.2) | MOV-31 |

*Por quê:* pedido do dono; o agente tende a entregar o mínimo quando o movimento soa opcional, e a iteração 3 só ganhou vida quando o movimento passou a ser cobrado. *Verificar:* B31 (cada item presente, na rota e no elemento), B10 (movimento reduzido) e B17 (os números finais batem).

## 7. Interrupção e conteúdo nunca refém

**MOV-16** [PR] · P3 — Tudo o que pode ser disparado duas vezes em um segundo ou revertido no meio (painel, toast empilhado, toggle, expandir e recolher, filtro) usa transição CSS ou mola, não `@keyframes`. A nova animação parte do valor **apresentado**, não do alvo: o painel fechando que é reaberto inverte de onde está. Nenhuma transição bloqueia entrada; tudo visível é clicável já. Ao redisparar uma sequência, pare as animações em andamento antes de iniciar outras; em `AnimatePresence`, `key` estável e única. O feedback de um commit vem no mesmo quadro e o commit é imediato: atraso de commit para "deixar a animação tocar" (750 ms medidos num demo) só existe com modo rápido disponível, e é zero em fila de alta frequência. P2 quando a animação bloqueia entrada. *Verificar:* abrir e fechar rápido, alternar filtro no meio da transição, Esc no meio da entrada do modal.

**MOV-20** [PR] · P2 — Conteúdo nunca refém da animação: a tela é legível em repouso, sem script e com movimento reduzido. Estado inicial `opacity: 0` que depende de JS para aparecer é achado. *Por quê:* em quatro demos, uma URL nova ficou em branco por mais de 2 s quando o `requestAnimationFrame` ficou lento. *Verificar:* aba oculta ou CPU 6× e captura 500 ms depois de navegar.

## 8. Propriedades e desempenho

**MOV-08** [PR] · P2 — Anime `transform` e `opacity` por padrão. Exceções conscientes: `clip-path` (revelação, inclusive a do tema), `filter` com blur pequeno, cor e fundo em transição curta, altura medida em acordeão pequeno. *Alerta:* `width`, `height`, `margin`, `padding`, `top`, `left` e `transition: all` recalculam layout a cada quadro; nomeie as propriedades. Gráfico cresce com `scaleY`, não com `height`; sidebar desliza com `translateX`, não com `margin-left`; layout animation do Motion já converte mudança de tamanho em `transform`. *Por quê:* num demo, animar `height` e `flex-grow` em 90 colunas gerou um quadro longo de 316 ms e depois 51–63 ms por quadro; o mesmo produto com `scaleY` não teve nenhum quadro longo.

**MOV-09** [PR] · P2 — O que anima enquanto a página busca dados, navega ou hidrata precisa aguentar o thread principal ocupado: prefira CSS, WAAPI ou View Transitions (rodam no compositor) a `requestAnimationFrame`. Cuidados:
- shared layout (`layout`, `layoutId`) é desejado para continuidade (MOV-28), mas meça-o durante a navegação; se o indicador de aba perde quadros enquanto a rota carrega, passe-o para CSS (o dashboard da Vercel resolveu assim);
- nada de `setState` por quadro em `pointermove`, `scroll` ou drag (escreva em `ref.current.style` ou em motion value);
- `transform` de filhos dirigido por variável CSS no pai recalcula todos os descendentes (o Vaul degradava acima de ~20 itens);
- atalhos `x`/`y`/`scale` do Motion antes da v14.2: use a string `transform`;
- blur animado acima do limite da tabela de tokens.

`will-change` é o último passo, só depois de observar o salto de 1 px ou quadros perdidos, e no elemento que anima. Cuidado: ele torna o elemento bloco de contenção de descendentes `position: fixed`; muito "tooltip cortado em tabela" vem daí.

**MOV-10** [PR] · P3 — Todo achado de desempenho de animação declara a evidência: "verificado no código" ou "precisa de gravação em dispositivo". Grave no painel Performance e em celular intermediário real; throttling de CPU no desktop não simula GPU fraca. Diagnóstico em ordem: quais propriedades animam → coincide com página ocupada → React renderiza por quadro → piora com mais conteúdo → variável CSS animada ou Motion antigo → blur grande → só então `will-change`. A correção nomeia a causa. Bibliotecas pesadas (3D, Rive, Lottie, shader) carregam só onde aparecem (`client:visible`, import dinâmico) e pausam fora da tela. Skill de apoio: `animation-performance`.

## 9. Movimento reduzido por mapa

**MOV-21** [N casa] · P3 — Movimento reduzido é **menos, não zero**, e é entregue junto com a animação, nunca como pendência. Mapa:

| Fica | Vai a zero ou vira outra coisa | Isento |
| --- | --- | --- |
| Opacidade e cor curtas (≤ ~150 ms) | Deslocamento, escala, blur, parallax → crossfade curto | Spinner, `progressbar`, `aria-busy` |
| Press como mudança de tom | Stagger e coreografia → o grupo aparece junto | Rastreamento 1:1 de um gesto (o usuário produz o movimento) |
| Check, copiado, favorito como troca de ícone e cor | Mola com bounce, momento, rolagem suave → troca direta | — |
| Troca de tela como crossfade curto | Revelação circular do tema → esmaecimento curto | — |
| Estado ao vivo como ponto aceso | Pulso, celebração, ilustração em loop → estado final ou quadro estático | — |
| Ação-chave cinematográfica como crossfade para o estado final | Zoom, morph líquido, parallax, desfoque → troca direta com o check já desenhado | — |

Escreva o movimento como opt-in sob `prefers-reduced-motion: no-preference`, ou ramifique com `useReducedMotion()` no Motion (`MotionConfig reducedMotion="user"` não desliga blur). O `ClientRouter` do Astro desliga todas as animações de transição sob movimento reduzido; para manter o crossfade curto do mapa, defina-o em CSS próprio. Zerar tudo com `* { transition-duration: .001ms !important }` é achado quando apaga feedback de estado; aí sobe para P2. *Por quê:* o WCAG 2.3.3 (AAA) trata como "motion animation" o deslocamento, não mudanças de cor, opacidade ou blur; quem pediu menos movimento ainda precisa ver que o estado mudou.

**MOV-22** [PR] · P2 — Estado nunca é comunicado só por movimento: toda mudança animada deixa também cor, ícone ou rótulo, e a interface fica completa sem animação. *Por quê:* com movimento reduzido ou leitor de tela, o canal único some. Quando a informação fica inacessível, `acessibilidade.md` pode subir a prioridade.

Conteúdo que se move ou se atualiza sozinho (polling, ticker, auto-refresh, pulso, fundo animado) por mais de 5 s em paralelo a outro conteúdo precisa de pausa, parada ou controle de frequência: o critério é de `acessibilidade.md` (WCAG 2.2.2). Nada pisca mais de três vezes por segundo (WCAG 2.3.1).

## 10. Corrigir movimento

Hierarquia de correção: **trocar pelo movimento certo → reduzir → ajustar → remover**. Trocar é aplicar o preset que a frequência pede (MOV-01): o slide lento numa aba de módulo vira crossfade curto; o count-up na tabela vira realce de mudança; o modal com bounce vira `spring-padrao` sem bounce. Reduzir é uma versão menor do mesmo movimento:
- hover com escala ou sombra crescente em linha densa vira cor ≤ 150 ms;
- animação > 300 ms fora de modal, drawer, sheet, toast e momento raro vai para 200–250 ms ou para o preset rápido;
- stagger acima do limite vira bloco único com fade;
- loop decorativo vira execução única ou estado estático.

Remover é o último recurso, quando o movimento não informa nada e não há versão menor que sirva. Remover tudo é erro tão grave quanto exagerar: interface sem resposta, sem transição de tela e sem reconhecimento de conclusão é achado (MOV-25, MOV-26, MOV-30). Na revisão, liste à parte o que foi mantido de propósito.

**MOV-23** [PR] · P2 — Toda remoção ou troca de animação traz como critério de aceite a checagem dos riscos:
- estado inicial oculto (`opacity: 0` em `initial`, `fill-mode: forwards` partindo de 0) que deixa o elemento invisível para sempre;
- código que espera a animação (`onAnimationEnd`, `transitionend`, `onExitComplete`, `setTimeout` com a duração) e passa a pausar sem motivo;
- saída que atrasa a desmontagem;
- animação de layout escondendo um salto, que reaparece (mantenha e registre o salto como achado separado);
- foco movido no callback da animação, que agora deve ser imediato;
- testes e seletores presos a classes ou durações.

*Verificar:* desligue o efeito e execute o fluxo inteiro.

## 11. Vocabulário útil

Use o termo exato no achado.

- **Entrada e saída:** fade, scale in (sem overshoot), pop in (com overshoot; elemento pequeno), slide, reveal (clip-path ou mask), revelação circular.
- **Entre estados:** crossfade, morph, shared element (linha → detalhe), layout animation (anima até a nova posição em vez de saltar), direction-aware, acordeão.
- **Sequência:** stagger, orquestração, coreografia, delay, fill mode.
- **Feedback:** press, hold to confirm, drag to reorder, lift (sombra e inclinação ao arrastar), swipe to dismiss, rubber-banding, shake (entrada rejeitada), check drawing, pulse.
- **Curva e mola:** ease-out (padrão), ease-in (evitar em UI), ease-in-out, linear (progresso), mola (spring), `visualDuration`, bounce, amortecimento, duração perceptiva, interruptível.
- **Vida e reconhecimento:** pulso de estado ao vivo, realce de mudança, marco, celebração.
- **Cinematográfico e líquido:** takeover (tomada de tela), zoom de shared element, morph líquido (gooey), parallax em camadas, blur to focus, revelação encenada (staged reveal), fluxo contínuo.
- **Carregamento:** skeleton (estrutura) × spinner (indeterminado) × barra (determinada); shimmer e pulse.
- **Desempenho:** jank, dropped frame, compositing, layout thrashing, `will-change`.

Pares a desambiguar: crossfade × shared element × layout animation; pop in × scale in; clip-path × mask. A skill `animation-vocabulary`, se instalada, faz a busca reversa.

## 12. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| Botão, toggle, checkbox, copiar ou favorito sem nenhuma resposta visual | Microinteração do repertório com `spring-rapida` (MOV-25) |
| Navegação entre rotas como corte seco; `ClientRouter` ausente no layout Astro | Transição pela relação entre telas (MOV-26, STK-26) |
| Fluxo concluído sem estado de sucesso | Reconhecimento com movimento próprio (MOV-30) |
| `stiffness`, `damping`, `bounce` ou `cubic-bezier` literais espalhados | Presets nomeados do sistema (MOV-24) |
| Troca de tema com cartões mudando de cor cada um no seu tempo | Suspender transições e usar a revelação circular (MOV-27) |
| Status "em andamento" estático; ou pulso eterno sem pausa | Pulso que para em ~5 s ou com controle (MOV-31) |
| Mais de uma celebração no mesmo fluxo; confete em ação diária | Uma por fluxo, só no raro (MOV-30) |
| Carimbo "PAGO"/"APROVADO", troféu ou confete genérico como celebração | Movimento tirado do domínio do produto (MOV-30, MOV-33) |
| Ação-chave do fluxo (pagar, confirmar agendamento, fechar OS) resolvida com toast | Takeover cinematográfico que volta ao contexto atualizado (MOV-33) |
| Takeover que não pula no toque, bloqueia a próxima tarefa ou aparece em ação diária | Pulável, interrompível e só nas 1–3 ações-chave (MOV-33) |
| Passo de fluxo que troca de tela com corte seco | Continuação por shared element (MOV-34, MOV-26) |
| Item de lista que some ou aparece saltando; reordenar que pula | Layout animation ou AutoAnimate (MOV-28) |
| Animação em atalho ou paleta que atrasa o próximo comando | Resultado no mesmo quadro; movimento ≤ 120 ms sem bloquear (MOV-02) |
| Stagger em menu ou dropdown reaberto dezenas de vezes por dia | Bloco único; stagger só na primeira entrada ou no raro (MOV-05) |
| `back.out`, `elastic` ou bounce alto em modal ou painel grande aberto por clique | `spring-padrao` sem bounce; bounce em elemento pequeno ou após gesto (MOV-05, MOV-24) |
| Count-up a partir de zero em coluna de tabela ou KPI com polling | Valor direto; realce de mudança (MOV-04, MOV-31) |
| Transição na primeira renderização | `initial={false}` (MOV-06) |
| `transition: all` | Nomear propriedades (MOV-08) |
| Animação de `height`, `width`, `margin-left`, `top`, `flex-grow` | `transform` ou layout animation; altura medida só em acordeão pequeno (MOV-08) |
| `layoutId` em indicador de aba perdendo quadros durante a navegação | Medir; passar para CSS ou WAAPI (MOV-09) |
| `setState` dentro de rAF, `pointermove` ou `scroll` | Escrever em `ref.style` ou motion value (MOV-09) |
| `will-change` em `*`, contêiner grande ou preventivo | Remover; só após observar (MOV-09) |
| `scale(0)` em popover, modal ou painel | `scale(.95–.97)` com opacidade (MOV-11) |
| `transform-origin: center` em popover ou menu | Origem no acionador; centro só no modal (MOV-12) |
| `ease-in` em entrada ou saída | `--ease-out` (TOK-27) |
| `@keyframes` em painel, toast ou toggle | Transição ou mola (MOV-16) |
| `setTimeout` de 500–800 ms antes do commit | Commit imediato; feedback no mesmo quadro (MOV-16) |
| Spinner sem atraso; skeleton que volta no refetch | Atraso e mínimo de TOK-26; manter o conteúdo (MOV-17) |
| `opacity: 0` inicial liberado por JS | Conteúdo visível em repouso (MOV-20) |
| `* { transition-duration: .001ms !important }` sob reduced motion | Mapa: manter cor e opacidade curtas (MOV-21) |
| `:hover { transform: … }` fora de media query | `(hover: hover) and (pointer: fine)` (MOV-15) |
| Fundo animado, shader ou gradiente em loop em fila, tabela ou formulário diário | Mover para momento-assinatura ou parar após um ciclo (MOV-32) |

## 13. Fontes

- NN/g — [Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/); [Progress Indicators](https://www.nngroup.com/articles/progress-indicators/)
- W3C — [WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [Carbon — Motion](https://carbondesignsystem.com/elements/motion/overview/); [Fluent 2 — Motion](https://fluent2.microsoft.design/motion); [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Chrome — View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions); [MDN — Using the View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using); [Astro — View transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Motion — Spring](https://motion.dev/docs/spring); [Motion — Layout animations](https://motion.dev/docs/react-layout-animations)
- Skills instaladas (praticante): `animate`, `emil-design-eng`, `choreograph`, `apple-design`, `gestures`, `review-animations`, `improve-animations`, `remove-animations`, `find-animation-opportunities`, `animation-performance`, `animation-vocabulary`, `better-ui`, `design-taste-frontend`. Elas tendem a "não animar" ações 100+/dia; esta skill segue a decisão do dono de dar resposta curta a essas ações, e usa as lentes para curva, interrupção, coreografia e desempenho.
- Demos code&chill medidos (Ostrel, Pane, Bastio, Rapport e outros), no estudo "Incorporação dos estudos ao playbook" (nov/2026)
- Decisões do dono do produto, iteração 3 (nov/2026): forma e função sempre, microinteração obrigatória, transição de tela sempre, revelação circular do tema, molas, movimento líquido e cinematográfico nas ações-chave, celebração tirada do domínio (sem carimbo, troféu ou confete por padrão), proibições de estilo trocadas por alertas de uso consciente

Lacunas: os valores dos presets de mola são padrão inicial de praticante (Motion e Apple), sem pesquisa; precisam entrar na tabela consolidada de `fundamentos-e-tokens.md`. O limite de ~5 s do pulso segue a leitura do WCAG 2.2.2, sem teste com usuários.
