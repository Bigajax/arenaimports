import { redirect } from "next/navigation";
import { PainelPecas } from "@/components/painel/PainelPecas";
import { sessao } from "@/lib/auth";
import { carregarCatalogo } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function PaginaPainel() {
  const { autenticado } = await sessao();
  if (!autenticado) redirect("/painel/login");

  const { categorias, produtos } = await carregarCatalogo();

  return <PainelPecas produtosIniciais={[...produtos].sort((a, b) => a.ordem - b.ordem)} categorias={categorias.filter((c) => c.ativo)} />;
}
