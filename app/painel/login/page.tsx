import { redirect } from "next/navigation";
import { Moldura } from "@/components/Moldura";
import { FormularioLogin } from "@/components/painel/FormularioLogin";
import { sessao } from "@/lib/auth";
import { MODO } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function PaginaLogin() {
  const { autenticado } = await sessao();
  if (autenticado) redirect("/painel");

  return (
    <div className="papel flex min-h-screen items-center justify-center px-4 py-16">
      <div className="tem-moldura w-full max-w-sm bg-off-white p-9" data-ativa="true">
        <p className="placa text-center text-[1.125rem] text-tinta">arena</p>
        <p className="mono-rotulo mt-6 text-center text-marrom-fundo">
          Painel da loja
        </p>

        <div className="mt-8">
          <FormularioLogin pedeEmail={MODO === "supabase"} />
        </div>
        <Moldura legenda="Entrar" aresta="topo" />
      </div>
    </div>
  );
}
