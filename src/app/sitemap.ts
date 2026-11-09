import type { MetadataRoute } from "next";
import { conteudoNoIdioma } from "@/lib/conteudo";
import { CHAVES_ROTAS, IDIOMAS, rota } from "@/lib/i18n/rotas";
import { idiomasAlternativos } from "@/lib/i18n/versoes";

export const dynamic = "force-static";

/**
 * Todas as páginas do site nos dois idiomas, geradas a partir do conteúdo. Cada URL traz as
 * versões nos outros idiomas (hreflang); notícias sem tradução só aparecem em português.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return IDIOMAS.flatMap((idioma) => {
    const { site, pessoas, publicacoes, noticias, grupos, videos } = conteudoNoIdioma(idioma);
    const absoluta = (caminho: string) => new URL(caminho, site.url_base).toString();
    const url = (caminho: string, data?: string): MetadataRoute.Sitemap[number] => {
      const idiomas = idiomasAlternativos(caminho);
      return {
        url: absoluta(caminho),
        ...(data && { lastModified: data }),
        ...(idiomas && { alternates: { languages: Object.fromEntries(Object.entries(idiomas).map(([k, v]) => [k, absoluta(v)])) } }),
      };
    };
    return [
      ...CHAVES_ROTAS.map((c) => url(rota(c, idioma))),
      ...pessoas.map((p) => url(rota("equipe", idioma, p.slug))),
      ...grupos.map((g) => url(rota("grupos", idioma, g.slug))),
      ...publicacoes.map((p) => url(rota("publicacoes", idioma, p.id))),
      ...noticias.map((n) => url(rota("noticias", idioma, n.id), n.data)),
      ...videos.map((v) => url(rota("videos", idioma, v.slug), v.data)),
    ];
  });
}
