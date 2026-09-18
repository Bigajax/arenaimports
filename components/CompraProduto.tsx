"use client";

import { useState } from "react";
import { precoBRL } from "@/lib/formato";
import { linkPeca } from "@/lib/whatsapp";
import type { Produto } from "@/lib/tipos";

/**
 * O pedido, montado antes de sair: quantidade, o tamanho ou a numeração
 * (a loja não cadastrou grade, então entra escrito), a cor quando a peça
 * tem mais de uma, e uma observação livre. Tudo vai numa mensagem
 * estruturada para o WhatsApp, uma linha por coisa, para quem atende não
 * precisar perguntar o básico. Não existe carrinho: a conversa é o pedido.
 */
export function CompraProduto({ produto, whatsapp, base }: { produto: Produto; whatsapp: string; base: string; atendimento?: boolean }) {
  const [tamanho, setTamanho] = useState<string | null>(null);
  const [tamanhoLivre, setTamanhoLivre] = useState("");
  const [cor, setCor] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");

  const preco = produto.preco_promocional ?? produto.preco;
  const total = preco !== null ? preco * quantidade : null;
  const pedeTamanho = false;

  const link = linkPeca(produto, {
    whatsapp,
    base,
    tamanho: tamanho ?? (tamanhoLivre.trim() || undefined),
    cor: cor ?? undefined,
    quantidade,
    observacao,
    preco,
  });

  return (
    <div className="space-y-6">
      {produto.tamanhos.length ? (
        <fieldset>
          <legend className="etiqueta mb-2">Tamanho</legend>
          <div className="flex flex-wrap gap-2">
            {produto.tamanhos.map((t) => (
              <button key={t} type="button" className="chip min-w-[3rem] justify-center" aria-pressed={tamanho === t} onClick={() => setTamanho(tamanho === t ? null : t)}>
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {produto.cores.length > 1 ? (
        <fieldset>
          <legend className="etiqueta mb-2">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {produto.cores.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={cor === c} onClick={() => setCor(cor === c ? null : c)}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div>
          <p className="etiqueta mb-2">Quantidade</p>
          <div className="inline-flex items-stretch overflow-hidden rounded-[var(--raio-mini)] border border-linha bg-papel-2">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              aria-label="Uma a menos"
              className="px-4 text-[1.125rem] font-semibold text-tinta hover:bg-papel-2 disabled:opacity-40"
              disabled={quantidade <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={99}
              inputMode="numeric"
              value={quantidade}
              onChange={(e) => setQuantidade(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
              aria-label="Quantidade"
              className="w-14 border-x border-linha bg-papel-2 text-center text-[1rem] font-semibold text-tinta [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => setQuantidade((q) => Math.min(99, q + 1))} aria-label="Uma a mais" className="px-4 text-[1.125rem] font-semibold text-tinta hover:bg-papel-2">
              +
            </button>
          </div>
        </div>

        {pedeTamanho && !produto.tamanhos.length ? (
          <label className="campo-flutuante">
            <span>Tamanho ou numeração</span>
            <input value={tamanhoLivre} onChange={(e) => setTamanhoLivre(e.target.value)} placeholder={produto.categoria_slug === "tenis" ? "Ex.: 41" : "Ex.: M"} maxLength={20} />
          </label>
        ) : null}
      </div>

      <label className="campo-flutuante">
        <span>Alguma observação?</span>
        <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Sua numeração, dúvida, pergunta" maxLength={140} />
      </label>

      <div className="rounded-[var(--raio)] border border-linha p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[0.9375rem] text-tinta-fraca">
            {quantidade} {quantidade === 1 ? "unidade" : "unidades"}
            {preco !== null ? ` de ${precoBRL(preco)}` : ""}
          </span>
          <span className="preco text-[1.375rem] text-tinta">{total !== null ? precoBRL(total) : "a combinar"}</span>
        </div>
        <a href={link} target="_blank" rel="noreferrer" className="btn btn--cta mt-4 w-full">
          Pedir pelo WhatsApp
        </a>
        <p className="miudo mt-3">A mensagem já vai com o produto, a quantidade e o que você escolheu. A Arena confirma se tem e combina o envio.</p>
      </div>
    </div>
  );
}
