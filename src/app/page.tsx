import type { Metadata } from "next";
import Link from "next/link";
import CardsNoticias from "@/components/CardsNoticias";
import Destaque from "@/components/Destaque";
import Espectro, { LinhasPesquisa, ProvedorEspectro, type Faixa } from "@/components/Espectro";
import Hero from "@/components/Hero";
import ListaPublicacoes from "@/components/ListaPublicacoes";
import { carregarConteudo } from "@/lib/conteudo";
import { markdownEmLinha, markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

export function generateMetadata(): Metadata {
  const { site } = carregarConteudo();
  return { ...metadadosPagina({ titulo: site.titulo, caminho: "/" }), title: { absolute: site.titulo } };
}

export default function Home() {
  const { home, noticias, publicacoes, site } = carregarConteudo();
  // O primeiro parágrafo da apresentação vira o título da faixa escura; o resto, o texto ao lado
  const [abertura, ...resto] = home.apresentacao.split(/\n\s*\n/);
  const secao = home.secao_destaques;
  const faixas = home.destaques.filter((d) => d.faixa).map((d) => ({ chave: d.faixa as Faixa, titulo: d.titulo }));

  return (
    <ProvedorEspectro>
      <div className="largura-pagina">
        <Hero hero={home.hero} sobretitulo={site.descricao} />

        <section className="inicio__espectro" aria-labelledby={secao ? "espectro-titulo" : undefined}>
          {secao && (
            <div className="cabecalho-secao">
              <div>
                {secao.sobretitulo && <p className="cabecalho-secao__sobretitulo">{secao.sobretitulo}</p>}
                <h2 id="espectro-titulo" className="cabecalho-secao__titulo">
                  {secao.titulo}
                </h2>
              </div>
              {secao.texto && <p className="cabecalho-secao__texto">{secao.texto}</p>}
            </div>
          )}
          <Espectro faixas={faixas} />
        </section>
      </div>

      <section className="faixa-profunda apresentacao" aria-labelledby="apresentacao-titulo">
        <div className="faixa-profunda__interno apresentacao__grade">
          <div>
            {home.apresentacao_sobretitulo && <p className="apresentacao__sobretitulo">{home.apresentacao_sobretitulo}</p>}
            <h2 id="apresentacao-titulo" className="apresentacao__titulo" dangerouslySetInnerHTML={{ __html: markdownEmLinha(abertura) }} />
          </div>
          {resto.length > 0 && <div className="apresentacao__texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(resto.join("\n\n")) }} />}
        </div>
      </section>

      <div className="pagina">
        <section id="linhas-de-pesquisa" className="inicio__secao" aria-labelledby="linhas-titulo">
          <h2 id="linhas-titulo" className="somente-leitor">
            {secao?.sobretitulo ?? "Linhas de pesquisa"}
          </h2>
          <LinhasPesquisa pilares={home.destaques.map((d) => ({ id: d.titulo, faixa: (d.faixa ?? null) as Faixa | null, elemento: <Destaque destaque={d} /> }))} />
          {home.nota && <div className="nota-coordenacao" dangerouslySetInnerHTML={{ __html: markdownEmLinha(home.nota) }} />}
        </section>

        <section className="inicio__secao" aria-labelledby="noticias-titulo">
          <div className="cabecalho-secao cabecalho-secao--compacto">
            <h2 id="noticias-titulo" className="cabecalho-secao__titulo">
              {home.noticias.titulo}
            </h2>
            <Link href="/noticias/" className="cabecalho-secao__link">
              Todas as notícias
            </Link>
          </div>
          <CardsNoticias noticias={noticias.slice(0, home.noticias.quantidade)} />
        </section>

        <section className="inicio__secao" aria-labelledby="publicacoes-titulo">
          <div className="cabecalho-secao cabecalho-secao--compacto">
            <h2 id="publicacoes-titulo" className="cabecalho-secao__titulo">
              {home.publicacoes.titulo}
            </h2>
            <Link href="/publicacoes/" className="cabecalho-secao__link">
              Todas as publicações
            </Link>
          </div>
          <ListaPublicacoes publicacoes={publicacoes.slice(0, home.publicacoes.quantidade)} />
        </section>
      </div>
    </ProvedorEspectro>
  );
}
