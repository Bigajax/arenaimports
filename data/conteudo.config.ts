import type { Faixa } from "@vitrine/plataforma/lib/conteudo";
import type { EscolhaDaLoja } from "@vitrine/plataforma/lib/catalogo-secoes";

/**
 * O CONTEÚDO DA ARENA PARA O PACOTE (13/10/2026). A vitrine dela é própria:
 * as prateleiras, o menu e o rodapé estão no código da roupagem, e o painel
 * NÃO tem a aba Textos do site (a opção textosDoSite está desligada no
 * loja.config.ts). Os recados do topo e a frase da capa moram na tabela
 * config e se mudam na tela A loja.
 *
 * Por isso aqui ficam só as partes que todo loja.config precisa ter, com os
 * textos que o site dela já mostra. Nenhuma parte opcional ligada.
 */
export const MAPA: Faixa[] = [
  { id: "avisos", nome: "Recados do topo", altura: 1, escura: true },
  { id: "menu", nome: "Menu", altura: 1 },
  { id: "abertura", nome: "Capa", altura: 4 },
  { id: "prateleiras", nome: "Prateleiras", altura: 3 },
  { id: "rodape", nome: "Rodapé", altura: 2, escura: true },
];

export const VARIAVEIS: Record<string, string> = {
  pecas: "o número de peças no site",
};

export const PARTES: EscolhaDaLoja = {
  avisos: { frases: ["Importados premium direto da fonte", "Pronta entrega: sai no mesmo dia", "Envio para todo o Brasil", "Pedido pelo WhatsApp, sem cadastro"] },
  topo: { frase: "Direto da fonte. Direto pra você." },
  prateleiras: {
    fileiras: [{ titulo: "Pronta entrega", linha: "", botao: "Ver todos" }],
  },
  catalogo: { titulo: "Tudo da loja", linha: "{pecas} peças na vitrine." },
  nao_achou: {
    titulo: "Página não encontrada",
    linha: "O endereço mudou ou a peça saiu da vitrine. Comece pelo catálogo.",
    busca: "Procure pelo nome da peça",
    print: "Não achou a sua?",
    botao: "Chame no WhatsApp",
    vitrine: "Na vitrine agora",
  },
  rodape: { email: "", cnpj: "", facebook: "" },
};
