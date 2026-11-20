// Marca do protótipo. Troque nome, logo e a abertura aqui; o resto do app lê deste arquivo.
export const MARCA = {
  nome: "Oficina Norte",
  descricao: "Gestão de pedidos e clientes",
  /** SVG do logo. Na abertura só a forma é usada (a cor vem de --chart-1); no app, herda currentColor. */
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="currentColor"><path d="M50 8 88 30v40L50 92 12 70V30Z" opacity=".35"/><path d="M50 24 74 38v24L50 76 26 62V38Z"/></g></svg>`,
  abertura: {
    /** Liga ou desliga a tela de abertura (splash) antes da home. */
    ativa: true,
    /** Duração total antes de passar para a home, em ms. */
    duracaoMs: 1200,
  },
  /** Usuário fictício da conta. */
  usuario: { nome: "Marina Duarte", email: "marina@oficinanorte.com.br", papel: "Gestora" },
};
