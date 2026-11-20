# Contratos da base do ERP (fase 2)

Este documento é o combinado entre a base e os módulos. Com ele, cada módulo é construído na própria pasta, em
paralelo com os outros, **sem editar arquivo de ninguém**. As decisões D1 a D10 da especificação
(`apps-e-fluxos-workspace/especificacao-erp-oficina-norte.md`, seção 0) estão implementadas aqui.

## 1. Mapa: o que é de quem

| Pasta ou arquivo | Dono | Um módulo pode… |
|---|---|---|
| `src/modulos/<id>/` | o módulo `<id>` | tudo, só na própria pasta |
| `src/modulos/registro.ts` | base | só **ler** (`MODULOS`, `navegacao`, `normalizar`…) |
| `src/proto/dados.ts`, `relogio.ts`, `projecao.ts`, `negocio.ts`, `modulos.ts`, `BarraPrototipo.tsx`, `marca.ts`, `aparencia/*` | base | só **importar** |
| `src/proto/permissoes.ts` | base | importar; acrescentar **uma linha** na `MATRIZ` se o módulo precisar de capacidade nova (ver 6) |
| `src/components/base/*`, `src/components/app/*`, `src/components/interativos/*`, `src/components/sistema/*`, `src/components/movimento/*`, `src/components/ui/*`, `src/colecao/*`, `src/lib/*` | base | só **importar** |
| `src/layouts/*`, `src/styles/*`, `astro.config.mjs`, `integracoes/*`, `scripts/*` | base | nada |
| `src/pages/*` | base e ferramentas (arsenal, sistema, fluxos, site, mais, 404) | nada: rota de módulo mora no módulo |
| `src/modulos/<outro>/dados.ts` | o outro módulo | **importar** as coleções e as ações exportadas; nunca editar |

Se a base não tem o que o módulo precisa, o módulo **não** contorna editando a base: registra a lacuna no próprio
`modulo.ts` (comentário `// BASE:`) e segue com uma peça local na própria pasta. A base absorve depois, num commit só dela.

## 2. Criar um módulo do zero (exemplo: Estoque)

```
src/modulos/estoque/
  modulo.ts                 o registro do módulo (navegação, Ctrl K, sino, simulações)
  dados.ts                  tipos, a coleção com a semente e as ações
  telas/Estoque.tsx         a ilha da tela (React)
  paginas/estoque/index.astro   a rota /estoque/ (o caminho dentro de paginas/ é a rota)
```

**1. `dados.ts`: a coleção e as ações.**

```ts
import { acao, colecao, evento, type Aleatorio, type Evento } from "@/proto/dados"
import { nov } from "@/proto/relogio"

export type Produto = { id: string; nome: string; saldo: number; minimo: number; versao: number; historico: Evento[] }

function semear(r: Aleatorio): Produto[] {
  // registros fixos dos roteiros escritos à mão; o resto sorteado com r (nunca Date.now(), new Date() ou Math.random())
  return Array.from({ length: 40 }, (_, i) => ({ id: `FLT-${900 + i}`, nome: r.pega(["Filtro", "Controle"]), saldo: r.entre(0, 30), minimo: 5,
    versao: 1, historico: [{ em: nov(2, 9).toISOString(), quem: { tipo: "sistema", nome: "Sistema" }, texto: "Cadastrado" }] }))
}
export const produtos = colecao<Produto>("produtos", semear)

export function ajustarSaldo(p: Produto, qtd: number, motivo: string) {
  return acao({
    rotulo: `ajustar o saldo de ${p.nome}`,             // "Não foi possível {rotulo}."
    capacidade: "estoque_ajustar",                     // conferida contra o papel ativo, aqui dentro
    modo: "pessimista",                                // afeta terceiro ou é irreversível: P
    conferir: { colecao: produtos, id: p.id, versao: p.versao },
    ids: [p.id],
    aplicar: (d) => { const x = d(produtos).find((y) => y.id === p.id)!; x.saldo += qtd; x.historico.push(evento(`Ajuste: ${qtd} (${motivo})`)) },
    sucesso: "Saldo ajustado.",
  })
}
```

**2. `telas/Estoque.tsx`: a tela com as peças da base.**

```tsx
import { ComDados, EstadoVazio, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { BarraFerramentas, useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { TabelaDados } from "@/components/base/TabelaDados"
import { produtos } from "../dados"

export default function Estoque() {
  const lista = produtos.use()                          // já vem pronta do servidor (semente)
  const [f, setF] = useParametrosDaUrl({ q: "", id: "" })
  return (
    <>
      <CabecalhoPagina titulo="Estoque" contagem={`${lista.length} produtos`}>
        <BarraFerramentas busca={f.q} aoBuscar={(q) => setF({ q })} placeholder="Buscar produto" filtrado={!!f.q} aoLimpar={() => setF({ q: "" })} />
      </CabecalhoPagina>
      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="estoque_ver" area="do estoque" rotulo="o estoque" estaVazio={!lista.length}
          esqueleto={<Esqueleto className="h-96" />} vazio={<EstadoVazio icone={Package} titulo="Nenhum produto ainda" />}>
          <TabelaDados titulo="Produtos" linhas={lista} idDe={(p) => p.id} colunas={[
            { id: "id", titulo: "SKU", tipo: "id", valor: (p) => p.id },
            { id: "nome", titulo: "Produto", tipo: "texto", valor: (p) => p.nome },
            { id: "saldo", titulo: "Saldo", tipo: "numero", valor: (p) => String(p.saldo) },
          ]} />
        </ComDados>
      </div>
    </>
  )
}
```

**3. `paginas/estoque/index.astro`: a rota.**

```astro
---
import AppShell from "@/components/app/AppShell.astro";
import Estoque from "../../telas/Estoque";
---
<AppShell titulo="Estoque">
  <Estoque client:load />
</AppShell>
```

**4. `modulo.ts`: o registro.**

```ts
import { Package } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { produtos } from "./dados"

export default {
  id: "estoque", nome: "Estoque", ponta: "operador", ordem: 50,
  nav: [{ rotulo: "Estoque", caminho: "estoque/", icone: Package, capacidade: "estoque_ver", aba: 5 }],
  colecoes: ["produtos"], depende: [],
  comandos: (q) => produtos.ler().filter((p) => normalizar(p.nome).includes(q)).slice(0, 5)
    .map((p) => ({ rotulo: p.nome, detalhe: "Produto", caminho: `estoque/?id=${p.id}` })),
  avisos: () => produtos.ler().filter((p) => p.saldo === 0).map((p) => ({ titulo: `${p.nome} esgotado`, texto: p.id, caminho: `estoque/?id=${p.id}` })),
  simulacoes: [{ rotulo: "Fornecedor entrega a compra CMP-0007", executar: () => { /* mudarComoOutraPonta(...) */ } }],
} satisfies Modulo
```

Pronto: a lateral, as abas do celular, o "Mais", o Ctrl K, o sino, a barra F e o quadro de fluxos já mostram o módulo.
No `npm run dev`, **reinicie o servidor** depois de criar a pasta `paginas/` (a lista de rotas é lida na partida).

## 3. APIs da base

### Dados (`src/proto/dados.ts`)

| API | Para quê |
|---|---|
| `colecao<T>(nome, semear, versaoDaSemente?, { caminho? })` | Declara a coleção (uma vez, no `dados.ts` do dono). A semente sai de `hash(nome) + 7` (Park-Miller): apagar um módulo não muda os dados dos outros, e servidor e navegador geram o mesmo. Devolve `{ use, ler, porId, semente }`. `caminho: (r) => "estoque/?id=…"` diz onde o registro abre (a auditoria usa). |
| `useTodasAsColecoes()` / `todasAsColecoes()` | Todas as coleções declaradas (`{ nome, lista, caminho? }`), para leituras gerais como a auditoria; o hook devolve a semente na hidratação. Importe `@/modulos/registro` para garantir que todos os módulos carregaram. |
| `colecao.use()` | Lista visível na tela (com as mudanças otimistas). **No servidor e na hidratação é a semente**: a tela chega pronta no HTML. |
| `colecao.ler()` / `porId(id)` | Leitura fora do React (ações, Ctrl K, CSV). |
| `acao(opcoes)` | Toda mudança. Devolve `Promise<Resultado>`: `{ ok: true }` ou `{ ok: false, motivo: "falha" \| "conflito" \| "permissao", mensagem }`. |
| `opcoes.modo` | `"otimista"` (padrão): aplica na hora, desfaz se falhar, toast com Desfazer se houver `desfazer`. `"pessimista"`: nada muda antes da resposta; os `ids` ficam em `useProcessando()`; a tela mostra "Enviando…" e, na falha, a `mensagem` no local. Use P em tudo que afeta terceiro, é irreversível ou mexe em dinheiro (tabelas da seção 3, coluna "Classe"). |
| `opcoes.aplicar(d)` | Recebe o rascunho: `d(colecao)` devolve a lista mutável; `d.trocar(colecao, novaLista)` substitui. Pode mexer em várias coleções na mesma ação. |
| `opcoes.capacidade` + `contexto` | Conferida contra o papel ativo **dentro** da ação (D4). Recusa com "Seu papel não permite {…}. Peça a {…}." |
| `opcoes.conferir` | `{ colecao, id, versao }` (ou lista): recusa se a versão mudou desde a leitura (D2), com a frase de conflito. Todo registro com `versao` que a ação toca (`ids`) sobe uma versão ao gravar. |
| `usePendentes()` / `useProcessando()` | Ids com ação otimista a caminho / ação pessimista esperando resposta. |
| `evento(texto, extra?)` | Passo do `historico` assinado pela pessoa da sessão, no "agora". `cliente: true` = o portal mostra. |
| `proximoId(lista, "OS", minimo)` | Próximo id sequencial (`OS-1068`). |
| `marcarAberto(colecao, id)` | A tela de detalhe declara o registro aberto: a barra F oferece "Outra pessoa mexe neste registro". |
| `mudarComoOutraPonta(aplicar, ids)` | Muda os dados como o cliente ou outra pessoa, sem latência nem toast (simulações da barra F, D10). |
| `useConfig()` / `definirConfig()` | Latência, falha forçada, "Resposta perdida" e estado da tela (barra F, `?estado=`). |
| `opcoes.silenciosa` | `true` ou `["falha", "conflito", "permissao"]`: sem toast de erro, porque a tela já mostra a falha no lugar (balão com "Tentar de novo", "2 de 5 ajustados") ou a ação é item de um lote. |
| `resumirLote(resultados, rotulo, tentarDeNovo?)` | Um toast só para um lote de ações silenciosas: "Não foi possível {rotulo} em 2 de 5." |
| "Resposta perdida" (barra F) | A próxima ação grava, mas devolve `{ ok: false, motivo: "falha", semResposta: true }` com "Enviado, ainda sem confirmação." (EST-46). `consumirRespostaPerdida()` deixa o módulo tratar do seu jeito (o Financeiro guarda o envio pendente no título). |
| `resetar()` | Volta todas as coleções e o relógio à semente. |
| Tempo real entre abas (D3) | Automático: cada coleção fica numa chave `proto-dados:<nome>:v<n>` e o evento `storage` atualiza as outras abas. |

### Relógio (`src/proto/relogio.ts`, D9)

`agora()` e `useAgora()`: segunda, 16/11/2026, 09:41 no servidor e na primeira pintura; depois da hidratação anda com o
relógio real a partir daí, mais o que a barra F avançou ("Avançar 30 min", "Avançar 1 dia"). `AGORA_FIXO` (e o antigo
`HOJE`) é o instante fixo. `nov(d, h, m)` monta datas de novembro de 2026 nas sementes. **Nunca** `Date.now()` ou
`new Date()` sem argumento numa tela ou semente (o HTML do servidor não bateria com o do navegador).

### Permissões (`src/proto/permissoes.ts`, D4)

`pode(papel, capacidade, contexto?)`, `usePode(cap, ctx?)`, `usePapel()`, `usePessoa()`, `papelAtual()`, `trocarPapel()`.
A `MATRIZ` é a tabela da seção 2: `true`, `false`, `"proprias"`, `"unidade"` ou `"parcial"` (a tela abre com um recorte).
Sem contexto, `pode` responde "a tela abre para ele"; com contexto (`responsavelId`, `unidade`, `etapa`, `valor`),
confere o registro. O papel troca na barra F ("Ver como") e por `?papel=tecnico` na URL (que fica guardado).

**Sessão** (papel, pessoa e unidade, no localStorage do aparelho):

| API | Para quê |
|---|---|
| `usePessoa()` / `pessoaAtual()` | A pessoa da sessão (quem entrou pela Entrada, ou a padrão do papel). Use para "Bom dia, Ana" e para assinar o que a pessoa faz (`evento()` já assina). |
| `useUnidade()` / `unidadeAtual()` | A unidade escolhida (`"pampulha"`, `"contagem"` ou `"todas"`): filtre o Início e as listas por ela. |
| `useSessao()` / `sessaoAtual()` | `{ papel, pessoaId, unidade }`. |
| `definirSessao({ papel?, pessoaId?, unidade? })` | A Entrada grava quem entrou; pessoa de outro papel vira a padrão dele. `trocarPapel(p)` veste a pessoa padrão de `p`. |
| `trocarUnidade(u)`, `nomeDaUnidade(u)` (`proto/dados.ts`) | Troca de unidade (O, com `trocar_unidade`); usada pelo seletor da barra superior e por `/entrar/unidade/`. |
| `useSessaoDaCasca()` | Só para ilhas da casca (fora do `<main>`): mesma sessão, sem liberar o conteúdo antes da hora. |

No servidor e na hidratação vale a sessão padrão (Marina, gestora, Pampulha). Quando a guardada é outra, o `Base.astro`
marca `html[data-sessao-pendente]` (e `data-casca-pendente`) antes da pintura, o CSS esconde o `#conteudo` e as partes
`[data-casca-sessao]` da casca, e os hooks acima tiram a marca depois de a ilha renderizar com a sessão de verdade:
nenhum dado de outro papel aparece, nem por um quadro. Por isso a tela **lê papel, pessoa e unidade pelos hooks** (nunca
direto do `localStorage`).

**Sessão do cliente** (Portal, `src/proto/cliente.ts`): qual cliente está no portal, neste aparelho (`proto-cliente`).

| API | Para quê |
|---|---|
| `useClienteDaSessao()` / `clienteDaSessao()` | O id da cliente (padrão `CLIENTE_PADRAO`, a Juliana, C-0007). No servidor e na hidratação, a padrão. |
| `definirClienteDaSessao(id)` | Troca a cliente (a barra F, "Ver como cliente…"); `?cliente=C-0012` na URL também troca e fica guardado. |
| `Modulo.clientes?: () => { id, nome }[]` | Quem a barra F oferece em "Ver como cliente…" (o Portal declara); `clientesParaVerComo()` no registro. |
| `useCliente()`, `comoChamar(c)` (`src/modulos/portal/dados.ts`) | O registro da cliente da sessão e como o portal a chama ("Juliana"; empresa pelo nome inteiro). |

Com outra cliente guardada, o `Base.astro` marca `html[data-cliente-pendente]` e `data-cliente-casca-pendente`; o CSS
esconde o conteúdo do portal e a conta no topo até as ilhas renderizarem com a cliente certa (os hooks tiram as marcas;
a casca usa `useClienteDaSessao("data-cliente-casca-pendente")`, e quem não deve liberar nada passa `null`).

**Matriz em tempo de execução:** `ajustarMatriz(cap, papel, regra | null)`, `limparAjustesDaMatriz()` (também no
"Resetar dados"), `useAjustesDaMatriz()` e `regraDe(papel, cap)` (MATRIZ + ajustes). `pode()` já lê os ajustes; na
hidratação usa a MATRIZ pura, igual ao servidor. A Equipe grava por aqui ao editar a matriz.

### Projeção (`src/proto/projecao.ts`, D5 e D6)

Os rótulos do operador e as frases do cliente de todos os estados da seção 3 (OS, orçamento, pagamento, entrega,
agendamento, cliente, produto, lançamento, mensagem, compra, membro da equipe, conversa), mais `ATRASADA`, `VENCIDO`,
`PIX_EXPIRADO`, `COMPRA_ATRASADA`, `CONVITE_VENCIDO`, `LANCAMENTO_A_PAGAR` (conta a pagar em aberto), `CONFLITO` e
`paraOCliente(registro)` (tira custo, margem, nota interna e o histórico interno: o portal nunca lê o registro cru).
**Nenhuma tela escreve string de status à mão**: use `<SeloEixo p={ETAPA_OS[os.etapa]} ctx={…} detalhe />` e
`<FraseDoCliente p={…} ctx={…} />` (`src/components/base/selos.tsx`).

### Negócio (`src/proto/negocio.ts`)

O que é fixo na sessão: `EMPRESA`, `UNIDADES`, `FERIADOS`, `expediente(dia)`, `SERVICOS`, `EQUIPE`, `RECURSOS` da agenda.

### Registro (`src/modulos/registro.ts`)

O tipo `Modulo` (seção 2, passo 4) e as leituras: `MODULOS`, `navegacao(papel)`, `abas(papel)`, `caminhoAtivo`,
`comandos(q, papel)`, `avisos(papel)`, `simulacoes()`, `normalizar(texto)`. Lido por `import.meta.glob("./*/modulo.ts")`.
As rotas vêm de `src/modulos/<id>/paginas/**.astro` pela integração `integracoes/modulos.mjs` (duas páginas na mesma
rota param o build com o nome dos dois módulos).

- **Abas do celular por papel:** `aba` aceita um número (todos os papéis) ou `{ atendente: 3.5, tecnico: 3.5 }` (só os
  citados); filhos com `aba` também entram (Receber, Pagar e Caixa nas abas do financeiro). `abaDe(item, papel)`.
- **Rótulo e presença por papel:** `porPapel: { tecnico: { rotulo: "Minhas OS", curto: "Minhas OS" } }` troca o rótulo
  (lateral, abas, "Mais", Ctrl K) para o papel; `{ tecnico: false }` tira o item da navegação dele (o Início sai para o
  técnico: o "Meu dia" é o início dele). `navegacao(papel)` e `navDoModulo(m, papel)` já devolvem o item resolvido. O
  rótulo da aba nunca corta: cada aba cresce a partir do próprio rótulo (prefira `curto` com até ~10 letras).
- **Sino:** o `Aviso` ganhou `id?`, `prioridade?` (1 sobe; padrão 2), `lida?` e `aoLer?` (para o módulo que guarda o
  próprio "lido", como a central de Mensagens). O sino mostra por prioridade, com "Não lidas · Todas", "Marcar todas
  como lidas" e "Ver todas" (`/notificacoes/`); o lido de quem não tem `aoLer` fica no aparelho. Leituras:
  `avisosDoSino(papel)`, `lerAviso(a)`, `lerTodosOsAvisos(lista)`, `useAvisosLidos()`.
- **Ligado e desligado (EST-47, fase 4):** `ativo(id)`, `situacaoDoModulo(id)` (`"ligado" | "desligado" | "fora_do_ar"`),
  `useAtivo(id)`, `useSituacaoDoModulo(id)`, `useRegistroDoModulo(id)` (quem e desde quando), `situacoesAtuais()` e
  `useSituacoesDosModulos()` (o mapa; no servidor e na hidratação, todos ligados). Valem para **qualquer id**, mesmo de
  módulo que ainda não existe: o Site lê `useAtivo("loja")` para tirar catálogo e carrinho. A situação é a coleção da
  base `situacoesDosModulos` (`modulos_situacao`, em `src/proto/modulos.ts`; some com "Resetar dados" e acompanha outra
  aba); só grava quem liga e desliga (Configurações, com `acao()`), e um id sem registro está ligado.
  - **Desligado:** some de `navegacao()`, `abas()`, `modulosVisiveis()` (o "Mais"), `comandos()` (Ctrl K), `avisos()`
    (sino) e `simulacoes()` (barra F). Na casca, passe o mapa do hook: `navegacao(papel, useSituacoesDosModulos())`,
    `abas(papel, sit)`, `simulacoes(sit)`; sem o mapa, vale a situação de agora (fora do React).
  - **Desligado ou fora do ar:** a rota do módulo mostra o `ModuloIndisponivel` (`src/components/app/`) no lugar da
    tela, pelo guarda do AppShell (`GuardaDeModulo`). Fora do ar continua na navegação.
  - **Sem piscar:** o `Base.astro` lê a mesma chave antes da pintura: esconde os links do módulo desligado (folha de
    estilo do documento) e marca `html[data-modulo-indisponivel]` quando a página é de um módulo que não está ligado
    (a página leva `<meta name="proto-modulo">`); o CSS esconde a tela do módulo e só o aviso aparece.
  - `moduloDaRota(rota)` e `ROTAS_DOS_MODULOS` (`src/modulos/rotas.ts`, **só no servidor**): de que módulo é cada rota.
  - `ModuloIndisponivel` aceita `id`, `nome`, `genero`, `dados`, `rota`, `de` e `ondeLigar`; o nome, o gênero e o texto
    dos dados também podem vir do registro da situação (quem desliga grava). Um módulo pode usá-lo numa região.

### Componentes de base (`src/components/base/` e `src/components/app/estados.tsx`)

| Peça | O que faz |
|---|---|
| `TabelaDados` | Colunas tipadas (`id`, `texto`, `numero`, `moeda`, `data`, `status`, `pessoa`, `acoes`) com largura e um gabarito só (`<colgroup>`, LIS-28); alinhamento pelo tipo; cabeçalho fixo em duas linhas que continuam o contorno do card; seleção com Shift/Ctrl e barra de lote (`lote`); edição na célula (`editar`: Enter salva, Esc cancela; `editar.motivo` abre um popover com o valor e o motivo obrigatório, P; `editar.pode` por linha); ordenar por coluna (`ordenar` na coluna; `ordem`/`aoOrdenar` para guardar na URL); seções (`grupoDe` + `grupos`: Vencidos · Hoje · …, com `resumo`); rodapé de totais (`totais`); título nos cartões (`tituloNosCartoes`); cartões abaixo de 1280 px (`quebra="lg"` para 1024). Só a vista visível (tabela ou cartões) hidrata; a outra fica com o HTML do servidor até a janela mudar de largura. |
| `CabecalhoPagina` | Banner compacto da marca com título, contagem, ações (uma principal) e a troca de vista no segmentado de vidro; `children` (a barra de ferramentas) avança sobre ele. |
| `BarraFerramentas` + `useParametrosDaUrl` | Busca e filtros em pílula de vidro; os filtros, a vista e o registro aberto vivem na URL. |
| `ComDados`, `EstadoVazio` (`primeiro-uso`, `filtro`, `concluido`), `EstadoErro`, `EstadoSemPermissao`, `Esqueleto`, `Carregando` | Os estados com os textos da 5.0. `ComDados capacidade=…` já mostra o "sem permissão". |
| `FolhaDeDetalhe` + `AvisoDesfazer` | Sheet lateral de vidro no desktop, folha inferior com alça no celular; o pedaço pesado baixa só quando abre. Por link direto (`?id=`), abre sozinha depois que a página termina de hidratar (sem contorno no módulo). |
| Barra F com modal aberto | A barra do protótipo leva `data-react-aria-top-layer`: com uma folha ou um diálogo do React Aria aberto, ela continua clicável (fora do inert, do foco preso e do "clicar fora fecha"). |
| `DialogoConfirmar` | Confirmação com ação pessimista: "Enviando…" com a mesma largura, erro dentro do diálogo, motivo obrigatório opcional. |
| Ordem dos botões (formulário, `DialogFooter`, `SheetFooter`, `rodape` da folha) | No código, a secundária ("Cancelar", "Voltar", a destrutiva discreta) vem **antes** da principal. Lado a lado, a principal fica à direita; empilhado no celular, fica em cima (os rodapés da base já fazem `flex-col-reverse`). |
| `MenuDaLinha` | O "⋯" das linhas: um botão simples, sempre o mesmo elemento; o menu do React Aria (ancorado nele) só monta quando abre. |
| `Sino` (`components/app/Sino.tsx`) | O sino da barra superior (ver Registro: `Aviso` com `prioridade`, `lida`, `aoLer`). |
| `LinhaDoTempo` | Lê o `historico`; versão operador ou cliente. |
| `Cortado`, `Email` (`texto.tsx`) | Uma linha com reticências e o texto inteiro no title; e-mail e domínio nunca quebram no meio. |
| `QuadroInterativo`, `AgendaInterativa` (`src/components/interativos/`) | Kanban e grade por recurso com mouse, toque e teclado (@dnd-kit), validação durante o arrasto. O componente não grava: o módulo decide em `aoSoltar` / `aoMover` (O com Desfazer ou P com sheet). |
| `lib/entrada.ts` | A entrada animada só toca sob a abertura; o resto chega pronto do servidor. Demos usam `entrada="sempre"`. |

## 4. Regras que a base cobra

1. **Tela pronta no HTML.** A ilha da tela lê `colecao.use()` direto (sem esperar efeito); nada de `localStorage`,
   `window` ou `matchMedia` durante o render; datas pelo relógio. O `navegar.mjs` acusa erro de hidratação no console.
2. **Uma ilha `client:load` por página** (a tela). A casca hidrata em `client:idle`. Peça pesada que só aparece depois
   de um clique (sheet, diálogo, quadro, gráfico rico) entra com `React.lazy`.
3. **Status só pela projeção**, ação só pela `acao()`, permissão também dentro da ação, classe O ou P conforme a seção 3.
4. **Toast:** ação frequente que já aparece na tela não leva toast; ação com Desfazer leva (8 s, pausável).
5. **Textos e formatos pt-BR** (`lib/formato.ts`), alvo de toque de 40 px, tabelas pela `TabelaDados`, nenhum card montado
   à mão (`Superficie` ou `Card`).

## 5. Antes de entregar um módulo

```bash
npm run build
node scripts/navegar.mjs          # 0 problemas (todas as rotas, 1440 e 390 px, estados, temas, cabeçalho fixo)
node scripts/lab-interativos.mjs  # se o módulo usa o quadro ou a agenda
node scripts/medir.mjs            # troca ≤ 300 ms e início interativo ≤ 1,5 s (no build, nunca no dev server)
```

Durante o trabalho, confira só o módulo: `node scripts/navegar.mjs --rotas estoque/ --rapido` (prefixos separados por
vírgula; a abertura da home fica de fora) e `node scripts/medir.mjs --rotas estoque/` (o `medir` mede a troca para cada
rota de módulo que a lateral mostra à gestora). Rode o `navegar.mjs` completo uma vez antes de entregar. Cada execução
grava o console em `logs/<script>-<data>.log` do próprio worktree (fora do git). Em worktree, suba o preview numa porta
só sua: `PORTA=43xx node scripts/navegar.mjs`.

## 5.1 Tirar módulos do starter (fase 4)

```bash
node scripts/modulos.mjs --listar                              # módulos, rotas, coleções, depende e quem depende
node scripts/modulos.mjs --manter pedidos,clientes,agenda,configuracoes,prototipo --simular
node scripts/modulos.mjs --manter pedidos,clientes,agenda,configuracoes,prototipo
```

Apaga `src/modulos/<id>/` de quem sai (rotas, coleções e a entrada do registro vão junto, porque tudo mora na pasta) e
as linhas da `MATRIZ` que só eles citavam; recusa (código 1) se um módulo que fica depende de um que sai, pelo `depende`
ou por um import de verdade (`--forcar` passa por cima). No fim, regenera o LEIAME. Para isso funcionar, **declare no
`depende` todo módulo cujo `dados.ts` ou telas você importa**, e não importe módulo nenhum de fora de `src/modulos`.
Sem o Início, a raiz fica sem tela: `inicioDoPainel()` (`src/lib/url.ts`, calculado pela integração) leva o logo e o
"Voltar ao início" à primeira rota do módulo de menor `ordem`. Use `inicioDoPainel()` no lugar de `url("")` nesses links.

**Documentos gerados do registro (nada à mão):** a tabela de módulos do `LEIAME.md` (`node scripts/gerar-docs.mjs`,
entre `<!-- modulos:inicio -->` e `<!-- modulos:fim -->`; `--conferir` acusa se está velha), o "Mapa dos módulos" do
`/fluxos` (rotas, quem vê, coleções e dependências, lido no build) e o "Onde é usado" de cada peça do `/arsenal`
(`scripts/mapa-arsenal.mjs`: varre os imports de `src/` e sobe até as telas). O "Quem vê" sai da capacidade do primeiro
item da navegação do módulo na `MATRIZ`; a descrição, da primeira frase do comentário do topo do `modulo.ts`.

## 6. Quando a base precisa mudar

- **Capacidade nova:** acrescente a linha na `MATRIZ` de `permissoes.ts` (rótulo no infinitivo, as 5 colunas e a nota)
  no mesmo commit do módulo, e cite-a no `modulo.ts`. É a única edição permitida fora da pasta do módulo.
- **Estado novo de um objeto da especificação:** não invente rótulo na tela; peça a linha na `projecao.ts`.
- **Peça de base nova ou mudança de API:** commit da base, separado, com este documento atualizado.
