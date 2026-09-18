import Image from "next/image";
import { Icone } from "./Icones";
import { Logo } from "./Marca";
import { site } from "@/data/site.config";
import type { Produto } from "@/lib/tipos";

/**
 * A loja, no preto: a Arena existe de verdade, em São José, com a
 * parede preta e o logo aceso, e é isso que a seção mostra. À
 * esquerda o letreiro, o que a loja é (a frase da própria bio: "seu
 * portal para o mundo premium") e as marcas que passam por ela, as
 * mesmas das artes do feed, como uma lista e não como logos, porque
 * logo de terceiro na página de uma revenda é promessa que não é dela.
 * À direita, a foto da loja com o endereço do Google e o caminho para
 * o mapa. É o único bloco de texto longo da página.
 */
const MARCAS = ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Asics", "Gucci", "Louis Vuitton", "Saint Laurent", "Dior", "Miu Miu"];

export function Loja({ linkWhats, foto }: { linkWhats: string; foto: Produto | null }) {
  /* a segunda foto da Vapor é a loja inteira: parede, logo e prateleiras */
  const capa = foto?.imagens[1] ?? foto?.imagens[0];
  return (
    <section id="loja" aria-labelledby="titulo-loja" className="escuro mt-14 scroll-mt-24 lg:mt-20">
      <div className="miolo grid gap-10 py-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16 lg:py-20">
        <div>
          <Logo altura={72} />
          <h2 id="titulo-loja" className="manchete mt-6 max-w-[14ch] text-[clamp(1.875rem,4vw,3rem)] text-branco">
            Seu portal para o mundo premium.
          </h2>
          <p className="falada mt-5 max-w-[48ch] text-[1.0625rem] text-white/80">
            A Arena Imports é uma loja de rua em São José, na Grande Florianópolis, e vive do esporte dentro e fora das quatro linhas: chuteiras de alta performance, tênis de corrida, os sneakers que ditam a moda urbana, camisas de time e bolsas de grife. Tudo importado direto da fonte, com qualidade premium e o melhor custo-benefício.
          </p>
          <p className="etiqueta mt-7">As marcas que passam pela Arena</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Marcas">
            {MARCAS.map((m) => (
              <li key={m} className="romana text-[1.0625rem] uppercase text-white/85">
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.8125rem] text-white/50">Camisas de time e mais modelos sob consulta: o que chegou nem sempre está no Instagram.</p>
          <a href={linkWhats} target="_blank" rel="noreferrer" className="btn btn--placa-fio mt-7">
            <Icone nome="whats" className="h-[1.125rem] w-[1.125rem]" />
            Falar com a Arena
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <a href={site.maps} target="_blank" rel="noreferrer" className="foto veu group block aspect-[4/3] rounded-[var(--raio)] bg-preto-2 lg:aspect-[5/4]">
            {capa ? <Image src={capa.url} alt="A loja da Arena Imports, em São José" fill sizes="(max-width: 1024px) 100vw, 44vw" placeholder={capa.blur ? "blur" : "empty"} blurDataURL={capa.blur ?? undefined} className="object-cover object-[center_40%] transition-transform duration-700 ease-out group-hover:scale-[1.03]" /> : null}
            <span className="absolute inset-x-0 bottom-0 z-[1] flex items-end justify-between gap-4 p-4 sm:p-5">
              <span className="min-w-0">
                <span className="etiqueta block">Onde fica</span>
                <span className="mt-1 block text-[1rem] font-semibold leading-tight text-branco sm:text-[1.0625rem]">{site.endereco}</span>
                <span className="mt-0.5 block text-[0.8125rem] text-white/70">Google: 4,3 de 5, com avaliações de clientes</span>
              </span>
              <span className="btn btn--raio btn--pequeno shrink-0">
                <Icone nome="pino" className="h-4 w-4" />
                Mapa
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
