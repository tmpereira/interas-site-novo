import type { Metadata } from "next";
import { conteudoNoIdioma } from "./conteudo";
import { type Idioma, idiomaDoCaminho } from "./i18n/rotas";
import { idiomasAlternativos } from "./i18n/versoes";

/** Código de idioma do Open Graph (`og:locale`). */
const LOCALE_OG: Record<Idioma, string> = { pt: "pt_BR", en: "en_US" };

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

/**
 * Metadados de uma página: título, descrição, canônica, versões nos outros idiomas (hreflang),
 * Open Graph e cartão do Twitter. O idioma vem do caminho (/en/... = inglês).
 */
export function metadadosPagina({ titulo, descricao, caminho, imagem, tipo = "website", extra }: Opcoes): Metadata {
  const idioma = idiomaDoCaminho(caminho);
  const { site } = conteudoNoIdioma(idioma);
  const idiomas = idiomasAlternativos(caminho);
  const desc = descricao || site.descricao || undefined;
  const img = imagem ?? site.imagem_compartilhamento ?? site.logo;
  return {
    title: titulo,
    description: desc,
    alternates: { canonical: caminho, ...(idiomas && { languages: idiomas }) },
    openGraph: {
      type: tipo,
      title: titulo,
      description: desc,
      url: caminho,
      siteName: site.titulo,
      locale: LOCALE_OG[idioma],
      ...(idiomas && { alternateLocale: LOCALE_OG[idioma === "pt" ? "en" : "pt"] }),
      images: [img],
    },
    twitter: { card: imagem ? "summary_large_image" : "summary", title: titulo, description: desc, images: [img] },
    ...extra,
  };
}
