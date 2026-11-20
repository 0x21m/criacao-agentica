// Módulo Configurações (5.11): índice (/configuracoes/), aparência (/configuracoes/aparencia/, painel da base),
// marca, empresa, unidades, integrações (simuladas) e módulos opcionais (/configuracoes/modulos/), mais o estado de
// módulo indisponível do EST-47 (/configuracoes/indisponivel/?modulo=estoque).
// Capacidade nova na MATRIZ (contratos, seção 6): `configuracoes_pagamento` (chave Pix e gateway: só o dono; a seção 2
// dá à gestora as configurações da empresa "menos integrações de pagamento"). Usa também configuracoes_empresa e aparencia.
//
// Ligar e desligar módulo: a situação mora na base (src/proto/modulos.ts; o registro exporta `ativo(id)`,
//   `situacaoDoModulo(id)`, `useAtivo(id)`), que tira o módulo desligado da navegação, das abas, do "Mais", do Ctrl K,
//   do sino e da barra F, e o guarda de rota do AppShell mostra o ModuloIndisponivel (src/components/app/) no lugar da
//   tela. Este módulo só grava (ligarModulo, estoqueForaDoAr) e mostra a tela /configuracoes/modulos/.
// A "Loja online" é do Site: ele lê `ativo("loja")` (ou `useAtivo("loja")`) do registro para tirar catálogo e carrinho.
// BASE: negocio.ts (EMPRESA, UNIDADES, FERIADOS, expediente) é fixo; o que se salva aqui fica nas coleções deste módulo e
//   ainda não chega às outras telas (agenda, portal, Pix). Pedido: as telas lerem `empresa`/`unidades` daqui.
// BASE: o CNPJ de negocio.ts (41.238.576/0001-09) tem DV inválido; a semente daqui usa 41.238.576/0001-79.
// BASE: a marca salva (nome, logo, cor do banner) aparece só nas prévias; o BannerSobreposto e o Logo leem MARCA e o preset.
// BASE: os estados da integração e do módulo opcional deveriam morar na projecao.ts; estão em ESTADO_INTEGRACAO e
//   ESTADO_MODULO (dados.ts), lidos só pelo SeloEixo.
// BASE: a aparência (/configuracoes/aparencia/) continua sendo o PainelAparencia da base, com o banner dele: não ganhou a
//   navegação secundária das outras seções para não mexer no painel.
// BASE: a lista da BarraLateral (916 px) rola dentro de 788 px a 1440 × 900; o navegar acusa "rolagem dupla" nas páginas
//   longas deste módulo (Empresa e Aparência). É da casca, não da tela.
import { Palette, Settings } from "lucide-react"
import type { Modulo } from "../registro"
import { normalizar } from "../registro"
import { pode } from "@/proto/permissoes"
import { situacoesDosModulos } from "@/proto/modulos"
import { INTEGRACAO, OPCIONAL, estoqueForaDoAr, existeOpcional, fraseDoErro, integracoes, whatsappCai, type IdOpcional } from "./dados"
import { SECOES } from "./secoes"

const avisosDaEmpresa = () => [
    ...integracoes.ler().filter((i) => i.estado === "erro")
      .map((i) => ({ titulo: `${INTEGRACAO[i.id].nome} desconectad${INTEGRACAO[i.id].g}`, texto: fraseDoErro(i), caminho: `configuracoes/integracoes/#${i.id}` })),
    ...situacoesDosModulos.ler().filter((m) => m.situacao === "fora_do_ar" && m.id in OPCIONAL)
      .map((m) => ({ titulo: `${OPCIONAL[m.id as IdOpcional].nome} fora do ar`, texto: "Os outros dados estão atualizados.", caminho: "configuracoes/modulos/" })),
]

export default {
  id: "configuracoes", nome: "Configurações", ponta: "operador", ordem: 90,
  nav: [{
    rotulo: "Configurações", curto: "Ajustes", caminho: "configuracoes/", icone: Settings,
    filhos: [{ rotulo: "Aparência", caminho: "configuracoes/aparencia/", icone: Palette, capacidade: "aparencia" }],
  }],
  colecoes: ["config_empresa", "config_marca", "config_unidades", "integracoes"], depende: [],
  comandos: (q, papel) => {
    if (!q) return []
    return SECOES.filter((s) => s.id !== "geral" && s.id !== "aparencia" && pode(papel, s.capacidade) && normalizar(`${s.rotulo} ${s.chaves}`).includes(q))
      .slice(0, 4).map((s) => ({ rotulo: s.rotulo, detalhe: "Configurações", caminho: s.caminho }))
  },
  avisos: (papel) => (!pode(papel, "configuracoes_empresa") ? [] : avisosDaEmpresa()),
  simulacoes: [
    { rotulo: "O WhatsApp desconecta", executar: whatsappCai },
    ...(existeOpcional("estoque") ? [{ rotulo: "O Estoque fica fora do ar (ou volta)", executar: estoqueForaDoAr }] : []),
  ],
} satisfies Modulo
