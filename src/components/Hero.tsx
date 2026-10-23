import type { CSSProperties } from "react";
import type { Home } from "@/lib/esquemas";
import { markdownParaHtml } from "@/lib/markdown";

export default function Hero({ hero }: { hero: Home["hero"] }) {
  return (
    <section className="hero">
      <h1 className="hero__titulo">{hero.titulo}</h1>
      <div className="hero__imagem" style={{ "--imagem-fundo": `url("${hero.imagem}")` } as CSSProperties}>
        <div className="hero__conteudo">
          <div className="hero__texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(hero.texto) }} />
        </div>
      </div>
    </section>
  );
}
