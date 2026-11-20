// As seções de Configurações, na ordem da navegação secundária (desktop) e da lista (celular). Lidas também pelo Ctrl K.
import { Blocks, Building2, MapPinned, Palette, PlugZap, Settings2, Sparkles, type LucideIcon } from "lucide-react"
import type { Capacidade } from "@/proto/permissoes"

export type IdSecao = "geral" | "aparencia" | "marca" | "empresa" | "unidades" | "integracoes" | "modulos"
export type Secao = { id: IdSecao; rotulo: string; resumo: string; caminho: string; icone: LucideIcon; capacidade: Capacidade; chaves: string }

export const SECOES: Secao[] = [
  { id: "geral", rotulo: "Geral", resumo: "Notificações e dados de exemplo", caminho: "configuracoes/", icone: Settings2, capacidade: "aparencia", chaves: "notificacoes preferencias" },
  { id: "aparencia", rotulo: "Aparência", resumo: "Preset, tema, vidro e acento", caminho: "configuracoes/aparencia/", icone: Palette, capacidade: "aparencia", chaves: "tema escuro claro vidro preset" },
  { id: "marca", rotulo: "Marca", resumo: "Logo, nome e cores do banner", caminho: "configuracoes/marca/", icone: Sparkles, capacidade: "configuracoes_empresa", chaves: "logo cores banner nome" },
  { id: "empresa", rotulo: "Empresa", resumo: "Dados, horário, regras e Pix", caminho: "configuracoes/empresa/", icone: Building2, capacidade: "configuracoes_empresa", chaves: "cnpj horario feriados garantia orcamento taxa pix" },
  { id: "unidades", rotulo: "Unidades", resumo: "Endereço, horário e recursos", caminho: "configuracoes/unidades/", icone: MapPinned, capacidade: "configuracoes_empresa", chaves: "pampulha contagem endereco" },
  { id: "integracoes", rotulo: "Integrações", resumo: "WhatsApp, Pix, e-mail e nota", caminho: "configuracoes/integracoes/", icone: PlugZap, capacidade: "configuracoes_empresa", chaves: "whatsapp gateway email nota fiscal conexao" },
  { id: "modulos", rotulo: "Módulos", resumo: "Ligar e desligar Estoque e Loja", caminho: "configuracoes/modulos/", icone: Blocks, capacidade: "configuracoes_empresa", chaves: "ligar desligar estoque loja online" },
]
