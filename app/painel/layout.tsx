import type { Metadata } from "next";
import Link from "next/link";
import { acaoSair } from "@/lib/acoes";
import { sessao } from "@/lib/auth";
import { Simbolo } from "@/components/Marca";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A moldura do painel, com a cara da loja: a barra preta da vitrine
 * com o símbolo e "painel" no verde, "Peças", "Loja" e "Sair". O resto
 * da tela é a lista ou a peça. Nada de menu lateral: são duas telas, e
 * as duas cabem num polegar.
 */
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const { autenticado } = await sessao();

  return (
    <div className="papel flex min-h-screen flex-col">
      {autenticado ? (
        <header className="pn-barra escuro">
          <Link href="/painel" aria-label="Painel da Arena" className="flex items-center gap-2.5 text-branco">
            <Simbolo altura={30} />
            <span className="romana text-[1rem] uppercase leading-none">
              Arena <span className="text-raio">painel</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/painel" className="pn-nav">
              Peças
            </Link>
            <Link href="/painel/config" className="pn-nav">
              Loja
            </Link>
            <Link href="/" target="_blank" className="pn-nav hidden sm:inline">
              Ver site
            </Link>
            <form action={acaoSair}>
              <button type="submit" className="pn-nav !text-marfim-fraco">
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
