"use client";

import * as React from "react";
import { MarketCard } from "@/components/ui/market-card";

const brlCompacto = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

/** Cartão com número vivo: passe o mouse ou arraste pela linha, ou foque e use as setas. */
export default function MarketCardDemo() {
  const [i, setI] = React.useState(9);
  return (
    <main className="relative h-screen min-h-[340px] w-full overflow-hidden" style={{ backgroundColor: "#0c0c0c" }}>
      <MarketCard index={i} onIndexChange={setI} label="Faturamento do setor" format={(v) => brlCompacto.format(v * 1e9)} style={{ width: "100%", height: "100%" }} />
    </main>
  );
}
