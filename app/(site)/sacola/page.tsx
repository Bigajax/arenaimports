import type { Metadata } from "next";
import { ListaEscolhas } from "@/components/ListaEscolhas";
import { obterConfig } from "@/lib/dados";
import { site } from "@/data/site.config";
export const metadata: Metadata = { title: "Minha sacola", robots: { index: false, follow: true } };
export default async function Sacola() {
  const config = await obterConfig();
  return <ListaEscolhas tipo="sacola" whatsapp={config.whatsapp || site.whatsapp} />;
}
