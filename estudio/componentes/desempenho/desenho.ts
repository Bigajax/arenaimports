/**
 * OS GRÁFICOS DA ABA DESEMPENHO, desenhados à mão em SVG (sem biblioteca).
 *
 * Saíram da proposta do painel da Japa (rafaelrazeira.com.br/proposta/
 * japa-modas-painel.html) e seguem a mesma régua: uma série por gráfico,
 * a cor da loja (--pn-sol) só no que importa (a chamada no WhatsApp, o
 * post, o destaque) e a tinta como contexto; marcas finas, grade em fio
 * sólido, a ponta da barra arredondada e a base reta. Passar o dedo ou o
 * mouse mostra o número de cada ponto, e o teclado também (tab e setas).
 *
 * Desde 06/10 as cores saem das variáveis do painel (--pn-tinta, --pn-sol,
 * --pn-nevoa, --pn-fio), lidas na hora de desenhar: a loja que põe a cor
 * dela em --pn-sol vê os gráficos acompanharem. Antes eram fixas (o
 * vermelho da Japa) e não acompanhavam.
 *
 * Gráfico é exceção nesta aba: ficam o movimento (pessoas em linha e
 * chamadas em coluna, num gráfico só), o mapa das peças, a grade de
 * números e o mapa de horários. O resto é lista com filete e frase. A
 * manchete, a faixa de números, as notas de atenção e a evolução são
 * marcação React, montadas no servidor.
 *
 * Tudo sai do objeto DadosDesempenho que a página monta no servidor; os
 * totais são CONTADOS, nunca escritos à mão.
 */

export type DadosDesempenho = {
  dias: { d: string; pessoas: number; olharam: number; chamaram: number }[];
  posts: Record<number, string>;
  total: { pessoas: number; olharam: number; chamaram: number };
  antes: { pessoas: number; olharam: number; chamaram: number } | null;
  pecas: {
    nome: string;
    slug: string;
    foto: string | null;
    viram: number;
    chamaram: number;
  }[];
  links: { nome: string; pessoas: number; chamaram: number }[];
  origem: { rotulo: string; pessoas: number; chamaram: number }[];
  /** de que cidade vieram (07/10), as maiores primeiro; vazio fora da Vercel */
  cidades: { nome: string; pessoas: number; chamaram: number }[];
  /** 7 dias (seg a dom) x 8 faixas de 3 horas */
  grade: number[][];
  buscas: { termo: string; pessoas: number }[];
  numeros: { peca: string; grade: { tamanho: string; pessoas: number }[] }[];
  esgotados: { peca: string; tamanho: string; pessoas: number }[];
  volta: {
    novos: number;
    voltaram: number;
    chamaram_novos: number;
    chamaram_voltaram: number;
  };
  periodo: number;
  /** as duas contagens que o central manda mesmo travada; só o esqueleto do estoque usa */
  atencaoFechada?: { buscas_pessoas: number; esgotados_pessoas: number } | null;
};

const NS = "http://www.w3.org/2000/svg";
const MESES = [
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
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_EXTENSO = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
];

/* os ícones das origens: traço simples, desenhados, nunca a logo da marca */
const ICONES_ORIGEM: Record<string, string> = {
  Instagram:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor"/>',
  Google: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.6-4.6"/>',
  Facebook:
    '<path d="M14.5 8H17V4.5h-2.5A4 4 0 0 0 10.5 8.5V11H8v3.5h2.5V20h3.5v-5.5h2.6l.6-3.5H14V9a1 1 0 0 1 .5-1z"/>',
  WhatsApp: '<path d="M4.5 19.5l1.4-3.8A8 8 0 1 1 8.3 18.1L4.5 19.5z"/>',
  "Link direto":
    '<path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1-1"/>',
  "Outros sites":
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5a13 13 0 0 1 0 17M12 3.5a13 13 0 0 0 0 17"/>',
};

type Linha = string | { t: string; k: string };

const br = (v: number) => v.toLocaleString("pt-BR");
const pct = (v: number, casas: number) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }) + "%";
const plural = (n: number, um: string, varios: string) =>
  n === 1 ? um : varios;
function dia(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return a ? `${d} ${MESES[m - 1]}` : iso;
}
/* o teto do eixo: um número redondo um pouco acima do maior valor */
function teto(v: number) {
  if (v <= 5) return 5;
  const ordem = Math.pow(10, Math.floor(Math.log10(v)));
  for (const passo of [1, 2, 2.5, 5, 10])
    if (passo * ordem >= v * 1.1) return passo * ordem;
  return 10 * ordem;
}

function s(tag: string, at: Record<string, string | number>, pai?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in at) e.setAttribute(k, String(at[k]));
  if (pai) pai.appendChild(e);
  return e;
}
function texto(
  at: Record<string, string | number>,
  conteudo: string,
  pai: Element,
) {
  const t = s("text", at, pai);
  t.textContent = conteudo;
  return t;
}
function el(tag: string, classe: string, conteudo?: string) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (conteudo !== undefined) e.textContent = conteudo;
  return e;
}
function icone(miolo: string) {
  const i = el("span", "ico");
  i.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${miolo}</svg>`;
  return i;
}
function vazio(box: Element, frase: string) {
  const p = document.createElement(
    box.tagName === "OL" || box.tagName === "UL" ? "li" : "p",
  );
  p.className = "vis-vazio";
  p.textContent = frase;
  box.replaceChildren(p);
}

/* as cores do painel, lidas das variáveis na raiz da aba */
function paleta(raiz: HTMLElement) {
  const cs = getComputedStyle(raiz);
  const v = (nome: string, padrao: string) =>
    cs.getPropertyValue(nome).trim() || padrao;
  return {
    tinta: v("--pn-tinta", "#111111"),
    sol: v("--pn-sol", "#111111"),
    nevoa: v("--pn-nevoa", "#5c5c5c"),
    fio: v("--pn-fio", "#dcdcd7"),
    fioClaro: v("--fio-claro", "#ece9e4"),
    papel: v("--pn-papel", "#ffffff"),
    gelo: v("--pn-gelo", "#efefec"),
  };
}

export function desenhar(raiz: HTMLElement, D: DadosDesempenho): () => void {
  const limpar: (() => void)[] = [];
  const todos = (sel: string) =>
    Array.from(raiz.querySelectorAll<HTMLElement>(sel));
  const COR = paleta(raiz);

  /* ---------- a dica flutuante: o valor na frente, o rótulo atrás ---------- */
  const dica = document.createElement("div");
  dica.className = "vis-dica";
  dica.setAttribute("role", "status");
  document.body.appendChild(dica);
  limpar.push(() => dica.remove());
  function mostra(linhas: Linha[], x: number, y: number) {
    dica.replaceChildren();
    linhas.forEach((l, i) => {
      const e = document.createElement(i === 0 ? "b" : "span");
      if (typeof l === "object") {
        e.textContent = l.t;
        e.className = "linha";
        e.style.setProperty("--k", l.k);
      } else e.textContent = l;
      dica.appendChild(e);
    });
    dica.classList.add("on");
    const w = dica.offsetWidth,
      h = dica.offsetHeight;
    let px = x + 14,
      py = y - h - 12;
    if (px + w > innerWidth - 8) px = x - w - 14;
    if (py < 8) py = y + 16;
    dica.style.left = px + "px";
    dica.style.top = py + "px";
  }
  const esconde = () => dica.classList.remove("on");
  function comDica(elm: Element, linhas: Linha[]) {
    elm.setAttribute("tabindex", "0");
    elm.addEventListener("pointermove", (e) =>
      mostra(linhas, (e as PointerEvent).clientX, (e as PointerEvent).clientY),
    );
    elm.addEventListener("pointerleave", esconde);
    elm.addEventListener("focus", () => {
      const r = elm.getBoundingClientRect();
      mostra(linhas, r.left + r.width / 2, r.top);
    });
    elm.addEventListener("blur", esconde);
  }

  const T = D.total;
  const n = D.dias.length;

  /* ---------- o movimento: pessoas em linha, chamadas em coluna, um gráfico só ---------- */
  function movimento(box: HTMLElement) {
    if (!T.pessoas) return vazio(box, "Ainda sem visitas no período.");
    const W = box.clientWidth,
      H = 190,
      m = { l: 34, r: 12, t: 26, b: 22 };
    const max = teto(Math.max(...D.dias.map((x) => x.pessoas)));
    const maxC = Math.max(...D.dias.map((x) => x.chamaram));
    const passo = (W - m.l - m.r) / Math.max(1, n - 1);
    const x = (i: number) => (n === 1 ? (m.l + W - m.r) / 2 : m.l + i * passo);
    const y = (v: number) => m.t + (1 - v / max) * (H - m.t - m.b);
    const base = y(0);
    const svg = s("svg", {
      width: W,
      height: H,
      role: "img",
      "aria-label": "Pessoas e chamadas por dia no período",
    });
    [0, max / 2, max].forEach((t) => {
      s(
        "line",
        {
          x1: m.l,
          x2: W - m.r,
          y1: y(t),
          y2: y(t),
          stroke: t ? COR.fioClaro : COR.fio,
          "stroke-width": 1,
        },
        svg,
      );
      texto(
        { x: m.l - 6, y: y(t) + 4, "text-anchor": "end" },
        br(Math.round(t)),
        svg,
      );
    });
    const marcas = Math.max(1, Math.round(n / 5));
    for (let i = 0; i < n; i += marcas)
      texto(
        { x: x(i), y: H - 6, "text-anchor": "middle" },
        dia(D.dias[i].d),
        svg,
      );
    /* as chamadas: colunas na cor da loja, na escala delas, até 40% da altura */
    if (maxC) {
      const bw = Math.max(3, Math.min(14, passo - 4));
      D.dias.forEach((v, i) => {
        if (!v.chamaram) return;
        const h = (v.chamaram / maxC) * (H - m.t - m.b) * 0.42;
        const x0 = x(i) - bw / 2,
          x1 = x0 + bw,
          top = base - h,
          r = Math.min(3, bw / 2, h);
        s(
          "path",
          {
            d: `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${base} Z`,
            fill: COR.sol,
            "fill-opacity": D.posts[i] ? 1 : 0.8,
          },
          svg,
        );
      });
    }
    const pts = D.dias.map((v, i) => `${x(i)},${y(v.pessoas)}`);
    if (n > 1)
      s(
        "path",
        {
          d: `M${x(0)},${base} L${pts.join(" L")} L${x(n - 1)},${base} Z`,
          fill: COR.tinta,
          "fill-opacity": 0.05,
        },
        svg,
      );
    s(
      "polyline",
      {
        points: pts.join(" "),
        fill: "none",
        stroke: COR.tinta,
        "stroke-width": 2,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      },
      svg,
    );
    if (n === 1)
      s(
        "circle",
        { cx: x(0), cy: y(D.dias[0].pessoas), r: 4, fill: COR.tinta },
        svg,
      );
    Object.keys(D.posts).forEach((k) => {
      const i = +k,
        cx = x(i),
        cy = y(D.dias[i].pessoas);
      const ancora = cx < W * 0.25 ? "start" : cx > W * 0.75 ? "end" : "middle";
      texto(
        {
          x: cx,
          y: cy - 12,
          "text-anchor": ancora,
          style: `fill:${COR.tinta};font-weight:700`,
        },
        D.posts[i],
        svg,
      );
      s(
        "circle",
        { cx, cy, r: 5, fill: COR.sol, stroke: COR.papel, "stroke-width": 2 },
        svg,
      );
    });
    const guia = s(
      "line",
      {
        y1: m.t - 4,
        y2: base,
        stroke: COR.tinta,
        "stroke-width": 1,
        opacity: 0,
      },
      svg,
    );
    const ponto = s(
      "circle",
      {
        r: 4.5,
        fill: COR.tinta,
        stroke: COR.papel,
        "stroke-width": 2,
        opacity: 0,
      },
      svg,
    );
    const capa = s(
      "rect",
      {
        x: m.l,
        y: 0,
        width: W - m.l - m.r,
        height: H,
        fill: "transparent",
        tabindex: 0,
      },
      svg,
    );
    let foco = n - 1;
    const marca = (i: number, cx: number, cy: number) => {
      const X = x(i);
      guia.setAttribute("x1", String(X));
      guia.setAttribute("x2", String(X));
      guia.setAttribute("opacity", "1");
      ponto.setAttribute("cx", String(X));
      ponto.setAttribute("cy", String(y(D.dias[i].pessoas)));
      ponto.setAttribute("opacity", "1");
      const v = D.dias[i];
      mostra(
        [
          `${br(v.pessoas)} ${plural(v.pessoas, "pessoa", "pessoas")}`,
          {
            t: `${v.chamaram} ${plural(v.chamaram, "chamou", "chamaram")} no WhatsApp`,
            k: COR.sol,
          },
          dia(v.d) + (D.posts[i] ? ` · ${D.posts[i]}` : ""),
        ],
        cx,
        cy,
      );
    };
    const some = () => {
      guia.setAttribute("opacity", "0");
      ponto.setAttribute("opacity", "0");
      esconde();
    };
    capa.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect(),
        esc = r.width / W,
        pe = e as PointerEvent;
      const i =
        n === 1
          ? 0
          : Math.max(
              0,
              Math.min(
                n - 1,
                Math.round(((pe.clientX - r.left) / esc - m.l) / passo),
              ),
            );
      marca(i, pe.clientX, pe.clientY);
    });
    capa.addEventListener("pointerleave", some);
    capa.addEventListener("focus", () => {
      const r = svg.getBoundingClientRect();
      marca(foco, r.right - 20, r.top + 20);
    });
    capa.addEventListener("keydown", (e) => {
      const k = (e as KeyboardEvent).key;
      if (k !== "ArrowLeft" && k !== "ArrowRight") return;
      e.preventDefault();
      foco = Math.max(0, Math.min(n - 1, foco + (k === "ArrowRight" ? 1 : -1)));
      const r = svg.getBoundingClientRect();
      marca(foco, r.left + (x(foco) * r.width) / W, r.top + 20);
    });
    capa.addEventListener("blur", some);
    box.replaceChildren(svg);
  }

  /* ---------- o mapa das peças: as fotos nos três grupos, com o nome embaixo ---------- */
  function pecas(box: HTMLElement) {
    const lista = D.pecas.filter((p) => p.viram > 0);
    if (!lista.length)
      return vazio(box, "Nenhuma peça aberta ainda no período.");
    const compacto = box.clientWidth < 420;
    const W = box.clientWidth,
      H = compacto ? 280 : 340,
      m = { l: 34, r: 16, t: 24, b: 36 };
    const xmax = teto(Math.max(...lista.map((p) => p.viram)));
    const taxas = lista.map((p) => (p.chamaram / p.viram) * 100);
    const ymax = Math.min(100, teto(Math.max(5, ...taxas)));
    const ymin = -ymax / 7;
    /* os cortes saem dos próprios números: "pouca gente viu" é menos de
       um quinto da peça mais vista; "chama pouco" é abaixo da média */
    const xCorte = xmax * 0.2;
    const somaV = lista.reduce((a, p) => a + p.viram, 0),
      somaC = lista.reduce((a, p) => a + p.chamaram, 0);
    const yCorte = Math.max(0.5, (somaC / somaV) * 100);
    const raio = compacto ? 14 : 20;
    const x = (v: number) => m.l + (v / xmax) * (W - m.l - m.r);
    const y = (v: number) =>
      m.t + ((ymax - v) / (ymax - ymin)) * (H - m.t - m.b);
    const id = "p" + Math.random().toString(36).slice(2, 7);
    const svg = s("svg", {
      width: W,
      height: H,
      role: "img",
      "aria-label":
        "As peças em três grupos: as que estão funcionando, as que chamam atenção mas não convertem, e as esquecidas",
    });
    const defs = s("defs", {}, svg);
    /* as três zonas: dois tons do gelo do painel e um sopro da cor da loja */
    s(
      "rect",
      {
        x: x(0),
        y: y(ymax),
        width: x(xCorte) - x(0),
        height: y(ymin) - y(ymax),
        fill: COR.fio,
        "fill-opacity": 0.35,
      },
      svg,
    );
    s(
      "rect",
      {
        x: x(xCorte),
        y: y(ymax),
        width: x(xmax) - x(xCorte),
        height: y(yCorte) - y(ymax),
        fill: COR.gelo,
      },
      svg,
    );
    s(
      "rect",
      {
        x: x(xCorte),
        y: y(yCorte),
        width: x(xmax) - x(xCorte),
        height: y(ymin) - y(yCorte),
        fill: COR.sol,
        "fill-opacity": 0.06,
      },
      svg,
    );
    const forte = `fill:${COR.tinta};font-weight:700;font-size:12px`;
    const fraco = `fill:${COR.nevoa};font-size:10.5px`;
    texto(
      { x: x(xCorte) + 8, y: y(ymax) + 15, style: forte },
      "Estão funcionando",
      svg,
    );
    if (!compacto)
      texto(
        { x: x(xCorte) + 8, y: y(ymax) + 29, style: fraco },
        "abrem e chamam",
        svg,
      );
    texto(
      { x: x(xCorte) + 8, y: y(ymin) - (compacto ? 8 : 22), style: forte },
      "Chamam atenção, mas não convertem",
      svg,
    );
    if (!compacto)
      texto(
        { x: x(xCorte) + 8, y: y(ymin) - 8, style: fraco },
        "muita gente abre, pouca chama",
        svg,
      );
    if (x(xCorte) - x(0) >= 110) {
      texto({ x: x(0) + 6, y: y(ymax) + 15, style: forte }, "Esquecidas", svg);
      if (!compacto)
        texto(
          { x: x(0) + 6, y: y(ymax) + 29, style: fraco },
          "pouca gente abre",
          svg,
        );
    } else
      texto(
        {
          x: 0,
          y: 0,
          "text-anchor": "end",
          transform: `translate(${(x(xCorte) + x(0)) / 2 + 4},${y(ymax) + 6}) rotate(-90)`,
          style: forte,
        },
        "Esquecidas",
        svg,
      );
    [0, ymax / 3, (2 * ymax) / 3, ymax].forEach((t) =>
      texto(
        { x: m.l - 6, y: y(t) + 4, "text-anchor": "end" },
        `${Math.round(t)}%`,
        svg,
      ),
    );
    [0, xmax / 4, xmax / 2, (3 * xmax) / 4, xmax].forEach((t) =>
      texto(
        { x: x(t), y: H - m.b + 15, "text-anchor": "middle" },
        br(Math.round(t)),
        svg,
      ),
    );
    s(
      "line",
      { x1: m.l, x2: W - m.r, y1: y(ymin), y2: y(ymin), stroke: COR.fio },
      svg,
    );
    texto(
      { x: W - m.r, y: H - 3, "text-anchor": "end" },
      "pessoas que abriram a peça",
      svg,
    );
    texto({ x: m.l - 6, y: 9 }, "de cada 100, quantas chamaram", svg);
    const comNome = !compacto && lista.length <= 10;
    lista.forEach((p, i) => {
      const t = taxas[i],
        cx = x(p.viram),
        cy = y(Math.min(t, ymax));
      const g = s("g", { "aria-label": p.nome }, svg);
      s("circle", { cx, cy, r: raio + 2, fill: COR.papel, stroke: COR.fio }, g);
      if (p.foto) {
        const cp = s("clipPath", { id: id + i }, defs);
        s("circle", { cx, cy, r: raio }, cp);
        s(
          "image",
          {
            href: p.foto,
            x: cx - raio,
            y: cy - raio,
            width: raio * 2,
            height: raio * 2,
            preserveAspectRatio: "xMidYMid slice",
            "clip-path": `url(#${id}${i})`,
          },
          g,
        );
      } else s("circle", { cx, cy, r: raio, fill: COR.fioClaro }, g);
      if (comNome) {
        const nome =
          p.nome.length > 20 ? p.nome.slice(0, 19).trimEnd() + "…" : p.nome;
        const ancora =
          cx < W * 0.12 ? "start" : cx > W * 0.9 ? "end" : "middle";
        texto(
          {
            x: cx,
            y: cy + raio + 14,
            "text-anchor": ancora,
            style: `fill:${COR.tinta};font-size:10.5px;font-weight:600`,
          },
          nome,
          g,
        );
      }
      const alvo = s(
        "circle",
        { cx, cy, r: Math.max(raio + 4, 14), fill: "transparent" },
        g,
      );
      comDica(alvo, [
        `${p.chamaram} ${plural(p.chamaram, "chamou", "chamaram")} (${pct(t, 1)})`,
        `${br(p.viram)} ${plural(p.viram, "abriu", "abriram")}`,
        p.nome,
      ]);
    });
    box.replaceChildren(svg);
  }

  /* ---------- as barras deitadas em HTML ---------- */
  /* a linha de barra: o nome (texto ou nó), o número, a barra e, na parte
     paga, a ação que a linha pede (Cadastrar, Repor): a lista vira lista de
     tarefas, não só de números (06/10/2026) */
  function barra(
    lista: HTMLElement,
    nome: string | Node,
    valor: string,
    sufixo: string,
    fracao: number,
    sol: boolean,
    linhas?: Linha[],
    acao?: { texto: string; href: string },
  ) {
    const li = document.createElement("li");
    if (sol) li.className = "sol";
    const a = typeof nome === "string" ? el("span", "nome", nome) : nome;
    const b = el("span", "num", valor);
    if (sufixo) b.appendChild(el("small", "", sufixo));
    const tr = el("span", "trilho");
    const i = document.createElement("i");
    i.style.width = Math.max(1.5, fracao * 100) + "%";
    tr.appendChild(i);
    li.append(a, b);
    if (acao) {
      const lnk = el("a", "acao", acao.texto) as HTMLAnchorElement;
      lnk.href = acao.href;
      li.appendChild(lnk);
    }
    li.appendChild(tr);
    lista.appendChild(li);
    if (linhas) comDica(li, linhas);
  }

  function barras() {
    /* de onde vieram: ícone, nome, "184 pessoas · 27 chamadas", a barra e a parte do todo */
    todos("[data-origem]").forEach((ul) => {
      ul.replaceChildren();
      const soma = D.origem.reduce((a, o) => a + o.pessoas, 0);
      if (!soma) return vazio(ul, "Ainda sem visitas no período.");
      const max = D.origem[0].pessoas;
      D.origem.forEach((o) => {
        const li = document.createElement("li");
        li.appendChild(
          icone(ICONES_ORIGEM[o.rotulo] ?? ICONES_ORIGEM["Outros sites"]),
        );
        const txt = el("div", "txt");
        txt.appendChild(el("b", "", o.rotulo));
        txt.appendChild(
          el(
            "small",
            "",
            `${br(o.pessoas)} ${plural(o.pessoas, "pessoa", "pessoas")} · ${br(o.chamaram)} ${plural(o.chamaram, "chamada", "chamadas")}`,
          ),
        );
        li.appendChild(txt);
        const tr = el("span", "trilho");
        const i = document.createElement("i");
        i.style.width = Math.max(1.5, (o.pessoas / max) * 100) + "%";
        tr.appendChild(i);
        li.appendChild(tr);
        li.appendChild(el("span", "pct", pct((o.pessoas / soma) * 100, 0)));
        ul.appendChild(li);
      });
    });

    /* os posts como números grandes, não barras: o nome, quantas vieram,
       quantas chamaram e a proporção */
    todos("[data-posts]").forEach((ol) => {
      ol.replaceChildren();
      const comGente = D.links.filter((l) => l.pessoas > 0);
      if (!comGente.length)
        return vazio(
          ol,
          "Gere um link, poste, e aqui aparece quantas pessoas cada post trouxe.",
        );
      /* o selo fica vermelho abaixo da metade da média dos posts, como na
         tabela das peças */
      const somaP = comGente.reduce((a, l) => a + l.pessoas, 0);
      const somaC = comGente.reduce((a, l) => a + l.chamaram, 0);
      const corteTaxa = somaP ? ((somaC / somaP) * 100) / 2 : 0;
      comGente.slice(0, 6).forEach((l) => {
        const li = document.createElement("li");
        li.appendChild(el("b", "nome", l.nome));
        const nums = el("span", "nums");
        const p = el("span", "num", br(l.pessoas));
        p.appendChild(el("small", "", plural(l.pessoas, "pessoa", "pessoas")));
        const c = el("span", "num sol", br(l.chamaram));
        c.appendChild(
          el("small", "", plural(l.chamaram, "chamou", "chamaram")),
        );
        const taxaPost = Math.round((l.chamaram / l.pessoas) * 100);
        const taxa = el("span", "taxa");
        taxa.appendChild(
          el(
            "i",
            "dz-taxa" + (taxaPost < corteTaxa ? " baixa" : ""),
            String(taxaPost),
          ),
        );
        taxa.appendChild(el("small", "", "de cada 100"));
        nums.append(p, c, taxa);
        li.appendChild(nums);
        ol.appendChild(li);
      });
    });
    /* a frase de decisão dos posts: o que traz gente nem sempre é o que faz chamar */
    todos("[data-posts-frase]").forEach((elm) => {
      const comGente = D.links.filter((l) => l.pessoas > 0);
      const comChamada = comGente.filter((l) => l.chamaram > 0);
      if (comGente.length < 2 || !comChamada.length) return (elm.hidden = true);
      const maisGente = comGente.reduce((a, b) =>
        b.pessoas > a.pessoas ? b : a,
      );
      const maisChamou = comChamada.reduce((a, b) =>
        b.chamaram > a.chamaram ? b : a,
      );
      elm.hidden = false;
      elm.textContent =
        maisGente.nome === maisChamou.nome
          ? `O ${maisGente.nome} trouxe mais gente e mais chamadas: vale repetir.`
          : `O ${maisGente.nome} trouxe mais gente, mas foi o ${maisChamou.nome} que fez mais gente chamar: vale mais do segundo.`;
    });

    todos("[data-buscas]").forEach((ol) => {
      ol.replaceChildren();
      if (!D.buscas.length)
        return vazio(
          ol,
          "Ninguém buscou algo que a loja não tem. Quando buscarem, aparece aqui.",
        );
      const max = D.buscas[0].pessoas;
      D.buscas.forEach((b, i) =>
        barra(
          ol,
          `“${b.termo}”`,
          String(b.pessoas),
          plural(b.pessoas, "pessoa", "pessoas"),
          b.pessoas / max,
          i === 0,
          [
            `${b.pessoas} ${plural(b.pessoas, "pessoa buscou", "pessoas buscaram")}`,
            `“${b.termo}”, e não tinha na vitrine`,
          ],
          { texto: "Cadastrar", href: "/painel/pecas?nova=1" },
        ),
      );
    });
    /* a frase de decisão das buscas: o primeiro da lista de compras. Só o
       mais procurado, porque somar as linhas contaria duas vezes quem buscou
       dois termos. */
    todos("[data-buscas-frase]").forEach((elm) => {
      const b = D.buscas[0];
      if (!b || b.pessoas < 2) return (elm.hidden = true);
      elm.hidden = false;
      elm.textContent = `O mais procurado que você não tem: “${b.termo}”, ${b.pessoas} pessoas. Vale perguntar ao fornecedor, ou cadastrar se já estiver na loja.`;
    });

    todos("[data-esgotados]").forEach((ol) => {
      ol.replaceChildren();
      if (!D.esgotados.length)
        return vazio(ol, "Ninguém tocou num número riscado no período.");
      const max = D.esgotados[0].pessoas;
      D.esgotados.forEach((e, i) => {
        const nome = el("span", "nome");
        nome.appendChild(el("i", "dz-num", e.tamanho));
        nome.appendChild(document.createTextNode(e.peca));
        barra(
          ol,
          nome,
          String(e.pessoas),
          plural(e.pessoas, "pessoa", "pessoas"),
          e.pessoas / max,
          i === 0,
          [
            `${e.pessoas} ${plural(e.pessoas, "pessoa queria", "pessoas queriam")} o ${e.tamanho}`,
            `${e.peca}: o número acabou`,
          ],
          {
            texto: "Repor",
            href: `/painel/pecas?busca=${encodeURIComponent(e.peca)}`,
          },
        );
      });
    });
    /* a frase de decisão do número que acabou: o que repor primeiro */
    todos("[data-esgotados-frase]").forEach((elm) => {
      const e = D.esgotados[0];
      if (!e || e.pessoas < 2) return (elm.hidden = true);
      elm.hidden = false;
      elm.textContent = `O que vale repor primeiro: ${e.peca}, número ${e.tamanho}. ${e.pessoas} pessoas queriam e não tinha.`;
    });

    const v = D.volta;
    const tNovos = v.novos ? (v.chamaram_novos / v.novos) * 100 : 0;
    const tVoltaram = v.voltaram ? (v.chamaram_voltaram / v.voltaram) * 100 : 0;
    todos("[data-volta-frase]").forEach((elm) => {
      const soma = v.novos + v.voltaram;
      elm.textContent = !soma
        ? "Aparece quando as pessoas começarem a voltar."
        : v.voltaram
          ? `${pct((v.voltaram / soma) * 100, 0)} das pessoas entraram em mais de um dia${tNovos && tVoltaram > tNovos ? `, e quem volta chama ${(tVoltaram / tNovos).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} vezes mais` : ""}.`
          : "Ninguém voltou em outro dia ainda. Com o tempo, aparece aqui.";
    });
    todos("[data-volta]").forEach((ol) => {
      ol.replaceChildren();
      if (!v.voltaram) return;
      const max = Math.max(tNovos, tVoltaram) || 1;
      barra(
        ol,
        "Novas: de cada 100, chamaram",
        pct(tNovos, 1),
        "",
        tNovos / max,
        false,
        [
          `${pct(tNovos, 1)} chamaram`,
          `${br(v.novos)} ${plural(v.novos, "pessoa entrou", "pessoas entraram")} só em um dia`,
        ],
      );
      barra(
        ol,
        "Voltaram: de cada 100, chamaram",
        pct(tVoltaram, 1),
        "",
        tVoltaram / max,
        true,
        [
          `${pct(tVoltaram, 1)} chamaram`,
          `${br(v.voltaram)} ${plural(v.voltaram, "pessoa voltou", "pessoas voltaram")} em outro dia`,
        ],
      );
    });
  }

  /* ---------- os números mais pedidos: uma faixa só, dividida por tamanho ----------
     Antes eram colunas de 150px num SVG, e o cartão ficava duas vezes mais
     alto que os vizinhos (06/10/2026). A faixa diz a mesma coisa em 50px:
     cada pedaço é um tamanho, na largura da sua parte dos pedidos; os dois
     mais pedidos em verde, com o número e o % embaixo de cada pedaço. */
  function numeros(box: HTMLElement, qual: number) {
    const item = D.numeros[qual];
    todos("[data-grade-peca]").forEach((elm) => (elm.textContent = ""));
    todos("[data-numeros-peca]").forEach(
      (elm) => (elm.textContent = item?.peca ?? ""),
    );
    if (!item)
      return vazio(
        box,
        "Quando pedirem uma peça escolhendo o número, a grade aparece aqui.",
      );
    const g = item.grade,
      total = g.reduce((a, x) => a + x.pessoas, 0);
    const ordem = g.map((x) => x.pessoas).sort((a, b) => b - a);
    const corte = ordem[Math.min(1, ordem.length - 1)];
    box.replaceChildren();
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", `Os números mais pedidos do ${item.peca}`);
    g.forEach((x) => {
      const forte = x.pessoas >= corte && g.length > 1;
      const parte = el("span", forte ? "parte sol" : "parte");
      parte.style.flexGrow = String(Math.max(x.pessoas, 0.0001));
      parte.appendChild(el("i", ""));
      parte.appendChild(el("b", "", x.tamanho));
      parte.appendChild(el("small", "", pct((x.pessoas / total) * 100, 0)));
      box.appendChild(parte);
      comDica(parte, [
        `${x.pessoas} ${plural(x.pessoas, "pedido", "pedidos")} do ${x.tamanho}`,
        `${pct((x.pessoas / total) * 100, 0)} dos pedidos do ${item.peca}`,
      ]);
    });
    if (g.length > 1) {
      const maiores = g.filter((x) => x.pessoas >= corte);
      const soma = maiores.reduce((a, x) => a + x.pessoas, 0);
      todos("[data-grade-peca]").forEach((elm) => {
        elm.textContent = `O ${maiores.map((x) => x.tamanho).join(" e o ")} ${maiores.length > 1 ? "são" : "é"} ${pct((soma / total) * 100, 0)} dos pedidos`;
      });
    }
  }

  /* ---------- a grade de dias e horários: cinco tons da cor da loja, por classe ---------- */
  function grade() {
    const todosValores = D.grade.flat();
    const max = Math.max(...todosValores);
    todos("[data-grade]").forEach((box) => {
      if (!max) return vazio(box, "Ainda sem visitas no período.");
      box.replaceChildren(document.createElement("span"));
      for (let f = 0; f < 8; f++) box.appendChild(el("span", "", `${f * 3}h`));
      D.grade.forEach((linhaDia, d) => {
        box.appendChild(el("span", "", DIAS_SEMANA[d]));
        linhaDia.forEach((v, f) => {
          const i = document.createElement("i");
          i.className = v
            ? "n" + (1 + Math.min(4, Math.floor((v / max) * 4.999)))
            : "n0";
          box.appendChild(i);
          comDica(i, [
            `${v} ${plural(v, "pessoa", "pessoas")}`,
            `${DIAS_SEMANA[d]}, das ${f * 3}h às ${f * 3 + 3}h`,
          ]);
        });
      });
    });
    todos("[data-grade-frase]").forEach((elm) => {
      if (!max)
        return (elm.textContent =
          "Os dias e horários em que mais gente entra. Aparece com as primeiras visitas.");
      let melhor = { d: 0, f: 0, v: -1 };
      D.grade.forEach((l, d) =>
        l.forEach((v, f) => {
          if (v > melhor.v) melhor = { d, f, v };
        }),
      );
      elm.textContent = `O horário mais forte foi ${DIAS_EXTENSO[melhor.d]}, das ${melhor.f * 3}h às ${melhor.f * 3 + 3}h. É uma boa hora para postar.`;
    });
  }

  function graficos() {
    todos("[data-movimento]").forEach(movimento);
    todos("[data-pecas]").forEach(pecas);
    todos("[data-numeros]").forEach((box) =>
      numeros(box, Number(box.dataset.qual ?? 0)),
    );
  }

  barras();
  grade();
  graficos();

  /* "ver outra peça" roda a lista das peças com grade */
  todos("[data-numeros-proxima]").forEach((btn) => {
    const troca = () => {
      todos("[data-numeros]").forEach((box) => {
        const prox = (Number(box.dataset.qual ?? 0) + 1) % D.numeros.length;
        box.dataset.qual = String(prox);
        numeros(box, prox);
      });
    };
    btn.addEventListener("click", troca);
    limpar.push(() => btn.removeEventListener("click", troca));
  });

  let espera: ReturnType<typeof setTimeout>;
  const redimensiona = () => {
    clearTimeout(espera);
    espera = setTimeout(graficos, 150);
  };
  addEventListener("resize", redimensiona);
  limpar.push(() => removeEventListener("resize", redimensiona));
  if (document.fonts) document.fonts.ready.then(() => graficos());

  return () => limpar.forEach((f) => f());
}
