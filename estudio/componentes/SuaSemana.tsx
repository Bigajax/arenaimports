import { carregarCatalogo } from "@/lib/dados";
import { TEM_PERFORMANCE, lerSemana } from "@/estudio/lib/performance";
import { frasesDaSemana } from "@/estudio/lib/semana";

/**
 * "SUA SEMANA" NA INÍCIO (09/10/2026, decisão do Rafael na auditoria). Os
 * últimos 7 dias em até quatro frases: quantos entraram e chamaram contra a
 * semana anterior, a peça que mais levou ao WhatsApp, o tamanho que acabou
 * e pediram, o que procuraram e não acharam. Para toda loja com a contagem.
 * As lojas com o Performance recebem o mesmo texto no WhatsApp toda
 * segunda, pela fila do CRM do estúdio.
 *
 * Em streaming, como o HojeNaLoja: sem contagem, central fora do ar ou
 * semana sem visita, o bloco some em silêncio.
 */
export async function SuaSemana() {
  if (!TEM_PERFORMANCE) return null;
  const [s, { produtos }] = await Promise.all([lerSemana(), carregarCatalogo()]);
  if (!s) return null;
  const nomes = new Map(produtos.map((p) => [p.slug, p.nome]));
  const frases = frasesDaSemana(s, (slug) => nomes.get(slug) ?? null);
  if (!frases.length) return null;

  return (
    <section className="pn-semana" aria-labelledby="titulo-semana">
      <h2 id="titulo-semana" className="pn-semana__titulo">
        Sua semana
      </h2>
      <ul>
        {frases.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </section>
  );
}
