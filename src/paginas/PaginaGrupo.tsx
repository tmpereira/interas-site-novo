import type { Metadata } from "next";
import Abas from "@/components/Abas";
import Image from "next/image";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { carregarConteudo } from "@/lib/conteudo";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

function grupoPorSlug(slug: string) {
  const grupo = carregarConteudo().grupos.find((g) => g.slug === slug);
  if (!grupo) throw new Error(`content/grupos.json: não existe o grupo "${slug}"`);
  return grupo;
}

export function parametros() {
  return carregarConteudo().grupos.map((g) => ({ slug: g.slug }));
}

export function metadados(idioma: Idioma, slug: string): Metadata {
  const g = grupoPorSlug(slug);
  return metadadosPagina({ titulo: g.titulo, descricao: g.resumo, caminho: rota("grupos", idioma, g.slug), imagem: g.imagem });
}

export default function PaginaGrupo({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const g = grupoPorSlug(slug);
  const { site } = carregarConteudo();
  const rotulo = new Map(site.temas_grupos.map((t) => [t.slug, t.rotulo]));
  return (
    <div className="pagina">
      <CabecalhoPagina
        caminho={rota("grupos", idioma)}
        sobretitulo={g.instituicao ?? rotulos(idioma).grupos.sobretitulo}
        titulo={g.titulo}
        descricao={g.resumo}
        etiquetas={g.temas.map((t) => rotulo.get(t) ?? t)}
      />
      <article className="leitura">
        {g.imagem && (
          <div className="leitura__capa">
            <Image src={g.imagem} alt="" fill priority sizes="(min-width: 768px) 46rem, 100vw" className="leitura__capa-img" />
          </div>
        )}
        {g.conteudo && <div className="texto" dangerouslySetInnerHTML={{ __html: markdownParaHtml(g.conteudo) }} />}
        {g.abas.length > 0 && <Abas prefixo={g.slug} abas={g.abas.map((a) => ({ titulo: a.titulo, html: markdownParaHtml(a.conteudo) }))} />}
      </article>
    </div>
  );
}
