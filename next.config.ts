import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* as fotos que o Luiz sobe pelo painel moram no Storage do Supabase:
     sem o domínio aqui, o <Image> recusa a URL e o cartão fica em branco
     (foi o que aconteceu com a capa do Superfly em 21/09) */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },

  eslint: {
    /**
     * O lint não trava o deploy.
     *
     * A Vercel bloqueia os `postinstall` não aprovados, e um deles é o do
     * `unrs-resolver` — o resolvedor nativo que o `eslint-config-next` usa.
     * Sem o binário montado, o ESLint quebra no build e derruba o deploy
     * inteiro por um problema que não é do código.
     *
     * O lint continua valendo: roda no `npm run lint` e no editor. O que
     * segue barrando o deploy é a checagem de tipos, logo abaixo — essa
     * não depende de binário nenhum.
     */
    ignoreDuringBuilds: true,
  },

  typescript: {
    // erro de tipo continua derrubando o build, como tem que ser
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
