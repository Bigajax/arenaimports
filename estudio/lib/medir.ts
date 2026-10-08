import { site } from "@/data/site.config";

/**
 * A CONTAGEM DA ABA DESEMPENHO, do lado do navegador (02/10/2026 na Japa,
 * no molde em 06/10).
 *
 * Conta pessoas, nunca quem elas são: o visitante é um código aleatório
 * guardado no navegador (vt_v), sem nome, telefone nem IP. Tudo vai para
 * /api/evento por sendBeacon, que sobrevive à troca de página: o clique no
 * WhatsApp sai do site no mesmo instante.
 *
 * NÃO CONTA:
 *   - fora do endereço da loja (localhost, deploy de prévia da Vercel): os
 *     testes do estúdio sujariam os números do dono. O endereço da loja é
 *     o host de site.url (NEXT_PUBLIC_SITE_URL ou o domínio de produção da
 *     Vercel), com ou sem www. ?medir=on liga numa aba para testar,
 *     ?medir=off desliga.
 *   - o próprio dono: o painel marca o navegador dele (vt_dono) e daí em
 *     diante as visitas dele à própria loja ficam de fora.
 *   - navegador robô (navigator.webdriver); os robôs que se anunciam pelo
 *     user-agent a rota descarta.
 *
 * NA LOJA NOVA não há nada para trocar aqui: o host sai do site.url.
 */

export type Evento =
  | { tipo: "visita"; origem: string; post?: string | null }
  | { tipo: "peca"; produto: string }
  | { tipo: "whatsapp"; produto?: string | null; tamanho?: string | null; botao: "peca" | "geral" | "loja" | "procura" }
  | { tipo: "busca"; busca: string; resultados: number }
  | { tipo: "esgotado"; produto: string; tamanho: string };

/* o prefixo das chaves no navegador. A Japa usa "jp": trocar lá, ao levar
   este arquivo, para os visitantes que voltam continuarem sendo os mesmos */
const PREFIXO = "vt";
const chave = (nome: string) => `${PREFIXO}_${nome}`;

function hostsDaLoja(): string[] {
  try {
    const host = new URL(site.url).hostname.toLowerCase();
    if (/localhost|127\.0\.0\.1/.test(host)) return [];
    return host.startsWith("www.") ? [host, host.slice(4)] : [host, `www.${host}`];
  } catch {
    return [];
  }
}

function guardado(nome: string, onde: "local" | "sessao" = "local"): string | null {
  try {
    return (onde === "local" ? localStorage : sessionStorage).getItem(chave(nome));
  } catch {
    return null;
  }
}
function guardar(nome: string, valor: string, onde: "local" | "sessao" = "local") {
  try {
    (onde === "local" ? localStorage : sessionStorage).setItem(chave(nome), valor);
  } catch {
    /* aba anônima ou armazenamento bloqueado: segue sem guardar */
  }
}

export function podeMedir(): boolean {
  if (typeof window === "undefined") return false;
  const pedido = new URLSearchParams(location.search).get("medir");
  if (pedido === "on") guardar("medir", "on", "sessao");
  if (pedido === "off") guardar("medir", "off", "sessao");
  const forcado = guardado("medir", "sessao");
  if (forcado === "off") return false;
  if (navigator.webdriver) return false;
  if (guardado("dono") === "1") return false;
  return forcado === "on" || hostsDaLoja().includes(location.hostname.toLowerCase());
}

/** O painel chama ao abrir: deste navegador em diante, o dono não conta. */
export function marcarDono() {
  guardar("dono", "1");
}

function visitante(): string {
  let v = guardado("v");
  if (!v || !/^[a-z0-9]{8,24}$/.test(v)) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    v = Array.from(bytes, (b) => (b % 36).toString(36)).join("") + Date.now().toString(36).slice(-4);
    guardar("v", v);
  }
  return v;
}

export function medir(evento: Evento) {
  if (!podeMedir()) return;
  const corpo = JSON.stringify({ ...evento, visitante: visitante() });
  try {
    if (navigator.sendBeacon?.("/api/evento", new Blob([corpo], { type: "text/plain" }))) return;
  } catch {
    /* cai no fetch */
  }
  fetch("/api/evento", { method: "POST", body: corpo, keepalive: true }).catch(() => {});
}

/** De onde a pessoa veio, pelo endereço anterior e pelo ?utm_source. */
export function origemDaVisita(): string {
  const utm = new URLSearchParams(location.search).get("utm_source")?.toLowerCase() ?? "";
  const ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
  if (ref && ref.endsWith(location.hostname)) return "direto";
  const fonte = `${utm} ${ref}`;
  if (/instagram|\big\b/.test(fonte)) return "instagram";
  if (/facebook|fb\.|\bfb\b/.test(fonte)) return "facebook";
  if (/google/.test(fonte)) return "google";
  if (/whatsapp|wa\.me/.test(fonte)) return "whatsapp";
  return fonte.trim() ? "outro" : "direto";
}

/**
 * O post ou a campanha de onde veio o link: ?de=flack (o link curto gerado
 * na aba Desempenho) ou, sem ele, ?utm_campaign=tenis-nike (o anúncio).
 * Os dois caem na mesma conta: "qual post trouxe gente".
 */
export function postDaVisita(): string | null {
  const q = new URLSearchParams(location.search);
  const bruto = (q.get("de") ?? q.get("utm_campaign") ?? "").toLowerCase().trim();
  const limpo = bruto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return limpo ? limpo : null;
}

export const jaContouNestaAba = (nome: string) => guardado(nome, "sessao") === "1";
export const contarNestaAba = (nome: string) => guardar(nome, "1", "sessao");

/**
 * O clique no WhatsApp: a mensagem pronta já diz qual é a peça (o link
 * /produto/slug vai no texto) e qual o número ("Número: 41" ou "Calço: 41").
 */
export function lerPedido(href: string): { produto: string | null; tamanho: string | null; botao: "peca" | "geral" | "loja" | "procura" } {
  let texto = "";
  try {
    texto = new URL(href).searchParams.get("text") ?? "";
  } catch {
    /* link estranho: conta como atendimento geral */
  }
  const produto = texto.match(/\/produto\/([a-z0-9-]+)/)?.[1] ?? null;
  /* número (41, 38.5) ou letra em maiúscula (P, M, GG): "Tamanho: a confirmar"
     (a mensagem da Arena sem número escolhido) gravava o tamanho "a" (08/10/2026) */
  const tamanho = texto.match(/(?:Número|Numero|Tamanho|Calço|Calco): ([0-9]{1,3}(?:[.,]5)?|[A-Z]{1,3})(?![A-Za-z])/)?.[1] ?? null;
  const botao = produto ? "peca" : /Procur/.test(texto) ? "procura" : /passar na loja/.test(texto) ? "loja" : "geral";
  return { produto, tamanho, botao };
}
