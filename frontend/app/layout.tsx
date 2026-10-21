import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./design-tokens.css";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catálogo Inteligente B2B | Predição de Intenção de Compra",
  description:
    "Sistema de catálogo B2B com motor de recomendação baseado em scoring e decaimento temporal exponencial — predizendo intenção de compra a partir de uma única interação do usuário.",
  keywords: [
    "B2B",
    "e-commerce",
    "sistema de recomendação",
    "scoring",
    "intenção de compra",
    "decaimento temporal",
    "LGPD",
  ],
  authors: [{ name: "Ana Paula Lenckulh", url: "mailto:lenckulh.ola@gmail.com" }],
  openGraph: {
    title: "Catálogo Inteligente B2B",
    description: "Predição de intenção de compra com scoring e decaimento temporal exponencial.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
