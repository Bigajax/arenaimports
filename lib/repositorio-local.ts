import { promises as fs } from "node:fs";
import path from "node:path";
import { configPadrao } from "@/data/site.config";
import type { Categoria, Config, Imagem, Produto } from "./tipos";

const PASTA = path.join(process.cwd(), "data");
const CATALOGO = path.join(PASTA, "catalogo.json");
const CONFIG = path.join(PASTA, "config.json");
export const PASTA_UPLOAD = path.join(process.cwd(), "public", "produtos");

export type Catalogo = {
  categorias: Categoria[];
  produtos: Produto[];
  hero: (Imagem & { slug?: string })[];
};

export async function lerCatalogo(): Promise<Catalogo> {
  const bruto = await fs.readFile(CATALOGO, "utf8");
  const dados = JSON.parse(bruto) as Catalogo;
  return {
    categorias: dados.categorias ?? [],
    produtos: dados.produtos ?? [],
    hero: dados.hero ?? [],
  };
}

export async function gravarCatalogo(catalogo: Catalogo): Promise<void> {
  await fs.writeFile(CATALOGO, `${JSON.stringify(catalogo, null, 2)}\n`, "utf8");
}

export async function lerConfig(): Promise<Config> {
  try {
    const bruto = await fs.readFile(CONFIG, "utf8");
    return { ...configPadrao, ...(JSON.parse(bruto) as Config) };
  } catch {
    return { ...configPadrao };
  }
}

export async function gravarConfig(config: Config): Promise<void> {
  await fs.mkdir(PASTA, { recursive: true });
  await fs.writeFile(CONFIG, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/** Grava o arquivo enviado em /public/produtos e devolve a URL pública. */
export async function gravarImagem(
  nomeArquivo: string,
  conteudo: Buffer,
): Promise<string> {
  await fs.mkdir(PASTA_UPLOAD, { recursive: true });
  await fs.writeFile(path.join(PASTA_UPLOAD, nomeArquivo), conteudo);
  return `/produtos/${nomeArquivo}`;
}

export async function apagarImagem(url: string): Promise<void> {
  if (!url.startsWith("/produtos/")) return;
  try {
    await fs.unlink(path.join(process.cwd(), "public", url.replace(/^\//, "")));
  } catch {
    // arquivo já não existe: nada a fazer
  }
}
