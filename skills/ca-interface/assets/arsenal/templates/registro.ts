import type { ComponentType } from "react"

export type Rota = { id: string; nome: string; load: () => Promise<{ default: ComponentType<any> }> }

// Templates de 1 tela, um por componente. Cada um vive em src/templates/<id>/index.tsx.
// O comentário no topo de cada index.tsx diz para que serve, quando usar e o que trocar.
export const templates: Rota[] = [
  { id: "boas-vindas", nome: "Boas-vindas e login (glass-fold)", load: () => import("./boas-vindas") },
  { id: "abertura", nome: "Abertura do app (logo reveal)", load: () => import("./abertura") },
  { id: "app-cliente", nome: "Home do app do cliente (navbar)", load: () => import("./app-cliente") },
  { id: "painel-cliente-vidro", nome: "Painel do cliente em vidro", load: () => import("./painel-cliente-vidro") },
  { id: "visao-financeira", nome: "Visão financeira em bento", load: () => import("./visao-financeira") },
  { id: "destaque-kpi", nome: "Visão geral com KPI de destaque (peak-chart)", load: () => import("./destaque-kpi") },
  { id: "resumo-do-dia", nome: "Resumo do dia (market-card)", load: () => import("./resumo-do-dia") },
  { id: "tendencias", nome: "Tendências por unidade (market-snapshot)", load: () => import("./tendencias") },
  { id: "relatorios", nome: "Relatórios (metric-switcher)", load: () => import("./relatorios") },
  { id: "categorias", nome: "Vendas por categoria (stats-card-2)", load: () => import("./categorias") },
  { id: "kpis-operador", nome: "Visão geral do operador (statistics-card-7)", load: () => import("./kpis-operador") },
  { id: "resumo-do-mes", nome: "Resumo do mês (stats-bento)", load: () => import("./resumo-do-mes") },
]
