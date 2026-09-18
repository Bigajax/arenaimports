import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { sessao } from "@/lib/auth";
import { MODO } from "@/lib/dados";
import { gravarImagem } from "@/lib/repositorio-local";
import { BUCKET, clienteServidor } from "@/lib/supabase";

const LIMITE = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const runtime = "nodejs";

export async function POST(requisicao: Request) {
  const { autenticado } = await sessao();
  if (!autenticado) {
    return NextResponse.json(
      { erro: "Sua sessão expirou. Entre de novo para enviar fotos." },
      { status: 401 },
    );
  }

  const dados = await requisicao.formData();
  const arquivo = dados.get("arquivo");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ erro: "Nenhum arquivo chegou." }, { status: 400 });
  }
  if (!TIPOS.includes(arquivo.type)) {
    return NextResponse.json(
      { erro: "Formato não aceito. Envie JPG, PNG ou WebP." },
      { status: 415 },
    );
  }
  if (arquivo.size > LIMITE) {
    const mb = (arquivo.size / 1048576).toFixed(1);
    return NextResponse.json(
      { erro: `A imagem tem ${mb}MB e o limite é 5MB. Envie um arquivo menor.` },
      { status: 413 },
    );
  }

  try {
    const original = Buffer.from(await arquivo.arrayBuffer());

    // tudo entra no catálogo no mesmo formato: WebP, no máximo 1600px
    const processada = await sharp(original)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const meta = await sharp(processada).metadata();
    const miniatura = await sharp(original)
      .resize(12)
      .webp({ quality: 40 })
      .toBuffer();
    const blur = `data:image/webp;base64,${miniatura.toString("base64")}`;
    const nome = `${randomUUID()}.webp`;

    let url: string;
    if (MODO === "local") {
      url = await gravarImagem(nome, processada);
    } else {
      const loja = await cookies();
      const cliente = clienteServidor({
        getAll: () => loja.getAll(),
        set: (n, v, o) => loja.set({ name: n, value: v, ...o }),
      });
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(nome, processada, { contentType: "image/webp", upsert: false });
      if (error) {
        return NextResponse.json(
          { erro: "O armazenamento recusou o envio. Tente de novo." },
          { status: 502 },
        );
      }
      url = cliente.storage.from(BUCKET).getPublicUrl(nome).data.publicUrl;
    }

    return NextResponse.json({
      url,
      largura: meta.width ?? null,
      altura: meta.height ?? null,
      blur,
    });
  } catch {
    return NextResponse.json(
      { erro: "Não deu para processar essa imagem. Tente outro arquivo." },
      { status: 500 },
    );
  }
}
