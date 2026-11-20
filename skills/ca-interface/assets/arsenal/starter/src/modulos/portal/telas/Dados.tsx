// /portal/dados/ · meus dados (5.12, LGPD). Os dados da conta (e-mail sem quebrar no meio), o consentimento de WhatsApp
// (P: muda como a Oficina fala com a pessoa), "Baixar meus dados" (arquivo JSON só com o que o portal mostra) e
// "Excluir minha conta" (P, com confirmação): cria o pedido de anonimização e mostra o estado intermediário honesto.
// Mudar nome, e-mail, telefone e endereço é pela conversa até o cadastro do cliente aceitar a edição pelo portal.
import { useState } from "react"
import { Download, MessageCircle, ShieldCheck, Trash2 } from "lucide-react"
import { Button, LinkButton } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Superficie } from "@/components/sistema/Superficie"
import { DialogoConfirmar } from "@/components/base/DialogoConfirmar"
import { Email } from "@/components/base/texto"
import { useProcessando } from "@/proto/dados"
import { FRASES, mudarConsentimentoWhatsapp, pedirExclusao, useDadosDoCliente } from "../dados"
import { BannerCliente, ComDadosCliente, Secao, diaHora, ir } from "./comum"

export default function Dados() {
  const dados = useDadosDoCliente()
  const c = dados.cliente
  const ocupado = useProcessando().has(c.id)
  const [excluir, setExcluir] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function baixar() {
    const conteudo = { cliente: { nome: c.nome, email: c.email, telefone: c.telefone, endereco: c.endereco, whatsapp: c.whatsappConsentido },
      pedidos: dados.pedidos.map((p) => ({ id: p.id, titulo: p.titulo, total: p.total, situacao: p.frase })), pagamentos: dados.cobrancas.map((x) => ({ id: x.id, valor: x.valor, estado: x.estado, pagoEm: x.pagoEm })) }
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([JSON.stringify(conteudo, null, 2)], { type: "application/json" }))
    a.download = "meus-dados-oficina-norte.json"
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <ComDadosCliente oQue="os seus dados" titulo="Meus dados">
      <BannerCliente titulo="Meus dados" descricao="O que a Oficina Norte guarda sobre você e como fala com você.">
        <Superficie nivel="card" className="grid w-full max-w-[720px] gap-0 px-5 py-2 md:px-6">
          <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-[9rem_minmax(0,1fr)]">
            {[
              ["Nome", <span key="n">{c.nome}</span>],
              ["E-mail", <Email key="e" email={c.email} />],
              ["Celular", <span key="t" className="num">{c.telefone}</span>],
              ["Endereço", <span key="a" className="text-pretty">{c.endereco}</span>],
            ].map(([rotulo, valor]) => (
              <div key={String(rotulo)} className="contents">
                <dt className="pt-3 text-sm text-muted-foreground sm:py-3">{rotulo}</dt>
                <dd className="min-w-0 border-b border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pb-3 text-sm sm:py-3">{valor}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="text-xs text-pretty text-muted-foreground">Para mudar algum dado, peça pela conversa: a equipe atualiza e confirma.</p>
            <LinkButton variant="outline" className="h-10" href={ir.conversa(undefined, "Quero atualizar meus dados: ")}><MessageCircle /> Pedir mudança</LinkButton>
          </div>
        </Superficie>
      </BannerCliente>

      <div className="grid max-w-[calc(720px+3rem)] gap-6 px-3 pt-6 md:px-6">
        <Secao titulo="Como falamos com você">
          <Superficie className="grid gap-2 p-4">
            <Switch isSelected={c.whatsappConsentido} isDisabled={ocupado} className="min-h-10"
              onChange={async (v) => { setErro(null); const r = await mudarConsentimentoWhatsapp(v, c.versao); if (!r.ok) setErro(r.mensagem) }}>
              Avisos do pedido por WhatsApp {ocupado && <span className="text-muted-foreground">· Enviando…</span>}
            </Switch>
            <p className="text-xs text-pretty text-muted-foreground">Desligado, os avisos chegam por e-mail. Nunca mandamos oferta sem você pedir.</p>
            {erro && <p role="alert" className="text-sm text-negativo-texto">{erro}</p>}
          </Superficie>
        </Secao>

        <Secao titulo="Privacidade (LGPD)">
          <Superficie className="grid gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex min-w-0 flex-1 items-start gap-2 text-sm text-pretty"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />Uma cópia de tudo o que o portal mostra sobre você, num arquivo.</p>
              <Button variant="outline" className="h-10" onPress={baixar}><Download /> Baixar meus dados</Button>
            </div>
            <div className="border-t border-[color-mix(in_oklch,var(--foreground)_8%,transparent)] pt-4">
              {c.exclusaoPedidaEm ? (
                <p role="status" className="text-sm text-pretty"><span className="font-medium">{FRASES.exclusaoPedida}</span> <span className="text-muted-foreground">Pedido em <span className="num">{diaHora(c.exclusaoPedidaEm)}</span>.</span></p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm text-pretty text-muted-foreground">Excluir a conta apaga seus dados. Guardamos só o exigido por lei (notas fiscais).</p>
                  <Button variant="ghost" className="h-10 text-negativo-texto" onPress={() => setExcluir(true)}><Trash2 /> Excluir minha conta</Button>
                </div>
              )}
            </div>
          </Superficie>
        </Secao>
      </div>

      <DialogoConfirmar aberto={excluir} aoFechar={() => setExcluir(false)} perigo titulo="Excluir sua conta?"
        descricao="Seus pedidos em andamento continuam até o fim. Depois, apagamos seus dados em até 15 dias e avisamos por e-mail. Não dá para desfazer."
        confirmar="Excluir minha conta" voltar="Manter a conta" aoConfirmar={() => pedirExclusao(c.versao)} />
    </ComDadosCliente>
  )
}
