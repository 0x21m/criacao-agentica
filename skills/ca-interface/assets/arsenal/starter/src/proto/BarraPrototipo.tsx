// Barra de controle do protótipo (PRO-24): oculta por padrão, tecla F alterna, ?controles=1 abre.
// Fora do design system de propósito (valores próprios): não é o app e some quando o protótipo vira produto.
import type { CSSProperties } from "react"
import { ESTADOS, definirConfig, outraPessoaMexe, resetar, useAberto, useConfig, type EstadoTela } from "./dados"
import { PAPEIS, trocarPapel, useSessaoDaCasca, type Papel } from "./permissoes"
import { avancarRelogio, useAgora, DIA, HORA } from "./relogio"
import { clientesParaVerComo, simulacoes, useSituacoesDosModulos } from "@/modulos/registro"
import { definirClienteDaSessao, useClienteDaSessao } from "./cliente"
import { TEMAS, trocarPreset, trocarTema, trocarVidro, useAparencia } from "./aparencia/aparencia"
import { PRESETS } from "./aparencia/presets"
import { url } from "@/lib/url"

const S: Record<string, CSSProperties> = {
  barra: {
    position: "fixed", left: 12, right: 12, bottom: "calc(var(--abas) + 12px)", zIndex: 9999, gap: 10, alignItems: "center",
    flexWrap: "wrap", padding: "8px 12px", borderRadius: 12, background: "#14161a", color: "#f2f2f2",
    font: "12px/1.3 system-ui, sans-serif", boxShadow: "0 8px 30px rgba(0,0,0,.35)",
  },
  ctl: { background: "#2a2d33", color: "#f2f2f2", border: "1px solid #444", borderRadius: 8, padding: "4px 8px", font: "inherit", cursor: "pointer" },
  on: { background: "#f2f2f2", color: "#14161a" },
  rot: { display: "inline-flex", gap: 6, alignItems: "center" },
}
const LATENCIAS = [0, 300, 600, 1500, 3000]

export default function BarraPrototipo() {
  const cfg = useConfig()
  const ap = useAparencia()
  const { papel } = useSessaoDaCasca()
  const agora = useAgora()
  const aberto = useAberto()
  const sit = useSituacoesDosModulos()
  const sims = simulacoes(sit)
  const cliente = useClienteDaSessao(null)
  const clientes = clientesParaVerComo(sit)

  return (
    // data-react-aria-top-layer: a barra F é ferramenta do protótipo, fora do modal. Com uma folha ou um diálogo aberto
    // (React Aria), ela não fica inert nem aria-hidden, o foco pode ir para ela e clicar nela não fecha o modal (P2-5)
    <div data-prototipo-controle data-react-aria-top-layer="true" role="region" aria-label="Controles do protótipo" style={S.barra} className="md:!bottom-3">
      <strong>Protótipo v2, sem back-end. Dados de exemplo.</strong>
      <label style={S.rot}>Estado
        <select style={S.ctl} value={cfg.estado} onChange={(e) => definirConfig({ estado: e.target.value as EstadoTela })}>
          {ESTADOS.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      </label>
      <label style={S.rot}>Latência
        <select style={S.ctl} value={cfg.latencia} onChange={(e) => definirConfig({ latencia: Number(e.target.value) })}>
          {LATENCIAS.map((l) => <option key={l} value={l}>{l} ms</option>)}
        </select>
      </label>
      <label style={S.rot}>
        <input type="checkbox" checked={cfg.falha} onChange={(e) => definirConfig({ falha: e.target.checked })} /> Forçar falha
      </label>
      <label style={S.rot} title="A próxima ação grava, mas a tela não recebe a confirmação">
        <input type="checkbox" checked={!!cfg.perderResposta} onChange={(e) => definirConfig({ perderResposta: e.target.checked })} /> Resposta perdida
      </label>
      <label style={S.rot}>Ver como
        <select style={S.ctl} value={papel} onChange={(e) => trocarPapel(e.target.value as Papel)}>
          {PAPEIS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </label>
      {clientes.length > 0 && (
        <label style={S.rot} title="A cliente do portal (/portal/)">Ver como cliente…
          <select style={S.ctl} value={cliente} onChange={(e) => definirClienteDaSessao(e.target.value)}>
            {!clientes.some((c) => c.id === cliente) && <option value={cliente}>{cliente}</option>}
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.id})</option>)}
          </select>
        </label>
      )}
      <span style={S.rot} role="group" aria-label="Relógio do protótipo">
        <span title="O agora do protótipo">{agora.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        <button type="button" style={S.ctl} onClick={() => avancarRelogio(HORA / 2)}>Avançar 30 min</button>
        <button type="button" style={S.ctl} onClick={() => avancarRelogio(DIA)}>Avançar 1 dia</button>
      </span>
      <label style={S.rot}>Simular a outra ponta
        <select style={S.ctl} value="" onChange={(e) => {
          const v = e.target.value
          if (v === "outra") outraPessoaMexe()
          else sims[Number(v)]?.executar()
          e.target.value = ""
        }}>
          <option value="">Escolha…</option>
          {sims.map((s, i) => <option key={s.rotulo} value={i}>{s.rotulo}</option>)}
          <option value="outra" disabled={!aberto}>Outra pessoa mexe neste registro{aberto ? ` (${aberto.id})` : " (abra um registro)"}</option>
        </select>
      </label>
      <label style={S.rot}>Direção
        <select style={S.ctl} value={ap.preset} onChange={(e) => trocarPreset(e.target.value)}>
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.nome} · {p.arquetipo}</option>)}
        </select>
      </label>
      <span style={S.rot} role="group" aria-label="Tema">
        {TEMAS.map((t) => (
          <button key={t.id} type="button" aria-pressed={ap.tema === t.id} style={{ ...S.ctl, ...(ap.tema === t.id ? S.on : {}) }} onClick={() => trocarTema(t.id)}>
            {t.id === "sistema" ? "Sistema" : t.nome}
          </button>
        ))}
      </span>
      <label style={S.rot}>
        <input type="checkbox" checked={ap.vidro} onChange={(e) => trocarVidro(e.target.checked)} /> Vidro
      </label>
      <button type="button" style={S.ctl} onClick={resetar}>Resetar dados</button>
      <button
        type="button"
        style={S.ctl}
        onClick={() => { try { localStorage.removeItem("proto-abertura-vista") } catch {} location.href = url("") }}
      >Rever abertura</button>
      <span style={{ marginLeft: "auto", opacity: 0.7 }}>F esconde</span>
    </div>
  )
}
