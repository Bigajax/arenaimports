import { prepararImagem } from "@/lib/imagem-no-navegador";

export type Enviada = { url: string; largura: number | null; altura: number | null; blur: string };

/**
 * O envio de foto do painel, um só para a peça, o banner e as fotos do
 * site. O navegador reduz e grava em WebP antes de mandar (a Vercel
 * recusa acima de 4,5 MB antes de a rota ver o arquivo), e a barra de
 * progresso é de verdade (XMLHttpRequest, que o fetch não dá).
 *
 * `tipo: "banner"` deixa a foto ir até 2400 px; o resto vai até 1600.
 */
export async function enviarFoto(arquivo: File, aoProgredir: (porcentagem: number) => void, tipo: "peca" | "banner" = "peca"): Promise<Enviada> {
  const pronto = await prepararImagem(arquivo, tipo === "banner" ? 2400 : 1600);
  return new Promise((resolver, rejeitar) => {
    const dados = new FormData();
    dados.append("arquivo", pronto);
    if (tipo === "banner") dados.append("tipo", "banner");

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
        /* resposta sem JSON: a Vercel recusou antes da rota */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(100);
        resolver(corpo as unknown as Enviada);
      } else if (xhr.status === 413) {
        rejeitar(new Error("A foto é grande demais para enviar. Tente uma foto menor ou um print dela."));
      } else {
        rejeitar(new Error(typeof corpo.erro === "string" ? corpo.erro : "Não deu para enviar a foto. Tente de novo."));
      }
    });
    xhr.addEventListener("error", () => rejeitar(new Error("A conexão caiu durante o envio. Tente de novo.")));
    xhr.send(dados);
  });
}
