"use client";

import { useEffect, useState } from "react";

/**
 * UM AVISO QUE SE FECHA NO X (07/10/2026, "coloca um X para tirar esta
 * mensagem"). Fechado, some pelo resto do dia, guardado no navegador pela
 * `chave`; no dia seguinte volta, enquanto a situação continuar (a chave
 * leva a data de hoje). Sem localStorage, o aviso só não lembra que foi
 * fechado: melhor repetir do que deixar o Performance acabar sem aviso.
 */
export function Dispensavel({ chave, children }: { chave: string; children: React.ReactNode }) {
  const k = `vt_aviso_${chave}_${new Date().toISOString().slice(0, 10)}`;
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(k)) setFechado(true);
    } catch {
      /* idem */
    }
  }, [k]);

  if (fechado) return null;
  return (
    <div className="dz-dispensavel">
      {children}
      <button
        type="button"
        className="dz-dispensavel__x"
        aria-label="Fechar o aviso até amanhã"
        onClick={() => {
          setFechado(true);
          try {
            localStorage.setItem(k, "1");
          } catch {
            /* idem */
          }
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
