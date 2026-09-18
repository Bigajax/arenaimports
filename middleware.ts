import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CHAVE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const TEM_SUPABASE = Boolean(URL_SUPABASE && CHAVE_SUPABASE);
const COOKIE_SESSAO = "kanton_painel";

/**
 * Barra a entrada no painel sem sessão. A checagem definitiva acontece
 * no servidor (layout e ações) — aqui é só para a pessoa não bater numa
 * tela vazia e para renovar o token do Supabase antes de a página rodar.
 */
export async function middleware(requisicao: NextRequest) {
  const resposta = NextResponse.next({ request: requisicao });
  const rota = requisicao.nextUrl.pathname;

  if (rota.startsWith("/painel/login")) return resposta;

  let temSessao: boolean;

  if (TEM_SUPABASE) {
    const cliente = createServerClient(URL_SUPABASE, CHAVE_SUPABASE, {
      cookies: {
        getAll: () => requisicao.cookies.getAll(),
        setAll: (biscoitos) => {
          for (const { name, value, options } of biscoitos) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    });
    const { data } = await cliente.auth.getUser();
    temSessao = Boolean(data.user);
  } else {
    temSessao = Boolean(requisicao.cookies.get(COOKIE_SESSAO)?.value);
  }

  if (!temSessao) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/painel/login";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/painel/:path*"],
};
