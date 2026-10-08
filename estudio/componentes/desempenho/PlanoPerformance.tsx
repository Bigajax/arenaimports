"use client";

import { useEffect, useRef, useState } from "react";
import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";
import { OFERTA_PERFORMANCE as O, type JeitoDePagar } from "@/estudio/lib/oferta-performance";
import { PagarAqui } from "@/estudio/componentes/desempenho/PagarAqui";

/* os três planos no modal (07/10, "aqui tem que ter todos os planos"):
   escolhe um, e o único botão rosa diz o que acontece com ele */
const JEITOS: { id: JeitoDePagar; nome: string; preco: string; diz: string; botao: string; selo?: string }[] = [
  { id: "pix_mensal", nome: "Pix, mês a mês", preco: O.valorTexto, diz: "por mês. Cada Pix vale 30 dias.", botao: `Ativar no Pix: ${O.valorTexto}` },
  { id: "cartao_mensal", nome: "Cartão, todo mês", preco: O.valorTexto, diz: "por mês. Renova sozinho.", botao: `Assinar no cartão: ${O.valorTexto} por mês` },
  { id: "cartao_anual", nome: "O ano todo", preco: O.anualTexto, diz: `Economize ${O.anualEconomiaTexto}: dá ${O.anualPorMesTexto} por mês, em até ${O.anualParcelas}x.`, botao: `Pagar o ano: ${O.anualTexto} em até ${O.anualParcelas}x`, selo: "2 meses de presente" },
];

/**
 * O PLANO, EM MODAL (07/10/2026): abre quando a loja travada toca em
 * "Conhecer o Performance", na parte desfocada ou no relatório com cadeado.
 * A ordem é a de uma oferta: a promessa (vender mais com a vitrine que já
 * tem), a prova com a contagem real da loja, o preço, e a lista do que
 * está incluído como régua de conferência (o ✓ na margem direita, o gesto
 * da casa). O valor vem de lib/oferta-performance.ts; aqui só se exibe.
 */
const INCLUI = [
  "O que repor antes que acabe: os números e as peças mais pedidos",
  "O que procuraram e você não tem, para cadastrar ou encomendar",
  "Qual post trouxe gente e qual fez chamar no WhatsApp",
  "O relatório do mês, com a leitura de Rafael Razeira",
  "Os banners refeitos todo mês, e as mudanças no site pedidas pelo painel",
  "Campanha pronta nas datas grandes: Black Friday, Natal, Dia das Mães",
];

export function PlanoPerformance({
  aberto,
  aoFechar,
  contagem,
  whatsapp,
  assinar = null,
}: {
  aberto: boolean;
  aoFechar: () => void;
  contagem: { buscas_pessoas: number; esgotados_pessoas: number } | null;
  whatsapp: string;
  /** a página /assinar/<loja> do estúdio; sem ela, o WhatsApp (07/10) */
  assinar?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [escolha, setEscolha] = useState<JeitoDePagar>("pix_mensal");
  const jeito = JEITOS.find((j) => j.id === escolha)!;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  /* a prova: a contagem real desta loja, que o central manda mesmo travada */
  const prova =
    contagem && contagem.buscas_pessoas >= 2
      ? `${contagem.buscas_pessoas.toLocaleString("pt-BR")} pessoas procuraram na sua vitrine algo que você não tem. Isso é venda que passou.`
      : contagem && contagem.esgotados_pessoas >= 2
        ? `${contagem.esgotados_pessoas.toLocaleString("pt-BR")} pessoas tocaram num número que já tinha acabado. Isso é venda que passou.`
        : "A sua vitrine já conta quem entra, o que procura e o que falta.";

  return (
    <dialog
      ref={ref}
      className="pn-dialogo dz-plano"
      aria-labelledby="dz-plano-titulo"
      onClose={aoFechar}
    >
      {/* o x no canto (07/10, no lugar do "Agora não"): method=dialog fecha sem JS */}
      <form method="dialog" className="dz-plano__topo">
        <button type="submit" className="dz-plano__fechar" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </form>
      <p className="pn-dialogo__rotulo dz-plano__rotulo">
        <SeloPerformance tamanho={16} /> Performance
      </p>
      <h2 id="dz-plano-titulo">Venda mais com a vitrine que você já tem.</h2>
      <p className="dz-plano__prova">
        <b>{prova}</b> Todo mês, o estúdio lê os seus números e ajusta a
        vitrine. Você só repõe e posta.
      </p>

      {assinar ? (
        <div className="dz-plano__jeitos3" role="radiogroup" aria-label="Escolha o plano">
          {JEITOS.map((j) => (
            <button key={j.id} type="button" role="radio" aria-checked={j.id === escolha} className="dz-plano__jeito" onClick={() => setEscolha(j.id)}>
              {j.selo ? <span className="dz-plano__jeito-selo">{j.selo}</span> : null}
              <span className="dz-plano__jeito-nome">{j.nome}</span>
              {j.id === "cartao_anual" ? <s className="dz-plano__jeito-cheio">{O.anualCheioTexto}</s> : null}
              <b>{j.preco}</b>
              <span className="dz-plano__jeito-diz">{j.diz}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="dz-plano__oferta">
          <p className="dz-plano__valor">
            <b>{O.valorTexto}</b>
            <span>{O.periodo}</span>
          </p>
          <p className="dz-plano__condicoes">{O.condicoes.join(" · ")}</p>
          <p className="dz-plano__teste">{O.teste}</p>
          <p className="dz-plano__anual">
            Ou o ano todo por <b>{O.anualTexto}</b>, em até {O.anualParcelas}x no cartão: dois meses de presente.
          </p>
        </div>
      )}
      {/* sem os planos, o quadro preto já diz isso: não repetir (07/10) */}
      {assinar ? (<p className="dz-plano__rodape">{O.condicoes.join(", ").replace(/^./, (c) => c.toUpperCase())}. {O.teste}</p>) : null}

      <ul className="dz-plano__lista" aria-label="O que está incluído">
        {INCLUI.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {assinar ? (
        /* os três jeitos de pagar (07/10): o Pix em rosa, o cartão ao lado */
        <div className="pn-dialogo__acoes dz-plano__acoes">
          <PagarAqui assinar={assinar} plano={escolha} className="dz-botao">
            {jeito.botao}
          </PagarAqui>
        </div>
      ) : (
        <form method="dialog" className="pn-dialogo__acoes dz-plano__acoes">
          <a
            className="dz-botao"
            href={`${whatsapp.split("?")[0]}?text=${encodeURIComponent(O.mensagem)}`}
            target="_blank"
            rel="noreferrer"
          >
            Quero o Performance
          </a>
        </form>
      )}
    </dialog>
  );
}
