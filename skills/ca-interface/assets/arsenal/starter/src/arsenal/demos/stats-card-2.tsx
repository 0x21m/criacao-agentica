import { CryptoStatsCard } from "@/components/ui/stats-card-2";

// Dados de exemplo da Oficina Norte (climatização e manutenção, Belo Horizonte).
const CryptoStatsCardDemo = () => {
  const faturamento = {
    valor: 384250,
    variacao: 7.79,
  };

  const tendencia = [
    50, 52, 48, 55, 60, 58, 62, 70, 68, 75, 72, 80, 78, 85, 82, 70, 65, 72, 78, 88, 92, 90
  ];

  const participacao = [
    { name: "Instalação", percentage: 52.4, color: "bg-blue-500" },
    { name: "Manutenção", percentage: 31.2, color: "bg-red-500" },
    { name: "Outros", percentage: 16.4, color: "bg-cyan-400" },
  ];

  const servicos = [
    {
      name: "Instalação de split",
      symbol: "Ticket médio · 142 serviços",
      price: 1890,
      change: 2.4,
    },
    {
      name: "Contrato PMOC",
      symbol: "Ticket médio · 87 contratos",
      price: 640,
      change: -0.8,
    },
  ];

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <CryptoStatsCard
        marketCap={faturamento.valor}
        marketCapChange={faturamento.variacao}
        chartData={tendencia}
        dominanceData={participacao}
        coinData={servicos}
      />
    </div>
  );
};

export default CryptoStatsCardDemo;
