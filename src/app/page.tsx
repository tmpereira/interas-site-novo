import Link from "next/link";
import CardsNoticias from "@/components/CardsNoticias";
import Destaque from "@/components/Destaque";
import Hero from "@/components/Hero";
import ListaPublicacoes from "@/components/ListaPublicacoes";
import { carregarConteudo } from "@/lib/conteudo";
import { markdownEmLinha, markdownParaHtml } from "@/lib/markdown";

export default function Home() {
  const { home, noticias, publicacoes } = carregarConteudo();
  return (
    <>
      <Hero hero={home.hero} />

      <section className="apresentacao">
        <div className="apresentacao__texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(home.apresentacao) }} />
      </section>

      <div className="destaques">
        {home.destaques.map((d) => (
          <Destaque key={d.titulo} destaque={d} />
        ))}
      </div>

      {home.nota && <div className="nota-coordenacao" dangerouslySetInnerHTML={{ __html: markdownEmLinha(home.nota) }} />}

      <hr />

      <section className="secao-recentes">
        <h2 className="secao-recentes__titulo">
          <Link href="/noticias/">{home.noticias.titulo}</Link>
        </h2>
        <CardsNoticias noticias={noticias.slice(0, home.noticias.quantidade)} />
      </section>

      <section className="secao-recentes">
        <h2 className="secao-recentes__titulo">
          <Link href="/publicacoes/">{home.publicacoes.titulo}</Link>
        </h2>
        <ListaPublicacoes publicacoes={publicacoes.slice(0, home.publicacoes.quantidade)} />
      </section>
    </>
  );
}
