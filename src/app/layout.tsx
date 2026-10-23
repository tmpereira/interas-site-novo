import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/styles/main.scss";

export const metadata: Metadata = {
  title: "INCT INTERAS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
