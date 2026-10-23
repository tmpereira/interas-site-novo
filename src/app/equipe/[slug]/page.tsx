import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import ListaPublicacoes from "@/components/ListaPublicacoes";
import { carregarConteudo } from "@/lib/conteudo";
import { gruposDaPessoa, pessoaPorSlug, publicacoesDaPessoa } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  // Inclui pessoas inativas: o perfil continua existindo para não quebrar links de publicações e grupos
  return carregarConteudo().pessoas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pessoa = pessoaPorSlug((await params).slug);
  const descricao = [pessoa.cargo, pessoa.instituicao?.nome].filter(Boolean).join(" — ");
  return metadadosPagina({ titulo: pessoa.nome, descricao, caminho: `/equipe/${pessoa.slug}/`, imagem: pessoa.foto, tipo: "profile" });
}

export default async function PerfilPessoa({ params }: Props) {
  const pessoa = pessoaPorSlug((await params).slug);
  const publicacoes = publicacoesDaPessoa(pessoa.slug);
  const grupos = gruposDaPessoa(pessoa);

  const links = [
    { rotulo: "Lattes", icone: "link-45deg", url: pessoa.lattes },
    { rotulo: "Scholar", icone: "mortarboard", url: pessoa.scholar },
    { rotulo: "ORCID", icone: "person-badge", url: pessoa.orcid },
    { rotulo: "Instituição", icone: "bank", url: pessoa.instituicao?.url ?? null },
  ].filter((l): l is { rotulo: string; icone: string; url: string } => Boolean(l.url));

  return (
    <div className="pagina">
      <Breadcrumb
        itens={[
          { rotulo: "Coord. e Equipe", href: "/equipe/" },
          ...(pessoa.cargo ? [{ rotulo: pessoa.cargo }] : []),
          { rotulo: pessoa.nome },
        ]}
      />
      <article className="perfil">
        <header className="perfil__cabecalho">
          {pessoa.foto && (
            <div className="perfil__foto">
              <Image src={pessoa.foto} alt={`Foto de ${pessoa.nome}`} fill sizes="255px" className="perfil__img" priority />
            </div>
          )}
          <h1 className="perfil__nome">{pessoa.nome}</h1>
          {pessoa.cargo && <p className="perfil__cargo">{pessoa.cargo}</p>}
          {links.length > 0 && (
            <ul className="perfil__links">
              {links.map((l) => (
                <li key={l.rotulo}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="perfil__botao">
                    <i className={`bi bi-${l.icone}`} aria-hidden="true" /> {l.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </header>

        {pessoa.instituicao && (
          <section>
            <h2>Instituição</h2>
            <p>
              {pessoa.instituicao.url ? (
                <a href={pessoa.instituicao.url} target="_blank" rel="noopener noreferrer">
                  {pessoa.instituicao.nome}
                </a>
              ) : (
                pessoa.instituicao.nome
              )}
            </p>
          </section>
        )}
        {pessoa.areas && (
          <section>
            <h2>Áreas de Atuação</h2>
            <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(pessoa.areas) }} />
          </section>
        )}
        {pessoa.atuacao && (
          <section>
            <h2>Atuação no Projeto</h2>
            <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(pessoa.atuacao) }} />
          </section>
        )}
        {grupos.length > 0 && (
          <section>
            <h2>{grupos.length === 1 ? "Grupo" : "Grupos"}</h2>
            <ul>
              {grupos.map((g) => (
                <li key={g.slug}>
                  <Link href={`/grupos/${g.slug}/`}>{g.titulo}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {publicacoes.length > 0 && (
          <section>
            <h2>Publicações ({publicacoes.length})</h2>
            <ListaPublicacoes publicacoes={publicacoes} />
          </section>
        )}
      </article>
    </div>
  );
}
