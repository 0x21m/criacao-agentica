# Fontes e ferramentas prontas primeiro

Antes de construir uma solução ou de responder sobre uma stack, procure o que já existe. É o degrau "já existe?" da ponytail aplicado ao trabalho do agente: uma skill, um MCP, uma CLI ou uma API pronta faz melhor e mais barato que código ou instrução escritos do zero, e a documentação oficial vence a memória do modelo, que tem data de corte.

Vale para toda tarefa que toca uma stack, um serviço ou uma ferramenta: GitHub, Supabase, Mercado Pago, um framework, o próprio Claude Code.

## Ordem de busca

Pare no primeiro degrau que resolve com segurança:

1. **Skill instalada** para o assunto. Olhe a lista de skills disponíveis. Muitos fornecedores publicam skills oficiais (bancos de dados, meios de pagamento, bibliotecas de componentes, frameworks de teste, a API do Claude).
2. **MCP conectado** que já faz ou documenta a coisa. Exemplos: o MCP de um banco de dados com busca na documentação (`search_docs`), o MCP de um meio de pagamento com `search_documentation`. Ferramenta adiada (deferred) se carrega com ToolSearch.
3. **CLI oficial instalada**, que costuma ser a forma mais eficiente para um agente: `gh` (GitHub), `supabase`, `claude plugin`, a CLI do framework. Confira com `--help` antes de presumir o que ela não faz.
4. **API oficial**, quando não há CLI nem MCP.
5. **Documentação oficial na web**, pelo índice para agentes quando existir (`/llms.txt`), por exemplo `https://code.claude.com/docs/llms.txt`. Use WebFetch na página exata. Sobre o Claude Code, o subagente nativo `claude-code-guide`.
6. **O que existe e não está instalado:** skill (skill `find-skills`), MCP (`mcp__mcp-registry__search_mcp_registry`, `suggest_connectors`) ou plugin de marketplace (`claude plugin marketplace list`). Instalar ou conectar é decisão da pessoa: proponha com o nome, a origem e o que resolve, e siga pelos degraus acima enquanto isso.

Só então escreva a solução, a menor que funciona.

**Fonte oficial** é a do dono da tecnologia: a documentação do fornecedor, o repositório oficial, a skill ou o MCP publicados pelo fornecedor. Artigo, fórum e resposta de outro modelo servem, no máximo, de pista para achar a fonte. Ferramenta de terceiros passa pelas mesmas regras de qualquer dependência: origem conhecida, e instalação só com o ok da pessoa.

## Registro

Na TAR, seção "Fontes", uma linha por consulta ou ferramenta que influenciou a construção:

```
- <skill, MCP, CLI, API ou URL> — <o que confirmou ou fez> — <data>
```

Se a tarefa não toca nada externo, escreva `nada externo`. Se a fonte oficial contradiz o que o PRD ou o TRD presumem, abra uma LAC com os dois lados; não escolha sozinho. Uma ferramenta pronta que vale para o projeto inteiro (um MCP, uma CLI) vai para o TRD, em "Integrações", para a próxima sessão não ter de procurar de novo.

## Quem faz o quê

- **Sessão principal**, ao especificar: decisões de stack e capacidade de serviço (o campo "Fonte" da ADR), e a proposta de instalar o que falta.
- **`ca-construtor`**, antes de editar: segue a ordem acima para cada stack que a TAR toca e relata as fontes; a sessão principal as grava na TAR.
- **`ca-revisor-plano`**: recusa uma TAR de risco alto que toca stack externa sem fonte registrada para as escolhas que importam, ou que constrói à mão algo que uma ferramenta instalada já faz.
