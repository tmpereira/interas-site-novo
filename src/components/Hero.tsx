import Image from "next/image";
import Link from "next/link";
import type { Home } from "@/lib/esquemas";
import { markdownParaHtml } from "@/lib/markdown";

/** Topo da home: sobretítulo, título grande, texto, botões e imagem ao lado. */
export default function Hero({ hero, sobretitulo }: { hero: Home["hero"]; sobretitulo: string | null }) {
  return (
    <section className="hero">
      <div className="hero__conteudo">
        {sobretitulo && <p className="hero__sobretitulo">{sobretitulo}</p>}
        <h1 className="hero__titulo">{hero.titulo}</h1>
        <div className="hero__texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(hero.texto) }} />
        {hero.botoes && hero.botoes.length > 0 && (
          <p className="hero__botoes">
            {hero.botoes.map((b, i) => (
              <Link key={b.link} href={b.link} className={`hero__botao${i > 0 ? " hero__botao--secundario" : ""}`}>
                {b.rotulo}
              </Link>
            ))}
          </p>
        )}
      </div>
      <div className="hero__imagem">
        <Image src={hero.imagem} alt="" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="hero__img" />
      </div>
    </section>
  );
}
