# Alterações nos componentes de terceiros

Valem as de `vitrine/ALTERACOES.md` (ts-nocheck no finance-bento, `import type` no avatar e no button-1, export do
`GlassIconReveal`, `style={undefined}` na demo do finance-bento). No starter, por cima delas:

| Arquivo | Alteração | Por quê |
|---|---|---|
| `components/ui/card-reui.tsx` | É o `card.tsx` do autor do statistics-card-7, renomeado | `card.tsx` é o do aria-nova (MIFT). A demo do statistics-card-7 e o template kpis-operador importam `card-reui` |
| `components/ui/badge-2.tsx` | `Slot` do `radix-ui` trocado por um `Slot` mínimo local | Sem `radix-ui` no projeto |
| `button-1.tsx` e `avatar.tsx` do 21st | Removidos | Nenhuma demo nem template os usava; `avatar.tsx` agora é o do aria-nova |
| `components/ui/*` (MIFT) | `import { cn } from "cn"` virou `from "@/lib/utils"` | Alias padrão do shadcn; sem o pacote `cn` |
| `components/ui/sonner.tsx` | Sem `next-themes`: segue a classe `.dark` do `<html>` | Tema do starter |
| `styles/global.css` (MIFT) | `[data-skin="vidro"]` virou `[data-vidro="on"]` e foi para depois das skins; fonte pelo preset; imagem padrão do fundo "imagem" tirada | Vidro independente do tema; fonte por direção; nada com caminho `/` fixo |
| Fora do starter | `chart`, `resizable`, `input-otp`, `carousel`, `questionnaire`, `message-scroller`, `drawer` do aria-nova | Pedem recharts, react-resizable-panels, input-otp, embla, @shadcn/react ou @base-ui; copie do MIFT e instale a dependência quando precisar |
| `components/ui/button-variants.ts` | Tamanho `sm` no toque: mínimo de 40 px (era 36) | Regra da casa de alvo ≥ 40 px, conferida pelo navegar.mjs |

## Fase 1 (sistema visual)

| Arquivo | Alteração | Por quê |
|---|---|---|
| `components/ui/card.tsx` | Fundo, anel e sombra do aria-nova trocados pela classe `.sup` (nível `card`) e o raio por `--raio-sup` | O card nasce da Superficie: o material do preset em todo card |
| `components/ui/popover`, `dropdown-menu`, `select`, `dialog`, `alert-dialog`, `hover-card`, `sheet` | `bg-popover`, `ring-1` e `shadow-*` trocados por `.sup` + `data-nivel="flutuante"`; véu dos diálogos e do sheet tingido pelo tema | Camadas flutuantes no vidro mais denso do sistema |
| `components/ui/peak-chart.tsx` (21st) | Props novas `periodMenu` (esconde o menu de período do autor, de 23 px) e `introSpeed` (acelera a entrada de 3,3 s) | Alvo de toque de 40 px (segmentado de vidro fora do canvas) e entrada curta num painel |
| `components/movimento/GraficoQueDesenha.tsx` | Rótulos do eixo pela largura medida (~72 px cada, máx. 7); sem `figcaption` duplicado do `aria-label` | Rótulos colidiam ("03/1105/11") |
| `components/app/BarraFerramentas.tsx` | Vidro da casca (`.casca-fixa`), título em até 2 linhas, sem `truncate` | Título virava "…" no celular; texto sobre texto no cabeçalho fixo |
| `colecao/vidro-segmentado` (MIFT) | Copiado com `refracao` (desligada por padrão) e `cor` | Regra 3 do vidro: refração só em destaque e flutuante |
| `colecao/vidro-folha` (MIFT) | Copiado; tinta no véu do preset | Sheet de vidro com arrasto |
| `layouts/Base.astro` | `#fundo-ambiente`, `data-preset`, chave `proto-aparencia-v2`, padrão Noite escuro com vidro | Fundo ambiente fixo e presets novos antes da pintura |
| `pages/arsenal/*`, `arsenal/Palco.tsx` | Cards e palco na Superficie, cabeçalho em `.casca-fixa` | As demos aparecem sobre o fundo do preset atual |
| `components/app/Abertura.tsx` | O relógio da abertura começa no primeiro quadro pintado | Com a página pesada, a abertura sumia antes de aparecer e o "Pular" não era clicável |
| `components/ui/button-variants.ts` | Pressão em 0,96 (era 0,97) | Valor da casa para "botão afunda ao clicar" (better-ui) |
| `components/paginas/VisaoGeral.tsx` | Peak-chart só no escuro e só depois da abertura; no claro, o herói é o destaque claro com o gráfico SVG | O canvas do autor é escuro de origem: no claro ele virava um bloco colado na página |
| `components/app/Abertura.tsx`, `layouts/Base.astro` | A abertura virou camada estática do layout (logo e nome sobre o fundo do preset), 1,2 s, uma vez por aparelho; o `GlassIconReveal` saiu da abertura (continua no arsenal) | Duas fases com tela vazia no meio e 3,7 s em toda sessão |
| `components/app/AppShell.astro`, `BarraLateral`, `BarraSuperior`, `AbasInferiores` | Lateral a partir de `lg` (1024 px), não `md` | No iPad em retrato a lateral de 240 px espremia o banner |
| `components/ui/sheet.tsx`, `dialog.tsx` | "Close" do leitor de tela virou "Fechar" | pt-BR |
| `components/app/estados.tsx` | `ComDados` aceita `erro` (o erro com o cabeçalho e o gutter da tela); vazio e erro no material | O erro do início encostava na lateral |
| `arsenal/demos/statistics-card-7`, `finance-bento`, `market-card` | Dados da demo em pt-BR e R$ (os rótulos internos dos componentes do autor continuam como vieram) | Demos em inglês e dólar |
| `arsenal/templates/kpis-operador` | `min-w-0` nas colunas da grade | A tabela com rolagem lateral era cortada pela grade |
| `components/ui/badge-2`, `slider`, `metric-switcher-trend-chart-demo`, `arsenal/templates/relatorios/grafico-tendencia-ptbr` | Tiradas as classes `focus:outline-hidden` e `focus-visible:outline-none` | O anel de foco do sistema (`sistema.css`) vale em todo controle; nada apaga o contorno sem pôr outro no lugar |
| `components/movimento/GraficoQueDesenha.tsx` | Desenha na montagem, não ao entrar na tela | Entrada única no carregamento; nada se revela ao rolar |
| `components/movimento/EntradaEscalonada.tsx` | Só anima depois de montar; com movimento reduzido, os cards aparecem de uma vez | A mola de ~0,5 s rodava com movimento reduzido |
| `components/paginas/VisaoGeral.tsx` | O KPI-herói passou a ser SVG no nível destaque em todos os temas; o peak-chart saiu da tela | O canvas do autor desenha o próprio cartão: dentro do card do sistema virava moldura dupla |
| `components/paginas/Pedidos.tsx` | Título do card e cabeçalho das colunas no mesmo `<thead>` grudado; células do cabeçalho em vidro denso (90 %, desfoque de 20 px) | Duas faixas de tons diferentes encostadas e cabeçalho transparente ao rolar |
| `components/ui/peak-chart.tsx` | Campo, grade e halo em cache por tamanho | Cálculo pixel a pixel refeito a cada montagem |
| `astro.config.mjs` | `prefetch: { prefetchAll: true, defaultStrategy: "hover" }` | Troca de página mais rápida |

### Desempenho

Medido no build com `scripts/medir.mjs` (mediana de 3, 1440 px). "Antes" é o commit da fase 1 (8e021fb); "depois" é o
fim da fase 2 (módulos, quadro, agenda e site já dentro). A última coluna é a leitura de estresse com a CPU 4× mais
lenta (`--lento 4`, uma rodada).

| Medida | Antes | Depois | CPU 4× (antes → depois) |
|---|---|---|---|
| Início: conteúdo com dados na tela | 616 ms (esperava a hidratação) | 80 ms (na primeira pintura) | 7.265 → 597 ms |
| Início: tela interativa | 640 ms | 310 ms | 7.341 → 1.435 ms |
| Troca para Pedidos (conteúdo com dados) | 371 ms | 93 ms | 5.852 → 548 ms |
| Troca para Clientes | 198 ms | 87 ms | 2.392 → 428 ms |
| Troca para Visão geral | 230 ms | 64 ms | 3.002 → 287 ms |
| Troca para Agenda (nova) | — | 69 ms | 296 ms |

Metas (máquina normal): troca em até 300 ms e início interativo em até 1,5 s, **atingidas**. Na leitura de estresse,
a troca para Pedidos e OS ainda passa de 300 ms (a lista hidrata 52 linhas em tabela e em cartões).
O que mudou: dados no HTML do servidor (`useDados` e depois `colecao.use()` devolvem a semente no servidor); sem a tela
de carregamento; entrada animada só sob a abertura (`src/lib/entrada.ts`); casca em `client:idle` com o item ativo do
servidor; banner decidido em CSS (`html[data-banner]`); folha de detalhe, diálogos, busca (Ctrl K), quadro (@dnd-kit) e
sheets das ações em pedaços sob demanda; menu "⋯" de cada linha nasce como botão simples (`MenuDaLinha`).
O dev server (`npm run dev`) é naturalmente mais lento (módulos sem empacotar); ganhou `optimizeDeps` e `warmup`.

## Fase 2 (base do ERP, transplantes e pendências)

### Contratos da base (decisões D1 a D10 da especificação)

| Arquivo | Alteração | Por quê |
|---|---|---|
| `proto/dados.ts` | Reescrito: coleções declaradas por módulo (`colecao()`, semente = hash do nome + 7, Park-Miller), `acao()` com `modo` otimista ou pessimista, `conferir` (versão), `capacidade` (papel), `Resultado` com motivo e mensagem; `useProcessando`, `evento`, `proximoId`, `marcarAberto`, `mudarComoOutraPonta`, `outraPessoaMexe`; sincronização entre abas pelo evento `storage`; `useDados()` e o tipo `Dados` únicos saíram | D1, D2, D3, D7, D10; dados no HTML do servidor |
| `proto/relogio.ts` (novo) | `agora()`, `useAgora()`, `avancarRelogio()`: fixo no servidor, anda depois da hidratação | D9 |
| `proto/permissoes.ts` (novo) | Matriz da seção 2, `pode()` com contexto (próprias, unidade, etapa, valor), papel ativo trocável (barra F e `?papel=`) | D4 |
| `proto/projecao.ts` (novo) | Rótulos e frases do cliente de todos os estados da seção 3, conflitos, `paraOCliente()` | D5, D6 |
| `proto/negocio.ts` (novo) | Empresa, unidades, feriados, expediente, serviços, equipe, recursos | seção 1 |
| `modulos/registro.ts`, `integracoes/modulos.mjs` (novos) | Registro lido por `import.meta.glob`; rotas injetadas a partir de `src/modulos/<id>/paginas/` | nenhum módulo edita o arquivo de outro |
| `proto/navegacao.ts`, `components/app/status.tsx`, `components/paginas/acoes.ts` | Removidos | substituídos pelo registro, pela projeção e pelas ações dos módulos |
| `components/base/*` (novos) | `TabelaDados`, `CabecalhoPagina`, `BarraFerramentas` + `useParametrosDaUrl`, `FolhaDeDetalhe`, `DialogoConfirmar`, `MenuDaLinha`, `SeloEixo`/`FraseDoCliente`, `LinhaDoTempo`, `Cortado`/`Email` | peças comuns da 5.0 |
| `components/app/estados.tsx` | `ComDados` com `capacidade`, `EstadoSemPermissao`, `EstadoVazio` em 3 variantes, textos padrão da 5.0 | estados da especificação |
| `proto/BarraPrototipo.tsx` | Ver como (papel), relógio com avanço, simular a outra ponta | D4, D9, D10 |
| `components/app/BarraLateral`, `AbasInferiores`, `BarraSuperior`, `Busca.tsx`, `Mais.tsx` | Navegação, abas (4 + "Mais"), Ctrl K e sino lidos do registro e filtrados pelo papel; busca em pedaço à parte | registro e desempenho |
| `pages/*` → `modulos/<id>/paginas/*` | Início, Pedidos, Nova OS, Clientes, Configurações e Aparência viraram módulos | fase 2 |
| Domínio | Os pedidos genéricos viraram ordens de serviço da especificação (etapas, orçamento, pagamento, histórico, versão); clientes com documento, endereço, etiquetas e estado; agendamentos | seções 3 e 4 |

### Transplantes

| Origem | Destino | Ajuste |
|---|---|---|
| `sb-interativos/src/components/interativos/{QuadroInterativo,AgendaInterativa,comum}.tsx`, `interativos.css` | `src/components/interativos/` | sem mudança |
| `QuadroOS.tsx` | `modulos/pedidos/telas/QuadroOS.tsx` (`/pedidos/?vista=quadro`, carregado sob demanda) + `AcoesOS.tsx` | sheets de agendar, orçar e concluir em **modo pessimista**; erro da ação (falha, conflito, permissão) dentro da sheet |
| `AgendaOficina.tsx` | `modulos/agenda/telas/AgendaOficina.tsx` (`/agenda/`) | cabeçalho pelo `CabecalhoPagina`; criar agendamento pessimista |
| `proto/dados-interativos.ts` | `modulos/pedidos/dados.ts` e `modulos/agenda/dados.ts` | coleções próprias; ids sorteados da agenda a partir de AG-2001 (os sorteados colidiam com os fixos) |
| `scripts/lab-interativos.mjs` | `scripts/` | rotas novas; sobe o `astro preview` sozinho; rola o cartão até aparecer e solta no fim visível da coluna; troca de vista pelo papel "radio" do segmentado |
| `sb-site`: `src/proto/site.ts`, `src/components/site/`, `src/pages/site/` | os mesmos caminhos | o script de aparência do `SiteLayout` também põe `data-banner` |

### Pendências da fase 1

| Arquivo | Alteração | Por quê |
|---|---|---|
| `components/sistema/BannerSobreposto.tsx`, `styles/sistema.css`, `layouts/Base.astro`, `proto/aparencia/aparencia.ts` | O modo do banner (shader, plano, aberto) virou CSS sobre `html[data-banner]`, posto antes da pintura | com a tela renderizada no servidor, o banner do Sóbrio e do Vidro mudava de forma ao hidratar |
| `lib/entrada.ts` (novo), `components/movimento/{EntradaEscalonada,TextoRevelado,NumeroAnimado,GraficoQueDesenha}.tsx` | Modo `entrada="abertura"` (padrão): o HTML do servidor já é o estado final; a entrada só toca sob a abertura. As demos do arsenal usam `entrada="sempre"` | o conteúdo não espera o JavaScript para aparecer |
| `layouts/Base.astro`, `proto/BarraPrototipo.tsx` | Sem a tela de carregamento; barra F e avisos em `client:idle` | não há o que esperar: os dados estão no HTML |
| `components/app/AppShell.astro` | Casca em `client:idle`, item ativo vindo do servidor | a tela hidrata primeiro |
| `astro.config.mjs` | `optimizeDeps` e `server.warmup` | dev server mais rápido na primeira abertura |
| `scripts/medir.mjs` | Mede pintura, conteúdo com dados, tela interativa e casca; troca até o conteúdo e até a tela interativa; mediana de 3; `--lento 4` | as medidas antigas misturavam a troca com a hidratação |
| `scripts/navegar.mjs` | "Pular" sem `force` (acusa se o clique não chega); teste do cabeçalho fixo da tabela que rola e compara os pixels do cabeçalho e do vão abaixo da barra | pendências da fase 1 |
| `modulos/clientes/telas/Clientes.tsx`, `components/base/texto.tsx` | E-mail numa linha com reticências e o endereço inteiro no title | o e-mail quebrava no meio de ".com.br" |
| `modulos/inicio/telas/VisaoGeral.tsx` | "A receber" = OS prontas não pagas; "vencidos" = as que passaram do prazo | "Vencidos" era igual a "A receber" no pior caso |
| Avisos `<Focusable>` do React Aria | Recontados no dev server (passando o ponteiro em todo botão e abrindo todo menu, nas rotas do app e do arsenal, 1440 e 390 px, lateral aberta e recolhida): **0** | pendência da fase 1 |
| `arsenal/demos/*`, `arsenal/catalogo.ts`, `components/ui/{adjustable-glass-dashboard,metric-switcher-trend-chart-demo,market-card,market-snapshot,peak-chart,finance-bento,stats-card-2,stats-bento,liquid-glass-navbar,liquid-glass-logo-reveal,statistics-card-7}.tsx` (21st) | Textos internos dos componentes do autor em pt-BR (rótulos, títulos, legendas, períodos, rótulos de acessibilidade), moeda padrão BRL, números e datas pelo Intl pt-BR, CSV com ponto e vírgula; props novas com padrão em pt-BR onde o texto era fixo (`market-snapshot`: `title`, `symbol`, `updatedText`, `sourceText`; `stats-card-2`: `title`, `dominanceTitle`, `chartLabel`, `currency`, `marketCap` no lugar de `marketCapUSD`); `finance-bento` sem o seletor USD/EUR | As demos mostravam inglês e dólar nos próprios componentes |
| `modulos/portal/` (novo) | `/portal/` como porta de entrada honesta do portal (ainda não construído), na casca do site | os botões do site apontavam para `/portal/` e davam 404 |
| `scripts/navegar.mjs` | No site público (`html[data-site]`) o "elemento solto" e a "palavra sozinha no título" não valem (as regras de site são as da design-taste-frontend, conferidas pelo gate dela); link "Pular para o conteúdo" de 1×1 px não conta como alvo de toque | falsos positivos |
| `components/interativos/AgendaInterativa.tsx` | `data-grupo` na grade e `title` com o texto inteiro em cada bloco | NAV-42 e reticências sem o texto inteiro |
| Passada de refinamento (Impeccable `critique` e `polish`) | Colunas da lista de OS, ações do banner numa linha no desktop, "Hoje" da agenda legível (marcado, não desabilitado), "Cancelar a OS" discreto na folha, margem só com total, total dos itens, selo de atraso também no cliente, contagem "N OS" na lista de clientes, nome longo em até 2 linhas, vazio de filtro "Nenhuma OS encontrada: …", "Mudança desfeita.", título no card do gráfico, link da atenção do dia que diz para onde vai, moldura dupla tirada de Clientes e da folha do sistema | achados da crítica (nota no `docs/rubrica-10.md`) |

### Pendências da base (fase 2)

| Arquivo | Alteração | Por quê |
|---|---|---|
| `components/ui/sheet.tsx` (`SheetFooter`), `components/base/FolhaDeDetalheCorpo.tsx`, `modulos/pedidos/telas/{AcoesOS,DetalheOS}.tsx`, `modulos/agenda/telas/AgendaOficina.tsx`, `components/interativos/QuadroInterativo.tsx`, `docs/contratos.md` | Uma ordem só: no código, a secundária ("Cancelar", "Voltar", a destrutiva discreta) vem antes da principal; lado a lado a principal fica à direita, empilhado no celular fica em cima (`flex-col-reverse`, como o `DialogFooter`). "Cancelar" das sheets em `ghost`, como nos formulários | as sheets de ação punham a principal antes do "Cancelar", ao contrário dos formulários e do `DialogoConfirmar` |
| `components/base/CabecalhoPagina.tsx`, `modulos/agenda/telas/AgendaOficina.tsx` | No celular o segmentado de vistas ocupa só a largura dos rótulos e divide a faixa com as ações; na Agenda, "Novo agendamento" vai para o fim da faixa de vidro dos recursos. O cabeçalho da Agenda a 390 px cai de três faixas para duas (banner de 265 para 217 px); Pedidos põe vistas e "Nova OS" numa linha | NAV-41/NAV-42: o cabeçalho da agenda empurrava a grade para baixo da dobra |
| `lib/tema.ts`, `lib/formato.ts`, `proto/dados.ts`, `proto/relogio.ts`, `components/base/BarraFerramentas.tsx`, `modulos/pedidos/telas/Pedidos.tsx` | Cor do tema lida do estilo da raiz (sem sonda no `<body>`) e depois da pintura; um `Intl.DateTimeFormat` por formato; a hidratação não renderiza a tela de novo (config, pendentes e processando vazios são o mesmo objeto do servidor, o relógio não notifica ao ligar, a URL igual não troca o estado, `useAgora` em memo); `setF` estável e a lista de Pedidos em `memo` | a troca para Pedidos com CPU 4× passava de 300 ms: no perfil, a sonda de cor forçava ~500 ms de recálculo de estilo e as datas ~75 ms |
| `scripts/quadro.mjs`, `public/quadro/` | Quadro de fluxos regerado no domínio novo (9 fluxos: início, pedidos, quadro, nova OS e o ramo de erro, agenda, clientes, celular e o ramo do filtro vazio). O fluxo do início toca na OS-1011 (a primeira da atenção espera peça e não tem "Mover para"); no celular o "Só atrasadas" vai pelo teclado (a barra fixa cobria o clique) | `/fluxos` mostrava as telas antigas |
| `components/interativos/{AgendaInterativa.tsx,interativos.css}`, `modulos/agenda/telas/AgendaOficina.tsx`, `components/base/{FolhaDeDetalheCorpo,CabecalhoPagina}.tsx`, `components/app/BarraSuperior.tsx`, `docs/rubrica-10.md` | Reavaliação do Impeccable depois do polish (nota no `rubrica-10.md`) e os achados P1/P2 da base: blocos em conflito com nome e selo curto, rolagem inicial na hora cheia, "Hoje" sem fundo no escuro, blocos em `oklab`, rodapé da folha grudado no celular, contador do sino fora do ícone, contagem do cabeçalho sem quebra | achados da crítica |
