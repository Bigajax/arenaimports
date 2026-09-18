"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Moldura } from "../Moldura";
import { salvarConfig } from "@/lib/acoes";
import type { Config } from "@/lib/tipos";

const CAMPOS: {
  chave: string;
  rotulo: string;
  ajuda: string;
  tipo?: "texto" | "area";
}[] = [
  {
    chave: "whatsapp",
    rotulo: "WhatsApp",
    ajuda: "Com país e DDD, só números: 5532991169200",
  },
  {
    chave: "aviso_topo",
    rotulo: "Recados da tarja",
    ajuda: "Passam em looping no topo do site. Separe cada recado com |",
    tipo: "area",
  },
  {
    chave: "frase_hero",
    rotulo: "Frase da capa",
    ajuda: "Aparece embaixo do logotipo, na primeira tela",
  },
  {
    chave: "endereco",
    rotulo: "Endereço",
    ajuda: "Rua e número. Vazio, o site mostra só a cidade",
  },
  {
    chave: "horario",
    rotulo: "Horário",
    ajuda: "Ex.: seg a sex 9h–18h · sáb 9h–13h",
  },
  { chave: "instagram", rotulo: "Instagram", ajuda: "Sem o @" },
  { chave: "cidade", rotulo: "Cidade", ajuda: "Como aparece no rodapé" },
];

export function FormularioConfig({ config }: { config: Config }) {
  const [estado, acao] = useActionState(salvarConfig, null);

  return (
    <form action={acao} className="tem-moldura bg-off-white p-6 sm:p-10" data-ativa="true">
      <div className="space-y-7">
        {CAMPOS.map((c) => (
          <div key={c.chave}>
            <label
              htmlFor={`config-${c.chave}`}
              className="mono-rotulo mb-2 block text-marrom-fundo"
            >
              {c.rotulo}
            </label>
            {c.tipo === "area" ? (
              <textarea
                id={`config-${c.chave}`}
                name={c.chave}
                rows={3}
                defaultValue={config[c.chave] ?? ""}
                className="campo resize-y"
              />
            ) : (
              <input
                id={`config-${c.chave}`}
                name={c.chave}
                defaultValue={config[c.chave] ?? ""}
                className="campo"
              />
            )}
            <p className="mono mt-2 text-[0.6875rem] text-tinta">{c.ajuda}</p>
          </div>
        ))}
      </div>

      {estado?.erro ? (
        <p role="alert" className="mt-7 text-[0.875rem] text-marrom-fundo">
          {estado.erro}
        </p>
      ) : null}
      {estado?.salvo ? (
        <p role="status" className="mt-7 text-[0.875rem] text-tinta">
          Configurações salvas. O site já mostra os valores novos.
        </p>
      ) : null}

      <div className="mt-9 flex justify-end border-t border-cimento-medio pt-6">
        <Botao />
      </div>

      <Moldura legenda="A loja" aresta="topo" />
    </form>
  );
}

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? "Salvando…" : "Salvar configurações"}
    </button>
  );
}
