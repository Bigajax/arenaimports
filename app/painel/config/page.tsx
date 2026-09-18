import { redirect } from "next/navigation";
import { FormularioConfig } from "@/components/painel/FormularioConfig";
import { sessao } from "@/lib/auth";
import { obterConfig } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function PaginaConfig() {
  const { autenticado } = await sessao();
  if (!autenticado) redirect("/painel/login");

  const config = await obterConfig();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-10 sm:px-6">
      <h1 className="display-secao text-tinta">A loja</h1>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-tinta">
        O que muda aqui aparece no site na hora: número do WhatsApp, recados da
        tarja, frase da capa, endereço e horário.
      </p>

      <div className="mt-10">
        <FormularioConfig config={config} />
      </div>
    </div>
  );
}
