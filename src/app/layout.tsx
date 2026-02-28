import { CartProvider } from "@/context/CartContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro Animal | Tienda online para mascotas",
  description:
    "Centro Animal: tienda virtual de productos para mascotas con envíos rápidos y compras seguras.",
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
