import { redirect } from "next/navigation";
import { Logo } from "@/components/Marca";
import { FormularioLogin } from "@/components/painel/FormularioLogin";
import { sessao } from "@/lib/auth";
import { MODO } from "@/lib/dados";

export const dynamic = "force-dynamic";

/**
 * A porta do painel, com a cara da Arena: a página no preto da marca, o
 * cartão com a tampa preta (a logo inteira, com o Floripa, e o fio
 * verde) e o formulário embaixo, como a peça abre no painel.
 */
export default async function PaginaLogin() {
  const { autenticado } = await sessao();
  if (autenticado) redirect("/painel");

  return (
    <div className="escuro flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm overflow-hidden rounded-[var(--raio)] bg-off-white text-tinta shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <div className="pn-modal-cab flex-col !items-center !gap-3 !px-8 !pb-7 !pt-8">
          <Logo altura={96} prioridade />
          <p className="etiqueta text-raio">Painel da loja</p>
        </div>

        <div className="p-8">
          <FormularioLogin pedeEmail={MODO === "supabase"} />
          <p className="mono-rotulo mt-6 text-center text-marrom-fundo">Só quem cuida da Arena entra aqui.</p>
        </div>
      </div>
    </div>
  );
}
