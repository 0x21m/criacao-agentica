import * as React from "react"
import { CircleAlertIcon, CircleCheckIcon, CopyIcon, InfoIcon, Loader2Icon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { lerLinhaDigitavel, type LeituraDoBoleto } from "@/lib/boleto"
import type { ConsultaCep } from "@/lib/cep"
import { copiar } from "@/lib/copiar"
import { dataCurta, lerMoeda, moeda, textoMoeda } from "@/lib/formato"
import { aplicarMascara, apagarAoLado, padroes, reformatar, type Edicao, type Padrao, type PadraoVariavel } from "@/lib/mascara"
import { cn } from "@/lib/utils"

// MIFT: campos brasileiros (CPF, CNPJ com letras, CEP, telefone) sobre o motor de máscara próprio, só controlado
// (fase 6, `fluxos-api.md` §3.4). O valor é o cru (dígitos; no CNPJ, maiúsculas e dígitos); a máscara só desenha.
// `useMascara` refaz o cursor contando caracteres significativos, apaga o dígito do outro lado quando o Backspace
// esbarra num literal (no teclado físico pela tecla, no virtual pelo `inputType`), passa o texto colado pelo mesmo
// `aplicarMascara` e não reformata durante uma composição (teclado com sugestões), para não quebrar o CNPJ com letras.
// Visual do `CampoValor`: `InputGroup` de 44 px, texto de 16 px (sem zoom no iPhone) e algarismos de mesma largura.
// O CEP consulta com 8 dígitos (cancela a anterior), anuncia numa região viva e nunca bloqueia: não achado ou
// serviço fora só dizem uma frase e deixam preencher à mão. Validação e mensagens de erro ficam com quem usa
// (`lib/documentos`, `lib/formulario`). O contrato do CEP, o adaptador de exemplo e a regra de preencher o endereço
// ficam em `lib/cep` (`criarCepDeExemplo`, `preencherEndereco`).
// Onda A: `CampoMoeda` (centavos, como no app do banco: o dígito entra pela direita), `CampoPlaca` (Mercosul e antiga)
// e `CampoLinhaDigitavel` (boleto e conta de consumo, com a conferência dos dígitos, o valor e o vencimento lidos e
// "Copiar").

export type { ConsultaCep }

export type PropsDaMascara = {
  ref: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>
  onCompositionEnd: React.CompositionEventHandler<HTMLInputElement>
}

/** Liga a máscara a um `<input>` controlado: espalhe o retorno no campo. `valor` e `aoMudar` falam em cru. */
export function useMascara({
  padrao,
  valor,
  aoMudar,
}: {
  padrao: Padrao | PadraoVariavel
  valor: string
  aoMudar: (cru: string) => void
}): PropsDaMascara {
  const ref = React.useRef<HTMLInputElement>(null)
  const cursor = React.useRef<number | null>(null)
  // Texto cru do navegador durante uma composição: reformatar no meio dela troca a palavra que o teclado monta.
  const [compondo, setCompondo] = React.useState<string | null>(null)
  // O valor pode não mudar (letra num CPF) e o cursor ainda precisa voltar ao lugar: força um desenho.
  const [, redesenhar] = React.useReducer((n: number) => n + 1, 0)
  const atual = aplicarMascara(padrao, valor)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (cursor.current === null || !el) return
    if (el.ownerDocument.activeElement === el) el.setSelectionRange(cursor.current, cursor.current)
    cursor.current = null
  })

  const fixar = (r: Edicao) => {
    cursor.current = r.cursor
    setCompondo(null)
    redesenhar()
    if (r.cru !== valor) aoMudar(r.cru)
  }

  return {
    ref,
    value: compondo ?? atual.texto,
    onChange: (e) => {
      const nativo = e.nativeEvent as InputEvent
      const el = e.target
      if (nativo.isComposing) {
        // O desenho espera o fim da composição; o valor não (a aplicação continua vendo o que foi digitado).
        setCompondo(el.value)
        const cru = aplicarMascara(padrao, el.value).cru
        if (cru !== valor) aoMudar(cru)
        return
      }
      fixar(reformatar(padrao, el.value, el.selectionStart ?? el.value.length, atual.cru, nativo.inputType))
    },
    onCompositionEnd: (e) => {
      const el = e.currentTarget
      fixar(reformatar(padrao, el.value, el.selectionStart ?? el.value.length))
    },
    onKeyDown: (e) => {
      if (e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key !== "Backspace" && e.key !== "Delete") return
      const el = e.currentTarget
      const posicao = el.selectionStart ?? 0
      if (posicao !== el.selectionEnd) return
      const r = apagarAoLado(padrao, el.value, posicao, e.key === "Backspace" ? "tras" : "frente")
      if (!r) return
      e.preventDefault()
      fixar(r)
    },
  }
}

export type PropsCampoBr = {
  id?: string
  /** Cru: só dígitos (no CNPJ, maiúsculas e dígitos). */
  valor: string
  aoMudar: (cru: string) => void
  aoSair?: () => void
  invalido?: boolean
  /** Nome acessível quando não há `<FieldLabel htmlFor>`. */
  rotulo?: string
  /** Id da descrição ou do erro (`aria-describedby`). */
  descritoPor?: string
  obrigatorio?: boolean
  className?: string
}

function Caixa({
  campo,
  mascara,
  descritoPor = campo.descritoPor,
  ...entrada
}: { campo: PropsCampoBr; mascara: PropsDaMascara; descritoPor?: string } & Omit<React.ComponentProps<"input">, keyof PropsDaMascara>) {
  return (
    <InputGroup className={cn("h-11", campo.className)}>
      <InputGroupInput
        id={campo.id}
        aria-label={campo.rotulo}
        aria-invalid={campo.invalido || undefined}
        aria-required={campo.obrigatorio || undefined}
        aria-describedby={descritoPor || undefined}
        autoCorrect="off"
        spellCheck={false}
        onBlur={() => campo.aoSair?.()}
        className="text-base tabular-nums"
        {...entrada}
        {...mascara}
      />
    </InputGroup>
  )
}

const documento = {
  cpf: { padrao: padroes.cpf, placeholder: "000.000.000-00" },
  cnpj: { padrao: padroes.cnpj, placeholder: "00.000.000/0000-00" },
  cpfOuCnpj: { padrao: padroes.cpfOuCnpj, placeholder: undefined },
}

/**
 * CPF, CNPJ (com letras) ou os dois no mesmo campo. Até 11 números é CPF; com letra ou mais de 11, CNPJ. Teclado
 * numérico só no CPF puro; quando aceita CNPJ, texto em maiúsculas e sem corretor.
 */
export function CampoDocumento({ aceita, ...campo }: PropsCampoBr & { aceita: "cpf" | "cnpj" | "cpfOuCnpj" }) {
  const mascara = useMascara({ padrao: documento[aceita].padrao, valor: campo.valor, aoMudar: campo.aoMudar })
  return (
    <Caixa
      campo={campo}
      mascara={mascara}
      inputMode={aceita === "cpf" ? "numeric" : "text"}
      autoCapitalize="characters"
      autoComplete="off"
      placeholder={documento[aceita].placeholder}
    />
  )
}

/** Telefone com DDD: fixo ou celular (a máscara acompanha); `so="celular"` fixa "(00) 00000-0000". */
export function CampoTelefone({ so, ...campo }: PropsCampoBr & { so?: "celular" }) {
  const mascara = useMascara({ padrao: so === "celular" ? padroes.celular : padroes.telefone, valor: campo.valor, aoMudar: campo.aoMudar })
  return (
    <Caixa
      campo={campo}
      mascara={mascara}
      type="tel"
      autoComplete="tel-national"
      placeholder={so === "celular" ? "(00) 00000-0000" : "(00) 0000-0000"}
    />
  )
}

type Encontrado = Extract<ConsultaCep, { tipo: "encontrado" }>
type Busca = { cep: string; tipo: "buscando" | ConsultaCep["tipo"] }

const ESPERA_MAXIMA = 8000

/**
 * CEP que busca o endereço com 8 dígitos. `consultar` recebe um `AbortSignal` (a consulta anterior é cancelada) e
 * pode falhar ou demorar: depois de 8 s vale `indisponivel`. `encontrado` chama `aoEncontrar` (quem usa preenche só
 * os campos vazios ou que vieram de uma consulta anterior). Não achado e serviço fora nunca bloqueiam.
 */
export function CampoCep({
  consultar,
  aoEncontrar,
  ...campo
}: PropsCampoBr & {
  consultar?: (cep: string, sinal: AbortSignal) => Promise<ConsultaCep>
  aoEncontrar?: (c: Encontrado) => void
}) {
  const [busca, setBusca] = React.useState<Busca | null>(null)
  const pedido = React.useRef<{ cep: string; controle: AbortController } | null>(null)
  const idSituacao = React.useId()
  React.useEffect(() => () => pedido.current?.controle.abort(), [])
  // A aplicação trocou o CEP por fora (rascunho, "Limpar"): a consulta em andamento não preenche mais nada.
  React.useEffect(() => {
    if (pedido.current && pedido.current.cep !== campo.valor) {
      pedido.current.controle.abort()
      pedido.current = null
    }
  }, [campo.valor])

  const buscar = (cep: string) => {
    pedido.current?.controle.abort()
    pedido.current = null
    if (!consultar || cep.length !== 8) return setBusca(null)
    const controle = new AbortController()
    pedido.current = { cep, controle }
    setBusca({ cep, tipo: "buscando" })
    let relogio: ReturnType<typeof setTimeout> | undefined
    const estouro = new Promise<ConsultaCep>((ok) => {
      relogio = setTimeout(() => ok({ tipo: "indisponivel" }), ESPERA_MAXIMA)
    })
    Promise.race([Promise.resolve().then(() => consultar(cep, controle.signal)), estouro])
      .catch((): ConsultaCep => ({ tipo: "indisponivel" }))
      .then((r) => {
        clearTimeout(relogio)
        if (controle.signal.aborted) return
        controle.abort() // se venceu o tempo, a consulta da aplicação para aqui
        pedido.current = null
        setBusca({ cep, tipo: r.tipo })
        if (r.tipo === "encontrado") aoEncontrar?.(r)
      })
  }

  const mascara = useMascara({
    padrao: padroes.cep,
    valor: campo.valor,
    aoMudar: (cru) => {
      campo.aoMudar(cru)
      buscar(cru)
    },
  })
  // A frase só vale para o CEP que está no campo (a aplicação pode ter trocado o valor por fora).
  const situacao = busca?.cep === campo.valor ? busca.tipo : null
  const frase = {
    buscando: "Buscando endereço…",
    encontrado: aoEncontrar ? "Endereço preenchido." : "Endereço encontrado.",
    nao_encontrado: "CEP não encontrado. Preencha o endereço.",
    indisponivel: "Não deu para buscar agora. Preencha à mão.",
  }
  const Icone = situacao === "buscando" ? Loader2Icon : situacao === "encontrado" ? CircleCheckIcon : InfoIcon
  return (
    <div data-slot="campo-cep" className="flex w-full flex-col">
      <Caixa
        campo={campo}
        mascara={mascara}
        descritoPor={[campo.descritoPor, situacao ? idSituacao : undefined].filter(Boolean).join(" ")}
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
      />
      {/* Região viva sempre no DOM (escondida, deixaria de anunciar); vazia, não ocupa espaço. */}
      <p id={idSituacao} role="status" className="flex items-start gap-1.5 text-sm text-muted-foreground not-empty:mt-2">
        {situacao && (
          <>
            <Icone aria-hidden className={cn("mt-0.5 size-4 shrink-0", situacao === "buscando" && "animate-spin")} />
            {frase[situacao]}
          </>
        )}
      </p>
    </div>
  )
}

/* ───────────── Onda A: moeda, placa e linha digitável ───────────── */

/** Centavos de um texto colado ("1.234,56", "1234.5", "R$ 12"): pela regra do `lerMoeda`, nunca dígito a dígito. */
function centavosColados(texto: string) {
  const n = lerMoeda(texto.replace(/-/g, ""))
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

/**
 * Dinheiro como no app do banco: o valor é em **centavos** (inteiro) e cada dígito entra pela direita ("1" → 0,01;
 * "12" → 0,12; "1234" → 12,34); Backspace tira o último. O cursor fica sempre no fim (não há o que editar no meio) e o
 * texto sai do `textoMoeda` (nunca formatado à mão). Colar "1.234,56" ou "1234.5" lê o valor inteiro. `maximo` (em
 * centavos) trava a entrada no teto; `null` é vazio (o placeholder "0,00" aparece).
 */
export function CampoMoeda({
  maximo = 9_999_999_999,
  ...campo
}: Omit<PropsCampoBr, "valor" | "aoMudar"> & {
  /** Centavos (12345 = R$ 123,45); null é vazio. */
  valor: number | null
  aoMudar: (centavos: number | null) => void
  /** Teto em centavos (padrão R$ 99.999.999,99). */
  maximo?: number
}) {
  const ref = React.useRef<HTMLInputElement>(null)
  const texto = campo.valor === null ? "" : textoMoeda(campo.valor / 100)
  const noFim = () => {
    const el = ref.current
    if (el && el.ownerDocument.activeElement === el) el.setSelectionRange(el.value.length, el.value.length)
  }
  React.useLayoutEffect(noFim)
  const definir = (c: number | null) => {
    const v = c === null ? null : Math.min(maximo, Math.max(0, c))
    if (v !== campo.valor) campo.aoMudar(v)
  }
  const tirarUm = () => definir(campo.valor !== null && campo.valor >= 10 ? Math.floor(campo.valor / 10) : null)
  return (
    <InputGroup className={cn("h-11", campo.className)}>
      <InputGroupAddon>
        <InputGroupText>R$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        id={campo.id}
        aria-label={campo.rotulo}
        aria-invalid={campo.invalido || undefined}
        aria-required={campo.obrigatorio || undefined}
        aria-describedby={campo.descritoPor || undefined}
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="0,00"
        value={texto}
        onFocus={() => requestAnimationFrame(noFim)}
        onClick={noFim}
        onBlur={() => campo.aoSair?.()}
        onPaste={(e) => {
          e.preventDefault()
          const c = centavosColados(e.clipboardData.getData("text"))
          if (c !== null) definir(c)
        }}
        onKeyDown={(e) => {
          if (e.altKey || e.ctrlKey || e.metaKey) return
          if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault()
            tirarUm()
          }
        }}
        onChange={(e) => {
          // Teclado virtual (sem tecla) e ditado: os dígitos do texto novo; apagar qualquer coisa tira o último dígito.
          const nativo = e.nativeEvent as InputEvent
          if (nativo.inputType?.startsWith("delete")) return tirarUm()
          const digitos = e.target.value.replace(/\D/g, "").replace(/^0+/, "")
          if (!digitos) return definir(null)
          const n = Number(digitos)
          // Passou do teto: o dígito novo não entra (o valor fica como estava).
          if (n > maximo) return
          definir(n)
        }}
        className="text-right text-base tabular-nums"
      />
    </InputGroup>
  )
}

/** Placa de veículo: Mercosul ("ABC1D23") ou antiga ("ABC-1234"); o cru vai sem hífen, em maiúsculas. */
export function CampoPlaca(campo: PropsCampoBr) {
  const mascara = useMascara({ padrao: padroes.placa, valor: campo.valor, aoMudar: campo.aoMudar })
  return <Caixa campo={campo} mascara={mascara} inputMode="text" autoCapitalize="characters" autoComplete="off" placeholder="ABC1D23" />
}

/** Placa completa e na forma certa (Mercosul ou antiga). */
export const placaValida = (cru: string) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(cru.toUpperCase())

/**
 * Linha digitável de boleto (47 dígitos) ou de conta de consumo e tributo (48, começa por 8). Duas linhas de altura
 * (a linha inteira quebra entre os blocos, nunca rola por dentro), teclado numérico, colar do banco funciona. Com
 * todos os dígitos, a conferência aparece logo embaixo, numa região viva: "Confere · R$ 1.234,56 · vence 15/11/2026",
 * ou o bloco que não bate ("Confira o campo 2: um número não bate"). "Copiar" leva só os números. O valor e o
 * vencimento lidos vão para `aoLer` (quem usa decide se preenche o valor do pagamento).
 */
export function CampoLinhaDigitavel({ aoLer, ...campo }: PropsCampoBr & { aoLer?: (leitura: LeituraDoBoleto) => void }) {
  const mascara = useMascara({ padrao: padroes.linhaDigitavel, valor: campo.valor, aoMudar: campo.aoMudar })
  const idSituacao = React.useId()
  const leitura = React.useMemo(() => lerLinhaDigitavel(campo.valor), [campo.valor])
  const avisado = React.useRef("")
  React.useEffect(() => {
    if (!leitura.completo || avisado.current === campo.valor) return
    avisado.current = campo.valor
    aoLer?.(leitura)
  }, [leitura, campo.valor, aoLer])
  const vence = leitura.vencimento ? `vence ${dataCurta(leitura.vencimento)}/${leitura.vencimento.getFullYear()}` : null
  const frase = !leitura.completo
    ? null
    : leitura.valido
      ? ["Confere", leitura.valor ? moeda(leitura.valor) : "sem valor no código", vence].filter(Boolean).join(" · ")
      : `Confira o ${leitura.campoComErro?.toLowerCase() ?? "código"}: um número não bate.`
  const descritoPor = [campo.descritoPor, frase ? idSituacao : undefined].filter(Boolean).join(" ")
  return (
    <div data-slot="campo-linha-digitavel" className="flex w-full flex-col">
      <InputGroup className={cn("h-auto items-start", campo.className)}>
        <InputGroupTextarea
          {...(mascara as unknown as Pick<React.ComponentProps<"textarea">, "value" | "onChange" | "onKeyDown" | "onCompositionEnd">)}
          ref={mascara.ref as unknown as React.RefObject<HTMLTextAreaElement>}
          id={campo.id}
          rows={2}
          aria-label={campo.rotulo}
          aria-invalid={campo.invalido || (leitura.completo && !leitura.valido) || undefined}
          aria-required={campo.obrigatorio || undefined}
          aria-describedby={descritoPor || undefined}
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
          onBlur={() => campo.aoSair?.()}
          className="min-h-16 text-base leading-snug tabular-nums"
        />
        <InputGroupAddon align="inline-end" className="self-start py-1 pr-1">
          <InputGroupButton size="icon-sm" aria-label="Copiar linha digitável" isDisabled={!campo.valor} onPress={() => void copiar(campo.valor, "Linha digitável copiada")} className="size-10">
            <CopyIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p id={idSituacao} role="status" className="flex items-start gap-1.5 text-sm text-muted-foreground not-empty:mt-2">
        {frase && (
          <>
            {leitura.valido ? <CircleCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" /> : <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-negative" />}
            <span className={cn("tabular-nums", !leitura.valido && "text-foreground")}>{frase}</span>
          </>
        )}
      </p>
    </div>
  )
}
