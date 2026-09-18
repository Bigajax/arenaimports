/**
 * ESCOLHER CAPAS — a vista de lado vira a capa de cada tênis e chuteira
 *
 * O importador da Yupoo baixa três fotos por álbum e o fornecedor não
 * segue uma ordem: às vezes a primeira é a sola. Este passo apara o
 * fundo de cada foto (threshold alto, porque o fundo do estúdio tem
 * gradiente) e mede a proporção do que sobra: a vista de lado fica
 * entre 1,25 e 2,3 de largura por altura; a sola passa de 2,4 e a vista
 * de cima é quadrada. Entre as candidatas com proporção de lado, ganha a
 * de maior área. Bolsas e camisas ficam como o importador deixou.
 *
 *   node scripts/escolher-capas.mjs
 */
import sharp from "sharp";
import fs from "node:fs";

const CATALOGO = "data/catalogo.json";
const c = JSON.parse(fs.readFileSync(CATALOGO, "utf8"));
let trocadas = 0;
for (const p of c.produtos) {
  if (!p.yupoo || !["sneakers", "chuteiras", "tenis-de-corrida"].includes(p.categoria_slug) || p.imagens.length < 2) continue;
  const medidas = [];
  for (const [k, img] of p.imagens.entries()) {
    try {
      const t = await sharp("public" + img.url).trim({ threshold: 70 }).toBuffer({ resolveWithObject: true });
      const r = t.info.width / t.info.height;
      medidas.push({ k, r, area: t.info.width * t.info.height, lado: r >= 1.25 && r <= 2.3 });
    } catch {
      medidas.push({ k, r: 1, area: 0, lado: false });
    }
  }
  const deLado = medidas.filter((m) => m.lado);
  const capa = (deLado.length ? deLado : medidas).reduce((m, x) => (x.area > m.area ? x : m));
  if (capa.k !== 0) {
    const nova = [p.imagens[capa.k], ...p.imagens.filter((_, i) => i !== capa.k)].map((img, i) => ({ ...img, ordem: i }));
    p.imagens = nova;
    trocadas++;
  }
}
/* o hero e as capas de categoria seguem a capa nova */
const por = new Map(c.produtos.map((p) => [p.slug, p]));
c.hero = c.hero.map((h) => {
  const p = por.get(h.slug);
  if (!p) return h;
  const i = p.imagens[0];
  return { ...h, url: i.url, largura: i.largura, altura: i.altura, blur: i.blur, alt: p.nome };
});
for (const cat of c.categorias) {
  const p = c.produtos.find((x) => x.categoria_slug === cat.slug && x.destaque) ?? c.produtos.filter((x) => x.categoria_slug === cat.slug).sort((a, b) => a.ordem - b.ordem)[0];
  if (p) {
    cat.capa = p.imagens[0].url;
    cat.capaBlur = p.imagens[0].blur;
  }
}
fs.writeFileSync(CATALOGO, JSON.stringify(c, null, 2) + "\n");
console.log(`${trocadas} capas trocadas`);
