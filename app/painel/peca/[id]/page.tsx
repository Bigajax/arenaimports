import { notFound, redirect } from "next/navigation";
import { FormPeca } from "@/components/painel/FormPeca";
import { sessao } from "@/lib/auth";
import { carregarCatalogo } from "@/lib/dados";
import { codigoPeca } from "@/lib/formato";

export const dynamic = "force-dynamic";

/* /painel/peca/nova abre a peça em branco; qualquer outro id abre a peça */
export default async function PaginaPeca({ params }: { params: Promise<{ id: string }> }) {
  const { autenticado } = await sessao();
  if (!autenticado) redirect("/painel/login");

  const { id } = await params;
  const { categorias, produtos } = await carregarCatalogo();
  const produto = id === "nova" ? null : (produtos.find((p) => p.id === id) ?? null);
  if (id !== "nova" && !produto) notFound();

  const maior = produtos.reduce((max, p) => {
    const n = Number(p.codigo.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  return <FormPeca produto={produto} categorias={categorias.filter((c) => c.ativo)} proximoCodigo={codigoPeca(maior + 1)} />;
}
