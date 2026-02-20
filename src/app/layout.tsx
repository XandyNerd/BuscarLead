import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuscaLead — Geração de Leads Locais",
  description: "Encontre leads comerciais locais a partir do Google Maps. Prospecção inteligente para o seu negócio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
