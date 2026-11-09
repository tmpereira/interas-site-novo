import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { FotoPessoa } from "@/components/CardPessoa";
import ListaPublicacoes from "@/components/ListaPublicacoes";
import RedeCoautoria from "@/components/RedeCoautoria";
import TabelaOrientacoes, { type ItemOrientacao } from "@/components/TabelaOrientacoes";
import { carregarConteudo } from "@/lib/conteudo";
import { gruposDaPessoa, orientacoesDaPessoa, periodoAluno, pessoaPorSlug, publicacoesDaPessoa } from "@/lib/consultas";
import { formatarNumero } from "@/lib/formatadores";
import { markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { nomeCurto, redeDaPessoa } from "@/lib/rede";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function parametros() {
  // Inclui pessoas inativas: o perfil continua existindo para não quebrar links de publicações e grupos
  return carregarConteudo().pessoas.map((p) => ({ slug: p.slug }));
}

export function metadados(idioma: Idioma, slug: string): Metadata {
  const pessoa = pessoaPorSlug(slug, idioma);
  const descricao = [pessoa.cargo, pessoa.instituicao?.nome].filter(Boolean).join(" — ");
  return metadadosPagina({ titulo: pessoa.nome, descricao, caminho: rota("equipe", idioma, pessoa.slug), imagem: pessoa.foto, tipo: "profile" });
}

export default function PerfilPessoa({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const pessoa = pessoaPorSlug(slug, idioma);
  const publicacoes = publicacoesDaPessoa(pessoa.slug);
  const grupos = gruposDaPessoa(pessoa, idioma);
  const orientacoes = orientacoesDaPessoa(pessoa.slug, idioma);
  const rede = redeDaPessoa(pessoa.slug);

  const r = rotulos(idioma);
  const links = [
    { rotulo: r.perfil.lattes, icone: "link-45deg", url: pessoa.lattes },
    { rotulo: r.perfil.scholar, icone: "mortarboard", url: pessoa.scholar },
    { rotulo: r.perfil.orcid, icone: "person-badge", url: pessoa.orcid },
    { rotulo: r.perfil.instituicao, icone: "bank", url: pessoa.instituicao?.url ?? null },
  ].filter((l): l is { rotulo: string; icone: string; url: string } => Boolean(l.url));

  // Índice h e citações da carreira (OpenAlex). Zero costuma ser perfil incompleto: não mostra.
  const indiceH = pessoa.indice_h ?? 0;
  const citacoes = pessoa.citacoes ?? 0;
  const metricas =
    indiceH > 0 || citacoes > 0
      ? [
          { chave: "h", valor: formatarNumero(indiceH, idioma), rotulo: r.perfil.indiceH, icone: "graph-up", antes: true },
          ...(pessoa.indice_i10 != null
            ? [{ chave: "i10", valor: formatarNumero(pessoa.indice_i10, idioma), rotulo: r.perfil.indiceI10, icone: "bar-chart", antes: true }]
            : []),
          { chave: "cit", valor: formatarNumero(citacoes, idioma), rotulo: r.perfil.citacoes(citacoes), icone: "quote", antes: false },
        ]
      : [];

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
        {metricas.length > 0 && (
          <ul className="perfil__links perfil__links--metricas" aria-label={r.perfil.metricas}>
            {metricas.map((m) => (
              <li key={m.chave}>
                <span className="perfil__metrica" title={r.perfil.fonteMetricas}>
                  <i className={`bi bi-${m.icone}`} aria-hidden="true" />
                  {m.antes ? (
                    <>
                      {m.rotulo} <strong>{m.valor}</strong>
                    </>
                  ) : (
                    <>
                      <strong>{m.valor}</strong> {m.rotulo}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CabecalhoPagina>
      <article className="perfil">
        {pessoa.areas && (
          <section>
            <h2>{r.perfil.areas}</h2>
            <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(pessoa.areas, idioma) }} />
          </section>
        )}
        {pessoa.atuacao && (
          <section>
            <h2>{r.perfil.atuacao}</h2>
            <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(pessoa.atuacao, idioma) }} />
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
            <ListaPublicacoes publicacoes={publicacoes} idioma={idioma} paginada />
          </section>
        )}
        {orientacoes.total > 0 && (
          <section className="perfil__orientacoes">
            <h2>{r.perfil.orientacoes(orientacoes.total)}</h2>
            {(
              [
                ["em-andamento", orientacoes.emAndamento, r.perfil.orientacoesEmAndamento],
                ["concluida", orientacoes.concluidas, r.perfil.orientacoesConcluidas],
              ] as const
            ).map(([situacao, niveis, titulo]) => {
              // Uma tabela por situação, com os níveis na ordem da página Alunos
              const itens: ItemOrientacao[] = niveis.flatMap((n) =>
                n.alunos.map((a) => ({ nome: a.nome, nivel: n.titulo, situacao: a.situacao, periodo: periodoAluno(a, idioma), titulo: a.titulo ?? null })),
              );
              if (itens.length === 0) return null;
              return (
                <div key={situacao} className={`orientacoes orientacoes--${situacao}`}>
                  <h3 className="orientacoes__titulo">{titulo(itens.length)}</h3>
                  <TabelaOrientacoes idioma={idioma} itens={itens} rotuloPaginas={r.perfil.orientacoesPaginas(titulo(itens.length))} />
                </div>
              );
            })}
          </section>
        )}
        {rede && (
          <section className="perfil__rede">
            <h2>{r.perfil.coautoria}</h2>
            <RedeCoautoria
              idioma={idioma}
              rede={rede}
              periodo={rede.periodos[0]}
              rotuloPeriodo={null}
              titulo={r.perfil.redeTitulo(pessoa.nome)}
              explicacao={r.perfil.redeExplicacao(nomeCurto(pessoa.nome))}
              centro={pessoa.slug}
            />
          </section>
        )}
      </article>
    </div>
  );
}
