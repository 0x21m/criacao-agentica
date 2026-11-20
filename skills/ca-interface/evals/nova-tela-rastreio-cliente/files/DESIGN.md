# DESIGN.md — Casa Vela (loja de velas e decoração)

## Tokens (semânticos)
- Cores: --color-bg-page #F7F4EF; --color-bg-panel #FFFFFF; --color-text #1F1B16; --color-text-secondary #5E564C; --color-border #E4DDD2; --color-accent #8A4B2A; --color-success #2F6B3F; --color-warning #8A6A12; --color-danger #A33A2C
- Espaço: 4, 8, 12, 16, 24, 32, 48
- Tipo: Inter; 12/16, 14/20, 16/24, 20/28, 24/32; pesos 400, 500, 600; números tabulares
- Raio: 8 (controles), 12 (cards)

## Componentes existentes
Button (primary, secondary, ghost), Badge (neutral, success, warning, danger), Card, Timeline, Toast (com ação), Dialog, Sheet (celular), Stepper, EmptyState, Skeleton.

## Objeto Pedido — estados internos (painel do operador)
| Estado interno | Rótulo no painel |
| --- | --- |
| aguardando_pagamento | Aguardando pagamento |
| pago | Pago |
| em_separacao | Em separação |
| embalado | Embalado |
| despachado | Despachado (código de rastreio) |
| em_rota | Em rota de entrega |
| entregue | Entregue |
| tentativa_falhou | Entrega não realizada |
| cancelamento_solicitado | Cancelamento solicitado |
| cancelado | Cancelado |
| reembolsado | Reembolsado |

Notas internas do operador e o custo do frete negociado nunca aparecem fora do painel.

## Decisões
- 2026-09-10: painel usa navegação lateral; detalhe do pedido em painel lateral com URL própria.
- 2026-10-02: avisos ao cliente por e-mail; WhatsApp em estudo.
