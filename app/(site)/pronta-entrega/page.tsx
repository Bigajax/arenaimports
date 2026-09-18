import type { Metadata } from "next";
import { Catalogo } from "@/components/Catalogo";
import { carregarCatalogo, obterConfig } from "@/lib/dados";
import { linkGeral } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Pronta entrega",
  description: "O que a Arena Imports Floripa tem em mãos agora: sai no mesmo dia, sem esperar importação. Pedido pelo WhatsApp.",
  alternates: { canonical: "/pronta-entrega" },
};

/**
 * A aba que a loja pediu: só o que está em mãos. É o mesmo catálogo com
 * o filtro travado em pronta_entrega, e a mensagem do topo diz o que
 * isso significa para quem compra: sai hoje. O resto do catálogo é
 * importado sob encomenda, e a página diz isso também, para ninguém
 * chegar no WhatsApp achando que tudo está no estoque.
 */
export default async function PaginaProntaEntrega({ searchParams }: { searchParams: Promise<{ busca?: string }> }) {
  const [{ categorias, produtos }, config, sp] = await Promise.all([carregarCatalogo(), obterConfig(), searchParams]);
  const pecas = produtos.filter((p) => p.ativo && p.pronta_entrega).sort((a, b) => a.ordem - b.ordem);
  const categoriasDaLoja = categorias.filter((c) => c.ativo && pecas.some((p) => p.categoria_slug === c.slug));

  return (
    <>
      <header className="miolo pb-6 pt-8 lg:pb-8 lg:pt-12">
        <p className="etiqueta">Arena Imports Floripa</p>
        <h1 className="manchete mt-2 text-[clamp(1.75rem,4vw,2.5rem)] text-tinta">Pronta entrega</h1>
        <p className="falada mt-2 max-w-[52ch] text-[1.0625rem] text-tinta-fraca">
          {pecas.length ? `${pecas.length} ${pecas.length === 1 ? "modelo em mãos" : "modelos em mãos"}: sai no mesmo dia, sem esperar importação.` : "Nada em mãos neste momento."} O resto do catálogo é importado sob encomenda, com prazo combinado no WhatsApp.
        </p>
      </header>
      <Catalogo produtos={pecas} categorias={categoriasDaLoja} escopoFechado buscaInicial={sp.busca ?? ""} linkWhats={linkGeral(config.whatsapp)} />
    </>
  );
}
