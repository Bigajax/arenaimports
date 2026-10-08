"use client";

import { useEffect, useState } from "react";
import { IconePainel, type NomeIconePainel } from "./Navegacao";
import { linkDoEstudio } from "@/estudio/lib/oferta-performance";

/**
 * CONTRATAR O ESTÚDIO (08/10/2026). O "Pedir ao estúdio" abria o WhatsApp
 * direto, ou o plano do Performance. O Rafael, testando a SneakerSpot no
 * celular: "tinha que ser um aviso, abrir um modal quando a pessoa clicasse
 * para me contratar para fazer banner ou cupom de desconto ou lista VIP".
 * Agora o botão abre este modal com os serviços; cada cartão abre a
 * conversa do estúdio já escrita, com a loja e o pedido.
 *
 * Sem preço escrito, de propósito: o preço é conversa (regra da casa).
 */

type Servico = { id: string; icone: NomeIconePainel; nome: string; como: string; mensagem: (loja: string, onde?: string) => string };

const SERVICOS: Servico[] = [
  {
    id: "banner",
    icone: "imagem",
    nome: "Banner novo",
    como: "A arte do topo do site para uma campanha, uma data ou a peça que chegou.",
    mensagem: (loja) => `Oi! Sou da ${loja}. Quero um banner novo para o topo do site. É para: `,
  },
  {
    id: "cupom",
    icone: "preco",
    nome: "Cupom de desconto",
    como: "Um cupom no site, com a regra que você definir: primeira compra, data, valor mínimo.",
    mensagem: (loja) => `Oi! Sou da ${loja}. Quero um cupom de desconto no site. A regra que eu pensei: `,
  },
  {
    id: "vip",
    icone: "pessoas",
    nome: "Lista VIP",
    como: "O convite que junta o WhatsApp das clientes para avisar dos lançamentos antes.",
    mensagem: (loja) => `Oi! Sou da ${loja}. Quero a lista VIP no site, para juntar o WhatsApp das clientes e avisar dos lançamentos.`,
  },
  {
    id: "outra",
    icone: "texto",
    nome: "Outra mudança no site",
    como: "Um texto, uma foto, uma parte nova da página. Conta o que você quer.",
    mensagem: (loja, onde) => (onde ? `Oi! Sou da ${loja}. Quero mudar no site, ${onde}. O que eu queria: ` : `Oi! Sou da ${loja}. Quero mudar no site: `),
  },
];

/** O modal em si, controlado por quem abre (o EditorSecao, que sabe o campo). */
export function ModalContratar({ loja, onde, aoFechar, aoVerPlano }: { loja: string; onde?: string; aoFechar: () => void; aoVerPlano?: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [aoFechar]);

  return (
    <div
      className="pn-modal-fundo fixed inset-0 z-[60] overflow-y-auto bg-cimento-escuro/75 p-4 backdrop-blur-[2px] sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="contratar-titulo" className="pn-modal pn-modal--peca pn-contratar mx-auto my-4 w-full max-w-xl p-6 sm:p-8" data-ativa="true">
        <button type="button" onClick={aoFechar} className="pn-modal__fechar" aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p className="pn-modal__rotulo">O estúdio faz para você</p>
        <h2 id="contratar-titulo" className="pn-titulo pr-12">
          O que você quer na loja?
        </h2>
        <p className="pn-sub">Escolha e a conversa com o estúdio abre pronta no WhatsApp.</p>

        <ul className="pn-contratar__lista">
          {SERVICOS.map((s) => (
            <li key={s.id}>
              <a href={linkDoEstudio(s.mensagem(loja, onde))} target="_blank" rel="noreferrer" className="pn-contratar__item" onClick={aoFechar}>
                <span className="pn-contratar__icone">
                  <IconePainel nome={s.icone} />
                </span>
                <span>
                  <b>{s.nome}</b>
                  <small>{s.como}</small>
                </span>
                <IconePainel nome="seta" className="pn-contratar__seta" />
              </a>
            </li>
          ))}
        </ul>

        {aoVerPlano ? (
          <p className="pn-contratar__plano">
            Com o Performance, as mudanças no site entram no plano.{" "}
            <button type="button" onClick={aoVerPlano}>
              Ver o plano
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** O botão "Pedir ao estúdio" com o modal junto, para as telas sem campo (a loja, o config). */
export function ContratarEstudio({ loja, onde, className = "pn-estudio__pedir", rotulo = "Pedir ao estúdio" }: { loja: string; onde?: string; className?: string; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
      {aberto ? <ModalContratar loja={loja} onde={onde} aoFechar={() => setAberto(false)} /> : null}
    </>
  );
}
