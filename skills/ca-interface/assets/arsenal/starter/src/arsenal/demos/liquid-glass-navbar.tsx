import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar"

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "0 16px",
        background: "#DCEBF5",
      }}
    >
      <LiquidNavbar
        tone="light"
        defaultActive={0}
        sound={false}
        items={[
          { label: "Início", icon: NimbusIcons.home, fx: "glow" },
          { label: "Explorar", icon: NimbusIcons.globe, fx: "spin" },
          { label: "Viagens", icon: NimbusIcons.plane, fx: "plane" },
          { label: "Clima", icon: NimbusIcons.drop, fx: "drop" },
          { label: "Perfil", icon: NimbusIcons.user, fx: "wave" },
        ]}
      />
      <span
        style={{
          font: "500 12px/1 ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif",
          color: "rgba(11,19,43,.5)",
        }}
      >
        por{" "}
        <a href="https://guglielmogiannattasio.it" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(11,19,43,.7)" }}>
          guglielmogiannattasio.it
        </a>
      </span>
    </div>
  )
}
