import type { MetadataRoute } from "next";
import { carregarConteudo } from "@/lib/conteudo";
import { CHAVES_ROTAS, rota } from "@/lib/i18n/rotas";

export const dynamic = "force-static";

/** Todas as páginas do site, geradas a partir do conteúdo. (Etapa 1 da versão em inglês: ainda só o português.) */
export default function sitemap(): MetadataRoute.Sitemap {
  const { site, pessoas, publicacoes, noticias, grupos, videos } = carregarConteudo();
  const url = (caminho: string, data?: string): MetadataRoute.Sitemap[number] => ({
    url: new URL(caminho, site.url_base).toString(),
    ...(data && { lastModified: data }),
  });
  return [
    ...CHAVES_ROTAS.map((c) => url(rota(c, "pt"))),
    ...pessoas.map((p) => url(rota("equipe", "pt", p.slug))),
    ...grupos.map((g) => url(rota("grupos", "pt", g.slug))),
    ...publicacoes.map((p) => url(rota("publicacoes", "pt", p.id))),
    ...noticias.map((n) => url(rota("noticias", "pt", n.id), n.data)),
    ...videos.map((v) => url(rota("videos", "pt", v.slug), v.data)),
  ];
}
