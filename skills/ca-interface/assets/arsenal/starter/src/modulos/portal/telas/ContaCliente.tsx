// A conta no topo do portal (CascaCliente): iniciais e primeiro nome da cliente da sessão. Ilha da casca (client:idle,
// persistente entre as páginas): no servidor sai a cliente padrão; com outra guardada, o Base.astro esconde esta parte
// (data-cliente-casca-pendente) até ela renderizar com a cliente de verdade.
import { url } from "@/lib/url"
import { CLIENTE_PADRAO, useClienteDaSessao } from "@/proto/cliente"
import { clientes } from "@/modulos/clientes/dados"
import { comoChamar } from "../dados"

export default function ContaCliente() {
  const id = useClienteDaSessao("data-cliente-casca-pendente")
  const cls = clientes.use()
  const c = cls.find((x) => x.id === id) ?? cls.find((x) => x.id === CLIENTE_PADRAO)
  const nome = c?.nome ?? "Cliente"
  const chamar = c ? comoChamar(c) : nome
  const iniciais = nome.split(" ").map((p) => p[0]).slice(0, 2).join("")
  return (
    <a data-cliente-sessao href={url("portal/dados/")} aria-label={`Sua conta: ${nome}`}
      className="inline-flex min-h-10 items-center gap-2 rounded-full py-1 pr-1 pl-1 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-3">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">{iniciais}</span>
      <span className="hidden max-w-48 truncate text-sm sm:inline" title={chamar}>{chamar}</span>
    </a>
  )
}
