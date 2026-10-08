"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IconePainel } from "./Navegacao";

/**
 * "COMO FUNCIONA" DAS PEÇAS, EM MODAL VIVO (07/10/2026): "mais interativo,
 * design personalizado, instruções simples e didáticas". No lugar da lista
 * de três frases, uma peça de exemplo (a primeira da loja, com a foto dela)
 * com os dois interruptores de verdade, e ao lado o site em miniatura, que
 * muda na hora: desligou "No site", a peça some do catálogo e fica
 * guardada; ligou "Em mãos" (na Arena), ela entra na Pronta entrega. A
 * frase embaixo diz o que acabou de acontecer. Nada aqui grava: é ensaio.
 */
export type PecaDeEnsaio = { nome: string; foto: string | null };

export function ComoFunciona({ foto, nome, podeArrastar, pecas }: { foto: string | null; nome: string; podeArrastar: boolean; pecas: PecaDeEnsaio[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [aberto, setAberto] = useState(false);
  /* duas abas (07/10, "faz uma segunda aba para explicar as outras coisas") */
  const [aba, setAba] = useState<"botoes" | "resto">("botoes");
  const [noSite, setNoSite] = useState(true);
  const [inicial, setInicial] = useState(false);
  const [ultimo, setUltimo] = useState<"site" | "inicial" | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  const frase =
    ultimo === "site"
      ? noSite
        ? "Voltou para o site. Aparece no catálogo e pode ser pedida de novo."
        : "Sumiu do site, mas não foi apagada: fica guardada aqui para quando o estoque voltar."
      : ultimo === "inicial"
        ? inicial
          ? noSite
            ? "Está em mãos: entrou na Pronta entrega, com o selo verde no cartão."
            : "Marcada como em mãos, mas só aparece quando estiver no site."
          : "Voltou a ser sob encomenda. Continua no catálogo, sem o selo."
        : "Toque nos dois interruptores e veja o site mudar ao lado.";

  const naInicial = noSite && inicial;

  return (
    <>
      <button type="button" className="pn-como-abre" onClick={() => setAberto(true)}>
        <span className="pn-como-abre__i" aria-hidden="true">?</span>
        Como funciona esta tela
      </button>

      <dialog ref={ref} className="pn-como" aria-labelledby="pn-como-titulo" onClose={() => setAberto(false)}>
        <form method="dialog" className="pn-como__x-form">
          <button type="submit" className="pn-como__x" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </form>

        <p className="pn-como__rotulo">Como funciona</p>
        <h2 id="pn-como-titulo" className="pn-como__titulo">
          Teste aqui. Nada muda no site.
        </h2>

        <div className="pn-como__abas" role="tablist" aria-label="O que explicar">
          <button type="button" role="tab" aria-selected={aba === "botoes"} className="pn-como__aba" onClick={() => setAba("botoes")}>
            Os botões da peça
          </button>
          <button type="button" role="tab" aria-selected={aba === "resto"} className="pn-como__aba" onClick={() => setAba("resto")}>
            O resto da tela
          </button>
        </div>

        {aba === "botoes" ? (
          <>
        <div className="pn-como__palco">
          {/* a peça de exemplo, igual à linha da lista */}
          <div className="pn-como__peca">
            <p className="pn-como__mini-rot">A peça no painel</p>
            <div className="pn-como__linha">
              <span className="pn-como__foto">{foto ? <Image src={foto} alt="" fill sizes="56px" className="object-cover" /> : null}</span>
              <b>{nome}</b>
            </div>
            <Interruptor
              rotulo="No site"
              ligado={noSite}
              aoMudar={() => {
                setNoSite((v) => !v);
                setUltimo("site");
              }}
              explica="Desligue quando acabar. A peça fica guardada."
            />
            <Interruptor
              rotulo="Em mãos"
              ligado={inicial}
              aoMudar={() => {
                setInicial((v) => !v);
                setUltimo("inicial");
              }}
              explica="Ligue quando o par chegar. Desligada, é sob encomenda."
            />
            <div className="pn-como__editar">
              <span>
                <IconePainel nome="lapis" />
                Editar
              </span>
              <p>O lápis, ou um toque na foto ou no nome, abre a peça para trocar foto, nome, preço e tamanhos.</p>
            </div>
          </div>

          {/* o site em miniatura */}
          <div className="pn-como__site" aria-live="polite">
            <p className="pn-como__mini-rot">O site agora</p>
            <div className="pn-como__tela">
              <p className="pn-como__tela-nome">Pronta entrega</p>
              <div className="pn-como__fileira">
                {naInicial ? <Cartao foto={foto} destaque /> : null}
                <span className="pn-como__vaga" />
                <span className="pn-como__vaga" />
                {naInicial ? null : <span className="pn-como__vaga" />}
              </div>
            </div>
            <div className="pn-como__tela">
              <p className="pn-como__tela-nome">Todas as peças</p>
              <div className="pn-como__fileira pn-como__fileira--catalogo">
                <span className="pn-como__vaga" />
                {noSite ? <Cartao foto={foto} /> : null}
                <span className="pn-como__vaga" />
                <span className="pn-como__vaga" />
                {noSite ? null : <span className="pn-como__vaga" />}
              </div>
            </div>
            {!noSite ? <p className="pn-como__guardada">Guardada no painel</p> : null}
          </div>
        </div>

        <p className="pn-como__frase" role="status">
          {frase}
        </p>
          </>
        ) : (
          <OResto pecas={pecas} />
        )}

        <form method="dialog" className="pn-como__fim">
          {podeArrastar && aba === "botoes" ? <p className="pn-como__dica">Para mudar a ordem das peças no site, toque em &quot;Mudar a ordem&quot; e use as setas. No computador, dá também para arrastar as linhas.</p> : <span />}
          <span className="pn-carimbo">
            <button type="submit">Entendi</button>
          </span>
        </form>
      </dialog>
    </>
  );
}

function Interruptor({ rotulo, ligado, aoMudar, explica }: { rotulo: string; ligado: boolean; aoMudar: () => void; explica: string }) {
  return (
    <div className="pn-como__chave">
      <button type="button" role="switch" aria-checked={ligado} className="pn-chave" onClick={aoMudar}>
        <span aria-hidden="true" className="pn-chave__trilho">
          <span className="pn-chave__bola" />
        </span>
        <span>{rotulo}</span>
      </button>
      <p>{explica}</p>
    </div>
  );
}

function Cartao({ foto, destaque = false }: { foto: string | null; destaque?: boolean }) {
  return (
    <span className={destaque ? "pn-como__cartao pn-como__cartao--novo" : "pn-como__cartao"}>
      {foto ? <Image src={foto} alt="" fill sizes="60px" className="object-cover" /> : null}
    </span>
  );
}

/* ── a segunda aba: o resto da tela, em quatro passos ───────── */

const PASSOS = ["Cadastrar", "Os números", "Buscar", "A ordem"] as const;

function OResto({ pecas }: { pecas: PecaDeEnsaio[] }) {
  const [passo, setPasso] = useState(0);
  return (
    <div className="pn-resto">
      <ol className="pn-resto__trilho">
        {PASSOS.map((p, i) => (
          <li key={p}>
            <button type="button" aria-current={i === passo ? "step" : undefined} onClick={() => setPasso(i)}>
              <i>{i + 1}</i>
              {p}
            </button>
          </li>
        ))}
      </ol>

      <div className="pn-resto__quadro">
        {passo === 0 ? <PassoCadastrar /> : passo === 1 ? <PassoNumeros /> : passo === 2 ? <PassoBuscar pecas={pecas} /> : <PassoOrdem pecas={pecas} />}
      </div>

      <div className="pn-resto__nav">
        <button type="button" className="pn-resto__volta" disabled={passo === 0} onClick={() => setPasso((p) => p - 1)}>
          Anterior
        </button>
        {passo < PASSOS.length - 1 ? (
          <button type="button" className="pn-resto__vai" onClick={() => setPasso((p) => p + 1)}>
            Próximo: {PASSOS[passo + 1]}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PassoCadastrar() {
  return (
    <div className="pn-resto__dois">
      <div>
        <h3>Peça nova: o botão rosa, no alto.</h3>
        <p>Só a foto e o nome são obrigatórios. O resto ajuda a vender:</p>
        <ul className="pn-resto__lista">
          <li><b>Fotos</b> várias de uma vez; a primeira é a capa</li>
          <li><b>Preço</b> com desconto, o cheio aparece riscado</li>
          <li><b>Tamanhos</b> por toque, sem digitar</li>
        </ul>
      </div>
      <div className="pn-resto__mostra">
        <span className="pn-resto__carimbo">+ Cadastrar peça</span>
        <p>Salvou, está no site.</p>
      </div>
    </div>
  );
}

function PassoNumeros() {
  const [visto, setVisto] = useState<string | null>(null);
  const celulas = [
    { k: "No site", n: "37", diz: "As peças que qualquer pessoa vê agora." },
    { k: "Guardadas", n: "2", diz: "Desligadas: fora do site, mas não apagadas." },
    { k: "Sem preço", n: "3", diz: "Aparecem no site sem valor. Toque em Ver quais e preencha.", alerta: true },
    { k: "Só com a capa", n: "12", diz: "Uma foto só. Quem vê mais fotos chama mais.", alerta: true },
  ];
  const atual = celulas.find((c) => c.k === visto);
  return (
    <div>
      <h3>O placar diz o que falta.</h3>
      <p>Vermelho é o que pede ação. Toque num número:</p>
      <ul className="pn-placar pn-resto__placar">
        {celulas.map((c) => (
          <li key={c.k} data-alerta={c.alerta ? "true" : undefined}>
            <button type="button" className="pn-resto__celula" aria-pressed={visto === c.k} onClick={() => setVisto(c.k)}>
              <span>{c.k}</span>
              <b>{c.n}</b>
            </button>
          </li>
        ))}
      </ul>
      <p className="pn-como__frase" role="status">
        {atual ? atual.diz : "Os números são de exemplo. Os seus estão no alto da tela."}
      </p>
    </div>
  );
}

function PassoBuscar({ pecas }: { pecas: PecaDeEnsaio[] }) {
  const [busca, setBusca] = useState("");
  const achadas = pecas.filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase()));
  return (
    <div>
      <h3>Ache a peça pelo nome, pela marca ou pelo código.</h3>
      <p>Digite aqui uma parte do nome, como faria na tela de verdade:</p>
      <input className="campo pn-resto__busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={pecas[0] ? pecas[0].nome.split(" ").slice(0, 2).join(" ") : "Nome da peça"} aria-label="Buscar, de ensaio" />
      <ul className="pn-resto__achadas">
        {achadas.slice(0, 5).map((p) => (
          <li key={p.nome}>
            <span className="pn-como__foto pn-resto__mini">{p.foto ? <Image src={p.foto} alt="" fill sizes="40px" className="object-cover" /> : null}</span>
            {p.nome}
          </li>
        ))}
        {!achadas.length ? <li className="pn-resto__nada">Nenhuma com esse nome. Apague e tente uma palavra só.</li> : null}
      </ul>
      <p className="pn-resto__nota">Ao lado da busca, a categoria mostra só um tipo de peça.</p>
    </div>
  );
}

function PassoOrdem({ pecas }: { pecas: PecaDeEnsaio[] }) {
  const [ordem, setOrdem] = useState(() => pecas.slice(0, 3));
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= ordem.length) return;
    const nova = ordem.slice();
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setOrdem(nova);
  };
  return (
    <div className="pn-resto__dois">
      <div>
        <h3>A ordem da lista é a ordem do site.</h3>
        <p>No computador, arraste a linha. Aqui, use as setas:</p>
        <ol className="pn-resto__ordem">
          {ordem.map((p, i) => (
            <li key={p.nome}>
              <span>{p.nome}</span>
              <span className="pn-resto__setas">
                <button type="button" className="pn-seta" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir ${p.nome}`}>
                  ↑
                </button>
                <button type="button" className="pn-seta" disabled={i === ordem.length - 1} onClick={() => mover(i, 1)} aria-label={`Descer ${p.nome}`}>
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="pn-resto__mostra pn-resto__mostra--site">
        <p className="pn-como__tela-nome">O site</p>
        <div className="pn-como__fileira">
          {ordem.map((p, i) => (
            <span key={p.nome} className={i === 0 ? "pn-como__cartao pn-como__cartao--novo" : "pn-como__cartao"}>
              {p.foto ? <Image src={p.foto} alt="" fill sizes="60px" className="object-cover" /> : null}
            </span>
          ))}
        </div>
        <p>A primeira da lista é a primeira do site.</p>
      </div>
    </div>
  );
}
