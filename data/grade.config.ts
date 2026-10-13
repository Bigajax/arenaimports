/**
 * A GRADE DA ARENA IMPORTS (13/10/2026, a loja entra no pacote compartilhado).
 *
 * As categorias de CALÇADO: o número vira bolinha de 1 em 1 e o painel conta
 * o estoque por número. Tênis de corrida, sneakers e as três chuteiras.
 * Categoria nova de calçado entra aqui. Bolsas e camisas de time não têm
 * numeração de calçado.
 */
export const grade = {
  calcados: ["tenis-de-corrida", "sneakers", "chuteiras-campo", "chuteiras-society", "chuteiras-futsal"],
  passoRoupa: 1,
  /* calçado sem grade publicada: o painel pede a numeração escrita */
  numeracaoPergunta: null,
} satisfies { calcados: string[]; passoRoupa: number; numeracaoPergunta: [number, number] | null };
