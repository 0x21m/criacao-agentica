# Modelo de rodada de aprovação

Use a cada protótipo mostrado ao usuário. A rodada pede decisões, não elogios: fluxo e conteúdo primeiro, visual depois, porque um protótipo bonito tende a ser aprovado pela aparência com o fluxo errado.

Mantenha a mensagem curta. O protótipo mostra; este texto diz o que olhar e o que responder.

---

## Protótipo v<N> · <fluxo ou app> · sem back-end, dados de exemplo

**Tamanho da mudança:** ajuste | tela ou fluxo | app novo (rodada v1 enxuta: protótipo navegável com as direções como presets do painel de aparência e quadro de fluxos; v2 fluxos completos com todos os estados; v3 visual e movimento)

**Objetivo:** uma frase com a tarefa que o protótipo resolve e para quem, por ponta.
Exemplo: "O cliente acompanha a ordem de serviço e aprova o orçamento pelo celular; o atendente vê a mesma OS no painel e sabe o que o cliente está lendo."

## O que está sendo mostrado

- **Em escopo:** telas, pontas e estados incluídos.
- **Viewports:** desktop 1366×768, tablet 768×1024, celular 390×844.
- **Estados:** carregando, vazio inicial, vazio filtrado, erro, sem permissão, pior caso pt-BR, conflito entre pontas (marque os que existem neste fluxo).

## Formatos usados

| Formato | Onde ver | Para decidir |
| --- | --- | --- |
| Quadro de fluxos | link ou imagem | a jornada está certa? faltam ramos? |
| Antes e depois lado a lado | link ou imagem | a mudança melhora, com os mesmos dados? |
| Vídeo ou GIF | só se você pedir (PRO-25) | o movimento se aprova no protótipo: veja a rota e o gatilho de cada ação-chave e momento abaixo |
| Protótipo funcional | URL local ou artefato privado; direções trocadas pelo painel de aparência em Configurações (PRO-27) | dá para usar de ponta a ponta? os estados aguentam? qual direção? |

Use só os que servem a esta rodada. Em ajuste, o lado a lado basta. Capturas não são entrega: as que existirem são do verificador (PRO-28). O protótipo abre com cara de app: o aviso e os seletores de estado e de vista aparecem com a tecla **F** (ou `?controles=1` no link, PRO-24).

## Decisões pedidas

De 2 a 5, numeradas, fluxo e conteúdo antes do visual. Cada uma com a recomendação e o porquê, para o usuário poder responder "ok".

1. **Fluxo.** Depois de o reparo começar, o cliente não cancela mais pelo app; o botão vira "Falar com a loja" (quadro 3). Recomendo assim, porque a peça já pode ter sido trocada. Concorda?
2. **Conteúdo.** O cliente lê "Aguardando uma peça. Nova previsão: seg, 02/12" em vez de "Aguardando peça F-2231". Ok?
3. **Estados.** Orçamento vencido fica visível com "Pedir novo orçamento", em vez de sumir. Ok?
4. **Visual.** Detalhe da OS no painel em painel lateral (A) ou página inteira (B)? Recomendo A, porque o atendente alterna entre OS da fila.

Na v1 do modo criar, a legenda de cada direção (PER-19, PER-20):

| Direção (preset) | Densidade | Layout da tela-chave | Par tipográfico (texto / título · origem · licença) | Material e profundidade (planos, gradiente, sobreposição, textura) | Momento-assinatura da tela-chave (rota e gatilho) |
| --- | --- | --- | --- | --- | --- |
| Bancada | … | … | … | … | … |

## Passada de vida (EXP-48)

| Pergunta | Pilar | Tela e elemento |
| --- | --- | --- |
| Onde este app responde antes de terminar? | Velocidade sentida | … |
| … (todas as linhas de EXP-48) | … | … ou "não feito, por quê" |

## Checklist de presença (VER-34)

| Item SEMPRE (`niveis-de-regra.md`) | Onde está (rota, elemento, arquivo) |
| --- | --- |
| Starter, abertura, carregamento com a marca, painel de aparência, kit de movimento, … (todas as linhas) | … ou "falta" |

Navegação (PRO-26): saída de `scripts/navegar.mjs`, colada aqui.

Arsenal (ARS-01), por tela-chave: componente importado do arsenal; ou o componente do 21st com a **Proposta de adição ao arsenal** (nome, link, por que serve, onde entra); ou a busca sem resultado e por quê. Kit de componentes fornecido, quando houver (ARS-09): componente · onde entrou ou por que ficou fora · licença.

## Referências usadas

| Referência | Fonte e link | O que foi aproveitado | O que não copiar |
| --- | --- | --- | --- |
| Rastreio de pedido de app de entrega | Mobbin, link | data grande no topo com chip de confiança; próxima ação muda com o estado | ilustrações e cores da marca |
| Detalhe de pedido de admin de e-commerce | Refero, link | dois badges separados (pagamento e entrega); timeline com "o cliente recebeu este e-mail" | layout exato da barra lateral |
| … | … | … | … |

Licenças de código usado e créditos de fotos, se houver: …
Imagens de bibliotecas de referência não vão para o repositório nem para documentos compartilhados; só o link.

## Versão e mudanças

- **Esta versão:** v<N>, em `prototipos/<fluxo>/v<N>/`.
- **Mudou desde v<N-1>:** o que mudou e por qual comentário.
- **Versões anteriores** ficam guardadas; nenhuma versão aprovada é sobrescrita.

## O que ficou de fora

- Fora desta rodada, de propósito: por exemplo, cor final da marca, ilustrações, e-mail em HTML.
- Não avaliar agora: o que ainda vai mudar e não merece comentário.
- Suposições a validar: dados ou regras que o protótipo assumiu.

## Como responder

Responda pelos números, do jeito que for mais fácil:

- "ok" aprova tudo como recomendado;
- "1 ok, 2 prefiro X, 4 B" aprova item por item;
- comentários direto na tela, se o protótipo estiver num artefato com comentários.

Depois do "sim", registro a aprovação como DEC em `docs/04-ui-ux.md`, seção "Decisões" (versão, decisão, quem aprovou, data, links, o que foi rejeitado) e começo a construção a partir desta versão. Se você preferir pular o portão, diga isso explicitamente; registro o pulo com data e escopo.
