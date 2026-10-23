import type { Metadata } from "next";
import { carregarConteudo } from "./conteudo";

type Opcoes = {
  titulo: string;
  descricao?: string | null;
  /** Rota da página, com barras (ex.: "/equipe/"). Vira a URL canônica e o `og:url`. */
  caminho: string;
  /** Imagem de compartilhamento; se omitida, usa a do site. */
  imagem?: string | null;
  tipo?: "website" | "article" | "profile";
  /** Campos extras do Metadata (ex.: `other`, `authors`). */
  extra?: Metadata;
};

/** Metadados de uma página: título, descrição, canônica, Open Graph e cartão do Twitter. */
export function metadadosPagina({ titulo, descricao, caminho, imagem, tipo = "website", extra }: Opcoes): Metadata {
  const { site } = carregarConteudo();
  const desc = descricao || site.descricao || undefined;
  const img = imagem ?? site.imagem_compartilhamento ?? site.logo;
  return {
    title: titulo,
    description: desc,
    alternates: { canonical: caminho },
    openGraph: {
      type: tipo,
      title: titulo,
      description: desc,
      url: caminho,
      siteName: site.titulo,
      locale: "pt_BR",
      images: [img],
    },
    twitter: { card: imagem ? "summary_large_image" : "summary", title: titulo, description: desc, images: [img] },
    ...extra,
  };
}
