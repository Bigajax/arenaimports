"use client";

import { useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@vitrine/plataforma/lib/tipos";

/**
 * A CAMPANHA DO TOPO: três banners passando sozinhos a cada 6 segundos, no
 * lugar do hero (desde 28/09/2026, nascida na Japa Modas). Desde 08/10/2026
 * no PADRÃO ALTO GIRO (nascido na Be Bless; a regra está no cofre,
 * "padrao-alto-giro-vitrine"):
 *
 * NO COMPUTADOR a arte deitada (21:9) vai de ponta a ponta, com setas finas
 * nas duas bordas. O texto entra de um de dois jeitos:
 * - com `posicao`: a linha e o botão de contorno, lado a lado, no lugar
 *   calmo da arte (x/y em %), sem degradê. É o jeito da arte que já traz o
 *   título desenhado (`titulo_na_arte`);
 * - sem `posicao`: título, linha e botão no pé do `lado` escolhido, sobre
 *   um degradê escuro que sobe daquele lado.
 *
 * NO CELULAR não há seta: bolinhas no pé e o arrastar com o dedo.
 * - com a arte EM PÉ (`celular`, 4:5) em todos os banners: ela ocupa a
 *   tela, e o texto vai por cima, no pé, sobre um degradê;
 * - sem ela: a arte deitada INTEIRA, sem faixa escura embaixo ("foto
 *   completa, sem essas margens"), e só o botão por cima, em xm/ym.
 *
 * O texto NUNCA vai na imagem gerada: o gerador erra letra e inventa
 * preço. Cada dado do texto sai da loja. A cor da letra por cima da arte é
 * `letra` (clara, ou escura para arte de fundo claro).
 *
 * O relógio é a barra que enche (CSS, 6 s, invisível): quando ela termina,
 * o banner troca. Mouse ou foco em cima pausa; com movimento reduzido, a
 * barra não anda e o carrossel fica parado.
 */
export function Campanha({ slides: SLIDES, nome }: { slides: Banner[]; nome: string }) {
  const [atual, setAtual] = useState(0);
  const [parado, setParado] = useState(false);
  const toque = useRef<{ x: number; y: number } | null>(null);

  const ir = (i: number) => setAtual((i + SLIDES.length) % SLIDES.length);
  if (!SLIDES.length) return null;
  const varios = SLIDES.length > 1;
  /* a arte em pé só vale se TODOS os banners tiverem: com uma só, os
     outros slides ficariam com um vazio no celular (o grid empilha) */
  const emPe = SLIDES.every((s) => s.celular);

  return (
    <section
      className="camp"
      data-em-pe={emPe ? "true" : undefined}
      aria-roledescription="carrossel"
      aria-label={`Campanha da ${nome}`}
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onFocus={() => setParado(true)}
      onBlur={() => setParado(false)}
      onTouchStart={(e) => {
        toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const ini = toque.current;
        toque.current = null;
        if (!ini || !varios) return;
        const dx = e.changedTouches[0].clientX - ini.x;
        const dy = e.changedTouches[0].clientY - ini.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) ir(atual + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="camp__palco">
        {SLIDES.map((s, i) => {
          const p = s.posicao;
          const estilo = { "--foco": s.foco, ...(p ? { "--x": `${p.x}%`, "--y": `${p.y}%`, "--xm": `${p.xm}%`, "--ym": `${p.ym}%` } : {}) } as CSSProperties;
          const titulo = s.titulo_na_arte ? "sr-only" : "camp__titulo";
          return (
            <div
              key={s.id}
              className="camp__slide"
              data-lado={s.lado}
              data-posicao={p ? "true" : undefined}
              data-letra={s.letra === "escura" ? "escura" : undefined}
              data-ativo={i === atual ? "true" : undefined}
              style={estilo}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${SLIDES.length}`}
              aria-hidden={i === atual ? undefined : "true"}
            >
              <div className="camp__foto">
                {/* cada arte na própria caixa: o CSS esconde a CAIXA, e com
                    ela o esqueleto de carregamento da foto que não carrega
                    naquela largura (sem isso, ele ficava POR CIMA da outra) */}
                <span className="camp__arte">
                  <Image src={s.foto} alt={s.alt} fill priority={i === 0} sizes="100vw" placeholder={s.blur ? "blur" : "empty"} blurDataURL={s.blur ?? undefined} className="object-cover" />
                </span>
                {emPe && s.celular ? (
                  <span className="camp__arte-celular">
                    <Image src={s.celular} alt={s.alt} fill priority={i === 0} sizes="100vw" placeholder={s.celular_blur ? "blur" : "empty"} blurDataURL={s.celular_blur ?? undefined} className="object-cover" />
                  </span>
                ) : null}
              </div>
              <div className="camp__texto">
                {i === 0 ? <h1 className={titulo}>{s.titulo}</h1> : <p className={titulo}>{s.titulo}</p>}
                {s.linha ? <p className="camp__linha">{s.linha}</p> : null}
                <Link href={s.href} className="camp__botao" tabIndex={i === atual ? undefined : -1}>
                  {s.botao}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {varios ? (
        <>
          <button type="button" className="camp__seta camp__seta--antes" onClick={() => ir(atual - 1)} aria-label="Banner anterior">
            <svg viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M20 2L4 24l16 22" />
            </svg>
          </button>
          <button type="button" className="camp__seta camp__seta--depois" onClick={() => ir(atual + 1)} aria-label="Próximo banner">
            <svg viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 2l16 22L4 46" />
            </svg>
          </button>
          <div className="camp__pontos" data-parado={parado ? "true" : undefined}>
            {SLIDES.map((s, i) => (
              <button key={s.id} type="button" className="camp__ponto" aria-label={`Ir para o banner ${i + 1}`} aria-current={i === atual ? "true" : undefined} onClick={() => ir(i)}>
                {i === atual ? <span key={atual} className="camp__enche" onAnimationEnd={() => ir(atual + 1)} /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
