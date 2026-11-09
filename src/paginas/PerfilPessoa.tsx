import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { FotoPessoa } from "@/components/CardPessoa";
import ListaPublicacoes from "@/components/ListaPublicacoes";
import { carregarConteudo } from "@/lib/conteudo";
import { gruposDaPessoa, pessoaPorSlug, publicacoesDaPessoa } from "@/lib/consultas";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function parametros() {
  // Inclui pessoas inativas: o perfil continua existindo para não quebrar links de publicações e grupos
  return carregarConteudo().pessoas.map((p) => ({ slug: p.slug }));
}

export function metadados(idioma: Idioma, slug: string): Metadata {
  const pessoa = pessoaPorSlug(slug);
  const descricao = [pessoa.cargo, pessoa.instituicao?.nome].filter(Boolean).join(" — ");
  return metadadosPagina({ titulo: pessoa.nome, descricao, caminho: rota("equipe", idioma, pessoa.slug), imagem: pessoa.foto, tipo: "profile" });
}

export default function PerfilPessoa({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const pessoa = pessoaPorSlug(slug);
  const publicacoes = publicacoesDaPessoa(pessoa.slug);
  const grupos = gruposDaPessoa(pessoa);

  const r = rotulos(idioma);
  const links = [
    { rotulo: r.perfil.lattes, icone: "link-45deg", url: pessoa.lattes },
    { rotulo: r.perfil.scholar, icone: "mortarboard", url: pessoa.scholar },
    { rotulo: r.perfil.orcid, icone: "person-badge", url: pessoa.orcid },
    { rotulo: r.perfil.instituicao, icone: "bank", url: pessoa.instituicao?.url ?? null },
  ].filter((l): l is { rotulo: string; icone: string; url: string } => Boolean(l.url));

  return (
    <div className="pagina">
      <CabecalhoPagina
        caminho={rota("equipe", idioma)}
        sobretitulo={pessoa.cargo}
        titulo={pessoa.nome}
        descricao={pessoa.instituicao?.nome}
        midia={<FotoPessoa pessoa={pessoa} tamanho="perfil" alt={r.perfil.fotoDe(pessoa.nome)} />}
      >
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
      </CabecalhoPagina>
      <article className="perfil">
        {pessoa.areas && (
          <section>
            <h2>{r.perfil.areas}</h2>
            <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(pessoa.areas) }} />
          </section>
        )}
        {pessoa.atuacao && (
          <section>
            <h2>{r.perfil.atuacao}</h2>
            <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(pessoa.atuacao) }} />
          </section>
        )}
        {grupos.length > 0 && (
          <section>
            <h2>{r.comum.grupos(grupos.length)}</h2>
            <ul>
              {grupos.map((g) => (
                <li key={g.slug}>
                  <Link href={rota("grupos", idioma, g.slug)}>{g.titulo}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {publicacoes.length > 0 && (
          <section>
            <h2>{r.perfil.publicacoes(publicacoes.length)}</h2>
            <ListaPublicacoes publicacoes={publicacoes} idioma={idioma} />
          </section>
        )}
      </article>
    </div>
  );
}
