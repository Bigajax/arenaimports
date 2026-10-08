"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { desenhar, type DadosDesempenho } from "@/estudio/componentes/desempenho/desenho";
import { acaoApagarLink, acaoCriarLink } from "@/estudio/rotas/desempenho/acoes";
import type { Nota } from "@/estudio/lib/atencao";
import type { Par } from "@/estudio/lib/desempenho";
import { DOMINIO_ESCRITO, codigoCurto } from "@/estudio/lib/link-curto";

const escrito = (url: string) =>
  url.replace("https://", "").replace("http://", "");
const br = (v: number) => v.toLocaleString("pt-BR");

/* o WhatsApp do estúdio vem de lib/oferta-performance.ts, com a oferta */

import { SeloPerformance } from "@/estudio/componentes/SeloPerformance";
import { PlanoPerformance } from "@/estudio/componentes/desempenho/PlanoPerformance";
import { PagarAqui } from "@/estudio/componentes/desempenho/PagarAqui";
import { CONHECER_PERFORMANCE as WHATSAPP_ESTUDIO, OFERTA_PERFORMANCE } from "@/estudio/lib/oferta-performance";

export type LinkPost = { id: string; nome: string; url: string };
/** um post marcado no gráfico (07/10): o dia (AAAA-MM-DD, no fuso da loja) em que o link foi criado */
export type Marco = { d: string; nome: string };

export type Frases = {
  melhorDia: string | null;
  pecas: string | null;
  evolucao: { frase: string; pares: Par[] } | null;
};

/**
 * A ABA DESEMPENHO EM UMA TELA, NO JEITO DE PAINEL DE NEGÓCIO (06/10/2026,
 * noite). Duas voltas do Rafael no mesmo dia:
 *
 *   1. "muito complicado, tenho que rolar muitas páginas": virou uma tela,
 *      os quatro números e três listas, sem o mapa das peças nem o de horários.
 *   2. "parece muito sem profissionalismo": a referência escolhida foi o
 *      painel do Shopify e do Stripe. Fundo cinza claro, cartões brancos com
 *      borda fina e canto pequeno, uma cor só de destaque (o verde do
 *      Performance), ícone em cada cartão, título em caixa normal, uma
 *      escala só de letra e de espaço (múltiplos de 4px).
 *
 * Travada, a faixa do Performance diz o que abre e mostra só a contagem que
 * o central libera mesmo travado. Nenhum dado pago chega aqui.
 */
/* as notas do exemplo (sem dados no período): o tipo de coisa que a lista
   aponta quando a contagem anda. Sem ação: é só a forma. */
const NOTAS_DE_EXEMPLO: Nota[] = [
  { rotulo: "Peça", icone: "caixa", frase: "Muita gente abre a Peça D e pouca chama", contexto: "650 abriram e 9 chamaram. Vale rever a foto e o preço." },
  { rotulo: "Busca", icone: "lupa", frase: "23 pessoas procuraram o que a loja não mostra", contexto: "Uma peça nova com esse nome pode virar pedido." },
];

export function PainelDesempenho({
  dados,
  periodo,
  links,
  numerosPecas,
  travados,
  relatorio = null,
  atencao,
  frases,
  marcos = [],
  proximaData = null,
  mesAtual = "",
  assinar = null,
  exemplo = null,
}: {
  dados: DadosDesempenho;
  periodo: number;
  links: LinkPost[];
  numerosPecas: string[];
  travados: boolean;
  /** o relatório do mês mais recente que o estúdio preparou, se houver */
  relatorio?: { mes: string; url: string } | null;
  atencao: Nota[];
  frases: Frases;
  /** os links de post com a data de criação: viram marcas no detalhe diário */
  marcos?: Marco[];
  /** a próxima data comercial, para a campanha pronta da faixa do estúdio */
  proximaData?: { nome: string; quando: string; entra?: string } | null;
  /** o nome do mês corrente, no fuso da loja: o título da faixa do estúdio */
  mesAtual?: string;
  /** a página /assinar/<loja> do estúdio, onde se paga (07/10) */
  assinar?: string | null;
  /** sem dados no período: a forma da parte grátis, com números de exemplo */
  exemplo?: DadosDesempenho | null;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  /* qual dos quatro números está aberto no dia a dia (06/10: "poderia dar para expandir para ver no detalhe") */
  const [aberto, setAberto] = useState<number | null>(null);
  /* o modal do plano (07/10): abre de qualquer "Conhecer o Performance" */
  const [planoAberto, setPlanoAberto] = useState(false);
  useEffect(
    () => (raiz.current ? desenhar(raiz.current, dados) : undefined),
    [dados],
  );

  /* a parte grátis lê de D: os dados reais, ou o exemplo enquanto a loja
     não tem ninguém no período */
  const vazio = Boolean(exemplo);
  const D = exemplo
    ? { ...dados, total: exemplo.total, antes: exemplo.antes, dias: exemplo.dias, pecas: exemplo.pecas, origem: exemplo.origem, cidades: exemplo.cidades }
    : dados;
  const notas: Nota[] = vazio && !atencao.length ? NOTAS_DE_EXEMPLO : atencao;
  const T = D.total;
  const A = D.antes;
  const taxa = T.pessoas ? (T.chamaram / T.pessoas) * 100 : 0;
  const taxaAntes = A && A.pessoas ? (A.chamaram / A.pessoas) * 100 : null;
  const variacao = (agora: number, antes: number | undefined) => {
    if (!A || antes === undefined || !antes) return null;
    const c = Math.round((agora / antes - 1) * 100);
    return c === 0
      ? { t: "igual", sobe: null }
      : { t: `${Math.abs(c)}%`, sobe: c > 0 };
  };
  const numeros = [
    {
      rot: "Pessoas na vitrine",
      val: br(T.pessoas),
      dif: variacao(T.pessoas, A?.pessoas),
      serie: D.dias.map((d) => d.pessoas),
    },
    {
      rot: "Abriram uma peça",
      val: br(T.olharam),
      dif: variacao(T.olharam, A?.olharam),
      serie: D.dias.map((d) => d.olharam),
    },
    {
      rot: "Chamaram no WhatsApp",
      val: br(T.chamaram),
      dif: variacao(T.chamaram, A?.chamaram),
      serie: D.dias.map((d) => d.chamaram),
    },
    {
      /* é uma proporção, não uma contagem (07/10: "não dá para distinguir
         qual é a diferença entre esses dois indicadores"). Por isso o nome
         é o mesmo das listas ("de cada 100"), a unidade aparece ao lado do
         número, a variação é em pontos e o minigráfico é de outro tipo:
         linha contra a média do período, sem área, com o zero embaixo. */
      rot: "De cada 100, chamaram",
      val: `${Math.round(taxa)}%`,
      dif:
        taxaAntes === null
          ? null
          : Math.round(taxa) === Math.round(taxaAntes)
            ? { t: "igual", sobe: null }
            : {
                t: `${Math.abs(Math.round(taxa) - Math.round(taxaAntes))} ${Math.abs(Math.round(taxa) - Math.round(taxaAntes)) === 1 ? "ponto" : "pontos"}`,
                sobe: taxa > taxaAntes,
              },
      serie: D.dias.map((d) => (d.pessoas ? d.chamaram / d.pessoas : 0)),
      referencia: taxa / 100,
    },
  ] as {
    rot: string;
    val: string;
    unidade?: string;
    dif: { t: string; sobe: boolean | null } | null;
    serie: number[];
    referencia?: number;
  }[];

  const pecasQueChamam = [...D.pecas]
    .filter((p) => p.chamaram > 0)
    .sort((a, b) => b.chamaram - a.chamaram)
    .slice(0, 5);
  const somaOrigem = D.origem.reduce((a, o) => a + o.pessoas, 0);
  const somaCidades = D.cidades.reduce((a, c) => a + c.pessoas, 0) || 1;
  /* a taxa média das peças (de cada 100 que abriram, quantos chamaram): abaixo da metade dela, vermelho */
  const somaViram = D.pecas.reduce((a, p) => a + p.viram, 0);
  const taxaPecas = somaViram
    ? (D.pecas.reduce((a, p) => a + p.chamaram, 0) / somaViram) * 100
    : 0;
  /* a origem que mais faz gente chamar, só entre as que trouxeram 20 pessoas ou mais */
  const melhorOrigem =
    D.origem
      .filter((o) => o.pessoas >= 20)
      .reduce<{ rotulo: string; t: number } | null>((m, o) => {
        const t = o.chamaram / o.pessoas;
        return !m || t > m.t ? { rotulo: o.rotulo, t } : m;
      }, null)?.rotulo ?? null;
  const contagem = dados.atencaoFechada;
  /* a peça do banner do mês: a melhor proporção chamaram/abriram entre as
     que têm volume (20 aberturas e 3 chamadas), a mesma régua do relatório */
  const destaque =
    [...dados.pecas]
      .filter((p) => p.viram >= 20 && p.chamaram >= 3)
      .sort((a, b) => b.chamaram / b.viram - a.chamaram / a.viram)[0] ?? null;

  return (
    <div className="vis dz" ref={raiz}>
      <div className="dz-cabeca">
        <div>
          <h1 className="dz-titulo">
            Desempenho
            {!travados ? <SeloPerformance tamanho={20} /> : null}
          </h1>
          <p className="dz-intro">
            Quem entrou na sua vitrine e quem chamou no WhatsApp. Sem nome nem
            telefone.
          </p>
        </div>
        <div className="dz-cabeca__acoes">
          {travados ? (
            <button
              type="button"
              className="dz-relatorio dz-relatorio--travado"
              title="O relatório do mês faz parte do Performance"
              onClick={() => setPlanoAberto(true)}
            >
              <Icone nome="cadeado" />
              Relatório do mês
            </button>
          ) : relatorio ? (
            <a
              className="dz-relatorio"
              href={relatorio.url}
              target="_blank"
              rel="noreferrer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6M9 17h4" />
              </svg>
              Relatório de{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                month: "long",
                timeZone: "UTC",
              }).format(new Date(relatorio.mes + "T12:00:00Z"))}
            </a>
          ) : null}
          <nav className="dz-periodo" aria-label="Período">
            {[7, 30, 90].map((d) =>
              travados && d === 90 ? (
                <span
                  key={d}
                  aria-disabled="true"
                  title="O histórico de 90 dias faz parte do Performance"
                >
                  <Icone nome="cadeado" />
                  {d} dias
                </span>
              ) : (
                <Link
                  key={d}
                  href={`/painel/desempenho?dias=${d}`}
                  aria-current={periodo === d ? "page" : undefined}
                >
                  {d} dias
                </Link>
              ),
            )}
          </nav>
        </div>
      </div>

      {/* ── os quatro números ─────────────────────────────── */}
      {vazio ? (
        <div className="dz-exemplo-aviso" role="note">
          <span className="dz-exemplo-aviso__selo">Exemplo</span>
          <p>
            <b>Ainda não entrou ninguém no período.</b> Assim fica a sua aba
            quando as pessoas começarem a abrir o site: os números de verdade
            entram no lugar destes sozinhos, a cada visita.
          </p>
        </div>
      ) : null}
      <div className={vazio ? "dz-exemplo" : undefined}>
      {T.pessoas ? (
        <>
          <div className="dz-numeros">
            {numeros.map((k, i) => (
              <button
                key={k.rot}
                type="button"
                className="dz-numero"
                aria-expanded={aberto === i}
                aria-controls="dz-detalhe"
                onClick={() => setAberto(aberto === i ? null : i)}
              >
                <span className="rot">
                  {k.rot}
                  <span
                    className="dz-abrir"
                    title={aberto === i ? "Fechar o detalhe" : "Ver em detalhe"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {aberto === i ? (
                        <>
                          <path d="M4 14h6v6" />
                          <path d="M20 10h-6V4" />
                          <path d="M14 10l7-7" />
                          <path d="M3 21l7-7" />
                        </>
                      ) : (
                        <>
                          <path d="M15 3h6v6" />
                          <path d="M9 21H3v-6" />
                          <path d="M21 3l-7 7" />
                          <path d="M3 21l7-7" />
                        </>
                      )}
                    </svg>
                    <span className="sr-only">
                      {aberto === i ? "Fechar o detalhe" : "Ver em detalhe"}
                    </span>
                  </span>
                </span>
                <span className="linha">
                  <span className="val">
                    {k.val}
                    {k.unidade ? <small className="unid">{k.unidade}</small> : null}
                  </span>
                  {k.dif ? (
                    <span
                      className={`dz-selo${k.dif.sobe === true ? " sobe" : k.dif.sobe === false ? " desce" : ""}`}
                      title="comparado ao período anterior"
                    >
                      {k.dif.sobe === true
                        ? "↑"
                        : k.dif.sobe === false
                          ? "↓"
                          : ""}{" "}
                      {k.dif.t}
                    </span>
                  ) : null}
                </span>
                <Mini serie={k.serie} referencia={k.referencia} />
              </button>
            ))}
          </div>
          {aberto !== null ? (
            <Detalhe
              titulo={numeros[aberto].rot}
              dias={D.dias}
              qual={aberto}
              marcos={marcos}
              aoFechar={() => setAberto(null)}
            />
          ) : null}
        </>
      ) : (
        <div className="dz-cartao dz-vazio-topo">
          A contagem está ligada. Os números aparecem aqui conforme as pessoas
          entram no site.
        </div>
      )}

      {/* ── as três listas (06/10, revisadas: cada cartão diz uma coisa que os outros não dizem) ── */}
      <div className="dz-colunas dz-colunas--iguais" inert={vazio || undefined}>
        <section className="dz-cartao" aria-labelledby="dz-fazer">
          <Cabeca id="dz-fazer" icone="lista" titulo="O que fazer agora" />
          {notas.length ? (
            <ul className="dz-fazer">
              {notas.map((n, i) => (
                <li key={i}>
                  {n.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.foto} alt="" className="dz-miniatura" />
                  ) : (
                    <span
                      className={`dz-icone-redondo${n.acao?.pago ? " pago" : ""}`}
                    >
                      <Icone nome={n.icone ?? "lista"} />
                    </span>
                  )}
                  <div>
                    <span className="dz-etiqueta">{n.rotulo}</span>
                    <p className="frase">{n.frase}</p>
                    <p className="contexto">{n.contexto}</p>
                    {n.acao?.pagar ? (
                      <PagarAqui url={n.acao.pagar} className="dz-link dz-link--botao">
                        {n.acao.texto}
                      </PagarAqui>
                    ) : n.acao ? (
                      <a href={n.acao.href} className="dz-link">
                        {n.acao.pago ? <Icone nome="cadeado" /> : null}
                        {n.acao.texto}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dz-vazio">Nada que precise de atenção agora.</p>
          )}
        </section>

        <section className="dz-cartao" aria-labelledby="dz-pecas">
          <Cabeca
            id="dz-pecas"
            icone="etiqueta"
            titulo="Peças que mais chamam"
          />
          {pecasQueChamam.length ? (
            <table className="dz-tabela">
              <thead>
                <tr>
                  <th scope="col">Peça</th>
                  <th scope="col">Abriram</th>
                  <th scope="col">Chamaram</th>
                  <th
                    scope="col"
                    title="De cada 100 que abriram, quantos chamaram"
                  >
                    De 100
                  </th>
                </tr>
              </thead>
              <tbody>
                {pecasQueChamam.map((p) => {
                  const t = Math.round((p.chamaram / p.viram) * 100);
                  const baixa = t < taxaPecas / 2;
                  return (
                    <tr key={p.slug}>
                      <th scope="row">
                        <span className="dz-tabela__peca">
                          {p.foto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.foto} alt="" className="dz-miniatura" />
                          ) : (
                            <span className="dz-miniatura" />
                          )}
                          <a
                            href={`/produto/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {p.nome}
                          </a>
                        </span>
                      </th>
                      <td>{br(p.viram)}</td>
                      <td>{br(p.chamaram)}</td>
                      <td>
                        <span
                          className={`dz-taxa${baixa ? " baixa" : ""}`}
                          title={
                            baixa ? "Muita gente abre e pouca chama" : undefined
                          }
                        >
                          {t}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="dz-vazio">
              Quando alguém chamar pelo WhatsApp a partir de uma peça, ela
              aparece aqui.
            </p>
          )}
          {pecasQueChamam.some(
            (p) => (p.chamaram / p.viram) * 100 < taxaPecas / 2,
          ) ? (
            <p className="dz-rodape">
              <span className="dz-taxa baixa">Em vermelho</span>: muita gente
              abre e pouca chama. Vale rever a foto e o preço.
            </p>
          ) : null}
        </section>

        <section className="dz-cartao" aria-labelledby="dz-origem">
          <Cabeca id="dz-origem" icone="bussola" titulo="De onde vieram" />
          {somaOrigem ? (
            <>
              <p className="dz-colhead" aria-hidden="true">
                <span>Origem</span>
                <span>Chamam, de 100</span>
              </p>
              <ul className="dz-origem">
                {D.origem.map((o) => {
                  const t = o.pessoas
                    ? Math.round((o.chamaram / o.pessoas) * 100)
                    : 0;
                  return (
                    <li key={o.rotulo}>
                      <LogoOrigem nome={o.rotulo} />
                      <span className="dz-lista__texto">
                        <b>{o.rotulo}</b>
                        <small>
                          {Math.round((o.pessoas / somaOrigem) * 100)}% das
                          pessoas · {br(o.chamaram)}{" "}
                          {o.chamaram === 1 ? "chamada" : "chamadas"}
                        </small>
                      </span>
                      <span
                        className={`dz-lista__valor${o.rotulo === melhorOrigem ? " melhor" : ""}`}
                      >
                        {t}
                      </span>
                      <span className="dz-barra">
                        <i
                          style={{
                            width: `${Math.max(2, (o.pessoas / somaOrigem) * 100)}%`,
                          }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
              {D.cidades.length ? (
                <>
                  <p className="dz-sub">De que cidade</p>
                  <ul className="dz-cidades">
                    {D.cidades.map((c) => (
                      <li key={c.nome}>
                        <span className="nome">{c.nome}</span>
                        <span className="num">
                          {Math.round((c.pessoas / somaCidades) * 100)}%
                          <small>
                            {br(c.pessoas)}{" "}
                            {c.pessoas === 1 ? "pessoa" : "pessoas"}
                          </small>
                        </span>
                        <span className="trilho">
                          <i
                            style={{
                              width: `${Math.max(2, (c.pessoas / D.cidades[0].pessoas) * 100)}%`,
                            }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {melhorOrigem ? (
                <p className="dz-rodape">
                  Quem vem do <b>{melhorOrigem}</b> é quem mais chama. A barra
                  mostra quanto de gente vem de cada lugar.
                </p>
              ) : null}
            </>
          ) : (
            <p className="dz-vazio">Ainda sem visitas no período.</p>
          )}
        </section>
      </div>
      </div>

      {/* ── o Performance ─────────────────────────────────── */}
      {/* travada (07/10: "quero que apareça as coisas, porém oculto"): a
          parte paga aparece desfocada, com dados de EXEMPLO (o central não
          manda os pagos quando a loja está travada), e o cartão de conhecer
          o Performance fica por cima. inert: nada ali recebe foco nem clique. */}
      <div className={travados ? "dz-perf-trava" : undefined}>
        <section
          className={`dz-perf${travados ? " dz-perf--oculto" : ""}`}
          aria-labelledby="dz-perf-titulo"
        >
          <div className="dz-perf__cabeca">
            <h2 id="dz-perf-titulo" className="dz-perf__titulo">
              <SeloPerformance tamanho={20} />
              Performance
            </h2>
            {/* a ação da folha travada (07/10): o carimbo rosa com o preço à
                vista, porque é a única ação daqui e a lojista decide com o
                número na frente. O cadeado saiu: cadeado lê como bloqueio. */}
            {travados ? (
              <button
                type="button"
                className="dz-botao dz-perf__ativar"
                onClick={() => setPlanoAberto(true)}
              >
                Ver o plano
                <small>{OFERTA_PERFORMANCE.valorTexto} por mês</small>
              </button>
            ) : (
              <a
                className="dz-assinatura"
                href="https://rafaelrazeira.com.br"
                target="_blank"
                rel="noreferrer"
              >
                por Rafael Razeira Estúdio
              </a>
            )}
          </div>
          {travados ? (
            <p className="dz-perf__chamada">
              {contagem && contagem.buscas_pessoas >= 2
                ? `${br(contagem.buscas_pessoas)} pessoas procuraram algo que você não tem.`
                : contagem && contagem.esgotados_pessoas >= 2
                  ? `${br(contagem.esgotados_pessoas)} pessoas tocaram num número que acabou.`
                  : "O que repor, qual post traz gente e se a loja está evoluindo."}{" "}
              O plano mensal mostra isso e mais. O que está desfocado é um
              exemplo: toque para conhecer.
            </p>
          ) : null}
          {/* travada (07/10): o miolo aparece desfocado, inerte, e uma camada
              transparente por cima leva ao WhatsApp do estúdio */}
          <div className="dz-perf__miolo">
          <div
            className="dz-colunas"
            inert={travados || undefined}
            aria-hidden={travados || undefined}
          >
            <section
              id="estoque"
              className="dz-cartao"
              aria-labelledby="dz-estoque"
            >
              <Cabeca id="dz-estoque" icone="caixa" titulo="O que repor" />
              <p className="dz-sub">Procuraram e não acharam</p>
              <ol className="vis-barras" data-buscas />
              <p className="dz-sub">Queriam um número que acabou</p>
              <ol className="vis-barras" data-esgotados />
              {numerosPecas.length ? (
                <>
                  <p className="dz-sub">Os números mais pedidos</p>
                  <p className="dz-faixa__peca">
                    <b data-numeros-peca>{numerosPecas[0]}</b>
                    {numerosPecas.length > 1 ? (
                      <button
                        type="button"
                        className="dz-link"
                        data-numeros-proxima
                      >
                        ver outra peça
                      </button>
                    ) : null}
                  </p>
                  <div className="dz-faixa" data-numeros data-qual="0" />
                  <p className="dz-rodape" data-grade-peca />
                </>
              ) : null}
            </section>

            <section
              id="divulgacao"
              className="dz-cartao"
              aria-labelledby="dz-posts"
            >
              <Cabeca
                id="dz-posts"
                icone="megafone"
                titulo="Qual post trouxe gente"
              />
              <ol className="dz-posts" data-posts />
              <p className="dz-destaque" data-posts-frase hidden />
              <p className="dz-destaque" data-grade-frase />
              <details className="dz-medir">
                <summary>Criar o link de um post</summary>
                <GeradorDeLink links={links} />
              </details>
            </section>

            <section
              id="evolucao"
              className="dz-cartao"
              aria-labelledby="dz-loja"
            >
              <Cabeca
                id="dz-loja"
                icone="grafico"
                titulo="Comparado ao período anterior"
              />
              {frases.evolucao ? (
                <>
                  <p className="dz-destaque">{frases.evolucao.frase}</p>
                  <ul className="dz-pares">
                    {frases.evolucao.pares.map((p) => (
                      <li key={p.rotulo}>
                        <span className="dz-lista__texto">
                          <b>{p.rotulo}</b>
                          <small>{p.antes}</small>
                        </span>
                        <span className="dz-lista__valor">
                          {p.agora}
                          {p.variacao ? (
                            <span className={`dz-selo ${p.sinal}`}>
                              {p.sinal === "sobe"
                                ? "↑ "
                                : p.sinal === "desce"
                                  ? "↓ "
                                  : ""}
                              {p.variacao}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="dz-vazio">
                    A comparação aparece quando a contagem tiver dois períodos
                    inteiros.
                  </p>
                  <p className="dz-rodape" data-volta-frase />
                </>
              )}
            </section>
          </div>
          {/* o que o estúdio faz com o plano, a partir destes números (07/10):
              o banner do mês com a peça que mais faz chamar, e o relatório
              com a leitura. É a parte "tem uma pessoa aqui" do Performance. */}
          {/* a faixa escura do estúdio (07/10, "personalidade, copy conversível
              e profissionalismo"): o que o estúdio faz por esta loja, com estado
              e número. É a assinatura da folha do Performance. */}
          <section className="dz-estudio" aria-labelledby="dz-estudio-titulo">
            {/* (07/10, "esta parte não dá para entender"): o título diz o que
                é, para quem e quanto custa a mais (nada); cada entrega diz o
                que o estúdio faz e o estado em linguagem de gente */}
            <header className="dz-estudio__cabeca">
              <p className="dz-estudio__rotulo">
                <SeloPerformance tamanho={14} /> Incluído no Performance
              </p>
              <h3 id="dz-estudio-titulo" className="dz-estudio__titulo">
                O que o estúdio faz na sua vitrine{mesAtual ? ` em ${mesAtual}` : ""}
              </h3>
              <p className="dz-estudio__sub">Você não precisa fazer nada. Quando ficar pronto, aparece aqui e no seu WhatsApp.</p>
            </header>
            <ul className="dz-estudio__itens">
              <li>
                <span className="dz-estudio__estado">
                  {destaque ? "O estúdio está fazendo" : "Esperando os números"}
                </span>
                <b>Um banner novo na página inicial</b>
                <span>
                  {destaque
                    ? `Com a ${destaque.nome}, a peça que mais faz gente chamar: ${Math.round((destaque.chamaram / destaque.viram) * 100)} de cada 100 que abrem.`
                    : "Com a peça que mais faz gente chamar, assim que os números apontarem uma."}
                </span>
              </li>
              <li>
                <span className="dz-estudio__estado">
                  {relatorio && !travados ? "Pronto para você ler" : "Chega no fim do mês"}
                </span>
                <b>O relatório do mês</b>
                <span>
                  O que aconteceu na sua vitrine, lido por Rafael Razeira, com o
                  que fazer na loja.
                </span>
                {relatorio && !travados ? (
                  <a className="dz-estudio__abrir" href={relatorio.url} target="_blank" rel="noreferrer">
                    Abrir o relatório
                  </a>
                ) : null}
              </li>
              {proximaData ? (
                <li>
                  <span className="dz-estudio__estado">Entra no ar em {proximaData.entra ?? proximaData.quando}</span>
                  <b>A campanha {proximaData.nome}</b>
                  <span>
                    O banner da data na vitrine, uma mensagem pronta para você
                    mandar aos clientes e um link que mostra quem veio por ela.
                  </span>
                </li>
              ) : null}
            </ul>
          </section>
          {travados ? (
            <button
              type="button"
              className="dz-perf__clique"
              aria-label="Conhecer o Performance"
              onClick={() => setPlanoAberto(true)}
            />
          ) : null}
          </div>
        </section>
      </div>
      {travados ? (
        <PlanoPerformance
          aberto={planoAberto}
          aoFechar={() => setPlanoAberto(false)}
          contagem={contagem ?? null}
          whatsapp={WHATSAPP_ESTUDIO}
          assinar={assinar}
        />
      ) : null}
    </div>
  );
}

/* o cabeçalho de cada cartão: ícone num quadrado suave e o título */
function Cabeca({
  id,
  icone,
  titulo,
}: {
  id: string;
  icone: NomeIcone;
  titulo: string;
}) {
  return (
    <header className="dz-cartao__cabeca">
      <span className="dz-icone">
        <Icone nome={icone} />
      </span>
      <h2 id={id}>{titulo}</h2>
    </header>
  );
}

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const diaCurto = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES_CURTOS[m - 1]}`;
};
const diaLongo = (iso: string) =>
  `${SEMANA[new Date(iso + "T12:00:00Z").getUTCDay()]}, ${diaCurto(iso)}`;

type Dia = DadosDesempenho["dias"][number];
type Coluna = {
  rotulo: string;
  dica: string;
  valor: number;
  media: number | null;
  parcial: boolean;
  /** os posts cujo link nasceu neste dia (ou nesta semana) */
  marcos: string[];
};

/**
 * O DETALHE DE UM NÚMERO (06/10/2026, refeito na mesma noite). O Rafael
 * perguntou se a linha diária era o melhor gráfico, e não era: o sobe e
 * desce de um dia para o outro escondia a tendência, o dia de hoje (ainda
 * incompleto) sempre caía no fim e parecia um tombo, e linha sugere algo
 * contínuo quando o dado é contagem por dia. Ficou assim:
 *
 *   - colunas por dia, em verde-claro: "quantas pessoas naquele dia";
 *   - por cima, a linha da média dos últimos 7 dias: a tendência de cara;
 *   - o dia de hoje tracejado, com a etiqueta "parcial";
 *   - em 90 dias, uma coluna por semana em vez de 90 colunas finas;
 *   - no lugar de "passe o mouse", uma frase de leitura ("a média subiu de
 *     31 para 44 por dia neste período"). O valor de cada coluna continua
 *     no mouse ou no dedo.
 *
 * Média, melhor dia e dia mais fraco contam só os dias completos.
 */
function Detalhe({
  titulo,
  dias,
  qual,
  marcos,
  aoFechar,
}: {
  titulo: string;
  dias: Dia[];
  qual: number;
  marcos: Marco[];
  aoFechar: () => void;
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(900);
  useEffect(() => {
    const medir = () => caixa.current && setW(caixa.current.clientWidth);
    medir();
    addEventListener("resize", medir);
    return () => removeEventListener("resize", medir);
  }, []);

  const taxa = qual === 3;
  const chave =
    (["pessoas", "olharam", "chamaram"] as const)[qual] ?? "pessoas";
  /* o valor de um grupo de dias: soma das contagens, ou chamaram ÷ pessoas */
  const valorDe = (grupo: Dia[]) => {
    if (taxa) {
      const p = grupo.reduce((a, d) => a + d.pessoas, 0);
      return p ? grupo.reduce((a, d) => a + d.chamaram, 0) / p : 0;
    }
    return grupo.reduce((a, d) => a + d[chave], 0);
  };
  const fmt = (v: number) =>
    taxa ? `${Math.round(v * 100)}%` : br(Math.round(v));

  const n = dias.length;
  const completos = dias.slice(0, Math.max(0, n - 1)); // o último é hoje, incompleto
  const porSemana = n > 45;
  /* os posts marcados (07/10, a ideia veio das anotações do Mixpanel): o
     pico ganha o nome do post sem o lojista cruzar duas listas */
  const nomesEm = (grupo: Dia[]) =>
    marcos
      .filter((mk) => grupo.some((d) => d.d === mk.d))
      .map((mk) => mk.nome);

  /* as colunas: um dia cada, ou uma semana cada (de trás para a frente, terminando hoje) */
  const colunas: Coluna[] = [];
  if (porSemana) {
    for (let fim = n; fim > 0; fim -= 7) {
      const grupo = dias.slice(Math.max(0, fim - 7), fim);
      const parcial = fim === n;
      colunas.unshift({
        rotulo: diaCurto(grupo[0].d),
        dica: `Semana de ${diaCurto(grupo[0].d)} a ${diaCurto(grupo[grupo.length - 1].d)}${parcial ? " (ainda em curso)" : ""}`,
        valor: valorDe(grupo),
        media: null,
        parcial,
        marcos: nomesEm(grupo),
      });
    }
  } else {
    dias.forEach((d, i) => {
      const janela = dias.slice(Math.max(0, i - 6), i + 1);
      const parcial = i === n - 1;
      colunas.push({
        rotulo: diaCurto(d.d),
        dica: diaLongo(d.d) + (parcial ? " (hoje, parcial)" : ""),
        valor: valorDe([d]),
        /* a média só a partir do 7º dia, e nunca no dia de hoje */
        media:
          i >= 6 && !parcial
            ? taxa
              ? valorDe(janela)
              : valorDe(janela) / 7
            : null,
        parcial,
        marcos: nomesEm([d]),
      });
    });
  }
  const temMarcos = colunas.some((c) => c.marcos.length > 0);

  /* a frase de leitura: o começo contra o fim do período, só dias completos */
  const fatia = Math.min(7, Math.floor(completos.length / 2));
  let frase = "Ainda são poucos dias para ver a tendência.";
  if (fatia >= 3) {
    const ini = taxa
      ? valorDe(completos.slice(0, fatia))
      : valorDe(completos.slice(0, fatia)) / fatia;
    const fim = taxa
      ? valorDe(completos.slice(-fatia))
      : valorDe(completos.slice(-fatia)) / fatia;
    const unidade = taxa ? "" : " por dia";
    const a = fmt(ini),
      b = fmt(fim);
    frase =
      a === b
        ? `Ficou estável em ${a}${unidade} neste período.`
        : `A média ${fim > ini ? "subiu" : "caiu"} de ${a} para ${b}${unidade} neste período.`;
  }

  /* as leituras de baixo, só com dias completos */
  const valores = completos.map((d) => valorDe([d]));
  const media = completos.length
    ? taxa
      ? valorDe(completos)
      : valores.reduce((a, v) => a + v, 0) / valores.length
    : 0;
  const iMelhor = valores.length ? valores.indexOf(Math.max(...valores)) : -1;
  const iPior = valores.length ? valores.indexOf(Math.min(...valores)) : -1;

  const H = 230,
    m = { l: 40, r: 12, t: temMarcos ? 44 : 22, b: 28 };
  const k = colunas.length;
  const bruto = Math.max(
    ...colunas.map((c) => Math.max(c.valor, c.media ?? 0)),
    taxa ? 0.05 : 1,
  );
  const ordem = Math.pow(10, Math.floor(Math.log10(bruto)));
  const max = Math.ceil((bruto * 1.1) / ordem) * ordem;
  const passo = (W - m.l - m.r) / Math.max(1, k);
  const cx = (i: number) => m.l + passo * (i + 0.5);
  const larg = Math.max(2, Math.min(28, passo * 0.7));
  const y = (v: number) => m.t + (1 - v / max) * (H - m.t - m.b);
  const base = y(0);
  const linhaMedia = colunas
    .map((c, i) =>
      c.media === null ? null : `${cx(i).toFixed(1)},${y(c.media).toFixed(1)}`,
    )
    .filter(Boolean)
    .join(" ");
  const marcas = k <= 1 ? [0] : [0, Math.floor((k - 1) / 2), k - 1];

  function mover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setFoco(Math.max(0, Math.min(k - 1, Math.floor((px - m.l) / passo))));
  }
  const c = foco !== null ? colunas[foco] : null;

  /* os rótulos dos posts: à direita da linha, ou à esquerda quando não cabe;
     dois vizinhos que se encostariam ficam em alturas alternadas */
  const rotulosMarcos: { x: number; y: number; fim: "start" | "end"; texto: string; i: number }[] = [];
  let fimAnterior = -Infinity;
  let nivel = 0;
  colunas.forEach((col, i) => {
    if (!col.marcos.length) return;
    let texto = col.marcos.join(", ");
    if (texto.length > 26) texto = texto.slice(0, 25).trimEnd() + "…";
    const largura = texto.length * 5.8 + 8;
    const direita = cx(i) + 4 + largura <= W - m.r;
    const inicio = direita ? cx(i) + 4 : cx(i) - 4 - largura;
    nivel = inicio < fimAnterior ? 1 - nivel : 0;
    fimAnterior = inicio + largura;
    rotulosMarcos.push({
      x: direita ? cx(i) + 4 : cx(i) - 4,
      y: nivel ? 26 : 12,
      fim: direita ? "start" : "end",
      texto,
      i,
    });
  });

  return (
    <section
      id="dz-detalhe"
      className="dz-cartao dz-detalhe"
      aria-label={`${titulo}, ${porSemana ? "semana a semana" : "dia a dia"}`}
    >
      <header className="dz-detalhe__cabeca">
        <div>
          <h2>
            {titulo}, {porSemana ? "semana a semana" : "dia a dia"}
          </h2>
          <p className={c ? undefined : "dz-detalhe__frase"}>
            {c
              ? `${c.dica}: ${fmt(c.valor)}${c.media !== null ? ` · média de 7 dias ${fmt(c.media)}` : ""}${c.marcos.length ? ` · post criado: ${c.marcos.join(", ")}` : ""}`
              : frase}
          </p>
        </div>
        <button
          type="button"
          className="dz-fechar"
          onClick={aoFechar}
          aria-label="Fechar o detalhe"
        >
          ×
        </button>
      </header>
      <div className="dz-detalhe__legenda" aria-hidden="true">
        <span>
          <i className="col" />
          {porSemana ? "Cada semana" : "Cada dia"}
        </span>
        {!porSemana ? (
          <span>
            <i className="lin" />
            Média dos últimos 7 dias
          </span>
        ) : null}
        <span>
          <i className="parc" />
          {porSemana ? "Semana em curso" : "Hoje, ainda contando"}
        </span>
        {temMarcos ? (
          <span>
            <i className="marco" />
            Dia em que o link de um post foi criado
          </span>
        ) : null}
      </div>
      <div ref={caixa} className="dz-detalhe__grafico">
        <svg
          width={W}
          height={H}
          role="img"
          aria-label={`${titulo}: ${frase}`}
          onPointerMove={mover}
          onPointerLeave={() => setFoco(null)}
        >
          {[0, max / 2, max].map((t) => (
            <g key={t}>
              <line
                x1={m.l}
                x2={W - m.r}
                y1={y(t)}
                y2={y(t)}
                stroke="#ebebeb"
              />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end">
                {fmt(t)}
              </text>
            </g>
          ))}
          {colunas.map((col, i) => {
            const topo = y(col.valor);
            const h = Math.max(0, base - topo);
            return (
              <rect
                key={i}
                x={cx(i) - larg / 2}
                y={topo}
                width={larg}
                height={h}
                rx={Math.min(3, larg / 2)}
                className={`dz-col${col.parcial ? " parcial" : ""}${foco === i ? " foco" : ""}`}
              />
            );
          })}
          {colunas[k - 1]?.parcial ? (
            <text
              x={cx(k - 1)}
              y={y(colunas[k - 1].valor) - 6}
              textAnchor="end"
              className="dz-parcial"
            >
              parcial
            </text>
          ) : null}
          {rotulosMarcos.map((r) => (
            <g key={r.i} className="dz-marco" aria-hidden="true">
              <line
                x1={cx(r.i)}
                x2={cx(r.i)}
                y1={r.y + 5}
                y2={base}
                stroke="var(--dz-texto)"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.55"
              />
              <text x={r.x} y={r.y} textAnchor={r.fim}>
                {r.texto}
              </text>
            </g>
          ))}
          {linhaMedia ? (
            <polyline
              points={linhaMedia}
              fill="none"
              stroke="var(--dz-verde-escuro)"
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {marcas.map((i) => (
            <text
              key={i}
              x={cx(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === k - 1 ? "end" : "middle"}
            >
              {colunas[i]?.rotulo}
            </text>
          ))}
        </svg>
      </div>
      <dl className="dz-detalhe__resumo">
        <div>
          <dt>{taxa ? "No período" : "Média por dia"}</dt>
          <dd>{fmt(media)}</dd>
        </div>
        <div>
          <dt>Melhor dia</dt>
          <dd>
            {iMelhor >= 0 ? fmt(valores[iMelhor]) : "–"}{" "}
            <small>{iMelhor >= 0 ? diaLongo(completos[iMelhor].d) : ""}</small>
          </dd>
        </div>
        <div>
          <dt>Dia mais fraco</dt>
          <dd>
            {iPior >= 0 ? fmt(valores[iPior]) : "–"}{" "}
            <small>{iPior >= 0 ? diaLongo(completos[iPior].d) : ""}</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/* o minigráfico de cada número: a forma dos dias, sem eixo */
function Mini({
  serie,
  referencia,
}: {
  serie: number[];
  /** uma proporção: a linha é desenhada do zero, sem área, contra esta média */
  referencia?: number;
}) {
  if (serie.length < 2) return null;
  const proporcao = referencia !== undefined;
  const max = proporcao
    ? Math.max(...serie, referencia) * 1.15 || 1
    : Math.max(...serie),
    min = proporcao ? 0 : Math.min(...serie);
  const W = 100,
    H = 28;
  const pts = serie.map((v, i) => [
    (i * W) / (serie.length - 1),
    H - 2 - ((v - min) / (max - min || 1)) * (H - 4),
  ]);
  const linha = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  return (
    <svg
      className="dz-mini"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {proporcao ? (
        <line
          className="ref"
          x1="0"
          x2={W}
          y1={(H - 2 - ((referencia - min) / (max - min || 1)) * (H - 4)).toFixed(1)}
          y2={(H - 2 - ((referencia - min) / (max - min || 1)) * (H - 4)).toFixed(1)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          opacity="0.5"
        />
      ) : (
        <polygon
          points={`0,${H} ${linha} ${W},${H}`}
          fill="currentColor"
          opacity="0.08"
        />
      )}
      <polyline
        points={linha}
        fill="none"
        stroke="currentColor"
        strokeWidth={proporcao ? "1.25" : "1.5"}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type NomeIcone =
  | "lista"
  | "etiqueta"
  | "bussola"
  | "caixa"
  | "megafone"
  | "grafico"
  | "cadeado"
  | "lupa"
  | "caminho";

/* os ícones da aba: traço simples, desenhados, nunca emoji */
function Icone({ nome }: { nome: NomeIcone }) {
  const comum = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (nome) {
    case "lista":
      /* a lista de tarefas: três linhas com o tique (07/10: o raio virou o
         selo do Performance e saiu daqui, para um símbolo ter um sentido só) */
      return (
        <svg {...comum}>
          <path d="M10 6h10M10 12h10M10 18h10" />
          <path d="M4 6.5l1.3 1.3L8 5.2M4 12.5l1.3 1.3L8 11.2M4 18.5l1.3 1.3L8 17.2" />
        </svg>
      );
    case "etiqueta":
      return (
        <svg {...comum}>
          <path d="M3 12V4h8l10 10-8 8z" />
          <circle cx="7.5" cy="8.5" r="1.5" />
        </svg>
      );
    case "bussola":
      return (
        <svg {...comum}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      );
    case "caixa":
      return (
        <svg {...comum}>
          <path d="M3.5 8L12 3.5 20.5 8 12 12.5z" />
          <path d="M3.5 8v8.5L12 21l8.5-4.5V8" />
          <path d="M12 12.5V21" />
        </svg>
      );
    case "megafone":
      return (
        <svg {...comum}>
          <path d="M4 10v4h3l7 4V6l-7 4H4z" />
          <path d="M18 9.5a3.5 3.5 0 0 1 0 5" />
        </svg>
      );
    case "grafico":
      return (
        <svg {...comum}>
          <path d="M4 19h16" />
          <path d="M7 15l4-4 3 3 5-6" />
        </svg>
      );
    case "cadeado":
      return (
        <svg {...comum}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "lupa":
      return (
        <svg {...comum}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4.6-4.6" />
        </svg>
      );
    case "caminho":
      return (
        <svg {...comum}>
          <path d="M4 18h5v-5h5V8h6" />
          <path d="M17 5l3 3-3 3" />
        </svg>
      );
  }
}

/* as logos das origens (06/10, pedido do Rafael): as marcas nas cores
   delas, desenhadas em SVG simples; link direto e outros sites, neutros */
function LogoOrigem({ nome }: { nome: string }) {
  const caixa = (filho: React.ReactNode, fundo: string) => (
    <span className="dz-logo" style={{ background: fundo }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        {filho}
      </svg>
    </span>
  );
  switch (nome) {
    case "Instagram":
      return caixa(
        <g fill="none" stroke="#fff" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.6" />
          <circle cx="17" cy="7" r="0.9" fill="#fff" stroke="none" />
        </g>,
        "linear-gradient(135deg, #feda75 0%, #fa7e1e 25%, #d62976 55%, #962fbf 80%, #4f5bd5 100%)",
      );
    case "Google":
      return caixa(
        <g>
          <path
            d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z"
            fill="#4285F4"
          />
          <path
            d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
            fill="#34A853"
          />
          <path
            d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z"
            fill="#FBBC05"
          />
          <path
            d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"
            fill="#EA4335"
          />
        </g>,
        "#fff",
      );
    case "WhatsApp":
      return caixa(
        <g>
          <path
            d="M5 19l1.1-3.2A7.5 7.5 0 1 1 8.4 18z"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9.6 8.8c.2-.4.4-.4.6-.4h.4c.1 0 .3 0 .4.3l.6 1.4c0 .1 0 .3-.1.4l-.4.5c-.1.1-.1.3 0 .4.5.8 1.1 1.4 1.9 1.8.1.1.3.1.4 0l.5-.6c.1-.1.3-.2.4-.1l1.4.7c.2.1.2.2.2.3 0 .4-.2 1-.6 1.2-.4.3-1 .4-1.6.2a7 7 0 0 1-3.9-3.4c-.4-.7-.5-1.5-.2-2.1z"
            fill="#fff"
          />
        </g>,
        "#25D366",
      );
    case "Facebook":
      return caixa(
        <path
          d="M13.3 20v-6.4h2.2l.3-2.6h-2.5V9.4c0-.7.2-1.2 1.3-1.2h1.3V5.9a17 17 0 0 0-2-.1c-1.9 0-3.2 1.2-3.2 3.3V11H8.6v2.6h2.1V20z"
          fill="#fff"
        />,
        "#1877F2",
      );
    case "Link direto":
      return caixa(
        <g fill="none" stroke="#5c5c5c" strokeWidth="1.8" strokeLinecap="round">
          <path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1 1" />
          <path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1-1" />
        </g>,
        "#f1f1f1",
      );
    default:
      return caixa(
        <g fill="none" stroke="#5c5c5c" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
        </g>,
        "#f1f1f1",
      );
  }
}

/**
 * MEDIR OS SEUS POSTS (02/10, refeito no mesmo dia: "não tá dando certo,
 * faz algo didático"). Três passos numerados, o link aparece escrito na
 * tela depois de gerado (copiar sozinho não mostra nada) e o aviso de que
 * os cliques do próprio dono não contam, que era o que fazia o teste
 * parecer quebrado.
 */
function GeradorDeLink({ links }: { links: LinkPost[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [novo, setNovo] = useState<{ nome: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [ocupado, comecar] = useTransition();

  function gerar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const qual = nome.trim();
    comecar(async () => {
      const r = await acaoCriarLink(qual);
      if (!r.ok) return setErro(r.erro);
      setNome("");
      setNovo({ nome: qual, url: r.url });
      router.refresh();
    });
  }
  function copiar(url: string) {
    const feito = () => {
      setCopiado(url);
      setTimeout(() => setCopiado(null), 2500);
    };
    if (navigator.clipboard)
      navigator.clipboard
        .writeText(url)
        .then(feito, () =>
          setErro(
            "Não deu para copiar sozinho: segure o dedo no link e copie.",
          ),
        );
    else setErro("Não deu para copiar sozinho: segure o dedo no link e copie.");
  }
  function apagar(id: string) {
    comecar(async () => {
      await acaoApagarLink(id);
      router.refresh();
    });
  }

  return (
    <div className="vis-medir">
      <ol className="vis-passos">
        <li>
          <span className="vis-passos__n">1</span>
          <div>
            <b>Dê um nome ao post</b>
            <p>
              O nome é só para você reconhecer depois. O link fica curto: só o
              que importa do nome.
            </p>
            <form onSubmit={gerar} className="vis-links__form">
              <label className="sr-only" htmlFor="nome-post">
                Nome do post
              </label>
              <input
                id="nome-post"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Story da peça nova"
                maxLength={60}
              />
              <span className="pn-carimbo">
                <button type="submit" disabled={ocupado || !nome.trim()}>
                  {ocupado ? "Gerando..." : "Gerar link"}
                </button>
              </span>
            </form>
            {nome.trim() ? (
              <p className="vis-previa">
                Vai ficar:{" "}
                <b>
                  {DOMINIO_ESCRITO}/{codigoCurto(nome)}
                </b>
              </p>
            ) : null}
            {erro ? <p className="vis-links__erro">{erro}</p> : null}
          </div>
        </li>
        <li>
          <span className="vis-passos__n">2</span>
          <div>
            <b>Copie o link</b>
            {novo ? (
              <div className="vis-novo">
                <p className="vis-novo__titulo">
                  Pronto! O link do {novo.nome}:
                </p>
                <p className="vis-novo__url">{escrito(novo.url)}</p>
                <span className="pn-carimbo">
                  <button type="button" onClick={() => copiar(novo.url)}>
                    {copiado === novo.url ? "Copiado ✓" : "Copiar link"}
                  </button>
                </span>
              </div>
            ) : (
              <p>
                Depois de gerar, o link aparece aqui. É o endereço do seu site
                com o nome curto do post no fim: quem entrar por ele cai na sua
                vitrine e conta para aquele post.
              </p>
            )}
          </div>
        </li>
        <li>
          <span className="vis-passos__n">3</span>
          <div>
            <b>Cole no Instagram</b>
            <ul className="vis-onde">
              <li>
                <b>Story:</b> toque na figurinha <i>Link</i> e cole. Um link
                novo para cada story.
              </li>
              <li>
                <b>Bio:</b> Editar perfil, Links, cole. Gere um link chamado
                &quot;Link da bio&quot; e deixe lá.
              </li>
              <li>
                <b>Post e reels:</b> o Instagram não deixa link na legenda.
                Escreva &quot;link na bio&quot;.
              </li>
              <li>
                <b>WhatsApp:</b> status, grupos e conversas também funcionam.
              </li>
              <li>
                <b>Anúncio:</b> o link do anúncio pode levar{" "}
                <i>?utm_campaign=nome-do-anuncio</i> no fim: conta do mesmo
                jeito.
              </li>
            </ul>
          </div>
        </li>
      </ol>

      <p className="vis-aviso">
        <b>Os seus próprios cliques não contam.</b> O painel reconhece este
        aparelho como o do dono, para os números mostrarem só os clientes. Para
        testar um link, peça para alguém abrir no celular dele.
      </p>

      {links.length ? (
        <div className="vis-links">
          <p className="vis-links__titulo">Seus links</p>
          <ul className="vis-links__lista">
            {links.map((l) => (
              <li key={l.id}>
                <span className="nome">
                  {l.nome}
                  <small>{escrito(l.url)}</small>
                </span>
                <button type="button" onClick={() => copiar(l.url)}>
                  {copiado === l.url ? "Copiado ✓" : "Copiar"}
                </button>
                <button
                  type="button"
                  className="apagar"
                  onClick={() => apagar(l.id)}
                  aria-label={`Apagar o link ${l.nome}`}
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
