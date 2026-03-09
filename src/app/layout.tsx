import { CartProvider } from "@/context/CartContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnimalPetMarket | Tienda online para mascotas",
  description:
    "AnimalPetMarket: tienda virtual de productos para mascotas con envíos rápidos y compras seguras.",
  icons: {
    icon: "/img/logo-centro-animal.ico",
    shortcut: "/img/logo-centro-animal.ico",
    apple: "/img/logo-centro-animal.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
