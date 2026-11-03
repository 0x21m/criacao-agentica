# Quando algo falha

Classifique a falha antes de tentar de novo. Repetir o mesmo comando sem uma hipótese nova não é progresso. Bug no código: use a skill `diagnosing-bugs`; a correção vai na raiz, no código compartilhado, como a ponytail pede.

| Falha | Resposta |
|---|---|
| O pedido foi mal entendido | Volte a perguntar; atualize PRD ou CA |
| O plano estava errado | Replaneje a TAR e registre o desvio |
| Faltava algo para começar (credencial, dado, decisão) | Abra uma LAC `bloqueia-tarefa` e siga com o trabalho independente |
| A verificação não confirmou | Desconfie do instrumento antes do código: build velho, cache, elemento errado |
| Faltou ferramenta, permissão ou autoridade | Diga isso e leve à pessoa; nunca entregue menos em silêncio |

Ao escalar para a pessoa ou para um recurso mais capaz, leve o que já foi tentado e descartado. Uma falha que importou deixa a verificação que a teria pego; um erro corrigido duas vezes vira uma linha em "Erros a não repetir" no CLAUDE.md, e uma linha violada duas vezes vira teste ou hook.
