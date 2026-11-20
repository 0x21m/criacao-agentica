// Catálogo vivo do arsenal (/arsenal): o que existe, quando usar, de onde importar e o que precisa.
// Os templates trazem o texto do comentário no topo do próprio index.tsx (lido no build); aqui ficam só nome e base.
// Para tirar o arsenal do protótipo pronto: node scripts/limpar-arsenal.mjs
export type Grupo = "app" | "movimento" | "brasil" | "componente" | "template" | "registro"
export type Item = {
  id: string
  grupo: Grupo
  nome: string
  /** Caminho do import para copiar e colar. */
  importar: string
  /** A tela de verdade no app, quando o item já virou uma (o card leva para ela). */
  destino?: string
  dependencias?: string
  quandoUsar?: string
  quandoNaoUsar?: string
  /** Nota de adaptação, autor, cuidado. */
  nota?: string
}

export const GRUPOS: { id: Grupo; nome: string; texto: string }[] = [
  { id: "app", nome: "Abertura e carregamento", texto: "Já ligados no starter: a abertura antes da home e a tela de carregamento com a marca." },
  { id: "movimento", nome: "Kit de movimento", texto: "Peças pequenas, prontas para as telas. Todas respeitam movimento reduzido." },
  { id: "brasil", nome: "Peças brasileiras (MIFT UI)", texto: "Do MIFT UI, na mesma base aria-nova: Pix, comprovante, frete por CEP, teclado numérico, deslizar para confirmar, número deslizante e vidro." },
  { id: "template", nome: "Templates de tela", texto: "Uma tela inteira montada em volta de um componente, em pt-BR, com estados e os controles ocultos na tecla F." },
  { id: "componente", nome: "Componentes do 21st", texto: "O componente do autor com a demo, já em pt-BR e em reais. Adapte dados e cores antes de usar numa tela." },
  { id: "registro", nome: "Registros (shadcn)", texto: "Instalados pela CLI do shadcn a partir de registros como o React Bits." },
]

const KIT = "@/components/movimento"
export const ITENS: Item[] = [
  // ---------- app ----------
  { id: "abertura", grupo: "app", nome: "Abertura (splash)", importar: 'import Abertura from "@/components/app/Abertura"',
    dependencias: "liquid-glass-logo-reveal (GlassIconReveal), motion",
    quandoUsar: "Primeira abertura do app, uma vez por sessão, com \"Pular\". Ligue e desligue em src/proto/marca.ts (abertura.ativa).",
    quandoNaoUsar: "Como carregamento real ou em fluxo que se repete várias vezes ao dia. Com movimento reduzido ela não aparece.",
    nota: "Fica no slot \"sobreposicao\" do AppShell (fora do <main>). O logo é o SVG de MARCA.logo." },
  { id: "carregamento", grupo: "app", nome: "Tela de carregamento", importar: "Já está em src/layouts/Base.astro (#carregamento-app)",
    dependencias: "nenhuma (HTML e CSS)",
    quandoUsar: "Carga inicial do app: logo, nome e uma barra sutil. Só aparece se a carga passar de ~300 ms (TOK-26).",
    quandoNaoUsar: "Dentro das telas: ali vão esqueletos (<ComDados esqueleto={…}>), não a tela da marca." },
  // ---------- movimento ----------
  { id: "numero-animado", grupo: "movimento", nome: "NumeroAnimado", importar: `import { NumeroAnimado } from "${KIT}"`, dependencias: "motion",
    quandoUsar: "KPI que entra na tela ou muda por ação da pessoa: conta até o valor ou rola como odômetro. Formatos moeda, número, % em pt-BR.",
    quandoNaoUsar: "Número que se lê de relance em tabela ou lista; valor que muda sozinho o tempo todo." },
  { id: "texto-revelado", grupo: "movimento", nome: "TextoRevelado", importar: `import { TextoRevelado } from "${KIT}"`, dependencias: "motion",
    quandoUsar: "Título de entrada de uma tela por palavra ou por linha (separe linhas com \\n).",
    quandoNaoUsar: "Texto longo, rótulo de formulário ou qualquer texto que a pessoa precisa ler já." },
  { id: "grafico-que-desenha", grupo: "movimento", nome: "GraficoQueDesenha", importar: `import { GraficoQueDesenha } from "${KIT}"`, dependencias: "motion",
    quandoUsar: "Linha ou área simples que se desenha ao entrar na tela, com leitura ponto a ponto no hover.",
    quandoNaoUsar: "Análise com troca de métrica, comparação ou tabela: use o metric-switcher (template Relatórios)." },
  { id: "botao-liquido", grupo: "movimento", nome: "BotaoLiquido", importar: `import { BotaoLiquido } from "${KIT}"`, dependencias: "motion, buttonVariants do shadcn",
    quandoUsar: "A ação principal da tela: pressão com mola, reflexo de vidro e gota que refrata a partir do toque (refração SVG no Chromium, brilho em CSS nos outros).",
    quandoNaoUsar: "Ações secundárias, botões de linha de tabela ou vários na mesma área: aí vai o Button comum." },
  { id: "entrada-escalonada", grupo: "movimento", nome: "EntradaEscalonada", importar: `import { EntradaEscalonada, ItemEscalonado } from "${KIT}"`, dependencias: "motion",
    quandoUsar: "Cards de uma grade ou bento que entram em sequência na primeira pintura.",
    quandoNaoUsar: "Lista que a pessoa filtra e refiltra o dia todo: a entrada vira espera." },
  { id: "pulso-ao-vivo", grupo: "movimento", nome: "PulsoAoVivo", importar: `import { PulsoAoVivo } from "${KIT}"`, dependencias: "nenhuma (CSS)",
    quandoUsar: "Sinal de \"ao vivo\" ou de dado novo: pulsa cerca de 3 vezes e para. Troque a prop chave para pulsar de novo.",
    quandoNaoUsar: "Como enfeite permanente ou para status de erro (use selo com ícone e texto)." },
  // ---------- peças brasileiras do MIFT UI ----------
  { id: "comprovante-pix", grupo: "brasil", nome: "Comprovante Pix", importar: 'import { ComprovantePix } from "@/components/mift/fluxos/comprovante-pix"',
    dependencias: "aria-nova (button), lib/formato, lib/copiar",
    quandoUsar: "Depois de um Pix: valor, quando, de, para, ID E2E e mensagem, com copiar e compartilhar. O valor vai em centavos.",
    quandoNaoUsar: "Como recibo fiscal ou de compra com itens: use o Comprovante impresso.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  { id: "frete-por-cep", grupo: "brasil", nome: "Frete por CEP", importar: 'import { FretePorCep } from "@/components/mift/fluxos/frete-por-cep"',
    dependencias: "campos-br (CampoCep), operacao/envio, lib/cep",
    quandoUsar: "Carrinho e checkout: trocar o CEP e ver as opções de entrega com prazo e preço; estados carregando, indisponível e erro.",
    quandoNaoUsar: "Endereço completo de cadastro: use o CampoCep de campos-br com os demais campos.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  { id: "teclado-numerico", grupo: "brasil", nome: "Teclado numérico", importar: 'import { TecladoNumerico } from "@/components/mift/fluxos/teclado-numerico"',
    dependencias: "operacao/envio, lib/formato, sonner",
    quandoUsar: "Balcão, estoque e campo: digitar quantidade, peso ou valor com teclas grandes, sem abrir o teclado do sistema.",
    quandoNaoUsar: "Formulário de escritório com teclado físico: um campo comum resolve.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  { id: "comprovante-impresso", grupo: "brasil", nome: "Comprovante impresso", importar: 'import { ComprovanteImpresso } from "@/colecao/comprovante-impresso"',
    dependencias: "aria-nova (button), lib/formato, lib/movimento",
    quandoUsar: "Momento de conclusão: o recibo sai da impressora com itens, acréscimos e total.",
    quandoNaoUsar: "Lista de transações do dia a dia: o efeito é de momento raro.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  { id: "deslizar-para-confirmar", grupo: "brasil", nome: "Deslizar para confirmar", importar: 'import { DeslizarParaConfirmar } from "@/colecao/deslizar-para-confirmar"',
    dependencias: "motion, operacao/envio, lib/movimento",
    quandoUsar: "Ação que pesa (pagar, enviar, encerrar) no celular: deslizar evita o toque acidental; tem alternativa por teclado.",
    quandoNaoUsar: "Ação comum ou repetida várias vezes ao dia: um botão basta.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  { id: "numero-deslizante", grupo: "brasil", nome: "Número deslizante", importar: 'import { NumeroDeslizante } from "@/colecao/numero-deslizante"',
    dependencias: "motion, lib/formato",
    quandoUsar: "Contador ou total que muda por ação da pessoa: os dígitos deslizam; anuncia o valor com anunciar.",
    quandoNaoUsar: "Número de tabela. Para contar na entrada da tela, use o NumeroAnimado do kit.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  { id: "vidro-botao", grupo: "brasil", nome: "Botão de vidro", importar: 'import { BotaoDeVidro } from "@/colecao/vidro-botao"',
    dependencias: "react-aria-components, colecao/vidro-liquido",
    quandoUsar: "Sobre foto ou gradiente de marca: botão de vidro líquido com refração e tons.",
    quandoNaoUsar: "Sobre fundo liso ou em tela de trabalho: use o Button ou o BotaoLiquido.", nota: "Veio do MIFT UI (0x21m/mift-ui, 4387a95)." },
  // ---------- componentes do 21st ----------
  { id: "glass-fold", grupo: "componente", nome: "glass-fold", importar: 'import { GlassFold } from "@/components/ui/glass-fold"', dependencias: "só React (WebGL)",
    quandoUsar: "Banner de entrada, cabeçalho de marca, login ou boas-vindas, fundo de momento-assinatura; as 3 cores vêm dos tokens.",
    quandoNaoUsar: "Atrás de tabela ou formulário. Texto por cima precisa de véu com contraste medido (TOK-37); speed baixo." },
  { id: "peak-chart", grupo: "componente", nome: "peak-chart", importar: 'import { PeakChart } from "@/components/ui/peak-chart"', dependencias: "só React (canvas)",
    quandoUsar: "KPI de destaque na visão geral, no máximo 1 ou 2 por tela.",
    quandoNaoUsar: "Grade de muitos KPIs. Os textos padrão estão em pt-BR; troque title, caption e formatValue pelo seu dado." },
  { id: "market-card", grupo: "componente", nome: "market-card", importar: 'import { MarketCard } from "@/components/ui/market-card"', dependencias: "só React (canvas)",
    quandoUsar: "Indicador-herói (faturamento, ocupação) com navegação ponto a ponto.",
    quandoNaoUsar: "Dentro de layout sem ajustar: use background=\"transparent\" e grid={false}; textos via label, deltaLabel e format." },
  { id: "market-snapshot", grupo: "componente", nome: "market-snapshot", importar: 'import { Demo } from "@/components/ui/market-snapshot"', dependencias: "framer-motion",
    quandoUsar: "Cartão de tendência pequeno em painel ou app do cliente.",
    quandoNaoUsar: "Com série própria: a série é fixa no componente (os textos vêm por props). Use a versão do template Tendências." },
  { id: "metric-switcher-trend-chart-demo", grupo: "componente", nome: "metric-switcher", importar: 'import { MetricTrendChart } from "@/components/ui/metric-switcher-trend-chart-demo"', dependencias: "lucide-react",
    quandoUsar: "Tela de relatórios ou análise: troca de KPI, intervalo, comparação, anotações, teclado, tabela e CSV.",
    quandoNaoUsar: "Gráfico simples que só precisa se desenhar: use o GraficoQueDesenha. Textos e números já saem em pt-BR." },
  { id: "stats-card-2", grupo: "componente", nome: "stats-card-2", importar: 'import { CryptoStatsCard } from "@/components/ui/stats-card-2"', dependencias: "framer-motion, cn",
    quandoUsar: "Resumo lateral (participação por categoria).",
    quandoNaoUsar: "Como está: hsl(var(--primary)) não funciona com tema oklch e o id do gradiente colide. Use a cópia do template Categorias." },
  { id: "stats-bento", grupo: "componente", nome: "stats-bento", importar: 'import StatsBento from "@/components/ui/stats-bento"', dependencias: "só React + Tailwind v4",
    quandoUsar: "Faixa de destaque com hierarquia e marca: resumo do mês, topo de relatório, conquistas.",
    quandoNaoUsar: "Com textos fixos e min-h-screen: vire props e tire a altura (ver template Resumo do mês)." },
  { id: "statistics-card-7", grupo: "componente", nome: "statistics-card-7", importar: 'import { Card, CardContent } from "@/components/ui/card-reui"', dependencias: "class-variance-authority, lucide-react, card-reui, badge-2 (Slot local, sem Radix)",
    quandoUsar: "KPIs do dia a dia do operador, sóbrios e densos: bom para alta frequência.",
    quandoNaoUsar: "statistics-card-7.tsx é só um contador; o componente de verdade é a demo. Cores de status fixas: troque pelos tokens.",
    nota: "O card do autor ficou em card-reui.tsx; card.tsx é o do shadcn." },
  { id: "finance-bento", grupo: "componente", nome: "finance-bento", importar: 'import { FinanceBento } from "@/components/ui/finance-bento"', dependencias: "só React (SVG e DOM, @ts-nocheck)",
    quandoUsar: "Referência de linguagem visual premium para painel: gradiente por card, profundidade, gráficos-assinatura.",
    quandoNaoUsar: "Para colar: monta HTML em string. Estude e reconstrua (template Visão financeira). Não reaproveite a foto da demo." },
  { id: "adjustable-glass-dashboard", grupo: "componente", nome: "adjustable-glass-dashboard", importar: 'import GlassWorkspace from "@/components/ui/adjustable-glass-dashboard"', dependencias: "gsap, @gsap/react, lucide-react",
    quandoUsar: "Referência de moldura, profundidade e camadas: vidro sobre foto, dock flutuante, reveal escalonado.",
    quandoNaoUsar: "Para colar: é um painel pronto (pt-BR, moeda padrão BRL); a foto vem do CDN do 21st (troque por imagem própria)." },
  { id: "liquid-glass-navbar", grupo: "componente", nome: "liquid-glass-navbar", importar: 'import { LiquidNavbar } from "@/components/ui/liquid-glass-navbar"', dependencias: "só React (WebGL)",
    quandoUsar: "Navegação principal do app do cliente no celular ou barra flutuante.",
    quandoNaoUsar: "Tarefa frequente de operador, se o efeito cansar. Troque os ícones pelos da sua navegação." },
  { id: "liquid-glass-logo-reveal", grupo: "componente", nome: "liquid-glass-logo-reveal", importar: 'import { GlassIconReveal } from "@/components/ui/liquid-glass-logo-reveal"', dependencias: "React, cn (WebGL2)",
    quandoUsar: "Abertura do app, splash, boas-vindas ou sucesso de marca. GlassIconReveal recebe o SVG do logo.",
    quandoNaoUsar: "Em loop ou sem \"Pular\". GlassReveal21st usa a marca do 21st: não publique." },
  // ---------- registros ----------
  { id: "split-text", grupo: "registro", nome: "SplitText (React Bits)", importar: 'import SplitText from "@/components/SplitText"',
    dependencias: "gsap (SplitText, ScrollTrigger), @gsap/react",
    quandoUsar: "Título de marca que se monta letra a letra: 404, conclusão, boas-vindas. Instalado com npx shadcn@latest add @react-bits/SplitText-TS-TW.",
    quandoNaoUsar: "Texto de trabalho do dia a dia. Licença do React Bits: MIT + Commons Clause (confira antes de vender o derivado)." },
]

/** Templates: nome e base. O resto vem do comentário do index.tsx. */
export const TEMPLATES: { id: string; nome: string; destino?: string }[] = [
  { id: "boas-vindas", nome: "Boas-vindas e login", destino: "entrar/" },
  { id: "abertura", nome: "Abertura do app" },
  { id: "app-cliente", nome: "Home do app do cliente" },
  { id: "painel-cliente-vidro", nome: "Painel do cliente em vidro" },
  { id: "visao-financeira", nome: "Visão financeira em bento" },
  { id: "destaque-kpi", nome: "Visão geral com KPI de destaque" },
  { id: "resumo-do-dia", nome: "Resumo do dia" },
  { id: "tendencias", nome: "Tendências por unidade" },
  { id: "relatorios", nome: "Relatórios" },
  { id: "categorias", nome: "Vendas por categoria" },
  { id: "kpis-operador", nome: "Visão geral do operador" },
  { id: "resumo-do-mes", nome: "Resumo do mês" },
]

/** Lê "Quando usar:", "Quando não usar:", "Depende de:" e "Ao adaptar:" do comentário no topo do template. */
export function lerCabecalho(fonte: string) {
  const bloco = (fonte.match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? "").split("\n").map((l) => l.replace(/^\s*\*\s?/, "")).join(" ")
  const campo = (rotulo: string) => bloco.match(new RegExp(`${rotulo}:\\s*(.*?)(?=\\s(?:Para que serve|Quando usar|Quando não usar|Depende de|Ao adaptar):|$)`))?.[1]?.trim()
  return {
    serve: campo("Para que serve"),
    quandoUsar: campo("Quando usar"),
    quandoNaoUsar: campo("Quando não usar"),
    dependencias: campo("Depende de"),
    nota: campo("Ao adaptar"),
  }
}

export function todos(fontes: Record<string, string>): Item[] {
  const tpl: Item[] = TEMPLATES.map((t) => {
    const c = lerCabecalho(fontes[t.id] ?? "")
    return {
      id: `template-${t.id}`, grupo: "template", nome: t.nome, destino: t.destino,
      importar: `import Template from "@/arsenal/templates/${t.id}"`,
      dependencias: c.dependencias, quandoUsar: c.quandoUsar ?? c.serve, quandoNaoUsar: c.quandoNaoUsar, nota: c.nota,
    }
  })
  return [...ITENS.filter((i) => i.grupo === "app" || i.grupo === "movimento" || i.grupo === "brasil"), ...tpl, ...ITENS.filter((i) => i.grupo === "componente" || i.grupo === "registro")]
}
