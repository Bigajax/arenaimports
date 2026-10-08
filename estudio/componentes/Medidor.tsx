"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { contarNestaAba, jaContouNestaAba, lerPedido, medir, origemDaVisita, postDaVisita } from "@/estudio/lib/medir";

/**
 * O olho da aba Desempenho no site: não desenha nada. Conta a entrada (uma
 * por aba do navegador), cada página de peça aberta e cada clique num
 * botão de WhatsApp, onde quer que ele esteja: a mensagem pronta já diz a
 * peça e o número, então não é preciso mexer em cada botão.
 */
export function Medidor() {
  const caminho = usePathname();

  useEffect(() => {
    if (jaContouNestaAba("vt_s")) return;
    contarNestaAba("vt_s");
    medir({ tipo: "visita", origem: origemDaVisita(), post: postDaVisita() });
  }, []);

  useEffect(() => {
    const peca = caminho.match(/^\/produto\/([a-z0-9-]+)/)?.[1];
    if (peca) medir({ tipo: "peca", produto: peca });
  }, [caminho]);

  useEffect(() => {
    function clique(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a[href*='wa.me']") as HTMLAnchorElement | null;
      if (!a) return;
      medir({ tipo: "whatsapp", ...lerPedido(a.href) });
    }
    /* captura: conta antes de o link levar a pessoa embora */
    document.addEventListener("click", clique, true);
    return () => document.removeEventListener("click", clique, true);
  }, []);

  return null;
}
