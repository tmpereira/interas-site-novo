import type { Metadata } from "next";
import Abas from "@/components/Abas";
import Breadcrumb from "@/components/Breadcrumb";
import { carregarConteudo } from "@/lib/conteudo";
import { markdownParaHtml } from "@/lib/markdown";

type Props = { params: Promise<{ slug: string }> };

function grupoPorSlug(slug: string) {
  const grupo = carregarConteudo().grupos.find((g) => g.slug === slug);
  if (!grupo) throw new Error(`content/grupos.json: não existe o grupo "${slug}"`);
  return grupo;
}

export function generateStaticParams() {
  return carregarConteudo().grupos.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = grupoPorSlug((await params).slug);
  return { title: g.titulo, description: g.resumo ?? undefined, openGraph: g.imagem ? { images: [g.imagem] } : undefined };
}

export default async function PaginaGrupo({ params }: Props) {
  const g = grupoPorSlug((await params).slug);
  const { site } = carregarConteudo();
  const rotulo = new Map(site.temas_grupos.map((t) => [t.slug, t.rotulo]));
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Grupos e Laboratórios", href: "/grupos/" }, { rotulo: g.titulo }]} />
      <article className="leitura">
        <header>
          <h1 className="leitura__titulo">{g.titulo}</h1>
          {g.temas.length > 0 && (
            <p>
              {g.temas.map((t) => (
                <span key={t} className="etiqueta">
                  {rotulo.get(t) ?? t}
                </span>
              ))}
            </p>
          )}
          {g.resumo && <p>{g.resumo}</p>}
        </header>
        {g.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(g.conteudo) }} />}
        {g.abas.length > 0 && <Abas prefixo={g.slug} abas={g.abas.map((a) => ({ titulo: a.titulo, html: markdownParaHtml(a.conteudo) }))} />}
      </article>
    </div>
  );
}
