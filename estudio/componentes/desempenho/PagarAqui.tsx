"use client";

import { useEffect, useRef, useState } from "react";
import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";
import { linkAssinar, type JeitoDePagar } from "@/estudio/lib/oferta-performance";

/**
 * PAGAR ALI MESMO (07/10/2026, "quando clicar em pagar, tanto no cartão
 * quanto no Pix, tem que abrir ali mesmo"). O botão abre um modal com a
 * página de pagar do ESTÚDIO embutida (/assinar/<loja>?embed=1): a chave do
 * Mercado Pago continua lá, e o dono não sai do painel. A página embutida
 * avisa a altura dela (o modal acompanha, sem barra dupla) e o pagamento
 * aprovado; aprovado, fechar o modal recarrega a aba, que volta liberada.
 * Os avisos só valem vindos da origem do estúdio.
 */
export function PagarAqui({
  assinar,
  plano,
  url,
  className,
  children,
  aoAbrir,
}: {
  assinar?: string;
  plano?: JeitoDePagar;
  /** (07/10) a página inteira a embutir, para o upgrade da vitrine */
  url?: string;
  className?: string;
  children: React.ReactNode;
  /** quem chama pode fechar o que estava aberto antes (o modal do plano) */
  aoAbrir?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [aberto, setAberto] = useState(false);
  const [altura, setAltura] = useState(560);
  const [pago, setPago] = useState(false);
  const destino = url ?? (assinar && plano ? linkAssinar(assinar, plano) : "");
  const src = destino ? `${destino}${destino.includes("?") ? "&" : "?"}embed=1` : "";
  const origem = (() => {
    try {
      return new URL(destino).origin;
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const ouvir = (e: MessageEvent) => {
      if (e.origin !== origem || !e.data || typeof e.data !== "object") return;
      if (e.data.tipo === "perf-altura" && typeof e.data.h === "number") setAltura(Math.min(Math.max(e.data.h, 320), 2000));
      if (e.data.tipo === "perf-pago") setPago(true);
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, [aberto, origem]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          aoAbrir?.();
          setAberto(true);
        }}
      >
        {children}
      </button>
      <dialog
        ref={ref}
        className="dz-pagar"
        aria-label="Pagar o Performance"
        onClose={() => {
          setAberto(false);
          /* pagou: a aba volta liberada, com os números completos */
          if (pago) window.location.reload();
        }}
      >
        <div className="dz-pagar__topo">
          <p className="dz-pagar__rotulo">
            <SeloPerformance tamanho={16} /> {pago ? "Pago" : "Pagamento seguro pelo Mercado Pago"}
          </p>
          <form method="dialog">
            <button type="submit" className="dz-pagar__x" aria-label={pago ? "Fechar e ver os números" : "Fechar"}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </form>
        </div>
        {aberto && src ? <iframe className="dz-pagar__quadro" src={src} title="Pagar o Performance" style={{ height: altura }} allow="payment; clipboard-write" /> : null}
        {pago ? (
          <form method="dialog" className="dz-pagar__fim">
            <button type="submit" className="dz-botao">
              {url ? "Fechar" : "Ver os números completos"}
            </button>
          </form>
        ) : null}
      </dialog>
    </>
  );
}
