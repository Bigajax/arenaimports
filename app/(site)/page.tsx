import { Fragment } from "react";
import { BannerMeio } from "@/components/BannerMeio";
import { Campanha } from "@/components/Campanha";
import { FaixaMarcas } from "@/components/FaixaMarcas";
import { Garantias } from "@/components/Garantias";
import { Hero } from "@/components/Hero";
import { Loja } from "@/components/Loja";
import { Portas } from "@/components/Portas";
import { Prateleira } from "@/components/Prateleira";
import { carregarBanners } from "@vitrine/plataforma/lib/dados";
import { carregarCatalogo, obterConfig } from "@/lib/dados";
import { categoriasDoGrupo } from "@/lib/grupos";
import { CATEGORIAS } from "@/lib/menu";
import { linkGeral } from "@/lib/whatsapp";
import { configPadrao, site } from "@/data/site.config";

/* as marcas da faixa "Escolha pela marca": só as que têm a logo OFICIAL em
   public/marcas (a Chanel ainda não tem, e marca sem logo não entra), na
   ordem de quantas peças a loja tem de cada uma */
const MARCAS = [
  { nome: "Nike", logo: "/marcas/nike.svg" },
  { nome: "Adidas", logo: "/marcas/adidas.svg" },
  { nome: "Louis Vuitton", logo: "/marcas/louisvuitton.svg" },
  { nome: "Jordan", logo: "/marcas/jordan.svg" },
  { nome: "Vans", logo: "/marcas/vans.svg" },
  { nome: "New Balance", logo: "/marcas/newbalance.svg" },
  { nome: "Puma", logo: "/marcas/puma.svg" },
  { nome: "Gucci", logo: "/marcas/gucci.svg" },
  { nome: "Mizuno", logo: "/marcas/mizuno.svg" },
];

/**
 * A HOME, no desenho de e-commerce do _molde (13/10/2026; o Rafael: "melhorar
 * a vitrine da arena imports com o molde"), na cara da Arena:
 * - a campanha de 3 banners no topo (aba Banners do painel); sem banner no
 *   ar, o hero preto com a prateleira iluminada, que era o topo até aqui;
 * - a faixa do que a loja cumpre e "Escolha pela marca", com as logos;
 * - as portas e UMA FILEIRA POR PORTA, no trilho, da maior linha para a
 *   menor (chuteiras primeiro), com a pronta entrega na frente;
 * - o banner da linha (as bolsas de grife) depois da primeira fileira e o
 *   da entrega no fim (os do meio; o do cupom espera o percentual do Luiz);
 * - a loja.
 * O "Chegou na Arena", as duas vitrines duplas e a faixa do como pedir
 * saíram, como no molde (o como pedir mora no WhatsApp de cada peça).
 */
export default async function Home() {
  const [{ categorias, produtos, hero }, config, banners] = await Promise.all([carregarCatalogo(), obterConfig(), carregarBanners()]);
  const campanha = banners.filter((b) => b.ativo);

  const whats = linkGeral(config.whatsapp);
  const ativos = produtos.filter((p) => p.ativo).sort((a, b) => a.ordem - b.ordem);
  const ativas = categorias.filter((c) => c.ativo);
  const porSlug = new Map(ativas.map((c) => [c.slug, c]));
  const slugsDe = (slug: string) => categoriasDoGrupo(slug) ?? [slug];
  const da = (slug: string) => ativos.filter((p) => slugsDe(slug).includes(p.categoria_slug ?? "")).sort((a, b) => a.ordem - b.ordem);

  const destaques = hero
    .map((h) => ativos.find((p) => p.slug === h.slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 12);
  const estrelaDe = (slug: string) => destaques.find((p) => slugsDe(slug).includes(p.categoria_slug ?? "")) ?? da(slug)[0] ?? null;
  const peca = (slug: string) => ativos.find((p) => p.slug === slug) ?? null;

  /* só as portas com pelo menos duas peças viram prateleira; e cada
     prateleira mostra primeiro o que NÃO está na prateleira do hero */
  const noHero = destaques.slice(0, 6);
  const inedito = (lista: typeof ativos) => [...lista.filter((p) => !noHero.includes(p)), ...lista.filter((p) => noHero.includes(p))];
  const prateleiras = CATEGORIAS.map((f) => ({ ...f, produtos: inedito(da(f.slug)) })).filter((f) => f.produtos.length > 1)
    .sort((a, b) => b.produtos.length - a.produtos.length);
  const totalCategorias = CATEGORIAS.filter((f) => da(f.slug).length > 0).length;

  const pronta = ativos.filter((p) => p.pronta_entrega);
  const capa = (p: (typeof ativos)[number] | null) => (p?.imagens[0] ? { url: p.imagens[0].url, alt: p.nome } : undefined);
  const bolsas = da("bolsas");
  const bannerLinha = bolsas.length ? (
    <BannerMeio
      key="banner-linha"
      id="banner-linha"
      titulo="Bolsas de grife, direto da fonte."
      linha={`Louis Vuitton, Chanel e Gucci: ${bolsas.length} modelos para escolher e pedir pelo WhatsApp.`}
      botao="Ver as bolsas"
      href="/catalogo/bolsas"
      peca={capa(estrelaDe("bolsas"))}
    />
  ) : null;

  return (
    <>
      {campanha.length ? (
        <Campanha slides={campanha} nome={site.nome} />
      ) : (
        <Hero frase={config.frase_hero || configPadrao.frase_hero} estrelas={destaques} linkWhats={whats} totais={{ produtos: ativos.length, categorias: totalCategorias }} />
      )}

      <Garantias linkWhats={whats} />

      <FaixaMarcas titulo="Escolha pela marca" marcas={MARCAS} />

      <Portas portas={CATEGORIAS.filter((f) => da(f.slug).length > 0).map((f) => ({ nome: f.nome, href: `/catalogo/${f.slug}`, icone: f.icone, peca: estrelaDe(f.slug), total: da(f.slug).length, linha: f.pergunta }))} />

      <Prateleira id="pronta-entrega" titulo="Pronta entrega" subtitulo="Em mãos agora: sai no mesmo dia, sem esperar importação." href="/pronta-entrega" verTudo="Ver a pronta entrega" produtos={pronta} categorias={porSlug} prioridade />

      {prateleiras.map((f, i) => (
        <Fragment key={f.slug}>
          <Prateleira id={`prateleira-${f.slug}`} titulo={f.nome} subtitulo={f.linha[0].toUpperCase() + f.linha.slice(1) + "."} href={`/catalogo/${f.slug}`} verTudo={`Ver ${f.produtos.length === 1 ? "o modelo" : `os ${f.produtos.length}`}`} produtos={f.produtos} categorias={porSlug} prioridade={!pronta.length && i === 0} />
          {i === 0 && f.slug !== "bolsas" ? bannerLinha : null}
        </Fragment>
      ))}

      <BannerMeio
        id="banner-entrega"
        titulo="Para todo o Brasil."
        linha="O que está em mãos sai de Floripa no mesmo dia, e o resto chega da fonte com prazo combinado. O envio você combina no pedido."
        botao="Combinar meu envio"
        href={whats}
        externo
        peca={capa(pronta[0] ?? null)}
      />

      <Loja linkWhats={whats} foto={peca("nike-mercurial-vapor-society-branco-e-azul") ?? peca("new-balance-9060-na-loja")} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            name: "Arena Imports Floripa",
            url: site.url,
            areaServed: "BR",
            sameAs: [`https://instagram.com/${site.instagram}`],
          }),
        }}
      />
    </>
  );
}
