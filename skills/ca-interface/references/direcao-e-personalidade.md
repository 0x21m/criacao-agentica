# Direção e personalidade (PER)

Cobre a personalidade visual e verbal de um produto: os três atributos de marca, a tradução de cada atributo em escolhas concretas (tipo, cor, raio, densidade, profundidade, ícones, imagem, movimento, voz, deleite), a rodada de direções do modo criar, a personalidade num sistema existente e a intensidade por ponta. Não cobre os números de tipo, cor, raio e duração (`fundamentos-e-tokens.md`), quando animar (`movimento.md`), a voz detalhada e as frases (`microtexto-ptbr.md`), a busca e o uso legal das referências (`referencias-e-bom-gosto.md`), o stack, as bibliotecas e os ícones como pacote (`stack-e-bibliotecas.md`), as origens e licenças das famílias tipográficas (`catalogo-de-fontes.md`, "Fontes de texto livres") nem a mecânica do portão e da rodada (`prototipo-e-aprovacao.md`).

Formato das regras: **ID** · [selo] · prioridade mínima. Regra. *Por quê* e *Verificar* quando ajudam. Selos: [N] norma ou política oficial; [N casa] política da casa (decisão do dono desta skill; aqui inclui a preferência explícita do usuário de que protótipo sem personalidade não é entregável); [P] pesquisa; [DS] design system ou documentação de produto; [PR] praticante. Prioridade é piso; [PR] sozinho não passa de P2.

Nenhum recurso de estilo é proibido por este arquivo: serifa, gradiente, sombra, textura, desfoque e efeito entram quando têm papel na direção. As regras de estilo são **alertas de uso consciente** (seção 7). Continuam requisito o que é norma ou função: contraste WCAG, informação só por cor, emoji como ícone, licença, enfeite em tarefa de alta frequência e desempenho que bloqueia a tarefa.

## Sumário

1. Por que a personalidade é uma decisão, não um acabamento
2. Três atributos e a tradução em escolhas
3. A rodada de direções no modo criar
4. Sistema existente: acentuar, não trocar
5. Personalidade por ponta
6. Deleite: onde e quanto
7. Alertas de uso consciente
8. Skills como lentes de direção
9. Padrão detectável → correção
10. Fontes

## 1. Por que a personalidade é uma decisão, não um acabamento

Um modelo sem direção produz a média: fundo cinza-claro, um azul de acento, cards brancos todos iguais, Inter em tudo (ou um título serifado elegante sobre corpo em Inter, a variação que virou assinatura de interface feita por IA), raio de 8 px em tudo, tudo no mesmo plano, ícone nenhum. O resultado não tem erro de regra e mesmo assim parece cru, porque nenhuma escolha foi feita. A pessoa que aprova não consegue dizer "sim, é isso", só "está feio".

Personalidade não é logo nem uma cor de marca aplicada no fim. É um conjunto coerente de escolhas que aparece em toda tela: o par tipográfico, como o acento é usado, o raio e a densidade, a profundidade (planos, gradiente, sobreposição, textura), a família de ícones, a imagem, o ritmo do movimento, a voz do texto e os poucos momentos de deleite. Decidida cedo, ela custa o mesmo que a média; decidida no fim, vira retrabalho em todos os componentes.

- **PER-01** · [N casa] · P1. No modo criar do zero, a personalidade é a **primeira decisão de direção** e é **validada no protótipo**, não só o fluxo. As perguntas de descoberta (modo 1, item 1) incluem os três atributos, com a suposição usada para seguir; a rodada v1 traz as direções da seção 3. *Por quê:* os primeiros protótipos gerados pela skill foram avaliados como crus e sem personalidade, mesmo com fluxo e estados corretos. *Verificar:* o roteiro do protótipo tem os três atributos e a tabela de tradução preenchida antes da primeira tela.
- **PER-02** · [PR] · P2. Personalidade serve à tarefa, nunca a atrapalha: contraste (TOK-16), alvo (TOK-30), densidade do operador (TOK-14) e o portão de frequência do movimento (MOV-01) valem dentro de qualquer direção. Uma direção que só funciona quebrando uma regra P0 ou P1 é descartada, não aprovada com exceção.

## 2. Três atributos e a tradução em escolhas

- **PER-03** · [PR] · P2. Defina **três atributos de marca**, adjetivos que descrevem como o produto deve ser percebido ("preciso, caloroso, ágil"), com um quarto opcional dizendo o que ele **não** é ("não é infantil"). Cada atributo vem com a evidência de onde saiu: conversa com o usuário, marca existente, público, concorrentes que se quer evitar. Atributos genéricos ("moderno, limpo, intuitivo") não contam: não excluem nada. *Verificar:* trocar um atributo pelo seu oposto mudaria pelo menos três linhas da tabela abaixo; se não mudaria, o atributo é vazio.
- **PER-04** · [PR] · P2. Traduza os atributos em escolhas concretas, uma linha por eixo, cada uma com o atributo que a justifica. A tabela vai para o roteiro do protótipo e, depois de aprovada, para o `DESIGN.md` (seção "Pontas e tom" e tokens).

| Eixo | O que decidir | Exemplo "preciso, sóbrio, confiável" | Exemplo "caloroso, próximo, leve" |
| --- | --- | --- | --- |
| Par tipográfico | família de texto, família de título (pode ser a mesma, com eixo de largura ou de tamanho óptico), mono para códigos e números; peso de título dentro de TOK-10; candidatas buscadas no catálogo e conferidas por TOK-33 (PER-18) | grotesca técnica no texto (ex.: IBM Plex Sans), mono marcada em códigos e números; títulos 600 | humanista arredondada no texto (ex.: Figtree), título em grotesca expressiva (ex.: Bricolage Grotesque); títulos 500–600 |
| Paleta e uso do acento | matiz dos neutros (frio, quente, puro), matiz e croma do acento, onde o acento aparece (só ação? também marca e seleção?) | neutros frios, acento de croma baixo só em ação e foco | neutros quentes (bege, areia), acento vivo em ação e em um elemento de marca por tela |
| Raio e densidade | família de raio (TOK-21: `sharp` ou `soft`), densidade padrão por ponta (TOK-14) | `sharp`, densidade padrão no operador | `soft` com pílula em selos e chips, densidade confortável |
| Profundidade | quantos planos (TOK-34), onde entra gradiente e com que papel (TOK-36), sobreposição (avatar sobre banner, card que avança sobre o topo, foto atrás com véu, TOK-37), textura (TOK-38), desfoque (TOK-23) | planos por superfície e borda, sombra curta só no elevado e nas camadas; gradiente só no estado ao vivo; sem textura | banner de entrada em `gradient-banner` com ruído leve, avatar sobreposto ao banner, cards avançando sobre o topo, brilho no botão principal |
| Família e peso de ícones | família (`stack-e-bibliotecas.md`), traço ou preenchido, peso acompanhando o peso da fonte | traço 1,5 px, cantos retos | traço 2 px com cantos arredondados, ou pesos de uma família com variante preenchida |
| Ilustração e imagem | ilustração (estilo, quando aparece), fotografia (tema, tratamento), nenhuma | nenhuma ilustração; vazios com ícone grande e texto | ilustração simples em vazio de primeiro uso e sucesso de fluxo longo |
| Ritmo de movimento | duração, curva e mola (TOK-39), quanto do movimento padrão se usa | `spring-rapida` no feedback, camadas com `spring-padrao`, sem cerimônia | movimento padrão em camadas; um momento de encanto em fluxo raro |
| Voz do microtexto | registro (formal, neutro, próximo), pessoa (você, a gente), humor (ausente, raro) | neutra, termos do ofício, frases curtas | próxima, "você", frase de resultado com data, sem gíria |
| Momentos de deleite | onde e quanto (seção 6) | um: conclusão do fechamento do caixa | dois: primeiro uso e entrega concluída |

- **PER-05** · [PR] · P3. A voz decidida aqui é o **tom**; as frases, os rótulos e a gramática seguem `microtexto-ptbr.md`. Tom próximo não autoriza gíria em erro nem humor em perda de dado.
- **PER-18** · [PR] · P2. A família tipográfica é **escolhida pelos atributos e por busca**, não pelo hábito. Para cada papel (texto, título, mono), liste de 3 a 5 candidatas de pelo menos duas origens de `catalogo-de-fontes.md`, "Fontes de texto livres" (Google Fonts via Fontsource, Fontshare, Velvetyne, Collletttivo, Open Foundry, League of Moveable Type, Uncut.wtf, Font Squirrel), descarte pelos critérios de TOK-33 (licença, acentos do português, números tabulares onde há dados, variável, hospedagem no projeto) e fique com a que melhor traduz os atributos, com o porquê numa linha ("Archivo: a largura condensada no título dá o 'direto', e o eixo `wdth` mantém título e texto numa família só"). Nenhuma fonte é proibida, Inter e serifadas inclusive. *Alerta:* título serifado elegante sobre corpo em Inter, ou Inter em tudo, sem atributo que peça, é a média dos modelos e faz o produto parecer gerado; fica se ganhou de candidatas de outras origens na comparação. *Verificar:* a linha "Par tipográfico" do PER-04 cita as candidatas descartadas e o motivo da escolhida.

## 3. A rodada de direções no modo criar

O usuário não consegue escolher uma personalidade por descrição. Precisa ver duas ou três, prontas, no mesmo lugar, e reagir. Por isso a rodada v1 do modo criar mostra direções antes de fluxos completos.

- **PER-06** · [N casa] · P1. A rodada v1 do modo criar do zero mostra **2 ou 3 direções de personalidade realmente distintas**, aplicadas à **mesma tela-chave**, com os **mesmos dados** e o **mesmo nível de acabamento**, como **presets do painel de aparência no mesmo protótipo navegável** (PRO-27): cada preset troca cores, par tipográfico, raio, material e densidade, e a tela-chave tem a sua variação de layout por direção. Não se constroem três protótipos (PRO-28). A pessoa escolhe uma ou pede a mistura ("tipo da A, cor da B"); **só então** os fluxos completos são construídos na direção escolhida. *Por quê:* comparar direções numa tela barata evita refazer todos os fluxos depois; acabamento desigual faz a pessoa escolher a mais polida, não a mais certa.
- **PER-07** · [PR] · P2. Cada direção **difere num eixo nomeado** da tabela do PER-04 e tem um nome curto que diz isso ("A · Precisa: neutros frios, sharp, quase sem movimento"; "B · Calorosa: neutros quentes, soft, ilustração no vazio"; "C · Editorial: título com serifa, acento forte, densidade arejada"). Duas direções que só trocam o matiz do acento contam como uma. *Verificar:* a legenda do lado a lado nomeia o eixo que separa cada par de direções.
- **PER-08** · [PR] · P2. Cada direção é um **tema completo**: tokens de neutros, acento, semânticas, raio, tipo (par próprio, PER-19), elevação, gradiente e movimento, em claro e escuro, aplicados pelo mesmo mecanismo de tema do projeto (TOK-04; tema do shadcn em `stack-e-bibliotecas.md`). "A mesma tela com outra cor primária" não é direção (PER-07). Cada direção renderiza também a sua folha do sistema (`assets/modelo-folha-do-sistema.md`), para a pessoa ver selos, botões e campos, não só a tela.
- **PER-09** · [PR] · P2. A **tela-chave** é a que representa a tarefa mais frequente da ponta principal (fila de OS do atendente, detalhe do pedido, acompanhamento do cliente). Se o sistema tem ponta do cliente com intensidade diferente (seção 5), mostre uma segunda tela-chave dessa ponta. No máximo duas telas-chave por direção, para a rodada não triplicar o trabalho.
- **PER-10** · [PR] · P2. Cada direção traz um **moodboard** de 3 a 5 referências que mostram de onde ela vem: tipo, cor, densidade, imagem, movimento. Regras de busca, cartão e licença são as de `referencias-e-bom-gosto.md` (link, sem rehospedar imagem, nada reconhecível como produto de terceiro, REF-07, REF-09, REF-11). Moodboard é direção estética: as referências de estrutura e estados (REF-03) continuam valendo para os fluxos.
- **PER-11** · [N casa] · P1. As decisões da rodada v1 seguem a ordem de PRO-16: primeiro as de fluxo e conteúdo (mapa, recorte, o que a tela-chave mostra), depois a escolha da direção. A direção escolhida, com a mistura pedida, vira DEC no `docs/04-ui-ux.md` (PRO-19), com as direções rejeitadas em "Alternativas rejeitadas".
- **PER-19** · [N casa] · P1 · QUANDO (modo criar, rodada v1). **As direções diferem em estrutura, não só em cor.** É obrigatório que cada direção mude, em relação às outras, **os quatro eixos**: **densidade** (compacta, padrão, arejada), **layout da tela-chave** (por exemplo, bento numa, mestre-detalhe noutra, lista com painel lateral na terceira, sempre dentro de NAV-40), **par tipográfico** (outra família de texto ou de título, não só outro peso; a legenda diz qual, com a origem e a licença; a mono pode se repetir) e **material** (sólido, vidro, gradiente com núcleo, papel). Mudar só a cor, a barra lateral ou o banner não conta: direções assim contam como uma (PER-07) e bloqueiam a rodada. *Por quê:* na iteração 3, as três direções do ERP mudavam quase só a barra lateral e o banner, com o mesmo layout. *Verificar:* trocar os presets na tela-chave e ver mudar densidade, layout, família e material; a legenda nomeia os quatro. *Por quê:* tipo é o eixo que mais muda a percepção com o mesmo layout, e a decisão do dono é ampliar as opções tipográficas em vez de proibir fontes.
- **PER-20** · [N casa] · P2. Cada direção define **seu uso de profundidade**, além de cor, tipo, ícone e movimento: quantos planos a tela-chave mostra (pelo menos três, TOK-34), onde entra gradiente e com que papel (TOK-36), que sobreposição usa (avatar sobre banner, cards avançando sobre o topo, foto atrás com véu medido, TOK-37) e se há textura (TOK-38) ou desfoque (TOK-23). Uma direção pode ser deliberadamente contida (planos por superfície e borda, quase sem sombra) se a legenda disser isso e a tela ainda mostrar os planos; plana por omissão é o alerta "tela de screenshot" (seção 7). *Verificar:* a legenda de cada direção tem a linha de profundidade.
- **PER-21** · [N casa] · **P1** · SEMPRE. **As direções saem dos presets padrão do dono** (`assets/direcoes-padrao.md`: Noite, Vidro, Sóbrio, Aurora e Sinal); a rodada v1 mostra 3, por padrão Noite, Vidro e Sóbrio, e troca uma por Aurora ou Sinal só quando a marca pedir, com o motivo na legenda. Cada uma é um preset do starter, adaptado à marca (acento, fontes, fundo, logo) sem perder o caráter. O agente **não inventa direções**; uma quarta só entra se o dono pedir. *Por quê:* com direção livre, os protótipos saíam genéricos e feios; as 3 vêm das direções que o dono aprovou. *Verificar:* a legenda da rodada nomeia as 3 direções padrão e o que foi adaptado em cada uma.

Exemplo de legenda para a rodada (ERP de assistência técnica, tela-chave: fila de OS do atendente):

> **A · Bancada** (preciso, sóbrio, rápido): neutros frios, acento azul-petróleo só em ação, `sharp`, IBM Plex Sans no texto e IBM Plex Mono nos números de OS, Lucide traço 1,5, sem ilustração; profundidade contida (superfície e borda, sombra curta só nas camadas, `gradient-live` só no selo "em reparo agora"); `spring-rapida` no feedback.
> **B · Balcão** (caloroso, próximo, confiável): neutros areia, acento terracota, `soft` com selos em pílula, Bricolage Grotesque nos títulos e Figtree no texto, Phosphor regular com ativo preenchido, ilustração no vazio inicial; banner de boas-vindas em gradiente de areia que se funde ao fundo, com ruído leve e cards avançando sobre ele; voz em "você".
> **C · Oficina** (técnico, confiante, direto): neutros grafite, acento amarelo de sinalização com tinta escura, cantos retos, Tabler, Archivo condensada no título e normal no texto (a mesma família variável) com JetBrains Mono, densidade compacta; moldura em `gradient-frame` amarela na OS urgente.
> Decisão 3: qual direção, ou que mistura? (Os eixos que separam: temperatura dos neutros, raio, par tipográfico, ícone, profundidade, presença de ilustração.)

As famílias do exemplo são do Google Fonts (OFL, de memória); confira-as no catálogo e por TOK-33 antes de propor.

## 4. Sistema existente: acentuar, não trocar

- **PER-12** · [N casa] · P1. Em sistema existente (modo 2, correções do modo 3), a personalidade **vem da identidade dele**: `DESIGN.md`, tokens, marca, telas vizinhas. Proponha **acentuar** o que já existe (usar o acento onde faltava, trazer a família de ícones para os vazios, dar selo colorido ao status, recuperar a voz), nunca trocar fonte, paleta, raio ou biblioteca sem pedido explícito. Aplica a regra da casa 7. *Verificar:* nenhum token primitivo novo de marca no diff de uma tela nova.
- **PER-13** · [PR] · P2. Se o sistema existente é ele próprio genérico (seção 7), diga isso como **sugestão marcada**, com duas ou três propostas de acento pequenas e reversíveis, mostradas lado a lado sobre uma tela real. A troca de identidade é um pedido à parte, com rodada própria.

## 5. Personalidade por ponta

O mesmo produto fala com o atendente oito horas por dia e com o cliente uma vez por semana. A marca é uma só; a intensidade muda.

- **PER-14** · [PR] · P2. Mesma marca, **intensidades diferentes por ponta**, nos mesmos nomes de token (TOK-04, PON-23): o operador denso e sóbrio (acento só em ação, sem ilustração, profundidade contida com gradiente só em estado vivo, movimento de resposta curta, voz do ofício); o cliente mais expressivo (acento também em marca, banner personalizado com gradiente e sobreposição, ilustração em vazio e sucesso, movimento padrão em camadas, voz próxima). O que **não** muda entre pontas: família tipográfica, família de ícones, matiz do acento, cor de cada estado do objeto (tabela de estados). *Por quê:* a pessoa que é atendida no balcão e depois abre o app reconhece o mesmo produto; o atendente não paga em atenção pelo encanto do cliente.
- **PER-15** · [PR] · P3. Registre a intensidade por ponta numa linha da tabela "Pontas e tom" do `DESIGN.md`: densidade, uso do acento, profundidade (planos, gradiente, textura), ilustração sim ou não, nível de movimento, registro da voz.

## 6. Deleite: onde e quanto

- **PER-16** · [PR] · P2. O **critério de frequência escolhe o deleite certo** (MOV-01), em vez de removê-lo. Em ação de 100+ por dia e por teclado (MOV-02), o deleite é a microinteração curta e interrompível no controle (botão afunda, check se desenha, copiar vira copiado; `spring-rapida`); enfeite que atrasa ou distrai nessa tarefa continua fora (requisito do dono). O encanto (ilustração animada, transição cinematográfica da ação-chave, frase com humor) fica no ocasional e no raro: primeiro uso, vazio inicial, conclusão de um fluxo longo, marco ("primeira venda"), e **nasce do domínio, não do repertório genérico** (EXP-56): mostra algo que só este produto pode mostrar (a jornada do aparelho pela bancada, a cadeira que enche ao longo do dia). Carimbo "APROVADO", confete, troféu, mascote comemorando e animação genérica de "sucesso" são clichê e não contam como momento; teste da troca: se caberia igual num app de outro ramo trocando só o texto, volte ao domínio. Erro e perda de dado não recebem celebração nem humor: o momento pede clareza e saída (`microtexto-ptbr.md`). *Verificar:* teste do 50º uso de MOV-01 em cada momento de deleite listado.
- **PER-17** · [PR] · P3. Orçamento: no máximo **uma celebração por fluxo** e dois ou três momentos-assinatura no produto inteiro na primeira versão (EXP-02), cada um específico do domínio (EXP-56), listados na tabela do PER-04 com o lugar exato e a prática do domínio de onde vêm. Cada um respeita movimento reduzido (MOV-21) e não atrasa a próxima ação: a pessoa pode seguir enquanto ele acontece.

## 7. Alertas de uso consciente

O alerta é para o recurso **sem papel**, não para o recurso. Cada linha diz quando o mesmo recurso funciona. A última linha não é alerta: é requisito.

| Alerta | Como aparece | Quando o mesmo recurso funciona |
| --- | --- | --- |
| **Média genérica** | cinza-claro + um azul; cards brancos iguais em grade; tudo com o mesmo raio e a mesma sombra; Inter em tudo sem escala | quando cada escolha vem de um atributo (PER-04): a mesma Inter, com escala firme e mono marcada, pode ser a direção "precisa" |
| **Par de assinatura de IA** | título serifado elegante + corpo em Inter, sem atributo que peça | atributos editoriais e o par venceu candidatas de outras origens (PER-18) |
| **Gradiente sem papel** | gradiente em todo card, botão e fundo; roxo-azul sem relação com a marca | banner que se funde ao fundo, brilho do botão principal, estado ao vivo, moldura, a partir dos tokens da marca (TOK-36) |
| **Sombra em tudo** | a mesma sombra forte em cards, campos e botões | sombra pelo plano, em níveis (TOK-34) |
| **Tela de screenshot** | tudo num plano, sem sobreposição, sem estado vivo, controle sem resposta ao toque | três planos, banner, sobreposição, microinteração curta (TOK-34, PER-16, PER-20) |
| **Personalidade só no logo** | logo colorido no canto, o resto neutro e sem ícones | marca chegando à tarefa: acento, ícones, selos, voz |
| **Direções que são uma só** | três versões que trocam o matiz do acento, a barra lateral ou o banner, ou repetem a mesma fonte e o mesmo layout | densidade, layout da tela-chave, par tipográfico e material diferentes por direção (PER-07, PER-19) |
| **Acabamento desigual entre direções** | uma direção com ícones e estados, outra em rascunho | mesmo acabamento, para a escolha ser pela direção (PER-06) |
| **Cerimônia em alta frequência** | confete ao salvar, ícone que pula ao trocar de aba | resposta curta no controle; cerimônia no raro (PER-16) |
| **Efeito de landing no trabalho** | texto animado e fundo com shader na fila do operador | onboarding, vazio inicial, momento de marca, página pública do cliente (`stack-e-bibliotecas.md`, STK-09) |
| **Textura ou vidro sob dado** | ruído ou vidro atrás de tabela e texto longo | superfície grande de marca, chrome, com fallback (TOK-23, TOK-38) |
| **Personalidade quebrando regra** (requisito) | cinza de marca bonito com 3:1 no texto; selo só com cor; texto sobre foto sem véu | não é alerta: a direção ajusta o degrau, o ícone ou o véu e continua (PER-02, TOK-16, TOK-37) |

## 8. Skills como lentes de direção

Lentes opcionais, só para gerar e criticar direções; os achados voltam para a escala e os selos desta skill, e valores delas continuam [PR].

| Lente | Use para |
| --- | --- |
| `design-taste-frontend` | anti-genérico: checar se a direção ainda parece template |
| `high-end-visual-design` | uma direção "premium" (tipo, espaço, sombra refinados) |
| `minimalist-ui` | uma direção editorial, monocromática quente |
| `industrial-brutalist-ui` | uma direção técnica, de contraste duro |
| `prototype`, `variant` | gerar as direções e o seletor entre elas, quando o usuário chamar |
| `apple-design`, `better-ui` | profundidade: materiais, camadas, sombras e realces |
| `better-typography` | conferir o par escolhido em escala, entrelinha e recursos de número |

Lentes de landing (`gpt-taste`, efeitos de rolagem, seções enormes) servem a momentos de marca (onboarding, vazio inicial, página pública do cliente); em tela de trabalho, use com cuidado, porque trazem espaço e movimento de marketing.

## 9. Padrão detectável → correção

| Padrão detectável | Correção |
| --- | --- |
| Protótipo do modo criar sem atributos de marca nem tabela de tradução | Três atributos com evidência e a tabela do PER-04 (PER-01, PER-03) |
| Atributos "moderno, limpo, intuitivo" | Atributos que excluem algo; teste do oposto (PER-03) |
| Rodada v1 com uma só direção, ou já com fluxos completos | 2–3 direções na tela-chave, fluxos depois da escolha (PER-06) |
| Direções que diferem só na cor primária | Um eixo nomeado por direção e tema completo (PER-07, PER-08) |
| Direções com dados, telas ou acabamento diferentes | Mesma tela, mesmos dados, mesmo acabamento (PER-06) |
| Direção sem moodboard | 3–5 referências por direção, só link (PER-10) |
| Escolha de direção só na conversa | DEC com as alternativas rejeitadas (PER-11) |
| Tela nova em sistema existente com fonte ou paleta nova | Identidade do sistema; propor acento, não troca (PER-12) |
| Operador e cliente com famílias de ícone ou matizes de acento diferentes | Mesma marca, intensidade por ponta (PER-14) |
| Confete, mascote ou animação de marca em ação diária | Mover para momento raro; na ação diária, resposta curta no controle (PER-16) |
| Momento de deleite genérico (carimbo, confete, troféu) | Momento nascido do domínio, teste da troca (PER-16, EXP-56) |
| Fundo cinza, um azul, cards iguais, raio único, tudo num plano | Rodada de direções; tradução por eixo, inclusive profundidade (PER-04, PER-20) |
| Família escolhida sem candidatas nem motivo; serifa + Inter por hábito | Busca no catálogo e critérios (PER-18, TOK-33) |
| Direções da rodada com a mesma família tipográfica ou o mesmo layout | Densidade, layout, par e material próprios por direção (PER-19) |
| Direção sem linha de profundidade; gradiente em todo card | Profundidade por direção; gradiente com papel (PER-20, TOK-36) |

## 10. Fontes

- NN/g · [The Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/); [The Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) (aparência pesa no julgamento, inclusive na aprovação de protótipo)
- NN/g · [Design Critiques](https://www.nngroup.com/articles/design-critiques/) (comparar alternativas com o mesmo recorte)
- Mailchimp · [Content Style Guide, Voice and Tone](https://styleguide.mailchimp.com/voice-and-tone/) (voz fixa, tom que muda com o contexto)
- Skills instaladas (praticante): `design-taste-frontend`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `frontend-design`, `prototype`, `variant`
- Avaliação do usuário dos primeiros protótipos gerados pela skill (nov/2026): sem personalidade, sem biblioteca, sem ícones, sem variação de cor
- Decisões do dono, iteração 3 (16/11/2026): tipografia ampla sem lista negra (título serifado + Inter como assinatura de IA); profundidade, gradiente e camadas; proibições de estilo trocadas por alertas de uso consciente

Lacunas: não há pesquisa que fixe "três atributos", "2 ou 3 direções", "um deleite por fluxo", "três planos" ou "par próprio por direção"; são prática e política da casa. A leitura de "serifa + Inter" como assinatura de IA é observação do dono, não pesquisa. As URLs acima não foram reabertas nesta redação (nov/2026): confira antes de citá-las como evidência num achado.
