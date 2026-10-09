import { promises as fs } from "node:fs";
import path from "node:path";
import { configPadrao } from "@/data/site.config";
import type { Categoria, Config, Imagem, Produto } from "./tipos";

const PASTA = path.join(process.cwd(), "data");
const CATALOGO = path.join(PASTA, "catalogo.json");
const CONFIG = path.join(PASTA, "config.json");
export const PASTA_UPLOAD = path.join(process.cwd(), "public", "produtos");

/* Grava inteiro ou nada (08/10/2026, no teste de ponta a ponta): o
   writeFile direto zera o arquivo antes de escrever, e a leitura que cai
   nesse meio pega "" e quebra a página (500), ou, nas que caem no catch,
   devolve vazio, e o próximo salvar grava por cima apagando tudo. Escreve
   ao lado e troca. */
export async function gravarJson(arquivo: string, valor: unknown): Promise<void> {
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  const texto = `${JSON.stringify(valor, null, 2)}\n`;
  const temporario = `${arquivo}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporario, texto, "utf8");
  /* no Windows, a troca falha se alguém está lendo naquele instante: tenta
     de novo, e no fim grava direto, porque perder o salvar é pior */
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    try {
      await fs.rename(temporario, arquivo);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  await fs.rm(temporario, { force: true });
  await fs.writeFile(arquivo, texto, "utf8");
}

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
  await gravarJson(CATALOGO, catalogo);
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
  await gravarJson(CONFIG, config);
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
