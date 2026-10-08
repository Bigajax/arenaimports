import { site } from "@/data/site.config";
import type { DadosDesempenho } from "@/estudio/componentes/desempenho/desenho";
import type { Produto } from "@/lib/tipos";

/**
 * A ABA DESEMPENHO: do que o central devolve ao que os gráficos desenham
 * (02/10/2026 na Japa, como "Visitas"; no molde em 06/10, lendo do central
 * do estúdio em vez do banco da loja).
 */

/**
 * O link curto de um post (lojadela.com.br/flack): a página
 * app/(site)/[codigo] leva para a vitrine com ?de=, e quem entrar por ele
 * conta para aquele post. Sempre no endereço da loja (site.url): fora da
 * Vercel ele cai em localhost, e um link "localhost:3370/?de=..." copiado
 * para o Instagram não abre nada (Japa, 02/10).
 */
export function urlDoPost(slug: string) {
  return `${site.url.replace(/\/$/, "")}/${slug}`;
}

/** O que a função perf_painel do central devolve. `produto` é o SLUG da peça. */
export type Soma = {
  acesso: {
    liberado: boolean;
    liberado_ate: string | null;
    para_sempre: boolean;
    /** (07/10) o id da loja no central, para a página /assinar/<loja> do estúdio */
    loja?: string;
    plano?: "pix_mensal" | "cartao_mensal" | "cartao_anual" | "manual" | null;
    /** o cartão mensal ativo: dispensa a contagem e o aviso de renovação */
    renova_sozinho?: boolean;
    /** (07/10) o upgrade pago acima da vitrine */
    upgrade?: "vender" | "loja" | null;
  };
  /* as duas contagens que vêm MESMO travada: quantas pessoas procuraram o que
     a loja não tem e quantas tocaram num número que acabou. Só o número,
     sem termo nem peça: é o gancho do bloco "o que merece a sua atenção" */
  atencao?: { buscas_pessoas: number; esgotados_pessoas: number } | null;
  periodo: number;
  contagem_desde: string | null;
  agora: string;
  total: { pessoas: number; olharam: number; chamaram: number };
  /* os blocos pagos vêm vazios ou nulos quando a aba está travada */
  antes: { pessoas: number; olharam: number; chamaram: number } | null;
  dias: { d: string; pessoas: number; olharam: number; chamaram: number }[];
  posts_dia: { d: string; post: string; pessoas: number }[];
  pecas: { produto: string; viram: number; chamaram: number }[];
  links: { post: string; pessoas: number; chamaram: number }[];
  origem: { origem: string; pessoas: number; chamaram?: number }[];
  /* de que cidade vieram (07/10): as 6 maiores, pelo cabeçalho da Vercel; grátis */
  cidades?: { cidade: string; pessoas: number; chamaram: number }[];
  grade: { dia: number; faixa: number; pessoas: number }[];
  buscas: { termo: string; pessoas: number }[];
  numeros: { produto: string; tamanho: string; pessoas: number }[];
  esgotados: { produto: string; tamanho: string; pessoas: number }[];
  volta: {
    novos: number;
    voltaram: number;
    chamaram_novos: number;
    chamaram_voltaram: number;
  } | null;
};

const ORIGENS: Record<string, string> = {
  instagram: "Instagram",
  google: "Google",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  direto: "Link direto",
  outro: "Outros sites",
};

export const diaLocal = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);

/* a grade de números na ordem certa: 38, 39, 40... ou P, M, G, GG */
const ORDEM_LETRAS = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG"];
function ordemTamanho(a: string, b: string) {
  const na = Number(a),
    nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return (
    ORDEM_LETRAS.indexOf(a.toUpperCase()) -
    ORDEM_LETRAS.indexOf(b.toUpperCase())
  );
}

const SEM_VOLTA = {
  novos: 0,
  voltaram: 0,
  chamaram_novos: 0,
  chamaram_voltaram: 0,
};

/**
 * Transforma a soma do central no que os gráficos desenham: os dias sem
 * ninguém viram zero (o gráfico não pula dia), as peças ganham nome e foto
 * do catálogo pelo slug, e os posts ganham o nome que o dono deu.
 */
export function montarDados(
  soma: Soma,
  produtos: Produto[],
  links: { nome: string; slug: string }[],
  periodo: number,
): { dados: DadosDesempenho; numerosPecas: string[] } {
  const porSlug = new Map(produtos.map((p) => [p.slug, p]));
  const nomeDoPost = new Map(links.map((l) => [l.slug, l.nome]));
  const nomePeca = (slug: string) => porSlug.get(slug)?.nome ?? "Peça apagada";

  /* o eixo começa no início do período, ou no dia em que a contagem ligou */
  const agora = new Date(soma.agora);
  const inicioPeriodo = new Date(agora.getTime() - (periodo - 1) * 86400000);
  const desde = soma.contagem_desde ? new Date(soma.contagem_desde) : agora;
  const primeiro = desde > inicioPeriodo ? desde : inicioPeriodo;
  const doBanco = new Map(soma.dias.map((d) => [d.d, d]));
  const dias: DadosDesempenho["dias"] = [];
  for (
    let t = new Date(diaLocal(primeiro) + "T12:00:00Z");
    diaLocal(t) <= diaLocal(agora);
    t = new Date(t.getTime() + 86400000)
  ) {
    const chave = diaLocal(t);
    const d = doBanco.get(chave);
    dias.push({
      d: chave,
      pessoas: d?.pessoas ?? 0,
      olharam: d?.olharam ?? 0,
      chamaram: d?.chamaram ?? 0,
    });
  }

  /* os posts que puxaram gente: até três picos, com pelo menos 5 pessoas
     e um quarto das pessoas do dia */
  const posts: Record<number, string> = {};
  (soma.posts_dia ?? [])
    .map((p) => ({ ...p, i: dias.findIndex((d) => d.d === p.d) }))
    .filter(
      (p) =>
        p.i >= 0 && p.pessoas >= 5 && p.pessoas >= dias[p.i].pessoas * 0.25,
    )
    .sort((a, b) => b.pessoas - a.pessoas)
    .slice(0, 3)
    .forEach((p) => (posts[p.i] = nomeDoPost.get(p.post) ?? p.post));

  /* o período anterior só compara quando a contagem já existia antes dele */
  const temAntes =
    soma.antes !== null &&
    soma.contagem_desde !== null &&
    desde < inicioPeriodo &&
    soma.antes.pessoas > 0;

  const pecas = soma.pecas
    .filter((p) => porSlug.has(p.produto))
    .sort((a, b) => b.viram + b.chamaram * 5 - (a.viram + a.chamaram * 5))
    .slice(0, 12)
    .map((p) => {
      const prod = porSlug.get(p.produto)!;
      return {
        nome: prod.nome,
        slug: prod.slug,
        foto: prod.imagens[0]?.url ?? null,
        viram: p.viram,
        chamaram: p.chamaram,
      };
    });

  const statsLink = new Map((soma.links ?? []).map((l) => [l.post, l]));
  const linksComNumeros = links
    .map((l) => ({
      nome: l.nome,
      pessoas: statsLink.get(l.slug)?.pessoas ?? 0,
      chamaram: statsLink.get(l.slug)?.chamaram ?? 0,
    }))
    .sort((a, b) => b.pessoas - a.pessoas);

  const grade = Array.from({ length: 7 }, () => Array(8).fill(0) as number[]);
  (soma.grade ?? []).forEach((g) => {
    if (g.dia >= 1 && g.dia <= 7 && g.faixa >= 0 && g.faixa < 8)
      grade[g.dia - 1][g.faixa] = g.pessoas;
  });

  /* a grade de números: as peças mais pedidas com número, até cinco */
  const porPeca = new Map<string, { tamanho: string; pessoas: number }[]>();
  (soma.numeros ?? []).forEach((x) => {
    if (!porSlug.has(x.produto)) return;
    porPeca.set(x.produto, [
      ...(porPeca.get(x.produto) ?? []),
      { tamanho: x.tamanho, pessoas: x.pessoas },
    ]);
  });
  const numeros = [...porPeca.entries()]
    .map(([slug, g]) => ({
      peca: nomePeca(slug),
      grade: g.sort((a, b) => ordemTamanho(a.tamanho, b.tamanho)),
      total: g.reduce((a, x) => a + x.pessoas, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(({ peca, grade: g }) => ({ peca, grade: g }));

  const dados: DadosDesempenho = {
    dias,
    posts,
    total: soma.total,
    antes: temAntes ? soma.antes : null,
    pecas,
    links: linksComNumeros,
    origem: (soma.origem ?? [])
      .map((o) => ({
        rotulo: ORIGENS[o.origem] ?? o.origem,
        pessoas: o.pessoas,
        chamaram: o.chamaram ?? 0,
      }))
      .sort((a, b) => b.pessoas - a.pessoas),
    cidades: (soma.cidades ?? [])
      .map((c) => ({ nome: c.cidade, pessoas: c.pessoas, chamaram: c.chamaram }))
      .sort((a, b) => b.pessoas - a.pessoas),
    grade,
    buscas: soma.buscas ?? [],
    numeros,
    esgotados: (soma.esgotados ?? [])
      .filter((e) => porSlug.has(e.produto))
      .map((e) => ({
        peca: nomePeca(e.produto),
        tamanho: e.tamanho,
        pessoas: e.pessoas,
      })),
    volta: soma.volta ?? SEM_VOLTA,
    periodo,
  };
  return { dados, numerosPecas: numeros.map((n) => n.peca) };
}

/* ─── as frases que interpretam os números (06/10/2026) ───────────────
   A régua da aba: o número nunca fica sozinho quando existe uma conclusão
   útil, e nenhuma frase diz "bom" ou "ruim". Funções puras, chamadas no
   servidor pela página. */

const br = (v: number) => v.toLocaleString("pt-BR");
const DIAS_EXTENSO = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/** "Quinta-feira foi o dia da semana com mais movimento." Só com 10 pessoas ou mais no período. */
export function melhorDia(dias: DadosDesempenho["dias"]): string | null {
  const total = dias.reduce((a, d) => a + d.pessoas, 0);
  if (total < 10) return null;
  const porDia = Array(7).fill(0) as number[];
  dias.forEach(
    (d) => (porDia[new Date(d.d + "T12:00:00Z").getUTCDay()] += d.pessoas),
  );
  const max = Math.max(...porDia);
  if (!max || porDia.filter((v) => v === max).length > 1) return null;
  return `${DIAS_EXTENSO[porDia.indexOf(max)]} foi o dia da semana com mais movimento.`;
}

/** A peça que leva mais gente ao WhatsApp em proporção, comparada com a mais vista. */
export function frasePecas(pecas: DadosDesempenho["pecas"]): string | null {
  const lista = pecas.filter((p) => p.viram >= 5 && p.chamaram >= 1);
  if (lista.length < 2) return null;
  const maisVista = lista.reduce((a, b) => (b.viram > a.viram ? b : a));
  const melhorTaxa = lista.reduce((a, b) =>
    b.chamaram / b.viram > a.chamaram / a.viram ? b : a,
  );
  if (maisVista.nome === melhorTaxa.nome)
    return `${maisVista.nome} é a mais vista e a que mais leva gente ao WhatsApp.`;
  return `${melhorTaxa.nome} recebe menos visitas que ${maisVista.nome}, mas leva mais gente ao WhatsApp em proporção.`;
}

export type Par = {
  rotulo: string;
  agora: string;
  antes: string;
  variacao: string;
  /** o selo da variação: sobe (verde), desce (vermelho) ou igual (cinza) */
  sinal: "sobe" | "desce" | "igual";
};

/** A frase única da evolução e os pares "agora x antes". `antes` já veio filtrado pelo montarDados. */
export function evolucao(
  total: DadosDesempenho["total"],
  antes: DadosDesempenho["antes"],
  volta: DadosDesempenho["volta"],
): { frase: string; pares: Par[] } | null {
  if (!antes || !antes.pessoas) return null;
  const taxa = total.pessoas ? (total.chamaram / total.pessoas) * 100 : 0;
  const taxaAntes = (antes.chamaram / antes.pessoas) * 100;
  /* o selo curto: "30%" com o sinal; o lojista lê a seta, não a frase */
  const var_ = (agora: number, ant: number): Pick<Par, "variacao" | "sinal"> => {
    if (!ant) return agora ? { variacao: "novo", sinal: "sobe" } : { variacao: "igual", sinal: "igual" };
    const c = Math.round((agora / ant - 1) * 100);
    return c === 0
      ? { variacao: "igual", sinal: "igual" }
      : { variacao: `${Math.abs(c)}%`, sinal: c > 0 ? "sobe" : "desce" };
  };
  const maisGente = total.pessoas > antes.pessoas;
  const menosGente = total.pessoas < antes.pessoas;
  /* a frase compara o que o lojista lê embaixo (os inteiros): 21,2 contra
     20,7 dizia "converteu melhor" ao lado de "21, antes 21, igual" (06/10) */
  const melhorTaxa = Math.round(taxa) > Math.round(taxaAntes);
  const piorTaxa = Math.round(taxa) < Math.round(taxaAntes);
  let frase = "A sua vitrine ficou parecida com o período anterior.";
  if (maisGente && melhorTaxa)
    frase =
      "A sua vitrine trouxe mais pessoas e converteu melhor que no período anterior.";
  else if (maisGente && piorTaxa)
    frase =
      "A sua vitrine trouxe mais pessoas, mas uma parte menor delas chamou.";
  else if (menosGente && melhorTaxa)
    frase = "Entrou menos gente, mas uma parte maior chamou no WhatsApp.";
  else if (menosGente && piorTaxa)
    frase = "Entrou menos gente, e uma parte menor chamou no WhatsApp.";
  else if (maisGente)
    frase = "A sua vitrine trouxe mais pessoas, chamando na mesma proporção.";
  else if (menosGente)
    frase = "Entrou menos gente, chamando na mesma proporção.";
  const pares: Par[] = [
    {
      rotulo: "Pessoas",
      agora: br(total.pessoas),
      antes: `antes ${br(antes.pessoas)}`,
      ...var_(total.pessoas, antes.pessoas),
    },
    {
      rotulo: "Chamaram",
      agora: br(total.chamaram),
      antes: `antes ${br(antes.chamaram)}`,
      ...var_(total.chamaram, antes.chamaram),
    },
    {
      rotulo: "De cada 100, chamaram",
      agora: Math.round(taxa).toString(),
      antes: `antes ${Math.round(taxaAntes)}`,
      variacao:
        Math.round(taxa) === Math.round(taxaAntes)
          ? "igual"
          : `${Math.abs(Math.round(taxa) - Math.round(taxaAntes))} ${Math.abs(Math.round(taxa) - Math.round(taxaAntes)) === 1 ? "ponto" : "pontos"}`,
      sinal: melhorTaxa ? "sobe" : piorTaxa ? "desce" : "igual",
    },
  ];
  if (volta.voltaram) {
    const tN = volta.novos ? volta.chamaram_novos / volta.novos : 0;
    const tV = volta.chamaram_voltaram / volta.voltaram;
    pares.push({
      rotulo: "Voltaram à vitrine",
      agora: br(volta.voltaram),
      antes: volta.voltaram === 1 ? "entrou em mais de um dia" : "entraram em mais de um dia",
      variacao:
        tN && tV > tN
          ? `chamam ${(tV / tN).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} vezes mais`
          : "",
      sinal: tN && tV > tN ? "sobe" : "igual",
    });
  }
  return { frase, pares };
}

/**
 * OS NÚMEROS DE EXEMPLO: desde 06/10 a aba travada não os usa mais (mostra
 * esqueleto com a contagem real). Ficam aqui para a página de venda do
 * Performance, quando ela existir.
 */
export function dadosDeExemplo(): DadosDesempenho {
  const pessoas = [
    96, 104, 88, 92, 118, 126, 131, 214, 168, 122, 98, 94, 109, 121, 128, 117,
    101, 97, 106, 119, 176, 142, 124, 112, 99, 103, 127, 133, 138, 121,
  ];
  const chamaram = [
    4, 5, 3, 4, 6, 7, 6, 15, 11, 6, 4, 3, 5, 6, 7, 6, 4, 4, 5, 6, 12, 9, 7, 5,
    4, 5, 7, 8, 8, 6,
  ];
  const hoje = Date.now();
  const dias = pessoas.map((p, i) => ({
    d: diaLocal(new Date(hoje - (29 - i) * 86400000)),
    pessoas: p,
    olharam: Math.round(p * 0.61),
    chamaram: chamaram[i],
  }));
  const soma = (a: number[]) => a.reduce((x, y) => x + y, 0);
  return {
    dias,
    posts: { 7: "Story da peça nova", 20: "Reels da promoção" },
    total: {
      pessoas: soma(pessoas),
      olharam: soma(dias.map((d) => d.olharam)),
      chamaram: soma(chamaram),
    },
    antes: { pessoas: 3265, olharam: 2027, chamaram: 153 },
    pecas: [
      { nome: "Peça A", slug: "peca-a", foto: null, viram: 720, chamaram: 52 },
      { nome: "Peça B", slug: "peca-b", foto: null, viram: 460, chamaram: 31 },
      { nome: "Peça C", slug: "peca-c", foto: null, viram: 300, chamaram: 22 },
      { nome: "Peça D", slug: "peca-d", foto: null, viram: 650, chamaram: 9 },
      { nome: "Peça E", slug: "peca-e", foto: null, viram: 480, chamaram: 6 },
      { nome: "Peça F", slug: "peca-f", foto: null, viram: 28, chamaram: 1 },
    ],
    links: [
      { nome: "Link da bio", pessoas: 620, chamaram: 38 },
      { nome: "Story", pessoas: 410, chamaram: 27 },
      { nome: "Reels", pessoas: 290, chamaram: 15 },
    ],
    origem: [
      { rotulo: "Instagram", pessoas: 2464, chamaram: 120 },
      { rotulo: "Google", pessoas: 761, chamaram: 22 },
      { rotulo: "Link direto", pessoas: 399, chamaram: 11 },
    ],
    grade: [
      [0, 0, 0, 1, 2, 3, 6, 4],
      [0, 0, 1, 2, 2, 4, 9, 8],
      [0, 0, 1, 2, 3, 5, 9, 9],
      [0, 0, 1, 2, 3, 5, 9, 6],
      [0, 0, 1, 3, 3, 4, 6, 4],
      [1, 0, 2, 5, 4, 2, 3, 2],
      [1, 0, 1, 2, 1, 2, 4, 2],
    ],
    buscas: [
      { termo: "exemplo um", pessoas: 23 },
      { termo: "exemplo dois", pessoas: 17 },
      { termo: "exemplo três", pessoas: 12 },
    ],
    numeros: [
      {
        peca: "Peça A",
        grade: [
          { tamanho: "38", pessoas: 3 },
          { tamanho: "39", pessoas: 6 },
          { tamanho: "40", pessoas: 9 },
          { tamanho: "41", pessoas: 15 },
          { tamanho: "42", pessoas: 13 },
          { tamanho: "43", pessoas: 5 },
        ],
      },
    ],
    cidades: [
      { nome: "Maringá", pessoas: 2300, chamaram: 310 },
      { nome: "Sarandi", pessoas: 420, chamaram: 48 },
      { nome: "Londrina", pessoas: 260, chamaram: 19 },
    ],
    esgotados: [
      { peca: "Peça D", tamanho: "42", pessoas: 9 },
      { peca: "Peça A", tamanho: "40", pessoas: 5 },
    ],
    volta: {
      novos: 2500,
      voltaram: 1124,
      chamaram_novos: 78,
      chamaram_voltaram: 110,
    },
    periodo: 30,
  };
}

/**
 * A PRÓXIMA DATA COMERCIAL (07/10/2026): a campanha pronta é parte do
 * Performance, e a faixa "pelo estúdio" diz qual é a próxima. São datas de
 * calendário, não números da loja: Dia das Mães (2º domingo de maio), Dia
 * dos Namorados (12/06), Dia dos Pais (2º domingo de agosto), Dia das
 * Crianças (12/10), Black Friday (última sexta de novembro) e Natal (25/12).
 * O nome já vem com a preposição ("do Dia das Mães", "da Black Friday"),
 * porque a faixa escreve "Campanha {nome}".
 */
export function proximaDataComercial(hoje: Date, minDias = 21): { nome: string; quando: string; entra: string } {
  const ano = hoje.getFullYear();
  const segundoDomingo = (a: number, mes: number) => {
    const d = new Date(a, mes, 1);
    const primeiroDomingo = 1 + ((7 - d.getDay()) % 7);
    return new Date(a, mes, primeiroDomingo + 7);
  };
  const ultimaSexta = (a: number, mes: number) => {
    const d = new Date(a, mes + 1, 0);
    return new Date(a, mes, d.getDate() - ((d.getDay() + 2) % 7));
  };
  const datas = (a: number) => [
    { nome: "do Dia das Mães", data: segundoDomingo(a, 4) },
    { nome: "do Dia dos Namorados", data: new Date(a, 5, 12) },
    { nome: "do Dia dos Pais", data: segundoDomingo(a, 7) },
    { nome: "do Dia das Crianças", data: new Date(a, 9, 12) },
    { nome: "da Black Friday", data: ultimaSexta(a, 10) },
    { nome: "de Natal", data: new Date(a, 11, 25) },
  ];
  /* uma data a menos de três semanas não entra: não dá para prometer campanha
     pronta para daqui a cinco dias (07/10, o Dia das Crianças a 5 dias) */
  const corte = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + minDias);
  const proxima =
    [...datas(ano), ...datas(ano + 1)].find((d) => d.data >= corte) ?? datas(ano + 1)[0];
  const formato = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });
  const quando = formato.format(proxima.data);
  /* a campanha entra na vitrine uma semana antes da data (07/10) */
  const entra = formato.format(new Date(proxima.data.getFullYear(), proxima.data.getMonth(), proxima.data.getDate() - 7));
  return { nome: proxima.nome, quando, entra };
}
