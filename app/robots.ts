import type { MetadataRoute } from "next";
import { site } from "@/data/site.config";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/painel" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
