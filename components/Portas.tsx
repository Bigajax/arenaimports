import Image from "next/image";
import Link from "next/link";
import { Icone, type NomeIcone } from "./Icones";
import type { Produto } from "@/lib/tipos";

export type Porta = {
  nome: string;
  href: string;
  icone: NomeIcone;
  peca?: Produto | null;
  total: number;
  linha: string;
};

/**
 * As quatro coisas que a loja vende, em quatro portas: cada uma é o
 * desenho da peça em traço grande sobre o cinza de quadra, com o nome
 * e a contagem no pé. No hover o traço dá lugar à foto da peça
 * estrelada. É a pergunta que quem entra na Arena responde primeiro:
 * campo, corrida, rua ou closet?
 */
export function Portas({ portas }: { portas: Porta[] }) {
  return (
    <section aria-labelledby="titulo-portas" className="miolo pt-12 lg:pt-16">
      <div className="regua">
        <h2 id="titulo-portas" className="secao">
          O que você veio buscar?
        </h2>
        <Link href="/catalogo" className="btn btn--texto shrink-0">
          Ver todos
        </Link>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {portas.map((p) => {
          const capa = p.peca?.imagens[0];
          return (
            <li key={p.nome}>
              <Link href={p.href} className="formato">
                {capa ? (
                  <span className="formato-foto">
                    <Image src={capa.url} alt="" fill sizes="(max-width: 1024px) 50vw, 24vw" className="object-cover" />
                  </span>
                ) : null}
                <span className="formato-traco">
                  <Icone nome={p.icone} className="h-full w-full" peso={0.9} />
                </span>
                <span className="formato-rotulo">
                  <span className="block">
                    <span className="romana block text-[1.0625rem] uppercase lg:text-[1.25rem]">{p.nome}</span>
                    <span className="block text-[0.8125rem] opacity-70">{p.linha}</span>
                  </span>
                  <span className="text-[0.8125rem] font-semibold opacity-70">
                    {p.total} {p.total === 1 ? "modelo" : "modelos"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
