# Níveis de regra e checklist de presença

O nível diz **se a regra é obrigatória e quando**. Ele não substitui o selo ([N], [P], [DS], [PR], [N casa]), que diz de onde vem a força, nem a prioridade (P0 a P3), que diz o tamanho do dano quando a regra falha. Os três aparecem juntos.

## A escala

| Nível | O que quer dizer | O que acontece quando falta |
| --- | --- | --- |
| **SEMPRE** | Tem que existir em todo app criado do zero (modo 1) e em toda ponta nova. É regra de **adicionar**: não é opcional e não depende de gosto | A ausência bloqueia a aprovação da rodada. É achado P1, ou a prioridade da regra se for maior |
| **QUANDO** | É obrigatória se a condição escrita na regra se cumpre ("em tabela", "no celular", "em tela de operação", "no modo criar") | Com a condição cumprida, é obrigatória: P0 e P1 bloqueiam a aprovação; P2 é corrigida antes da rodada ou registrada como exceção |
| **RECOMENDADO** | Dica de acabamento ou de repertório. Use quando couber | Não bloqueia; a revisão pode sugerir |
| **ALERTA** | Diz quando usar e quando não usar, no lugar de proibir (blur, loop, gradiente, enfeite) | Uso fora do quando é achado na prioridade do alerta |

## Como cada regra é marcada

- As regras SEMPRE levam a marca `SEMPRE` ao lado do selo e da prioridade (por exemplo, `**ARS-11 [N casa] P1 · SEMPRE**`). Regras novas e reescritas da 0.15 trazem o nível escrito.
- Regra sem nível escrito segue a prioridade: **P0, P1 e P2 são QUANDO** (obrigatórias onde a condição delas se cumpre; P0 e P1 bloqueiam a aprovação, P2 é corrigida ou registrada como exceção); **P3 é RECOMENDADO**; texto marcado como *alerta* ou "(alerta)" no checklist é **ALERTA**.
- `processo` (regra de método) é QUANDO: vale sempre que o agente faz aquele passo.
- O `checklist.md` tem a coluna "Nível" com o nível de cada ID.

## Como escrever uma regra

Escreva no imperativo e diga a consequência: "é obrigatório", "não é opcional", "a ausência bloqueia a aprovação". O agente tende a fazer o mínimo quando a regra soa opcional; "considere", "pode", "se quiser" ficam só no nível RECOMENDADO.

## Checklist de presença do app criado do zero

Tudo o que é SEMPRE, numa lista só. Antes de mostrar a rodada, o agente confere cada linha; a verificação (VER-34) confere de novo e aponta cada falta como achado. O starter (`assets/arsenal/starter/`) já traz as peças prontas para quase todas as linhas; `starter-erp.md` resume onde está cada uma.

| # | O que tem que existir | Regra | Como conferir |
| --- | --- | --- | --- |
| 1 | Protótipo copiado do starter ERP, com os pontos de troca trocados e só os módulos do produto | ARS-11 | `registro.ts` e `proto/dados.ts` do starter no projeto |
| 2 | Cada tela-chave com pelo menos 1 componente do arsenal ou do 21st, importado de verdade; proposta de adição quando veio do 21st | ARS-01 | `import` no arquivo da tela; proposta na rodada |
| 3 | Tela de abertura com o logo revelado em vidro, uma vez, com "Pular" | EXP-60 | abrir o app limpo; repetir com movimento reduzido |
| 4 | Carregamento inicial com a marca, não um spinner solto | EST-49 | abrir com latência simulada |
| 5 | Folha do sistema em claro e escuro antes das telas | PRO-23 | rota da folha |
| 6 | Moldura completa e uma ação principal por tela | EXP-36 | B22 |
| 7 | Protótipo funcional e navegável de ponta a ponta; sobre o build, `navegar.mjs` sai limpo e `medir.mjs` fica nas metas | PRO-26, VER-36 | saída dos scripts |
| 8 | Painel de aparência com claro e escuro e vidro como toggle independente, parâmetros ao vivo e os presets de direção | PRO-27 | tela de configurações |
| 9 | Controles do protótipo ocultos, com a tecla F | PRO-24 | B30 |
| 10 | Kit de movimento mínimo: transição de tela, controle com mola ou líquido, número que rola, gráfico que se desenha, texto de destaque com entrada, cards escalonados, estado ao vivo que pulsa; tudo com movimento reduzido | MOV-35 (MOV-25, MOV-26, MOV-31) | B23, B24, B27, B31 |
| 11 | 2 ou 3 momentos-assinatura do domínio, rodando no protótipo | EXP-02, EXP-56 | rodada e protótipo |
| 12 | Passada de pior caso feita e sem quebra aberta | VER-32 | relatório da passada |
| 13 | Nenhuma informação do brief perdida pela estética | EXP-59 | brief × tela-chave |
