import { grade } from "@/data/grade.config";

/**
 * O "ÚNICO" NO CALÇADO (03/11/2026, vindo da M&M de 16/10, da sacola da
 * Iconic de 26/10 e da SneakerSpot de 03/11). O estoque do pacote cria a
 * variação "Único" para todo par sem numeração e a copia para os tamanhos da
 * peça; na v2.0.3 isso acontece já ao abrir a Início do painel. Na Arena, 13
 * calçados no ar ficaram assim (a nike-phantom-luna-elite-tf entre eles), e a
 * página da peça passou a mostrar "Tamanhos Único" e a tecla "Único". Para
 * calçado (grade.calcados), "Único" conta como sem numeração e a peça volta a
 * ser como era: sem teclas, a numeração vai na observação do pedido. Bolsas e
 * camisas ficam como estão (a bolsa tem o "Único" de verdade). Não mexe no
 * banco nem no pacote: só no que a vitrine mostra e na revisão da sacola
 * (app/api/escolhas).
 */
export const ehCalcado = (categoria: string | null | undefined) => !!categoria && grade.calcados.includes(categoria);

export function semUnico<T extends { tamanhos: string[]; categoria_slug?: string | null }>(p: T): T {
  if (!ehCalcado(p.categoria_slug) || !p.tamanhos.some((t) => t.trim().toLowerCase() === "único")) return p;
  return { ...p, tamanhos: p.tamanhos.filter((t) => t.trim().toLowerCase() !== "único") };
}
