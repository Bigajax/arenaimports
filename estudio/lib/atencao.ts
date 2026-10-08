import type { DadosDesempenho } from "@/estudio/componentes/desempenho/desenho";
import type { Soma } from "@/estudio/lib/desempenho";

/**
 * O QUE FAZER AGORA (06/10/2026, revisado na mesma noite). São REGRAS, não
 * IA: cada uma olha os dados e, se houver uma decisão, escreve uma nota.
 * No máximo três.
 *
 * A revisão, a pedido do Rafael ("o que poderia melhorar aqui"):
 *   - cada nota começa pelo VERBO, numa linha ("Repor o 41 do Phantom"),
 *     e o número vai no contexto, curto;
 *   - uma etiqueta diz o tipo (Estoque, Peça, Vitrine, Divulgação);
 *   - saiu a nota "a peça que mais leva ao WhatsApp": repetia o cartão ao
 *     lado. No lugar, a peça que MUITA gente abre e POUCA chama, que a lista
 *     de peças não mostra.
 *
 * Nenhuma frase diz "bom" ou "ruim". Travado, as notas de estoque usam só
 * a contagem que o central libera (`atencao.*`); os termos e as peças
 * continuam fechados no banco.
 */
export type Nota = {
  rotulo: string;
  frase: string;
  contexto: string;
  foto?: string | null;
  icone?: "lupa" | "caixa" | "caminho" | "megafone";
  acao?: { texto: string; href: string; pago: boolean; /** (07/10) abre o pagamento ali mesmo */ pagar?: string };
};

/* os limites da nota de upgrade (07/10), para afinar no piloto */
export const UPGRADE_VENDER_CHAMARAM = 60;
export const UPGRADE_LOJA_CHAMARAM = 300;
export const UPGRADE_LOJA_PECAS = 80;

export type ContextoUpgrade = {
  /** o degrau já pago acima da vitrine */
  upgrade: "vender" | "loja" | null;
  pecasAtivas: number;
  /** a página de upgrade do estúdio para cada degrau; null sem o central */
  link: (degrau: "vender" | "loja") => string | null;
};

const br = (v: number) => v.toLocaleString("pt-BR");

export function notasDeAtencao(
  D: DadosDesempenho,
  atencao: Soma["atencao"],
  travado: boolean,
  up?: ContextoUpgrade,
): Nota[] {
  const notas: Nota[] = [];
  const T = D.total;

  /* 1. o número que acabou: venda que ficou na mesa */
  if (travado) {
    const n = atencao?.esgotados_pessoas ?? 0;
    if (n >= 2)
      notas.push({
        rotulo: "Estoque",
        frase: "Repor o número que mais faz falta",
        contexto: `${br(n)} pessoas tocaram num número que tinha acabado.`,
        icone: "caixa",
        acao: {
          texto: "Ver qual é no Performance",
          href: "#estoque",
          pago: true,
        },
      });
  } else if (D.esgotados[0] && D.esgotados[0].pessoas >= 2) {
    const e = D.esgotados[0];
    notas.push({
      rotulo: "Estoque",
      frase: `Repor o ${e.tamanho} do ${e.peca}`,
      contexto: `${br(e.pessoas)} pessoas queriam e tinha acabado.`,
      icone: "caixa",
      acao: { texto: "Ver os números", href: "#estoque", pago: false },
    });
  }

  /* 2. procuraram e a loja não tem */
  if (travado) {
    const n = atencao?.buscas_pessoas ?? 0;
    if (n >= 2)
      notas.push({
        rotulo: "Estoque",
        frase: "Descobrir o que procuram e você não tem",
        contexto: `${br(n)} pessoas buscaram algo que não está na vitrine.`,
        icone: "lupa",
        acao: { texto: "Ver o que procuraram", href: "#estoque", pago: true },
      });
  } else if (D.buscas[0] && D.buscas[0].pessoas >= 2) {
    const b = D.buscas[0];
    notas.push({
      rotulo: "Estoque",
      frase: `Cadastrar ou encomendar “${b.termo}”`,
      contexto: `${br(b.pessoas)} pessoas procuraram e não acharam.`,
      icone: "lupa",
      acao: { texto: "Ver o que procuraram", href: "#estoque", pago: false },
    });
  }

  /* 3. a peça que muita gente abre e pouca chama: abaixo da metade da taxa média */
  const somaV = D.pecas.reduce((a, p) => a + p.viram, 0);
  const media = somaV ? D.pecas.reduce((a, p) => a + p.chamaram, 0) / somaV : 0;
  const fracas = D.pecas.filter(
    (p) => p.viram >= 20 && p.chamaram / p.viram < media / 2,
  );
  if (fracas.length) {
    const p = fracas.reduce((a, b) => (b.viram > a.viram ? b : a));
    notas.push({
      rotulo: "Peça",
      frase: `Rever a foto e o preço do ${p.nome}`,
      contexto: `${br(p.viram)} abriram e só ${br(p.chamaram)} chamaram: ${Math.round((p.chamaram / p.viram) * 100)} de cada 100, quando a média é ${Math.round(media * 100)}.`,
      foto: p.foto,
      acao: { texto: "Abrir a peça", href: `/produto/${p.slug}`, pago: false },
    });
  }

  /* 4. onde é a maior perda do caminho */
  if (T.pessoas >= 30 && T.olharam > 0) {
    const perda1 = 1 - T.olharam / T.pessoas;
    const perda2 = 1 - T.chamaram / T.olharam;
    notas.push(
      perda1 >= perda2
        ? {
            rotulo: "Vitrine",
            frase: "Rever a página inicial e os banners",
            contexto: `De cada 100 que entram, ${Math.round((T.olharam / T.pessoas) * 100)} abrem uma peça. É onde mais gente desiste.`,
            icone: "caminho",
          }
        : {
            rotulo: "Vitrine",
            frase: "Rever o preço, a foto e o texto das peças",
            contexto: `De cada 100 que abrem uma peça, ${Math.round((T.chamaram / T.olharam) * 100)} chamam. É onde mais gente desiste.`,
            icone: "caminho",
          },
    );
  }

  /* 5. o post que trouxe gente e ninguém chamou (só liberado: links são pagos) */
  if (!travado) {
    const semChamada = D.links.filter(
      (l) => l.pessoas >= 20 && l.chamaram === 0,
    );
    if (semChamada.length) {
      const l = semChamada.reduce((a, b) => (b.pessoas > a.pessoas ? b : a));
      notas.push({
        rotulo: "Divulgação",
        frase: `Rever o ${l.nome}`,
        contexto: `Trouxe ${br(l.pessoas)} pessoas e ninguém chamou.`,
        icone: "megafone",
        acao: { texto: "Ver os posts", href: "#divulgacao", pago: false },
      });
    }
  }

  /* 6. o próximo degrau da vitrine (07/10): só quando o número justifica,
     a loja ainda não pagou e sobra lugar nas três. A loja online passa na
     frente quando o catálogo ou o movimento já são de loja online. */
  if (up && notas.length < 3 && up.upgrade !== "loja") {
    const loja = up.pecasAtivas >= UPGRADE_LOJA_PECAS || T.chamaram >= UPGRADE_LOJA_CHAMARAM;
    const vender = up.upgrade !== "vender" && T.chamaram >= UPGRADE_VENDER_CHAMARAM;
    const link = loja ? up.link("loja") : vender ? up.link("vender") : null;
    if (link && loja)
      notas.push({
        rotulo: "Vitrine",
        frase: "Abrir a loja online",
        contexto: up.pecasAtivas >= UPGRADE_LOJA_PECAS ? `São ${br(up.pecasAtivas)} peças no site. Com sacola e estoque que baixa sozinho, ninguém precisa esperar você.` : `${br(T.chamaram)} pessoas chamaram no WhatsApp. Com a loja online, elas compram sozinhas.`,
        icone: "megafone",
        acao: { texto: "Ver o upgrade", href: link, pago: false, pagar: link },
      });
    else if (link && vender)
      notas.push({
        rotulo: "Vitrine",
        frase: "Deixar quem já decidiu pagar na hora",
        contexto: `${br(T.chamaram)} pessoas chamaram no WhatsApp. Com o pagamento na vitrine, quem decidiu paga sem esperar você responder.`,
        icone: "megafone",
        acao: { texto: "Ver o upgrade", href: link, pago: false, pagar: link },
      });
  }

  return notas.slice(0, 3);
}
