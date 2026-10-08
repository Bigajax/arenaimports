import { PagarAqui } from "@/estudio/componentes/desempenho/PagarAqui";
import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";
import { DEGRAUS_EXIBIDOS, OFERTA_PERFORMANCE as O, linkUpgrade } from "@/estudio/lib/oferta-performance";
import { RELATORIO_BASE, TEM_PERFORMANCE, lerHoje } from "@/estudio/lib/performance";

/**
 * O PRÓXIMO PASSO DA LOJA (07/10/2026). A escada da vitrine na Início, num
 * lugar fixo: Vitrine, Performance, Vender pela vitrine, Loja online. O
 * degrau mais alto que a loja já tem leva "você está aqui"; os que faltam
 * levam o preço e o botão que abre o pagamento ali mesmo (a página do
 * estúdio embutida, como o Performance). Os degraus de cima mostram o
 * preço cheio riscado e o abatido: a vitrine paga já abate os R$ 999
 * (valores do Rafael de 25/09). Sem o central (loja sem a contagem ligada),
 * a escada não aparece: sem o id da loja não há como pagar.
 */
export async function ProximoPasso() {
  if (!TEM_PERFORMANCE) return null;
  const h = await lerHoje();
  if (!h?.loja) return null;

  const loja = h.loja;
  const upgrade = h.upgrade ?? null;
  const tem = {
    vitrine: true,
    performance: Boolean(h.liberado),
    vender: upgrade === "vender" || upgrade === "loja",
    loja: upgrade === "loja",
  };
  const atual = tem.loja ? 3 : tem.vender ? 2 : tem.performance ? 1 : 0;

  const degraus = [
    { nome: "Vitrine", verbo: "O cliente vê e chama", linha: "O seu catálogo no ar, com o pedido pelo WhatsApp.", tem: tem.vitrine },
    { nome: "Performance", verbo: "Você vê quem veio", linha: "Os números da vitrine todo mês, o relatório e os banners refeitos pelo estúdio.", tem: tem.performance, preco: O.valorTexto, sufixo: O.periodo, url: `${RELATORIO_BASE}/assinar/${loja}?plano=pix_mensal`, selo: true },
    { nome: DEGRAUS_EXIBIDOS.vender.nome, verbo: "O cliente paga na hora", linha: DEGRAUS_EXIBIDOS.vender.linha, tem: tem.vender, cheio: DEGRAUS_EXIBIDOS.vender.cheioTexto, preco: DEGRAUS_EXIBIDOS.vender.valorTexto, url: linkUpgrade(RELATORIO_BASE, loja, "vender") },
    { nome: DEGRAUS_EXIBIDOS.loja.nome, verbo: "O cliente compra sozinho", linha: DEGRAUS_EXIBIDOS.loja.linha, tem: tem.loja, cheio: DEGRAUS_EXIBIDOS.loja.cheioTexto, preco: DEGRAUS_EXIBIDOS.loja.valorTexto, mensal: DEGRAUS_EXIBIDOS.loja.mensal, url: linkUpgrade(RELATORIO_BASE, loja, "loja") },
  ];
  /* o próximo degrau: o mais baixo que a loja ainda não tem. Só ele leva o
     rosa (uma ação por tela); os de cima ficam em contorno */
  const proximo = degraus.findIndex((d) => !d.tem);

  return (
    <section className="pn-escada" aria-labelledby="pn-escada-titulo">
      <header className="pn-escada__cabeca">
        <h2 id="pn-escada-titulo">O próximo passo da sua loja</h2>
        <p>Cada degrau deixa o cliente fazer uma coisa a mais sem esperar você. A vitrine que você já pagou abate do preço.</p>
      </header>
      <ol className="pn-escada__degraus">
        {degraus.map((d, i) => (
          <li key={d.nome} className="pn-escada__degrau" data-atual={i === atual ? "true" : undefined} data-tem={d.tem ? "true" : undefined} data-proximo={i === proximo ? "true" : undefined} style={{ ["--altura" as string]: `${i}` }}>
            {i === atual ? <span className="pn-escada__aqui">Você está aqui</span> : i === proximo ? <span className="pn-escada__aqui pn-escada__aqui--proximo">Próximo degrau</span> : null}
            <span className="pn-escada__num" aria-hidden="true">{i + 1}</span>
            <span className="pn-escada__verbo">{d.verbo}</span>
            <b className="pn-escada__nome">
              {d.nome}
              {d.selo ? <SeloPerformance tamanho={16} /> : null}
            </b>
            <p className="pn-escada__linha">{d.linha}</p>
            {d.tem ? (
              <p className="pn-escada__feito">✓ {i === 0 ? "No ar" : i === 1 ? "Ativo" : "Pago"}</p>
            ) : d.url ? (
              <div className="pn-escada__oferta">
                <p className="pn-escada__preco">
                  {d.cheio ? <s>{d.cheio}</s> : null}
                  <b>{d.preco}</b>
                  {d.sufixo ? <span>{d.sufixo}</span> : null}
                </p>
                {d.mensal ? <p className="pn-escada__mensal">{d.mensal}</p> : null}
                <PagarAqui url={d.url} className={i === proximo ? "pn-escada__botao" : "pn-escada__botao pn-escada__botao--contorno"}>
                  {i === 1 ? "Ver os planos" : "Ver o upgrade"}
                </PagarAqui>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
