"use client";

import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";
import { useEffect, useRef } from "react";

/**
 * O AVISO DE "LIBERADO ATÉ" (06/10/2026, pedido do Rafael): em vez da faixa
 * amarela fixa no topo da aba, um modal marcado como importante, que abre
 * quando o dono entra e some depois que ele fecha. Lembra de novo só se a
 * data mudar (uma liberação nova), pela chave guardada no navegador.
 *
 * Nunca trava de surpresa: foi a regra combinada com a Japa, e este aviso
 * é o jeito de ela valer em toda vitrine.
 */
export function AvisoLiberado({ ate, chave }: { ate: string; chave: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const k = `vt_aviso_perf_${chave}`;
    try {
      if (localStorage.getItem(k)) return;
    } catch {
      /* sem localStorage, mostra sempre: melhor repetir o aviso do que travar de surpresa */
    }
    const d = ref.current;
    if (!d || d.open) return;
    try {
      d.showModal();
    } catch {
      return;
    }
    const fechou = () => {
      try {
        localStorage.setItem(k, "1");
      } catch {
        /* idem */
      }
    };
    d.addEventListener("close", fechou);
    return () => d.removeEventListener("close", fechou);
  }, [chave]);

  return (
    <dialog
      ref={ref}
      className="pn-dialogo"
      aria-labelledby="aviso-perf-titulo"
    >
      <p className="pn-dialogo__rotulo">Importante</p>
      <h2 id="aviso-perf-titulo">
        <SeloPerformance tamanho={22} /> Performance liberado até {ate}.
      </h2>
      <p>
        Depois dessa data a aba volta ao básico, e a sua contagem continua
        guardada. Para seguir com o Performance, fale com o estúdio antes de
        acabar.
      </p>
      <form method="dialog" className="pn-dialogo__acoes">
        <span className="pn-carimbo">
          <button type="submit">Entendi</button>
        </span>
      </form>
    </dialog>
  );
}
