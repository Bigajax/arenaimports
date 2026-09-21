/**
 * Gera o favicon e a imagem de compartilhamento da Arena a partir das
 * artes da marca (public/marca/simbolo.png e logo.png, recortadas do
 * feed com o preto virando transparência): app/icon.png (512) e
 * app/apple-icon.png (180) com o símbolo sobre o preto; public/og/site.jpg
 * (1200x630) com o letreiro e a linha da loja, o que aparece quando
 * alguém manda o link no WhatsApp.
 *
 *   node scripts/gerar-icones.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const PRETO = "#000000";
const VERDE = "#cef745";

async function icone(tamanho, destino) {
  const simbolo = await sharp("public/marca/simbolo.png").resize({ width: Math.round(tamanho * 0.74) }).png().toBuffer();
  const meta = await sharp(simbolo).metadata();
  await sharp({ create: { width: tamanho, height: tamanho, channels: 4, background: PRETO } })
    .composite([{ input: simbolo, left: Math.round((tamanho - meta.width) / 2), top: Math.round((tamanho - meta.height) / 2) }])
    .png()
    .toFile(destino);
  console.log(destino, tamanho);
}

async function og() {
  const L = 1200, A = 630;
  fs.mkdirSync("public/og", { recursive: true });
  const logo = await sharp("public/marca/logo.png").resize({ width: 520 }).toBuffer();
  const lm = await sharp(logo).metadata();
  const legenda = Buffer.from(`<svg width="${L}" height="${A}">
    <style>text{font-family:"Barlow","Arial Narrow",Arial,sans-serif}</style>
    <rect width="${L}" height="${A}" fill="${PRETO}"/>
    <rect x="0" y="${A - 8}" width="${L}" height="8" fill="${VERDE}"/>
    <text x="600" y="480" text-anchor="middle" font-size="30" font-weight="700" fill="#ffffff">Direto da fonte. Direto pra você.</text>
    <text x="600" y="524" text-anchor="middle" font-size="22" fill="#a3a5a0">Chuteiras, tênis de corrida, sneakers, camisas e bolsas importados. Florianópolis, envio para todo o Brasil. Pedido pelo WhatsApp</text>
  </svg>`);
  await sharp(legenda)
    .composite([{ input: logo, left: Math.round((L - lm.width) / 2), top: 90 }])
    .jpeg({ quality: 88 })
    .toFile("public/og/site.jpg");
  console.log("public/og/site.jpg");
}

await icone(512, "app/icon.png");
await icone(180, "app/apple-icon.png");
await og();
