import type { MetadataRoute } from "next";
import { carregarConteudo } from "@/lib/conteudo";

export const dynamic = "force-static";

/** Todas as páginas do site, geradas a partir do conteúdo. */
export default function sitemap(): MetadataRoute.Sitemap {
  const { site, pessoas, publicacoes, noticias, grupos, videos } = carregarConteudo();
  const url = (caminho: string, data?: string): MetadataRoute.Sitemap[number] => ({
    url: new URL(caminho, site.url_base).toString(),
    ...(data && { lastModified: data }),
  });
  return [
    ...["/", "/sobre-o-interas/", "/equipe/", "/areas-de-pesquisa/", "/grupos/", "/publicacoes/", "/noticias/", "/videos/", "/contato/"].map((c) => url(c)),
    ...pessoas.map((p) => url(`/equipe/${p.slug}/`)),
    ...grupos.map((g) => url(`/grupos/${g.slug}/`)),
    ...publicacoes.map((p) => url(`/publicacoes/${p.id}/`)),
    ...noticias.map((n) => url(`/noticias/${n.id}/`, n.data)),
    ...videos.map((v) => url(`/videos/${v.slug}/`, v.data)),
  ];
}
