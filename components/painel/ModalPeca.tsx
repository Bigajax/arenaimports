"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { criarCategoria, excluirProduto, salvarProduto } from "@/lib/acoes";
import { CompartilharPeca } from "./CompartilharPeca";
import { site } from "@/data/site.config";

/* o endereço da peça para a mensagem do compartilhar; fora do ar, nada (sem localhost) */
const enderecoDaPeca = (slug: string) => (/localhost|127.0.0.1/.test(site.url) ? null : `${site.url}/produto/${slug}`);
import { enviarFoto } from "./enviar";
import { codigoPeca, mascaraBRL, paraNumero, precoBRL, slugar } from "@/lib/formato";
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
  duplicar = false,
  aoDuplicar,
}: {
  produto: Produto | null;
  categorias: Categoria[];
  proximoCodigo: string;
  marcasConhecidas: string[];
  aoFechar: () => void;
  aoSalvar: () => void;
  aoExcluir: (id: string) => void;
  avisar: (mensagem: string, tipo?: "ok" | "erro") => void;
  /* "Duplicar (outra cor)" (09/10/2026): abre um cadastro novo com os dados
     da peça; cada cor é uma peça, e cadastrar a mesma em três cores era
     refazer tudo três vezes */
  duplicar?: boolean;
  aoDuplicar?: (p: Produto) => void;
}) {
  const edicao = Boolean(produto) && !duplicar;

  const [nome, setNome] = useState(duplicar && produto ? `${produto.nome} (outra cor)` : produto?.nome ?? "");
  /* o modal curto (07/10): no cadastro, só foto, nome, categoria, preço e
     tamanhos; marca, cores e descrição ficam atrás de "mais detalhes". Na
     edição tudo aparece, porque pode haver dado preenchido ali. */
  const [maisDetalhes, setMaisDetalhes] = useState(Boolean(produto));
  const [slug, setSlug] = useState(duplicar ? "" : produto?.slug ?? "");
  // gerado automaticamente: não aparece na tela nem no site, mas o banco exige
  const codigo = duplicar ? proximoCodigo : produto?.codigo ?? proximoCodigo;
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
  const [cores, setCores] = useState<string[]>(duplicar ? [] : produto?.cores ?? []);
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [destaque, setDestaque] = useState(produto?.destaque ?? false);
  /* (Arena) em mãos x sob encomenda: peça nova nasce como encomenda, porque
     quase todo o catálogo é encomenda (pedido do Luiz, 24/09) */
  const [prontaEntrega, setProntaEntrega] = useState(produto?.pronta_entrega ?? false);
  const [linkYupoo, setLinkYupoo] = useState("");
  const [buscandoYupoo, setBuscandoYupoo] = useState(false);
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
  /* a foto tocada: abre os botões dela (capa, mover, remover). No dedo o
     arrastar não existe (09/10/2026) */
  const [fotoAberta, setFotoAberta] = useState<number | null>(null);
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

  /* o cursor já no nome, só no computador: no celular o foco abria o
     teclado e rolava o modal para o meio, escondendo as fotos (08/10/2026) */
  useEffect(() => {
    if (window.matchMedia("(min-width: 640px)").matches) painel.current?.querySelector<HTMLInputElement>("#campo-nome")?.focus();
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
        const resultado = await enviarFoto(arquivo, (p) =>
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

  function moverImagem(origem: number, destino: number) {
    if (destino < 0 || destino >= imagens.length || origem === destino) return;
    setImagens((atual) => {
      const copia = [...atual];
      const [movida] = copia.splice(origem, 1);
      copia.splice(destino, 0, movida);
      return copia;
    });
    setFotoAberta(destino === 0 ? null : destino);
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

  /* (Arena) o link do álbum do fornecedor: o servidor baixa as fotos (o
     Yupoo não deixa salvar pelo celular) e lê nome, marca, cor e tamanhos
     do título; só preenche o que ainda está vazio. Vindo do painel antigo. */
  async function buscarYupoo() {
    const link = linkYupoo.trim();
    if (!link) return avisar("Cole o link do álbum do Yupoo.", "erro");
    setBuscandoYupoo(true);
    try {
      const r = await fetch("/api/yupoo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link }) });
      const corpo = await r.json();
      if (!r.ok) throw new Error(typeof corpo.erro === "string" ? corpo.erro : "Não deu para buscar no Yupoo.");
      const novas = (corpo.imagens as { url: string; largura: number | null; altura: number | null; blur: string }[]).map((img) => ({ url: img.url, alt: null, largura: img.largura, altura: img.altura, blur: img.blur, ordem: 0 }));
      setImagens((atual) => [...atual, ...novas].map((img, k) => ({ ...img, ordem: k })));
      if (!nome.trim() && corpo.nome) aoMudarNome(corpo.nome);
      if (!marca.trim() && corpo.marca) setMarca(corpo.marca);
      if (!cores.length && corpo.cor) setCores([corpo.cor]);
      if (!tamanhos.length && Array.isArray(corpo.tamanhos) && corpo.tamanhos.length) setTamanhos(corpo.tamanhos);
      setErros((x) => ({ ...x, imagens: "" }));
      setLinkYupoo("");
      marcarSujo();
      avisar(`Pronto: ${novas.length === 1 ? "1 foto veio" : `${novas.length} fotos vieram`} do Yupoo.`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não deu para buscar no Yupoo.", "erro");
    } finally {
      setBuscandoYupoo(false);
    }
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
    avisar("Pronto: categoria criada.");
  }

  /* ── salvar ──────────────────────────────────────────────── */

  async function salvar() {
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) novosErros.nome = "Escreva o nome da peça.";
    if (!imagens.length) novosErros.imagens = "Envie pelo menos uma foto.";

    const valorPreco = paraNumero(preco);
    const valorPromo = paraNumero(promo);
    /* dígito a mais no celular vira preço de carro: no teste de 26/09/2026
       um "150,00" digitado em cima de "123,45" gravou R$ 12.345.150 sem
       aviso. Peça de roupa e tênis não passa de R$ 10 mil. */
    const TETO = 10000;
    if (valorPreco !== null && valorPreco > TETO) novosErros.preco = `Confira o preço: ficou ${precoBRL(valorPreco)}.`;
    if (valorPromo !== null && valorPromo > TETO) novosErros.promo = `Confira o preço: ficou ${precoBRL(valorPromo)}.`;
    if (valorPromo !== null && valorPreco !== null && valorPromo >= valorPreco && !novosErros.promo) {
      novosErros.promo = "O preço promocional precisa ser menor que o cheio.";
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setSalvando(true);
    const r = await salvarProduto({
      id: edicao ? produto?.id : undefined,
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
      pronta_entrega: prontaEntrega,
      ativo,
      imagens,
    });
    setSalvando(false);

    if (!r.ok) return avisar(r.erro, "erro");
    setSujo(false);
    avisar("Pronto: a peça foi salva e o site já mostra.");
    aoSalvar();
  }

  async function excluir() {
    if (!produto) return;
    setSalvando(true);
    const r = await excluirProduto(produto.id);
    setSalvando(false);
    if (!r.ok) return avisar(r.erro, "erro");
    avisar("Pronto: a peça foi apagada.");
    aoExcluir(produto.id);
  }

  /* ── tela ────────────────────────────────────────────────── */

  return (
    <div
      className="pn-modal-fundo fixed inset-0 z-[60] overflow-y-auto bg-cimento-escuro/75 p-4 backdrop-blur-[2px] sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) tentarFechar();
      }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={edicao ? `Editar ${produto?.nome}` : duplicar ? `Outra cor de ${produto?.nome}` : "Nova peça"}
        className="pn-modal pn-modal--peca mx-auto my-4 w-full max-w-2xl p-6 sm:p-9"
        data-ativa="true"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="pn-modal__cabeca">
            <p className="pn-modal__rotulo">{edicao ? "Editando a peça" : "Peça nova na vitrine"}</p>
            <h2 className="pn-modal__titulo">
              {edicao ? "Editar peça" : "Cadastrar peça"}
            </h2>
            <ul className="pn-modal__regua" aria-label="O que é preciso">
              <li>
                <b>Precisa</b>
                <span>Foto e nome</span>
              </li>
              <li>
                <b>Ajuda a vender</b>
                <span>Preço e tamanhos</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={tentarFechar}
            className="pn-modal__fechar"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-9 space-y-8">
          {/* 1. imagens */}
          <Campo rotulo="1. Fotos" erro={erros.imagens} obrigatorio>
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
                  className="pn-foto-peca relative aspect-[4/5] cursor-grab overflow-hidden bg-cimento-claro"
                  data-aberta={fotoAberta === i || undefined}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                  {i === 0 ? (
                    <span className="mono-rotulo absolute left-0 top-0 bg-nude px-1.5 py-0.5 !text-[0.5625rem] leading-tight text-tinta">
                      Capa
                    </span>
                  ) : null}
                  {/* tocar na foto abre os botões dela */}
                  <button
                    type="button"
                    className="pn-foto-peca__toque"
                    aria-label={`Foto ${i + 1}: ${fotoAberta === i ? "fechar as opções" : "capa, mover ou remover"}`}
                    aria-expanded={fotoAberta === i}
                    onClick={() => setFotoAberta(fotoAberta === i ? null : i)}
                  />
                  {fotoAberta === i ? (
                    <div className="pn-foto-peca__acoes">
                      <button type="button" onClick={() => moverImagem(i, 0)} disabled={i === 0} aria-label="Virar a capa">
                        Capa
                      </button>
                      <button type="button" onClick={() => moverImagem(i, i - 1)} disabled={i === 0} aria-label="Mover para a esquerda">
                        ←
                      </button>
                      <button type="button" onClick={() => moverImagem(i, i + 1)} disabled={i === imagens.length - 1} aria-label="Mover para a direita">
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removerImagem(i);
                          setFotoAberta(null);
                        }}
                        aria-label={`Remover a foto ${i + 1}`}
                      >
                        Tirar
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}

              {/* as fotos por posição (07/10, "tinha que ter a ideia que dá
                  para colocar várias"): o botão e as posições vazias abrem o
                  mesmo seletor, que aceita várias de uma vez */}
              <label htmlFor="campo-fotos" className="pn-fotos__mais">
                <b>{imagens.length ? "+ Mais fotos" : "+ Adicionar fotos"}</b>
                <span>Pode escolher várias de uma vez</span>
              </label>
              {Array.from({ length: Math.max(0, 4 - imagens.length - 1) }, (_, k) => {
                const pos = imagens.length + k + 2;
                return (
                  <label key={pos} htmlFor="campo-fotos" className="pn-fotos__vaga" aria-hidden="true">
                    <span>{pos}ª foto</span>
                  </label>
                );
              })}
              <input
                id="campo-fotos"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) void enviar(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {envios.map((e) => (
              <div key={e.id} className="mt-3">
                <div className="mono flex justify-between text-[0.6875rem] text-tinta">
                  <span className="truncate pr-3">{e.nome}</span>
                  <span>{e.progresso}%</span>
                </div>
                <div className="mt-1 h-[3px] w-full bg-cimento-medio">
                  <div
                    className="h-full bg-ouro transition-[width] duration-150"
                    style={{ width: `${e.progresso}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pn-fotos__nota">
              {imagens.length > 1
                ? `${imagens.length} fotos. A primeira é a capa no site. Toque numa foto para virar capa, mudar de lugar ou tirar.`
                : "A primeira é a capa no site. Mande também as costas, o detalhe e a peça no corpo: quem vê mais, chama mais."}
            </p>
            <div className="pn-yupoo">
              <label htmlFor="campo-yupoo">Ou cole o link do álbum do Yupoo</label>
              <div>
                <input
                  id="campo-yupoo"
                  value={linkYupoo}
                  onChange={(e) => setLinkYupoo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void buscarYupoo();
                    }
                  }}
                  placeholder="https://loja.x.yupoo.com/albums/123456"
                  inputMode="url"
                  autoComplete="off"
                  className="campo"
                />
                <button type="button" className="btn btn--linha" onClick={() => void buscarYupoo()} disabled={buscandoYupoo}>
                  {buscandoYupoo ? "Buscando..." : "Buscar as fotos"}
                </button>
              </div>
              <p>No Yupoo, toque em compartilhar, copie o link e cole aqui: as fotos entram sozinhas, com o nome e os tamanhos do título. Fornecedor com senha: acrescente ?senha=a-senha no fim do link.</p>
            </div>
          </Campo>

          {/* 2. nome, endereço e código */}
          <Campo rotulo="2. Nome da peça" erro={erros.nome} obrigatorio htmlFor="campo-nome">
            <input
              id="campo-nome"
              value={nome}
              onChange={(e) => aoMudarNome(e.target.value)}
              className="campo"
              placeholder="Nome como o cliente procuraria, com marca e cor"
            />
            {/* o "Endereço da página" saiu (07/10): o endereço nasce do nome
                no cadastro e não muda na edição, porque mudar quebra o link
                que a loja já postou no Instagram */}
          </Campo>

          {/* 3. categoria */}
          <Campo rotulo="3. Categoria" htmlFor="campo-categoria">
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

          {/* marca: atrás de "mais detalhes" */}
          {maisDetalhes ? (
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
              placeholder="A marca da peça"
            />
            <datalist id="marcas-conhecidas">
              {marcasConhecidas.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Campo>
          ) : null}

          {/* 4. preços */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="4. Preço cheio" erro={erros.preco} htmlFor="campo-preco">
              <div className="flex items-center gap-2">
                <span className="mono text-sm text-marfim-fraco">R$</span>
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
            <Campo rotulo="Preço com desconto" erro={erros.promo} htmlFor="campo-promo">
              <div className="flex items-center gap-2">
                <span className="mono text-sm text-marfim-fraco">R$</span>
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

          <p className="-mt-4 text-[0.8125rem] leading-relaxed text-tinta">Com desconto, preencha os dois: no site o cheio aparece riscado.</p>

          {/* 5. tamanhos (e as cores, atrás de "mais detalhes"): a grade
              de toque ocupa a largura toda */}
          <div className="grid gap-5">
            <Campo rotulo="5. Tamanhos">
              <GradeTamanhos
                itens={tamanhos}
                aoMudar={(v) => {
                  setTamanhos(v);
                  marcarSujo();
                }}
              />
            </Campo>
            {maisDetalhes ? (
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
            ) : null}
          </div>

          {/* descrição: atrás de "mais detalhes" */}
          {maisDetalhes ? (
          <Campo rotulo="Descrição (opcional)" htmlFor="campo-descricao">
            <textarea
              id="campo-descricao"
              rows={4}
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                marcarSujo();
              }}
              className="campo resize-y"
              placeholder="O que ajuda na hora de escolher: material, caimento, numeração."
            />
          </Campo>
          ) : null}

          {!maisDetalhes ? (
            <button
              type="button"
              className="pn-modal__mais"
              onClick={() => setMaisDetalhes(true)}
            >
              Mais detalhes: marca, cores e descrição
            </button>
          ) : null}

          {/* 6. estados */}
          <div className="flex flex-wrap gap-8">
            <Chave
              rotulo="No site"
              ligado={ativo}
              aoMudar={(v) => {
                setAtivo(v);
                marcarSujo();
              }}
              ajuda="Desligada, a peça fica guardada aqui e some do site"
            />
            <Chave
              rotulo="Em mãos"
              ligado={prontaEntrega}
              aoMudar={(v) => {
                setProntaEntrega(v);
                marcarSujo();
              }}
              ajuda="Ligada, sai no mesmo dia e entra em Pronta entrega. Desligada, é sob encomenda"
            />
            <Chave
              rotulo="Na página inicial"
              ligado={destaque}
              aoMudar={(v) => {
                setDestaque(v);
                marcarSujo();
              }}
              ajuda="Aparece primeiro na vitrine da categoria"
            />
          </div>
        </div>

        {/* apagar mora no fim do formulário, longe do Salvar (09/10/2026):
            no celular os dois ficavam a um dedo de distância */}
        {duplicar ? (
          <p className="pn-modal__copia" role="note">
            Cópia de {produto?.nome}: troque as fotos e a cor, confira o nome e as quantidades, e salve. A original não muda.
          </p>
        ) : null}
        {edicao ? (
          <p className="pn-modal__apagar">
            {produto && produto.ativo ? (
              <CompartilharPeca produto={produto} endereco={enderecoDaPeca(produto.slug)} avisar={avisar} />
            ) : null}
            {aoDuplicar && produto ? (
              <button
                type="button"
                className="btn btn--texto"
                disabled={salvando}
                onClick={() => (sujo ? avisar("Salve as mudanças antes de duplicar.", "erro") : aoDuplicar(produto))}
              >
                Duplicar (outra cor)
              </button>
            ) : null}
            <button type="button" onClick={() => setConfirmandoExclusao(true)} className="btn btn--texto" disabled={salvando}>
              Apagar peça
            </button>
          </p>
        ) : null}

        {/* o rodapé fica preso embaixo enquanto rola: o Salvar sempre à mão */}
        <div className="pn-modal__rodape mt-10 flex flex-wrap items-center gap-4 border-t border-cimento-medio pt-6">
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
              {salvando ? "Salvando…" : "Salvar e pôr no site"}
            </button>
          </div>
        </div>

      </div>

      {confirmandoExclusao && produto && edicao ? (
        <div className="pn-confirma fixed inset-0 z-[70] flex items-center justify-center bg-cimento-escuro/80 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="pn-modal pn-confirma__caixa w-full max-w-sm p-8"
            data-ativa="true"
          >
            <p className="display-peca text-tinta">Apagar de vez?</p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-tinta">
              Se a peça só acabou, é melhor desligar &quot;No site&quot;: ela fica guardada para quando voltar. Apagar tira {produto.nome} e as fotos para sempre.
            </p>
            <div className="mt-7 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="btn btn--texto"
              >
                Não, manter
              </button>
              <button
                type="button"
                onClick={() => void excluir()}
                className="btn btn--primario"
                disabled={salvando}
              >
                {salvando ? "Apagando…" : "Apagar de vez"}
              </button>
            </div>
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
        className="mono-rotulo mb-3 block text-marfim-fraco"
      >
        {rotulo}
        {obrigatorio ? " *" : ""}
      </label>
      {children}
      {erro ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-ouro-texto">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/**
 * OS TAMANHOS POR TOQUE (07/10/2026): "vai que há erro de digitação". Em vez
 * de digitar "40" e Enter, a pessoa escolhe a grade (calçado, infantil,
 * roupa, único) e toca nos números. A ordem no site sai sempre a da grade,
 * nunca a do toque. O que foge da grade ("38/39", "2 anos") entra em
 * "Outro tamanho", que ainda separa por espaço ou vírgula.
 */
const GRADES: { id: string; nome: string; itens: string[] }[] = [
  { id: "calcado", nome: "Calçado", itens: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
  { id: "infantil", nome: "Infantil", itens: ["16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32"] },
  { id: "roupa", nome: "Roupa", itens: ["PP", "P", "M", "G", "GG", "XG", "XGG"] },
  { id: "unico", nome: "Tamanho único", itens: ["Único"] },
];
const ORDEM_TAM = GRADES.flatMap((g) => g.itens);

function GradeTamanhos({ itens, aoMudar }: { itens: string[]; aoMudar: (v: string[]) => void }) {
  /* abre na grade da peça: a que mais contém os tamanhos dela */
  const contagem = GRADES.map((g) => ({ id: g.id, n: itens.filter((i) => g.itens.includes(i)).length })).sort((a, b) => b.n - a.n);
  const inicial = contagem[0].n ? contagem[0].id : "calcado";
  const [grade, setGrade] = useState(inicial);
  const [outro, setOutro] = useState("");
  const atual = GRADES.find((g) => g.id === grade)!;
  const fora = itens.filter((i) => !ORDEM_TAM.includes(i));

  const ordenar = (lista: string[]) =>
    [...new Set(lista)].sort((a, b) => {
      const x = ORDEM_TAM.indexOf(a);
      const y = ORDEM_TAM.indexOf(b);
      return (x < 0 ? 999 : x) - (y < 0 ? 999 : y);
    });
  const alternar = (t: string) => aoMudar(itens.includes(t) ? itens.filter((x) => x !== t) : ordenar([...itens, t]));
  const todos = () => aoMudar(ordenar([...itens, ...atual.itens]));
  const limpar = () => aoMudar(itens.filter((i) => !atual.itens.includes(i)));
  function adicionarOutro() {
    const novos = outro.split(/[\s,;]+/).map((v) => v.trim()).filter(Boolean);
    if (novos.length) aoMudar(ordenar([...itens, ...novos]));
    setOutro("");
  }

  return (
    <div className="pn-tam">
      <div className="pn-tam__grades" role="tablist" aria-label="Tipo de tamanho">
        {GRADES.map((g) => {
          const n = itens.filter((i) => g.itens.includes(i)).length;
          return (
            <button key={g.id} type="button" role="tab" aria-selected={g.id === grade} className="pn-tam__grade" onClick={() => setGrade(g.id)}>
              {g.nome}
              {n ? <i>{n}</i> : null}
            </button>
          );
        })}
      </div>

      <div className="pn-tam__toques" role="group" aria-label={`Tamanhos de ${atual.nome.toLowerCase()}`}>
        {atual.itens.map((t) => (
          <button key={t} type="button" aria-pressed={itens.includes(t)} className="pn-tam__toque" onClick={() => alternar(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="pn-tam__rodape">
        <p className="pn-tam__resumo">
          {itens.length ? (
            <>
              No site: <b>{itens.join(", ")}</b>
            </>
          ) : (
            "Toque nos tamanhos que a peça tem."
          )}
        </p>
        <span className="pn-tam__acoes">
          {atual.itens.length > 1 ? (
            <button type="button" onClick={todos}>
              Marcar todos
            </button>
          ) : null}
          {itens.some((i) => atual.itens.includes(i)) ? (
            <button type="button" onClick={limpar}>
              Limpar
            </button>
          ) : null}
        </span>
      </div>

      <details className="pn-tam__outro" open={fora.length > 0}>
        <summary>Outro tamanho, fora da grade</summary>
        {fora.length ? (
          <ul className="pn-tam__fora">
            {fora.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => alternar(t)} aria-label={`Remover ${t}`}>
                  {t} <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          value={outro}
          onChange={(e) => setOutro(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              adicionarOutro();
            }
          }}
          onBlur={adicionarOutro}
          placeholder="Ex.: 38/39 ou 2 anos, e Enter"
          className="campo"
          aria-label="Outro tamanho"
        />
      </details>
    </div>
  );
}

function Fichas({
  itens,
  aoMudar,
  exemplo,
  separar = false,
}: {
  itens: string[];
  aoMudar: (v: string[]) => void;
  exemplo: string;
  /* nos tamanhos, "39 40 41 42 43" vira cinco fichas: na Japa a numeração
     inteira foi digitada numa ficha só (27/09), e o filtro não achava o 41 */
  separar?: boolean;
}) {
  const [rascunho, setRascunho] = useState("");

  function adicionar() {
    const novos = (separar ? rascunho.split(/[\s,;/]+/) : [rascunho])
      .map((v) => v.trim())
      .filter((v) => v && !itens.includes(v));
    if (novos.length) aoMudar([...itens, ...new Set(novos)]);
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
          background: ligado ? "var(--ouro)" : "var(--cimento-medio)",
        }}
      >
        <span
          className="absolute top-[3px] h-3.5 w-3.5 rounded-full bg-off-white transition-[left]"
          style={{ left: ligado ? "1.125rem" : "0.1875rem" }}
        />
      </span>
      <span>
        <span className="mono-rotulo block text-tinta">{rotulo}</span>
        <span className="mt-0.5 block text-[0.8125rem] leading-snug text-marfim-fraco">
          {ajuda}
        </span>
      </span>
    </button>
  );
}

export { codigoPeca };
