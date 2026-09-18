import { cache } from "react";
import { cookies } from "next/headers";
import { configPadrao } from "@/data/site.config";
import { CHAVE_SUPABASE, TEM_SUPABASE, URL_SUPABASE, clienteServidor } from "./supabase";
import { lerCatalogo, lerConfig, type Catalogo } from "./repositorio-local";
import type { Categoria, Config, Produto } from "./tipos";

export const MODO: "supabase" | "local" = TEM_SUPABASE ? "supabase" : "local";

async function supabaseServidor() {
  const loja = await cookies();
  return clienteServidor({
    getAll: () => loja.getAll(),
    set: (name, value, options) => loja.set({ name, value, ...options }),
  });
}

type LinhaProduto = {
  id: string;
  codigo: string;
  nome: string;
  slug: string;
  descricao: string | null;
  marca: string | null;
  preco: string | number | null;
  preco_promocional: string | number | null;
  tamanhos: string[] | null;
  cores: string[] | null;
  destaque: boolean;
  ativo: boolean;
  ordem: number;
  categorias: { slug: string } | null;
  produto_imagens: {
    id: string;
    url: string;
    alt: string | null;
    ordem: number;
  }[] | null;
};

const numero = (v: string | number | null) =>
  v === null || v === undefined ? null : Number(v);

function daLinha(linha: LinhaProduto): Produto {
  return {
    id: linha.id,
    codigo: linha.codigo,
    nome: linha.nome,
    slug: linha.slug,
    descricao: linha.descricao,
    marca: linha.marca,
    preco: numero(linha.preco),
    preco_promocional: numero(linha.preco_promocional),
    categoria_slug: linha.categorias?.slug ?? null,
    tamanhos: linha.tamanhos ?? [],
    cores: linha.cores ?? [],
    destaque: linha.destaque,
    ativo: linha.ativo,
    ordem: linha.ordem,
    imagens: (linha.produto_imagens ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((i) => ({ id: i.id, url: i.url, alt: i.alt, ordem: i.ordem })),
  };
}

/**
 * Catálogo inteiro em memória. São dezenas de peças, não milhares —
 * filtrar em JS mantém o comportamento idêntico no servidor e no cliente.
 * Acima de ~500 peças, mover o filtro para SQL (ver README).
 */
export const carregarCatalogo = cache(async (): Promise<Catalogo> => {
  if (MODO === "local") return lerCatalogo();

  const sb = await supabaseServidor();
  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    sb.from("categorias").select("*").eq("ativo", true).order("ordem"),
    sb
      .from("produtos")
      .select("*, categorias(slug), produto_imagens(id, url, alt, ordem)")
      .order("ordem"),
  ]);

  const lista = (produtos ?? []).map((p) => daLinha(p as LinhaProduto));

  // banco ainda vazio (seed não rodou): mostra o catálogo local em vez de nada
  if (!lista.length) {
    const local = await lerCatalogo().catch(() => null);
    if (local) return local;
  }

  return {
    categorias: (categorias ?? []) as Categoria[],
    produtos: lista,
    // o mosaico do hero acompanha as peças em destaque
    hero: lista
      .filter((p) => p.destaque && p.imagens.length)
      .slice(0, 3)
      .map((p) => ({ ...p.imagens[0], slug: p.slug })),
  };
});

export const obterConfig = cache(async (): Promise<Config> => {
  if (MODO === "local") return lerConfig();
  const sb = await supabaseServidor();
  const { data } = await sb.from("config").select("chave, valor");
  const doBanco = Object.fromEntries(
    (data ?? []).map((l: { chave: string; valor: string | null }) => [
      l.chave,
      l.valor ?? "",
    ]),
  );
  return { ...configPadrao, ...doBanco };
});

export async function obterProduto(slug: string): Promise<Produto | null> {
  const { produtos } = await carregarCatalogo();
  return produtos.find((p) => p.slug === slug && p.ativo) ?? null;
}

export async function obterCategoria(slug: string): Promise<Categoria | null> {
  const { categorias } = await carregarCatalogo();
  return categorias.find((c) => c.slug === slug) ?? null;
}

export const credenciais = { URL_SUPABASE, CHAVE_SUPABASE };
