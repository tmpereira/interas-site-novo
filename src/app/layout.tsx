import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/styles/main.scss";
import BarraAnuncio from "@/components/BarraAnuncio";
import Navbar from "@/components/Navbar";
import Rodape from "@/components/Rodape";
import { carregarConteudo } from "@/lib/conteudo";
import { markdownEmLinha } from "@/lib/markdown";

export function generateMetadata(): Metadata {
  const { site } = carregarConteudo();
  return {
    metadataBase: new URL(site.url_base),
    title: { default: site.titulo, template: `%s | ${site.titulo}` },
    description: site.descricao ?? undefined,
    icons: { icon: site.favicon },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { site } = carregarConteudo();
  const anuncio = site.anuncio?.ativo ? site.anuncio : null;
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="pular-para-conteudo">
          Pular para o conteúdo
        </a>
        <header className="cabecalho">
          {anuncio && <BarraAnuncio id={anuncio.id} icone={anuncio.icone} html={markdownEmLinha(anuncio.texto)} />}
          <Navbar titulo={site.titulo} logo={site.logo} logoAlt={site.logo_alt} menu={site.menu} />
        </header>
        <main id="conteudo" className="pagina">
          {children}
        </main>
        <Rodape rodape={site.rodape} />
      </body>
    </html>
  );
}
