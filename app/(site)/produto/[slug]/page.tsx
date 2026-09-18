import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardProduto } from "@/components/CardProduto";
import { CompraProduto } from "@/components/CompraProduto";
import { GaleriaProduto } from "@/components/GaleriaProduto";
import { Regua } from "@/components/Moldura";
import { carregarCatalogo, obterConfig, obterProduto } from "@/lib/dados";
import { temDesconto } from "@/lib/filtro";
import { precoBRL } from "@/lib/formato";
import { site } from "@/data/site.config";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { produtos } = await carregarCatalogo();
  return produtos.filter((p) => p.ativo).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produto = await obterProduto(slug);
  if (!produto) return {};

  const descricao =
    produto.descricao ?? `${produto.nome}${produto.marca ? `, ${produto.marca}` : ""}. Importado, na Arena Imports Floripa.`;

  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/produto/${produto.slug}` },
    openGraph: {
      type: "website",
      title: `${produto.nome} · Arena Imports Floripa`,
      description: descricao,
      url: `/produto/${produto.slug}`,
      images: produto.imagens[0] ? [{ url: produto.imagens[0].url, alt: produto.nome }] : [],
    },
  };
}

export default async function PaginaProduto({ params }: Props) {
  const { slug } = await params;
  const [produto, { categorias, produtos }, config] = await Promise.all([
    obterProduto(slug),
    carregarCatalogo(),
    obterConfig(),
  ]);

  if (!produto) notFound();

  const categoria = categorias.find((c) => c.slug === produto.categoria_slug);
  const atendimento = false;
  const promo = temDesconto(produto);
  const cheio = precoBRL(produto.preco);
  const vigente = precoBRL(produto.preco_promocional ?? produto.preco);

  const parecidos = produtos
    .filter((p) => p.ativo && p.id !== produto.id && p.categoria_slug === produto.categoria_slug)
    .slice(0, 4);



  const preco = produto.preco_promocional ?? produto.preco;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": atendimento ? "Service" : "Product",
    name: produto.nome,
    ...(atendimento ? {} : { sku: produto.codigo }),
    ...(produto.marca ? { brand: { "@type": "Brand", name: produto.marca } } : {}),
    ...(produto.descricao ? { description: produto.descricao } : {}),
    image: produto.imagens.map((i) => `${site.url}${i.url}`),
    offers: {
      "@type": "Offer",
      url: `${site.url}/produto/${produto.slug}`,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      ...(preco ? { price: preco } : {}),
      seller: { "@type": "Store", name: "Arena Imports Floripa" },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="miolo pb-20 pt-6 lg:pt-10">
        <nav aria-label="Você está em" className="miudo mb-6">
          <Link href="/catalogo" className="hover:text-ouro-texto">
            Catálogo
          </Link>
          {categoria && !atendimento ? (
            <>
              <span className="px-2">/</span>
              <Link href={`/catalogo/${categoria.slug}`} className="hover:text-ouro-texto">
                {categoria.nome}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="cartao grid gap-8 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:p-8">
          <GaleriaProduto imagens={produto.imagens} nome={produto.nome} />

          <div className="lg:pt-2">
            {categoria ? <p className="etiqueta">{categoria.nome}</p> : null}
            <h1 className="manchete mt-2 text-[clamp(1.5rem,3vw,2.125rem)] text-tinta">{produto.nome}</h1>

            <div className="mt-5 border-b border-linha pb-5">
              {vigente ? (
                <p className="preco flex items-baseline gap-3 text-[1.75rem] text-tinta">
                  {promo && cheio ? <span className="text-[1.125rem] text-tinta-fraca line-through">{cheio}</span> : null}
                  <span>{vigente}</span>
                </p>
              ) : (
                <p className="falada text-[1.125rem] text-tinta">
                  Preço no WhatsApp.
                </p>
              )}
            </div>

            {/* a ficha: o que se sabe da peça, uma linha por coisa. O que
                não se sabe não aparece; a observação do pedido cobre o resto. */}
            {produto.descricao ? (
              <p className="mt-6 max-w-[52ch] text-[0.9375rem] leading-relaxed text-tinta">{produto.descricao}</p>
            ) : null}
            {!atendimento && (produto.marca || produto.cores.length === 1 || produto.tamanhos.length) ? (
              <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-[0.9375rem]">
                {produto.marca ? (
                  <>
                    <dt className="text-tinta-fraca">Marca</dt>
                    <dd className="text-tinta">{produto.marca}</dd>
                  </>
                ) : null}
                {produto.cores.length === 1 ? (
                  <>
                    <dt className="text-tinta-fraca">Cor</dt>
                    <dd className="text-tinta">{produto.cores[0]}</dd>
                  </>
                ) : null}
                {produto.tamanhos.length ? (
                  <>
                    <dt className="text-tinta-fraca">Tamanhos</dt>
                    <dd className="text-tinta">{produto.tamanhos.join(", ")}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}

            <div className="mt-8">
              <CompraProduto produto={produto} whatsapp={config.whatsapp} base={site.url} atendimento={atendimento} />
            </div>
          </div>
        </div>

        {parecidos.length ? (
          <section aria-labelledby="titulo-parecidos" className="mt-16 lg:mt-20">
            <Regua id="titulo-parecidos">
              {`Mais em ${categoria?.nome ?? "a loja"}`}
            </Regua>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              {parecidos.map((p) => (
                <CardProduto key={p.id} produto={p} categoria={categoria} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
