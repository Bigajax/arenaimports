"use client";

import { useEffect } from "react";
import { marcarDono } from "@/estudio/lib/medir";

/** Quem entra no painel é o dono: deste navegador em diante, as visitas dele à própria loja não contam na aba Desempenho. */
export function MarcaDono() {
  useEffect(() => marcarDono(), []);
  return null;
}
