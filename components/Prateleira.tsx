import Link from "next/link";
import { CardProduto } from "./CardProduto";
import { Trilho } from "./Trilho";
import type { Categoria, Produto } from "@/lib/tipos";

/**
 * A FILEIRA DA HOME, no trilho do _molde (13/10/2026; padrão Alto Giro e
 * passo 5c do cofre): quatro peças por vez no computador, duas no celular,
 * setas redondas, andando sozinha uma peça a cada 4 s (pausa com o mouse, o
 * dedo, o foco ou o botão Pausar). O título e a linha em cima; o "Ver" da
 * porta embaixo, no meio. O cartão continua o da Arena (o selo de pronta
 * entrega e o "sob encomenda").
 */
export function Prateleira({
  id,
  titulo,
  href,
  verTudo,
  produtos,
  categorias,
  prioridade = false,
  limite = 12,
  subtitulo,
}: {
  id: string;
  titulo: string;
  href: string;
  verTudo: string;
  produtos: Produto[];
  categorias: Map<string, Categoria>;
  prioridade?: boolean;
  limite?: number;
  subtitulo?: string;
}) {
  if (!produtos.length) return null;

  return (
    <section aria-labelledby={id} className="miolo scroll-mt-24 pt-12 lg:pt-16">
      <div>
        <h2 id={id} className="secao">
          {titulo}
        </h2>
        {subtitulo ? <p className="mt-1 text-[0.9375rem] text-tinta-fraca">{subtitulo}</p> : null}
      </div>
      <Trilho rotulo={titulo}>
        {produtos.slice(0, limite).map((p, i) => (
          <li key={p.id} className="vt-trilho__peca">
            <CardProduto produto={p} categoria={categorias.get(p.categoria_slug ?? "")} prioridade={prioridade && i < 2} tamanhos="(max-width: 640px) 46vw, (max-width: 900px) 30vw, 22vw" />
          </li>
        ))}
      </Trilho>
      <p className="vt-prateleira__mais">
        <Link href={href} className="btn btn--linha vt-prateleira__botao">
          {verTudo}
        </Link>
      </p>
    </section>
  );
}
