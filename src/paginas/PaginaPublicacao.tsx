import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import { vincularAutores } from "@/lib/autores";
import { carregarConteudo, conteudoNoIdioma } from "@/lib/conteudo";
import { formatarDataLonga, formatarJcr, formatarNumero } from "@/lib/formatadores";
import { markdownEmLinha, markdownParaHtml } from "@/lib/markdown";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

function publicacaoPorId(id: string, idioma: Idioma) {
  const publicacao = conteudoNoIdioma(idioma).publicacoes.find((p) => p.id === id);
  if (!publicacao) throw new Error(`content/publicacoes.json: não existe a publicação "${id}"`);
  return publicacao;
}

export function parametros() {
  return carregarConteudo().publicacoes.map((p) => ({ id: p.id }));
}

/** Texto simples de um trecho em Markdown em linha (para <title> e meta tags). */
const semMarcacao = (texto: string) => texto.replace(/[*_`]/g, "");

export function metadados(idioma: Idioma, id: string): Metadata {
  const p = publicacaoPorId(id, idioma);
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
  const p = publicacaoPorId(id, idioma);
  const { pessoas, grupos } = conteudoNoIdioma(idioma);
  const autores = vincularAutores(
    p.autores,
    pessoas.filter((x) => p.pessoas.includes(x.slug)),
  );
  const gruposDaPublicacao = grupos.filter((g) => p.grupos.includes(g.slug));
  const r = rotulos(idioma);
  const rp = r.publicacao;
  const veiculo = [
    p.periodico,
    p.volume && rp.volume(p.volume),
    p.numero && rp.numero(p.numero),
    p.paginas && rp.paginas(p.paginas),
  ].filter(Boolean);
  const metricas = [
    p.qualis && { rotulo: rp.qualis, valor: p.qualis },
    p.fator_impacto !== null && { rotulo: rp.fatorImpacto, valor: formatarJcr(p.fator_impacto, idioma) },
    p.citacoes !== null && { rotulo: rp.citacoes, valor: formatarNumero(p.citacoes, idioma) },
  ].filter((m): m is { rotulo: string; valor: string } => Boolean(m));

  return (
    <div className="pagina">
      <CabecalhoPagina
        caminho={rota("publicacoes", idioma)}
        sobretitulo={[r.publicacoes.tipos[p.tipo], p.ano].join(" · ")}
        titulo={semMarcacao(p.titulo)}
        tituloHtml={markdownEmLinha(p.titulo, idioma)}
        descricao={p.periodico}
      />
      <article className="artigo">

        <div className="artigo__grade">
          <section>
            <h2 className="artigo__rotulo">{rp.autores}</h2>
            <ul className="artigo__autores">
              {autores.map((a, i) => (
                <li key={`${a.nome}-${i}`}>{a.slug ? <Link href={rota("equipe", idioma, a.slug)}>{a.nome}</Link> : a.nome}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="artigo__rotulo">{r.comum.dataPublicacao}</h2>
            <p>{formatarDataLonga(p.data, idioma)}</p>
            {veiculo.length > 0 && (
              <>
                <h2 className="artigo__rotulo">{rp.publicadoEm}</h2>
                <p>{veiculo.join(", ")}</p>
              </>
            )}
            {metricas.length > 0 && (
              <>
                <h2 className="artigo__rotulo">{rp.indicadores}</h2>
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
                <h2 className="artigo__rotulo">{r.comum.grupos(gruposDaPublicacao.length)}</h2>
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
          <h2 className="artigo__rotulo">{r.comum.resumo}</h2>
          {p.resumo ? <div dangerouslySetInnerHTML={{ __html: markdownParaHtml(p.resumo, idioma) }} /> : <p>{rp.resumoIndisponivel}</p>}
        </section>

        {p.palavras_chave.length > 0 && (
          <section>
            <h2 className="artigo__rotulo">{rp.palavrasChave}</h2>
            <p>{p.palavras_chave.join(", ")}</p>
          </section>
        )}

        {(p.doi || p.url) && (
          <p className="artigo__acoes">
            {p.doi && (
              <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="artigo__botao">
                <i className="bi bi-box-arrow-up-right" aria-hidden="true" /> {rp.doi} <span className="artigo__doi">{p.doi}</span>
              </a>
            )}
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="artigo__botao artigo__botao--secundario">
                <i className="bi bi-link-45deg" aria-hidden="true" /> {rp.paginaPublicacao}
              </a>
            )}
          </p>
        )}
      </article>
    </div>
  );
}
