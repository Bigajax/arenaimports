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
  | "relampago"
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
  /* a chuteira, de lado: calcanhar à esquerda, bico à direita, o cadarço
     na diagonal do peito do pé e as cinco travas embaixo da sola */
  chuteira: (
    <>
      <path d="M2.5 15.8v-3c0-1.2.9-2.1 2.1-2.1h2.6c.9 0 1.7.3 2.3.9l1.6 1.5c.7.6 1.5 1 2.4 1.2l6.3 1.3c1 .2 1.7 1.1 1.7 2.1v.7z" />
      <path d="M2.5 16.4h19" />
      <path d="M4.5 16.4v2M8 16.4v2M11.5 16.4v2M15 16.4v2M18.5 16.4v2" />
      <path d="M9.2 12.5l1.2-1.3M10.7 13.6l1.2-1.3M12.2 14.5l1.2-1.3" />
    </>
  ),
  /* o tênis de corrida, de lado: gola no calcanhar com a aba, cadarço
     na diagonal e a entressola grossa */
  corrida: (
    <>
      <path d="M2.5 15.5v-4c0-1.4 1.1-2.5 2.5-2.5h2.2c1 0 1.9.4 2.6 1.1l1.8 1.8c.7.7 1.6 1.2 2.6 1.5l5.3 1.4c1.2.3 2 1.4 2 2.6v.4z" />
      <path d="M2.5 16.3h19c0 1.2-.9 2.1-2.1 2.1H4.6c-1.2 0-2.1-.9-2.1-2.1z" />
      <path d="M9.4 10.6l1.5-1.1M11.1 12.3l1.5-1.1M12.8 13.8l1.5-1.1M4.8 9V7.6" />
    </>
  ),
  /* o sneaker de cano alto, de lado: o cano reto com três ilhoses, o
     bico e a sola chata */
  sneaker: (
    <>
      <path d="M2.5 16V5.6c0-.6.5-1.1 1.1-1.1h4.6c.6 0 1.1.4 1.2 1l1.4 6c.2.9.8 1.6 1.6 2l7.2 2.9c.7.3 1.2 1 1.2 1.8V16z" />
      <path d="M2.5 16.4h19c0 1.2-.9 2.2-2.2 2.2H4.7c-1.2 0-2.2-1-2.2-2.2z" />
      <path d="M4.8 7.2h3.5M5 9.5h3.9M5.2 11.8h4.4M8.5 4.5l.9 1.3M14 13.8l2.8 1.1" />
    </>
  ),
  /* a bolsa: o corpo, a alça arqueada, a aba e o fecho */
  bolsa: (
    <>
      <path d="M4 10.2h16l-1 8.8c-.1.9-.8 1.5-1.7 1.5H6.7c-.9 0-1.6-.6-1.7-1.5z" />
      <path d="M8.2 10.2V8.6a3.8 3.8 0 0 1 7.6 0v1.6" />
      <path d="M4.4 13.8h15.2M12 13.8v1.8" />
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
  /* o relâmpago: pronta entrega, sai hoje */
  relampago: <path d="M13.5 2.5 5 13.5h6l-1.5 8 9-11.5h-6z" />,
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
