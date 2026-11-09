import type { Metadata } from "next";
import CabecalhoPagina from "@/components/CabecalhoPagina";
import FiltroPorCategoria from "@/components/FiltroPorCategoria";
import ItemNoticia from "@/components/ItemNoticia";
import { carregarConteudo } from "@/lib/conteudo";
import { paginaPorSlug } from "@/lib/consultas";
import { compararTexto } from "@/lib/formatadores";
import { metadadosPagina } from "@/lib/metadados";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";

export function metadados(idioma: Idioma): Metadata {
  return metadadosPagina({ titulo: paginaPorSlug("noticias").titulo, descricao: rotulos(idioma).noticias.descricaoPagina, caminho: rota("noticias", idioma) });
}

export default function Noticias({ idioma }: { idioma: Idioma }) {
  const { noticias } = carregarConteudo();
  const pagina = paginaPorSlug("noticias");
  const categorias = [...new Set(noticias.flatMap((n) => n.categorias ?? []))]
    .sort(compararTexto(idioma))
    .map((c) => ({ chave: c, rotulo: c }));
  return (
    <div className="pagina">
      <CabecalhoPagina caminho={rota("noticias", idioma)} titulo={pagina.titulo} descricao={pagina.descricao} />
      <FiltroPorCategoria
        idioma={idioma}
        categorias={categorias}
        classeLista="lista-noticias"
        itens={noticias.map((n) => ({ id: n.id, categorias: n.categorias ?? [], elemento: <ItemNoticia noticia={n} idioma={idioma} /> }))}
      />
    </div>
  );
}
