import Link from "next/link";
import { MarcaEstudio } from "./Marca";
import { Icone } from "./Icones";
import { PREVIA, site } from "@/data/site.config";
import type { Categoria } from "@/lib/tipos";

/**
 * O RODAPÉ DO MOLDE (13/10/2026, o Rafael: "acrescenta o footer do molde"),
 * com os dados da Arena: colunas de Contato, Catálogo, A loja e o selo de
 * site seguro, e a faixa de baixo com o Instagram, a linha legal e a
 * assinatura do estúdio. Sem "Formas de pagamento" e sem CNPJ: a Arena não
 * publicou nenhum dos dois, e o rodapé não inventa. O CSS é o .rdp do
 * molde, em app/molde-home.css.
 */

function telefone(numero: string): string {
  const d = numero.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}

function Coluna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rdp-coluna">
      <h2 className="rdp-titulo">{titulo}</h2>
      {children}
    </div>
  );
}

function SeloGoogle() {
  const host = new URL(site.url).host;
  return (
    <a href={`https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(host)}`} target="_blank" rel="noreferrer" className="rdp-selo" aria-label="Site seguro: conferir no relatório de navegação segura do Google">
      <span className="rdp-selo__google" aria-hidden="true">
        <span style={{ color: "#4285F4" }}>G</span>
        <span style={{ color: "#EA4335" }}>o</span>
        <span style={{ color: "#FBBC05" }}>o</span>
        <span style={{ color: "#4285F4" }}>g</span>
        <span style={{ color: "#34A853" }}>l</span>
        <span style={{ color: "#EA4335" }}>e</span>
      </span>
      <span className="rdp-selo__linha">Site seguro</span>
      <svg viewBox="0 0 40 46" className="rdp-selo__escudo" aria-hidden="true">
        <path d="M20 2 4 8v12c0 11 7 19.5 16 24 9-4.5 16-13 16-24V8L20 2z" fill="#1E8E3E" />
        <path d="M20 2v42c9-4.5 16-13 16-24V8L20 2z" fill="#188038" />
        <path d="m12 23 6 6 11-12" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

export function Rodape({ linkWhats, whatsapp = site.whatsapp, instagram, categorias = [] }: { linkWhats: string; whatsapp?: string; instagram: string; categorias?: Categoria[] }) {
  const insta = instagram.replace(/^@/, "").trim();
  const ano = new Date().getFullYear();

  return (
    <footer className="rdp mt-16 lg:mt-20">
      <div className="miolo rdp-colunas">
        <Coluna titulo="Contato">
          <ul className="rdp-lista">
            <li>
              <a href={linkWhats} target="_blank" rel="noreferrer" className="rdp-contato">
                <Icone nome="whats" className="h-[1.125rem] w-[1.125rem]" />
                {whatsapp ? telefone(whatsapp) : "WhatsApp"}
              </a>
            </li>
            {insta ? (
              <li>
                <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" className="rdp-contato">
                  <Icone nome="instagram" className="h-[1.125rem] w-[1.125rem]" />@{insta}
                </a>
              </li>
            ) : null}
            <li className="rdp-nota">Florianópolis, com envio para todo o Brasil.</li>
          </ul>
        </Coluna>

        <Coluna titulo="Catálogo">
          <ul className="rdp-lista">
            <li>
              <Link href="/catalogo">Todas as peças</Link>
            </li>
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo/${c.slug}`}>{c.nome}</Link>
              </li>
            ))}
          </ul>
        </Coluna>

        <Coluna titulo="A loja">
          <ul className="rdp-lista">
            <li>
              <a href={linkWhats} target="_blank" rel="noreferrer">
                Atendimento
              </a>
            </li>
            <li>
              <Link href="/pronta-entrega">Pronta entrega</Link>
            </li>
            <li className="rdp-nota">Pedido pelo WhatsApp, sem cadastro. Tamanho e prazo confirmados na conversa.</li>
          </ul>
        </Coluna>

        <Coluna titulo="Selos de segurança">
          <SeloGoogle />
        </Coluna>
      </div>

      <div className="rdp-base">
        <div className="miolo rdp-base__miolo">
          {insta ? (
            <div className="rdp-redes">
              <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" aria-label={`Instagram da ${site.nome}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="12" fill="currentColor" />
                  <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" fill="none" stroke="var(--branco)" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="2.6" fill="none" stroke="var(--branco)" strokeWidth="1.6" />
                  <circle cx="15.3" cy="8.7" r="0.85" fill="var(--branco)" />
                </svg>
              </a>
            </div>
          ) : null}
          <p className="rdp-legal">
            {site.nome} © {ano} Direitos reservados
            {PREVIA ? <span className="block">Prévia da vitrine, ainda não é a loja no ar.</span> : null}
          </p>
          <a href="https://rafaelrazeira.com.br/vitrine-digital" target="_blank" rel="noreferrer" aria-label="Vitrine feita por Rafael Razeira Estúdio" className="rdp-estudio">
            <span>vitrine por</span>
            <MarcaEstudio altura={30} />
          </a>
        </div>
      </div>
    </footer>
  );
}
