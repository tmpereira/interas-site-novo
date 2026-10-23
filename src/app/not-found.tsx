import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página não encontrada", robots: { index: false } };

export default function NaoEncontrada() {
  return (
    <div className="pagina">
      <section className="nao-encontrada">
        <h1 className="nao-encontrada__titulo">Página não encontrada</h1>
        <p>O endereço que você acessou não existe ou foi movido.</p>
        <p>
          <Link href="/" className="nao-encontrada__botao">
            Voltar à página inicial
          </Link>
        </p>
      </section>
    </div>
  );
}
