import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { PREVIA } from "@/data/site.config";
import { TEM_SUPABASE, clienteServidor } from "./supabase";

export const COOKIE_SESSAO = "arena_painel";

/* O modo local (sem banco) entra com uma senha só. Desde 09/10/2026 a senha
   e o segredo padrão só valem fora do ar ou na prévia, que não tem nada de
   verdade: loja no ar sem as duas variáveis não entra, em vez de entrar com
   "molde" e um selo que qualquer um calcula (achado na auditoria). */
const PADRAO_PERMITIDO = process.env.NODE_ENV !== "production" || PREVIA !== null;
const SENHA_LOCAL = process.env.PAINEL_SENHA_LOCAL ?? (PADRAO_PERMITIDO ? "arena" : null);
const SEGREDO = process.env.PAINEL_SEGREDO ?? (PADRAO_PERMITIDO ? "arena-desenvolvimento" : null);

function selo(senha: string) {
  return createHash("sha256").update(`${senha}::${SEGREDO}`).digest("hex");
}

async function supabase() {
  const loja = await cookies();
  return clienteServidor({
    getAll: () => loja.getAll(),
    set: (name, value, options) => loja.set({ name, value, ...options }),
  });
}

export type Sessao = { autenticado: boolean; email: string | null };

/* uma vez por página: o layout e a página perguntavam cada um ao Supabase */
export const sessao = cache(async (): Promise<Sessao> => {
  if (TEM_SUPABASE) {
    const sb = await supabase();
    const { data } = await sb.auth.getUser();
    return { autenticado: Boolean(data.user), email: data.user?.email ?? null };
  }
  if (!SENHA_LOCAL || !SEGREDO) return { autenticado: false, email: null };
  const loja = await cookies();
  const valor = loja.get(COOKIE_SESSAO)?.value;
  return {
    autenticado: valor === selo(SENHA_LOCAL),
    email: valor === selo(SENHA_LOCAL) ? "modo local" : null,
  };
});

export async function exigirSessao(): Promise<Sessao> {
  const s = await sessao();
  if (!s.autenticado) throw new Error("Sessão expirada. Entre de novo.");
  return s;
}

/* Cinco tentativas erradas em 15 minutos, por endereço, e o login espera.
   Na memória do servidor: na Vercel cada instância conta a sua, o que
   segura o chute em sequência, que é o caso de verdade. */
const JANELA = 15 * 60 * 1000;
const LIMITE = 5;
const TENTATIVAS = new Map<string, { erros: number; desde: number }>();

async function endereco(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
}

function bloqueado(ip: string): boolean {
  const t = TENTATIVAS.get(ip);
  if (!t) return false;
  if (Date.now() - t.desde > JANELA) {
    TENTATIVAS.delete(ip);
    return false;
  }
  return t.erros >= LIMITE;
}

function errou(ip: string) {
  const t = TENTATIVAS.get(ip);
  if (!t || Date.now() - t.desde > JANELA) TENTATIVAS.set(ip, { erros: 1, desde: Date.now() });
  else t.erros += 1;
  if (TENTATIVAS.size > 5000) TENTATIVAS.clear();
}

export async function entrar(
  email: string,
  senha: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const ip = await endereco();
  if (bloqueado(ip)) {
    return { ok: false, erro: "Muitas tentativas seguidas. Espere uns 15 minutos e tente de novo." };
  }

  if (TEM_SUPABASE) {
    const sb = await supabase();
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) {
      if (error.message === "Invalid login credentials") {
        errou(ip);
        return { ok: false, erro: "E-mail ou senha não conferem." };
      }
      return { ok: false, erro: "Não deu para entrar agora. Tente de novo em instantes." };
    }
    TENTATIVAS.delete(ip);
    return { ok: true };
  }

  if (!SENHA_LOCAL || !SEGREDO) {
    return { ok: false, erro: "O painel desta loja ainda não foi ligado. Fale com o estúdio." };
  }
  if (senha !== SENHA_LOCAL) {
    errou(ip);
    return { ok: false, erro: "Senha não confere." };
  }
  TENTATIVAS.delete(ip);
  const loja = await cookies();
  loja.set(COOKIE_SESSAO, selo(SENHA_LOCAL), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true };
}

export async function sair(): Promise<void> {
  if (TEM_SUPABASE) {
    const sb = await supabase();
    await sb.auth.signOut();
    return;
  }
  const loja = await cookies();
  loja.delete(COOKIE_SESSAO);
}
