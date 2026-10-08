import { notFound, redirect } from "next/navigation";
import { TEM_PERFORMANCE, postExiste } from "@/estudio/lib/performance";


/**
 * O LINK CURTO DO POST (02/10/2026, Japa): lojadela.com.br/bio,
 * lojadela.com.br/flack. O link "mais limpo possível" para a bio do
 * Instagram; o ?de=story-do-flack-ii tinha caractere demais.
 *
 * Mora na RAIZ do app, fora do grupo (site), de propósito: dentro dele o
 * loading.tsx abre um limite de Suspense e o notFound() chega depois do
 * status já enviado, e toda URL desconhecida virava 200 com cara de 404
 * (visto no build de 06/10). Aqui não há limite, e o 404 é 404.
 *
 * As rotas fixas (catalogo, produto, painel, api) têm prioridade sobre
 * esta, então ela só recebe o que não é página do site. Se o código é de
 * um link criado na aba Desempenho (no central do estúdio), leva para a
 * vitrine com ?de= (que é o que a contagem lê); se não é, é um 404 como
 * qualquer outro. Sem Performance ligado, tudo aqui é 404.
 */
export default async function LinkCurto({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const slug = decodeURIComponent(codigo).toLowerCase();
  if (!TEM_PERFORMANCE || !/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  if (!(await postExiste(slug))) notFound();
  redirect(`/?de=${slug}`);
}
