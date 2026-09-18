/**
 * Dados fixos do negócio. O que a marca edita no dia a dia (aviso do
 * topo, frase do hero, WhatsApp) vive na tabela `config` e é editável em
 * /painel/config — não aqui.
 */

/**
 * Endereço público do site — descoberto sozinho, sem precisar configurar
 * nada. Na Vercel ele cai no domínio do próprio projeto; em casa, em
 * localhost. Só vale a pena definir NEXT_PUBLIC_SITE_URL quando a loja
 * tiver domínio próprio.
 *
 * Uma variável de ambiente pode existir e estar VAZIA — e aí `??` não
 * salva, porque `""` não é `null`. Aqui todo valor passa por trim, só
 * entra se tiver conteúdo, e ganha protocolo se vier sem.
 */
function resolverUrl(): string {
  const candidatos = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_URL,
  ];

  for (const bruto of candidatos) {
    const valor = bruto?.trim();
    if (!valor) continue;
    const comProtocolo = /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
    try {
      return new URL(comProtocolo).origin;
    } catch {
      // valor malformado: tenta o próximo em vez de derrubar o build
    }
  }

  return "http://localhost:3000";
}

export const site = {
  nome: "Arena Imports Floripa",
  marca: "arena",
  posicionamento: "Importados premium direto da fonte: chuteiras, tênis de corrida, sneakers e bolsas de grife",
  /* o Google acha a loja em São José, na Grande Florianópolis */
  cidade: "São José, SC",
  /* o WhatsApp das artes do feed: (48) 98422-0326. Na prévia ele não é
     usado: ver PREVIA. */
  whatsapp: "5548984220326",
  instagram: "arenaimportsfloripa",
  url: resolverUrl(),
  endereco: "R. Gerôncio Thives, 528 · Barreiros, São José · SC",
  maps: "https://www.google.com/maps/search/?api=1&query=Arena+Imports+Floripa+R.+Ger%C3%B4ncio+Thives+528+Barreiros+S%C3%A3o+Jos%C3%A9+SC",
} as const;

/**
 * MODO PRÉVIA. Enquanto a vitrine é uma amostra, TODO botão de WhatsApp
 * aponta para o estúdio com a mesma mensagem. Quando a loja contratar:
 * PREVIA = null e o número acima passa a valer.
 */
export const PREVIA: { whatsapp: string; mensagem: string } | null = {
  whatsapp: "5544991246187",
  mensagem: "Oi! Vi a prévia da vitrine da Arena Imports Floripa e quero colocar no ar.",
};

/** Valores iniciais da tabela `config`. Sobrescritos pelo banco quando existirem. */
export const configPadrao: Record<string, string> = {
  whatsapp: site.whatsapp,
  instagram: site.instagram,
  cidade: site.cidade,
  /* frases separadas por "|": o cabeçalho reveza uma de cada vez */
  aviso_topo: "Importados premium direto da fonte | Loja física em São José, Grande Florianópolis | Envio para todo o Brasil | Pedido pelo WhatsApp, sem cadastro",
  frase_hero: "Seu jogo começa pelo que você calça.",
  endereco: site.endereco,
  horario: "",
};
