import type { CSSProperties } from "react";
import GlassWorkspace, {
  type WorkspaceTransaction,
  type WorkspaceGoal,
  type WorkspaceCashFlowPeriod,
} from "@/components/ui/adjustable-glass-dashboard";

const warmPalette = {
  "--gw-ink": "light-dark(#242b27,#f4f4ed)",
  "--gw-muted": "light-dark(#384238,#d0c9bf)",
  "--gw-accent": "light-dark(#326b54,#91d5b0)",
  "--gw-line": "light-dark(#283b3020,#e1eddf26)",
  "--gw-background": "light-dark(#d6cebf,#282a25)",
  "--gw-shade": "light-dark(#e9e7df18,#12100e7a)",
  "--gw-surface": "light-dark(#fff,#262322)",
  "--gw-panel": "light-dark(#fff,#2b2825)",
  "--gw-brand": "light-dark(#294b39,#e2eee0)",
  "--gw-brand-ink": "light-dark(#fff,#183725)",
  "--gw-avatar": "light-dark(#f1e4d1,#616e58)",
  "--gw-rail-active": "light-dark(#fff9,#d7e5d42c)",
  "--gw-positive-surface": "light-dark(#dce9da,#294f3a)",
  "--gw-account-surface": "light-dark(#d9dfcf75,#596e5355)",
  "--gw-account-action": "light-dark(#fff7,#bac7b220)",
  "--gw-segment": "light-dark(#293d3010,#e9f6e713)",
  "--gw-segment-active": "light-dark(#ffffffe0,#dae8d836)",
  "--gw-transaction-surface": "light-dark(#e7dccb77,#c2bfa021)",
  "--gw-income-surface": "light-dark(#cadcc688,#91d5b024)",
  "--gw-pending": "light-dark(#805b20,#e1c383)",
  "--gw-goal-surface": "light-dark(#d6d9c566,#c6d3be22)",
  "--gw-dock": "light-dark(#f4f2e655,#15261bcc)",
  "--gw-dock-active": "light-dark(#fffffff0,#eef3e6)",
  "--gw-button": "light-dark(#274b39,#d8ebd7)",
  "--gw-button-ink": "light-dark(#fff,#193320)",
  "--gw-search": "light-dark(#ffffff55,#14261d77)",
  "--gw-savings-orb": "light-dark(#d6e1c888,#b7e1b52b)",
  "--gw-popover": "light-dark(#f5f0e9e8,#15261ef0)",
  "--gw-notification": "light-dark(#f6f1e8ef,#15261ef0)",
  "--gw-fallback": "light-dark(#f1ede5,#1e2c22)",
  "--gw-mobile-dock": "light-dark(#fff4,#15261b99)",
  "--gw-shadow": "#17291b48",
  "--gw-panel-shadow": "#14251c44",
  "--gw-soft-shadow": "#20292012",
  "--gw-segment-shadow": "#14251a10",
  "--gw-dock-shadow": "#14251c12",
  "--gw-popover-shadow": "#13201733",
  "--gw-sample-shadow": "#13331d80",
  "--gw-toast-shadow": "#0002",
  "--gw-toast": "#243e2e",
  "--gw-dock-ink": "#283e2e",
  "--gw-selection": "#698c7270",
  "--gw-scrollbar": "#8e9d88",
  "--gw-hover": "#ffffff28",
  "--gw-dock-hover": "#ffffff30",
  "--gw-control-hover": "#ffffff36",
  "--gw-strong-edge": "#fff9",
  "--gw-soft-edge": "#fff8",
  "--gw-toast-ink": "#fff",
  "--gw-highlight": "#fff",
} as CSSProperties;

const settings = {
  useHostTheme: true,
  blur: 22,
  opacity: 0.3,
  saturation: 1.2,
  edge: 0.6,
  tint: "#eadbc7",
};
const transactions: WorkspaceTransaction[] = [
  {
    id: "1",
    name: "Contrato de manutenção · Padaria Pão de Minas",
    category: "Entrada",
    date: "Hoje",
    amount: 4800,
    status: "Completed",
  },
  {
    id: "2",
    name: "Café Sabiá",
    category: "Alimentação",
    date: "Hoje",
    amount: -18.5,
    status: "Completed",
  },
  {
    id: "3",
    name: "Casa do Ar Peças",
    category: "Compras",
    date: "Ontem",
    amount: -86,
    status: "Completed",
  },
  {
    id: "4",
    name: "Fim de semana em Tiradentes",
    category: "Viagem",
    date: "3 nov",
    amount: -320,
    status: "Pending",
  },
  {
    id: "5",
    name: "Aluguel do galpão",
    category: "Moradia",
    date: "1 nov",
    amount: -1850,
    status: "Completed",
  },
  {
    id: "6",
    name: "Climatização · Clínica Vale Verde",
    category: "Entrada",
    date: "1 nov",
    amount: 6250,
    status: "Completed",
  },
  {
    id: "7",
    name: "Supermercado Bom Preço",
    category: "Compras",
    date: "31 out",
    amount: -124.8,
    status: "Completed",
  },
];
const goals: WorkspaceGoal[] = [
  {
    id: "reserve",
    name: "Reserva de emergência",
    saved: 8400,
    target: 12000,
    color: "#69876c",
  },
  {
    id: "travel",
    name: "Van nova para as visitas",
    saved: 2350,
    target: 5000,
    color: "#ab8b68",
  },
];

const cashFlowPeriods: WorkspaceCashFlowPeriod[] = [
  {
    id: "week",
    label: "Semana",
    description: "Totais diários de exemplo da semana escolhida.",
    points: [
      { label: "seg", income: 680, expenses: 112 },
      { label: "ter", income: 940, expenses: 188 },
      { label: "qua", income: 720, expenses: 84 },
      { label: "qui", income: 1120, expenses: 245 },
      { label: "sex", income: 760, expenses: 98 },
      { label: "sáb", income: 340, expenses: 174 },
      { label: "dom", income: 240, expenses: 65 },
    ],
  },
  {
    id: "month",
    label: "Mês",
    description:
      "Totais de exemplo de novembro. Cada ponto representa o intervalo do rótulo.",
    points: [
      { label: "1 nov", income: 560, expenses: 124 },
      { label: "3 nov", income: 660, expenses: 168 },
      { label: "6 nov", income: 575, expenses: 149 },
      { label: "8 nov", income: 840, expenses: 174 },
      { label: "11 nov", income: 785, expenses: 144 },
      { label: "13 nov", income: 995, expenses: 223 },
      { label: "16 nov", income: 940, expenses: 193 },
      { label: "18 nov", income: 1120, expenses: 238 },
      { label: "21 nov", income: 1010, expenses: 213 },
      { label: "23 nov", income: 1205, expenses: 258 },
      { label: "26 nov", income: 1135, expenses: 223 },
      { label: "30 nov", income: 1225, expenses: 292.3 },
    ],
  },
  {
    id: "year",
    label: "Ano",
    description: "Totais mensais de exemplo de 2026.",
    points: [
      { label: "jan", income: 7300, expenses: 4200 },
      { label: "fev", income: 8100, expenses: 3850 },
      { label: "mar", income: 7600, expenses: 4540 },
      { label: "abr", income: 9200, expenses: 3900 },
      { label: "mai", income: 8500, expenses: 4720 },
      { label: "jun", income: 10200, expenses: 4350 },
      { label: "jul", income: 9800, expenses: 5600 },
      { label: "ago", income: 11700, expenses: 4800 },
      { label: "set", income: 10800, expenses: 6200 },
      { label: "out", income: 12300, expenses: 5400 },
      { label: "nov", income: 11050, expenses: 2399.3 },
      { label: "dez", income: 13900, expenses: 6100 },
    ],
  },
];

export default function GlassWorkspaceDemo(
  props: Partial<typeof settings> = {},
) {
  const s = { ...settings, ...props };
  return (
    <GlassWorkspace
      brand="Oficina Norte"
      userName="Marina"
      balance={28430.6}
      balanceChange={{ percent: 8.2, label: "em relação ao mês passado" }}
      account={{ name: "Conta da empresa", lastFour: "4829" }}
      periodLabel="Novembro de 2026"
      cashFlowPeriods={cashFlowPeriods}
      initialPeriodId="month"
      footerNote="Todos os valores são de exemplo"
      savingsNote="O progresso vem das metas de exemplo desta demo."
      currency="BRL"
      useHostTheme={s.useHostTheme}
      style={s.useHostTheme ? undefined : warmPalette}
      glass={s}
      transactions={transactions}
      goals={
        s.useHostTheme ? goals.map(({ color: _color, ...goal }) => goal) : goals
      }
    />
  );
}
