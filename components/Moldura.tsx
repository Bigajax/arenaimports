/**
 * Herdadas da base, usadas pelo painel e pelas páginas de lista.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Moldura(_props: { legenda?: string; aresta?: "topo" | "base"; clara?: boolean }) {
  return <span className="moldura" aria-hidden="true" />;
}

export function Regua({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div className="regua">
      <h2 id={id} className="secao">
        {children}
      </h2>
    </div>
  );
}
