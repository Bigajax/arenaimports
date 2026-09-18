import { redirect } from "next/navigation";

/* a peça abre num modal por cima da lista: esta rota só encaminha */
export default async function PaginaPeca({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/painel?peca=${encodeURIComponent(id)}`);
}
