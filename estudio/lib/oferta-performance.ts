/**
 * A OFERTA DO PERFORMANCE (decidida em 07/10/2026): R$ 197 por mês, sem
 * fidelidade, Pix pelo Caixa do estúdio (que libera a aba ao receber). No
 * primeiro mês a loja recebe o relatório antes de pagar: é o teste de 30
 * dias, honesto e simples de explicar.
 *
 * O número mora SÓ aqui. O modal do plano exibe; nada no painel calcula ou
 * repete o valor. Mudou o preço, muda nesta linha e na nota do cofre
 * (4 Máquina/performance.md).
 */
/** o WhatsApp do estúdio (44 99124-6187), só números: é com quem o dono fala */
export const ESTUDIO_WHATSAPP = "5544991246187";

/** o link que abre a conversa com o estúdio já com a mensagem */
export const linkDoEstudio = (mensagem: string) => `https://wa.me/${ESTUDIO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

/**
 * O PEDIDO AO ESTÚDIO (07/10/2026): o que é estrutura do site (tom, fotos
 * grandes, links, partes novas) o dono não edita; pede, de dentro da aba
 * Site, e a mensagem já sai com a loja, a parte e o campo. Faz parte do
 * Performance: quem tem o plano pede sem custo.
 */
export function linkPedidoAoEstudio(p: { loja: string; parte: string; campo: string }): string {
  return linkDoEstudio(`Oi! Sou da ${p.loja}. Quero mudar no site, em "${p.parte}": ${p.campo}. O que eu queria: `);
}

export const OFERTA_PERFORMANCE = {
  valor: 197,
  valorTexto: "R$ 197",
  periodo: "por mês",
  condicoes: ["sem fidelidade", "Pix ou cartão"],
  /* o anual no cartão (07/10): "pague 10 meses, leve 12" */
  anualTexto: "R$ 1.970",
  anualParcelas: 12,
  /* o desconto do anual (07/10, "o cliente tem que ver o desconto"): contas
     sobre os dois valores acima, nenhum número novo. 12 x 197 = 2.364;
     2.364 menos 1.970 = 394; 1.970 / 12 = 164,17 */
  anualCheioTexto: "R$ 2.364",
  anualEconomiaTexto: "R$ 394",
  anualPorMesTexto: "R$ 164",
  teste: "No primeiro mês você recebe o relatório antes de pagar.",
  mensagem:
    "Oi! Quero o Performance da minha vitrine (R$ 197 por mês). Como começa?",
} as const;

/* a mensagem de quem só quer saber mais, sem o preço na frente */
export const CONHECER_PERFORMANCE = linkDoEstudio("Oi! Quero saber mais sobre o Performance da minha vitrine.");

/**
 * OS TRÊS JEITOS DE PAGAR (07/10/2026), cobrados no ESTÚDIO, na página
 * /assinar/<loja>: a chave do Mercado Pago nunca vem para a vitrine. Os
 * valores cobrados moram em lib/oferta-performance.ts do estúdio; aqui só
 * se exibe. O `assinar` é a página da loja, que o central manda no acesso.
 */
export type JeitoDePagar = "pix_mensal" | "cartao_mensal" | "cartao_anual";

/**
 * OS UPGRADES DA VITRINE (07/10/2026), espelho do que o estúdio cobra em
 * lib/oferta-performance.ts de lá: a vitrine paga abate os R$ 999 (valores
 * do Rafael de 25/09, proposta da Fardo). A loja online traz o Performance
 * na mensalidade (decisão de 07/10). Aqui só se exibe.
 */
export type Degrau = "vender" | "loja";
export const DEGRAUS_EXIBIDOS: Record<Degrau, { nome: string; cheioTexto: string; valorTexto: string; linha: string; mensal: string | null }> = {
  vender: {
    nome: "Vender pela vitrine",
    cheioTexto: "R$ 1.990",
    valorTexto: "R$ 991",
    linha: "Pix e cartão na página da peça: quem decidiu paga na hora, sem esperar você responder.",
    mensal: null,
  },
  loja: {
    nome: "Loja online",
    cheioTexto: "R$ 3.499",
    valorTexto: "R$ 2.500",
    linha: "Sacola, estoque que baixa sozinho, frete para o Brasil e os pedidos no painel.",
    mensal: "depois, R$ 249,90 por mês com o Performance incluído",
  },
};
/** a página de upgrade do estúdio, para o PagarAqui embutir */
export const linkUpgrade = (estudio: string, loja: string, degrau: Degrau) => `${estudio}/upgrade/${loja}?degrau=${degrau}`;
export const linkAssinar = (assinar: string, plano: JeitoDePagar) => `${assinar}?plano=${plano}`;
