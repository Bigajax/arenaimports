import { FaixaWhats } from "@/components/FaixaWhats";
import { Garantias } from "@/components/Garantias";
import { Hero } from "@/components/Hero";
import { Loja } from "@/components/Loja";
import { Portas } from "@/components/Portas";
import { Prateleira } from "@/components/Prateleira";
import { Vitrines } from "@/components/Vitrines";
import { carregarCatalogo, obterConfig } from "@/lib/dados";
import { CATEGORIAS } from "@/lib/menu";
import { linkGeral } from "@/lib/whatsapp";
import { configPadrao, site } from "@/data/site.config";

/**
 * A home: o hero preto com a prateleira iluminada, a faixa de quadra
 * com o que a loja cumpre, as quatro portas (chuteiras, corrida,
 * sneakers, bolsas), tudo que chegou, as duas vitrines (para correr e
 * para o campo), as prateleiras por porta, a loja e a faixa do
 * WhatsApp. Tudo montado do catálogo.
 */
export default async function Home() {
  const [{ categorias, produtos, hero }, config] = await Promise.all([carregarCatalogo(), obterConfig()]);

  const whats = linkGeral(config.whatsapp);
  const ativos = produtos.filter((p) => p.ativo);
  const ativas = categorias.filter((c) => c.ativo);
  const porSlug = new Map(ativas.map((c) => [c.slug, c]));
  const da = (slug: string) => ativos.filter((p) => p.categoria_slug === slug).sort((a, b) => a.ordem - b.ordem);

  const destaques = hero
    .map((h) => ativos.find((p) => p.slug === h.slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 12);
  const estrelaDe = (slug: string) => destaques.find((p) => p.categoria_slug === slug) ?? da(slug)[0] ?? null;
  const peca = (slug: string) => ativos.find((p) => p.slug === slug) ?? null;

  /* só as portas com pelo menos duas peças viram prateleira; e cada
     prateleira mostra primeiro o que NÃO está na prateleira do hero */
  const noHero = destaques.slice(0, 6);
  const inedito = (lista: typeof ativos) => [...lista.filter((p) => !noHero.includes(p)), ...lista.filter((p) => noHero.includes(p))];
  const prateleiras = CATEGORIAS.map((f) => ({ ...f, produtos: inedito(da(f.slug)) })).filter((f) => f.produtos.length > 1);
  const totalCategorias = CATEGORIAS.filter((f) => da(f.slug).length > 0).length;

  return (
    <>
      <Hero frase={config.frase_hero || configPadrao.frase_hero} estrelas={destaques} linkWhats={whats} totais={{ produtos: ativos.length, categorias: totalCategorias }} />

      <Garantias linkWhats={whats} />

      <Portas portas={CATEGORIAS.filter((f) => da(f.slug).length > 0).map((f) => ({ nome: f.nome, href: `/catalogo/${f.slug}`, icone: f.icone, peca: estrelaDe(f.slug), total: da(f.slug).length, linha: f.pergunta }))} />

      <Prateleira id="pronta-entrega" titulo="Pronta entrega" subtitulo="Em mãos agora: sai no mesmo dia, sem esperar importação." href="/pronta-entrega" verTudo="Ver a pronta entrega" produtos={ativos.filter((p) => p.pronta_entrega)} categorias={porSlug} prioridade limite={4} nomeDaPorta="modelos" />

      <Prateleira id="destaques" titulo="Chegou na Arena" subtitulo="O catálogo inteiro, do campo à rua: pronta entrega e sob encomenda." href="/catalogo" verTudo="Ver o catálogo" produtos={inedito(ativos)} categorias={porSlug} prioridade={!ativos.some((p) => p.pronta_entrega)} limite={4} nomeDaPorta="modelos" />

      <Vitrines
        vitrines={[
          { titulo: "Para o próximo pace", texto: "Adizero Adios Pro, Evo SL e FuelCell: leveza e propulsão para treino e prova.", href: "/catalogo/tenis-de-corrida", peca: peca("adidas-adizero-adios-pro-4") ?? estrelaDe("tenis-de-corrida"), acao: "Ver a corrida" },
          { titulo: "Para entrar em campo", texto: "Mercurial, Phantom e F50, para campo e society, com a velocidade que se vê.", href: "/catalogo/chuteiras", peca: peca("nike-mercurial-vapor-society-branco-e-azul") ?? estrelaDe("chuteiras"), acao: "Ver as chuteiras" },
        ].filter((v): v is typeof v & { peca: NonNullable<typeof v.peca> } => Boolean(v.peca))}
      />

      {prateleiras.map((f) => (
        <Prateleira key={f.slug} id={`prateleira-${f.slug}`} titulo={f.nome} subtitulo={f.linha[0].toUpperCase() + f.linha.slice(1) + "."} href={`/catalogo/${f.slug}`} verTudo={`Ver ${f.produtos.length === 1 ? "o modelo" : `os ${f.produtos.length}`}`} produtos={f.produtos} categorias={porSlug} nomeDaPorta={f.nome.toLowerCase() === "corrida" ? "tênis de corrida" : f.nome.toLowerCase()} feminino={f.slug === "chuteiras" || f.slug === "bolsas"} />
      ))}

      <Loja linkWhats={whats} foto={peca("nike-mercurial-vapor-society-branco-e-azul") ?? peca("new-balance-9060-na-loja")} />

      <FaixaWhats linkWhats={whats} />

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
