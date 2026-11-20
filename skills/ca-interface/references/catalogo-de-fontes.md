# Catálogo de fontes de referência

Arquivo de dados: as fontes conhecidas, com categoria, acesso, custo, licença, estado e data da checagem. Não tem regras nem IDs; o protocolo, os critérios e as regras legais estão em `referencias-e-bom-gosto.md`. Fontes mudam rápido (Godly virou Recent, chaves do Magic MCP foram resetadas em 2026): **trate qualquer linha com mais de 6 meses como a reconferir** antes de depender dela.

"Fonte" tem dois sentidos aqui: **origem de referência** (a tabela principal) e **família tipográfica** (a seção "Fontes de texto livres", categoria G).

Legenda:
- **Categoria**: A telas e fluxos de produto real · B landing e marketing · C componentes com código · D movimento e shaders · E fotos e moodboards · F ícones · G famílias tipográficas (fontes de texto).
- **Acesso**: MCP oficial · API oficial · só navegação (pessoa no navegador embutido ou o usuário manda links) · **evitar via MCP** (os MCPs existentes não são oficiais e usam endpoint interno ou token do usuário).
- **Checado**: mês da última verificação. **"não verificado"** quer dizer que a linha vem de fonte secundária ou de memória e precisa ser conferida antes do uso; não a apresente como fato.

## Tabela

| Fonte | Cat. | Para que serve | Acesso | Custo | Licença do que entrega | Estado | Checado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Mobbin** (mobbin.com) | A | fluxos e telas de apps lançados, iOS, Android e web: rastreio, checkout, inbox, admin | **MCP oficial** remoto (`https://api.mobbin.com/mcp`, OAuth); ferramentas de busca de telas, fluxos e seções | provavelmente pago (só um concorrente afirma; **não verificado**); avisou de uso alto no mês depois de ~16 chamadas | só inspiração; link para `mobbin_url`; não redistribuir imagens (URLs expiram) | ativo; MCP lançado em mai/2026; termos não lidos (403) | nov/2026 |
| **Refero** (refero.design) | A | telas e fluxos web e iOS, SaaS; camadas sites, styles, screens, flows | **MCP oficial** (`https://api.refero.design/mcp`, OAuth ou token) | **plano pago** (Pro, Team ou Lifetime); teto mensal de chamadas por usuário | só inspiração | ativo; mais recomendado para telas web e SaaS em comparativos de 2026 | nov/2026 |
| **Page Flows** (pageflows.com) | A | fluxos gravados em vídeo com anotação passo a passo (iOS, Android, web, e-mail) | só navegação, com a conta do usuário; sem API nem MCP | sem plano grátis; anual ~US$ 99 | só inspiração | ativo; absorveu o Screenlane | nov/2026 |
| **NicelyDone** | A | telas e fluxos de SaaS web | só navegação | grátis limitado; plano pago | só inspiração | ativo (dado de comparativo de concorrente) | nov/2026, fonte secundária |
| **SaaSframe** | A | telas e fluxos de SaaS (foco presumido) | só navegação (presumido) | **não verificado** | só inspiração (presumido) | **não verificado** | — |
| **21st.dev** | C | componentes React/Tailwind da comunidade, compatíveis com shadcn; geração por IA | **MCP/CLI oficial** com chave de API (`npx @21st-dev/cli@latest init`); REST com OpenAPI | grátis: busca + **2 retiradas por dia**; planos pagos; geração paga | **sem licença única: conferir por componente** | ativo; o antigo "Magic MCP" virou 21st MCP, chaves antigas resetadas | nov/2026 |
| **shadcn/ui** (registry e MCP) | C | blocos de app, componentes base; porta para registries de terceiros (React Bits, Canvas UI e outros) | **MCP oficial** (`shadcn mcp init --client <cliente>`); CLI `npx shadcn add @registry/item` | grátis | código aberto; registries de terceiros têm licença própria, revisar código ao instalar | ativo; diretório oficial de registries embutido na CLI | nov/2026 |
| **Origin UI** | C | componentes copy-paste sobre shadcn/Tailwind | só navegação e cópia | grátis | MIT segundo fonte secundária; **conferir LICENSE** | **não verificado** se continua autônomo em 2026 | nov/2026, fonte secundária |
| **Magic UI** | C/D | componentes animados para landing | só navegação e cópia; registry shadcn (presumido) | grátis; templates Pro pagos | MIT segundo fonte secundária; **conferir LICENSE** | ativo (fonte secundária) | nov/2026, fonte secundária |
| **Aceternity UI** | C/D | componentes animados para landing | só navegação e cópia | fontes conflitam: grátis com templates pagos × licença All-Access paga | **não verificado: conferir por componente** | ativo (fonte secundária) | nov/2026, fonte secundária |
| **React Bits** (reactbits.dev) | D | texto animado, animações, fundos; landing e onboarding | via shadcn MCP/CLI (`@react-bits/...`) ou jsrepo | grátis | **MIT + Commons Clause** | ativo | nov/2026 |
| **Canvas UI** (canvasui.dev) | D | efeitos WebGL/WebGPU sobre HTML vivo; completo só no Chrome 157+, com fallback | via shadcn MCP/CLI (`@canvas-ui/...`) | grátis | **MIT + Commons Clause** | ativo | nov/2026 |
| **shaders.com** | D | componentes de shader para React, Vue e Svelte; gradientes e efeitos de landing | **a verificar** (API, MCP ou só pacote e site) | biblioteca comercial com plano Pro pago | **a verificar antes de copiar qualquer código** | ativo; o usuário confirmou que é esta a fonte (não "shaders.co", que não resolve) | nov/2026, parcial |
| **Paper Shaders** (shaders.paper.design) | D | gradientes, noise, padrões, filtros de imagem em WebGL2 | pacote npm `@paper-design/shaders-react`; `llms.txt` | grátis | **PolyForm Shield**; fixar versão exata (0.0.x) | ativo; alternativa aberta ao shaders.com | nov/2026 |
| **LottieFiles** | D | animações leves (vetoriais) | **MCP oficial** grátis (`https://mcp.lottiefiles.com/mcp`) | grátis | **conferir por animação** | ativo | nov/2026 |
| **Recent** (recent.design, antigo Godly) | B | sites e marketing em vídeo curto: scroll, transições; landing, OG images | só navegação | grátis para navegar | só inspiração | `godly.website` redireciona (301) para recent.design; sem anúncio oficial do rebrand | nov/2026 |
| **Land-book** | B | landing, preço, cadastro, carreiras | só navegação; **bloqueia fetch automatizado (403)** | grátis limitado; Pro pago (valores de terceiros) | só inspiração | ativo | nov/2026 |
| **Awwwards** | B | sites premiados; marca e movimento | só navegação (presumido) | **não verificado** | só inspiração | **não verificado** | — |
| **Behance** | B | portfólios; trabalho conceitual | só navegação (presumido) | **não verificado** | só inspiração | **não verificado** | — |
| **Muzli** | B | curadoria de inspiração | só navegação (presumido) | **não verificado** | só inspiração | **não verificado** | — |
| **Dribbble** | B | direção estética; shots conceituais, não produto lançado | só leitura pontual com link; **termos proíbem scraping e robôs** e copiar conteúdo; API oficial não faz busca global | grátis | não copiar nem reproduzir | ativo; termos de 17/03/2025 | nov/2026 |
| **Cosmos** (cosmos.so) | E | moodboards visuais, fotografia | **evitar via MCP** (o único usa endpoint privado e o token do usuário); só navegação | — | só moodboard; sem licença de reuso | termos não lidos (página vazia) | nov/2026 |
| **Pinterest** | E | moodboards, fotografia, estilo | **evitar via MCP** (API oficial não busca no índice global; os outros usam endpoints internos); só navegação | — | só moodboard; sem licença de reuso | termos não lidos | nov/2026 |
| **Figma Community** | C/E | arquivos e kits de UI da comunidade | só navegação (presumido) | **não verificado** | licença por arquivo (presumido) | **não verificado** | — |
| **Unsplash** | E | fotos para protótipo e produto | **API oficial**; MCPs só comunitários, com a chave do próprio usuário | grátis | uso comercial; pela API, crédito (fotógrafo + Unsplash, com link) e hotlink obrigatórios | ativo | nov/2026 |
| **Pexels** | E | fotos para protótipo e produto | **API oficial**; MCPs comunitários | grátis | uso comercial; pela API, crédito obrigatório | ativo | nov/2026 |
| **Lucide** | F | ícones de traço uniforme | pacote npm (`lucide-react`); MCP desnecessário | grátis | ISC | ativo | nov/2026 |
| **Phosphor** | F | ícones em vários pesos | pacote npm (`@phosphor-icons/react`); MCP só comunitário | grátis | MIT | ativo | nov/2026 |
| **Iconify** | F | agregador de 200+ sets | API pública; MCPs só comunitários | grátis | **licença por set**: conferir o set escolhido | ativo (fonte secundária) | nov/2026, fonte secundária |

Outras vistas na pesquisa, fora da lista do usuário: Lazyweb (A, declara MCP grátis; auto-descrição de concorrente, não verificada), ScreensDesign (A, iOS, absorveu o UI Sources), Collect UI (A, telas conceituais), Lapa Ninja (B), Untitled UI React (C, MIT na versão aberta), HyperUI (C, MIT segundo agregador), Kibo UI (C, registry shadcn), Rive (D, MCP oficial exige o editor aberto). UX Archive está morto (404 em out/2026).

## Fontes de texto livres

Origens de famílias tipográficas (categoria G) para a busca de `direcao-e-personalidade.md` PER-18. Os critérios (licença, acentos do português, números tabulares onde há dados, fonte variável, hospedagem no projeto) e o orçamento estão em `fundamentos-e-tokens.md` TOK-13 e TOK-33; aqui ficam onde procurar, a licença e como trazer a família para o projeto. A licença que vale é a que acompanha o **arquivo da família** (`OFL.txt`, `LICENSE`), não o rodapé do site: confira-a ao instalar e registre-a na DEC ou no relatório (`stack-e-bibliotecas.md` STK-23). Nenhuma família é proibida; família paga ou de assinatura só entra com autorização do usuário.

| Origem | O que tem | Licença | Como usar no projeto | Custo | Checado |
| --- | --- | --- | --- | --- | --- |
| **Google Fonts** (fonts.google.com) | mais de 1.700 famílias (contagem informada pelo usuário, não reconferida), com filtro por categoria, idioma e eixo variável; a maior origem de variáveis com `wght`, `wdth` e `opsz` | OFL na grande maioria; algumas Apache 2.0 e Ubuntu Font Licence; ver a licença de cada família | no build, **não** carregue de `fonts.googleapis.com` (dependência externa e privacidade): instale pelo Fontsource (linha abaixo) | grátis | nov/2026, de memória (site não reaberto) |
| **Fontsource** (fontsource.org) | pacotes npm de fontes abertas: o acervo do Google Fonts e outras famílias abertas (presumido) | a da família de origem | `npm i @fontsource-variable/<família>` (variável, recomendado: uma importação cobre a faixa de pesos) ou `@fontsource/<família>` (estático: importar cada peso, `@fontsource/<família>/600.css`; o itálico é importação à parte). O CSS usa `unicode-range`, e o navegador baixa só os subconjuntos usados (latin e latin-ext cobrem o português). Em **Astro**, a API de fontes: `fontProviders.fontsource()` em `fonts` no `astro.config.mjs`, com `name`, `cssVariable` e, na variável, faixa de peso (`weights: ["300 700"]`) e `fallbacks`; `<Font cssVariable="--font-x" preload />` de `astro:assets` no `<head>` (preload só no que aparece acima da dobra); com Tailwind, `--font-sans: var(--font-x)` no `@theme inline`. Os arquivos saem em `_astro/fonts`, servidos pelo próprio site | grátis | nov/2026 (instalação do Fontsource e guia de fontes do Astro lidos; versão do Astro em que a API ficou estável **não verificada**: confira a instalada) |
| **Fontshare** (fontshare.com, da Indian Type Foundry) | grotescas e displays contemporâneas de catálogo próprio: Satoshi, General Sans, Clash Display, Cabinet Grotesk, Switzer, além de serifadas | ITF Free Font License, divulgada como gratuita inclusive para uso comercial; os termos de redistribuição e de embutir **não foram reconferidos** (a página exige JavaScript e não abriu nesta redação) | baixe o pacote da família, guarde a licença junto e sirva como arquivo local (`fontProviders.local()` no Astro, ou `@font-face` com `woff2` em `src/assets/fonts/`); a CSS API do site carrega de servidor externo e fica para protótipo descartável | grátis | nov/2026, **licença não verificada** |
| **Velvetyne** (velvetyne.fr) | fundição libre francesa; displays experimentais e de caráter forte | majoritariamente OFL (**conferir por família**) | arquivo local; bom para título e momento de marca, raramente para texto de tabela | grátis | **não verificado** |
| **Collletttivo** (collletttivo.it) | coletivo italiano de tipografia aberta; displays e grotescas | majoritariamente OFL (**conferir por família**) | arquivo local | grátis | **não verificado** |
| **Open Foundry** (open-foundry.com) | curadoria editorial de famílias abertas | OFL nas famílias listadas (presumido; **conferir**) | arquivo local, ou Fontsource se a família estiver lá | grátis | **não verificado** |
| **The League of Moveable Type** (theleagueofmoveabletype.com) | fundição aberta pioneira: League Spartan, League Gothic e outras | OFL | várias estão no Google Fonts e portanto no Fontsource; as outras, arquivo local | grátis | de memória, **não verificado** |
| **Uncut.wtf** | **catálogo** (não fundição) de fontes livres contemporâneas, com link para a origem de cada uma | **varia por família**: abra a licença na origem | para achar candidatas fora do Google Fonts; a instalação segue a origem | grátis | **não verificado** (a página "about" deu 404 nesta redação) |
| **Font Squirrel** (fontsquirrel.com) | curadoria de fontes gratuitas para uso comercial; gerador de webfont | **varia por família** (OFL ou licença da fundição); use o gerador só em família cuja licença permite embutir na web | arquivo local | grátis | **não verificado** |
| **Bunny Fonts** (fonts.bunny.net) | espelho do acervo do Google Fonts, sem rastreamento e sem log (empresa na UE); API compatível com a CSS v1 do Google (troca do host `fonts.googleapis.com/css` por `fonts.bunny.net/css`) | a da família de origem | HTML autocontido e protótipo descartável quando não dá para instalar (STK-05); no build, prefira Fontsource; o Astro também tem provedor Bunny na API de fontes | grátis | nov/2026 (página "about" lida) |
| **Adobe Fonts** (fonts.adobe.com) | acervo grande de fundições comerciais | **assinatura** Creative Cloud; na web, projeto hospedado pela Adobe enquanto a assinatura existir, sem auto-hospedagem (presumido) | **só com autorização do usuário** (serviço pago, STK-23); registre que a fonte deixa de carregar se a assinatura acabar | pago | de memória, **não verificado** |
| **Pangram Pangram** (pangrampangram.com) | grotescas e serifadas contemporâneas muito usadas em marca (Neue Montreal, Editorial New) | arquivos de teste gratuitos para uso pessoal; **uso comercial exige licença paga** | **só com autorização do usuário** e com a licença comprada para o uso (web, app); arquivo de teste nunca vai para produto | pago para uso comercial | de memória, **não verificado** |

### Pontos de partida por caráter

Exemplos para abrir a busca, não lista fechada nem recomendação; quase todos do Google Fonts (OFL), citados de memória. Confira no Fontsource os pesos, os eixos, os números tabulares e os acentos (TOK-33) antes de propor.

- **Grotesca neutra e técnica:** IBM Plex Sans, Geist, Instrument Sans, Hanken Grotesk, Schibsted Grotesk; Inter continua válida quando ganha a comparação (PER-18). Fontshare: Switzer, General Sans, Satoshi.
- **Humanista e calorosa:** Figtree, Source Sans 3, Nunito Sans.
- **Condensada e de sinalização:** Archivo (eixo `wdth`), Barlow Condensed, Saira (eixo `wdth`).
- **Expressiva para título:** Bricolage Grotesque (eixos `opsz` e `wdth`), Space Grotesk, Syne, Unbounded. Fontshare: Clash Display, Cabinet Grotesk. Velvetyne e Collletttivo para display de caráter forte.
- **Serifada de texto e editorial:** Source Serif 4, Newsreader, Literata, Fraunces (eixos `opsz`, `SOFT`, `WONK`).
- **Mono para códigos e números:** JetBrains Mono, IBM Plex Mono, Geist Mono, Martian Mono (eixo `wdth`).

### Conferir uma família em cinco minutos

1. **Licença** no arquivo baixado ou no pacote (`LICENSE`, `OFL.txt`); anote-a para a DEC.
2. **Acentos**: renderize "Ação, opções, São João, R$ 1.234,56 — nº 0" em cada peso usado, em caixa alta e baixa; nenhum glifo pode cair no fallback.
3. **Números tabulares**: ligue `font-variant-numeric: tabular-nums` e veja se os dígitos ficam da mesma largura; o Wakamai Fondue (wakamaifondue.com) lista os recursos OpenType do arquivo (ferramenta não reaberta nesta redação).
4. **Variável e eixos**: prefira `@fontsource-variable/<família>`; anote os eixos (`wght`, `wdth`, `opsz`) que a direção vai usar.
5. **Peso**: some os `woff2` de latin e latin-ext dos estilos usados contra o orçamento de TOK-13.

## Atalhos por tipo de tela

- **Operador, ERP, CRM, dashboards**: Refero (telas web), Mobbin (web), NicelyDone, Page Flows; código em shadcn.
- **Loja e app do cliente**: Mobbin (fluxos iOS e web), Page Flows, Refero (fluxos).
- **Chat e notificações**: Mobbin (fluxos de suporte e preferências).
- **Landing e marketing**: Recent, Land-book, Refero (sites); movimento em React Bits, Magic UI, Canvas UI, shaders.
- **Fotos**: Unsplash, Pexels. **Ícones**: o pacote já instalado.
- **Tipografia**: Google Fonts pelo Fontsource, Fontshare, Uncut.wtf como catálogo; seção "Fontes de texto livres".

## Como descobrir fontes novas

1. **Registros de MCP**: procure "<categoria> MCP" no registro oficial (registry.modelcontextprotocol.io) e no registro do GitHub (github.com/mcp), que mostra o dono pelo namespace (ex.: `com.mobbin/mobbin`). Prefira o namespace do próprio domínio.
2. **Código**: consulte o diretório de registries do shadcn (embutido na CLI; índice em ui.shadcn.com/r/registries.json) antes de buscar na web.
3. **Galerias**: cruze pelo menos 2 comparativos de autores diferentes. Comparativos "melhores alternativas a X" costumam ser escritos por concorrentes, e o próprio Mobbin admite esse viés.
4. **Conferir no site**: o domínio ainda é o produto (sem redirecionar para outro)? Há `llms.txt`, documentação, termos, preço? Os termos permitem acesso automatizado?
5. **Avaliar** pelos sete critérios de `referencias-e-bom-gosto.md` e **registrar** aqui uma linha com a data e o que ficou sem verificar.

Sinais de alerta:
- MCP com o nome do site, mas de outro autor (diretórios comunitários como Glama, mcpservers.org, LobeHub, Smithery e mcp.so misturam oficiais e não oficiais; há vários "Refero MCP").
- Repositório arquivado (o `pdcolandrea/mobbin-mcp` remete ao oficial).
- Ferramenta que promete "contornar restrições" ou pede o token da sua sessão no site.
- Licença ausente no repositório.
- Domínio que redireciona para outro produto.

Linha nova, modelo:
`| Nome (domínio) | Cat. | para que serve | acesso | custo | licença | estado | mês/ano (o que não foi verificado) |`

## Fontes da checagem
- Mobbin MCP — https://github.com/mobbin/mobbin-mcp-server · lançamento — https://www.businesswire.com/news/home/20260511053592/en/
- Refero MCP — https://doc.refero.design/mcp/getting-started.md
- 21st.dev — https://21st.dev/llms.txt
- shadcn MCP e diretório — https://ui.shadcn.com/docs/mcp · https://ui.shadcn.com/docs/directory
- React Bits — https://github.com/DavidHDev/react-bits · Canvas UI — https://canvasui.dev
- shaders.com — https://shaders.com/ · Paper Shaders — https://www.mintlify.com/paper-design/shaders/introduction
- LottieFiles MCP — https://lottiefiles.com/mcp
- Page Flows — https://pageflows.com · Recent — https://recent.design
- Dribbble Terms — https://dribbble.com/terms
- Cosmos MCP comunitário — https://glama.ai/mcp/servers/mrmos/cosmos-mcp · Pinterest (API) — https://composio.dev/toolkits/pinterest.md
- Unsplash — https://help.unsplash.com/api-guidelines/guideline-attribution · Pexels — https://help.pexels.com/hc/en-us/articles/900005852323
- Comparativo (concorrente) — https://mobbin.com/blog/best-mobbin-alternatives
- Registro MCP — https://registry.modelcontextprotocol.io/
- Tipografia — Fontsource, instalação: https://fontsource.org/docs/getting-started/install · Astro, fontes: https://docs.astro.build/en/guides/fonts/ · Bunny Fonts: https://fonts.bunny.net/about (lidos em nov/2026) · Fontshare: https://www.fontshare.com/ (licença não lida, página exige JavaScript) · Uncut.wtf: https://uncut.wtf/ ("about" em 404) · SIL OFL: https://openfontlicense.org/ (não reaberto)
