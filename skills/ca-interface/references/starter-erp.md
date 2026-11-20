# Starter ERP: como começar um protótipo

Resumo do starter do arsenal para quem vai usá-lo. A fonte completa é `assets/arsenal/starter/docs/contratos.md` (APIs, exemplo de módulo, o que é de quem) e o `assets/arsenal/starter/LEIAME.md` (pontos de troca, presets, scripts). Se este resumo divergir deles, valem eles. As regras que a skill cobra sobre o starter estão em `arsenal.md` (ARS-11 a ARS-13), `stack-e-bibliotecas.md` (STK-02, STK-28, STK-29), `prototipo-e-aprovacao.md` (PRO-11, PRO-23, PRO-26) e `verificacao.md` (VER-34 a VER-36).

## Sumário

1. O que é
2. Começar um protótipo
3. APIs que importam
4. Peças de base
5. Os quatro scripts antes de mostrar
6. Metas de desempenho

## 1. O que é

- Um **ERP modular só de front-end**: o ERP fictício "Oficina Norte", com dados falsos no navegador e sem banco. Astro 7 com ilhas React 19, Tailwind 4, shadcn no estilo aria-nova (React Aria, base do MIFT UI), lucide-react, motion e sonner.
- **13 módulos** da especificação (Entrada, Início, Pedidos e OS, Agenda, Clientes, Estoque, Financeiro, Relatórios, Mensagens, Equipe, Configurações, Portal do cliente, Site). Cada um mora em `src/modulos/<id>/` e é exemplo: fica o que o produto usa, sai o resto.
- **5 presets × 4 combinações**: Noite, Vidro, Sóbrio, Aurora e Sinal (`assets/direcoes-padrao.md`), cada um em claro e escuro, com e sem vidro. Troca pelo painel em `/configuracoes/aparencia/`, pela barra F ou por `?preset=`, `?tema=` e `?vidro=1`.
- **Rotas de ferramenta**, que não são módulos:
  - `/arsenal`: catálogo vivo de templates, componentes do 21st, kit de movimento e peças brasileiras, com import e dependências. Sai no fim com `limpar-arsenal.mjs`.
  - `/sistema`: a folha do sistema do preset nas 4 combinações, com contraste medido no navegador (PRO-23).
  - `/fluxos`: o quadro de fluxos com telas reais, gerado pelo `quadro.mjs` (PRO-11).
  - `/site`: o site público e a landing, feitos com a `design-taste-frontend`, sem a casca do painel.
- **Barra F** com estado da tela, latência, falha forçada, "Ver como" (papel), relógio, "Simular a outra ponta", preset, tema e vidro. Duas abas lado a lado se atualizam ao vivo.

## 2. Começar um protótipo

1. **Copie** `assets/arsenal/starter/` para a pasta do projeto, rode `npm install` e `npm run dev` (porta 4321). Não refaça stack, tema, casca nem camada de dados (ARS-11).
2. **Troque os pontos de troca** do `LEIAME.md`: marca (`src/proto/marca.ts`), negócio (`negocio.ts`), papéis (`permissoes.ts`), rótulos de status (`projecao.ts`), o "agora" (`relogio.ts`) e o preset.
3. **Fique só com os módulos do produto:** `node scripts/modulos.mjs --listar` mostra os módulos e as dependências; `node scripts/modulos.mjs --manter pedidos,clientes,agenda,configuracoes` apaga os outros com as rotas, as coleções, as linhas da `MATRIZ` e as entradas do registro, e recusa tirar um módulo de que outro mantido depende (`--forcar` passa por cima). As sementes dos módulos que ficam não mudam. Sem o Início, a marca e o "Voltar ao início" levam ao primeiro módulo (`inicioDoPainel()`). Depois, `npm run build` e os scripts da seção 5.
   - **Ligar e desligar dentro do protótipo** (o produto tem módulo opcional): `ativo(id)` e `useAtivo(id)` do registro; o guarda de rota mostra `ModuloIndisponivel` (EST-47) sem piscar a tela, e a navegação, as abas, o Ctrl K e o sino respeitam. Configurações → Módulos liga e desliga na interface.
4. **Crie o módulo novo na própria pasta** (ARS-13), seguindo a seção 2 do contrato:

   ```
   src/modulos/<id>/
     modulo.ts            navegação, Ctrl K, sino, simulações (tipo Modulo)
     dados.ts             tipos, coleção com semente, ações
     telas/<Tela>.tsx     a ilha da tela
     paginas/<rota>/index.astro   a rota (o caminho dentro de paginas/ é a URL)
   ```

   Nada fora da pasta, salvo uma linha na `MATRIZ` de `permissoes.ts` para capacidade nova. Faltou algo na base: comentário `// BASE:` no `modulo.ts` e peça local. Depois de criar `paginas/`, reinicie o `npm run dev`.
5. **Adapte as telas** com as peças de base (seção 4) e o arsenal (ARS-01). Detalhe abre por query string (`?id=OS-1052`), não por rota dinâmica.
6. **Rode os quatro scripts** (seção 5) e só então mostre.

## 3. APIs que importam

| API | Onde | O que a skill cobra |
|---|---|---|
| `colecao(nome, semear)` | `src/proto/dados.ts` | Semente determinística por coleção (hash do nome + 7). `semear` usa só o gerador `r` e `nov()`; nunca `Date.now()`, `new Date()` sem argumento nem `Math.random()` (STK-28). `colecao.use()` já devolve a semente no servidor: a tela chega pronta no HTML |
| `acao(opcoes)` | `src/proto/dados.ts` | **Toda mudança passa por ela** (ARS-12). `modo: "otimista"` (padrão, com Desfazer) ou `"pessimista"` (nada muda antes da resposta; "Enviando…"). P em tudo que afeta terceiro, é irreversível ou mexe em dinheiro (EST-21). `capacidade` é conferida dentro da ação; `conferir` recusa por versão (conflito) |
| `agora()`, `useAgora()`, `nov()` | `src/proto/relogio.ts` | Relógio fixo: segunda, 16/11/2026, 09:41, no servidor e na primeira pintura; depois anda, e a barra F avança 30 min ou 1 dia |
| `pode()`, `usePode()`, `MATRIZ` | `src/proto/permissoes.ts` | Permissão na navegação, no botão e dentro da `acao()`. "Ver como" e `?papel=` trocam o papel |
| `usePessoa()`, `useUnidade()`, `useSessao()` | `src/proto/permissoes.ts` | Sessão do operador (papel, pessoa, unidade). Com sessão diferente da padrão, a base esconde o conteúdo até a ilha renderizar com ela: o HTML do servidor nunca mostra dado de outro papel (PON-20) |
| `useClienteDaSessao()` | `src/proto/cliente.ts` | Cliente do portal, escolhida na barra F ("Ver como cliente…") ou por `?cliente=` |
| `SeloEixo`, `FraseDoCliente`, `paraOCliente()` | `src/proto/projecao.ts`, `components/base/selos.tsx` | **Status só pela projeção** (ARS-12, PON-06). O portal nunca lê o registro cru |
| `Modulo`, `MODULOS`, `navegacao(papel)` | `src/modulos/registro.ts` | Lido por `import.meta.glob`; um módulo nunca edita o registro |
| `mudarComoOutraPonta()`, `marcarAberto()` | `src/proto/dados.ts` | Simulações da barra F: a outra ponta age e o conflito aparece |

## 4. Peças de base

Todas em `src/components/base/`, `src/components/interativos/` e `src/components/app/estados.tsx`. Só se importam.

| Peça | Use para |
|---|---|
| `TabelaDados` | Toda tabela: colunas tipadas, gabarito único (LIS-28), seleção e lote, edição na célula, cartões abaixo de 1280 px |
| `CabecalhoPagina` | Banner compacto com título, contagem, uma ação principal e troca de vista |
| `BarraFerramentas` + `useParametrosDaUrl` | Busca e filtros, com filtro, vista e registro aberto na URL |
| `FolhaDeDetalhe` + `AvisoDesfazer` | Detalhe em sheet lateral no desktop e folha inferior no celular; Desfazer dentro da folha |
| `DialogoConfirmar` | Confirmação com ação pessimista, erro dentro do diálogo e motivo |
| `QuadroInterativo`, `AgendaInterativa` | Kanban e agenda por recurso com mouse, toque e teclado. Não gravam: o módulo decide em `aoSoltar` e `aoMover`, O com Desfazer ou P com sheet |
| `ComDados`, `EstadoVazio`, `EstadoErro`, `EstadoSemPermissao`, `Esqueleto` | Os estados, com os textos padrão; `ComDados capacidade=…` já mostra o "sem permissão" |
| `MenuDaLinha`, `LinhaDoTempo`, `Cortado`, `Email` | Menu "⋯", histórico do registro, texto cortado com o inteiro no title |
| `Superficie` (`components/sistema`) | Todo card. Nenhuma tela monta o próprio card (EXP-61) |

## 5. Os quatro scripts antes de mostrar

Sempre sobre o build (`npm run build`), com o Chrome ou o Edge da máquina:

| Script | Quando | Pronto quando |
|---|---|---|
| `node scripts/navegar.mjs` | sempre | 0 problemas: todas as rotas em 1440 e 390 px, estados, 4 combinações, abertura (PRO-26) |
| `node scripts/medir.mjs` | sempre | metas da seção 6 cumpridas (VER-36) |
| `node scripts/lab-interativos.mjs` | o módulo usa quadro ou agenda | arrasto com mouse, toque e teclado move o item, Desfazer volta, P só move depois de confirmar |
| `node scripts/quadro.mjs` | antes da rodada | telas do `/fluxos` geradas (PRO-11) |

O `navegar.mjs` completo leva cerca de 11 minutos; `--rapido` pula os cliques, mas não vale como prova final. No fim do protótipo, `node scripts/limpar-arsenal.mjs --simular` e depois sem `--simular`.

## 6. Metas de desempenho

Medidas pelo `medir.mjs`, no build, mediana de 3, em 1440 px. **Nunca no dev server**: ele serve os módulos sem empacotar e é mais lento por natureza (VER-36).

- Troca de página pela lateral: conteúdo com dados e tela interativa em **até 300 ms**.
- Início: tela interativa em **até 1,5 s**.
- `--lento 4` simula uma CPU 4× mais lenta; serve de leitura de estresse, não de meta.

O que mantém o build rápido (STK-29): dados no HTML, **uma ilha `client:load` por página** (a tela), casca em `client:idle` com `transition:persist`, peça pesada que só aparece depois de um clique com `React.lazy`, entrada animada só sob a abertura.
