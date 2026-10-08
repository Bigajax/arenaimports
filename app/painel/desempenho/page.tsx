import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import Pagina from "@/estudio/rotas/desempenho/pagina";
import "./casa.css";

/* A aba Desempenho mora em estudio/ (a camada do estúdio, igual em toda
   loja). A Arena nasceu antes do molde e o painel dela não tem as letras
   nem as cores do painel da casa: este invólucro traz as duas, só aqui
   (08/10/2026). */
export const dynamic = "force-dynamic";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--pn-archivo" });
const inter = Inter({ subsets: ["latin"], variable: "--pn-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--pn-mono" });

export default async function PaginaDesempenhoArena(props: { searchParams: Promise<{ dias?: string }> }) {
  return <div className={`pn-arena ${archivo.variable} ${inter.variable} ${mono.variable}`}>{await Pagina(props)}</div>;
}
