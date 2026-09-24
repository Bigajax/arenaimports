/**
 * IMPORTAR YUPOO — os álbuns dos fornecedores viram peças do catálogo
 *
 * A Arena compra de fornecedores que publicam o catálogo em álbuns do
 * Yupoo (<loja>.x.yupoo.com): um álbum por modelo, com o nome do modelo
 * e os tamanhos no título, em chinês misturado com o nome da marca. Este
 * script lê a lista de álbuns de cada loja, abre cada álbum, baixa as
 * três primeiras fotos (são as de estúdio, as que interessam), limpa o
 * título (fica marca + modelo + referência, sem o chinês) e escreve a
 * peça em data/catalogo.json, sob encomenda e sem preço: o preço e o
 * "em mãos" o Luiz marca no painel.
 *
 * Lojas com senha: o Yupoo confere a senha no cookie `indexlockcode`.
 * As fotos exigem o Referer da loja para baixar.
 *
 * As FONTES ficam na lista abaixo (loja, senha, categoria, quantas).
 *
 *   node scripts/importar-yupoo.mjs             # tudo da lista
 *   node scripts/importar-yupoo.mjs funny1 20   # só uma loja, 20 álbuns
 *   node scripts/importar-yupoo.mjs --completar # as peças já importadas com
 *                                                 menos de 4 fotos ganham as
 *                                                 que faltam, do mesmo álbum
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const FONTES = [
  { loja: "funny1", senha: null, categoria: "sneakers", quantas: 12 },
  { loja: "xiaowuhualin", senha: null, categoria: "sneakers", quantas: 10 },
  { loja: "1998shoe", senha: "HJH001077", categoria: "sneakers", quantas: 8 },
  { loja: "dachang88", senha: null, categoria: "chuteiras", quantas: 12 },
  { loja: "qiumishijie", senha: null, categoria: "chuteiras", quantas: 10 },
  { loja: "yao1168", senha: null, categoria: "chuteiras", quantas: 8 },
  { loja: "hzh890", senha: "888999", categoria: "bolsas", quantas: 30 },
  /* uma COLEÇÃO (categoria dentro da loja), não a lista inteira; as camisas
     têm 2 fotos por álbum (frente e costas) */
  { loja: "wanfing", senha: null, colecao: "3852491", categoria: "camisas", quantas: 30, minFotos: 2, paginaInicial: 1 },
];

/* a loja pediu quatro: frente, cima, lado e solado */
const FOTOS_POR_PECA = 4;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const CATALOGO = path.join(process.cwd(), "data", "catalogo.json");
const PASTA = path.join(process.cwd(), "public", "produtos");

const completar = process.argv.includes("--completar");
const [soLoja, soQuantas] = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/* ---------- a marca pelo nome ---------- */
const MARCAS = [
  ["air jordan", "Jordan"], ["jordan", "Jordan"], ["nike", "Nike"], ["adidas", "Adidas"], ["yeezy", "Adidas"], ["new balance", "New Balance"], ["nb ", "New Balance"],
  ["puma", "Puma"], ["asics", "Asics"], ["mizuno", "Mizuno"], ["vans", "Vans"], ["converse", "Converse"], ["salomon", "Salomon"], ["on cloud", "On"], ["hoka", "Hoka"],
  ["louis vuitton", "Louis Vuitton"], ["lv ", "Louis Vuitton"], ["gucci", "Gucci"], ["dior", "Dior"], ["chanel", "Chanel"], ["prada", "Prada"], ["ysl", "Saint Laurent"], ["saint laurent", "Saint Laurent"],
  ["miu miu", "Miu Miu"], ["fendi", "Fendi"], ["hermes", "Hermès"], ["hermès", "Hermès"], ["balenciaga", "Balenciaga"], ["coach", "Coach"], ["burberry", "Burberry"], ["celine", "Celine"], ["loewe", "Loewe"], ["bottega", "Bottega Veneta"],
  ["ugg", "UGG"], ["golden goose", "Golden Goose"], ["amiri", "Amiri"], ["off-white", "Off-White"], ["off white", "Off-White"], ["bape", "Bape"],
];
function marcaDe(nome) {
  const n = ` ${nome.toLowerCase()} `;
  for (const [chave, marca] of MARCAS) if (n.includes(chave)) return marca;
  return null;
}

/* ---------- o título limpo ----------
   "耐克刺客十七代C罗战靴内置全气垫白紫黑防水针织FG足球鞋Nike AIR Zoom
   Mercurial Vapor 17 Elite XXVI FG35-45" vira nome "Nike Air Zoom
   Mercurial Vapor 17 Elite XXVI FG", cores "branco, roxo e preto",
   tamanhos 35 a 45. O chinês só serve para duas coisas antes de sair:
   a cor (é onde o fornecedor diz a cor) e a marca escrita em chinês. */
const CORES = { "白": "branco", "黑": "preto", "紫": "roxo", "粉": "rosa", "红": "vermelho", "蓝": "azul", "绿": "verde", "黄": "amarelo", "橙": "laranja", "金": "dourado", "银": "prata", "灰": "cinza", "棕": "marrom", "米": "creme", "青": "verde-água", "咖": "café", "卡其": "cáqui", "荧光": "neon" };
const MARCAS_CN = [["香奈儿", "Chanel"], ["路易威登", "Louis Vuitton"], ["古驰", "Gucci"], ["古奇", "Gucci"], ["迪奥", "Dior"], ["普拉达", "Prada"], ["爱马仕", "Hermès"], ["巴黎世家", "Balenciaga"], ["芬迪", "Fendi"], ["圣罗兰", "Saint Laurent"], ["缪缪", "Miu Miu"], ["蔻驰", "Coach"], ["博柏利", "Burberry"], ["思琳", "Celine"], ["罗意威", "Loewe"], ["葆蝶家", "Bottega Veneta"], ["耐克", "Nike"], ["阿迪达斯", "Adidas"], ["阿迪", "Adidas"], ["乔丹", "Jordan"], ["新百伦", "New Balance"], ["彪马", "Puma"], ["亚瑟士", "Asics"], ["万斯", "Vans"], ["匡威", "Converse"]];
const MODELOS_CN = [["刺客", "Mercurial"], ["猎鹰", "Predator"], ["传奇", "Tiempo"], ["暗煞", "Phantom"], ["女包", "bolsa"], ["男包", "bolsa"], ["包包", "bolsa"], ["斜挎包", "bolsa transversal"], ["手提包", "bolsa de mão"], ["双肩包", "mochila"], ["钱包", "carteira"]];
const CN = /[㐀-鿿＀-￯　-〿]/;

function limparTitulo(bruto) {
  let t = bruto.replace(/\s+/g, " ").trim();

  /* a cor: a corrida de caracteres de cor do chinês */
  const cores = [];
  for (const m of t.matchAll(/(?:卡其|荧光|[白黑紫粉红蓝绿黄橙金银灰棕米青咖])+/g)) {
    let s = m[0];
    while (s.length) {
      const dupla = s.slice(0, 2);
      if (CORES[dupla]) { cores.push(CORES[dupla]); s = s.slice(2); continue; }
      if (CORES[s[0]]) cores.push(CORES[s[0]]);
      s = s.slice(1);
    }
  }
  const coresUnicas = [...new Set(cores)].slice(0, 3);

  /* a marca e o modelo em chinês viram latim, só se o latim não estiver lá */
  for (const [cn, latim] of [...MARCAS_CN, ...MODELOS_CN]) {
    if (t.includes(cn)) {
      t = t.replace(cn, t.toLowerCase().includes(latim.toLowerCase()) ? " " : ` ${latim} `);
    }
  }

  /* os tamanhos: "尺码：36 36.5 ... 45", ou a faixa colada "FG35-45", "IC39-45" */
  const tamanhos = [];
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
    /* a faixa costuma vir duas vezes (no chinês e colada no FG): sai toda */
    t = t.replace(/(3[0-9]|4[0-8])\s*[-–]\s*(3[5-9]|4[0-9]|5[0-2])(?!\d)/g, " ");
  }

  /* a referência do fornecedor */
  let ref = null;
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

  /* fora o chinês, os códigos internos do fornecedor, os preços dele e as sobras */
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
  /* o começo do título é lixo de fornecedor (preço "C30", "💰100", "27 A FG") até
     a primeira palavra de marca; se há marca no título, corta antes dela */
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
  const MANTER = new Set(["FG", "TF", "AG", "MG", "SG", "IC", "OG", "SB", "ELITE", "PRO", "LOW", "HIGH", "MID", "RETRO", "XXVI", "NB", "LV", "YSL", "UGG", "CDG", "AJ", "GTX", "ACG", "SP", "LX", "DX", "VR3", "II", "III", "IV", "V", "VI", "XI"]);
  const nome = t
    .split(" ")
    .map((w) => (w.length > 2 && w === w.toUpperCase() && !/\d/.test(w) && !MANTER.has(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .join(" ")
    .replace(/\b([Nn]ike )?([Aa]ir )?[Ff]orce ?1\b/g, "Air Force 1");
  return { nome, ref, tamanhos: [...new Set(tamanhos)], cores: coresUnicas };
}

/* ---------- a camisa de time ----------
   "2026/27 Roma Away Jerseys S-XXXXL" → "Camisa Roma 2026/27 visitante",
   tamanhos P a 4G. Home é titular, Away é visitante, Third é a terceira. */
const TAM_CAMISA = { S: "P", M: "M", L: "G", XL: "GG", XXL: "XGG", XXXL: "3G", XXXXL: "4G", "2XL": "XGG", "3XL": "3G", "4XL": "4G" };
function lerCamisa(bruto) {
  let t = bruto.replace(/[\u3400-\u9fff\uff00-\uffef]+/g, " ").replace(/\s+/g, " ").trim();
  const tamanhos = [];
  const mFaixa = t.match(/\b(S|M|L|XL|XXL|2XL)\s*[-–~]\s*(L|XL|XXL|XXXL|XXXXL|2XL|3XL|4XL)\b/i);
  if (mFaixa) {
    const ordem = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];
    const norm = (x) => x.toUpperCase().replace("2XL", "XXL").replace("3XL", "XXXL").replace("4XL", "XXXXL");
    const de = ordem.indexOf(norm(mFaixa[1])), ate = ordem.indexOf(norm(mFaixa[2]));
    if (de >= 0 && ate >= de) for (const s of ordem.slice(de, ate + 1)) tamanhos.push(TAM_CAMISA[s]);
    t = t.replace(mFaixa[0], " ");
  }
  const temporada = t.match(/\b(20\d{2}\/\d{2}|20\d{2}-\d{2}|20\d{2})\b/)?.[1] ?? null;
  if (temporada) t = t.replace(temporada, " ");
  let versao = null;
  if (/\bhome\b/i.test(t)) versao = "titular";
  else if (/\baway\b/i.test(t)) versao = "visitante";
  else if (/\bthird\b/i.test(t)) versao = "terceira";
  else if (/\bfourth\b/i.test(t)) versao = "quarta";
  else if (/\bgoalkeeper|\bgk\b/i.test(t)) versao = "goleiro";
  const jogador = /\bplayer\b/i.test(t) ? " versão jogador" : "";
  const manga = /\blong sleeve|\bLS\b/i.test(t) ? " manga longa" : "";
  const time = t
    .replace(/\b(home|away|third|fourth|goalkeeper|gk|jerseys?|jersey|shirts?|kit|player|version|fans?|long sleeve|LS|soccer|football|men'?s?|women'?s?|kids?)\b/gi, " ")
    .replace(/[|｜“”"#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const nome = `Camisa ${time}${temporada ? ` ${temporada}` : ""}${versao ? ` ${versao}` : ""}${jogador}${manga}`.replace(/\s+/g, " ").trim();
  return { nome, tamanhos };
}

/* ---------- a rede ---------- */
async function pegar(url, cookie) {
  const r = await fetch(url, { headers: { "User-Agent": UA, ...(cookie ? { Cookie: cookie } : {}) } });
  if (!r.ok) throw new Error(`${r.status} em ${url}`);
  return r.text();
}
async function baixar(url, referer) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Referer: referer } });
  if (!r.ok) throw new Error(`${r.status} foto ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

function listarAlbuns(html) {
  /* dois layouts: album__main (title no <a>) e album3__main (title "1", o
     nome vem da página do álbum) */
  const vistos = new Map();
  const re = /<a[^>]*class="[^"]*album\d?__main[^"]*"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const id = tag.match(/albums\/(\d+)/)?.[1];
    if (!id || vistos.has(id)) continue;
    const titulo = tag.match(/title="([^"]*)"/)?.[1] ?? "";
    /* o número de fotos vem logo depois, no album__photonumber */
    const depois = html.slice(m.index, m.index + 4000);
    const fotos = Number(depois.match(/album__photonumber">(\d+)/)?.[1] ?? "0");
    vistos.set(id, { id, titulo: titulo === "1" ? "" : desHtml(titulo), fotos });
  }
  /* intercala os títulos: uma loja de bolsas lista 68 "Chanel" e depois 52
     "lv", e pegar os 30 primeiros daria 30 Chanel */
  const grupos = new Map();
  for (const a of vistos.values()) {
    const chave = a.titulo.toLowerCase();
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(a);
  }
  const filas = [...grupos.values()];
  const saida = [];
  for (let i = 0; filas.some((f) => f.length > i); i++) for (const f of filas) if (f[i]) saida.push(f[i]);
  return saida;
}
function lerAlbum(html) {
  const titulo = desHtml(html.match(/gallerytitle">([^<]*)/)?.[1] ?? html.match(/<title>([^<|]*)/)?.[1] ?? "");
  const fotos = [...new Set([...html.matchAll(/data-origin-src="([^"]+)"/g)].map((x) => x[1]))];
  return { titulo, fotos };
}
const desHtml = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const slugar = (t) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- as fotos de uma peça ----------
   As fotos de estúdio vêm em ordem fixa (sola, lado, cima, ...), mas a
   ordem muda de fornecedor para fornecedor. A capa é a foto em que o
   produto ocupa mais área depois de aparar o fundo: é a vista de lado,
   quase sempre. Bolsa e camisa são o contrário: a foto que mais enche o
   quadro é o close da etiqueta, e a peça inteira é a que sobra mais fundo
   em volta. As outras seguem na ordem do álbum, até quatro. */
async function escolherFotos(fotos, base, loja, albumId, categoria, nome, minFotos) {
  const fundo = categoria === "bolsas" || categoria === "camisas";
  const candidatas = [];
  for (const [k, url] of fotos.slice(0, fundo ? 9 : FOTOS_POR_PECA + 2).entries()) {
    try {
      const original = await baixar(url, `${base}/`);
      const processada = await sharp(original).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const meta = await sharp(processada).metadata();
      let area = 0;
      try {
        const aparada = await sharp(processada).trim({ threshold: 70 }).toBuffer({ resolveWithObject: true });
        const r = aparada.info.width / aparada.info.height;
        /* proporção de vista de lado: fora dela (sola, vista de cima) não vira capa */
        area = r >= 1.25 && r <= 2.3 ? aparada.info.width * aparada.info.height : 1;
      } catch {
        area = 0;
      }
      const cinza = await sharp(processada).resize(60, 60, { fit: "fill" }).greyscale().raw().toBuffer();
      let claros = 0;
      for (const v of cinza) if (v > 170) claros++;
      candidatas.push({ k, processada, meta, area, claros: claros / cinza.length });
    } catch (e) {
      console.log(`  foto falhou (${albumId}/${k + 1}): ${e.message}`);
    }
  }
  if (candidatas.length < Math.min(2, minFotos)) return null;
  const capa = fundo ? candidatas.reduce((m, c) => (c.claros > m.claros ? c : m), candidatas[0]) : candidatas.reduce((m, c) => (c.area > m.area ? c : m), candidatas[0]);
  const escolhidas = [capa, ...candidatas.filter((c) => c !== capa)].slice(0, FOTOS_POR_PECA);
  const imagens = [];
  for (const [k, c] of escolhidas.entries()) {
    const mini = await sharp(c.processada).resize(12).blur(2).webp({ quality: 40 }).toBuffer();
    const arquivo = `yp-${loja}-${albumId}-${k + 1}.webp`;
    fs.writeFileSync(path.join(PASTA, arquivo), c.processada);
    imagens.push({ url: `/produtos/${arquivo}`, largura: c.meta.width ?? null, altura: c.meta.height ?? null, blur: `data:image/webp;base64,${mini.toString("base64")}`, alt: nome, ordem: k });
  }
  return imagens;
}

/* ---------- completar: as peças com menos de 4 fotos ---------- */
async function completarFotos() {
  const catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf8"));
  const senhaDe = new Map(FONTES.map((f) => [f.loja, f.senha]));
  let feitas = 0;
  for (const p of catalogo.produtos) {
    if (!p.yupoo || p.imagens.length >= FOTOS_POR_PECA) continue;
    const [loja, albumId] = p.yupoo.split("/");
    const base = `https://${loja}.x.yupoo.com`;
    const cookie = senhaDe.get(loja) ? `indexlockcode=${senhaDe.get(loja)}` : null;
    let album;
    try {
      album = lerAlbum(await pegar(`${base}/albums/${albumId}?uid=1`, cookie));
    } catch (e) {
      console.log(`  ${p.slug}: álbum falhou (${e.message})`);
      continue;
    }
    if (album.fotos.length <= p.imagens.length) continue;
    const imagens = await escolherFotos(album.fotos, base, loja, albumId, p.categoria_slug?.startsWith("chuteiras") ? "chuteiras" : p.categoria_slug, p.nome, 2);
    if (!imagens) continue;
    p.imagens = imagens;
    feitas++;
    console.log(`  ${p.nome}: ${imagens.length} fotos`);
    if (feitas % 10 === 0) fs.writeFileSync(CATALOGO, JSON.stringify(catalogo, null, 2) + "\n");
  }
  fs.writeFileSync(CATALOGO, JSON.stringify(catalogo, null, 2) + "\n");
  console.log(`${feitas} peças completadas`);
}

async function principal() {
  if (completar) return completarFotos();
  const catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf8"));
  fs.mkdirSync(PASTA, { recursive: true });
  const slugs = new Set(catalogo.produtos.map((p) => p.slug));
  const nomes = new Set(catalogo.produtos.map((p) => p.nome.toLowerCase()));
  const contagem = new Map();
  const jaImportados = new Set(catalogo.produtos.map((p) => p.yupoo).filter(Boolean));
  let maior = catalogo.produtos.reduce((max, p) => Math.max(max, Number(p.codigo.replace(/\D/g, "")) || 0), 0);
  let ordem = catalogo.produtos.reduce((max, p) => Math.max(max, p.ordem), 0) + 1;

  const fontes = FONTES.filter((f) => !soLoja || f.loja === soLoja).map((f) => ({ ...f, quantas: soQuantas ? Number(soQuantas) : f.quantas }));
  let total = 0;

  for (const f of fontes) {
    const base = `https://${f.loja}.x.yupoo.com`;
    const cookie = f.senha ? `indexlockcode=${f.senha}` : null;
    console.log(`\n${f.loja} (${f.categoria}, até ${f.quantas})`);
    let feitos = 0;
    const minFotos = f.minFotos ?? FOTOS_POR_PECA;
    const rota = f.colecao ? `${base}/collections/${f.colecao}?uid=1` : `${base}/albums?uid=1`;
    for (let pagina = f.paginaInicial ?? 1; pagina <= (f.paginaInicial ?? 1) + 7 && feitos < f.quantas; pagina++) {
      let lista;
      try {
        lista = listarAlbuns(await pegar(`${rota}&page=${pagina}`, cookie));
      } catch (e) {
        console.log(`  lista falhou: ${e.message}`);
        break;
      }
      if (!lista.length) break;
      for (const a of lista) {
        if (feitos >= f.quantas) break;
        const chave = `${f.loja}/${a.id}`;
        if (jaImportados.has(chave)) continue;
        if (a.fotos && a.fotos < minFotos) continue;
        /* álbum sem título de verdade (".") não vira peça */
        if (a.titulo !== "" && a.titulo.replace(/[.\s]/g, "").length < 3) continue;
        let album;
        try {
          album = lerAlbum(await pegar(`${base}/albums/${a.id}?uid=1`, cookie));
        } catch (e) {
          console.log(`  álbum ${a.id} falhou: ${e.message}`);
          continue;
        }
        const bruto = album.titulo || a.titulo;
        const lido = limparTitulo(bruto);
        const { ref, tamanhos, cores } = lido;
        let nome = lido.nome;
        const marca = marcaDe(nome) ?? marcaDe(bruto);
        /* título que é só a marca ("Chanel", "lv"): a peça vira "Bolsa Chanel" */
        if (f.categoria === "bolsas" && (!nome || nome.split(" ").length <= 2)) nome = `Bolsa ${marca ?? nome ?? "de grife"}`.trim();
        if (f.categoria === "camisas") {
          const camisa = lerCamisa(bruto);
          nome = camisa.nome;
          tamanhos.splice(0, tamanhos.length, ...camisa.tamanhos);
        }
        if (cores.length && !new RegExp(cores[0], "i").test(nome)) {
          nome = `${nome} ${cores.length === 1 ? cores[0] : `${cores.slice(0, -1).join(", ")} e ${cores[cores.length - 1]}`}`;
        }
        if (nomes.has(nome.toLowerCase())) {
          const n = (contagem.get(nome.toLowerCase()) ?? 1) + 1;
          contagem.set(nome.toLowerCase(), n);
          nome = ref ? `${nome} ${ref.split(" ")[0]}` : `${nome} ${String(n).padStart(2, "0")}`;
        }
        if (!nome || nome.length < 3 || album.fotos.length < minFotos) {
          console.log(`  pulei ${a.id}: "${bruto.slice(0, 50)}" (${album.fotos.length} fotos)`);
          continue;
        }
        let slug = slugar(`${nome} ${ref ?? ""}`);
        let n = 2;
        while (slugs.has(slug)) slug = `${slugar(nome)}-${n++}`;

        const imagens = await escolherFotos(album.fotos, base, f.loja, a.id, f.categoria, nome, minFotos);
        if (!imagens) continue;

        maior++;
        catalogo.produtos.push({
          id: `p-yp-${f.loja}-${a.id}`,
          codigo: `AR-${String(maior).padStart(4, "0")}`,
          nome,
          slug,
          descricao: ref ? `Ref. ${ref}` : null,
          marca,
          preco: null,
          preco_promocional: null,
          categoria_slug: f.categoria,
          tamanhos,
          cores,
          destaque: false,
          pronta_entrega: false,
          ativo: true,
          ordem: ordem++,
          imagens,
          yupoo: chave,
        });
        slugs.add(slug);
        nomes.add(nome.toLowerCase());
        jaImportados.add(chave);
        feitos++;
        total++;
        console.log(`  + ${nome}${ref ? ` (${ref})` : ""} · ${marca ?? "sem marca"} · ${tamanhos.length} tam`);
      }
    }
    fs.writeFileSync(CATALOGO, JSON.stringify(catalogo, null, 2) + "\n");
  }
  console.log(`\n${total} peças importadas → data/catalogo.json`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
