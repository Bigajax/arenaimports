"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icone } from "./Icones";
import type { Imagem } from "@/lib/tipos";

/**
 * A galeria da peça. A foto entra INTEIRA, sem corte (object-contain
 * num quadro quadrado e branco): o Luiz viu a Vapor com as pontas
 * cortadas e pediu o par inteiro sempre. Para ver de perto, dois
 * jeitos: no computador, passar o mouse sobre a foto amplia 2,2x
 * seguindo o cursor (a lupa das lojas grandes); em qualquer tela, tocar
 * na foto abre em tela cheia, com pinça, roda do mouse, arraste e
 * toque duplo. As miniaturas também mostram a foto inteira.
 */
export function GaleriaProduto({ imagens, nome }: { imagens: Imagem[]; nome: string }) {
  const [atual, setAtual] = useState(0);
  const [aberta, setAberta] = useState(false);
  const [lupa, setLupa] = useState<{ x: number; y: number } | null>(null);
  const foto = imagens[atual];

  if (!foto) return <div className="foto aspect-square w-full" />;

  const anterior = () => setAtual((a) => (a - 1 + imagens.length) % imagens.length);
  const proxima = () => setAtual((a) => (a + 1) % imagens.length);

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {imagens.length > 1 ? (
        <ul className="faixa-scroll flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label={`Fotos de ${nome}`}>
          {imagens.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver foto ${i + 1} de ${imagens.length}`}
                aria-current={i === atual}
                className={`galeria-mini ${i === atual ? "galeria-mini--atual" : ""}`}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="galeria-quadro"
          aria-label="Ver a foto de perto"
          onClick={() => setAberta(true)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setLupa({ x: 50, y: 50 })}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            setLupa({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onPointerLeave={() => setLupa(null)}
        >
          <Image
            key={foto.url}
            src={foto.url}
            alt={foto.alt ?? nome}
            fill
            sizes="(max-width: 1024px) 100vw, 46vw"
            placeholder={foto.blur ? "blur" : "empty"}
            blurDataURL={foto.blur ?? undefined}
            priority
            className="object-contain"
            style={lupa ? { transform: "scale(2.2)", transformOrigin: `${lupa.x}% ${lupa.y}%` } : undefined}
          />
          <span className="galeria-lupa" aria-hidden="true">
            <Icone nome="lupa" className="h-4 w-4" peso={2} />
            <span>Toca pra ver de perto</span>
          </span>
        </button>
        {imagens.length > 1 ? (
          <p className="mt-2 text-center text-[0.8125rem] text-tinta-fraca lg:text-left">
            Foto {atual + 1} de {imagens.length}
          </p>
        ) : null}
      </div>

      {aberta ? <Ampliada src={foto.url} alt={foto.alt ?? nome} total={imagens.length} indice={atual} aoFechar={() => setAberta(false)} aoAnterior={anterior} aoProxima={proxima} /> : null}
    </div>
  );
}

/**
 * A foto em tela cheia. O zoom é feito na mão, por pointer events, para
 * a pinça do celular e a roda do mouse funcionarem igual: `escala` e o
 * deslocamento `pos` viram um transform; dois dedos medem a distância
 * entre si; um dedo (ou o mouse) arrasta quando está ampliado; o toque
 * duplo alterna entre 1x e 2,5x no ponto tocado.
 */
function Ampliada({ src, alt, total, indice, aoFechar, aoAnterior, aoProxima }: { src: string; alt: string; total: number; indice: number; aoFechar: () => void; aoAnterior: () => void; aoProxima: () => void }) {
  const [escala, setEscala] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dedos = useRef(new Map<number, { x: number; y: number }>());
  const ultimo = useRef<{ dist: number; centro: { x: number; y: number } } | null>(null);
  const toqueAnterior = useRef(0);
  const quadro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEscala(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowLeft") aoAnterior();
      if (e.key === "ArrowRight") aoProxima();
    };
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aoFechar, aoAnterior, aoProxima]);

  const limita = (v: number) => Math.min(6, Math.max(1, v));

  function ampliarEm(clienteX: number, clienteY: number, nova: number) {
    const r = quadro.current?.getBoundingClientRect();
    if (!r) return;
    /* mantém o ponto sob o dedo no mesmo lugar ao mudar a escala */
    const cx = clienteX - r.left - r.width / 2;
    const cy = clienteY - r.top - r.height / 2;
    const fator = nova / escala;
    setPos((p) => ({ x: cx - (cx - p.x) * fator, y: cy - (cy - p.y) * fator }));
    setEscala(nova);
  }

  function baixar(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.current.size === 1) {
      const agora = Date.now();
      if (agora - toqueAnterior.current < 300) {
        /* toque duplo: 1x <-> 2,5x no ponto */
        if (escala > 1) {
          setEscala(1);
          setPos({ x: 0, y: 0 });
        } else ampliarEm(e.clientX, e.clientY, 2.5);
        toqueAnterior.current = 0;
      } else toqueAnterior.current = agora;
    }
    if (dedos.current.size === 2) {
      const [a, b] = [...dedos.current.values()];
      ultimo.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), centro: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    }
  }
  function mover(e: React.PointerEvent) {
    const antes = dedos.current.get(e.pointerId);
    if (!antes) return;
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.current.size === 2 && ultimo.current) {
      const [a, b] = [...dedos.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const centro = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const nova = limita(escala * (dist / ultimo.current.dist));
      ampliarEm(centro.x, centro.y, nova);
      setPos((p) => ({ x: p.x + (centro.x - ultimo.current!.centro.x), y: p.y + (centro.y - ultimo.current!.centro.y) }));
      ultimo.current = { dist, centro };
    } else if (dedos.current.size === 1 && escala > 1) {
      setPos((p) => ({ x: p.x + (e.clientX - antes.x), y: p.y + (e.clientY - antes.y) }));
    }
  }
  function soltar(e: React.PointerEvent) {
    dedos.current.delete(e.pointerId);
    if (dedos.current.size < 2) ultimo.current = null;
    if (escala <= 1.02) {
      setEscala(1);
      setPos({ x: 0, y: 0 });
    }
  }

  return (
    <div className="galeria-ampliada" role="dialog" aria-modal="true" aria-label={`${alt}, ampliada`}>
      <div className="galeria-ampliada-barra">
        <span className="text-[0.875rem] font-semibold text-white/80">
          {total > 1 ? `Foto ${indice + 1} de ${total}. ` : ""}Pinça ou roda do mouse para ampliar, toque duplo para voltar.
        </span>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="galeria-ampliada-fechar">
          <Icone nome="fechar" className="h-5 w-5" peso={2} />
        </button>
      </div>
      <div
        ref={quadro}
        className="galeria-ampliada-quadro"
        onPointerDown={baixar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onWheel={(e) => {
          e.preventDefault();
          ampliarEm(e.clientX, e.clientY, limita(escala * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} draggable={false} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${escala})` }} className={escala > 1 ? "cursor-grab" : "cursor-zoom-in"} />
      </div>
      {total > 1 ? (
        <>
          <button type="button" onClick={aoAnterior} aria-label="Foto anterior" className="galeria-ampliada-seta galeria-ampliada-seta--esq">
            <Icone nome="seta" className="h-5 w-5 rotate-180" peso={2} />
          </button>
          <button type="button" onClick={aoProxima} aria-label="Próxima foto" className="galeria-ampliada-seta galeria-ampliada-seta--dir">
            <Icone nome="seta" className="h-5 w-5" peso={2} />
          </button>
        </>
      ) : null}
    </div>
  );
}
