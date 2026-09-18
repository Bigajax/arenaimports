import Image from "next/image";
import { Icone } from "./Icones";
import { Logo } from "./Marca";
import type { Produto } from "@/lib/tipos";

/**
 * A Arena, no preto: a loja não tem ponto físico, vende pelo WhatsApp
 * e envia para todo o Brasil, e é isso que a seção diz. À esquerda o
 * letreiro, o que a loja é (a frase da própria bio: "seu portal para o
 * mundo premium"), como funciona (pronta entrega e sob encomenda) e as
 * marcas que passam por ela, as mesmas das artes do feed, como uma
 * lista e não como logos. À direita, a foto de bastidor do feed. É o
 * único bloco de texto longo da página.
 */
const MARCAS = ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Asics", "Gucci", "Louis Vuitton", "Saint Laurent", "Dior", "Miu Miu"];

export function Loja({ linkWhats, foto }: { linkWhats: string; foto: Produto | null }) {
  /* a segunda foto da Vapor é a de bastidor, com o logo ao fundo */
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
            A Arena Imports é de Florianópolis e vende pelo WhatsApp, para todo o Brasil: chuteiras de alta performance, tênis de corrida, os sneakers que ditam a moda urbana, camisas de time e bolsas de grife. Tudo importado direto da fonte, com qualidade premium e o melhor custo-benefício.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 text-[0.9375rem] text-white/80">
            <li className="flex items-start gap-2.5">
              <Icone nome="relampago" className="mt-0.5 h-4 w-4 shrink-0 text-raio" />
              <span>
                <b className="font-semibold text-branco">Pronta entrega:</b> o que está em mãos sai no mesmo dia.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Icone nome="aviao" className="mt-0.5 h-4 w-4 shrink-0 text-raio" />
              <span>
                <b className="font-semibold text-branco">Sob encomenda:</b> o resto do catálogo vem direto da fonte, com prazo combinado no pedido.
              </span>
            </li>
          </ul>
          <p className="etiqueta mt-7">As marcas que passam pela Arena</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Marcas">
            {MARCAS.map((m) => (
              <li key={m} className="romana text-[1.0625rem] uppercase text-white/85">
                {m}
              </li>
            ))}
          </ul>
          <a href={linkWhats} target="_blank" rel="noreferrer" className="btn btn--placa-fio mt-7">
            <Icone nome="whats" className="h-[1.125rem] w-[1.125rem]" />
            Falar com a Arena
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <span className="foto veu block aspect-[4/3] rounded-[var(--raio)] bg-preto-2 lg:aspect-[5/4]">
            {capa ? <Image src={capa.url} alt="Bastidor da Arena Imports" fill sizes="(max-width: 1024px) 100vw, 44vw" placeholder={capa.blur ? "blur" : "empty"} blurDataURL={capa.blur ?? undefined} className="object-cover object-[center_40%]" /> : null}
            <span className="absolute inset-x-0 bottom-0 z-[1] p-4 sm:p-5">
              <span className="etiqueta block">Pedido pelo WhatsApp</span>
              <span className="mt-1 block text-[1rem] font-semibold leading-tight text-branco sm:text-[1.0625rem]">Sem cadastro, sem carrinho: você manda o modelo e o tamanho, a Arena confirma e combina o envio.</span>
            </span>
          </span>
        </div>
      </div>
    </section>
  ) ;
}
