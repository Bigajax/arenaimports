"use client";

import { useState } from "react";
import type { Produto } from "@/lib/tipos";

/**
 * "COMPARTILHAR NO STATUS" (09/10/2026, a fila do Rafael). Gera a imagem da
 * peça pronta para o Status e o Stories (/painel/compartilhar/<id>) e:
 * - no celular, abre a folha de compartilhar do sistema (WhatsApp, Instagram),
 *   com a imagem e o endereço da peça;
 * - onde o navegador não compartilha arquivo (o computador), baixa a imagem.
 */
export function CompartilharPeca({ produto, endereco, avisar }: { produto: Produto; endereco: string | null; avisar: (texto: string, tipo?: "ok" | "erro") => void }) {
  const [ocupado, setOcupado] = useState(false);

  async function compartilhar() {
    setOcupado(true);
    try {
      const r = await fetch(`/painel/compartilhar/${produto.id}`);
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const arquivo = new File([blob], `${produto.slug}.png`, { type: "image/png" });
      const dados: ShareData = { files: [arquivo], ...(endereco ? { text: `${produto.nome}: ${endereco}` } : {}) };
      if (navigator.canShare?.(dados)) {
        await navigator.share(dados);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = arquivo.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      avisar("Pronto: a imagem foi baixada. Poste no Status ou no Stories pelo celular.");
    } catch (e) {
      /* fechar a folha de compartilhar sem escolher não é erro */
      if (e instanceof DOMException && e.name === "AbortError") return;
      avisar(e instanceof Error && e.message ? e.message : "Não deu para gerar a imagem agora.", "erro");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <button type="button" className="btn btn--texto" onClick={() => void compartilhar()} disabled={ocupado}>
      {ocupado ? "Gerando a imagem…" : "Compartilhar no Status"}
    </button>
  );
}
