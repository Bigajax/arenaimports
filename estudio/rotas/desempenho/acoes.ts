"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import { codigoCurto } from "@/estudio/lib/link-curto";
import { apagarLink, criarLink } from "@/estudio/lib/performance";
import { urlDoPost } from "@/estudio/lib/desempenho";

/** Cria o link de um post, no central. Nome repetido ganha um número no fim. */
export async function acaoCriarLink(nome: string): Promise<{ ok: true; url: string } | { ok: false; erro: string }> {
  await exigirSessao();
  const limpo = nome.trim().slice(0, 60);
  if (!limpo) return { ok: false, erro: "Dê um nome ao post." };
  const base = codigoCurto(limpo);
  for (let i = 1; i < 20; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const r = await criarLink(limpo, slug);
    if (!r) return { ok: false, erro: "Não deu para criar o link agora. Tente de novo." };
    if (r.ok) {
      revalidatePath("/painel/desempenho");
      return { ok: true, url: urlDoPost(slug) };
    }
    if (r.erro === "travada") return { ok: false, erro: "Medir os posts faz parte do Performance. Fale com o estúdio para liberar." };
    if (r.erro !== "repetido") return { ok: false, erro: "Não deu para criar o link agora. Tente de novo." };
  }
  return { ok: false, erro: "Já existem links demais com esse nome. Use outro." };
}

export async function acaoApagarLink(id: string): Promise<void> {
  await exigirSessao();
  await apagarLink(id);
  revalidatePath("/painel/desempenho");
}
