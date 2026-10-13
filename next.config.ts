import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * O PACOTE COMPARTILHADO (13/10/2026, a Arena entra depois da SneakerSpot e
   * da Japa): o painel, o estoque e o estúdio vêm de @vitrine/plataforma, em
   * TypeScript. O Next compila o pacote como código da loja, e o pacote acha
   * a loja pelo nome fixo @vitrine/loja (o alias abaixo e o tsconfig).
   */
  transpilePackages: ["@vitrine/plataforma"],

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

  /**
   * O DEV NÃO RECOMPILA QUANDO O PAINEL GRAVA (09/10/2026). No modo local o
   * painel grava em data/*.json e em public/produtos; o dev via a pasta
   * mudar, recompilava no meio da ação, e a página seguinte saía com 500
   * ("Unexpected end of JSON input"). Esses arquivos são lidos em tempo de
   * execução, não importados: o dev não precisa olhar para eles.
   */
  webpack: (config, { dev }) => {
    /* a loja para o pacote (13/10/2026): @vitrine/loja é o loja.config.ts da raiz */
    config.resolve.alias = { ...config.resolve.alias, "@vitrine/loja": path.resolve(process.cwd(), "loja.config.ts") };
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/data/*.json", "**/data/*.tmp", "**/public/produtos/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
