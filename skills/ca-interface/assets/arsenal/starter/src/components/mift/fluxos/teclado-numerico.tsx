import * as React from "react"
import { CircleAlertIcon, DeleteIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Falha } from "@/components/mift/estados"
import { useEnvio, type ResultadoAcao } from "@/components/mift/operacao/envio"
import { Button } from "@/components/ui/button"
import { moeda } from "@/lib/formato"
import { TITULO_DA_FALHA } from "@/lib/mensagens"
import { cn } from "@/lib/utils"

// MIFT: número no toque e no teclado físico ao mesmo tempo (PDV, balança, coletor, quiosque; lote 2.4). O valor é
// texto controlado, com vírgula decimal ("12,5"): a peça monta o texto tecla a tecla (`teclar`, puro e testado) e a
// aplicação recebe o texto e o número. O visor é um campo de verdade com `inputMode="none"` (o teclado do sistema não
// abre por cima do da tela) que aceita o teclado físico: algarismos, vírgula ou ponto, Backspace (apagar), Delete
// (limpar), Enter (confirmar) e colar. As teclas da tela têm 56 px, nome ("Vírgula", "Apagar"), não tiram o foco do
// visor e ficam fora da ordem do Tab (o visor recebe a digitação: é o caminho do teclado). O limite aparece no lugar,
// na hora: a tecla que passaria do máximo é recusada com a frase ("Máximo 20 kg"); o mínimo e o vazio, ao confirmar.
// `aoConfirmar` devolve ResultadoAcao: andamento no botão, recusa no lugar (`Falha`), aviso só depois de `ok: true`.

export type TipoDeTeclado = "quantidade" | "peso" | "dinheiro" | "codigo" | "medida"
export type Tecla = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "," | "apagar" | "limpar"
export type RegrasDoTeclado = {
  tipo: TipoDeTeclado
  /** Casas depois da vírgula (0: só inteiros). */
  casas: number
  /** Algarismos antes da vírgula (no código, o comprimento máximo). */
  digitos: number
  min?: number
  max?: number
  unidade?: string
}

// Quantidade: inteiros. Peso: 3 casas em kg (balança). Dinheiro: 2 casas, "R$" à frente. Código: algarismos, zeros à
// esquerda preservados, sem vírgula. Medida: 2 casas, unidade da aplicação.
const PADRAO: Record<TipoDeTeclado, { casas: number; digitos: number; unidade?: string }> = {
  quantidade: { casas: 0, digitos: 6 },
  peso: { casas: 3, digitos: 4, unidade: "kg" },
  dinheiro: { casas: 2, digitos: 7 },
  codigo: { casas: 0, digitos: 20 },
  medida: { casas: 2, digitos: 6 },
}

const plural = (n: number, um: string, varios: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`

// ---- regras puras (testes em ferramentas/testes/codigo.test.mjs) -------------------------------------------------

/** As regras de um teclado: o padrão do tipo, com o que a aplicação trocar. */
export function regrasDoTeclado({ tipo = "quantidade", casas, digitos, min, max, unidade }: Partial<RegrasDoTeclado> = {}): RegrasDoTeclado {
  const p = PADRAO[tipo]
  return { tipo, casas: tipo === "codigo" ? 0 : Math.max(0, casas ?? p.casas), digitos: Math.max(1, digitos ?? p.digitos), min, max, unidade: unidade ?? p.unidade }
}

/** "12,5" → 12,5 · "12," → 12 · "" → null. */
export function numeroDoTeclado(texto: string): number | null {
  if (!texto || texto === ",") return null
  const n = Number(texto.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Um número da aplicação no texto do teclado (12.5 → "12,5"; dinheiro sempre com 2 casas: "49,90"). */
export function textoDoNumero(n: number | null | undefined, regras: RegrasDoTeclado): string {
  if (n === null || n === undefined || !Number.isFinite(n) || n < 0) return ""
  if (regras.tipo === "codigo") return String(Math.trunc(n))
  let t = n.toFixed(regras.casas)
  if (regras.tipo !== "dinheiro" && t.includes(".")) t = t.replace(/\.?0+$/, "")
  return t.replace(".", ",")
}

/** O limite por extenso, como a pessoa lê: "20 kg", "R$ 1.000,00", "5 un". */
export function textoDoLimite(n: number, regras: RegrasDoTeclado) {
  if (regras.tipo === "dinheiro") return moeda(n)
  const t = n.toLocaleString("pt-BR", { maximumFractionDigits: regras.casas })
  return regras.unidade ? `${t} ${regras.unidade}` : t
}

/** O texto como aparece no visor: milhares com ponto ("1.234,5"); o código fica como foi digitado. */
export function exibirTeclado(texto: string, regras: RegrasDoTeclado) {
  if (regras.tipo === "codigo" || !texto) return texto
  const [inteiro, decimal] = texto.split(",")
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return decimal === undefined ? agrupado : `${agrupado},${decimal}`
}

/**
 * Uma tecla sobre o texto: devolve o texto novo, ou o mesmo texto com o erro quando a tecla não cabe (casas, algarismos,
 * máximo). Zero à esquerda some ("0" + "5" = "5"); vírgula no vazio vira "0,"; a segunda vírgula não faz nada.
 */
export function teclar(texto: string, tecla: Tecla, regras: RegrasDoTeclado): { texto: string; erro?: string } {
  if (tecla === "limpar") return { texto: "" }
  if (tecla === "apagar") return { texto: texto.slice(0, -1) }
  if (regras.tipo === "codigo") {
    if (tecla === ",") return { texto, erro: "Só algarismos" }
    if (texto.length >= regras.digitos) return { texto, erro: `Até ${plural(regras.digitos, "algarismo", "algarismos")}` }
    return { texto: texto + tecla }
  }
  const [inteiro, decimal] = texto.split(",")
  let novo: string
  if (tecla === ",") {
    if (regras.casas === 0) return { texto, erro: "Só números inteiros" }
    if (decimal !== undefined) return { texto }
    novo = `${inteiro || "0"},`
  } else if (decimal !== undefined) {
    if (decimal.length >= regras.casas) return { texto, erro: `Até ${plural(regras.casas, "casa", "casas")} depois da vírgula` }
    novo = texto + tecla
  } else if (inteiro === "0") {
    novo = tecla
  } else {
    if (inteiro.length >= regras.digitos)
      return { texto, erro: regras.casas ? `Até ${plural(regras.digitos, "algarismo", "algarismos")} antes da vírgula` : `Até ${plural(regras.digitos, "algarismo", "algarismos")}` }
    novo = texto + tecla
  }
  const n = numeroDoTeclado(novo)
  if (n !== null && regras.max !== undefined && n > regras.max) return { texto, erro: `Máximo ${textoDoLimite(regras.max, regras)}` }
  return { texto: novo }
}

/**
 * Texto de fora (colado, ditado, preenchido) passado tecla a tecla pelas mesmas regras: "1.234,56", "12.5" e "R$ 10"
 * viram texto do teclado; o que passa do limite para no último que cabia, com o erro.
 */
export function normalizarTeclado(bruto: string, regras: RegrasDoTeclado): { texto: string; erro?: string } {
  let t = bruto.replace(/[^\d.,]/g, "")
  if (regras.tipo === "codigo") t = t.replace(/\D/g, "")
  else if (t.includes(",")) t = t.replace(/\./g, "")
  else if ((t.match(/\./g) ?? []).length === 1 && !/\.\d{3}$/.test(t)) t = t.replace(".", ",")
  else t = t.replace(/\./g, "")
  let r: { texto: string; erro?: string } = { texto: "" }
  for (const c of t) {
    const proximo = teclar(r.texto, c as Tecla, regras)
    if (proximo.erro) return { texto: r.texto, erro: proximo.erro }
    r = proximo
  }
  return r
}

/** O que impede confirmar: vazio, abaixo do mínimo ou acima do máximo (null: pode confirmar). */
export function conferirTeclado(texto: string, regras: RegrasDoTeclado): string | null {
  if (regras.tipo === "codigo") return texto ? null : "Digite o código"
  const n = numeroDoTeclado(texto)
  if (n === null) return "Digite um valor"
  if (regras.min !== undefined && n < regras.min) return `Mínimo ${textoDoLimite(regras.min, regras)}`
  if (regras.max !== undefined && n > regras.max) return `Máximo ${textoDoLimite(regras.max, regras)}`
  return null
}

// ---- peça ----------------------------------------------------------------------------------------------------------

const DIGITOS: Tecla[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
const FONTES_DO_VISOR = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base"]

/**
 * Teclado numérico de 3 × 4 com visor. Controlado: `valor` é o texto ("12,5") e `aoMudar` recebe o texto e o número.
 *   <TecladoNumerico rotulo="Peso" tipo="peso" max={20} valor={peso} aoMudar={setPeso} aoConfirmar={(kg) => api.pesar(kg)} />
 */
export function TecladoNumerico({
  rotulo,
  valor,
  aoMudar,
  tipo = "quantidade",
  unidade,
  casas,
  digitos,
  min,
  max,
  descricao,
  aoConfirmar,
  rotuloConfirmar = "Confirmar",
  autoFocus,
  id,
  className,
}: {
  /** Nome do campo, à vista ("Quantidade encontrada", "Valor recebido"). */
  rotulo: string
  /** Texto com vírgula decimal ("12,5"); vazio = nada digitado. */
  valor: string
  aoMudar: (texto: string, numero: number | null) => void
  tipo?: TipoDeTeclado
  /** "kg", "un", "cm": ao lado do número e no texto do limite. */
  unidade?: string
  casas?: number
  digitos?: number
  min?: number
  max?: number
  /** Ajuda curta embaixo do visor ("Até 20 kg"); o erro toma o lugar dela. */
  descricao?: string
  /** Sem ele, não há botão de confirmar e o Enter segue para o formulário ou a janela em volta. */
  aoConfirmar?: (numero: number | null, texto: string) => ResultadoAcao | void | Promise<ResultadoAcao | void>
  rotuloConfirmar?: string
  autoFocus?: boolean
  id?: string
  className?: string
}) {
  const regras = React.useMemo(() => regrasDoTeclado({ tipo, casas, digitos, min, max, unidade }), [tipo, casas, digitos, min, max, unidade])
  const idPadrao = React.useId()
  const idCampo = id ?? `teclado-${idPadrao}`
  const idMensagem = `${idCampo}-mensagem`
  const campo = React.useRef<HTMLInputElement>(null)
  // Erro da última tecla ou do confirmar; `vez` refaz o nó para a região viva ler de novo o mesmo texto.
  const [erro, setErro] = React.useState<{ texto: string; vez: number } | null>(null)
  const [anuncio, setAnuncio] = React.useState("")
  const vez = React.useRef(0)

  // O valor e as funções mais recentes (dois toques seguidos antes do redesenho somam: `mudar` atualiza o valor na hora).
  const atual = React.useRef({ valor, aoMudar, aoConfirmar })
  React.useLayoutEffect(() => {
    atual.current = { valor, aoMudar, aoConfirmar }
  })
  const envio = useEnvio(async () => {
    const { valor: v, aoConfirmar: f } = atual.current
    return ((await f?.(numeroDoTeclado(v), v)) ?? { ok: true }) as ResultadoAcao
  })

  const exibido = exibirTeclado(valor, regras)
  const numero = numeroDoTeclado(valor)
  // Valor que veio da aplicação acima do máximo: o erro fica à vista até corrigir.
  const acimaDoMaximo = regras.tipo !== "codigo" && numero !== null && regras.max !== undefined && numero > regras.max ? `Máximo ${textoDoLimite(regras.max, regras)}` : null
  const mensagemDeErro = erro?.texto ?? acimaDoMaximo

  const mostrarErro = (texto: string) => setErro({ texto, vez: ++vez.current })
  const mudar = (texto: string, origem: "tela" | "fisico") => {
    if (texto !== atual.current.valor) {
      atual.current.valor = texto
      atual.current.aoMudar(texto, numeroDoTeclado(texto))
      envio.limpar()
    }
    // Quem toca nas teclas da tela não ouve o visor mudar: a região viva diz o valor.
    if (origem === "tela") setAnuncio(texto ? [regras.tipo === "dinheiro" ? "R$" : "", exibirTeclado(texto, regras), regras.unidade ?? ""].join(" ").trim() : "Vazio")
  }
  const aplicar = (tecla: Tecla, origem: "tela" | "fisico", substituir = false) => {
    const base = substituir ? "" : atual.current.valor
    const r = teclar(base, tecla, regras)
    if (r.erro) mostrarErro(r.erro)
    else setErro(null)
    mudar(r.texto, origem)
  }
  const confirmar = async () => {
    if (!atual.current.aoConfirmar) return
    const problema = conferirTeclado(atual.current.valor, regras)
    if (problema) {
      mostrarErro(problema)
      campo.current?.focus()
      return
    }
    setErro(null)
    const r = await envio.enviar()
    if (r?.ok && r.mensagem) toast.success(r.mensagem, r.desfazer ? { action: { label: "Desfazer", onClick: r.desfazer } } : undefined)
  }

  // O cursor fica no fim (a digitação sempre entra no fim), salvo quando a pessoa selecionou o texto.
  React.useLayoutEffect(() => {
    const el = campo.current
    if (el && el.ownerDocument.activeElement === el && el.selectionStart === el.selectionEnd) el.setSelectionRange(el.value.length, el.value.length)
  }, [exibido])

  const tudoSelecionado = (el: HTMLInputElement) => el.value.length > 0 && el.selectionStart === 0 && el.selectionEnd === el.value.length
  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) return
    const el = e.currentTarget
    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      aplicar(e.key as Tecla, "fisico", tudoSelecionado(el))
    } else if (e.key === "," || e.key === "." || e.key === "Decimal") {
      e.preventDefault()
      aplicar(",", "fisico", tudoSelecionado(el))
    } else if (e.key === "Backspace") {
      e.preventDefault()
      aplicar(tudoSelecionado(el) ? "limpar" : "apagar", "fisico")
    } else if (e.key === "Delete") {
      e.preventDefault()
      aplicar("limpar", "fisico")
    } else if (e.key === "Enter") {
      if (!atual.current.aoConfirmar) return
      e.preventDefault()
      void confirmar()
    } else if (e.key.length === 1) e.preventDefault()
  }

  // Fonte que cabe: o visor nunca corta nem rola por dentro. Mede depois de desenhar e desce um passo enquanto o texto
  // passar da largura; volta ao maior quando o texto encurta ou o visor muda de largura.
  const [passo, setPasso] = React.useState(0)
  const medido = React.useRef({ texto: exibido, largura: 0 })
  React.useLayoutEffect(() => {
    const el = campo.current
    if (!el) return
    const antes = medido.current
    medido.current = { texto: exibido, largura: el.clientWidth }
    if (passo > 0 && (exibido.length < antes.texto.length || (antes.largura && el.clientWidth !== antes.largura))) {
      setPasso(0)
      return
    }
    if (el.scrollWidth > el.clientWidth + 1 && passo < FONTES_DO_VISOR.length - 1) setPasso(passo + 1)
  }, [exibido, passo])
  React.useEffect(() => {
    const el = campo.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      if (medido.current.largura && el.clientWidth !== medido.current.largura) setPasso(0)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const tamanhoDoTexto = FONTES_DO_VISOR[passo]
  // O visor tinha o foco quando a tecla foi tocada? Então continua com ele (no toque, o navegador o daria à tecla).
  const visorEmFoco = React.useRef(false)
  const comecarToque = () => {
    visorEmFoco.current = !!campo.current && campo.current.ownerDocument.activeElement === campo.current
  }
  const tocarTecla = (t: Tecla, tipoDoPonteiro: string) => {
    aplicar(t, "tela")
    // Com o mouse, ou se o visor já tinha o foco, ele fica com o foco: o teclado físico continua valendo. No toque a
    // partir de fora do visor, o foco não vai para ele (nada de teclado do sistema).
    if (tipoDoPonteiro === "mouse" || visorEmFoco.current) campo.current?.focus()
  }
  const teclas: { t: Tecla; conteudo: React.ReactNode; nome?: string }[] = [
    ...DIGITOS.map((d) => ({ t: d, conteudo: d })),
    ...(regras.casas > 0 ? [{ t: "," as Tecla, conteudo: ",", nome: "Vírgula" }] : []),
    { t: "0", conteudo: "0" },
    { t: "apagar", conteudo: <DeleteIcon aria-hidden />, nome: "Apagar" },
  ]

  return (
    <div data-slot="teclado-numerico" data-tipo={regras.tipo} className={cn("flex w-full max-w-80 flex-col gap-3", className)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={idCampo} className="text-sm font-medium">
          {rotulo}
        </label>
        <div
          data-slot="teclado-visor"
          data-invalido={mensagemDeErro ? "" : undefined}
          className="flex h-16 items-center gap-2 rounded-xl border border-input bg-background pr-1.5 pl-3 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalido]:border-destructive data-[invalido]:focus-within:border-destructive data-[invalido]:focus-within:ring-destructive/20 dark:bg-input/30"
        >
          {regras.tipo === "dinheiro" && (
            <span className="shrink-0 text-lg text-muted-foreground" aria-hidden>
              R$
            </span>
          )}
          <input
            ref={campo}
            id={idCampo}
            inputMode="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint={aoConfirmar ? "done" : undefined}
            autoFocus={autoFocus}
            value={exibido}
            placeholder={regras.tipo === "codigo" ? "" : regras.casas ? `0,${"0".repeat(regras.casas)}` : "0"}
            aria-invalid={mensagemDeErro ? true : undefined}
            aria-describedby={idMensagem}
            onKeyDown={aoTeclar}
            onPaste={(e) => {
              e.preventDefault()
              const r = normalizarTeclado(e.clipboardData.getData("text"), regras)
              if (r.erro) mostrarErro(r.erro)
              else setErro(null)
              mudar(r.texto, "fisico")
            }}
            onChange={(e) => {
              // Ditado, preenchimento automático e teclados que não passam pelo keydown: as mesmas regras. Os pontos do
              // visor são de milhar (a peça os pôs): saem antes, para "1.2345" não virar 1,2345.
              const r = normalizarTeclado(e.target.value.replace(/\./g, ""), regras)
              if (r.erro) mostrarErro(r.erro)
              mudar(r.texto, "fisico")
            }}
            className={cn("h-full min-w-0 flex-1 bg-transparent text-right font-semibold tabular-nums outline-none placeholder:text-muted-foreground", tamanhoDoTexto)}
          />
          {/* Unidade longa ("caixas de 12") quebra em duas linhas menores: nunca corta. */}
          {regras.unidade && (
            <span className={cn("shrink-0 text-muted-foreground", regras.unidade.length > 4 ? "max-w-20 text-sm leading-tight text-pretty" : "text-lg")}>{regras.unidade}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Limpar ${rotulo}`}
            dica={false}
            isDisabled={!valor || envio.enviando}
            excludeFromTabOrder
            preventFocusOnPress
            onPressStart={comecarToque}
            onPress={(e) => tocarTecla("limpar", e.pointerType)}
            // Some quando vazio, mas guarda o lugar: o número não pula de lado ao aparecer.
            className={cn("shrink-0 rounded-full pointer-coarse:size-10", !valor && "invisible")}
          >
            <XIcon />
          </Button>
        </div>
        <div aria-live="assertive" className="min-h-5">
          {mensagemDeErro ? (
            <p key={erro?.vez ?? "valor"} id={idMensagem} className="flex items-start gap-1.5 text-sm font-medium text-negative">
              <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {mensagemDeErro}
            </p>
          ) : (
            <p id={idMensagem} className="text-sm text-muted-foreground">
              {descricao}
            </p>
          )}
        </div>
        <span aria-live="polite" className="sr-only">
          {anuncio}
        </span>
      </div>
      <div role="group" aria-label={`Teclado: ${rotulo}`} className="grid grid-cols-3 gap-2">
        {teclas.map(({ t, conteudo, nome }) => (
          <React.Fragment key={t}>
            {/* Sem vírgula (quantidade, código), o canto fica vazio: o 0 e o Apagar não mudam de lugar. */}
            {t === "0" && regras.casas === 0 && <span aria-hidden />}
            <Button
              variant="outline"
              aria-label={nome}
              data-tecla={t}
              excludeFromTabOrder
              preventFocusOnPress
              isDisabled={envio.enviando}
              onPressStart={comecarToque}
              onPress={(e) => tocarTecla(t, e.pointerType)}
              // `w-full`: a tecla de ícone (Apagar) vira tamanho de ícone no Button e ficava com 48 px numa casa de 78.
              className="h-14 w-full text-2xl font-medium tabular-nums data-[pressed]:bg-muted [&_svg:not([class*='size-'])]:size-6"
            >
              {conteudo}
            </Button>
          </React.Fragment>
        ))}
      </div>
      {envio.falha && (
        <Falha titulo={TITULO_DA_FALHA} motivo={envio.falha.motivo} aoTentarDeNovo={() => void confirmar()} alternativa={envio.falha.alternativa} aoDispensar={envio.limpar} />
      )}
      {aoConfirmar && (
        <Button isPending={envio.enviando} onPress={() => void confirmar()} className="h-14 w-full text-base">
          {rotuloConfirmar}
        </Button>
      )}
    </div>
  )
}
