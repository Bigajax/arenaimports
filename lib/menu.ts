import type { Produto } from "./tipos";
import { categoriasDoGrupo } from "./grupos";

/**
 * O menu das portas, montado do catálogo: cada porta do cabeçalho é
 * uma das quatro coisas que a Arena vende e abre uma aba ao passar o
 * mouse, e o que está na aba vem dos produtos (os atalhos por marca só
 * aparecem se acham algo). Assim a aba nunca promete o que a vitrine
 * não tem.
 */
export type NomeIconeMenu = "novidade" | "chuteira" | "corrida" | "sneaker" | "bolsa" | "camisa" | "aviao" | "loja" | "pacote" | "conversa" | "instagram" | "simbolo" | "relampago";

export type ItemMenu = {
  nome: string;
  href: string;
  icone?: NomeIconeMenu;
  nota?: string;
  externa?: boolean;
};

export type Aba = {
  chave: string;
  nome: string;
  href: string;
  icone: NomeIconeMenu;
  externa?: boolean;
  titulo?: string;
  itens: ItemMenu[];
  colunas: 1 | 2 | 3 | 4;
  /* o número ao lado do nome na fila de portas */
  total?: number;
  /* a linha miúda embaixo do nome, só na porta da loja */
  nota?: string;
};

/* As quatro portas, na ordem em que a loja se apresenta: o campo
   primeiro (é "Arena"), a corrida, a rua, e a grife. */
/* "chuteiras" é um GRUPO (lib/grupos.ts): a porta abre campo, society e
   futsal juntos, e a aba dela lista as três áreas */
export const CATEGORIAS: { slug: string; nome: string; tudo: string; icone: NomeIconeMenu; linha: string; pergunta: string }[] = [
  { slug: "chuteiras", nome: "Chuteiras", tudo: "Todas as chuteiras", icone: "chuteira", linha: "campo, society e futsal: Mercurial, Predator e F50", pergunta: "para entrar em campo" },
  { slug: "tenis-de-corrida", nome: "Corrida", tudo: "Todos os tênis de corrida", icone: "corrida", linha: "Adizero, Evo SL e FuelCell para treino e prova", pergunta: "para o próximo pace" },
  { slug: "sneakers", nome: "Casual", tudo: "Todos os tênis casuais", icone: "sneaker", linha: "Jordan, Dunk, Air Force, Vans e New Balance", pergunta: "para a rua" },
  { slug: "bolsas", nome: "Bolsas", tudo: "Todas as bolsas", icone: "bolsa", linha: "Chanel, Louis Vuitton, Gucci e Saint Laurent", pergunta: "para o closet" },
  { slug: "camisas", nome: "Camisas", tudo: "Todas as camisas de time", icone: "camisa", linha: "os times da Europa e da seleção, temporada nova", pergunta: "para torcer" },
];

/* as marcas que viram atalho dentro de cada porta */
const MARCAS = ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Vans", "Chanel", "Gucci", "Louis Vuitton", "Saint Laurent"];

export function montarMenu(produtos: Produto[], linkWhats: string): Aba[] {
  const ativos = produtos.filter((p) => p.ativo);
  const slugsDe = (slug: string) => categoriasDoGrupo(slug) ?? [slug];
  const conta = (slug: string) => ativos.filter((p) => slugsDe(slug).includes(p.categoria_slug ?? "")).length;
  const busca = (cat: string, termo: string) => `/catalogo/${cat}?busca=${encodeURIComponent(termo)}`;
  const existe = (cat: string, termo: string) => ativos.some((p) => slugsDe(cat).includes(p.categoria_slug ?? "") && `${p.nome} ${p.marca ?? ""}`.toLowerCase().includes(termo.toLowerCase()));
  const AREAS: Record<string, { nome: string; slug: string }[]> = {
    chuteiras: [
      { nome: "Campo", slug: "chuteiras-campo" },
      { nome: "Society", slug: "chuteiras-society" },
      { nome: "Futsal", slug: "chuteiras-futsal" },
    ],
  };

  const emMaos = ativos.filter((p) => p.pronta_entrega).length;

  return [
    /* a porta que a loja pediu: o que está em mãos, antes das categorias */
    {
      chave: "pronta-entrega",
      nome: "Pronta entrega",
      href: "/pronta-entrega",
      icone: "relampago",
      total: emMaos,
      titulo: emMaos ? `${emMaos} ${emMaos === 1 ? "modelo em mãos" : "modelos em mãos"}: sai no mesmo dia` : "Nada em mãos agora: tudo sob encomenda",
      colunas: 1,
      itens: [
        { nome: "Ver a pronta entrega", href: "/pronta-entrega", icone: "relampago" },
        { nome: "Sob encomenda", href: "/catalogo", icone: "aviao", nota: "importado direto da fonte, com prazo" },
      ],
    },
    ...CATEGORIAS.map((f): Aba => {
      const total = conta(f.slug);
      return {
        chave: f.slug,
        nome: f.nome,
        href: `/catalogo/${f.slug}`,
        icone: f.icone,
        total,
        titulo: `${total} ${total === 1 ? "modelo" : "modelos"}: ${f.linha}`,
        colunas: 2,
        itens: [
          ...(AREAS[f.slug] ?? []).filter((a) => conta(a.slug) > 0).map((a) => ({ nome: a.nome, href: `/catalogo/${a.slug}`, nota: String(conta(a.slug)) })),
          ...MARCAS.filter((m) => existe(f.slug, m)).map((m) => ({ nome: m, href: busca(f.slug, m) })),
          { nome: f.tudo, href: `/catalogo/${f.slug}`, icone: f.icone },
        ],
      };
    }),
    {
      chave: "loja",
      nome: "A Arena",
      href: "/#loja",
      icone: "simbolo",
      nota: "Florianópolis, envio Brasil",
      colunas: 1,
      itens: [
        { nome: "Como funciona", href: "/#loja", icone: "aviao", nota: "pronta entrega e sob encomenda" },
        { nome: "Camisas de time", href: "/catalogo/camisas", icone: "camisa", nota: "a temporada nova, sob encomenda" },
        { nome: "Falar no WhatsApp", href: linkWhats, icone: "conversa", nota: "tamanho, disponibilidade e envio", externa: true },
        { nome: "Tudo que chegou", href: "/#destaques", icone: "novidade", nota: `os ${ativos.length} modelos` },
      ],
    },
  ];
}
