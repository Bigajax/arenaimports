/**
 * Ícones de linha da vitrine, um traço só. As quatro portas são a
 * chuteira, o tênis de corrida, o sneaker de cano alto e a bolsa; os
 * outros são os de sempre: avião (importado), loja, pacote (envio),
 * conversa, lupa, seta. Herdam a cor do texto; o tamanho vem da
 * className.
 */
export type NomeIcone =
  | "novidade"
  | "chuteira"
  | "corrida"
  | "sneaker"
  | "bolsa"
  | "camisa"
  | "aviao"
  | "simbolo"
  | "pacote"
  | "loja"
  | "lupa"
  | "whats"
  | "caminhao"
  | "conversa"
  | "etiqueta"
  | "cartao"
  | "pino"
  | "instagram"
  | "check"
  | "seta"
  | "seta-esq"
  | "fechar";

const TRACOS: Record<Exclude<NomeIcone, "whats">, React.ReactNode> = {
  novidade: <path d="M12 3.4l2.5 5.6 6.1.6-4.6 4.1 1.4 6L12 16.6l-5.4 3.1 1.4-6-4.6-4.1 6.1-.6z" />,
  /* a chuteira: o cano baixo, o bico e as travas embaixo */
  chuteira: (
    <>
      <path d="M3 15.5c0-1.2.6-2 1.8-2.4L9 11.5l1-4h3.5l1.2 3.2c.4 1 1.2 1.6 2.3 1.9l3.4 1c.9.3 1.6 1 1.6 2v1.9H3z" />
      <path d="M5 17.5v2M9 17.5v2M13 17.5v2M17 17.5v2M20.5 17.5v2M9 11.5l3 1.6" />
    </>
  ),
  /* o tênis de corrida: solado grosso e a linha de velocidade */
  corrida: (
    <>
      <path d="M2.5 15.5c0-1 .7-1.8 1.7-2.1L8.5 12l1.5-4.5h3l1.3 3.4c.4.9 1.2 1.6 2.2 1.9l3 .9c1.2.4 2 1.4 2 2.7v1.6h-19z" />
      <path d="M2.5 18h19M8.5 12l2.6 1.5M1 9.5h4M1 12h2.5" />
    </>
  ),
  /* o sneaker de cano alto */
  sneaker: (
    <>
      <path d="M3 16.5c0-1.1.7-2 1.8-2.3L8 13.2V6h4.5l1.7 5.1c.3 1 1.1 1.7 2.1 2l2.9.9c1.1.3 1.8 1.3 1.8 2.4v1.6H3z" />
      <path d="M3 19h18M8 9.5h3.5M8 12h4M12.5 6l1.5 2.2" />
    </>
  ),
  /* a bolsa: a alça curta e o fecho */
  bolsa: (
    <>
      <path d="M4.5 9.5h15l-1.2 10h-12.6z" />
      <path d="M8.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5M10 13.5h4" />
    </>
  ),
  /* a camisa de time */
  camisa: (
    <>
      <path d="M8.5 4.5 12 6l3.5-1.5 5 2.5-1.8 4-2.2-.8v9.3h-9V10.2l-2.2.8-1.8-4z" />
      <path d="M9.5 4.5c.5 1.5 1.3 2.2 2.5 2.2s2-.7 2.5-2.2" />
    </>
  ),
  /* o avião: importado direto da fonte */
  aviao: (
    <>
      <path d="M2.5 13.5 21 4.5l-4.5 16-4.8-6.2z" />
      <path d="M11.7 14.3 21 4.5" />
    </>
  ),
  /* o arco do símbolo: o A dentro do arco aberto embaixo */
  simbolo: (
    <>
      <path d="M4.6 17.5A9 9 0 1 1 19.4 17.5" />
      <path d="M8.5 17.5 12 7l3.5 10.5M9.8 13.8h4.4" />
    </>
  ),
  /* o pacote: envio para todo o Brasil */
  pacote: (
    <>
      <path d="M3.5 8.5 12 4l8.5 4.5v8L12 21l-8.5-4.5z" />
      <path d="M3.5 8.5 12 13l8.5-4.5M12 13v8M7.5 6.3l8.5 4.5" />
    </>
  ),
  loja: (
    <>
      <path d="M3.5 9.5 5 4.5h14l1.5 5" />
      <path d="M3.5 9.5a2.1 2.1 0 0 0 4.25 0 2.1 2.1 0 0 0 4.25 0 2.1 2.1 0 0 0 4.25 0 2.1 2.1 0 0 0 4.25 0" />
      <path d="M5 11.5v8h14v-8" />
      <path d="M10 19.5v-4.5h4v4.5" />
    </>
  ),
  lupa: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  caminhao: (
    <>
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 9.5h4l3 3.5v2.5h-7z" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  conversa: (
    <>
      <path d="M4 5.5h16v10H9l-4 3.5z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  etiqueta: (
    <>
      <path d="M3.5 12.5v-8h8l9 9-8 8z" />
      <circle cx="7.5" cy="8.5" r="1.3" />
    </>
  ),
  cartao: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19M6.5 14.5h4" />
    </>
  ),
  pino: (
    <>
      <path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8h.01" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  seta: <path d="M9.5 6l6 6-6 6" />,
  "seta-esq": <path d="M14.5 6l-6 6 6 6" />,
  fechar: <path d="M6 6l12 12M18 6L6 18" />,
};

export function Icone({ nome, className = "h-6 w-6", peso = 1.5 }: { nome: NomeIcone; className?: string; peso?: number }) {
  if (nome === "whats") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="currentColor">
        <path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.2 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.9c-1.5 0-3-.4-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.5-6c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2c.2-.6.2-1.1.2-1.2-.1-.2-.3-.3-.5-.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth={peso} strokeLinecap="round" strokeLinejoin="round">
      {TRACOS[nome]}
    </svg>
  );
}
