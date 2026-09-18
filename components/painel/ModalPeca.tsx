"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Moldura } from "../Moldura";
import { criarCategoria, excluirProduto, salvarProduto } from "@/lib/acoes";
import { codigoPeca, mascaraBRL, paraNumero, slugar } from "@/lib/formato";
import type { Categoria, Imagem, Produto } from "@/lib/tipos";

type Envio = { id: string; nome: string; progresso: number; erro?: string };

export function ModalPeca({
  produto,
  categorias,
  proximoCodigo,
  marcasConhecidas,
  aoFechar,
  aoSalvar,
  aoExcluir,
  avisar,
}: {
  produto: Produto | null;
  categorias: Categoria[];
  proximoCodigo: string;
  marcasConhecidas: string[];
  aoFechar: () => void;
  aoSalvar: () => void;
  aoExcluir: (id: string) => void;
  avisar: (mensagem: string, tipo?: "ok" | "erro") => void;
}) {
  const edicao = Boolean(produto);

  const [nome, setNome] = useState(produto?.nome ?? "");
  const [slug, setSlug] = useState(produto?.slug ?? "");
  // gerado automaticamente: não aparece na tela nem no site, mas o banco exige
  const codigo = produto?.codigo ?? proximoCodigo;
  const [categoria, setCategoria] = useState(produto?.categoria_slug ?? "");
  const [marca, setMarca] = useState(produto?.marca ?? "");
  const [preco, setPreco] = useState(
    produto?.preco != null ? mascaraBRL(String(Math.round(produto.preco * 100))) : "",
  );
  const [promo, setPromo] = useState(
    produto?.preco_promocional != null
      ? mascaraBRL(String(Math.round(produto.preco_promocional * 100)))
      : "",
  );
  const [tamanhos, setTamanhos] = useState<string[]>(produto?.tamanhos ?? []);
  const [cores, setCores] = useState<string[]>(produto?.cores ?? []);
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [destaque, setDestaque] = useState(produto?.destaque ?? false);
  const [imagens, setImagens] = useState<Imagem[]>(produto?.imagens ?? []);

  const [listaCategorias, setListaCategorias] = useState(categorias);
  const [novaCategoria, setNovaCategoria] = useState<string | null>(null);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [sujo, setSujo] = useState(false);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const arrastado = useRef<number | null>(null);
  const painel = useRef<HTMLDivElement>(null);

  const marcarSujo = () => setSujo(true);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmandoExclusao) setConfirmandoExclusao(false);
        else tentarFechar();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = antes;
    };
  });

  useEffect(() => {
    painel.current?.querySelector<HTMLInputElement>("#campo-nome")?.focus();
  }, []);

  function tentarFechar() {
    if (salvando) return;
    if (sujo && !window.confirm("Você tem alterações não salvas. Fechar mesmo assim?"))
      return;
    aoFechar();
  }

  function aoMudarNome(valor: string) {
    setNome(valor);
    marcarSujo();
    if (!edicao) setSlug(slugar(valor));
  }

  /* ── imagens ─────────────────────────────────────────────── */

  async function enviar(arquivos: FileList | File[]) {
    const lista = Array.from(arquivos);
    if (!lista.length) return;
    marcarSujo();

    for (const arquivo of lista) {
      const id = `${arquivo.name}-${arquivo.size}-${Math.random()}`;
      setEnvios((e) => [...e, { id, nome: arquivo.name, progresso: 0 }]);

      try {
        const resultado = await enviarComProgresso(arquivo, (p) =>
          setEnvios((e) => e.map((x) => (x.id === id ? { ...x, progresso: p } : x))),
        );
        setImagens((atual) => [
          ...atual,
          {
            url: resultado.url,
            alt: null,
            largura: resultado.largura,
            altura: resultado.altura,
            blur: resultado.blur,
            ordem: atual.length,
          },
        ]);
        setEnvios((e) => e.filter((x) => x.id !== id));
        setErros((x) => ({ ...x, imagens: "" }));
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : "Não deu para enviar.";
        setEnvios((atual) => atual.filter((x) => x.id !== id));
        avisar(mensagem, "erro");
      }
    }
  }

  function removerImagem(indice: number) {
    setImagens((atual) => atual.filter((_, i) => i !== indice));
    marcarSujo();
  }

  function soltarImagem(destino: number) {
    const origem = arrastado.current;
    arrastado.current = null;
    if (origem === null || origem === destino) return;
    setImagens((atual) => {
      const copia = [...atual];
      const [movida] = copia.splice(origem, 1);
      copia.splice(destino, 0, movida);
      return copia;
    });
    marcarSujo();
  }

  /* ── categoria nova, sem sair do modal ───────────────────── */

  async function confirmarCategoria() {
    const nomeNovo = (novaCategoria ?? "").trim();
    if (!nomeNovo) return setNovaCategoria(null);
    const r = await criarCategoria(nomeNovo);
    if (!r.ok) return avisar(r.erro, "erro");
    setListaCategorias((c) => [...c, r.dado]);
    setCategoria(r.dado.slug);
    setNovaCategoria(null);
    marcarSujo();
    avisar("Categoria criada");
  }

  /* ── salvar ──────────────────────────────────────────────── */

  async function salvar() {
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) novosErros.nome = "Escreva o nome da peça.";
    if (!imagens.length) novosErros.imagens = "Envie pelo menos uma foto.";

    const valorPreco = paraNumero(preco);
    const valorPromo = paraNumero(promo);
    if (valorPromo !== null && valorPreco !== null && valorPromo >= valorPreco) {
      novosErros.promo = "O preço promocional precisa ser menor que o cheio.";
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setSalvando(true);
    const r = await salvarProduto({
      id: produto?.id,
      nome,
      slug: slug || slugar(nome),
      codigo: codigo || proximoCodigo,
      descricao,
      marca,
      preco: valorPreco,
      preco_promocional: valorPromo,
      categoria_slug: categoria || null,
      tamanhos,
      cores,
      destaque,
      ativo,
      imagens,
    });
    setSalvando(false);

    if (!r.ok) return avisar(r.erro, "erro");
    setSujo(false);
    avisar("Peça salva");
    aoSalvar();
  }

  async function excluir() {
    if (!produto) return;
    setSalvando(true);
    const r = await excluirProduto(produto.id);
    setSalvando(false);
    if (!r.ok) return avisar(r.erro, "erro");
    avisar("Peça excluída");
    aoExcluir(produto.id);
  }

  /* ── tela ────────────────────────────────────────────────── */

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-cimento-escuro/75 p-4 backdrop-blur-[2px] sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) tentarFechar();
      }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={edicao ? `Editar ${produto?.nome}` : "Nova peça"}
        className="tem-moldura mx-auto my-4 w-full max-w-2xl bg-off-white p-6 sm:p-9"
        data-ativa="true"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="display-secao text-tinta">
              {edicao ? "Editar peça" : "Nova peça"}
            </h2>
          </div>
          <button
            type="button"
            onClick={tentarFechar}
            className="mono-rotulo text-marrom-fundo"
          >
            Fechar
          </button>
        </div>

        <div className="mt-9 space-y-8">
          {/* 1. imagens */}
          <Campo rotulo="Imagens" erro={erros.imagens}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastandoArquivo(true);
              }}
              onDragLeave={() => setArrastandoArquivo(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastandoArquivo(false);
                void enviar(e.dataTransfer.files);
              }}
              className="grid grid-cols-3 gap-3 sm:grid-cols-4"
              style={{
                outline: arrastandoArquivo ? "1px solid var(--nude)" : undefined,
                outlineOffset: "8px",
              }}
            >
              {imagens.map((img, i) => (
                <div
                  key={img.url}
                  draggable
                  onDragStart={() => {
                    arrastado.current = i;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => soltarImagem(i)}
                  className="relative aspect-[4/5] cursor-grab overflow-hidden bg-cimento-claro"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                  {i === 0 ? (
                    <span className="mono-rotulo absolute left-0 top-0 bg-nude px-1.5 py-1 text-[0.5625rem] text-tinta">
                      Capa
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removerImagem(i)}
                    aria-label={`Remover foto ${i + 1}`}
                    className="mono-rotulo absolute bottom-0 right-0 bg-off-white px-2 py-1 text-[0.5625rem] text-marrom-fundo"
                  >
                    Remover
                  </button>
                </div>
              ))}

              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-cimento-escuro text-center">
                <span className="mono-rotulo text-marrom-fundo">Adicionar</span>
                <span className="mono text-[0.625rem] text-tinta">
                  ou solte aqui
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) void enviar(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {envios.map((e) => (
              <div key={e.id} className="mt-3">
                <div className="mono flex justify-between text-[0.6875rem] text-tinta">
                  <span className="truncate pr-3">{e.nome}</span>
                  <span>{e.progresso}%</span>
                </div>
                <div className="mt-1 h-[3px] w-full bg-cimento-medio">
                  <div
                    className="h-full bg-marrom-fundo transition-[width] duration-150"
                    style={{ width: `${e.progresso}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="mono mt-3 text-[0.6875rem] text-tinta">
              A primeira foto é a capa. Arraste para trocar a ordem. Até 5MB por
              arquivo.
            </p>
          </Campo>

          {/* 2. nome, endereço e código */}
          <Campo rotulo="Nome" erro={erros.nome} obrigatorio htmlFor="campo-nome">
            <input
              id="campo-nome"
              value={nome}
              onChange={(e) => aoMudarNome(e.target.value)}
              className="campo"
              placeholder="Tênis New Balance 9060 branco"
            />
            <div className="mt-3">
              <label className="block">
                <span className="mono-rotulo mb-1.5 block text-marrom-fundo">
                  Endereço no site
                </span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugar(e.target.value));
                    marcarSujo();
                  }}
                  className="campo campo--mono py-2 text-xs"
                />
              </label>

            </div>
          </Campo>

          {/* 3. categoria */}
          <Campo rotulo="Categoria" htmlFor="campo-categoria">
            {novaCategoria === null ? (
              <div className="flex flex-wrap items-center gap-4">
                <select
                  id="campo-categoria"
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    marcarSujo();
                  }}
                  className="campo campo--auto min-w-[12rem]"
                >
                  <option value="">Sem categoria</option>
                  {listaCategorias.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNovaCategoria("")}
                  className="btn btn--texto"
                >
                  Nova categoria
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  autoFocus
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void confirmarCategoria();
                    }
                  }}
                  placeholder="Nome da categoria"
                  className="campo campo--auto min-w-[12rem]"
                />
                <button
                  type="button"
                  onClick={() => void confirmarCategoria()}
                  className="btn btn--linha px-4 py-2.5"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setNovaCategoria(null)}
                  className="btn btn--texto"
                >
                  Cancelar
                </button>
              </div>
            )}
          </Campo>

          {/* 4. marca */}
          <Campo rotulo="Marca" htmlFor="campo-marca">
            <input
              id="campo-marca"
              list="marcas-conhecidas"
              value={marca}
              onChange={(e) => {
                setMarca(e.target.value);
                marcarSujo();
              }}
              className="campo"
              placeholder="New Balance"
            />
            <datalist id="marcas-conhecidas">
              {marcasConhecidas.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Campo>

          {/* 5. preços */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="Preço" htmlFor="campo-preco">
              <div className="flex items-center gap-2">
                <span className="mono text-sm text-marrom-fundo">R$</span>
                <input
                  id="campo-preco"
                  inputMode="numeric"
                  value={preco}
                  onChange={(e) => {
                    setPreco(mascaraBRL(e.target.value));
                    marcarSujo();
                  }}
                  className="campo campo--mono"
                  placeholder="0,00"
                />
              </div>
            </Campo>
            <Campo rotulo="Preço promocional" erro={erros.promo} htmlFor="campo-promo">
              <div className="flex items-center gap-2">
                <span className="mono text-sm text-marrom-fundo">R$</span>
                <input
                  id="campo-promo"
                  inputMode="numeric"
                  value={promo}
                  onChange={(e) => {
                    setPromo(mascaraBRL(e.target.value));
                    marcarSujo();
                  }}
                  className="campo campo--mono"
                  placeholder="0,00"
                />
              </div>
            </Campo>
          </div>

          {/* 6. tamanhos e cores */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="Tamanhos">
              <Fichas
                itens={tamanhos}
                aoMudar={(v) => {
                  setTamanhos(v);
                  marcarSujo();
                }}
                exemplo="36"
              />
            </Campo>
            <Campo rotulo="Cores">
              <Fichas
                itens={cores}
                aoMudar={(v) => {
                  setCores(v);
                  marcarSujo();
                }}
                exemplo="branco"
              />
            </Campo>
          </div>

          {/* 7. descrição */}
          <Campo rotulo="Descrição" htmlFor="campo-descricao">
            <textarea
              id="campo-descricao"
              rows={4}
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                marcarSujo();
              }}
              className="campo resize-y"
              placeholder="Detalhes que ajudam na hora de escolher: caimento, material, numeração."
            />
          </Campo>

          {/* 8. estados */}
          <div className="flex flex-wrap gap-8">
            <Chave
              rotulo="Ativo"
              ligado={ativo}
              aoMudar={(v) => {
                setAtivo(v);
                marcarSujo();
              }}
              ajuda="Aparece no catálogo"
            />
            <Chave
              rotulo="Destaque"
              ligado={destaque}
              aoMudar={(v) => {
                setDestaque(v);
                marcarSujo();
              }}
              ajuda="Entra na seleção da home"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-cimento-medio pt-6">
          {edicao ? (
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              className="btn btn--texto"
              disabled={salvando}
            >
              Excluir peça
            </button>
          ) : null}
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              onClick={tentarFechar}
              className="btn btn--texto"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void salvar()}
              className="btn btn--primario"
              disabled={salvando}
            >
              {salvando ? "Salvando…" : "Salvar peça"}
            </button>
          </div>
        </div>

        <Moldura legenda={edicao ? "Editar" : "Nova peça"} aresta="topo" />
      </div>

      {confirmandoExclusao && produto ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-cimento-escuro/80 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="tem-moldura w-full max-w-sm bg-off-white p-8"
            data-ativa="true"
          >
            <p className="display-peca text-sm text-tinta">Excluir esta peça?</p>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-tinta">
              {produto.nome} sai do catálogo e as fotos são apagadas. Não dá para
              desfazer.
            </p>
            <div className="mt-7 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="btn btn--texto"
              >
                Manter
              </button>
              <button
                type="button"
                onClick={() => void excluir()}
                className="btn btn--primario"
                disabled={salvando}
              >
                {salvando ? "Excluindo…" : "Excluir peça"}
              </button>
            </div>
            <Moldura legenda="Confirmar" aresta="topo" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── peças de formulário ────────────────────────────────────── */

function Campo({
  rotulo,
  erro,
  obrigatorio,
  htmlFor,
  children,
}: {
  rotulo: string;
  erro?: string;
  obrigatorio?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mono-rotulo mb-3 block text-marrom-fundo"
      >
        {rotulo}
        {obrigatorio ? " *" : ""}
      </label>
      {children}
      {erro ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-marrom-fundo">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

function Fichas({
  itens,
  aoMudar,
  exemplo,
}: {
  itens: string[];
  aoMudar: (v: string[]) => void;
  exemplo: string;
}) {
  const [rascunho, setRascunho] = useState("");

  function adicionar() {
    const v = rascunho.trim();
    if (!v || itens.includes(v)) return setRascunho("");
    aoMudar([...itens, v]);
    setRascunho("");
  }

  return (
    <div>
      {itens.length ? (
        <ul className="mb-3 flex flex-wrap gap-2">
          {itens.map((i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => aoMudar(itens.filter((x) => x !== i))}
                className="chip"
                aria-label={`Remover ${i}`}
              >
                {i}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            adicionar();
          }
        }}
        onBlur={adicionar}
        placeholder={`${exemplo} e Enter`}
        className="campo campo--mono py-2 text-xs"
      />
    </div>
  );
}

function Chave({
  rotulo,
  ligado,
  aoMudar,
  ajuda,
}: {
  rotulo: string;
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  ajuda: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => aoMudar(!ligado)}
      className="flex items-center gap-3 text-left"
    >
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{
          background: ligado ? "var(--marrom-fundo)" : "var(--cimento-medio)",
        }}
      >
        <span
          className="absolute top-[3px] h-3.5 w-3.5 rounded-full bg-off-white transition-[left]"
          style={{ left: ligado ? "1.125rem" : "0.1875rem" }}
        />
      </span>
      <span>
        <span className="mono-rotulo block text-tinta">{rotulo}</span>
        <span className="mono block text-[0.625rem] text-marrom-fundo">
          {ajuda}
        </span>
      </span>
    </button>
  );
}

/* ── envio com barra de progresso de verdade ────────────────── */

function enviarComProgresso(
  arquivo: File,
  aoProgredir: (porcentagem: number) => void,
): Promise<{ url: string; largura: number | null; altura: number | null; blur: string }> {
  return new Promise((resolver, rejeitar) => {
    const dados = new FormData();
    dados.append("arquivo", arquivo);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        aoProgredir(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      let corpo: Record<string, unknown> = {};
      try {
        corpo = JSON.parse(xhr.responseText);
      } catch {
        /* resposta sem JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(100);
        resolver(
          corpo as unknown as {
            url: string;
            largura: number | null;
            altura: number | null;
            blur: string;
          },
        );
      } else {
        rejeitar(
          new Error(
            typeof corpo.erro === "string"
              ? corpo.erro
              : "Não deu para enviar a imagem. Tente de novo.",
          ),
        );
      }
    });
    xhr.addEventListener("error", () =>
      rejeitar(new Error("A conexão caiu durante o envio. Tente de novo.")),
    );
    xhr.send(dados);
  });
}

export { codigoPeca };
