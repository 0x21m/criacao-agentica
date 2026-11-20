// Molas como token (TOK-39). Nenhuma mola literal em componente: importe daqui.
export const mola = {
  rapida: { type: "spring", visualDuration: 0.2, bounce: 0 },
  padrao: { type: "spring", visualDuration: 0.3, bounce: 0.1 },
  macia: { type: "spring", visualDuration: 0.45, bounce: 0.2 },
} as const;
