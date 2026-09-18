import Image from "next/image";
import Link from "next/link";
import { Icone } from "./Icones";
import { precoBRL } from "@/lib/formato";
import { temDesconto } from "@/lib/filtro";
import { linkPeca } from "@/lib/whatsapp";
import type { Categoria, Produto } from "@/lib/tipos";

/**
 * O cartão de modelo: foto quadrada, a etiqueta preta com o preço no
 * canto quando há preço, a categoria em linha miúda, o nome em duas
 * linhas, a cor e a marca, e o botão "Pedir" preso no pé, com a
 * mensagem já montada. Sem preço, o cartão diz a cor e a marca: é a
 * loja que passa o valor na conversa. O botão diz só "Pedir" no
 * celular, porque "Pedir no WhatsApp" em caixa alta não cabe em meio
 * cartão de 390px.
 */
export function CardProduto({
  produto,
  categoria,
  prioridade = false,
  tamanhos = "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw",
}: {
  produto: Produto;
  categoria?: Categoria | null;
  prioridade?: boolean;
  tamanhos?: string;
}) {
  const capa = produto.imagens[0];
  const promo = temDesconto(produto);
  const cheio = precoBRL(produto.preco);
  const vigenteNumero = produto.preco_promocional ?? produto.preco;
  const vigente = precoBRL(vigenteNumero);
  const href = `/produto/${produto.slug}`;
  const pedir = linkPeca(produto, { preco: vigenteNumero ?? null });

  return (
    <article className="cartao group flex h-full flex-col">
      <Link href={href} className="foto block aspect-square rounded-b-none" aria-label={produto.nome}>
        {produto.pronta_entrega ? <span className="pronta absolute right-3 top-3 z-[1]">Pronta entrega</span> : null}
        {vigente ? (
          <span className="placa-etiqueta absolute left-3 top-3 z-[1] !flex items-baseline gap-2">
            <span className="preco text-[0.9375rem]">{vigente}</span>
            {promo && cheio ? <span className="text-[0.75rem] font-normal line-through opacity-70">{cheio}</span> : null}
          </span>
        ) : null}
        {capa ? (
          <Image src={capa.url} alt={capa.alt ?? produto.nome} fill sizes={tamanhos} placeholder={capa.blur ? "blur" : "empty"} blurDataURL={capa.blur ?? undefined} priority={prioridade} className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <p className="etiqueta min-h-[1em] text-tinta-fraca">{categoria?.nome ?? ""}</p>
        <h3 className="titulo-cartao mt-1 line-clamp-2 text-tinta">
          <Link href={href} className="hover:underline hover:decoration-raio-escuro hover:underline-offset-4">
            {produto.nome}
          </Link>
        </h3>
        <p className="mt-1 min-h-[1.25rem] truncate text-[0.8125rem] text-tinta-fraca">{[produto.cores[0], produto.pronta_entrega ? "em mãos, sai hoje" : "sob encomenda"].filter(Boolean).join(" · ")}</p>

        <div className="mt-auto pt-3">
          <a href={pedir} target="_blank" rel="noreferrer" className="btn btn--cta btn--pequeno w-full">
            <Icone nome="whats" className="h-[1.125rem] w-[1.125rem]" />
            Pedir<span className="hidden sm:inline">&nbsp;no WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}
