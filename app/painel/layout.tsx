import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { MarcaDono } from "@/estudio/componentes/MarcaDono";
import {
  BarraCelular,
  IconePainel,
  MANUAL,
  MenuLateral,
} from "@/components/painel/Navegacao";
import { acaoSair } from "@/lib/acoes";
import { sessao } from "@/lib/auth";
import { site } from "@/data/site.config";
import "./painel.css";
/* a camada do celular (09/10/2026), por último: vence as camadas de cima */
import "./celular.css";
/* o que é só da Arena: o Yupoo no cadastro e o filtro de em mãos */
import "./arena.css";

/* as três letras da casa (docs/design-estudio.md do estúdio), só dentro do
   painel: Archivo condensada nos títulos e números, Inter no corpo, mono
   nos rótulos. A vitrine segue com as letras da loja. */
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--pn-archivo" });
const inter = Inter({ subsets: ["latin"], variable: "--pn-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--pn-mono" });

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * (Arena, 08/10/2026) o layout do painel do molde, no lugar do painel
 * antigo da Arena (o de 18/09, preto com o símbolo). Pedido do Rafael:
 * "atualiza o painel como no molde". As telas que ficam dela são o login
 * e a Loja; as Peças são as do molde, com Em mãos e o Yupoo.
 *
 * O PAINEL: no computador, um trilho de ícones fixo à esquerda que abre
 * com os nomes quando o mouse passa (a marca, as seis portas em grupos,
 * e embaixo Ajuda, Ver meu site e Sair), e o conteúdo ao lado; no celular,
 * um cabeçalho curto em cima e a barra de abas presa embaixo, onde o
 * polegar alcança. O menu à esquerda é de 06/10/2026, pedido do Rafael.
 */
export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { autenticado } = await sessao();

  return (
    <div className={`pn ${archivo.variable} ${inter.variable} ${mono.variable} ${autenticado ? "pn--logado" : ""}`}>
      {autenticado ? (
        <aside className="pn-lateral">
          <div className="pn-lateral__painel">
            {/* o quadrado leva a marca RR do estúdio (07/10/2026, pedido do
                Rafael): o painel é o produto do estúdio, e a loja aparece pelo
                nome ao lado. O arquivo é public/marca/rr.webp, cortado do
                monograma; nunca recriar a logo em texto. */}
            <Link
              href="/painel"
              className="pn-lateral__marca"
              title="Painel da Arena"
            >
              <span className="pn-lateral__inicial" aria-hidden="true">
                <Image src="/marca/rr.webp" alt="" width={36} height={36} priority />
              </span>
              <span className="pn-lateral__nome">
                <b>Arena Imports</b>
                <small>Painel da loja</small>
              </span>
            </Link>
            <MenuLateral />
            <div className="pn-lateral__fim">
              <Link href={MANUAL} target="_blank" className="pn-menu__item" title="Ajuda">
                <IconePainel nome="ajuda" />
                <span className="pn-menu__nome">Ajuda</span>
              </Link>
              <Link
                href="/"
                target="_blank"
                className="pn-menu__item"
                title="Ver meu site"
              >
                <IconePainel nome="externo" />
                <span className="pn-menu__nome">Ver meu site</span>
              </Link>
              <form action={acaoSair}>
                <button type="submit" className="pn-menu__item" title="Sair">
                  <IconePainel nome="sair" />
                  <span className="pn-menu__nome">Sair</span>
                </button>
              </form>
            </div>
          </div>
        </aside>
      ) : null}

      <div className="pn-conteudo">
        {/* o cabeçalho do celular saiu (09/10/2026, pedido do Rafael: "retirar
            isso e colocar apenas no de baixo"): Ajuda, Ver meu site e Sair
            moram no "Mais" da barra */}

        <main>{children}</main>
      </div>

      {autenticado ? <BarraCelular sair={acaoSair} /> : null}
      {/* quem entra no painel é o dono: as visitas dele não contam na aba Desempenho */}
      {autenticado ? <MarcaDono /> : null}
      <span className="sr-only">{site.nome}</span>
    </div>
  );
}
