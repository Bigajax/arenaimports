import { Cabecalho } from "@/components/Cabecalho";
import { EscolhasProvider } from "@/components/Escolhas";
import { PainelEscolhas } from "@/components/PainelEscolhas";
import { Rodape } from "@/components/Rodape";
import { Medidor } from "@vitrine/plataforma/estudio/componentes/Medidor";
import type { Produto as ProdutoPlataforma } from "@vitrine/plataforma/lib/tipos";
import { carregarCatalogo, obterConfig } from "@/lib/dados";
import { montarMenu } from "@/lib/menu";
import { linkGeral } from "@/lib/whatsapp";
import { site } from "@/data/site.config";
import "../escolhas.css";

export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  const [{ categorias, produtos }, config] = await Promise.all([carregarCatalogo(), obterConfig()]);
  const whats = linkGeral(config.whatsapp);
  const ativas = categorias.filter((c) => c.ativo);
  const menu = montarMenu(produtos, whats);

  /* favoritos e sacola (13/10/2026, vindos do molde): guardados no navegador
     de quem visita; a sacola vai inteira pelo WhatsApp, com o código que a
     loja cola em Pedidos, no painel */
  return (
    <EscolhasProvider produtos={produtos.filter((p) => p.ativo) as unknown as ProdutoPlataforma[]} loja={site.url} habilitados={{ favoritos: true, sacola: true }}>
      <div className="vt-site flex min-h-screen flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--raio-mini)] focus:bg-raio focus:px-4 focus:py-3 focus:text-preto"
        >
          Ir para o conteúdo
        </a>
        <Cabecalho categorias={ativas} linkWhats={whats} aviso={config.aviso_topo} menu={menu} />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape linkWhats={whats} whatsapp={config.whatsapp} instagram={config.instagram || site.instagram} categorias={ativas} />
        {/* a contagem do estúdio: visitas, peças, buscas e chamadas (08/10/2026) */}
        <Medidor />
        <PainelEscolhas whatsapp={config.whatsapp || site.whatsapp} />
      </div>
    </EscolhasProvider>
  );
}
