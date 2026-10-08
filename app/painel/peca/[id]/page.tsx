import { redirect } from "next/navigation";

/* O endereço antigo da peça (/painel/peca/<id> e /painel/peca/nova), do
   painel de 18/09 que a cartilha do Luiz ensina. Desde 08/10/2026 a peça
   abre no cadastro de Peças: quem chega pelo endereço velho cai lá. */
export default async function PecaAntiga({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(id === "nova" ? "/painel/pecas?nova=1" : "/painel/pecas");
}
