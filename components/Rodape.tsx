import Link from "next/link";
import { Logo, MarcaEstudio } from "./Marca";
import { Icone } from "./Icones";
import { PREVIA, site } from "@/data/site.config";
import type { Categoria } from "@/lib/tipos";

/**
 * O rodapé preto em colunas: a loja, as categorias, o atendimento e o
 * Instagram. No celular cada coluna vira uma sanfona (details, sem
 * JS). A faixa de baixo leva o ©, o aviso de prévia e a assinatura do
 * estúdio.
 */
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
      <details className="rodape-sanfona border-t border-white/10 sm:hidden">
        <summary className="romana flex cursor-pointer list-none items-center justify-between py-4 text-[1rem] text-branco [&::-webkit-details-marker]:hidden">
          {titulo}
          <Icone nome="seta" className="rodape-seta h-4 w-4 text-marfim-fraco" />
        </summary>
        <div className="pb-5">{children}</div>
      </details>
      <div className="hidden sm:block">
        <h2 className="romana text-[1rem] text-branco">{titulo}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </>
  );
}

export function Rodape({ linkWhats, instagram, categorias = [] }: { linkWhats: string; instagram: string; categorias?: Categoria[]; horario?: string; creditos?: number }) {
  return (
    <footer className="escuro mt-16 lg:mt-20">
      <div className="miolo grid gap-0 border-t border-white/10 py-10 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-8 lg:py-16">
        <div className="pb-8 sm:pb-0">
          <Link href="/" aria-label="Arena Imports Floripa, página inicial" className="inline-flex text-branco">
            <Logo altura={64} />
          </Link>
          <p className="mt-4 max-w-[32ch] text-[0.9375rem] text-marfim-fraco">{site.posicionamento}. De Florianópolis para todo o Brasil, pronta entrega e sob encomenda.</p>
          <a href={linkWhats} target="_blank" rel="noreferrer" className="btn btn--raio btn--pequeno mt-5">
            <Icone nome="whats" className="h-[1.125rem] w-[1.125rem]" />
            Pedir no WhatsApp
          </a>
        </div>

        <Bloco titulo="Catálogo">
          <ul className="flex flex-col gap-2 text-[0.9375rem]">
            <li>
              <Link href="/catalogo" className="font-semibold text-branco hover:text-raio">
                Todos
              </Link>
            </li>
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo/${c.slug}`} className="text-marfim-fraco hover:text-branco">
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </Bloco>

        <Bloco titulo="Atendimento">
          <ul className="flex flex-col gap-2 text-[0.9375rem]">
            <li>
              <a href={linkWhats} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-branco hover:text-raio">
                <Icone nome="whats" className="h-4 w-4 text-raio" />
                Pedido pelo WhatsApp
              </a>
            </li>
            <li className="text-marfim-fraco">Enviamos para todo o Brasil; o envio se combina no pedido.</li>
            <li className="text-marfim-fraco">Tamanho e disponibilidade confirmados na hora, pelo WhatsApp.</li>
          </ul>
        </Bloco>

        <Bloco titulo="A Arena">
          <ul className="flex flex-col gap-2 text-[0.9375rem]">
            <li>
              <Link href="/pronta-entrega" className="inline-flex items-center gap-2 text-branco hover:text-raio">
                <Icone nome="relampago" className="h-4 w-4" />
                Pronta entrega
              </Link>
            </li>
            {instagram ? (
              <li>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-branco hover:text-raio">
                  <Icone nome="instagram" className="h-4 w-4" />@{instagram}
                </a>
              </li>
            ) : null}
          </ul>
        </Bloco>
      </div>

      <div className="border-t border-white/10 bg-preto-2">
        <div className="miolo flex flex-col items-center gap-4 py-5 text-center lg:flex-row lg:justify-between lg:text-left">
          <p className="max-w-[70ch] text-[0.8125rem] text-marfim-fraco">
            © {new Date().getFullYear()} Arena Imports Floripa. {PREVIA ? "Prévia da vitrine, ainda não é a loja: as fotos são do Instagram da loja." : ""}
          </p>
          <a href="https://rafaelrazeira.com.br/landing-page" target="_blank" rel="noreferrer" aria-label="Vitrine feita por Rafael Razeira Estúdio" className="flex shrink-0 items-center gap-3 text-marfim-fraco transition-colors hover:text-branco">
            <span className="text-[0.75rem]">vitrine por</span>
            <MarcaEstudio altura={36} />
          </a>
        </div>
      </div>
    </footer>
  );
}
