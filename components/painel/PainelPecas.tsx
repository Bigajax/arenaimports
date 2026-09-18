"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { alternarCampo } from "@/lib/acoes";
import { precoBRL } from "@/lib/formato";
import { Icone } from "@/components/Icones";
import type { Categoria, Produto } from "@/lib/tipos";

type Aba = "todas" | "pronta" | "encomenda" | "escondidas";

/**
 * A lista do painel, feita para o polegar: cada peça é uma linha alta
 * (foto, nome, preço) com dois interruptores à direita, "em mãos" e
 * "no ar". Tocar na linha abre a peça inteira. As abas do topo são as
 * quatro perguntas que a dona da loja faz pelo celular: o que está em
 * mãos, o que é encomenda, o que está escondido. O botão de peça nova
 * fica preso no pé, sempre à mão.
 */
export function PainelPecas({ produtosIniciais, categorias }: { produtosIniciais: Produto[]; categorias: Categoria[] }) {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<Aba>("todas");
  const [recado, setRecado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const nomeDaCategoria = useMemo(() => new Map(categorias.map((c) => [c.slug, c.nome])), [categorias]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (aba === "pronta" && !(p.pronta_entrega && p.ativo)) return false;
      if (aba === "encomenda" && !(!p.pronta_entrega && p.ativo)) return false;
      if (aba === "escondidas" && p.ativo) return false;
      if (!termo) return true;
      return [p.nome, p.codigo, p.marca ?? "", nomeDaCategoria.get(p.categoria_slug ?? "") ?? ""].join(" ").toLowerCase().includes(termo);
    });
  }, [produtos, busca, aba, nomeDaCategoria]);

  const conta = {
    todas: produtos.length,
    pronta: produtos.filter((p) => p.pronta_entrega && p.ativo).length,
    encomenda: produtos.filter((p) => !p.pronta_entrega && p.ativo).length,
    escondidas: produtos.filter((p) => !p.ativo).length,
  };

  function avisar(texto: string) {
    setRecado(texto);
    setTimeout(() => setRecado(null), 2600);
  }

  async function alternar(p: Produto, campo: "ativo" | "pronta_entrega") {
    const valor = !p[campo];
    setOcupado(`${p.id}-${campo}`);
    setProdutos((atual) => atual.map((x) => (x.id === p.id ? { ...x, [campo]: valor } : x)));
    const r = await alternarCampo(p.id, campo, valor);
    setOcupado(null);
    if (!r.ok) {
      setProdutos((atual) => atual.map((x) => (x.id === p.id ? { ...x, [campo]: !valor } : x)));
      return avisar(r.erro);
    }
    avisar(campo === "ativo" ? (valor ? "Peça no ar" : "Peça escondida") : valor ? "Marcada como pronta entrega" : "Marcada como sob encomenda");
  }

  const ABAS: { chave: Aba; nome: string }[] = [
    { chave: "todas", nome: "Todas" },
    { chave: "pronta", nome: "Em mãos" },
    { chave: "encomenda", nome: "Encomenda" },
    { chave: "escondidas", nome: "Escondidas" },
  ];

  return (
    <div className="pn-pagina">
      <div className="pn-topo">
        <label className="pn-busca">
          <Icone nome="lupa" className="h-5 w-5 shrink-0 text-tinta-fraca" peso={2} />
          <span className="sr-only">Buscar peça</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, marca ou categoria" inputMode="search" />
          {busca ? (
            <button type="button" onClick={() => setBusca("")} aria-label="Limpar a busca" className="grid h-8 w-8 place-items-center text-tinta-fraca">
              <Icone nome="fechar" className="h-4 w-4" />
            </button>
          ) : null}
        </label>
        <div className="pn-abas" role="tablist" aria-label="Filtrar peças">
          {ABAS.map((a) => (
            <button key={a.chave} type="button" role="tab" aria-selected={aba === a.chave} onClick={() => setAba(a.chave)} className="pn-aba">
              {a.nome}
              <span className="pn-aba-n">{conta[a.chave]}</span>
            </button>
          ))}
        </div>
      </div>

      {visiveis.length ? (
        <ul className="pn-lista">
          {visiveis.map((p) => {
            const capa = p.imagens[0];
            const preco = precoBRL(p.preco_promocional ?? p.preco);
            return (
              <li key={p.id} className={`pn-linha ${p.ativo ? "" : "pn-linha--escondida"}`}>
                <Link href={`/painel/peca/${p.id}`} className="pn-linha-abrir">
                  <span className="pn-foto">
                    {capa ? <Image src={capa.url} alt="" fill sizes="72px" placeholder={capa.blur ? "blur" : "empty"} blurDataURL={capa.blur ?? undefined} className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="pn-nome">{p.nome}</span>
                    <span className="pn-meta">
                      {preco ?? "sem preço"}
                      {p.tamanhos.length ? ` · ${p.tamanhos.join(" ")}` : ""}
                      {p.categoria_slug ? ` · ${nomeDaCategoria.get(p.categoria_slug) ?? p.categoria_slug}` : ""}
                    </span>
                  </span>
                </Link>
                <span className="pn-chaves">
                  <button type="button" onClick={() => alternar(p, "pronta_entrega")} disabled={ocupado === `${p.id}-pronta_entrega`} aria-pressed={p.pronta_entrega} className={`pn-chave ${p.pronta_entrega ? "pn-chave--verde" : ""}`}>
                    <Icone nome="relampago" className="h-4 w-4" peso={2} />
                    {p.pronta_entrega ? "Em mãos" : "Encomenda"}
                  </button>
                  <button type="button" onClick={() => alternar(p, "ativo")} disabled={ocupado === `${p.id}-ativo`} aria-pressed={p.ativo} className={`pn-chave ${p.ativo ? "pn-chave--cheia" : ""}`}>
                    {p.ativo ? "No ar" : "Escondida"}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="pn-vazio">{busca ? "Nenhuma peça com esse nome." : aba === "pronta" ? "Nada marcado como pronta entrega. Toque em Encomenda numa peça para marcar." : "Nada aqui."}</p>
      )}

      <div className="pn-pe">
        <Link href="/painel/peca/nova" className="btn btn--raio w-full">
          + Nova peça
        </Link>
      </div>

      {recado ? (
        <p role="status" className="pn-recado">
          {recado}
        </p>
      ) : null}
    </div>
  );
}
