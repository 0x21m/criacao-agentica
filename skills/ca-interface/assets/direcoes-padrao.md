# Direções padrão (definidas pelo dono)

As direções de todo protótipo saem **desta lista de presets**, adaptados à marca do produto. O agente **não inventa direções**: com direção livre, ele escolhia qualquer coisa e o resultado saía genérico e feio. Quem muda esta lista é o dono, editando este arquivo. Cada preset é um template completo do starter (`assets/arsenal/starter/`, painel de aparência), com fonte, densidade, material, fundo e movimento próprios, não só outra cor.

| Preset | Arquétipo | Caráter | Referência aprovada | Quando funciona melhor |
|---|---|---|---|---|
| **Noite** (padrão) | Moderno | Escuro tingido, acento vivo, cabeçalho com saudação e números sobre o fundo, card de atenção sobreposto, cards tingidos por status | Noite da barbearia (iteração 3) | painéis de operação, apps de serviço, marcas com presença |
| **Vidro** | Premium em movimento | Estilo Apple Liquid Glass: fundo com imagem ou gradiente rico, vidro com refração e desfoque, borda de luz, molas e elementos que respiram; vidro ligado por padrão | coleção de vidro do MIFT com o fundo ambiente do starter | app do cliente, portal, marcas premium, momentos de marca |
| **Sóbrio** | Sóbrio | Claro e limpo, contido, quase sem efeito, densidade de ferramenta séria, hierarquia por tipografia e espaço | Oficina (Conecta, iteração 3) | ERP, financeiro, back-office, quem passa o dia na tela |
| **Aurora** | Moderno | Azul profundo com o gradiente de núcleo e brilho do peak-chart | peak-chart e market-card do arsenal | finanças, dados, SaaS |
| **Sinal** | Moderno (variação marcante) | Preto com o laranja da marca e brilho no cabeçalho | Sinal (Conecta) ou Navalha (barbearia) | marcas fortes, varejo, assistência |

## A rodada v1

- Mostra **3 direções**: por padrão **Noite, Vidro e Sóbrio**, que são os três arquétipos.
- O agente pode trocar uma delas por Aurora ou Sinal quando a marca pedir (por exemplo, uma marca laranja vai melhor no Sinal), dizendo o motivo na legenda.
- Nunca entra uma direção fora desta lista.

## Fora da lista de propósito

- **Título serifado com texto neutro** (o antigo preset "Areia"): virou assinatura de interface feita por IA. Só entra se a marca do produto pedir serifa.

## O que é trocável em cada preset

- acento e cores de status (vindos da marca);
- par tipográfico (da lista de fontes livres, PER-18);
- imagem ou gradiente de fundo;
- logo e banner.

O caráter não muda: densidade, material, nível de efeito e movimento ficam como no preset.

## O que vale para todos

- **Escala contida:** premium é contenção (base de 14 px, título de página de 20 a 24, KPI de 24 a 32). "Tudo grande demais" foi o defeito comum das direções favoritas.
- As 4 combinações de claro e escuro, com e sem vidro.
- O material único do sistema: o elemento-assinatura dita todas as superfícies.
- A mesma tela-chave em todas as direções, com variação de layout e densidade (PER-19).
