import { conferirVariacoes } from "@vitrine/plataforma/lib/gestao-revisao";
import { NextResponse, type NextRequest } from "next/server";
import { catalogoParaRevisao } from "@vitrine/plataforma/lib/dados";
import { disponibilidade, chaveLinha, type LinhaSacola } from "@vitrine/plataforma/lib/escolhas";
import { numerosDe } from "@vitrine/plataforma/lib/formato";
export async function POST(req: NextRequest) {
  const headers = { "Cache-Control":"no-store" };
  const origin = req.headers.get("origin"); const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (origin && new URL(origin).host !== host) return NextResponse.json({erro:"Origem inválida"},{status:403,headers});
    const text = await req.text(); if (text.length > 8000) return NextResponse.json({erro:"Pedido muito grande"},{status:413,headers});
    const body = JSON.parse(text);
    if (!Array.isArray(body.itens) || body.itens.length > 20 || !body.itens.length) throw new Error("itens");
    const itens: LinhaSacola[] = body.itens;
    const unicos = new Set<string>();
    for (const r of itens) {
      if (!r || typeof r.id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(r.id) || typeof r.tamanho !== "string" || r.tamanho.length > 12 || typeof r.cor !== "string" || r.cor.length > 60 || !Number.isInteger(r.quantidade) || r.quantidade < 1 || r.quantidade > 20 || unicos.has(chaveLinha(r))) throw new Error("itens");
      unicos.add(chaveLinha(r));
    }
    let catalogo;
    try { catalogo = await catalogoParaRevisao(); } catch { return NextResponse.json({erro:"Não foi possível atualizar as peças"},{status:503,headers}); }
    const ids = new Set(itens.map(r => r.id));
    const ativos = catalogo.filter(p => p.ativo && ids.has(p.id));
    const erros: Record<string,string> = {};
    const quantidades = new Map<string,number>();
    for (const r of itens) { const chave = JSON.stringify([r.id,r.tamanho]); quantidades.set(chave,(quantidades.get(chave) ?? 0) + r.quantidade); }
    for (const r of itens) {
      const p = ativos.find(p => p.id === r.id);
      const problema = disponibilidade(p,r);
      if (problema) erros[chaveLinha(r)] = problema;
      else if (p?.estoque && r.tamanho && typeof p.estoque[r.tamanho] === "number" && quantidades.get(JSON.stringify([r.id,r.tamanho]))! > p.estoque[r.tamanho]) erros[chaveLinha(r)] = "Esta quantidade precisa ser revista. Reduza ou consulte a loja.";
    }
    Object.assign(erros,await conferirVariacoes(itens));
    const produtos = ativos.map(({ estoque, ...p }) => ({ ...p, tamanhos_poucos:numerosDe(p).filter(n => estoque?.[n] === 1) }));
    return NextResponse.json({ produtos, erros },{headers});
  } catch { return NextResponse.json({erro:"Escolhas inválidas"},{status:400,headers}); }
}
