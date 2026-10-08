import Link from "next/link";
import { TEM_PERFORMANCE, lerHoje } from "@/estudio/lib/performance";

/**
 * "SUA LOJA HOJE" NA INÍCIO (06/10/2026). Um bloco pequeno, em streaming:
 * a Início abre na hora com o esqueleto (HojeOsso, o fallback do Suspense)
 * e os números chegam quando o central responder. Sem Performance ligado,
 * ou com o central fora do ar, o bloco some em silêncio: a Início nunca
 * espera por ele.
 *
 * A linha "Vale olhar" é o número que só os dados da loja dizem (quantas
 * pessoas procuraram o que ela não tem, ou tocaram num número que acabou,
 * nos últimos 7 dias). Leva à aba Desempenho, onde a nota inteira mora.
 */
const br = (v: number) => v.toLocaleString("pt-BR");

export async function HojeNaLoja() {
  if (!TEM_PERFORMANCE) return null;
  const h = await lerHoje();
  if (!h) return null;

  const olhar =
    h.buscas_7d >= 2 && h.buscas_7d >= h.esgotados_7d
      ? `${br(h.buscas_7d)} pessoas procuraram algo que a sua loja não tem.`
      : h.esgotados_7d >= 2
        ? `${br(h.esgotados_7d)} pessoas tocaram num número que acabou.`
        : null;

  /* o placar do dia (07/10): dois números em Archivo com o rótulo em mono,
     e a nota "vale olhar" ao lado, com o carimbo que leva à Desempenho */
  return (
    <section className="pn-hoje pn-hoje--placar" aria-label="Sua loja hoje">
      <div className="pn-hoje__n">
        <span className="pn-hoje__rot">Entraram hoje</span>
        <b>{br(h.pessoas_hoje)}</b>
        <small>{h.pessoas_hoje === 1 ? "pessoa na vitrine" : "pessoas na vitrine"}</small>
      </div>
      <div className="pn-hoje__n">
        <span className="pn-hoje__rot">Chamaram hoje</span>
        <b>{br(h.chamaram_hoje)}</b>
        <small>no WhatsApp</small>
      </div>
      <div className="pn-hoje__olhar">
        <span className="pn-hoje__rot">Vale olhar</span>
        <p>
          {olhar ?? "Os números dos últimos dias estão na aba Desempenho."}
        </p>
        <Link href="/painel/desempenho" className="pn-hoje__ir">
          Ver em Desempenho
        </Link>
      </div>
    </section>
  );
}

/** O esqueleto que aparece enquanto o central responde. Sem animação. */
export function HojeOsso() {
  if (!TEM_PERFORMANCE) return null;
  return (
    <section className="pn-hoje" aria-hidden="true">
      <div className="pn-hoje__linha">
        <span className="pn-hoje__rotulo">Sua loja hoje</span>
        <span className="pn-hoje__osso" style={{ width: "14rem" }} />
      </div>
    </section>
  );
}
