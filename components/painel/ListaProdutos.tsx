"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ComoFunciona } from "./ComoFunciona";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ModalPeca } from "./ModalPeca";
import { IconePainel } from "./Navegacao";
import { alternarCampo, reordenarProdutos } from "@/lib/acoes";
import { codigoPeca, precoBRL } from "@/lib/formato";
import { marcasDisponiveis } from "@/lib/filtro";
import type { Categoria, Produto } from "@/lib/tipos";
import { site } from "@/data/site.config";

type Aviso = { id: number; texto: string; tipo: "ok" | "erro" };

/**
 * AS PEÇAS. Cada linha é uma peça com a foto grande o bastante para
 * reconhecer, o preço em destaque e dois interruptores que DIZEM o estado
 * ("No site" / "Guardada"), porque "Ativo" não dizia nada a quem não é de
 * sistema. "Na página inicial" é o antigo "Destaque", que até 26/09 não
 * fazia nada na base; agora as marcadas vêm primeiro nas fileiras da home.
 */
export function ListaProdutos({
  produtosIniciais,
  categorias,
  abrirNova = false,
  soSemPreco = false,
  buscaInicial = "",
}: {
  produtosIniciais: Produto[];
  categorias: Categoria[];
  abrirNova?: boolean;
  soSemPreco?: boolean;
  buscaInicial?: string;
}) {
  const router = useRouter();
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [busca, setBusca] = useState(buscaInicial);
  const [categoria, setCategoria] = useState("");
  const [semPreco, setSemPreco] = useState(soSemPreco);
  /* (Arena) as abas que o Luiz usava no painel antigo: em mãos ou encomenda */
  const [estoque, setEstoque] = useState<"" | "mao" | "encomenda">("");
  const [emEdicao, setEmEdicao] = useState<Produto | null>(null);
  const [modalAberto, setModalAberto] = useState(abrirNova);
  /* "Duplicar (outra cor)" (09/10/2026): o mesmo modal, como cadastro novo */
  const [duplicando, setDuplicando] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const arrastado = useRef<string | null>(null);
  /* "Mudar a ordem" (09/10/2026): no dedo não existe arrastar, então as
     setas ↑ e ↓ aparecem em cada linha, como nos banners */
  const [ordenando, setOrdenando] = useState(false);

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
      if (semPreco && (!p.ativo || p.preco !== null || p.preco_promocional !== null)) return false;
      if (estoque === "mao" && !p.pronta_entrega) return false;
      if (estoque === "encomenda" && p.pronta_entrega) return false;
      if (!termo) return true;
      return [p.nome, p.codigo, p.marca ?? ""].join(" ").toLowerCase().includes(termo);
    });
  }, [produtos, busca, categoria, semPreco, estoque]);

  const noSite = produtos.filter((p) => p.ativo).length;

  const proximoCodigo = useMemo(() => {
    const maior = produtos.reduce((max, p) => {
      const n = Number(p.codigo.replace(/\D/g, ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    return codigoPeca(maior + 1);
  }, [produtos]);

  async function alternar(p: Produto, campo: "ativo" | "destaque" | "pronta_entrega") {
    const valor = !p[campo];
    setOcupado(`${p.id}-${campo}`);
    setProdutos((atual) => atual.map((x) => (x.id === p.id ? { ...x, [campo]: valor } : x)));
    const r = await alternarCampo(p.id, campo, valor);
    setOcupado(null);
    if (!r.ok) {
      setProdutos((atual) => atual.map((x) => (x.id === p.id ? { ...x, [campo]: !valor } : x)));
      return avisar(r.erro, "erro");
    }
    const textos = {
      ativo: valor ? "Pronto: a peça voltou para o site." : "Pronto: a peça saiu do site e ficou guardada.",
      destaque: valor ? "Pronto: a peça aparece na página inicial." : "Pronto: a peça saiu da página inicial.",
      pronta_entrega: valor ? "Pronto: a peça está em mãos e entrou na Pronta entrega." : "Pronto: a peça voltou a ser sob encomenda.",
    };
    avisar(textos[campo]);
  }

  async function soltarLinha(destinoId: string) {
    const origemId = arrastado.current;
    arrastado.current = null;
    if (!origemId || origemId === destinoId) return;
    await mover(
      produtos.findIndex((p) => p.id === origemId),
      produtos.findIndex((p) => p.id === destinoId),
    );
  }

  async function mover(de: number, para: number) {
    if (de < 0 || para < 0 || de >= produtos.length || para >= produtos.length || de === para) return;
    const copia = [...produtos];
    const [movido] = copia.splice(de, 1);
    copia.splice(para, 0, movido);
    setProdutos(copia);

    const r = await reordenarProdutos(copia.map((p) => p.id));
    if (!r.ok) {
      setProdutos(produtos);
      return avisar(r.erro, "erro");
    }
    avisar("Pronto: a nova ordem já vale no site.");
  }

  function abrir(p: Produto) {
    setEmEdicao(p);
    setDuplicando(false);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setDuplicando(false);
    /* tira o ?nova=1 do endereço, senão atualizar a página reabre o cadastro */
    if (abrirNova) router.replace("/painel/pecas");
  }

  /* as sugestões do campo Marca: as marcas da loja escritas do jeito
     certo, mais as que já foram digitadas nas peças */
  const marcas = marcasDisponiveis(produtos);
  const podeArrastar = !busca && !categoria && !semPreco && !estoque;
  const nomeCategoria = (slug: string | null) => categorias.find((c) => c.slug === slug)?.nome;
  /* o placar do cabeçalho: só as peças que estão no site contam no que falta */
  const semPrecoN = produtos.filter((p) => p.ativo && p.preco == null && p.preco_promocional == null).length;
  const soCapa = produtos.filter((p) => p.ativo && p.imagens.length < 2).length;

  return (
    <div className="pn-miolo">
      {/* o cabeçalho com placar (07/10, "melhor aqui"): o rótulo em mono
          ("catálogo", não "estoque": o painel não conta unidades),
          o título, e quatro números da vitrine; os que pedem ação (sem preço,
          só a capa) ficam em vermelho, e "sem preço" filtra a lista */}
      <div className="pn-cabeca pn-pecas-cabeca">
        <div>
          <p className="pn-editor__rotulo">O catálogo do site</p>
          <h1 className="pn-titulo">Suas peças</h1>
        </div>
        <span className="pn-carimbo">
          <button
            type="button"
            onClick={() => {
              setEmEdicao(null);
              setDuplicando(false);
    setModalAberto(true);
            }}
          >
            <IconePainel nome="mais" className="h-5 w-5" />
            Cadastrar peça
          </button>
        </span>
      </div>

      <ul className="pn-placar" aria-label="A vitrine em números">
        <li>
          <span>No site</span>
          <b>{noSite}</b>
        </li>
        <li>
          <span>Guardadas</span>
          <b>{produtos.length - noSite}</b>
        </li>
        <li data-alerta={semPrecoN ? "true" : undefined}>
          <span>Sem preço</span>
          <b>{semPrecoN}</b>
          {semPrecoN ? (
            <button type="button" onClick={() => setSemPreco(true)}>
              Ver quais
            </button>
          ) : null}
        </li>
        <li data-alerta={soCapa ? "true" : undefined}>
          <span>Só com a capa</span>
          <b>{soCapa}</b>
          {soCapa ? <small>mais fotos, mais pedidos</small> : null}
        </li>
      </ul>

      {/* o "Como funciona" virou modal vivo (07/10): a peça de exemplo com
          os interruptores e o site em miniatura mudando ao lado */}
      <ComoFunciona foto={produtos.find((p) => p.imagens[0])?.imagens[0].url ?? null} nome={produtos[0]?.nome ?? "Sua peça"} podeArrastar={podeArrastar} pecas={produtos.slice(0, 8).map((p) => ({ nome: p.nome, foto: p.imagens[0]?.url ?? null }))} />

      <div className="pn-filtros">
        <label htmlFor="busca-painel" className="sr-only">
          Buscar peça
        </label>
        <input id="busca-painel" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar: nome, marca ou código..." className="campo" />
        <label htmlFor="categoria-painel" className="sr-only">
          Mostrar só uma categoria
        </label>
        <select id="categoria-painel" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nome}
            </option>
          ))}
        </select>
        <label htmlFor="estoque-painel" className="sr-only">
          Em mãos ou encomenda
        </label>
        <select id="estoque-painel" value={estoque} onChange={(e) => setEstoque(e.target.value as "" | "mao" | "encomenda")} className="campo">
          <option value="">Em mãos e encomenda</option>
          <option value="mao">Só em mãos</option>
          <option value="encomenda">Só encomenda</option>
        </select>
      </div>

      {podeArrastar && produtos.length > 1 ? (
        <p className="pn-ordem">
          <button type="button" className="btn btn--linha" aria-pressed={ordenando} onClick={() => setOrdenando((v) => !v)}>
            {ordenando ? "Pronto, ordem certa" : "Mudar a ordem"}
          </button>
          <span>{ordenando ? "As setas sobem e descem a peça. A ordem daqui é a ordem do site." : "A ordem desta lista é a ordem do site."}</span>
        </p>
      ) : null}

      {semPreco ? (
        <p className="pn-dica" style={{ borderLeftColor: "var(--pn-tinta)" }}>
          Mostrando só as peças do site <b>sem preço</b>. Toque em Editar e preencha o preço de cada uma.{" "}
          <button type="button" className="btn--texto font-bold underline" onClick={() => setSemPreco(false)}>
            Ver todas
          </button>
        </p>
      ) : null}

      {visiveis.length ? (
        <ul className="pn-pecas">
          {visiveis.map((p, i) => {
            const valor = precoBRL(p.preco_promocional ?? p.preco);
            return (
              <li
                key={p.id}
                draggable={podeArrastar}
                onDragStart={() => {
                  arrastado.current = p.id;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void soltarLinha(p.id)}
                className="pn-peca"
                data-fora={p.ativo ? undefined : "true"}
                style={podeArrastar ? { cursor: "grab" } : undefined}
              >
                {/* tocar na foto ou no nome abre a peça (09/10/2026) */}
                <button type="button" className="pn-peca__foto" onClick={() => abrir(p)} tabIndex={-1} aria-hidden="true">
                  {p.imagens[0] ? <Image src={p.imagens[0].url} alt="" fill sizes="72px" className="object-cover" /> : null}
                </button>

                <div className="min-w-0">
                  <p className="pn-peca__nome">
                    <button type="button" className="pn-peca__abrir" onClick={() => abrir(p)}>
                      {p.nome}
                    </button>
                  </p>
                  {valor ? <p className="pn-peca__preco">{valor}</p> : <p className="pn-peca__preco pn-peca__preco--vazio">Sem preço: no site a peça aparece sem valor</p>}
                  <p className="pn-peca__meta">{[nomeCategoria(p.categoria_slug), p.marca, p.codigo].filter(Boolean).join(", ")}</p>
                </div>

                {/* o vão do meio vira a ficha da peça (07/10, "muitos espaços
                    vazios"): os tamanhos, com o esgotado riscado, e quantas
                    fotos ela tem. O que hoje só se via abrindo a peça. */}
                <div className="pn-peca__ficha">
                  <div>
                    <p className="pn-peca__rot">Tamanhos</p>
                    {p.tamanhos?.length ? (
                      <ul className="pn-peca__tams">
                        {p.tamanhos.slice(0, 10).map((t) => (
                          <li key={t} data-esgotado={p.tamanhos_esgotados?.includes(t) ? "true" : undefined}>
                            {t}
                          </li>
                        ))}
                        {p.tamanhos.length > 10 ? <li className="pn-peca__tams-mais">+{p.tamanhos.length - 10}</li> : null}
                      </ul>
                    ) : (
                      <p className="pn-peca__falta">Sem tamanho</p>
                    )}
                  </div>
                  <div>
                    <p className="pn-peca__rot">Fotos</p>
                    <p className={p.imagens.length < 2 ? "pn-peca__fotos pn-peca__falta" : "pn-peca__fotos"}>
                      {p.imagens.length === 0 ? "Nenhuma" : p.imagens.length === 1 ? "Só a capa" : p.imagens.length}
                    </p>
                  </div>
                </div>

                {ordenando ? (
                  <div className="pn-peca__ordem">
                    <button type="button" className="btn btn--linha" onClick={() => void mover(i, i - 1)} disabled={i === 0} aria-label={`Subir ${p.nome}`}>
                      ↑
                    </button>
                    <button type="button" className="btn btn--linha" onClick={() => void mover(i, i + 1)} disabled={i === visiveis.length - 1} aria-label={`Descer ${p.nome}`}>
                      ↓
                    </button>
                  </div>
                ) : (
                <div className="pn-peca__acoes">
                  <Chave ligado={p.ativo} ocupado={ocupado === `${p.id}-ativo`} rotulo={p.ativo ? "No site" : "Guardada"} descricao={`${p.nome}: aparece no site`} aoMudar={() => void alternar(p, "ativo")} />
                  <Chave ligado={p.pronta_entrega} ocupado={ocupado === `${p.id}-pronta_entrega`} rotulo={p.pronta_entrega ? "Em mãos" : "Encomenda"} descricao={`${p.nome}: está em mãos, pronta entrega`} aoMudar={() => void alternar(p, "pronta_entrega")} />
                  <button type="button" onClick={() => abrir(p)} className="btn btn--linha pn-peca__editar" aria-label={`Editar ${p.nome}`}>
                    <IconePainel nome="lapis" className="pn-peca__lapis" />
                    <span>Editar</span>
                  </button>
                </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="pn-dica">Nenhuma peça com essa busca. Apague o que escreveu ou escolha &quot;Todas as categorias&quot;.</p>
      )}

      {modalAberto ? (
        <ModalPeca
          key={(emEdicao?.id ?? "nova") + (duplicando ? "-copia" : "")}
          produto={emEdicao}
          duplicar={duplicando}
          aoDuplicar={(p) => {
            setEmEdicao(p);
            setDuplicando(true);
          }}
          categorias={categorias}
          proximoCodigo={proximoCodigo}
          marcasConhecidas={marcas}
          avisar={avisar}
          aoFechar={fecharModal}
          aoSalvar={() => {
            fecharModal();
            router.refresh();
          }}
          aoExcluir={(id) => {
            setProdutos((atual) => atual.filter((x) => x.id !== id));
            fecharModal();
          }}
        />
      ) : null}

      <div aria-live="polite" className="pn-avisos">
        {avisos.map((a) => (
          <p key={a.id} className="pn-aviso" data-tipo={a.tipo}>
            {a.texto}
          </p>
        ))}
      </div>
    </div>
  );
}

/** O interruptor com a palavra do estado ao lado. */
export function Chave({ ligado, ocupado, rotulo, descricao, aoMudar }: { ligado: boolean; ocupado: boolean; rotulo: string; descricao?: string; aoMudar: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={descricao} disabled={ocupado} onClick={aoMudar} className="pn-chave">
      <span aria-hidden="true" className="pn-chave__trilho">
        <span className="pn-chave__bola" />
      </span>
      <span aria-hidden={descricao ? "true" : undefined}>{rotulo}</span>
    </button>
  );
}
