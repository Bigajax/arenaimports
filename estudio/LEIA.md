# estudio/ — a camada do estúdio

Versão: **2026-10-07** (tag `molde-2026-10-07` no `_molde`).

Esta pasta é **igual em toda loja**. É o que o estúdio entrega por cima de qualquer
vitrine: a contagem de visitas, a aba Desempenho, o Performance (com o pagamento ali
mesmo, a contagem de dias e os avisos), o link curto dos posts e a escada de upgrades.
Os dados e a cobrança moram no **estúdio** (o Supabase central e a página
`rafaelrazeira.com.br/assinar` e `/upgrade`), nunca no banco da loja.

**Regra:** não se edita esta pasta dentro de uma loja. Melhorou, melhora no `_molde`,
sobe a versão aqui e na tag, e copia a pasta inteira para as lojas.

## O que tem

| Pasta | O quê |
|---|---|
| `lib/` | `performance` (a única porta para o central), `desempenho` (os números), `atencao` (as notas), `oferta-performance` (os preços que o painel EXIBE; quem cobra é o estúdio), `medir` (os eventos no navegador), `link-curto` |
| `componentes/` | `Medidor` (vai no layout do site), `MarcaDono` (no layout do painel), `SeloPerformance`, `HojeNaLoja`, `ProximoPasso` (a escada) e `desempenho/*` (a aba, o modal do plano, o pagar ali mesmo, a contagem) |
| `rotas/` | o miolo das três rotas: `desempenho/pagina.tsx` (+ `acoes.ts`, `desempenho.css`), `evento.ts`, `link-curto.tsx` |

## O contrato: o que a loja precisa ter

A camada só depende disto, e é isto que se confere numa loja antiga antes de copiar:

- `@/data/site.config` exporta `site` com `url` (o domínio público da loja).
- `@/lib/tipos` exporta o tipo `Produto` (com `slug`, `nome`, `ativo`, `imagens`, `tamanhos_esgotados`).
- `@/lib/formato` exporta `slugar`.
- `@/lib/auth` exporta `sessao()` (devolve `{ autenticado }`) e `exigirSessao()` (lança sem login; usada pelas ações da aba).
- `@/lib/dados` exporta `carregarCatalogo()` e `pecaParaMedir(slug)`.

## Os três stubs no `app/`

O Next exige a configuração da rota escrita no próprio arquivo, então ficam no `app/`
três arquivos de duas linhas que apontam para cá:

- `app/painel/desempenho/page.tsx`
- `app/api/evento/route.ts`
- `app/[codigo]/page.tsx` (o link curto; numa loja com rota raiz própria, como
  `/equipe` na Full Time, acrescentar o nome em `RESERVADOS` de `lib/link-curto.ts`)

## Instalar numa loja antiga

1. Conferir o contrato acima (o `pecaParaMedir` costuma faltar: copiar do `lib/dados.ts` do molde).
2. Copiar a pasta `estudio/` inteira e os três stubs.
3. Pôr `<Medidor />` no layout do site e `<MarcaDono />` no do painel, e os eventos de
   `busca` e `esgotado` no catálogo e na página da peça (ver `components/Catalogo.tsx` e
   `components/CompraProduto.tsx` do molde).
4. Pôr a aba Desempenho no menu do painel.
5. Gerar a chave da loja no CRM (Performance › Gerar a chave) e pôr `PERF_URL`,
   `PERF_ANON` e `PERF_CHAVE` na Vercel da loja. Sem elas tudo fica calado: a contagem
   responde 204 e a aba diz que não está ligada.
6. `npx tsc --noEmit` e `next build` com o exit code lido, antes de publicar.

## O que nunca fazer

- Nunca pôr `PERF_CHAVE` como `NEXT_PUBLIC_`: quem tiver a chave lê e infla os números da loja.
- Nunca escrever preço nesta pasta fora de `lib/oferta-performance.ts`; e o que vale na
  cobrança é o `lib/oferta-performance.ts` do estúdio.
- Loja que pagou "uma vez só" (a Japa) fica `para_sempre` no central: nenhuma faixa de
  renovação, modal do plano ou escada de upgrade pode aparecer para ela.
- Loja que já conta visitas no próprio banco (a Japa) não troca de contagem sem migrar o
  histórico e os links de post: a troca direta faz a contagem parar em silêncio.
