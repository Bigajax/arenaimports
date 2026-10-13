"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * O TRILHO DA PRATELEIRA (padrão Alto Giro, 08/10/2026, nascido na Be
 * Bless): quatro peças por vez no computador, três no tablet, duas no
 * celular, com uma seta redonda branca de cada lado, por cima das fotos.
 *
 * Desde 09/10/2026 (o Rafael: "aquela jogadinha automática" das lojas
 * grandes):
 * - ele ANDA SOZINHO, uma peça a cada 4 s, e no fim volta ao começo;
 * - mouse, dedo ou foco em cima param; com "reduzir movimento" não anda;
 *   e só anda com a aba visível e o trilho na tela;
 * - a seta aparece também no celular, menor, e anda UMA peça (antes, no
 *   computador, andava uma tela inteira).
 * A seta some quando não há mais para onde ir.
 *
 * overflow-y hidden no trilho: sem ele, o trilho ganha rolagem vertical e
 * come a roda do mouse (a armadilha do cofre).
 */
const INTERVALO = 4000;

export function Trilho({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  const trilho = useRef<HTMLUListElement>(null);
  const [inicio, setInicio] = useState(true);
  const [fim, setFim] = useState(false);
  const [parado, setParado] = useState(false);
  const [naTela, setNaTela] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [temMais, setTemMais] = useState(false);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () => {
      setInicio(el.scrollLeft < 8);
      setFim(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
      setTemMais(el.scrollWidth > el.clientWidth + 8);
      setProgresso(el.scrollWidth > el.clientWidth ? el.scrollLeft / (el.scrollWidth - el.clientWidth) : 0);
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    const olho = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: 0.4 });
    olho.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      olho.disconnect();
    };
  }, []);

  /* uma peça: a largura do primeiro cartão mais o vão */
  const passo = (el: HTMLUListElement) => {
    const a = el.children[0] as HTMLElement | undefined;
    const b = el.children[1] as HTMLElement | undefined;
    return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth / 2;
  };

  const andar = (lado: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: lado * passo(el), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  useEffect(() => {
    if (parado || pausado || !naTela) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const relogio = window.setInterval(() => {
      const el = trilho.current;
      if (!el || document.visibilityState !== "visible") return;
      if (el.scrollWidth <= el.clientWidth + 8) return;
      if (el.scrollLeft + el.clientWidth > el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: passo(el), behavior: "smooth" });
    }, INTERVALO);
    return () => window.clearInterval(relogio);
  }, [parado, pausado, naTela]);

  return (
    <div
      className="vt-trilho"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onTouchStart={() => setParado(true)}
      onFocus={() => setParado(true)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setParado(false); }}
    >
      <ul ref={trilho} className="vt-trilho__fila faixa-scroll" aria-label={rotulo}>
        {children}
      </ul>
      <button type="button" className="vt-trilho__seta vt-trilho__seta--antes" onClick={() => andar(-1)} aria-label="Peça anterior" hidden={inicio}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M14.5 5.5L8 12l6.5 6.5" />
        </svg>
      </button>
      <button type="button" className="vt-trilho__seta vt-trilho__seta--depois" onClick={() => andar(1)} aria-label="Próxima peça" hidden={fim}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M9.5 5.5L16 12l-6.5 6.5" />
        </svg>
      </button>
      {temMais ? <div className="vt-trilho__rodape"><div className="vt-trilho__progresso" role="progressbar" aria-label="Posição na prateleira" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso*100)}><span style={{width:`${25 + progresso*75}%`}} /></div><button type="button" className="vt-link-discreto" onClick={() => setPausado(v => !v)}>{pausado ? "Retomar" : "Pausar"}<span className="sr-only"> movimento automático de {rotulo}</span></button></div> : null}
    </div>
  );
}
