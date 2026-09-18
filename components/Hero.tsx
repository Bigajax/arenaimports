import Image from "next/image";
import Link from "next/link";
import { Icone } from "./Icones";
import { Simbolo } from "./Marca";
import type { Produto } from "@/lib/tipos";

/**
 * A abertura, no preto da loja: à esquerda o símbolo, a manchete
 * inclinada em caixa alta ("Seu jogo começa pelo que você calça.", a
 * frase do painel), a linha de apoio com o que a loja cumpre e os dois
 * botões (verde para as peças, contorno para o WhatsApp). À direita, a
 * prateleira iluminada: os seis modelos estrelados numa grade preta,
 * cada um no seu nicho, com o refletor acendendo no hover. O arco do
 * logo, desenhado em CSS, fica atrás da prateleira, aberto embaixo
 * como na placa. No celular a prateleira vem depois do texto, em três
 * colunas, com os nomes já visíveis.
 */
export function Hero({ frase, estrelas, linkWhats, totais }: { frase: string; estrelas: Produto[]; linkWhats: string; totais: { produtos: number; categorias: number } }) {
  const nichos = estrelas.slice(0, 6);

  return (
    <section aria-labelledby="titulo-hero" className="escuro relative overflow-hidden">
      <div className="miolo relative grid gap-10 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:py-20">
        <div>
          <Simbolo altura={44} prioridade />
          <h1 id="titulo-hero" className="manchete mt-6 max-w-[12ch] text-[clamp(2.375rem,8.5vw,3.5rem)] text-branco lg:text-[clamp(3rem,5vw,4.75rem)]">
            {frase}
          </h1>
          <p className="falada mt-6 max-w-[44ch] text-[1.0625rem] text-white/80 lg:text-[1.125rem]">
            Importados premium direto da fonte, de Florianópolis para todo o Brasil: {totais.produtos} modelos entre chuteiras, tênis de corrida, sneakers e bolsas de grife, em pronta entrega ou sob encomenda. Você escolhe aqui, pede pelo WhatsApp e a Arena confere tamanho e disponibilidade.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/pronta-entrega" className="btn btn--raio">
              <Icone nome="relampago" className="h-[1.125rem] w-[1.125rem]" />
              Pronta entrega
            </Link>
            <a href={linkWhats} target="_blank" rel="noreferrer" className="btn btn--placa-fio">
              <Icone nome="whats" className="h-[1.125rem] w-[1.125rem]" />
              Pedir no WhatsApp
            </a>
          </div>
        </div>

        {nichos.length ? (
          <div className="relative">
            <span aria-hidden="true" className="arco -top-[7%] left-1/2 hidden w-[112%] -translate-x-1/2 opacity-60 lg:block" />
            <ul className="caixa relative" aria-label="Modelos em destaque">
              {nichos.map((p, i) => {
                const capa = p.imagens[0];
                return (
                  <li key={p.id}>
                    <Link href={`/produto/${p.slug}`} className="nicho">
                      {capa ? (
                        <Image src={capa.url} alt={p.nome} fill priority={i < 3} sizes="(max-width: 1024px) 33vw, 18vw" placeholder={capa.blur ? "blur" : "empty"} blurDataURL={capa.blur ?? undefined} className="object-cover" />
                      ) : null}
                      <span className="nicho-nome">{p.nome}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-center justify-between gap-3 text-[0.8125rem] text-white/60">
              <span>A prateleira da Arena: o que mais sai da loja.</span>
              <Link href="/#destaques" className="inline-flex items-center gap-1 font-semibold text-branco hover:text-raio">
                Ver tudo que chegou
                <Icone nome="seta" className="h-4 w-4" peso={2} />
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
