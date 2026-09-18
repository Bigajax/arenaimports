"use client";

import { useState } from "react";
import Image from "next/image";
import type { Imagem } from "@/lib/tipos";

export function GaleriaProduto({ imagens, nome }: { imagens: Imagem[]; nome: string }) {
  const [atual, setAtual] = useState(0);
  const foto = imagens[atual];

  if (!foto) return <div className="foto aspect-[4/5] w-full" />;

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
                className={`foto block h-20 w-16 lg:h-24 lg:w-20 ${i === atual ? "outline outline-1 outline-offset-2 outline-tinta" : ""}`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`foto w-full ${foto.largura && foto.altura && foto.largura >= foto.altura ? "aspect-square" : "aspect-[4/5]"}`}>
        <Image
          key={foto.url}
          src={foto.url}
          alt={foto.alt ?? nome}
          fill
          sizes="(max-width: 1024px) 100vw, 46vw"
          placeholder={foto.blur ? "blur" : "empty"}
          blurDataURL={foto.blur ?? undefined}
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
