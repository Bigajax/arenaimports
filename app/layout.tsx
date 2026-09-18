import type { Metadata } from "next";
import { Barlow, Chakra_Petch } from "next/font/google";
import { site } from "@/data/site.config";
import "./globals.css";

/* A Chakra Petch, quadrada e inclinada, faz a manchete e os títulos: é
   a letra da placa da loja, a mesma família de traço do "ARENA" do
   logo. A Barlow faz o corpo, os nomes das peças e os botões: estreita
   o bastante para caber "Nike Mercurial Vapor society" numa linha. */
const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--fonte-display",
  display: "swap",
});

const corpo = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-corpo",
  display: "swap",
});

const TITULO = "Arena Imports Floripa: chuteiras, tênis de corrida, sneakers e bolsas de grife importados";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: TITULO,
    template: "%s · Arena Imports Floripa",
  },
  description: "Importados premium direto da fonte, de Florianópolis para todo o Brasil: chuteiras Nike e Adidas, Adizero e Evo SL para correr, Jordan, Dunk e New Balance 9060, bolsas Gucci. Pronta entrega e sob encomenda. Escolhe aqui, pede pelo WhatsApp.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Arena Imports Floripa",
    url: site.url,
    title: TITULO,
    description: site.posicionamento,
    images: [{ url: "/og/site.jpg", width: 1200, height: 630, alt: "Arena Imports Floripa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: site.posicionamento,
    images: ["/og/site.jpg"],
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${corpo.variable} antialiased`}>{children}</body>
    </html>
  );
}
