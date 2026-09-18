import type { Metadata } from "next";
import { Catalogo } from "@/components/Catalogo";
import { carregarCatalogo, obterConfig } from "@/lib/dados";
import { linkGeral } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Tudo que está na Arena Imports Floripa: chuteiras, tênis de corrida, sneakers e bolsas de grife importados. Pedido pelo WhatsApp.",
  alternates: { canonical: "/catalogo" },
};

export default async function PaginaCatalogo({ searchParams }: { searchParams: Promise<{ busca?: string }> }) {
  const [{ categorias, produtos }, config, sp] = await Promise.all([carregarCatalogo(), obterConfig(), searchParams]);

  const pecas = produtos.filter((p) => p.ativo);
  const categoriasDaLoja = categorias.filter((c) => c.ativo);

  return (
    <>
      <header className="miolo pb-6 pt-8 lg:pb-8 lg:pt-12">
        <p className="etiqueta">Arena Imports Floripa</p>
        <h1 className="manchete mt-2 text-[clamp(1.75rem,4vw,2.5rem)] text-tinta">Todos os modelos</h1>
        <p className="falada mt-2 max-w-[48ch] text-[1.0625rem] text-tinta-fraca">
          {pecas.length} modelos importados, do campo à rua. Toca num para montar o pedido e mandar pelo WhatsApp.
        </p>
      </header>
      <Catalogo produtos={pecas} categorias={categoriasDaLoja} buscaInicial={sp.busca ?? ""} linkWhats={linkGeral(config.whatsapp)} />
    </>
  );
}
