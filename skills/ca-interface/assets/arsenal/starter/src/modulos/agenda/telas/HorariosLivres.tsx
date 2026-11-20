// /agenda/livres/ · horários livres por serviço. No balcão (Ana ao telefone): escolhe o serviço e a unidade, vê os
// horários em que algum técnico que faz o serviço está livre e, ao escolher, abre o "Novo agendamento" já preenchido.
// "Como o cliente vê" mostra a mesma GradeDeHorarios no modo de reserva do Site (guarda 10 min, bloco tracejado na
// agenda): é a bancada da peça que o Site e o Portal importam.
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ComDados, Esqueleto } from "@/components/app/estados"
import { CabecalhoPagina } from "@/components/base/CabecalhoPagina"
import { useParametrosDaUrl } from "@/components/base/BarraFerramentas"
import { SERVICOS, UNIDADES, recursoPorId, servicoPorSlug, type Unidade } from "@/proto/negocio"
import type { PropostaAgenda } from "@/components/interativos/AgendaInterativa"
import { GradeDeHorarios } from "./GradeDeHorarios"
import { NovoAgendamento } from "./NovoAgendamento"

const campo = "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:h-11 max-sm:text-base"
const opc = "bg-[Canvas] text-[CanvasText]"

export default function HorariosLivres() {
  const [f, setF] = useParametrosDaUrl({ servico: "limpeza-split", unidade: "todas", vista: "balcao" })
  const [dialogo, setDialogo] = useState<PropostaAgenda | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const servico = servicoPorSlug(f.servico) ? f.servico : "limpeza-split"
  const unidade = (f.unidade in UNIDADES ? f.unidade : "todas") as Unidade | "todas"
  const cliente = f.vista === "cliente"
  return (
    <>
      <CabecalhoPagina titulo="Horários livres" descricao={cliente ? "A grade que o cliente vê no site" : "Para responder o cliente ao telefone"}
        vistas={[{ id: "balcao", rotulo: "Balcão" }, { id: "cliente", rotulo: "Como o cliente vê" }]} vista={cliente ? "cliente" : "balcao"}
        aoMudarVista={(v) => { setF({ vista: v }); setAviso(null) }} />
      <div className="px-4 pt-4 pb-6 md:px-6">
        <ComDados capacidade="ver_agenda" area="do atendimento" rotulo="os horários livres" vazio={null} esqueleto={<Esqueleto className="h-96 rounded-[var(--radius-xl)]" />}>
          {() => (
            <Card className="mx-auto max-w-3xl">
              <CardContent className="grid gap-5">
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <label className="grid gap-1 text-xs text-muted-foreground">Serviço
                    <select className={campo} value={servico} onChange={(e) => setF({ servico: e.target.value })}>
                      {SERVICOS.map((s) => <option key={s.slug} value={s.slug} className={opc}>{s.nome}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">Unidade
                    <select className={campo} value={unidade} onChange={(e) => setF({ unidade: e.target.value })}>
                      <option value="todas" className={opc}>Todas</option>
                      {(Object.keys(UNIDADES) as Unidade[]).map((u) => <option key={u} value={u} className={opc}>{UNIDADES[u].nome}</option>)}
                    </select>
                  </label>
                </div>
                <GradeDeHorarios key={`${servico}-${unidade}-${f.vista}`} servico={servico} unidade={unidade}
                  aoEscolher={cliente ? undefined : (h) => setDialogo({ inicio: h.inicio, fim: h.fim, recursoId: h.recursoIds[0] })}
                  reservar={cliente ? { origem: "site", aoReservar: (r) => setAviso(`${r.id} aparece na agenda de ${recursoPorId(r.recursoId)?.curto} como bloco tracejado até a reserva vencer.`) } : undefined}
                  aoPedirLigacao={cliente ? () => setAviso("No site, aqui o cliente deixa o telefone para a equipe ligar.") : undefined} />
                {aviso && <p className="text-xs text-muted-foreground text-pretty">{aviso}</p>}
              </CardContent>
            </Card>
          )}
        </ComDados>
      </div>
      <NovoAgendamento proposta={dialogo} servico={servico} onFechar={() => setDialogo(null)} />
    </>
  )
}
