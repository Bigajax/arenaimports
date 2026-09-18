"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ModalPeca } from "./ModalPeca";
import { alternarCampo, reordenarProdutos } from "@/lib/acoes";
import { codigoPeca, precoBRL } from "@/lib/formato";
import { marcasDisponiveis } from "@/lib/filtro";
import type { Categoria, Produto } from "@/lib/tipos";

type Aviso = { id: number; texto: string; tipo: "ok" | "erro" };

export function ListaProdutos({
  produtosIniciais,
  categorias,
}: {
  produtosIniciais: Produto[];
  categorias: Categoria[];
}) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [emEdicao, setEmEdicao] = useState<Produto | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const arrastado = useRef<string | null>(null);

  useEffect(() => setProdutos(produtosIniciais), [produtosIniciais]);

  function avisar(texto: string, tipo: "ok" | "erro" = "ok") {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200);
  }

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (categoria && p.categoria_slug !== categoria) return false;
      if (!termo) return true;
      return [p.nome, p.codigo, p.marca ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
  }, [produtos, busca, categoria]);

  const contadores = {
    total: produtos.length,
    ativas: produtos.filter((p) => p.ativo).length,
    destaque: produtos.filter((p) => p.destaque).length,
  };

  const proximoCodigo = useMemo(() => {
    const maior = produtos.reduce((max, p) => {
      const n = Number(p.codigo.replace(/\D/g, ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    return codigoPeca(maior + 1);
  }, [produtos]);

  async function alternar(p: Produto, campo: "ativo" | "destaque") {
    const valor = !p[campo];
    setOcupado(`${p.id}-${campo}`);
    setProdutos((atual) =>
      atual.map((x) => (x.id === p.id ? { ...x, [campo]: valor } : x)),
    );
    const r = await alternarCampo(p.id, campo, valor);
    setOcupado(null);
    if (!r.ok) {
      setProdutos((atual) =>
        atual.map((x) => (x.id === p.id ? { ...x, [campo]: !valor } : x)),
      );
      return avisar(r.erro, "erro");
    }
    const nomes = { ativo: valor ? "Peça ativada" : "Peça desativada", destaque: valor ? "Peça em destaque" : "Peça fora do destaque" };
    avisar(nomes[campo]);
  }

  async function soltarLinha(destinoId: string) {
    const origemId = arrastado.current;
    arrastado.current = null;
    if (!origemId || origemId === destinoId) return;

    const copia = [...produtos];
    const de = copia.findIndex((p) => p.id === origemId);
    const para = copia.findIndex((p) => p.id === destinoId);
    if (de < 0 || para < 0) return;
    const [movido] = copia.splice(de, 1);
    copia.splice(para, 0, movido);
    setProdutos(copia);

    const r = await reordenarProdutos(copia.map((p) => p.id));
    if (!r.ok) {
      setProdutos(produtos);
      return avisar(r.erro, "erro");
    }
    avisar("Nova ordem salva");
  }

  function abrirNova() {
    setEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(p: Produto) {
    setEmEdicao(p);
    setModalAberto(true);
  }

  const marcas = marcasDisponiveis(produtos);
  const podeArrastar = !busca && !categoria;

  return (
    <div className="mx-auto max-w-[76rem] px-4 pb-28 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display-secao text-tinta">Peças</h1>
          <p className="mono mt-3 text-[0.75rem] text-marrom-fundo">
            {contadores.total} no total · {contadores.ativas} ativas ·{" "}
            {contadores.destaque} em destaque
          </p>
        </div>
        <button type="button" onClick={abrirNova} className="btn btn--primario">
          Nova peça
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-b border-cimento-medio pb-6">
        <label htmlFor="busca-painel" className="sr-only">
          Buscar peça
        </label>
        <input
          id="busca-painel"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou marca"
          className="campo campo--mono max-w-xs py-2.5 text-xs"
        />
        <label htmlFor="categoria-painel" className="sr-only">
          Filtrar por categoria
        </label>
        <select
          id="categoria-painel"
          aria-label="Filtrar por categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="campo campo--mono campo--auto py-2.5 text-xs"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {podeArrastar ? (
        <p className="mono mt-4 text-[0.6875rem] text-marrom-fundo">
          Arraste as linhas para mudar a ordem da vitrine.
        </p>
      ) : null}

      {visiveis.length ? (
        <ul className="mt-6 space-y-3">
          {visiveis.map((p) => (
            <li
              key={p.id}
              draggable={podeArrastar}
              onDragStart={() => {
                arrastado.current = p.id;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void soltarLinha(p.id)}
              className={`grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 border border-cimento-medio bg-off-white p-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:p-4 ${
                podeArrastar ? "cursor-grab" : ""
              }`}
            >
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-cimento-claro">
                {p.imagens[0] ? (
                  <Image
                    src={p.imagens[0].url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="display-peca truncate text-[0.8125rem] text-tinta">
                  {p.nome}
                </p>
                <p className="mono mt-1 text-[0.6875rem] text-tinta">
                  {[
                    categorias.find((c) => c.slug === p.categoria_slug)?.nome,
                    p.marca,
                    precoBRL(p.preco_promocional ?? p.preco) ?? "sem preço",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-span-1 sm:justify-end">
                <Interruptor
                  rotulo="Ativo"
                  ligado={p.ativo}
                  ocupado={ocupado === `${p.id}-ativo`}
                  aoMudar={() => void alternar(p, "ativo")}
                />
                <Interruptor
                  rotulo="Destaque"
                  ligado={p.destaque}
                  ocupado={ocupado === `${p.id}-destaque`}
                  aoMudar={() => void alternar(p, "destaque")}
                />
                <button
                  type="button"
                  onClick={() => abrirEdicao(p)}
                  className="btn btn--linha px-4 py-2"
                >
                  Editar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mono mt-10 text-[0.8125rem] text-tinta">
          Nenhuma peça com esse filtro. Limpe a busca ou cadastre uma peça nova.
        </p>
      )}

      {modalAberto ? (
        <ModalPeca
          produto={emEdicao}
          categorias={categorias}
          proximoCodigo={proximoCodigo}
          marcasConhecidas={marcas}
          avisar={avisar}
          aoFechar={() => setModalAberto(false)}
          aoSalvar={() => {
            setModalAberto(false);
            window.location.reload();
          }}
          aoExcluir={(id) => {
            setProdutos((atual) => atual.filter((x) => x.id !== id));
            setModalAberto(false);
          }}
        />
      ) : null}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex w-[min(22rem,90vw)] -translate-x-1/2 flex-col gap-2"
      >
        {avisos.map((a) => (
          <p
            key={a.id}
            className={`mono px-4 py-3 text-[0.75rem] ${
              a.tipo === "erro"
                ? "bg-tinta text-off-white"
                : "bg-off-white text-tinta"
            }`}
            style={{ boxShadow: "inset 0 0 0 1px var(--nude)" }}
          >
            {a.texto}
          </p>
        ))}
      </div>
    </div>
  );
}

function Interruptor({
  rotulo,
  ligado,
  ocupado,
  aoMudar,
}: {
  rotulo: string;
  ligado: boolean;
  ocupado: boolean;
  aoMudar: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={ocupado}
      onClick={aoMudar}
      className="flex items-center gap-2"
    >
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{
          background: ligado ? "var(--marrom-fundo)" : "var(--cimento-medio)",
          opacity: ocupado ? 0.5 : 1,
        }}
      >
        <span
          className="absolute top-[3px] h-3.5 w-3.5 rounded-full bg-off-white transition-[left]"
          style={{ left: ligado ? "1.125rem" : "0.1875rem" }}
        />
      </span>
      <span className="mono-rotulo text-tinta">{rotulo}</span>
    </button>
  );
}
