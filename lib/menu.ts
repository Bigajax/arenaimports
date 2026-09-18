import type { Produto } from "./tipos";

/**
 * O menu das portas, montado do catálogo: cada porta do cabeçalho é
 * uma das quatro coisas que a Arena vende e abre uma aba ao passar o
 * mouse, e o que está na aba vem dos produtos (os atalhos por marca só
 * aparecem se acham algo). Assim a aba nunca promete o que a vitrine
 * não tem.
 */
export type NomeIconeMenu = "novidade" | "chuteira" | "corrida" | "sneaker" | "bolsa" | "camisa" | "aviao" | "loja" | "pacote" | "conversa" | "instagram" | "simbolo";

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
export const CATEGORIAS: { slug: string; nome: string; tudo: string; icone: NomeIconeMenu; linha: string; pergunta: string }[] = [
  { slug: "chuteiras", nome: "Chuteiras", tudo: "Todas as chuteiras", icone: "chuteira", linha: "Mercurial, Phantom e F50 para campo e society", pergunta: "para entrar em campo" },
  { slug: "tenis-de-corrida", nome: "Corrida", tudo: "Todos os tênis de corrida", icone: "corrida", linha: "Adizero, Evo SL e FuelCell para treino e prova", pergunta: "para o próximo pace" },
  { slug: "sneakers", nome: "Sneakers", tudo: "Todos os sneakers", icone: "sneaker", linha: "Jordan, Dunk, Samba e New Balance 9060", pergunta: "para a rua" },
  { slug: "bolsas", nome: "Bolsas", tudo: "Todas as bolsas", icone: "bolsa", linha: "Gucci, Louis Vuitton e Saint Laurent", pergunta: "para o closet" },
];

/* as marcas que viram atalho dentro de cada porta */
const MARCAS = ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Gucci", "Louis Vuitton", "Saint Laurent"];

export function montarMenu(produtos: Produto[], linkWhats: string): Aba[] {
  const ativos = produtos.filter((p) => p.ativo);
  const conta = (slug: string) => ativos.filter((p) => p.categoria_slug === slug).length;
  const busca = (cat: string, termo: string) => `/catalogo/${cat}?busca=${encodeURIComponent(termo)}`;
  const existe = (cat: string, termo: string) => ativos.some((p) => p.categoria_slug === cat && `${p.nome} ${p.marca ?? ""}`.toLowerCase().includes(termo.toLowerCase()));

  return [
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
          ...MARCAS.filter((m) => existe(f.slug, m)).map((m) => ({ nome: m, href: busca(f.slug, m) })),
          { nome: f.tudo, href: `/catalogo/${f.slug}`, icone: f.icone },
        ],
      };
    }),
    {
      chave: "loja",
      nome: "A loja",
      href: "/#loja",
      icone: "simbolo",
      nota: "São José, Grande Floripa",
      colunas: 1,
      itens: [
        { nome: "Onde fica", href: "/#loja", icone: "loja", nota: "R. Gerôncio Thives, 528, Barreiros" },
        { nome: "Camisas de time", href: linkWhats, icone: "camisa", nota: "sob consulta no WhatsApp", externa: true },
        { nome: "Falar no WhatsApp", href: linkWhats, icone: "conversa", nota: "tamanho, disponibilidade e envio", externa: true },
        { nome: "Tudo que chegou", href: "/#destaques", icone: "novidade", nota: `os ${ativos.length} modelos` },
      ],
    },
  ];
}
