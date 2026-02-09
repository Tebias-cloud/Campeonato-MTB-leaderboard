import type { Metadata } from "next";
import "./globals.css";
// Importamos fuentes de Google directas de Next.js
import { Teko, Montserrat } from "next/font/google";

// Fuente para Títulos (Estilo agresivo/deportivo)
const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Fuente para textos (Lectura limpia)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chaski Riders Iquique",
  description: "Ranking Oficial MTB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${teko.variable} ${montserrat.variable} antialiased bg-sand-100 text-dark-900 font-sans`}>
        {children}
      </body>
    </html>
  );
}