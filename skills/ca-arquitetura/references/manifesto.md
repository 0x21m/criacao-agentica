# Manifesto de módulo

Um arquivo por módulo, versionado com o código (`modulos/<id>/modulo.yaml` ou o equivalente da stack). Menu, rotas, permissões e a tela de módulos podem ser gerados dele. Um teste falha se o manifesto e o código divergirem.

## Formato

```yaml
id: estoque                      # estável; nunca reaproveitado
nome: Estoque
versao: 1.4.0
tipo: opcional                   # nucleo | fixo | opcional | ponte
dono: equipe-operacoes           # quem responde pelo módulo
descricao: Saldos e movimentos de produtos por local.

depende_de:                      # opcional só depende de nucleo ou fixo
  - modulo: catalogo
    usa: [produto]               # o que usa do outro
    na_ausencia: recusa          # recusa | nulo | ausente | valor_fixo
ponte_entre: []                  # só em tipo: ponte, ex. [vendas, estoque]

instala_quando:                  # condição de contexto (opcional)
  pais: [BR]
  segmento: []

tabelas:
  - nome: estoque.movimentos
    camada: bruto                # bruto | estado | derivado | definicao (ca-dados, camadas.md)
    classe: operacional          # config | operacional | pessoal | financeiro | fiscal
                                 # valor monetizável (pontos, crédito, saldo) é financeiro
    so_insercao: true
    retencao: "enquanto existir o produto"
    eraser: null                 # função que apaga ou anonimiza por titular, se houver dado pessoal
  - nome: estoque.saldos
    camada: derivado
    classe: operacional
    derivada_de: estoque.movimentos
    recalcula: estoque.recalcular_saldos

portas:                          # funções públicas de escrita e leitura
  - nome: estoque.reservar
    poder: estoque.reservar
    contrato: v1
interfaces:                      # funções privadas que outro dono pode chamar
  - nome: estoque.disponivel
poderes:
  - id: estoque.reservar
    segundo_fator: false
  - id: estoque.ajustar
    segundo_fator: true
    duas_pessoas: false

pontos_oferecidos:               # perguntas, comandos e eventos que outros respondem
  - id: estoque.antes_de_emitir
    tipo: pergunta               # pergunta | comando | evento
    contrato: v1
respostas:                       # pontos de outros módulos que este responde
  - ponto: vendas.antes_de_confirmar
    modo: invariante             # invariante | reacao | consulta (resposta a ponto do tipo pergunta)
    realizacao: transacao        # reacao: outbox (padrão) | savepoint (só sem efeito externo nem obrigação)
    obrigacao_sem_modulo: null   # reacao com obrigação: quem cumpre quando este módulo está desligado
eventos_publicados:
  - id: estoque.movimento_registrado
    contrato: v1
    chaves: [produto_id, local_id, quantidade, origem]

desligamento:                    # o que acontece em cada nível
  ocultar: menus e telas somem
  negar_poder: portas recusam com MODULO_INDISPONIVEL
  desligar: dados ficam, leituras devolvem "ausente"
  remover: recusado se houver reserva aberta

backfill:
  - funcao: estoque.backfill_saldos
    idempotente: true
dados_semente:
  - chave: estoque.local_padrao   # chave natural estável
migracoes: modulos/estoque/migracoes/
```

## Regras do manifesto

- **Núcleo e módulos fixos também têm manifesto**, com os pontos que oferecem. Se um opcional precisa de um ponto que o dono não oferece, a mudança é no dono (com ADR), nunca no opcional.
- **Sem manifesto, sem módulo.** Objeto sem dono declarado falha a verificação de fronteira.
- **Dependência só para módulo fixo ou núcleo.** Precisa de outro opcional? Crie uma ponte (`tipo: ponte`, `ponte_entre`).
- **Toda dependência tem `na_ausencia`.** Não existe dependência "que sempre estará lá" para um opcional.
- **Camada, classe e retenção em toda tabela.** A retenção declara o gatilho ("após o fim do exercício", "após o último pedido"); o prazo e a base legal são decisão da pessoa e ficam em branco até ela decidir. Tabela com dado pessoal tem `eraser`; num ledger só de inserção, o eraser troca a referência ao titular por um pseudônimo (a tabela de correspondência é que se apaga), sem editar o movimento.
- **Contrato versionado em toda porta, ponto e evento.** Mudar a forma exige versão nova; a porta lê a versão do chamador e serve a antiga ou recusa nomeando o campo, nunca muda em silêncio.
- **Campo declarado tem leitor.** Declare só o que algum código lê e algum teste confere.
- **Eventos projetam só as chaves declaradas.** Coluna nova na tabela não vaza para o evento por acidente.
