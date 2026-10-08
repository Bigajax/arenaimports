/**
 * A FOTO JÁ SAI DO CELULAR EM WEBP (28/09/2026, regra da casa: toda
 * imagem sobe em WebP).
 *
 * O servidor converte tudo para WebP, mas a Vercel recusa o envio acima
 * de 4,5 MB ANTES de ele chegar na rota: a foto de celular (5 a 12 MB) e a
 * arte PNG do gerador de imagem voltavam com erro, sem a nossa mensagem.
 * Aqui o navegador reduz a foto para a largura que o site usa e grava em
 * WebP antes de mandar; o servidor segue convertendo, como segurança.
 *
 * Nunca impede o envio: se o navegador não conseguir abrir o arquivo (o
 * HEIC do iPhone fora do Safari, por exemplo), vai o original, e a rota
 * responde com a mensagem dela.
 */
export async function prepararImagem(arquivo: File, larguraMaxima: number): Promise<File> {
  /* WebP pequeno já está no formato certo: não reprocessa */
  if (arquivo.type === "image/webp" && arquivo.size < 1.5 * 1024 * 1024) return arquivo;

  try {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, larguraMaxima / bitmap.width);
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    const ctx = tela.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    /* o Safari antigo não grava WebP e devolve PNG: aí vai JPEG, que é
       leve, e o servidor faz o WebP */
    let blob = await new Promise<Blob | null>((r) => tela.toBlob(r, "image/webp", 0.92));
    if (!blob || blob.type !== "image/webp") {
      blob = await new Promise<Blob | null>((r) => tela.toBlob(r, "image/jpeg", 0.92));
    }
    if (!blob || blob.size >= arquivo.size) return arquivo;

    const extensao = blob.type === "image/webp" ? "webp" : "jpg";
    const nome = arquivo.name.replace(/\.[^.]+$/, "") + "." + extensao;
    return new File([blob], nome, { type: blob.type });
  } catch {
    return arquivo;
  }
}
