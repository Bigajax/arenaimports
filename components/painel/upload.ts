/**
 * O envio de uma foto para /api/upload, com progresso. O servidor
 * redimensiona, converte para WebP e devolve a URL pública mais a
 * miniatura embaçada que o <Image> usa enquanto carrega.
 */
export type Enviada = { url: string; largura: number | null; altura: number | null; blur: string };

export function enviarFoto(arquivo: File, aoProgredir: (porcentagem: number) => void): Promise<Enviada> {
  return new Promise((resolver, rejeitar) => {
    const dados = new FormData();
    dados.append("arquivo", arquivo);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) aoProgredir(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      let corpo: Record<string, unknown> = {};
      try {
        corpo = JSON.parse(xhr.responseText);
      } catch {
        /* resposta sem JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(100);
        resolver(corpo as unknown as Enviada);
      } else {
        rejeitar(new Error(typeof corpo.erro === "string" ? corpo.erro : "Não deu para enviar a foto. Tente de novo."));
      }
    });
    xhr.addEventListener("error", () => rejeitar(new Error("A conexão caiu durante o envio. Tente de novo.")));
    xhr.send(dados);
  });
}
