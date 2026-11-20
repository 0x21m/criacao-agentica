// Conteúdo e dados do módulo Site e landing (spec 5.13) da Oficina Norte.
// Fonte: apps-e-fluxos-workspace/especificacao-erp-oficina-norte.md, seções 1 (negócio, serviços, unidades),
// 5.13 (Site) e 6 (jornada da Juliana). Nada aqui é inventado além do que a lista "ASSUMIDO" no fim diz.
// Regras da design-taste-frontend: endereço só com bairro, nenhum telefone discável na landing, e-mail em .example
// (nunca impresso; só no mailto), nenhuma avaliação ou depoimento inventado.
import { url } from "@/lib/url";

export const SITE = {
  nome: "Oficina Norte",
  /** Linha do rodapé e das metas: o que a empresa faz, sem adjetivo. */
  linha: "Ar-condicionado, elétrica e montagem para casas e comércios em BH e região, desde 2014.",
  fundada: 2014,
  cidades: ["Belo Horizonte", "Contagem", "Betim", "Nova Lima", "Sabará"],
  /** E-mail de contato: stand-in em .example (o real vem do cliente). Nunca aparece escrito na página. */
  email: "atendimento@oficinanorte.example",
  /** Telefone fictício da spec (WhatsApp). Só na página de contato, sem link tel: (regra 9 da taste). */
  whatsapp: "(31) 3456-7800",
  garantiaDias: 90,
  taxaVisita: "R$ 120,00",
  validadeOrcamentoDias: 10,
  pixMinutos: 30,
  boletoDias: 3,
  reservaMinutos: 10,
  /** Primeiro horário livre da jornada (spec 6, passo 4). */
  proximoHorario: { dia: "ter, 17/11", hora: "10:00", unidade: "Pampulha" },
} as const;

export type Unidade = { id: string; nome: string; papel: string; bairro: string; cidade: string; consulta: string };
export const UNIDADES: Unidade[] = [
  { id: "pampulha", nome: "Pampulha", papel: "Loja, balcão e bancada", bairro: "Bandeirantes", cidade: "Belo Horizonte", consulta: "Bandeirantes Belo Horizonte" },
  { id: "contagem", nome: "Contagem", papel: "Base de campo e depósito", bairro: "Eldorado", cidade: "Contagem", consulta: "Eldorado Contagem" },
];
/** Busca no OpenStreetMap só pelo bairro: "Ver a região" (sem rua na página, sem coordenadas). */
export const linkRegiao = (u: Unidade) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(u.consulta)}`;

export const HORARIO = [
  { dias: "Segunda a sexta", dataDays: "mon-fri", horas: "8:00 às 18:00" },
  { dias: "Sábado", dataDays: "sat", horas: "8:00 às 12:00" },
  { dias: "Domingo e feriados", dataDays: "sun", horas: "Fechado" },
];

export type TipoPreco = "fechado" | "a-partir" | "orcamento" | "hora";
export type Servico = {
  id: string;
  nome: string;
  /** Nome curto para botões e linhas ("Agendar limpeza"). */
  curto: string;
  preco: string;
  /** Valor como aparece na lista: "R$ 220,00", "a partir de R$ 890,00", "sob orçamento". */
  valor: string;
  duracao: string;
  tipo: TipoPreco;
  /** Uma linha na lista da landing. */
  linha: string;
  /** O parágrafo do topo da página do serviço. */
  resumo: string;
  /** "O que inclui" (ASSUMIDO: escopo usual do ofício, o cliente confirma). */
  inclui: string[];
  foto: string;
  alt: string;
};

export const SERVICOS: Servico[] = [
  {
    id: "limpeza-split", nome: "Limpeza de ar-condicionado split", curto: "limpeza", preco: "R$ 220,00", valor: "R$ 220,00",
    duracao: "1 h 30", tipo: "fechado", linha: "Preço fechado, 1 h 30 na sua casa ou no seu comércio.",
    resumo: "Limpeza completa do split com o aparelho no lugar. Você agenda o horário, paga no site e o técnico chega na janela marcada.",
    inclui: ["Lavagem dos filtros e da serpentina", "Limpeza da bandeja e do dreno", "Higienização da turbina", "Teste de funcionamento no fim"],
    foto: "f67847550", alt: "Split aberto na parede, com os dois filtros azuis à mostra",
  },
  {
    id: "instalacao-split", nome: "Instalação de split até 12.000 BTU", curto: "instalação", preco: "R$ 650,00", valor: "R$ 650,00",
    duracao: "3 h", tipo: "fechado", linha: "Preço fechado, 3 h de serviço.",
    resumo: "Instalação de split de até 12.000 BTU, com preço fechado antes da visita. O aparelho pode ser seu ou comprado na nossa loja.",
    inclui: ["Fixação da unidade interna e da externa", "Ligação da tubulação de cobre", "Teste de vazamento e de funcionamento"],
    foto: "f188894092", alt: "Unidade interna de split presa na parede, com o tubo de cobre saindo por baixo",
  },
  {
    id: "instalacao-split-grande", nome: "Instalação de split de 18.000 a 30.000 BTU", curto: "instalação", preco: "a partir de R$ 890,00", valor: "a partir de R$ 890,00",
    duracao: "4 h", tipo: "a-partir", linha: "Preço confirmado na visita, 4 h de serviço.",
    resumo: "Para salas grandes e comércios. O preço parte de R$ 890,00 e é confirmado na visita, conforme a distância entre as unidades e a parede.",
    inclui: ["Avaliação do ponto da unidade externa", "Fixação das duas unidades", "Ligação da tubulação e teste de vazamento"],
    foto: "f47876386", alt: "Unidade externa de ar-condicionado sobre uma base de concreto, ao lado de uma casa",
  },
  {
    id: "conserto-ar", nome: "Conserto de ar-condicionado", curto: "conserto", preco: "sob orçamento", valor: "sob orçamento",
    duracao: "visita de 1 h", tipo: "orcamento", linha: "Visita de diagnóstico de 1 h e orçamento por escrito.",
    resumo: "O técnico faz o diagnóstico na visita e você recebe o orçamento por escrito, com mão de obra e peças separadas.",
    inclui: ["Diagnóstico com medição de pressão e de corrente", "Orçamento com mão de obra e peças", "Conserto na mesma visita quando a peça está na loja"],
    foto: "f181404380", alt: "Mãos apertando a conexão de um tubo de refrigeração com duas chaves",
  },
  {
    id: "eletrica", nome: "Serviço elétrico", curto: "serviço elétrico", preco: "sob orçamento", valor: "sob orçamento",
    duracao: "visita de 1 h", tipo: "orcamento", linha: "Tomadas, quadro e disjuntores, com visita de 1 h.",
    resumo: "Troca de tomadas, revisão de quadro e de disjuntores, e o circuito próprio para o ar-condicionado.",
    inclui: ["Visita para ver o quadro e o circuito", "Orçamento por escrito", "Troca de tomadas, disjuntores e fiação"],
    foto: "f81573118", alt: "Quadro elétrico aberto com disjuntores em duas fileiras e fios azuis",
  },
  {
    id: "montagem", nome: "Montagem de móveis e prateleiras", curto: "montagem", preco: "R$ 140,00 por hora", valor: "R$ 140,00 por hora",
    duracao: "mínimo de 2 h", tipo: "hora", linha: "Por hora, com mínimo de 2 h.",
    resumo: "Montagem de móveis e fixação de prateleiras e suportes, cobrada por hora, com mínimo de 2 horas.",
    inclui: ["Montagem pelo manual do fabricante", "Fixação na parede com bucha certa para o tijolo", "Retirada das embalagens"],
    foto: "f191849475", alt: "Mãos apertando parafusos numa peça de madeira com duas chaves de fenda",
  },
];
export const servicoPorId = (id: string) => SERVICOS.find((s) => s.id === id);
/** Serviço de preço fechado agenda direto; os outros pedem avaliação (CLI-15). */
export const agendaDireto = (s: Servico) => s.tipo === "fechado" || s.tipo === "hora" || s.tipo === "a-partir";

// ---------------------------------------------------------------------------------------------------------------
// Para onde os botões levam (onda C). Agendar e comprar acontecem no próprio site (módulo src/modulos/site/: a grade de
// horários, o Pix e o frete); a conta, o acompanhamento e o pagamento depois do orçamento ficam no Portal (/portal/…).
// Trocar só aqui: o resto do site lê destas funções.
// ---------------------------------------------------------------------------------------------------------------
export const PORTAL = {
  entrada: () => url("portal/"),
  pedido: (id: string) => url(`portal/pedido/?id=${id}`),
  pedidos: () => url("portal/pedidos/"),
  conversa: () => url("portal/conversa/"),
  /** Mantidos para o Portal, que ainda lê ?acao= de links antigos. */
  agendar: (servico: string) => url(`portal/?acao=agendar&servico=${servico}`),
  avaliacao: (servico: string) => url(`portal/?acao=avaliacao&servico=${servico}`),
  loja: () => url("portal/?acao=loja"),
};

export const ROTAS = {
  inicio: () => url("site/"),
  servico: (id: string) => url(`site/servicos/${id}/`),
  precos: () => url("site/precos/"),
  sobre: () => url("site/sobre/"),
  contato: () => url("site/contato/"),
  creditos: () => url("site/creditos/"),
  agendar: (servico?: string, horario?: string) =>
    url(`site/agendar/${servico ? `?servico=${servico}${horario ? `&horario=${horario}` : ""}` : ""}`),
  confirmacao: (id: string) => url(`site/confirmacao/?id=${id}`),
  loja: (categoria?: string) => url(`site/loja/${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ""}`),
  produto: (sku: string) => url(`site/loja/${sku.toLowerCase()}/`),
  carrinho: () => url("site/carrinho/"),
  checkout: () => url("site/checkout/"),
};

/** Botão principal de cada serviço: verbo + o que a pessoa recebe. Os dois caminhos abrem o agendamento do site. */
export const acaoDoServico = (s: Servico) =>
  agendaDireto(s)
    ? { rotulo: s.id === "limpeza-split" ? "Agendar limpeza" : `Agendar ${s.curto}`, href: ROTAS.agendar(s.id) }
    : { rotulo: "Pedir avaliação", href: ROTAS.agendar(s.id) };

export const PASSOS = [
  { titulo: "Escolha o serviço e o horário", texto: `Você vê os horários livres da semana e o escolhido fica guardado por ${SITE.reservaMinutos} minutos enquanto preenche o endereço.` },
  { titulo: "Pague o serviço por Pix", texto: "Serviço de preço fechado é pago por Pix no agendamento. Conserto e elétrica só são pagos depois do orçamento aprovado, pelo portal." },
  { titulo: "Acompanhe a visita pelo portal", texto: "No dia, o portal mostra o nome do técnico e a janela em que ele chega." },
];

export const PERGUNTAS = [
  { p: "Em quais cidades vocês atendem?", r: `${SITE.cidades.slice(0, -1).join(", ")} e ${SITE.cidades.at(-1)}. Fora delas ainda não atendemos.` },
  { p: "Posso remarcar ou cancelar a visita?", r: "Sim, pelo portal, até o serviço começar. Depois disso, fale com a gente pela conversa do pedido." },
  { p: "Quanto tempo tenho para pagar?", r: `O código Pix vale ${SITE.pixMinutos} minutos e o boleto vence em ${SITE.boletoDias} dias.` },
  { p: "Vocês atendem comércios?", r: "Sim. Atendemos casas e comércios, e fazemos contrato de limpeza trimestral para empresas." },
  { p: "O que é o portal do cliente?", r: "É onde você acompanha o pedido, aprova o orçamento e paga. A conta usa o e-mail do agendamento." },
];

export const LOJA = {
  categorias: ["Aparelhos", "Peças", "Filtros e limpeza", "Elétrica", "Ferragens"],
  /** Retirada no balcão da Pampulha (Bandeirantes): pronto a partir das 14:00 do dia útil seguinte ao Pix. */
  retirada: "balcão da Pampulha, Bandeirantes",
  freteGratisAcima: 299,
};

/** Equipe da spec (seção 1): nomes e papéis do brief, sem retrato. */
export const EQUIPE = [
  { nome: "Rogério Nunes", papel: "Dono" },
  { nome: "Marina Duarte", papel: "Gestão, Pampulha" },
  { nome: "Ana Lima", papel: "Atendimento, Pampulha" },
  { nome: "Carla Mota", papel: "Atendimento, Contagem" },
  { nome: "Bruno Sá", papel: "Técnico de climatização" },
  { nome: "Diego Reis", papel: "Técnico de elétrica" },
  { nome: "Elisa Rocha", papel: "Técnica de climatização" },
  { nome: "Fábio Antunes", papel: "Técnico de montagem" },
  { nome: "Helena Vaz", papel: "Financeiro" },
];

/**
 * ASSUMIDO (não está na spec; o cliente confirma):
 *  - os itens de "O que inclui" de cada serviço (escopo usual do ofício);
 *  - as fotografias: todas são stand-ins licenciados do Wikimedia Commons (ver src/components/site/fotos/fotos.json).
 */
