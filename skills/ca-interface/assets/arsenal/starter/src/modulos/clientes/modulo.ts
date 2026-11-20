// Módulo Clientes (5.5): mestre-detalhe (lista com segmentos + detalhe com banner curto e abas), cadastro com campos
// BR, mesclar duplicados, anonimizar (LGPD) e o pedido de exclusão que chega do Portal.
//
// LACUNAS: (onda C, espec. 3.3 e 5.5 contra o código de 79eddef; [x] fechada, [ ] aberta)
// [x] 1. Detalhe com abas Resumo · Pedidos · Agenda · Financeiro · Mensagens · Histórico (aba na URL, ?aba=); cada aba lê
//        a coleção do dono (pedidos, agendamentos, lancamentos, conversas/mensagens) e some para quem não pode vê-la.
// [x] 2. Aba Pedidos na TabelaDados com as colunas de /pedidos/ (menos "Cliente", que é o próprio), filtrada pelo cliente.
// [x] 3. Banner curto com nome, tipo, etiquetas e "Cliente desde {ano}" e resumo sobreposto (gasto total, OS abertas,
//        a receber) com NumeroAnimado; era "OS · total · ticket médio".
// [x] 4. Pedido de exclusão vindo do Portal (evento eixo "lgpd" do pedirExclusao): faixa no detalhe com o prazo de 15
//        dias, segmento "Exclusão pedida" na lista, aviso no sino para quem anonimiza e simulação na barra F.
// [x] 5. Anonimizar (P, confirmação digitando o nome): nome vira "Cliente removido", contato e endereço apagados,
//        pedidos e notas fiscais ficam; o detalhe anonimizado mostra a faixa da página e nenhuma ação de edição.
// [x] 6. Mesclar duplicados (P, confirmação "Não dá para desfazer depois de 1 minuto" + Desfazer de 60 s): move OS,
//        agendamentos, cobranças e conversas para o que fica; o outro some. Semente: C-0060 duplica a Juliana (C-0007).
// [x] 7. Campos BR: CampoDocumento (CPF ou CNPJ), CampoTelefone e CampoCep (preenche e deixa editar) no Novo cliente e
//        no Editar; CPF/CNPJ validado no envio; duplicado → "Já existe {nome} com este CPF." + Abrir.
// [x] 8. /clientes/novo/ (formulário em card, PF ou PJ; P) e "Novo cliente" no cabeçalho e na busca sem resultado
//        ("Cadastrar “{jul}”").
// [x] 9. Lista de 360 px com segmentos em chips (Todos · Ativos · Leads · Inativos · Exclusão pedida) e busca por
//        nome, e-mail, CPF/CNPJ, telefone, código ou cidade; Ctrl K também por CPF e telefone.
// [x] 10. Notas internas com autor e hora (O), aviso fixo "Só a equipe vê"; financeiro não vê (nota_interna).
// [x] 11. Técnico: só nome, bairro e telefone dos clientes com visita dele em andamento; fora dela, "Os dados do
//        cliente aparecem durante a visita."
// [x] 12. Esqueleto com a forma real (10 linhas na lista, banner e abas no detalhe); estados de aba vazia com o nome.
// [ ] 13. /clientes/segmentos/ (grupos para mensagem em lote): fica para depois; os segmentos da lista cobrem o filtro.
// [ ] 14. Etiquetar em lote na lista e popover de etiquetas: a lista do mestre não é TabelaDados (sem seleção); fica
//        para quando houver a vista em tabela.
// [ ] 15. Editar campo inline no Resumo: o Editar abre um diálogo com os campos BR (O + Desfazer), não a célula.
//
// BASE: as colunas de /pedidos/ vivem dentro de telas/Pedidos.tsx (não exportadas); a aba Pedidos repete a mesma
//   definição (larguras, tipos, SeloOS) numa peça local. Exportar `colunasOS` de pedidos tiraria a cópia.
// BASE: a projeção não tem estado para "exclusão pedida" (é um evento do histórico, não um estado do cliente); a faixa
//   escreve a frase do operador localmente, sem selo.
// BASE: o Desfazer da acao() dura 8 s; o "Desfazer de 60 s" do mesclar é um toast local que chama a acao() inversa.
import { Users } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { mudarComoOutraPonta } from "@/proto/dados"
import { clientes, exclusaoPendente, pedirExclusaoComoCliente } from "./dados"

const digitos = (t: string) => t.replace(/\D/g, "")

export default {
  id: "clientes", nome: "Clientes", ponta: "operador", ordem: 40,
  nav: [{ rotulo: "Clientes", caminho: "clientes/", icone: Users, capacidade: "ver_clientes", aba: { dono: 4, gestora: 4, atendente: 4, financeiro: 4 } }],
  colecoes: ["clientes"], depende: ["pedidos", "agenda", "financeiro", "mensagens"],
  comandos: (q) => {
    if (!q) return []
    const d = digitos(q)
    return clientes.ler()
      .filter((c) => c.estado !== "anonimizado" && (normalizar(c.nome).includes(q) || normalizar(c.email).includes(q) || normalizar(c.id).includes(q)
        || (d.length >= 4 && (digitos(c.documento).includes(d) || digitos(c.telefone).includes(d)))))
      .slice(0, 5)
      .map((c) => ({ rotulo: c.nome, detalhe: "Cliente", caminho: `clientes/?id=${c.id}` }))
  },
  avisos: (papel) => !pode(papel, "anonimizar") ? [] : clientes.ler().filter((c) => exclusaoPendente(c)).map((c) => ({
    id: `exclusao-${c.id}`, prioridade: 1,
    titulo: `${c.nome} pediu a exclusão dos dados`, texto: `${c.id} · prazo de 15 dias (LGPD)`, caminho: `clientes/?id=${c.id}`,
  })),
  simulacoes: [
    { rotulo: "Clientes: Rafael Moreira pede a exclusão pelo portal", executar: () => mudarComoOutraPonta((d) => pedirExclusaoComoCliente(d, "C-0021"), ["C-0021"]) },
  ],
} satisfies Modulo
