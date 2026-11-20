# Starter de protótipos (ca-interface)

Projeto pronto para começar qualquer protótipo navegável e funcional: Astro 7 com ilhas React 19, Tailwind 4,
shadcn no estilo **aria-nova** (React Aria) sobre a base do **MIFT UI**, lucide-react, motion e sonner.
O que se aprova no `/arsenal` é exatamente o que as telas importam.

## Começar (cópia direta)

```bash
cp -r assets/arsenal/starter ./meu-prototipo   # ou copie a pasta pelo explorador
cd meu-prototipo
npm install        # ~45 s (medido numa cópia limpa no Windows, cache do npm aquecido; até ~2 min com a máquina ocupada)
npm run dev        # http://localhost:4321
npm run build      # gera dist/ (~25 s com o /arsenal e o /site/; 66 páginas)
```

Nada de registro privado nem token: tudo o que a base precisa está dentro da pasta. Para servir numa subpasta:
`BASE=/teste/ npm run build`. Todo link e arquivo passa por `url()` (`src/lib/url.ts`): nunca escreva `href="/..."`.

## O agente trabalha assim

1. Abre `/arsenal`: o catálogo vivo (moldura, kit de movimento, peças brasileiras, 12 templates, 12 componentes do
   21st, React Bits). Cada página mostra a peça funcionando, quando usar, quando não usar, o import e as dependências.
2. Escolhe, importa e adapta (textos, dados, cores pelos tokens). A demo do autor nunca vai como tela.
3. Troca os **pontos de troca** abaixo e apaga as telas de exemplo que não servirem.
4. No fim: `node scripts/limpar-arsenal.mjs` (tira `/arsenal` e os templates que nenhuma tela importa; `--simular`
   mostra antes) e `node scripts/navegar.mjs`.

## O ERP em módulos (fase 2)

O starter é o ERP fictício **Oficina Norte** (especificação em `apps-e-fluxos-workspace/especificacao-erp-oficina-norte.md`),
dividido em módulos independentes. **Como criar um módulo, que APIs usar e que arquivos não editar: `docs/contratos.md`.**

```
src/modulos/<id>/
  modulo.ts          navegação, Ctrl K, sino e simulações da barra F (lidos por src/modulos/registro.ts)
  dados.ts           tipos, a coleção (semente própria) e as ações
  telas/*.tsx        as ilhas das telas
  paginas/**.astro   as rotas (o caminho dentro de paginas/ é a URL; integracoes/modulos.mjs injeta)
```

<!-- modulos:inicio -->
<!-- gerado por node scripts/gerar-docs.mjs a partir do registro (src/modulos/*/modulo.ts); não edite à mão -->

| Módulo | Nome | Rotas | Quem vê | Coleções | Depende de | O que mostra |
|---|---|---|---|---|---|---|
| `entrada` | Entrada | `/entrar/`, `/entrar/primeiro-acesso/`, `/entrar/senha/`, `/entrar/unidade/` | fora da navegação (links e Ctrl K) | `convites` | `agenda` | Login, primeiro acesso, escolha de unidade e recuperação de senha. |
| `inicio` | Início | `/` | todos os papéis | nenhuma | `pedidos`, `agenda`, `clientes`, `financeiro`, `estoque`, `mensagens`, `entrada` | A visão do dia, recortada por papel (seção 2, linha `ver_inicio` da MATRIZ). |
| `pedidos` | Pedidos | `/pedidos/`, `/pedidos/novo/`, `/pedidos/ver/` | todos os papéis | `pedidos` | `clientes`, `agenda` | Lista, quadro (?vista=quadro), folha de detalhe (?id=), página da OS (/pedidos/ver/?id=) e nova OS em etapas (/pedidos/novo/). |
| `agenda` | Agenda | `/agenda/`, `/agenda/livres/`, `/agenda/minha/` | dono, gestora, atendente, técnico (`ver_agenda`) | `agendamentos` | `clientes`, `pedidos`, `mensagens` | Dia por recurso e semana de um recurso, com arrastar, esticar e criar; o "Meu dia" do técnico; a grade de horários livres com reserva, exportada para o Site… |
| `clientes` | Clientes | `/clientes/`, `/clientes/novo/` | todos os papéis | `clientes` | `pedidos`, `agenda`, `financeiro`, `mensagens` | Mestre-detalhe (lista com segmentos + detalhe com banner curto e abas), cadastro com campos BR, mesclar duplicados, anonimizar (LGPD) e o pedido de exclusão… |
| `estoque` | Estoque | `/estoque/`, `/estoque/compras/`, `/estoque/movimentacoes/` | todos os papéis | `produtos`, `movimentacoes`, `compras` | `pedidos` | Saldo com mínimo por unidade (/estoque/, detalhe em ?id=SKU), movimentações (/estoque/movimentacoes/) e compras com recebimento (/estoque/compras/, detalhe… |
| `financeiro` | Financeiro | `/financeiro/`, `/financeiro/caixa/`, `/financeiro/pagar/`, `/financeiro/receber/` | dono, gestora, financeiro (`financeiro_painel`) | `lancamentos`, `caixas` | `clientes`, `pedidos` | Fluxo de caixa (/financeiro/), contas a receber e a pagar (/financeiro/receber/ e /financeiro/pagar/, detalhe em ?id=LAN-5012) e o caixa do dia… |
| `mensagens` | Mensagens | `/mensagens/`, `/mensagens/modelos/`, `/notificacoes/` | dono, gestora, atendente, técnico (`mensagens`) | `conversas`, `mensagens`, `notificacoes`, `modelos` | `clientes`, `pedidos`, `agenda` | Caixa de conversas (/mensagens/, ?conversa=CV-0031), modelos (/mensagens/modelos/, ?id=MOD-01) e a central de notificações (/notificacoes/), que é o que o… |
| `relatorios` | Relatórios | `/relatorios/` | dono, gestora, financeiro (`relatorios`) | `exportacoes` | `pedidos`, `agenda`, `financeiro`, `estoque` | /relatorios/ com as vistas Desempenho, Técnicos (?aba=tecnicos) e Serviços (?aba=servicos). |
| `equipe` | Equipe | `/equipe/`, `/equipe/auditoria/`, `/equipe/permissoes/` | dono, gestora (`equipe_ver`) | `equipe`, `ajustes_permissao` | `pedidos`, `agenda`, `clientes` | Pessoas (/equipe/, ?id= abre a pessoa), matriz de permissões (/equipe/permissoes/, edição só simulada) e auditoria (/equipe/auditoria/, lê o `historico` das… |
| `configuracoes` | Configurações | `/configuracoes/`, `/configuracoes/aparencia/`, `/configuracoes/empresa/`, `/configuracoes/indisponivel/`, `/configuracoes/integracoes/`, `/configuracoes/marca/`, `/configuracoes/modulos/`, `/configuracoes/unidades/` | todos os papéis | `config_empresa`, `config_marca`, `config_unidades`, `integracoes` | nenhum | Índice (/configuracoes/), aparência (/configuracoes/aparencia/, painel da base), marca, empresa, unidades, integrações (simuladas) e módulos opcionais… |
| `prototipo` | Protótipo | (ferramentas em `src/pages`) | todos (ferramenta do protótipo) | nenhuma | nenhum | A folha do sistema, o quadro de fluxos e o arsenal. |
| `portal` | Portal do cliente | `/portal/`, `/portal/agendar/`, `/portal/conversa/`, `/portal/dados/`, `/portal/orcamento/`, `/portal/pagar/`, `/portal/pedido/`, `/portal/pedidos/` | cliente (portal) | nenhuma | `pedidos`, `agenda`, `clientes`, `financeiro`, `mensagens` | Não entra na navegação do painel nem no Ctrl K. |
| `site` | Site e landing | `/site/`, `/site/agendar/`, `/site/carrinho/`, `/site/checkout/`, `/site/confirmacao/`, `/site/contato/`, `/site/creditos/`, `/site/loja/`, `/site/loja/[sku]/`, `/site/precos/`, `/site/servicos/[id]/`, `/site/sobre/` | público | `carrinho_site`, `vendas_site`, `interessados_site` | `agenda`, `pedidos`, `clientes`, `financeiro`, `estoque`, `configuracoes`, `portal` | Não entra na navegação do painel nem no Ctrl K (o link "Site público" está no módulo do protótipo). |

14 módulos. Para tirar os que um protótipo não usa: `node scripts/modulos.mjs --manter <ids>` (veja `--listar`).
<!-- modulos:fim -->

O **site público** (`/site/`, módulo Site e landing da especificação, 5.13) foi feito com a `design-taste-frontend` e mora
em `src/pages/site/`, `src/components/site/` e `src/proto/site.ts`; o `site.css` isola os nomes de variável que colidem
com os do starter (`--muted`, `--accent`, `--card`). Ele não usa a casca do painel.

## Pontos de troca

| O quê | Onde |
|---|---|
| Nome, logo (SVG), abertura liga/desliga e duração | `src/proto/marca.ts` |
| Empresa, unidades, horário, feriados, serviços, equipe e recursos da agenda | `src/proto/negocio.ts` |
| Papéis e o que cada um pode (matriz da seção 2) | `src/proto/permissoes.ts` |
| Rótulos de status e frases do cliente | `src/proto/projecao.ts` |
| O "agora" do protótipo (16/11/2026, 09:41) | `src/proto/relogio.ts` |
| Navegação, abas do celular, Ctrl K | o `modulo.ts` de cada módulo |
| Dados falsos e ações | o `dados.ts` de cada módulo, sobre `colecao()` e `acao()` de `src/proto/dados.ts` |
| Presets (Noite, Vidro, Sóbrio, Aurora, Sinal): fontes, banner, cantos, densidade, vidro, tema | `src/proto/aparencia/presets.ts` |
| Paleta, fundo ambiente, material (Superficie), vidro, escala tipográfica de cada preset | `src/styles/sistema.css` |
| Tokens e eixos (tema do MIFT + seção STARTER no fim) | `src/styles/global.css` |
| Formato pt-BR (moeda, datas, `lerMoeda`) | `src/lib/formato.ts` |

## O que é fixo e o que é exemplo

- **Fixo (base):** `src/components/ui` (aria-nova do MIFT), `src/components/sistema` (Superficie, BannerSobreposto, folha
  do sistema), `src/components/app` (AppShell, barras, abertura,
  estados), `src/components/movimento`, `src/components/mift` e `src/colecao` (peças do MIFT), `src/proto`
  (aparência, barra F, dados), `src/layouts/Base.astro`, `scripts/`.
- **Base do ERP (fase 2, fixa):** `src/proto/{dados,relogio,permissoes,projecao,negocio}.ts`, `src/modulos/registro.ts`,
  `src/components/base` (TabelaDados, CabecalhoPagina, BarraFerramentas, FolhaDeDetalhe, DialogoConfirmar, MenuDaLinha,
  selos, LinhaDoTempo, texto), `src/components/interativos` (QuadroInterativo, AgendaInterativa) e `integracoes/`.
- **Exemplo (troque ou apague):** os módulos em `src/modulos/<id>/` e o site em `src/pages/site/`.
- **Some no fim:** `src/pages/arsenal`, `src/arsenal` (pelo `limpar-arsenal.mjs`).

## Aparência: presets que são templates, num sistema só

Cada preset é uma **base completa de protótipo** (paleta, fontes, densidade, material, fundo ambiente, banner e
movimento), não só outra cor. Todos têm as **4 combinações desenhadas**: claro e escuro, com e sem vidro. Nenhum usa
serifa de título (ela só entra como exceção pedida pela marca).

| Preset | Arquétipo | Fontes (display / texto) | Base e acento | Banner | Lateral no claro | Vidro padrão |
|---|---|---|---|---|---|---|
| **Noite** (padrão) | Moderno | Bricolage Grotesque / Onest | verde-petróleo quase preto, lima | shader escuro da marca | clara | ligado, escuro |
| **Vidro** | Liquid Glass | Figtree / Inter | papel de parede azul, ciano e coral que respira; azul | aberto (sem caixa, direto no papel de parede) | vidro claro | ligado, claro |
| **Sóbrio** | Ferramenta | Archivo condensada / Archivo | cinza frio; azul-grafite contido | plano (faixa clara, sem shader) | clara | desligado, claro |
| **Aurora** | variação do Moderno | Geist / Inter | azul-marinho profundo; azul elétrico e ciano | shader escuro | clara | ligado, escuro |
| **Sinal** | variação do Moderno | Space Grotesk / Manrope | grafite quente; laranja com brilho no cabeçalho | shader escuro | clara | ligado, escuro |

**Os três arquétipos (3 linhas cada):**

- **Noite (Moderno).** Caráter: escuro tingido, um acento vivo, cabeçalho com sobreposição, números grandes em peso
  leve, cards com núcleo e borda de luz. Funciona em operação, painéis e apps de serviço que querem presença.
  Trocável: o acento, a cor da base (o matiz), o par tipográfico e as cores do banner (`--banner-1..3`).
- **Vidro (Liquid Glass).** Caráter: papel de parede rico que respira, painéis de vidro com desfoque, refração do
  vidro líquido do MIFT no herói, cantos grandes e molas. Funciona em portal do cliente, apps de consumo e momentos de
  marca; é o mais "uau". Trocável: as três manchas do papel de parede (`--amb-1..3`, ou uma imagem), o acento e as fontes.
- **Sóbrio (Ferramenta).** Caráter: claro, limpo e contido, densidade compacta, títulos condensados, banner plano,
  quase sem efeito. Funciona em ERP, back-office e telas de uso o dia inteiro. Trocável: o acento (sempre contido),
  o cinza da base e as fontes.

**Por que Sinal e não Navalha como variação marcante:** o Sinal tem uma assinatura própria (preto quente com o laranja
e o brilho no cabeçalho) que nenhum outro preset cobre; a Navalha (azul de barbeiro, condensada em caixa alta) fica
perto do Sóbrio (cantos retos, condensada) e do Aurora (azul). O bloco da Navalha cabe como sexto preset se a marca pedir.

**Lateral escura com página clara:** decidido por preset. Em todos, a lateral segue o tema (clara no claro). A do
Sóbrio é clara por definição; Noite e Sinal ficariam bonitos com lateral escura no claro, mas a lateral clara manteve a
unidade com os cards claros. Para trocar, defina `--sidebar` e `--casca-veu` escuros no bloco claro do preset e ponha
`.casca-lateral` com os tokens de texto escuros (o seletor já existe na lateral).

**Um sistema só:** atributos na raiz, como no MIFT UI: `data-preset` (a paleta), `data-skin` ("Do preset" usa a
paleta; as outras peles do MIFT trocam por cima), `data-raio`, `data-borda`, `data-destaque` ("marca" = o acento do
preset; ou 6 cores com contraste conferido; ou cor própria), `data-densidade` (compacta, padrão, confortável, campo) e
`data-profundidade`. Por cima: `.dark` (claro, escuro ou sistema) e `data-vidro="on"`. Tudo no localStorage
(`proto-aparencia-v2`), aplicado antes da pintura. Painel em `/configuracoes/aparencia/`; a URL aceita `?preset=`,
`?tema=` e `?vidro=1`; com `?embutida=1` a página não grava nada (é como a folha do sistema mostra as 4 combinações).

## O material: `Superficie` e o elemento-assinatura

O elemento-assinatura dita o sistema: o gradiente de borda (`--borda-gradiente-de/meio/para/forca`), a luz de 1 px
em cima (`--luz-borda`), o aro sutil (`--sup-aro`), o brilho e o núcleo do acento e o raio (`--raio-sup`) valem em
**todas** as superfícies, com forças por nível. O peak-chart é só a versão mais intensa do mesmo material.

| Nível | Onde | Material |
|---|---|---|
| `fundo` | a página | o fundo ambiente (`#fundo-ambiente`: 3 brilhos radiais do preset + grão) |
| `casca` | lateral, barras fixas, abas | vidro de 20 px, opacidade mínima 72 %, borda fraca |
| `card` | todo card, campo, botão contornado | gradiente vertical com núcleo do acento, borda com gradiente, sombra em 2 camadas |
| `destaque` | KPI-herói, card sobre banner | escuro: núcleo escuro com brilho do acento (peak-chart); claro: o card claro com núcleo do acento mais forte |
| `flutuante` | popover, menu, select, sheet, diálogo, ilha de abas | vidro de 24 px, opacidade 84 %, sombra longa; refração com `refracao` |

- `import { Superficie } from "@/components/sistema/Superficie"`: `<Superficie nivel="card" tom="aviso" interativa como="section">`.
  As peças aria-nova (Card, popover, dropdown, select, dialog, alert-dialog, hover-card, sheet) já levam `.sup` com o
  nível certo; campos e botão contornado usam o mesmo gradiente de borda. **Nenhuma tela monta o próprio card.**
- **Vidro de verdade** (com `data-vidro="on"`): desfoque de 12 a 24 px com saturação; opacidade mínima por nível
  (o controle do painel só deixa mais opaco); refração do `vidro-liquido` só em destaque de vidro e flutuante; sólido
  com `prefers-reduced-transparency`, `prefers-contrast: more` e sem `backdrop-filter`; sempre sobre o fundo ambiente.
  Todo cabeçalho fixo usa `.casca-fixa` (vidro com 82 % de opacidade, `z-20` no conteúdo, `z-30` na moldura).
- **`BannerSobreposto`** (`src/components/sistema/BannerSobreposto.tsx`): banner da marca (shader `glass-fold` nas cores
  `--banner-1..3`, véu de contraste, movimento lento que para com movimento reduzido) e o conteúdo avançando 40 a 72 px
  sobre ele. `variante="compacta"` nas telas de operação: faixa baixa que, ao sair da tela, vira uma barra fina de vidro
  com título e ações. No Sóbrio o banner é plano; no Vidro é aberto (sem caixa), e nos dois não há sobreposição.
- **Tipografia de app:** texto 14 px (13 px em `[data-densa]`), rótulos 12 px (`.t-rotulo`), título de card 15 px
  (`.t-card`), de seção 16 px (`.t-secao`), de página 20 a 24 px (`.t-pagina`), KPI 24 a 32 px em peso leve e
  tabular (`.t-kpi`); 40 px ou mais só em momento-assinatura (`.t-assinatura`). No celular, base de 15 px e alvos de 40 px.

**Onde a landing vai ler os tokens (módulo Site e landing, próxima fase):** os mesmos de `src/styles/sistema.css`. A
fonte display do preset (`--fonte-titulo`, posta pelo `aparencia.ts`) faz o hero; `#fundo-ambiente` (ou os tokens
`--amb-1..3` numa seção inteira) faz o fundo; o `BannerSobreposto` e o `glass-fold` com `--banner-1..3` fazem o banner;
`--ease-out` e as molas de `src/proto/movimento.ts` fazem o movimento. A landing usa a versão espaçosa (densidade
"confortável" e `.t-assinatura`); o painel do operador, a densa. O fluxo do cliente herda a estética da landing.

## Folha do sistema e quadro de fluxos

- **`/sistema`**: a folha do preset nas 4 combinações lado a lado (cada uma num iframe de `/sistema/folha/`): neutros
  e papéis, acento, semânticas, selos, botões, campos, os cinco níveis do material, estados, escala tipográfica e
  ícones, com o **contraste medido no navegador**. É a prova visual do material; troque o preset no topo.
- **`/fluxos`**: telas reais do protótipo, uma faixa por fluxo, a seta saindo do elemento tocado; ramos de erro com
  borda de perigo. Gere as telas com `node scripts/quadro.mjs [url] [--preset noite --tema escuro --vidro 1]`
  (JPEGs e `quadro.json` em `public/quadro/`). Os grupos e o **mapa dos módulos** (rotas, quem vê, coleções e
  dependências) vêm do registro (`src/modulos/registro.ts`) no build: nada escrito à mão.

## Comportamentos da casca e das telas de exemplo (fase 1)

- **Lateral a partir de 1024 px.** Abaixo disso (iPad em retrato e celular), barra superior e ilha de abas; o banner
  empilha por container query (`@container/banner`), não pela largura da janela.
- **Abertura:** camada estática do layout (`#abertura`), uma vez por aparelho (`localStorage`), só na home, até 1,2 s,
  com "Pular" (o relógio para com o ponteiro ou o foco nele) e sem abertura com movimento reduzido. A barra F tem
  "Rever abertura".
- **Desfazer:** os avisos com ação ficam 8 s (os outros 7 s) e pausam com o ponteiro em cima; na folha de detalhe, o
  Desfazer aparece dentro da própria folha (o aviso fica atrás da camada modal enquanto ela está aberta).
- **Desempenho:** a casca (lateral, barra superior, abas, barra F, avisos e fundo) persiste entre páginas
  (`transition:persist`); prefetch do Astro ao passar o ponteiro em todos os links; o shader do banner vem num pedaço
  de JS à parte e só depois da abertura; o campo do peak-chart fica em cache por tamanho.
- **KPI-herói da Visão geral:** SVG dentro do nível destaque da Superficie (uma moldura só). O peak-chart do 21st, que
  desenha o próprio cartão no canvas, fica no `/arsenal` e não vai dentro de card do sistema.
- **Pedidos e OS:** filtros na URL (`?q=&etapa=&atrasados=1&vista=quadro&id=`), "Exportar CSV" do recorte (ponto e
  vírgula, abre certo no Excel em pt-BR), seleção com Shift/Ctrl e "Avançar" em lote, Ctrl K abre a OS pelo número,
  folha de detalhe com os eixos separados (etapa, orçamento, pagamento) e o que o cliente lê. No quadro, soltar em
  "Agendadas", "Aguardando cliente" ou "Prontas" abre a sheet da ação em **modo pessimista** (nada muda antes da
  resposta; a falha aparece na sheet e no toast); os outros movimentos são otimistas com Desfazer.
- **Nova OS:** criar é pessimista ("Enviando…" com a mesma largura, erro no formulário); validação viva depois do
  primeiro envio, máscara de moeda, serviço "sob orçamento" sem valor obrigatório.
- **Agenda:** regras validadas durante o arrasto (expediente, feriado de 20/11, competência do técnico); sobreposição é
  conflito destacado, não proibição; criar agendamento é pessimista.
- **Papéis:** a barra F troca o papel ("Ver como"); a navegação, os botões e a própria `acao()` respeitam a matriz.
- **Movimento reduzido sem erro de hidratação:** `useMovimentoReduzido()` (`src/lib/movimento-reduzido.ts`) vale
  "não reduzido" no servidor e no primeiro quadro; use no lugar do `useReducedMotion` quando a preferência muda o HTML.

## Velocidade: meça no build, não no dev server

O `npm run dev` serve cada módulo sem empacotar (centenas de arquivos pequenos, transformados na hora) e é
**naturalmente mais lento**, sobretudo na primeira abertura de cada tela. O `astro.config.mjs` já empacota de uma vez
as dependências grandes e aquece a casca, mas a velocidade que vale (a que a pessoa vai sentir) é a do build:
`npm run build && node scripts/medir.mjs`. O que deixa o build rápido:

- **Dados no HTML.** A semente é fixa, então o servidor renderiza as telas com os dados de exemplo e o conteúdo aparece
  na primeira pintura, sem esperar o JavaScript. Se o navegador tiver mudanças guardadas, elas entram logo depois.
- **Entrada animada só sob a abertura** (`src/lib/entrada.ts`): nada é escondido para depois "entrar"; os números, os
  gráficos e os cards já vêm no estado final. Demos que precisam animar ao montar usam `entrada="sempre"`.
- **Casca persistente e preguiçosa:** lateral, barra superior, abas, avisos e barra F ficam com `transition:persist` e
  hidratam em `client:idle` (os links funcionam antes disso; o item ativo já vem certo no HTML). A tela hidrata primeiro.
- **Prefetch** ao passar o ponteiro em todo link; peças pesadas (folha de detalhe, shader do banner) em pedaço à parte.

## Barra F (controles do protótipo)

Oculta por padrão; **F** alterna (fora de campos de texto) e `?controles=1` abre. Tem: estado da tela (com dados,
carregando, vazio, erro; também por `?estado=`), latência, forçar falha, **ver como** (o papel: dono, gestora, atendente,
técnico, financeiro; também por `?papel=`), **o relógio** do protótipo com "Avançar 30 min" e "Avançar 1 dia",
**simular a outra ponta** (o cliente aprova o orçamento da OS-1052, paga o Pix da OS-1061; "Outra pessoa mexe neste
registro" sobe a versão do registro aberto para provar o conflito), direção, tema, vidro, resetar dados e rever a
abertura. Duas abas lado a lado se atualizam ao vivo (evento `storage`).

## Kit de movimento (`src/components/movimento`)

- `NumeroAnimado`: conta até o valor ou rola como odômetro, em pt-BR (`formato="moeda" | "moedaCompacta" | …`).
- `TextoRevelado`: título entra por palavra ou por linha (`por="linha"`, linhas com `\n`).
- `GraficoQueDesenha`: linha ou área que se desenha ao entrar, com leitura ponto a ponto.
- `BotaoLiquido`: pressão com mola, reflexo de vidro e gota que refrata (SVG no Chromium, brilho em CSS nos outros).
- `EntradaEscalonada` + `ItemEscalonado`: cards entram em sequência.
- `PulsoAoVivo`: pulsa cerca de 3 vezes e para (`chave` faz pulsar de novo).

Todos respeitam `prefers-reduced-motion`. A transição entre telas fica no AppShell (ClientRouter + crossfade curto).

## Scripts (Chrome ou Edge da máquina, sem baixar navegador)

- `node scripts/navegar.mjs [url]`: sem URL, gera o build se faltar e sobe `astro preview`. Em 1440 e 390 px percorre
  todas as rotas (inclusive `/arsenal`) e aponta (leva ~11 min completo; `--rapido` corta os cliques): 404, link morto, link ou botão de navegação sem efeito, erro de
  console, rolagem horizontal, texto cortado sem reticências, fixo cobrindo conteúdo, rótulo quebrado, card órfão,
  rolagem dupla e alvo de toque < 40 px no celular (detectores do auditor do MIFT), cards da mesma linha de grid com
  alturas diferentes (2 px de tolerância), rótulos de eixo colidindo, elemento solto fora de superfície ou grupo
  (NAV-42) e quebra ruim (R$ separado do valor, controle em 2 linhas, palavra sozinha no fim do título, TOK-45); os estados `?estado=` de cada tela
  com dados e o "Tentar de novo"; as 4 combinações de tema e vidro; e a abertura (aparece, "Pular" funciona, nada
  longo com movimento reduzido). Sai com código 1 se achar problema. `--rapido` pula os cliques em botões.
- `node scripts/capturar.mjs --rotas ",pedidos/" --larguras 1440,390 --temas claro,escuro+vidro`: poucas capturas em
  `capturas/`. Opções: `--preset`, `--estado`, `--inteira`, `--abertura`.
- `node scripts/medir.mjs [url] [--lento 4]`: **velocidade, sempre no build** (`npm run build` antes). Mede a primeira
  pintura, o conteúdo com dados, a tela interativa e a casca no início, e a troca de página pela lateral (conteúdo com
  dados e tela interativa), mediana de 3. Metas: troca em até 300 ms e início interativo em até 1,5 s (sai com código 1
  se passar). `--lento 4` simula uma CPU 4× mais lenta. Números em ALTERACOES, "Desempenho".
- `node scripts/lab-interativos.mjs [url]`: arrasto real no quadro (`/pedidos/?vista=quadro`) e na agenda (`/agenda/`)
  com mouse, toque emulado (iPhone, eventos de toque pelo CDP) e teclado; confere que o item mudou de lugar, que o
  Desfazer volta e que a ação pessimista só move depois da confirmação. Sem URL, sobe o `astro preview` do build.
- `node scripts/quadro.mjs [url]`: gera as telas do quadro de fluxos (`/fluxos`).
- Gate do site (design-taste-frontend): `node <skill>/scripts/gate.mjs --start dist/site/index.html --root dist` e depois
  `node <skill>/scripts/gate.mjs`; as dispensas ficam em `.taste-skill/waivers.json` (fora do git).
- `node scripts/limpar-arsenal.mjs [--simular]`.
- `node scripts/modulos.mjs --listar` e `--manter <ids> [--simular] [--forcar]`: tira do starter os módulos que o
  protótipo não usa (pasta, rotas, coleções, linhas da MATRIZ), conferindo as dependências (`docs/contratos.md`, 5.1).
- `node scripts/gerar-docs.mjs [--conferir]`: regenera a tabela de módulos deste LEIAME a partir do registro.
- `node scripts/mapa-arsenal.mjs [import]`: que módulos e telas usam cada peça do arsenal (varredura dos imports; o
  `/arsenal` mostra o mesmo mapa em cada peça).

## Instalar componentes de registros

O `components.json` já tem `@react-bits`:

```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW --dry-run   # veja antes o que muda
npx shadcn@latest add @react-bits/SplitText-TS-TW
npx shadcn@latest add "https://21st.dev/r/<autor>/<componente>"
```

**Cuidado com `src/components/ui`:** um item de terceiros pode trazer `button`, `card` etc. como dependência e
substituir os do aria-nova. Rode sempre com `--dry-run` primeiro, **nunca** com `--overwrite`, e confira no git que
nada em `src/components/ui/` mudou; se mudou, desfaça o arquivo e adapte o componente novo às peças aria-nova
(`onPress`, `isDisabled`). O 21st recusa pedidos automáticos (403 no teste); o formato por URL é o da documentação
dele, não foi verificado aqui. O MCP do shadcn (`npx shadcn@latest mcp`) deixa o agente buscar e instalar itens
desses registros.
