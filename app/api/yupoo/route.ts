import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { sessao } from "@/lib/auth";
import { MODO } from "@/lib/dados";
import { gravarImagem } from "@/lib/repositorio-local";
import { BUCKET, clienteServidor } from "@/lib/supabase";
import { baixarFoto, lerAlbum, lerLink, limparTitulo, marcaDe } from "@/lib/yupoo";

/**
 * POST { link } com o link de um álbum do Yupoo: o servidor lê o álbum,
 * baixa até quatro fotos (com o Referer que o Yupoo exige), grava cada
 * uma do mesmo jeito que /api/upload (WebP até 1600px, miniatura
 * embaçada) e devolve as imagens já no formato do catálogo, mais o
 * nome limpo, a marca, a cor e os tamanhos lidos do título do álbum.
 * A capa é a vista de lado (a foto em que o produto ocupa mais área
 * depois de aparar o fundo), como no importar-yupoo.mjs.
 */
export const runtime = "nodejs";

const FOTOS = 4;

export async function POST(requisicao: Request) {
  const { autenticado } = await sessao();
  if (!autenticado) return NextResponse.json({ erro: "Sua sessão expirou. Entre de novo." }, { status: 401 });

  let link = "";
  try {
    link = String((await requisicao.json()).link ?? "");
  } catch {
    return NextResponse.json({ erro: "Cola o link do álbum." }, { status: 400 });
  }
  const alvo = lerLink(link);
  if (!alvo) return NextResponse.json({ erro: "Esse não é um link de álbum do Yupoo. Ele fica assim: https://loja.x.yupoo.com/albums/123456" }, { status: 400 });

  let album;
  try {
    album = await lerAlbum(alvo.loja, alvo.id, alvo.senha);
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : "Não deu para abrir o álbum." }, { status: 502 });
  }

  /* baixa as candidatas e escolhe a capa pela vista de lado */
  const candidatas: { processada: Buffer; largura: number | null; altura: number | null; area: number }[] = [];
  for (const url of album.fotos.slice(0, FOTOS + 2)) {
    try {
      const original = await baixarFoto(url, `${album.base}/`);
      const processada = await sharp(original).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const meta = await sharp(processada).metadata();
      let area = 0;
      try {
        const aparada = await sharp(processada).trim({ threshold: 70 }).toBuffer({ resolveWithObject: true });
        const r = aparada.info.width / aparada.info.height;
        area = r >= 1.25 && r <= 2.3 ? aparada.info.width * aparada.info.height : 1;
      } catch {
        area = 0;
      }
      candidatas.push({ processada, largura: meta.width ?? null, altura: meta.height ?? null, area });
    } catch {
      /* uma foto que não baixa não derruba as outras */
    }
  }
  if (!candidatas.length) return NextResponse.json({ erro: "O álbum abriu, mas nenhuma foto baixou. Tenta de novo em um minuto." }, { status: 502 });
  const capa = candidatas.reduce((m, c) => (c.area > m.area ? c : m), candidatas[0]);
  const escolhidas = [capa, ...candidatas.filter((c) => c !== capa)].slice(0, FOTOS);

  /* grava como o /api/upload grava */
  const loja = await cookies();
  const cliente = MODO === "local" ? null : clienteServidor({ getAll: () => loja.getAll(), set: (n, v, o) => loja.set({ name: n, value: v, ...o }) });
  const imagens = [];
  for (const [k, c] of escolhidas.entries()) {
    const mini = await sharp(c.processada).resize(12).webp({ quality: 40 }).toBuffer();
    const nome = `${randomUUID()}.webp`;
    let url: string;
    if (!cliente) {
      url = await gravarImagem(nome, c.processada);
    } else {
      const { error } = await cliente.storage.from(BUCKET).upload(nome, c.processada, { contentType: "image/webp", upsert: false });
      if (error) return NextResponse.json({ erro: "O armazenamento recusou a foto. Tenta de novo." }, { status: 502 });
      url = cliente.storage.from(BUCKET).getPublicUrl(nome).data.publicUrl;
    }
    imagens.push({ url, largura: c.largura, altura: c.altura, blur: `data:image/webp;base64,${mini.toString("base64")}`, ordem: k });
  }

  const titulo = limparTitulo(album.titulo);
  return NextResponse.json({
    imagens,
    nome: titulo.nome,
    marca: marcaDe(titulo.nome) ?? marcaDe(album.titulo),
    cor: titulo.cores.join(", ") || null,
    tamanhos: titulo.tamanhos,
    yupoo: `${album.loja}/${album.id}`,
    total: album.fotos.length,
  });
}
