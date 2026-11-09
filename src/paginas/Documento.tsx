import type { Metadata } from "next";
import Script from "next/script";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/styles/main.scss";
import { classesFontes } from "@/styles/fontes";
import BarraAnuncio from "@/components/BarraAnuncio";
import Navbar from "@/components/Navbar";
import Rodape from "@/components/Rodape";
import { carregarConteudo } from "@/lib/conteudo";
import { type Idioma, rota } from "@/lib/i18n/rotas";
import { rotulos } from "@/lib/i18n/rotulos";
import { markdownEmLinha } from "@/lib/markdown";
import { menuNoIdioma } from "@/lib/menu";

/** Atributo `lang` do <html> de cada idioma. */
const LANG: Record<Idioma, string> = { pt: "pt-BR", en: "en" };

/** Metadados comuns a todas as páginas (usados pelos dois layouts raiz). */
export function metadadosRaiz(): Metadata {
  const { site } = carregarConteudo();
  return {
    metadataBase: new URL(site.url_base),
    title: { default: site.titulo, template: `%s | ${site.titulo}` },
    description: site.descricao ?? undefined,
    icons: { icon: site.favicon },
  };
}

/**
 * Documento HTML completo (anúncio, menu, conteúdo e rodapé), compartilhado pelos layouts
 * raiz `app/(pt)/layout.tsx` e `app/en/layout.tsx` e pela página 404.
 */
export default function Documento({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  const { site } = carregarConteudo();
  const anuncio = site.anuncio?.ativo ? site.anuncio : null;
  const r = rotulos(idioma);
  return (
    <html lang={LANG[idioma]} className={classesFontes}>
      <body>
        {site.google_analytics && process.env.NODE_ENV === "production" && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${site.google_analytics}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${site.google_analytics}');`}
            </Script>
          </>
        )}
        <a href="#conteudo" className="pular-para-conteudo">
          {r.pularParaConteudo}
        </a>
        <header className="cabecalho">
          {anuncio && <BarraAnuncio id={anuncio.id} icone={anuncio.icone} html={markdownEmLinha(anuncio.texto)} />}
          <Navbar logo={site.logo} logoAlt={site.logo_alt} menu={menuNoIdioma(site.menu, idioma)} inicio={rota("inicio", idioma)} />
        </header>
        <main id="conteudo" className="conteudo-principal">
          {children}
        </main>
        <Rodape rodape={site.rodape} descricao={site.descricao} />
      </body>
    </html>
  );
}
