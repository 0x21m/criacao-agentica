# Licenças dos componentes de referência

Pesquisa feita em 16/11/2026 nas páginas públicas do 21st.dev (versão `.md` de cada componente, que mostra os campos Author, Library e License), nos sites dos autores e nos repositórios do GitHub. Nenhuma conta foi criada.

Objetivo: decidir o que pode entrar, adaptado, no repositório público github.com/0x21m/criacao-agentica.

## Regra geral do 21st.dev

Os termos do 21st.dev (https://21st.dev/terms) **não dão licença padrão** ao que é publicado lá:

- O conteúdo do marketplace pertence aos autores e à 21st Labs (seção 2).
- É proibido redistribuir, vender ou licenciar o conteúdo "sem autorização" (seção 3). A licença que o autor declara na página do componente é essa autorização.
- Copiar um componente para outro site ou plataforma exige link visível de volta para a página original no 21st.dev (seção 3).
- Usar o conteúdo para treinar modelos de IA exige consentimento escrito (seção 3).
- MIT permite reuso, mas não permite publicar o trabalho de outra pessoa como se fosse seu (seção 3.1).
- Demos, prévias e mídia do 21st (inclusive imagens do `cdn.21st.dev`) não vêm junto com o código.

Consequência: componente com licença MIT na página pode ser publicado adaptado, mantendo o aviso de copyright e a licença MIT, com crédito ao autor e link para a página no 21st.dev. Componente com licença "unknown" não traz autorização: fica só local.

## Tabela

| # | Componente | Autor | Licença encontrada | Fonte (URL) | Pode publicar adaptado num repositório público? | Observação |
|---|---|---|---|---|---|---|
| 1 | peak-chart | Louis Studios (studios.lou15.com) | MIT (página do 21st.dev) | https://21st.dev/@louisstudios/components/peak-chart.md · https://studios.lou15.com/license | sim com atribuição | A licença do próprio estúdio proíbe publicar o código em repositório (seção 4), mas a seção 11 diz que a cópia obtida no 21st.dev segue os termos do 21st.dev, onde está MIT. Manter o cabeçalho "by Louis Studios" e o link. Não usar cópias tiradas do site do estúdio (essas não são MIT). Como as duas regras convivem, vale um aviso de cortesia ao autor. |
| 2 | market-card | Louis Studios (studios.lou15.com) | MIT (página do 21st.dev) | https://21st.dev/@louisstudios/components/market-card.md · https://studios.lou15.com/license | sim com atribuição | Mesma situação do peak-chart. |
| 3 | glass-fold | Meer Bahadin (GradFlow) | MIT (21st.dev, site e README do repositório) | https://21st.dev/@meerbahadin10/components/glass-fold.md · https://gradflow.meerbahadin.dev · https://github.com/meerbahadin/gradflow | sim com atribuição | README do GradFlow: "MIT License - feel free to use in your projects". Manter crédito ao GradFlow e o aviso MIT. |
| 4 | liquid-glass-navbar | Guglielmo Giannattasio (Nimbus UI, @gughigug) | MIT (página do 21st.dev) | https://21st.dev/@gughigug/components/liquid-glass-navbar.md | sim com atribuição | O site guglielmogiannattasio.it não fala de licença; vale a do 21st.dev. Manter o "by guglielmogiannattasio.it" do cabeçalho. |
| 5 | liquid-glass-logo-reveal | Denis Kuzin (@shepovalovdenis); shader de Zanwei Guo | MIT (componente, no 21st.dev) + MIT (shader, "Copyright (c) 2026 Zanwei Guo") | https://21st.dev/@shepovalovdenis/components/liquid-glass-logo-reveal.md · https://github.com/zanwei/glass-icon-reveal · https://raw.githubusercontent.com/zanwei/glass-icon-reveal/main/LICENSE | sim com atribuição | Creditar os dois (Denis Kuzin e Zanwei Guo) e incluir o aviso MIT do zanwei. Tirar a marca do 21st.dev (`GlassReveal21st` desenha o logo do 21st, que é marca de terceiros e não entra na licença). |
| 6 | adjustable-glass-dashboard | Troy Lorents (@troyjlorents-gh / @automate_flows, "Automate Flows w/ Troy") | MIT (página do 21st.dev) | https://21st.dev/@automate_flows/components/adjustable-glass-dashboard.md | sim com atribuição | Há duas listagens do mesmo autor; a de @automate_flows confirma MIT. A foto de fundo vem do CDN do 21st: não publicar, trocar por imagem própria ou de licença livre. |
| 7 | market-snapshot | Savva Sicevs (@ssychui, biblioteca "ssych ui") | MIT (página do 21st.dev) | https://21st.dev/@ssychui/components/market-snapshot.md | sim com atribuição | A listagem em @ssicevs deu 404; a de @ssychui confirma MIT e framer-motion, como no arquivo local. |
| 8 | metric-switcher-trend-chart-demo | WRAPCODERS (@wrapcoders) | MIT (página do 21st.dev) | https://21st.dev/@wrapcoders/components/metric-switcher-trend-chart-demo.md | sim com atribuição | Dependência única: lucide-react. |
| 9 | stats-bento | UI Layouts (@uilayout.contact) | MIT (página do 21st.dev) | https://21st.dev/@uilayout.contact/components/stats-bento.md | sim com atribuição | Biblioteca UI Layouts. |
| 10 | stats-card-2 | Ravi Katiyar (@ravikatiyar162) | não encontrada (página mostra "License: unknown") | https://21st.dev/@ravikatiyar162/components/stats-card-2.md | não | Sem licença declarada, os termos do 21st.dev não autorizam redistribuir. Os ícones de cripto vêm do CDN do 21st. Ficar só local ou pedir licença ao autor. |
| 11 | statistics-card-7 (+ card, badge-2, button-1, avatar) | Sean Hello (@sean0205), biblioteca "ReUI" no 21st.dev | MIT (página do 21st.dev); o ReUI de código aberto (keenthemes/reui) também é MIT | https://21st.dev/@sean0205/components/statistics-card-7.md · https://21st.dev/@sean0205/library/reui · https://github.com/keenthemes/reui · https://reui.io | incerto (provável sim com atribuição) | Card, badge, button e avatar existem no repositório MIT do ReUI. Mas no reui.io os blocos "Stats" hoje são Pro (pagos, a partir de US$ 249). Não deu para confirmar se o Sean Hello é da Keenthemes nem se esse card veio da parte gratuita. Se publicar, creditar ReUI/Keenthemes e o aviso MIT; o mais seguro é reescrever o card sobre as primitivas MIT do ReUI ou do shadcn. |
| 12 | finance-bento | Roman Vasnev (vasnev.art, @romanvasnev) | MIT (página do 21st.dev) | https://21st.dev/@romanvasnev/components/finance-bento.md · https://vasnev.art | sim com atribuição | O site diz que os gratuitos ficam no 21st.dev e os pagos no Craftwork; este é o gratuito. Manter o selo/crédito "by vasnev.art". Não publicar a foto real do avatar da demo. |

## Recomendação

**Entram no arsenal público (adaptados, com crédito, aviso MIT e link para a página no 21st.dev):** peak-chart, market-card, glass-fold, liquid-glass-navbar, liquid-glass-logo-reveal (sem o logo do 21st), adjustable-glass-dashboard (sem a foto do CDN), market-snapshot, metric-switcher-trend-chart-demo, stats-bento e finance-bento (sem a foto do avatar). Para esses, criar um arquivo `CREDITS.md` ou `THIRD_PARTY_NOTICES.md` no repositório com autor, URL e o texto da licença MIT de cada um.

**Ficam só locais:** stats-card-2 (licença "unknown"). statistics-card-7 também fica local até confirmar a origem; a alternativa é reescrever o padrão (faixa de 3 KPIs) sobre primitivas MIT.

**Vale pedir ao autor:**
- Ravi Katiyar (stats-card-2): pedir uma licença (MIT) ou autorização escrita.
- Louis Studios: confirmar que a cópia MIT do 21st.dev pode ir para um repositório público, já que a licença do estúdio proíbe isso para cópias tiradas do site dele.
- Sean Hello / ReUI: confirmar se o statistics-card-7 é parte gratuita (MIT) do ReUI.

**Atenção geral:** os termos do 21st.dev exigem consentimento escrito para usar o conteúdo no treino de modelos de IA. Um plugin de skills que serve de referência para agentes não é treino, mas o repositório não deve se apresentar como base de treino.
