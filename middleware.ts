/* a barreira do painel mora no pacote (13/10/2026); o matcher fica aqui, literal, porque o Next só o lê no próprio arquivo */
export { middleware } from "@vitrine/plataforma/middleware";

export const config = {
  matcher: ["/painel/:path*"],
};
