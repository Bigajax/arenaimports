"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CardProduto } from "./CardProduto";
import {
  faixaDePreco,
  filtrar,
  marcasDisponiveis,
  tamanhosDisponiveis,
} from "@/lib/filtro";
import { paraNumero, precoBRL } from "@/lib/formato";
import type { Categoria, Ordenacao, Produto } from "@/lib/tipos";

/* a loja pediu sem limite: tudo aparece de uma vez, o botão só existe
   por segurança se um dia o catálogo passar de 400 */
const POR_PAGINA = 400;

const ORDENS: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Recentes" },
  { valor: "menor-preco", rotulo: "Menor preço" },
  { valor: "maior-preco", rotulo: "Maior preço" },
];

export function Catalogo({
  produtos,
  categorias,
  categoriaAtual,
  escopoFechado = false,
  buscaInicial = "",
  linkWhats,
}: {
  produtos: Produto[];
  categorias: Categoria[];
  categoriaAtual?: string;
  /* a página já entregou só as peças do escopo (uma porta que junta categorias) */
  escopoFechado?: boolean;
  buscaInicial?: string;
  linkWhats: string;
}) {
  const [busca, setBusca] = useState(buscaInicial);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [ordem, setOrdem] = useState<Ordenacao>("recentes");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const doEscopo = useMemo(
    () =>
      categoriaAtual && !escopoFechado
        ? produtos.filter((p) => p.categoria_slug === categoriaAtual)
        : produtos,
    [produtos, categoriaAtual, escopoFechado],
  );

  const opcoesMarca = useMemo(() => marcasDisponiveis(doEscopo), [doEscopo]);
  const opcoesTamanho = useMemo(() => tamanhosDisponiveis(doEscopo), [doEscopo]);
  const faixa = useMemo(() => faixaDePreco(doEscopo), [doEscopo]);

  const lista = useMemo(
    () =>
      filtrar(doEscopo, {
        busca,
        marca: marcas,
        tamanho: tamanhos,
        precoMin: paraNumero(precoMin) ?? undefined,
        precoMax: paraNumero(precoMax) ?? undefined,
        ordem,
      }),
    [doEscopo, busca, marcas, tamanhos, precoMin, precoMax, ordem],
  );

  useEffect(() => setVisiveis(POR_PAGINA), [busca, marcas, tamanhos, ordem, precoMin, precoMax]);

  const temFiltro =
    Boolean(busca) ||
    marcas.length > 0 ||
    tamanhos.length > 0 ||
    Boolean(precoMin) ||
    Boolean(precoMax);

  function limpar() {
    setBusca("");
    setMarcas([]);
    setTamanhos([]);
    setPrecoMin("");
    setPrecoMax("");
  }

  const alterna = (
    valor: string,
    atual: string[],
    definir: (v: string[]) => void,
  ) =>
    definir(
      atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor],
    );

  const painelFiltros = (
    <div className="space-y-9">
      {opcoesMarca.length > 1 ? (
        <Grupo titulo="Marca">
          <div className="flex flex-wrap gap-2">
            {opcoesMarca.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={marcas.includes(m)}
                onClick={() => alterna(m, marcas, setMarcas)}
              >
                {m}
              </button>
            ))}
          </div>
        </Grupo>
      ) : null}

      {opcoesTamanho.length ? (
        <Grupo titulo="Tamanho">
          <div className="flex flex-wrap gap-2">
            {opcoesTamanho.map((t) => (
              <button
                key={t}
                type="button"
                className="chip"
                aria-pressed={tamanhos.includes(t)}
                onClick={() => alterna(t, tamanhos, setTamanhos)}
              >
                {t}
              </button>
            ))}
          </div>
        </Grupo>
      ) : null}

      {faixa ? (
        <Grupo titulo={`Preço · ${precoBRL(faixa[0])} a ${precoBRL(faixa[1])}`}>
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="preco-min">
              Preço mínimo
            </label>
            <input
              id="preco-min"
              inputMode="numeric"
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              placeholder="de"
              className="busca-linha w-24 py-2 text-xs"
            />
            <span className="miudo">a</span>
            <label className="sr-only" htmlFor="preco-max">
              Preço máximo
            </label>
            <input
              id="preco-max"
              inputMode="numeric"
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              placeholder="até"
              className="busca-linha w-24 py-2 text-xs"
            />
          </div>
        </Grupo>
      ) : null}

      {temFiltro ? (
        <button type="button" onClick={limpar} className="btn btn--texto">
          Limpar filtros
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="miolo pb-20">
      {/* as categorias sempre à vista, num trilho de pílulas: no celular rola
          de lado, no desktop cabe inteiro. É o filtro que mais se usa. */}
      <nav aria-label="Categorias" className="faixa-scroll sangra flex gap-2 overflow-x-auto pb-3 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link href="/catalogo" className={`chip chip--quadrado shrink-0 ${!categoriaAtual && !escopoFechado ? "chip--cheio" : ""}`} aria-current={!categoriaAtual && !escopoFechado ? "page" : undefined}>
          Tudo
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.slug}
            href={`/catalogo/${c.slug}`}
            className={`chip chip--quadrado shrink-0 ${categoriaAtual === c.slug ? "chip--cheio" : ""}`}
            aria-current={categoriaAtual === c.slug ? "page" : undefined}
          >
            {c.nome}
          </Link>
        ))}
      </nav>

      {/* barra de comando: busca, contagem, ordem e o filtro fino */}
      <div className="mt-2 flex flex-col gap-4 border-y border-linha py-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <label
            htmlFor="busca-catalogo"
            className="mono-rotulo hidden shrink-0 text-ouro-texto sm:block"
          >
            Buscar
          </label>
          <input
            id="busca-catalogo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou cor"
            aria-label="Buscar por nome ou marca"
            className="busca-linha min-w-0 flex-1 sm:max-w-xs"
          />
        </div>

        <div className="flex items-center gap-6">
          <p className="mono shrink-0 text-[0.8125rem] text-tinta-fraca">
            <span className="preco text-[1.125rem] text-tinta">{lista.length}</span>{" "}
            {lista.length === 1 ? "modelo" : "modelos"}
          </p>

          <div className="flex items-center gap-3">
            <label
              htmlFor="ordem"
              className="mono-rotulo hidden shrink-0 text-ouro-texto md:block"
            >
              Ordem
            </label>
            <select
              id="ordem"
              aria-label="Ordenar os modelos"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordenacao)}
              className="busca-linha campo--auto cursor-pointer pr-1"
            >
              {ORDENS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </div>

          {opcoesMarca.length > 1 || opcoesTamanho.length || faixa ? (
            <span className="ml-auto">
              <button type="button" onClick={() => setFiltrosAbertos(true)} className="btn btn--linha px-4 py-2.5" aria-expanded={filtrosAbertos}>
                Filtrar{temFiltro ? " ·" : ""}
              </button>
            </span>
          ) : null}
        </div>
      </div>

      <div className="pt-6">
        <div>
          {lista.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {lista.slice(0, visiveis).map((p, i) => (
                  <CardProduto key={p.id} produto={p} categoria={categorias.find((c) => c.slug === p.categoria_slug)} prioridade={i < 4} />
                ))}
              </div>
              {visiveis < lista.length ? (
                <div className="mt-16 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisiveis((v) => v + POR_PAGINA)}
                    className="btn btn--linha"
                  >
                    Carregar mais ({lista.length - visiveis})
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mx-auto max-w-md cartao p-10 text-center">
              <p className="manchete text-[1.25rem] text-tinta">
                Nenhum modelo com esses filtros
              </p>
              <p className="mt-3 text-sm leading-relaxed text-tinta">
                Limpe os filtros ou pergunte no WhatsApp: a loja tem mais do que a vitrine mostra.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={limpar} className="btn btn--linha">
                  Limpar filtros
                </button>
                <a
                  href={linkWhats}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primario"
                >
                  Chamar no WhatsApp
                </a>
              </div>
                          </div>
          )}
        </div>
      </div>

      {filtrosAbertos ? (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={() => setFiltrosAbertos(false)}
        >
          <div
            className="ml-auto flex h-full w-[min(22rem,90vw)] flex-col overflow-y-auto bg-papel-2 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="mono-rotulo text-ouro-texto">Filtros</span>
              <button
                type="button"
                onClick={() => setFiltrosAbertos(false)}
                className="mono-rotulo text-ouro-texto"
              >
                Fechar
              </button>
            </div>
            {painelFiltros}
            <button
              type="button"
              onClick={() => setFiltrosAbertos(false)}
              className="btn btn--primario mt-10"
            >
              Ver {lista.length} {lista.length === 1 ? "modelo" : "modelos"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="miudo mb-3">
        {titulo}
      </h3>
      {children}
    </section>
  );
}
