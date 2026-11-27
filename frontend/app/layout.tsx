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
  title: "Renova Retífica de Motores | Retífica, montagem e peças",
  description:
    "Retífica, montagem e peças para motores em geral em Jaraguá do Sul, SC.",
  keywords: [
    "retífica de motores",
    "retífica de cabeçote",
    "virabrequim",
    "peças para motores",
    "montagem de motores",
    "Jaraguá do Sul",
  ],
  authors: [{ name: "Ana Paula Lenckulh", url: "mailto:lenckulh.ola@gmail.com" }],
  openGraph: {
    title: "Renova Retífica de Motores",
    description: "Retífica, montagem e peças para motores em geral — Jaraguá do Sul, SC.",
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
