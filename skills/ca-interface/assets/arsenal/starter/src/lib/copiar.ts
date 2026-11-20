import { COPIAR, FALHA_SEM_MOTIVO } from "@/lib/mensagens"

const avisos = () => import("sonner").then((m) => m.toast)

// MIFT: copiar e ações demoradas sempre com aviso. Uma função só para todo o app (o menu da linha
// também usa), para o retorno ser igual em toda parte. O `sonner` chega sob demanda (no primeiro aviso): a tela que
// só talvez copie (a conclusão de um formulário) não o leva na carga; o `Toaster` montado pelo app é o mesmo módulo.

/** Copia para a área de transferência e avisa (com uma prévia do que foi copiado). */
export function copiar(texto: string, rotulo: string = COPIAR.feito) {
  if (!navigator.clipboard) {
    void avisos().then((toast) => toast.error(COPIAR.semSuporte))
    return Promise.resolve(false)
  }
  return navigator.clipboard.writeText(texto).then(
    () => (void avisos().then((toast) => toast(rotulo, { description: texto.length > 80 ? texto.slice(0, 80) + "…" : texto })), true),
    () => (void avisos().then((toast) => toast.error(COPIAR.falhou)), false)
  )
}

/** Ação demorada (exportar, gerar, enviar) com aviso de andamento, sucesso e erro. */
export function comAviso<T>(acao: Promise<T>, textos: { andamento: string; sucesso: string | ((r: T) => string); erro?: string }) {
  void avisos().then((toast) =>
    toast.promise(acao, {
      loading: textos.andamento,
      success: textos.sucesso,
      error: textos.erro ?? FALHA_SEM_MOTIVO,
    })
  )
  return acao
}
