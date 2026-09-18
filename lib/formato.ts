const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Preço em reais. Sem valor cadastrado, a conversa é no WhatsApp. */
export function precoBRL(valor: number | null | undefined): string | null {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
  return BRL.format(valor);
}

/** "1.234,56" ou "1234.56" → 1234.56 */
export function paraNumero(entrada: string): number | null {
  const limpo = entrada.replace(/[^\d,.-]/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/** Máscara de digitação em reais: 12990 → "129,90" */
export function mascaraBRL(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  const n = Number(digitos) / 100;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function slugar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** KTN-0142 a partir de um número sequencial. */
export function codigoPeca(sequencia: number): string {
  return `KTN-${String(sequencia).padStart(4, "0")}`;
}

export function listar(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}
