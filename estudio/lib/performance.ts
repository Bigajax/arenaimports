import type { Soma } from "@/estudio/lib/desempenho";

/**
 * O CENTRAL DO PERFORMANCE (06/10/2026): a contagem desta vitrine mora no
 * Supabase do ESTÚDIO, não no banco da loja. Este arquivo é a única porta
 * para lá, e só roda no servidor: a PERF_CHAVE identifica a loja e nunca
 * pode chegar ao navegador (quem a tiver infla ou lê os números dela).
 *
 * As três variáveis vêm juntas, ou nenhuma:
 *   PERF_URL    o Supabase do estúdio (igual para toda loja)
 *   PERF_ANON   a chave pública dele (igual para toda loja)
 *   PERF_CHAVE  a chave DESTA loja, gerada no CRM (Performance › Gerar a chave)
 *
 * Sem elas, TEM_PERFORMANCE é falso e a vitrine não muda nada: /api/evento
 * responde 204 calado e a aba Desempenho diz que a contagem não está ligada.
 * Com elas e o central fora do ar, idem: toda chamada tem 2,5 s de prazo e
 * devolve null em vez de lançar. A vitrine nunca espera o central.
 *
 * NÃO importar de componente de cliente. A fronteira é por convenção (o
 * molde não traz o pacote server-only), então: lib/performance.ts só em
 * rota, server action e página de servidor.
 */

export const PERF_URL = (process.env.PERF_URL ?? "").trim().replace(/\/$/, "");
export const PERF_ANON = (process.env.PERF_ANON ?? "").trim();
export const PERF_CHAVE = (process.env.PERF_CHAVE ?? "").trim();
export const TEM_PERFORMANCE = Boolean(PERF_URL && PERF_ANON && PERF_CHAVE);

/** Chama uma função do central. Erro, prazo estourado ou central ausente: null. */
async function central<T>(funcao: string, args: Record<string, unknown>, prazoMs = 2500): Promise<T | null> {
  if (!TEM_PERFORMANCE) return null;
  try {
    const r = await fetch(`${PERF_URL}/rest/v1/rpc/${funcao}`, {
      method: "POST",
      headers: { apikey: PERF_ANON, Authorization: `Bearer ${PERF_ANON}`, "Content-Type": "application/json" },
      body: JSON.stringify({ chave: PERF_CHAVE, ...args }),
      cache: "no-store",
      signal: AbortSignal.timeout(prazoMs),
    });
    if (!r.ok) return null;
    const texto = await r.text();
    return (texto ? JSON.parse(texto) : null) as T | null;
  } catch {
    return null;
  }
}

/** O evento já filtrado pela rota. Não espera resposta útil: a função devolve void. */
export async function registrarEvento(e: Record<string, unknown>): Promise<void> {
  await central("perf_registrar_evento", { e });
}

/** A soma da aba: o jsonb de perf_painel, com o bloco `acesso` que diz o que está liberado. */
export const lerPainel = (dias: number) => central<Soma>("perf_painel", { dias }, 4000);

/** A Início: hoje no fuso da loja, e o "vale olhar" dos últimos 7 dias. */
export type Hoje = {
  pessoas_hoje: number;
  chamaram_hoje: number;
  buscas_7d: number;
  esgotados_7d: number;
  /* (07/10) a escada da Início: a loja, o Performance e o upgrade pago */
  loja?: string;
  liberado?: boolean;
  plano?: string | null;
  upgrade?: "vender" | "loja" | null;
};
export const lerHoje = () => central<Hoje>("perf_hoje", {});

/**
 * Os relatórios do mês desta loja (06/10/2026): o estúdio cria um por mês
 * no CRM, e a aba Desempenho mostra o botão "Relatório do mês" apontando
 * para o mais recente. A página do relatório mora no site do estúdio;
 * PERF_RELATORIO_URL só existe para testar fora do ar.
 */
export const RELATORIO_BASE = (process.env.PERF_RELATORIO_URL ?? "https://rafaelrazeira.com.br").trim().replace(/\/$/, "");
export type RelatorioDoMes = { mes: string; token: string };
export const listarRelatorios = async () => (await central<RelatorioDoMes[]>("perf_relatorios_da_loja", {})) ?? [];

export type LinkDoCentral = { id: string; nome: string; slug: string; criado_em?: string };
export const listarLinks = async () => (await central<LinkDoCentral[]>("perf_links", {})) ?? [];

export const criarLink = (nome: string, slug: string) =>
  central<{ ok: true; id: string } | { ok: false; erro: "travada" | "repetido" | "invalido" }>("perf_criar_link", { nome, slug });

export const apagarLink = (id: string) => central<null>("perf_apagar_link", { id });

export const postExiste = async (s: string) => (await central<boolean>("perf_post_existe", { s })) === true;
