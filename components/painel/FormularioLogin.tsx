"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acaoEntrar } from "@/lib/acoes";

export function FormularioLogin({ pedeEmail }: { pedeEmail: boolean }) {
  const [estado, acao] = useActionState(acaoEntrar, null);

  return (
    <form action={acao} className="space-y-5">
      {pedeEmail ? (
        <div>
          <label htmlFor="email" className="mono-rotulo mb-2 block text-marrom-fundo">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="campo"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="senha" className="mono-rotulo mb-2 block text-marrom-fundo">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="campo"
        />
      </div>

      {estado?.erro ? (
        <p role="alert" className="text-[0.8125rem] text-marrom-fundo">
          {estado.erro}
        </p>
      ) : null}

      <Botao />
    </form>
  );
}

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--primario w-full" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}
