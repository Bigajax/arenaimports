import { site } from "@/data/site.config";
import { slugar } from "@/lib/formato";

/**
 * O CÓDIGO DO LINK CURTO: "Story do Flack II" vira "flack-ii", "Link da
 * bio" vira "bio". Sai o que não diferencia um post do outro (o tipo do
 * post e as palavrinhas), e o resto fica com até 20 letras, cortado entre
 * palavras.
 */
const VAZIAS = new Set([
  "story", "stories", "storie", "reels", "reel", "post", "posts", "link", "do", "da", "de", "dos", "das",
  "o", "a", "os", "as", "e", "no", "na", "nos", "nas", "pro", "pra", "para", "com", "um", "uma",
]);

/* os caminhos que já são páginas do site não podem virar link de post */
export const RESERVADOS = new Set(["catalogo", "produto", "painel", "api", "icon", "apple-icon", "robots", "sitemap", "favicon", "_next", "teste-hero", "pronta-entrega", "mais-vendidos"]);

export function codigoCurto(nome: string): string {
  const palavras = slugar(nome).split("-").filter(Boolean);
  const uteis = palavras.filter((p) => !VAZIAS.has(p));
  const base = uteis.length ? uteis : palavras;
  let codigo = "";
  for (const p of base) {
    const proximo = codigo ? `${codigo}-${p}` : p;
    if (proximo.length > 20) break;
    codigo = proximo;
  }
  codigo = codigo || base[0]?.slice(0, 20) || "post";
  return RESERVADOS.has(codigo) ? `${codigo}-post` : codigo;
}

/** Como o link aparece escrito: sem https://, que o Instagram também esconde. Sai do site.url. */
export const DOMINIO_ESCRITO = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
