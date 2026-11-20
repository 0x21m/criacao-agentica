# Modelo de DESIGN.md

Copie para a raiz do projeto como `DESIGN.md` e preencha. Ele é a memória do sistema: quem criar a próxima tela, pessoa ou agente, deve conseguir fazê-la igual às outras só com este arquivo e os componentes.

Ele complementa o `docs/04-ui-ux.md` e não repete o que é dele; os valores moram em `tokens.json`. Ligue-o ao contexto dos agentes pela linha de DOC-10 (`references/documentacao-e-integracao.md`): a linha vai no `CLAUDE.md` ou `AGENTS.md` que o projeto já tem; sem nenhum, crie `AGENTS.md` com ela e um `CLAUDE.md` que só importa `@AGENTS.md`. A linha:

> Antes de mexer em interface, leia docs/04-ui-ux.md e DESIGN.md. Use só os tokens e componentes listados lá; valor que falta vai ao token mais próximo e é listado na entrega.

Mantenha curto. Aponte para o código em vez de copiar valores que já moram nele.

---

# DESIGN.md · <nome do produto>

Atualizado em DD/MM/AAAA · versão do sistema <x.y>

## Pontas e tom

| Ponta | Quem usa | Dispositivo principal | Densidade | Tom do texto |
| --- | --- | --- | --- | --- |
| Painel do operador | atendentes, financeiro | desktop 1366+ | compacta | direto, termos do ofício |
| App do cliente | cliente final | celular | confortável | simples, frase de resultado com data |
| … | … | … | … | … |

## Tokens

Os valores moram em `<caminho dos tokens, ex.: src/styles/tokens.css>`. Aqui ficam só os nomes e o uso.

**Três níveis.** Primitivos (`--cinza-700`) nunca aparecem em componente. Semânticos (`--texto-secundario`, `--superficie-elevada`, `--estado-perigo`) são o que os componentes usam. Os de componente (`--botao-altura`) existem só quando um componente precisa variar por tema ou densidade.

| Grupo | Tokens semânticos | Uso |
| --- | --- | --- |
| Cor de texto | `--texto`, `--texto-secundario`, `--texto-desativado` | … |
| Superfície | `--fundo`, `--superficie`, `--superficie-elevada` | … |
| Estado | `--estado-sucesso`, `--estado-aviso`, `--estado-perigo`, `--estado-info`, `--estado-neutro` | a cor de cada estado de objeto vem da tabela de estados |
| Espaço | `--espaco-1` … `--espaco-8` | … |
| Tipo | `--tipo-legenda` … `--tipo-titulo` | … |
| Raio | `--raio-controle`, `--raio-cartao`, `--raio-camada` | um raio por família |
| Sombra e elevação | `--elevacao-1` … `--elevacao-3` | … |
| Movimento | `--duracao-rapida`, `--duracao-media`, `--curva-saida`, `--curva-movimento` | … |
| Densidade | tema `compacto` (painel), `confortavel` (cliente) | … |

**Temas.** Marca, modo claro e escuro, densidade e movimento reduzido são eixos independentes.

## Componentes

Componentes são a única porta para a interface: telas de produto não usam `style` nem classes livres para cor, espaço ou tipo.

| Componente | Caminho | Quando usar | Quando não usar |
| --- | --- | --- | --- |
| `Botao` | `src/ui/Botao.tsx` | ação; um preenchido por vista | navegação (use `Link`) |
| `PainelLateral` | … | detalhe de item da lista sem perder o fundo | decisão crítica e curta (use `Dialogo`) |
| `BadgeEstado` | … | estado de objeto, sempre a partir da tabela de estados | rótulo livre |
| `Vazio` | … | três variantes: inicial, filtrado, falha | carregando |
| … | … | … | … |

Ícones: uma família (`<lucide ou outra>`), um significado por ícone. Navegação e ação primária têm rótulo visível; ícone sozinho só em ação secundária repetida, com nome acessível e tooltip igual ao nome.

## Receitas de tela

Combinações aprovadas de componentes por tipo de tela. Uma tela nova começa por uma receita.

### Lista operacional (fila de trabalho)

- Cabeçalho com título, contagem e ação primária.
- Visões salvas como abas com contagem; a padrão é "o que precisa de mim".
- Barra de filtros com filtros ativos visíveis e "Limpar"; tudo na URL.
- Tabela com identificador como link, 1 ou 2 ações por linha e o resto em "⋯"; barra de lote ao selecionar.
- Detalhe em `PainelLateral`; no celular, página com Voltar.
- Estados: carregando (esqueleto estático na primeira carga), refetch mantém os dados, vazio inicial, vazio filtrado, erro com "Tentar de novo", sem permissão.

### Detalhe do objeto

- …

### Acompanhamento do cliente

- …

## Glossário

Os termos moram em `GLOSSARY.md`, na raiz (termo, definição, _Evitar_). Aqui fica só o cartão de voz e a lembrança: uma palavra por conceito, a mesma em todas as pontas e no código.

## Estados por objeto

A tabela completa de cada objeto mora em `docs/03-fluxo-app.md`, seção do objeto (modelo em `modelo-tabela-de-estados.md`). Aqui fica o resumo e a regra.

| Objeto | Eixos | Onde está a tabela |
| --- | --- | --- |
| Pedido | ciclo, pagamento, entrega | `docs/03-fluxo-app.md`, "Pedido" |
| Ordem de serviço | ciclo, orçamento | `docs/03-fluxo-app.md`, "Ordem de serviço" |

Regra: nenhuma ponta inventa estado ou rótulo. Estado novo entra primeiro na tabela, depois no código.

## Decisões

Uma linha por decisão que virou regra do sistema, com o porquê. O registro completo fica na DEC, em `docs/04-ui-ux.md` (ou na ADR, em `docs/adr/`).

| Data | Decisão | Por quê | DEC |
| --- | --- | --- | --- |
| DD/MM/AAAA | Detalhe do pedido abre em painel lateral, não em modal | o operador alterna entre pedidos da fila e precisa ver a lista | DEC-003 |
| DD/MM/AAAA | Cancelamento depois de coletado vira solicitação de devolução | a transportadora já tem o pacote | DEC-005 |
| … | … | … | … |

## Como criar uma tela nova

1. Leia este arquivo e a tabela de estados do objeto.
2. Escolha a receita mais próxima. Se nenhuma servir, diga por quê no plano.
3. Declare o tamanho da mudança (ajuste, tela ou fluxo, app) e a tarefa dominante na primeira linha do plano.
4. Escreva o texto antes, pelo glossário.
5. Monte o protótipo só com componentes e tokens, dados falsos em pt-BR, todos os estados, desktop, tablet e celular.
6. Peça aprovação. Só construa depois do "sim" ou do DEC aprovado.
7. Valor que falta: use o token mais próximo e liste. Se a diferença for grande, pergunte antes de criar token.
8. Verifique: bancada de estados, teclado, 320 px, contraste, captura do build ao lado do aprovado.
9. Atualize este arquivo se surgiu receita, termo ou decisão nova.

## Aposentado

| O quê | Desde | Motivo | Substituto |
| --- | --- | --- | --- |
| … | … | … | … |
