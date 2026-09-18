import Link from "next/link";
import { Icone, type NomeIcone } from "./Icones";
import { site } from "@/data/site.config";

/**
 * O que a loja cumpre de fato, numa faixa de cinza de quadra logo
 * abaixo do preto do hero: importado direto da fonte (as artes dizem
 * "importados diretamente da China, qualidade premium"), a loja física
 * em São José (o Google acha, com endereço), envio para todo o Brasil
 * (dito nas legendas) e o pedido pelo WhatsApp (é como a vitrine
 * funciona). Nada de prazo, frete grátis ou parcelamento: a loja não
 * disse.
 */
const ITENS: { icone: NomeIcone; titulo: string; texto: string; href: string; externa?: boolean }[] = [
  { icone: "aviao", titulo: "Importado direto da fonte", texto: "qualidade premium, sem intermediário", href: "/catalogo" },
  { icone: "loja", titulo: "Loja física em São José", texto: "Barreiros, Grande Florianópolis", href: site.maps, externa: true },
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
