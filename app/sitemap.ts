import type { MetadataRoute } from "next";
import { carregarCatalogo } from "@/lib/dados";
import { site } from "@/data/site.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categorias, produtos } = await carregarCatalogo();
  const base = site.url.replace(/\/$/, "");
  const agora = new Date();

  return [
    { url: `${base}/`, lastModified: agora, priority: 1 },
    { url: `${base}/catalogo`, lastModified: agora, priority: 0.9 },
    ...categorias.map((c) => ({
      url: `${base}/catalogo/${c.slug}`,
      lastModified: agora,
      priority: 0.8,
    })),
    ...produtos
      .filter((p) => p.ativo)
      .map((p) => ({
        url: `${base}/produto/${p.slug}`,
        lastModified: agora,
        priority: 0.7,
      })),
  ];
}
