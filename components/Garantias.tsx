import Link from "next/link";
import { Icone, type NomeIcone } from "./Icones";

/**
 * O que a loja cumpre de fato, numa faixa de cinza de quadra logo
 * abaixo do preto do hero: pronta entrega (a aba que a loja pediu),
 * importado direto da fonte (as artes dizem "importados diretamente da
 * China, qualidade premium"), envio para todo o Brasil (dito nas
 * legendas) e o pedido pelo WhatsApp (é como a vitrine funciona). Sem
 * loja física: a Arena vende pelo WhatsApp e envia.
 */
const ITENS: { icone: NomeIcone; titulo: string; texto: string; href: string; externa?: boolean }[] = [
  { icone: "relampago", titulo: "Pronta entrega", texto: "o que está em mãos sai no mesmo dia", href: "/pronta-entrega" },
  { icone: "aviao", titulo: "Sob encomenda direto da fonte", texto: "qualidade premium, prazo combinado", href: "/catalogo" },
  { icone: "pacote", titulo: "Envio para todo o Brasil", texto: "você combina o envio no pedido", href: "", externa: true },
  { icone: "conversa", titulo: "Pedido pelo WhatsApp", texto: "sem cadastro, sem carrinho", href: "", externa: true },
];

export function Garantias({ linkWhats }: { linkWhats: string }) {
  return (
    <section aria-label="Como a Arena funciona" className="areia">
      <ul className="miolo garantias">
        {ITENS.map((i) => {
          const href = i.href || linkWhats;
          const conteudo = (
            <>
              <span className="garantia-icone">
                <Icone nome={i.icone} className="h-6 w-6" peso={1.5} />
              </span>
              <span className="min-w-0">
                <span className="garantia-titulo">{i.titulo}</span>
                <span className="block text-[0.8125rem] leading-snug text-tinta-fraca">{i.texto}</span>
              </span>
            </>
          );
          return (
            <li key={i.titulo}>
              {i.externa ? (
                <a href={href} target="_blank" rel="noreferrer" className="garantia">
                  {conteudo}
                </a>
              ) : (
                <Link href={href} className="garantia">
                  {conteudo}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
