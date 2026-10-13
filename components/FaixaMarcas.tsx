"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * A FAIXA DAS MARCAS. Nasceu no padrão Alto Giro (08/10/2026, Be Bless) como
 * um letreiro que andava sozinho; desde 09/10/2026, no desenho da Padel&Co.,
 * é "Escolha pela marca": logo abaixo dos benefícios, com uma seta de cada
 * lado, andando uma logo a cada 3 segundos, e cada logo leva às peças da
 * marca (/catalogo?marca=). REGRA: só a logo OFICIAL das marcas que a loja
 * vende, em arquivo. Nunca o nome escrito: marca sem logo não entra.
 *
 * As logos são MÁSCARA, pintadas na cor do texto, numa caixa de altura
 * fixa, para marcas de cores diferentes ficarem iguais. Mouse ou dedo em
 * cima pausa; com "reduzir movimento", não anda sozinha (as setas seguem).
 * O trilho tem overflow-y hidden: senão come a roda do mouse.
 */
export function FaixaMarcas({ titulo, marcas }: { titulo: string; marcas: { nome: string; logo: string }[] }) {
  const lista = marcas.filter((m) => m.logo);
  const trilho = useRef<HTMLUListElement>(null);
  const [parado, setParado] = useState(false);

  const andar = (passo: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    const item = el.querySelector("li");
    const largura = item ? item.getBoundingClientRect().width : el.clientWidth / 3;
    const fim = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (passo > 0 && fim) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (passo < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: passo * largura, behavior: "smooth" });
  };

  useEffect(() => {
    if (parado || lista.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const relogio = window.setInterval(() => {
      if (document.visibilityState === "visible") andar(1);
    }, 3000);
    return () => window.clearInterval(relogio);
  }, [parado, lista.length]);

  if (!lista.length) return null;

  const seta = (passo: 1 | -1) => (
    <button type="button" className="vt-marcas__seta" onClick={() => andar(passo)} aria-label={passo < 0 ? "Marcas anteriores" : "Próximas marcas"}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d={passo < 0 ? "M14.5 5.5L8 12l6.5 6.5" : "M9.5 5.5L16 12l-6.5 6.5"} />
      </svg>
    </button>
  );

  return (
    <section
      className="vt-marcas"
      aria-labelledby="vt-marcas-titulo"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onTouchStart={() => setParado(true)}
      onFocus={() => setParado(true)}
      onBlur={() => setParado(false)}
    >
      <h2 id="vt-marcas-titulo" className="vt-marcas__titulo">
        {titulo}
      </h2>
      <div className="miolo vt-marcas__linha">
        {seta(-1)}
        <ul ref={trilho} className="vt-marcas__trilho">
          {lista.map((m) => (
            <li key={m.nome}>
              <Link href={`/catalogo?busca=${encodeURIComponent(m.nome)}`} className="vt-marcas__item" aria-label={`Peças da ${m.nome}`}>
                <span className="vt-marcas__logo" style={{ WebkitMaskImage: `url(${m.logo})`, maskImage: `url(${m.logo})` }} />
              </Link>
            </li>
          ))}
        </ul>
        {seta(1)}
      </div>
    </section>
  );
}
