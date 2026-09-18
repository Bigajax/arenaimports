import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { TEM_SUPABASE, clienteServidor } from "./supabase";

export const COOKIE_SESSAO = "picorelli_painel";

const SENHA_LOCAL = process.env.PAINEL_SENHA_LOCAL ?? "picorelli";
const SEGREDO = process.env.PAINEL_SEGREDO ?? "picorelli-desenvolvimento";

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

export async function sessao(): Promise<Sessao> {
  if (TEM_SUPABASE) {
    const sb = await supabase();
    const { data } = await sb.auth.getUser();
    return { autenticado: Boolean(data.user), email: data.user?.email ?? null };
  }
  const loja = await cookies();
  const valor = loja.get(COOKIE_SESSAO)?.value;
  return {
    autenticado: valor === selo(SENHA_LOCAL),
    email: valor === selo(SENHA_LOCAL) ? "modo local" : null,
  };
}

export async function exigirSessao(): Promise<Sessao> {
  const s = await sessao();
  if (!s.autenticado) throw new Error("Sessão expirada. Entre de novo.");
  return s;
}

export async function entrar(
  email: string,
  senha: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (TEM_SUPABASE) {
    const sb = await supabase();
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) {
      return {
        ok: false,
        erro:
          error.message === "Invalid login credentials"
            ? "E-mail ou senha não conferem."
            : "Não deu para entrar agora. Tente de novo em instantes.",
      };
    }
    return { ok: true };
  }

  if (senha !== SENHA_LOCAL) {
    return { ok: false, erro: "Senha não confere." };
  }
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
