import type { Metadata } from "next";
import Link from "next/link";
import { acaoSair } from "@/lib/acoes";
import { sessao } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A moldura do painel, feita para o celular: uma barra fina no topo com
 * a marca, "Peças", "Loja" e "Sair", e o resto da tela para a lista ou
 * para a peça. Nada de menu lateral: são duas telas, e as duas cabem
 * num polegar.
 */
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const { autenticado } = await sessao();

  return (
    <div className="papel flex min-h-screen flex-col">
      {autenticado ? (
        <header className="pn-barra">
          <Link href="/painel" aria-label="Painel da Arena" className="romana text-[1rem] uppercase text-tinta">
            Arena <span className="text-raio-texto">painel</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/painel" className="pn-nav">
              Peças
            </Link>
            <Link href="/painel/config" className="pn-nav">
              Loja
            </Link>
            <Link href="/" className="pn-nav hidden sm:inline">
              Ver site
            </Link>
            <form action={acaoSair}>
              <button type="submit" className="pn-nav text-tinta-fraca">
                Sair
              </button>
            </form>
          </nav>
        </header>
      ) : null}

      <main className="flex-1">{children}</main>
    </div>
  );
}
