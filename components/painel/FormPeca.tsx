"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { excluirProduto, salvarProduto } from "@/lib/acoes";
import { mascaraBRL, paraNumero, slugar } from "@/lib/formato";
import { Icone } from "@/components/Icones";
import { enviarFoto } from "./upload";
import type { Categoria, Imagem, Produto } from "@/lib/tipos";

/* os tamanhos que a loja vende, na ordem da numeração; toque marca */
const TAMANHOS_SUGERIDOS = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "P", "M", "G", "GG", "Único"];

/**
 * A peça inteira, numa página só, feita para o celular: as fotos em
 * cima (a câmera abre direto), o nome, o preço com a máscara de real,
 * a categoria, os tamanhos por toque, e os três interruptores que
 * decidem onde a peça aparece (em mãos, destaque, no ar). O botão de
 * salvar fica preso no pé. Sem modal, sem duas colunas, sem campo que
 * a dona da loja não vai preencher: marca e cor são opcionais e ficam
 * dobrados em "mais detalhes".
 */
export function FormPeca({ produto, categorias, proximoCodigo, aoConcluir, aoFechar }: { produto: Produto | null; categorias: Categoria[]; proximoCodigo: string; aoConcluir: (recado: string) => void; aoFechar: () => void }) {
  const nova = !produto;
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [preco, setPreco] = useState(produto?.preco != null ? mascaraBRL(String(Math.round(produto.preco * 100))) : "");
  const [precoPromo, setPrecoPromo] = useState(produto?.preco_promocional != null ? mascaraBRL(String(Math.round(produto.preco_promocional * 100))) : "");
  const [categoria, setCategoria] = useState(produto?.categoria_slug ?? categorias[0]?.slug ?? "");
  const [tamanhos, setTamanhos] = useState<string[]>(produto?.tamanhos ?? []);
  const [outroTamanho, setOutroTamanho] = useState("");
  const [marca, setMarca] = useState(produto?.marca ?? "");
  const [cor, setCor] = useState(produto?.cores[0] ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [prontaEntrega, setProntaEntrega] = useState(produto?.pronta_entrega ?? true);
  const [destaque, setDestaque] = useState(produto?.destaque ?? false);
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [imagens, setImagens] = useState<Imagem[]>(produto?.imagens ?? []);
  const [enviando, setEnviando] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  function alternarTamanho(t: string) {
    setTamanhos((atual) => (atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t].sort((a, b) => TAMANHOS_SUGERIDOS.indexOf(a) - TAMANHOS_SUGERIDOS.indexOf(b))));
  }

  async function escolherFotos(lista: FileList | null) {
    if (!lista?.length) return;
    setErro(null);
    for (const arquivo of Array.from(lista)) {
      try {
        setEnviando(0);
        const r = await enviarFoto(arquivo, setEnviando);
        setImagens((atual) => [...atual, { url: r.url, alt: nome || null, largura: r.largura, altura: r.altura, blur: r.blur, ordem: atual.length }]);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu para enviar a foto.");
      } finally {
        setEnviando(null);
      }
    }
    if (entrada.current) entrada.current.value = "";
  }

  function tirarFoto(i: number) {
    setImagens((atual) => atual.filter((_, k) => k !== i).map((img, k) => ({ ...img, ordem: k })));
  }

  function primeira(i: number) {
    setImagens((atual) => {
      const copia = [...atual];
      const [f] = copia.splice(i, 1);
      return [f, ...copia].map((img, k) => ({ ...img, ordem: k }));
    });
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim()) return setErro("Dá um nome para a peça.");
    if (!imagens.length) return setErro("Coloca pelo menos uma foto.");
    setSalvando(true);
    const r = await salvarProduto({
      id: produto?.id,
      nome: nome.trim(),
      slug: produto?.slug ?? slugar(nome),
      codigo: produto?.codigo ?? proximoCodigo,
      descricao,
      marca,
      preco: paraNumero(preco),
      preco_promocional: paraNumero(precoPromo),
      categoria_slug: categoria || null,
      tamanhos,
      cores: cor.trim() ? [cor.trim()] : [],
      destaque,
      pronta_entrega: prontaEntrega,
      ativo,
      imagens: imagens.map((img, i) => ({ ...img, alt: nome.trim(), ordem: i })),
    });
    setSalvando(false);
    if (!r.ok) return setErro(r.erro);
    aoConcluir(nova ? "Peça no ar" : "Peça salva");
  }

  async function excluir() {
    if (!produto) return;
    if (!window.confirm(`Apagar "${produto.nome}"? Não dá para desfazer.`)) return;
    setSalvando(true);
    const r = await excluirProduto(produto.id);
    setSalvando(false);
    if (!r.ok) return setErro(r.erro);
    aoConcluir("Peça apagada");
  }

  return (
    <div className="pn-modal-corpo">
      {/* ---------- a tampa preta do modal ---------- */}
      <div className="pn-modal-cab">
        <div className="min-w-0">
          <span className="etiqueta text-raio">{nova ? "Cadastrar" : produto.codigo}</span>
          <h2 className="manchete mt-1 truncate text-[1.5rem] text-branco">{nova ? "Nova peça" : produto.nome}</h2>
        </div>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="pn-modal-fechar">
          <Icone nome="fechar" className="h-5 w-5" peso={2} />
        </button>
      </div>

      {/* ---------- as fotos ---------- */}
      <section className="pn-bloco">
        <p className="pn-rotulo">Fotos</p>
        <ul className="pn-fotos">
          {imagens.map((img, i) => (
            <li key={img.url} className="pn-foto-item">
              <Image src={img.url} alt="" fill sizes="30vw" placeholder={img.blur ? "blur" : "empty"} blurDataURL={img.blur ?? undefined} className="object-cover" />
              {i === 0 ? <span className="pn-foto-capa">Capa</span> : <button type="button" onClick={() => primeira(i)} className="pn-foto-acao pn-foto-acao--esq">Capa</button>}
              <button type="button" onClick={() => tirarFoto(i)} aria-label="Tirar esta foto" className="pn-foto-acao">
                <Icone nome="fechar" className="h-3.5 w-3.5" peso={2.2} />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => entrada.current?.click()} disabled={enviando !== null} className="pn-foto-mais">
              {enviando !== null ? <span className="text-[0.8125rem] font-semibold">{enviando}%</span> : <span className="text-[1.75rem] leading-none">+</span>}
              <span className="text-[0.75rem] font-semibold">{enviando !== null ? "enviando" : "foto"}</span>
            </button>
            <input ref={entrada} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => escolherFotos(e.target.files)} />
          </li>
        </ul>
        <p className="pn-ajuda">A primeira é a capa. A câmera abre direto no celular; no computador, escolhe o arquivo.</p>
      </section>

      {/* ---------- o essencial ---------- */}
      <section className="pn-bloco">
        <label className="pn-campo">
          <span className="pn-rotulo">Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nike Mercurial Vapor branco e azul" autoComplete="off" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="pn-campo">
            <span className="pn-rotulo">Preço</span>
            <input value={preco} onChange={(e) => setPreco(mascaraBRL(e.target.value))} placeholder="0,00" inputMode="numeric" />
          </label>
          <label className="pn-campo">
            <span className="pn-rotulo">Promoção</span>
            <input value={precoPromo} onChange={(e) => setPrecoPromo(mascaraBRL(e.target.value))} placeholder="opcional" inputMode="numeric" />
          </label>
        </div>
        <label className="pn-campo">
          <span className="pn-rotulo">Categoria</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ---------- tamanhos ---------- */}
      <section className="pn-bloco">
        <p className="pn-rotulo">Tamanhos disponíveis</p>
        <div className="pn-tamanhos">
          {TAMANHOS_SUGERIDOS.map((t) => (
            <button key={t} type="button" onClick={() => alternarTamanho(t)} aria-pressed={tamanhos.includes(t)} className={`pn-tam ${tamanhos.includes(t) ? "pn-tam--on" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={outroTamanho} onChange={(e) => setOutroTamanho(e.target.value)} placeholder="Outro tamanho" className="pn-input flex-1" />
          <button
            type="button"
            className="btn btn--linha btn--pequeno"
            onClick={() => {
              const t = outroTamanho.trim();
              if (t && !tamanhos.includes(t)) setTamanhos([...tamanhos, t]);
              setOutroTamanho("");
            }}
          >
            Juntar
          </button>
        </div>
        {tamanhos.some((t) => !TAMANHOS_SUGERIDOS.includes(t)) ? (
          <p className="pn-ajuda">
            Outros: {tamanhos.filter((t) => !TAMANHOS_SUGERIDOS.includes(t)).join(", ")}{" "}
            <button type="button" className="underline" onClick={() => setTamanhos(tamanhos.filter((t) => TAMANHOS_SUGERIDOS.includes(t)))}>
              limpar
            </button>
          </p>
        ) : null}
      </section>

      {/* ---------- onde aparece ---------- */}
      <section className="pn-bloco">
        <p className="pn-rotulo">Onde aparece</p>
        <div className="pn-interruptores">
          <button type="button" onClick={() => setProntaEntrega((v) => !v)} aria-pressed={prontaEntrega} className={`pn-interruptor ${prontaEntrega ? "pn-interruptor--verde" : ""}`}>
            <Icone nome="relampago" className="h-5 w-5" peso={2} />
            <span>
              <b>{prontaEntrega ? "Pronta entrega" : "Sob encomenda"}</b>
              <small>{prontaEntrega ? "está em mãos, sai no mesmo dia" : "vem da fonte, com prazo"}</small>
            </span>
          </button>
          <button type="button" onClick={() => setDestaque((v) => !v)} aria-pressed={destaque} className={`pn-interruptor ${destaque ? "pn-interruptor--on" : ""}`}>
            <Icone nome="novidade" className="h-5 w-5" peso={2} />
            <span>
              <b>{destaque ? "Em destaque" : "Sem destaque"}</b>
              <small>{destaque ? "aparece na prateleira do topo" : "só no catálogo"}</small>
            </span>
          </button>
          <button type="button" onClick={() => setAtivo((v) => !v)} aria-pressed={ativo} className={`pn-interruptor ${ativo ? "pn-interruptor--on" : ""}`}>
            <Icone nome="check" className="h-5 w-5" peso={2} />
            <span>
              <b>{ativo ? "No ar" : "Escondida"}</b>
              <small>{ativo ? "o cliente vê" : "guardada, ninguém vê"}</small>
            </span>
          </button>
        </div>
      </section>

      {/* ---------- mais detalhes ---------- */}
      <details className="pn-bloco pn-mais">
        <summary className="pn-rotulo cursor-pointer">Mais detalhes (marca, cor, descrição)</summary>
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="pn-campo">
              <span className="pn-rotulo">Marca</span>
              <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Nike" />
            </label>
            <label className="pn-campo">
              <span className="pn-rotulo">Cor</span>
              <input value={cor} onChange={(e) => setCor(e.target.value)} placeholder="branco e azul" />
            </label>
          </div>
          <label className="pn-campo">
            <span className="pn-rotulo">Descrição</span>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Opcional: o que vale dizer da peça" />
          </label>
        </div>
      </details>

      {erro ? (
        <p role="alert" className="pn-erro">
          {erro}
        </p>
      ) : null}

      <div className="pn-modal-pe">
        {!nova ? (
          <button type="button" onClick={excluir} disabled={salvando} className="btn btn--linha btn--pequeno">
            Apagar
          </button>
        ) : null}
        <button type="button" onClick={salvar} disabled={salvando || enviando !== null} className="btn btn--raio flex-1">
          {salvando ? "Salvando…" : nova ? "Colocar no ar" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
