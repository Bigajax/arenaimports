/**
 * As portas que juntam categorias. A Arena tem quatro categorias
 * diretas (chuteiras, corrida, sneakers, bolsas), nenhuma agrupada: o mapa
 * fica vazio até precisar.
 */
export const GRUPOS: Record<string, { nome: string; categorias: string[] }> = {};

export function categoriasDoGrupo(slug: string): string[] | null {
  return GRUPOS[slug]?.categorias ?? null;
}
