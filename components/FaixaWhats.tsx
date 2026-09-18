import { Icone } from "./Icones";

/**
 * A faixa de cinza de quadra do WhatsApp: o jeito de comprar, em três passos
 * numerados porque é uma sequência de fato, e o botão preto que fecha.
 * Nada de prazo nem de valor de envio: quem combina é a loja.
 */
const PASSOS = [
  { n: "1", texto: "Escolhe o modelo aqui na vitrine" },
  { n: "2", texto: "Manda a mensagem que o botão já monta" },
  { n: "3", texto: "A Arena confere tamanho e disponibilidade e combina o envio" },
];

export function FaixaWhats({ linkWhats }: { linkWhats: string }) {
  return (
    <section aria-labelledby="titulo-faixa" className="miolo pt-12 lg:pt-16">
      <div className="areia bloco grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,5fr)_1px_minmax(0,6fr)] lg:items-center lg:gap-12 lg:p-12">
        <div className="flex items-center gap-5">
          <Icone nome="whats" className="h-12 w-12 shrink-0 text-tinta sm:h-14 sm:w-14" />
          <div>
            <h2 id="titulo-faixa" className="manchete text-[clamp(1.5rem,3vw,2.125rem)] text-tinta">
              Escolheu? Manda no WhatsApp.
            </h2>
            <p className="mt-1 text-[0.9375rem] text-tinta-fraca">Sem cadastro, sem carrinho: quem responde é a Arena.</p>
          </div>
        </div>

        <div className="hidden h-full bg-areia-escura lg:block" aria-hidden="true" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
          <ol className="flex flex-col gap-2.5">
            {PASSOS.map((p) => (
              <li key={p.n} className="flex items-baseline gap-3 text-[0.9375rem] text-tinta">
                <span className="romana grid h-7 w-7 shrink-0 place-items-center rounded-[var(--raio-mini)] bg-preto text-[0.8125rem] text-raio">{p.n}</span>
                {p.texto}
              </li>
            ))}
          </ol>
          <a href={linkWhats} target="_blank" rel="noreferrer" className="btn btn--cta shrink-0">
            Chamar agora
          </a>
        </div>
      </div>
    </section>
  );
}
