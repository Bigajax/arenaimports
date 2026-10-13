import Image from "next/image";
import Link from "next/link";

/**
 * O BANNER DO MEIO (13/10/2026, vindo do _molde, passo 5c do cofre): largo e
 * baixo, entre as fileiras, com o texto à esquerda e o botão.
 *
 * A arte é do gerador do Rafael, SEM LETRA (o texto entra aqui, por cima):
 * a larga (3:1, 2400 x 800) e a do celular (1:1, 1080 x 1080). Enquanto a
 * arte não chega, o banner não some: vira o painel preto da Arena com o arco
 * verde-limão e a foto de uma peça de verdade da linha à direita (`peca`).
 * Quando a arte chegar, basta pôr `arte` e `celular` na home.
 */
export function BannerMeio({
  id,
  titulo,
  linha,
  botao,
  href,
  externo = false,
  arte,
  celular,
  peca,
}: {
  id: string;
  titulo: string;
  linha?: string;
  botao: string;
  href: string;
  externo?: boolean;
  arte?: string;
  celular?: string;
  peca?: { url: string; alt: string };
}) {
  const conteudo = (
    <>
      {arte ? (
        <>
          <div className={celular ? "vt-bm__arte vt-bm__arte--larga" : "vt-bm__arte"} aria-hidden="true">
            <Image src={arte} alt="" fill sizes="(min-width: 1536px) 1440px, 100vw" className="object-cover" />
          </div>
          {celular ? (
            <div className="vt-bm__arte vt-bm__arte--celular" aria-hidden="true">
              <Image src={celular} alt="" fill sizes="100vw" className="object-cover" />
            </div>
          ) : null}
        </>
      ) : peca ? (
        <div className="ar-bm__peca" aria-hidden="true">
          <span className="ar-bm__arco" />
          <span className="ar-bm__foto">
            <Image src={peca.url} alt="" fill sizes="(min-width: 900px) 30vw, 60vw" className="object-cover" />
          </span>
        </div>
      ) : null}
      <div className="vt-bm__texto">
        <h2 className="vt-bm__titulo">{titulo}</h2>
        {linha ? <p className="vt-bm__linha">{linha}</p> : null}
        <span className="vt-bm__botao">
          {botao}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 18 18 6M8 6h10v10" />
          </svg>
        </span>
      </div>
    </>
  );

  const classe = ["vt-bm", arte && celular ? "vt-bm--celular" : "", !arte && peca ? "ar-bm--provisorio" : ""].filter(Boolean).join(" ");
  return (
    <section id={id} className="miolo vt-bm-miolo scroll-mt-24" aria-label={titulo}>
      {externo ? (
        <a href={href} target="_blank" rel="noreferrer" className={classe}>
          {conteudo}
        </a>
      ) : (
        <Link href={href} className={classe}>
          {conteudo}
        </Link>
      )}
    </section>
  );
}
