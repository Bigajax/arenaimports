/**
 * O YUPOO PELO PAINEL: o André cola o link do álbum do fornecedor e as
 * fotos entram na peça.
 *
 * O Yupoo não deixa salvar a foto pelo celular (a página cobre a imagem
 * e o navegador não oferece "salvar"), e a foto não abre fora do site
 * sem o Referer da loja. Então quem baixa é o servidor: lê a página do
 * álbum, acha as fotos originais (`data-origin-src`), baixa com o
 * Referer e devolve ao painel já no formato do catálogo. O título do
 * álbum vem junto, limpo do chinês, com a marca, a cor e os tamanhos:
 * o mesmo tratamento de scripts/importar-yupoo.mjs, aqui em TypeScript
 * para a rota.
 *
 * Lojas com senha: o Yupoo confere a senha no cookie `indexlockcode`.
 * As senhas conhecidas ficam em SENHAS; uma loja nova com senha entra
 * aqui (ou o André passa a senha no próprio link: `?senha=...`).
 */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

export const SENHAS: Record<string, string> = {
  "1998shoe": "HJH001077",
  sneakerheads: "888888",
  hzh890: "888999",
};

export type Album = { loja: string; id: string; base: string; titulo: string; fotos: string[] };

/* "https://funny1.x.yupoo.com/albums/123456?uid=1" → loja funny1, álbum 123456.
   Aceita também o link curto de compartilhar (x.yupoo.com/photos/loja/albums/id). */
export function lerLink(bruto: string): { loja: string; id: string; senha: string | null } | null {
  const texto = bruto.trim();
  /* com ou sem https, com ou sem o x., colado no meio de uma mensagem */
  const m = texto.match(/([a-z0-9_-]+)\.x\.yupoo\.com\/albums\/(\d+)/i) ?? texto.match(/yupoo\.com\/photos\/([a-z0-9_-]+)\/albums\/(\d+)/i);
  if (!m) return null;
  const senha = texto.match(/[?&]senha=([^&\s]+)/)?.[1] ?? null;
  return { loja: m[1].toLowerCase(), id: m[2], senha };
}

async function pegar(url: string, cookie: string | null) {
  const r = await fetch(url, { headers: { "User-Agent": UA, ...(cookie ? { Cookie: cookie } : {}) }, cache: "no-store" });
  if (!r.ok) throw new Error(`O Yupoo respondeu ${r.status} para esse álbum.`);
  return r.text();
}

export async function baixarFoto(url: string, referer: string): Promise<Buffer> {
  const r = await fetch(url, { headers: { "User-Agent": UA, Referer: referer }, cache: "no-store" });
  if (!r.ok) throw new Error(`A foto não baixou (${r.status}).`);
  return Buffer.from(await r.arrayBuffer());
}

const desHtml = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

export async function lerAlbum(loja: string, id: string, senha: string | null): Promise<Album> {
  const base = `https://${loja}.x.yupoo.com`;
  const chave = senha ?? SENHAS[loja] ?? null;
  const html = await pegar(`${base}/albums/${id}?uid=1`, chave ? `indexlockcode=${chave}` : null);
  if (/indexlockcode|album__lock|需要密码|输入密码/i.test(html) && !/data-origin-src/.test(html)) {
    throw new Error("Esse fornecedor pede senha. Cola o link assim: <link>?senha=SENHA");
  }
  const titulo = desHtml(html.match(/gallerytitle">([^<]*)/)?.[1] ?? html.match(/<title>([^<|]*)/)?.[1] ?? "");
  const fotos = [...new Set([...html.matchAll(/data-origin-src="([^"]+)"/g)].map((x) => x[1]))].map((u) => (u.startsWith("//") ? `https:${u}` : u));
  if (!fotos.length) throw new Error("Não achei fotos nesse álbum. Confere se o link é o do álbum (termina em /albums/número).");
  return { loja, id, base, titulo, fotos };
}

/* ---------- o título limpo ----------
   "耐克刺客十七代C罗战靴内置全气垫白紫黑防水针织FG足球鞋Nike AIR Zoom
   Mercurial Vapor 17 Elite XXVI FG35-45" vira nome "Nike Air Zoom
   Mercurial Vapor 17 Elite XXVI FG", cores "branco, roxo e preto",
   tamanhos 35 a 45. */
const MARCAS: [string, string][] = [
  ["air jordan", "Jordan"], ["jordan", "Jordan"], ["nike", "Nike"], ["adidas", "Adidas"], ["yeezy", "Adidas"], ["new balance", "New Balance"], ["nb ", "New Balance"],
  ["puma", "Puma"], ["asics", "Asics"], ["mizuno", "Mizuno"], ["vans", "Vans"], ["converse", "Converse"], ["salomon", "Salomon"], ["on cloud", "On"], ["hoka", "Hoka"],
  ["louis vuitton", "Louis Vuitton"], ["lv ", "Louis Vuitton"], ["gucci", "Gucci"], ["dior", "Dior"], ["chanel", "Chanel"], ["prada", "Prada"], ["ysl", "Saint Laurent"], ["saint laurent", "Saint Laurent"],
  ["miu miu", "Miu Miu"], ["fendi", "Fendi"], ["hermes", "Hermès"], ["hermès", "Hermès"], ["balenciaga", "Balenciaga"], ["coach", "Coach"], ["burberry", "Burberry"], ["celine", "Celine"], ["loewe", "Loewe"], ["bottega", "Bottega Veneta"],
  ["ugg", "UGG"], ["golden goose", "Golden Goose"], ["amiri", "Amiri"], ["off-white", "Off-White"], ["off white", "Off-White"], ["bape", "Bape"],
];
export function marcaDe(nome: string): string | null {
  const n = ` ${nome.toLowerCase()} `;
  for (const [chave, marca] of MARCAS) if (n.includes(chave)) return marca;
  return null;
}
const CORES: Record<string, string> = { 白: "branco", 黑: "preto", 紫: "roxo", 粉: "rosa", 红: "vermelho", 蓝: "azul", 绿: "verde", 黄: "amarelo", 橙: "laranja", 金: "dourado", 银: "prata", 灰: "cinza", 棕: "marrom", 米: "creme", 青: "verde-água", 咖: "café", 卡其: "cáqui", 荧光: "neon" };
const MARCAS_CN: [string, string][] = [["香奈儿", "Chanel"], ["路易威登", "Louis Vuitton"], ["古驰", "Gucci"], ["古奇", "Gucci"], ["迪奥", "Dior"], ["普拉达", "Prada"], ["爱马仕", "Hermès"], ["巴黎世家", "Balenciaga"], ["芬迪", "Fendi"], ["圣罗兰", "Saint Laurent"], ["缪缪", "Miu Miu"], ["蔻驰", "Coach"], ["博柏利", "Burberry"], ["思琳", "Celine"], ["罗意威", "Loewe"], ["葆蝶家", "Bottega Veneta"], ["耐克", "Nike"], ["阿迪达斯", "Adidas"], ["阿迪", "Adidas"], ["乔丹", "Jordan"], ["新百伦", "New Balance"], ["彪马", "Puma"], ["亚瑟士", "Asics"], ["万斯", "Vans"], ["匡威", "Converse"]];
const MODELOS_CN: [string, string][] = [["刺客", "Mercurial"], ["猎鹰", "Predator"], ["传奇", "Tiempo"], ["暗煞", "Phantom"], ["女包", "bolsa"], ["男包", "bolsa"], ["包包", "bolsa"], ["斜挎包", "bolsa transversal"], ["手提包", "bolsa de mão"], ["双肩包", "mochila"], ["钱包", "carteira"]];
const MANTER = new Set(["FG", "TF", "AG", "MG", "SG", "IC", "OG", "SB", "ELITE", "PRO", "LOW", "HIGH", "MID", "RETRO", "XXVI", "NB", "LV", "YSL", "UGG", "CDG", "AJ", "GTX", "ACG", "SP", "LX", "DX", "VR3", "II", "III", "IV", "V", "VI", "XI"]);

export function limparTitulo(bruto: string): { nome: string; ref: string | null; tamanhos: string[]; cores: string[] } {
  let t = bruto.replace(/\s+/g, " ").trim();

  const cores: string[] = [];
  for (const m of t.matchAll(/(?:卡其|荧光|[白黑紫粉红蓝绿黄橙金银灰棕米青咖])+/g)) {
    let s = m[0];
    while (s.length) {
      const dupla = s.slice(0, 2);
      if (CORES[dupla]) {
        cores.push(CORES[dupla]);
        s = s.slice(2);
        continue;
      }
      if (CORES[s[0]]) cores.push(CORES[s[0]]);
      s = s.slice(1);
    }
  }
  const coresUnicas = [...new Set(cores)].slice(0, 3);

  for (const [cn, latim] of [...MARCAS_CN, ...MODELOS_CN]) {
    if (t.includes(cn)) t = t.replace(cn, t.toLowerCase().includes(latim.toLowerCase()) ? " " : ` ${latim} `);
  }

  const tamanhos: string[] = [];
  const mTam = t.match(/(?:尺码|码数|码|sizes?)[:：]?\s*([\d.\s\-–/,]+)/i);
  if (mTam) {
    for (const n of mTam[1].split(/[\s,/]+/)) {
      const v = Number(n);
      if (Number.isFinite(v) && v >= 30 && v <= 50) tamanhos.push(String(v));
    }
    t = t.replace(mTam[0], " ");
  }
  const mFaixa = t.match(/(3[0-9]|4[0-8])\s*[-–]\s*(3[5-9]|4[0-9]|5[0-2])(?!\d)/);
  if (mFaixa) {
    if (!tamanhos.length) for (let k = Number(mFaixa[1]); k <= Number(mFaixa[2]); k++) tamanhos.push(String(k));
    t = t.replace(/(3[0-9]|4[0-8])\s*[-–]\s*(3[5-9]|4[0-9]|5[0-2])(?!\d)/g, " ");
  }

  let ref: string | null = null;
  const mRef = t.match(/(?:货号|编码|编号|款号|型号|art\.?|ref\.?)[:：]?\s*([A-Z0-9][A-Z0-9\- ]{3,16})/i);
  if (mRef) {
    ref = mRef[1].trim();
    t = t.replace(mRef[0], " ");
  } else {
    const mCod = t.match(/\b([A-Z]{1,3}\d{3,5}[- ]\d{3})\b/) ?? t.match(/\b(VN[A-Z0-9]{8,12})\b/);
    if (mCod) {
      ref = mCod[1];
      t = t.replace(mCod[0], " ");
    }
  }

  t = t
    .replace(/[㐀-鿿＀-￯　-〿]+/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, " ")
    .replace(/ID[:：]\S+/gi, " ")
    .replace(/\b(HL|ID)\d{7,}\b/gi, " ")
    .replace(/\b\d{2,3}B\b/g, " ")
    .replace(/\/?arrived\b/gi, " ")
    .replace(/#\S*/g, " ")
    .replace(/[|｜“”"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const idxMarca = (() => {
    const baixo = ` ${t.toLowerCase()} `;
    let melhor = -1;
    for (const [chave] of MARCAS) {
      const i = baixo.indexOf(` ${chave.trim()}`);
      if (i >= 0 && (melhor < 0 || i < melhor)) melhor = i;
    }
    return melhor;
  })();
  if (idxMarca > 0 && idxMarca < 24) t = t.slice(idxMarca).trim();
  t = t
    .replace(/^(?:[\d.,]+|C\d+|3D|A|FG|TF|IC|AG|SG|MG|Pro)\s+/i, "")
    .replace(/^(?:[\d.,]+|C\d+|3D|A|FG|TF|IC|AG|SG|MG|Pro)\s+/i, "")
    .replace(/\b(fg|tf|ag|mg|sg|ic|elite|pro|low|high|mid|og|retro|sb|xxvi|gtx|acg)\b/gi, (m) => m.toUpperCase())
    .replace(/\s+/g, " ")
    .replace(/^[\s\-:：,.·]+|[\s\-:：,.·]+$/g, "")
    .trim();
  const nome = t
    .split(" ")
    .map((w) => (w.length > 2 && w === w.toUpperCase() && !/\d/.test(w) && !MANTER.has(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .join(" ")
    .replace(/\b([Nn]ike )?([Aa]ir )?[Ff]orce ?1\b/g, "Air Force 1");
  return { nome, ref, tamanhos: [...new Set(tamanhos)], cores: coresUnicas };
}
