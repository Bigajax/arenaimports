import type { Metadata } from "next";
import Link from "next/link";
import { acaoSair } from "@/lib/acoes";
import { sessao } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { autenticado } = await sessao();

  return (
    <div className="papel flex min-h-screen flex-col">
      {autenticado ? (
        <header className="sticky top-0 z-40 border-b border-cimento-medio bg-cimento-claro/95">
          <div className="mx-auto flex h-16 max-w-[76rem] items-center gap-4 px-4 sm:px-6">
            <Link href="/painel" aria-label="Painel da Arena" className="placa text-[0.9375rem] text-tinta">
              arena
            </Link>
            <span className="mono-rotulo hidden text-marrom-fundo sm:inline">
              Painel
            </span>

            <nav className="ml-auto flex items-center gap-5">
              <Link href="/painel" className="mono-rotulo text-tinta hover:text-marrom-fundo">
                Peças
              </Link>
              <Link
                href="/painel/config"
                className="mono-rotulo text-tinta hover:text-marrom-fundo"
              >
                Loja
              </Link>
              <Link
                href="/"
                className="mono-rotulo hidden text-tinta hover:text-marrom-fundo md:inline"
              >
                Ver site
              </Link>
              <form action={acaoSair}>
                <button type="submit" className="mono-rotulo text-marrom-fundo">
                  Sair
                </button>
              </form>
            </nav>
          </div>
        </header>
      ) : null}

      <main className="flex-1">{children}</main>
    </div>
  );
}
