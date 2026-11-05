---
name: ca-arquitetura
description: Padrão de módulo para sistemas complexos e modulares construídos com IA (ERPs, mas também módulos de conversa, automação, IA que lê os outros módulos, integrações com o mundo físico). Define o núcleo soberano, o manifesto tipado de cada módulo, os estados de um módulo (ausente, ligado, desligado com dados, removido), a ponte entre dois módulos, a tabela satélite, os pontos entre módulos (invariante e reação), a instalação com backfill, a remoção que preserva dados e as fronteiras verificadas por máquina. Use ao criar, ligar, desligar, remover ou integrar um módulo, ao decidir onde fica um campo, regra, estado ou integração nova, ou quando um módulo precisar ler ou reagir a outro, mesmo que a pessoa não diga "módulo".
metadata:
  version: "0.11.0"
---

# Arquitetura de sistemas modulares

O sistema é um **núcleo pequeno e soberano** mais **módulos** de qualquer tipo. Cada módulo se declara num manifesto; o que o manifesto não declara não existe. A regra que precisa valer mora no banco (skill `ca-dados`); esta skill decide **onde** cada coisa mora e **como** os módulos se encaixam.

Fontes: o padrão de módulo do PMD, comparado com Odoo, ERPNext, Tryton, iDempiere, OFBiz, Spring Modulith e Packwerk (Shopify). Ver `references/fontes.md`.

## As regras do padrão

1. **Núcleo soberano.** O núcleo não nomeia nenhum objeto de módulo opcional. Ele publica o que qualquer módulo pode ler e em que ledger pode escrever.
2. **Manifesto tipado por módulo** (`references/manifesto.md`): dono, tipo, dependências com resposta na ausência, portas, poderes, tabelas com classe e retenção, pontos, eventos, condição de instalação, backfill, níveis de desligamento.
3. **Um dono por objeto.** Toda tabela, função, coluna de configuração e evento tem exatamente um módulo dono. Outro módulo escreve nela só pelas portas do dono.
4. **Campo sobre o registro de outro dono vai numa tabela satélite**, com a chave do registro dele. Nunca coluna injetada na tabela do outro nem método sobrescrito (o monkey-patch do Odoo e o `extend-entity` do OFBiz são o que não fazer).
5. **Módulo opcional só depende de módulo fixo.** Dependência entre dois opcionais mora numa **ponte**, um terceiro módulo que só existe quando os dois estão ligados.
6. **Toda dependência declara a resposta na ausência:** política ausente devolve `null`; consulta ausente devolve "ausente", nunca um zero fingido; comando ausente devolve `MODULO_INDISPONIVEL`.
7. **Quatro estados, e desligar não destrói dados** (`references/ciclo.md`): ausente, ligado, desligado com dados, removido. Remoção é recusada enquanto houver trabalho aberto.
8. **Pontos entre módulos com modo** (`references/pontos.md`): **invariante** roda dentro da transação e pode vetar; **reação** roda depois do commit, por outbox, e sua falha não desfaz o fato; reação na mesma transação só sem efeito externo nem obrigação. **Reação com obrigação** declara quem a cumpre quando o módulo está desligado.
9. **Fronteira verificada por máquina** (`references/fronteiras.md`), com uma lista de violações conhecidas que só encolhe, a suíte de conformidade de todo módulo, a matriz de composição e o teste gêmeo.
10. **Um fluxo por tarefa.** Cada ação de negócio tem uma entrada só; atalho chama o fluxo existente. Rígido para dinheiro, estoque e dado pessoal.
11. **Na dúvida sobre onde algo mora, use a tabela "Onde vai o que é novo"** (`references/onde-vai.md`) antes de inventar.

## Como trabalhar

- **Módulo novo:** escreva o manifesto antes do código, passe pelas regras acima, registre as invariantes do módulo pela `ca-dados`, e só então especifique as tarefas.
- **Mudança que cruza módulos:** identifique o dono de cada objeto tocado. Se a mudança exige escrever em tabela de outro dono, ou ela vira uma porta do dono, ou o modelo está errado.
- **Ligar sobre dados existentes:** o backfill é declarado no manifesto, idempotente e testado.
- **Padrões distribuídos** (saga, CQRS com bancos separados, event sourcing, microserviço) só quando o degrau mais simples se esgotou. A escada está em `references/onde-vai.md`.

## Família

- **Chame a `ca-dados`** para cada tabela, porta e evento do manifesto: as invariantes do módulo (registro INV), o mecanismo no banco e os testes adversariais.
- **Volte à `criacao-agentica`** para registrar: o manifesto e as decisões entram nos documentos e nas ADR, o módulo vira TAR e o estado vai para o ESTADO.

## Referências

| Arquivo | Leia quando |
|---|---|
| `references/manifesto.md` | criar ou mudar um módulo; o formato do manifesto |
| `references/ciclo.md` | instalar, ligar, desligar, remover, atualizar, ponte, backfill |
| `references/pontos.md` | um módulo precisa consultar, vetar ou reagir a outro; eventos e outbox |
| `references/fronteiras.md` | verificar fronteiras e montar as fitness functions |
| `references/onde-vai.md` | decidir onde mora um campo, regra, estado, relatório ou integração; escada de padrões |
| `references/fontes.md` | conferir de onde veio cada regra |
