import { createBrowserClient, createServerClient } from "@supabase/ssr";

export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const CHAVE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sem credenciais no ambiente, o site roda no modo local (JSON em /data). */
export const TEM_SUPABASE = Boolean(URL_SUPABASE && CHAVE_SUPABASE);

export const BUCKET = "produtos";

export function clienteNavegador() {
  return createBrowserClient(URL_SUPABASE, CHAVE_SUPABASE);
}

type Biscoito = { name: string; value: string; options?: Record<string, unknown> };

export type LojaDeCookies = {
  getAll(): { name: string; value: string }[];
  set?(name: string, value: string, options?: Record<string, unknown>): void;
};

/**
 * Cliente de servidor. Recebe a store de cookies do chamador (Server
 * Component, Server Action ou middleware) — cada um entrega a sua.
 */
export function clienteServidor(loja: LojaDeCookies) {
  return createServerClient(URL_SUPABASE, CHAVE_SUPABASE, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (biscoitos: Biscoito[]) => {
        try {
          for (const { name, value, options } of biscoitos) {
            loja.set?.(name, value, options);
          }
        } catch {
          // Server Component não pode escrever cookie: o middleware renova a sessão.
        }
      },
    },
  });
}
