// Módulo Configurações (5.11) · /configuracoes/: o índice. Desktop: navegação secundária à esquerda e, no conteúdo, a
// aparência atual, o que pede atenção, as notificações e a zona de dados do protótipo. Celular: a lista de seções
// primeiro (com o resumo de cada uma), o resto embaixo. Atendente, técnico e financeiro veem só Geral e Aparência.
import { useState } from "react"
import { ChevronRight, Palette, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button, LinkButton } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { SeloEixo } from "@/components/base/selos"
import { Superficie } from "@/components/sistema/Superficie"
import { useAparencia } from "@/proto/aparencia/aparencia"
import { presetPorId } from "@/proto/aparencia/presets"
import { MARCA } from "@/proto/marca"
import { resetar } from "@/proto/dados"
import { usePode } from "@/proto/permissoes"
import { url } from "@/lib/url"
import { ESTADO_INTEGRACAO, ESTADO_MODULO, INTEGRACAO, OPCIONAL, fraseDoErro, integracoes, useModulosOpcionais } from "../dados"
import { CascaConfig, ListaDeSecoes, TituloDoBloco } from "./comum"

const PREFS = [
  { id: "atrasos", rotulo: "Avisar sobre pedidos atrasados", texto: "Notificação no sino quando um prazo vence.", padrao: true },
  { id: "resumo", rotulo: "Resumo diário por e-mail", texto: `Às 8h, para ${MARCA.usuario.email}.`, padrao: false },
  { id: "som", rotulo: "Som ao concluir pedido", texto: "Um toque curto, só neste aparelho.", padrao: false },
]

export default function Configuracoes() {
  const [prefs, setPrefs] = useState(() => Object.fromEntries(PREFS.map((p) => [p.id, p.padrao])))
  const [confirmar, setConfirmar] = useState(false)
  const ap = useAparencia()
  const preset = presetPorId(ap.preset)
  const daEmpresa = usePode("configuracoes_empresa")
  const erros = integracoes.use().filter((i) => i.estado === "erro")
  const parados = useModulosOpcionais().filter((m) => m.situacao !== "ligado")
  const atencao = daEmpresa && (erros.length > 0 || parados.length > 0)
  return (
    <CascaConfig secao="geral" titulo="Configurações" descricao={daEmpresa ? "Empresa, marca, integrações e preferências" : "Suas preferências neste aparelho"}>
      <ListaDeSecoes atual="geral" completa className="lg:hidden" />

      {atencao && (
        <Superficie como="section" aria-labelledby="cfg-atencao" tom="aviso" className="grid gap-3 p-4 md:px-6">
          <TituloDoBloco id="cfg-atencao" titulo="Pede atenção" />
          <ul className="grid gap-2">
            {erros.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <SeloEixo p={ESTADO_INTEGRACAO.erro} />
                <p className="min-w-0 flex-1 basis-60 text-sm text-pretty">{fraseDoErro(i)}</p>
                <LinkButton variant="outline" size="sm" href={url(`configuracoes/integracoes/#${i.id}`)} className="pointer-coarse:min-h-10">Ver {INTEGRACAO[i.id].nome}</LinkButton>
              </li>
            ))}
            {parados.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <SeloEixo p={ESTADO_MODULO[m.situacao]} ctx={{ desde: m.desde }} detalhe />
                <p className="min-w-0 flex-1 basis-60 text-sm text-pretty">{OPCIONAL[m.id].nome}: {m.situacao === "fora_do_ar" ? "quem entra vê o aviso de fora do ar." : "a equipe não vê o módulo."}</p>
                <LinkButton variant="outline" size="sm" href={url("configuracoes/modulos/")} className="pointer-coarse:min-h-10">Ver módulos</LinkButton>
              </li>
            ))}
          </ul>
        </Superficie>
      )}

      <Superficie como="a" href={url("configuracoes/aparencia/")} interativa className="group flex items-center gap-4 p-4 outline-none max-lg:hidden md:px-6">
        {/* prévia ao vivo do material: o destaque do preset atual */}
        <span aria-hidden="true" className="sup grid size-12 shrink-0 place-items-center rounded-[calc(var(--radius)*1.1)] text-[var(--texto-primario)]" data-nivel="destaque"><Palette className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="t-card block">Aparência</span>
          <span className="block text-sm text-pretty text-muted-foreground">Preset {preset.nome} · {ap.tema === "escuro" ? "escuro" : ap.tema === "claro" ? "claro" : "seguindo o sistema"}{ap.vidro ? " com vidro" : ""}. Troque direção, tema, acento, cantos e densidade.</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </Superficie>

      <Superficie como="section" aria-labelledby="cfg-notif" className="px-4 py-2 md:px-6">
        <h2 id="cfg-notif" className="t-card py-3">Notificações</h2>
        {PREFS.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 py-3 shadow-[0_-1px_0_color-mix(in_oklch,var(--foreground)_7%,transparent)]">
            <div className="min-w-0">
              <p id={`pref-${p.id}`} className="text-sm">{p.rotulo}</p>
              <p className="text-sm text-pretty text-muted-foreground">{p.texto}</p>
            </div>
            <Switch aria-labelledby={`pref-${p.id}`} isSelected={prefs[p.id]} onChange={(v) => { setPrefs({ ...prefs, [p.id]: v }); toast.success("Preferência salva.") }} />
          </div>
        ))}
      </Superficie>

      <Superficie como="section" aria-labelledby="cfg-dados" className="grid gap-3 p-4 md:px-6">
        <TituloDoBloco id="cfg-dados" titulo="Dados de exemplo" descricao="Apaga as OS, os clientes, os agendamentos e as configurações criados ou editados neste navegador e volta aos dados iniciais." />
        <Button variant="outline" className="w-fit pointer-coarse:min-h-10" onPress={() => setConfirmar(true)}><RotateCcw /> Restaurar dados de exemplo</Button>
      </Superficie>

      <DialogoConfirmar aberto={confirmar} aoFechar={() => setConfirmar(false)} perigo
        titulo="Restaurar os dados de exemplo?"
        descricao="Tudo o que foi criado, editado ou excluído neste navegador se perde, e o relógio volta para 16/11, 09:41. Não dá para desfazer."
        voltar="Manter meus dados" confirmar="Restaurar dados"
        aoConfirmar={() => { resetar(); toast.success("Dados de exemplo restaurados."); return { ok: true } }} />
    </CascaConfig>
  )
}
