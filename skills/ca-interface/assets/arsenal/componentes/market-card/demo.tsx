"use client";

import * as React from "react";
import { MarketCard } from "@/components/ui/market-card";

/** The stat card with a live figure: hover or drag along the line, or focus it and use the arrow keys. */
export default function MarketCardDemo() {
  const [i, setI] = React.useState(9);
  return (
    <main className="relative h-screen min-h-[340px] w-full overflow-hidden" style={{ backgroundColor: "#0c0c0c" }}>
      <MarketCard index={i} onIndexChange={setI} format={(v) => "$" + +v.toFixed(1) + "B"} style={{ width: "100%", height: "100%" }} />
    </main>
  );
}
