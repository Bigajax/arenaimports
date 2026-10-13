import { grade } from "@/data/grade.config";
import { PREVIA, configPadrao, site } from "@/data/site.config";
import { MAPA, PARTES, VARIAVEIS } from "@/data/conteudo.config";
import type { LojaConfig } from "@vitrine/plataforma/tipos-loja";

/**
 * A ARENA IMPORTS FLORIPA, PARA O PACOTE (13/10/2026: a terceira loja no
 * @vitrine/plataforma, depois da SneakerSpot e da Japa). O painel, o estoque
 * e o estúdio leem tudo o que é da loja daqui; o SITE dela segue lendo
 * data/site.config.ts e as libs dela.
 *
 * - site: o da roupagem, mais a logo, o horário (ela não publica) e as
 *   marcas do catálogo. Sem Pix com desconto e sem parcela publicados.
 * - codigo: as peças dela são AR-0142 (o catálogo nasceu assim).
 * - cookie: o mesmo de antes (arena_painel), para o modo local não mudar.
 * - opcoes: a pronta entrega (a chave "Em mãos" do painel antigo, a coluna
 *   pronta_entrega) e o Yupoo no cadastro; o site dela não lê banners, textos
 *   nem a captura de contatos, e não tem sacola nem a página Mais vendidos.
 */
export const loja: LojaConfig = {
  site: {
    ...site,
    logo: "/marca/logo.png",
    /* 621 x 417 */
    proporcaoLogo: 1.49,
    /* o nome no menu e no "Boa tarde" do painel (o site.marca da roupagem é "arena", minúsculo) */
    marca: "Arena Imports",
    horario: "",
    marcas: ["Nike", "Adidas", "Jordan", "New Balance", "Vans", "Chanel", "Louis Vuitton", "Gucci"],
  },
  previa: PREVIA,
  configPadrao,
  grade,
  /* a mesma marca que a imagem do Compartilhar já usava (09/10/2026) */
  marca: { logo: "/marca/logo.png", proporcao: 1.61, fonte: "Chakra Petch" },
  cookie: "arena_painel",
  codigo: "AR",
  conteudo: { partes: PARTES, mapa: MAPA, variaveis: VARIAVEIS },
  opcoes: {
    estoque: true,
    /* Estoque e Pedidos (13/10/2026): precisa do SQL do painel novo no banco
       dela (rodar-arena-painel-novo.sql). Na primeira vez que a tela Estoque
       abre logada, a contagem atual é importada */
    gestao: true,
    prontaEntrega: true,
    yupoo: true,
    estoqueNoSite: false,
    banners: true,
    textosDoSite: false,
    captura: false,
    riscadoManual: false,
    bannerSimples: false,
    origem: false,
    bannerLado: false,
    sacola: false,
    paginaMaisVendidos: false,
  },
  nomeConfig: "A loja",
};
