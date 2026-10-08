import { NextResponse, type NextRequest } from "next/server";
import { pecaParaMedir } from "@/lib/dados";
import { TEM_PERFORMANCE, registrarEvento } from "@/estudio/lib/performance";

/**
 * A ENTRADA DA CONTAGEM (aba Desempenho). O navegador manda o evento aqui,
 * e daqui ele vai para o central do estúdio (perf_registrar_evento), que
 * confere o formato, segura enxurrada e conta repetição uma vez.
 *
 * Esta rota faz o que o central não vê:
 *   - descarta robô que se anuncia pelo user-agent e pedido que não veio
 *     do próprio site;
 *   - confere a PEÇA, porque o catálogo mora aqui e não lá: a peça tem que
 *     existir, e "esgotado" só vale para um número que está riscado de
 *     verdade. Sem isso qualquer um inflaria "queriam um número que acabou".
 *
 * Responde sempre 204, gravando ou não: quem tenta forçar não aprende nada
 * com a resposta. E nunca espera o central mais do que 2,5 s.
 */

const ROBO = /bot|crawl|spider|slurp|facebookexternalhit|lighthouse|headless|python|curl|wget/i;
const TIPOS = new Set(["visita", "peca", "whatsapp", "busca", "esgotado"]);

export async function POST(req: NextRequest) {
  const nada = new NextResponse(null, { status: 204 });
  if (!TEM_PERFORMANCE) return nada;
  if (ROBO.test(req.headers.get("user-agent") ?? "")) return nada;

  /* o pedido tem que vir do próprio site. Compara com o Host que chegou,
     não com req.nextUrl.host: no teste de 02/10 o Next via "localhost"
     onde o navegador mandava "127.0.0.1", e a contagem ficava muda. */
  const origem = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origem && host && new URL(origem).host !== host) return nada;

  const texto = await req.text();
  if (texto.length > 1500) return nada;
  let evento: Record<string, unknown>;
  try {
    evento = JSON.parse(texto);
  } catch {
    return nada;
  }
  if (!evento || typeof evento !== "object" || !TIPOS.has(String(evento.tipo))) return nada;

  /* só os campos conhecidos seguem para o central */
  const campos = ["visitante", "tipo", "produto", "tamanho", "busca", "resultados", "origem", "post", "botao"];
  const limpo = Object.fromEntries(campos.filter((c) => evento[c] !== undefined && evento[c] !== null).map((c) => [c, evento[c]]));

  /* a cidade de quem entrou (07/10): a Vercel manda em x-vercel-ip-city, em
     URL-encoding ("S%C3%A3o%20Paulo"). Só na visita, e só a cidade: nada que
     aponte para uma pessoa. Fora da Vercel o cabeçalho não existe e a aba
     simplesmente não mostra a lista. */
  if (limpo.tipo === "visita") {
    const bruta = req.headers.get("x-vercel-ip-city");
    if (bruta) {
      try {
        const cidade = decodeURIComponent(bruta).trim();
        if (cidade && cidade.length <= 60) limpo.cidade = cidade;
      } catch {
        /* cabeçalho torto: segue sem cidade */
      }
    }
  }

  /* a peça, conferida aqui */
  const slug = typeof limpo.produto === "string" ? limpo.produto.toLowerCase() : null;
  if (slug !== null) {
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return nada;
    const peca = await pecaParaMedir(slug);
    if (!peca) {
      /* peça que não existe: o clique de WhatsApp vira atendimento geral,
         e peca/esgotado nem contam */
      if (limpo.tipo !== "whatsapp") return nada;
      delete limpo.produto;
      delete limpo.tamanho;
      limpo.botao = "geral";
    } else if (limpo.tipo === "esgotado") {
      const n = String(limpo.tamanho ?? "");
      if (!n || !peca.esgotados.includes(n)) return nada;
    }
  } else if (limpo.tipo === "peca" || limpo.tipo === "esgotado") {
    return nada;
  }

  await registrarEvento(limpo);
  return nada;
}
