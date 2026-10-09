import { promises as fs } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { site } from "@/data/site.config";
import { sessao } from "@/lib/auth";
import { carregarCatalogoDoPainel } from "@/lib/dados";
import { precoBRL } from "@/lib/formato";

/**
 * A PEÇA PRONTA PARA O STATUS E O STORIES (09/10/2026, a fila do Rafael:
 * "compartilhar a peça", o canal de divulgação principal das lojas). Um PNG
 * 1080 × 1920 com a foto, o nome, o preço e o endereço da peça, gerado na
 * hora pelo painel. Só com sessão: é o painel que compartilha.
 *
 * - Preço: o que a loja cadastrou (o promocional com o cheio riscado). Sem
 *   preço, nenhum valor aparece: "Peça pelo WhatsApp". Nunca inventar.
 * - Endereço: só o domínio de verdade. Fora do ar (localhost) a linha some:
 *   a regra da casa, o dono nunca vê localhost.
 * - A foto da peça é WebP, que o gerador de imagem não lê: o sharp (o mesmo
 *   do upload) converte para JPEG antes.
 */

export const runtime = "nodejs";

/* a marca da loja na imagem: a logo (em public/), a proporção dela (largura /
   altura) e a fonte do site no Google Fonts. Cada loja troca só isto. */
const MARCA = { logo: "/marca/logo.png", proporcao: 1.61, fonte: "Chakra Petch" };

async function bytesDe(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/")) return await fs.readFile(path.join(process.cwd(), "public", url));
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function fotoEmJpeg(url: string): Promise<string | null> {
  const bruto = await bytesDe(url);
  if (!bruto) return null;
  try {
    const jpeg = await sharp(bruto).rotate().resize({ width: 1080, height: 1350, fit: "cover" }).jpeg({ quality: 86 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

async function logoEmDataUrl(): Promise<string | null> {
  const bruto = await bytesDe(MARCA.logo);
  if (!bruto) return null;
  if (MARCA.logo.endsWith(".svg")) return `data:image/svg+xml;base64,${bruto.toString("base64")}`;
  try {
    const png = await sharp(bruto).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/* a fonte do site, regular e negrito, buscada uma vez do
   Google Fonts e guardada na memória; o gerador só traz a regular, sem
   negrito. Sem rede, vale a padrão: a imagem sai mesmo assim. */
type Fonte = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };
let fontes: Promise<Fonte[]> | null = null;
function carregarFontes(): Promise<Fonte[]> {
  fontes ??= Promise.all(
    ([400, 700] as const).map(async (peso) => {
      const css = await fetch(`https://fonts.googleapis.com/css2?family=${MARCA.fonte.replace(/ /g, "+")}:wght@${peso}`, { signal: AbortSignal.timeout(5000) }).then((r) => r.text());
      const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) throw new Error("fonte");
      const data = await fetch(url, { signal: AbortSignal.timeout(5000) }).then((r) => r.arrayBuffer());
      return { name: MARCA.fonte, data, weight: peso, style: "normal" as const };
    }),
  ).catch(() => {
    fontes = null;
    return [];
  });
  return fontes;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { autenticado } = await sessao();
  if (!autenticado) return new Response("Entre no painel para compartilhar.", { status: 401 });

  const { id } = await params;
  const { produtos } = await carregarCatalogoDoPainel();
  const peca = produtos.find((p) => p.id === id);
  if (!peca) return new Response("Essa peça já não está no catálogo.", { status: 404 });

  const [foto, logo, fonts] = await Promise.all([peca.imagens[0] ? fotoEmJpeg(peca.imagens[0].url) : Promise.resolve(null), logoEmDataUrl(), carregarFontes()]);

  const temPromo = peca.preco_promocional !== null && peca.preco !== null && peca.preco_promocional < peca.preco;
  const preco = precoBRL(temPromo ? peca.preco_promocional : (peca.preco ?? peca.preco_promocional));
  const cheio = temPromo ? precoBRL(peca.preco) : null;
  const host = new URL(site.url).host;
  const endereco = /localhost|127\.0\.0\.1/.test(host) ? null : `${host.replace(/^www\./, "")}/produto/${peca.slug}`;

  return new ImageResponse(
    (
      <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", background: "#ffffff", color: "#111111", fontFamily: fonts.length ? MARCA.fonte : undefined }}>
        <div style={{ width: 1080, height: 1350, display: "flex", background: "#ececec" }}>
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} width={1080} height={1350} style={{ width: 1080, height: 1350, objectFit: "cover" }} alt="" />
          ) : null}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px 64px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} height={64} width={Math.round(64 * MARCA.proporcao)} style={{ height: 64, width: Math.round(64 * MARCA.proporcao), objectFit: "contain", objectPosition: "left" }} alt="" />
            ) : (
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{site.nome}</div>
            )}
            <div style={{ fontSize: peca.nome.length > 34 ? 52 : 64, fontWeight: 800, lineHeight: 1.05 }}>{peca.nome}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cheio ? <div style={{ fontSize: 38, color: "#777777", textDecoration: "line-through" }}>{cheio}</div> : null}
              <div style={{ fontSize: preco ? 76 : 48, fontWeight: 800 }}>{preco ?? "Peça pelo WhatsApp"}</div>
            </div>
            {endereco ? <div style={{ fontSize: 30, color: "#444444", maxWidth: 520, textAlign: "right" }}>{endereco}</div> : null}
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": "private, no-store" } },
  );
}
