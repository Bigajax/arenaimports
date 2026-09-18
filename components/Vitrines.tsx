import Image from "next/image";
import Link from "next/link";
import type { Produto } from "@/lib/tipos";

export type Vitrine = {
  titulo: string;
  texto: string;
  href: string;
  peca: Produto;
  acao?: string;
};

/**
 * Duas vitrines grandes lado a lado, como os banners de campanha das
 * lojas: a foto ocupa o cartão, e embaixo dela uma faixa preta leva o
 * título em romana, a linha de apoio e a placa de fio. A faixa é preta
 * de verdade, não véu: as fotos da loja têm fundo claro e texto por
 * cima delas não lê.
 */
export function Vitrines({ vitrines }: { vitrines: Vitrine[] }) {
  if (!vitrines.length) return null;
  return (
    <section aria-label="Destaques" className="miolo pt-14 lg:pt-20">
      <ul className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {vitrines.map((v) => {
          const capa = v.peca.imagens[0];
          return (
            <li key={v.titulo}>
              <Link href={v.href} className="bloco group block">
                <span className="foto block aspect-[16/10] rounded-b-none">
                  {capa ? (
                    <Image
                      src={capa.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 36rem"
                      placeholder={capa.blur ? "blur" : "empty"}
                      blurDataURL={capa.blur ?? undefined}
                      className="object-cover object-[center_35%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}
                </span>
                <span className="escuro flex items-center justify-between gap-4 p-5 sm:p-6">
                  <span className="min-w-0">
                    <span className="manchete block text-[clamp(1.125rem,2vw,1.5rem)] text-marfim">{v.titulo}</span>
                    <span className="mt-1 block text-[0.875rem] text-marfim-fraco">{v.texto}</span>
                  </span>
                  <span className="btn btn--placa btn--placa-fio shrink-0">{v.acao ?? "Conferir"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
