import type { Filtros, Produto } from "./tipos";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function precoVigente(p: Produto): number | null {
  return p.preco_promocional ?? p.preco ?? null;
}

export function temDesconto(p: Produto): boolean {
  return (
    p.preco_promocional !== null &&
    p.preco !== null &&
    p.preco_promocional < p.preco
  );
}

/**
 * Filtro e ordenação do catálogo. Roda no servidor e no cliente com o
 * mesmo resultado — o catálogo é pequeno e cabe na memória.
 */
export function filtrar(produtos: Produto[], f: Filtros = {}): Produto[] {
  const busca = f.busca ? normalizar(f.busca).trim() : "";
  const marcas = f.marca?.length ? f.marca.map(normalizar) : null;
  const tamanhos = f.tamanho?.length ? f.tamanho.map(normalizar) : null;

  const lista = produtos.filter((p) => {
    if (!f.incluirInativos && !p.ativo) return false;
    if (f.categoria && p.categoria_slug !== f.categoria) return false;
    if (marcas && !marcas.includes(normalizar(p.marca ?? ""))) return false;
    if (tamanhos && !p.tamanhos.some((t) => tamanhos.includes(normalizar(t))))
      return false;

    const preco = precoVigente(p);
    if (f.precoMin !== undefined && (preco === null || preco < f.precoMin))
      return false;
    if (f.precoMax !== undefined && (preco === null || preco > f.precoMax))
      return false;

    if (busca) {
      const campos = normalizar(
        [p.nome, p.codigo, p.marca ?? "", p.descricao ?? "", ...p.cores].join(" "),
      );
      if (!busca.split(/\s+/).every((termo) => campos.includes(termo)))
        return false;
    }
    return true;
  });

  const ordem = f.ordem ?? "recentes";
  return [...lista].sort((a, b) => {
    if (ordem === "menor-preco" || ordem === "maior-preco") {
      const pa = precoVigente(a);
      const pb = precoVigente(b);
      // peças sem preço cadastrado vão para o fim, em qualquer direção
      if (pa === null && pb === null) return a.ordem - b.ordem;
      if (pa === null) return 1;
      if (pb === null) return -1;
      return ordem === "menor-preco" ? pa - pb : pb - pa;
    }
    return a.ordem - b.ordem;
  });
}

export function marcasDisponiveis(produtos: Produto[]): string[] {
  return [...new Set(produtos.map((p) => p.marca).filter(Boolean) as string[])].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
}

export function tamanhosDisponiveis(produtos: Produto[]): string[] {
  return [...new Set(produtos.flatMap((p) => p.tamanhos))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );
}

export function faixaDePreco(produtos: Produto[]): [number, number] | null {
  const precos = produtos
    .map(precoVigente)
    .filter((v): v is number => v !== null);
  if (!precos.length) return null;
  return [Math.floor(Math.min(...precos)), Math.ceil(Math.max(...precos))];
}
