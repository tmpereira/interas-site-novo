import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { vincularAutores } from "@/lib/autores";
import { carregarConteudo } from "@/lib/conteudo";
import { ROTULOS_TIPO_PUBLICACAO, formatarDataLonga, formatarJcr } from "@/lib/formatadores";
import { markdownEmLinha, markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";

function publicacaoPorId(id: string) {
  const publicacao = carregarConteudo().publicacoes.find((p) => p.id === id);
  if (!publicacao) throw new Error(`content/publicacoes.json: não existe a publicação "${id}"`);
  return publicacao;
}

export function parametros() {
  return carregarConteudo().publicacoes.map((p) => ({ id: p.id }));
}

/** Texto simples de um trecho em Markdown em linha (para <title> e meta tags). */
const semMarcacao = (texto: string) => texto.replace(/[*_`]/g, "");

export function metadados(idioma: Idioma, id: string): Metadata {
  const p = publicacaoPorId(id);
  const descricao = p.resumo ? semMarcacao(p.resumo).slice(0, 200) : [p.autores.slice(0, 3).join(", "), p.periodico].filter(Boolean).join(" — ");
  return metadadosPagina({
    titulo: semMarcacao(p.titulo),
    descricao,
    caminho: rota("publicacoes", idioma, p.id),
    tipo: "article",
    // Metadados lidos pelo Google Acadêmico
    extra: { other: {
      citation_title: semMarcacao(p.titulo),
      citation_author: p.autores,
      citation_publication_date: p.data.replaceAll("-", "/"),
      ...(p.periodico && { citation_journal_title: p.periodico }),
      ...(p.volume && { citation_volume: p.volume }),
      ...(p.numero && { citation_issue: p.numero }),
      ...(p.doi && { citation_doi: p.doi }),
    } },
  });
}

export default function PaginaPublicacao({ idioma, id }: { idioma: Idioma; id: string }) {
  const p = publicacaoPorId(id);
  const { pessoas, grupos } = carregarConteudo();
  const autores = vincularAutores(
    p.autores,
    pessoas.filter((x) => p.pessoas.includes(x.slug)),
  );
  const gruposDaPublicacao = grupos.filter((g) => p.grupos.includes(g.slug));
  const veiculo = [
    p.periodico,
    p.volume && `v. ${p.volume}`,
    p.numero && `n. ${p.numero}`,
    p.paginas && `p. ${p.paginas}`,
  ].filter(Boolean);
  const metricas = [
    p.qualis && { rotulo: "Qualis", valor: p.qualis },
    p.fator_impacto !== null && { rotulo: "Fator de impacto (JCR)", valor: formatarJcr(p.fator_impacto) },
    p.citacoes !== null && { rotulo: "Citações", valor: p.citacoes.toLocaleString("pt-BR") },
  ].filter((m): m is { rotulo: string; valor: string } => Boolean(m));

  return (
    <div className="pagina">
      <CabecalhoPagina
        caminho={rota("publicacoes", idioma)}
        sobretitulo={[ROTULOS_TIPO_PUBLICACAO[p.tipo], p.ano].join(" · ")}
        titulo={semMarcacao(p.titulo)}
        tituloHtml={markdownEmLinha(p.titulo)}
        descricao={p.periodico}
      />
      <article className="artigo">

        <div className="artigo__grade">
          <section>
            <h2 className="artigo__rotulo">Autores</h2>
            <ul className="artigo__autores">
              {autores.map((a, i) => (
                <li key={`${a.nome}-${i}`}>{a.slug ? <Link href={rota("equipe", idioma, a.slug)}>{a.nome}</Link> : a.nome}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="artigo__rotulo">Data de publicação</h2>
            <p>{formatarDataLonga(p.data)}</p>
            {veiculo.length > 0 && (
              <>
                <h2 className="artigo__rotulo">Publicado em</h2>
                <p>{veiculo.join(", ")}</p>
              </>
            )}
            {metricas.length > 0 && (
              <>
                <h2 className="artigo__rotulo">Indicadores</h2>
                <ul className="artigo__metricas">
                  {metricas.map((m) => (
                    <li key={m.rotulo}>
                      {m.rotulo}: <strong>{m.valor}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {gruposDaPublicacao.length > 0 && (
              <>
                <h2 className="artigo__rotulo">{gruposDaPublicacao.length === 1 ? "Grupo" : "Grupos"}</h2>
                <ul className="artigo__metricas">
                  {gruposDaPublicacao.map((g) => (
                    <li key={g.slug}>
                      <Link href={rota("grupos", idioma, g.slug)}>{g.titulo}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        <section>
          <h2 className="artigo__rotulo">Resumo</h2>
          {p.resumo ? <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(p.resumo) }} /> : <p>Resumo não disponível.</p>}
        </section>

        {p.palavras_chave.length > 0 && (
          <section>
            <h2 className="artigo__rotulo">Palavras-chave</h2>
            <p>{p.palavras_chave.join(", ")}</p>
          </section>
        )}

        {(p.doi || p.url) && (
          <p className="artigo__acoes">
            {p.doi && (
              <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="artigo__botao">
                <i className="bi bi-box-arrow-up-right" aria-hidden="true" /> DOI: <span className="artigo__doi">{p.doi}</span>
              </a>
            )}
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="artigo__botao artigo__botao--secundario">
                <i className="bi bi-link-45deg" aria-hidden="true" /> Página da publicação
              </a>
            )}
          </p>
        )}
      </article>
    </div>
  );
}
