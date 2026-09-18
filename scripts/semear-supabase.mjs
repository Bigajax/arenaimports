/**
 * SEMEAR O SUPABASE — o catálogo local vira o banco da loja
 *
 * O painel na Vercel não grava em disco (EROFS): para a loja editar pelo
 * celular, o catálogo precisa estar no Supabase. Este script lê
 * data/catalogo.json e escreve categorias, produtos (com pronta_entrega),
 * imagens e config no projeto Supabase da loja, e cria o usuário do
 * painel. As fotos continuam servidas pelo próprio site (/produtos/...);
 * só as fotos NOVAS, enviadas pelo painel, vão para o bucket.
 *
 * Reexecutável: atualiza pelo slug o que já existe.
 *
 * ANTES: rode supabase/migrations/0001_schema.sql no SQL Editor do projeto.
 *
 * USO (as chaves vêm de Project Settings → API):
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE=eyJ... \
 *   PAINEL_EMAIL=andre@... PAINEL_SENHA=... \
 *   npx tsx scripts/semear-supabase.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { configPadrao } from "../data/site.config.ts";

const URL = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_ROLE;
if (!URL || !CHAVE) {
  console.error("Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente.");
  process.exit(1);
}
const sb = createClient(URL, CHAVE, { auth: { persistSession: false } });
const catalogo = JSON.parse(fs.readFileSync("data/catalogo.json", "utf8"));

async function principal() {
  /* categorias */
  const idDaCategoria = new Map();
  for (const c of catalogo.categorias) {
    const { data, error } = await sb.from("categorias").upsert({ nome: c.nome, slug: c.slug, ordem: c.ordem, ativo: c.ativo }, { onConflict: "slug" }).select("id").single();
    if (error) throw new Error(`categoria ${c.slug}: ${error.message}`);
    idDaCategoria.set(c.slug, data.id);
  }
  console.log(`${idDaCategoria.size} categorias`);

  /* produtos e imagens */
  let n = 0;
  for (const p of catalogo.produtos) {
    const linha = {
      codigo: p.codigo,
      nome: p.nome,
      slug: p.slug,
      descricao: p.descricao,
      marca: p.marca,
      preco: p.preco,
      preco_promocional: p.preco_promocional,
      categoria_id: p.categoria_slug ? (idDaCategoria.get(p.categoria_slug) ?? null) : null,
      tamanhos: p.tamanhos,
      cores: p.cores,
      destaque: p.destaque,
      pronta_entrega: Boolean(p.pronta_entrega),
      ativo: p.ativo,
      ordem: p.ordem,
    };
    const { data, error } = await sb.from("produtos").upsert(linha, { onConflict: "slug" }).select("id").single();
    if (error) throw new Error(`produto ${p.slug}: ${error.message}`);
    await sb.from("produto_imagens").delete().eq("produto_id", data.id);
    if (p.imagens.length) {
      const { error: e2 } = await sb.from("produto_imagens").insert(p.imagens.map((img, i) => ({ produto_id: data.id, url: img.url, alt: img.alt ?? p.nome, ordem: i })));
      if (e2) throw new Error(`imagens ${p.slug}: ${e2.message}`);
    }
    n++;
    if (n % 25 === 0) console.log(`  ${n} produtos...`);
  }
  console.log(`${n} produtos`);

  /* config: só o que ainda não existe, para não sobrescrever o que a loja editou */
  const { data: existentes } = await sb.from("config").select("chave");
  const ja = new Set((existentes ?? []).map((l) => l.chave));
  const novas = Object.entries(configPadrao).filter(([k]) => !ja.has(k)).map(([chave, valor]) => ({ chave, valor }));
  if (novas.length) await sb.from("config").insert(novas);
  console.log(`config: ${novas.length} chaves novas`);

  /* o usuário do painel */
  if (process.env.PAINEL_EMAIL && process.env.PAINEL_SENHA) {
    const { error } = await sb.auth.admin.createUser({ email: process.env.PAINEL_EMAIL, password: process.env.PAINEL_SENHA, email_confirm: true });
    console.log(error ? `usuário: ${error.message}` : `usuário ${process.env.PAINEL_EMAIL} criado`);
  }
}

principal().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
