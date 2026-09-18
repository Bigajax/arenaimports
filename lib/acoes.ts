"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configPadrao } from "@/data/site.config";
import { entrar, exigirSessao, sair } from "./auth";
import { MODO } from "./dados";
import { codigoPeca, slugar } from "./formato";
import {
  apagarImagem,
  gravarCatalogo,
  gravarConfig,
  lerCatalogo,
  lerConfig,
} from "./repositorio-local";
import { clienteServidor } from "./supabase";
import type { Categoria, Config, Imagem, Produto, Resultado } from "./tipos";

async function sb() {
  const loja = await cookies();
  return clienteServidor({
    getAll: () => loja.getAll(),
    set: (name, value, options) => loja.set({ name, value, ...options }),
  });
}

function atualizarVitrine() {
  revalidatePath("/", "layout");
}

function mensagemDe(erro: unknown, padrao: string): string {
  return erro instanceof Error ? erro.message : padrao;
}

function falha(erro: unknown, padrao: string): { ok: false; erro: string } {
  return { ok: false, erro: mensagemDe(erro, padrao) };
}

/* ── sessão ─────────────────────────────────────────────────── */

export async function acaoEntrar(
  _anterior: { erro?: string } | null,
  dados: FormData,
): Promise<{ erro?: string }> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!senha) return { erro: "Digite a senha." };

  const r = await entrar(email, senha);
  if (!r.ok) return { erro: r.erro };
  redirect("/painel");
}

export async function acaoSair(): Promise<void> {
  await sair();
  redirect("/painel/login");
}

/* ── produtos ───────────────────────────────────────────────── */

export type EntradaProduto = {
  id?: string;
  nome: string;
  slug: string;
  codigo: string;
  descricao: string;
  marca: string;
  preco: number | null;
  preco_promocional: number | null;
  categoria_slug: string | null;
  tamanhos: string[];
  cores: string[];
  destaque: boolean;
  ativo: boolean;
  imagens: Imagem[];
};

export async function salvarProduto(
  entrada: EntradaProduto,
): Promise<Resultado<{ id: string }>> {
  try {
    await exigirSessao();

    if (!entrada.nome.trim()) {
      return { ok: false, erro: "A peça precisa de um nome." };
    }
    if (!entrada.imagens.length) {
      return { ok: false, erro: "Envie pelo menos uma foto da peça." };
    }

    const slug = slugar(entrada.slug || entrada.nome);

    if (MODO === "local") {
      const catalogo = await lerCatalogo();
      const repetido = catalogo.produtos.find(
        (p) => p.slug === slug && p.id !== entrada.id,
      );
      if (repetido) {
        return {
          ok: false,
          erro: `Já existe uma peça com o endereço "${slug}". Mude o nome ou o endereço.`,
        };
      }

      const existente = catalogo.produtos.find((p) => p.id === entrada.id);
      const produto: Produto = {
        id: existente?.id ?? `p-${Date.now().toString(36)}`,
        codigo: entrada.codigo || proximoCodigo(catalogo.produtos),
        nome: entrada.nome.trim(),
        slug,
        descricao: entrada.descricao.trim() || null,
        marca: entrada.marca.trim() || null,
        preco: entrada.preco,
        preco_promocional: entrada.preco_promocional,
        categoria_slug: entrada.categoria_slug,
        tamanhos: entrada.tamanhos,
        cores: entrada.cores,
        destaque: entrada.destaque,
        ativo: entrada.ativo,
        ordem: existente?.ordem ?? catalogo.produtos.length,
        imagens: entrada.imagens.map((img, i) => ({ ...img, ordem: i })),
      };

      catalogo.produtos = existente
        ? catalogo.produtos.map((p) => (p.id === existente.id ? produto : p))
        : [...catalogo.produtos, produto];

      await gravarCatalogo(catalogo);
      atualizarVitrine();
      return { ok: true, dado: { id: produto.id } };
    }

    const cliente = await sb();
    const { data: categoria } = entrada.categoria_slug
      ? await cliente
          .from("categorias")
          .select("id")
          .eq("slug", entrada.categoria_slug)
          .single()
      : { data: null };

    const linha = {
      codigo: entrada.codigo,
      nome: entrada.nome.trim(),
      slug,
      descricao: entrada.descricao.trim() || null,
      marca: entrada.marca.trim() || null,
      preco: entrada.preco,
      preco_promocional: entrada.preco_promocional,
      categoria_id: (categoria as { id: string } | null)?.id ?? null,
      tamanhos: entrada.tamanhos,
      cores: entrada.cores,
      destaque: entrada.destaque,
      ativo: entrada.ativo,
    };

    const { data, error } = entrada.id
      ? await cliente.from("produtos").update(linha).eq("id", entrada.id).select("id").single()
      : await cliente.from("produtos").insert(linha).select("id").single();

    if (error) return { ok: false, erro: traduzir(error.message) };

    const id = (data as { id: string }).id;
    await cliente.from("produto_imagens").delete().eq("produto_id", id);
    if (entrada.imagens.length) {
      await cliente.from("produto_imagens").insert(
        entrada.imagens.map((img, i) => ({
          produto_id: id,
          url: img.url,
          alt: img.alt,
          ordem: i,
        })),
      );
    }

    atualizarVitrine();
    return { ok: true, dado: { id } };
  } catch (e) {
    return falha(e, "Não deu para salvar a peça agora.");
  }
}

export async function excluirProduto(id: string): Promise<Resultado<null>> {
  try {
    await exigirSessao();

    if (MODO === "local") {
      const catalogo = await lerCatalogo();
      const alvo = catalogo.produtos.find((p) => p.id === id);
      if (!alvo) return { ok: false, erro: "Essa peça já não está no catálogo." };
      for (const img of alvo.imagens) await apagarImagem(img.url);
      catalogo.produtos = catalogo.produtos.filter((p) => p.id !== id);
      await gravarCatalogo(catalogo);
    } else {
      const cliente = await sb();
      const { error } = await cliente.from("produtos").delete().eq("id", id);
      if (error) return { ok: false, erro: traduzir(error.message) };
    }

    atualizarVitrine();
    return { ok: true, dado: null };
  } catch (e) {
    return falha(e, "Não deu para excluir a peça agora.");
  }
}

export async function alternarCampo(
  id: string,
  campo: "ativo" | "destaque",
  valor: boolean,
): Promise<Resultado<null>> {
  try {
    await exigirSessao();

    if (MODO === "local") {
      const catalogo = await lerCatalogo();
      catalogo.produtos = catalogo.produtos.map((p) =>
        p.id === id ? { ...p, [campo]: valor } : p,
      );
      await gravarCatalogo(catalogo);
    } else {
      const cliente = await sb();
      const { error } = await cliente
        .from("produtos")
        .update({ [campo]: valor })
        .eq("id", id);
      if (error) return { ok: false, erro: traduzir(error.message) };
    }

    atualizarVitrine();
    return { ok: true, dado: null };
  } catch (e) {
    return falha(e, "Não deu para mudar essa peça agora.");
  }
}

export async function reordenarProdutos(
  ids: string[],
): Promise<Resultado<null>> {
  try {
    await exigirSessao();

    if (MODO === "local") {
      const catalogo = await lerCatalogo();
      const posicao = new Map(ids.map((id, i) => [id, i]));
      catalogo.produtos = catalogo.produtos
        .map((p) => ({ ...p, ordem: posicao.get(p.id) ?? p.ordem }))
        .sort((a, b) => a.ordem - b.ordem);
      await gravarCatalogo(catalogo);
    } else {
      const cliente = await sb();
      for (let i = 0; i < ids.length; i++) {
        await cliente.from("produtos").update({ ordem: i }).eq("id", ids[i]);
      }
    }

    atualizarVitrine();
    return { ok: true, dado: null };
  } catch (e) {
    return falha(e, "Não deu para salvar a nova ordem.");
  }
}

/* ── categorias ─────────────────────────────────────────────── */

export async function criarCategoria(
  nome: string,
): Promise<Resultado<Categoria>> {
  try {
    await exigirSessao();

    const limpo = nome.trim();
    if (!limpo) return { ok: false, erro: "Dê um nome para a categoria." };
    const slug = slugar(limpo);

    if (MODO === "local") {
      const catalogo = await lerCatalogo();
      if (catalogo.categorias.some((c) => c.slug === slug)) {
        return { ok: false, erro: "Essa categoria já existe." };
      }
      const categoria: Categoria = {
        id: `c-${slug}`,
        nome: limpo,
        slug,
        ordem: catalogo.categorias.length + 1,
        ativo: true,
      };
      catalogo.categorias = [...catalogo.categorias, categoria];
      await gravarCatalogo(catalogo);
      atualizarVitrine();
      return { ok: true, dado: categoria };
    }

    const cliente = await sb();
    const { data, error } = await cliente
      .from("categorias")
      .insert({ nome: limpo, slug, ordem: 99 })
      .select("*")
      .single();
    if (error) return { ok: false, erro: traduzir(error.message) };

    atualizarVitrine();
    return { ok: true, dado: data as Categoria };
  } catch (e) {
    return falha(e, "Não deu para criar a categoria agora.");
  }
}

/* ── configuração da loja ───────────────────────────────────── */

export async function salvarConfig(
  _anterior: { erro?: string; salvo?: boolean } | null,
  dados: FormData,
): Promise<{ erro?: string; salvo?: boolean }> {
  try {
    await exigirSessao();

    const config: Config = {};
    for (const chave of Object.keys(configPadrao)) {
      config[chave] = String(dados.get(chave) ?? "").trim();
    }

    const whats = config.whatsapp.replace(/\D/g, "");
    if (whats.length < 12) {
      return {
        erro: "O WhatsApp precisa vir com país e DDD, assim: 5532991169200.",
      };
    }
    config.whatsapp = whats;

    if (MODO === "local") {
      await gravarConfig({ ...(await lerConfig()), ...config });
    } else {
      const cliente = await sb();
      const { error } = await cliente.from("config").upsert(
        Object.entries(config).map(([chave, valor]) => ({ chave, valor })),
        { onConflict: "chave" },
      );
      if (error) return { erro: traduzir(error.message) };
    }

    atualizarVitrine();
    return { salvo: true };
  } catch (e) {
    return { erro: mensagemDe(e, "Não deu para salvar as configurações agora.") };
  }
}

/* ── apoio ──────────────────────────────────────────────────── */

function proximoCodigo(produtos: Produto[]): string {
  const maior = produtos.reduce((max, p) => {
    const n = Number(p.codigo.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return codigoPeca(maior + 1);
}

function traduzir(mensagem: string): string {
  if (/duplicate key/i.test(mensagem)) {
    return "Já existe uma peça com esse código ou endereço.";
  }
  if (/row-level security/i.test(mensagem)) {
    return "Sua sessão não tem permissão para isso. Entre de novo.";
  }
  return "O banco recusou a operação. Tente de novo em instantes.";
}
