# Vitrine da Arena Imports Floripa

Prévia da vitrine digital da **Arena Imports Floripa** (@arenaimportsfloripa),
loja de rua em São José, na Grande Florianópolis: chuteiras, tênis de corrida,
sneakers e bolsas de grife importados. Next 15 + Tailwind v4, em modo local:
o catálogo vem de `data/catalogo.json` e as fotos de `public/produtos/*.webp`,
exportados da oficina do estúdio.

    npx next dev -p 3160
    npm run build

## De onde vêm os dados

- **Catálogo**: 41 mídias colhidas do Instagram pela oficina (Business
  Discovery), lidas na conversa e reduzidas a 16 modelos em 4 categorias
  (chuteiras, tênis de corrida, sneakers, bolsas); 22 mídias eram reels
  escuros ou a mesma arte da marca repetida. Exportado por
  `scripts/exportar-vitrine.ts arenaimportsfloripa ~/Desktop/vitrines/arena-imports-floripa --codigo AR --ordem "Tênis de corrida,Sneakers,Chuteiras,Bolsas"`
  no repo do estúdio. Depois do export, quatro fotos de reel perderam as
  barras pretas e a do Superfly perdeu a faixa com o telefone da loja.
- **Marca**: o símbolo (o A dentro do arco) e o letreiro estão em
  `public/marca/` (`simbolo.png`, `logo.png`), recortados da arte do feed
  com o preto virando transparência. São imagens coloridas, não máscaras:
  só entram sobre o preto.
- Favicon e OG: `node scripts/gerar-icones.mjs`.

## A identidade: "sob os refletores"

A loja física é preta com o logo aceso em verde neon, e a página segue a
loja. Preto como superfície da marca, branco como chão do catálogo, cinza
de quadra como segunda superfície clara, e o verde do arco (`#cef745`) só
onde a loja acende: o marcador de raia sob cada régua de seção, o refletor
que acende no hover da prateleira do hero, o preço, o botão dentro do
preto. Chakra Petch itálica em caixa alta para manchetes (a letra da placa)
e Barlow no corpo.

## O que a loja NÃO disse (não inventar)

Preço de nenhum modelo, numerações, forma de pagamento, prazo e valor do
envio. As legendas dizem "envio para todo o Brasil" e "chame no WhatsApp e
consulte tamanhos e disponibilidade"; as artes dizem "importados diretamente
da China, qualidade premium". O WhatsApp da loja (48 98422-0326) e o
telefone do Google (48 3249-2499) não entram na prévia: ver `PREVIA` em
`data/site.config.ts`.
