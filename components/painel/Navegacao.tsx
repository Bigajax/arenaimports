"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";

/* O manual mora DENTRO do painel (29/09/2026, desde a Full Time): é onde
   a dúvida aparece, e ele lê os números da loja na hora, então não
   envelhece. Antes ele morava só no site do estúdio, em /entrega. */
/* (Arena) o manual dela é a cartilha de entrega no site do estúdio, que
   descreve o painel antigo: até ser refeita, a Ajuda leva para lá */
export const MANUAL = "https://rafaelrazeira.com.br/entrega/arena-imports.html";

/**
 * As seis portas do painel. No computador, abas no topo; no celular,
 * uma barra presa embaixo, onde o polegar alcança. A aba aberta ganha o
 * traço preto embaixo. "Site" é onde se trocam os textos e as fotos da
 * vitrine (lib/conteudo.ts). "Desempenho" (06/10) é a contagem: quem
 * entrou, o que olhou, quem chamou.
 */
/* os nomes de 07/10/2026 ("esses nomes não estão fazendo sentido"): "Site"
   virou "Textos do site", porque Banners e Peças também são o site; "Loja"
   virou "WhatsApp e Instagram", porque o painel inteiro é da loja e dentro
   só há os dois contatos. A barra do celular usa o `curto`. O `rotulo` é o
   nome do grupo, em mono, em cima da primeira porta dele no menu aberto. */
/* (Arena, 08/10/2026) o painel do molde com as portas que o site da Arena
   lê: sem Banners e Textos (os dela estão no código) nem Clientes. "Loja" é
   o WhatsApp, o Instagram e as frases da loja. */
export const ABAS = [
  { href: "/painel", nome: "Início", curto: "Início", icone: "casa", grupo: 1, rotulo: null },
  { href: "/painel/pecas", nome: "Peças", curto: "Peças", icone: "etiqueta", grupo: 2, rotulo: "Vitrine" },
  { href: "/painel/desempenho", nome: "Desempenho", curto: "Desempenho", icone: "grafico", grupo: 3, rotulo: null },
  { href: "/painel/config", nome: "A loja", curto: "Loja", icone: "loja", grupo: 4, rotulo: "Contato" },
] as const;

export type NomeIconePainel =
  | (typeof ABAS)[number]["icone"]
  /* os ícones das telas do molde que a Arena não tem seguem no conjunto */
  | "imagem"
  | "texto"
  | "pessoas"
  | "mais"
  | "preco"
  | "seta"
  | "ajuda"
  | "externo"
  | "sair"
  | "tres"
  | "lapis";

/**
 * OS ÍCONES DO PAINEL (refeitos em 06/10/2026, pedido do Rafael: "refazer
 * todos os ícones, mais minimalista"). Um conjunto só: grade de 24, traço
 * de 1,6, pontas e cantos arredondados, nenhum preenchimento. Desenho
 * vetorial de propósito, e não imagem: a 18px um PNG borra, não muda de
 * cor no item ativo e cada um sai com uma espessura.
 */
export function IconePainel({
  nome,
  className = "",
}: {
  nome: NomeIconePainel;
  className?: string;
}) {
  const comum = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (nome) {
    case "casa":
      return (
        <svg {...comum}>
          <path d="M4 10.2 12 4l8 6.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "etiqueta":
      return (
        <svg {...comum}>
          <path d="M3.5 12.4V4.5a1 1 0 0 1 1-1h7.9a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-7.9 7.9a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.3-.7z" />
          <circle cx="8.2" cy="8.2" r="1.4" />
        </svg>
      );
    case "imagem":
      return (
        <svg {...comum}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <circle cx="9" cy="9.5" r="1.5" />
          <path d="m20.5 15-4.3-4.3a1 1 0 0 0-1.4 0L6 19.5" />
        </svg>
      );
    case "texto":
      return (
        <svg {...comum}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 8.5h17" />
          <path d="M7.5 12.5h6M7.5 15.5h9" />
        </svg>
      );
    case "grafico":
      return (
        <svg {...comum}>
          <path d="M4 4v14.5a1.5 1.5 0 0 0 1.5 1.5H20" />
          <path d="m7.5 15 3.6-4.2 3 2.6L19.5 7" />
        </svg>
      );
    case "pessoas":
      return (
        <svg {...comum}>
          <circle cx="9" cy="8.5" r="3.2" />
          <path d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
          <path d="M15.5 5.6a3 3 0 0 1 0 5.8" />
          <path d="M17.5 14.6c1.8.6 3 2.4 3 4.9" />
        </svg>
      );
    case "loja":
      return (
        <svg {...comum}>
          <path d="M4.5 10.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8.5" />
          <path d="M3.5 9.2 5 4.8a1 1 0 0 1 1-.8h12a1 1 0 0 1 1 .8l1.5 4.4a2.6 2.6 0 0 1-4.3 2.3 2.6 2.6 0 0 1-4.2.1 2.6 2.6 0 0 1-4.2-.1A2.6 2.6 0 0 1 3.5 9.2z" />
          <path d="M10 20v-4a2 2 0 0 1 4 0v4" />
        </svg>
      );
    case "ajuda":
      return (
        <svg {...comum}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.6a2.4 2.4 0 1 1 3.4 2.2c-.6.3-1 .8-1 1.5v.4" />
          <path d="M12 16.8h.01" />
        </svg>
      );
    case "externo":
      return (
        <svg {...comum}>
          <path d="M13.5 4.5h6v6" />
          <path d="m19.5 4.5-8 8" />
          <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
        </svg>
      );
    case "sair":
      return (
        <svg {...comum}>
          <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
          <path d="m15.5 8 4 4-4 4" />
          <path d="M19.5 12H9.5" />
        </svg>
      );
    case "mais":
      return (
        <svg {...comum}>
          <path d="M12 5.5v13M5.5 12h13" />
        </svg>
      );
    case "preco":
      return (
        <svg {...comum}>
          <path d="M12 3.5v17" />
          <path d="M16 7.5c-.7-1.1-2.2-1.8-4-1.8-2.3 0-4 1.2-4 2.9 0 3.9 8 2.1 8 6 0 1.7-1.8 2.9-4 2.9-1.9 0-3.4-.7-4.1-1.9" />
        </svg>
      );
    case "tres":
      return (
        <svg {...comum}>
          <circle cx="5.5" cy="12" r="1.3" />
          <circle cx="12" cy="12" r="1.3" />
          <circle cx="18.5" cy="12" r="1.3" />
        </svg>
      );
    case "lapis":
      return (
        <svg {...comum}>
          <path d="M14.5 5.5 18.5 9.5" />
          <path d="M4.5 19.5 5.3 15.6 15.8 5.1a1.9 1.9 0 0 1 2.7 0l.4.4a1.9 1.9 0 0 1 0 2.7L8.4 18.7z" />
        </svg>
      );
    case "seta":
      return (
        <svg {...comum}>
          <path d="m9.5 6 6 6-6 6" />
        </svg>
      );
  }
}

const aberta = (caminho: string, href: string) =>
  href === "/painel" ? caminho === "/painel" : caminho.startsWith(href);

/**
 * O MENU LATERAL do computador (06/10/2026, pedido do Rafael: "essa parte
 * tem que ser do lado esquerdo", e depois o trilho do Supabase). As seis
 * portas em grupos (a Início; o que se edita na vitrine: Peças, Banners,
 * Site; o que se lê: Desempenho; a Loja), separados por um fio. Fechado,
 * só os ícones; aberto, os nomes. A aberta ganha o fundo gelo e o traço na
 * cor da loja. No celular ele some e a BarraCelular assume.
 */
export function MenuLateral() {
  const caminho = usePathname();
  return (
    <nav aria-label="Painel" className="pn-menu">
      {ABAS.map((a, i) => (
        <span key={a.href} className="contents">
          {i > 0 && ABAS[i - 1].grupo !== a.grupo ? (
            <span className="pn-menu__sep" aria-hidden="true" />
          ) : null}
          {a.rotulo ? (
            <span className="pn-menu__grupo" aria-hidden="true">
              {a.rotulo}
            </span>
          ) : null}
          <Link
            href={a.href}
            className="pn-menu__item"
            aria-current={aberta(caminho, a.href) ? "page" : undefined}
            title={a.nome}
          >
            <IconePainel nome={a.icone} />
            <span className="pn-menu__nome">
              {a.nome}
              {/* o raio do Performance ao lado de Desempenho: a marca do plano
                  aparece onde ele mora (07/10, "dê personalidade") */}
              {a.href === "/painel/desempenho" ? <SeloPerformance tamanho={18} /> : null}
            </span>
          </Link>
        </span>
      ))}
    </nav>
  );
}

/* A barra do celular (09/10/2026): 4 abas + "Mais". Eram 7 em 360px, cada
   uma com 51px, e "Desempenho" não cabia. No mesmo dia o Rafael pediu o
   Desempenho "em destaque, com a flecha para cima": ele vai no CENTRO, com
   o selo do Performance, e Textos, Banners e Contato abrem no "Mais". */
const NA_BARRA: string[] = ["/painel", "/painel/pecas", "/painel/desempenho", "/painel/config"];
const DESTAQUE = "/painel/desempenho";

export function BarraCelular({ sair }: { sair: () => Promise<void> }) {
  const caminho = usePathname();
  const [mais, setMais] = useState(false);
  const naBarra = ABAS.filter((a) => NA_BARRA.includes(a.href)).sort((a, b) => NA_BARRA.indexOf(a.href) - NA_BARRA.indexOf(b.href));
  const noMais = ABAS.filter((a) => !NA_BARRA.includes(a.href));
  const maisAtivo = noMais.some((a) => aberta(caminho, a.href)) || caminho.startsWith(MANUAL);

  /* trocou de página: a folha fecha */
  useEffect(() => setMais(false), [caminho]);
  useEffect(() => {
    if (!mais) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setMais(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [mais]);

  return (
    <>
      <nav aria-label="Painel" className="pn-barra">
        {naBarra.map((a) =>
          a.href === DESTAQUE ? (
            <Link key={a.href} href={a.href} className="pn-barra__destaque" aria-current={aberta(caminho, a.href) ? "page" : undefined}>
              <span className="pn-barra__selo">
                <SeloPerformance tamanho={30} rotulo="" />
              </span>
              {a.curto}
            </Link>
          ) : (
            <Link key={a.href} href={a.href} aria-current={aberta(caminho, a.href) ? "page" : undefined}>
              <IconePainel nome={a.icone} />
              {a.curto}
            </Link>
          ),
        )}
        <button type="button" aria-expanded={mais} aria-controls="pn-folha-mais" aria-current={maisAtivo ? "page" : undefined} onClick={() => setMais((v) => !v)}>
          <IconePainel nome="tres" />
          Mais
        </button>
      </nav>

      {mais ? (
        <div className="pn-folha" onClick={() => setMais(false)}>
          <div id="pn-folha-mais" role="dialog" aria-modal="true" aria-label="Mais do painel" className="pn-folha__corpo" onClick={(e) => e.stopPropagation()}>
            <span className="pn-folha__alca" aria-hidden="true" />
            <ul>
              {noMais.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} aria-current={aberta(caminho, a.href) ? "page" : undefined}>
                    <IconePainel nome={a.icone} />
                    <span>{a.nome}</span>
                    {a.href === "/painel/desempenho" ? <SeloPerformance tamanho={16} /> : null}
                  </Link>
                </li>
              ))}
              <li className="pn-folha__fio" aria-hidden="true" />
              <li>
                <Link href={MANUAL} target="_blank">
                  <IconePainel nome="ajuda" />
                  <span>Ajuda: como usar a loja</span>
                </Link>
              </li>
              <li>
                <Link href="/" target="_blank">
                  <IconePainel nome="externo" />
                  <span>Ver meu site</span>
                </Link>
              </li>
              <li>
                <form action={sair}>
                  <button type="submit">
                    <IconePainel nome="sair" />
                    <span>Sair do painel</span>
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
