# Microtexto pt-BR

Este arquivo é dono de toda palavra que aparece na interface: glossário, rótulos, tooltips, status, erros, confirmações, vazios, números no texto e o lint de microtexto. Não cobre quando cada estado existe (`estados-e-ui-otimista.md`), comportamento de tooltip e nome acessível (`acessibilidade.md`), tamanho de texto e tipografia (`fundamentos-e-tokens.md`) nem tom por ponta além do registrado aqui (`cliente.md`, `chat-e-notificacoes.md`).

Princípio: o específico vem do dado, não do estilo. A correção de uma frase ruim é um fato ou uma decisão, nunca um sinônimo. Voz de marca deliberada não é defeito, e reescrever por gosto não é achado.

## Sumário

1. Um glossário, um nome por coisa
2. Rótulos e títulos
3. Ícones e tooltips
4. Status em pares
5. Erros que dizem o que fazer
6. Confirmação que nomeia o objeto
7. Frases do cliente e do operador
8. Pessoa, gênero e registro
9. Números, plural, dinheiro, datas e fusos
10. Sinais de texto gerado por IA
11. Lint de microtexto
12. Antes de terminar
13. Fontes

## 1. Um glossário, um nome por coisa

- **TXT-01** · [PR] · P2. Mantenha um glossário único no `GLOSSARY.md`, na raiz (DOC-09): cada entidade tem um nome e uma lista de sinônimos proibidos (cliente, não contato nem conta; pedido, não ordem nem venda, salvo se forem coisas diferentes no domínio). Antes de escrever, inventarie as strings (`t(`, `locales/**`, `*.po`) e liste o substantivo de cada objeto e o verbo de cada ação. *Porquê:* dois nomes para a mesma coisa fazem o usuário procurar duas coisas.
- **TXT-02** · [PR] · P2. Um verbo por semântica no produto inteiro. Exemplo: "Remover" desfaz vínculo, "Excluir" apaga registro, "Arquivar" tira da fila sem apagar. Fluxo em etapas usa um trio só (entrar, avançar, concluir).
- **TXT-03** · [PR] · P2. Uma redação por ação em toda superfície: toolbar, menu de contexto, atalho, tooltip, vazio e toast. "Novo cliente", "Adicionar cliente" e "Cadastrar cliente" na mesma app é deriva.
- **TXT-04** · [PR] · P3. Um fato tem uma redação só. SLA "em até 24 h" e "1 dia útil" não convivem; escolha uma e reutilize.

## 2. Rótulos e títulos

- **TXT-05** · [PR] · P2 em destrutivo, P3 nos demais. Botão é verbo + objeto, curto. O objeto é obrigatório quando há mais de um objeto possível na tela, em ação destrutiva e em diálogo ("Excluir 12 contratos"). Pode cair quando o contêiner fixa o objeto ("Salvar" no rodapé do formulário de cliente). Substantivo puro só quando o link abre aquilo ("Pedidos").
- **TXT-06** · [PR] · P2. Nunca "OK", "Sim", "Não", "Confirmar" ou "Enviar" sozinhos em diálogo. Nunca "Saiba mais", "Clique aqui" ou "Ver mais" soltos; o link nomeia o destino ("Ver relatório de inadimplência").
- **TXT-07** · [PR] · P3. Toggle e checkbox descrevem o estado ligado ("Enviar notificações por e-mail", não "Desativar notificações").
- **TXT-08** · [PR] · P3. Título de card e seção nomeia a coisa e o recorte quando há ambiguidade ("Receita recebida · nov/2026, regime de caixa"). "Visão geral", "Resumo" e "Desempenho" só como nome de página. Sem pergunta, sem dois-pontos, sem comando nu. Descrição sob o título só para escopo, fórmula ou exclusões, de preferência num "ⓘ" da métrica.
- **TXT-09** · [PR] · P3. Caixa de frase em tudo ("Salvar alterações", não "Salvar Alterações"). Caixa alta só em siglas do glossário (CNPJ, CPF, NF-e, SLA, UF).
- **TXT-10** · [PR] · P3. Rótulo de campo diz o que entra ("Vencimento"), nunca pergunta. Placeholder é exemplo de formato ("nome@empresa.com.br"), nunca rótulo nem instrução.

## 3. Ícones e tooltips

- **TXT-11** · [P]/[DS] · P2. Ícone sem rótulo visível só quando a ação é frequente, reversível e tem símbolo convencional (editar, copiar, filtrar, exportar, mais ações). Navegação, ação primária da tela e ação destrutiva têm texto visível. *Porquê:* a NN/g mostra que ícone sozinho é mal reconhecido; Carbon e Atlassian aceitam botão-ícone com tooltip só em ações secundárias densas.
- **TXT-12** · [DS] · P2 (P1 se o botão-ícone não tem nome). Dona do texto do tooltip. O tooltip de botão-ícone é o rótulo: verbo + objeto, sem ponto, igual ao nome acessível (ACE-03), com o atalho junto quando existir ("Duplicar pedido · D"). Não use `title` repetindo o `aria-label`. Tamanho em palavras: TOK-29; comportamento: ACE-18; quando usar: CAM-27.
- **TXT-13** · (movida para CAM-27). Informação essencial fora do tooltip é regra de CAM-27; a redação do motivo de indisponibilidade ("Só administradores podem aprovar. Pedir acesso") está em TXT-18.

- **TXT-14** · [PR] · P3. Ao trocar texto por ícone, o fato não desaparece: escopo, período e fórmula vão para metadado ou "ⓘ". Cortar texto e deixar ícone ambíguo é a correção que gera o próximo defeito.

## 4. Status em pares

- **TXT-15** · [PR] · P2. Andamento é gerúndio + objeto com reticências ("Salvando cliente…"). Conclusão é objeto + particípio ("Cliente salvo"). Os dois formam par: toda chave de andamento tem a de conclusão.
- **TXT-16** · [PR] · P3. O particípio concorda com a entidade: "Cliente arquivado", "Fatura arquivada". Use uma mensagem por entidade ou ICU `select`. Nunca "{entidade} arquivado(a)".
- **TXT-17** · [PR] · P3. Sem "com sucesso", sem "!", sem "Ops", "Opa" ou "Parabéns". O particípio já diz que deu certo, e o estado atualizado na tela é a prova.
- **TXT-18** · [PR] · P2. Demais status de operação:

| Situação | Forma | Exemplo |
| --- | --- | --- |
| Parcial | Os dois desfechos + ação | "9 de 12 faturas emitidas. Revisar 3 com erro" |
| Rollback otimista | O que não mudou + onde voltou + ação | "Estágio não alterado. A oportunidade voltou para Proposta. Tentar de novo" |
| Indisponível | Motivo + o que libera, ao lado | "Só administradores podem aprovar. Pedir acesso" |
| Desatualizado | Idade + ação | "Atualizado há 12 min. Atualizar" |
| Job | O que começou + onde avisa | "Exportação iniciada. O arquivo fica em Exportações quando terminar" |

- **TXT-19** · [PR] · P2. Status de negócio é substantivo ou particípio do glossário ("Pago", "Vencido", "Em análise"), o mesmo termo em badge, filtro e coluna. Nunca use gerúndio de operação para estado de negócio.
- **TXT-20** · [PR] · P3. Toast narra a consequência, não o comando: ação + objeto + efeito e o próximo passo quando houver ("Fatura 2026/0457 paga · R$ 220.203,00"; "Proposta enviada para Distribuidora Norte"). Rejeição inclui o motivo.

## 5. Erros que dizem o que fazer

- **TXT-21** · [PR] · P2 (P1 se não há recuperação). Erro tem três partes: o que não aconteceu, o estado dos dados e o próximo passo. "Não foi possível salvar. Os dados preenchidos foram mantidos. Tentar de novo". Diga a segunda parte só se for verdade.
- **TXT-22** · [PR] · P2. Erro de campo nomeia o campo e o formato, com exemplo ("Informe a data como DD/MM/AAAA"; "Confira o CNPJ: são 14 caracteres"). Requisito conhecido aparece como ajuda antes de digitar. Erro que se repete pede redesenho, não frase melhor.
- **TXT-23** · [PR] · P2. Código HTTP, nome de exceção e stack nunca na frase principal; ficam num detalhe copiável. "Error 422" vira "CNPJ já cadastrado para Distribuidora Norte Ltda. Abrir cadastro".
- **TXT-24** · [PR] · P2. Nada de "Algo deu errado", "Ocorreu um erro" ou "Tente novamente mais tarde" sem objeto. Nada de "Campo obrigatório" ou "Valor inválido" sem o nome do campo.

## 6. Confirmação que nomeia o objeto

- **TXT-25** · [P] · P1. Confirmação destrutiva reafirma ação e objeto no título, diz no corpo o que se perde com contagens e se dá para desfazer, e nomeia os botões pelo resultado. "Excluir a fatura 2026/0457?" / "A fatura e seus 3 anexos serão excluídos. Não é possível desfazer." / `Excluir fatura` e `Cancelar`. Em lote, a contagem vai no título e no botão. Quando afeta outras pessoas, nomeie quem.
- **TXT-26** · [PR] · P2. Nunca "Tem certeza?". Os rótulos não competem: "Cancelar" ao lado de "Cancelar pedido" confunde; use "Manter pedido" e "Cancelar pedido".
- **TXT-27** · [PR] · P2. Exclusão de conta ou workspace pede digitar o nome, com o botão bloqueado até bater.

## 7. Frases do cliente e do operador

- **TXT-28** · [P] · P1 na ponta do cliente. O cliente lê frase de resultado com data e próxima ação, nunca o estado técnico nem jargão interno. "Em separação · NF 12345" no painel vira "Preparando seu pedido · chega até qui, 21/11" para o cliente. A NN/g usa "Cert. of Posting Created" como exemplo do que não fazer.
- **TXT-29** · [PR] · P2. O operador vê, ao lado do estado interno, a frase que o cliente está lendo. Ambas vêm da tabela de projeção (`pontas-e-sistema.md`), nunca escritas à mão em cada tela.
- **TXT-30** · [PR] · P2. Cor e frase concordam: cancelamento bem-sucedido não vai em banner vermelho de erro.

## 8. Pessoa, gênero e registro

- **TXT-31** · [PR] · P3. Imperativo sem pronome em instrução e erro ("Informe o CNPJ", "Verifique a conexão"). "Você" só onde soa natural. Nunca "o usuário". Evite "nós" em erro; "Não foi possível…" é a forma impessoal padrão. Possessivo de uma perspectiva só: "Meus clientes" ao lado de "Suas configurações" é mistura.
- **TXT-32** · [PR] · P3. Prefira formas neutras de gênero ("Boas-vindas", "Pessoa responsável", "Equipe").
- **TXT-33** · [PR] · P3. Registro técnico e seco no operador: declarativo, com nomes, datas e contagens. Humor nunca em erro, dinheiro, permissão ou saúde; no máximo uma linha no vazio inicial de módulo não crítico. Cliente pode ser mais caloroso, sem perder a frase de resultado. Cartão de voz no `DESIGN.md`: rótulos de 1 a 4 palavras, mensagens de 1 a 2 frases, até 20 palavras.

## 9. Números, plural, dinheiro, datas e fusos

- **TXT-34** · [PR] · P2. Toda mensagem de contagem usa ICU MessageFormat com ramo `=0` explícito, que também vira o texto de vazio ("Nenhum cliente"). Nunca `(s)`, `=== 1 ? "" : "s"` ou frase montada em volta de variável. *Porquê:* `new Intl.PluralRules('pt-BR').select(0)` devolve `one` (CLDR: i = 0..1); sem `=0` sai "0 cliente". `select(1.5)` também é `one`.
- **TXT-35** · [PR] · P2 (P1 em valor monetário). Moeda, número, data, hora relativa e listas saem de formatadores `Intl` únicos por grandeza, com localidade `pt-BR`. `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` gera `R$` + espaço não separável (U+00A0), o que impede quebra entre símbolo e valor. Teste que compara com espaço comum falha; compare com a saída do formatador. Nunca `"R$ " +` concatenado nem `toFixed(2)` exibido.
- **TXT-36** · [PR] · P3. Um padrão de sinal negativo por produto: o hífen do `Intl` ("-R$ 1.234,56") ou o contábil "(R$ 1.234,56)", nunca os dois. Ausente é "—" com motivo acessível; zero é "R$ 0,00". Ausente nunca vira zero.
- **TXT-37** · [PR] · P2. Datas: armazene em UTC com fuso, exiba no fuso de referência do negócio declarado no `DESIGN.md` (em geral `America/Sao_Paulo`, sem horário de verão desde 2019). Acre e Fernando de Noronha têm outros fusos; quando o operador e o cliente podem estar em fusos diferentes, mostre o fuso junto da hora. `2026-12-31T23:30:00-03:00` já é outro dia em UTC: agrupe por dia no fuso de exibição. Nunca `toLocaleDateString()` sem localidade nem data montada com `getMonth()`.
- **TXT-38** · [PR] · P3. Data relativa ("há 12 dias", "em 3 dias") sempre com a absoluta acessível. Período explícito e atual: "Este ano" vira "2026 (jan–nov)".
- **TXT-39** · [PR] · P3. Unidade dentro do rótulo ("12 pedidos vencidos"). Variação sempre com base ("+12,4% vs. outubro"). Listas por `Intl.ListFormat('pt-BR')` ("Ana, Bruno e Carla", sem vírgula serial).
- **TXT-40** · [PR] · P3. Tipografia do texto: `…` em vez de `...`, meia-risca em intervalos ("01–15 nov"), aspas curvas fora de código, `lang="pt-BR"` na raiz.

## 10. Sinais de texto gerado por IA

Um sinal isolado prova pouco; o problema é agrupamento e repetição. Cada proibição tem um movimento positivo ao lado, senão o redator cai no substituto mais próximo.

- **TXT-41** · [PR] · P2. Sem resíduo: lorem, `{{x}}` ou `${x}` na string final, `undefined`, `null`, `NaN`, `[object Object]`, `R$ NaN`, TODO, markdown cru, "Certamente!", "Como uma IA". *Porquê:* vazamento técnico em tela polida denuncia que o microtexto não foi escrito.
- **TXT-42** · [PR] · P2. Sem inglês vazando em UI pt-BR ("Loading", "Save", "Something went wrong", "No results"), salvo termo adotado no glossário.
- **TXT-43** · [PR] · P3. Sem adjetivo de venda sobre o próprio produto (poderoso, robusto, intuitivo, inteligente, completo, sem esforço), sem metáfora morta (hub, ecossistema, jornada, "central de" fora do glossário), sem advérbio de virtude (simplesmente, facilmente, totalmente), sem frase de estoque ("em poucos cliques", "tudo em um só lugar", "de forma simples e rápida"). O adjetivo que fica é mensurável (vencido, pendente, 30 dias).
- **TXT-44** · [PR] · P3. A tela não narra a si mesma ("Nesta tela você pode", "Abaixo estão"). Sem gerúndio de benefício pendurado (", garantindo mais controle"). Termine a frase no fato.
- **TXT-45** · [PR] · P3. Fixture, demo e screenshot sem elenco genérico (Fulano, João Silva, Empresa XYZ, Acme, Cliente 1). Use dados do domínio com comprimentos variados (`verificacao.md`, pior caso). Ambiente de demonstração ganha banner no ambiente, nunca nota em cada número.
- **TXT-46** · [PR] · P3. Teste do concorrente: troque o nome do produto pelo de um concorrente. Se a frase continua verdadeira, ela não diz nada. Vale para título de módulo e onboarding.

## 11. Lint de microtexto

O lint lê strings de i18n, texto JSX, `aria-label`, `title`, `placeholder` e props de tooltip. Níveis FAIL, WARN e INFO; cada achado com ID, contagem, até 4 exemplos com a frase de origem e a correção; saída `--json`; exceção por contexto com allowlist de glossário e siglas; exceção registrada com motivo (`governanca.md`). Achado [PR] nunca é FAIL sozinho no gate; a prioridade é do agente. O lint é proposta não testada contra strings reais: espere falso positivo em "inteligente", "completo", "central" e "Dashboard" até existir a allowlist.

| Checagem | Nível | Detecta | Regra |
| --- | --- | --- | --- |
| `ui-residue` | FAIL | Resíduo e vazamento técnico | TXT-41 |
| `ui-english-leak` | FAIL | Inglês em UI pt-BR | TXT-42 |
| `ui-slop-word`, `ui-stock-phrase` | FAIL | Adjetivo de venda, frase de estoque | TXT-43 |
| `ui-exclaim`, `ui-ops`, `ui-success-filler` | WARN | "!", "Ops", "com sucesso", "Parabéns" | TXT-17 |
| `ui-virtue`, `ui-self-narration`, `ui-gerund-rider` | WARN | Advérbio de virtude, autonarração, gerúndio de benefício | TXT-43, TXT-44 |
| `ui-generic-title`, `ui-question-heading` | WARN | Título genérico em card; título com "?" | TXT-08 |
| `ui-vague-button`, `ui-tem-certeza`, `ui-button-shape` | WARN | OK/Sim/Não, "Tem certeza", botão longo ou sem verbo | TXT-05, TXT-06, TXT-26 |
| `ui-toggle-negative` | WARN | Toggle começando por Não, Desativar, Ocultar | TXT-07 |
| `ui-error-generic` | WARN | Erro sem objeto, campo sem nome, código na frase | TXT-21 a TXT-24 |
| `ui-empty-same` | WARN | Variantes de vazio com a mesma chave ou texto | `estados-e-ui-otimista.md` EST-37 |
| `ui-plural-hack`, `ui-plural-zero` | WARN | `(s)`, ternário de plural, ICU sem `=0` | TXT-34 |
| `ui-participle-generic` | WARN | `(a)`/`(o)` após particípio; template único por gênero | TXT-16 |
| `ui-nbsp-money`, `ui-format-raw` | WARN | `R$` com espaço comum, `toFixed`, data sem localidade | TXT-35, TXT-37 |
| `ui-delta-no-base`, `ui-stale-period` | WARN | Variação sem base; período velho ou sem absoluto | TXT-38, TXT-39 |
| `ui-allcaps`, `ui-title-case-en` | WARN | Caixa alta fora das siglas; Title Case | TXT-09 |
| `ui-tooltip-shape` | WARN; FAIL sem nome | Tooltip longo, com ponto ou diferente do nome acessível | TXT-12 |
| `ui-cast`, `ui-o-usuario` | WARN | Elenco genérico; "o usuário" | TXT-45, TXT-31 |
| `ui-synonym-drift` | WARN, entre arquivos | Sinônimo proibido do glossário | TXT-01 |
| `ui-label-drift`, `ui-format-drift` | WARN, entre arquivos | Mesma ação com redações diferentes; formatos diferentes da mesma grandeza | TXT-03, TXT-35 |
| `ui-status-parallel` | INFO | Gerúndio sem particípio correspondente | TXT-15 |
| `ui-typography`, `ui-por-favor` | INFO | `...`, hífen em intervalo, aspas retas; "Por favor" rotineiro | TXT-40 |

Termo proibido escondido em atributo não renderizado gera WARN, para ninguém burlar o lint movendo a string.

## 12. Antes de terminar

| Padrão detectável | Correção |
| --- | --- |
| `Ops`, `Algo deu errado`, `!` em string | O que falhou + estado dos dados + próximo passo |
| `com sucesso` | Cortar: "Cliente salvo" |
| `Tem certeza`; `>Sim<`, `>Não<`, `>OK<` em diálogo | Título com ação e objeto; botões verbo + objeto |
| `(s)`, `=== 1 ? "" : "s"`, `" + n + "` | ICU com `=0`, `one`, `other` |
| `PluralRules('pt-BR')` sem ramo para zero | Acrescentar `=0` |
| `"R$ " +`, `.toFixed(2)` exibido | `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` |
| `toLocaleDateString()` sem localidade; `getMonth()` em texto | `Intl.DateTimeFormat('pt-BR', { timeZone })` |
| Teste com `"R$ 1.234,50"` digitado com espaço comum | Comparar com a saída do formatador (U+00A0) |
| `{entidade} arquivado(a)` | Mensagem por entidade ou ICU `select` |
| `aria-label` diferente do tooltip; `title` junto de `aria-label` | Um texto só, igual nos dois |
| `aria-label="lixeira"` | `aria-label="Excluir contrato 2026/0457"` |
| Placeholder "Digite o e-mail" sem rótulo | Rótulo "E-mail" + placeholder de exemplo |
| Toggle "Desativar…" | Descrever o estado ligado |
| "Salvar Alterações" | "Salvar alterações" |
| "Visão geral", "Desempenho" em card | Nome da métrica + recorte |
| "Nesta tela você pode…" | Remover ou dizer o escopo |
| Fulano, João Silva, Acme em fixture | Dados do domínio com comprimentos variados |
| "Novo cliente" × "Adicionar cliente" no mesmo app | Uma redação, do glossário |

## 13. Fontes

- NN/g: [Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/), [Status Trackers](https://www.nngroup.com/articles/status-tracker-progress-update/), [Indicators, Validations, Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)
- W3C: [1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
- Unicode CLDR: [Plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html); MDN: [Intl.PluralRules](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules), [Intl.NumberFormat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- Design systems: [Carbon](https://carbondesignsystem.com/), [Atlassian](https://atlassian.design/)
- Praticantes: `better-writing` (Jakub Krehel); `design-taste-frontend` 2.5.1, arquivos `copy*.md` e `copy-lint.mjs` (lido, não executado); demos code&chill (Bastio, Caelo, Wynlo, Ostrel, Rapport)
