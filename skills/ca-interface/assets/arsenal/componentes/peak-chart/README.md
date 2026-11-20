# Peak Chart

- **Origem:** 21st.dev, autor Louis Studios (studios.lou15.com). Enviado pelo dono do projeto para usar nos testes.
- **Licença:** não informada no código. Uso livre nos protótipos de teste; para produto real, conferir a licença com o autor.
- **O que é:** card de KPI com gráfico de linha desenhado em canvas: brilho em camadas, grade que esmaece, linha que se desenha como cometa, ponto que pousa no pico e pulsa, número que conta até o valor, seta de tendência, menu de período em vidro, leitura ao passar o mouse e morph da linha quando os dados mudam. Respeita `prefers-reduced-motion`.
- **Dependências:** só React. Arquivo vai em `components/ui/peak-chart.tsx` (projeto shadcn + Tailwind + TypeScript; em Astro, como ilha React com `client:visible`).
- **Props principais:** `data`, `labels`, `value`, `valueSuffix`, `decimals`, `title`, `caption`, `updatedText`, `trend` (up/down/none), `periods`, `period`/`onPeriodChange`, `accent` (muda o matiz do brilho), `width`, `loop`, `backdrop`, `formatValue`, `font`.
- **Ao usar em pt-BR:** passar `title`, `caption`, `updatedText`, `periods` (ex.: Semanal, Mensal, Anual) e `formatValue` em português; o componente formata números em `en-US` internamente, então use `formatValue` e `valueSuffix` para o padrão brasileiro e, se precisar do número principal em pt-BR, ajuste o `toLocaleString` do componente.
- **Onde cabe:** KPI de destaque da visão geral ou do resumo do dia (faturamento, ocupação, conversão), um ou dois por tela no máximo. É um momento de personalidade: não usar em lista nem em tabela de uso intenso.
