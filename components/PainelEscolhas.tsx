"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icone } from "@vitrine/plataforma/componentes/Icones";
import { useEscolhas } from "./Escolhas";
import { ListaEscolhas } from "./ListaEscolhas";

export function PainelEscolhas({ whatsapp }: { whatsapp: string }) {
  const { painel, fecharPainel, dados } = useEscolhas();
  const dialog = useRef<HTMLDialogElement>(null);
  const fechar = useRef(fecharPainel); fechar.current = fecharPainel;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fechando, setFechando] = useState(false);

  useEffect(() => {
    const elemento = dialog.current;
    if (!elemento || !painel) return;
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflowAnterior = document.body.style.overflow;
    setFechando(false);
    elemento.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      elemento.close();
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior?.isConnected) focoAnterior.focus({ preventScroll: true });
    };
  }, [painel]);

  const solicitarFechar = () => {
    if (timer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { fechar.current(); return; }
    setFechando(true);
    timer.current = setTimeout(() => fechar.current(), 180);
  };
  const total = painel === "favoritos" ? dados.favoritos.length : dados.sacola.reduce((s,r) => s + r.quantidade, 0);

  return (
    <dialog ref={dialog} id="vt-painel-escolhas" className="vt-escolhas-dialog" data-fechando={fechando || undefined}
      aria-labelledby="vt-painel-escolhas-titulo" aria-describedby="vt-painel-escolhas-descricao"
      onCancel={e => { e.preventDefault(); solicitarFechar(); }}
      onKeyDown={e => {
        if (e.key !== "Tab") return;
        const focos = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]'))
          .filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
        const primeiro = focos[0], ultimo = focos[focos.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo?.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro?.focus(); }
      }}
      onClose={() => { if (dialog.current && !dialog.current.open) fechar.current(); }}
      onClick={e => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.target instanceof Element && e.target.closest('a[href^="/"]')) { fechar.current(); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.target === e.currentTarget && (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom)) solicitarFechar();
      }}>
      <header className="vt-escolhas-dialog__cabecalho">
        <div><p className="vt-sobretitulo">Suas escolhas</p><h2 id="vt-painel-escolhas-titulo">{painel === "favoritos" ? "Meus favoritos" : "Minha sacola"}{total ? <span>{total}</span> : null}</h2></div>
        <button type="button" autoFocus onClick={solicitarFechar} aria-label="Fechar resumo"><Icone nome="fechar" className="h-5 w-5" /></button>
        <p id="vt-painel-escolhas-descricao">{painel === "favoritos" ? "Guarde suas favoritas. Volte a elas quando quiser." : "Confira suas peças e combine o pedido com a loja."}</p>
      </header>
      {painel ? <ListaEscolhas key={painel} tipo={painel} whatsapp={whatsapp} compacta continuar={solicitarFechar} /> : null}
      <footer className="vt-escolhas-dialog__rodape">
        <button type="button" onClick={solicitarFechar}>Continuar escolhendo</button>
        <Link href={painel === "favoritos" ? "/favoritos" : "/sacola"}>{painel === "favoritos" ? "Ver todos os favoritos" : "Abrir sacola completa"}<span aria-hidden="true">→</span></Link>
      </footer>
    </dialog>
  );
}
