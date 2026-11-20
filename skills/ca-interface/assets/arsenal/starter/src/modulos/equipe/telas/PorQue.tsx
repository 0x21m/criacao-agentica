// O popover "por que esta permissão" da matriz (/equipe/permissoes/): a regra, o que ela quer dizer, a nota da MATRIZ e,
// para o dono, a troca simulada (P). Um popover só para a matriz inteira, ancorado na célula clicada; baixa em pedaço
// à parte na primeira vez que alguém abre (as 155 células hidratam como botões simples).
import { useState } from "react"
import { Dialog as DialogAria, Heading } from "react-aria-components"
import { Popover } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useProcessando } from "@/proto/dados"
import { MATRIZ, nomeDoPapel, type Capacidade, type Papel, type Regra } from "@/proto/permissoes"
import { explicaRegra, regraEfetiva, rotuloRegra, simularRegra, type Ajuste } from "../dados"

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const lerRegra = (s: string): Regra => (s === "true" ? true : s === "false" ? false : (s as Regra))

export type Alvo = { cap: Capacidade; papel: Papel; el: HTMLElement }

export default function PorQueFlutuante({ alvo, aoFechar, ajustes, editavel }: { alvo: Alvo | null; aoFechar: () => void; ajustes: Ajuste[]; editavel: boolean }) {
  if (!alvo) return null
  // escolhida a regra, o popover fecha e o foco volta à célula (o leitor ouve a regra nova no rótulo dela)
  return (
    <Popover isOpen onOpenChange={(o) => !o && aoFechar()} triggerRef={{ current: alvo.el }} placement="bottom" className="w-80">
      <DialogAria className="grid gap-3 outline-none" aria-label={`Por que esta permissão: ${nomeDoPapel(alvo.papel)}`}>
        <PorQue key={`${alvo.cap}:${alvo.papel}`} cap={alvo.cap} papel={alvo.papel} ajustes={ajustes} editavel={editavel}
          aoTrocar={() => { aoFechar(); requestAnimationFrame(() => alvo.el.focus()) }} />
      </DialogAria>
    </Popover>
  )
}

function PorQue({ cap, papel, ajustes: lista, editavel, aoTrocar }: { cap: Capacidade; papel: Papel; ajustes: Ajuste[]; editavel: boolean; aoTrocar: () => void }) {
  const { regra, padrao, simulada } = regraEfetiva(lista, cap, papel)
  const ocupado = useProcessando().has(`${cap}:${papel}`)
  const [erro, setErro] = useState<string | null>(null)
  const nota = (MATRIZ[cap] as { nota?: string }).nota
  const opcoes = [...new Set([String(padrao), "true", "false"])]
  async function trocar(v: string) {
    setErro(null)
    const r = await simularRegra(cap, papel, lerRegra(v), lista.find((a) => a.id === `${cap}:${papel}`))
    if (!r.ok) setErro(r.mensagem)
    else aoTrocar()
  }
  return (
    <>
      <div className="grid gap-1">
        <Heading slot="title" className="text-sm font-medium text-balance">{nomeDoPapel(papel)} · {MATRIZ[cap].rotulo}</Heading>
        <p className="text-sm text-pretty text-muted-foreground">
          <span className="font-medium text-foreground">{rotuloRegra(regra)}.</span> {explicaRegra(regra)}
          {nota && regra === padrao ? <> {capitalizar(nota)}.</> : null}
        </p>
        {simulada && <p className="text-xs text-alerta-texto">Simulada neste navegador · padrão: {rotuloRegra(padrao)}.</p>}
      </div>
      {editavel && (
        <div className="grid gap-2 border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pt-3">
          <RadioGroup aria-label="Simular outra regra" value={String(regra)} onChange={(v) => void trocar(v)} isDisabled={ocupado}>
            {opcoes.map((o) => (
              <RadioGroupItem key={o} value={o} className="min-h-8">
                {rotuloRegra(lerRegra(o))}{o === String(padrao) && <span className="text-muted-foreground"> (padrão)</span>}
              </RadioGroupItem>
            ))}
          </RadioGroup>
          <p className="min-h-4 text-xs text-muted-foreground" aria-live="polite">{ocupado ? "Enviando…" : erro ?? "Fica só neste navegador; as outras telas seguem o padrão."}</p>
        </div>
      )}
    </>
  )
}
