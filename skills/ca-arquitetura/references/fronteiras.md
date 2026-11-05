# Fronteiras verificadas por máquina

## Lista conhecida que só encolhe

Para adotar fronteiras num código que já existe sem parar tudo:
- toda violação atual entra numa lista de conhecidas;
- violação **nova** falha o CI;
- violação corrigida que continua na lista também falha, até ser removida;
- criar ou aumentar a lista no CI é proibido; só uma pessoa aumenta, com motivo no PR.

Ferramentas que já fazem isso: Packwerk (`package_todo.yml`, modo `strict`), ArchUnit (`FreezingArchRule`), dependency-cruiser (`--baseline`, `--ignore-known`). Em TypeScript, dependency-cruiser no CI e eslint-plugin-boundaries no editor.

## Ao achar uma violação, nesta ordem

1. Usar a API pública do dono.
2. Mudar a API pública do dono.
3. Declarar a dependência no manifesto (se for permitida).
4. Redesenhar.
5. Só então registrar na lista, com justificativa no PR.

## Fitness functions de todo projeto

Cada uma roda no CI e falha o build. As marcadas [lista] usam a lista que só encolhe.

1. Todo módulo tem manifesto válido, com dono.
2. Dependência só para o que o manifesto declara. [lista]
3. Acesso a outro módulo só pela porta, interface ou ponto. [lista]
4. Sem ciclos entre módulos.
5. Direção: núcleo não depende de módulo; domínio não depende de adapter; plataforma não depende de produto.
6. Toda tabela tem exatamente um dono; SQL de um módulo que toca tabela de outro falha. [lista]
7. Evento publicado está declarado no manifesto do publicador; consumido só por quem declara.
8. Cada migração pertence a um módulo e só toca tabelas dele.
9. A lista de conhecidas nunca cresce.
10. Regra de arquitetura que não avalia nenhum elemento falha (não existe teste vazio que passa).
11. O módulo sobe isolado, só com o que declara.
12. Porta, ponto e evento têm contrato com tipo explícito.
13. A documentação gerada dos módulos é igual ao código.
14. Sem segredo no repositório, sem dado pessoal em log, só dependências aprovadas.
15. O fluxo crítico passa com cada opcional nos quatro estados (matriz de composição e teste gêmeo, `ciclo.md`).
16. **Um fluxo por tarefa.** Cada ação de negócio (devolver, cancelar, aceitar, concluir) tem uma única entrada que a executa; telas e atalhos chamam essa entrada, nunca uma porta paralela com outros passos. Rígida para o que move dinheiro, estoque ou dado pessoal: um segundo fluxo existente não entra na lista de conhecidas, é corrigido na própria entrega. Nos demais casos, exceção declarada numa lista que só diminui. No PMD, um atalho de devolução revisado e testado criou um segundo fluxo que pulava o caso, e oito fluxos duplicados foram achados no painel.
17. **Campo declarado tem leitor.** Um campo do manifesto ou do contrato (`contract_version`, por exemplo) que nenhum código lê é pior que nenhum: passa por garantia. Um teste falha se um campo declarado não tiver leitor.

## Suíte de conformidade do módulo

Todo módulo passa pela mesma suíte, gerada do manifesto, e cada checagem é provada por um defeito plantado: manifesto válido; dono de cada objeto; dependências só declaradas; sem acesso a internos; tabelas com camada, classe e retenção; eventos declarados; portas com contrato; os quatro estados; resposta na ausência; obrigações cobertas quando desligado. Módulo novo nasce passando nela.

## Adoção

Poucas regras que as pessoas querem valem mais que muitas regras duras: regra dura demais gera gambiarra (lição da Shopify). Comece permissivo, com a lista, e endureça módulo por módulo. Meça quantos módulos cada PR toca; PR que atravessa muitos módulos é sinal de fronteira errada.
