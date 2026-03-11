// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PokéTrade | Marketplace de Cartas Pokémon",
  description:
    "Compre, venda e negocie cartas Pokémon com segurança. Sistema de pagamento em custódia, chat em tempo real e proteção anti-golpe.",
  keywords: "pokemon, cartas, marketplace, trade, tcg",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}