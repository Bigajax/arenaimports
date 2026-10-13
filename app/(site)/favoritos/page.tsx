import type { Metadata } from "next";
import { ListaEscolhas } from "@/components/ListaEscolhas";
export const metadata: Metadata = { title:"Meus favoritos", robots:{index:false,follow:true} };
export default function Favoritos() { return <ListaEscolhas tipo="favoritos" />; }
