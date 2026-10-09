import { redirect } from "next/navigation";
import { ListaProdutos } from "@/components/painel/ListaProdutos";
import { sessao } from "@/lib/auth";
import { carregarCatalogoDoPainel } from "@/lib/dados";

export const dynamic = "force-dynamic";

/* ?nova=1 abre direto o cadastro (a tarefa do Início);
   ?filtro=sem-preco mostra só as peças no site sem preço;
   ?busca=<texto> chega com a busca preenchida (o "Repor" da aba Desempenho) */
export default async function PaginaPecas({ searchParams }: { searchParams: Promise<{ nova?: string; filtro?: string; busca?: string }> }) {
  const { autenticado } = await sessao();
  if (!autenticado) redirect("/painel/login");

  const [{ categorias, produtos }, sp] = await Promise.all([carregarCatalogoDoPainel(), searchParams]);

  return (
    <ListaProdutos
      produtosIniciais={[...produtos].sort((a, b) => a.ordem - b.ordem)}
      categorias={categorias}
      abrirNova={sp.nova === "1"}
      soSemPreco={sp.filtro === "sem-preco"}
      buscaInicial={sp.busca ?? ""}
    />
  );
}
