/**
 * As portas que juntam categorias. As chuteiras são três áreas (campo,
 * society, futsal), cada uma sua categoria no catálogo, e a porta
 * "Chuteiras" abre as três: a página /catalogo/chuteiras lista tudo e
 * as fichinhas do topo separam por área.
 */
export const GRUPOS: Record<string, { nome: string; categorias: string[] }> = {
  chuteiras: { nome: "Chuteiras", categorias: ["chuteiras-campo", "chuteiras-society", "chuteiras-futsal"] },
};

export function categoriasDoGrupo(slug: string): string[] | null {
  return GRUPOS[slug]?.categorias ?? null;
}
