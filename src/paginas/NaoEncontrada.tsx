import type { Metadata } from "next";
import Link from "next/link";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  return { title: rotulos(idioma).naoEncontrada.tituloAba, robots: { index: false } };
}

export default function NaoEncontrada({ idioma }: { idioma: Idioma }) {
  const r = rotulos(idioma).naoEncontrada;
  return (
    <div className="pagina">
      <section className="nao-encontrada">
        <p className="nao-encontrada__sobretitulo">{r.sobretitulo}</p>
        <h1 className="nao-encontrada__titulo">{r.titulo}</h1>
        <p>{r.texto}</p>
        <p>
          <Link href={rota("inicio", idioma)} className="nao-encontrada__botao">
            {r.voltar}
          </Link>
        </p>
      </section>
    </div>
  );
}
