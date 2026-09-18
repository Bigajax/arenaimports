"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { alternarCampo } from "@/lib/acoes";
import { codigoPeca, precoBRL } from "@/lib/formato";
import { FormPeca } from "./FormPeca";
import { Icone } from "@/components/Icones";
import type { Categoria, Produto } from "@/lib/tipos";

type Aba = "todas" | "pronta" | "encomenda" | "escondidas";

/**
 * A lista do painel, feita para o polegar: cada peça é uma linha alta
 * (foto, nome, preço) com dois interruptores à direita, "em mãos" e
 * "no ar". Tocar na linha abre a peça num MODAL por cima da lista (no
 * celular ele ocupa a tela inteira, como uma folha que sobe): salvou,
 * fechou, e a lista continua onde estava. As abas do topo são as
 * quatro perguntas que o dono faz pelo celular: o que está em mãos, o
 * que é encomenda, o que está escondido. O botão de peça nova fica
 * preso no pé, sempre à mão. O placar do topo é a loja em três
 * números, na letra da placa.
 */
export function PainelPecas({ produtosIniciais, categorias }: { produtosIniciais: Produto[]; categorias: Categoria[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [produtos, setProdutos] = useState(produtosIniciais);
  /* null = fechado; "nova" = peça em branco; id = a peça */
  const [aberta, setAberta] = useState<string | null>(params.get("peca"));
  useEffect(() => setProdutos(produtosIniciais), [produtosIniciais]);
  useEffect(() => {
    if (!aberta) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberta(null);
    window.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [aberta]);
  const proximoCodigo = useMemo(() => codigoPeca(produtos.reduce((max, p) => Math.max(max, Number(p.codigo.replace(/\D/g, "")) || 0), 0) + 1), [produtos]);
  const emEdicao = aberta && aberta !== "nova" ? (produtos.find((p) => p.id === aberta) ?? null) : null;
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

  async function alternar(p: Produto, campo: "ativo" | "pronta_entrega" | "destaque") {
    const valor = !p[campo];
    setOcupado(`${p.id}-${campo}`);
    setProdutos((atual) => atual.map((x) => (x.id === p.id ? { ...x, [campo]: valor } : x)));
    const r = await alternarCampo(p.id, campo, valor);
    setOcupado(null);
    if (!r.ok) {
      setProdutos((atual) => atual.map((x) => (x.id === p.id ? { ...x, [campo]: !valor } : x)));
      return avisar(r.erro);
    }
    avisar(campo === "ativo" ? (valor ? "Peça no ar" : "Peça escondida") : campo === "destaque" ? (valor ? "No destaque da página inicial" : "Fora do destaque") : valor ? "Marcada como pronta entrega" : "Marcada como sob encomenda");
  }

  const ABAS: { chave: Aba; nome: string }[] = [
    { chave: "todas", nome: "Todas" },
    { chave: "pronta", nome: "Em mãos" },
    { chave: "encomenda", nome: "Encomenda" },
    { chave: "escondidas", nome: "Escondidas" },
  ];

  return (
    <div className="pn-pagina">
      {/* ---------- o placar ---------- */}
      <div className="pn-placar">
        <button type="button" onClick={() => setAba("pronta")} className={`pn-placa ${aba === "pronta" ? "pn-placa--on" : ""}`}>
          <b>{conta.pronta}</b>
          <span>em mãos</span>
        </button>
        <button type="button" onClick={() => setAba("encomenda")} className={`pn-placa ${aba === "encomenda" ? "pn-placa--on" : ""}`}>
          <b>{conta.encomenda}</b>
          <span>sob encomenda</span>
        </button>
        <button type="button" onClick={() => setAba("escondidas")} className={`pn-placa ${aba === "escondidas" ? "pn-placa--on" : ""}`}>
          <b>{conta.escondidas}</b>
          <span>escondidas</span>
        </button>
      </div>
      <p className="pn-dica">
        <span className="pn-estrela pn-estrela--on pn-estrela--mini" aria-hidden="true">★</span> A estrela coloca a peça no destaque da página inicial (as 12 primeiras estreladas).
      </p>

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
              <li key={p.id} className={`pn-linha ${p.ativo ? "" : "pn-linha--escondida"} ${p.destaque ? "pn-linha--estrela" : ""}`}>
                <button type="button" onClick={() => setAberta(p.id)} className="pn-linha-abrir">
                  <span className="pn-foto">
                    {capa ? <Image src={capa.url} alt="" fill sizes="72px" placeholder={capa.blur ? "blur" : "empty"} blurDataURL={capa.blur ?? undefined} className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="pn-codigo">{p.codigo}</span>
                    <span className="pn-nome">{p.nome}</span>
                    <span className="pn-meta">
                      {preco ?? "sem preço"}
                      {p.tamanhos.length ? ` · ${p.tamanhos.length} tam.` : ""}
                      {p.categoria_slug ? ` · ${nomeDaCategoria.get(p.categoria_slug) ?? p.categoria_slug}` : ""}
                    </span>
                  </span>
                </button>
                <span className="pn-chaves">
                  <button type="button" onClick={() => alternar(p, "destaque")} disabled={ocupado === `${p.id}-destaque`} aria-pressed={p.destaque} aria-label={p.destaque ? "Tirar do destaque" : "Colocar no destaque da página inicial"} title={p.destaque ? "No destaque da página inicial" : "Colocar no destaque"} className={`pn-estrela ${p.destaque ? "pn-estrela--on" : ""}`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={p.destaque ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
                      <path d="M12 3.4l2.5 5.6 6.1.6-4.6 4.1 1.4 6L12 16.6l-5.4 3.1 1.4-6-4.6-4.1 6.1-.6z" />
                    </svg>
                  </button>
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
        <button type="button" onClick={() => setAberta("nova")} className="btn btn--raio w-full">
          + Nova peça
        </button>
      </div>

      {aberta ? (
        <div className="pn-modal-veu" onClick={(e) => e.target === e.currentTarget && setAberta(null)}>
          <div role="dialog" aria-modal="true" aria-label={emEdicao ? emEdicao.nome : "Nova peça"} className="pn-modal">
            <FormPeca
              key={aberta}
              produto={emEdicao}
              categorias={categorias}
              proximoCodigo={proximoCodigo}
              aoFechar={() => setAberta(null)}
              aoConcluir={(texto) => {
                setAberta(null);
                avisar(texto);
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}

      {recado ? (
        <p role="status" className="pn-recado">
          {recado}
        </p>
      ) : null}
    </div>
  );
}
