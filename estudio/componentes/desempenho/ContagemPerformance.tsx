import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";
import { OFERTA_PERFORMANCE as O } from "@/estudio/lib/oferta-performance";
import { PagarAqui } from "@/estudio/componentes/desempenho/PagarAqui";
import { Dispensavel } from "@/estudio/componentes/desempenho/Dispensavel";

/**
 * A CONTAGEM DO PERFORMANCE (07/10/2026): "Pix mês a mês com contagem e
 * aviso de reativação". Uma faixa no alto da aba Desempenho, em quatro
 * estados:
 *  - em dia (mais de 7 dias): uma linha quieta, "faltam 23 dias";
 *  - perto do fim (7 dias ou menos, sem cartão mensal): a faixa de
 *    renovação, com o Pix em rosa e a saída "assine no cartão e esqueça";
 *  - acabou: a faixa de reativação, "os números continuaram contando";
 *  - cartão mensal ativo: "renova sozinho", sem contagem.
 * Quem nunca teve o plano não vê nada daqui: para essa loja o convite é a
 * parte desfocada e o modal do plano. Para sempre, também nada.
 */
const DIA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });

export function ContagemPerformance({
  liberadoAte,
  paraSempre,
  renovaSozinho,
  assinar,
}: {
  liberadoAte: string | null;
  paraSempre: boolean;
  renovaSozinho: boolean;
  /** /assinar/<loja> no estúdio; sem ele (central antigo), vale o WhatsApp */
  assinar: string | null;
}) {
  if (paraSempre || !liberadoAte) return null;
  const ate = new Date(liberadoAte);
  const dias = Math.ceil((ate.getTime() - Date.now()) / 86_400_000);
  const data = DIA.format(ate);

  if (renovaSozinho) {
    return (
      <div className="dz-conta dz-conta--preta">
        <p className="dz-conta__ativo">
          <SeloPerformance tamanho={16} /> Performance ativo
        </p>
        <p className="dz-conta__quando">No cartão: renova sozinho todo mês.</p>
      </div>
    );
  }

  if (dias > 7) {
    return (
      /* a faixa preta (07/10, "seria interessante uma faixa preta"): o
         status em verde vivo, a data e os dias, o botão rosa, e a linha fina
         embaixo que encolhe conforme o mês passa (cheia = 30 dias ou mais) */
      <div className="dz-conta dz-conta--preta">
        <p className="dz-conta__ativo">
          <SeloPerformance tamanho={16} /> Performance ativo
        </p>
        <p className="dz-conta__quando">
          Até {data}: <b>{dias === 1 ? "falta 1 dia" : `faltam ${dias} dias`}</b>
        </p>
        {assinar ? (
          <PagarAqui assinar={assinar} plano="pix_mensal" className="dz-conta__somar">
            Somar mais 30 dias
          </PagarAqui>
        ) : null}
        <span className="dz-conta__barra" aria-hidden="true" style={{ width: `${Math.min(100, Math.round((dias / 30) * 100))}%` }} />
      </div>
    );
  }

  const acabou = dias <= 0;
  return (
    <Dispensavel chave={`perf_${acabou ? "acabou" : "fim"}_${liberadoAte}`}>
    <section className={acabou ? "dz-conta dz-conta--acabou" : "dz-conta dz-conta--fim"} aria-label={acabou ? "Reativar o Performance" : "Renovar o Performance"}>
      <div className="dz-conta__texto">
        <p className="dz-conta__rotulo">
          <SeloPerformance tamanho={16} /> {acabou ? "Performance pausado" : dias === 1 ? "Último dia" : `Faltam ${dias} dias`}
        </p>
        <h2>{acabou ? `Acabou em ${data}. Reative e tudo volta na hora.` : `O seu Performance vai até ${data}.`}</h2>
        <p>
          {acabou
            ? "A contagem não parou: o que repor, o que procuraram e qual post trouxe gente estão guardados, esperando."
            : `Renove pelo Pix e os 30 dias somam ao que falta. ${O.valorTexto} ${O.periodo}, sem fidelidade.`}
        </p>
      </div>
      <div className="dz-conta__acoes">
        {/* só pagar (07/10, "coloca para pagar ao invés de falar comigo"): sem
            o id da loja (central antes do SQL de 07/10) não há link, e o botão some */}
        {/* as três opções como plaquinhas de mesmo peso (07/10, "precisamos
            melhorar isto"): cada uma diz o jeito e o preço, e abre o pagamento
            ali mesmo. O Pix é a principal, em rosa. */}
        {assinar ? (
          <div className="dz-conta__opcoes">
            <PagarAqui assinar={assinar} plano="pix_mensal" className="dz-conta__opcao dz-conta__opcao--pix">
              <span className="dz-conta__opcao-nome">{acabou ? "Reativar no Pix" : "Renovar no Pix"}</span>
              <b>{O.valorTexto}</b>
              <span className="dz-conta__opcao-diz">30 dias, na hora</span>
            </PagarAqui>
            <PagarAqui assinar={assinar} plano="cartao_mensal" className="dz-conta__opcao">
              <span className="dz-conta__opcao-nome">Cartão, todo mês</span>
              <b>{O.valorTexto}</b>
              <span className="dz-conta__opcao-diz">renova sozinho</span>
            </PagarAqui>
            <PagarAqui assinar={assinar} plano="cartao_anual" className="dz-conta__opcao">
              <span className="dz-conta__opcao-selo">economize {O.anualEconomiaTexto}</span>
              <span className="dz-conta__opcao-nome">O ano todo</span>
              <b>
                {O.anualTexto} <s>{O.anualCheioTexto}</s>
              </b>
              <span className="dz-conta__opcao-diz">em até {O.anualParcelas}x no cartão</span>
            </PagarAqui>
          </div>
        ) : null}
      </div>
    </section>
    </Dispensavel>
  );
}
