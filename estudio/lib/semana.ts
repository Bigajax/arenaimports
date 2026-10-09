import type { Semana } from "./performance";

/**
 * AS FRASES DA SEMANA (09/10/2026). O mesmo texto vai para o cartão "Sua
 * semana" da Início e para a mensagem de segunda que o estúdio manda no
 * WhatsApp (a cópia no CRM é lib/performance/semana.ts, no repositório do
 * estúdio: mudou aqui, muda lá). A régua da Desempenho: o número com a
 * conclusão, nenhuma frase diz "bom" ou "ruim", e frase sem dado não entra.
 */

const br = (v: number) => v.toLocaleString("pt-BR");

function comparacao(agora: number, antes: number): string {
  if (!antes) return "";
  const pct = Math.round(((agora - antes) / antes) * 100);
  if (Math.abs(pct) < 5) return ", quase igual à semana anterior";
  return pct > 0 ? `, ${pct}% a mais que a semana anterior` : `, ${Math.abs(pct)}% a menos que a semana anterior`;
}

export function frasesDaSemana(s: Semana, nomeDe: (slug: string) => string | null): string[] {
  const frases: string[] = [];
  if (!s.pessoas) return frases;

  /* a semana anterior só compara se a contagem já existia nela inteira */
  const temAntes = s.contagem_desde !== null && Date.parse(s.contagem_desde) < Date.now() - 14 * 24 * 60 * 60 * 1000;
  frases.push(
    `${br(s.pessoas)} ${s.pessoas === 1 ? "pessoa entrou" : "pessoas entraram"} na vitrine nos últimos 7 dias${temAntes ? comparacao(s.pessoas, s.pessoas_antes) : ""}, e ${br(s.chamaram)} ${s.chamaram === 1 ? "chamou" : "chamaram"} no WhatsApp.`,
  );

  const peca = s.peca ? nomeDe(s.peca) : null;
  if (peca && s.peca_chamaram) {
    frases.push(`A peça que mais levou gente ao WhatsApp foi ${peca}: ${br(s.peca_chamaram)} ${s.peca_chamaram === 1 ? "pessoa" : "pessoas"}.`);
  }

  const esgotado = s.esgotados.map((e) => ({ ...e, nome: nomeDe(e.produto) })).find((e) => e.nome);
  if (esgotado) {
    frases.push(`${br(esgotado.pessoas)} ${esgotado.pessoas === 1 ? "pessoa tocou" : "pessoas tocaram"} no ${esgotado.tamanho ?? "tamanho"} de ${esgotado.nome}, que acabou. Vale repor.`);
  }

  if (s.buscas.length) {
    const lista = s.buscas.map((b) => `"${b}"`);
    const texto = lista.length > 1 ? `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}` : lista[0];
    frases.push(`Procuraram ${texto} e não acharam na vitrine.`);
  }
  return frases;
}
